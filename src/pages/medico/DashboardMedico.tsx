import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Activity,
  HeartPulse,
  TriangleAlert,
  Send,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';
import type { Paciente } from '../../types';
import { CronogramaActividades } from '../../components/medico/CronogramaActividades';

// --- Types ---

interface DashboardStats {
  ocupacion: {
    porcentaje: number;
    internados: number;
    capacidad: number;
  };
  admisiones: {
    enProceso: number;
  };
}

// --- Sub-components ---

interface StatCardProps {
  title: string;
  value: number | string | undefined;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  alert?: boolean;
  onClick?: () => void;
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, alert = false, onClick }: StatCardProps) => (
  <div
    onClick={onClick}
    className="medico-stat-card"
    style={{
      backgroundColor: alert ? '#fffbeb' : 'white',
      padding: '1.75rem',
      borderRadius: '20px',
      border: alert ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
      boxShadow: alert
        ? '0 4px 6px -1px rgba(245,158,11,0.12)'
        : 'var(--shadow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.25s',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ position: 'relative', zIndex: 1 }}>
      {alert && (
        <span style={{
          display: 'inline-block',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontSize: '10px',
          fontWeight: '800',
          padding: '0.2rem 0.6rem',
          borderRadius: '100px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '0.6rem',
          border: '1px solid #fde68a',
        }}>
          Requiere Atención
        </span>
      )}
      <p style={{
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '700',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </p>
      <h2 style={{
        fontSize: '40px',
        fontWeight: '900',
        color: alert ? '#92400e' : '#1e293b',
        margin: 0,
        letterSpacing: '-1.5px',
        lineHeight: 1,
      }}>
        {value ?? '—'}
      </h2>
      {subtitle && (
        <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '0.5rem', fontWeight: '500' }}>
          {subtitle}
        </p>
      )}
    </div>

    <div style={{
      backgroundColor: `${color}18`,
      color,
      padding: '1rem',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
    }}>
      <Icon size={30} />
    </div>

    <div style={{
      position: 'absolute',
      top: '-20%',
      right: '-8%',
      width: '110px',
      height: '110px',
      background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
      zIndex: 0,
    }} />
  </div>
);

// --- Modal: Nueva Solicitud a Jefatura ---

const TIPOS_SOLICITUD = [
  { value: 'REABASTECIMIENTO',  label: 'Reabastecimiento de medicamento' },
  { value: 'MATERIAL_CURACION', label: 'Material de curación' },
  { value: 'REPORTE',           label: 'Reporte especial' },
  { value: 'PERSONAL',          label: 'Solicitud de personal' },
  { value: 'OTRO',              label: 'Otro' },
];

