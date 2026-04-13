import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  ArrowUpRight, 
  Users, 
  Bed, 
  Clock as ClockIcon,
  Folder,
  Calendar,
  ArrowRight,
  ChevronRight,
  Phone,
  Info,
  ExternalLink,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { useIngresoStore } from '../../stores/ingresoStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';
import { isToday, startOfDay, parseISO, addDays, isWithinInterval, format, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const safeParseDate = (dateVal: any) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string') return parseISO(dateVal);
  return null;
};

const DetalleProspectoModal = ({ isOpen, onClose, data }: any) => {
  if (!isOpen || !data) return null;

  const Seccion = ({ title, icon: Icon, children }: any) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
        <Icon size={16} color="#3b82f6" />
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase' }}>{title}</h4>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );

  const Item = ({ label, value }: any) => (
    <div>
      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{value || '---'}</p>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
               <span style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '6px' }}>RESUMEN DE PROSPECTO</span>
               <span style={{ color: '#64748b', fontSize: '12px' }}>#{data.id}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{data.nombrePaciente}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Cita: {data.fechaAcuerdo ? format(parseISO(data.fechaAcuerdo), "d 'de' MMMM, HH:mm'hrs'", { locale: es }) : '---'}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer' }}><ChevronRight size={20} style={{ transform: 'rotate(90deg)' }}/></button>
        </div>

        <Seccion title="Contacto Principal" icon={Phone}>
          <Item label="Quién Llama" value={data.nombreLlamada} />
          <Item label="Parentesco" value={data.parentescoLlamada} />
          <Item label="Celular" value={data.celularLlamada} />
          <Item label="Medio" value={data.medioEnterado} />
        </Seccion>

        <Seccion title="Sustancias / Adicciones" icon={ClipboardList}>
           <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.sustancias?.map((s: string, i: number) => (
                <span key={i} style={{ backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>{s}</span>
              ))}
              {data.sustancias?.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No se registraron sustancias.</p>}
            </div>
          </div>
        </Seccion>

        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>CONCLUSIÓN DE LA LLAMADA</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>{data.conclusionMedica || 'Sin observaciones registradas.'}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '800', cursor: 'pointer' }}>Cerrar</button>
          <button 
            onClick={() => { onClose(); window.location.href=`/admisiones/primer-contacto/${data.id}`; }}
            style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '16px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer' }}
          >
            Ver Expediente Completo <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
import EstadoSolicitudChip from '../../components/admisiones/EstadoSolicitudChip';
import UrgenciaChip from '../../components/admisiones/UrgenciaChip';
import SolicitudDrawer from '../../components/admisiones/SolicitudDrawer';
import type { SolicitudIngreso } from '../../types';
import { useNavigate } from 'react-router-dom';

const AdmisionesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    solicitudes, 
    camas, 
    fetchSolicitudes, 
    fetchCamas, 
    isLoading 
  } = useIngresoStore();
  
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudIngreso | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState<any>(null);
  
  // FETCH AGENDA (Primeros Contactos) - Usamos una clave unificada para sincronizar con CRM
  const { data: prospectos } = useQuery({
    queryKey: ['prospectos_crm'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(res => res.data.data)
  });

  const proximasCitas = useMemo(() => {
    if (!prospectos) return [];
    const today = startOfDay(new Date());
    const limitDate = endOfDay(addDays(today, 6)); // Ampliamos un día más por seguridad de zona horaria

    const filtered = (prospectos as any[]).filter(p => {
      const pDate = safeParseDate(p.fechaAcuerdo);
      const isCita = p.acuerdoSeguimiento === 'CITA_PROGRAMADA';
      const inRange = pDate && isWithinInterval(pDate, { start: today, end: limitDate });
      return isCita && inRange;
    });

    return filtered.sort((a, b) => {
      const dateA = safeParseDate(a.fechaAcuerdo)?.getTime() || 0;
      const dateB = safeParseDate(b.fechaAcuerdo)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [prospectos]);

  useEffect(() => {
    fetchSolicitudes();
    fetchCamas();
  }, [fetchSolicitudes, fetchCamas]);

  const openSolicitud = (sol: SolicitudIngreso) => {
    setSelectedSolicitud(sol);
    setIsDrawerOpen(true);
  };

  const stats = [
    { label: 'Camas Disponibles', value: camas.filter(c => c.estado === 'DISPONIBLE').length, icon: Bed, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Solicitudes Pendientes', value: solicitudes.filter(s => s.estado === 'PENDIENTE').length, icon: ClockIcon, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pacientes Internados', value: solicitudes.filter(s => s.estado === 'APROBADA').length, icon: Users, color: '#10b981', bg: '#f0fdf4' },
  ];

  const handleApprove = (id: number) => {
    setIsDrawerOpen(false);
    navigate(`/admisiones/asignar-cama/${id}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Dashboard de Admisiones</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Gestión centralizada de solicitudes e ingresos residenciales.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Botones movidos al Sidebar por requerimiento de UX */}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ backgroundColor: stat.bg, padding: '1rem', borderRadius: '16px', color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Layout Principal: 2 Columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: Lista de solicitudes */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Lista de Espera / Solicitudes</h2>
              <div style={{ background: '#e2e8f0', width: '1px', height: '24px' }}></div>
              <div style={{ backgroundColor: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} color="#94a3b8" />
                <input type="text" placeholder="Buscar por folio o nombre..." style={{ border: 'none', outline: 'none', fontSize: '14px', width: '150px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button style={{ padding: '6px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b' }}><Filter size={16} /></button>
              <button style={{ padding: '6px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white' }}><ListIcon size={16} /></button>
            </div>
          </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Folio</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Paciente</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Urgencia</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Fecha Registro</th>
                <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    No hay solicitudes pendientes en este momento.
                  </td>
                </tr>
              ) : (
                solicitudes.map((sol) => (
                  <tr key={sol.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => openSolicitud(sol)}>
                    <td style={{ padding: '1.25rem 2rem', fontWeight: 'bold', color: '#334155' }}>{sol.folio}</td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>
                        {sol.paciente?.claveUnica 
                          ? `Paciente #${sol.paciente.claveUnica}` 
                          : (sol.paciente?.nombre ? `${sol.paciente.nombre} ${sol.paciente.apellidoPaterno}` : 'Sin nombre')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {sol.paciente?.claveUnica ? 'Identidad Protegida' : `CURP: ${sol.paciente?.curp || '---'}`}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}><UrgenciaChip nivel={sol.urgencia} /></td>
                    <td style={{ padding: '1.25rem 2rem' }}><EstadoSolicitudChip estado={sol.estado} /></td>
                    <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '14px' }}>
                      {new Date(sol.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {sol.estado === 'APROBADA' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admisiones/expediente/${sol.pacienteId}`);
                            }}
                            title="Ver Expediente Digital"
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#10b981', cursor: 'pointer' }}
                          >
                            <Folder size={18} />
                          </button>
                        )}
                        <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}>
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* COLUMNA DERECHA: Agenda del Día */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#0f172a', borderRadius: '24px', padding: '1.5rem', color: 'white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '12px' }}>
                  <Calendar size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Próximas Llegadas</h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                5 DÍAS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
              {proximasCitas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No hay citas para los próximos 5 días.</p>
                </div>
              ) : (
                proximasCitas.map((cita) => (
                  <div key={cita.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: isToday(safeParseDate(cita.fechaAcuerdo)!) ? '#3b82f6' : '#94a3b8' }}>
                        {safeParseDate(cita.fechaAcuerdo)?.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase()} • {safeParseDate(cita.fechaAcuerdo)?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={() => setSelectedDetalle(cita)}
                        title="Ver resumen de captura"
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                      >
                        <Info size={16} />
                      </button>
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>{cita.nombrePaciente || 'Prospecto Anónimo'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={10} /> {cita.celularLlamada || 'Sin teléfono'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => navigate('/admisiones/seguimiento')}
              style={{ 
                width: '100%', marginTop: '1.5rem', padding: '0.9rem', backgroundColor: 'white', color: '#0f172a', 
                borderRadius: '14px', border: 'none', fontWeight: '900', fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              Ver Calendario <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '24px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>Enlaces Rápidos</h4>
            <button 
              onClick={() => navigate('/admisiones/seguimiento')}
              style={{ width: '100%', padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '8px', borderRadius: '10px' }}><Users size={18} /></div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Seguimiento</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>CRM Completo</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#3b82f6', color: 'white', padding: '1rem 2rem', borderRadius: '14px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Sincronizando con Marakame API...
        </div>
      )}

      {/* Detail Drawer */}
      <SolicitudDrawer 
        solicitud={selectedSolicitud}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApprove}
      />

      <DetalleProspectoModal 
        isOpen={!!selectedDetalle}
        onClose={() => setSelectedDetalle(null)}
        data={selectedDetalle}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tbody tr:hover { background-color: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default AdmisionesDashboard;
