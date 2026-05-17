import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PackageSearch, ArrowDownRight, ArrowUpRight, Plus, Box, Search, Filter,
  MoreVertical, X, Bell, Eye, Clock, CheckCircle, CheckCircle2, XCircle,
  ShoppingCart, FileText, AlertTriangle, AlertOctagon, ClipboardList, Pencil, Download, MapPin
} from 'lucide-react';
import { NuevaRequisicionModal } from '../../components/common/NuevaRequisicionModal';
import { RequisicionAlmacenModal } from '../../components/almacen/RequisicionAlmacenModal';
import { RequisicionExtraordinariaModal } from '../../components/almacen/RequisicionExtraordinariaModal';
import apiClient from '../../services/api';
import type { Producto, Movimiento, Requisicion, RequisicionDept, EstadoCompra, Cotizacion } from '../../types';
import { getRequisiciones as fetchRequisicionesDept } from '../../services/requisiciones.service';
import { getEstadoCompraUI } from '../../types';
import { useCompras } from '../../hooks/useCompras';
import { useAuthStore } from '../../stores/authStore';

// ─── TIPOS EXTENDIDOS ─────────────────────────────────────────────────────────

interface MovimientoExtendido extends Movimiento {
  requisicionId?: number;
  proveedor?: string;
  numeroFactura?: string;
  importeFactura?: number;
  fechaCaducidad?: string;
  empaqueCorrecto?: boolean;
  cantidadCorrecta?: boolean;
  presentacionCorrecta?: boolean;
  estadoRecepcion?: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
  motivoRechazo?: string;
  areaSolicitante?: string;
  motivo?: string;
  nombreRecibe?: string;
  estadoSalida?: 'PENDIENTE' | 'AUTORIZADA' | 'ENTREGADA';
  confirmadoRecibido?: boolean;
  observaciones?: string;
  contraRecibo?: ContraReciboData | null;
}

interface ContraReciboData {
  id: number;
  folio: string;
  movimientoId: number;
  proveedor: string;
  numeroFactura: string;
  importe: number;
  fechaPagoProgramado?: string;
  fechaRecepcion: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
  recibidoPor?: { nombre: string; apellidos: string; };
  movimiento?: MovimientoExtendido;
  createdAt: string;
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

const Modal = ({
  children, onClose, title, width = 480
}: {
  children: React.ReactNode; onClose: () => void; title: string; width?: number;
}) => createPortal(
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(17,24,39,0.45)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 999999, backdropFilter: 'blur(3px)', padding: 24,
    overflowY: 'auto',
  }}>
    <div style={{
      background: 'white', borderRadius: 16,
      width: '100%', maxWidth: width,
      maxHeight: 'calc(100vh - 48px)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
      margin: 'auto',
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
      <div style={{
        padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: 'auto', flex: 1,
      }}>
        {children}
      </div>
    </div>
  </div>,
  document.body
);

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

const Btn = ({ children, variant = 'primary', onClick, disabled, icon }: {
  children: React.ReactNode; variant?: 'primary' | 'success' | 'danger' | 'ghost';
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
      borderRadius: 8, padding: '9px 16px',
      fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit'
    }}>
      {icon}{children}
    </button>
  );
};

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

// ─── PERMISOS ─────────────────────────────────────────────────────────────────

const PERMISOS_ALMACEN: Record<string, string[]> = {
  ADMIN_GENERAL: ['crear', 'revisar', 'cotizar', 'autorizar', 'operar'],
  ALMACEN:       ['crear', 'cotizar', 'operar'],
  RRHH_FINANZAS: ['autorizar'],
  AREA_MEDICA:   ['crear'],
  ENFERMERIA:    ['crear'],
  NUTRICION:     ['crear'],
  PSICOLOGIA:    ['crear'],
  ADMISIONES:    ['crear'],
};

const puedeHacer = (rol: string, accion: string) =>
  (PERMISOS_ALMACEN[rol] ?? []).includes(accion);

