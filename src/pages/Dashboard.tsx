import { useQuery } from '@tanstack/react-query';
import {
  Activity, Users, TriangleAlert, PackageOpen, LayoutDashboard,
  ShoppingCart, Banknote, HeartPulse,
  Apple, Scale, Utensils, Brain, MessageSquare, HeartHandshake, UserX, ClipboardList,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';

interface WidgetProps {
  title: string;
  value: string | number | undefined;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  alert?: boolean;
  onClick?: () => void;
}

const Widget = ({ title, value, subValue, icon: Icon, color, alert, onClick }: WidgetProps) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      padding: '1.75rem',
      borderRadius: 'var(--radius-lg)',
      border: alert ? `1px solid ${color}55` : '1px solid var(--glass-border)',
      boxShadow: onClick ? '0 10px 25px -5px rgba(0,0,0,0.05)' : 'var(--shadow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}
    className="widget-hover"
  >
    <div style={{ position: 'relative', zIndex: 1 }}>
      <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '700', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
      <h2 style={{ fontSize: '36px', fontWeight: '800', color: alert ? color : 'var(--text-h)', margin: 0, letterSpacing: '-1px' }}>{value}</h2>
      {subValue && <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '0.5rem', fontWeight: '500' }}>{subValue}</p>}
    </div>
    <div style={{
      backgroundColor: `${color}15`,
      color: color,
      padding: '1rem',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1
    }}>
      <Icon size={32} />
    </div>
    <div style={{
      position: 'absolute', top: '-20%', right: '-10%',
      width: '120px', height: '120px',
      background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
      zIndex: 0
    }} />
  </div>
);

