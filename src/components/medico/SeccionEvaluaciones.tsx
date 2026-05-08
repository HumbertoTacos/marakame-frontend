import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck, Plus, X, Save, ChevronDown, ChevronUp, User, RotateCcw
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

// ── Catálogo de instrumentos psicométricos ───────────────────

interface Rango { min: number; max: number; label: string; color: string; }

interface InstrumentoConfig {
  clave: string;
  nombre: string;
  descripcion: string;
  disciplina: string;
  maxPuntaje: number;
  rangos: Rango[];
}

const INSTRUMENTOS: InstrumentoConfig[] = [
  {
    clave: 'AUDIT', nombre: 'AUDIT', descripcion: 'Alcohol Use Disorders Identification Test',
    disciplina: 'Médico / Psicología', maxPuntaje: 40,
    rangos: [
      { min: 0,  max: 7,  label: 'Consumo de bajo riesgo',       color: '#10b981' },
      { min: 8,  max: 15, label: 'Consumo de riesgo moderado',   color: '#f59e0b' },
      { min: 16, max: 19, label: 'Consumo perjudicial',          color: '#f97316' },
      { min: 20, max: 40, label: 'Dependencia probable',         color: '#ef4444' },
    ]
  },
  {
    clave: 'CAGE', nombre: 'CAGE', descripcion: 'Cut – Annoyed – Guilty – Eye Opener',
    disciplina: 'Médico', maxPuntaje: 4,
    rangos: [
      { min: 0, max: 1, label: 'Sin problema significativo',           color: '#10b981' },
      { min: 2, max: 4, label: 'Problema significativo de alcohol',    color: '#ef4444' },
    ]
  },
  {
    clave: 'PHQ9', nombre: 'PHQ-9', descripcion: 'Patient Health Questionnaire – Depresión',
    disciplina: 'Psicología', maxPuntaje: 27,
    rangos: [
      { min: 0,  max: 4,  label: 'Sin depresión',                 color: '#10b981' },
      { min: 5,  max: 9,  label: 'Depresión leve',                color: '#84cc16' },
      { min: 10, max: 14, label: 'Depresión moderada',            color: '#f59e0b' },
      { min: 15, max: 19, label: 'Depresión moderadamente grave', color: '#f97316' },
      { min: 20, max: 27, label: 'Depresión grave',               color: '#ef4444' },
    ]
  },
  {
    clave: 'HAMILTON', nombre: 'Hamilton Ansiedad', descripcion: 'Hamilton Anxiety Rating Scale',
    disciplina: 'Psicología', maxPuntaje: 56,
    rangos: [
      { min: 0,  max: 17, label: 'Ansiedad leve',     color: '#84cc16' },
      { min: 18, max: 24, label: 'Ansiedad moderada', color: '#f59e0b' },
      { min: 25, max: 56, label: 'Ansiedad grave',    color: '#ef4444' },
    ]
  },
  {
    clave: 'BECK', nombre: 'Beck Depresión', descripcion: 'Beck Depression Inventory (BDI-II)',
    disciplina: 'Psicología', maxPuntaje: 63,
    rangos: [
      { min: 0,  max: 13, label: 'Mínima',   color: '#10b981' },
      { min: 14, max: 19, label: 'Leve',     color: '#84cc16' },
      { min: 20, max: 28, label: 'Moderada', color: '#f59e0b' },
      { min: 29, max: 63, label: 'Grave',    color: '#ef4444' },
    ]
  },
  {
    clave: 'ASSIST', nombre: 'ASSIST', descripcion: 'Alcohol, Smoking and Substance Involvement Screening Test',
    disciplina: 'Médico / Psicología', maxPuntaje: 100,
    rangos: [
      { min: 0,  max: 10, label: 'Riesgo bajo',      color: '#10b981' },
      { min: 11, max: 26, label: 'Riesgo moderado',  color: '#f59e0b' },
      { min: 27, max: 100,label: 'Riesgo alto',      color: '#ef4444' },
    ]
  },
  {
    clave: 'DAST', nombre: 'DAST-10', descripcion: 'Drug Abuse Screening Test',
    disciplina: 'Médico', maxPuntaje: 10,
    rangos: [
      { min: 0, max: 2, label: 'Bajo',     color: '#10b981' },
      { min: 3, max: 5, label: 'Moderado', color: '#f59e0b' },
      { min: 6, max: 8, label: 'Alto',     color: '#f97316' },
      { min: 9, max: 10,label: 'Severo',   color: '#ef4444' },
    ]
  },
  {
    clave: 'ASI', nombre: 'ASI', descripcion: 'Addiction Severity Index (Índice de Severidad)',
    disciplina: 'Psicología', maxPuntaje: 10,
    rangos: [
      { min: 0, max: 3,  label: 'Leve',     color: '#10b981' },
      { min: 4, max: 6,  label: 'Moderado', color: '#f59e0b' },
      { min: 7, max: 10, label: 'Severo',   color: '#ef4444' },
    ]
  },
];