const ESTADO_REQ_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  // EstadoRequisicion (nuevas requisiciones de departamento)
  CREADA:                      { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
  EN_REVISION_ALMACEN:         { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  SURTIDA:                     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  PARCIAL:                     { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  SIN_EXISTENCIA:              { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  ENVIADA_A_COMPRAS:           { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  FINALIZADA:                  { bg: '#F0FDF4', text: '#15803D', dot: '#16A34A' },
  EN_REVISION_ADMINISTRATIVA:  { bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308' },
  DEVUELTA_A_COMPRAS:          { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' },
  // EstadoCompra (CompraRequisicion — legacy en otros contextos)
  REQUISICION_CREADA:          { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
  EN_REVISION_RECURSOS:        { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  EN_REVISION_COMPRAS:         { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' },
  EN_REVISION_ADMINISTRACION:  { bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308' },
  EN_REVISION_DIRECCION:       { bg: '#FDF2F8', text: '#BE185D', dot: '#EC4899' },
  COTIZACIONES_CARGADAS:       { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' },
  PROVEEDOR_SELECCIONADO:      { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  NEGOCIACION_COMPLETADA:      { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4' },
  AUTORIZADA:                  { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  ORDEN_GENERADA:              { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  FACTURAS_RECIBIDAS:          { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  ORDEN_PAGO_GENERADA:         { bg: '#ECFEFF', text: '#0E7490', dot: '#06B6D4' },
  FINALIZADO:                  { bg: '#F0FDF4', text: '#15803D', dot: '#16A34A' },
  RECHAZADO:                   { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
};

// ─── BADGES OPERATIVOS ────────────────────────────────────────────────────────

const RECEPCION_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDIENTE: { bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308', label: 'Pend. Revisión' },
  ACEPTADO:  { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', label: 'Aceptado' },
  RECHAZADO: { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', label: 'Rechazado' },
};

const SALIDA_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDIENTE:  { bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308', label: 'Pend. Autorizar' },
  AUTORIZADA: { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6', label: 'Autorizada' },
  ENTREGADA:  { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', label: 'Entregada' },
};

const CR_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDIENTE:  { bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308', label: 'Pendiente' },
  PAGADO:     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', label: 'Pagado' },
  CANCELADO:  { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', label: 'Cancelado' },
};

const EstadoBadge = ({ badge }: { badge: { bg: string; text: string; dot: string; label: string } }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: badge.bg, color: badge.text,
    border: `1px solid ${badge.dot}33`,
    padding: '3px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap'
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
    {badge.label}
  </span>
);

const getNow = () => Date.now();

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function Almacen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'INVENTARIO' | 'REQUISICIONES' | 'REQUISICIONES_EXTRAORDINARIAS' | 'KARDEX'>('INVENTARIO');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNuevaRequisicion, setShowNuevaRequisicion] = useState(false);
  const [formCreate, setFormCreate] = useState({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '', tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA' });
  const [detalles, setDetalles] = useState<{ producto: string; unidad: string; cantidad: number }[]>([{ producto: '', unidad: '', cantidad: 1 }]);
  const [notif, setNotif] = useState<string | null>(null);
  const [reqSeleccionada, setReqSeleccionada] = useState<Requisicion | null>(null);
  const [reqAlmacenDetalle, setReqAlmacenDetalle] = useState<RequisicionDept | null>(null);
  const [reqAlmacenExtraordinariaDetalle, setReqAlmacenExtraordinariaDetalle] = useState<RequisicionDept | null>(null);
  const [busquedaReq, setBusquedaReq] = useState('');
  const [busquedaInventario, setBusquedaInventario] = useState('');
  const [filtroRequisiciones, setFiltroRequisiciones] = useState<'PENDIENTES' | 'FINALIZADAS'>('PENDIENTES');
  const [filtroStock, setFiltroStock] = useState<'' | 'NORMAL' | 'BAJO' | 'CRITICO'>('');
  const [filtroKardex, setFiltroKardex] = useState<'' | 'ENTRADA' | 'SALIDA'>('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showKardexFilterMenu, setShowKardexFilterMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const kardexFilterRef = useRef<HTMLDivElement>(null);
  const stockFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (kardexFilterRef.current && !kardexFilterRef.current.contains(e.target as Node)) {
        setShowKardexFilterMenu(false);
      }
      if (stockFilterRef.current && !stockFilterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // States para nuevos registros
  const [productoData, setProductoData] = useState({
    nombre: '', categoria: 'MEDICAMENTO', unidad: 'PIEZAS',
    stockMinimo: 5, descripcion: '', ubicacion: ''
  });

  // Estado para edición de producto
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '', categoria: '', unidad: '', descripcion: '', stockMinimo: 5, ubicacion: ''
  });
  const [movimientoData, setMovimientoData] = useState({
    productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '',
    requisicionId: '',
    // Entradas
    proveedor: '', numeroFactura: '', importeFactura: '',
    fechaCaducidad: '', empaqueCorrecto: false, cantidadCorrecta: false, presentacionCorrecta: false,
    estadoRecepcion: 'PENDIENTE',
    // Salidas
    areaSolicitante: '', motivo: '', nombreRecibe: '',
  });

  // States operativos
  const [rechazarMovId, setRechazarMovId] = useState<number | null>(null);
  const [motivoRechazoForm, setMotivoRechazoForm] = useState('');
  const [generarCRMovId, setGenerarCRMovId] = useState<number | null>(null);
  const [fechaPagoProgramado, setFechaPagoProgramado] = useState('');

  // Recepción multi-producto
  const [recepcionEditada, setRecepcionEditada] = useState<Record<number, {
    cantidadRecibida: number;
    estado: string;
    observaciones: string;
    lote: string;
    fechaCaducidad: string;
  }>>({});
  const [isSubmittingMultiple, setIsSubmittingMultiple] = useState(false);

  // Fetch
  const { data: productosData, isLoading: isLoadingProductos } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: () => apiClient.get('/almacen/productos').then(res => res.data.data)
  });

  const { data: movimientosData, isLoading: isLoadingMovimientos } = useQuery<MovimientoExtendido[]>({
    queryKey: ['movimientos'],
    queryFn: () => apiClient.get('/almacen/movimientos').then(res => res.data.data),
    staleTime: 30_000,
  });


  const { data: requisicionesDept = [], isLoading: isLoadingReqs } = useQuery<RequisicionDept[]>({
    queryKey: ['requisiciones'],
    queryFn: () => fetchRequisicionesDept(),
    staleTime: 30_000,
  });

  const { createReq, requisiciones } = useCompras();
  const { usuario } = useAuthStore();
  const rol = usuario?.rol ?? '';
  const puedeOperar   = puedeHacer(rol, 'operar');
  const puedeFinanzas = rol === 'RRHH_FINANZAS' || rol === 'ADMIN_GENERAL';

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3500); };
  const agregarDetalle = () => setDetalles([...detalles, { producto: '', unidad: '', cantidad: 1 }]);
  const actualizarDetalle = (index: number, field: string, value: string | number) =>
    setDetalles(detalles.map((d, i) => i === index ? { ...d, [field]: value } : d));
  const eliminarDetalle = (index: number) => setDetalles(detalles.filter((_, i) => i !== index));

  const abrirPDF = async (contraReciboId: number) => {
    try {
      const resp = await apiClient.get(`/contra-recibos/${contraReciboId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      window.open(url, '_blank');
    } catch {
      notify('Error al abrir el PDF');
    }
  };

  // ─── RENDER CREAR REQUISICIÓN ─────────────────────────────────────────────

  const renderCreate = () => {
    if (!showCreate) return null;
    return (
      <Modal title="Nueva requisición de compra" onClose={() => setShowCreate(false)} width={680}>
        <Select
          label="Área solicitante"
          value={formCreate.areaSolicitante}
          onChange={(e) => setFormCreate({ ...formCreate, areaSolicitante: e.target.value })}
        >
          <option value="">Selecciona un área</option>
          <option value="Dirección General">Dirección General</option>
          <option value="Unidad de Transparencia">Unidad de Transparencia</option>
          <option value="Departamento Clínico">Departamento Clínico</option>
          <option value="Departamento Médico">Departamento Médico</option>
          <option value="Departamento de Admisiones">Departamento de Admisiones</option>
          <option value="Departamento de Administración">Departamento de Administración</option>
          <option value="Oficina de Recursos Materiales">Oficina de Recursos Materiales</option>
        </Select>
        <Select label="Tipo de compra" value={formCreate.tipo} onChange={e => setFormCreate({ ...formCreate, tipo: e.target.value as 'ORDINARIA' | 'EXTRAORDINARIA' })}>
          <option value="ORDINARIA">Ordinaria</option>
          <option value="EXTRAORDINARIA">Extraordinaria</option>
        </Select>
        <Textarea label="Descripción" placeholder="¿Qué se necesita comprar?" value={formCreate.descripcion} onChange={e => setFormCreate({ ...formCreate, descripcion: e.target.value })} />
        <Textarea label="Justificación" placeholder="¿Por qué es necesario?" value={formCreate.justificacion} onChange={e => setFormCreate({ ...formCreate, justificacion: e.target.value })} />
        <Input label="Presupuesto estimado ($)" type="number" placeholder="0.00" value={formCreate.presupuestoEstimado} onChange={e => setFormCreate({ ...formCreate, presupuestoEstimado: e.target.value })} />
        <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Artículos solicitados</span>
            <Btn variant="ghost" icon={<Plus size={13} />} onClick={agregarDetalle}>Agregar</Btn>
          </div>
          {detalles.map((det, index) => (
            <div key={index} style={{ border: '1px solid #E8ECF0', borderRadius: 8, padding: 12, background: '#F9FAFB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 38px', gap: 8, alignItems: 'end' }}>
                <Input label="Artículo" placeholder="Ej: Cloro" value={det.producto} onChange={e => actualizarDetalle(index, 'producto', e.target.value)} />
                <Input label="Unidad" placeholder="Caja" value={det.unidad} onChange={e => actualizarDetalle(index, 'unidad', e.target.value)} />
                <Input label="Cantidad" type="number" min={1} value={det.cantidad} onChange={e => actualizarDetalle(index, 'cantidad', Number(e.target.value))} />
                <button type="button" onClick={() => eliminarDetalle(index)} style={{ height: 38, width: 38, border: '1px solid #FECACA', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon={<Plus size={15} />} onClick={() => {
            if (!formCreate.areaSolicitante || !formCreate.descripcion || !formCreate.justificacion) { alert('Completa todos los campos'); return; }
            createReq.mutate({ ...formCreate, presupuestoEstimado: Number(formCreate.presupuestoEstimado), detalles });
            setFormCreate({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '', tipo: 'ORDINARIA' });
            setDetalles([{ producto: '', unidad: '', cantidad: 1 }]);
            setShowCreate(false); notify('Requisición creada exitosamente');
          }}>Crear requisición</Btn>
          <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Btn>
        </div>
      </Modal>
    );
  };

  // ─── RENDER REVISIÓN REQUISICIÓN ─────────────────────────────────────────

  const renderRevision = () => {
    if (!reqSeleccionada) return null;
    const req = reqSeleccionada;
    const style = ESTADO_REQ_STYLES[req.estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' };
    const estadoUI = getEstadoCompraUI(req.estado as EstadoCompra);
    return (
      <Modal title={`Requisición ${req.folio}`} onClose={() => setReqSeleccionada(null)} width={760}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: style.bg, color: style.text, border: `1px solid ${style.dot}22`, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.dot }} />
          {estadoUI.label}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div><strong>Área:</strong> {req.requisicion?.areaSolicitante ?? req.areaSolicitante}</div>
            <div><strong>Tipo:</strong> {req.tipo}</div>
            <div><strong>Presupuesto:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div><strong>Solicitante:</strong> {req.usuario?.nombre} {req.usuario?.apellidos}</div>
            <div><strong>Fecha:</strong> {req.createdAt ? new Date(req.createdAt).toLocaleString('es-MX') : '—'}</div>
          </div>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Descripción</div>
          <div style={{ lineHeight: 1.6 }}>{req.requisicion?.descripcion ?? req.descripcion}</div>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Justificación</div>
          <div style={{ lineHeight: 1.6 }}>{req.requisicion?.justificacion ?? req.justificacion}</div>
        </div>
        {req.detalles && req.detalles.length > 0 && (
          <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: 600, fontSize: 13, color: '#111827', borderBottom: '1px solid #E8ECF0' }}>Artículos solicitados</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {['Artículo', 'Unidad', 'Cantidad'].map((h, i) => (
                    <th key={i} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.detalles.map((d, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #E8ECF0' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 500 }}>{typeof d.producto === 'object' && d.producto !== null ? (d.producto as { nombre: string }).nombre : d.producto}</td>
                    <td style={{ padding: '8px 14px', color: '#6B7280' }}>{d.unidad}</td>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{d.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {req.cotizaciones && req.cotizaciones.length > 0 && (
          <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#F9FAFB', fontWeight: 600, fontSize: 13, color: '#111827', borderBottom: '1px solid #E8ECF0' }}>Cotizaciones</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {['Proveedor', 'Precio', 'Entrega'].map((h, i) => (
                    <th key={i} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.cotizaciones.map((c: Cotizacion) => (
                  <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 500 }}>{c.proveedor}</td>
                    <td style={{ padding: '8px 14px', color: '#16A34A', fontWeight: 600 }}>${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px 14px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={13} style={{ flexShrink: 0 }} />
          <span>Para avanzar el flujo de esta requisición (cotizar, autorizar, generar orden, etc.) ve al módulo <strong>Compras</strong>.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #E8ECF0', marginTop: 4 }}>
          <Btn variant="ghost" onClick={() => setReqSeleccionada(null)}>Cerrar</Btn>
        </div>
      </Modal>
    );
  };

  // ─── MUTATIONS INVENTARIO ─────────────────────────────────────────────────

  const crearProducto = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/almacen/productos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowModal(null);
      setProductoData({ nombre: '', categoria: 'MEDICAMENTO', unidad: 'PIEZAS', stockMinimo: 5, descripcion: '', ubicacion: '' });
      notify('Producto registrado en el catálogo correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al registrar producto');
    }
  });

  const actualizarProducto = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiClient.put(`/almacen/productos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setEditandoProducto(null);
      notify('Producto actualizado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al actualizar producto');
    }
  });

  const registrarMovimiento = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const d = data as Record<string, unknown>;
      const reqIdRaw = String(d.requisicionId ?? '');
      let realReqId: number | undefined;
      if (String(d.tipo) === 'ENTRADA') {
        const compraSeleccionada = reqIdRaw ? requisiciones.find(r => String(r.id) === reqIdRaw) : null;
        realReqId = compraSeleccionada?.requisicion?.id ?? undefined;
      } else if (reqIdRaw.startsWith('c:')) {
        const compraSeleccionada = requisiciones.find(r => String(r.id) === reqIdRaw.slice(2));
        realReqId = compraSeleccionada?.requisicion?.id ?? undefined;
      } else if (reqIdRaw) {
        realReqId = parseInt(reqIdRaw, 10);
      }
      return apiClient.post('/almacen/movimientos', {
        ...d,
        productoId: parseInt(d.productoId as string, 10),
        cantidad: parseInt(d.cantidad as string, 10),
        importeFactura: d.importeFactura ? parseFloat(d.importeFactura as string) : undefined,
        requisicionId: realReqId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      setShowModal(null);
      setMovimientoData({
        productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '',
        requisicionId: '',
        proveedor: '', numeroFactura: '', importeFactura: '',
        fechaCaducidad: '', empaqueCorrecto: false, cantidadCorrecta: false, presentacionCorrecta: false,
        estadoRecepcion: 'PENDIENTE',
        areaSolicitante: '', motivo: '', nombreRecibe: '',
      });
      notify('Movimiento registrado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al registrar movimiento');
    }
  });

  // ─── MUTATIONS OPERATIVOS ─────────────────────────────────────────────────

  const aceptarRecepcion = useMutation({
    mutationFn: (id: number) => apiClient.put(`/almacen/movimientos/${id}/aceptar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify('Recepción aceptada correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al aceptar recepción');
    }
  });

  const rechazarRecepcion = useMutation({
    mutationFn: ({ id, motivoRechazo }: { id: number; motivoRechazo: string }) =>
      apiClient.put(`/almacen/movimientos/${id}/rechazar`, { motivoRechazo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setRechazarMovId(null);
      setMotivoRechazoForm('');
      notify('Recepción rechazada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al rechazar recepción');
    }
  });

  const autorizarSalida = useMutation({
    mutationFn: (id: number) => apiClient.put(`/almacen/movimientos/${id}/autorizar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      notify('Salida autorizada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al autorizar salida');
    }
  });

  const entregarSalida = useMutation({
    mutationFn: (id: number) => apiClient.put(`/almacen/movimientos/${id}/entregar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      notify('Salida entregada correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al entregar salida');
    }
  });

  const generarContraRecibo = useMutation({
    mutationFn: ({ movimientoId, fechaPago }: { movimientoId: number; fechaPago: string }) =>
      apiClient.post('/contra-recibos', {
        movimientoId,
        fechaPagoProgramado: fechaPago || undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['contra-recibos'] });
      setGenerarCRMovId(null);
      setFechaPagoProgramado('');
      notify('Contra-recibo generado correctamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al generar contra-recibo');
    }
  });

  const cambiarEstadoCR = useMutation({
    mutationFn: ({ crId, estado }: { crId: number; estado: string }) => {
      if (estado === 'PAGADO')    return apiClient.patch(`/contra-recibos/${crId}/marcar-pagado`);
      if (estado === 'CANCELADO') return apiClient.patch(`/contra-recibos/${crId}/cancelar`, { motivo: 'Cancelado manualmente' });
      return apiClient.put(`/contra-recibos/${crId}/estado`, { estado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      notify('Estado del contra-recibo actualizado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al cambiar estado');
    }
  });

  const autoCrearProducto = useMutation({
    mutationFn: (d: { nombre: string; categoria: string; unidad: string }) =>
      apiClient.post('/almacen/productos', { nombre: d.nombre, categoria: d.categoria, unidad: d.unidad, stockMinimo: 5 }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      const p = res.data.data;
      setMovimientoData(prev => ({ ...prev, productoId: String(p.id) }));
      notify(`Producto "${p.nombre}" creado automáticamente (${p.codigo})`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Error al crear producto automáticamente');
    }
  });

  const registrarRecepcionMultiple = async () => {
    if (isSubmittingMultiple) return;
    setIsSubmittingMultiple(true);
    let ok = 0;
    let fail = 0;

    // Resolve product IDs: use existing match or auto-create in catalog
    const detallesResueltos = await Promise.all(
      productosDeRequisicion.map(async (det) => {
        if (det.productoMatch) return { det, pid: String(det.productoMatch.id) };
        try {
          const res = await apiClient.post<{ data: { id: number } }>('/almacen/productos', {
            nombre: det.producto,
            unidad: det.unidad || 'PIEZAS',
            categoria: 'OTRO',
            stockMinimo: 5,
          });
          return { det, pid: String(res.data.data.id) };
        } catch {
          return { det, pid: null };
        }
      })
    );

    for (const { det, pid } of detallesResueltos) {
      if (!pid) { fail++; continue; }

      const edit = recepcionEditada[det.id] ?? { cantidadRecibida: det.cantidad, estado: 'CORRECTO', observaciones: '', lote: '', fechaCaducidad: '' };

      try {
        // Pass the parent Requisicion.id (FK target), not CompraRequisicion.id
        const realReqId = requisicionParaEntrada?.requisicion?.id;
        await apiClient.post('/almacen/movimientos', {
          productoId: pid,
          tipo: 'ENTRADA',
          cantidad: edit.cantidadRecibida,
          requisicionId: realReqId,
          proveedor: movimientoData.proveedor,
          numeroFactura: movimientoData.numeroFactura,
          importeFactura: movimientoData.importeFactura || undefined,
          fechaCaducidad: edit.fechaCaducidad || undefined,
          empaqueCorrecto: movimientoData.empaqueCorrecto,
          cantidadCorrecta: movimientoData.cantidadCorrecta,
          presentacionCorrecta: movimientoData.presentacionCorrecta,
          estadoRecepcion: edit.estado === 'CORRECTO' ? 'ACEPTADO' : 'PENDIENTE',
          observaciones: [edit.observaciones, edit.lote ? `Lote: ${edit.lote}` : ''].filter(Boolean).join(' | ') || undefined,
        });
        ok++;
      } catch {
        fail++;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['productos'] });
    await queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    setIsSubmittingMultiple(false);
    setShowModal(null);
    setMovimientoData({ productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '', requisicionId: '', proveedor: '', numeroFactura: '', importeFactura: '', fechaCaducidad: '', empaqueCorrecto: false, cantidadCorrecta: false, presentacionCorrecta: false, estadoRecepcion: 'PENDIENTE', areaSolicitante: '', motivo: '', nombreRecibe: '' });
    setRecepcionEditada({});
    notify(fail === 0 ? `✅ ${ok} producto${ok !== 1 ? 's' : ''} recibido${ok !== 1 ? 's' : ''} correctamente` : `⚠️ ${ok} recibidos, ${fail} fallaron`);
  };

  const usedEntradaReqIds = new Set(
    (movimientosData ?? []).filter(m => m.tipo === 'ENTRADA' && m.requisicionId != null).map(m => m.requisicionId!)
  );
  const usedSalidaReqIds = new Set(
    (movimientosData ?? []).filter(m => m.tipo === 'SALIDA' && m.requisicionId != null).map(m => m.requisicionId!)
  );

  const requisicionParaEntrada = movimientoData.tipo === 'ENTRADA' && movimientoData.requisicionId
    ? requisiciones.find(r => String(r.id) === movimientoData.requisicionId) ?? null
    : null;

  const comprasRecibidas = requisiciones.filter(r =>
    r.requisicion?.id != null &&
    usedEntradaReqIds.has(r.requisicion.id) &&
    !usedSalidaReqIds.has(r.requisicion.id)
  );

  const requisicionDeptParaSalida = movimientoData.tipo === 'SALIDA' && movimientoData.requisicionId && !movimientoData.requisicionId.startsWith('c:')
    ? requisicionesDept.find(r => String(r.id) === movimientoData.requisicionId) ?? null
    : null;

  const requisicionCompraParaSalida = movimientoData.tipo === 'SALIDA' && movimientoData.requisicionId?.startsWith('c:')
    ? requisiciones.find(r => String(r.id) === movimientoData.requisicionId.slice(2)) ?? null
    : null;

  const detallesActivos = movimientoData.tipo === 'ENTRADA'
    ? (requisicionParaEntrada?.requisicion?.detalles ?? [])
    : movimientoData.requisicionId?.startsWith('c:')
      ? (requisicionCompraParaSalida?.requisicion?.detalles ?? [])
      : (requisicionDeptParaSalida?.detalles ?? []);

  const productosDeRequisicion = detallesActivos.map(det => {
    const nombre = det.productoNombre ?? '';
    const unidad = det.unidadLibre ?? '';
    const cantidad = det.cantidadSolicitada;
    const productoMatch = nombre.length > 0
      ? (productosData?.find(p =>
          p.nombre.toLowerCase() === nombre.toLowerCase() ||
          p.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
          nombre.toLowerCase().includes(p.nombre.toLowerCase())
        ) ?? null)
      : null;
    return { ...det, producto: nombre, unidad, cantidad, productoMatch };
  });

  const getProveedorDeRequisicion = (req: Requisicion): string => {
    if (req.ordenes && req.ordenes.length > 0) {
      const nombres = req.ordenes.map(o => {
        const p = o.proveedor as unknown as string | { nombre: string };
        return typeof p === 'object' && p !== null ? p.nombre : String(p ?? '');
      }).filter(Boolean);
      const unique = [...new Set(nombres)];
      if (unique.length > 0) return unique.join(', ');
    }
    return '';
  };

  const getImporteDeRequisicion = (req: Requisicion): string => {
    if (req.facturas && req.facturas.length > 0) {
      const total = req.facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0);
      if (total > 0) return String(total);
    }
    if (req.ordenes && req.ordenes.length > 0) {
      const total = req.ordenes.reduce((s, o) => s + (Number(o.total) || 0), 0);
      if (total > 0) return String(total);
    }
    return '';
  };

  // ─── Estilos del modal de movimiento ────────────────────────────────────
  const inpE: React.CSSProperties = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #BFDBFE', outline: 'none', fontSize: 14, background: '#FAFCFF', fontFamily: 'inherit' };
  const inpS: React.CSSProperties = { padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #BBF7D0', outline: 'none', fontSize: 14, background: '#F8FFF8', fontFamily: 'inherit' };
  const lbE: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const lbS: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const lbN: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const secHdrE: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)', borderRadius: '12px 12px 0 0' };
  const secHdrS: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: 'linear-gradient(90deg, #15803D, #22C55E)', borderRadius: '12px 12px 0 0' };
  const secBodyE: React.CSSProperties = { border: '1.5px solid #BFDBFE', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, background: '#FAFCFF' };
  const secBodyS: React.CSSProperties = { border: '1.5px solid #BBF7D0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FFF8' };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '2.5rem', backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0', padding: '1.5rem 2.5rem',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '0.75rem', borderRadius: '14px', marginRight: '1.25rem', display: 'flex', boxShadow: '0 8px 16px rgba(217,119,6,0.2)' }}>
            <PackageSearch size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>Control de Suministros</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '500' }}>Gestión integral institucional</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowNuevaRequisicion(true)}
            style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1.5rem', backgroundColor: 'white', color: 'var(--text-h)', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <ClipboardList size={18} style={{ marginRight: '0.6rem' }} /> Nueva requisición
          </button>
          <button
            onClick={() => setShowModal('NUEVO_PRODUCTO')}
            style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1.5rem', backgroundColor: 'white', color: 'var(--text-h)', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Plus size={18} style={{ marginRight: '0.6rem' }} /> Nuevo Producto
          </button>
          <button
            onClick={() => setShowModal('NUEVO_MOVIMIENTO')}
            style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <Box size={18} style={{ marginRight: '0.6rem' }} /> Reg. Movimiento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        {/* Grupo principal */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(241, 245, 249, 0.5)', padding: '0.5rem', borderRadius: '20px' }}>
          {(['INVENTARIO', 'REQUISICIONES', 'KARDEX'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={() => setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                padding: '0.75rem 2rem', border: 'none', borderRadius: '15px',
                backgroundColor: activeTab === tab ? 'white' : hoveredTab === tab ? '#e5e7eb' : 'transparent',
                fontWeight: '700',
                color: activeTab === tab ? 'var(--primary)' : '#64748b',
                cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease',
                boxShadow: activeTab === tab ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
              }}>
              {tab === 'INVENTARIO' ? 'Inventario Actual'
                : tab === 'REQUISICIONES' ? 'Requisiciones de Inventario'
                : 'Kardex (Histórico)'}
            </button>
          ))}
        </div>

        {/* Pestaña extraordinaria — extremo derecho */}
        {(() => {
          const pendientesExtr = requisicionesDept.filter(r => r.tipo === 'EXTRAORDINARIA' && r.estado !== 'FINALIZADA').length;
          return (
            <button
              onClick={() => setActiveTab('REQUISICIONES_EXTRAORDINARIAS')}
              onMouseEnter={() => setHoveredTab('REQUISICIONES_EXTRAORDINARIAS')}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                position: 'relative',
                padding: '0.75rem 1.25rem', border: 'none', borderRadius: '15px',
                backgroundColor: activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? 'white' : hoveredTab === 'REQUISICIONES_EXTRAORDINARIAS' ? '#e5e7eb' : '#f1f3f5',
                fontWeight: '700',
                color: activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? '#D97706' : '#64748b',
                cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease',
                boxShadow: activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap',
              }}>
              Req. Extraordinarias
              {pendientesExtr > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#D97706', color: 'white',
                  fontSize: 10, fontWeight: 800, lineHeight: 1,
                  minWidth: 18, height: 18,
                  borderRadius: 9, padding: '0 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                }}>
                  {pendientesExtr}
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* Content Area */}
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border)', minHeight: '600px' }}>

        {/* Filtros */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '400px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={activeTab === 'REQUISICIONES' || activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? 'Buscar por folio o descripción...' : 'Buscar por código o nombre...'}
                value={activeTab === 'REQUISICIONES' || activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? busquedaReq : activeTab === 'INVENTARIO' ? busquedaInventario : ''}
                onChange={activeTab === 'REQUISICIONES' || activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? e => setBusquedaReq(e.target.value) : activeTab === 'INVENTARIO' ? e => setBusquedaInventario(e.target.value) : undefined}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Filtro por estado para REQUISICIONES y REQUISICIONES_EXTRAORDINARIAS */}
            {(activeTab === 'REQUISICIONES' || activeTab === 'REQUISICIONES_EXTRAORDINARIAS') && (
              <>
                <button
                  onClick={() => setFiltroRequisiciones('PENDIENTES')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.65rem 1.1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: filtroRequisiciones === 'PENDIENTES' ? 'linear-gradient(135deg, #3B82F6, #60A5FA)' : '#F0F9FF',
                    color: filtroRequisiciones === 'PENDIENTES' ? 'white' : '#3B82F6',
                    fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    boxShadow: filtroRequisiciones === 'PENDIENTES' ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                    transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  }}
                >
                  <Clock size={15} />
                  Pendientes
                </button>
                <button
                  onClick={() => setFiltroRequisiciones('FINALIZADAS')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.65rem 1.1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: filtroRequisiciones === 'FINALIZADAS' ? '#16A34A' : '#F0FDF4',
                    color: filtroRequisiciones === 'FINALIZADAS' ? 'white' : '#15803D',
                    fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    boxShadow: filtroRequisiciones === 'FINALIZADAS' ? '0 2px 8px rgba(74,222,128,0.3)' : 'none',
                    transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  }}
                >
                  <CheckCircle2 size={15} />
                  Finalizadas
                </button>
              </>
            )}
            {/* Filtro tipo movimiento para KARDEX */}
            {activeTab === 'KARDEX' && (
              <div ref={kardexFilterRef} style={{ position: 'relative' }}>
                {(() => {
                  const kColor = filtroKardex === 'ENTRADA' ? '#16A34A' : filtroKardex === 'SALIDA' ? '#DC2626' : null;
                  const kBg    = filtroKardex === 'ENTRADA' ? '#F0FDF4' : filtroKardex === 'SALIDA' ? '#FEF2F2' : 'white';
                  return (
                    <button
                      onClick={() => { setShowKardexFilterMenu(p => !p); setShowMoreMenu(false); }}
                      style={{ padding: '0.75rem', borderRadius: '12px', border: `1px solid ${kColor ?? '#e2e8f0'}`, background: kBg, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}
                      title="Filtrar por tipo de movimiento"
                    >
                      <Filter size={18} color={kColor ?? '#64748b'} />
                      {filtroKardex && <span style={{ fontSize: 11, fontWeight: 700, color: kColor! }}>{filtroKardex === 'ENTRADA' ? 'Entradas' : 'Salidas'}</span>}
                    </button>
                  );
                })()}
                {showKardexFilterMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                    {(['', 'ENTRADA', 'SALIDA'] as const).map(op => {
                      const Icon = op === '' ? Filter : op === 'ENTRADA' ? ArrowDownRight : ArrowUpRight;
                      const color = op === '' ? '#6366F1' : op === 'ENTRADA' ? '#16A34A' : '#DC2626';
                      const label = op === '' ? 'Todos' : op === 'ENTRADA' ? 'Entradas' : 'Salidas';
                      return (
                        <button key={op} onClick={() => { setFiltroKardex(op); setShowKardexFilterMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '0.65rem 1rem', textAlign: 'left', border: 'none', background: filtroKardex === op ? '#EEF2FF' : 'white', color: filtroKardex === op ? '#6366F1' : '#374151', fontSize: 13, fontWeight: filtroKardex === op ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <Icon size={14} color={filtroKardex === op ? '#6366F1' : color} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Filter button — stock status filter for INVENTARIO */}
            {activeTab === 'INVENTARIO' && (
              <div ref={stockFilterRef} style={{ position: 'relative' }}>
                {(() => {
                  const sColor = filtroStock === 'NORMAL' ? '#16A34A' : filtroStock === 'BAJO' ? '#CA8A04' : filtroStock === 'CRITICO' ? '#DC2626' : null;
                  const sBg    = filtroStock === 'NORMAL' ? '#F0FDF4' : filtroStock === 'BAJO' ? '#FFFBEB' : filtroStock === 'CRITICO' ? '#FEF2F2' : 'white';
                  const sLabel = filtroStock === 'NORMAL' ? 'Normal' : filtroStock === 'BAJO' ? 'Bajo stock' : filtroStock === 'CRITICO' ? 'Crítico' : '';
                  return (
                    <button
                      onClick={() => { setShowFilterMenu(p => !p); setShowMoreMenu(false); }}
                      style={{ padding: '0.75rem', borderRadius: '12px', border: `1px solid ${sColor ?? '#e2e8f0'}`, background: sBg, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}
                      title="Filtrar por estado de stock"
                    >
                      <Filter size={18} color={sColor ?? '#64748b'} />
                      {filtroStock && <span style={{ fontSize: 11, fontWeight: 700, color: sColor! }}>{sLabel}</span>}
                    </button>
                  );
                })()}
                {showFilterMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                    {(['', 'NORMAL', 'BAJO', 'CRITICO'] as const).map(op => {
                      const Icon = op === '' ? Filter : op === 'NORMAL' ? CheckCircle2 : op === 'BAJO' ? AlertTriangle : AlertOctagon;
                      const color = op === '' ? '#6366F1' : op === 'NORMAL' ? '#16A34A' : op === 'BAJO' ? '#CA8A04' : '#DC2626';
                      const label = op === '' ? 'Todos' : op === 'NORMAL' ? 'Normal' : op === 'BAJO' ? 'Bajo stock' : 'Crítico';
                      return (
                        <button key={op} onClick={() => { setFiltroStock(op); setShowFilterMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '0.65rem 1rem', textAlign: 'left', border: 'none', background: filtroStock === op ? '#EEF2FF' : 'white', color: filtroStock === op ? '#6366F1' : '#374151', fontSize: 13, fontWeight: filtroStock === op ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <Icon size={14} color={filtroStock === op ? '#6366F1' : color} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* More button — export CSV for INVENTARIO */}
            {activeTab === 'INVENTARIO' && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowMoreMenu(p => !p); setShowFilterMenu(false); }}
                  style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  title="Más opciones"
                >
                  <MoreVertical size={18} color="#64748b" />
                </button>
                {showMoreMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                    <button
                      onClick={async () => {
                        setShowMoreMenu(false);
                        if (!productosData) return;
                        const ExcelJS = (await import('exceljs')).default;
                        const wb = new ExcelJS.Workbook();
                        wb.creator = 'Marakame';
                        const ws = wb.addWorksheet('Inventario');

                        // Column widths
                        ws.columns = [
                          { key: 'codigo',     width: 14 },
                          { key: 'nombre',     width: 36 },
                          { key: 'categoria',  width: 22 },
                          { key: 'unidad',     width: 12 },
                          { key: 'stockActual', width: 14 },
                          { key: 'stockMinimo', width: 14 },
                          { key: 'ubicacion',  width: 22 },
                          { key: 'estado',     width: 13 },
                        ];

                        // Title row
                        ws.mergeCells('A1:H1');
                        const titleCell = ws.getCell('A1');
                        titleCell.value = 'INVENTARIO DE SUMINISTROS — MARAKAME';
                        titleCell.font   = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
                        titleCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
                        ws.getRow(1).height = 32;

                        // Subtitle row
                        ws.mergeCells('A2:H2');
                        const subCell = ws.getCell('A2');
                        subCell.value = `Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                        subCell.font  = { size: 10, color: { argb: 'FF6B7280' }, italic: true };
                        subCell.alignment = { horizontal: 'center' };
                        ws.getRow(2).height = 18;

                        // Empty separator
                        ws.getRow(3).height = 6;

                        // Header row
                        const headers = ['Código', 'Nombre', 'Categoría', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Ubicación', 'Estado'];
                        const hdrRow = ws.getRow(4);
                        hdrRow.height = 26;
                        headers.forEach((h, i) => {
                          const cell = hdrRow.getCell(i + 1);
                          cell.value = h;
                          cell.font  = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
                          cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
                          cell.alignment = { vertical: 'middle', horizontal: i >= 4 && i <= 5 ? 'center' : 'left' };
                          cell.border = { bottom: { style: 'medium', color: { argb: 'FF4F46E5' } } };
                        });

                        // Data rows
                        productosData.forEach((p, idx) => {
                          const estado = p.stockActual <= 0 ? 'CRÍTICO' : p.stockActual <= p.stockMinimo ? 'BAJO' : 'NORMAL';
                          const rowBgArgb = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
                          const estadoBg  = estado === 'CRÍTICO' ? 'FFFEE2E2' : estado === 'BAJO' ? 'FFFEF3C7' : 'FFF0FDF4';
                          const estadoFg  = estado === 'CRÍTICO' ? 'FF991B1B' : estado === 'BAJO' ? 'FF92400E' : 'FF166534';
                          const dataRow = ws.addRow([p.codigo, p.nombre, p.categoria, p.unidad, p.stockActual, p.stockMinimo, p.ubicacion ?? '', estado]);
                          dataRow.height = 20;
                          dataRow.eachCell((cell, colNum) => {
                            cell.font = { size: 11, name: 'Calibri', color: { argb: colNum === 8 ? estadoFg : 'FF1E293B' } };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNum === 8 ? estadoBg : rowBgArgb } };
                            cell.alignment = { vertical: 'middle', horizontal: colNum >= 5 && colNum <= 6 ? 'center' : 'left' };
                            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
                            if (colNum === 8) {
                              cell.font = { ...cell.font, bold: true };
                              cell.alignment = { ...cell.alignment, horizontal: 'center' };
                            }
                          });
                        });

                        // Freeze header rows
                        ws.views = [{ state: 'frozen', ySplit: 4 }];

                        const buffer = await wb.xlsx.writeBuffer();
                        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = 'inventario.xlsx'; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '0.65rem 1rem', border: 'none', background: 'white', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <Download size={14} color="#6366F1" /> Exportar Excel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── REQUISICIONES ── */}
        {activeTab === 'REQUISICIONES' ? (() => {
          const q = busquedaReq.toLowerCase();
          const ordinary = requisicionesDept.filter(r => r.tipo !== 'EXTRAORDINARIA');
          const reqPendientes = ordinary.filter(r =>
            r.estado !== 'FINALIZADA' &&
            (r.folio.toLowerCase().includes(q) ||
            (r.descripcion ?? '').toLowerCase().includes(q) ||
            r.areaSolicitante.toLowerCase().includes(q))
          );
          const reqFinalizadas = ordinary.filter(r =>
            r.estado === 'FINALIZADA' &&
            (r.folio.toLowerCase().includes(q) ||
            (r.descripcion ?? '').toLowerCase().includes(q) ||
            r.areaSolicitante.toLowerCase().includes(q))
          );
          if (isLoadingReqs) return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <span style={{ fontSize: 15 }}>Cargando requisiciones...</span>
            </div>
          );
          if (reqPendientes.length === 0 && reqFinalizadas.length === 0) return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>No hay requisiciones registradas</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>Crea una nueva requisición para comenzar.</p>
            </div>
          );

          const renderSection = (reqs: typeof requisicionesDept, isFinalized: boolean) => (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: isFinalized ? '#F0FDF4' : '#F0F9FF', borderBottom: `1px solid ${isFinalized ? '#BBF7D0' : '#BFDBFE'}`, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                {isFinalized ? (
                  <>
                    <CheckCircle2 size={14} color="#15803D" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requisiciones Finalizadas</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginLeft: 'auto' }}>({reqs.length})</span>
                  </>
                ) : (
                  <>
                    <Clock size={14} color="#3B82F6" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requisiciones Pendientes o en Progreso</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', marginLeft: 'auto' }}>({reqs.length})</span>
                  </>
                )}
              </div>
              {reqs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    {isFinalized ? 'No hay requisiciones finalizadas' : 'No hay requisiciones pendientes o en progreso'}
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['Fecha', 'Folio', 'Área', 'Quién solicita', 'Arts.', 'Estado', ''].map((h, i) => (
                        <th key={i} style={{ padding: '1.1rem 1.5rem', textAlign: i === 6 ? 'right' : 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reqs.map((req, idx) => {
                      const style = ESTADO_REQ_STYLES[req.estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' };
                      return (
                        <tr key={req.id} style={{ borderBottom: idx < reqs.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(req.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 300 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{req.folio}</div>
                            {req.descripcion && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{req.descripcion}</div>}
                            {req.justificacion && <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, marginTop: 2 }}>{req.justificacion.slice(0, 80)}{req.justificacion.length > 80 ? '…' : ''}</div>}
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 200 }}>
                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4, display: 'block', wordBreak: 'break-word' }}>{req.areaSolicitante}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 13, color: '#374151' }}>
                              {req.usuarioSolicita ? `${req.usuarioSolicita.nombre} ${req.usuarioSolicita.apellidos}` : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 13, borderRadius: 8, padding: '3px 10px', minWidth: 28 }}>
                              {req.detalles.length}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: style.bg, color: style.text, border: `1px solid ${style.dot}33`, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
                              {req.estado.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => setReqAlmacenDetalle(req)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                <Eye size={14} /> Detalles
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );

          return (
            renderSection(filtroRequisiciones === 'PENDIENTES' ? reqPendientes : reqFinalizadas, filtroRequisiciones === 'FINALIZADAS')
          );
        })()

        /* ── REQUISICIONES EXTRAORDINARIAS ── */
        : activeTab === 'REQUISICIONES_EXTRAORDINARIAS' ? (() => {
          const q = busquedaReq.toLowerCase();
          const extraordinary = requisicionesDept.filter(r => r.tipo === 'EXTRAORDINARIA');
          const reqPendientes = extraordinary.filter(r =>
            r.estado !== 'FINALIZADA' &&
            (r.folio.toLowerCase().includes(q) ||
            (r.descripcion ?? '').toLowerCase().includes(q) ||
            r.areaSolicitante.toLowerCase().includes(q))
          );
          const reqFinalizadas = extraordinary.filter(r =>
            r.estado === 'FINALIZADA' &&
            (r.folio.toLowerCase().includes(q) ||
            (r.descripcion ?? '').toLowerCase().includes(q) ||
            r.areaSolicitante.toLowerCase().includes(q))
          );
          if (isLoadingReqs) return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <span style={{ fontSize: 15 }}>Cargando requisiciones...</span>
            </div>
          );
          if (reqPendientes.length === 0 && reqFinalizadas.length === 0) return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>No hay requisiciones extraordinarias registradas</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>Crea una nueva requisición con tipo Extraordinaria para comenzar.</p>
            </div>
          );

          const renderExtSection = (reqs: typeof requisicionesDept, isFinalized: boolean) => (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: isFinalized ? '#F0FDF4' : '#FFFBEB', borderBottom: `1px solid ${isFinalized ? '#BBF7D0' : '#FDE68A'}`, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                {isFinalized ? (
                  <>
                    <CheckCircle2 size={14} color="#15803D" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requisiciones Finalizadas</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginLeft: 'auto' }}>({reqs.length})</span>
                  </>
                ) : (
                  <>
                    <Clock size={14} color="#D97706" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requisiciones Pendientes o en Progreso</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706', marginLeft: 'auto' }}>({reqs.length})</span>
                  </>
                )}
              </div>
              {reqs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    {isFinalized ? 'No hay requisiciones extraordinarias finalizadas' : 'No hay requisiciones extraordinarias pendientes o en progreso'}
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['Fecha', 'Folio', 'Área', 'Quién solicita', 'Arts.', 'Estado', ''].map((h, i) => (
                        <th key={i} style={{ padding: '1.1rem 1.5rem', textAlign: i === 6 ? 'right' : 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reqs.map((req, idx) => {
                      const style = ESTADO_REQ_STYLES[req.estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' };
                      return (
                        <tr key={req.id} style={{ borderBottom: idx < reqs.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(req.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 300 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{req.folio}</div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>
                              EXTRAORDINARIA
                            </span>
                            {req.descripcion && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{req.descripcion}</div>}
                            {req.justificacion && <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, marginTop: 2 }}>{req.justificacion.slice(0, 80)}{req.justificacion.length > 80 ? '…' : ''}</div>}
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 200 }}>
                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4, display: 'block', wordBreak: 'break-word' }}>{req.areaSolicitante}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 13, color: '#374151' }}>
                              {req.usuarioSolicita ? `${req.usuarioSolicita.nombre} ${req.usuarioSolicita.apellidos}` : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed', color: '#d97706', fontWeight: 700, fontSize: 13, borderRadius: 8, padding: '3px 10px', minWidth: 28 }}>
                              {req.detalles.length}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                            {(() => {
                              const EXTR_LABELS: Record<string, string> = {
                                CREADA: 'Pendiente',
                                ENVIADA_A_COMPRAS: 'En cotización',
                                FINALIZADA: 'Finalizada',
                              };
                              const label = EXTR_LABELS[req.estado] ?? req.estado.replace(/_/g, ' ');
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: style.bg, color: style.text, border: `1px solid ${style.dot}33`, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setReqAlmacenExtraordinariaDetalle(req)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: req.estado === 'FINALIZADA' ? '#F1F5F9' : '#FFF7ED', color: req.estado === 'FINALIZADA' ? '#64748B' : '#D97706', border: `1px solid ${req.estado === 'FINALIZADA' ? '#E2E8F0' : '#FDE68A'}`, borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                <Eye size={14} /> {req.estado === 'FINALIZADA' ? 'Ver detalle' : 'Gestionar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );

          return (
            renderExtSection(filtroRequisiciones === 'PENDIENTES' ? reqPendientes : reqFinalizadas, filtroRequisiciones === 'FINALIZADAS')
          );
        })()

        /* ── INVENTARIO ── */
        : activeTab === 'INVENTARIO' ? (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '110px' }} />
              <col />
              <col style={{ width: '140px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>Código</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>Producto</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>Categoría</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>Ubicación</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>Stock / Mín</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>Próx. Caducidad</th>
                <th style={{ padding: '0.875rem 1.25rem', textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                <th style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0' }} />
              </tr>
            </thead>
            <tbody>
              {isLoadingProductos ? (
                <tr><td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Procesando base de datos...</td></tr>
              ) : (() => {
                const q = busquedaInventario.toLowerCase().trim();
                const filtered = (productosData ?? []).filter(p => {
                  if (q && !p.codigo.toLowerCase().includes(q) && !p.nombre.toLowerCase().includes(q) && !(p.descripcion ?? '').toLowerCase().includes(q) && !p.categoria.toLowerCase().includes(q)) return false;
                  if (filtroStock) {
                    const est = p.stockActual <= 0 ? 'CRITICO' : p.stockActual <= p.stockMinimo ? 'BAJO' : 'NORMAL';
                    if (est !== filtroStock) return false;
                  }
                  return true;
                });
                if (filtered.length === 0) return (
                  <tr><td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Sin resultados para la búsqueda.</td></tr>
                );
                return filtered.map((prod) => {
                const prodExt = prod as Producto & { proximaCaducidad?: string | null; lotes?: { fechaCaducidad: string }[] };
                const proximaCaducidad = prodExt.proximaCaducidad;
                const lotes: { fechaCaducidad: string }[] = prodExt.lotes ?? [];
                const caducidadMostrar = proximaCaducidad
                  ? new Date(proximaCaducidad).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : lotes.length > 1 ? 'Múltiples'
                  : lotes.length === 1 ? new Date(lotes[0].fechaCaducidad).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : null;
                const caducidadProxima = caducidadMostrar && caducidadMostrar !== 'Múltiples'
                  ? (proximaCaducidad ? new Date(proximaCaducidad) : lotes.length === 1 ? new Date(lotes[0].fechaCaducidad) : null)
                  : null;
                const diasParaCaducidad = caducidadProxima ? Math.ceil((caducidadProxima.getTime() - getNow()) / 86400000) : null;
                const tdBase: React.CSSProperties = { padding: '1rem 1.25rem', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' };
                return (
                  <tr key={prod.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={tdBase}>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>{prod.codigo}</span>
                    </td>
                    <td style={{ ...tdBase, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.nombre}</div>
                      {prod.descripcion && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.descripcion}</div>}
                    </td>
                    <td style={tdBase}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', background: '#f1f5f9', padding: '0.3rem 0.7rem', borderRadius: '8px' }}>{prod.categoria}</span>
                    </td>
                    <td style={tdBase}>
                      {prod.ubicacion ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                          <MapPin size={12} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500', lineHeight: '1.4', wordBreak: 'break-word' }}>{prod.ubicacion}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '17px', lineHeight: 1 }}>{prod.stockActual}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.3px' }}>{prod.unidad || 'UDS'}</span>
                        <span style={{ fontSize: '10px', color: prod.stockActual <= prod.stockMinimo ? '#DC2626' : '#94a3b8', fontWeight: '600' }}>mín {prod.stockMinimo}</span>
                      </div>
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      {caducidadMostrar ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: diasParaCaducidad !== null && diasParaCaducidad <= 30 ? '#DC2626' : diasParaCaducidad !== null && diasParaCaducidad <= 90 ? '#CA8A04' : '#374151', whiteSpace: 'nowrap' }}>
                            {caducidadMostrar}
                          </span>
                          {diasParaCaducidad !== null && diasParaCaducidad <= 90 && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', background: diasParaCaducidad <= 30 ? '#DC2626' : '#CA8A04', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                              {diasParaCaducidad <= 0 ? 'VENCIDO' : `${diasParaCaducidad}d`}
                            </span>
                          )}
                          {caducidadMostrar === 'Múltiples' && (
                            <span style={{ fontSize: '10px', color: '#6366F1' }}>ver kardex</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      {(() => {
                        const estado = prod.stockActual <= 0 ? 'CRITICO' : prod.stockActual <= prod.stockMinimo ? 'BAJO' : 'NORMAL';
                        const bg    = estado === 'NORMAL' ? '#dcfce7' : estado === 'BAJO' ? '#fef3c7' : '#fee2e2';
                        const color = estado === 'NORMAL' ? '#166534' : estado === 'BAJO' ? '#92400e' : '#991b1b';
                        const label = estado === 'NORMAL' ? 'Normal' : estado === 'BAJO' ? 'Bajo' : 'Crítico';
                        return (
                          <span style={{ padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '11px', fontWeight: '800', backgroundColor: bg, color, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor', flexShrink: 0 }} />
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      {puedeOperar && (
                        <button
                          onClick={() => {
                            setEditandoProducto(prod);
                            setEditForm({
                              nombre:     prod.nombre,
                              categoria:  prod.categoria,
                              unidad:     prod.unidad || 'PIEZAS',
                              descripcion: prod.descripcion || '',
                              stockMinimo: prod.stockMinimo,
                              ubicacion:  prod.ubicacion || '',
                            });
                          }}
                          title="Editar producto"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }); })()}
            </tbody>
          </table>
        )

        /* ── KARDEX ── */
        : activeTab === 'KARDEX' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', minWidth: 900 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Fecha y Hora', 'Producto', 'Tipo', 'Cant.', 'Responsable', 'Estado Operativo', 'Contra-Recibo', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: `1.25rem ${i === 0 || i === 7 ? '1.5rem' : '1rem'}`, textAlign: i === 3 ? 'center' : 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingMovimientos ? (
                  <tr><td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Consultando kardex clínico...</td></tr>
                ) : (movimientosData ?? []).filter(m => !filtroKardex || m.tipo === filtroKardex).map((mov) => {
                  const recBadge = mov.estadoRecepcion ? RECEPCION_BADGE[mov.estadoRecepcion] : null;
                  const salBadge = mov.estadoSalida ? SALIDA_BADGE[mov.estadoSalida] : null;
                  const cr = mov.contraRecibo;
                  return (
                    <tr key={mov.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '1.25rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)' }}>{new Date(mov.createdAt).toLocaleDateString('es-MX')}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(mov.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: 14 }}>{mov.producto.nombre}</div>
                        {mov.proveedor && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{mov.proveedor}</div>}
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: mov.tipo === 'ENTRADA' ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: '13px' }}>
                          {mov.tipo === 'ENTRADA' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          {mov.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '16px' }}>{mov.cantidad}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>{mov.usuario.nombre} {mov.usuario.apellidos}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        {mov.tipo === 'ENTRADA' && recBadge && <EstadoBadge badge={recBadge} />}
                        {mov.tipo === 'SALIDA' && salBadge && <EstadoBadge badge={salBadge} />}
                        {!recBadge && !salBadge && <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                        {mov.motivoRechazo && (
                          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }} title={mov.motivoRechazo}>
                            <AlertTriangle size={10} style={{ marginRight: 3, display: 'inline' }} />
                            {mov.motivoRechazo.length > 30 ? mov.motivoRechazo.slice(0, 30) + '…' : mov.motivoRechazo}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        {cr ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#374151' }}>{cr.folio}</span>
                            {puedeFinanzas ? (
                              <select
                                value={cr.estado}
                                disabled={cambiarEstadoCR.isPending}
                                onChange={e => cambiarEstadoCR.mutate({ crId: cr.id, estado: e.target.value })}
                                style={{
                                  fontSize: 12, fontWeight: 600, borderRadius: 8, padding: '4px 8px', border: '1px solid',
                                  borderColor: cr.estado === 'PAGADO' ? '#BBF7D0' : cr.estado === 'CANCELADO' ? '#FECACA' : '#FDE68A',
                                  background: cr.estado === 'PAGADO' ? '#F0FDF4' : cr.estado === 'CANCELADO' ? '#FEF2F2' : '#FFFBEB',
                                  color: cr.estado === 'PAGADO' ? '#15803D' : cr.estado === 'CANCELADO' ? '#DC2626' : '#92400E',
                                  cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                                  opacity: cambiarEstadoCR.isPending ? 0.6 : 1,
                                }}
                              >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="PAGADO">Pagado</option>
                                <option value="CANCELADO">Cancelado</option>
                              </select>
                            ) : (
                              <EstadoBadge badge={CR_BADGE[cr.estado] ?? CR_BADGE.PENDIENTE} />
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {/* Acciones ENTRADA */}
                          {mov.tipo === 'ENTRADA' && mov.estadoRecepcion === 'PENDIENTE' && puedeOperar && (
                            <>
                              <button onClick={() => aceptarRecepcion.mutate(mov.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <CheckCircle size={12} /> Aceptar
                              </button>
                              <button onClick={() => { setRechazarMovId(mov.id); setMotivoRechazoForm(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <XCircle size={12} /> Rechazar
                              </button>
                            </>
                          )}
                          {mov.tipo === 'ENTRADA' && mov.estadoRecepcion === 'ACEPTADO' && !cr && puedeOperar && (
                            <button onClick={() => { setGenerarCRMovId(mov.id); setFechaPagoProgramado(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <FileText size={12} /> Contra-Recibo
                            </button>
                          )}
                          {cr && (
                            <button onClick={() => abrirPDF(cr.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <FileText size={12} /> PDF
                            </button>
                          )}
                          {/* Acciones SALIDA */}
                          {mov.tipo === 'SALIDA' && mov.estadoSalida === 'PENDIENTE' && puedeOperar && (
                            <button onClick={() => autorizarSalida.mutate(mov.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <CheckCircle size={12} /> Autorizar
                            </button>
                          )}
                          {mov.tipo === 'SALIDA' && mov.estadoSalida === 'AUTORIZADA' && puedeOperar && (
                            <button onClick={() => entregarSalida.mutate(mov.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <CheckCircle size={12} /> Entregar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        ) : null}
      </div>

      {/* ── MODAL NUEVO PRODUCTO / MOVIMIENTO ── */}
      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.78)', zIndex: 999999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backdropFilter: 'blur(3px)', overflowY: 'auto', padding: '32px 16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: showModal === 'NUEVO_MOVIMIENTO' ? 'min(95vw, 1080px)' : '560px', boxShadow: '0 25px 60px rgba(0,0,0,0.28)', border: '1px solid #E8ECF0', margin: 'auto', overflow: 'hidden' }}>

            {/* ── Cabecera del modal ── */}
            {showModal === 'NUEVO_MOVIMIENTO' ? (
              <div style={{ padding: '1.75rem 2rem', background: movimientoData.tipo === 'ENTRADA' ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' : 'linear-gradient(135deg, #14532D 0%, #16A34A 100%)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {movimientoData.tipo === 'ENTRADA' ? <ArrowDownRight size={26} color="white"/> : <ArrowUpRight size={26} color="white"/>}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    {movimientoData.tipo === 'ENTRADA' ? 'Entrada de mercancía' : 'Salida de inventario'}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 500 }}>Registrar movimiento de almacén</div>
                </div>
                <button onClick={() => setShowModal(null)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '7px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <X size={18}/>
                </button>
              </div>
            ) : (
              <div style={{ padding: '1.75rem 2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', margin: 0 }}>Registrar Producto al Catálogo</h2>
                <button onClick={() => setShowModal(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}><X size={18}/></button>
              </div>
            )}

            <div style={{ padding: '1.75rem 2rem 2rem' }}>

            {showModal === 'NUEVO_PRODUCTO' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Registra el producto en el <strong>catálogo del almacén</strong>. El inventario <strong>no aumenta</strong> con este registro — el stock se actualiza únicamente mediante movimientos de entrada.</span>
                </div>
                <div style={{ padding: '7px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 11, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={12} style={{ flexShrink: 0 }} />
                  <span>El <strong>código se genera automáticamente</strong> según categoría: MED-001, LIM-002, INS-003, etc.</span>
                </div>
                <input type="text" placeholder="Nombre del producto *" value={productoData.nombre} onChange={e => setProductoData({ ...productoData, nombre: e.target.value })} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <select value={productoData.categoria} onChange={e => setProductoData({ ...productoData, categoria: e.target.value })} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'white' }}>
                    <option value="MEDICAMENTO">Medicamento</option>
                    <option value="INSUMO_MEDICO">Insumo Médico</option>
                    <option value="ALIMENTO">Alimento</option>
                    <option value="LIMPIEZA">Limpieza</option>
                    <option value="PAPELERIA">Papelería</option>
                    <option value="MOBILIARIO">Mobiliario</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  <select value={productoData.unidad} onChange={e => setProductoData({ ...productoData, unidad: e.target.value })} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'white' }}>
                    <option value="PIEZAS">Piezas</option>
                    <option value="CAJAS">Cajas</option>
                    <option value="LITROS">Litros</option>
                    <option value="ML">Mililitros (ml)</option>
                    <option value="KG">Kilogramos (kg)</option>
                    <option value="GRAMOS">Gramos</option>
                    <option value="BOLSAS">Bolsas</option>
                    <option value="PAQUETES">Paquetes</option>
                    <option value="FRASCOS">Frascos</option>
                    <option value="AMPOLLAS">Ampollas</option>
                    <option value="ROLLOS">Rollos</option>
                    <option value="METROS">Metros</option>
                  </select>
                </div>
                <textarea placeholder="Descripción (opcional)" value={productoData.descripcion} onChange={e => setProductoData({ ...productoData, descripcion: e.target.value })} rows={2} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Stock mínimo</label>
                    <input type="number" placeholder="5" value={productoData.stockMinimo} onChange={e => setProductoData({ ...productoData, stockMinimo: parseInt(e.target.value) || 5 })} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Ubicación física en almacén</label>
                    <input type="text" placeholder="Ej: Estante A-2, Refrigerador, Pasillo 3..." value={productoData.ubicacion} onChange={e => setProductoData({ ...productoData, ubicacion: e.target.value })} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* ── Tipo de movimiento ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={lbN}>Tipo de movimiento *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(['ENTRADA', 'SALIDA'] as const).map(tipo => {
                      const active = movimientoData.tipo === tipo;
                      const isEntrada = tipo === 'ENTRADA';
                      const Icon = isEntrada ? ArrowDownRight : ArrowUpRight;
                      const activeColor = isEntrada ? '#1D4ED8' : '#15803D';
                      const activeBorder = isEntrada ? '#93C5FD' : '#86EFAC';
                      const activeBg = isEntrada ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : 'linear-gradient(135deg, #F0FDF4, #DCFCE7)';
                      const activeShadow = isEntrada ? '0 4px 14px rgba(37,99,235,0.18)' : '0 4px 14px rgba(22,163,74,0.18)';
                      const iconBg = active ? (isEntrada ? '#DBEAFE' : '#DCFCE7') : '#F1F5F9';
                      const iconColor = active ? activeColor : '#CBD5E1';
                      const subText = isEntrada ? 'Recepción de mercancía' : 'Despacho de inventario';
                      return (
                        <button key={tipo} type="button"
                          onClick={() => setMovimientoData({ ...movimientoData, tipo, requisicionId: '' })}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '1.1rem 1rem', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                            border: `2px solid ${active ? activeBorder : '#E2E8F0'}`,
                            background: active ? activeBg : '#F8FAFC',
                            color: active ? activeColor : '#94A3B8',
                            fontWeight: 600, fontSize: 14,
                            boxShadow: active ? activeShadow : 'none',
                          }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg, transition: 'all 0.15s' }}>
                            <Icon size={22} color={iconColor}/>
                          </div>
                          <span>{isEntrada ? 'Entrada' : 'Salida'}</span>
                          <span style={{ fontSize: 10, fontWeight: 400, color: active ? (isEntrada ? '#3B82F6' : '#22C55E') : '#CBD5E1', textAlign: 'center', lineHeight: 1.3 }}>{subText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ══ ENTRADA ══ */}
                {movimientoData.tipo === 'ENTRADA' && (
                  <div>
                    <div style={secHdrE}>
                      <Box size={14} color="white" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>Recepción de mercancía</span>
                    </div>
                    <div style={secBodyE}>

                      {/* Aviso inspección */}
                      {(!movimientoData.empaqueCorrecto || !movimientoData.cantidadCorrecta || !movimientoData.presentacionCorrecta) && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '3px solid #F59E0B', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                          <AlertTriangle size={13} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }}/>
                          <span>Los productos aparecen como <strong>Rechazado</strong> hasta que marques todas las casillas de inspección.</span>
                        </div>
                      )}

                      {/* Requisición */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={lbE}>Requisición / Orden de compra asociada</label>
                        <select value={movimientoData.requisicionId} onChange={e => {
                          const reqId = e.target.value;
                          const req = reqId ? requisiciones.find(r => String(r.id) === reqId) : null;
                          setMovimientoData({ ...movimientoData, requisicionId: reqId, proveedor: req ? getProveedorDeRequisicion(req) : '', importeFactura: req ? getImporteDeRequisicion(req) : '', numeroFactura: req?.facturas && req.facturas.length > 0 ? req.facturas.map(f => f.numero).filter(Boolean).join(', ') : '' });
                        }} style={inpE}>
                          <option value="">Sin requisición asociada</option>
                          {requisiciones.filter(r => ['AUTORIZADA','NEGOCIACION_COMPLETADA','ORDEN_GENERADA','FACTURAS_RECIBIDAS','ORDEN_PAGO_GENERADA','PAGO_GENERADO','FINALIZADO'].includes(r.estado) && !usedEntradaReqIds.has(r.id)).map(r => (
                            <option key={r.id} value={r.id}>{r.folio} — {r.requisicion?.areaSolicitante ?? r.areaSolicitante ?? ''} — {(r.requisicion?.descripcion ?? r.descripcion ?? '').slice(0, 40)}</option>
                          ))}
                        </select>

                        {/* Tabla validación multi-producto */}
                        {productosDeRequisicion.length > 0 && (
                          <div style={{ marginTop: 8, border: '1px solid #BFDBFE', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#DBEAFE' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Validación — {productosDeRequisicion.length} producto{productosDeRequisicion.length !== 1 ? 's' : ''}</span>
                              {productosDeRequisicion.every(d => d.productoMatch) && (
                                <span style={{ fontSize: 11, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11}/>Todos en catálogo</span>
                              )}
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                                <colgroup><col style={{ width: '18%' }}/><col style={{ width: '8%' }}/><col style={{ width: '8%' }}/><col style={{ width: '12%' }}/><col style={{ width: '13%' }}/><col style={{ width: '12%' }}/><col style={{ width: '29%' }}/></colgroup>
                                <thead>
                                  <tr>{['Producto','Solic.','Recib.','Estado','Lote','Caducidad','Observaciones'].map((h,i) => <th key={i} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, color: '#1E3A5F', borderBottom: '1px solid #BFDBFE', fontSize: 11, background: '#EFF6FF' }}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                  {productosDeRequisicion.map((det, idx) => {
                                    const edit = recepcionEditada[det.id] ?? { cantidadRecibida: 0, estado: 'CORRECTO', observaciones: '', lote: '', fechaCaducidad: '' };
                                    const estadoColors: Record<string, { bg: string; text: string; border: string }> = { CORRECTO: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' }, INCOMPLETO: { bg: '#FEFCE8', text: '#CA8A04', border: '#FDE68A' }, EXCEDENTE: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }, RECHAZADO: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' } };
                                    const ec = estadoColors[edit.estado] ?? estadoColors.CORRECTO;
                                    const rowBg = !det.productoMatch ? '#FFF7ED' : idx % 2 === 0 ? '#F8FAFF' : 'white';
                                    return (
                                      <tr key={det.id} style={{ background: rowBg, borderBottom: '1px solid #E0EAFF' }}>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 12, lineHeight: 1.3 }}>{det.producto}</div>
                                          <div style={{ fontSize: 10, color: '#64748B' }}>{det.unidad}</div>
                                          {det.productoMatch ? <div style={{ fontSize: 10, color: '#15803D', fontFamily: 'monospace' }}>{det.productoMatch.codigo}</div>
                                            : <button type="button" onClick={() => autoCrearProducto.mutate({ nombre: det.producto, categoria: 'OTRO', unidad: det.unidad })} disabled={autoCrearProducto.isPending} style={{ marginTop: 3, padding: '2px 6px', borderRadius: 5, background: '#B45309', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>{autoCrearProducto.isPending ? '...' : '+ Crear'}</button>}
                                        </td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: 13 }}>{det.cantidad}</td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><input type="number" min={0} value={edit.cantidadRecibida || ''} placeholder="0" onChange={e => {
                                          const newQty = Number(e.target.value) || 0;
                                          const anyInspFailed = !movimientoData.empaqueCorrecto || !movimientoData.cantidadCorrecta || !movimientoData.presentacionCorrecta;
                                          const newEstado = anyInspFailed ? 'RECHAZADO'
                                            : newQty === 0 ? edit.estado
                                            : newQty === det.cantidad ? 'CORRECTO'
                                            : newQty < det.cantidad ? 'INCOMPLETO'
                                            : 'EXCEDENTE';
                                          setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, cantidadRecibida: newQty, estado: newEstado } }));
                                        }} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 12, textAlign: 'center', fontWeight: 700 }}/></td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><select value={edit.estado} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, estado: e.target.value } }))} style={{ width: '100%', padding: '4px 5px', borderRadius: 6, border: `1px solid ${ec.border}`, background: ec.bg, color: ec.text, fontWeight: 700, fontSize: 11, outline: 'none' }}><option value="CORRECTO">Correcto</option><option value="INCOMPLETO">Incompleto</option><option value="EXCEDENTE">Excedente</option><option value="RECHAZADO">Rechazado</option></select></td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><input type="text" placeholder="DZ-01" value={edit.lote} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, lote: e.target.value } }))} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 11, fontFamily: 'monospace' }}/></td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><input type="date" value={edit.fechaCaducidad} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, fechaCaducidad: e.target.value } }))} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 11 }}/></td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><input type="text" placeholder="Observaciones..." value={edit.observaciones} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, observaciones: e.target.value } }))} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 11 }}/></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            {productosDeRequisicion.some(d => !d.productoMatch) && (
                              <div style={{ padding: '6px 12px', background: '#FFF7ED', borderTop: '1px solid #FED7AA', fontSize: 11, color: '#92400E', display: 'flex', gap: 6, alignItems: 'center' }}>
                                <AlertTriangle size={12} style={{ flexShrink: 0 }}/>Algunos productos no están en el catálogo. Usa el botón "+ Crear" antes de registrar.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Proveedor / Factura */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={lbE}>Proveedor *</label>
                          <input type="text" value={movimientoData.proveedor} onChange={e => setMovimientoData({ ...movimientoData, proveedor: e.target.value })} style={inpE}/>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={lbE}>Núm. de factura *</label>
                          <input type="text" value={movimientoData.numeroFactura} onChange={e => setMovimientoData({ ...movimientoData, numeroFactura: e.target.value })} style={inpE}/>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={lbE}>Importe de factura ($) *</label>
                          <input type="number" value={movimientoData.importeFactura} onChange={e => setMovimientoData({ ...movimientoData, importeFactura: e.target.value })} style={inpE}/>
                        </div>
                      </div>

                      {/* Estado de recepción — toggle */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={lbE}>Estado de recepción</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {(['PENDIENTE', 'ACEPTADO'] as const).map(est => {
                            const active = movimientoData.estadoRecepcion === est;
                            const isPend = est === 'PENDIENTE';
                            return (
                              <button key={est} type="button" onClick={() => setMovimientoData({ ...movimientoData, estadoRecepcion: est })}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                  border: `2px solid ${active ? (isPend ? '#FDE68A' : '#86EFAC') : '#E2E8F0'}`,
                                  background: active ? (isPend ? '#FEFCE8' : '#F0FDF4') : 'white',
                                  color: active ? (isPend ? '#92400E' : '#15803D') : '#94A3B8',
                                }}>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{isPend ? 'Pendiente' : 'Aceptado'}</span>
                                <span style={{ fontSize: 10, lineHeight: 1.3, color: active ? (isPend ? '#B45309' : '#16A34A') : '#CBD5E1' }}>{isPend ? 'Se validará en el Kardex' : 'Ingresa al inventario de inmediato'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inspección visual */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={lbE}>Inspección visual de mercancía *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {[
                            { key: 'empaqueCorrecto',      label: 'Empaque en buen estado y correcto' },
                            { key: 'cantidadCorrecta',     label: 'Cantidad coincide con factura / orden' },
                            { key: 'presentacionCorrecta', label: 'Presentación conforme a especificaciones' },
                          ].map(({ key, label }) => {
                            const checked = movimientoData[key as keyof typeof movimientoData] as boolean;
                            return (
                              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                                background: checked ? '#F0FDF4' : '#F8FAFC',
                                border: `1.5px solid ${checked ? '#86EFAC' : '#E2E8F0'}`,
                              }}>
                                <input type="checkbox" checked={checked} onChange={e => {
                                  const newChecked = e.target.checked;
                                  const newMov = { ...movimientoData, [key]: newChecked };
                                  const anyFailed = !newMov.empaqueCorrecto || !newMov.cantidadCorrecta || !newMov.presentacionCorrecta;
                                  setMovimientoData(newMov);
                                  if (productosDeRequisicion.length > 0) {
                                    setRecepcionEditada(prev => {
                                      const updated: typeof prev = {};
                                      productosDeRequisicion.forEach(d => {
                                        const ed = prev[d.id] ?? { cantidadRecibida: 0, estado: 'CORRECTO', observaciones: '', lote: '', fechaCaducidad: '' };
                                        const qty = ed.cantidadRecibida;
                                        const estado = anyFailed ? 'RECHAZADO'
                                          : qty === 0 ? (ed.estado === 'RECHAZADO' ? 'CORRECTO' : ed.estado)
                                          : qty === d.cantidad ? 'CORRECTO'
                                          : qty < d.cantidad ? 'INCOMPLETO'
                                          : 'EXCEDENTE';
                                        updated[d.id] = { ...ed, estado };
                                      });
                                      return { ...prev, ...updated };
                                    });
                                  }
                                }} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16A34A' }}/>
                                <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? '#15803D' : '#374151', flex: 1 }}>{label}</span>
                                {checked
                                  ? <CheckCircle2 size={15} color="#16A34A"/>
                                  : <AlertTriangle size={14} color="#D97706"/>
                                }
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Norma operativa */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: '3px solid #2563EB', borderRadius: 8, fontSize: 12, color: '#1E3A8A', fontWeight: 500 }}>
                        <Bell size={13} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }}/>
                        <span><strong>Norma operativa:</strong> Recepción de mercancías únicamente los <strong>jueves de 9:00 a 14:00 h</strong>.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ SALIDA ══ */}
                {movimientoData.tipo === 'SALIDA' && (
                  <div>
                    <div style={secHdrS}>
                      <ArrowUpRight size={14} color="white"/>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>Despacho de mercancía</span>
                    </div>
                    <div style={secBodyS}>

                      {/* Requisición */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={lbS}>Solicitud de suministro asociada</label>
                        <select value={movimientoData.requisicionId} onChange={e => {
                          const reqId = e.target.value;
                          let newArea = movimientoData.areaSolicitante;
                          if (reqId.startsWith('c:')) {
                            const r = requisiciones.find(rq => String(rq.id) === reqId.slice(2));
                            newArea = r?.requisicion?.areaSolicitante ?? r?.areaSolicitante ?? movimientoData.areaSolicitante;
                          } else if (reqId) {
                            const r = requisicionesDept.find(rq => String(rq.id) === reqId);
                            newArea = r?.areaSolicitante ?? movimientoData.areaSolicitante;
                          }
                          setMovimientoData({ ...movimientoData, requisicionId: reqId, areaSolicitante: newArea });
                        }} style={inpS}>
                          <option value="">Sin solicitud asociada</option>
                          {requisicionesDept.filter(r => ['EN_REVISION_ALMACEN', 'PARCIAL', 'SIN_EXISTENCIA', 'ENVIADA_A_COMPRAS'].includes(r.estado) && !usedSalidaReqIds.has(r.id)).length > 0 && (
                            <optgroup label="Solicitudes de suministro">
                              {requisicionesDept.filter(r => ['EN_REVISION_ALMACEN', 'PARCIAL', 'SIN_EXISTENCIA', 'ENVIADA_A_COMPRAS'].includes(r.estado) && !usedSalidaReqIds.has(r.id)).map(r => (
                                <option key={r.id} value={String(r.id)}>{r.folio} — {r.areaSolicitante} — {(r.descripcion ?? '').slice(0, 40)}</option>
                              ))}
                            </optgroup>
                          )}
                          {comprasRecibidas.length > 0 && (
                            <optgroup label="Compras recibidas en almacén">
                              {comprasRecibidas.map(r => (
                                <option key={`c${r.id}`} value={`c:${r.id}`}>
                                  {r.folio} — {r.requisicion?.areaSolicitante ?? r.areaSolicitante ?? ''} — {(r.requisicion?.descripcion ?? r.descripcion ?? '').slice(0, 40)}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>

                        {/* Tabla despacho multi-producto */}
                        {productosDeRequisicion.length > 0 && (
                          <div style={{ marginTop: 8, border: '1px solid #BBF7D0', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#DCFCE7' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Despacho — {productosDeRequisicion.length} producto{productosDeRequisicion.length !== 1 ? 's' : ''}</span>
                              {productosDeRequisicion.every(d => d.productoMatch) && (
                                <span style={{ fontSize: 11, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11}/>Todos en catálogo</span>
                              )}
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                                <colgroup><col style={{ width: '35%' }}/><col style={{ width: '12%' }}/><col style={{ width: '15%' }}/><col style={{ width: '13%' }}/><col style={{ width: '25%' }}/></colgroup>
                                <thead>
                                  <tr>{['Producto','Solic.','A despachar','Estado','Observaciones'].map((h, i) => <th key={i} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, color: '#14532D', borderBottom: '1px solid #BBF7D0', fontSize: 11, background: '#F0FDF4' }}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                  {productosDeRequisicion.map((det, idx) => {
                                    const edit = recepcionEditada[det.id] ?? { cantidadRecibida: det.cantidad, estado: 'CORRECTO', observaciones: '', lote: '', fechaCaducidad: '' };
                                    const estadoColors: Record<string, { bg: string; text: string; border: string }> = { CORRECTO: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' }, INCOMPLETO: { bg: '#FEFCE8', text: '#CA8A04', border: '#FDE68A' }, EXCEDENTE: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }, RECHAZADO: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' } };
                                    const ec = estadoColors[edit.estado] ?? estadoColors.CORRECTO;
                                    const rowBg = !det.productoMatch ? '#FFF7ED' : idx % 2 === 0 ? '#F8FFF8' : 'white';
                                    return (
                                      <tr key={det.id} style={{ background: rowBg, borderBottom: '1px solid #DCFCE7' }}>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 12, lineHeight: 1.3 }}>{det.producto}</div>
                                          <div style={{ fontSize: 10, color: '#64748B' }}>{det.unidad}</div>
                                          {det.productoMatch
                                            ? <div style={{ fontSize: 10, color: '#15803D', fontFamily: 'monospace' }}>{det.productoMatch.codigo}</div>
                                            : <span style={{ fontSize: 10, color: '#B45309', fontWeight: 600 }}>Sin match en catálogo</span>}
                                        </td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: 13 }}>{det.cantidad}</td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><input type="number" min={0} value={edit.cantidadRecibida} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, cantidadRecibida: Number(e.target.value) || 0 } }))} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BBF7D0', outline: 'none', fontSize: 12, textAlign: 'center', fontWeight: 700 }}/></td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><select value={edit.estado} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, estado: e.target.value } }))} style={{ width: '100%', padding: '4px 5px', borderRadius: 6, border: `1px solid ${ec.border}`, background: ec.bg, color: ec.text, fontWeight: 700, fontSize: 11, outline: 'none' }}><option value="CORRECTO">Correcto</option><option value="INCOMPLETO">Incompleto</option><option value="EXCEDENTE">Excedente</option><option value="RECHAZADO">Rechazado</option></select></td>
                                        <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}><input type="text" placeholder="Observaciones..." value={edit.observaciones} onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, observaciones: e.target.value } }))} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BBF7D0', outline: 'none', fontSize: 11 }}/></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Área, motivo, quien recibe */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={lbS}>Área solicitante *</label>
                        <select value={movimientoData.areaSolicitante} onChange={e => setMovimientoData({ ...movimientoData, areaSolicitante: e.target.value })} style={{ ...inpS, color: movimientoData.areaSolicitante ? '#111827' : '#6B7280' }}>
                          <option value="">Selecciona un área...</option>
                          <option value="Dirección General">Dirección General</option>
                          <option value="Unidad de Transparencia">Unidad de Transparencia</option>
                          <option value="Departamento Clínico">Departamento Clínico</option>
                          <option value="Departamento Médico">Departamento Médico</option>
                          <option value="Departamento de Admisiones">Departamento de Admisiones</option>
                          <option value="Departamento de Administración">Departamento de Administración</option>
                          <option value="Oficina de Recursos Materiales">Oficina de Recursos Materiales</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={lbS}>Motivo / descripción *</label>
                          <input type="text" value={movimientoData.motivo} onChange={e => setMovimientoData({ ...movimientoData, motivo: e.target.value })} style={inpS}/>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={lbS}>Nombre de quien recibe *</label>
                          <input type="text" value={movimientoData.nombreRecibe} onChange={e => setMovimientoData({ ...movimientoData, nombreRecibe: e.target.value })} style={inpS}/>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observaciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={lbN}>Observaciones</label>
                  <textarea value={movimientoData.observaciones} onChange={e => setMovimientoData({ ...movimientoData, observaciones: e.target.value })} rows={2} placeholder="Notas adicionales sobre este movimiento..."
                    style={{ padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', background: '#FAFAFA', color: '#374151' }}/>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button onClick={() => setShowModal(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', fontWeight: '700', color: '#64748b', background: 'white', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
              <button
                onClick={() => {
                  if (showModal === 'NUEVO_PRODUCTO') {
                    crearProducto.mutate(productoData);
                  } else if (movimientoData.tipo === 'ENTRADA' && movimientoData.requisicionId && productosDeRequisicion.length > 0) {
                    registrarRecepcionMultiple();
                  } else {
                    registrarMovimiento.mutate(movimientoData);
                  }
                }}
                disabled={crearProducto.isPending || registrarMovimiento.isPending || isSubmittingMultiple}
                style={{ flex: 2, padding: '0.875rem', borderRadius: '14px', border: 'none', fontWeight: '800', fontSize: 14, cursor: 'pointer', color: 'white', transition: 'opacity 0.15s',
                  background: showModal === 'NUEVO_MOVIMIENTO'
                    ? (movimientoData.tipo === 'ENTRADA' ? 'linear-gradient(135deg, #1D4ED8, #3B82F6)' : 'linear-gradient(135deg, #15803D, #22C55E)')
                    : 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  boxShadow: showModal === 'NUEVO_MOVIMIENTO'
                    ? (movimientoData.tipo === 'ENTRADA' ? '0 6px 18px rgba(37,99,235,0.35)' : '0 6px 18px rgba(22,163,74,0.35)')
                    : '0 6px 18px rgba(37,99,235,0.35)',
                  opacity: (crearProducto.isPending || registrarMovimiento.isPending || isSubmittingMultiple) ? 0.7 : 1,
                }}
              >
                {(crearProducto.isPending || registrarMovimiento.isPending || isSubmittingMultiple) ? 'Procesando...' : 'Confirmar Registro'}
              </button>
            </div>
            </div>{/* end padding wrapper */}
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL RECHAZAR RECEPCIÓN ── */}
      {rechazarMovId !== null && (
        <Modal title="Rechazar recepción" onClose={() => setRechazarMovId(null)} width={440}>
          <Textarea
            label="Motivo del rechazo"
            placeholder="Describa el motivo..."
            value={motivoRechazoForm}
            onChange={e => setMotivoRechazoForm(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="danger" icon={<XCircle size={14} />} onClick={() => {
              if (!motivoRechazoForm.trim()) return;
              rechazarRecepcion.mutate({ id: rechazarMovId, motivoRechazo: motivoRechazoForm });
            }}>Confirmar rechazo</Btn>
            <Btn variant="ghost" onClick={() => setRechazarMovId(null)}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* ── MODAL GENERAR CONTRA-RECIBO ── */}
      {generarCRMovId !== null && (
        <Modal title="Generar contra-recibo" onClose={() => setGenerarCRMovId(null)} width={440}>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, fontSize: 13, color: '#1D4ED8' }}>
            Se generará un contra-recibo para el movimiento seleccionado. Asegúrese de que los datos de factura estén registrados.
          </div>
          <Input
            label="Fecha de pago programado (opcional)"
            type="date"
            value={fechaPagoProgramado}
            onChange={e => setFechaPagoProgramado(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon={<FileText size={14} />} onClick={() => {
              generarContraRecibo.mutate({ movimientoId: generarCRMovId, fechaPago: fechaPagoProgramado });
            }}>Generar contra-recibo</Btn>
            <Btn variant="ghost" onClick={() => setGenerarCRMovId(null)}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {renderCreate()}
      {renderRevision()}

      {/* ── Modal Editar Producto ── */}
      {editandoProducto && (
        <Modal title={`Editar producto — ${editandoProducto.codigo}`} onClose={() => setEditandoProducto(null)} width={520}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Nombre</label>
              <input
                type="text"
                value={editForm.nombre}
                onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Categoría</label>
                <select value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, background: 'white' }}>
                  <option value="MEDICAMENTO">Medicamento</option>
                  <option value="INSUMO_MEDICO">Insumo Médico</option>
                  <option value="ALIMENTO">Alimento</option>
                  <option value="LIMPIEZA">Limpieza</option>
                  <option value="PAPELERIA">Papelería</option>
                  <option value="MOBILIARIO">Mobiliario</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Unidad</label>
                <select value={editForm.unidad} onChange={e => setEditForm(f => ({ ...f, unidad: e.target.value }))} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, background: 'white' }}>
                  <option value="PIEZAS">Piezas</option>
                  <option value="CAJAS">Cajas</option>
                  <option value="LITROS">Litros</option>
                  <option value="ML">Mililitros (ml)</option>
                  <option value="KG">Kilogramos (kg)</option>
                  <option value="GRAMOS">Gramos</option>
                  <option value="BOLSAS">Bolsas</option>
                  <option value="PAQUETES">Paquetes</option>
                  <option value="FRASCOS">Frascos</option>
                  <option value="AMPOLLAS">Ampollas</option>
                  <option value="ROLLOS">Rollos</option>
                  <option value="METROS">Metros</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Descripción</label>
              <textarea
                value={editForm.descripcion}
                onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Stock mínimo</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.stockMinimo}
                  onChange={e => setEditForm(f => ({ ...f, stockMinimo: parseInt(e.target.value) || 0 }))}
                  style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Ubicación en almacén</label>
                <input
                  type="text"
                  value={editForm.ubicacion}
                  onChange={e => setEditForm(f => ({ ...f, ubicacion: e.target.value }))}
                  placeholder="Ej: Estante A-2, Refrigerador..."
                  style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
              <button
                onClick={() => actualizarProducto.mutate({ id: editandoProducto.id, data: { nombre: editForm.nombre, categoria: editForm.categoria, unidad: editForm.unidad, descripcion: editForm.descripcion || null, stockMinimo: editForm.stockMinimo, ubicacion: editForm.ubicacion || null } })}
                disabled={actualizarProducto.isPending || !editForm.nombre.trim()}
                style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none', background: actualizarProducto.isPending || !editForm.nombre.trim() ? '#e2e8f0' : '#1E3A5F', color: actualizarProducto.isPending || !editForm.nombre.trim() ? '#94a3b8' : 'white', fontWeight: 700, fontSize: 14, cursor: actualizarProducto.isPending || !editForm.nombre.trim() ? 'not-allowed' : 'pointer' }}
              >
                {actualizarProducto.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => setEditandoProducto(null)} style={{ padding: '0.75rem 1.25rem', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {notif && <Notif msg={notif} onClose={() => setNotif(null)} />}
      <NuevaRequisicionModal
        isOpen={showNuevaRequisicion}
        onClose={() => setShowNuevaRequisicion(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['requisiciones'] })}
      />
      <RequisicionAlmacenModal
        key={reqAlmacenDetalle?.id}
        req={reqAlmacenDetalle}
        isOpen={reqAlmacenDetalle !== null}
        productos={productosData ?? []}
        onClose={() => setReqAlmacenDetalle(null)}
        onSalidaRegistrada={() => {
          queryClient.invalidateQueries({ queryKey: ['productos'] });
          queryClient.invalidateQueries({ queryKey: ['movimientos'] });
        }}
        onEnviadoACompras={() => {
          queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
          queryClient.invalidateQueries({ queryKey: ['compras'] });
        }}
      />
      <RequisicionExtraordinariaModal
        key={reqAlmacenExtraordinariaDetalle?.id}
        req={reqAlmacenExtraordinariaDetalle}
        isOpen={reqAlmacenExtraordinariaDetalle !== null}
        onClose={() => setReqAlmacenExtraordinariaDetalle(null)}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
          queryClient.invalidateQueries({ queryKey: ['compras'] });
        }}
      />
    </div>
  );
}