import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, CheckCircle, FileText, Download } from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { generarExpedientePDF } from '../../utils/expedientePDF';
import type { Paciente, HistoriaClinica } from '../../types';

const EMPTY_HISTORIA: HistoriaClinica = {
  estadoCivil: '', religion: '', lugarResidencia: '', lugarOrigen: '',
  ocupacion: '', escolaridad: '',
  historiaConsumo: '',
  alergias: '', enfermedadesExantem: '', otrasEnfermedades: '',
  antecedentesQx: '', transfusiones: '', antecSexuales: '', antecSuicidas: '',
  padrePatologia: '', madrePatologia: '', hermanosPatologia: '',
  esposaPatologia: '', hijosPatologia: '',
  sintCabeza: '', sintCardioresp: '', sintGastro: '', sintGenito: '', sintEndoNeuro: '',
  svPresion: '', svFrecResp: '', svFrecCard: '', svTemp: '', svPeso: '', svEstatura: '',
  fisicoHabitus: '', fisicoCabeza: '', fisicoOrl: '', fisicoOrofaringe: '',
  fisicoCuello: '', fisicoTorax: '', fisicoPulmones: '', fisicoCorazon: '',
  fisicoAbdomen: '', fisicoExtremidades: '',
  neuro: '', estadoMental: '',
  diagnosticos: Array(10).fill('') as string[],
  recomendacion1: '', recomendacion2: '',
  firma: '', cedula: '',
};

type TabKey = 'general' | 'antecedentes' | 'familiar' | 'fisico' | 'diagnostico';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'general',      label: 'Datos Generales',    color: '#3b82f6' },
  { key: 'antecedentes', label: 'Antecedentes',        color: '#f59e0b' },
  { key: 'familiar',     label: 'Familiar / Sistemas', color: '#8b5cf6' },
  { key: 'fisico',       label: 'Examen Físico',       color: '#10b981' },
  { key: 'diagnostico',  label: 'Diagnóstico y Plan',  color: '#ef4444' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente | null;
}

