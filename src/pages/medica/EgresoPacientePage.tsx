import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ClipboardList, DollarSign, Package, Heart,
  CheckCircle, AlertTriangle, ArrowLeft, ArrowRight,
  Stethoscope, User, CalendarDays, BedDouble,
} from 'lucide-react';
import apiClient from '../../services/api';

// ── Tipos ────────────────────────────────────────────────────

type TipoEgreso = 'ALTA_MEDICA' | 'ALTA_VOLUNTARIA' | 'EXPULSION' | 'FUGA' | 'TRASLADO';

interface DatosEgreso {
  paciente: {
    id: number;
    claveUnica: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaIngreso: string | null;
    diasInternado: number | null;
    cama: { id: number; codigo: string; numero: string } | null;
  };
  finanzas: { totalPagado: number; totalCargos: number; saldoPendiente: number };
  pertenencias: { articulos: unknown[]; firmaRecibido: boolean } | null;
  yaInscritoReforzamiento: boolean;
}

interface FormState {
  tipoEgreso: TipoEgreso;
  notaMedica: string;
  pertenenciasEntregadas: boolean;
  inscribirReforzamiento: boolean;
  fechaInicioReforzamiento: string;
  fechaFinReforzamiento: string;
  observacionesReforzamiento: string;
}

// ── Constantes ───────────────────────────────────────────────

const TIPO_EGRESO_LABELS: Record<TipoEgreso, string> = {
  ALTA_MEDICA:     'Alta Médica — Completó el tratamiento',
  ALTA_VOLUNTARIA: 'Alta Voluntaria — El paciente decidió retirarse',
  EXPULSION:       'Expulsión — Retiro por sanción disciplinaria',
  FUGA:            'Fuga — Se retiró sin autorización del personal',
  TRASLADO:        'Traslado — Canalizado a otra institución',
};

const TIPO_EGRESO_COLORS: Record<TipoEgreso, string> = {
  ALTA_MEDICA:     '#16a34a',
  ALTA_VOLUNTARIA: '#2563eb',
  EXPULSION:       '#dc2626',
  FUGA:            '#b45309',
  TRASLADO:        '#7c3aed',
};

const STEPS = [
  { label: 'Evaluación Médica',      icon: Stethoscope },
  { label: 'Estado Financiero',      icon: DollarSign  },
  { label: 'Pertenencias',           icon: Package     },
  { label: 'Reforzamiento',          icon: Heart       },
];

const fmt = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const fmtFecha = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
const today = () => new Date().toISOString().split('T')[0];

// ── Componente principal ─────────────────────────────────────

