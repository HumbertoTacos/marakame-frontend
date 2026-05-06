import { useState, useRef } from 'react';
import {
  ShoppingCart, Plus, FileText, BarChart2, Upload,
  CheckCircle, XCircle, Clock, ChevronRight, Package,
  TrendingUp, AlertTriangle, DollarSign, Eye, X,
  Building2, Receipt, CreditCard, Clipboard, Send,
  Star, ArrowRight, Bell, Filter, Search, Download
} from 'lucide-react';
import { useCompras } from '../../hooks/useCompras';
import { useAuthStore } from '../../stores/authStore';
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
  ADMIN_GENERAL:  ['crear', 'revisar', 'cotizar', 'negociar', 'admin', 'autorizar', 'ordenar', 'facturas', 'pago'],
  RRHH_FINANZAS:  ['admin', 'autorizar', 'facturas', 'pago'],
  ALMACEN:        ['crear', 'cotizar'],
  AREA_MEDICA:    ['crear'],
  ENFERMERIA:     ['crear'],
  NUTRICION:      ['crear'],
  PSICOLOGIA:     ['crear'],
  ADMISIONES:     ['crear'],
} as const;

type RolKey = keyof typeof PERMISOS;

const puedeHacer = (rol: string | undefined, accion: string): boolean => {
  if (!rol) return false;
  const perms = PERMISOS[rol as RolKey] as readonly string[] | undefined;
  return perms?.includes(accion) ?? false;
};

