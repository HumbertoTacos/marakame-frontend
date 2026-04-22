import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, Bed, Clock as ClockIcon, Calendar, Phone, 
  FileText, MapPin, PhoneCall, ChevronLeft, ChevronRight, CalendarPlus,
  FilePlus2, Stethoscope, Archive, MapPinned, X, Clock3
} from 'lucide-react';
import { useIngresoStore } from '../../stores/ingresoStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api';
import SolicitudDrawer from '../../components/admisiones/SolicitudDrawer';
import type { SolicitudIngreso } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays 
} from 'date-fns';
import { es } from 'date-fns/locale';

interface ProspectoResumen {
  id: number;
  nombrePaciente: string;
  fechaAcuerdo: string;
  celularLlamada?: string;
  nombreLlamada?: string; 
  acuerdoSeguimiento?: string;
}

const safeParseDate = (dateVal: unknown) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string') return new Date(dateVal);
  return null;
};

// Función para obtener colores e íconos según el acuerdo (Basado en tus colores originales)
const getEventoConfig = (tipo: string | undefined) => {
  switch (tipo) {
    case 'POSIBLE_INGRESO':
      return { bg: '#ede9fe', text: '#8b5cf6', border: '#ddd6fe', icon: FileText, label: 'Ingreso' };
    case 'ESPERAR_VISITA':
      return { bg: '#d1fae5', text: '#10b981', border: '#a7f3d0', icon: MapPin, label: 'Visita' };
    case 'LLAMARLE':
    case 'ESPERAR_LLAMADA':
      return { bg: '#fef3c7', text: '#f59e0b', border: '#fde68a', icon: PhoneCall, label: 'Llamada' };
    case 'CITA_PROGRAMADA':
      return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', icon: Calendar, label: 'Cita' };
    default:
      return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: ClockIcon, label: 'Pendiente' };
  }
};

const AdmisionesDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { solicitudes, camas, fetchSolicitudes, fetchCamas, isLoading: isLoadingStore } = useIngresoStore();
  
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudIngreso | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Estado para el mes actual del calendario
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedEvento, setSelectedEvento] = useState<ProspectoResumen | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [fechaAgenda, setFechaAgenda] = useState('');
  const [horaAgenda, setHoraAgenda] = useState('');

  // 1. Consulta de pacientes (Contadores superiores)
  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes_lista'],
    queryFn: () => apiClient.get('/pacientes').then(res => res.data.data)
  });

  // 2. Consulta de prospectos (Agenda)
  const { data: prospectos = [], isLoading: isLoadingProspectos } = useQuery({
    queryKey: ['prospectos_crm'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(res => res.data.data)
  });

  // 3. Agrupación de prospectos por día para el calendario
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, ProspectoResumen[]> = {};
    if (!prospectos) return mapa;

    prospectos.forEach((p: any) => {
      if (!p.fechaAcuerdo || p.acuerdoSeguimiento === 'RECHAZADO') return;
      
      const dateObj = safeParseDate(p.fechaAcuerdo);
      if (!dateObj) return;

      const dateKey = format(dateObj, 'yyyy-MM-dd');
      
      if (!mapa[dateKey]) mapa[dateKey] = [];
      mapa[dateKey].push(p);
    });
    return mapa;
  }, [prospectos]);

  useEffect(() => {
    fetchSolicitudes();
    fetchCamas();
  }, [fetchSolicitudes, fetchCamas]);

  const handleApprove = (id: number) => {
    setIsDrawerOpen(false);
    navigate(`/admisiones/asignar-cama/${id}`);
  };

  // --- CÁLCULOS PARA LAS MÉTRICAS ---
  const pacientesInternados = pacientes.filter((p: any) => p.estado === 'INTERNADO');
  const hombresInternados = pacientesInternados.filter((p: any) => p.sexo === 'M').length;
  const mujeresInternadas = pacientesInternados.filter((p: any) => p.sexo === 'F').length;
  const totalInternados = pacientesInternados.length;

  const camasOcupadas = camas.filter(c => c.estado === 'OCUPADA').length;
  const camasDisponibles = camas.filter(c => c.estado === 'DISPONIBLE').length;
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length;

  const stats = [
    { label: 'Camas Disponibles', value: camasDisponibles, icon: Bed, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Camas Ocupadas', value: camasOcupadas, icon: Bed, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Hombres', value: hombresInternados, icon: Users, color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Mujeres', value: mujeresInternadas, icon: Users, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Total Internados', value: totalInternados, icon: Users, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Solicitudes Pendientes', value: solicitudesPendientes, icon: ClockIcon, color: '#f59e0b', bg: '#fffbeb' },
  ];

  // --- FUNCIONES DEL CALENDARIO ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const actualizarSeguimiento = async (
    id: number,
    acuerdoSeguimiento: string,
    fechaAcuerdo?: string
  ) => {
    try {
      const payload: any = { acuerdoSeguimiento };

      if (fechaAcuerdo) {
        payload.fechaAcuerdo = fechaAcuerdo;
      }

      await apiClient.put(
        `/admisiones/primer-contacto/${id}`,
        payload
      );

      await queryClient.invalidateQueries({
        queryKey: ['prospectos_crm']
      });

      setDrawerOpen(false);
      setShowAgendaModal(false);

    } catch (error: any) {
      console.error(error?.response?.data || error);
      alert('No se pudo actualizar');
    }
  };

  const irNuevaSolicitud = () => {
    navigate('/admisiones/nueva-solicitud');
  };

  const enviarValoracion = async () => {
    try {
      await apiClient.patch(
        `/admisiones/paciente/${selectedEvento?.id}/solicitar-valoracion`
      );

      alert('Enviado a valoración médica');
      await queryClient.invalidateQueries({
        queryKey: ['prospectos_crm']
      });

      setDrawerOpen(false);
    } catch (error) {
      alert('No se pudo enviar');
    }
  };

  const archivarProspecto = async () => {
    try {
      await apiClient.patch(
        `/admisiones/primer-contacto/${selectedEvento?.id}/desactivar`
      );

      alert('Prospecto archivado');
      await queryClient.invalidateQueries({
        queryKey: ['prospectos_crm']
      });

      setDrawerOpen(false);
    } catch (error) {
      alert('No se pudo archivar');
    }
  };

  const abrirModalCita = () => {
    setShowAgendaModal(true);
  };

  const confirmarAgendarCita = async () => {
    if (!selectedEvento) return;

    if (!fechaAgenda) {
      alert('Selecciona fecha');
      return;
    }

    const fechaFinal = `${fechaAgenda}T${horaAgenda || '12:00'}`;

    await actualizarSeguimiento(
      selectedEvento.id,
      'CITA_PROGRAMADA',
      fechaFinal
    );
  };

    const btnStyle = {
      padding: '14px 16px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      background: '#ffffff',
      cursor: 'pointer',
      fontWeight: 800,
      textAlign: 'left' as const,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#0f172a'
    };

    const btnDanger = {
      ...btnStyle,
      color: '#ef4444'
    };

  const renderDaysOfWeek = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        {days.map((day, idx) => (
          <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '1rem', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isSameDay(day, new Date());
        const eventosDelDia = eventosPorDia[formattedDate] || [];

        days.push(
          <div 
            key={formattedDate}
            style={{ 
              backgroundColor: isCurrentMonth ? 'white' : '#f8fafc',
              minHeight: '140px',
              padding: '0.75rem',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              opacity: isCurrentMonth ? 1 : 0.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '50%', fontSize: '13px', 
                fontWeight: isTodayDate ? '900' : '700',
                backgroundColor: isTodayDate ? '#3b82f6' : 'transparent',
                color: isTodayDate ? 'white' : '#64748b'
              }}>
                {format(day, 'd')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
              {eventosDelDia.map((evento) => {
                const config = getEventoConfig(evento.acuerdoSeguimiento);
                const dateObj = safeParseDate(evento.fechaAcuerdo);
                const horaStr = dateObj ? format(dateObj, 'HH:mm') : '';
                const Icon = config.icon;
                
                return (
                  <div 
                    key={evento.id}
                    onClick={() => {
                      setSelectedEvento(evento);
                      setDrawerOpen(true);
                    }} 
                    title={`${evento.nombrePaciente} - Contacto: ${evento.nombreLlamada || 'N/A'}\nTel: ${evento.celularLlamada || 'N/A'}`}
                    style={{ 
                      backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}`,
                      padding: '4px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                      display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                    }}
                  >
                    <Icon size={12} style={{ flexShrink: 0 }} />
                    <span style={{ opacity: 0.7, flexShrink: 0 }}>{horaStr}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evento.nombrePaciente || 'Anónimo'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Dashboard de Admisiones</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Gestión centralizada de solicitudes, ingresos y agenda residencial.</p>
        </div>
      </div>

      {/* MÉTRICAS (Mantenido intacto) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ backgroundColor: stat.bg, padding: '1rem', borderRadius: '16px', color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN DEL CALENDARIO */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Agenda de Seguimiento</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Posibles Ingresos', id: 'POSIBLE_INGRESO' },
                { label: 'Citas', id: 'CITA_PROGRAMADA' },
                { label: 'Visitas', id: 'ESPERAR_VISITA' },
                { label: 'Llamadas', id: 'LLAMARLE' }
              ].map((item, idx) => {
                const conf = getEventoConfig(item.id);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: conf.bg, border: `1px solid ${conf.border}` }}></div>
                    {item.label}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <button onClick={today} style={{ padding: '0.5rem 1rem', borderRadius: '10px', backgroundColor: '#f1f5f9', border: 'none', fontWeight: '800', color: '#475569', cursor: 'pointer' }}>
              Hoy
            </button>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 0.5rem' }}></div>
            <button onClick={prevMonth} style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ minWidth: '130px', textAlign: 'center', fontSize: '15px', fontWeight: '900', color: '#0f172a', textTransform: 'capitalize' }}>
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={nextMonth} style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          {isLoadingProspectos ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>Cargando agenda...</div>
          ) : (
            <>
              {renderDaysOfWeek()}
              <div style={{ backgroundColor: '#e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                {renderCells()}
              </div>
            </>
          )}
        </div>
      </div>

      {isLoadingStore && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#3b82f6', color: 'white', padding: '1rem 2rem', borderRadius: '14px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Sincronizando con API...
        </div>
      )}

      <SolicitudDrawer 
        solicitud={selectedSolicitud}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApprove}
      />

      {drawerOpen && selectedEvento && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(3px)',
              zIndex: 998
            }}
          />

          {/* Drawer */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '430px',
              height: '100vh',
              background: '#ffffff',
              zIndex: 999,
              boxShadow: '-12px 0 35px rgba(0,0,0,0.12)',
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: '#ede9fe',
                    color: '#7c3aed',
                    fontSize: '12px',
                    fontWeight: 800,
                    marginBottom: '1rem'
                  }}
                >
                  {selectedEvento.acuerdoSeguimiento}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: 900,
                    color: '#0f172a',
                    lineHeight: 1.1
                  }}
                >
                  {selectedEvento.nombrePaciente}
                </h2>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  border: 'none',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* Fecha */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              <span>
                {safeParseDate(selectedEvento.fechaAcuerdo)
                  ? format(
                      safeParseDate(selectedEvento.fechaAcuerdo)!,
                      'dd MMMM yyyy',
                      { locale: es }
                    )
                  : ''}
              </span>

              <span>
                {safeParseDate(selectedEvento.fechaAcuerdo)
                  ? format(
                      safeParseDate(selectedEvento.fechaAcuerdo)!,
                      'hh:mm a'
                    )
                  : ''}
              </span>
            </div>

            {/* Card Contacto */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#0f172a'
                }}
              >
                Información de contacto
              </h4>

              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                  CONTACTO
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>
                  {selectedEvento.nombreLlamada || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                  TELÉFONO
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>
                  {selectedEvento.celularLlamada || 'N/A'}
                </div>
              </div>
            </div>

            {/* Estado */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '1rem',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontWeight: 800,
                  marginBottom: '6px'
                }}
              >
                SITUACIÓN ACTUAL
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#1e293b'
                }}
              >
                {selectedEvento.acuerdoSeguimiento}
              </div>
            </div>

            {/* Acciones */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              {(selectedEvento.acuerdoSeguimiento === 'LLAMARLE' ||
                selectedEvento.acuerdoSeguimiento === 'ESPERAR_LLAMADA') && (
                <>
                  <button
                    onClick={abrirModalCita}
                    style={btnStyle}
                  >
                    <CalendarPlus size={18} /> Agendar cita
                  </button>

                  <button
                    onClick={() =>
                      actualizarSeguimiento(selectedEvento.id, 'POSIBLE_INGRESO')
                    }
                    style={btnStyle}
                  >
                    <FilePlus2 size={18} /> Marcar posible ingreso
                  </button>
                </>
              )}

              {selectedEvento.acuerdoSeguimiento === 'ESPERAR_VISITA' && (
                <>
                  <button
                    onClick={() =>
                      actualizarSeguimiento(selectedEvento.id, 'CITA_PROGRAMADA')
                    }
                    style={btnStyle}
                  >
                    <CalendarPlus size={18} /> Convertir en cita
                  </button>

                  <button
                    onClick={() =>
                      actualizarSeguimiento(selectedEvento.id, 'POSIBLE_INGRESO')
                    }
                    style={btnStyle}
                  >
                    <MapPinned size={18} /> Marcar posible ingreso
                  </button>
                </>
              )}

              {selectedEvento.acuerdoSeguimiento === 'CITA_PROGRAMADA' && (
                <>
                  <button
                    onClick={enviarValoracion}
                    style={btnStyle}
                  >
                    <Stethoscope size={18} /> Confirmó llegada / valoración
                  </button>

                  <button
                    onClick={() =>
                      actualizarSeguimiento(
                        selectedEvento.id,
                        'POSIBLE_INGRESO'
                      )
                    }
                    style={btnStyle}
                  >
                    <FilePlus2 size={18} /> Marcar posible ingreso
                  </button>
                </>
              )}

              {selectedEvento.acuerdoSeguimiento === 'POSIBLE_INGRESO' && (
                <>
                  <button
                    onClick={irNuevaSolicitud}
                    style={btnStyle}
                  >
                    <FilePlus2 size={18} /> Formalizar ingreso
                  </button>

                  <button
                    onClick={enviarValoracion}
                    style={btnStyle}
                  >
                    <Stethoscope size={18} /> Enviar valoración médica
                  </button>
                </>
              )}

              <button
                onClick={archivarProspecto}
                style={btnDanger}
              >
                <Archive size={18} /> Archivar prospecto
              </button>
            </div>
          </div>
        </>
      )}

      {showAgendaModal && (
        <>
          <div
            onClick={() => setShowAgendaModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 2000
            }}
          />

          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '560px',
              background: 'white',
              borderRadius: '28px',
              padding: '2rem',
              zIndex: 2001,
              boxShadow: '0 25px 60px rgba(0,0,0,.15)'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginBottom: '2rem'
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}
              >
                <CalendarPlus size={32} />
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>
                  Agendar Seguimiento
                </h2>

                <p style={{ margin: 0, color: '#64748b' }}>
                  Programar acción para {selectedEvento?.nombrePaciente}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 800, fontSize: '14px' }}>
                FECHA PROGRAMADA
              </label>

              <input
                type="date"
                value={fechaAgenda}
                onChange={(e) => setFechaAgenda(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  fontSize: '18px'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ fontWeight: 800, fontSize: '14px' }}>
                HORA SUGERIDA
              </label>

              <input
                type="time"
                value={horaAgenda}
                onChange={(e) => setHoraAgenda(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  fontSize: '18px'
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}
            >
              <button
                onClick={() => setShowAgendaModal(false)}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={confirmarAgendarCita}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Confirmar Fecha
              </button>
            </div>
          </div>
        </>
      )}      
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdmisionesDashboard;