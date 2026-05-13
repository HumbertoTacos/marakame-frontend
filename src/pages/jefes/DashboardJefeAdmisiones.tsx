import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Users, Clock, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/api';

interface Paciente {
  id: number;
  estado: string;
}

interface PrimerContacto {
  id: number;
  acuerdoSeguimiento?: string;
  fechaAcuerdo?: string;
  dispuestoInternarse?: string;
}

const ACUERDO_LABEL: Record<string, string> = {
  POSIBLE_INGRESO:  'Posible Ingreso',
  ESPERAR_VISITA:   'Esperar Visita',
  LLAMARLE:         'Llamar al Paciente',
  ESPERAR_LLAMADA:  'Esperar Llamada',
  CITA_PROGRAMADA:  'Cita Programada',
  RECHAZADO:        'Rechazado',
  OTRO:             'Otro',
};

const DashboardJefeAdmisiones: React.FC = () => {
  const { data: pacientes = [], isLoading: loadingPac } = useQuery<Paciente[]>({
    queryKey: ['pacientes_jefe_admisiones'],
    queryFn: () => apiClient.get('/pacientes').then(r => r.data.data).catch(() => []),
  });

  const { data: prospectos = [], isLoading: loadingPros } = useQuery<PrimerContacto[]>({
    queryKey: ['prospectos_jefe_admisiones'],
    queryFn: () => apiClient.get('/admisiones/primer-contacto').then(r => r.data.data).catch(() => []),
  });

  const totalProspectos = prospectos.length;
  const enValoracion    = pacientes.filter(p => p.estado === 'EN_VALORACION').length;
  const internados      = pacientes.filter(p => p.estado === 'INTERNADO').length;
  const rechazados      = prospectos.filter(p => p.acuerdoSeguimiento === 'RECHAZADO').length;
  const convertibles    = totalProspectos - rechazados;
  const tasaConversion  = convertibles > 0 ? Math.round((internados / convertibles) * 100) : 0;

  // Distribución de prospectos por tipo de acuerdo
  const conteoAcuerdos = prospectos.reduce<Record<string, number>>((acc, p) => {
    const key = p.acuerdoSeguimiento || 'OTRO';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ backgroundColor: '#eff6ff', padding: '0.85rem', borderRadius: '16px' }}>
          <ClipboardList size={26} color="#1d4ed8" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>Panel del Jefe de Admisiones</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Resumen del embudo de admisiones y desempeño del equipo de primer contacto.</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard icon={<Users size={20} color="#1d4ed8" />}   label="Prospectos totales"  value={loadingPros ? '—' : String(totalProspectos)} subtitle={`${rechazados} rechazados`} bg="#eff6ff" />
        <KpiCard icon={<Clock size={20} color="#f59e0b" />}   label="En valoración"       value={loadingPac ? '—' : String(enValoracion)}   subtitle="pendientes de ingreso" bg="#fffbeb" />
        <KpiCard icon={<CheckCircle2 size={20} color="#059669" />} label="Internados" value={loadingPac ? '—' : String(internados)}    subtitle="ya ingresados al centro" bg="#ecfdf5" />
        <KpiCard icon={<CheckCircle2 size={20} color="#7c3aed" />} label="Tasa de conversión" value={`${tasaConversion}%`} subtitle="prospectos → ingreso" bg="#f5f3ff" />
      </div>

      {/* Distribución de prospectos */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2rem', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Prospectos por tipo de acuerdo</h2>
        {loadingPros ? (
          <p style={{ color: '#94a3b8', fontWeight: '600' }}>Cargando…</p>
        ) : Object.keys(conteoAcuerdos).length === 0 ? (
          <p style={{ color: '#94a3b8', fontWeight: '600' }}>Sin registros.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(conteoAcuerdos).map(([acuerdo, n]) => (
              <div key={acuerdo} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 1rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{ACUERDO_LABEL[acuerdo] || acuerdo}</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8' }}>{n}</span>
              </div>
            ))}
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

export default DashboardJefeAdmisiones;
