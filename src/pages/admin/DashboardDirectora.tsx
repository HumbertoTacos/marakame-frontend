import { useQuery } from '@tanstack/react-query';
import {
  Activity, Users, TrendingUp, AlertTriangle,
  BedDouble, DollarSign, ShoppingCart, Banknote,
  PackageOpen, UserCheck, BarChart3, Heart,
  ArrowUpRight, Stethoscope, Building2, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

// ── Tipos ────────────────────────────────────────────────────

interface DirectoraData {
  kpis: {
    internados: number;
    capacidadTotal: number;
    ocupacionPct: number;
    prospectos: number;
    enValoracion: number;
    pendienteIngreso: number;
    egresadosMes: number;
    ingresosMes30d: number;
    totalHistorico: number;
  };
  finanzas: {
    cobrosMes: number;
    saldoPendiente: number;
  };
  alertas: {
    productosCriticos: number;
    productosBajos: number;
    comprasPendientes: number;
    nominasPendientes: number;
  };
  ocupacionAreas: Record<string, { ocupadas: number; total: number }>;
  staffPorRol: Record<string, number>;
}

// ── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const ROL_LABELS: Record<string, string> = {
  AREA_MEDICA:   'Área Médica',
  ENFERMERIA:    'Enfermería',
  NUTRICION:     'Nutrición',
  PSICOLOGIA:    'Psicología',
  RRHH_FINANZAS: 'RRHH / Finanzas',
  ADMISIONES:    'Admisiones',
  ALMACEN:       'Almacén',
  ADMIN_GENERAL: 'Administración',
};

const AREA_LABELS: Record<string, { label: string; color: string }> = {
  HOMBRES: { label: 'Área Hombres',  color: '#3b82f6' },
  MUJERES: { label: 'Área Mujeres',  color: '#ec4899' },
  DETOX:   { label: 'Área Detox',    color: '#f59e0b' },
};