const NuevaSolicitudModal = ({ isOpen, onClose, nombreUsuario }: {
  isOpen: boolean;
  onClose: () => void;
  nombreUsuario?: string;
}) => {
  const [tipo, setTipo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const handleEnviar = async () => {
    if (!tipo || !contenido.trim()) return;
    setEnviando(true);
    try {
      await apiClient.post('/solicitudes-medicas', { tipo, contenido: contenido.trim() });
      setExito(true);
      setTimeout(() => {
        setExito(false);
        setTipo('');
        setContenido('');
        onClose();
      }, 1500);
    } catch {
      alert('Error al enviar la solicitud. Intente nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  const inp = {
    width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#1e293b',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '10px' }}>
              <Send size={18} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>Nueva Solicitud a Jefatura</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Petición dirigida al Jefe Médico</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.4rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
            Solicitante: <strong>{nombreUsuario ?? 'Médico'}</strong>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asunto</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              style={{ ...inp, backgroundColor: 'white', cursor: 'pointer' }}
            >
              <option value="">— Seleccionar tipo —</option>
              {TIPOS_SOLICITUD.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción de la petición</label>
            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder="Describe tu solicitud: qué se necesita, cantidad, urgencia, motivo..."
              rows={4}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ padding: '0.7rem 1.4rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !tipo || !contenido.trim()}
            style={{
              padding: '0.7rem 1.6rem', borderRadius: '12px', border: 'none',
              background: enviando || !tipo || !contenido.trim() ? '#e2e8f0' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              color: enviando || !tipo || !contenido.trim() ? '#94a3b8' : 'white',
              fontWeight: '800', cursor: enviando || !tipo || !contenido.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            {exito ? <CheckCircle2 size={15} /> : enviando ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
            {exito ? 'Enviada' : enviando ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>

      </div>
    </div>
  );
};

// --- Main Component ---

export function DashboardMedico() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();
  const [solicitudOpen, setSolicitudOpen] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard_stats'],
    queryFn: () => apiClient.get('/dashboard').then(res => res.data.data),
    refetchInterval: 30000,
  });

  const { data: internados } = useQuery<Paciente[]>({
    queryKey: ['pacientes_internados'],
    queryFn: () => apiClient.get('/pacientes?estado=INTERNADO').then(res => res.data.data),
  });

  const { data: valoraciones } = useQuery<Paciente[]>({
    queryKey: ['valoraciones_pendientes'],
    queryFn: () =>
      apiClient.get('/pacientes?estado=PENDIENTE_VALORACION_MEDICA').then(res => res.data.data),
  });

  const detoxCount = internados?.filter(
    p => p.cama?.habitacion?.area === 'DETOX' || p.areaDeseada === 'DETOX'
  ).length ?? 0;

  const tratamientoCount = internados?.filter(
    p => p.cama?.habitacion?.area !== 'DETOX' && p.areaDeseada !== 'DETOX'
  ).length ?? (stats?.ocupacion.internados ?? 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        .medico-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 25px -5px rgba(0,0,0,0.08) !important;
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '2.5rem',
        padding: '2rem 2.5rem',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        color: 'white',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
          opacity: 0.04,
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{
            backgroundColor: '#3b82f6',
            padding: '1rem',
            borderRadius: '16px',
            marginRight: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HeartPulse size={36} color="white" />
          </div>

          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
              Dashboard Médico
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, marginTop: '0.25rem', fontSize: '14px', fontWeight: '500' }}>
              Bienvenido,{' '}
              <span style={{ color: '#60a5fa', fontWeight: '700' }}>{usuario?.nombre}</span>
              {' '}— Vista clínica general
            </p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSolicitudOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.2rem', borderRadius: '14px',
                background: 'rgba(96,165,250,0.15)',
                border: '1px solid rgba(96,165,250,0.3)',
                color: '#93c5fd', fontWeight: '700', fontSize: '13px',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <Send size={14} /> Nueva Solicitud a Jefatura
            </button>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Área
              </div>
              <div style={{
                fontSize: '13px',
                background: 'rgba(96,165,250,0.15)',
                color: '#60a5fa',
                padding: '0.35rem 1rem',
                borderRadius: '100px',
                display: 'inline-block',
                marginTop: '0.4rem',
                fontWeight: '700',
                border: '1px solid rgba(96,165,250,0.25)',
              }}>
                {usuario?.rol?.replace('_', ' ') ?? 'MÉDICO'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem',
      }}>
        <StatCard
          title="Total de Pacientes"
          value={internados?.length ?? '—'}
          subtitle="Internados actualmente"
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="En Tratamiento"
          value={tratamientoCount}
          subtitle="Internados activos"
          icon={Activity}
          color="#10b981"
        />
        <StatCard
          title="En Desintoxicación"
          value={detoxCount}
          subtitle="Área DETOX activa"
          icon={HeartPulse}
          color="#8b5cf6"
        />
        <StatCard
          title="Valoraciones Pendientes"
          value={valoraciones?.length ?? stats?.admisiones.enProceso ?? 0}
          subtitle="Pacientes sin valorar"
          icon={TriangleAlert}
          color="#f59e0b"
          alert
          onClick={() => navigate('/medica/pacientes')}
        />
      </div>

      {/* CRONOGRAMA */}
      <div style={{ width: '100%' }}>
        <CronogramaActividades />
      </div>

      <NuevaSolicitudModal
        isOpen={solicitudOpen}
        onClose={() => setSolicitudOpen(false)}
        nombreUsuario={usuario?.nombre}
      />
    </div>
  );
}
