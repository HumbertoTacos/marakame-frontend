import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Users, ClipboardCheck, Activity } from 'lucide-react';
import apiClient from '../../services/api';

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  rol: string;
  activo: boolean;
}

interface Paciente {
  id: number;
  estado: string;
}

const ROL_COLOR: Record<string, string> = {
  ENFERMERIA: '#0891b2',
  PSICOLOGIA: '#7c3aed',
  NUTRICION:  '#059669',
  AREA_MEDICA:'#3b82f6',
  JEFE_MEDICO:'#1d4ed8',
};

const ROL_LABEL: Record<string, string> = {
  ENFERMERIA: 'Enfermería',
  PSICOLOGIA: 'Psicología',
  NUTRICION:  'Nutrición',
  AREA_MEDICA:'Médicos',
  JEFE_MEDICO:'Jefatura Médica',
};

const DashboardJefeClinico: React.FC = () => {
  const { data: equipo = [], isLoading: loadingEquipo } = useQuery<Usuario[]>({
    queryKey: ['equipo_clinico_jefe'],
    queryFn: () => apiClient.get('/usuarios/personal-clinico').then(r => r.data.data).catch(() => []),
  });

  const { data: pacientes = [] } = useQuery<Paciente[]>({
    queryKey: ['pacientes_jefe_clinico'],
    queryFn: () => apiClient.get('/pacientes').then(r => r.data.data).catch(() => []),
  });

  const totalEquipo = equipo.length;
  const activos = equipo.filter(u => u.activo).length;
  const internados = pacientes.filter(p => p.estado === 'INTERNADO').length;
  const enValoracion = pacientes.filter(p => p.estado === 'EN_VALORACION').length;

  // Distribución por rol (excluyendo jefe médico para no duplicar con su panel)
  const conteoPorRol = equipo.reduce<Record<string, number>>((acc, u) => {
    if (u.rol === 'JEFE_MEDICO') return acc;
    acc[u.rol] = (acc[u.rol] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ backgroundColor: '#ecfdf5', padding: '0.85rem', borderRadius: '16px' }}>
          <Stethoscope size={26} color="#059669" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>Panel del Jefe Clínico</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Resumen del equipo clínico (Enfermería, Psicología, Nutrición) y pacientes bajo atención.</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard icon={<Users size={20} color="#0891b2" />} label="Equipo total" value={loadingEquipo ? '—' : String(totalEquipo)} subtitle={`${activos} activos`} bg="#ecfeff" />
        <KpiCard icon={<Activity size={20} color="#059669" />} label="Pacientes internados" value={String(internados)} subtitle="bajo cuidado clínico" bg="#ecfdf5" />
        <KpiCard icon={<ClipboardCheck size={20} color="#7c3aed" />} label="En valoración" value={String(enValoracion)} subtitle="pendientes de ingreso" bg="#f5f3ff" />
      </div>

      {/* Distribución del equipo por rol */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2rem', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Distribución del equipo</h2>
        {loadingEquipo ? (
          <p style={{ color: '#94a3b8', fontWeight: '600' }}>Cargando…</p>
        ) : Object.keys(conteoPorRol).length === 0 ? (
          <p style={{ color: '#94a3b8', fontWeight: '600' }}>Sin registros.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(conteoPorRol).map(([rol, n]) => {
              const color = ROL_COLOR[rol] || '#64748b';
              return (
                <div key={rol} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 1rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{ROL_LABEL[rol] || rol}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color }}>{n}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subtitle: string; bg: string }> = ({ icon, label, value, subtitle, bg }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
      <div style={{ backgroundColor: bg, padding: '0.55rem', borderRadius: '12px' }}>{icon}</div>
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
    <p style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{value}</p>
    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{subtitle}</p>
  </div>
);

export default DashboardJefeClinico;
