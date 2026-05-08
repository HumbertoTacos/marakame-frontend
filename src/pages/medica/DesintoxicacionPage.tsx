import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Droplets, User, BedDouble, X, Save, CheckCircle, Loader2,
  AlertTriangle, Pill, ClipboardList, Users,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Paciente } from '../../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const calcularEdad = (fn: string | Date | null | undefined): number => {
  if (!fn) return 0;
  const d = new Date(fn as string);
  if (isNaN(d.getTime())) return 0;
  const hoy = new Date();
  let a = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) a--;
  return a < 0 || a > 120 ? 0 : a;
};

// ─── Modal: Evolución Détox ───────────────────────────────────────────────────

interface EvolucionModalProps {
  paciente: Paciente | null;
  onClose: () => void;
}

const EvolucionDetoxModal: React.FC<EvolucionModalProps> = ({ paciente, onClose }) => {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    planEvolucion: '',
    medicamentos: '',
    enfermera: '',
  });

  const { data: expediente, isLoading: loadingExp } = useQuery<any>({
    queryKey: ['expediente_detox', paciente?.id],
    queryFn: () =>
      apiClient.get(`/expedientes/paciente/${paciente!.id}`).then(r => r.data.data),
    enabled: !!paciente?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!expediente?.id) throw new Error('Sin expediente activo');
      if (!form.planEvolucion.trim()) throw new Error('El plan de evolución es requerido');

      const nota = [
        `PLAN DE EVOLUCIÓN DÉTOX:\n${form.planEvolucion.trim()}`,
        form.medicamentos.trim() ? `\nMEDICAMENTOS ESPECÍFICOS:\n${form.medicamentos.trim()}` : '',
        form.enfermera.trim() ? `\nENFERMERA A CARGO: ${form.enfermera.trim()}` : '',
      ].join('');

      await apiClient.post(`/expedientes/${expediente.id}/notas`, {
        usuarioId: usuario?.id,
        tipo: 'MEDICA',
        nota,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes_detox'] });
      onClose();
    },
  });

  if (!paciente) return null;

  const nombre = `${paciente.nombre ?? ''} ${paciente.apellidoPaterno ?? ''}`.trim();

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#1e293b',
    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '1.75rem 2rem', borderBottom: '3px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#fffbeb', padding: '0.65rem', borderRadius: '14px' }}>
              <ClipboardList size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Evolución Détox</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>{nombre}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          {loadingExp ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <Loader2 size={28} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              Cargando expediente...
            </div>
          ) : !expediente ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', fontWeight: '600', fontSize: '14px' }}>
              Este paciente no tiene expediente activo.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Plan de Evolución *
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe el plan clínico de evolución durante el proceso de desintoxicación..."
                  value={form.planEvolucion}
                  onChange={e => setForm(f => ({ ...f, planEvolucion: e.target.value }))}
                  style={inp}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  <Pill size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Medicamentos Específicos
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Diazepam 10mg c/8h, Tiamina 100mg c/24h..."
                  value={form.medicamentos}
                  onChange={e => setForm(f => ({ ...f, medicamentos: e.target.value }))}
                  style={inp}
                />
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Enfermera a Cargo
                </label>
                <input
                  type="text"
                  placeholder="Nombre de la enfermera responsable..."
                  value={form.enfermera}
                  onChange={e => setForm(f => ({ ...f, enfermera: e.target.value }))}
                  style={{ ...inp, resize: undefined }}
                />
              </div>

              {saveMutation.isError && (
                <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '700', marginTop: '0.75rem' }}>
                  {(saveMutation.error as Error).message}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {expediente && (
          <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', backgroundColor: 'white', fontWeight: '700', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>
              Cancelar
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={{ padding: '0.75rem 1.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)', opacity: saveMutation.isPending ? 0.7 : 1 }}
            >
              {saveMutation.isPending ? <Loader2 size={16} /> : <Save size={16} />}
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Evolución'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Modal: Confirmar Finalizar Détox ─────────────────────────────────────────

interface FinalizarModalProps {
  paciente: Paciente | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const FinalizarDetoxModal: React.FC<FinalizarModalProps> = ({ paciente, isPending, onConfirm, onClose }) => {
  if (!paciente) return null;
  const nombre = `${paciente.nombre ?? ''} ${paciente.apellidoPaterno ?? ''}`.trim();

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '440px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
          ¿Finalizar Desintoxicación?
        </h3>
        <p style={{ margin: '0 0 0.5rem', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
          {nombre}
        </p>
        <p style={{ margin: '0 0 2rem', fontSize: '13px', color: '#64748b', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.85rem' }}>
          El paciente regresará al estado <strong>INTERNADO</strong> y quedará disponible en el módulo médico general.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={onClose} disabled={isPending} style={{ padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', backgroundColor: 'white', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{ padding: '0.75rem 1.75rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? <Loader2 size={16} /> : <CheckCircle size={16} />}
            {isPending ? 'Procesando...' : 'Confirmar Egreso Détox'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function DesintoxicacionPage() {
  const queryClient = useQueryClient();

  const [evolucionModal, setEvolucionModal] = useState<Paciente | null>(null);
  const [finalizarModal, setFinalizarModal] = useState<Paciente | null>(null);

  const { data: pacientes, isLoading } = useQuery<Paciente[]>({
    queryKey: ['pacientes_detox'],
    queryFn: () => apiClient.get('/pacientes?estado=DETOX').then(r => r.data.data ?? []),
  });

  const finalizarMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/pacientes/${id}/finalizar-detox`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes_detox'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes_internados'] });
      setFinalizarModal(null);
    },
    onError: () => alert('Error al finalizar la desintoxicación.'),
  });

  const total = pacientes?.length ?? 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '16px' }}>
            <Droplets size={26} color="#f59e0b" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>Desintoxicación</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pacientes en proceso de desintoxicación activa</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} color="#f59e0b" />
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#92400e' }}>
            {total} paciente{total !== 1 ? 's' : ''} en détox
          </span>
        </div>
      </div>

      {/* Lista de pacientes */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1.5px solid #fde68a', overflow: 'hidden', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}>
        {/* Cabecera de sección */}
        <div style={{ padding: '1rem 2rem', backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Droplets size={18} color="#f59e0b" />
          <span style={{ fontWeight: '900', fontSize: '14px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pacientes en Détox
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <Loader2 size={32} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <p style={{ fontWeight: '600', margin: 0 }}>Cargando pacientes...</p>
          </div>
        ) : total === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Droplets size={48} color="#fde68a" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8', fontWeight: '600', margin: 0, fontSize: '15px' }}>No hay pacientes en desintoxicación actualmente.</p>
            <p style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '0.5rem' }}>Los pacientes aparecerán aquí cuando se les asigne estado DÉTOX desde el Área Médica.</p>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {(pacientes ?? []).map((pac, idx) => {
              const edad = calcularEdad(pac.fechaNacimiento);
              return (
                <div
                  key={pac.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1.25rem',
                    padding: '1.25rem 1.5rem', borderRadius: '18px',
                    backgroundColor: idx % 2 === 0 ? '#fffbeb' : 'white',
                    marginBottom: '0.5rem', border: '1px solid #fde68a',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: '900', fontSize: '18px', flexShrink: 0, border: '2px solid #fde68a' }}>
                    {pac.nombre?.[0] ?? '?'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '800', color: '#1e293b', margin: 0, fontSize: '15px' }}>
                      {pac.nombre} {pac.apellidoPaterno} {pac.apellidoMaterno}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {edad > 0 && (
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={11} /> {edad} años · {pac.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </span>
                      )}
                      {pac.cama && (
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <BedDouble size={11} /> Cama {pac.cama.numero ?? 'S/A'}
                          {pac.cama.habitacion?.nombre ? ` — ${pac.cama.habitacion.nombre}` : ''}
                        </span>
                      )}
                      {pac.tipoAdiccion && (
                        <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.15rem 0.6rem', borderRadius: '6px', fontWeight: '800' }}>
                          {pac.tipoAdiccion}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge estado */}
                  <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.3rem 0.9rem', borderRadius: '100px', fontSize: '11px', fontWeight: '900', border: '1px solid #fde68a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    DÉTOX ACTIVO
                  </span>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                    <button
                      onClick={() => setEvolucionModal(pac)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', backgroundColor: '#fffbeb', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <ClipboardList size={14} /> Evolución
                    </button>
                    <button
                      onClick={() => setFinalizarModal(pac)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <CheckCircle size={14} /> Finalizar Détox
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aviso informativo */}
      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.5rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px' }}>
          <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: '600', lineHeight: '1.5' }}>
            Al finalizar la desintoxicación, el paciente retornará al estado <strong>INTERNADO</strong> y podrá ser atendido en el módulo médico general. Registre una evolución antes de finalizar para mantener el historial clínico completo.
          </p>
        </div>
      )}

      {/* Modales */}
      {evolucionModal && (
        <EvolucionDetoxModal
          paciente={evolucionModal}
          onClose={() => setEvolucionModal(null)}
        />
      )}

      <FinalizarDetoxModal
        paciente={finalizarModal}
        isPending={finalizarMutation.isPending}
        onConfirm={() => finalizarModal && finalizarMutation.mutate(finalizarModal.id)}
        onClose={() => setFinalizarModal(null)}
      />
    </div>
  );
}
