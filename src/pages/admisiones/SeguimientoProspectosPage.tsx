import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Calendar, Phone, 
  ArrowLeft, Clock, CheckCircle2, 
  AlertCircle, XCircle, CalendarPlus, Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { format, isPast, isToday, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// MODAL: Agendar Cita de Seguimiento
// ==========================================
const AgendarCitaModal = ({ isOpen, onClose, prospecto, onSave }: any) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '450px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '12px' }}>
            <CalendarPlus size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Agendar Cita</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Programar seguimiento para {prospecto?.nombrePaciente || 'Prospecto'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Fecha de Cita</label>
            <input 
              type="date" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none' }} 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hora Sugerida</label>
            <input 
              type="time" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none' }} 
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: '700', cursor: 'pointer', color: '#64748b' }}
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(`${fecha}T${hora || '10:00'}:00`)}
            disabled={!fecha}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: '800', cursor: 'pointer', opacity: !fecha ? 0.5 : 1 }}
          >
            Confirmar Cita
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProspectoSeguimiento {
  id: number;
  nombreLlamada: string;
  celularLlamada: string;
  parentescoLlamada: string;
  medioEnterado: string;
  nombrePaciente: string;
  createdAt: string;
  // Acuerdos 31 puntos
  acuerdoSeguimiento: 'LLAMARLE' | 'ESPERAR_LLAMADA' | 'ESPERAR_VISITA' | 'POSIBLE_INGRESO' | 'RECHAZADO' | 'CITA_PROGRAMADA' | 'OTRO';
  fechaAcuerdo: string | null;
  paciente: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    sustancias: string[];
    estado: string; // <-- Propiedad faltante
  };
}

