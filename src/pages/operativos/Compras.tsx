import { useState, useRef } from 'react';
import React from 'react';
import {
  ShoppingCart, Plus, FileText, Upload,
  CheckCircle, XCircle, Clock, ChevronRight, Package,
  TrendingUp, DollarSign, Eye, X,
  Building2, Receipt, CreditCard, Send, Save,
  Star, ArrowRight, Bell, Filter, Search, Download,
  AlertCircle, Loader2
} from 'lucide-react';
import { useCompras } from '../../hooks/useCompras';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { EstadoCompra, Cotizacion, Requisicion, Proveedor } from '../../types';
import { getEstadoCompraUI, getCotizacionProveedorNombre } from '../../types';
import { subirFactura } from '../../services/compras.service';
import apiClient from '../../services/api';
import { proveedoresService } from '../../services/proveedores.service';
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
  ALMACEN:       ['crear', 'cotizar', 'ordenar'],
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
  EN_COMPRAS:                { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6',  border: '#BFDBFE' },
  DEVUELTA_A_COMPRAS:        { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316',  border: '#FED7AA' },
  EN_REVISION_RECURSOS:      { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6',  border: '#BFDBFE' },
  EN_REVISION_COMPRAS:       { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316',  border: '#FED7AA' },
  EN_REVISION_ADMINISTRACION:{ bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308',  border: '#FEF08A' },
  EN_REVISION_DIRECCION:     { bg: '#FDF2F8', text: '#BE185D', dot: '#EC4899',  border: '#FBCFE8' },
  COTIZACIONES_CARGADAS:     { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4',  border: '#A5F3FC' },
  PROVEEDOR_SELECCIONADO:    { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6',  border: '#DDD6FE' },
  NEGOCIACION_COMPLETADA:    { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4',  border: '#A5F3FC' },
  AUTORIZADA:                { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E',  border: '#BBF7D0' },
  ORDEN_GENERADA:            { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6',  border: '#BFDBFE' },
  FACTURAS_RECIBIDAS:        { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1',  border: '#C7D2FE' },
  EXPEDIENTE_GENERADO:       { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E',  border: '#BBF7D0' },
  ENVIADA_A_FINANZAS:        { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6',  border: '#DDD6FE' },
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
            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #F3F4F6' }}>{getCotizacionProveedorNombre(c)}</td>
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

  const { requisiciones = [], isLoading, createReq, changeEstado, createCot, deleteCot, createCotCatalogo, createCotBulk, addCotProducto, enviarAdministracion, createOrden, createOrdenPago, genExpediente, enviarFinanzas, finalizar } = useCompras();

  const [proceso, setProceso]               = useState<Requisicion | null>(null);
  const [detalle, setDetalle]               = useState<Requisicion | null>(null);
  const [ordenesDetalle, setOrdenesDetalle] = useState<Requisicion | null>(null);
  const [tabOrdenes, setTabOrdenes]         = useState<'compra' | 'pago'>('compra');
  const [selectedOrdenIdx, setSelectedOrdenIdx] = useState<number>(0);
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
  const [enviadoOrden, setEnviadoOrden] = useState(false);
  const [enviadoFinalizar, setEnviadoFinalizar] = useState(false);

  // Nuevo flujo EN_COMPRAS: cotizaciones con catálogo de proveedores
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [proveedorSeleccionadoCot, setProveedorSeleccionadoCot] = useState<Proveedor | null>(null);
  const [formCotCatalogo, setFormCotCatalogo] = useState({ precio: '', tiempoEntrega: '', formaPago: '' });
  const [mostrarDropdownProv, setMostrarDropdownProv] = useState(false);
  const [preciosPorProducto, setPreciosPorProducto] = useState<Record<number, number>>({});

  // Estado para formularios de agregar cotización por producto
  interface AddCotFormState {
    open: boolean;
    proveedorId: string;
    precioUnitario: string;
    tiempoEntrega: string;
    formaPago: string;
    condicionesPago: string;
    garantia: string;
    marca: string;
    modelo: string;
    observaciones: string;
    error: string;
  }
  const emptyAddCotForm = (): AddCotFormState => ({
    open: false, proveedorId: '', precioUnitario: '', tiempoEntrega: '',
    formaPago: '', condicionesPago: '', garantia: '', marca: '', modelo: '',
    observaciones: '', error: '',
  });
  const [addCotForms, setAddCotForms] = useState<Record<number, AddCotFormState>>({});

  const getAddForm = (detalleId: number): AddCotFormState =>
    addCotForms[detalleId] ?? emptyAddCotForm();
  const setAddForm = (detalleId: number, patch: Partial<AddCotFormState>) =>
    setAddCotForms(prev => ({ ...prev, [detalleId]: { ...getAddForm(detalleId), ...patch } }));

  React.useEffect(() => {
    if (!proceso) { setAddCotForms({}); setEnviadoOrden(false); setEnviadoFinalizar(false); }
  }, [proceso?.id]);

  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores-activos'],
    queryFn: () => proveedoresService.getAll({ estado: 'ACTIVO', limit: 200 }),
  });
  const [cotSeleccionada, setCotSeleccionada] = useState<Cotizacion | null>(null);
  const [formCreate, setFormCreate]     = useState({
    areaSolicitante: '', descripcion: '', justificacion: '',
    presupuestoEstimado: '', tipo: 'ORDINARIA' as 'ORDINARIA'|'EXTRAORDINARIA'
  });
  const [detalles, setDetalles] = useState([{ producto: '', unidad: '', cantidad: 1 }]);
  const [facturaFile, setFacturaFile]         = useState<File | null>(null);
  const [facturaNumero, setFacturaNumero]     = useState('');
  const [facturaMonto, setFacturaMonto]       = useState('');
  const [facturaProveedorId, setFacturaProveedorId] = useState<number | null>(null);
  const [tabVista, setTabVista]           = useState<'activas' | 'finalizados'>('activas');
  const [expedienteDetalle, setExpedienteDetalle] = useState<Requisicion | null>(null);
  const [tabExpediente, setTabExpediente] = useState<'datos' | 'documentos' | 'historial'>('datos');
  const fileRef      = useRef<HTMLInputElement>(null);
  const staticBase   = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  // Congela el estado del modal al abrirlo para que el cache refresh no cambie de bloque
  const estadoModalRef = useRef<string | null>(null);
  const ordenPdfRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3500); };

  const descargarOrdenPDF = async () => {
    if (!ordenPdfRef.current || !ordenesDetalle?.ordenes?.length) return;
    const canvas  = await html2canvas(ordenPdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const folio = ordenesDetalle.ordenes[selectedOrdenIdx]?.folio ?? ordenesDetalle.ordenes[0].folio;
    pdf.save(`${folio}.pdf`);
  };

  const agregarDetalle    = () => setDetalles([...detalles, { producto: '', unidad: '', cantidad: 1 }]);
  const eliminarDetalle   = (i: number) => setDetalles(detalles.filter((_, idx) => idx !== i));
  const actualizarDetalle = (index: number, campo: 'producto'|'unidad'|'cantidad', valor: string|number) => {
    const nuevos = [...detalles];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setDetalles(nuevos);
  };

  const reqFiltradas = requisiciones.filter(r => {
    if (r.estado === 'FINALIZADO') return false;
    const coincideBusq   = r.folio.toLowerCase().includes(busqueda.toLowerCase()) || r.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado ? r.estado === filtroEstado : true;
    return coincideBusq && coincideEstado;
  });

  const reqFinalizadas = requisiciones.filter(r =>
    r.estado === 'ENVIADA_A_FINANZAS' || r.estado === 'FINALIZADO'
  );

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
            <div><strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Justificación:</strong> {req.requisicion?.justificacion ?? req.justificacion}</div>
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
            <div><strong>Folio:</strong> {req.folio} · <strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
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
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#374151', fontSize: 12, width: '25%' }}>Precio</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12, width: '25%' }}>Entrega</th>
                    <th style={{ padding: '10px 16px', width: 40 }} />
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
                        {getCotizacionProveedorNombre(c)}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: c.esMejorOpcion ? '#16A34A' : '#374151', fontWeight: 700 }}>
                        ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <button
                          title="Eliminar cotización"
                          disabled={deleteCot.isPending}
                          onClick={() => deleteCot.mutate(
                            { compraId: req.id, cotizacionId: c.id },
                            { onSuccess: () => notify('Cotización eliminada'), onError: (err: any) => notify(`❌ ${err?.response?.data?.message ?? err?.message}`) }
                          )}
                          style={{ background: 'none', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', padding: '4px 6px' }}
                        >
                          <X size={13} />
                        </button>
                      </td>
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

    // ── En espera de revisión (solo lectura para quien ya actuó) ─────────────
    if (estadoModal === 'EN_REVISION_ADMINISTRACION' || estadoModal === 'EN_REVISION_DIRECCION') {
      const enDireccion = estadoModal === 'EN_REVISION_DIRECCION';
      return (
        <Modal
          title={enDireccion ? 'En revisión — Dirección General' : 'En revisión — Administración'}
          onClose={() => { estadoModalRef.current = null; setProceso(null); }}
          width={520}
        >
          <div style={{
            background: enDireccion ? '#FDF2F8' : '#FEFCE8',
            border: `1px solid ${enDireccion ? '#FBCFE8' : '#FEF08A'}`,
            borderRadius: 12, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} color={enDireccion ? '#BE185D' : '#CA8A04'} />
              <span style={{ fontSize: 15, fontWeight: 700, color: enDireccion ? '#9D174D' : '#92400E' }}>
                {enDireccion
                  ? 'Esperando autorización de Dirección General'
                  : 'Esperando revisión de Administración'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: enDireccion ? '#9D174D' : '#92400E', lineHeight: 1.5 }}>
              {enDireccion
                ? 'El expediente de cotizaciones está en revisión por Dirección General. No se requiere ninguna acción de tu parte en este momento.'
                : 'Las cotizaciones fueron enviadas a Administración para su revisión. No se requiere ninguna acción de tu parte en este momento.'}
            </p>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Folio:</strong> {req.folio} &nbsp;·&nbsp; <strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
            {req.descripcion && <div><strong>Descripción:</strong> {req.descripcion}</div>}
            <div>
              <strong>Artículos cotizados:</strong>{' '}
              {req.requisicion?.detalles?.length ?? req.cotizaciones?.length ?? 0}
              {' — '}
              <strong>Proveedores:</strong>{' '}
              {[...new Set((req.cotizaciones ?? []).map(c => getCotizacionProveedorNombre(c)).filter(Boolean))].length || (req.cotizaciones?.length ?? 0)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => { estadoModalRef.current = null; setProceso(null); }}>Cerrar</Btn>
          </div>
        </Modal>
      );
    }

    // ── 4b. EN_REVISION_DIRECCION → AUTORIZADA / RECHAZADO ───────────────────
    if (estadoModal === 'EN_REVISION_DIRECCION' && puedeHacer(rol, 'autorizar')) {
      const cotizaciones  = req.cotizaciones ?? [];
      const detallesReq   = req.requisicion?.detalles ?? [];

      const filasPorProducto = detallesReq.map(d => {
        const cot = cotizaciones.find(c => c.requisicionDetalleId === d.id);
        const precioUnit = cot ? Number(cot.precioUnitario ?? cot.precio ?? 0) : 0;
        const total      = precioUnit * d.cantidadSolicitada;
        return { detalle: d, cot, precioUnit, total };
      });

      const cotsLegacy = cotizaciones.filter(c => !c.requisicionDetalleId);
      const usaFlujoPorProducto = filasPorProducto.some(f => f.cot);

      const subtotal    = filasPorProducto.reduce((s, f) => s + f.total, 0)
                        + cotsLegacy.reduce((s, c) => s + Number(c.precio ?? 0), 0);
      const iva         = subtotal * 0.16;
      const totalConIva = subtotal + iva;

      const resumenProv: Record<string, { nombre: string; cantidad: number; subtotal: number }> = {};
      for (const f of filasPorProducto) {
        if (!f.cot) continue;
        const nombre = getCotizacionProveedorNombre(f.cot);
        if (!resumenProv[nombre]) resumenProv[nombre] = { nombre, cantidad: 0, subtotal: 0 };
        resumenProv[nombre].cantidad  += 1;
        resumenProv[nombre].subtotal  += f.total;
      }
      const gruposProv = Object.values(resumenProv);

      return (
        <Modal title="Autorización — Dirección General" onClose={() => { setProceso(null); setFormObs(''); }} width={780}>
          {/* Banner instrucción */}
          <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#9D174D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            Revisa el expediente completo y emite la autorización o rechazo definitivo.
          </div>

          {/* Encabezado */}
          <div style={{ background: 'linear-gradient(135deg, #831843 0%, #BE185D 100%)', borderRadius: 12, padding: '14px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Folio</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{req.folio}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Área</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Total aprobado</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '5px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Package size={12} /> {detallesReq.length} artículos
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '5px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Building2 size={12} /> {gruposProv.length} {gruposProv.length === 1 ? 'proveedor' : 'proveedores'}
                </div>
              </div>
            </div>
            {req.descripcion && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{req.descripcion}</div>}
          </div>

          {/* Tabla por producto */}
          {usaFlujoPorProducto && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '9px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={13} style={{ color: '#BE185D' }} />
                <span style={{ fontWeight: 700, fontSize: 11, color: '#1E293B', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                  Mejor opción por artículo
                </span>
              </div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1E293B' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Artículo</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Cant.</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Proveedor seleccionado</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>P. Unit.</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Total</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Entrega</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Forma pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasPorProducto.map((f, idx) => (
                      <tr key={f.detalle.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #F1F5F9', background: f.cot ? 'white' : '#FFF8F0', borderLeft: f.cot ? '3px solid transparent' : '3px solid #FED7AA' }}>
                        <td style={{ padding: '9px 12px', color: '#94A3B8', fontWeight: 500 }}>{f.detalle.numero}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0F172A' }}>{f.detalle.productoNombre ?? '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' as const, fontWeight: 700, color: '#1E293B' }}>{f.detalle.cantidadSolicitada}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {f.cot
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                                <CheckCircle size={11} /> {getCotizacionProveedorNombre(f.cot)}
                              </span>
                            : <span style={{ fontSize: 11, color: '#F97316' }}>Sin cotización</span>}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' as const, color: '#374151', fontWeight: 600 }}>
                          {f.precioUnit > 0 ? `$${f.precioUnit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' as const, fontWeight: 700, color: f.total > 0 ? '#0F172A' : '#CBD5E1' }}>
                          {f.total > 0 ? `$${f.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#64748B', fontSize: 11 }}>{f.cot?.tiempoEntrega ?? '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B', fontSize: 11 }}>{f.cot?.formaPago ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Totales */}
              <div style={{ borderTop: '2px solid #E2E8F0', background: '#F8FAFC', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end' as const }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, minWidth: 240 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' as const, fontSize: 12, color: '#64748B' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' as const, fontSize: 12, color: '#64748B' }}>
                    <span>IVA (16%)</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ height: 1, background: '#E2E8F0', margin: '3px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Total con IVA</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cotizaciones legacy */}
          {cotsLegacy.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', background: '#F9FAFB', fontWeight: 700, fontSize: 11, color: '#374151', borderBottom: '1px solid #E8ECF0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Cotizaciones ({cotsLegacy.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '8px 14px', textAlign: 'left' as const, fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Proveedor</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' as const, fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Precio</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left' as const, fontWeight: 600, fontSize: 11, color: '#6B7280' }}>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {cotsLegacy.map((c: Cotizacion) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 500, color: '#111827' }}>{getCotizacionProveedorNombre(c)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' as const, fontWeight: 700, color: '#374151' }}>${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '9px 14px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen por proveedor */}
          {gruposProv.length > 0 && (
            <div style={{ border: '1px solid #BFDBFE', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
              <div style={{ padding: '9px 16px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={13} style={{ color: '#2563EB' }} />
                <span style={{ fontWeight: 700, fontSize: 11, color: '#1D4ED8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                  Órdenes de compra autorizadas
                </span>
                <span style={{ marginLeft: 'auto', background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  {gruposProv.length} {gruposProv.length === 1 ? 'proveedor' : 'proveedores'}
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
                {gruposProv.map((g, i) => (
                  <div key={i} style={{ flex: '1 1 200px', border: '1px solid #BFDBFE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: '10px 14px', background: '#F8FBFF' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B', marginBottom: 6 }}>{g.nombre}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }}>
                      <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                        {g.cantidad} {g.cantidad === 1 ? 'artículo' : 'artículos'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>
                        ${g.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(req.requisicion?.justificacion ?? req.justificacion) && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#475569' }}>
              <strong style={{ color: '#1E293B' }}>Justificación:</strong> {req.requisicion?.justificacion ?? req.justificacion}
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

    // ── NUEVO FLUJO: EN_COMPRAS / DEVUELTA_A_COMPRAS / COTIZACIONES_CARGADAS → múltiples cotizaciones por producto ──
    if ((estadoModal === 'EN_COMPRAS' || estadoModal === 'DEVUELTA_A_COMPRAS' || estadoModal === 'COTIZACIONES_CARGADAS') && puedeHacer(rol, 'cotizar')) {
      const req            = requisiciones.find(r => r.id === proceso.id) ?? proceso;
      const detallesReq    = req.requisicion?.detalles ?? [];
      const proveedoresCat = proveedoresData?.data ?? [];
      const todasCots      = req.cotizaciones ?? [];
      const esCompraMayor  = req.esCompraMayor ?? false;
      const minCots        = esCompraMayor ? 3 : 1;

      // Helper: cotizaciones de un artículo específico
      const cotsDeDetalle = (detalleId: number): Cotizacion[] =>
        todasCots.filter(c => c.requisicionDetalleId === detalleId);

      const todoListo = detallesReq.length > 0 && detallesReq.every(d =>
        cotsDeDetalle(d.id).length >= minCots
      );

      const cerrarCatalogo = () => {
        estadoModalRef.current = null;
        setProceso(null);
        setAddCotForms({});
      };

      const inpBase: React.CSSProperties = { height: 30, padding: '0 8px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' as const };

      return (
        <Modal
          title={estadoModal === 'DEVUELTA_A_COMPRAS' ? 'Cotizaciones — Compra devuelta' : 'Cotizaciones de compra'}
          onClose={cerrarCatalogo}
          width={1100}
        >
          {/* Banner devuelta */}
          {estadoModal === 'DEVUELTA_A_COMPRAS' && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span><strong>Compra devuelta por administración.</strong> Actualiza las cotizaciones y reenvía para continuar el proceso.</span>
            </div>
          )}

          {/* Encabezado */}
          <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', borderRadius: 12, padding: '14px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' as const }}>
              <div>
                <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Folio</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{req.folio}</div>
              </div>
              <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Área</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{req.requisicion?.areaSolicitante || (req.requisicion?.areaSolicitante || req.areaSolicitante) || '—'}</div>
              </div>
              {req.requisicion && (
                <>
                  <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Requisición</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{req.requisicion.folio}</div>
                  </div>
                </>
              )}
              {esCompraMayor && (
                <div style={{ marginLeft: 'auto', background: '#FBBF24', color: '#7C2D12', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800 }}>
                  Compra mayor — requiere {minCots} cotizaciones por artículo
                </div>
              )}
            </div>
          </div>

          {/* Sin artículos */}
          {detallesReq.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center' as const, color: '#9CA3AF', fontSize: 13, background: '#F9FAFB', borderRadius: 10, border: '1px dashed #E5E7EB' }}>
              <Package size={28} style={{ marginBottom: 8, opacity: 0.35 }} />
              <div>Esta compra no tiene artículos de requisición.</div>
            </div>
          )}

          {/* ── Una sección por artículo ── */}
          {detallesReq.map(d => {
            const cots    = cotsDeDetalle(d.id);
            const addForm = getAddForm(d.id);
            const faltaCots = cots.length < minCots;

            return (
              <div key={d.id} style={{ border: `1.5px solid ${faltaCots ? '#FDE68A' : '#BBF7D0'}`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Cabecera artículo */}
                <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                  <span style={{ background: '#1E293B', color: 'white', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>#{d.numero}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{d.productoNombre ?? '—'}</span>
                  <span style={{ background: '#F1F5F9', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#64748B' }}>{d.cantidadSolicitada} {d.unidadLibre ?? ''}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: faltaCots ? '#D97706' : '#16A34A', fontWeight: 600 }}>
                    {cots.length}/{minCots} cotiz.
                  </span>
                </div>

                {/* Sub-tabla de cotizaciones existentes */}
                {cots.length > 0 && (
                  <div style={{ overflowX: 'auto' as const }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#1E293B' }}>
                          {['Proveedor', 'P. Unitario', 'Total', 'Entrega', 'Forma pago', 'Garantía', 'Marca / Modelo', ''].map((h, i) => (
                            <th key={i} style={{ padding: '7px 10px', textAlign: (i === 1 || i === 2) ? 'right' as const : 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cots.map(c => {
                          const precioUnit = Number(c.precioUnitario ?? c.precio ?? 0);
                          const totalLinea = precioUnit * d.cantidadSolicitada;
                          return (
                            <tr key={c.id} style={{ background: 'white', borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>{getCotizacionProveedorNombre(c)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' as const, fontWeight: 700, color: '#16A34A' }}>
                                ${precioUnit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' as const, fontWeight: 700, color: '#1E293B' }}>
                                ${totalLinea.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>{c.tiempoEntrega ?? '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>{c.formaPago ?? '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748B', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.garantia ?? '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>
                                {[c.marca, c.modelo].filter(Boolean).join(' / ') || '—'}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' as const }}>
                                <button
                                  onClick={() => deleteCot.mutate(
                                    { compraId: req.id, cotizacionId: c.id },
                                    { onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } }; message?: string }; notify(`Error: ${e?.response?.data?.message ?? e?.message}`); } }
                                  )}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                                  title="Eliminar cotización"
                                >
                                  <X size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Formulario inline: agregar cotización */}
                {addForm.open ? (
                  <div style={{ padding: '12px 16px', background: '#F0F9FF', borderTop: cots.length > 0 ? '1px solid #E2E8F0' : 'none' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#0369A1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={13} /> Nueva cotización — {d.productoNombre}
                    </div>
                    {/* Fila 1: campos principales */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Proveedor *</label>
                        <select
                          value={addForm.proveedorId}
                          onChange={e => setAddForm(d.id, { proveedorId: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        >
                          <option value="">Seleccionar…</option>
                          {proveedoresCat.map((p: Proveedor) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Precio unit. *</label>
                        <input type="number" min={0} step={0.01} placeholder="0.00"
                          value={addForm.precioUnitario}
                          onChange={e => setAddForm(d.id, { precioUnitario: e.target.value })}
                          style={{ ...inpBase, width: '100%', textAlign: 'right' as const }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>T. Entrega</label>
                        <input type="text" placeholder="Ej. 5 días"
                          value={addForm.tiempoEntrega}
                          onChange={e => setAddForm(d.id, { tiempoEntrega: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Forma pago</label>
                        <select value={addForm.formaPago} onChange={e => setAddForm(d.id, { formaPago: e.target.value })} style={{ ...inpBase, width: '100%' }}>
                          <option value="">—</option>
                          <option>Contado</option>
                          <option>Crédito 15 días</option>
                          <option>Crédito 30 días</option>
                          <option>Crédito 60 días</option>
                          <option>Transferencia bancaria</option>
                          <option>Cheque nominativo</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Cond. pago</label>
                        <input type="text" placeholder="Ej. 50% anticipo"
                          value={addForm.condicionesPago}
                          onChange={e => setAddForm(d.id, { condicionesPago: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        />
                      </div>
                    </div>
                    {/* Fila 2: datos adicionales */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 8, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Garantía</label>
                        <input type="text" placeholder="Ej. 1 año"
                          value={addForm.garantia}
                          onChange={e => setAddForm(d.id, { garantia: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Marca</label>
                        <input type="text" placeholder="Marca"
                          value={addForm.marca}
                          onChange={e => setAddForm(d.id, { marca: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Modelo</label>
                        <input type="text" placeholder="Modelo"
                          value={addForm.modelo}
                          onChange={e => setAddForm(d.id, { modelo: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', marginBottom: 3, textTransform: 'uppercase' as const }}>Observaciones</label>
                        <input type="text" placeholder="Observaciones adicionales"
                          value={addForm.observaciones}
                          onChange={e => setAddForm(d.id, { observaciones: e.target.value })}
                          style={{ ...inpBase, width: '100%' }}
                        />
                      </div>
                    </div>
                    {addForm.error && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#B91C1C', marginBottom: 8 }}>{addForm.error}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={addCotProducto.isPending}
                        onClick={() => {
                          if (!addForm.proveedorId) { setAddForm(d.id, { error: 'Selecciona un proveedor' }); return; }
                          const precio = parseFloat(addForm.precioUnitario);
                          if (isNaN(precio) || precio <= 0) { setAddForm(d.id, { error: 'El precio unitario debe ser mayor a 0' }); return; }
                          setAddForm(d.id, { error: '' });
                          addCotProducto.mutate(
                            {
                              id: req.id,
                              data: {
                                requisicionDetalleId: d.id,
                                proveedorId:    Number(addForm.proveedorId),
                                precioUnitario: precio,
                                tiempoEntrega:  addForm.tiempoEntrega  || undefined,
                                formaPago:      addForm.formaPago      || undefined,
                                condicionesPago:addForm.condicionesPago|| undefined,
                                garantia:       addForm.garantia       || undefined,
                                marca:          addForm.marca          || undefined,
                                modelo:         addForm.modelo         || undefined,
                                observaciones:  addForm.observaciones  || undefined,
                              },
                            },
                            {
                              onSuccess: () => { setAddForm(d.id, emptyAddCotForm()); notify('Cotización agregada'); },
                              onError:   (err: unknown) => { const e = err as { response?: { data?: { message?: string } }; message?: string }; setAddForm(d.id, { error: e?.response?.data?.message ?? e?.message ?? 'Error' }); },
                            }
                          );
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: addCotProducto.isPending ? '#94A3B8' : '#2563EB', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: addCotProducto.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                      >
                        {addCotProducto.isPending ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : <><Save size={12} /> Guardar cotización</>}
                      </button>
                      <button
                        onClick={() => setAddForm(d.id, { open: false, error: '' })}
                        style={{ padding: '6px 12px', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Botón "Agregar cotización" */
                  <div style={{ padding: '10px 16px', borderTop: cots.length > 0 ? '1px solid #F1F5F9' : 'none' }}>
                    <button
                      onClick={() => setAddForm(d.id, { open: true })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', border: '1.5px dashed #BFDBFE', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <Plus size={13} /> Agregar cotización
                    </button>
                    {cots.length < minCots && (
                      <span style={{ marginLeft: 12, fontSize: 11, color: '#D97706' }}>
                        Faltan {minCots - cots.length} cotizaci{minCots - cots.length === 1 ? 'ón' : 'ones'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 16, flexWrap: 'wrap' as const }}>
            {req.estado === 'COTIZACIONES_CARGADAS' && (
              <button
                disabled={!todoListo || enviarAdministracion.isPending}
                onClick={() => enviarAdministracion.mutate(
                  { id: req.id },
                  {
                    onSuccess: () => { cerrarCatalogo(); notify('Compra enviada a revisión administrativa'); },
                    onError:   (err: unknown) => { const e = err as { response?: { data?: { message?: string } }; message?: string }; notify(`Error: ${e?.response?.data?.message ?? e?.message}`); },
                  }
                )}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: !todoListo || enviarAdministracion.isPending ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: !todoListo || enviarAdministracion.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {enviarAdministracion.isPending ? <><Loader2 size={14} /> Enviando…</> : <><Send size={14} /> Enviar a Revisión Administrativa</>}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {!todoListo && detallesReq.length > 0 && (
              <span style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} />
                Cada artículo necesita al menos {minCots} cotizaci{minCots === 1 ? 'ón' : 'ones'}
              </span>
            )}
            <button onClick={cerrarCatalogo} style={{ padding: '8px 16px', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cerrar
            </button>
          </div>
        </Modal>
      );
    }

    // ── COTIZACIONES_CARGADAS → Enviar a Revisión Administrativa ─────────────
    if (estadoModal === 'COTIZACIONES_CARGADAS' && puedeHacer(rol, 'cotizar') && !puedeHacer(rol, 'negociar')) {
      const cotizacionesActuales = req.cotizaciones ?? [];
      const mejorCot = cotizacionesActuales.find(c => c.esMejorOpcion) ?? cotizacionesActuales[0];
      return (
        <Modal title="Cotizaciones listas — Enviar a Administración" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={620}>
          <div style={{ background: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: 10, padding: 12, fontSize: 13, color: '#0E7490', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} />
            Se registraron {cotizacionesActuales.length} cotizacione{cotizacionesActuales.length !== 1 ? 's' : ''}. Puedes enviar a revisión administrativa.
          </div>
          {cotizacionesActuales.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#F9FAFB', fontWeight: 600, fontSize: 11, color: '#374151', borderBottom: '1px solid #E8ECF0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Comparativa de cotizaciones
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Proveedor</th>
                    <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Precio</th>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionesActuales.map((c: Cotizacion) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0', background: c.esMejorOpcion ? '#F0FDF4' : 'white' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 500, color: '#111827' }}>
                        {c.esMejorOpcion && <span style={{ fontSize: 10, background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 4, padding: '1px 6px', fontWeight: 700, marginRight: 6 }}>Mejor</span>}
                        {getCotizacionProveedorNombre(c)}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', color: c.esMejorOpcion ? '#16A34A' : '#374151', fontWeight: 700 }}>
                        ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {mejorCot && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 12, fontSize: 13, color: '#166534' }}>
              <strong>Proveedor recomendado:</strong> {getCotizacionProveedorNombre(mejorCot)} — ${Number(mejorCot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn
              variant="success"
              icon={enviarAdministracion.isPending ? <Loader2 size={15} /> : <Send size={15} />}
              disabled={enviarAdministracion.isPending}
              onClick={() => {
                enviarAdministracion.mutate(
                  { id: req.id },
                  {
                    onSuccess: () => {
                      estadoModalRef.current = null;
                      setProceso(null);
                      queryClient.invalidateQueries({ queryKey: ['compras'] });
                      notify('Compra enviada a revisión administrativa');
                    },
                    onError: (err: any) => notify(`Error: ${err?.response?.data?.message ?? err?.message}`),
                  }
                );
              }}
            >
              {enviarAdministracion.isPending ? 'Enviando…' : 'Enviar a Revisión Administrativa'}
            </Btn>
            <Btn variant="ghost" onClick={() => { estadoModalRef.current = null; setProceso(null); }}>Cancelar</Btn>
          </div>
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
            <div><strong>Folio:</strong> {req.folio} · <strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
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

    // ── 7b. AUTORIZADA — informativo para quienes no generan orden ───────────
    if (estadoModal === 'AUTORIZADA' && !puedeHacer(rol, 'ordenar')) {
      const todasCotsA  = req.cotizaciones ?? [];
      const detallesA   = req.requisicion?.detalles ?? [];
      const gruposA: { nombre: string; cantidad: number; subtotal: number }[] = [];
      for (const d of detallesA) {
        const gan = todasCotsA.find(c => c.requisicionDetalleId === d.id && c.esMejorOpcion);
        if (!gan) continue;
        const nombre = getCotizacionProveedorNombre(gan) || `Proveedor #${gan.proveedorId}`;
        const monto  = Number(gan.precioUnitario ?? gan.precio ?? 0) * d.cantidadSolicitada;
        const ex = gruposA.find(g => g.nombre === nombre);
        if (ex) { ex.subtotal += monto; ex.cantidad += 1; }
        else gruposA.push({ nombre, subtotal: monto, cantidad: 1 });
      }
      const subtotalA    = gruposA.reduce((s, g) => s + g.subtotal, 0);
      const totalConIvaA = subtotalA * 1.16;
      return (
        <Modal title="Requisición autorizada" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={520}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={22} color="#16A34A" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>Autorizada por Dirección General</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              La requisición fue revisada y autorizada. Está lista para continuar el proceso de compra.
            </p>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Folio:</strong> {req.folio} &nbsp;·&nbsp; <strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
            {gruposA.map((g, i) => (
              <div key={i}><strong>Proveedor ganador:</strong> {g.nombre} — ${g.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({g.cantidad} art.)</div>
            ))}
            {totalConIvaA > 0 && (
              <div style={{ fontWeight: 700, color: '#16A34A' }}><strong style={{ color: '#374151', fontWeight: 600 }}>Total c/IVA:</strong> ${totalConIvaA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => { estadoModalRef.current = null; setProceso(null); }}>Cerrar</Btn>
          </div>
        </Modal>
      );
    }

    // ── 8. AUTORIZADA → ORDEN_GENERADA ───────────────────────────────────────
    if (estadoModal === 'AUTORIZADA' && puedeHacer(rol, 'ordenar')) {
      const todasCots8  = req.cotizaciones ?? [];
      const detalles8   = req.requisicion?.detalles ?? [];

      // Agrupar proveedores ganadores
      const grupos8: { nombre: string; cantidad: number; subtotal: number }[] = [];
      for (const d of detalles8) {
        const gan = todasCots8.find(c => c.requisicionDetalleId === d.id && c.esMejorOpcion);
        if (!gan) continue;
        const nombre = getCotizacionProveedorNombre(gan) || `Proveedor #${gan.proveedorId}`;
        const monto  = Number(gan.precioUnitario ?? gan.precio ?? 0) * d.cantidadSolicitada;
        const ex = grupos8.find(g => g.nombre === nombre);
        if (ex) { ex.subtotal += monto; ex.cantidad += 1; }
        else grupos8.push({ nombre, subtotal: monto, cantidad: 1 });
      }
      const subtotal8    = grupos8.reduce((s, g) => s + g.subtotal, 0);
      const iva8         = subtotal8 * 0.16;
      const total8       = subtotal8 + iva8;

      // Fallback: cotización legacy
      const cotLegacy    = todasCots8.find(c => c.esMejorOpcion) ?? todasCots8[0];
      const hayGanadores = grupos8.length > 0;

      return (
        <Modal title="Generar orden de compra" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={680}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="#16A34A" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Requisición autorizada por Dirección General</span>
          </div>

          {/* Proveedores ganadores */}
          {hayGanadores ? (
            <div style={{ border: '1px solid #BFDBFE', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={13} style={{ color: '#2563EB' }} />
                <span style={{ fontWeight: 700, fontSize: 11, color: '#1D4ED8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Proveedores (mejor cotización)</span>
                <span style={{ marginLeft: 'auto', background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  {grupos8.length} {grupos8.length === 1 ? 'proveedor' : 'proveedores'}
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap' as const, gap: 10, alignItems: 'flex-end' }}>
                {grupos8.map((g, i) => (
                  <div key={i} style={{ flex: '1 1 160px', border: '1px solid #BFDBFE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: '10px 14px', background: '#F8FBFF' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B', marginBottom: 5 }}>{g.nombre}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }}>
                      <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{g.cantidad} art.</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>${g.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
                <div style={{ flex: '1 1 160px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>Subtotal: ${subtotal8.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>IVA (16%): ${iva8.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#15803D' }}>Total: ${total8.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          ) : cotLegacy ? (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Proveedor (mejor cotización)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E3A5F' }}>{getCotizacionProveedorNombre(cotLegacy)}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Monto</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>${Number(cotLegacy.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 14, fontSize: 13, color: '#DC2626' }}>
              Sin cotizaciones registradas. Verifica el proceso antes de continuar.
            </div>
          )}

          {/* Tabla de artículos con proveedor ganador */}
          {detalles8.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#F9FAFB', fontWeight: 600, fontSize: 11, color: '#374151', borderBottom: '1px solid #E8ECF0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Artículos de la orden
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    {['Artículo', 'Cant.', 'Proveedor', 'P. Unit.', 'Total'].map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: (i >= 3 ? 'right' : i === 1 ? 'center' : 'left') as React.CSSProperties['textAlign'], fontWeight: 600, color: '#6B7280', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalles8.map(d => {
                    const gan      = todasCots8.find(c => c.requisicionDetalleId === d.id && c.esMejorOpcion);
                    const precioU  = gan ? Number(gan.precioUnitario ?? gan.precio ?? 0) : 0;
                    const totalD   = precioU * d.cantidadSolicitada;
                    return (
                      <tr key={d.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                        <td style={{ padding: '8px 12px', color: '#111827', fontWeight: 500 }}>{d.productoNombre ?? '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{d.cantidadSolicitada} {d.unidadLibre ?? ''}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{gan ? getCotizacionProveedorNombre(gan) : <span style={{ color: '#9CA3AF' }}>Sin ganador</span>}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151' }}>{precioU > 0 ? `$${precioU.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: totalD > 0 ? '#0F172A' : '#CBD5E1' }}>{totalD > 0 ? `$${totalD.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn
              icon={<Package size={15}/>}
              disabled={(!hayGanadores && !cotLegacy) || createOrden.isPending || enviadoOrden}
              onClick={() => {
                if (enviadoOrden) return;
                setEnviadoOrden(true);
                createOrden.mutate(req.id, {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Orden de compra generada'); },
                  onError:   (err: unknown) => { setEnviadoOrden(false); const e = err as { response?: { data?: { message?: string } }; message?: string }; notify(`Error: ${e?.response?.data?.message ?? e?.message}`); },
                });
              }}
            >
              {createOrden.isPending ? 'Generando…' : 'Generar orden de compra'}
            </Btn>
            <Btn variant="ghost" onClick={() => { estadoModalRef.current = null; setProceso(null); }}>Cancelar</Btn>
          </div>
        </Modal>
      );
    }

    // ── 9. ORDEN_GENERADA → FACTURAS_RECIBIDAS ───────────────────────────────
    if (estadoModal === 'ORDEN_GENERADA' && puedeHacer(rol, 'facturas')) {
      return (
        <Modal title="Orden de compra activa" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={560}>
          {(req.ordenes ?? []).map(oc => (
            <div key={oc.id} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Folio OC</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>{oc.folio}</div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Proveedor</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{typeof oc.proveedor === 'object' && oc.proveedor !== null ? (oc.proveedor as any).nombre : String(oc.proveedor ?? '—')}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Total</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB' }}>${Number(oc.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          ))}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Pasos a completar:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>1. Realizar el pedido al proveedor con la orden de compra</div>
              <div>2. Notificar a Almacén para la recepción de materiales</div>
              <div>3. Subir las facturas al sistema una vez recibidas</div>
            </div>
          </div>
          {(req as any).facturas?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>Facturas registradas</p>
              {(req as any).facturas.map((f: any) => (
                <a key={f.id} href={`${staticBase}${f.documentoUrl}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 8, border: '1px solid #E8ECF0', background: '#F9FAFB', color: '#2563EB', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  <Receipt size={14} /> {f.numero} — ${Number(f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </a>
              ))}
            </div>
          )}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, fontSize: 13, color: '#1D4ED8' }}>
            Sube una factura por cada orden de compra. Una vez registradas todas las facturas, cierra esta ventana y genera el expediente.
          </div>
          {facturaFile ? (
            <div style={{ border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, background: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>
                <Receipt size={15} /> {facturaFile.name}
              </div>
              {(req.ordenes?.length ?? 0) > 1 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Proveedor *</label>
                  <select
                    value={facturaProveedorId ?? ''}
                    onChange={e => setFacturaProveedorId(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, background: 'white', boxSizing: 'border-box' as const }}
                  >
                    <option value="">— Selecciona proveedor —</option>
                    {(req.ordenes ?? []).map(o => {
                      const pId = o.proveedorId ?? (typeof o.proveedor === 'object' && o.proveedor !== null ? (o.proveedor as { id: number; nombre: string }).id : undefined);
                      const pNombre = typeof o.proveedor === 'object' && o.proveedor !== null ? (o.proveedor as { id: number; nombre: string }).nombre : String(o.proveedor ?? '—');
                      return <option key={o.id} value={pId ?? ''}>{pNombre} — {o.folio}</option>;
                    })}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>N° Factura *</label>
                  <input type="text" value={facturaNumero} onChange={e => setFacturaNumero(e.target.value)} placeholder="Ej. F-001"
                    style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Monto (MXN) *</label>
                  <input type="number" min="0" step="0.01" value={facturaMonto} onChange={e => setFacturaMonto(e.target.value)} placeholder="0.00"
                    style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
              </div>
              {(() => {
                const multiOrd = (req.ordenes?.length ?? 0) > 1;
                const dis = !facturaNumero.trim() || !facturaMonto || Number(facturaMonto) <= 0 || (multiOrd && !facturaProveedorId);
                return (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setFacturaFile(null); setFacturaNumero(''); setFacturaMonto(''); setFacturaProveedorId(null); }}
                      style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 13, color: '#6B7280' }}>Cancelar</button>
                    <button disabled={dis}
                      onClick={async () => {
                        try {
                          await subirFactura(req.id, facturaFile, Number(facturaMonto), facturaNumero.trim(), facturaProveedorId ?? undefined);
                          setFacturaFile(null); setFacturaNumero(''); setFacturaMonto(''); setFacturaProveedorId(null);
                          queryClient.invalidateQueries({ queryKey: ['compras'] });
                          notify('✅ Factura registrada');
                        } catch (err: unknown) {
                          const e = err as { response?: { data?: { message?: string } }; message?: string };
                          notify(`Error al subir factura: ${e?.response?.data?.message ?? e?.message}`);
                        }
                      }}
                      style={{ flex: 2, height: 34, borderRadius: 8, border: 'none', background: dis ? '#9CA3AF' : '#2563EB', color: 'white', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>Subir factura</button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', background: '#F9FAFB' }}
              onClick={() => fileRef.current?.click()}>
              <Upload size={26} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Haz clic para subir factura (XML / PDF)</p>
              <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: 12 }}>Máx. 10 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.xml" style={{ display: 'none' }} onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFacturaFile(file);
            setFacturaNumero(file.name.replace(/\.[^/.]+$/, ''));
            setFacturaMonto('');
            e.target.value = '';
          }} />
        </Modal>
      );
    }

    // ── 10. FACTURAS_RECIBIDAS → EXPEDIENTE_GENERADO ─────────────────────────
    if (estadoModal === 'FACTURAS_RECIBIDAS' && puedeHacer(rol, 'pago')) {
      const facturas = (req as any).facturas ?? [];
      const totalFacturas = facturas.reduce((s: number, f: any) => s + Number(f.monto), 0);
      const nOrdenes = req.ordenes?.length ?? 1;
      return (
        <Modal title="Facturas de compra" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={560}>
          {/* Facturas ya registradas */}
          {facturas.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#F9FAFB', fontWeight: 600, fontSize: 11, color: '#374151', borderBottom: '1px solid #E8ECF0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Facturas registradas ({facturas.length}{nOrdenes > 1 ? ` de ${nOrdenes} esperadas` : ''})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }}>N° Factura</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Monto</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f: any) => (
                    <tr key={f.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{f.numero}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' as const, fontWeight: 600, color: '#374151' }}>${Number(f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' as const }}>
                        {f.documentoUrl ? (
                          <a href={`${staticBase}${f.documentoUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontSize: 12 }}>Ver</a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #E8ECF0', background: '#F9FAFB' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' as const, fontWeight: 800, color: '#111827' }}>${totalFacturas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Upload form for additional invoices */}
          {facturaFile ? (
            <div style={{ border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, background: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>
                <Receipt size={15} /> {facturaFile.name}
              </div>
              {nOrdenes > 1 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Proveedor *</label>
                  <select
                    value={facturaProveedorId ?? ''}
                    onChange={e => setFacturaProveedorId(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, background: 'white', boxSizing: 'border-box' as const }}
                  >
                    <option value="">— Selecciona proveedor —</option>
                    {(req.ordenes ?? []).map(o => {
                      const pId = o.proveedorId ?? (typeof o.proveedor === 'object' && o.proveedor !== null ? (o.proveedor as { id: number; nombre: string }).id : undefined);
                      const pNombre = typeof o.proveedor === 'object' && o.proveedor !== null ? (o.proveedor as { id: number; nombre: string }).nombre : String(o.proveedor ?? '—');
                      return <option key={o.id} value={pId ?? ''}>{pNombre} — {o.folio}</option>;
                    })}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>N° Factura *</label>
                  <input type="text" value={facturaNumero} onChange={e => setFacturaNumero(e.target.value)} placeholder="Ej. F-002"
                    style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Monto (MXN) *</label>
                  <input type="number" min="0" step="0.01" value={facturaMonto} onChange={e => setFacturaMonto(e.target.value)} placeholder="0.00"
                    style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
              </div>
              {(() => {
                const dis = !facturaNumero.trim() || !facturaMonto || Number(facturaMonto) <= 0 || (nOrdenes > 1 && !facturaProveedorId);
                return (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setFacturaFile(null); setFacturaNumero(''); setFacturaMonto(''); setFacturaProveedorId(null); }}
                      style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 13, color: '#6B7280' }}>Cancelar</button>
                    <button disabled={dis}
                      onClick={async () => {
                        try {
                          await subirFactura(req.id, facturaFile, Number(facturaMonto), facturaNumero.trim(), facturaProveedorId ?? undefined);
                          setFacturaFile(null); setFacturaNumero(''); setFacturaMonto(''); setFacturaProveedorId(null);
                          queryClient.invalidateQueries({ queryKey: ['compras'] });
                          notify('✅ Factura registrada');
                        } catch (err: unknown) {
                          const e = err as { response?: { data?: { message?: string } }; message?: string };
                          notify(`Error al subir factura: ${e?.response?.data?.message ?? e?.message}`);
                        }
                      }}
                      style={{ flex: 2, height: 34, borderRadius: 8, border: 'none', background: dis ? '#9CA3AF' : '#2563EB', color: 'white', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>Subir factura</button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#F9FAFB' }}
              onClick={() => fileRef.current?.click()}>
              <Upload size={22} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />
              <p style={{ margin: 0, color: '#6B7280', fontSize: 13 }}>
                {facturas.length < nOrdenes
                  ? `Agregar factura ${facturas.length + 1} de ${nOrdenes}`
                  : 'Agregar factura adicional'}
              </p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.xml" style={{ display: 'none' }} onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFacturaFile(file);
            setFacturaNumero(file.name.replace(/\.[^/.]+$/, ''));
            setFacturaMonto('');
            e.target.value = '';
          }} />

          {/* Generate expediente once all invoices are uploaded */}
          <Btn
            icon={<FileText size={15}/>}
            disabled={genExpediente.isPending || facturas.length === 0}
            onClick={() => {
              genExpediente.mutate({ id: req.id }, {
                onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Expediente generado correctamente'); },
                onError:   (err: unknown) => { const e = err as { response?: { data?: { message?: string } }; message?: string }; notify(`Error: ${e?.response?.data?.message ?? e?.message}`); },
              });
            }}
          >
            {genExpediente.isPending ? 'Generando…' : 'Generar expediente de compra'}
          </Btn>
        </Modal>
      );
    }

    // ── 10b. EXPEDIENTE_GENERADO — ruta por monto ────────────────────────────
    if (estadoModal === 'EXPEDIENTE_GENERADO' && puedeHacer(rol, 'pago')) {
      const montoOrdenes = (req.ordenes ?? []).reduce((s, o) => s + Number(o.total), 0);
      const montoRef = montoOrdenes > 0
        ? montoOrdenes
        : ((req as any).totalFinal ?? req.presupuestoEstimado ?? 0);
      const esMayorCuantia = montoRef > 50000;
      return (
        <Modal title="Expediente generado" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={500}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={22} color="#16A34A" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Expediente generado correctamente</div>
              <div style={{ fontSize: 13, color: '#16A34A', marginTop: 2 }}>Documentación de compra consolidada.</div>
            </div>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Requisición:</strong> {req.folio}</div>
            <div><strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
            <div><strong>Monto referencia:</strong> ${montoRef.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 6, background: esMayorCuantia ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${esMayorCuantia ? '#FECACA' : '#BBF7D0'}`, color: esMayorCuantia ? '#DC2626' : '#166534', fontWeight: 600, fontSize: 12 }}>
              {esMayorCuantia ? 'Mayor cuantía (>$50,000) — requiere envío a Recursos Financieros' : 'Menor cuantía (≤$50,000) — puede finalizarse directamente'}
            </div>
          </div>
          {esMayorCuantia ? (
            <Btn
              icon={enviarFinanzas.isPending ? <Loader2 size={15} /> : <Send size={15}/>}
              disabled={enviarFinanzas.isPending}
              onClick={() => {
                enviarFinanzas.mutate({ id: req.id }, {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Compra enviada a Recursos Financieros'); },
                  onError:   (err: any) => notify(`Error: ${err?.response?.data?.message ?? err?.message}`),
                });
              }}
            >
              {enviarFinanzas.isPending ? 'Enviando…' : 'Enviar a Recursos Financieros'}
            </Btn>
          ) : (
            <Btn
              variant="success"
              icon={finalizar.isPending ? <Loader2 size={15} /> : <CheckCircle size={15}/>}
              disabled={finalizar.isPending || enviadoFinalizar}
              onClick={() => {
                if (enviadoFinalizar) return;
                setEnviadoFinalizar(true);
                finalizar.mutate({ id: req.id }, {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Compra finalizada exitosamente'); },
                  onError:   (err: any) => { setEnviadoFinalizar(false); notify(`Error: ${err?.response?.data?.message ?? err?.message}`); },
                });
              }}
            >
              {finalizar.isPending ? 'Finalizando…' : 'Finalizar compra'}
            </Btn>
          )}
        </Modal>
      );
    }

    // ── 10c. ENVIADA_A_FINANZAS — pendiente de pago ──────────────────────────
    if (estadoModal === 'ENVIADA_A_FINANZAS' && puedeHacer(rol, 'pago')) {
      return (
        <Modal title="Compra en Recursos Financieros" onClose={() => { estadoModalRef.current = null; setProceso(null); }} width={500}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Clock size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Pendiente con Recursos Financieros</div>
              <div style={{ fontSize: 13, color: '#B45309', marginTop: 4, lineHeight: 1.5 }}>
                La compra fue enviada a Recursos Financieros para procesamiento de pago. Una vez completado, finaliza el proceso.
              </div>
            </div>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Requisición:</strong> {req.folio}</div>
            <div><strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Presupuesto:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn
              variant="success"
              icon={finalizar.isPending ? <Loader2 size={15} /> : <CheckCircle size={15}/>}
              disabled={finalizar.isPending || enviadoFinalizar}
              onClick={() => {
                if (enviadoFinalizar) return;
                setEnviadoFinalizar(true);
                finalizar.mutate({ id: req.id }, {
                  onSuccess: () => { estadoModalRef.current = null; setProceso(null); notify('Compra finalizada exitosamente'); },
                  onError:   (err: any) => { setEnviadoFinalizar(false); notify(`Error: ${err?.response?.data?.message ?? err?.message}`); },
                });
              }}
            >
              {finalizar.isPending ? 'Finalizando…' : 'Finalizar compra'}
            </Btn>
            <Btn variant="ghost" onClick={() => { estadoModalRef.current = null; setProceso(null); }}>Cerrar</Btn>
          </div>
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
            <div><strong>Área:</strong> {(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
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
          <p style={{ marginBottom: 0, color: '#374151', lineHeight: 1.6, fontSize: 13 }}>{req.requisicion?.justificacion ?? req.justificacion}</p>
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
                    <td style={{ padding: '9px 13px', textAlign: 'center' }}>{typeof (d as any).producto === 'object' && (d as any).producto !== null ? (d as any).producto.nombre : String(d.producto ?? '—')}</td>
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
    const op     = (req as any).ordenPago;
    const hasOC  = !!req.ordenes?.length;
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
      const ordenes = req.ordenes ?? [];
      if (ordenes.length === 0) return (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
          <FileText size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ margin: 0 }}>La orden de compra aún no ha sido generada.</p>
        </div>
      );

      const idx   = Math.min(selectedOrdenIdx, ordenes.length - 1);
      const orden = ordenes[idx];

      const ordenPrvId: number | undefined =
        typeof orden.proveedor === 'object' && orden.proveedor !== null
          ? (orden.proveedor as { id: number; nombre: string }).id
          : orden.proveedorId;
      const ordenPrvNombre: string =
        typeof orden.proveedor === 'object' && orden.proveedor !== null
          ? (orden.proveedor as { id: number; nombre: string }).nombre
          : String(orden.proveedor ?? '—');

      const cotsGan = (req.cotizaciones ?? []).filter(c => c.esMejorOpcion);
      const reqDets = req.requisicion?.detalles ?? [];

      // Products for this specific order: match via winning cotización's proveedorId
      const perOrderRows: { nombre: string; unidad: string; cantidad: number }[] =
        ordenPrvId !== undefined
          ? reqDets
              .filter(d => {
                const gan = cotsGan.find(c => c.requisicionDetalleId === d.id);
                const ganPrvId = gan?.proveedorId ??
                  (typeof gan?.proveedor === 'object' && gan?.proveedor !== null
                    ? (gan.proveedor as { id: number; nombre: string }).id
                    : undefined);
                return ganPrvId === ordenPrvId;
              })
              .map(d => ({
                nombre: d.productoNombre ?? '—',
                unidad: d.unidadLibre ?? '—',
                cantidad: d.cantidadSolicitada,
              }))
          : [];

      // Fallback for legacy single-provider compras (no per-product cotizaciones)
      const legacyRows = (req.detalles ?? []).map((d: any) => ({
        nombre: typeof d.producto === 'object' && d.producto !== null ? (d.producto as any).nombre : String(d.producto ?? '—'),
        unidad: d.unidad,
        cantidad: d.cantidad,
      }));
      const fallbackRows = legacyRows.length > 0
        ? legacyRows
        : reqDets.map(d => ({ nombre: d.productoNombre ?? '—', unidad: d.unidadLibre ?? '—', cantidad: d.cantidadSolicitada }));

      const rows = perOrderRows.length > 0 ? perOrderRows : fallbackRows;

      return (
        <>
          {/* Order selector for multi-provider compras */}
          {ordenes.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
              {ordenes.map((o, i) => {
                const pNombre = typeof o.proveedor === 'object' && o.proveedor !== null
                  ? (o.proveedor as { id: number; nombre: string }).nombre
                  : String(o.proveedor ?? '—');
                const isActive = i === idx;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrdenIdx(i)}
                    style={{
                      padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      borderRadius: 8, fontFamily: 'inherit', transition: 'all 0.15s',
                      border: isActive ? '2px solid #16A34A' : '2px solid #E5E7EB',
                      background: isActive ? '#F0FDF4' : 'white',
                      color: isActive ? '#15803D' : '#6B7280',
                    }}
                  >
                    {o.folio} — {pNombre}
                  </button>
                );
              })}
            </div>
          )}
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
              <div><strong>Proveedor o razón social:</strong> {ordenPrvNombre}</div>
              <div><strong>Total:</strong> ${Number(orden.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ marginTop: 0, fontWeight: 600, color: '#111827', fontSize: 13 }}>Justificación</p>
              <p style={{ marginBottom: 0, color: '#374151', lineHeight: 1.6, fontSize: 13 }}>{req.requisicion?.justificacion ?? req.justificacion}</p>
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
                {rows.map((row, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #E8ECF0' }}>
                    <td style={{ padding: '9px 13px', textAlign: 'center', color: '#6B7280' }}>{index + 1}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center' }}>{row.nombre}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center', color: '#6B7280' }}>{row.unidad}</td>
                    <td style={{ padding: '9px 13px', textAlign: 'center', fontWeight: 600 }}>{row.cantidad}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin artículos registrados</td>
                  </tr>
                )}
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
            fechaOrdenCompra: req.ordenes?.[0]?.fecha,
            folioOrdenCompra: req.ordenes?.map(o => o.folio).join(', ') || null,
            numeroFactura:    f.numero,
            proveedor:        req.ordenes?.[0]?.proveedor ?? '—',
            monto:            f.monto > 0 ? f.monto : (req.ordenes?.reduce((s, o) => s + Number(o.total), 0) ?? 0),
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
                  <span style={{ color: '#374151' }}>{(req.requisicion?.areaSolicitante || req.areaSolicitante)}</span>
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
                          <td style={{ padding: '9px 10px', color: '#374151', fontWeight: 600 }}>{typeof d.proveedor === 'object' && d.proveedor !== null ? (d.proveedor as any).nombre : (d.proveedor || '—')}</td>
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


  // ─── MODAL DETALLE EXPEDIENTE (read-only) ────────────────────────────────────
  const renderExpedienteDetalle = () => {
    if (!expedienteDetalle) return null;
    const exp = requisiciones.find(r => r.id === expedienteDetalle.id) ?? expedienteDetalle;
    const facturas = (exp as any).facturas ?? [];
    const historial = exp.historial ?? [];
    const totalFacturas = facturas.reduce((s: number, f: any) => s + Number(f.monto ?? 0), 0);
    // Proveedores: from facturas proveedor or from ordenes when factura has no linked proveedor
    const proveedoresFactura = facturas.map((f: any) => f.proveedor?.nombre).filter(Boolean) as string[];
    const proveedoresOrdenes = (exp.ordenes ?? []).map(o =>
      typeof o.proveedor === 'object' && o.proveedor !== null
        ? (o.proveedor as { id: number; nombre: string }).nombre
        : String(o.proveedor ?? '')
    ).filter(Boolean);
    const proveedores = [...new Set(proveedoresFactura.length > 0 ? proveedoresFactura : proveedoresOrdenes)];
    const cotizaciones = exp.cotizaciones ?? [];
    const montoOrdenesExp = (exp.ordenes ?? []).reduce((s, o) => s + Number(o.total), 0);

    const tabBtn = (id: 'datos' | 'documentos' | 'historial', label: string) => (
      <button
        onClick={() => setTabExpediente(id)}
        style={{
          padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          borderBottom: tabExpediente === id ? '2px solid #6D28D9' : '2px solid transparent',
          color: tabExpediente === id ? '#6D28D9' : '#6B7280',
          background: 'transparent', fontFamily: 'inherit',
        }}
      >{label}</button>
    );

    const estadoStyle = ESTADO_STYLES[exp.estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8', border: '#E2E8F0' };
    const estadoLabel = getEstadoCompraUI(exp.estado as EstadoCompra).label;

    return createPortal(
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.22)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)', borderRadius: '16px 16px 0 0', padding: '20px 24px', color: 'white', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, marginBottom: 4 }}>Expediente de compra</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>{exp.folio}</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{(exp.requisicion?.areaSolicitante || exp.areaSolicitante)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: estadoStyle.bg, color: estadoStyle.text, border: `1px solid ${estadoStyle.border}`, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  {estadoLabel}
                </span>
                <button onClick={() => { setExpedienteDetalle(null); setTabExpediente('datos'); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #E8ECF0', padding: '0 20px', background: 'white', flexShrink: 0 }}>
            {tabBtn('datos', 'Datos generales')}
            {tabBtn('documentos', 'Documentos')}
            {tabBtn('historial', `Historial (${historial.length})`)}
          </div>
          {/* Contenido */}
          <div style={{ overflowY: 'auto', padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {tabExpediente === 'datos' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Datos de la compra</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Folio:</strong> {exp.folio}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Tipo:</strong> {exp.tipo}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Área:</strong> {(exp.requisicion?.areaSolicitante || exp.areaSolicitante)}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Descripción:</strong> {exp.requisicion?.descripcion ?? exp.descripcion}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Justificación:</strong> {exp.requisicion?.justificacion ?? exp.justificacion}</div>
                  </div>
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Finanzas</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Presupuesto estimado:</strong> ${(montoOrdenesExp > 0 ? montoOrdenesExp : ((exp as any).totalFinal ?? exp.presupuestoEstimado ?? 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>${totalFacturas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Total de facturas recibidas</div>
                    {exp.fechaEnvioFinanzas && (
                      <div style={{ fontSize: 13, color: '#6D28D9', fontWeight: 600, marginTop: 4 }}>
                        Enviado a finanzas: {new Date(exp.fechaEnvioFinanzas).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
                {proveedores.length > 0 && (
                  <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Proveedores</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {proveedores.map((p, i) => (
                        <span key={i} style={{ background: 'white', border: '1px solid #DDD6FE', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: '#4C1D95' }}>
                          {p as string}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(exp.requisicion?.detalles ?? []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Artículos</div>
                    <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#F3F4F6' }}>
                            {['Artículo', 'Unidad', 'Cantidad'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(exp.requisicion?.detalles ?? []).map((d, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #E8ECF0' }}>
                              <td style={{ padding: '8px 12px' }}>{d.productoNombre ?? '—'}</td>
                              <td style={{ padding: '8px 12px', color: '#6B7280' }}>{d.unidadLibre ?? '—'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{d.cantidadSolicitada}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {tabExpediente === 'documentos' && (
              <>
                {facturas.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Facturas</div>
                    <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#F3F4F6' }}>
                            {['N° Factura', 'Proveedor', 'Monto', 'Documento'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {facturas.map((f: any, i: number) => {
                            const expOrdenes = exp.ordenes ?? [];
                            const getOrdProv = (o: typeof expOrdenes[0]) =>
                              typeof o.proveedor === 'object' && o.proveedor !== null
                                ? (o.proveedor as { id: number; nombre: string }).nombre
                                : String(o.proveedor ?? '');
                            let provNombre: string = f.proveedor?.nombre ?? '';
                            if (!provNombre) {
                              if (f.proveedorId) {
                                const m = expOrdenes.find(o => {
                                  const oPrvId = typeof o.proveedor === 'object' && o.proveedor !== null
                                    ? (o.proveedor as { id: number; nombre: string }).id
                                    : o.proveedorId;
                                  return oPrvId === f.proveedorId;
                                });
                                if (m) provNombre = getOrdProv(m);
                              }
                              if (!provNombre) {
                                // match by folio (user may have used the orden folio as invoice number)
                                const byFolio = expOrdenes.find(o => o.folio === f.numero);
                                if (byFolio) {
                                  provNombre = getOrdProv(byFolio);
                                }
                              }
                              if (!provNombre) {
                                // match by unique amount
                                const byMonto = expOrdenes.filter(o => Number(o.total) === Number(f.monto));
                                if (byMonto.length === 1) provNombre = getOrdProv(byMonto[0]);
                              }
                              if (!provNombre && expOrdenes.length === 1) {
                                provNombre = getOrdProv(expOrdenes[0]);
                              }
                            }
                            return (
                            <tr key={i} style={{ borderTop: '1px solid #E8ECF0' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{f.numero}</td>
                              <td style={{ padding: '8px 12px', color: '#374151' }}>{provNombre || '—'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#16A34A' }}>${Number(f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {f.documentoUrl ? (
                                  <a href={`${staticBase}${f.documentoUrl}`} target="_blank" rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6D28D9', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                    <Eye size={13}/> Ver
                                  </a>
                                ) : '—'}
                              </td>
                            </tr>
                          ); })}
                          <tr style={{ borderTop: '2px solid #E8ECF0', background: '#F9FAFB' }}>
                            <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700 }}>Total</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#111827' }}>${totalFacturas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', padding: 24 }}>Sin facturas registradas</div>
                )}
                {(exp.ordenes ?? []).map(oc => (
                  <div key={oc.id} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Orden de Compra</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Folio OC:</strong> {oc.folio}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Proveedor:</strong> {typeof oc.proveedor === 'object' && oc.proveedor !== null ? (oc.proveedor as any).nombre : String(oc.proveedor ?? '—')}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}><strong>Total OC:</strong> ${Number(oc.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
                {cotizaciones.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cotizaciones ({cotizaciones.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {cotizaciones.map((c, i) => {
                        const prov = getCotizacionProveedorNombre(c);
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', border: '1px solid #E8ECF0', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{prov || '—'}</span>
                            <span style={{ fontWeight: 700, color: '#374151' }}>${Number(c.precioUnitario ?? c.precio ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {tabExpediente === 'historial' && (
              <>
                {historial.length === 0 ? (
                  <div style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', padding: 24 }}>Sin historial registrado</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[...historial].reverse().map((h: any, i: number) => {
                      const esUltimo = i === historial.length - 1;
                      const hStyle = ESTADO_STYLES[h.estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8', border: '#E2E8F0' };
                      return (
                        <div key={h.id ?? i} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: hStyle.dot, border: `2px solid ${hStyle.border}`, flexShrink: 0, marginTop: 4 }} />
                            {!esUltimo && <div style={{ width: 2, flex: 1, background: '#E8ECF0', margin: '3px 0' }} />}
                          </div>
                          <div style={{ paddingBottom: esUltimo ? 0 : 18, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ background: hStyle.bg, color: hStyle.text, border: `1px solid ${hStyle.border}`, padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {getEstadoCompraUI(h.estado as EstadoCompra).label || h.estado}
                              </span>
                              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                                {new Date(h.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {h.usuario && (
                              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                                {h.usuario.nombre} {h.usuario.apellidos}
                              </div>
                            )}
                            {h.observaciones && (
                              <div style={{ fontSize: 12, color: '#374151', marginTop: 4, background: '#F9FAFB', borderRadius: 6, padding: '5px 10px' }}>
                                {h.observaciones}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ─── TABLA EXPEDIENTES FINALIZADOS ────────────────────────────────────────────
  const renderExpedientesFinalizados = () => {
    if (reqFinalizadas.length === 0) {
      return (
        <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
          <FileText size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>Sin expedientes finalizados</p>
          <p style={{ margin: '6px 0 0', fontSize: 14 }}>Los expedientes enviados a Recursos Financieros aparecerán aquí.</p>
        </div>
      );
    }
    return (
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 860 }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {['Folio', 'Área / Descripción', 'Proveedor(es)', 'Total facturas', 'Fecha envío', 'Estado', ''].map((h, i) => (
              <th key={i} style={{
                padding: '1.1rem 1.25rem', textAlign: i >= 5 ? 'right' : 'left',
                fontSize: 12, fontWeight: 800, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reqFinalizadas.map((req, idx) => {
            const facturas = (req as any).facturas ?? [];
            const totalFact = facturas.reduce((s: number, f: any) => s + Number(f.monto ?? 0), 0);
            const provsFactura = facturas.map((f: any) => f.proveedor?.nombre).filter(Boolean) as string[];
            const provsOrdenes = (req.ordenes ?? []).map(o =>
              typeof o.proveedor === 'object' && o.proveedor !== null
                ? (o.proveedor as { id: number; nombre: string }).nombre
                : String(o.proveedor ?? '')
            ).filter(Boolean) as string[];
            const provs = [...new Set(provsFactura.length > 0 ? provsFactura : provsOrdenes)];
            const fechaEnvio = req.fechaEnvioFinanzas
              ?? (req.historial ?? []).find((h: any) =>
                  h.estado === 'ENVIADA_A_FINANZAS' || h.estado === 'FINALIZADO'
                )?.fecha ?? null;
            return (
              <tr
                key={req.id}
                style={{ borderBottom: idx < reqFinalizadas.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{req.folio}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'middle', maxWidth: 220 }}>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(req.requisicion?.areaSolicitante || req.areaSolicitante)}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{req.descripcion}</div>
                </td>
                <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'middle' }}>
                  {provs.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {provs.map((p, i) => (
                        <span key={i} style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                          {p as string}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: 13 }}>—</span>
                  )}
                </td>
                <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>
                    ${totalFact.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  {fechaEnvio ? (
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      {new Date(fechaEnvio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  ) : <span style={{ color: '#9CA3AF' }}>—</span>}
                </td>
                <td style={{ padding: '1.1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                  <EstadoBadge estado={req.estado as EstadoCompra} />
                </td>
                <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                  <button
                    onClick={() => { setExpedienteDetalle(req); setTabExpediente('datos'); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                  >
                    <Eye size={13}/> Ver expediente
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
        </div>

        {/* CARDS */}
        <DashboardCards requisiciones={requisiciones} />

        {/* TAB SWITCHER */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center'
        }}>
          <button
            onClick={() => { setTabVista('activas'); setFiltroEstado(''); setBusqueda(''); }}
            style={{
              padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: tabVista === 'activas' ? '#2563EB' : '#F3F4F6',
              color: tabVista === 'activas' ? 'white' : '#6B7280',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7,
            }}
          >
            <ShoppingCart size={15} /> Requisiciones Activas
          </button>
          <button
            onClick={() => { setTabVista('finalizados'); setFiltroEstado(''); setBusqueda(''); }}
            style={{
              padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: tabVista === 'finalizados' ? '#6D28D9' : '#F3F4F6',
              color: tabVista === 'finalizados' ? 'white' : '#6B7280',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7,
            }}
          >
            <FileText size={15} /> Expedientes Finalizados
          </button>
          {tabVista === 'finalizados' && (
            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, background: '#F9FAFB', padding: '4px 10px', borderRadius: 8 }}>
              {reqFinalizadas.length} expediente{reqFinalizadas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* TABLA */}
        <div style={{
          backgroundColor: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', minHeight: 500,
        }}>
          {tabVista === 'activas' && (
            <>
              {/* Filtros - solo en tab activas */}
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
            </>
          )}

          {/* Tabla de datos */}
          {tabVista === 'activas' ? (
            <>
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
                          <span style={{ fontSize: 14, color: '#374151', whiteSpace: 'nowrap' }}>{(req.requisicion?.areaSolicitante || req.areaSolicitante)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                          {req.presupuestoEstimado ? `$${req.presupuestoEstimado.toLocaleString('es-MX')}` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {(req.ordenes?.length || (req as any).ordenPago) && (
                            <button
                              onClick={() => { setTabOrdenes(req.ordenes?.length ? 'compra' : 'pago'); setSelectedOrdenIdx(0); setOrdenesDetalle(req); }}
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
            </>
          ) : (
            renderExpedientesFinalizados()
          )}
        </div>
      </div>

      {renderCreate()}
      {renderProceso()}
      {renderDetalle()}
      {renderOrdenes()}
      {renderExpedienteDetalle()}
      {notif && <Notif msg={notif} onClose={() => setNotif(null)} />}
    </>
  );
}