function getInterpretacion(config: InstrumentoConfig, puntaje: number): Rango | null {
  return config.rangos.find(r => puntaje >= r.min && puntaje <= r.max) ?? null;
}

// ── Interfaces ───────────────────────────────────────────────

interface EvaluacionResultado {
  id: number;
  instrumento: string;
  puntajeTotal: number;
  interpretacion?: string;
  observaciones?: string;
  fechaAplicacion: string;
  usuario?: { nombre: string; apellidos: string; rol: string };
}

interface SeccionEvaluacionesProps {
  pacienteId: number;
}

// ── Componente principal ─────────────────────────────────────

const SeccionEvaluaciones: React.FC<SeccionEvaluacionesProps> = ({ pacienteId }) => {
  const { usuario } = useAuthStore();
  const [resultados, setResultados] = useState<EvaluacionResultado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedClave, setExpandedClave] = useState<string | null>(null);

  // Modal registrar
  const [showModal, setShowModal] = useState(false);
  const [instrumentoSeleccionado, setInstrumentoSeleccionado] = useState<InstrumentoConfig | null>(null);
  const [editando, setEditando] = useState<EvaluacionResultado | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ puntajeTotal: '', observaciones: '' });

  const puedeRegistrar = ['AREA_MEDICA', 'PSICOLOGIA', 'ADMIN_GENERAL'].includes(usuario?.rol || '');

  const fetchEvaluaciones = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/clinica/paciente/${pacienteId}/evaluaciones`);
      setResultados(res.data.data);
    } catch {
      console.error('Error cargando evaluaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEvaluaciones(); }, [pacienteId]);

  const abrirModalNuevo = (instrumento: InstrumentoConfig) => {
    setInstrumentoSeleccionado(instrumento);
    setEditando(null);
    setForm({ puntajeTotal: '', observaciones: '' });
    setShowModal(true);
  };

  const abrirModalEditar = (resultado: EvaluacionResultado) => {
    const config = INSTRUMENTOS.find(i => i.clave === resultado.instrumento);
    if (!config) return;
    setInstrumentoSeleccionado(config);
    setEditando(resultado);
    setForm({ puntajeTotal: String(resultado.puntajeTotal), observaciones: resultado.observaciones || '' });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!instrumentoSeleccionado || form.puntajeTotal === '') return;
    const puntaje = parseFloat(form.puntajeTotal);
    if (isNaN(puntaje) || puntaje < 0 || puntaje > instrumentoSeleccionado.maxPuntaje) {
      alert(`El puntaje debe estar entre 0 y ${instrumentoSeleccionado.maxPuntaje}`);
      return;
    }
    const interp = getInterpretacion(instrumentoSeleccionado, puntaje);
    setIsSaving(true);
    try {
      if (editando) {
        await apiClient.patch(`/clinica/evaluaciones/${editando.id}`, {
          puntajeTotal: puntaje,
          interpretacion: interp?.label,
          observaciones: form.observaciones
        });
      } else {
        await apiClient.post(`/clinica/paciente/${pacienteId}/evaluaciones`, {
          instrumento: instrumentoSeleccionado.clave,
          puntajeTotal: puntaje,
          interpretacion: interp?.label,
          observaciones: form.observaciones
        });
      }
      setShowModal(false);
      fetchEvaluaciones();
    } catch {
      alert('Error al guardar la evaluación');
    } finally {
      setIsSaving(false);
    }
  };

  const puntajeActual = form.puntajeTotal !== '' && instrumentoSeleccionado
    ? getInterpretacion(instrumentoSeleccionado, parseFloat(form.puntajeTotal))
    : null;

  const aplicadas = resultados.length;
  const total = INSTRUMENTOS.length;

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando evaluaciones...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Evaluaciones Psicométricas</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              Aplicadas: <strong>{aplicadas}</strong> / {total} instrumentos
            </p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '160px', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ width: `${(aplicadas / total) * 100}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '99px', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#f59e0b' }}>{Math.round((aplicadas / total) * 100)}%</span>
        </div>
      </div>

      {/* Grid de instrumentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {INSTRUMENTOS.map(instrumento => {
          const historial = resultados.filter(r => r.instrumento === instrumento.clave);
          const ultimo = historial[0];
          const expanded = expandedClave === instrumento.clave;
          const interp = ultimo ? getInterpretacion(instrumento, ultimo.puntajeTotal) : null;

          return (
            <div key={instrumento.clave} style={{
              backgroundColor: 'white', borderRadius: '20px',
              border: `1px solid ${ultimo ? (interp?.color + '44' || '#e2e8f0') : '#e2e8f0'}`,
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              {/* Card principal */}
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{instrumento.nombre}</span>
                      {ultimo && interp && (
                        <span style={{ backgroundColor: interp.color + '22', color: interp.color, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                          {interp.label}
                        </span>
                      )}
                      {!ultimo && (
                        <span style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                          PENDIENTE
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{instrumento.descripcion}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                      {instrumento.disciplina} · Máx: {instrumento.maxPuntaje} pts
                    </p>
                  </div>

                  {/* Puntaje grande */}
                  {ultimo && (
                    <div style={{ textAlign: 'right', minWidth: '60px' }}>
                      <p style={{ fontSize: '28px', fontWeight: '900', color: interp?.color || '#1e293b', margin: 0, lineHeight: 1 }}>
                        {ultimo.puntajeTotal}
                      </p>
                      <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0' }}>/ {instrumento.maxPuntaje}</p>
                    </div>
                  )}
                </div>

                {/* Barra visual del puntaje */}
                {ultimo && (
                  <div style={{ marginTop: '0.75rem', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(ultimo.puntajeTotal / instrumento.maxPuntaje) * 100}%`,
                      height: '100%', backgroundColor: interp?.color || '#94a3b8',
                      borderRadius: '99px', transition: 'width 0.4s ease'
                    }} />
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {puedeRegistrar && (
                    <button
                      onClick={() => abrirModalNuevo(instrumento)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <Plus size={14} /> {ultimo ? 'Nueva aplicación' : 'Registrar puntaje'}
                    </button>
                  )}
                  {puedeRegistrar && ultimo && (
                    <button
                      onClick={() => abrirModalEditar(ultimo)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <RotateCcw size={14} /> Editar último
                    </button>
                  )}
                  {historial.length > 0 && (
                    <button
                      onClick={() => setExpandedClave(expanded ? null : instrumento.clave)}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {historial.length}
                    </button>
                  )}
                </div>
              </div>

              {/* Historial expandible */}
              {expanded && (
                <div style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa', padding: '1rem 1.5rem' }}>
                  <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>
                    Historial de aplicaciones
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {historial.map(r => {
                      const ri = getInterpretacion(instrumento, r.puntajeTotal);
                      return (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: ri?.color || '#1e293b' }}>{r.puntajeTotal} pts</span>
                            {ri && <span style={{ fontSize: '11px', color: ri.color, marginLeft: '6px', fontWeight: '700' }}>— {ri.label}</span>}
                            {r.observaciones && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0', fontStyle: 'italic' }}>{r.observaciones}</p>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={10} /> {r.usuario?.nombre} {r.usuario?.apellidos}
                            </p>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0' }}>
                              {new Date(r.fechaAplicacion).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Registrar / Editar puntaje */}
      {showModal && instrumentoSeleccionado && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  {editando ? 'Editar' : 'Registrar'} — {instrumentoSeleccionado.nombre}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{instrumentoSeleccionado.descripcion}</p>
              </div>
              <X size={20} cursor="pointer" onClick={() => setShowModal(false)} />
            </div>
            <div style={modalBodyStyle}>

              {/* Rangos de referencia */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 0.6rem' }}>Rangos de interpretación</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {instrumentoSeleccionado.rangos.map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: '700', color: r.color }}>{r.label}</span>
                      <span style={{ color: '#94a3b8' }}>{r.min} – {r.max} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Puntaje */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>Puntaje total * (0 – {instrumentoSeleccionado.maxPuntaje})</label>
                <input
                  type="number"
                  min={0}
                  max={instrumentoSeleccionado.maxPuntaje}
                  step="0.5"
                  value={form.puntajeTotal}
                  onChange={e => setForm({ ...form, puntajeTotal: e.target.value })}
                  style={inputStyle}
                  placeholder={`0 – ${instrumentoSeleccionado.maxPuntaje}`}
                />
                {/* Interpretación en tiempo real */}
                {puntajeActual && (
                  <div style={{ marginTop: '0.5rem', padding: '8px 12px', borderRadius: '10px', backgroundColor: puntajeActual.color + '18', border: `1px solid ${puntajeActual.color}44` }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: puntajeActual.color }}>
                      Interpretación: {puntajeActual.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>Observaciones clínicas (opcional)</label>
                <textarea
                  rows={3}
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Notas adicionales sobre los resultados o condiciones de aplicación..."
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <button onClick={handleGuardar} disabled={isSaving || form.puntajeTotal === ''} style={btnSaveStyle}>
                {isSaving ? 'Guardando...' : <><Save size={18} /> {editando ? 'Actualizar' : 'Registrar'} Resultado</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', boxShadow: '0 4px 6px -1px rgba(245,158,11,0.3)', opacity: 1 };

export default SeccionEvaluaciones;
