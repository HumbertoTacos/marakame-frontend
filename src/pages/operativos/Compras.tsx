import { useState, useRef } from 'react';
import {
  ShoppingCart, Plus, FileText, Upload,
  CheckCircle, XCircle, Clock, ChevronRight, Package,
  TrendingUp, DollarSign, Eye, X,
  Building2, Receipt, CreditCard, Send,
  Star, ArrowRight, Bell, Filter, Search, Download
} from 'lucide-react';
import { useCompras } from '../../hooks/useCompras';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import type { EstadoCompra, Cotizacion, Requisicion } from '../../types';
import { getEstadoCompraUI } from '../../types';
import { subirFactura } from '../../services/compras.service';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─────────────────────────────────────────────
// PERMISOS POR ROL
// ─────────────────────────────────────────────
const PERMISOS = {
  ADMIN_GENERAL: [
    'crear', 'revisar', 'cotizar', 'negociar', 'admin',
    'autorizar', 'ordenar', 'facturas', 'orden_pago', 'pago'
  ],
  ALMACEN:       ['crear', 'cotizar'],
  RRHH_FINANZAS: ['admin', 'autorizar', 'facturas', 'pago'],
  AREA_MEDICA:   ['crear'],
  ENFERMERIA:    ['crear'],
  NUTRICION:     ['crear'],
  PSICOLOGIA:    ['crear'],
  ADMISIONES:    ['crear'],
} as const;

type RolKey = keyof typeof PERMISOS;

const puedeHacer = (rol: string | undefined, accion: string): boolean => {
  if (!rol) return false;
  const perms = PERMISOS[rol as RolKey] as readonly string[] | undefined;
  return perms?.includes(accion) ?? false;
};