// ─────────────────────────────────────────────
// COLORES DE ESTADO (tonos refinados)
// ─────────────────────────────────────────────
const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  REQUISICION_CREADA:        { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', icon: <Clipboard size={12}/> },
  REQUISICION_REVISADA:      { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', icon: <Eye size={12}/> },
  COTIZACIONES_CARGADAS:     { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316', icon: <FileText size={12}/> },
  PROVEEDOR_SELECCIONADO:    { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6', icon: <Building2 size={12}/> },
  NEGOCIACION_COMPLETADA:    { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', icon: <TrendingUp size={12}/> },
  EN_REVISION_ADMIN:         { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', icon: <Clock size={12}/> },
  EN_AUTORIZACION_DIRECCION: { bg: '#FFF1F2', text: '#9F1239', dot: '#F43F5E', icon: <AlertTriangle size={12}/> },
  AUTORIZADA:                { bg: '#F0FDF4', text: '#166534', dot: '#22C55E', icon: <CheckCircle size={12}/> },
  ORDEN_GENERADA:            { bg: '#EFF6FF', text: '#1E40AF', dot: '#2563EB', icon: <Package size={12}/> },
  FACTURAS_RECIBIDAS:        { bg: '#F5F3FF', text: '#5B21B6', dot: '#7C3AED', icon: <Receipt size={12}/> },
  PAGO_GENERADO:             { bg: '#ECFDF5', text: '#14532D', dot: '#16A34A', icon: <CreditCard size={12}/> },
  FINALIZADO:                { bg: '#F0FDF4', text: '#15803D', dot: '#15803D', icon: <CheckCircle size={12}/> },
  RECHAZADO:                 { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', icon: <XCircle size={12}/> },
};

// ─────────────────────────────────────────────
// BADGE DE ESTADO
// ─────────────────────────────────────────────
const EstadoBadge = ({ estado }: { estado: EstadoCompra }) => {
  const ui = getEstadoCompraUI(estado);
  const style = ESTADO_STYLES[estado] ?? { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', icon: null };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: style.bg, color: style.text,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      letterSpacing: '0.01em'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, display: 'inline-block' }} />
      {style.icon}
      {ui.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// DASHBOARD CARDS
// ─────────────────────────────────────────────
const DashboardCards = ({ requisiciones }: { requisiciones: Requisicion[] }) => {
  const total = requisiciones.length;
  const pendientes = requisiciones.filter(r =>
    ['REQUISICION_CREADA','REQUISICION_REVISADA','COTIZACIONES_CARGADAS','PROVEEDOR_SELECCIONADO','NEGOCIACION_COMPLETADA','EN_REVISION_ADMIN','EN_AUTORIZACION_DIRECCION'].includes(r.estado)
  ).length;
  const autorizadas = requisiciones.filter(r => r.estado === 'AUTORIZADA').length;
  const finalizadas = requisiciones.filter(r => r.estado === 'FINALIZADO').length;
  const rechazadas  = requisiciones.filter(r => r.estado === 'RECHAZADO').length;
  const montoTotal  = requisiciones.reduce((s, r) => s + (r.presupuestoEstimado ?? 0), 0);

  const cards = [
    { label: 'Total requisiciones', value: total,     icon: <ShoppingCart size={20}/>, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'En proceso',          value: pendientes, icon: <Clock size={20}/>,        color: '#D97706', bg: '#FFFBEB' },
    { label: 'Autorizadas',         value: autorizadas,icon: <CheckCircle size={20}/>,  color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Finalizadas',         value: finalizadas,icon: <Star size={20}/>,         color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Rechazadas',          value: rechazadas, icon: <XCircle size={20}/>,      color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Presupuesto total',   value: `$${montoTotal.toLocaleString('es-MX')}`, icon: <DollarSign size={20}/>, color: '#0891B2', bg: '#ECFEFF' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 12, padding: '16px 18px',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{c.label}</span>
            <span style={{ background: c.bg, color: c.color, borderRadius: 8, padding: '4px 6px', display: 'flex' }}>
              {c.icon}
            </span>
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// TABLA DE COTIZACIONES
// ─────────────────────────────────────────────
const TablaCotizaciones = ({
  cotizaciones,
  seleccionada,
  onSelect
}: {
  cotizaciones: Cotizacion[];
  seleccionada: Cotizacion | null;
  onSelect: (c: Cotizacion) => void;
}) => (
  <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 12 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#F8FAFC' }}>
          {['', 'Proveedor', 'Precio', 'Entrega', 'Mejor opción'].map((h, i) => (
            <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cotizaciones.map((c) => (
          <tr
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              cursor: 'pointer',
              background: seleccionada?.id === c.id ? '#EFF6FF' : 'white',
              borderLeft: seleccionada?.id === c.id ? '3px solid #2563EB' : '3px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            <td style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
              <input type="radio" checked={seleccionada?.id === c.id} onChange={() => onSelect(c)} />
            </td>
            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}>{c.proveedor}</td>
            <td style={{ padding: '10px 14px', color: '#16A34A', fontWeight: 700, borderBottom: '1px solid #F1F5F9' }}>
              ${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </td>
            <td style={{ padding: '10px 14px', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>{c.tiempoEntrega ?? '—'}</td>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
              {c.esMejorOpcion && <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>⭐ Mejor opción</span>}
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
  children,
  onClose,
  title,
  width = 480
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  width?: number;
}) => {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(4px)',
        padding: 16
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.2s ease'
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, #FAFAFA, #F8FAFC)',
            position: 'sticky',
            top: 0,
            zIndex: 2
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: '#0F172A'
            }}
          >
            {title}
          </span>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// INPUTS REUTILIZABLES
// ─────────────────────────────────────────────
const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
    <input {...props} style={{
      padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
      fontSize: 14, color: '#0F172A', outline: 'none', transition: 'border 0.15s',
      background: '#FAFAFA'
    }} />
  </div>
);

const Textarea = ({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
    <textarea {...props} rows={3} style={{
      padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
      fontSize: 14, color: '#0F172A', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
      background: '#FAFAFA'
    }} />
  </div>
);

const Select = ({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>
    <select {...props} style={{
      padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
      fontSize: 14, color: '#0F172A', outline: 'none', background: '#FAFAFA'
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
    primary: { bg: '#2563EB', hover: '#1D4ED8', text: 'white' },
    success: { bg: '#16A34A', hover: '#15803D', text: 'white' },
    danger:  { bg: '#DC2626', hover: '#B91C1C', text: 'white' },
    ghost:   { bg: '#F1F5F9', hover: '#E2E8F0', text: '#475569' },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: disabled ? '#E2E8F0' : colors.bg,
        color: disabled ? '#94A3B8' : colors.text,
        border: 'none', borderRadius: 8, padding: '9px 16px',
        fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s'
      }}
    >
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
    background: '#0F172A', color: 'white', borderRadius: 12,
    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)', maxWidth: 340,
    animation: 'slideUp 0.2s ease'
  }}>
    <Bell size={16} color="#22C55E" />
    <span style={{ fontSize: 14 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', marginLeft: 8, display: 'flex' }}>
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

  const { requisiciones = [], isLoading, createReq, changeEstado, createCot, createOrden } = useCompras();

  const [tab, setTab]           = useState<'lista'|'dashboard'>('lista');
  const [proceso, setProceso]   = useState<Requisicion | null>(null);
  const [detalle, setDetalle] = useState<Requisicion | null>(null);
  const [ordenDetalle, setOrdenDetalle] = useState<Requisicion | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [notif, setNotif]       = useState<string | null>(null);

  const [formCot, setFormCot] = useState({ proveedor: '', precio: '', tiempoEntrega: '' });
  const [cotSeleccionada, setCotSeleccionada] = useState<Cotizacion | null>(null);
  const [formCreate, setFormCreate] = useState({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '', tipo: 'ORDINARIA' as 'ORDINARIA'|'EXTRAORDINARIA' });
  const [detalles, setDetalles] = useState([
    {
      producto: '',
      unidad: '',
      cantidad: 1
    }
  ]);
  const fileRef = useRef<HTMLInputElement>(null);
  const ordenPdfRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  };

  const descargarOrdenPDF = async () => {
    if (!ordenPdfRef.current || !ordenDetalle?.ordenCompra) return;

    const canvas = await html2canvas(ordenPdfRef.current, {
      scale: 2
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(
      imgData,
      'PNG',
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save(`${ordenDetalle.ordenCompra.folio}.pdf`);
  };

  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        producto: '',
        unidad: '',
        cantidad: 1
      }
    ]);
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarDetalle = (
    index: number,
    campo: 'producto' | 'unidad' | 'cantidad',
    valor: string | number
  ) => {
    const nuevos = [...detalles];

    nuevos[index] = {
      ...nuevos[index],
      [campo]: valor
    };

    setDetalles(nuevos);
  };

  // Filtros
  const reqFiltradas = requisiciones.filter(r => {
    const coincideBusq = r.folio.toLowerCase().includes(busqueda.toLowerCase()) || r.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado ? r.estado === filtroEstado : true;
    return coincideBusq && coincideEstado;
  });

  // ─── MODAL DE PROCESO ──────────────────────
  const renderProceso = () => {
    if (!proceso) return null;
    const req = proceso;

    // REVISIÓN
    if (req.estado === 'REQUISICION_CREADA' && puedeHacer(rol, 'revisar')) {
      return (
        <Modal
          title="Nueva requisición de compra"
          onClose={() => setShowCreate(false)}
          width={760}
        >
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14, fontSize: 13, color: '#475569' }}>
            <div><strong>Folio:</strong> {req.folio}</div>
            <div><strong>Área:</strong> {req.areaSolicitante}</div>
            <div><strong>Descripción:</strong> {req.descripcion}</div>
            <div><strong>Justificación:</strong> {req.justificacion}</div>
            <div><strong>Presupuesto estimado:</strong> ${(req.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
          </div>
          <Textarea label="Observaciones (opcional)" placeholder="Notas de revisión..." />
          <Btn icon={<CheckCircle size={15}/>} onClick={() => {
            changeEstado.mutate({ id: req.id, estado: 'REQUISICION_REVISADA' as EstadoCompra });
            setProceso(null); notify('Requisición marcada como revisada');
          }}>Aprobar revisión</Btn>
        </Modal>
      );
    }

    // COTIZACIÓN
    if (req.estado === 'REQUISICION_REVISADA' && puedeHacer(rol, 'cotizar')) {
      return (
        <Modal title="Agregar cotización" onClose={() => setProceso(null)}>
          <Input label="Proveedor" placeholder="Nombre del proveedor" value={formCot.proveedor} onChange={e => setFormCot({...formCot, proveedor: e.target.value})} />
          <Input label="Precio" type="number" placeholder="0.00" value={formCot.precio} onChange={e => setFormCot({...formCot, precio: e.target.value})} />
          <Input label="Tiempo de entrega" placeholder="Ej: 5 días hábiles" value={formCot.tiempoEntrega} onChange={e => setFormCot({...formCot, tiempoEntrega: e.target.value})} />
          {req.cotizaciones && req.cotizaciones.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', margin: 0 }}>Cotizaciones existentes</p>
              <TablaCotizaciones cotizaciones={req.cotizaciones} seleccionada={null} onSelect={() => {}} />
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon={<Plus size={15}/>} onClick={() => {
              if (!formCot.proveedor || !formCot.precio) { alert('Completa los campos'); return; }
              createCot.mutate({
                id: req.id,
                data: {
                  proveedor: formCot.proveedor,
                  precio: Number(formCot.precio),
                  tiempoEntrega: formCot.tiempoEntrega
                }
              });
              setFormCot({ proveedor: '', precio: '', tiempoEntrega: '' });
              notify('Cotización agregada');
            }}>Agregar cotización</Btn>
            <Btn variant="ghost" onClick={() => setProceso(null)}>Cerrar</Btn>
          </div>
        </Modal>
      );
    }

    // SELECCIÓN PROVEEDOR
    if (req.estado === 'COTIZACIONES_CARGADAS' && puedeHacer(rol, 'cotizar')) {
      return (
        <Modal title="Seleccionar proveedor" onClose={() => setProceso(null)} width={580}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Selecciona la mejor cotización para continuar el proceso.</p>
          <TablaCotizaciones cotizaciones={req.cotizaciones ?? []} seleccionada={cotSeleccionada} onSelect={setCotSeleccionada} />
          <Btn icon={<ArrowRight size={15}/>} disabled={!cotSeleccionada} onClick={() => {
            changeEstado.mutate({ id: req.id, estado: 'PROVEEDOR_SELECCIONADO' as EstadoCompra });
            setCotSeleccionada(null); setProceso(null); notify('Proveedor seleccionado');
          }}>Confirmar proveedor</Btn>
        </Modal>
      );
    }

    // NEGOCIACIÓN
    if (req.estado === 'PROVEEDOR_SELECCIONADO' && puedeHacer(rol, 'negociar')) {
      return (
        <Modal title="Negociación con proveedor" onClose={() => setProceso(null)}>
          <Input label="Precio final negociado" type="number" placeholder="0.00" />
          <Input label="Forma de pago" placeholder="Contado / Crédito 30 días..." />
          <Textarea label="Términos adicionales" placeholder="Notas de la negociación..." />
          <Btn icon={<TrendingUp size={15}/>} onClick={() => {
            changeEstado.mutate({ id: req.id, estado: 'NEGOCIACION_COMPLETADA' as EstadoCompra });
            setProceso(null); notify('Negociación completada');
          }}>Guardar negociación</Btn>
        </Modal>
      );
    }

    // REVISIÓN ADMIN
    if (req.estado === 'NEGOCIACION_COMPLETADA' && puedeHacer(rol, 'admin')) {
      return (
        <Modal title="Revisión administrativa" onClose={() => setProceso(null)}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            Revisa los detalles y envía la requisición a revisión administrativa.
          </p>

          <Textarea
            label="Observaciones administrativas"
            placeholder="Visto bueno..."
          />

          <Btn
            icon={<Send size={15} />}
            onClick={() => {
              changeEstado.mutate({
                id: req.id,
                estado: 'EN_REVISION_ADMIN' as EstadoCompra
              });

              setProceso(null);
              notify('Enviado a revisión administrativa');
            }}
          >
            Enviar a revisión
          </Btn>
        </Modal>
      );
    }

    // EN_REVISION_ADMIN → EN_AUTORIZACION_DIRECCION
    if (req.estado === 'EN_REVISION_ADMIN' && puedeHacer(rol, 'admin')) {
      return (
        <Modal title="En revisión admin" onClose={() => setProceso(null)}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Esta requisición está siendo revisada por administración.</p>
          <Btn icon={<ArrowRight size={15}/>} onClick={() => {
            changeEstado.mutate({ id: req.id, estado: 'EN_AUTORIZACION_DIRECCION' as EstadoCompra });
            setProceso(null); notify('Enviado a autorización de dirección');
          }}>Enviar a autorización</Btn>
        </Modal>
      );
    }

    // AUTORIZACIÓN DIRECCIÓN
    if (req.estado === 'EN_AUTORIZACION_DIRECCION' && puedeHacer(rol, 'autorizar')) {
      return (
        <Modal title="Autorización de dirección" onClose={() => setProceso(null)}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400E' }}>
            <AlertTriangle size={14} style={{ marginRight: 6 }} />
            Esta acción es irreversible. Confirma la autorización o rechazo.
          </div>
          <Textarea label="Observaciones (opcional)" placeholder="Motivo de decisión..." />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="success" icon={<CheckCircle size={15}/>} onClick={() => {
              changeEstado.mutate({ id: req.id, estado: 'AUTORIZADA' as EstadoCompra });
              setProceso(null); notify('✅ Requisición autorizada');
            }}>Autorizar</Btn>
            <Btn variant="danger" icon={<XCircle size={15}/>} onClick={() => {
              changeEstado.mutate({ id: req.id, estado: 'RECHAZADO' as EstadoCompra });
              setProceso(null); notify('Requisición rechazada');
            }}>Rechazar</Btn>
          </div>
        </Modal>
      );
    }

    // ORDEN
    if (req.estado === 'AUTORIZADA' && puedeHacer(rol, 'ordenar')) {
      const cot = req.cotizaciones?.[0];
      return (
        <Modal title="Generar orden de compra" onClose={() => setProceso(null)}>
          {cot && (
            <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 14, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: '#166534' }}>{cot.proveedor}</div>
              <div style={{ color: '#16A34A', fontSize: 20, fontWeight: 800, marginTop: 4 }}>${Number(cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              {cot.tiempoEntrega && <div style={{ color: '#64748B', marginTop: 2 }}>Entrega: {cot.tiempoEntrega}</div>}
            </div>
          )}
          <Btn icon={<Package size={15}/>} disabled={!cot} onClick={() => {
            if (!cot) return;
            createOrden.mutate({ id: req.id, data: { proveedor: cot.proveedor, total: cot.precio } });
            setProceso(null); notify('Orden de compra generada');
          }}>Confirmar y generar orden</Btn>
        </Modal>
      );
    }

    //FACTURAS
    if (req.estado === 'ORDEN_GENERADA' && puedeHacer(rol, 'facturas')) {
      return (
        <Modal title="Facturas" onClose={() => setProceso(null)}>

          {/* Facturas existentes */}
          {(req as any).facturas?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Facturas subidas
              </p>

              {(req as any).facturas.map((f: any) => (
                <a
                  key={f.id}
                  href={`${import.meta.env.VITE_API_URL}${f.documentoUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    color: '#2563EB',
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}
                >
                  <Receipt size={14} /> {f.numero}
                </a>
              ))}
            </div>
          )}

          {/* Subir nueva */}
          <div
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: 10,
              padding: 28,
              textAlign: 'center',
              cursor: 'pointer',
              background: '#FAFAFA'
            }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={28} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
              Haz clic para subir XML / PDF
            </p>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: 12 }}>
              Máx. 10 MB
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.xml"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              await subirFactura(req.id, file);
              notify('✅ Factura subida correctamente');
            }}
          />

          <button
            onClick={() => {
              changeEstado.mutate({
                id: req.id,
                estado: 'FACTURAS_RECIBIDAS' as EstadoCompra
              });
              setProceso(null);
              notify('Facturas registradas');
            }}
          >
            Confirmar recepción de facturas
          </button>
        </Modal>
      );
    }

    // PAGO
    if (req.estado === 'FACTURAS_RECIBIDAS' && puedeHacer(rol, 'pago')) {
      return (
        <Modal title="Generar pago" onClose={() => setProceso(null)}>
          <Input label="Fecha de pago" type="date" />
          <Input label="Referencia bancaria" placeholder="Número de transferencia..." />
          <Btn icon={<CreditCard size={15}/>} onClick={() => {
            changeEstado.mutate({ id: req.id, estado: 'PAGO_GENERADO' as EstadoCompra });
            setProceso(null); notify('Pago registrado correctamente');
          }}>Registrar pago</Btn>
        </Modal>
      );
    }

    // FINALIZAR
    if (req.estado === 'PAGO_GENERADO' && puedeHacer(rol, 'pago')) {
      return (
        <Modal title="Finalizar proceso" onClose={() => setProceso(null)}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 14, fontSize: 13, color: '#166534', textAlign: 'center' }}>
            <CheckCircle size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
            Todo el proceso está completo. ¿Deseas marcar esta requisición como finalizada?
          </div>
          <Btn variant="success" icon={<Star size={15}/>} onClick={() => {
            changeEstado.mutate({ id: req.id, estado: 'FINALIZADO' as EstadoCompra });
            setProceso(null); notify('🎉 Requisición finalizada exitosamente');
          }}>Finalizar requisición</Btn>
        </Modal>
      );
    }

    // Sin acción disponible
    return (
      <Modal title={`Requisición ${req.folio}`} onClose={() => setProceso(null)}>
        <EstadoBadge estado={req.estado} />
        <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
          {req.estado === 'RECHAZADO' ? 'Esta requisición fue rechazada.' :
           req.estado === 'FINALIZADO' ? 'Esta requisición está finalizada.' :
           'No tienes permisos para continuar este paso o el proceso ya avanzó.'}
        </p>
        <Btn variant="ghost" onClick={() => setProceso(null)}>Cerrar</Btn>
      </Modal>
    );
  };

  const renderDetalle = () => {
    if (!detalle) return null;

    return (
      <Modal
        title={`Resumen ${detalle.folio}`}
        onClose={() => setDetalle(null)}
        width={700}
      >

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16
          }}
        >

          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 10,
              padding: 14
            }}
          >
            <p><strong>Área:</strong> {detalle.areaSolicitante}</p>

            <p><strong>Tipo:</strong> {detalle.tipo}</p>

            <p>
              <strong>Estado:</strong>{' '}
              {getEstadoCompraUI(detalle.estado).label}
            </p>

            <p>
              <strong>Presupuesto:</strong>{' '}
              ${detalle.presupuestoEstimado?.toLocaleString('es-MX')}
            </p>
          </div>

          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 10,
              padding: 14
            }}
          >

            <p>
              <strong>Solicitante:</strong>{' '}
              {detalle.usuario?.nombre} {detalle.usuario?.apellidos}
            </p>

            <p>
              <strong>Fecha:</strong>{' '}
              {detalle.createdAt
                ? new Date(detalle.createdAt).toLocaleString('es-MX')
                : 'Sin fecha'}
            </p>

            <p>
              <strong>Cotizaciones:</strong>{' '}
              {detalle.cotizaciones?.length ?? 0}
            </p>

          </div>

        </div>

        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 10,
            padding: 14
          }}
        >
          <p
            style={{
              marginTop: 0,
              fontWeight: 700,
              color: '#0F172A'
            }}
          >
            Descripción
          </p>

          <p
            style={{
              marginBottom: 0,
              color: '#475569',
              lineHeight: 1.6
            }}
          >
            {detalle.descripcion}
          </p>
        </div>

        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 10,
            padding: 14
          }}
        >
          <p
            style={{
              marginTop: 0,
              fontWeight: 700,
              color: '#0F172A'
            }}
          >
            Justificación
          </p>

          <p
            style={{
              marginBottom: 0,
              color: '#475569',
              lineHeight: 1.6
            }}
          >
            {detalle.justificacion}
          </p>
        </div>

        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 10,
            padding: 14
          }}
        >
          <p
            style={{
              marginTop: 0,
              fontWeight: 700,
              color: '#0F172A'
            }}
          >
            Artículos solicitados
          </p>

          <div
            style={{
              overflowX: 'auto'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#E2E8F0'
                  }}
                >
                  <th style={{ padding: 10 }}>#</th>
                  <th style={{ padding: 10 }}>Producto</th>
                  <th style={{ padding: 10 }}>Unidad</th>
                  <th style={{ padding: 10 }}>Cantidad</th>
                </tr>
              </thead>

              <tbody>
                {detalle.detalles?.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {d.numero}
                    </td>

                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {d.producto}
                    </td>

                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {d.unidad}
                    </td>

                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {d.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 6
          }}
        >
          <button
            onClick={() => setDetalle(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: 'white',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={15} />
            Cerrar
          </button>
        </div>

      </Modal>
    );
  };

  const renderOrden = () => {
    if (!ordenDetalle?.ordenCompra) return null;

    const orden = ordenDetalle.ordenCompra;

    return (
      <Modal
        title={`Orden de compra ${orden.folio}`}
        onClose={() => setOrdenDetalle(null)}
        width={760}
      >

        <div
          ref={ordenPdfRef}
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: 24,
            background: 'white'
          }}
        >

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 24
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  color: '#0F172A'
                }}
              >
                Orden de Compra
              </h2>

              <p style={{ color: '#64748B', marginTop: 4 }}>
                <strong>Folio:</strong> {orden.folio}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <strong>Fecha:</strong>

              <span>
                {orden.fecha
                  ? new Date(orden.fecha).toLocaleDateString('es-MX')
                  : 'Sin fecha'}
              </span>
            </div>
          </div>

          {/* Datos proveedor */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 10,
              padding: 16,
              marginBottom: 20
            }}
          >
            <p><strong>Proveedor o razón social:</strong> {orden.proveedor}</p>

            <p>
              <strong>Total:</strong>{' '}
              ${orden.total.toLocaleString('es-MX')}
            </p>
          </div>

          {/* Justificación */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 10,
              padding: 16,
              marginBottom: 20
            }}
          >
            <p
              style={{
                marginTop: 0,
                fontWeight: 700,
                color: '#0F172A'
              }}
            >
              Justificación
            </p>

            <p
              style={{
                marginBottom: 0,
                color: '#475569',
                lineHeight: 1.6
              }}
            >
              {ordenDetalle.justificacion}
            </p>
          </div>

          {/* Tabla artículos */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr style={{ background: '#E2E8F0' }}>
                <th style={{ padding: 10, textAlign: 'center' }}>#</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Producto</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Unidad</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Cantidad</th>
              </tr>
            </thead>

            <tbody>
              {ordenDetalle.detalles?.map((d, index) => (
                <tr key={index}>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    {index + 1}
                  </td>

                  <td style={{ padding: 10, textAlign: 'center' }}>
                    {d.producto}
                  </td>

                  <td style={{ padding: 10, textAlign: 'center' }}>
                    {d.unidad}
                  </td>

                  <td style={{ padding: 10, textAlign: 'center' }}>
                    {d.cantidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Firmas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 20,
              marginTop: 60
            }}
          >

            {/* Elaboró */}
            <div>
              <div
                style={{
                  borderTop: '1px solid #CBD5E1',
                  paddingTop: 10,
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0F172A'
                  }}
                >
                  {orden.elaboradoPor?.nombre} {orden.elaboradoPor?.apellidos}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: '#64748B',
                    fontSize: 13
                  }}
                >
                  Elaboró
                </div>
              </div>
            </div>

            {/* Revisó */}
            <div>
              <div
                style={{
                  borderTop: '1px solid #CBD5E1',
                  paddingTop: 10,
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0F172A'
                  }}
                >
                  {orden.revisadoPor?.nombre} {orden.revisadoPor?.apellidos}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: '#64748B',
                    fontSize: 13
                  }}
                >
                  Revisó
                </div>
              </div>
            </div>

            {/* Autorizó */}
            <div>
              <div
                style={{
                  borderTop: '1px solid #CBD5E1',
                  paddingTop: 10,
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0F172A'
                  }}
                >
                  {orden.autorizadoPor?.nombre} {orden.autorizadoPor?.apellidos}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: '#64748B',
                    fontSize: 13
                  }}
                >
                  Autorizó
                </div>
              </div>
            </div>

          </div>

        </div>
                <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 20
          }}
        >
          <button
            onClick={descargarOrdenPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#DC2626',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={16} />
            Descargar PDF
          </button>
        </div>
      </Modal>
    );
  };

  // ─── MODAL CREAR ────────────────────────────
  const renderCreate = () => {
    if (!showCreate) return null;
    return (
      <Modal title="Nueva requisición de compra" onClose={() => setShowCreate(false)} width={520}>
        <Input label="Área solicitante" placeholder="Ej: Almacén, Médica, Cocina..." value={formCreate.areaSolicitante} onChange={e => setFormCreate({...formCreate, areaSolicitante: e.target.value})} />
        <Select label="Tipo de compra" value={formCreate.tipo} onChange={e => setFormCreate({...formCreate, tipo: e.target.value as 'ORDINARIA'|'EXTRAORDINARIA'})}>
          <option value="ORDINARIA">Ordinaria</option>
          <option value="EXTRAORDINARIA">Extraordinaria</option>
        </Select>
        <Textarea label="Descripción" placeholder="¿Qué se necesita comprar?" value={formCreate.descripcion} onChange={e => setFormCreate({...formCreate, descripcion: e.target.value})} />
        <Textarea label="Justificación" placeholder="¿Por qué es necesario?" value={formCreate.justificacion} onChange={e => setFormCreate({...formCreate, justificacion: e.target.value})} />
        <Input label="Presupuesto estimado ($)" type="number" placeholder="0.00" value={formCreate.presupuestoEstimado} onChange={e => setFormCreate({...formCreate, presupuestoEstimado: e.target.value})} />
        <div
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#0F172A'
              }}
            >
              Artículos solicitados
            </span>

            <Btn
              variant="ghost"
              icon={<Plus size={14} />}
              onClick={agregarDetalle}
            >
              Agregar artículo
            </Btn>
          </div>

          {detalles.map((detalle, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 12,
                background: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: 10,
                  alignItems: 'end'
                }}
              >
                <div style={{ gridColumn: 'span 5' }}>
                  <Input
                    label="Artículo"
                    placeholder="Ej: Cloro"
                    value={detalle.producto}
                    onChange={(e) =>
                      actualizarDetalle(index, 'producto', e.target.value)
                    }
                  />
                </div>

                <div style={{ gridColumn: 'span 3' }}>
                  <Input
                    label="Unidad"
                    placeholder="Caja"
                    value={detalle.unidad}
                    onChange={(e) =>
                      actualizarDetalle(index, 'unidad', e.target.value)
                    }
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <Input
                    label="Cantidad"
                    type="number"
                    min={1}
                    value={detalle.cantidad}
                    onChange={(e) =>
                      actualizarDetalle(
                        index,
                        'cantidad',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <button
                    type="button"
                    onClick={() => eliminarDetalle(index)}
                    style={{
                      height: 40,
                      width: '100%',
                      border: 'none',
                      borderRadius: 8,
                      background: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon={<Plus size={15}/>} onClick={() => {
            if (!formCreate.areaSolicitante || !formCreate.descripcion || !formCreate.justificacion) { alert('Completa todos los campos'); return; }
            createReq.mutate({
              ...formCreate,

              presupuestoEstimado: Number(
                formCreate.presupuestoEstimado
              ),

              detalles
            });
            setFormCreate({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '', tipo: 'ORDINARIA' });
            setDetalles([
              {
                producto: '',
                unidad: '',
                cantidad: 1
              }
            ]);
            setShowCreate(false); notify('Requisición creada exitosamente');
          }}>Crear requisición</Btn>
          <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Btn>
        </div>
      </Modal>
    );
  };

  // ─── RENDER PRINCIPAL ───────────────────────
  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh', padding: '28px 32px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ background: '#2563EB', borderRadius: 10, padding: 8, display: 'flex' }}>
                <ShoppingCart size={20} color="white" />
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Compras</h1>
            </div>
            <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
              {reqFiltradas.length} requisición{reqFiltradas.length !== 1 ? 'es' : ''} {filtroEstado ? `en estado ${filtroEstado}` : 'en total'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Tabs */}
            {(['lista', 'dashboard'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? '#0F172A' : 'white',
                color: tab === t ? 'white' : '#64748B',
                border: '1.5px solid ' + (tab === t ? '#0F172A' : '#E2E8F0'),
                borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                {t === 'lista' ? <><FileText size={14}/> Lista</> : <><BarChart2 size={14}/> Dashboard</>}
              </button>
            ))}
            {puedeHacer(rol, 'crear') && (
              <Btn icon={<Plus size={15}/>} onClick={() => setShowCreate(true)}>Nueva requisición</Btn>
            )}
          </div>
        </div>

        {/* DASHBOARD */}
        {tab === 'dashboard' && <DashboardCards requisiciones={requisiciones} />}

        {/* FILTROS */}
        {tab === 'lista' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                placeholder="Buscar por folio o descripción..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white', outline: 'none' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                style={{ padding: '9px 12px 9px 30px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Todos los estados</option>
                {Object.keys(ESTADO_STYLES).map(e => (
                  <option key={e} value={e}>{getEstadoCompraUI(e as EstadoCompra).label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* LISTA */}
        {tab === 'lista' && (
          isLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              Cargando requisiciones...
            </div>
          ) : reqFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Sin requisiciones</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Crea la primera desde el botón superior.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reqFiltradas.map(req => {
                const canContinue = req.estado !== 'FINALIZADO' && req.estado !== 'RECHAZADO';
                return (
                  <div key={req.id} style={{
                    background: 'white', borderRadius: 12, padding: '16px 20px',
                    border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'box-shadow 0.15s', gap: 16
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{req.folio}</span>
                        <EstadoBadge estado={req.estado} />
                        <span style={{
                          background: req.tipo === 'EXTRAORDINARIA' ? '#FFF1F2' : '#EFF6FF',
                          color: req.tipo === 'EXTRAORDINARIA' ? '#BE123C' : '#1D4ED8',
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12
                        }}>{req.tipo}</span>
                      </div>
                      <p style={{ margin: '0 0 2px', fontSize: 13, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.descripcion}</p>
                      <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>

                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          <Building2
                            size={11}
                            style={{ marginRight: 3, verticalAlign: 'middle' }}
                          />
                          {req.areaSolicitante}
                        </span>

                        {req.presupuestoEstimado && (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>
                            <DollarSign
                              size={11}
                              style={{ marginRight: 3, verticalAlign: 'middle' }}
                            />
                            Est. ${req.presupuestoEstimado.toLocaleString('es-MX')}
                          </span>
                        )}

                        {req.usuario && (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>
                            {req.usuario.nombre} {req.usuario.apellidos}
                          </span>
                        )}

                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          <Clock
                            size={11}
                            style={{ marginRight: 3, verticalAlign: 'middle' }}
                          />

                          {new Date(req.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}

                          {' • '}

                          {new Date(req.createdAt).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>

                      <button
                        onClick={() => setDetalle(req)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'white',
                          color: '#475569',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: 8,
                          padding: '7px 12px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14}/>
                        Detalles
                      </button>

                      {req.ordenCompra && (
                        <button
                          onClick={() => setOrdenDetalle(req)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#F0FDF4',
                            color: '#166534',
                            border: '1.5px solid #BBF7D0',
                            borderRadius: 8,
                            padding: '7px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <FileText size={14}/>
                          Ver orden
                        </button>
                      )}

                      {canContinue && (
                        <button
                          onClick={() => setProceso(req)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: '#EFF6FF', color: '#2563EB',
                            border: '1.5px solid #BFDBFE', borderRadius: 8,
                            padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Continuar <ChevronRight size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {renderCreate()}
      {renderProceso()}
      {renderDetalle()}
      {renderOrden()}
      {notif && <Notif msg={notif} onClose={() => setNotif(null)} />}
    </>
  );
}