export default function EgresoPacientePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pacienteId = parseInt(id!);

  const [step, setStep]   = useState(0);
  const [error, setError] = useState('');
  const [form, setForm]   = useState<FormState>({
    tipoEgreso:                 'ALTA_MEDICA',
    notaMedica:                 '',
    pertenenciasEntregadas:     false,
    inscribirReforzamiento:     false,
    fechaInicioReforzamiento:   today(),
    fechaFinReforzamiento:      '',
    observacionesReforzamiento: '',
  });

  const { data, isLoading, isError } = useQuery<DatosEgreso>({
    queryKey: ['egreso-datos', pacienteId],
    queryFn: () => apiClient.get(`/egreso/paciente/${pacienteId}/datos`).then(r => r.data.data),
  });

  const confirmar = useMutation({
    mutationFn: () => apiClient.post(`/egreso/paciente/${pacienteId}`, form),
    onSuccess: () => navigate('/medica', { state: { egresoExitoso: true } }),
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error al registrar el egreso'),
  });

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorCard onBack={() => navigate('/medica')} />;

  const { paciente, finanzas, pertenencias, yaInscritoReforzamiento } = data;

  // Validación por paso
  function canAdvance(): boolean {
    if (step === 0) return form.tipoEgreso !== '' && form.notaMedica.trim().length >= 10;
    if (step === 2) return true; // Pertenencias siempre puede avanzar (con o sin firma)
    return true;
  }

  function handleNext() {
    setError('');
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else confirmar.mutate();
  }

  function handleBack() {
    if (step === 0) navigate('/medica');
    else setStep(s => s - 1);
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* Header paciente */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px', padding: '1.75rem 2rem',
        marginBottom: '2rem', color: 'white', display: 'flex',
        alignItems: 'center', gap: '1.25rem',
      }}>
        <button
          onClick={() => navigate('/medica')}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ background: 'rgba(255,255,255,0.12)', padding: '0.75rem', borderRadius: '14px' }}>
          <User size={28} color="#93c5fd" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Proceso de Egreso</p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>
            #{paciente.claveUnica} · {paciente.nombre} {paciente.apellidoPaterno}
          </h1>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            {paciente.fechaIngreso && (
              <span style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CalendarDays size={14} /> Ingresó: {fmtFecha(paciente.fechaIngreso)}
                {paciente.diasInternado != null && ` (${paciente.diasInternado} días)`}
              </span>
            )}
            {paciente.cama && (
              <span style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BedDouble size={14} /> Cama: {paciente.cama.codigo ?? paciente.cama.numero}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '0' }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const color = active ? '#3b82f6' : done ? '#22c55e' : '#cbd5e1';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '80px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: active ? '#3b82f6' : done ? '#22c55e' : '#f1f5f9',
                  border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {done
                    ? <CheckCircle size={20} color="white" />
                    : <s.icon size={18} color={active ? 'white' : '#94a3b8'} />}
                </div>
                <span style={{ fontSize: '11px', fontWeight: active ? '700' : '500', color: active ? '#0f172a' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', backgroundColor: i < step ? '#22c55e' : '#e2e8f0', margin: '0 0.25rem', marginBottom: '1.5rem' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Tarjeta del paso actual */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', minHeight: '340px' }}>

        {/* ── Paso 1: Evaluación Médica ── */}
        {step === 0 && (
          <StepContainer title="Evaluación Médica de Egreso" icon={<Stethoscope size={22} color="#3b82f6" />}>
            <div>
              <label style={labelStyle}>Tipo de Egreso *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(Object.keys(TIPO_EGRESO_LABELS) as TipoEgreso[]).map(tipo => (
                  <label
                    key={tipo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.9rem 1rem', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${form.tipoEgreso === tipo ? TIPO_EGRESO_COLORS[tipo] : '#e2e8f0'}`,
                      backgroundColor: form.tipoEgreso === tipo ? `${TIPO_EGRESO_COLORS[tipo]}0d` : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="tipoEgreso"
                      value={tipo}
                      checked={form.tipoEgreso === tipo}
                      onChange={() => setForm(f => ({ ...f, tipoEgreso: tipo }))}
                      style={{ accentColor: TIPO_EGRESO_COLORS[tipo], width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: form.tipoEgreso === tipo ? '700' : '500', color: form.tipoEgreso === tipo ? TIPO_EGRESO_COLORS[tipo] : '#374151', fontSize: '14px' }}>
                      {TIPO_EGRESO_LABELS[tipo]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <label style={labelStyle}>Nota Médica de Egreso * <span style={{ color: '#94a3b8', fontWeight: '400', textTransform: 'none' }}>(mínimo 10 caracteres)</span></label>
              <textarea
                value={form.notaMedica}
                onChange={e => setForm(f => ({ ...f, notaMedica: e.target.value }))}
                rows={5}
                placeholder="Resumen del estado clínico al egreso, evolución durante el tratamiento, recomendaciones al alta..."
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </StepContainer>
        )}

        {/* ── Paso 2: Estado Financiero ── */}
        {step === 1 && (
          <StepContainer title="Estado Financiero al Egreso" icon={<DollarSign size={22} color="#16a34a" />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <FinCard label="Total Cargos" value={fmt(finanzas.totalCargos)} color="#dc2626" />
              <FinCard label="Total Pagado" value={fmt(finanzas.totalPagado)} color="#16a34a" />
              <FinCard
                label="Saldo Pendiente"
                value={fmt(finanzas.saldoPendiente)}
                color={finanzas.saldoPendiente > 0 ? '#b45309' : '#16a34a'}
                highlight
              />
            </div>
            {finanzas.saldoPendiente > 0 ? (
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: '700', color: '#92400e', fontSize: '14px' }}>Saldo pendiente de {fmt(finanzas.saldoPendiente)}</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#78350f' }}>
                    El paciente tiene adeudo vigente. El egreso puede registrarse, pero el saldo quedará como deuda pendiente de liquidar.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CheckCircle size={20} color="#16a34a" />
                <p style={{ margin: 0, fontWeight: '600', color: '#15803d', fontSize: '14px' }}>Cuenta al corriente — sin saldo pendiente</p>
              </div>
            )}
          </StepContainer>
        )}

        {/* ── Paso 3: Devolución de Pertenencias ── */}
        {step === 2 && (
          <StepContainer title="Devolución de Pertenencias Personales" icon={<Package size={22} color="#7c3aed" />}>
            {pertenencias && Array.isArray(pertenencias.articulos) && pertenencias.articulos.length > 0 ? (
              <>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1rem' }}>
                  Los siguientes artículos fueron registrados al ingreso del paciente y deben ser devueltos a la persona responsable:
                </p>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Artículo</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pertenencias.articulos as Array<{ nombre?: string; descripcion?: string; cantidad?: number; qty?: number }>).map((art, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '14px', color: '#0f172a' }}>{art.nombre ?? art.descripcion ?? `Artículo ${i + 1}`}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '14px', color: '#475569' }}>{art.cantidad ?? art.qty ?? 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                <Package size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>No se registraron pertenencias al ingreso del paciente</p>
              </div>
            )}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer',
              border: `2px solid ${form.pertenenciasEntregadas ? '#16a34a' : '#e2e8f0'}`,
              backgroundColor: form.pertenenciasEntregadas ? '#f0fdf4' : '#f8fafc',
              transition: 'all 0.15s',
            }}>
              <input
                type="checkbox"
                checked={form.pertenenciasEntregadas}
                onChange={e => setForm(f => ({ ...f, pertenenciasEntregadas: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
              />
              <span style={{ fontWeight: '600', color: form.pertenenciasEntregadas ? '#15803d' : '#374151', fontSize: '14px' }}>
                Confirmo que las pertenencias personales fueron entregadas al paciente o a su familiar responsable
              </span>
            </label>
          </StepContainer>
        )}

        {/* ── Paso 4: Programa de Reforzamiento ── */}
        {step === 3 && (
          <StepContainer title="Programa de Reforzamiento Post-Egreso" icon={<Heart size={22} color="#ec4899" />}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.25rem' }}>
              El Programa de Reforzamiento da seguimiento al paciente una vez que egresa de la institución, a través de sesiones periódicas de apoyo y evaluación.
            </p>
            {yaInscritoReforzamiento && (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle size={16} color="#2563eb" />
                <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8', fontWeight: '600' }}>El paciente ya está inscrito en un programa. Se actualizarán las fechas si registras uno nuevo.</p>
              </div>
            )}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer', marginBottom: '1.25rem',
              border: `2px solid ${form.inscribirReforzamiento ? '#ec4899' : '#e2e8f0'}`,
              backgroundColor: form.inscribirReforzamiento ? '#fdf2f8' : '#f8fafc',
              transition: 'all 0.15s',
            }}>
              <input
                type="checkbox"
                checked={form.inscribirReforzamiento}
                onChange={e => setForm(f => ({ ...f, inscribirReforzamiento: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#ec4899' }}
              />
              <span style={{ fontWeight: '600', color: form.inscribirReforzamiento ? '#9d174d' : '#374151', fontSize: '14px' }}>
                Inscribir al Programa de Reforzamiento
              </span>
            </label>
            {form.inscribirReforzamiento && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Fecha de Inicio *</label>
                    <input type="date" value={form.fechaInicioReforzamiento} onChange={e => setForm(f => ({ ...f, fechaInicioReforzamiento: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha Fin Estimada *</label>
                    <input type="date" value={form.fechaFinReforzamiento} min={form.fechaInicioReforzamiento} onChange={e => setForm(f => ({ ...f, fechaFinReforzamiento: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Observaciones del programa</label>
                  <textarea
                    value={form.observacionesReforzamiento}
                    onChange={e => setForm(f => ({ ...f, observacionesReforzamiento: e.target.value }))}
                    rows={3}
                    placeholder="Objetivos, frecuencia de sesiones, indicaciones especiales..."
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            )}
          </StepContainer>
        )}
      </div>

      {/* Error global */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '0.875rem 1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertTriangle size={16} color="#dc2626" />
          <p style={{ margin: 0, color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>{error}</p>
        </div>
      )}

      {/* Confirmación final antes de enviar */}
      {step === STEPS.length - 1 && (
        <div style={{ backgroundColor: '#fef9c3', border: '1px solid #fde047', borderRadius: '14px', padding: '1rem 1.25rem', marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color="#a16207" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ margin: 0, fontWeight: '700', color: '#713f12', fontSize: '14px' }}>Acción irreversible</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#78350f' }}>
              Al confirmar el egreso, el paciente pasará al estado <strong>EGRESADO</strong>, la cama quedará liberada y no se podrán revertir estos cambios desde el sistema.
            </p>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem' }}>
        <button onClick={handleBack} style={cancelBtnStyle}>
          <ArrowLeft size={16} /> {step === 0 ? 'Cancelar' : 'Anterior'}
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvance() || confirmar.isPending}
          style={{
            ...nextBtnStyle,
            opacity: !canAdvance() || confirmar.isPending ? 0.5 : 1,
            cursor: !canAdvance() || confirmar.isPending ? 'not-allowed' : 'pointer',
            backgroundColor: step === STEPS.length - 1 ? '#dc2626' : '#3b82f6',
          }}
        >
          {confirmar.isPending
            ? 'Procesando...'
            : step === STEPS.length - 1
              ? 'Confirmar Egreso'
              : 'Siguiente'}
          {!confirmar.isPending && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────────

function StepContainer({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '10px' }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FinCard({ label, value, color, highlight }: { label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: '1.25rem', borderRadius: '14px',
      border: `1px solid ${highlight ? color + '50' : '#e2e8f0'}`,
      backgroundColor: highlight ? `${color}08` : '#f8fafc',
    }}>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '22px', fontWeight: '800', color }}>{value}</p>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', color: '#64748b', fontSize: '14px' }}>
      Cargando datos del paciente...
    </div>
  );
}

function ErrorCard({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
      <p style={{ color: '#64748b' }}>No se pudieron cargar los datos del paciente o el paciente no está internado.</p>
      <button onClick={onBack} style={{ ...cancelBtnStyle, margin: '1rem auto 0' }}>Regresar</button>
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '700',
  color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #e2e8f0',
  borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#0f172a',
};

const cancelBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.75rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px',
  backgroundColor: 'white', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
};

const nextBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.75rem 1.75rem', border: 'none', borderRadius: '12px',
  color: 'white', fontSize: '14px', fontWeight: '700',
};
