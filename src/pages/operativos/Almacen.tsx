import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PackageSearch, ArrowDownRight, ArrowUpRight, Plus, Box, Search, Filter,
  MoreVertical, X, Bell, Eye, Clock, CheckCircle, XCircle,
  ShoppingCart, FileText, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/api';
import type { Producto, Movimiento, Requisicion, EstadoCompra, Cotizacion } from '../../types';
import { getEstadoCompraUI } from '../../types';
import { useCompras } from '../../hooks/useCompras';
import { useAuthStore } from '../../stores/authStore';

// ─── TIPOS EXTENDIDOS ─────────────────────────────────────────────────────────

interface MovimientoExtendido extends Movimiento {
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
  REQUISICION_CREADA:        { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
  EN_REVISION_RECURSOS:      { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  EN_REVISION_COMPRAS:       { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' },
  EN_REVISION_ADMINISTRACION:{ bg: '#FEFCE8', text: '#CA8A04', dot: '#EAB308' },
  EN_REVISION_DIRECCION:     { bg: '#FDF2F8', text: '#BE185D', dot: '#EC4899' },
  COTIZACIONES_CARGADAS:     { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' },
  PROVEEDOR_SELECCIONADO:    { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  NEGOCIACION_COMPLETADA:    { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4' },
  AUTORIZADA:                { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  ORDEN_GENERADA:            { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  FACTURAS_RECIBIDAS:        { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  ORDEN_PAGO_GENERADA:       { bg: '#ECFEFF', text: '#0E7490', dot: '#06B6D4' },
  FINALIZADO:                { bg: '#F0FDF4', text: '#15803D', dot: '#16A34A' },
  RECHAZADO:                 { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
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

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function Almacen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'INVENTARIO' | 'KARDEX' | 'REQUISICIONES' | 'CONTRA_RECIBOS'>('INVENTARIO');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formCreate, setFormCreate] = useState({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '', tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA' });
  const [detalles, setDetalles] = useState<{ producto: string; unidad: string; cantidad: number }[]>([{ producto: '', unidad: '', cantidad: 1 }]);
  const [notif, setNotif] = useState<string | null>(null);
  const [reqSeleccionada, setReqSeleccionada] = useState<Requisicion | null>(null);
  const [busquedaReq, setBusquedaReq] = useState('');

  // States para nuevos registros
  const [productoData, setProductoData] = useState({
    nombre: '', categoria: 'MEDICAMENTO', unidad: 'PIEZAS',
    stockMinimo: 5, descripcion: '', ubicacion: ''
  });
  const [movimientoData, setMovimientoData] = useState({
    productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '',
    requisicionId: '',
    // Entradas
    proveedor: '', numeroFactura: '', importeFactura: '',
    fechaCaducidad: '', empaqueCorrecto: true, cantidadCorrecta: true, presentacionCorrecta: true,
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
    enabled: activeTab === 'KARDEX'
  });

  const { data: contraRecibosData, isLoading: isLoadingCR } = useQuery<ContraReciboData[]>({
    queryKey: ['contra-recibos'],
    queryFn: () => apiClient.get('/contra-recibos').then(res => res.data.data),
    enabled: activeTab === 'CONTRA_RECIBOS'
  });

  const { createReq, requisiciones, isLoading: isLoadingReqs } = useCompras();
  const { usuario } = useAuthStore();
  const rol = usuario?.rol ?? '';
  const puedeOperar = puedeHacer(rol, 'operar');

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
            <div><strong>Área:</strong> {req.areaSolicitante}</div>
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
          <div style={{ lineHeight: 1.6 }}>{req.descripcion}</div>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Justificación</div>
          <div style={{ lineHeight: 1.6 }}>{req.justificacion}</div>
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
                    <td style={{ padding: '8px 14px', fontWeight: 500 }}>{d.producto}</td>
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

  const registrarMovimiento = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const d = data as Record<string, unknown>;
      return apiClient.post('/almacen/movimientos', {
        ...d,
        productoId: parseInt(d.productoId as string, 10),
        cantidad: parseInt(d.cantidad as string, 10),
        importeFactura: d.importeFactura ? parseFloat(d.importeFactura as string) : undefined,
        requisicionId: d.requisicionId ? parseInt(d.requisicionId as string, 10) : undefined,
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
        fechaCaducidad: '', empaqueCorrecto: true, cantidadCorrecta: true, presentacionCorrecta: true,
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
    for (const det of productosDeRequisicion) {
      const pid = det.productoMatch ? String(det.productoMatch.id) : null;
      if (!pid) { fail++; continue; }

      const edit = recepcionEditada[det.id] ?? { cantidadRecibida: det.cantidad, estado: 'CORRECTO', observaciones: '', lote: '', fechaCaducidad: '' };
      const estadoDet = edit.estado;

      try {
        await apiClient.post('/almacen/movimientos', {
          productoId: pid,
          tipo: 'ENTRADA',
          cantidad: edit.cantidadRecibida,
          requisicionId: movimientoData.requisicionId,
          proveedor: movimientoData.proveedor,
          numeroFactura: movimientoData.numeroFactura,
          importeFactura: movimientoData.importeFactura || undefined,
          fechaCaducidad: edit.fechaCaducidad || undefined,
          empaqueCorrecto: movimientoData.empaqueCorrecto,
          cantidadCorrecta: movimientoData.cantidadCorrecta,
          presentacionCorrecta: movimientoData.presentacionCorrecta,
          estadoRecepcion: estadoDet === 'CORRECTO' ? 'ACEPTADO' : 'PENDIENTE',
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
    setMovimientoData({ productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '', requisicionId: '', proveedor: '', numeroFactura: '', importeFactura: '', fechaCaducidad: '', empaqueCorrecto: true, cantidadCorrecta: true, presentacionCorrecta: true, estadoRecepcion: 'PENDIENTE', areaSolicitante: '', motivo: '', nombreRecibe: '' });
    setRecepcionEditada({});
    notify(fail === 0 ? `✅ ${ok} producto${ok !== 1 ? 's' : ''} recibido${ok !== 1 ? 's' : ''} correctamente` : `⚠️ ${ok} recibidos, ${fail} no procesados (sin catálogo)`);
  };

  const requisicionParaEntrada = movimientoData.requisicionId
    ? requisiciones.find(r => String(r.id) === movimientoData.requisicionId) ?? null
    : null;

  const productosDeRequisicion = (requisicionParaEntrada?.detalles ?? []).map(det => {
    const productoMatch = productosData?.find(p =>
      p.nombre.toLowerCase() === det.producto.toLowerCase() ||
      p.nombre.toLowerCase().includes(det.producto.toLowerCase()) ||
      det.producto.toLowerCase().includes(p.nombre.toLowerCase())
    ) ?? null;
    return { ...det, productoMatch };
  });

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
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '500' }}>Gestión de inventario clínico y administrativo</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1.5rem', backgroundColor: 'white', color: 'var(--text-h)', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Plus size={18} style={{ marginRight: '0.6rem' }} /> Nueva Requisición
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
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(241, 245, 249, 0.5)', padding: '0.5rem', borderRadius: '20px', width: 'fit-content', marginBottom: '2.5rem' }}>
        {(['INVENTARIO', 'KARDEX', 'REQUISICIONES', 'CONTRA_RECIBOS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 2rem', border: 'none', borderRadius: '15px',
              backgroundColor: activeTab === tab ? 'white' : 'transparent',
              fontWeight: '700',
              color: activeTab === tab ? 'var(--primary)' : '#64748b',
              cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease',
              boxShadow: activeTab === tab ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
            }}>
            {tab === 'INVENTARIO' ? 'Inventario Actual'
              : tab === 'REQUISICIONES' ? 'Requisiciones'
              : tab === 'KARDEX' ? 'Kardex (Histórico)'
              : 'Contra-Recibos'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border)', minHeight: '600px' }}>

        {/* Filtros */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={activeTab === 'REQUISICIONES' ? 'Buscar por folio o descripción...' : 'Buscar por código o nombre...'}
              value={activeTab === 'REQUISICIONES' ? busquedaReq : undefined}
              onChange={activeTab === 'REQUISICIONES' ? e => setBusquedaReq(e.target.value) : undefined}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center' }}><Filter size={18} color="#64748b" /></button>
            <button style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center' }}><MoreVertical size={18} color="#64748b" /></button>
          </div>
        </div>

        {/* ── REQUISICIONES ── */}
        {activeTab === 'REQUISICIONES' ? (() => {
          const reqFiltradas = requisiciones.filter(r =>
            r.folio.toLowerCase().includes(busquedaReq.toLowerCase()) ||
            r.descripcion.toLowerCase().includes(busquedaReq.toLowerCase())
          );
          if (isLoadingReqs) return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <span style={{ fontSize: 15 }}>Cargando requisiciones...</span>
            </div>
          );
          if (reqFiltradas.length === 0) return (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>Sin requisiciones</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>No hay requisiciones registradas.</p>
            </div>
          );
          return (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Fecha', 'Folio / Descripción', 'Área', 'Presupuesto', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{ padding: '1.1rem 1.5rem', textAlign: i === 5 ? 'right' : 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reqFiltradas.map((req, idx) => {
                  const style = ESTADO_REQ_STYLES[req.estado] ?? { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' };
                  const estadoUI = getEstadoCompraUI(req.estado as EstadoCompra);
                  return (
                    <tr key={req.id} style={{ borderBottom: idx < reqFiltradas.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(req.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 340 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{req.folio}</span>
                          <span style={{ background: req.tipo === 'EXTRAORDINARIA' ? '#FEF2F2' : '#EFF6FF', color: req.tipo === 'EXTRAORDINARIA' ? '#DC2626' : '#2563EB', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, border: `1px solid ${req.tipo === 'EXTRAORDINARIA' ? '#FECACA' : '#BFDBFE'}`, whiteSpace: 'nowrap' }}>
                            {req.tipo}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, wordBreak: 'break-word' }}>{req.descripcion}</div>
                        {req.usuario && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{req.usuario.nombre} {req.usuario.apellidos}</div>}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', maxWidth: 200 }}>
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4, display: 'block', wordBreak: 'break-word' }}>{req.areaSolicitante}</span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                          {req.presupuestoEstimado ? `$${req.presupuestoEstimado.toLocaleString('es-MX')}` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: style.bg, color: style.text, border: `1px solid ${style.dot}33`, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
                          {estadoUI.label}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => setReqSeleccionada(req)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <Eye size={14} /> Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()

        /* ── INVENTARIO ── */
        : activeTab === 'INVENTARIO' ? (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Código</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Categoría</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ubicación</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Stock Act. / Mín</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Próx. Caducidad</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingProductos ? (
                <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Procesando base de datos...</td></tr>
              ) : productosData?.map((prod) => {
                const proximaCaducidad = (prod as any).proximaCaducidad as string | null | undefined;
                const lotes: { fechaCaducidad: string }[] = (prod as any).lotes ?? [];
                const caducidadMostrar = proximaCaducidad
                  ? new Date(proximaCaducidad).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : lotes.length > 1 ? 'Múltiples'
                  : lotes.length === 1 ? new Date(lotes[0].fechaCaducidad).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : null;
                const caducidadProxima = caducidadMostrar && caducidadMostrar !== 'Múltiples'
                  ? (proximaCaducidad ? new Date(proximaCaducidad) : lotes.length === 1 ? new Date(lotes[0].fechaCaducidad) : null)
                  : null;
                const diasParaCaducidad = caducidadProxima ? Math.ceil((caducidadProxima.getTime() - Date.now()) / 86400000) : null;
                return (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.5rem 1.5rem' }}>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>{prod.codigo}</span>
                    </td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '15px' }}>{prod.nombre}</div>
                      {prod.descripcion && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '0.2rem' }}>{prod.descripcion}</div>}
                    </td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '10px' }}>{prod.categoria}</span>
                    </td>
                    <td style={{ padding: '1.5rem 1rem' }}>
                      {prod.ubicacion ? (
                        <span style={{ fontSize: '13px', color: '#374151', background: '#F0FDF4', padding: '0.3rem 0.7rem', borderRadius: '8px', fontWeight: '500' }}>{prod.ubicacion}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '18px' }}>{prod.stockActual}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>{prod.unidad || 'UDS'}</div>
                      <div style={{ fontSize: '11px', color: prod.stockActual <= prod.stockMinimo ? '#DC2626' : '#94a3b8', marginTop: 1 }}>mín: {prod.stockMinimo}</div>
                    </td>
                    <td style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                      {caducidadMostrar ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: diasParaCaducidad !== null && diasParaCaducidad <= 30 ? '#DC2626' : diasParaCaducidad !== null && diasParaCaducidad <= 90 ? '#CA8A04' : '#374151' }}>
                            {caducidadMostrar}
                          </span>
                          {diasParaCaducidad !== null && diasParaCaducidad <= 90 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'white', background: diasParaCaducidad <= 30 ? '#DC2626' : '#CA8A04', borderRadius: 5, padding: '1px 6px' }}>
                              {diasParaCaducidad <= 0 ? 'VENCIDO' : `${diasParaCaducidad}d`}
                            </span>
                          )}
                          {caducidadMostrar === 'Múltiples' && (
                            <span style={{ fontSize: 10, color: '#6366F1' }}>ver kardex</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1.5rem 1.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '11px', fontWeight: '800',
                        backgroundColor: prod.estadoStock === 'NORMAL' ? '#dcfce7' : prod.estadoStock === 'BAJO' ? '#fef3c7' : '#fee2e2',
                        color: prod.estadoStock === 'NORMAL' ? '#166534' : prod.estadoStock === 'BAJO' ? '#92400e' : '#991b1b',
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                        {prod.estadoStock}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
                ) : movimientosData?.map((mov) => {
                  const recBadge = mov.estadoRecepcion ? RECEPCION_BADGE[mov.estadoRecepcion] : null;
                  const salBadge = mov.estadoSalida ? SALIDA_BADGE[mov.estadoSalida] : null;
                  const cr = mov.contraRecibo;
                  return (
                    <tr key={mov.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#374151' }}>{cr.folio}</span>
                            <EstadoBadge badge={CR_BADGE[cr.estado] ?? CR_BADGE.PENDIENTE} />
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

        /* ── CONTRA-RECIBOS ── */
        ) : (
          <div>
            {isLoadingCR ? (
              <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
                <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                <span style={{ fontSize: 15 }}>Cargando contra-recibos...</span>
              </div>
            ) : !contraRecibosData || contraRecibosData.length === 0 ? (
              <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
                <FileText size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>Sin contra-recibos</p>
                <p style={{ margin: '6px 0 0', fontSize: 14 }}>No hay contra-recibos generados aún.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 800 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['Folio', 'Fecha', 'Producto', 'Proveedor', 'Factura', 'Importe', 'Estado', 'Acciones'].map((h, i) => (
                        <th key={i} style={{ padding: '1.1rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contraRecibosData.map((cr, idx) => {
                      const badge = CR_BADGE[cr.estado] ?? CR_BADGE.PENDIENTE;
                      return (
                        <tr key={cr.id} style={{ borderBottom: idx < contraRecibosData.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '1.25rem 1.25rem' }}>
                            <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#475569' }}>{cr.folio}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{new Date(cr.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(cr.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{cr.movimiento?.producto?.nombre ?? '—'}</div>
                            {cr.movimiento && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Cant: {cr.movimiento.cantidad}</div>}
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem' }}>
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{cr.proveedor}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>{cr.numeroFactura}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>${Number(cr.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem' }}>
                            <EstadoBadge badge={badge} />
                          </td>
                          <td style={{ padding: '1.25rem 1.25rem' }}>
                            <button onClick={() => abrirPDF(cr.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              <FileText size={14} /> Ver PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL NUEVO PRODUCTO / MOVIMIENTO ── */}
      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.78)', zIndex: 999999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backdropFilter: 'blur(3px)', overflowY: 'auto', padding: '32px 16px' }}>
          <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: showModal === 'NUEVO_MOVIMIENTO' ? 'min(95vw, 1080px)' : '560px', overflowY: 'visible', boxShadow: '0 25px 60px rgba(0,0,0,0.28)', border: '1px solid #E8ECF0', margin: 'auto' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-h)' }}>
              {showModal === 'NUEVO_PRODUCTO' ? 'Registrar Producto al Catálogo' : 'Registrar Movimiento de Almacén'}
            </h2>

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!(movimientoData.tipo === 'ENTRADA' && movimientoData.requisicionId && productosDeRequisicion.length > 0) && (
                  <select value={movimientoData.productoId} onChange={e => setMovimientoData({ ...movimientoData, productoId: e.target.value })} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="">Seleccione Producto...</option>
                    {productosData?.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} (Disponibles: {p.stockActual})</option>
                    ))}
                  </select>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select value={movimientoData.tipo} onChange={e => setMovimientoData({ ...movimientoData, tipo: e.target.value, requisicionId: '' })} style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="SALIDA">Salida (-)</option>
                  </select>
                  {!(movimientoData.tipo === 'ENTRADA' && movimientoData.requisicionId && productosDeRequisicion.length > 0) && (
                    <input type="number" value={movimientoData.cantidad} onChange={e => setMovimientoData({ ...movimientoData, cantidad: parseInt(e.target.value) || 1 })} style={{ width: '100px', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  )}
                </div>

                {/* Campos específicos ENTRADA */}
                {movimientoData.tipo === 'ENTRADA' && (
                  <div style={{ border: '1px solid #BFDBFE', borderRadius: 14, padding: 16, background: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 2 }}>Recepción de mercancía</div>

                    {/* Requisición asociada */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>Requisición / Orden de compra asociada (opcional)</span>
                      <select value={movimientoData.requisicionId} onChange={e => setMovimientoData({ ...movimientoData, requisicionId: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BFDBFE', outline: 'none', fontSize: 14, background: 'white' }}>
                        <option value="">Sin requisición asociada</option>
                        {requisiciones
                          .filter(r => ['AUTORIZADA', 'NEGOCIACION_COMPLETADA', 'ORDEN_GENERADA', 'FACTURAS_RECIBIDAS', 'ORDEN_PAGO_GENERADA', 'PAGO_GENERADO', 'FINALIZADO'].includes(r.estado))
                          .map(r => (
                            <option key={r.id} value={r.id}>{r.folio} — {r.areaSolicitante} — {r.descripcion.slice(0, 40)}</option>
                          ))
                        }
                      </select>

                      {/* Tabla de validación multi-producto */}
                      {productosDeRequisicion.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E3A5F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Validación de recepción — {productosDeRequisicion.length} producto{productosDeRequisicion.length !== 1 ? 's' : ''}
                            </div>
                            {productosDeRequisicion.every(d => d.productoMatch) && (
                              <span style={{ fontSize: 11, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                                ✓ Todos en catálogo
                              </span>
                            )}
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                            <colgroup>
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '8%' }} />
                              <col style={{ width: '8%' }} />
                              <col style={{ width: '12%' }} />
                              <col style={{ width: '13%' }} />
                              <col style={{ width: '12%' }} />
                              <col style={{ width: '29%' }} />
                            </colgroup>
                            <thead>
                              <tr style={{ background: '#DBEAFE', borderRadius: 8 }}>
                                {['Producto', 'Solic.', 'Recib.', 'Estado', 'Lote', 'Caducidad', 'Observaciones'].map((h, i) => (
                                  <th key={i} style={{ padding: '8px 8px', textAlign: 'left', fontWeight: 700, color: '#1E3A5F', borderBottom: '2px solid #BFDBFE', fontSize: 11 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {productosDeRequisicion.map((det, idx) => {
                                const edit = recepcionEditada[det.id] ?? { cantidadRecibida: det.cantidad, estado: 'CORRECTO', observaciones: '', lote: '', fechaCaducidad: '' };
                                const estadoColors: Record<string, { bg: string; text: string; border: string }> = {
                                  CORRECTO:   { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
                                  INCOMPLETO: { bg: '#FEFCE8', text: '#CA8A04', border: '#FDE68A' },
                                  EXCEDENTE:  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
                                  RECHAZADO:  { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
                                };
                                const ec = estadoColors[edit.estado] ?? estadoColors.CORRECTO;
                                const rowBg = !det.productoMatch ? '#FFF7ED' : idx % 2 === 0 ? '#F8FAFF' : 'white';
                                return (
                                  <tr key={det.id} style={{ background: rowBg, borderBottom: '1px solid #E0EAFF' }}>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                      <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 12, lineHeight: 1.3 }}>{det.producto}</div>
                                      <div style={{ fontSize: 10, color: '#64748B' }}>{det.unidad}</div>
                                      {det.productoMatch
                                        ? <div style={{ fontSize: 10, color: '#15803D', fontFamily: 'monospace' }}>{det.productoMatch.codigo}</div>
                                        : <button type="button" onClick={() => autoCrearProducto.mutate({ nombre: det.producto, categoria: 'OTRO', unidad: det.unidad })} disabled={autoCrearProducto.isPending} style={{ marginTop: 3, padding: '2px 6px', borderRadius: 5, background: '#B45309', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                                            {autoCrearProducto.isPending ? '...' : '+ Crear'}
                                          </button>
                                      }
                                    </td>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: 13 }}>
                                      {det.cantidad}
                                    </td>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                      <input type="number" min={0} value={edit.cantidadRecibida}
                                        onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, cantidadRecibida: Number(e.target.value) || 0 } }))}
                                        style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 12, textAlign: 'center', fontWeight: 700 }}
                                      />
                                    </td>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                      <select value={edit.estado}
                                        onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, estado: e.target.value } }))}
                                        style={{ width: '100%', padding: '4px 5px', borderRadius: 6, border: `1px solid ${ec.border}`, background: ec.bg, color: ec.text, fontWeight: 700, fontSize: 11, outline: 'none' }}
                                      >
                                        <option value="CORRECTO">Correcto</option>
                                        <option value="INCOMPLETO">Incompleto</option>
                                        <option value="EXCEDENTE">Excedente</option>
                                        <option value="RECHAZADO">Rechazado</option>
                                      </select>
                                    </td>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                      <input type="text" placeholder="Ej: DZ-01"
                                        value={edit.lote}
                                        onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, lote: e.target.value } }))}
                                        style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 11, fontFamily: 'monospace' }}
                                      />
                                    </td>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                      <input type="date"
                                        value={edit.fechaCaducidad}
                                        onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, fechaCaducidad: e.target.value } }))}
                                        style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 11 }}
                                      />
                                    </td>
                                    <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                      <input type="text" placeholder="Observaciones..."
                                        value={edit.observaciones}
                                        onChange={e => setRecepcionEditada(prev => ({ ...prev, [det.id]: { ...edit, observaciones: e.target.value } }))}
                                        style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #BFDBFE', outline: 'none', fontSize: 11 }}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {productosDeRequisicion.some(d => !d.productoMatch) && (
                            <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 11, color: '#92400E', display: 'flex', gap: 6, alignItems: 'center' }}>
                              <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                              Algunos productos no están en el catálogo. Usa el botón "+ Crear" en cada fila antes de registrar.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Datos del proveedor y factura */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input type="text" placeholder="Proveedor *" value={movimientoData.proveedor} onChange={e => setMovimientoData({ ...movimientoData, proveedor: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BFDBFE', outline: 'none', fontSize: 14 }} />
                      <input type="text" placeholder="Núm. Factura *" value={movimientoData.numeroFactura} onChange={e => setMovimientoData({ ...movimientoData, numeroFactura: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BFDBFE', outline: 'none', fontSize: 14 }} />
                      <input type="number" placeholder="Importe factura ($) *" value={movimientoData.importeFactura} onChange={e => setMovimientoData({ ...movimientoData, importeFactura: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BFDBFE', outline: 'none', fontSize: 14 }} />
                      {/* Fecha de caducidad global solo para entrada sin requisición */}
                      {!(movimientoData.requisicionId && productosDeRequisicion.length > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#1D4ED8' }}>Fecha de caducidad</label>
                          <input type="date" value={movimientoData.fechaCaducidad} onChange={e => setMovimientoData({ ...movimientoData, fechaCaducidad: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BFDBFE', outline: 'none', fontSize: 14 }} />
                        </div>
                      )}
                    </div>

                    {/* Estado de recepción */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>Estado de recepción</span>
                      <select value={movimientoData.estadoRecepcion} onChange={e => setMovimientoData({ ...movimientoData, estadoRecepcion: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BFDBFE', outline: 'none', fontSize: 14, background: 'white' }}>
                        <option value="PENDIENTE">Pendiente de revisión — se validará en el Kardex</option>
                        <option value="ACEPTADO">Aceptado — ingresa al inventario de inmediato</option>
                      </select>
                      {movimientoData.estadoRecepcion === 'ACEPTADO' && (
                        <span style={{ fontSize: 11, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 8px' }}>
                          El stock del producto se actualizará al registrar este movimiento.
                        </span>
                      )}
                      {movimientoData.estadoRecepcion === 'PENDIENTE' && (
                        <span style={{ fontSize: 11, color: '#CA8A04', background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 8px' }}>
                          Quedará en espera. Desde el Kardex podrá aceptar o rechazar la recepción.
                        </span>
                      )}
                    </div>

                    {/* Inspección visual */}
                    <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>Inspección visual de mercancía</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>Verifique cada punto antes de registrar. Todos son obligatorios para aceptar la mercancía.</span>
                      {[
                        { key: 'empaqueCorrecto', label: 'Empaque en buen estado y correcto' },
                        { key: 'cantidadCorrecta', label: 'Cantidad coincide con factura/orden' },
                        { key: 'presentacionCorrecta', label: 'Presentación conforme a especificaciones' },
                      ].map(({ key, label }) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', padding: '2px 0' }}>
                          <input
                            type="checkbox"
                            checked={movimientoData[key as keyof typeof movimientoData] as boolean}
                            onChange={e => setMovimientoData({ ...movimientoData, [key]: e.target.checked })}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <span style={{ color: (movimientoData[key as keyof typeof movimientoData] as boolean) ? '#15803D' : '#6B7280' }}>{label}</span>
                          {!(movimientoData[key as keyof typeof movimientoData] as boolean) && (
                            <span style={{ color: '#DC2626', fontSize: 11, fontWeight: 600, marginLeft: 'auto' }}>
                              <AlertTriangle size={10} style={{ display: 'inline', marginRight: 2 }} />No verificado
                            </span>
                          )}
                        </label>
                      ))}
                    </div>

                    {/* Norma operativa */}
                    <div style={{ fontSize: 11, color: '#1E40AF', padding: '8px 12px', background: '#DBEAFE', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                      <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                      <span><strong>Norma operativa:</strong> Recepción de mercancías únicamente los <strong>jueves de 9:00 a 14:00 h</strong>.</span>
                    </div>
                  </div>
                )}

                {/* Campos específicos SALIDA */}
                {movimientoData.tipo === 'SALIDA' && (
                  <div style={{ border: '1px solid #BBF7D0', borderRadius: 14, padding: 16, background: '#F0FDF4', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 2 }}>Datos de salida</div>
                    <select
                      value={movimientoData.areaSolicitante}
                      onChange={e => setMovimientoData({ ...movimientoData, areaSolicitante: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BBF7D0', outline: 'none', fontSize: 14, background: 'white', fontFamily: 'inherit', color: movimientoData.areaSolicitante ? '#111827' : '#6B7280' }}
                    >
                      <option value="">Selecciona un área</option>
                      <option value="Dirección General">Dirección General</option>
                      <option value="Unidad de Transparencia">Unidad de Transparencia</option>
                      <option value="Departamento Clínico">Departamento Clínico</option>
                      <option value="Departamento Médico">Departamento Médico</option>
                      <option value="Departamento de Admisiones">Departamento de Admisiones</option>
                      <option value="Departamento de Administración">Departamento de Administración</option>
                      <option value="Oficina de Recursos Materiales">Oficina de Recursos Materiales</option>
                    </select>
                    <input type="text" placeholder="Motivo / descripción" value={movimientoData.motivo} onChange={e => setMovimientoData({ ...movimientoData, motivo: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BBF7D0', outline: 'none', fontSize: 14 }} />
                    <input type="text" placeholder="Nombre de quien recibe" value={movimientoData.nombreRecibe} onChange={e => setMovimientoData({ ...movimientoData, nombreRecibe: e.target.value })} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #BBF7D0', outline: 'none', fontSize: 14 }} />
                  </div>
                )}

                <textarea
                  placeholder="Observaciones (opcional)"
                  value={movimientoData.observaciones}
                  onChange={e => setMovimientoData({ ...movimientoData, observaciones: e.target.value })}
                  rows={2}
                  style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowModal(null)} style={{ flex: 1, padding: '1rem', borderRadius: '18px', border: '1px solid #e2e8f0', fontWeight: '700', color: '#64748b', background: 'white', cursor: 'pointer' }}>Cerrar</button>
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
                style={{ flex: 1, padding: '1rem', borderRadius: '18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '800', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', cursor: 'pointer', opacity: (crearProducto.isPending || registrarMovimiento.isPending || isSubmittingMultiple) ? 0.7 : 1 }}
              >
                {(crearProducto.isPending || registrarMovimiento.isPending || isSubmittingMultiple) ? 'Procesando...' : 'Confirmar Registro'}
              </button>
            </div>
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
      {notif && <Notif msg={notif} onClose={() => setNotif(null)} />}
    </div>
  );
}