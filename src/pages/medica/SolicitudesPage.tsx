import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, CheckCircle2, Clock, User, Tag, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';

interface SolicitudMedica {
  id: number;
  contenido: string;
  tipo: string;
  estado: 'PENDIENTE' | 'ATENDIDA';
  createdAt: string;
  emisor: {
    id: number;
    nombre: string;
    apellidos: string;
    rol: string;
  };
}

const TIPO_LABELS: Record<string, string> = {
  REABASTECIMIENTO:  'Reabastecimiento',
  MATERIAL_CURACION: 'Material de Curación',
  REPORTE:           'Reporte Especial',
  PERSONAL:          'Solicitud de Personal',
  OTRO:              'Otro',
};

const ROL_LABELS: Record<string, string> = {
  AREA_MEDICA: 'Médico',
  JEFE_MEDICO: 'Jefe Médico',
  ENFERMERIA:  'Enfermería',
  NUTRICION:   'Nutrición',
  PSICOLOGIA:  'Psicología',
};

export default function SolicitudesPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<'TODAS' | 'PENDIENTE' | 'ATENDIDA'>('TODAS');

  const { data: solicitudes = [], isLoading, isError } = useQuery<SolicitudMedica[]>({
    queryKey: ['solicitudes_medicas'],
    queryFn: () => apiClient.get('/solicitudes-medicas').then(r => r.data.data),
    retry: false,
  });

  const atenderMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/solicitudes-medicas/${id}/atender`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes_medicas'] }),
  });

  const filtradas = solicitudes.filter(s =>
    filtro === 'TODAS' ? true : s.estado === filtro
  );

  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
  const atendidas  = solicitudes.filter(s => s.estado === 'ATENDIDA').length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{
        backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0',
        padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: 'var(--shadow)', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '16px' }}>
            <ClipboardCheck size={26} color="#1d4ed8" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>Buzón de Solicitudes</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Peticiones del equipo clínico a Jefatura</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#fef3c7', borderRadius: '14px', padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} color="#d97706" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>{pendientes} pendientes</span>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '14px', padding: '0.5rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={14} color="#16a34a" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#15803d' }}>{atendidas} atendidas</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'white', borderRadius: '18px', border: '1px solid #e2e8f0',
        padding: '0.75rem 1.25rem', display: 'flex', gap: '0.5rem',
        boxShadow: 'var(--shadow)',
      }}>
        {(['TODAS', 'PENDIENTE', 'ATENDIDA'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '0.5rem 1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px', transition: 'all 0.15s',
              backgroundColor: filtro === f ? '#1d4ed8' : '#f1f5f9',
              color: filtro === f ? 'white' : '#64748b',
            }}
          >
            {f === 'TODAS' ? 'Todas' : f === 'PENDIENTE' ? 'Pendientes' : 'Atendidas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: '600' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            Cargando solicitudes...
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444', fontWeight: '600' }}>
            Error al cargar las solicitudes.
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <ClipboardCheck size={40} color="#e2e8f0" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: '600', margin: 0 }}>No hay solicitudes {filtro !== 'TODAS' ? `con estado ${filtro}` : ''}.</p>
          </div>
        ) : (
          filtradas.map(s => (
            <div
              key={s.id}
              style={{
                backgroundColor: 'white', borderRadius: '20px',
                border: `1.5px solid ${s.estado === 'PENDIENTE' ? '#fde68a' : '#bbf7d0'}`,
                padding: '1.4rem 1.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>

                {/* Left: info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: s.estado === 'PENDIENTE' ? '#fef3c7' : '#f0fdf4',
                      color: s.estado === 'PENDIENTE' ? '#b45309' : '#15803d',
                      borderRadius: '100px', padding: '0.2rem 0.75rem',
                      fontSize: '11px', fontWeight: '800',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}>
                      {s.estado === 'PENDIENTE' ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                      {s.estado}
                    </span>
                    <span style={{
                      backgroundColor: '#f1f5f9', color: '#475569',
                      borderRadius: '100px', padding: '0.2rem 0.75rem',
                      fontSize: '11px', fontWeight: '800',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}>
                      <Tag size={11} /> {TIPO_LABELS[s.tipo] ?? s.tipo}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.75rem', fontSize: '14px', color: '#1e293b', fontWeight: '500', lineHeight: '1.55' }}>
                    {s.contenido}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                      <User size={12} />
                      {s.emisor.nombre} {s.emisor.apellidos}
                      <span style={{ color: '#94a3b8', fontWeight: '600' }}>· {ROL_LABELS[s.emisor.rol] ?? s.emisor.rol}</span>
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      {new Date(s.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: action */}
                {s.estado === 'PENDIENTE' && (
                  <button
                    onClick={() => atenderMutation.mutate(s.id)}
                    disabled={atenderMutation.isPending}
                    style={{
                      padding: '0.6rem 1.2rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#16a34a,#15803d)',
                      color: 'white', fontWeight: '800', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      flexShrink: 0, opacity: atenderMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    <CheckCircle2 size={14} /> Marcar Atendida
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
