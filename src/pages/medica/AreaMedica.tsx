import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Search, Stethoscope, Users, Calendar, X,
  Trash2, Folder, ClipboardList, HeartPulse, Building2, History,
  Brain, Apple, Heart, Droplets, LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Paciente, Expediente } from '../../types';

// ── Configuración por rol ─────────────────────────────────────────────────────

type RolMedico = 'AREA_MEDICA' | 'JEFE_MEDICO' | 'PSICOLOGIA' | 'NUTRICION' | 'ENFERMERIA' | 'ADMIN_GENERAL';

const ROL_CONFIG: Record<RolMedico, { titulo: string; descripcion: string; acento: string; showInbox: boolean }> = {
  AREA_MEDICA:   { titulo: 'Área Médica',        descripcion: 'Panel del Médico',       acento: '#3b82f6', showInbox: true  },
  JEFE_MEDICO:   { titulo: 'Jefatura Médica',    descripcion: 'Panel del Jefe Médico',  acento: '#1d4ed8', showInbox: true  },
  PSICOLOGIA:    { titulo: 'Área de Psicología', descripcion: 'Panel del Psicólogo',    acento: '#8b5cf6', showInbox: false },
  NUTRICION:     { titulo: 'Área de Nutrición',  descripcion: 'Panel del Nutriólogo',   acento: '#10b981', showInbox: false },
  ENFERMERIA:    { titulo: 'Área de Enfermería', descripcion: 'Panel de Enfermería',    acento: '#f59e0b', showInbox: false },
  ADMIN_GENERAL: { titulo: 'Panel Clínico',      descripcion: 'Vista de Administrador', acento: '#64748b', showInbox: true  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcularEdad = (fechaNacimiento: string | Date) => {
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento as string);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
  return edad;
};

const AREA_CONFIG: Record<string, { color: string; light: string; border: string; label: string }> = {
  HOMBRES:     { color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', label: 'Hombres' },
  MUJERES:     { color: '#ec4899', light: '#fdf2f8', border: '#fbcfe8', label: 'Mujeres' },
  DETOX:       { color: '#f59e0b', light: '#fffbeb', border: '#fde68a', label: 'Desintoxicación' },
  SIN_ASIGNAR: { color: '#64748b', light: '#f8fafc', border: '#e2e8f0', label: 'Sin Habitación Asignada' },
};

const actionBtn = (color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.45rem 0.85rem',
  backgroundColor: `${color}12`,
  color,
  border: `1.5px solid ${color}30`,
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '12px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
});

// ─── Modal: Sustancias ────────────────────────────────────────────────────────

const VerSustanciasModal = ({ isOpen, onClose, sustancias, nombrePaciente }: {
  isOpen: boolean; onClose: () => void; sustancias: string[]; nombrePaciente: string;
}) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '90%', maxWidth: '400px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Perfil de Sustancias</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{nombrePaciente}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: 'white', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          {sustancias.map((s, i) => (
            <span key={i} style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '14px', fontSize: '13px', fontWeight: '800', border: '1px solid #dbeafe' }}>{s}</span>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ─── Modal: Valoración Interna ────────────────────────────────────────────────

