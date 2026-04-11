import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Calendar, Phone, 
  ArrowLeft, Clock, CheckCircle2, 
  AlertCircle, XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProspectoSeguimiento {
  id: number;
  solicitanteNombre: string;
  solicitanteTelefono: string;
  acuerdoSeguimiento: 'LLAMARA_PROSPECTO' | 'LLAMARA_MARAKAME' | 'CITA_PROGRAMADA' | 'RECHAZADO' | null;
  fechaSeguimiento: string | null;
  createdAt: string;
  paciente: {
    nombre: string;
    apellidoPaterno: string;
    sustancias: string[];
  };
}

const getAcuerdoChip = (acuerdo: string | null) => {
  switch (acuerdo) {
    case 'LLAMARA_MARAKAME':
      return { label: 'Llamar Nosotros', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', icon: <Phone size={14} /> };
    case 'CITA_PROGRAMADA':
      return { label: 'Cita Programada', bg: '#f0fdf4', color: '#15803d', border: '#dcfce7', icon: <Calendar size={14} /> };
    case 'LLAMARA_PROSPECTO':
      return { label: 'Prospecto Llamará', bg: '#f8fafc', color: '#475569', border: '#e2e8f0', icon: <Clock size={14} /> };
    case 'RECHAZADO':
      return { label: 'Cerrado / Rechazado', bg: '#fef2f2', color: '#991b1b', border: '#fee2e2', icon: <XCircle size={14} /> };
    default:
      return { label: 'Sin Acuerdo', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', icon: <AlertCircle size={14} /> };
  }
};

export default function SeguimientoProspectosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: prospectos, isLoading } = useQuery<ProspectoSeguimiento[]>({
    queryKey: ['prospectos_seguimiento'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(res => res.data.data)
  });

  const updateAcuerdoMut = useMutation({
    mutationFn: ({ id, acuerdo }: { id: number, acuerdo: string }) => 
      apiClient.put(`/admisiones/primer-contacto/${id}`, { acuerdoSeguimiento: acuerdo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospectos_seguimiento'] });
    }
  });

  const filteredProspectos = prospectos?.filter(p => {
    // Filtro por búsqueda
    const matchesSearch = 
      p.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por estado "Activo" (To-Do List)
    const isCerrado = p.acuerdoSeguimiento === 'RECHAZADO';
    const matchesStatus = showAll || !isCerrado;

    return matchesSearch && matchesStatus;
  });

  const getDayStatus = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return { label: 'HOY', color: '#3b82f6' };
    if (isPast(date)) return { label: 'ATRASADO', color: '#ef4444' };
    return null;
  };

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
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Gestión de seguimientos y acuerdos de prospectos.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar prospecto o solicitante..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', width: '320px', outline: 'none', fontSize: '14px' }}
            />
          </div>

          <div 
            onClick={() => setShowAll(!showAll)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', 
              backgroundColor: showAll ? '#eff6ff' : 'white', borderRadius: '14px', border: '1px solid #e2e8f0', 
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '36px', height: '20px', backgroundColor: showAll ? '#3b82f6' : '#cbd5e1', borderRadius: '100px', position: 'relative', transition: 'all 0.3s' }}>
              <div style={{ position: 'absolute', top: '2px', left: showAll ? '18px' : '2px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: showAll ? '#1e40af' : '#64748b' }}>Mostrar Cerrados</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Rapiditas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Activos', value: prospectos?.filter(p => p.acuerdoSeguimiento !== 'RECHAZADO').length || 0, color: '#3b82f6', icon: <Users size={20} /> },
          { label: 'Llamadas Pendientes', value: prospectos?.filter(p => p.acuerdoSeguimiento === 'LLAMARA_MARAKAME').length || 0, color: '#f59e0b', icon: <Phone size={20} /> },
          { label: 'Citas Programadas', value: prospectos?.filter(p => p.acuerdoSeguimiento === 'CITA_PROGRAMADA').length || 0, color: '#10b981', icon: <Calendar size={20} /> },
          { label: 'Prospectos en Espera', value: prospectos?.filter(p => p.acuerdoSeguimiento === 'LLAMARA_PROSPECTO').length || 0, color: '#64748b', icon: <Clock size={20} /> },
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ backgroundColor: `${stat.color}10`, color: stat.color, padding: '0.75rem', borderRadius: '16px' }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Prospecto / Solicitante</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Interés / Adicción</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Acuerdo CRM</th>
              <th style={{ textAlign: 'center', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Fecha Programada</th>
              <th style={{ textAlign: 'center', padding: '1.25rem 2rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontWeight: '600' }}>Cargando datos del CRM...</td></tr>
            ) : filteredProspectos?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                  <div style={{ backgroundColor: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle2 size={32} color="#cbd5e1" />
                  </div>
                  <h3 style={{ color: '#0f172a', fontWeight: '900', margin: '0 0 0.5rem' }}>¡Todo al día!</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No hay seguimientos pendientes en este momento.</p>
                </td>
              </tr>
            ) : (
              filteredProspectos?.map((p) => {
                const chip = getAcuerdoChip(p.acuerdoSeguimiento);
                const dayStatus = getDayStatus(p.fechaSeguimiento);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fbfcfd'}>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{p.paciente.nombre} {p.paciente.apellidoPaterno}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         Sol: {p.solicitanteNombre} • <Phone size={12} /> {p.solicitanteTelefono || 'Sin tel'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {p.paciente.sustancias.length > 0 ? (
                          p.paciente.sustancias.slice(0, 2).map((s, i) => (
                            <span key={i} style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{s}</span>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>No especificado</span>
                        )}
                        {p.paciente.sustancias.length > 2 && <span style={{ color: '#94a3b8', fontSize: '11px' }}>+{p.paciente.sustancias.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', borderRadius: '12px', border: `1px solid ${chip.border}`,
                        backgroundColor: chip.bg, color: chip.color, fontWeight: '800', fontSize: '12px'
                      }}>
                        {chip.icon} {chip.label}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      {p.fechaSeguimiento ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>
                            {format(parseISO(p.fechaSeguimiento), 'dd MMM, yyyy', { locale: es })}
                          </div>
                          {dayStatus && (
                            <span style={{ fontSize: '10px', color: dayStatus.color, fontWeight: '900', letterSpacing: '0.05em' }}>{dayStatus.label}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>--</span>
                      )}
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => navigate(`/admisiones/primer-contacto/${p.id}`)}
                          style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#3b82f6' }}
                          title="Ver Detalle"
                        >
                          <Search size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('¿Marcar como Rechazado/Cerrado?')) {
                              updateAcuerdoMut.mutate({ id: p.id, acuerdo: 'RECHAZADO' });
                            }
                          }}
                          style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #fee2e2', backgroundColor: 'white', cursor: 'pointer', color: '#ef4444' }}
                          title="Cerrar CRM"
                        >
                          <XCircle size={16} />
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
    </div>
  );
}