// ── Subcomponentes ───────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, onClick, urgent,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; onClick?: () => void; urgent?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        border: urgent ? `1px solid ${color}55` : '1px solid #f1f5f9',
        borderRadius: '20px', padding: '1.5rem 1.75rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '110px', height: '110px', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '34px', fontWeight: '900', color: urgent ? color : '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{sub}</p>}
        </div>
        <div style={{ backgroundColor: `${color}15`, padding: '0.85rem', borderRadius: '14px', flexShrink: 0 }}>
          <Icon size={26} color={color} />
        </div>
      </div>
      {onClick && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '1rem', fontSize: '12px', fontWeight: '700', color: color }}>
          Ver detalle <ArrowUpRight size={13} />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, color = '#64748b' }: { children: React.ReactNode; color?: string }) {
  return (
    <h2 style={{ fontSize: '13px', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {children}
    </h2>
  );
}

// ── Componente principal ─────────────────────────────────────

export default function DashboardDirectora() {
  const navigate = useNavigate();

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useQuery<DirectoraData>({
    queryKey: ['dashboard_directora'],
    queryFn: () => apiClient.get('/dashboard/directora').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const totalAlertas = data
    ? data.alertas.productosCriticos + data.alertas.comprasPendientes + data.alertas.nominasPendientes
    : 0;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>

      {/* ── Cabecera ejecutiva ── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px', padding: '2.5rem 3rem', marginBottom: '2.5rem',
        position: 'relative', overflow: 'hidden', color: '#0f172a',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid #f1f5f9',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', background: 'radial-gradient(circle, #fef2f2 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '40%', width: '180px', height: '180px', background: 'radial-gradient(circle, #fef2f2 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ backgroundColor: '#fef2f2', padding: '0.85rem', borderRadius: '16px', border: '1px solid #fee2e2' }}>
                <Building2 size={28} color="#dc2626" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Panel Ejecutivo</p>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', color: '#0f172a' }}>Instituto Marakame</h1>
              </div>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
              Resumen operativo del centro de rehabilitación
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
            {/* Último actualizado */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
              {dataUpdatedAt ? `Actualizado ${new Date(dataUpdatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : 'Actualizar'}
            </button>

            {/* Alerta de ítems críticos */}
            {totalAlertas > 0 && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={14} color="#fca5a5" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fca5a5' }}>{totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''} pendiente{totalAlertas !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de ocupación general */}
        {data && (
          <div style={{ marginTop: '2rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Ocupación General — {data.kpis.internados} / {data.kpis.capacidadTotal} camas
              </span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: data.kpis.ocupacionPct > 90 ? '#fca5a5' : data.kpis.ocupacionPct > 70 ? '#fde68a' : '#86efac' }}>
                {data.kpis.ocupacionPct}%
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '100px',
                width: `${Math.min(data.kpis.ocupacionPct, 100)}%`,
                background: data.kpis.ocupacionPct > 90
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : data.kpis.ocupacionPct > 70
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando datos ejecutivos...</div>
      ) : data ? (
        <>
          {/* ── SECCIÓN 1: KPIs clínicos ── */}
          <div style={{ marginBottom: '2.5rem' }}>
            <SectionTitle color="#dc2626"><Stethoscope size={14} /> Estado Clínico del Centro</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
              <KpiCard
                label="Pacientes Internados"
                value={data.kpis.internados}
                sub={`de ${data.kpis.capacidadTotal} camas — ${data.kpis.ocupacionPct}% ocupación`}
                icon={BedDouble}
                color="#3b82f6"
                onClick={() => navigate('/medica')}
              />
              <KpiCard
                label="Prospectos Activos"
                value={data.kpis.prospectos}
                sub="Primer contacto registrado"
                icon={Users}
                color="#8b5cf6"
                onClick={() => navigate('/admisiones/seguimiento')}
              />
              <KpiCard
                label="En Valoración"
                value={data.kpis.enValoracion}
                sub="Evaluación diagnóstica en curso"
                icon={Activity}
                color="#f59e0b"
                onClick={() => navigate('/admisiones/seguimiento')}
              />
              <KpiCard
                label="Ingresos (30 días)"
                value={data.kpis.ingresosMes30d}
                sub="Pacientes admitidos al tratamiento"
                icon={TrendingUp}
                color="#22c55e"
              />
              <KpiCard
                label="Egresos del Mes"
                value={data.kpis.egresadosMes}
                sub="Pacientes egresados este mes"
                icon={Heart}
                color="#10b981"
              />
              <KpiCard
                label="Total Histórico"
                value={data.kpis.totalHistorico}
                sub="Pacientes registrados en el sistema"
                icon={UserCheck}
                color="#6366f1"
              />
            </div>
          </div>

          {/* ── SECCIÓN 2: Pipeline admisiones + Ocupación por área ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>

            {/* Pipeline de admisión */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.75rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <SectionTitle color="#dc2626"><Users size={14} /> Pipeline de Admisión</SectionTitle>
              {[
                { label: 'Primer Contacto / Prospecto', value: data.kpis.prospectos,         color: '#8b5cf6', pct: data.kpis.prospectos },
                { label: 'En Valoración Diagnóstica',   value: data.kpis.enValoracion,       color: '#f59e0b', pct: data.kpis.enValoracion },
                { label: 'Pendiente de Ingreso',        value: data.kpis.pendienteIngreso,   color: '#3b82f6', pct: data.kpis.pendienteIngreso },
                { label: 'Internados Activos',          value: data.kpis.internados,         color: '#22c55e', pct: data.kpis.internados },
              ].map(row => {
                const max = Math.max(data.kpis.prospectos, data.kpis.enValoracion, data.kpis.pendienteIngreso, data.kpis.internados, 1);
                return (
                  <div key={row.label} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>{row.label}</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: row.color }}>{row.value}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(row.pct / max) * 100}%`, backgroundColor: row.color, borderRadius: '100px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ocupación por área */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.75rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <SectionTitle color="#dc2626"><BedDouble size={14} /> Ocupación por Área</SectionTitle>
              {Object.entries(data.ocupacionAreas).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '2rem 0' }}>Sin datos de áreas registradas</p>
              ) : (
                Object.entries(data.ocupacionAreas).map(([area, { ocupadas, total }]) => {
                  const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
                  const cfg = AREA_LABELS[area] ?? { label: area, color: '#64748b' };
                  return (
                    <div key={area} style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cfg.color }} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>{cfg.label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: cfg.color }}>
                          {ocupadas}/{total} camas ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: cfg.color, borderRadius: '100px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── SECCIÓN 3: Finanzas + Personal ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>

            {/* Indicadores financieros */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.75rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <SectionTitle color="#dc2626"><DollarSign size={14} /> Indicadores Financieros</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Cobros del mes',     value: fmt(data.finanzas.cobrosMes),      color: '#16a34a', icon: TrendingUp },
                  { label: 'Adeudos pendientes',  value: fmt(data.finanzas.saldoPendiente), color: data.finanzas.saldoPendiente > 0 ? '#dc2626' : '#16a34a', icon: AlertTriangle },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <row.icon size={16} color={row.color} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div
                  onClick={() => navigate('/autorizacion-compras')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: data.alertas.comprasPendientes > 0 ? '#fff7ed' : '#f8fafc', borderRadius: '14px', border: `1px solid ${data.alertas.comprasPendientes > 0 ? '#fed7aa' : '#f1f5f9'}`, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShoppingCart size={16} color="#f59e0b" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Compras pendientes de autorización</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>{data.alertas.comprasPendientes}</span>
                    <ArrowUpRight size={13} color="#f59e0b" />
                  </div>
                </div>
                <div
                  onClick={() => navigate('/nominas')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: data.alertas.nominasPendientes > 0 ? '#f0fdf4' : '#f8fafc', borderRadius: '14px', border: `1px solid ${data.alertas.nominasPendientes > 0 ? '#86efac' : '#f1f5f9'}`, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Banknote size={16} color="#22c55e" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Nóminas en borrador</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#22c55e' }}>{data.alertas.nominasPendientes}</span>
                    <ArrowUpRight size={13} color="#22c55e" />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal activo por área */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.75rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <SectionTitle color="#dc2626"><BarChart3 size={14} /> Personal Activo</SectionTitle>
                <button
                  onClick={() => navigate('/usuarios')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', fontWeight: '700', color: '#dc2626', background: '#fef2f2', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Gestionar <ArrowUpRight size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {Object.entries(data.staffPorRol)
                  .filter(([rol]) => rol !== 'ADMIN_GENERAL')
                  .sort(([, a], [, b]) => b - a)
                  .map(([rol, count]) => (
                    <div key={rol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.9rem', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{ROL_LABELS[rol] ?? rol}</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', backgroundColor: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{count}</span>
                    </div>
                  ))}
                {Object.keys(data.staffPorRol).filter(r => r !== 'ADMIN_GENERAL').length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '1.5rem 0' }}>Sin usuarios registrados</p>
                )}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: Alertas operativas ── */}
          {(data.alertas.productosCriticos > 0 || data.alertas.productosBajos > 0) && (
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.75rem', border: '1px solid #fee2e2', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '2.5rem' }}>
              <SectionTitle color="#dc2626"><AlertTriangle size={14} /> Alertas de Inventario</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div
                  onClick={() => navigate('/almacen')}
                  style={{ padding: '1.25rem', backgroundColor: '#fef2f2', borderRadius: '14px', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <PackageOpen size={20} color="#dc2626" />
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>Productos en nivel CRÍTICO</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#dc2626' }}>Requieren reposición inmediata</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>{data.alertas.productosCriticos}</span>
                </div>
                <div
                  onClick={() => navigate('/almacen')}
                  style={{ padding: '1.25rem', backgroundColor: '#fff7ed', borderRadius: '14px', border: '1px solid #fed7aa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <PackageOpen size={20} color="#ea580c" />
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#9a3412' }}>Productos con stock BAJO</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#ea580c' }}>Por debajo del mínimo operativo</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '28px', fontWeight: '900', color: '#ea580c' }}>{data.alertas.productosBajos}</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