export function ExpedienteFormModal({ isOpen, onClose, paciente }: Props) {
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [form, setForm] = useState<HistoriaClinica>(EMPTY_HISTORIA);
  const [saved, setSaved] = useState(false);

  const { data: expediente, isLoading } = useQuery<any>({
    queryKey: ['expediente_form', paciente?.id],
    queryFn: () => apiClient.get(`/expedientes/paciente/${paciente!.id}`).then(r => r.data.data),
    enabled: isOpen && !!paciente?.id,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (expediente?.historiaClinica) {
      const loaded = expediente.historiaClinica as Partial<HistoriaClinica>;
      setForm({
        ...EMPTY_HISTORIA,
        ...loaded,
        diagnosticos: [
          ...(loaded.diagnosticos ?? []),
          ...Array(10).fill(''),
        ].slice(0, 10) as string[],
      });
    } else {
      setForm(EMPTY_HISTORIA);
    }
    setSaved(false);
  }, [isOpen, expediente?.id]);

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put(`/expedientes/${expediente!.id}`, { historiaClinica: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente_form', paciente?.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleDownload = () => {
    if (!expediente || !paciente) return;
    generarExpedientePDF(paciente, form, usuario?.nombre ?? 'Médico', expediente.id);
  };

  if (!isOpen) return null;

  // ── Shared styles ────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', outline: 'none', color: '#0f172a',
    boxSizing: 'border-box', backgroundColor: 'white', fontFamily: 'inherit',
  };

  type FieldType = 'text' | 'textarea' | 'select';

  const Field = ({
    label, fkey, type = 'text', opts, fullWidth = false,
  }: { label: string; fkey: keyof HistoriaClinica; type?: FieldType; opts?: string[]; fullWidth?: boolean }) => {
    const val = (form[fkey] as string) ?? '';
    const set = (v: string) => setForm(f => ({ ...f, [fkey]: v }));
    return (
      <div style={{ marginBottom: '1.25rem', ...(fullWidth && { gridColumn: '1 / -1' }) }}>
        <label style={{
          display: 'block', fontSize: '11.5px', fontWeight: '700',
          color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px',
          marginBottom: '0.45rem',
        }}>
          {label}
        </label>
        {type === 'select' && opts ? (
          <select value={val} onChange={e => set(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">— Seleccionar —</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={val}
            onChange={e => set(e.target.value)}
            rows={3}
            style={{ ...inp, resize: 'vertical', lineHeight: '1.6' }}
          />
        ) : (
          <input type="text" value={val} onChange={e => set(e.target.value)} style={inp} />
        )}
      </div>
    );
  };

  const TwoCol = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
      {children}
    </div>
  );

  const Card = ({ children, accent }: { children: React.ReactNode; accent?: string }) => (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px',
      padding: '1.75rem 2rem',
      border: `1px solid ${accent ? `${accent}25` : '#edf0f5'}`,
      borderLeft: accent ? `4px solid ${accent}` : '1px solid #edf0f5',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      marginBottom: '1.25rem',
    }}>
      {children}
    </div>
  );

  const CardTitle = ({ n, title, color }: { n: number; title: string; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '8px',
        backgroundColor: `${color}18`, color, fontSize: '13px', fontWeight: '900', flexShrink: 0,
      }}>
        {n}
      </div>
      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.2px' }}>
        {title}
      </h4>
    </div>
  );

  const activeTabColor = TABS.find(t => t.key === activeTab)?.color ?? '#3b82f6';

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#f5f7fa', borderRadius: '28px', width: '100%',
        maxWidth: '960px', maxHeight: '94vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.28)',
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          padding: '1.5rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.65rem', backgroundColor: 'rgba(59,130,246,0.2)',
              borderRadius: '12px', display: 'flex',
            }}>
              <FileText size={20} color="#60a5fa" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#fff' }}>
                Historia Médica Clínica
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginTop: '0.15rem' }}>
                {paciente?.nombre} {paciente?.apellidoPaterno} {paciente?.apellidoMaterno}
                {expediente && <span style={{ color: '#60a5fa', marginLeft: '0.5rem' }}>· Exp. #{expediente.id}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem', borderRadius: '10px',
              border: '1px solid #334155', backgroundColor: 'transparent',
              cursor: 'pointer', color: '#94a3b8', display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #e2e8f0',
          padding: '0 1.5rem', backgroundColor: 'white', overflowX: 'auto',
          flexShrink: 0,
        }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.9rem 1.1rem', border: 'none',
                borderBottom: activeTab === tab.key ? `2.5px solid ${tab.color}` : '2.5px solid transparent',
                backgroundColor: 'transparent', cursor: 'pointer',
                fontWeight: activeTab === tab.key ? '800' : '600',
                fontSize: '13px', color: activeTab === tab.key ? tab.color : '#64748b',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                whiteSpace: 'nowrap', transition: 'color 0.2s',
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '19px', height: '19px',
                backgroundColor: activeTab === tab.key ? tab.color : '#e2e8f0',
                color: activeTab === tab.key ? 'white' : '#94a3b8',
                borderRadius: '50%', fontSize: '10px', fontWeight: '900', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', backgroundColor: '#f5f7fa' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              Cargando expediente...
            </div>
          ) : !expediente ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444', fontWeight: '600' }}>
              Este paciente no tiene expediente activo.
            </div>
          ) : (
            <>
              {/* Tab 1: Datos Generales */}
              {activeTab === 'general' && (
                <Card accent={activeTabColor}>
                  <CardTitle n={1} title="Historia Médica — Datos Generales" color={activeTabColor} />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '10px',
                    marginBottom: '1.5rem', fontSize: '12px', color: '#64748b', fontWeight: '600',
                    border: '1px solid #e2e8f0',
                  }}>
                    <span>📅</span>
                    Fecha: {new Date().toLocaleDateString('es-MX')}
                    <span style={{ color: '#94a3b8', margin: '0 0.3rem' }}>·</span>
                    {paciente?.nombre} {paciente?.apellidoPaterno} {paciente?.apellidoMaterno}
                    <span style={{ color: '#94a3b8', margin: '0 0.3rem' }}>·</span>
                    Expediente #{expediente.id}
                  </div>
                  <TwoCol>
                    <Field
                      label="Estado Civil" fkey="estadoCivil" type="select"
                      opts={['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre', 'Separado/a']}
                    />
                    <Field label="Religión" fkey="religion" />
                  </TwoCol>
                  <TwoCol>
                    <Field label="Lugar de Residencia" fkey="lugarResidencia" />
                    <Field label="Lugar de Origen" fkey="lugarOrigen" />
                  </TwoCol>
                  <TwoCol>
                    <Field label="Ocupación" fkey="ocupacion" />
                    <Field
                      label="Escolaridad" fkey="escolaridad" type="select"
                      opts={['Sin escolaridad', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Bachillerato', 'Técnico/a', 'Licenciatura', 'Posgrado']}
                    />
                  </TwoCol>
                </Card>
              )}

              {/* Tab 2: Antecedentes */}
              {activeTab === 'antecedentes' && (
                <>
                  <Card accent={activeTabColor}>
                    <CardTitle n={2} title="Historia de Consumo" color={activeTabColor} />
                    <Field label="Antecedentes de consumo de sustancias (tipo, cantidad, tiempo de uso)" fkey="historiaConsumo" type="textarea" />
                  </Card>

                  <Card accent={activeTabColor}>
                    <CardTitle n={3} title="Antecedentes Personales" color={activeTabColor} />
                    <TwoCol>
                      <Field label="Alergias" fkey="alergias" />
                      <Field label="Enfermedades exantemáticas / Amigdalitis / Fiebre reumática" fkey="enfermedadesExantem" />
                    </TwoCol>
                    <Field label="Otras enfermedades crónico-degenerativas" fkey="otrasEnfermedades" type="textarea" />
                    <TwoCol>
                      <Field label="Antecedentes quirúrgicos" fkey="antecedentesQx" />
                      <Field label="Transfusiones sanguíneas" fkey="transfusiones" />
                    </TwoCol>
                    <Field label="Antecedentes sexuales (parejas, ETS, métodos anticonceptivos, test VIH)" fkey="antecSexuales" type="textarea" />
                    <Field label="Antecedentes suicidas (ideas y planes suicidas)" fkey="antecSuicidas" type="textarea" />
                  </Card>
                </>
              )}

              {/* Tab 3: Familiar / Sistemas */}
              {activeTab === 'familiar' && (
                <>
                  <Card accent={activeTabColor}>
                    <CardTitle n={4} title="Historia Familiar" color={activeTabColor} />
                    <TwoCol>
                      <Field label="Padre — Patología" fkey="padrePatologia" />
                      <Field label="Madre — Patología" fkey="madrePatologia" />
                    </TwoCol>
                    <TwoCol>
                      <Field label="Hermanos — Patología" fkey="hermanosPatologia" />
                      <Field label="Esposa/o — Patología" fkey="esposaPatologia" />
                    </TwoCol>
                    <Field label="Hijos — Patología" fkey="hijosPatologia" />
                  </Card>

                  <Card accent={activeTabColor}>
                    <CardTitle n={5} title="Interrogatorio por Aparatos y Sistemas" color={activeTabColor} />
                    <Field label="Cabeza (cefalea, visión borrosa, tinnitus...)" fkey="sintCabeza" type="textarea" />
                    <Field label="Cardiorrespiratorio (palpitaciones, disnea, hipertensión...)" fkey="sintCardioresp" type="textarea" />
                    <Field label="Gastrointestinal (apetito, intolerancias, vómito, gastritis...)" fkey="sintGastro" type="textarea" />
                    <Field label="Genitourinario (menarca, vida sexual, gestas, secreciones...)" fkey="sintGenito" type="textarea" />
                    <Field label="Endocrino-Neuropsiquiátrico (convulsiones, alucinaciones, equilibrio...)" fkey="sintEndoNeuro" type="textarea" />
                  </Card>

                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '14px' }}>🩺</span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Signos Vitales</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                      <Field label="Presión Arterial (mmHg)" fkey="svPresion" />
                      <Field label="F. Respiratoria (rpm)" fkey="svFrecResp" />
                      <Field label="F. Cardíaca (lpm)" fkey="svFrecCard" />
                      <Field label="Temperatura (°C)" fkey="svTemp" />
                      <Field label="Peso (kg)" fkey="svPeso" />
                      <Field label="Estatura (cm)" fkey="svEstatura" />
                    </div>
                  </Card>
                </>
              )}

              {/* Tab 4: Examen Físico */}
              {activeTab === 'fisico' && (
                <>
                  <Card accent={activeTabColor}>
                    <CardTitle n={6} title="Examen Físico" color={activeTabColor} />
                    <Field label="Habitus exterior" fkey="fisicoHabitus" type="textarea" />
                    <TwoCol>
                      <Field label="Cabeza" fkey="fisicoCabeza" />
                      <Field label="ORL" fkey="fisicoOrl" />
                    </TwoCol>
                    <TwoCol>
                      <Field label="Orofaringe" fkey="fisicoOrofaringe" />
                      <Field label="Cuello" fkey="fisicoCuello" />
                    </TwoCol>
                    <TwoCol>
                      <Field label="Tórax" fkey="fisicoTorax" />
                      <Field label="Pulmones" fkey="fisicoPulmones" />
                    </TwoCol>
                    <TwoCol>
                      <Field label="Corazón" fkey="fisicoCorazon" />
                      <Field label="Abdomen" fkey="fisicoAbdomen" />
                    </TwoCol>
                    <Field label="Extremidades" fkey="fisicoExtremidades" />
                  </Card>

                  <Card accent={activeTabColor}>
                    <CardTitle n={7} title="Examen Neurológico y Estado Mental" color={activeTabColor} />
                    <Field label="Neurológico (reflejos, movimientos, función cerebral)" fkey="neuro" type="textarea" />
                    <Field label="Estado Mental (orientación, lenguaje, afecto, pensamiento, juicio, memoria, cognición)" fkey="estadoMental" type="textarea" />
                  </Card>
                </>
              )}

              {/* Tab 5: Diagnóstico y Plan */}
              {activeTab === 'diagnostico' && (
                <>
                  <Card accent={activeTabColor}>
                    <CardTitle n={8} title="Diagnóstico" color={activeTabColor} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{
                            width: '28px', height: '28px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: form.diagnosticos[i]?.trim() ? `${activeTabColor}15` : '#f1f5f9',
                            borderRadius: '8px',
                            fontSize: '12px', fontWeight: '900',
                            color: form.diagnosticos[i]?.trim() ? activeTabColor : '#94a3b8',
                          }}>
                            {i + 1}
                          </div>
                          <input
                            type="text"
                            placeholder={`Diagnóstico ${i + 1}`}
                            value={form.diagnosticos[i] ?? ''}
                            onChange={e => {
                              const d = [...form.diagnosticos];
                              d[i] = e.target.value;
                              setForm(f => ({ ...f, diagnosticos: d }));
                            }}
                            style={{ ...inp, flex: 1, marginBottom: 0 }}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card accent={activeTabColor}>
                    <CardTitle n={9} title="Recomendaciones y Plan de Tratamiento" color={activeTabColor} />
                    <Field label="Plan / Recomendación 1" fkey="recomendacion1" type="textarea" />
                    <Field label="Plan / Recomendación 2" fkey="recomendacion2" type="textarea" />
                  </Card>

                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '13px' }}>✍️</span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>10. Firma del Médico y Cédula</h4>
                    </div>
                    <TwoCol>
                      <Field label="Nombre / Firma del Médico" fkey="firma" />
                      <Field label="Cédula Profesional" fkey="cedula" />
                    </TwoCol>
                  </Card>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        {expediente && (
          <div style={{
            padding: '1.25rem 2rem', borderTop: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: 'white', flexShrink: 0,
          }}>
            {/* Left: Download button */}
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9',
                color: '#475569', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px',
              }}
            >
              <Download size={14} color="#475569" />
              Descargar PDF
            </button>

            {/* Right: Status + actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {saved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '13px', fontWeight: '700' }}>
                  <CheckCircle size={15} /> Guardado
                </span>
              )}
              {saveMutation.isError && (
                <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: '700' }}>
                  Error al guardar.
                </span>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '0.65rem 1.4rem', border: '1.5px solid #e2e8f0',
                  borderRadius: '12px', backgroundColor: 'white', color: '#475569',
                  fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                }}
              >
                Cerrar
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 1.75rem', backgroundColor: '#3b82f6',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontWeight: '800', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '13px', opacity: saveMutation.isPending ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                }}
              >
                <Save size={14} />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Historia Clínica'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
