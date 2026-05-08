import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, User, Pill, Heart, Brain,
  Stethoscope, Activity, ClipboardList, CheckCircle2,
  Loader2, Download, Plus, Trash2,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { generarExpedientePDF } from '../../utils/expedientePDF';
import type { HistoriaClinica } from '../../types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcEdad(fechaNacimiento?: string | null): number {
  if (!fechaNacimiento) return 0;
  const d = new Date(fechaNacimiento);
  if (isNaN(d.getTime())) return 0;
  const hoy = new Date();
  let a = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) a--;
  return a < 0 || a > 120 ? 0 : a;
}

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
  diagnosticos: [],
  recomendacion1: '', recomendacion2: '',
  firma: '', cedula: '',
};

// ─── Sub-componentes de sección ────────────────────────────────────────────────

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}> = ({ icon, title, color, children }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: '20px',
    border: '1px solid #e2e8f0', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      padding: '1.1rem 1.75rem', borderBottom: '1px solid #f1f5f9',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      background: `linear-gradient(135deg, ${color}08, ${color}18)`,
    }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{title}</h2>
    </div>
    <div style={{ padding: '1.5rem 1.75rem' }}>{children}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  readOnly?: boolean;
}> = ({ label, value, onChange, multiline = false, rows = 3, placeholder, readOnly = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder ?? `Registrar ${label.toLowerCase()}...`}
        readOnly={readOnly}
        style={{
          borderRadius: '10px', border: '1.5px solid #e2e8f0',
          padding: '0.65rem 0.9rem', fontSize: '13px', color: '#334155',
          resize: 'vertical', fontFamily: 'inherit', outline: 'none',
          backgroundColor: readOnly ? '#f8fafc' : 'white',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = '#3b82f6'; }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? `Registrar ${label.toLowerCase()}...`}
        readOnly={readOnly}
        style={{
          borderRadius: '10px', border: '1.5px solid #e2e8f0',
          padding: '0.65rem 0.9rem', fontSize: '13px', color: '#334155',
          outline: 'none', width: '100%', boxSizing: 'border-box',
          backgroundColor: readOnly ? '#f8fafc' : 'white',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = '#3b82f6'; }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
      />
    )}
  </div>
);

const Grid2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>{children}</div>
);

const Grid3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>{children}</div>
);

// ─── Página Principal ──────────────────────────────────────────────────────────

