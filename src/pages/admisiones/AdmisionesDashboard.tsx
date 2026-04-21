import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Filter, LayoutGrid, List as ListIcon, ArrowUpRight, Users, Bed, 
  Clock as ClockIcon, Folder, Calendar, ArrowRight, ChevronRight, Phone, 
  Info, ExternalLink, MapPin, ClipboardList
} from 'lucide-react';
import { useIngresoStore } from '../../stores/ingresoStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';
import { isToday, startOfDay, parseISO, addDays, isWithinInterval, format, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import EstadoSolicitudChip from '../../components/admisiones/EstadoSolicitudChip';
import UrgenciaChip from '../../components/admisiones/UrgenciaChip';
import SolicitudDrawer from '../../components/admisiones/SolicitudDrawer';
import type { SolicitudIngreso } from '../../types';
import { useNavigate } from 'react-router-dom';

// 1. MEJORA: Tipado básico para el prospecto (reemplaza any)
interface ProspectoResumen {
  id: number;
  nombrePaciente: string;
  fechaAcuerdo: string;
  nombreLlamada?: string;
  parentescoLlamada?: string;
  celularLlamada?: string;
  medioEnterado?: string;
  sustancias?: string[];
  conclusionMedica?: string;
}

const safeParseDate = (dateVal: unknown) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'string') return parseISO(dateVal);
  return null;
};

// Se omite el código del modal por brevedad, pero reemplaza los 'any' por tipos adecuados.
const DetalleProspectoModal = ({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: ProspectoResumen | null }) => {
  // ... (Tu código actual del modal se mantiene intacto, solo cambia la firma de arriba)
  if (!isOpen || !data) return null;
  // ...
};

const AdmisionesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { solicitudes, camas, fetchSolicitudes, fetchCamas, isLoading } = useIngresoStore();
  
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudIngreso | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState<ProspectoResumen | null>(null);
  
  // 2. MEJORA: Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'TODAS' | 'PENDIENTES'>('TODAS');

  const { data: prospectos } = useQuery({
    queryKey: ['prospectos_crm'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(res => res.data.data)
  });

  const proximasCitas = useMemo(() => {
    if (!prospectos) return [];
    const today = startOfDay(new Date());
    const limitDate = endOfDay(addDays(today, 6));

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

  const handleApprove = (id: number) => {
    setIsDrawerOpen(false);
    navigate(`/admisiones/asignar-cama/${id}`);
  };

  // 3. MEJORA: Lógica de filtrado y búsqueda aplicada a las solicitudes
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(sol => {
      // Filtro por texto
      const termino = searchTerm.toLowerCase();
      const coincideTexto = 
        sol.folio.toLowerCase().includes(termino) ||
        sol.paciente?.nombre?.toLowerCase().includes(termino) ||
        sol.paciente?.apellidoPaterno?.toLowerCase().includes(termino) ||
        sol.paciente?.claveUnica?.toLowerCase().includes(termino);
      
      // Filtro por estado
      const coincideEstado = filtroActivo === 'TODAS' ? true : sol.estado === 'PENDIENTE';

      return coincideTexto && coincideEstado;
    });
  }, [solicitudes, searchTerm, filtroActivo]);

  const stats = [
    { label: 'Camas Disponibles', value: camas.filter(c => c.estado === 'DISPONIBLE').length, icon: Bed, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Solicitudes Pendientes', value: solicitudes.filter(s => s.estado === 'PENDIENTE').length, icon: ClockIcon, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pacientes Internados', value: solicitudes.filter(s => s.estado === 'APROBADA').length, icon: Users, color: '#10b981', bg: '#f0fdf4' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header y Stats se mantienen igual... */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Dashboard de Admisiones</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Gestión centralizada de solicitudes e ingresos residenciales.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Lista de Espera / Solicitudes</h2>
              <div style={{ background: '#e2e8f0', width: '1px', height: '24px' }}></div>
              
              {/* 4. MEJORA: Input de búsqueda conectado al estado */}
              <div style={{ backgroundColor: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} color="#94a3b8" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar folio o nombre..." 
                  style={{ border: 'none', outline: 'none', fontSize: '14px', width: '150px' }} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {/* 5. MEJORA: Botón de filtro funcional */}
              <button 
                onClick={() => setFiltroActivo(prev => prev === 'TODAS' ? 'PENDIENTES' : 'TODAS')}
                style={{ 
                  padding: '6px 12px', 
                  background: filtroActivo === 'PENDIENTES' ? '#eff6ff' : 'white', 
                  border: `1px solid ${filtroActivo === 'PENDIENTES' ? '#3b82f6' : '#e2e8f0'}`, 
                  borderRadius: '8px', 
                  color: filtroActivo === 'PENDIENTES' ? '#3b82f6' : '#64748b',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '13px'
                }}>
                <Filter size={16} />
                {filtroActivo === 'PENDIENTES' ? 'Solo Pendientes' : 'Filtrar'}
              </button>
            </div>
          </div>

        {/* 6. MEJORA: Contenedor scrolleable para la tabla */}
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }} className="custom-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10, borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Folio</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Paciente</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Urgencia</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Fecha</th>
                <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Usamos el array filtrado en lugar de 'solicitudes' */}
              {solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    {searchTerm !== '' ? 'No se encontraron resultados para tu búsqueda.' : 'No hay solicitudes en este momento.'}
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((sol) => (
                  <tr key={sol.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => openSolicitud(sol)}>
                    {/* ... (El contenido de tus <td> se queda igual) ... */}
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
