import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, X, Calendar, ArrowLeft, FileSignature, Receipt,
  CheckCircle2, AlertCircle, Banknote,
} from 'lucide-react';
import apiClient from '../../services/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EstadoFactura = 'BORRADOR' | 'EMITIDA' | 'CANCELADA';

interface FacturaMensual {
  id: number;
  folio: string;
  fecha: string;
  mes: number;
  anio: number;
  importeTotal: number;
  cantidadEnLetra: string;
  recibosCount: number;
  folioReciboInicial: string | null;
  folioReciboFinal: string | null;
  estado: EstadoFactura;
  archivoUrl: string | null;
  observaciones: string | null;
  fechaEmision: string | null;
  createdAt: string;
  creadoPor: { nombre: string; apellidos: string };
  _count?: { pagos: number };
  pagos?: PagoFacturado[];
}

interface PagoFacturado {
  id: number;
  monto: number;
  folioRecibo: string | null;
  concepto: string;
  fechaPago: string;
  paciente: { nombre: string; apellidoPaterno: string; apellidoMaterno: string | null };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ESTADO_FACTURA: Record<EstadoFactura, { label: string; bg: string; color: string }> = {
  BORRADOR:  { label: 'Borrador',  bg: '#fef3c7', color: '#d97706' },
  EMITIDA:   { label: 'Emitida',   bg: '#dcfce7', color: '#16a34a' },
  CANCELADA: { label: 'Cancelada', bg: '#fee2e2', color: '#dc2626' },
};

// ── Modal: Generar factura ────────────────────────────────────────────────────

const ModalGenerar = ({
  onClose, onSuccess,
}: { onClose: () => void; onSuccess: () => void }) => {
  const ahora = new Date();
  const [form, setForm] = useState({
    mes: ahora.getMonth() + 1,
    anio: ahora.getFullYear(),
    observaciones: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient.post('/recursos-financieros/facturas-mensuales', form),
    onSuccess: () => { onSuccess(); onClose(); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al generar la factura'),
  });

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '90%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Generar factura mensual</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b' }}>
              Agrupa todos los ingresos depositados del mes seleccionado.
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ backgroundColor: '#eff6ff', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          <AlertCircle size={16} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '12px', color: '#1e3a8a', lineHeight: 1.5 }}>
            No se permitirá generar la factura si quedan ingresos sin validar o depositar en ese mes. Termina el flujo antes de continuar.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Mes *</label>
            <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: parseInt(e.target.value) }))} style={inp}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Año *</label>
            <input type="number" min="2020" max="2100" value={form.anio}
              onChange={e => setForm(f => ({ ...f, anio: parseInt(e.target.value) }))} style={inp} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>Observaciones (opcional)</label>
          <textarea rows={3} value={form.observaciones}
            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            style={{ ...inp, fontFamily: 'inherit', resize: 'vertical' }} />
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
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
            {mutation.isPending ? 'Generando…' : 'Generar factura'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal: Emitir ─────────────────────────────────────────────────────────────

const ModalEmitir = ({
  factura, onClose, onSuccess,
}: { factura: FacturaMensual | null; onClose: () => void; onSuccess: () => void }) => {
  const [archivoUrl, setArchivoUrl] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/recursos-financieros/facturas-mensuales/${factura!.id}/emitir`, {
      archivoUrl: archivoUrl.trim(),
    }),
    onSuccess: () => { onSuccess(); onClose(); setArchivoUrl(''); setError(''); },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al emitir la factura'),
  });

  if (!factura) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '90%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Emitir factura</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b' }}>{factura.folio}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
          URL del archivo (PDF/XML) *
        </label>
        <input
          type="text"
          placeholder="/uploads/facturas/FAC-202605-0001.pdf"
          value={archivoUrl}
          onChange={e => setArchivoUrl(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
        />
        <p style={{ margin: '0.4rem 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
          Sube el archivo a /uploads y pega la ruta. Después de emitir, los pagos pasarán a FACTURADO.
        </p>

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
            onClick={() => { setError(''); if (!archivoUrl.trim()) return setError('La URL es obligatoria'); mutation.mutate(); }}
            disabled={mutation.isPending}
            style={{ flex: 2, padding: '0.875rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}
          >
            {mutation.isPending ? 'Emitiendo…' : 'Emitir factura'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detalle de factura ────────────────────────────────────────────────────────

const DetalleFactura = ({
  facturaId, onBack,
}: { facturaId: number; onBack: () => void }) => {
  const queryClient = useQueryClient();
  const [emitirOpen, setEmitirOpen] = useState(false);

  const { data, isLoading } = useQuery<FacturaMensual>({
    queryKey: ['rf_factura', facturaId],
    queryFn: () => apiClient.get(`/recursos-financieros/facturas-mensuales/${facturaId}`).then(r => r.data.data),
  });

  if (isLoading || !data) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Cargando factura…</div>;
  }

  const estilo = ESTADO_FACTURA[data.estado];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: 'white', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>{data.folio}</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
              {MESES[data.mes - 1]} {data.anio} · Generada {new Date(data.createdAt).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ backgroundColor: estilo.bg, color: estilo.color, padding: '0.4rem 0.85rem', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>
            {estilo.label}
          </span>
          {data.estado === 'BORRADOR' && (
            <button onClick={() => setEmitirOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.25rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 10px rgba(22,163,74,0.35)' }}>
              <FileSignature size={16} /> Emitir factura
            </button>
          )}
          {data.archivoUrl && (
            <a href={data.archivoUrl} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.25rem', border: '1.5px solid #16a34a', borderRadius: '12px', color: '#16a34a', textDecoration: 'none', fontWeight: '800', fontSize: '13px' }}>
              <FileText size={16} /> Ver archivo
            </a>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Importe total', value: fmt(data.importeTotal), color: '#10b981', icon: Banknote },
          { label: 'Recibos incluidos', value: String(data.recibosCount), color: '#3b82f6', icon: Receipt },
          { label: 'Rango de folios', value: `${data.folioReciboInicial ?? '—'} a ${data.folioReciboFinal ?? '—'}`, color: '#7c3aed', icon: FileText },
        ].map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.55rem', backgroundColor: `${kpi.color}15`, borderRadius: '12px' }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Cantidad en letra */}
      <div style={{ backgroundColor: '#f0fdf4', borderRadius: '20px', padding: '1.5rem 2rem', border: '1px solid #bbf7d0' }}>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cantidad en letra
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '16px', fontWeight: '700', color: '#14532d', fontStyle: 'italic' }}>
          ({data.cantidadEnLetra})
        </p>
      </div>

      {/* Lista de pagos */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>
            Pagos incluidos ({data.pagos?.length ?? 0})
          </h3>
        </div>
        {!data.pagos || data.pagos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Sin pagos asociados.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '0.875rem 2rem', fontWeight: '800' }}>Folio</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Paciente</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Concepto</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Fecha</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 2rem', fontWeight: '800' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.pagos.map((p, idx) => (
                <tr key={p.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.95rem 2rem', fontFamily: 'ui-monospace, monospace', fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>
                    {p.folioRecibo}
                  </td>
                  <td style={{ padding: '0.95rem 1rem', fontSize: '13px', color: '#475569', fontWeight: '700' }}>
                    {p.paciente.nombre} {p.paciente.apellidoPaterno} {p.paciente.apellidoMaterno ?? ''}
                  </td>
                  <td style={{ padding: '0.95rem 1rem', fontSize: '13px', color: '#64748b' }}>{p.concepto}</td>
                  <td style={{ padding: '0.95rem 1rem', fontSize: '13px', color: '#64748b' }}>
                    {new Date(p.fechaPago).toLocaleDateString('es-MX')}
                  </td>
                  <td style={{ padding: '0.95rem 2rem', textAlign: 'right', fontWeight: '900', color: '#10b981', fontSize: '14px' }}>
                    {fmt(p.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalEmitir
        factura={data}
        onClose={() => setEmitirOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['rf_factura', facturaId] })}
      />
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────

export default function FacturasMensuales() {
  const queryClient = useQueryClient();
  const [generarOpen, setGenerarOpen] = useState(false);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);

  const { data, isLoading } = useQuery<FacturaMensual[]>({
    queryKey: ['rf_facturas'],
    queryFn: () => apiClient.get('/recursos-financieros/facturas-mensuales').then(r => r.data.data),
  });

  if (seleccionada !== null) {
    return <DetalleFactura facturaId={seleccionada} onBack={() => setSeleccionada(null)} />;
  }

  const facturas = data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#10b981', borderRadius: '16px' }}>
            <FileText size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Facturas Mensuales</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '600' }}>
              Facturación electrónica general por mes de ingresos propios
            </p>
          </div>
        </div>
        <button onClick={() => setGenerarOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.4rem', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
          <Plus size={16} /> Generar factura mensual
        </button>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Cargando facturas…</div>
        ) : facturas.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.25 }} />
            <p style={{ fontWeight: '700', margin: 0 }}>No hay facturas mensuales generadas</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '13px' }}>Genera la primera con el botón de arriba.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '0.875rem 2rem', fontWeight: '800' }}>Folio</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Periodo</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Rango recibos</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: '800' }}>Recibos</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: '800' }}>Importe</th>
                <th style={{ textAlign: 'center', padding: '0.875rem 1rem', fontWeight: '800' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: '800' }}>Creada por</th>
                <th style={{ textAlign: 'center', padding: '0.875rem 2rem', fontWeight: '800' }}></th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f, idx) => {
                const estilo = ESTADO_FACTURA[f.estado];
                return (
                  <tr key={f.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => setSeleccionada(f.id)}>
                    <td style={{ padding: '1.1rem 2rem', fontFamily: 'ui-monospace, monospace', fontWeight: '900', fontSize: '13px', color: '#1e293b' }}>
                      {f.folio}
                    </td>
                    <td style={{ padding: '1.1rem 1rem', fontSize: '13px', color: '#475569', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={13} /> {MESES[f.mes - 1]} {f.anio}
                      </div>
                    </td>
                    <td style={{ padding: '1.1rem 1rem', fontSize: '12px', color: '#64748b', fontFamily: 'ui-monospace, monospace', fontWeight: '700' }}>
                      {f.folioReciboInicial ?? '—'} → {f.folioReciboFinal ?? '—'}
                    </td>
                    <td style={{ padding: '1.1rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '14px', color: '#3b82f6' }}>
                      {f.recibosCount}
                    </td>
                    <td style={{ padding: '1.1rem 1rem', textAlign: 'right', fontWeight: '900', fontSize: '15px', color: '#10b981' }}>
                      {fmt(f.importeTotal)}
                    </td>
                    <td style={{ padding: '1.1rem 1rem', textAlign: 'center' }}>
                      <span style={{ backgroundColor: estilo.bg, color: estilo.color, padding: '0.3rem 0.85rem', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>
                        {f.estado === 'EMITIDA' && <CheckCircle2 size={11} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: '-2px' }} />}
                        {estilo.label}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      {f.creadoPor.nombre} {f.creadoPor.apellidos}
                    </td>
                    <td style={{ padding: '1.1rem 2rem', textAlign: 'center' }}>
                      <button style={{ padding: '0.4rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: '0 auto' }}>
                        <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {generarOpen && (
        <ModalGenerar
          onClose={() => setGenerarOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['rf_facturas'] })}
        />
      )}
    </div>
  );
}