const SectionHeader = ({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) => (
  <h3 style={{ fontSize: '18px', color: '#4a5568', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Icon size={20} color={color} /> {label}
  </h3>
);

const WELCOME_SUBTITLES: Record<string, string> = {
  NUTRICION:     'Revisa el estado nutricional y los planes de los pacientes internados.',
  PSICOLOGIA:    'Gestiona las sesiones clínicas de psicología, consejería y familia.',
  AREA_MEDICA:   'Monitorea el estado clínico y la evolución de los pacientes.',
  ENFERMERIA:    'Gestiona los signos vitales y cuidados de los pacientes.',
  ADMISIONES:    'Administra el proceso de admisión de nuevos candidatos.',
  ALMACEN:       'Controla el inventario y los suministros de la clínica.',
  RRHH_FINANZAS: 'Gestiona nóminas, compras y operaciones financieras.',
  ADMIN_GENERAL: 'Panel de control operativo completo de Marakame.',
};

export function Dashboard() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: () => apiClient.get('/dashboard').then(res => res.data.data),
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando panel de control...</div>;
  }

  const rol = usuario?.rol ?? '';
  const esAdmin      = rol === 'ADMIN_GENERAL';
  const esMedico     = ['AREA_MEDICA', 'NUTRICION', 'PSICOLOGIA', 'ENFERMERIA'].includes(rol);
  const esNutricion  = rol === 'NUTRICION';
  const esPsicologia = rol === 'PSICOLOGIA';
  const esOperativo  = ['ALMACEN', 'RRHH_FINANZAS', 'ADMISIONES'].includes(rol);

  const subtitle = WELCOME_SUBTITLES[rol] ?? 'Te presentamos el resumen operativo de Marakame para hoy.';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* Cabecera de Bienvenida */}
      <div style={{
        display: 'flex', alignItems: 'center', marginBottom: '3rem',
        padding: '2.5rem',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 'var(--radius-xl)', color: 'white',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.05 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', backgroundColor: 'white', padding: '1.25rem', borderRadius: '20px', marginRight: '1.5rem' }}>
            <LayoutDashboard size={40} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
              Hola, {usuario?.nombre}
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, marginTop: '0.4rem', fontSize: '16px', fontWeight: '500' }}>
              {subtitle}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Rol Actual</div>
            <div style={{
              fontSize: '13px', background: 'rgba(96,165,250,0.2)', color: '#60a5fa',
              padding: '0.4rem 1rem', borderRadius: '100px', display: 'inline-block',
              marginTop: '0.5rem', fontWeight: '700', border: '1px solid rgba(96,165,250,0.3)'
            }}>
              {rol.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .widget-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          background-color: rgba(255,255,255,0.9) !important;
        }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
      `}</style>

      {/* ── CTA NUTRICIÓN / PSICOLOGÍA ── */}
      {(esNutricion || esPsicologia) && (() => {
        const cfg = esNutricion
          ? { color: '#d97706', bg: 'linear-gradient(135deg,#d97706,#b45309)', icon: Apple,  label: 'Ver Expedientes de Pacientes', sub: 'Accede al plan nutricional de cada paciente internado', route: '/medica' }
          : { color: '#7c3aed', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', icon: Brain,  label: 'Ver Expedientes de Pacientes', sub: 'Accede a las sesiones clínicas de psicología, consejería y familia', route: '/medica' };
        return (
          <div
            className="cta-btn"
            onClick={() => navigate(cfg.route)}
            style={{
              background: cfg.bg, borderRadius: '20px', padding: '1.75rem 2.25rem',
              marginBottom: '2.5rem', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', cursor: 'pointer',
              boxShadow: `0 8px 24px -4px ${cfg.color}55`,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '14px', borderRadius: '16px' }}>
                <cfg.icon size={28} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white' }}>{cfg.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{cfg.sub}</p>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px' }}>
              <ArrowRight size={24} color="white" />
            </div>
          </div>
        );
      })()}

      {/* ── ESTADO DE LA CLÍNICA (Admin + todos los roles médicos) ── */}
      {(esAdmin || esMedico) && (
        <>
          <SectionHeader icon={HeartPulse} label="Estado de la Clínica" color="#3182ce" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <Widget
              title="Ocupación de Camas"
              value={`${stats?.ocupacion.porcentaje}%`}
              subValue={`${stats?.ocupacion.internados} de ${stats?.ocupacion.capacidad} camas disponibles`}
              icon={Activity}
              color={stats?.ocupacion.porcentaje > 90 ? '#e53e3e' : '#3182ce'}
              onClick={() => navigate('/dashboard')}
            />
            {!esNutricion && !esPsicologia && (
              <Widget
                title="Admisiones en Proceso"
                value={stats?.admisiones.enProceso}
                subValue="Candidatos en valoración o estudio socioeconómico"
                icon={Users}
                color="#ed8936"
                onClick={() => navigate('/admisiones/ingreso')}
              />
            )}
          </div>
        </>
      )}

      {/* ── NUTRICIÓN ── */}
      {(esAdmin || esNutricion) && (
        <>
          <SectionHeader icon={Apple} label="Área Nutricional" color="#d97706" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <Widget
              title="Sin Plan Nutricional"
              value={stats?.nutricion.sinPlan}
              subValue="Pacientes internados sin evaluación nutricional"
              icon={UserX}
              color="#e53e3e"
              alert={(stats?.nutricion.sinPlan ?? 0) > 0}
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Planes Registrados"
              value={stats?.nutricion.totalPlanes}
              subValue="Planes nutricionales activos en el expediente"
              icon={Apple}
              color="#d97706"
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Sobrepeso u Obesidad"
              value={stats?.nutricion.conSobrepesoObesidad}
              subValue="Pacientes con IMC ≥ 25 registrado"
              icon={Scale}
              color="#dd6b20"
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Con Restricciones"
              value={stats?.nutricion.conRestricciones}
              subValue="Planes con alergias o restricciones dietéticas"
              icon={Utensils}
              color="#0891b2"
              onClick={() => navigate('/medica')}
            />
          </div>
        </>
      )}

      {/* ── PSICOLOGÍA ── */}
      {(esAdmin || esPsicologia) && (
        <>
          <SectionHeader icon={Brain} label="Área de Psicología" color="#7c3aed" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <Widget
              title="Sesiones (7 días)"
              value={stats?.psicologia.sesiones7d}
              subValue="Total de sesiones registradas esta semana"
              icon={ClipboardList}
              color="#7c3aed"
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Psicología"
              value={stats?.psicologia.psicologia}
              subValue="Sesiones individuales de psicología esta semana"
              icon={Brain}
              color="#8b5cf6"
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Consejería"
              value={stats?.psicologia.consejeria}
              subValue="Sesiones de consejería terapéutica esta semana"
              icon={MessageSquare}
              color="#ec4899"
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Sesiones Familiares"
              value={stats?.psicologia.familia}
              subValue="Sesiones del programa familiar esta semana"
              icon={HeartHandshake}
              color="#f97316"
              onClick={() => navigate('/medica')}
            />
            <Widget
              title="Sin 1ª Sesión Psicológica"
              value={stats?.psicologia.sinPrimeraSesion}
              subValue="Internados sin sesión de psicología registrada"
              icon={UserX}
              color="#e53e3e"
              alert={(stats?.psicologia.sinPrimeraSesion ?? 0) > 0}
              onClick={() => navigate('/medica')}
            />
          </div>
        </>
      )}

      {/* ── ALERTAS OPERATIVAS (Admin + operativos) ── */}
      {(esAdmin || esOperativo) && (
        <>
          <SectionHeader icon={TriangleAlert} label="Alertas Operativas y Administrativas" color="#e53e3e" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Widget
              title="Inventario Crítico"
              value={stats?.almacen.criticos}
              subValue={`+${stats?.almacen.bajos} productos con stock bajo`}
              icon={PackageOpen}
              color="#e53e3e"
              onClick={() => navigate('/almacen')}
            />
            {(esAdmin || rol === 'RRHH_FINANZAS') && (
              <>
                <Widget
                  title="Compras Pendientes"
                  value={stats?.operaciones.comprasAutorizacion}
                  subValue="Requisiciones esperando VoBo Directivo"
                  icon={ShoppingCart}
                  color="#dd6b20"
                  onClick={() => navigate('/compras')}
                />
                <Widget
                  title="Nóminas Abiertas"
                  value={stats?.operaciones.nominasBorrador}
                  subValue="A la espera de captura de incidencias"
                  icon={Banknote}
                  color="#38a169"
                  onClick={() => navigate('/rrhh-nominas')}
                />
              </>
            )}
          </div>
        </>
      )}

    </div>
  );
}