// ─────────────────────────────────────────────
// COLORES DE ESTADO
// ─────────────────────────────────────────────
const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  REQUISICION_CREADA:        { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8',  border: '#E2E8F0' },
  EN_REVISION_RECURSOS:      { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6',  border: '#BFDBFE' },
  EN_REVISION_COMPRAS:       { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316',  border: '#FED7AA' },
  EN_REVISION_ADMINISTRACION:{ bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308',  border: '#FEF08A' },
  EN_REVISION_DIRECCION:     { bg: '#FDF2F8', text: '#BE185D', dot: '#EC4899',  border: '#FBCFE8' },
  COTIZACIONES_CARGADAS:     { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316',  border: '#FED7AA' },
  PROVEEDOR_SELECCIONADO:    { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6',  border: '#DDD6FE' },
  NEGOCIACION_COMPLETADA:    { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4',  border: '#A5F3FC' },
  AUTORIZADA:                { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E',  border: '#BBF7D0' },
  ORDEN_GENERADA:            { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6',  border: '#BFDBFE' },
  FACTURAS_RECIBIDAS:        { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1',  border: '#C7D2FE' },
  ORDEN_PAGO_GENERADA:       { bg: '#ECFEFF', text: '#0E7490', dot: '#06B6D4',  border: '#A5F3FC' },
  PAGO_GENERADO:             { bg: '#FDF2F8', text: '#BE185D', dot: '#EC4899',  border: '#FBCFE8' },
  FINALIZADO:                { bg: '#F0FDF4', text: '#15803D', dot: '#16A34A',  border: '#BBF7D0' },
  RECHAZADO:                 { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444',  border: '#FECACA' },
};

// ─────────────────────────────────────────────
// BADGE DE ESTADO
// ─────────────────────────────────────────────
const EstadoBadge = ({ estado }: { estado: EstadoCompra }) => {
  const ui    = getEstadoCompraUI(estado);
  const style = ESTADO_STYLES[estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: style.bg, color: style.text,
      border: `1px solid ${style.border}`,
      padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
      {ui.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// DASHBOARD CARDS
// ─────────────────────────────────────────────
const DashboardCards = ({ requisiciones }: { requisiciones: Requisicion[] }) => {
  const total      = requisiciones.length;
  const pendientes = requisiciones.filter(r =>
    ['REQUISICION_CREADA','EN_REVISION_RECURSOS','EN_REVISION_COMPRAS',
     'EN_REVISION_ADMINISTRACION','EN_REVISION_DIRECCION','COTIZACIONES_CARGADAS',
     'PROVEEDOR_SELECCIONADO','NEGOCIACION_COMPLETADA'].includes(r.estado)
  ).length;
  const autorizadas = requisiciones.filter(r => r.estado === 'AUTORIZADA').length;
  const finalizadas = requisiciones.filter(r => r.estado === 'FINALIZADO').length;
  const rechazadas  = requisiciones.filter(r => r.estado === 'RECHAZADO').length;
  const montoTotal  = requisiciones.reduce((s, r) => s + (r.presupuestoEstimado ?? 0), 0);

  const cards = [
    { label: 'Total',       value: total,       icon: <ShoppingCart size={20}/>, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'En proceso',  value: pendientes,  icon: <Clock size={20}/>,        color: '#D97706', bg: '#FFFBEB' },
    { label: 'Autorizadas', value: autorizadas, icon: <CheckCircle size={20}/>,  color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Finalizadas', value: finalizadas, icon: <Star size={20}/>,         color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Rechazadas',  value: rechazadas,  icon: <XCircle size={20}/>,      color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Presupuesto', value: `$${montoTotal.toLocaleString('es-MX')}`, icon: <DollarSign size={20}/>, color: '#0891B2', bg: '#ECFEFF' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 28 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 14, padding: '18px 20px',
          border: '1px solid #E8ECF0', display: 'flex', flexDirection: 'column',
          gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{c.label}</span>
            <span style={{ background: c.bg, color: c.color, borderRadius: 10, padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.icon}
            </span>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// TABLA DE COTIZACIONES
// ─────────────────────────────────────────────
const TablaCotizaciones = ({
  cotizaciones, seleccionada, onSelect
}: {
  cotizaciones: Cotizacion[]; seleccionada: Cotizacion | null; onSelect: (c: Cotizacion) => void;
}) => (
  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E8ECF0', marginTop: 8 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#F9FAFB' }}>
          {['', 'Proveedor', 'Precio', 'Entrega', ''].map((h, i) => (
            <th key={i} style={{
              padding: '10px 14px', textAlign: 'left', color: '#6B7280', fontWeight: 600,
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E8ECF0'
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cotizaciones.map((c) => (
          <tr key={c.id} onClick={() => onSelect(c)} style={{
            cursor: 'pointer',
            background: seleccionada?.id === c.id ? '#EFF6FF' : 'white',
            borderLeft: seleccionada?.id === c.id ? '3px solid #2563EB' : '3px solid transparent',
          }}>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
              <input type="radio" checked={seleccionada?.id === c.id} onChange={() => onSelect(c)} />
            </td>
            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #F3F4F6' }}>{c.proveedor}</td>
            <td style={{ padding: '10px 14px', color: '#16A34A', fontWeight: 700, borderBottom: '1px solid #F3F4F6' }}>
              ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </td>
            <td style={{ padding: '10px 14px', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>{c.tiempoEntrega ?? '—'}</td>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
              {c.esMejorOpcion && (
                <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #BBF7D0' }}>
                  ⭐ Mejor opción
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────
// MODAL BASE
// ─────────────────────────────────────────────
const Modal = ({
  children, onClose, title, width = 480
}: {
  children: React.ReactNode; onClose: () => void; title: string; width?: number;
}) => createPortal(
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    zIndex: 999999, backdropFilter: 'blur(3px)', padding: '32px 24px', overflowY: 'auto',
  }}>
    <div style={{
      background: 'white', borderRadius: 16, width: '100%', maxWidth: width,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 25px 60px rgba(0,0,0,0.18)', margin: 'auto',
    }}>
      <div style={{
        padding: '18px 24px', borderBottom: '1px solid #E8ECF0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, borderRadius: '16px 16px 0 0', background: 'white',
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{title}</span>
        <button onClick={onClose} style={{
          background: '#F3F4F6', border: 'none', cursor: 'pointer',
          color: '#6B7280', display: 'flex', borderRadius: 8, padding: 6
        }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  </div>,
  document.body
);

// ─────────────────────────────────────────────
// INPUTS
// ─────────────────────────────────────────────
const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>
    <input {...props} style={{
      padding: '9px 13px', border: '1px solid #D1D5DB', borderRadius: 8,
      fontSize: 14, color: '#111827', outline: 'none', background: 'white', fontFamily: 'inherit'
    }} />
  </div>
);

const Textarea = ({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>
    <textarea {...props} rows={3} style={{
      padding: '9px 13px', border: '1px solid #D1D5DB', borderRadius: 8,
      fontSize: 14, color: '#111827', outline: 'none', resize: 'vertical',
      fontFamily: 'inherit', background: 'white'
    }} />
  </div>
);

const Select = ({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>
    <select {...props} style={{
      padding: '9px 13px', border: '1px solid #D1D5DB', borderRadius: 8,
      fontSize: 14, color: '#111827', outline: 'none', background: 'white', fontFamily: 'inherit'
    }}>
      {children}
    </select>
  </div>
);

// ─────────────────────────────────────────────
// BOTONES
// ─────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', onClick, disabled, icon }: {
  children: React.ReactNode; variant?: 'primary'|'success'|'danger'|'ghost';
  onClick?: () => void; disabled?: boolean; icon?: React.ReactNode;
}) => {
  const colors = {
    primary: { bg: '#2563EB', text: 'white', border: '#2563EB' },
    success: { bg: '#16A34A', text: 'white', border: '#16A34A' },
    danger:  { bg: '#DC2626', text: 'white', border: '#DC2626' },
    ghost:   { bg: 'white',   text: '#374151', border: '#D1D5DB' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: disabled ? '#F3F4F6' : colors.bg,
      color: disabled ? '#9CA3AF' : colors.text,
      border: `1px solid ${disabled ? '#E5E7EB' : colors.border}`,
      borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
    }}>
      {icon}{children}
    </button>
  );
};

// ─────────────────────────────────────────────
// NOTIFICACIÓN
// ─────────────────────────────────────────────
const Notif = ({ msg, onClose }: { msg: string; onClose: () => void }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
    background: '#111827', color: 'white', borderRadius: 12,
    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 8px 30px rgba(0,0,0,0.2)', maxWidth: 340,
  }}>
    <Bell size={15} color="#22C55E" />
    <span style={{ fontSize: 14 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', marginLeft: 8, display: 'flex' }}>
      <X size={14} />
    </button>
  </div>
);

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export function Compras() {
  const { usuario } = useAuthStore();
  const rol = usuario?.rol ?? '';
  const queryClient = useQueryClient();

  const { requisiciones = [], isLoading, createReq, changeEstado, createCot, createOrden, createOrdenPago } = useCompras();

  const [proceso, setProceso]               = useState<Requisicion | null>(null);
  const [detalle, setDetalle]               = useState<Requisicion | null>(null);
  const [ordenesDetalle, setOrdenesDetalle] = useState<Requisicion | null>(null);
  const [tabOrdenes, setTabOrdenes]         = useState<'compra' | 'pago'>('compra');
  const [showCreate, setShowCreate]     = useState(false);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [notif, setNotif]               = useState<string | null>(null);

  // Estados de formularios controlados — siempre con valores iniciales definidos
  const [formObs, setFormObs]               = useState('');
  const [formPago, setFormPago]             = useState({ fecha: '', referencia: '', observaciones: '' });
  const [formNegociacion, setFormNegociacion] = useState({ precioFinal: '', formaPago: '', terminos: '' });

  // FIX: todos los campos de formCot inicializados como string vacío, nunca undefined
  const [formCot, setFormCot] = useState({ proveedor: '', precio: '', tiempoEntrega: '' });
  const [cotSeleccionada, setCotSeleccionada] = useState<Cotizacion | null>(null);
  const [formCreate, setFormCreate]     = useState({
    areaSolicitante: '', descripcion: '', justificacion: '',
    presupuestoEstimado: '', tipo: 'ORDINARIA' as 'ORDINARIA'|'EXTRAORDINARIA'
  });
  const [detalles, setDetalles] = useState([{ producto: '', unidad: '', cantidad: 1 }]);
  const fileRef      = useRef<HTMLInputElement>(null);
  // Congela el estado del modal al abrirlo para que el cache refresh no cambie de bloque
  const estadoModalRef = useRef<string | null>(null);
  const ordenPdfRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3500); };

  const descargarOrdenPDF = async () => {
    if (!ordenPdfRef.current || !ordenesDetalle?.ordenCompra) return;
    const canvas  = await html2canvas(ordenPdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${ordenesDetalle.ordenCompra.folio}.pdf`);
  };

  const agregarDetalle    = () => setDetalles([...detalles, { producto: '', unidad: '', cantidad: 1 }]);
  const eliminarDetalle   = (i: number) => setDetalles(detalles.filter((_, idx) => idx !== i));
  const actualizarDetalle = (index: number, campo: 'producto'|'unidad'|'cantidad', valor: string|number) => {
    const nuevos = [...detalles];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setDetalles(nuevos);
  };

  const reqFiltradas = requisiciones.filter(r => {
    const coincideBusq   = r.folio.toLowerCase().includes(busqueda.toLowerCase()) || r.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado ? r.estado === filtroEstado : true;
    return coincideBusq && coincideEstado;
  });

  // ─── MODALES DE PROCESO ─────────────────────────────────────────────────────
  const renderProceso = () => {
    if (!proceso) return null;
    // Siempre leemos los datos frescos (cotizaciones actualizadas), pero usamos
    // estadoModalRef para decidir qué bloque mostrar — así el modal no "salta"
    // cuando el backend cambia el estado automáticamente (p.ej. al 3ª cotización).
    const req = requisiciones.find(r => r.id === proceso.id) ?? proceso;
    const estadoModal = estadoModalRef.current ?? req.estado;

    // ── 1. REQUISICION_CREADA → EN_REVISION_RECURSOS ─────────────────────────
    if (estadoModal === 'REQUISICION_CREADA' && puedeHacer(rol, 'revisar')) {
      return (
        <Modal title="Enviar a Recursos Materiales" onClose={() => setProceso(null)} width={600}>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><strong>Folio:</strong> {req.folio}</div>
            <div><strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Justificación:</strong> {req.justificacion}</div>
            <div><strong>Presupuesto:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
          </div>
          <Btn
            icon={<CheckCircle size={15}/>}
            disabled={changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { id: req.id, estado: 'EN_REVISION_RECURSOS' as EstadoCompra },
                {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Enviado a Recursos Materiales'); },
                  onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Procesando…' : 'Aprobar revisión'}
          </Btn>
        </Modal>
      );
    }

    // ── 2. EN_REVISION_RECURSOS → EN_REVISION_COMPRAS ────────────────────────
    if (estadoModal === 'EN_REVISION_RECURSOS' && puedeHacer(rol, 'revisar')) {
      return (
        <Modal title="Enviar a Compras" onClose={() => setProceso(null)} width={600}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, fontSize: 13, color: '#475569' }}>
            La requisición será enviada al área de compras para la captura de cotizaciones.
          </div>
          <Btn
            icon={<Send size={15}/>}
            disabled={changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { id: req.id, estado: 'EN_REVISION_COMPRAS' as EstadoCompra },
                {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Enviado a Compras'); },
                  onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Procesando…' : 'Continuar'}
          </Btn>
        </Modal>
      );
    }

    // ── 3. EN_REVISION_COMPRAS → COTIZACIONES_CARGADAS (captura de cotizaciones) ──
    if (estadoModal === 'EN_REVISION_COMPRAS' && puedeHacer(rol, 'cotizar')) {
      const cotizacionesActuales = req.cotizaciones ?? [];
      const totalCot = cotizacionesActuales.length;
      const puedeAgregar =
        (formCot.proveedor ?? '').trim() !== '' &&
        (formCot.precio ?? '') !== '' &&
        !createCot.isPending;
      const puedeContinuar = totalCot >= 3;
      const cerrarModal = () => {
        estadoModalRef.current = null;
        setProceso(null);
        setFormCot({ proveedor: '', precio: '', tiempoEntrega: '' });
      };
      return (
        <Modal title="Captura de cotizaciones" onClose={cerrarModal} width={640}>
          {/* ── Info de la requisición ── */}
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Folio:</strong> {req.folio} · <strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Presupuesto estimado:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
          </div>
          {/* ── Banner de progreso ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            background: puedeContinuar ? '#F0FDF4' : '#EFF6FF', borderRadius: 10,
            border: `1px solid ${puedeContinuar ? '#BBF7D0' : '#BFDBFE'}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: puedeContinuar ? '#166534' : '#1D4ED8' }}>
                {totalCot} {totalCot === 1 ? 'cotización capturada' : 'cotizaciones capturadas'}
              </div>
              <div style={{ fontSize: 12, color: puedeContinuar ? '#15803D' : '#6B7280', marginTop: 3 }}>
                {!puedeContinuar
                  ? `Faltan ${3 - totalCot} cotización${3 - totalCot !== 1 ? 'es' : ''} para enviar a Administración`
                  : 'Puedes agregar más o pulsar "Enviar a Administración" para continuar'}
              </div>
            </div>
            {puedeContinuar && <CheckCircle size={22} color="#16A34A" style={{ flexShrink: 0 }} />}
          </div>
          {/* ── Tabla cotizaciones registradas ── */}
          {cotizacionesActuales.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: '#F9FAFB', fontWeight: 600, fontSize: 12, color: '#374151', borderBottom: '1px solid #E8ECF0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cotizaciones registradas</span>
                <span style={{ fontWeight: 500, color: '#6B7280' }}>{totalCot} registrada{totalCot !== 1 ? 's' : ''}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12, width: '40%' }}>Proveedor</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#374151', fontSize: 12, width: '30%' }}>Precio</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12, width: '30%' }}>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionesActuales.map((c: Cotizacion) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0', background: c.esMejorOpcion ? '#F0FDF4' : 'white' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 500, color: '#111827' }}>
                        {c.esMejorOpcion && (
                          <span style={{ display: 'inline-block', fontSize: 10, background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 4, padding: '1px 6px', fontWeight: 700, marginRight: 6 }}>
                            Mejor precio
                          </span>
                        )}
                        {c.proveedor}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: c.esMejorOpcion ? '#16A34A' : '#374151', fontWeight: 700 }}>
                        ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ── Formulario nueva cotización ── */}
          <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nueva cotización
            </div>
            <Input label="Proveedor" placeholder="Nombre del proveedor" value={formCot.proveedor ?? ''} onChange={e => setFormCot(prev => ({ ...prev, proveedor: e.target.value }))} />
            <div style={{ marginTop: 12 }}>
              <Input label="Precio total ($)" type="number" placeholder="0.00" value={formCot.precio ?? ''} onChange={e => setFormCot(prev => ({ ...prev, precio: e.target.value }))} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Input label="Tiempo de entrega" placeholder="Ej. 5 días hábiles" value={formCot.tiempoEntrega ?? ''} onChange={e => setFormCot(prev => ({ ...prev, tiempoEntrega: e.target.value }))} />
            </div>
          </div>
          {/* ── Acciones ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #E8ECF0', paddingTop: 16, flexWrap: 'wrap' }}>
            <Btn icon={<Plus size={15}/>} disabled={!puedeAgregar}
              onClick={() => {
                createCot.mutate(
                  { id: req.id, data: { proveedor: formCot.proveedor, precio: Number(formCot.precio), tiempoEntrega: formCot.tiempoEntrega || undefined } },
                  {
                    onSuccess: () => { setFormCot({ proveedor: '', precio: '', tiempoEntrega: '' }); queryClient.invalidateQueries({ queryKey: ['compras'] }); notify('Cotización agregada'); },
                    onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                  }
                );
              }}
            >
              {createCot.isPending ? 'Guardando…' : 'Agregar cotización'}
            </Btn>
            <Btn variant="success" icon={<Send size={15}/>} disabled={!puedeContinuar || changeEstado.isPending}
              onClick={() => {
                const cerrarYAvanzar = () => { setFormCot({ proveedor: '', precio: '', tiempoEntrega: '' }); estadoModalRef.current = null; setProceso(null); queryClient.invalidateQueries({ queryKey: ['compras'] }); notify('✅ Cotizaciones registradas — enviado a Administración'); };
                if (req.estado === 'COTIZACIONES_CARGADAS') { cerrarYAvanzar(); return; }
                changeEstado.mutate(
                  { id: req.id, estado: 'COTIZACIONES_CARGADAS' as EstadoCompra },
                  {
                    onSuccess: cerrarYAvanzar,
                    onError: (err: any) => { if (err?.response?.status === 400) { cerrarYAvanzar(); } else { notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`); } },
                  }
                );
              }}
            >
              {changeEstado.isPending ? 'Procesando…' : 'Enviar a Administración'}
            </Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="ghost" onClick={cerrarModal}>Cancelar</Btn>
          </div>
        </Modal>
      );
    }

    // ── 4. EN_REVISION_ADMINISTRACION → EN_REVISION_DIRECCION ────────────────
    if (estadoModal === 'EN_REVISION_ADMINISTRACION' && puedeHacer(rol, 'admin')) {
      const cotizaciones = req.cotizaciones ?? [];
      const mejorCot = cotizaciones.find(c => c.esMejorOpcion) ?? cotizaciones[0];
      return (
        <Modal title="Revisión de Administración" onClose={() => { setProceso(null); setFormObs(''); }} width={640}>
          <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 10, padding: 12, fontSize: 13, color: '#854D0E' }}>
            Revisa el expediente de cotizaciones y envía a Dirección General para autorización.
          </div>
          {/* Resumen de la requisición */}
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Folio:</strong> {req.folio} · <strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Justificación:</strong> {req.justificacion}</div>
            <div><strong>Presupuesto estimado:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
            {mejorCot && <div><strong>Proveedor propuesto:</strong> {mejorCot.proveedor} — ${Number(mejorCot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>}
          </div>
          {/* Cotizaciones */}
          {cotizaciones.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: '#F9FAFB', fontWeight: 600, fontSize: 12, color: '#374151', borderBottom: '1px solid #E8ECF0' }}>
                Cotizaciones recibidas ({cotizaciones.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Proveedor</th>
                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Precio</th>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((c: Cotizacion) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0', background: c.esMejorOpcion ? '#F0FDF4' : 'white' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#111827' }}>
                        {c.esMejorOpcion && <span style={{ fontSize: 10, background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 4, padding: '1px 6px', fontWeight: 700, marginRight: 6 }}>Mejor</span>}
                        {c.proveedor}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: c.esMejorOpcion ? '#16A34A' : '#374151', fontWeight: 700 }}>
                        ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Textarea label="Observaciones de Administración (opcionales)" placeholder="Notas para Dirección General..." value={formObs ?? ''} onChange={e => setFormObs(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="success" icon={<Send size={15}/>} disabled={changeEstado.isPending}
              onClick={() => {
                changeEstado.mutate(
                  { id: req.id, estado: 'EN_REVISION_DIRECCION' as EstadoCompra, observaciones: formObs.trim() || undefined },
                  {
                    onSuccess: () => { estadoModalRef.current = null; setProceso(null); setFormObs(''); notify('✅ Expediente enviado a Dirección General'); },
                    onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                  }
                );
              }}
            >
              {changeEstado.isPending ? 'Procesando…' : 'Enviar a Dirección General'}
            </Btn>
            <Btn variant="danger" icon={<XCircle size={15}/>} disabled={changeEstado.isPending || !formObs.trim()}
              onClick={() => {
                changeEstado.mutate(
                  { id: req.id, estado: 'RECHAZADO' as EstadoCompra, observaciones: formObs.trim() },
                  {
                    onSuccess: () => { estadoModalRef.current = null; setProceso(null); setFormObs(''); notify('Requisición rechazada por Administración'); },
                    onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                  }
                );
              }}
            >
              {changeEstado.isPending ? 'Procesando…' : 'Rechazar'}
            </Btn>
          </div>
          {!formObs.trim() && <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>* Para rechazar se requieren observaciones.</p>}
        </Modal>
      );
    }

    // ── 4b. EN_REVISION_DIRECCION → AUTORIZADA / RECHAZADO ───────────────────
    if (estadoModal === 'EN_REVISION_DIRECCION' && puedeHacer(rol, 'autorizar')) {
      const cotizaciones = req.cotizaciones ?? [];
      const mejorCot = cotizaciones.find(c => c.esMejorOpcion) ?? cotizaciones[0];
      return (
        <Modal title="Autorización — Dirección General" onClose={() => { setProceso(null); setFormObs(''); }} width={640}>
          <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 10, padding: 12, fontSize: 13, color: '#9D174D' }}>
            Revisa el expediente completo y emite la autorización o rechazo definitivo.
          </div>
          {/* Resumen ejecutivo */}
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Folio:</strong> {req.folio} · <strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Justificación:</strong> {req.justificacion}</div>
            <div><strong>Presupuesto estimado:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
            {mejorCot && (
              <div><strong>Proveedor recomendado:</strong> {mejorCot.proveedor} — <span style={{ color: '#16A34A', fontWeight: 700 }}>${Number(mejorCot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
            )}
          </div>
          {/* Cotizaciones */}
          {cotizaciones.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: '#F9FAFB', fontWeight: 600, fontSize: 12, color: '#374151', borderBottom: '1px solid #E8ECF0' }}>
                Cotizaciones del expediente ({cotizaciones.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Proveedor</th>
                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Precio</th>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((c: Cotizacion) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0', background: c.esMejorOpcion ? '#F0FDF4' : 'white' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#111827' }}>
                        {c.esMejorOpcion && <span style={{ fontSize: 10, background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 4, padding: '1px 6px', fontWeight: 700, marginRight: 6 }}>Mejor</span>}
                        {c.proveedor}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: c.esMejorOpcion ? '#16A34A' : '#374151', fontWeight: 700 }}>
                        ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Textarea label="Observaciones de Dirección (requeridas para rechazar)" placeholder="Fundamento de la decisión..." value={formObs ?? ''} onChange={e => setFormObs(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="success" icon={<CheckCircle size={15}/>} disabled={changeEstado.isPending}
              onClick={() => {
                changeEstado.mutate(
                  { id: req.id, estado: 'AUTORIZADA' as EstadoCompra, observaciones: formObs.trim() || undefined },
                  {
                    onSuccess: () => { estadoModalRef.current = null; setProceso(null); setFormObs(''); notify('✅ Requisición autorizada por Dirección General'); },
                    onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                  }
                );
              }}
            >
              {changeEstado.isPending ? 'Procesando…' : 'Autorizar'}
            </Btn>
            <Btn variant="danger" icon={<XCircle size={15}/>} disabled={changeEstado.isPending || !formObs.trim()}
              onClick={() => {
                changeEstado.mutate(
                  { id: req.id, estado: 'RECHAZADO' as EstadoCompra, observaciones: formObs.trim() },
                  {
                    onSuccess: () => { estadoModalRef.current = null; setProceso(null); setFormObs(''); notify('Requisición rechazada por Dirección General'); },
                    onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                  }
                );
              }}
            >
              {changeEstado.isPending ? 'Procesando…' : 'Rechazar'}
            </Btn>
          </div>
          {!formObs.trim() && <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>* Para rechazar se requieren observaciones.</p>}
        </Modal>
      );
    }

    // ── 5. COTIZACIONES_CARGADAS → PROVEEDOR_SELECCIONADO ────────────────────
    if (estadoModal === 'COTIZACIONES_CARGADAS' && puedeHacer(rol, 'cotizar')) {
      return (
        <Modal title="Seleccionar proveedor" onClose={() => { setProceso(null); setCotSeleccionada(null); }} width={580}>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, fontSize: 13, color: '#1D4ED8' }}>
            Selecciona la mejor cotización para continuar el proceso hacia negociación.
          </div>
          <TablaCotizaciones
            cotizaciones={req.cotizaciones ?? []}
            seleccionada={cotSeleccionada}
            onSelect={setCotSeleccionada}
          />
          <Btn
            icon={<ArrowRight size={15}/>}
            disabled={!cotSeleccionada || changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { id: req.id, estado: 'PROVEEDOR_SELECCIONADO' as EstadoCompra },
                {
                  onSuccess: () => { estadoModalRef.current = null; setCotSeleccionada(null); setProceso(null); notify('Proveedor seleccionado'); },
                  onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Procesando…' : 'Confirmar proveedor'}
          </Btn>
        </Modal>
      );
    }

    // ── 6. PROVEEDOR_SELECCIONADO → NEGOCIACION_COMPLETADA ───────────────────
    if (estadoModal === 'PROVEEDOR_SELECCIONADO' && puedeHacer(rol, 'negociar')) {
      return (
        <Modal title="Negociación con proveedor" onClose={() => { setProceso(null); setFormNegociacion({ precioFinal: '', formaPago: '', terminos: '' }); }}>
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 12, fontSize: 13, color: '#5B21B6' }}>
            Registra los términos acordados con el proveedor seleccionado.
          </div>
          <Input
            label="Precio final negociado ($)"
            type="number"
            placeholder="0.00"
            value={formNegociacion.precioFinal ?? ''}
            onChange={e => setFormNegociacion({ ...formNegociacion, precioFinal: e.target.value })}
          />
          <Input
            label="Forma de pago"
            placeholder="Contado / Crédito 30 días..."
            value={formNegociacion.formaPago ?? ''}
            onChange={e => setFormNegociacion({ ...formNegociacion, formaPago: e.target.value })}
          />
          <Textarea
            label="Términos adicionales"
            placeholder="Notas de la negociación..."
            value={formNegociacion.terminos ?? ''}
            onChange={e => setFormNegociacion({ ...formNegociacion, terminos: e.target.value })}
          />
          <Btn
            icon={<TrendingUp size={15}/>}
            disabled={changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { id: req.id, estado: 'NEGOCIACION_COMPLETADA' as EstadoCompra },
                {
                  onSuccess: () => {
                    setFormNegociacion({ precioFinal: '', formaPago: '', terminos: '' });
                    estadoModalRef.current = null;
                    setProceso(null);
                    notify('Negociación completada');
                  },
                  onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Procesando…' : 'Guardar negociación'}
          </Btn>
        </Modal>
      );
    }

    // ── 7. NEGOCIACION_COMPLETADA → EN_REVISION_ADMINISTRACION ─────────────────
    if (estadoModal === 'NEGOCIACION_COMPLETADA' && puedeHacer(rol, 'negociar')) {
      const cot = req.cotizaciones?.find(c => c.esMejorOpcion) ?? req.cotizaciones?.[0];
      return (
        <Modal title="Negociación completada" onClose={() => { setProceso(null); setFormObs(''); }}>
          <div style={{ background: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: 10, padding: 14, fontSize: 13, color: '#0E7490', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} />
            Negociación registrada. Envía el expediente a Administración para revisión.
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Folio:</strong> {req.folio} · <strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Presupuesto estimado:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
            {cot && <div><strong>Proveedor negociado:</strong> {cot.proveedor} — ${Number(cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>}
          </div>
          <Textarea label="Observaciones de negociación (opcionales)" placeholder="Términos acordados, condiciones especiales..." value={formObs ?? ''} onChange={e => setFormObs(e.target.value)} />
          <Btn
            variant="success"
            icon={<Send size={15}/>}
            disabled={changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { id: req.id, estado: 'EN_REVISION_ADMINISTRACION' as EstadoCompra, observaciones: formObs.trim() || undefined },
                {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); setFormObs(''); notify('✅ Expediente enviado a Administración'); },
                  onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Procesando…' : 'Enviar a revisión de Administración'}
          </Btn>
        </Modal>
      );
    }

    // ── 8. AUTORIZADA → ORDEN_GENERADA ───────────────────────────────────────
    if (estadoModal === 'AUTORIZADA' && puedeHacer(rol, 'ordenar')) {
      const cot = req.cotizaciones?.find(c => c.esMejorOpcion) ?? req.cotizaciones?.[0];
      return (
        <Modal title="Generar orden de compra" onClose={() => setProceso(null)}>
          {cot ? (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: '#166534' }}>{cot.proveedor}</div>
              <div style={{ color: '#16A34A', fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                ${Number(cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              {cot.tiempoEntrega && <div style={{ color: '#6B7280', marginTop: 2 }}>Entrega: {cot.tiempoEntrega}</div>}
            </div>
          ) : (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 16, fontSize: 13, color: '#DC2626' }}>
              No hay cotización registrada. Verifica el proceso.
            </div>
          )}
          <Btn
            icon={<Package size={15}/>}
            disabled={!cot || createOrden.isPending}
            onClick={() => {
              if (!cot) return;
              createOrden.mutate(
                { id: req.id, data: { proveedor: cot.proveedor, total: Number(cot.precio) } },
                {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('✅ Orden de compra generada'); },
                  onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {createOrden.isPending ? 'Generando…' : 'Confirmar y generar orden'}
          </Btn>
        </Modal>
      );
    }

    // ── 9. ORDEN_GENERADA → FACTURAS_RECIBIDAS ───────────────────────────────
    if (estadoModal === 'ORDEN_GENERADA' && puedeHacer(rol, 'facturas')) {
      return (
        <Modal title="Subir facturas" onClose={() => setProceso(null)}>
          {(req as any).facturas?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>Facturas subidas</p>
              {(req as any).facturas.map((f: any) => (
                <a key={f.id} href={`${import.meta.env.VITE_API_URL}${f.documentoUrl}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 8, border: '1px solid #E8ECF0', background: '#F9FAFB', color: '#2563EB', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  <Receipt size={14} /> {f.numero}
                </a>
              ))}
            </div>
          )}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, fontSize: 13, color: '#1D4ED8' }}>
            Al subir la primera factura el proceso avanzará automáticamente.
          </div>
          <div
            style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', background: '#F9FAFB' }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={26} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Haz clic para subir XML / PDF</p>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: 12 }}>Máx. 10 MB</p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.xml" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await subirFactura(req.id, file);
              notify('✅ Factura subida — proceso avanzado automáticamente');
              estadoModalRef.current = null;
              setProceso(null);
            } catch (err: any) {
              notify(`❌ Error al subir factura: ${err?.response?.data?.message ?? err?.message}`);
            }
          }} />
        </Modal>
      );
    }

    // ── 10. FACTURAS_RECIBIDAS → ORDEN_PAGO_GENERADA ─────────────────────────
    if (estadoModal === 'FACTURAS_RECIBIDAS' && puedeHacer(rol, 'orden_pago')) {
      return (
        <Modal title="Generar orden de pago" onClose={() => setProceso(null)}>
          <div style={{
            background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: 16, fontSize: 13, color: '#3730A3'
          }}>
            <strong>Facturas recibidas correctamente.</strong>
            <p style={{ marginBottom: 0, marginTop: 4 }}>
              Se generará la orden de pago vinculada a esta requisición.
            </p>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Requisición:</strong> {req.folio}</div>
            <div><strong>Monto:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
          </div>
          <Btn
            icon={<FileText size={15}/>}
            disabled={createOrdenPago.isPending}
            onClick={() => {
              createOrdenPago.mutate(req.id, {
                onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('✅ Orden de pago generada correctamente'); },
                onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
              });
            }}
          >
            {createOrdenPago.isPending ? 'Generando…' : 'Generar orden de pago'}
          </Btn>
        </Modal>
      );
    }

    // ── 11. ORDEN_PAGO_GENERADA → PAGO_GENERADO ──────────────────────────────
    if (estadoModal === 'ORDEN_PAGO_GENERADA' && puedeHacer(rol, 'pago')) {
      return (
        <Modal
          title="Registrar pago"
          onClose={() => { setProceso(null); setFormPago({ fecha: '', referencia: '', observaciones: '' }); }}
        >
          <Input
            label="Fecha de pago"
            type="date"
            value={formPago.fecha ?? ''}
            onChange={e => setFormPago({ ...formPago, fecha: e.target.value })}
          />
          <Input
            label="Referencia bancaria"
            placeholder="Número de transferencia..."
            value={formPago.referencia ?? ''}
            onChange={e => setFormPago({ ...formPago, referencia: e.target.value })}
          />
          <Textarea
            label="Observaciones"
            placeholder="Notas del pago..."
            value={formPago.observaciones ?? ''}
            onChange={e => setFormPago({ ...formPago, observaciones: e.target.value })}
          />
          <Btn
            icon={<CreditCard size={15}/>}
            disabled={changeEstado.isPending || !formPago.fecha || !formPago.referencia}
            onClick={() => {
              changeEstado.mutate(
                {
                  id:                 req.id,
                  estado:             'PAGO_GENERADO' as EstadoCompra,
                  fechaPago:          formPago.fecha,
                  referenciaBancaria: formPago.referencia,
                  observaciones:      formPago.observaciones || undefined,
                },
                {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); setFormPago({ fecha: '', referencia: '', observaciones: '' }); notify('✅ Pago registrado correctamente'); },
                  onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Registrando…' : 'Registrar pago'}
          </Btn>
        </Modal>
      );
    }

    // ── 12. PAGO_GENERADO → FINALIZADO ───────────────────────────────────────
    if (estadoModal === 'PAGO_GENERADO' && puedeHacer(rol, 'pago')) {
      return (
        <Modal title="Finalizar proceso" onClose={() => setProceso(null)}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 18, fontSize: 13, color: '#166534', textAlign: 'center' }}>
            <CheckCircle size={30} style={{ margin: '0 auto 10px', display: 'block' }} />
            Todo el proceso está completo. ¿Deseas marcar esta requisición como finalizada?
          </div>
          <Btn
            variant="success"
            icon={<Star size={15}/>}
            disabled={changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { id: req.id, estado: 'FINALIZADO' as EstadoCompra },
                {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('🎉 Requisición finalizada exitosamente'); },
                  onError:   (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {changeEstado.isPending ? 'Finalizando…' : 'Finalizar requisición'}
          </Btn>
        </Modal>
      );
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
    return (
      <Modal title={`Requisición ${req.folio}`} onClose={() => setProceso(null)}>
        <EstadoBadge estado={req.estado} />
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
          {req.estado === 'RECHAZADO'  ? 'Esta requisición fue rechazada.' :
           req.estado === 'FINALIZADO' ? 'Esta requisición está finalizada.' :
           'No tienes permisos para continuar este paso o el proceso ya avanzó.'}
        </p>
        <Btn variant="ghost" onClick={() => { estadoModalRef.current = null; setProceso(null); }}>Cerrar</Btn>
      </Modal>
    );
  };

  // ─── MODAL DETALLE ───────────────────────────────────────────────────────────
  const renderDetalle = () => {
    if (!detalle) return null;
    const req = requisiciones.find(r => r.id === detalle.id) ?? detalle;
    return (
      <Modal title={`Resumen ${req.folio}`} onClose={() => setDetalle(null)} width={700}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Tipo:</strong> {req.tipo}</div>
            <div><strong>Estado:</strong> {getEstadoCompraUI(req.estado).label}</div>
            <div><strong>Presupuesto:</strong> ${req.presupuestoEstimado?.toLocaleString('es-MX')}</div>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><strong>Solicitante:</strong> {req.usuario?.nombre} {req.usuario?.apellidos}</div>
            <div><strong>Fecha:</strong> {req.createdAt ? new Date(req.createdAt).toLocaleString('es-MX') : 'Sin fecha'}</div>
            <div><strong>Cotizaciones:</strong> {req.cotizaciones?.length ?? 0}</div>
          </div>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16 }}>
          <p style={{ marginTop: 0, fontWeight: 600, color: '#111827', fontSize: 13 }}>Descripción</p>
          <p style={{ marginBottom: 0, color: '#374151', lineHeight: 1.6, fontSize: 13 }}>{req.descripcion}</p>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16 }}>
          <p style={{ marginTop: 0, fontWeight: 600, color: '#111827', fontSize: 13 }}>Justificación</p>
          <p style={{ marginBottom: 0, color: '#374151', lineHeight: 1.6, fontSize: 13 }}>{req.justificacion}</p>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16 }}>
          <p style={{ marginTop: 0, fontWeight: 600, color: '#111827', fontSize: 13 }}>Artículos solicitados</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {['#', 'Producto', 'Unidad', 'Cantidad'].map((h, i) => (
                    <th key={i} style={{ padding: '9px 13px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.detalles?.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                    <td style={{ padding: '9px 13px', textAlign: 'center', color: '#6B7280' }}>{d.numero}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center' }}>{d.producto}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center', color: '#6B7280' }}>{d.unidad}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center', fontWeight: 600 }}>{d.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" icon={<X size={14}/>} onClick={() => setDetalle(null)}>Cerrar</Btn>
        </div>
      </Modal>
    );
  };

  // ─── MODAL ORDEN ─────────────────────────────────────────────────────────────
  // ─── MODAL UNIFICADO: VER ÓRDENES (tabs: Orden de Compra | Orden de Pago) ──
  const renderOrdenes = () => {
    if (!ordenesDetalle) return null;
    const req    = requisiciones.find(r => r.id === ordenesDetalle.id) ?? ordenesDetalle;
    const orden  = req.ordenCompra;
    const op     = (req as any).ordenPago;
    const hasOC  = !!orden;
    const hasOP  = !!op;
    if (!hasOC && !hasOP) return null;

    // ── Tab strip ──────────────────────────────────────────────────────────────
    const tabStyle = (active: boolean, color: string, bg: string, border: string) => ({
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      border: 'none', fontFamily: 'inherit', borderRadius: '10px 10px 0 0',
      background: active ? bg : '#F8FAFC',
      color: active ? color : '#9CA3AF',
      borderBottom: active ? `3px solid ${border}` : '3px solid transparent',
      transition: 'all 0.15s',
    } as React.CSSProperties);

    // ── Contenido Orden de Compra ──────────────────────────────────────────────
    const tabCompra = () => {
      if (!orden) return (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
          <FileText size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ margin: 0 }}>La orden de compra aún no ha sido generada.</p>
        </div>
      );
      return (
        <>
          <div ref={ordenPdfRef} style={{ border: '1px solid #E8ECF0', borderRadius: 12, padding: 28, background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, color: '#111827', fontWeight: 800 }}>Orden de Compra</h2>
                <p style={{ color: '#6B7280', marginTop: 4, fontSize: 13 }}><strong>Folio:</strong> {orden.folio}</p>
              </div>
              <div style={{ fontSize: 13, color: '#374151' }}>
                <strong>Fecha:</strong> {orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-MX') : 'Sin fecha'}
              </div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 16, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><strong>Proveedor o razón social:</strong> {orden.proveedor}</div>
              <div><strong>Total:</strong> ${orden.total.toLocaleString('es-MX')}</div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ marginTop: 0, fontWeight: 600, color: '#111827', fontSize: 13 }}>Justificación</p>
              <p style={{ marginBottom: 0, color: '#374151', lineHeight: 1.6, fontSize: 13 }}>{req.justificacion}</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {['#', 'Producto', 'Unidad', 'Cantidad'].map((h, i) => (
                    <th key={i} style={{ padding: '9px 13px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.detalles?.map((d: any, index: number) => (
                  <tr key={index} style={{ borderTop: '1px solid #E8ECF0' }}>
                    <td style={{ padding: '9px 13px', textAlign: 'center', color: '#6B7280' }}>{index + 1}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center' }}>{d.producto}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center', color: '#6B7280' }}>{d.unidad}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center', fontWeight: 600 }}>{d.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 60 }}>
              {[
                { label: 'Elaboró',  persona: orden.elaboradoPor },
                { label: 'Revisó',   persona: orden.revisadoPor },
                { label: 'Autorizó', persona: orden.autorizadoPor },
              ].map((f, i) => (
                <div key={i} style={{ borderTop: '1px solid #D1D5DB', paddingTop: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{f.persona?.nombre} {f.persona?.apellidos}</div>
                  <div style={{ marginTop: 4, color: '#6B7280', fontSize: 12 }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={descargarOrdenPDF} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              borderRadius: 8, border: 'none', background: '#DC2626', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              <Download size={15} /> Descargar PDF
            </button>
          </div>
        </>
      );
    };

    // ── Contenido Orden de Pago ────────────────────────────────────────────────
    const tabPago = () => {
      if (!op) return (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
          <CreditCard size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ margin: 0 }}>La orden de pago aún no ha sido generada.</p>
        </div>
      );

      const fechaElaboracion = op.fecha
        ? new Date(op.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';
      const detalles: any[] = op.detalles ?? [];
      const filas = detalles.length > 0
        ? detalles
        : (req.facturas ?? []).map((f: any) => ({
            fechaOrdenCompra: req.ordenCompra?.fecha,
            folioOrdenCompra: req.ordenCompra?.folio,
            numeroFactura:    f.numero,
            proveedor:        req.ordenCompra?.proveedor ?? '—',
            monto:            f.monto > 0 ? f.monto : (req.ordenCompra?.total ?? 0),
          }));
      const totalGeneral: number =
        op.totalGeneral ?? filas.reduce((s: number, d: any) => s + Number(d.monto ?? 0), 0);

      return (
        <div style={{ border: '2px solid #6366F1', borderRadius: 14, overflow: 'hidden', background: 'white', fontSize: 13 }}>
          {/* Encabezado */}
          <div style={{ background: '#4F46E5', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#C7D2FE', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Centro de Rehabilitación Marakame</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginTop: 2 }}>ORDEN DE PAGO</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#C7D2FE', fontSize: 11 }}>Folio</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{op.folio}</div>
              <div style={{ color: '#C7D2FE', fontSize: 11, marginTop: 4 }}>Fecha de elaboración</div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{fechaElaboracion}</div>
            </div>
          </div>
          <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Datos generales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: 12 }}>
                <div style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Requisición</div>
                <div style={{ color: '#111827', fontWeight: 700 }}>{req.folio}</div>
              </div>
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: 12 }}>
                <div style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Asunto</div>
                <div style={{ color: '#111827', fontWeight: 600 }}>{op.asunto || 'Envío de facturas para pago'}</div>
              </div>
            </div>
            {/* Info administrativa */}
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: '#F8FAFC', padding: '8px 14px', borderBottom: '1px solid #E8ECF0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151' }}>Información Administrativa</span>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#6B7280', minWidth: 90, fontWeight: 600, fontSize: 12 }}>Dirigido a:</span>
                  <span style={{ color: '#111827', fontWeight: 700, textTransform: 'uppercase' }}>{op.dirigidoA || 'Jefe del Departamento de Administración'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#6B7280', minWidth: 90, fontWeight: 600, fontSize: 12 }}>Área:</span>
                  <span style={{ color: '#374151' }}>{req.areaSolicitante}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#6B7280', minWidth: 90, fontWeight: 600, fontSize: 12 }}>Descripción:</span>
                  <span style={{ color: '#374151', lineHeight: 1.5 }}>{req.descripcion}</span>
                </div>
                <div style={{ marginTop: 4, padding: '6px 10px', background: '#EEF2FF', borderRadius: 6, fontSize: 12, color: '#4338CA', fontWeight: 500 }}>PRESENTE</div>
              </div>
            </div>
            {/* Tabla de detalle */}
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: '#F8FAFC', padding: '8px 14px', borderBottom: '1px solid #E8ECF0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151' }}>Detalle de Órdenes y Facturas</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#EEF2FF' }}>
                      {['Fecha OC', 'No. Orden Compra', 'No. Factura', 'Proveedor / Razón Social', 'Importe'].map(col => (
                        <th key={col} style={{ padding: '8px 10px', textAlign: col === 'Importe' ? 'right' : 'left', color: '#4338CA', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #C7D2FE' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.length === 0
                      ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Sin detalles registrados</td></tr>
                      : filas.map((d: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                          <td style={{ padding: '9px 10px', color: '#374151' }}>{d.fechaOrdenCompra ? new Date(d.fechaOrdenCompra).toLocaleDateString('es-MX') : '—'}</td>
                          <td style={{ padding: '9px 10px', color: '#374151', fontFamily: 'monospace', fontSize: 11 }}>{d.folioOrdenCompra || '—'}</td>
                          <td style={{ padding: '9px 10px', color: '#374151' }}>{d.numeroFactura || '—'}</td>
                          <td style={{ padding: '9px 10px', color: '#374151', fontWeight: 600 }}>{d.proveedor || '—'}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: '#065F46', fontWeight: 700 }}>${Number(d.monto ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 14px', borderTop: '2px solid #6366F1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5' }}>
                <span style={{ fontWeight: 700, color: '#065F46', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total General</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: 18 }}>${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            {/* Firmas */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 10 }}>Firmas de Autorización</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Autorizó',            persona: op.autorizadoPor },
                  { label: 'Revisó',              persona: op.revisadoPor  },
                  { label: 'Elaboró / Ejecutó',   persona: op.elaboradoPor },
                ].map(({ label, persona }) => (
                  <div key={label} style={{ border: '1px solid #E8ECF0', borderRadius: 8, padding: '10px 12px', textAlign: 'center', fontSize: 12 }}>
                    <div style={{ borderBottom: '1px solid #D1D5DB', paddingBottom: 32, marginBottom: 8 }} />
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>
                      {persona ? `${persona.nombre} ${persona.apellidos}` : <span style={{ color: '#9CA3AF', fontSize: 11 }}>Sin asignar</span>}
                    </div>
                    <div style={{ color: '#6B7280', marginTop: 3, fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Título y modo según qué documentos existen
    const title = hasOC && hasOP ? 'Ver Órdenes' : hasOC ? 'Orden de Compra' : 'Orden de Pago';

    return (
      <Modal title={title} onClose={() => setOrdenesDetalle(null)} width={820}>
        {/* Tabs solo cuando los dos documentos existen */}
        {hasOC && hasOP && (
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E8ECF0', marginBottom: 20 }}>
            <button
              style={tabStyle(tabOrdenes === 'compra', '#16A34A', '#F0FDF4', '#16A34A')}
              onClick={() => setTabOrdenes('compra')}
            >
              <FileText size={14}/> Orden de Compra
            </button>
            <button
              style={tabStyle(tabOrdenes === 'pago', '#4338CA', '#EEF2FF', '#4338CA')}
              onClick={() => setTabOrdenes('pago')}
            >
              <CreditCard size={14}/> Orden de Pago
            </button>
          </div>
        )}
        {/* Contenido: si hay los dos, según tab activa; si solo uno, directo */}
        {hasOC && hasOP
          ? (tabOrdenes === 'compra' ? tabCompra() : tabPago())
          : hasOC ? tabCompra() : tabPago()
        }
      </Modal>
    );
  };


  // ─── MODAL CREAR ─────────────────────────────────────────────────────────────
  const renderCreate = () => {
    if (!showCreate) return null;
    return (
      <Modal title="Nueva requisición de compra" onClose={() => setShowCreate(false)} width={680}>
        <Select label="Área solicitante" value={formCreate.areaSolicitante ?? ''} onChange={e => setFormCreate({ ...formCreate, areaSolicitante: e.target.value })}>
          <option value="">Selecciona un área</option>
          <option value="Dirección General">Dirección General</option>
          <option value="Unidad de Transparencia">Unidad de Transparencia</option>
          <option value="Departamento Clínico">Departamento Clínico</option>
          <option value="Departamento Médico">Departamento Médico</option>
          <option value="Departamento de Admisiones">Departamento de Admisiones</option>
          <option value="Departamento de Administración">Departamento de Administración</option>
          <option value="Oficina de Recursos Materiales">Oficina de Recursos Materiales</option>
        </Select>
        <Select label="Tipo de compra" value={formCreate.tipo ?? 'ORDINARIA'} onChange={e => setFormCreate({ ...formCreate, tipo: e.target.value as 'ORDINARIA'|'EXTRAORDINARIA' })}>
          <option value="ORDINARIA">Ordinaria</option>
          <option value="EXTRAORDINARIA">Extraordinaria</option>
        </Select>
        <Textarea label="Descripción" placeholder="¿Qué se necesita comprar?" value={formCreate.descripcion ?? ''} onChange={e => setFormCreate({ ...formCreate, descripcion: e.target.value })} />
        <Textarea label="Justificación" placeholder="¿Por qué es necesario?" value={formCreate.justificacion ?? ''} onChange={e => setFormCreate({ ...formCreate, justificacion: e.target.value })} />
        <Input label="Presupuesto estimado ($)" type="number" placeholder="0.00" value={formCreate.presupuestoEstimado ?? ''} onChange={e => setFormCreate({ ...formCreate, presupuestoEstimado: e.target.value })} />
        <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Artículos solicitados</span>
            <Btn variant="ghost" icon={<Plus size={13}/>} onClick={agregarDetalle}>Agregar</Btn>
          </div>
          {detalles.map((det, index) => (
            <div key={index} style={{ border: '1px solid #E8ECF0', borderRadius: 8, padding: 12, background: '#F9FAFB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 38px', gap: 8, alignItems: 'end' }}>
                <Input label="Artículo" placeholder="Ej: Cloro" value={det.producto ?? ''} onChange={e => actualizarDetalle(index, 'producto', e.target.value)} />
                <Input label="Unidad" placeholder="Caja" value={det.unidad ?? ''} onChange={e => actualizarDetalle(index, 'unidad', e.target.value)} />
                <Input label="Cantidad" type="number" min={1} value={det.cantidad ?? 1} onChange={e => actualizarDetalle(index, 'cantidad', Number(e.target.value))} />
                <button type="button" onClick={() => eliminarDetalle(index)} style={{ height: 38, width: 38, border: '1px solid #FECACA', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            icon={<Plus size={15}/>}
            disabled={createReq.isPending}
            onClick={() => {
              if (!formCreate.areaSolicitante || !formCreate.descripcion || !formCreate.justificacion) { alert('Completa todos los campos'); return; }
              createReq.mutate(
                { ...formCreate, presupuestoEstimado: Number(formCreate.presupuestoEstimado), detalles },
                {
                  onSuccess: () => {
                    setFormCreate({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '', tipo: 'ORDINARIA' });
                    setDetalles([{ producto: '', unidad: '', cantidad: 1 }]);
                    setShowCreate(false);
                    notify('✅ Requisición creada exitosamente');
                  },
                  onError: (err: any) => notify(`❌ Error: ${err?.response?.data?.message ?? err?.message}`),
                }
              );
            }}
          >
            {createReq.isPending ? 'Creando…' : 'Crear requisición'}
          </Btn>
          <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Btn>
        </div>
      </Modal>
    );
  };

  // ─── RENDER PRINCIPAL ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
          padding: '1.5rem 2.5rem', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', padding: '0.75rem',
              borderRadius: 14, marginRight: '1.25rem', display: 'flex', boxShadow: '0 8px 16px rgba(37,99,235,0.25)'
            }}>
              <ShoppingCart size={28} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Compras</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14, fontWeight: 500 }}>
                Gestión de requisiciones • {usuario?.nombre ?? ''}
              </p>
            </div>
          </div>
          {puedeHacer(rol, 'crear') && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#2563EB', color: 'white', border: 'none', borderRadius: 16,
                padding: '0.8rem 1.8rem', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)', transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1D4ED8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563EB')}
            >
              <Plus size={18} /> Nueva requisición
            </button>
          )}
        </div>

        {/* CARDS */}
        <DashboardCards requisiciones={requisiciones} />

        {/* TABLA */}
        <div style={{
          backgroundColor: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', minHeight: 500,
        }}>
          {/* Filtros */}
          <div style={{
            padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc',
          }}>
            <div style={{ position: 'relative', width: 400 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
              <input
                type="text" placeholder="Buscar por folio o descripción..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#111827' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={14} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '0.8rem', transform: 'translateY(-50%)' }} />
              <select
                value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                style={{ padding: '0.7rem 1rem 0.7rem 2.25rem', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, background: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}
              >
                <option value="">Todos los estados</option>
                {Object.keys(ESTADO_STYLES).map(e => (
                  <option key={e} value={e}>{getEstadoCompraUI(e as EstadoCompra).label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de datos */}
          {isLoading ? (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <span style={{ fontSize: 15 }}>Cargando requisiciones...</span>
            </div>
          ) : reqFiltradas.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>Sin requisiciones</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>Esperando requisiciones.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 820 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Fecha y Hora', 'Descripción', 'Estado', 'Área', 'Presupuesto', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '1.1rem 1.5rem', textAlign: i === 5 ? 'right' : 'left',
                      fontSize: 12, fontWeight: 800, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reqFiltradas.map((req, idx) => {
                  const canContinue = req.estado !== 'FINALIZADO' && req.estado !== 'RECHAZADO';
                  return (
                    <tr
                      key={req.id}
                      style={{ borderBottom: idx < reqFiltradas.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <Clock size={14} color="#94a3b8" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 14, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                              {new Date(req.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap' }}>{req.folio}</span>
                          <span style={{
                            background: req.tipo === 'EXTRAORDINARIA' ? '#FEF2F2' : '#EFF6FF',
                            color:      req.tipo === 'EXTRAORDINARIA' ? '#DC2626' : '#2563EB',
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                            border: `1px solid ${req.tipo === 'EXTRAORDINARIA' ? '#FECACA' : '#BFDBFE'}`,
                            whiteSpace: 'nowrap'
                          }}>{req.tipo}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.descripcion}
                        </div>
                        {req.usuario && (
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {req.usuario.nombre} {req.usuario.apellidos}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <EstadoBadge estado={req.estado} />
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Building2 size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 14, color: '#374151', whiteSpace: 'nowrap' }}>{req.areaSolicitante}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                          {req.presupuestoEstimado ? `$${req.presupuestoEstimado.toLocaleString('es-MX')}` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setDetalle(req)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <Eye size={12}/> Detalles
                          </button>
                          {(req.ordenCompra || (req as any).ordenPago) && (
                            <button
                              onClick={() => { setTabOrdenes(req.ordenCompra ? 'compra' : 'pago'); setOrdenesDetalle(req); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 8, padding: '4px 9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <FileText size={12}/> Ver órdenes
                            </button>
                          )}
                          {canContinue && (
                            <button
                              onClick={() => {
                                setFormCot({ proveedor: '', precio: '', tiempoEntrega: '' });
                                setCotSeleccionada(null);
                                setFormObs('');
                                estadoModalRef.current = req.estado;
                                setProceso(req);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, padding: '4px 9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              Continuar <ChevronRight size={12}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {renderCreate()}
      {renderProceso()}
      {renderDetalle()}
      {renderOrdenes()}
      {notif && <Notif msg={notif} onClose={() => setNotif(null)} />}
    </>
  );
}