export default function GenerarExpedientePage() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();

  const [paciente, setPaciente] = useState<any>(null);
  const [expedienteId, setExpedienteId] = useState<number | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<HistoriaClinica>(EMPTY_HISTORIA);
  const [diagnosticoInput, setDiagnosticoInput] = useState('');

  const setField = <K extends keyof HistoriaClinica>(key: K, value: HistoriaClinica[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!pacienteId) return;
      try {
        const [pacRes, expRes] = await Promise.allSettled([
          apiClient.get(`/pacientes/${pacienteId}`),
          apiClient.get(`/expedientes/paciente/${pacienteId}`),
        ]);

        let pac: any = null;
        if (pacRes.status === 'fulfilled') {
          pac = pacRes.value.data.data;
          setPaciente(pac);
          // Pre-rellenar campos del paciente
          setForm(prev => ({
            ...prev,
            ocupacion: pac.ocupacion ?? '',
            escolaridad: pac.escolaridad ?? '',
          }));
        }

        if (expRes.status === 'fulfilled') {
          const exp = expRes.value.data.data;
          setExpedienteId(exp.id);
          // Si ya existe historia clínica, cargarla para edición
          if (exp.historiaClinica) {
            setForm({ ...EMPTY_HISTORIA, ...exp.historiaClinica });
          }
        } else {
          // Crear expediente vacío si no existe
          try {
            const created = await apiClient.post('/expedientes', { pacienteId: parseInt(pacienteId, 10) });
            setExpedienteId(created.data.data.id);
          } catch (e) {
            console.error('No se pudo crear expediente:', e);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, [pacienteId]);

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!expedienteId) return;
    setSaving(true);
    try {
      await apiClient.put(`/expedientes/${expedienteId}`, { historiaClinica: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Error al guardar el expediente. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Guardar y abrir expediente ────────────────────────────────────────────────
  const handleGuardarYContinuar = async () => {
    if (!expedienteId) return;
    setSaving(true);
    try {
      await apiClient.put(`/expedientes/${expedienteId}`, { historiaClinica: form });
      navigate(`/medica/expediente/${pacienteId}`);
    } catch (e) {
      console.error(e);
      alert('Error al guardar el expediente. Intente nuevamente.');
      setSaving(false);
    }
  };

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const handleDescargarPDF = () => {
    if (!paciente || !expedienteId) return;
    generarExpedientePDF(paciente, form, usuario?.nombre ?? 'Médico', expedienteId);
  };

  // ── Diagnósticos ─────────────────────────────────────────────────────────────
  const addDiagnostico = () => {
    const d = diagnosticoInput.trim();
    if (!d) return;
    setField('diagnosticos', [...form.diagnosticos, d]);
    setDiagnosticoInput('');
  };
  const removeDiagnostico = (idx: number) =>
    setField('diagnosticos', form.diagnosticos.filter((_, i) => i !== idx));

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loadingInit) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
      <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
      Cargando datos del paciente...
    </div>
  );

  const edad = calcEdad(paciente?.fechaNacimiento);
  const nombreCompleto = paciente
    ? `${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno ?? ''}`.trim()
    : '—';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '24px',
        border: '1px solid #e2e8f0', padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '12px',
              padding: '0.5rem', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ padding: '0.6rem', background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: '14px', color: 'white' }}>
            <FileText size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>
              Historia Clínica Inicial
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              {nombreCompleto} · {edad} años · {paciente?.sexo ?? '—'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {paciente && expedienteId && (
            <button
              onClick={handleDescargarPDF}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.2rem', borderRadius: '12px',
                border: '1.5px solid #e2e8f0', background: 'white',
                color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '13px',
              }}
            >
              <Download size={15} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* ── 1. Datos Generales ── */}
      <SectionCard icon={<User size={20} />} title="1. Datos Generales" color="#0891b2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Grid2>
            <Field label="Nombre completo" value={nombreCompleto} onChange={() => {}} readOnly />
            <Field label="Edad / Sexo" value={`${edad} años — ${paciente?.sexo ?? '—'}`} onChange={() => {}} readOnly />
          </Grid2>
          <Grid3>
            <Field label="Estado Civil" value={form.estadoCivil} onChange={v => setField('estadoCivil', v)} />
            <Field label="Religión" value={form.religion} onChange={v => setField('religion', v)} />
            <Field label="Escolaridad" value={form.escolaridad} onChange={v => setField('escolaridad', v)} />
          </Grid3>
          <Grid3>
            <Field label="Ocupación" value={form.ocupacion} onChange={v => setField('ocupacion', v)} />
            <Field label="Lugar de Residencia" value={form.lugarResidencia} onChange={v => setField('lugarResidencia', v)} />
            <Field label="Lugar de Origen" value={form.lugarOrigen} onChange={v => setField('lugarOrigen', v)} />
          </Grid3>
        </div>
      </SectionCard>

      {/* ── 2. Historial de Consumo ── */}
      <SectionCard icon={<Pill size={20} />} title="2. Historial de Consumo" color="#d97706">
        <Field
          label="Historia de consumo de sustancias"
          value={form.historiaConsumo}
          onChange={v => setField('historiaConsumo', v)}
          multiline rows={5}
          placeholder="Describir sustancias consumidas, edad de inicio, frecuencia, dosis, vía de administración, tiempo de consumo, últimas 24h..."
        />
      </SectionCard>

      {/* ── 3. Antecedentes Personales ── */}
      <SectionCard icon={<ClipboardList size={20} />} title="3. Antecedentes Personales Patológicos" color="#7c3aed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Grid2>
            <Field label="Alergias" value={form.alergias} onChange={v => setField('alergias', v)} multiline rows={2} />
            <Field label="Enfermedades Exantemáticas" value={form.enfermedadesExantem} onChange={v => setField('enfermedadesExantem', v)} multiline rows={2} />
          </Grid2>
          <Grid2>
            <Field label="Otras Enfermedades" value={form.otrasEnfermedades} onChange={v => setField('otrasEnfermedades', v)} multiline rows={2} />
            <Field label="Antecedentes Quirúrgicos" value={form.antecedentesQx} onChange={v => setField('antecedentesQx', v)} multiline rows={2} />
          </Grid2>
          <Grid3>
            <Field label="Transfusiones" value={form.transfusiones} onChange={v => setField('transfusiones', v)} multiline rows={2} />
            <Field label="Antecedentes Sexuales" value={form.antecSexuales} onChange={v => setField('antecSexuales', v)} multiline rows={2} />
            <Field label="Antecedentes Suicidas" value={form.antecSuicidas} onChange={v => setField('antecSuicidas', v)} multiline rows={2} />
          </Grid3>
        </div>
      </SectionCard>

      {/* ── 4. Antecedentes Heredofamiliares ── */}
      <SectionCard icon={<Heart size={20} />} title="4. Antecedentes Heredofamiliares" color="#ec4899">
        <Grid3>
          <Field label="Padre" value={form.padrePatologia} onChange={v => setField('padrePatologia', v)} multiline rows={2} placeholder="Patologías del padre..." />
          <Field label="Madre" value={form.madrePatologia} onChange={v => setField('madrePatologia', v)} multiline rows={2} placeholder="Patologías de la madre..." />
          <Field label="Hermanos" value={form.hermanosPatologia} onChange={v => setField('hermanosPatologia', v)} multiline rows={2} placeholder="Patologías de hermanos..." />
        </Grid3>
        <div style={{ marginTop: '1rem' }}>
          <Grid2>
            <Field label="Esposa/Pareja" value={form.esposaPatologia} onChange={v => setField('esposaPatologia', v)} multiline rows={2} placeholder="Patologías de la pareja..." />
            <Field label="Hijos" value={form.hijosPatologia} onChange={v => setField('hijosPatologia', v)} multiline rows={2} placeholder="Patologías de hijos..." />
          </Grid2>
        </div>
      </SectionCard>

      {/* ── 5. Interrogatorio por Aparatos y Sistemas ── */}
      <SectionCard icon={<Activity size={20} />} title="5. Interrogatorio por Aparatos y Sistemas" color="#059669">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Grid2>
            <Field label="Cabeza y Cuello" value={form.sintCabeza} onChange={v => setField('sintCabeza', v)} multiline rows={2} />
            <Field label="Cardiorrespiratorio" value={form.sintCardioresp} onChange={v => setField('sintCardioresp', v)} multiline rows={2} />
          </Grid2>
          <Grid3>
            <Field label="Gastrointestinal" value={form.sintGastro} onChange={v => setField('sintGastro', v)} multiline rows={2} />
            <Field label="Genitourinario" value={form.sintGenito} onChange={v => setField('sintGenito', v)} multiline rows={2} />
            <Field label="Endocrino / Neurológico" value={form.sintEndoNeuro} onChange={v => setField('sintEndoNeuro', v)} multiline rows={2} />
          </Grid3>
        </div>
      </SectionCard>

      {/* ── 6. Signos Vitales ── */}
      <SectionCard icon={<Activity size={20} />} title="6. Signos Vitales" color="#f59e0b">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <Field label="T/A (mmHg)" value={form.svPresion} onChange={v => setField('svPresion', v)} placeholder="120/80" />
          <Field label="Frec. Respiratoria (/min)" value={form.svFrecResp} onChange={v => setField('svFrecResp', v)} placeholder="16" />
          <Field label="Frec. Cardiaca (/min)" value={form.svFrecCard} onChange={v => setField('svFrecCard', v)} placeholder="72" />
          <Field label="Temperatura (°C)" value={form.svTemp} onChange={v => setField('svTemp', v)} placeholder="36.5" />
          <Field label="Peso (kg)" value={form.svPeso} onChange={v => setField('svPeso', v)} placeholder="70" />
          <Field label="Estatura (cm)" value={form.svEstatura} onChange={v => setField('svEstatura', v)} placeholder="170" />
        </div>
      </SectionCard>

      {/* ── 7. Exploración Física ── */}
      <SectionCard icon={<Stethoscope size={20} />} title="7. Exploración Física" color="#3b82f6">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Grid2>
            <Field label="Habitus Exterior" value={form.fisicoHabitus} onChange={v => setField('fisicoHabitus', v)} multiline rows={2} />
            <Field label="Cabeza" value={form.fisicoCabeza} onChange={v => setField('fisicoCabeza', v)} multiline rows={2} />
          </Grid2>
          <Grid3>
            <Field label="ORL" value={form.fisicoOrl} onChange={v => setField('fisicoOrl', v)} multiline rows={2} />
            <Field label="Orofaringe" value={form.fisicoOrofaringe} onChange={v => setField('fisicoOrofaringe', v)} multiline rows={2} />
            <Field label="Cuello" value={form.fisicoCuello} onChange={v => setField('fisicoCuello', v)} multiline rows={2} />
          </Grid3>
          <Grid3>
            <Field label="Tórax" value={form.fisicoTorax} onChange={v => setField('fisicoTorax', v)} multiline rows={2} />
            <Field label="Pulmones" value={form.fisicoPulmones} onChange={v => setField('fisicoPulmones', v)} multiline rows={2} />
            <Field label="Corazón" value={form.fisicoCorazon} onChange={v => setField('fisicoCorazon', v)} multiline rows={2} />
          </Grid3>
          <Grid2>
            <Field label="Abdomen" value={form.fisicoAbdomen} onChange={v => setField('fisicoAbdomen', v)} multiline rows={2} />
            <Field label="Extremidades" value={form.fisicoExtremidades} onChange={v => setField('fisicoExtremidades', v)} multiline rows={2} />
          </Grid2>
        </div>
      </SectionCard>

      {/* ── 8. Neurológico y Estado Mental ── */}
      <SectionCard icon={<Brain size={20} />} title="8. Exploración Neurológica y Estado Mental" color="#7c3aed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Exploración Neurológica" value={form.neuro} onChange={v => setField('neuro', v)} multiline rows={3} />
          <Field label="Examen del Estado Mental" value={form.estadoMental} onChange={v => setField('estadoMental', v)} multiline rows={4}
            placeholder="Orientación, memoria, juicio, abstracción, lenguaje, afecto, pensamiento, percepción, insight..." />
        </div>
      </SectionCard>

      {/* ── 9. Diagnósticos ── */}
      <SectionCard icon={<ClipboardList size={20} />} title="9. Diagnósticos" color="#ef4444">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={diagnosticoInput}
            onChange={e => setDiagnosticoInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDiagnostico(); } }}
            placeholder="Escribir diagnóstico y presionar Enter o +"
            style={{
              flex: 1, borderRadius: '10px', border: '1.5px solid #e2e8f0',
              padding: '0.65rem 0.9rem', fontSize: '13px', color: '#334155', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
          />
          <button
            type="button"
            onClick={addDiagnostico}
            style={{
              padding: '0.65rem 1rem', borderRadius: '10px',
              background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
              border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '13px',
            }}
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
        {form.diagnosticos.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>Sin diagnósticos registrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {form.diagnosticos.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#fff1f2', borderRadius: '10px', padding: '0.6rem 1rem',
                border: '1px solid #fecdd3',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>
                  {i + 1}. {d}
                </span>
                <button
                  type="button"
                  onClick={() => removeDiagnostico(i)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f87171', padding: '0.2rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── 10. Recomendaciones ── */}
      <SectionCard icon={<ClipboardList size={20} />} title="10. Plan y Recomendaciones" color="#10b981">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Plan de Tratamiento" value={form.recomendacion1} onChange={v => setField('recomendacion1', v)} multiline rows={3} />
          <Field label="Recomendaciones Adicionales" value={form.recomendacion2} onChange={v => setField('recomendacion2', v)} multiline rows={3} />
        </div>
      </SectionCard>

      {/* ── 11. Validación ── */}
      <SectionCard icon={<CheckCircle2 size={20} />} title="11. Validación Médica" color="#0891b2">
        <Grid2>
          <Field label="Nombre del Médico (firma)" value={form.firma} onChange={v => setField('firma', v)} placeholder={usuario?.nombre ?? 'Dr. Nombre Apellido'} />
          <Field label="Cédula Profesional" value={form.cedula} onChange={v => setField('cedula', v)} placeholder="Cédula profesional..." />
        </Grid2>
      </SectionCard>

      {/* ── Barra de Acciones ── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        border: '1px solid #e2e8f0', padding: '1.25rem 1.75rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '14px',
            border: '1.5px solid #e2e8f0', background: 'white',
            color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
          }}
        >
          Cancelar
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving || !expedienteId}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '14px',
              border: '1.5px solid #e2e8f0', background: 'white',
              color: saving ? '#94a3b8' : '#334155', fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            {saving ? <Loader2 className="animate-spin" size={15} /> : saved ? <CheckCircle2 size={15} color="#22c55e" /> : null}
            {saved ? 'Guardado' : 'Guardar Borrador'}
          </button>
          <button
            type="button"
            onClick={handleGuardarYContinuar}
            disabled={saving || !expedienteId}
            style={{
              padding: '0.75rem 2rem', borderRadius: '14px', border: 'none',
              background: saving || !expedienteId ? '#e2e8f0' : 'linear-gradient(135deg,#0891b2,#0e7490)',
              color: saving || !expedienteId ? '#94a3b8' : 'white',
              fontWeight: '800', cursor: saving || !expedienteId ? 'not-allowed' : 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Guardar y Abrir Expediente
          </button>
        </div>
      </div>

    </div>
  );
}
