import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Calendar, Phone, 
  ArrowLeft, Clock, CheckCircle2, 
  AlertCircle, XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { format, isPast, isToday, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProspectoSeguimiento {
  id: number;
  nombreLlamada: string;
  celularLlamada: string;
  parentescoLlamada: string;
  medioEnterado: string;
  nombrePaciente: string;
  createdAt: string;
  // Acuerdos 31 puntos
  acuerdoSeguimiento: 'LLAMARLE' | 'ESPERAR_LLAMADA' | 'ESPERAR_VISITA' | 'POSIBLE_INGRESO' | 'RECHAZADO';
  fechaAcuerdo: string | null;
  paciente: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    sustancias: string[];
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

export default function SeguimientoProspectosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: prospectos, isLoading } = useQuery<ProspectoSeguimiento[]>({
    queryKey: ['prospectos_seguimiento'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(res => res.data.data)
  });

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
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Gestión de seguimientos basada en la hoja de 31 puntos.</p>
          </div>
        </div>

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
      </div>

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
                      <button 
                        onClick={() => navigate(`/admisiones/primer-contacto/${p.id}`)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#3b82f6' }}
                      >
                        <Search size={16} />
                      </button>
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