const getAcuerdoChip = (p: ProspectoSeguimiento) => {
  switch (p.acuerdoSeguimiento) {
    case 'POSIBLE_INGRESO':
      return { label: 'Posible Ingreso', bg: '#f0fdf4', color: '#15803d', border: '#dcfce7', icon: <CheckCircle2 size={14} /> };
    case 'ESPERAR_VISITA':
      return { label: 'Esperar Visita', bg: '#eff6ff', color: '#1e40af', border: '#dbeafe', icon: <Calendar size={14} /> };
    case 'ESPERAR_LLAMADA':
      return { label: 'Esperar Llamada', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', icon: <Clock size={14} /> };
    case 'LLAMARLE':
      return { label: 'Llamarle', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: <Phone size={14} /> };
    case 'RECHAZADO':
      return { label: 'Cerrado / Rechazado', bg: '#fef2f2', color: '#991b1b', border: '#fee2e2', icon: <XCircle size={14} /> };
    default:
      return { label: 'Sin Acuerdo', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', icon: <AlertCircle size={14} /> };
  }
};

// ==========================================
// UTILS: Manejo Seguro de Fechas
// ==========================================
const safeParseDate = (dateVal: any) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string') return parseISO(dateVal);
  return null;
};

const getDayStatus = (dateStr: any) => {
  const date = safeParseDate(dateStr);
  if (!date) return null;
  if (isToday(date)) return { label: 'HOY', color: '#3b82f6' };
  if (isPast(date)) return { label: 'ATRASADO', color: '#ef4444' };
  return null;
};

export default function SeguimientoProspectosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  // Estados para Modal de Agenda
  const [agendarModal, setAgendarModal] = useState<{ isOpen: boolean, prospecto: any }>({ isOpen: false, prospecto: null });

  const { data: prospectos, isLoading } = useQuery<ProspectoSeguimiento[]>({
    queryKey: ['prospectos_seguimiento'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(res => res.data.data)
  });

  // MUTACIÓN: Agendar Cita
  const mutationAgendar = useMutation({
    mutationFn: (data: { id: number, fecha: string }) => 
      apiClient.patch(`/admisiones/primer-contacto/${data.id}/agendar`, { fechaAcuerdo: data.fecha }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospectos_seguimiento'] });
      setAgendarModal({ isOpen: false, prospecto: null });
    }
  });

  // MUTACIÓN: Solicitar Valoración Médica
  const mutationSolicitar = useMutation({
    mutationFn: (pacienteId: number) => 
      apiClient.patch(`/admisiones/paciente/${pacienteId}/solicitar-valoracion`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospectos_seguimiento'] });
    }
  });

  const handleAgendar = (id: number, fecha: string) => {
    mutationAgendar.mutate({ id, fecha });
  };

  const handleSolicitarValoracion = (prospecto: any) => {
    if (window.confirm(`¿Seguro que deseas enviar a ${prospecto.nombrePaciente} a valoración médica? El médico podrá verlo inmediatamente en su bandeja de entrada.`)) {
      mutationSolicitar.mutate(prospecto.paciente.id);
    }
  };

  const filteredProspectos = prospectos?.filter(p => {
    // Filtro por búsqueda multicampo (Prevención de Errores con Safe Navigation)
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const nombrePaciente = p.nombrePaciente?.toLowerCase() || '';
    const nombreSolicitante = p.nombreLlamada?.toLowerCase() || '';
    const telefonoSolicitante = p.celularLlamada?.toLowerCase() || '';

    const matchesSearch = 
      nombrePaciente.includes(normalizedSearch) ||
      nombreSolicitante.includes(normalizedSearch) ||
      telefonoSolicitante.includes(normalizedSearch);
    
    return matchesSearch;
  });

  // LÓGICA DE AGENDA: Filtrar Citas Programadas (Hoy y Futuro)
  const proximasCitas = useMemo(() => {
    if (!prospectos) return [];
    const today = startOfDay(new Date());
    
    return prospectos
      .filter(p => p.acuerdoSeguimiento === 'CITA_PROGRAMADA' && p.fechaAcuerdo)
      .filter(p => {
        const date = safeParseDate(p.fechaAcuerdo);
        if (!date) return false;
        return !isBefore(date, today) || isToday(date);
      })
      .sort((a, b) => {
        const dateA = safeParseDate(a.fechaAcuerdo) || new Date(0);
        const dateB = safeParseDate(b.fechaAcuerdo) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
  }, [prospectos]);


  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/admisiones/dashboard')}
            style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={18} color="#64748b" />
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>CRM Admisiones</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Gestión de seguimientos y agenda de citas.</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar prospecto o familia..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '16px', border: '1px solid #e2e8f0', 
              width: '320px', backgroundColor: 'white', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }} 
          />
        </div>
      </div>

      {/* SECCIÓN: AGENDA DE CITAS (PREMIUM GRID) */}
      {proximasCitas.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Próximas Citas Agendadas</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {proximasCitas.map((cita) => {
              const date = safeParseDate(cita.fechaAcuerdo)!;
              const esHoy = isToday(date);
              
              return (
                <div key={cita.id} style={{ 
                  backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '1.5rem', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s', borderTop: `4px solid ${esHoy ? '#3b82f6' : '#94a3b8'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: esHoy ? '#3b82f6' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {esHoy ? 'Hoy' : format(date, "EEEE d 'de' MMMM", { locale: es })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                      <Clock size={14} /> {format(date, 'HH:mm')}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 0.25rem 0' }}>{cita.nombrePaciente || 'Anónimo'}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {cita.nombreLlamada} • <Phone size={12} /> {cita.celularLlamada}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Impacto:</span>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {cita.paciente?.sustancias?.slice(0, 2).map((s, i) => (
                        <span key={i} style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '10px', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a 
                      href={`tel:${cita.celularLlamada}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '12px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}
                    >
                      <Phone size={14} /> Confirmar
                    </a>
                    <button 
                      onClick={() => navigate(`/admisiones/primer-contacto/${cita.id}`)}
                      style={{ padding: '0.6rem 1rem', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '12px', cursor: 'pointer', color: '#64748b' }}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Stats Cards 31 Puntos */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        {[
          { label: 'Total Contactos', value: prospectos?.length || 0, color: '#3b82f6', icon: <Users size={20} /> },
          { label: 'De Acuerdo (21)', value: prospectos?.filter(p => (p as any).dispuestoInternarse === 'SI').length || 0, color: '#10b981', icon: <CheckCircle2 size={20} /> },
          { label: 'Posible Ingreso', value: prospectos?.filter(p => p.acuerdoSeguimiento === 'POSIBLE_INGRESO').length || 0, color: '#f59e0b', icon: <Calendar size={20} /> },
          { label: 'Pendiente Llamar', value: prospectos?.filter(p => p.acuerdoSeguimiento === 'LLAMARLE').length || 0, color: '#64748b', icon: <Phone size={20} /> },
        ].map((stat, idx) => (
          <div key={idx} style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '24px', 
            border: '1px solid #f1f5f9', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          }}>
            <div style={{ backgroundColor: `${stat.color}10`, color: stat.color, padding: '0.75rem', borderRadius: '16px' }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Prospecto / Solicitante</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Sustancias</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Acuerdo</th>
              <th style={{ textAlign: 'center', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Captura</th>
              <th style={{ textAlign: 'center', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Cargando CRM 31 Puntos...</td></tr>
            ) : filteredProspectos?.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}>No se encontraron registros.</td></tr>
            ) : (
              filteredProspectos?.map((p) => {
                const chip = getAcuerdoChip(p);
                const dayStatus = getDayStatus(p.createdAt);
                const isAnon = !p.nombrePaciente || p.nombrePaciente === 'Prospecto Anónimo';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ fontWeight: '800', color: isAnon ? '#94a3b8' : '#0f172a', fontSize: '15px' }}>{isAnon ? 'Prospecto Anónimo' : p.nombrePaciente}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {p.nombreLlamada} • <Phone size={12} /> {p.celularLlamada}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {p.paciente?.sustancias?.slice(0, 2).map((s, i) => (
                          <span key={i} style={{ backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '11px', fontWeight: '800', backgroundColor: chip.bg, color: chip.color, border: `1px solid ${chip.border}` }}>
                        {chip.icon} {chip.label}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: p.acuerdoSeguimiento === 'POSIBLE_INGRESO' ? '#16a34a' : 'inherit' }}>
                        {(() => {
                          const dateValue = p.acuerdoSeguimiento && ['LLAMARLE', 'ESPERAR_LLAMADA', 'POSIBLE_INGRESO'].includes(p.acuerdoSeguimiento) && p.fechaAcuerdo ? p.fechaAcuerdo : p.createdAt;
                          const parsedDate = safeParseDate(dateValue);
                          return parsedDate ? format(parsedDate, 'dd MMM') : '--';
                        })()}
                      </div>
                      {(() => {
                        const parsedFechaAcuerdo = safeParseDate(p.fechaAcuerdo);
                        const isOverdue = parsedFechaAcuerdo && isBefore(parsedFechaAcuerdo, startOfDay(new Date()));
                        
                        if (p.acuerdoSeguimiento === 'POSIBLE_INGRESO') {
                          return <span style={{ fontSize: '9px', color: '#16a34a', fontWeight: '900' }}>CITA INGRESO</span>;
                        }
                        
                        if (isOverdue && p.acuerdoSeguimiento === 'ESPERAR_LLAMADA') {
                          return <span style={{ fontSize: '9px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '900', border: '1px solid #fee2e2' }}>⚠️ SIN TRATO: Marcar p/ asegurar</span>;
                        }
                        
                        if (isOverdue && p.acuerdoSeguimiento === 'LLAMARLE') {
                          return <span style={{ fontSize: '9px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '900', border: '1px solid #fee2e2' }}>⚠️ LLAMADA PENDIENTE</span>;
                        }

                        return dayStatus ? <span style={{ fontSize: '9px', color: dayStatus.color, fontWeight: '900' }}>{dayStatus.label}</span> : null;
                      })()}
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          onClick={() => setAgendarModal({ isOpen: true, prospecto: p })}
                          title="Agendar Cita"
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: p.acuerdoSeguimiento === 'CITA_PROGRAMADA' ? '#eff6ff' : 'white', cursor: 'pointer', color: p.acuerdoSeguimiento === 'CITA_PROGRAMADA' ? '#3b82f6' : '#64748b' }}
                        >
                          <CalendarPlus size={16} />
                        </button>

                        <button 
                          onClick={() => handleSolicitarValoracion(p)}
                          title="Solicitar Valoración Médica"
                          style={{ 
                            padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', 
                            backgroundColor: p.paciente?.estado === 'EN_VALORACION' ? '#ecfdf5' : 'white', 
                            cursor: 'pointer', 
                            color: p.paciente?.estado === 'EN_VALORACION' ? '#10b981' : '#64748b' 
                          }}
                        >
                          <Stethoscope size={16} />
                        </button>

                        <button 
                          onClick={() => navigate(`/admisiones/primer-contacto/${p.id}`)}
                          title="Ver Detalle"
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#3b82f6' }}
                        >
                          <Search size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      <AgendarCitaModal 
        isOpen={agendarModal.isOpen}
        onClose={() => setAgendarModal({ isOpen: false, prospecto: null })}
        prospecto={agendarModal.prospecto}
        onSave={(fecha: string) => handleAgendar(agendarModal.prospecto.id, fecha)}
      />
    </div>
  );
}