const ValoracionInternaModal = ({ isOpen, onClose, paciente, onSuccess }: {
  isOpen: boolean; onClose: () => void; paciente: Paciente | null; onSuccess: () => void;
}) => {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();

  const emptyForm = { temperatura: '', presionArterial: '', frecuenciaCardiaca: '', frecuenciaRespiratoria: '', oxigenacion: '', peso: '', nota: '' };
  const [form, setForm] = useState(emptyForm);

  const { data: expediente, isLoading: isLoadingExp } = useQuery<Expediente>({
    queryKey: ['expediente_modal', paciente?.id],
    queryFn: () => apiClient.get(`/expedientes/paciente/${paciente!.id}`).then(r => r.data.data),
    enabled: isOpen && !!paciente?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!expediente?.id) throw new Error('Sin expediente');
      const tasks: Promise<unknown>[] = [];

      const hasSignos = form.temperatura || form.presionArterial || form.frecuenciaCardiaca || form.frecuenciaRespiratoria || form.oxigenacion || form.peso;
      if (hasSignos) {
        tasks.push(apiClient.post(`/expedientes/${expediente.id}/signos`, {
          usuarioId: usuario?.id,
          ...(form.temperatura            && { temperatura:            parseFloat(form.temperatura) }),
          ...(form.presionArterial        && { presionArterial:        form.presionArterial }),
          ...(form.frecuenciaCardiaca     && { frecuenciaCardiaca:     parseInt(form.frecuenciaCardiaca) }),
          ...(form.frecuenciaRespiratoria && { frecuenciaRespiratoria: parseInt(form.frecuenciaRespiratoria) }),
          ...(form.oxigenacion            && { oxigenacion:            parseInt(form.oxigenacion) }),
          ...(form.peso                   && { peso:                   parseFloat(form.peso) }),
        }));
      }

      if (form.nota.trim()) {
        tasks.push(apiClient.post(`/expedientes/${expediente.id}/notas`, {
          usuarioId: usuario?.id,
          tipo: 'MEDICA',
          nota: form.nota,
        }));
      }

      if (tasks.length === 0) throw new Error('Completa al menos un campo');
      await Promise.all(tasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente_modal', paciente?.id] });
      queryClient.invalidateQueries({ queryKey: ['historial_expediente', paciente?.id] });
      setForm(emptyForm);
      onSuccess();
      onClose();
    },
  });

  if (!isOpen) return null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#1e293b',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const signosFields = [
    { label: 'Temperatura (°C)',      key: 'temperatura',            placeholder: '36.5'  },
    { label: 'Presión Arterial',      key: 'presionArterial',        placeholder: '120/80' },
    { label: 'Frec. Cardíaca (lpm)',  key: 'frecuenciaCardiaca',     placeholder: '72'    },
    { label: 'Frec. Respiratoria',    key: 'frecuenciaRespiratoria', placeholder: '18'    },
    { label: 'Oxigenación (%)',       key: 'oxigenacion',            placeholder: '98'    },
    { label: 'Peso (kg)',             key: 'peso',                   placeholder: '75'    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

        <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '10px' }}>
                <Stethoscope size={18} color="#3b82f6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Valoración Médica</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
              {paciente?.nombre} {paciente?.apellidoPaterno} · Cama {paciente?.cama?.numero || 'S/A'}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
          {isLoadingExp ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Cargando expediente...</p>
          ) : !expediente ? (
            <p style={{ textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>Este paciente no tiene expediente activo.</p>
          ) : (
            <>
              <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.75rem' }}>Signos Vitales</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.75rem' }}>
                {signosFields.map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={inp}
                    />
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.75rem' }}>Nota de Evolución Médica</p>
              <textarea
                placeholder="Evolución clínica actual, ajustes al tratamiento, observaciones relevantes..."
                value={form.nota}
                onChange={(e) => setForm(f => ({ ...f, nota: e.target.value }))}
                style={{ ...inp, minHeight: '110px', resize: 'vertical' }}
              />

              {submitMutation.isError && (
                <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '700', marginTop: '0.75rem' }}>
                  {(submitMutation.error as Error).message}
                </p>
              )}
            </>
          )}
        </div>

        {expediente && (
          <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', backgroundColor: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              Cancelar
            </button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              style={{ padding: '0.75rem 1.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: submitMutation.isPending ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', opacity: submitMutation.isPending ? 0.7 : 1 }}
            >
              {submitMutation.isPending ? 'Guardando...' : 'Guardar Valoración'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Modal: Historial Clínico ─────────────────────────────────────────────────

const HistorialModal = ({ isOpen, onClose, paciente }: {
  isOpen: boolean; onClose: () => void; paciente: Paciente | null;
}) => {
  const { data: expediente, isLoading } = useQuery<Expediente>({
    queryKey: ['historial_expediente', paciente?.id],
    queryFn: () => apiClient.get(`/expedientes/paciente/${paciente!.id}`).then(r => r.data.data),
    enabled: isOpen && !!paciente?.id,
  });

  if (!isOpen) return null;

  const notas = (expediente?.notasEvolucion ?? []).filter((n: any) => n.tipo === 'MEDICA');
  const signos = expediente?.signosVitales ?? [];
  const sinRegistros = notas.length === 0 && signos.length === 0;

  const SecTitle = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      fontSize: '11px', fontWeight: '800', color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
    }}>
      {children}
    </p>
  );

  const svLabels: Record<string, string> = {
    presionArterial: 'Presión', frecuenciaCardiaca: 'F. Card.',
    temperatura: 'Temp.', frecuenciaRespiratoria: 'F. Resp.',
    oxigenacion: 'O₂', peso: 'Peso',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '100%', maxWidth: '660px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

        <div style={{ padding: '1.75rem 2.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
              <History size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Historial Clínico</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                {paciente?.nombre} {paciente?.apellidoPaterno}
                {(notas.length > 0 || signos.length > 0) && (
                  <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: '700' }}>
                    · {notas.length} nota{notas.length !== 1 ? 's' : ''} · {signos.length} signo{signos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2.5rem' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Cargando historial...</p>
          ) : sinRegistros ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <ClipboardList size={48} color="#e2e8f0" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>Sin registros clínicos aún.</p>
              <p style={{ fontSize: '13px', marginTop: '0.5rem', color: '#94a3b8' }}>
                Usa el botón <strong>Valoración</strong> para agregar notas y signos vitales.
              </p>
            </div>
          ) : (
            <>
              {notas.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <SecTitle>Notas de Evolución Médica</SecTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {(notas as any[]).map((nota: any) => (
                      <div key={nota.id} style={{ backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '0.65rem 1rem', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={13} color="#64748b" />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                              {new Date(nota.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' · '}
                              {new Date(nota.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {nota.usuario && (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>
                              {nota.usuario.nombre} {nota.usuario.apellidos}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, padding: '0.9rem 1rem', fontSize: '14px', color: '#334155', lineHeight: '1.65' }}>
                          {nota.nota}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {signos.length > 0 && (
                <div>
                  <SecTitle>Registro de Signos Vitales</SecTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {(signos as any[]).map((sv: any) => {
                      const svItems = Object.entries(svLabels)
                        .map(([k, label]) => ({ label, value: sv[k] }))
                        .filter(({ value }) => value != null && value !== '');
                      return (
                        <div key={sv.id} style={{ backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                          <div style={{ padding: '0.65rem 1rem', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={13} color="#64748b" />
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                                {new Date(sv.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {' · '}
                                {new Date(sv.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {sv.usuario && (
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>
                                {sv.usuario.nombre} {sv.usuario.apellidos}
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {svItems.map(({ label, value }) => (
                              <div key={label} style={{ backgroundColor: 'white', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <p style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 0.2rem' }}>{label}</p>
                                <p style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '1.25rem 2.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.75rem 1.75rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Confirmar Détox ───────────────────────────────────────────────────

const DetoxConfirmModal = ({ isOpen, onClose, paciente, onConfirm, isPending }: {
  isOpen: boolean; onClose: () => void; paciente: Paciente | null; onConfirm: () => void; isPending: boolean;
}) => {
  if (!isOpen || !paciente) return null;
  const nombre = `${paciente.nombre ?? ''} ${paciente.apellidoPaterno ?? ''}`.trim();
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '440px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#fffbeb', padding: '0.65rem', borderRadius: '14px', display: 'flex' }}>
            <Droplets size={22} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>Traslado a Desintoxicación</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Acción requerirá confirmación</p>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.65', margin: '0 0 1.5rem', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '14px', padding: '1rem' }}>
          ¿Está seguro de enviar a <strong>{nombre}</strong> a Desintoxicación?<br />
          <span style={{ fontSize: '13px', color: '#92400e' }}>Se notificará al equipo médico y se liberará la cama actual.</span>
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isPending}
            style={{ padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', backgroundColor: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{ padding: '0.75rem 1.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(245,158,11,0.35)', opacity: isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Droplets size={15} />
            {isPending ? 'Enviando...' : 'Confirmar traslado'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function AreaMedica() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const config = ROL_CONFIG[(usuario?.rol as RolMedico) ?? 'AREA_MEDICA'];

  const RolIcon = usuario?.rol === 'PSICOLOGIA' ? Brain
    : usuario?.rol === 'NUTRICION' ? Apple
    : usuario?.rol === 'ENFERMERIA' ? Heart
    : Stethoscope;

  const [currentView, setCurrentView] = useState<'PROSPECTOS' | 'INTERNOS'>(
    config.showInbox ? 'PROSPECTOS' : 'INTERNOS'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sustanciasModal, setSustanciasModal] = useState({ isOpen: false, sustancias: [] as string[], nombre: '' });
  const [valoracionModal, setValoracionModal] = useState<{ isOpen: boolean; paciente: Paciente | null }>({ isOpen: false, paciente: null });
  const [detoxModal, setDetoxModal] = useState<{ isOpen: boolean; paciente: Paciente | null }>({ isOpen: false, paciente: null });

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: prospectos, isLoading: isLoadingProspectos } = useQuery<Paciente[]>({
    queryKey: ['prospectos_pendientes'],
    queryFn: () => apiClient.get('/pacientes?estado=PENDIENTE_VALORACION_MEDICA').then(r => r.data.data),
  });

  const { data: pacientesInternados, isLoading: isLoadingInternados } = useQuery<Paciente[]>({
    queryKey: ['pacientes_internados'],
    queryFn: () =>
      Promise.all([
        apiClient.get('/pacientes?estado=INTERNADO').then(r => r.data.data as Paciente[]),
        apiClient.get('/pacientes?estado=DETOX').then(r => r.data.data as Paciente[]),
      ]).then(([internados, detox]) => [...internados, ...detox]),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const archivarMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/pacientes/${id}/archivar`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospectos_pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes_internados'] });
    },
  });

  const detoxMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/pacientes/${id}/detox`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes_internados'] });
      setDetoxModal({ isOpen: false, paciente: null });
    },
  });

  const handleArchivar = (pac: Paciente) => {
    if (!window.confirm(`¿Archivar a ${pac.nombre} ${pac.apellidoPaterno}? Esta acción lo ocultará del sistema.`)) return;
    archivarMutation.mutate(pac.id);
  };

  // ── Internos agrupados por área ───────────────────────────────────────────

  const groupedByArea = (pacientesInternados ?? []).reduce<Record<string, Paciente[]>>((acc, pac) => {
    const area = pac.estado === 'DETOX' ? 'DETOX' : (pac.cama?.habitacion?.area ?? 'SIN_ASIGNAR');
    if (!acc[area]) acc[area] = [];
    acc[area].push(pac);
    return acc;
  }, {});

  const AREA_ORDER = ['HOMBRES', 'MUJERES', 'DETOX', 'SIN_ASIGNAR'];
  const visibleAreas = AREA_ORDER.filter(a => groupedByArea[a]?.length);

  // ── Filtro de búsqueda de prospectos ──────────────────────────────────────

  const filteredProspectos = (prospectos ?? []).filter(p =>
    !searchQuery || `${p.nombre} ${p.apellidoPaterno}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>

      {/* HEADER + TAB SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: config.acento, color: 'white', borderRadius: '16px' }}>
            <RolIcon size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{config.titulo}</h1>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: '600' }}>
              {config.descripcion} · {usuario?.nombre}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.4rem', borderRadius: '14px', gap: '0.25rem' }}>
          {config.showInbox && (
            <button
              onClick={() => setCurrentView('PROSPECTOS')}
              style={{
                padding: '0.7rem 1.4rem', borderRadius: '11px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: currentView === 'PROSPECTOS' ? 'white' : 'transparent',
                color: currentView === 'PROSPECTOS' ? config.acento : '#64748b',
                boxShadow: currentView === 'PROSPECTOS' ? '0 4px 6px -1px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <HeartPulse size={15} />
              Prospectos
              <span style={{
                backgroundColor: currentView === 'PROSPECTOS' ? '#eff6ff' : '#e2e8f0',
                color: currentView === 'PROSPECTOS' ? config.acento : '#64748b',
                borderRadius: '100px', padding: '0.1rem 0.5rem', fontSize: '12px', fontWeight: '900',
              }}>
                {prospectos?.length ?? 0}
              </span>
            </button>
          )}
          <button
            onClick={() => setCurrentView('INTERNOS')}
            style={{
              padding: '0.7rem 1.4rem', borderRadius: '11px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: currentView === 'INTERNOS' ? 'white' : 'transparent',
              color: currentView === 'INTERNOS' ? config.acento : '#64748b',
              boxShadow: currentView === 'INTERNOS' ? '0 4px 6px -1px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Users size={15} />
            Internos
            <span style={{
              backgroundColor: currentView === 'INTERNOS' ? '#eff6ff' : '#e2e8f0',
              color: currentView === 'INTERNOS' ? config.acento : '#64748b',
              borderRadius: '100px', padding: '0.1rem 0.5rem', fontSize: '12px', fontWeight: '900',
            }}>
              {pacientesInternados?.length ?? 0}
            </span>
          </button>
        </div>
      </div>

      {/* ══ VISTA: PROSPECTOS ════════════════════════════════════════════════ */}
      {currentView === 'PROSPECTOS' && (
        <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Cola de Valoración</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Prospectos pendientes de evaluación médica inicial.</p>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '0.9rem', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar prospecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.65rem 1rem 0.65rem 2.4rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', outline: 'none', width: '220px', color: '#334155' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.6rem' }}>
              <thead>
                <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {['Paciente', 'Edad / Sexo', 'Sustancias', 'Registro', 'Acciones'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 4 ? 'center' : 'left', padding: '0 1.25rem', fontWeight: '800' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingProspectos ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando prospectos...</td></tr>
                ) : filteredProspectos.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: '600' }}>No hay prospectos pendientes.</td></tr>
                ) : (
                  filteredProspectos.map(pac => {
                    const sustList = pac.primerContacto?.[0]?.sustancias ?? pac.sustancias ?? [];
                    return (
                      <tr key={pac.id} style={{ backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '1.1rem 1.25rem', borderRadius: '16px 0 0 16px' }}>
                          <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '14px' }}>{pac.nombre} {pac.apellidoPaterno}</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>#{pac.id}</p>
                        </td>
                        <td style={{ padding: '1.1rem 1.25rem' }}>
                          <p style={{ fontWeight: '600', color: '#475569', margin: 0 }}>{calcularEdad(pac.fechaNacimiento)} años</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{pac.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                        </td>
                        <td style={{ padding: '1.1rem 1.25rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                            {sustList.slice(0, 2).map((s, i) => (
                              <span key={i} style={{ backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569' }}>{s}</span>
                            ))}
                            {sustList.length > 2 && (
                              <button onClick={() => setSustanciasModal({ isOpen: true, sustancias: sustList, nombre: `${pac.nombre} ${pac.apellidoPaterno}` })}
                                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '11px', fontWeight: '900', color: '#3b82f6', cursor: 'pointer', padding: 0 }}>
                                +{sustList.length - 2}
                              </button>
                            )}
                            {sustList.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>N/E</span>}
                          </div>
                        </td>
                        <td style={{ padding: '1.1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                            <Calendar size={13} />
                            {pac.createdAt ? new Date(pac.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '1.1rem 1.25rem', borderRadius: '0 16px 16px 0' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => navigate(`/admisiones/valoracion-medica/${pac.id}`)}
                              style={{ ...actionBtn('#3b82f6'), padding: '0.5rem 1rem' }}
                            >
                              <Stethoscope size={14} /> Valorar
                            </button>
                            <button
                              onClick={() => handleArchivar(pac)}
                              disabled={archivarMutation.isPending}
                              style={{ ...actionBtn('#ef4444'), padding: '0.5rem 0.6rem' }}
                              title="Archivar prospecto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ VISTA: INTERNOS ══════════════════════════════════════════════════ */}
      {currentView === 'INTERNOS' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isLoadingInternados ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: '600' }}>Cargando pacientes internados...</div>
          ) : visibleAreas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <Users size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: '600' }}>No hay pacientes internados actualmente.</p>
            </div>
          ) : (
            visibleAreas.map(area => {
              const cfg = AREA_CONFIG[area];
              const pacs = groupedByArea[area];
              return (
                <div key={area} style={{ backgroundColor: 'white', borderRadius: '28px', border: `1.5px solid ${cfg.border}`, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>

                  {/* Habitacion header */}
                  <div style={{ padding: '1.25rem 2rem', backgroundColor: cfg.light, borderBottom: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 size={20} color={cfg.color} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{cfg.label}</h3>
                    <span style={{ marginLeft: 'auto', backgroundColor: cfg.color, color: 'white', borderRadius: '100px', padding: '0.2rem 0.75rem', fontSize: '13px', fontWeight: '800' }}>
                      {pacs.length} paciente{pacs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Patient rows */}
                  <div style={{ padding: '0.5rem 1rem 1rem' }}>
                    {pacs.map((pac, idx) => (
                      <div
                        key={pac.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '16px',
                          backgroundColor: idx % 2 === 0 ? '#f8fafc' : 'white',
                          marginTop: '0.4rem',
                          border: '1px solid transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = cfg.light; e.currentTarget.style.borderColor = cfg.border; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#f8fafc' : 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        {/* Avatar */}
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, fontWeight: '900', fontSize: '16px', flexShrink: 0 }}>
                          {pac.nombre?.[0] ?? '?'}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: '800', color: '#1e293b', margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pac.nombre} {pac.apellidoPaterno}
                          </p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '600' }}>
                            Cama {pac.cama?.numero ?? 'S/A'} · {calcularEdad(pac.fechaNacimiento)} años · {pac.sexo === 'M' ? 'Masculino' : 'Femenino'}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {(usuario?.rol === 'AREA_MEDICA' || usuario?.rol === 'JEFE_MEDICO' || usuario?.rol === 'ADMIN_GENERAL') && (
                            <button
                              onClick={() => navigate(`/medica/egreso/${pac.id}`)}
                              style={actionBtn('#ef4444')}
                              title="Iniciar proceso de egreso"
                            >
                              <LogOut size={13} /> Egreso
                            </button>
                          )}
                          {/* Expediente directo */}
                          <button
                            onClick={() => navigate(`/medico/expediente/${pac.id}`)}
                            style={actionBtn('#10b981')}
                            title="Ver expediente digital completo"
                          >
                            <Folder size={13} /> Expediente
                          </button>
                          <button
                            onClick={() => setValoracionModal({ isOpen: true, paciente: pac })}
                            style={actionBtn('#3b82f6')}
                            title="Registrar valoración"
                          >
                            <Stethoscope size={13} /> Valoración
                          </button>
                          <button
                            onClick={() => setDetoxModal({ isOpen: true, paciente: pac })}
                            disabled={pac.estado === 'DETOX'}
                            style={{ ...actionBtn('#f59e0b'), opacity: pac.estado === 'DETOX' ? 0.45 : 1, cursor: pac.estado === 'DETOX' ? 'not-allowed' : 'pointer' }}
                            title={pac.estado === 'DETOX' ? 'Ya en Desintoxicación' : 'Enviar a Desintoxicación'}
                          >
                            <Droplets size={13} /> Détox
                          </button>
                          <button
                            onClick={() => handleArchivar(pac)}
                            disabled={archivarMutation.isPending}
                            style={actionBtn('#ef4444')}
                            title="Archivar paciente"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODALES */}
      <DetoxConfirmModal
        isOpen={detoxModal.isOpen}
        onClose={() => setDetoxModal({ isOpen: false, paciente: null })}
        paciente={detoxModal.paciente}
        onConfirm={() => detoxModal.paciente && detoxMutation.mutate(detoxModal.paciente.id)}
        isPending={detoxMutation.isPending}
      />
      <VerSustanciasModal
        isOpen={sustanciasModal.isOpen}
        onClose={() => setSustanciasModal(s => ({ ...s, isOpen: false }))}
        sustancias={sustanciasModal.sustancias}
        nombrePaciente={sustanciasModal.nombre}
      />
      <ValoracionInternaModal
        isOpen={valoracionModal.isOpen}
        onClose={() => setValoracionModal({ isOpen: false, paciente: null })}
        paciente={valoracionModal.paciente}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pacientes_internados'] })}
      />
    </div>
  );
}
