import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, CreditCard, TrendingUp, TrendingDown, AlertCircle,
  Plus, CheckCircle, X, Search, ChevronRight, Banknote, ArrowLeft,
  Receipt, ClipboardList, Clock,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ResumenPaciente {
  id: number;
  claveUnica: string | null;
  nombre: string;
  fechaIngreso: string;
  cama: string;
  totalCargos: number;
  totalPagado: number;
  saldoPendiente: number;
  alDia: boolean;
}

interface Cargo {
  id: number;
  monto: number;
  concepto: string;
  fechaCargo: string;
  pagado: boolean;
  usuarioCarga: { nombre: string; apellidos: string };
}

type EstadoValidacion = 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'OBSERVADO' | 'DEPOSITADO' | 'FACTURADO';

interface Pago {
  id: number;
  monto: number;
  concepto: string;
  fechaPago: string;
  metodoPago: string;
  facturado: boolean;
  folioRecibo: string | null;
  estadoValidacion: EstadoValidacion;
  observaciones: string | null;
  usuarioRecibe: { nombre: string; apellidos: string };
}

const ESTADO_VALIDACION_STYLE: Record<EstadoValidacion, { label: string; bg: string; color: string }> = {
  PENDIENTE_VALIDACION: { label: 'Por validar',  bg: '#fef3c7', color: '#d97706' },
  OBSERVADO:            { label: 'Observado',    bg: '#fee2e2', color: '#dc2626' },
  VALIDADO:             { label: 'Validado',     bg: '#dbeafe', color: '#2563eb' },
  DEPOSITADO:           { label: 'Depositado',   bg: '#ede9fe', color: '#7c3aed' },
  FACTURADO:            { label: 'Facturado',    bg: '#dcfce7', color: '#16a34a' },
};

