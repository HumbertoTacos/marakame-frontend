import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, CheckCircle2, AlertTriangle, Send, Banknote, Clock,
  User, X, Inbox, FileText, ChevronRight,
} from 'lucide-react';
import apiClient from '../../services/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EstadoValidacion = 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'OBSERVADO' | 'DEPOSITADO' | 'FACTURADO';

interface Ingreso {
  id: number;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  concepto: string;
  folioRecibo: string | null;
  estadoValidacion: EstadoValidacion;
  observaciones: string | null;
  numeroDeposito: string | null;
  fechaDeposito: string | null;
  fichaDepositoUrl: string | null;
  fechaValidacion: string | null;
  paciente: {
    id: number;
    claveUnica: string | null;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
  };
  usuarioRecibe: { id: number; nombre: string; apellidos: string };
  validadoPor: { id: number; nombre: string; apellidos: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const ESTADO_CONFIG: Record<EstadoValidacion, { label: string; bg: string; color: string; border: string }> = {
  PENDIENTE_VALIDACION: { label: 'Pendiente', bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  OBSERVADO:            { label: 'Observado', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  VALIDADO:             { label: 'Validado',  bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
  DEPOSITADO:           { label: 'Depositado', bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
  FACTURADO:            { label: 'Facturado', bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
};

const nombreCompleto = (p: Ingreso['paciente']) =>
  `${p.nombre} ${p.apellidoPaterno}${p.apellidoMaterno ? ` ${p.apellidoMaterno}` : ''}`.trim();

// ── Modal: Observar ingreso ───────────────────────────────────────────────────

const ModalObservar = ({
  ingreso, onClose, onSuccess,
}: { ingreso: Ingreso | null; onClose: () => void; onSuccess: () => void }) => {
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/recursos-financieros/ingresos/${ingreso!.id}/observar`, { observaciones }),
    onSuccess: () => { onSuccess(); onClose(); setObservaciones(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al observar el ingreso'),
  });

  if (!ingreso) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '90%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Observar ingreso</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b' }}>
              Folio {ingreso.folioRecibo} · {fmt(ingreso.monto)}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ backgroundColor: '#fef2f2', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid #fecaca' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atención</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#7f1d1d' }}>
            El ingreso será devuelto a {ingreso.usuarioRecibe.nombre} {ingreso.usuarioRecibe.apellidos} para corrección.
          </p>
        </div>

        <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
          Motivo de la observación *
        </label>
        <textarea
          rows={5}
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Ej: El monto del recibo no coincide con el efectivo entregado. Falta una firma en la ficha…"
          style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
        />

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', background: 'white', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '14px' }}>
            Cancelar
          </button>
          <button
            onClick={() => { setError(''); if (observaciones.trim().length < 3) return setError('Las observaciones son obligatorias'); mutation.mutate(); }}
            disabled={mutation.isPending}
            style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}
          >
            {mutation.isPending ? 'Enviando…' : 'Devolver a Admisiones'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal: Registrar depósito ─────────────────────────────────────────────────

const ModalDepositar = ({
  ingreso, onClose, onSuccess,
}: { ingreso: Ingreso | null; onClose: () => void; onSuccess: () => void }) => {
  const [form, setForm] = useState({
    numeroDeposito: '',
    fechaDeposito: new Date().toISOString().slice(0, 10),
    fichaDepositoUrl: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/recursos-financieros/ingresos/${ingreso!.id}/depositar`, {
      numeroDeposito: form.numeroDeposito.trim(),
      fechaDeposito: form.fechaDeposito,
      fichaDepositoUrl: form.fichaDepositoUrl.trim() || undefined,
    }),
    onSuccess: () => { onSuccess(); onClose(); setForm({ numeroDeposito: '', fechaDeposito: new Date().toISOString().slice(0, 10), fichaDepositoUrl: '' }); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al registrar el depósito'),
  });

  if (!ingreso) return null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '90%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Registrar depósito</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b' }}>
              Folio {ingreso.folioRecibo} · {fmt(ingreso.monto)}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Número de depósito *</label>
            <input type="text" placeholder="Ej: DEP-20260513-001" value={form.numeroDeposito}
              onChange={e => setForm(f => ({ ...f, numeroDeposito: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Fecha de depósito *</label>
            <input type="date" value={form.fechaDeposito}
              onChange={e => setForm(f => ({ ...f, fechaDeposito: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>URL de la ficha (opcional)</label>
            <input type="text" placeholder="/uploads/fichas/..." value={form.fichaDepositoUrl}
              onChange={e => setForm(f => ({ ...f, fichaDepositoUrl: e.target.value }))} style={inp} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', background: 'white', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '14px' }}>
            Cancelar
          </button>
          <button
            onClick={() => { setError(''); if (!form.numeroDeposito.trim()) return setError('El número de depósito es obligatorio'); mutation.mutate(); }}
            disabled={mutation.isPending}
            style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}
          >
            {mutation.isPending ? 'Registrando…' : 'Registrar depósito'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────

const ESTADOS: { value: EstadoValidacion | 'TODOS'; label: string; icon: typeof Inbox }[] = [
  { value: 'PENDIENTE_VALIDACION', label: 'Pendientes',  icon: Clock },
  { value: 'OBSERVADO',            label: 'Observados',  icon: AlertTriangle },
  { value: 'VALIDADO',             label: 'Validados',   icon: CheckCircle2 },
  { value: 'DEPOSITADO',           label: 'Depositados', icon: Banknote },
  { value: 'FACTURADO',            label: 'Facturados',  icon: FileText },
];

export default function IngresosPendientes() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<EstadoValidacion>('PENDIENTE_VALIDACION');
  const [obsTarget, setObsTarget] = useState<Ingreso | null>(null);
  const [depTarget, setDepTarget] = useState<Ingreso | null>(null);

  const { data, isLoading } = useQuery<Ingreso[]>({
    queryKey: ['rf_ingresos', tab],
    queryFn: () => apiClient.get(`/recursos-financieros/ingresos?estado=${tab}`).then(r => r.data.data),
  });

  const { data: counts } = useQuery<Record<EstadoValidacion, number>>({
    queryKey: ['rf_dashboard'],
    queryFn: () => apiClient.get('/recursos-financieros/dashboard').then(r => {
      const d = r.data.data;
      return {
        PENDIENTE_VALIDACION: d.pendientes,
        OBSERVADO: d.observados,
        VALIDADO: d.validados,
        DEPOSITADO: d.depositados,
        FACTURADO: 0,
      };
    }),
  });

  const validar = useMutation({
    mutationFn: (id: number) => apiClient.post(`/recursos-financieros/ingresos/${id}/validar`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rf_ingresos'] });
      queryClient.invalidateQueries({ queryKey: ['rf_dashboard'] });
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rf_ingresos'] });
    queryClient.invalidateQueries({ queryKey: ['rf_dashboard'] });
  };

  const ingresos = data ?? [];
  const totalMontoTab = ingresos.reduce((s, p) => s + p.monto, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#0ea5e9', borderRadius: '16px' }}>
            <Inbox size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Bandeja de Ingresos</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '600' }}>
              Validación, observación y depósito de recibos foliados de Admisiones
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total {ESTADOS.find(e => e.value === tab)?.label.toLowerCase()}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
            {fmt(totalMontoTab)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
        {ESTADOS.map(estado => {
          const cfg = ESTADO_CONFIG[estado.value as EstadoValidacion];
          const isActive = tab === estado.value;
          const count = counts?.[estado.value as EstadoValidacion] ?? 0;
          return (
            <button
              key={estado.value}
              onClick={() => setTab(estado.value as EstadoValidacion)}
              style={{
                padding: '1.25rem 1rem',
                background: isActive ? cfg.bg : 'white',
                border: isActive ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                borderRadius: '18px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                boxShadow: isActive ? `0 6px 16px ${cfg.color}30` : 'var(--shadow)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <estado.icon size={16} color={isActive ? cfg.color : '#94a3b8'} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: isActive ? cfg.color : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {estado.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: isActive ? cfg.color : '#0f172a' }}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Cargando ingresos…</div>
        ) : ingresos.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <Receipt size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.25 }} />
            <p style={{ fontWeight: '700', margin: 0 }}>No hay ingresos en este estado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left',  padding: '0.875rem 1.5rem', fontWeight: '800' }}>Folio</th>
                <th style={{ textAlign: 'left',  padding: '0.875rem 1rem',   fontWeight: '800' }}>Paciente</th>
                <th style={{ textAlign: 'left',  padding: '0.875rem 1rem',   fontWeight: '800' }}>Concepto</th>
                <th style={{ textAlign: 'left',  padding: '0.875rem 1rem',   fontWeight: '800' }}>Recibido por</th>
                <th style={{ textAlign: 'left',  padding: '0.875rem 1rem',   fontWeight: '800' }}>Fecha</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem',   fontWeight: '800' }}>Monto</th>
                <th style={{ textAlign: 'center',padding: '0.875rem 1.5rem', fontWeight: '800' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ing, idx) => (
                <tr key={ing.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.1rem 1.5rem', fontFamily: 'ui-monospace, monospace', fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>
                    {ing.folioRecibo ?? '—'}
                  </td>
                  <td style={{ padding: '1.1rem 1rem' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{nombreCompleto(ing.paciente)}</p>
                    {ing.paciente.claveUnica && (
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>#{ing.paciente.claveUnica}</p>
                    )}
                  </td>
                  <td style={{ padding: '1.1rem 1rem', color: '#475569', fontSize: '13px', fontWeight: '600' }}>{ing.concepto}</td>
                  <td style={{ padding: '1.1rem 1rem', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={13} /> {ing.usuarioRecibe.nombre} {ing.usuarioRecibe.apellidos}
                    </div>
                  </td>
                  <td style={{ padding: '1.1rem 1rem', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    {new Date(ing.fechaPago).toLocaleDateString('es-MX')}
                  </td>
                  <td style={{ padding: '1.1rem 1rem', textAlign: 'right', fontWeight: '900', color: '#10b981', fontSize: '15px' }}>
                    {fmt(ing.monto)}
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      {ing.estadoValidacion === 'PENDIENTE_VALIDACION' && (
                        <>
                          <button
                            onClick={() => validar.mutate(ing.id)}
                            disabled={validar.isPending}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', border: 'none', borderRadius: '8px', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
                          >
                            <CheckCircle2 size={14} /> Validar
                          </button>
                          <button
                            onClick={() => setObsTarget(ing)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', border: '1.5px solid #ef4444', borderRadius: '8px', background: 'white', color: '#ef4444', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
                          >
                            <AlertTriangle size={14} /> Observar
                          </button>
                        </>
                      )}
                      {ing.estadoValidacion === 'VALIDADO' && (
                        <button
                          onClick={() => setDepTarget(ing)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', border: 'none', borderRadius: '8px', background: '#7c3aed', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
                        >
                          <Send size={14} /> Depositar
                        </button>
                      )}
                      {ing.estadoValidacion === 'OBSERVADO' && (
                        <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <ChevronRight size={14} /> Esperando corrección
                        </span>
                      )}
                      {ing.estadoValidacion === 'DEPOSITADO' && ing.numeroDeposito && (
                        <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '700', fontFamily: 'ui-monospace, monospace' }}>
                          {ing.numeroDeposito}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalObservar  ingreso={obsTarget} onClose={() => setObsTarget(null)} onSuccess={refresh} />
      <ModalDepositar ingreso={depTarget} onClose={() => setDepTarget(null)} onSuccess={refresh} />
    </div>
  );
}