interface EstadoCuenta {
  paciente: { id: number; claveUnica: string | null; nombre: string; estado: string; fechaIngreso: string; cama: string };
  resumen: { totalCargos: number; totalPagado: number; saldoPendiente: number };
  cargos: Cargo[];
  pagos: Pago[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const METODO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta', OTRO: 'Otro',
};

const METODO_COLORS: Record<string, string> = {
  EFECTIVO: '#10b981', TRANSFERENCIA: '#3b82f6', TARJETA: '#8b5cf6', OTRO: '#64748b',
};

// ── Modal: Registrar Pago ─────────────────────────────────────────────────────

const ModalRegistrarPago = ({
  isOpen, onClose, paciente, onSuccess,
}: { isOpen: boolean; onClose: () => void; paciente: ResumenPaciente | null; onSuccess: () => void }) => {
  const { usuario } = useAuthStore();
  const [form, setForm] = useState({ monto: '', metodoPago: 'EFECTIVO', concepto: '', folioRecibo: '' });
  const [error, setError] = useState('');

  const esEfectivo = form.metodoPago === 'EFECTIVO';

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/pagos/paciente/${paciente!.id}`, {
      monto: parseFloat(form.monto),
      metodoPago: form.metodoPago,
      concepto: form.concepto,
      folioRecibo: esEfectivo ? form.folioRecibo.trim() : undefined,
    }),
    onSuccess: () => { onSuccess(); onClose(); setForm({ monto: '', metodoPago: 'EFECTIVO', concepto: '', folioRecibo: '' }); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al registrar el pago'),
  });

  const handleSubmit = () => {
    if (!form.monto || parseFloat(form.monto) <= 0) return setError('Ingresa un monto válido');
    if (!form.concepto.trim()) return setError('El concepto es requerido');
    if (esEfectivo && !form.folioRecibo.trim()) return setError('El folio de recibo es obligatorio para pagos en efectivo');
    setError('');
    mutation.mutate();
  };

  if (!isOpen || !paciente) return null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '90%', maxWidth: '480px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Registrar Pago</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b' }}>{paciente.nombre}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        {/* Saldo actual */}
        <div style={{ backgroundColor: paciente.saldoPendiente > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: `1px solid ${paciente.saldoPendiente > 0 ? '#fecaca' : '#bbf7d0'}` }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo pendiente actual</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '22px', fontWeight: '900', color: paciente.saldoPendiente > 0 ? '#ef4444' : '#10b981' }}>
            {fmt(paciente.saldoPendiente)}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Monto a pagar (MXN) *</label>
            <input type="number" min="1" step="0.01" placeholder="0.00" value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Método de pago *</label>
            <select value={form.metodoPago} onChange={e => setForm(f => ({ ...f, metodoPago: e.target.value }))} style={{ ...inp, backgroundColor: 'white' }}>
              {Object.entries(METODO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {esEfectivo && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Folio del recibo foliado *
              </label>
              <input
                type="text"
                placeholder="Ej: REC-001234"
                value={form.folioRecibo}
                onChange={e => setForm(f => ({ ...f, folioRecibo: e.target.value }))}
                style={inp}
              />
              <p style={{ margin: '0.4rem 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                Captura el folio del talonario físico. Recursos Financieros validará el cuadre con el monto.
              </p>
            </div>
          )}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Concepto *</label>
            <input type="text" placeholder="Ej: Mensualidad Mayo, Semana 3..." value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} style={inp} />
          </div>
        </div>

        {esEfectivo && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', color: '#1e40af', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={14} />
            El pago entrará al flujo de validación de Recursos Financieros.
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', background: 'white', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '14px' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
            {mutation.isPending ? 'Registrando...' : `Registrar ${form.monto ? fmt(parseFloat(form.monto) || 0) : 'Pago'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal: Agregar Cargo ──────────────────────────────────────────────────────

const ModalAgregarCargo = ({
  isOpen, onClose, paciente, onSuccess,
}: { isOpen: boolean; onClose: () => void; paciente: ResumenPaciente | null; onSuccess: () => void }) => {
  const [form, setForm] = useState({ monto: '', concepto: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/pagos/paciente/${paciente!.id}/cargos`, {
      monto: parseFloat(form.monto),
      concepto: form.concepto,
    }),
    onSuccess: () => { onSuccess(); onClose(); setForm({ monto: '', concepto: '' }); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al agregar el cargo'),
  });

  const handleSubmit = () => {
    if (!form.monto || parseFloat(form.monto) <= 0) return setError('Ingresa un monto válido');
    if (!form.concepto.trim()) return setError('El concepto es requerido');
    setError('');
    mutation.mutate();
  };

  if (!isOpen || !paciente) return null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '90%', maxWidth: '440px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Agregar Cargo</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b' }}>{paciente.nombre}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Monto del cargo (MXN) *</label>
            <input type="number" min="1" step="0.01" placeholder="0.00" value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Concepto *</label>
            <input type="text" placeholder="Ej: Internamiento semana 1, Medicamentos..." value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} style={inp} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', background: 'white', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '14px' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            {mutation.isPending ? 'Guardando...' : 'Agregar Cargo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Vista detalle de un paciente ──────────────────────────────────────────────

const DetallePaciente = ({
  paciente, onBack,
}: { paciente: ResumenPaciente; onBack: () => void }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pagos' | 'cargos'>('pagos');
  const [modalPago, setModalPago]   = useState(false);
  const [modalCargo, setModalCargo] = useState(false);

  const { data, isLoading } = useQuery<EstadoCuenta>({
    queryKey: ['estado_cuenta', paciente.id],
    queryFn: () => apiClient.get(`/pagos/paciente/${paciente.id}/estado-cuenta`).then(r => r.data.data),
  });

  const marcarPagado = useMutation({
    mutationFn: (cargoId: number) => apiClient.patch(`/pagos/cargos/${cargoId}/marcar-pagado`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estado_cuenta', paciente.id] }),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['estado_cuenta', paciente.id] });
    queryClient.invalidateQueries({ queryKey: ['resumen_pagos'] });
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
      Cargando estado de cuenta...
    </div>
  );

  if (!data) return null;

  const { resumen, cargos, pagos } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: 'white', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{data.paciente.nombre}</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Cama: {data.paciente.cama} · Ingreso: {new Date(data.paciente.fechaIngreso).toLocaleDateString('es-MX')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setModalCargo(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', border: '1.5px solid #f59e0b', borderRadius: '12px', background: 'white', color: '#f59e0b', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
            <Plus size={16} /> Agregar Cargo
          </button>
          <button onClick={() => setModalPago(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
            <DollarSign size={16} /> Registrar Pago
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Total Cargado', value: fmt(resumen.totalCargos), icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Total Pagado',  value: fmt(resumen.totalPagado),  icon: CheckCircle, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Saldo Pendiente', value: fmt(resumen.saldoPendiente), icon: resumen.saldoPendiente > 0 ? AlertCircle : CheckCircle, color: resumen.saldoPendiente > 0 ? '#ef4444' : '#10b981', bg: resumen.saldoPendiente > 0 ? '#fef2f2' : '#f0fdf4', border: resumen.saldoPendiente > 0 ? '#fecaca' : '#bbf7d0' },
        ].map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: kpi.bg, borderRadius: '20px', padding: '1.5rem', border: `1px solid ${kpi.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', backgroundColor: `${kpi.color}20`, borderRadius: '12px' }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Tabla */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 2rem' }}>
          {([
            { id: 'pagos', label: `Pagos Recibidos (${pagos.length})`, icon: Receipt },
            { id: 'cargos', label: `Cargos / Deuda (${cargos.length})`, icon: ClipboardList },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '14px', color: activeTab === tab.id ? '#0f172a' : '#94a3b8', borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent', marginRight: '1.5rem' }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem 2rem' }}>
          {activeTab === 'pagos' && (
            pagos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <DollarSign size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                <p style={{ fontWeight: '700' }}>No hay pagos registrados aún</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Folio</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Concepto</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Método</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Estado</th>
                    <th style={{ textAlign: 'right', padding: '0 1rem', fontWeight: '800' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map(pago => {
                    const estilo = ESTADO_VALIDACION_STYLE[pago.estadoValidacion];
                    return (
                      <tr key={pago.id} style={{ backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                        <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                            <Clock size={14} /> {new Date(pago.fechaPago).toLocaleDateString('es-MX')}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '13px', color: '#475569', fontWeight: '700', fontFamily: 'ui-monospace, monospace' }}>
                          {pago.folioRecibo ?? '—'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{pago.concepto}</span>
                          {pago.observaciones && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }} title={pago.observaciones}>
                              Obs: {pago.observaciones.length > 40 ? pago.observaciones.slice(0, 40) + '…' : pago.observaciones}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ backgroundColor: `${METODO_COLORS[pago.metodoPago]}18`, color: METODO_COLORS[pago.metodoPago], padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '12px', fontWeight: '800', border: `1px solid ${METODO_COLORS[pago.metodoPago]}30` }}>
                            {METODO_LABELS[pago.metodoPago] ?? pago.metodoPago}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ backgroundColor: estilo.bg, color: estilo.color, padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                            {estilo.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                          <span style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>{fmt(pago.monto)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'cargos' && (
            cargos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <ClipboardList size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                <p style={{ fontWeight: '700' }}>No hay cargos registrados</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Concepto</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem', fontWeight: '800' }}>Estado</th>
                    <th style={{ textAlign: 'right', padding: '0 1rem', fontWeight: '800' }}>Monto</th>
                    <th style={{ textAlign: 'center', padding: '0 1rem', fontWeight: '800' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cargos.map(cargo => (
                    <tr key={cargo.id} style={{ backgroundColor: cargo.pagado ? '#f0fdf4' : '#fef9f0', borderRadius: '12px' }}>
                      <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                          <Clock size={14} /> {new Date(cargo.fechaCargo).toLocaleDateString('es-MX')}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{cargo.concepto}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: cargo.pagado ? '#dcfce7' : '#fef3c7', color: cargo.pagado ? '#16a34a' : '#d97706', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                          {cargo.pagado ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: cargo.pagado ? '#10b981' : '#f59e0b' }}>{fmt(cargo.monto)}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                        {!cargo.pagado && (
                          <button onClick={() => marcarPagado.mutate(cargo.id)} disabled={marcarPagado.isPending}
                            style={{ padding: '0.4rem 0.85rem', border: '1.5px solid #10b981', borderRadius: '8px', background: 'white', color: '#10b981', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                            Marcar pagado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      <ModalRegistrarPago isOpen={modalPago} onClose={() => setModalPago(false)} paciente={paciente} onSuccess={onRefresh} />
      <ModalAgregarCargo  isOpen={modalCargo} onClose={() => setModalCargo(false)} paciente={paciente} onSuccess={onRefresh} />
    </div>
  );
};

// ── Vista principal: lista de pacientes ───────────────────────────────────────

export default function PagosPacientePage() {
  const [busqueda, setBusqueda] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<ResumenPaciente | null>(null);
  const [modalPago, setModalPago]   = useState(false);
  const [modalCargo, setModalCargo] = useState(false);
  const [pacienteModal, setPacienteModal] = useState<ResumenPaciente | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ResumenPaciente[]>({
    queryKey: ['resumen_pagos'],
    queryFn: () => apiClient.get('/pagos/resumen').then(r => r.data.data),
  });

  if (pacienteSeleccionado) {
    return <DetallePaciente paciente={pacienteSeleccionado} onBack={() => setPacienteSeleccionado(null)} />;
  }

  const pacientes = data ?? [];
  const filtrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.claveUnica ?? p.id).includes(busqueda)
  );

  const conDeuda   = pacientes.filter(p => p.saldoPendiente > 0).length;
  const alDia      = pacientes.filter(p => p.alDia).length;
  const totalDeuda = pacientes.reduce((s, p) => s + Math.max(0, p.saldoPendiente), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#10b981', borderRadius: '16px' }}>
            <Banknote size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Pagos de Pacientes</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '600' }}>Control de cargos, cobros y estado de cuenta</p>
          </div>
        </div>
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Buscar paciente..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* KPIs resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Pacientes Activos', value: pacientes.length, icon: CreditCard, color: '#3b82f6' },
          { label: 'Al Corriente',      value: alDia,            icon: CheckCircle, color: '#10b981' },
          { label: 'Con Adeudo',        value: conDeuda,         icon: AlertCircle, color: '#ef4444' },
          { label: 'Deuda Total',       value: fmt(totalDeuda),  icon: TrendingDown, color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: `${kpi.color}15`, borderRadius: '14px' }}>
              <kpi.icon size={22} color={kpi.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de pacientes */}
      <div style={{ backgroundColor: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>
            Pacientes Internados — {filtrados.length} registros
          </h2>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Cargando pacientes...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <Banknote size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.2 }} />
            <p style={{ fontWeight: '700' }}>No hay pacientes activos</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '0.875rem 2rem', fontWeight: '800' }}>Paciente</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Cama / Área</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: '800' }}>Total Cargado</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: '800' }}>Total Pagado</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: '800' }}>Saldo</th>
                <th style={{ textAlign: 'center', padding: '0.875rem 2rem', fontWeight: '800' }}>Estado</th>
                <th style={{ textAlign: 'center', padding: '0.875rem 2rem', fontWeight: '800' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((pac, idx) => (
                <tr key={pac.id}
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => setPacienteSeleccionado(pac)}
                >
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: pac.alDia ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px', color: pac.alDia ? '#16a34a' : '#dc2626' }}>
                        {pac.nombre.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{pac.nombre}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                          {pac.claveUnica ? `#${pac.claveUnica}` : `ID-${pac.id}`} · Ingreso {new Date(pac.fechaIngreso).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '13px', color: '#475569', fontWeight: '600' }}>{pac.cama}</td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: '700', color: '#475569', fontSize: '14px' }}>{fmt(pac.totalCargos)}</td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: '700', color: '#10b981', fontSize: '14px' }}>{fmt(pac.totalPagado)}</td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                    <span style={{ fontWeight: '900', fontSize: '15px', color: pac.saldoPendiente > 0 ? '#ef4444' : '#10b981' }}>
                      {fmt(pac.saldoPendiente)}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                    <span style={{ backgroundColor: pac.alDia ? '#dcfce7' : '#fee2e2', color: pac.alDia ? '#16a34a' : '#dc2626', padding: '0.3rem 0.875rem', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>
                      {pac.alDia ? 'Al corriente' : 'Con adeudo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setPacienteModal(pac); setModalCargo(true); }}
                        style={{ padding: '0.45rem 0.75rem', border: '1.5px solid #f59e0b', borderRadius: '8px', background: 'white', color: '#f59e0b', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        title="Agregar cargo"
                      >
                        <Plus size={14} /> Cargo
                      </button>
                      <button
                        onClick={() => { setPacienteModal(pac); setModalPago(true); }}
                        style={{ padding: '0.45rem 0.75rem', border: 'none', borderRadius: '8px', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}
                        title="Registrar pago"
                      >
                        <DollarSign size={14} /> Pago
                      </button>
                      <button
                        onClick={() => setPacienteSeleccionado(pac)}
                        style={{ padding: '0.45rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Ver detalle"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalRegistrarPago isOpen={modalPago}  onClose={() => setModalPago(false)}  paciente={pacienteModal}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['resumen_pagos'] })} />
      <ModalAgregarCargo  isOpen={modalCargo} onClose={() => setModalCargo(false)} paciente={pacienteModal}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['resumen_pagos'] })} />
    </div>
  );
}
