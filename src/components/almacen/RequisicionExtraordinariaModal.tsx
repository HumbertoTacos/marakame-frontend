import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Info, ClipboardList, Loader2, Plus,
  CheckCircle2, AlertTriangle, Star, Send, ChevronUp,
  Building2, Trash2, Search, FileText,
} from 'lucide-react';
import type { RequisicionDept, RequisicionDetalleItem, CotizacionExtraordinaria, CompraRequisicionResumen, Proveedor, OrdenCompra } from '../../types';
import { enviarACompras } from '../../services/requisiciones.service';
import {
  agregarCotizacionProducto,
  seleccionarCotizacionProducto,
  enviarARevisionAdministrativa,
  eliminarCotizacion,
} from '../../services/compras.service';
import apiClient from '../../services/api';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface AddCotForm {
  open: boolean;
  proveedorId: string;
  proveedorNombre: string;
  precioUnitario: string;
  tiempoEntrega: string;
  formaPago: string;
  marca: string;
  modelo: string;
  observaciones: string;
  loading: boolean;
  error: string;
}

const emptyAddForm = (): AddCotForm => ({
  open: false, proveedorId: '', proveedorNombre: '',
  precioUnitario: '', tiempoEntrega: '', formaPago: '',
  marca: '', modelo: '', observaciones: '',
  loading: false, error: '',
});

interface Props {
  req: RequisicionDept | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: '800', color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  display: 'block', marginBottom: '0.3rem',
};

const inpStyle = (hasError = false): React.CSSProperties => ({
  width: '100%', padding: '0.55rem 0.8rem',
  border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`, borderRadius: '8px',
  fontSize: '13px', color: '#1e293b', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: 'white',
});

const badge = (color: string, bg: string, border: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: bg, color, border: `1px solid ${border}`,
  padding: '3px 9px', borderRadius: '7px',
  fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap',
});

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '0.55rem 1.1rem', borderRadius: '9px', border: 'none',
  background: active ? 'white' : 'transparent',
  color: active ? '#1e293b' : '#64748b',
  fontWeight: active ? '800' : '600',
  fontSize: '13px', cursor: 'pointer',
  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
  transition: 'all 0.18s',
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
});

// ─── Sub-modal: Seleccionar Proveedor ─────────────────────────────────────────

function SeleccionarProveedorModal({
  proveedores,
  onSelect,
  onClose,
}: {
  proveedores: Proveedor[];
  onSelect: (p: Proveedor) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const filtrados = busqueda.trim()
    ? proveedores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : proveedores;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 20000, padding: '1rem',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: 'white', borderRadius: '18px',
        width: '100%', maxWidth: '460px', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)',
      }}>
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#eff6ff', padding: '0.45rem', borderRadius: '8px' }}>
              <Building2 size={16} color="#3b82f6" />
            </div>
            <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>Seleccionar Proveedor</span>
          </div>
          <button onClick={onClose} style={{ padding: '0.35rem', borderRadius: '7px', border: '1px solid #f1f5f9', background: 'white', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '0.85rem 1.4rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '0.7rem', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              autoFocus
              placeholder="Buscar proveedor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.8rem 0.55rem 2.2rem', border: '1.5px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtrados.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Building2 size={28} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>Sin resultados</p>
            </div>
          ) : filtrados.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.8rem 1.4rem', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', borderBottom: idx < filtrados.length - 1 ? '1px solid #f1f5f9' : 'none', fontFamily: 'inherit', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={15} color="#3b82f6" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{p.nombre}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '0.85rem 1.4rem', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '0.6rem', borderRadius: '9px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Sub-modal: Selección de proveedor final ──────────────────────────────────

function SeleccionProveedorFinalModal({
  detalles,
  getCots,
  seleccionando,
  onSeleccionar,
  enviandoAdmin,
  puedeEnviar,
  onEnviarAdmin,
  onClose,
}: {
  detalles: RequisicionDetalleItem[];
  getCots: (id: number) => CotizacionExtraordinaria[];
  seleccionando: number | null;
  onSeleccionar: (cotizacionId: number) => Promise<void>;
  enviandoAdmin: boolean;
  puedeEnviar: boolean;
  onEnviarAdmin: () => void;
  onClose: () => void;
}) {
  const conSeleccion = detalles.filter(d => getCots(d.id).some(c => c.esMejorOpcion)).length;
  const total = detalles.length;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)' }}>

        {/* Encabezado */}
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#fffbeb', padding: '0.5rem', borderRadius: '9px' }}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
            </div>
            <div>
              <span style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>Seleccionar proveedor final</span>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginTop: '1px' }}>
                Elige el proveedor ganador por cada artículo
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.35rem', borderRadius: '7px', border: '1px solid #f1f5f9', background: 'white', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>

        {/* Banner de progreso */}
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: conSeleccion === total ? '#f0fdf4' : '#eff6ff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {conSeleccion === total
              ? <CheckCircle2 size={14} color="#16a34a" />
              : <AlertTriangle size={14} color="#3b82f6" />}
            <span style={{ fontSize: '13px', fontWeight: '700', color: conSeleccion === total ? '#166534' : '#1d4ed8' }}>
              {conSeleccion}/{total} artículos con proveedor seleccionado
            </span>
          </div>
        </div>

        {/* Lista de artículos */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {detalles.map(det => {
            const cots = getCots(det.id);
            const seleccionada = cots.find(c => c.esMejorOpcion);
            return (
              <div key={det.id} style={{ border: `1.5px solid ${seleccionada ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '12px', overflow: 'hidden' }}>
                {/* Encabezado artículo */}
                <div style={{ padding: '0.7rem 1rem', background: seleccionada ? '#f0fdf4' : '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', background: '#e2e8f0', padding: '2px 7px', borderRadius: '6px' }}>#{det.numero || '?'}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{det.productoNombre ?? '—'}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>({det.cantidadSolicitada} {det.unidadLibre ?? 'und.'})</span>
                  {seleccionada && (
                    <span style={{ marginLeft: 'auto', ...badge('#15803d', '#f0fdf4', '#86efac') }}>
                      <Star size={9} fill="#15803d" /> {typeof seleccionada.proveedor === 'object' ? seleccionada.proveedor.nombre : String(seleccionada.proveedor)}
                    </span>
                  )}
                </div>
                {/* Cotizaciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                  {cots.map(cot => {
                    const provNombre = typeof cot.proveedor === 'object' ? cot.proveedor.nombre : String(cot.proveedor);
                    const isElegida = cot.esMejorOpcion;
                    const cargando = seleccionando === cot.id;
                    return (
                      <div key={cot.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', border: `1.5px solid ${isElegida ? '#86efac' : '#e2e8f0'}`, borderRadius: '10px', background: isElegida ? '#f0fdf4' : 'white' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Building2 size={12} color="#64748b" />
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{provNombre}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>${Number(cot.precioUnitario ?? cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })} / und.</span>
                            {cot.tiempoEntrega && <span style={{ fontSize: '11px', color: '#64748b' }}>Entrega: {cot.tiempoEntrega}</span>}
                            {cot.formaPago && <span style={{ fontSize: '11px', color: '#64748b' }}>{cot.formaPago}</span>}
                          </div>
                        </div>
                        {isElegida ? (
                          <span style={badge('#15803d', '#f0fdf4', '#86efac')}><Star size={9} fill="#15803d" /> Elegido</span>
                        ) : (
                          <button
                            onClick={() => onSeleccionar(cot.id)}
                            disabled={!!seleccionando}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: seleccionando ? '#94a3b8' : '#1e293b', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: seleccionando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            {cargando ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={11} />}
                            Elegir
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0, background: 'white' }}>
          <button onClick={onClose} style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            Volver
          </button>
          <button
            onClick={onEnviarAdmin}
            disabled={!puedeEnviar || enviandoAdmin}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: !puedeEnviar || enviandoAdmin ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem 1.5rem', fontWeight: '700', fontSize: '13px', cursor: !puedeEnviar || enviandoAdmin ? 'not-allowed' : 'pointer' }}
          >
            {enviandoAdmin ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={14} /> Enviar a Revisión Administrativa</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RequisicionExtraordinariaModal({ req, isOpen, onClose, onRefresh }: Props) {
  const [tab, setTab] = useState<'info' | 'cotizaciones'>('info');
  const [compraReq, setCompraReq] = useState<CompraRequisicionResumen | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [errorInicio, setErrorInicio] = useState<string | null>(null);
  const [addForms, setAddForms] = useState<Record<number, AddCotForm>>({});
  const [seleccionando, setSeleccionando] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [enviandoAdmin, setEnviandoAdmin] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [provModalDetalleId, setProvModalDetalleId] = useState<number | null>(null);
  const [showSeleccionFinal, setShowSeleccionFinal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    apiClient.get('/proveedores', { params: { estado: 'ACTIVO', limit: 200 } })
      .then(res => setProveedores(res.data.data ?? []))
      .catch(() => setProveedores([]));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && req) {
      const compra = req.compraRequisicion ?? null;
      setCompraReq(compra);
      setTab('info');
      setAddForms({});
      setErrorInicio(null);
      setErrorAdmin(null);
      setExito(false);
      if (compra) {
        apiClient.get(`/compras/${compra.id}`)
          .then(res => {
            const data = res.data.data;
            setCompraReq({
              id: data.id,
              folio: data.folio,
              estado: data.estado,
              cotizaciones: data.cotizaciones ?? [],
              ordenes: data.ordenes ?? [],
            });
          })
          .catch(() => {});
      }
    }
  }, [isOpen, req?.id]);

  if (!isOpen || !req) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const refreshCompra = async (compraId: number) => {
    try {
      const res = await apiClient.get(`/compras/${compraId}`);
      const data = res.data.data;
      setCompraReq({
        id: data.id,
        folio: data.folio,
        estado: data.estado,
        cotizaciones: data.cotizaciones ?? [],
        ordenes: data.ordenes ?? [],
      });
    } catch { /* ignore */ }
  };

  const getCotsPorDetalle = (detalleId: number): CotizacionExtraordinaria[] =>
    (compraReq?.cotizaciones ?? []).filter(c => c.requisicionDetalleId === detalleId);

  const getAddForm = (detalleId: number): AddCotForm =>
    addForms[detalleId] ?? emptyAddForm();

  const setAddForm = (detalleId: number, patch: Partial<AddCotForm>) =>
    setAddForms(prev => ({ ...prev, [detalleId]: { ...getAddForm(detalleId), ...patch } }));

  const MIN_COTIZACIONES = 3;
  const esEditable = compraReq
    ? (['EN_COMPRAS', 'COTIZACIONES_CARGADAS', 'DEVUELTA_A_COMPRAS'] as string[]).includes(compraReq.estado)
    : false;

  const todosConCotizacion = (): boolean => {
    if (!compraReq || req.detalles.length === 0) return false;
    return req.detalles.every(det => getCotsPorDetalle(det.id).length >= MIN_COTIZACIONES);
  };

  const todosConSeleccion = (): boolean => {
    if (!compraReq || req.detalles.length === 0) return false;
    return req.detalles.every(det => getCotsPorDetalle(det.id).some(c => c.esMejorOpcion));
  };

  const puedePasarSeleccion = compraReq &&
    (compraReq.estado === 'COTIZACIONES_CARGADAS' || compraReq.estado === 'DEVUELTA_A_COMPRAS') &&
    todosConCotizacion();

  const puedeEnviarAdmin = compraReq &&
    (compraReq.estado === 'COTIZACIONES_CARGADAS' || compraReq.estado === 'DEVUELTA_A_COMPRAS') &&
    todosConSeleccion();

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleIniciar = async () => {
    setIniciando(true);
    setErrorInicio(null);
    try {
      const compraData = await enviarACompras(req.id);
      setCompraReq({ id: compraData.id, folio: compraData.folio, estado: compraData.estado, cotizaciones: [] });
      onRefresh();
      setTab('cotizaciones');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setErrorInicio(data?.error ?? data?.message ?? 'Error al iniciar el proceso de cotización');
    } finally {
      setIniciando(false);
    }
  };

  const handleAgregarCotizacion = async (detalle: RequisicionDetalleItem) => {
    if (!compraReq) return;
    const form = getAddForm(detalle.id);
    const provId = parseInt(form.proveedorId, 10);
    const precio = parseFloat(form.precioUnitario);

    if (!form.proveedorId || isNaN(provId)) {
      setAddForm(detalle.id, { error: 'Selecciona un proveedor' });
      return;
    }
    if (!form.precioUnitario || isNaN(precio) || precio <= 0) {
      setAddForm(detalle.id, { error: 'Ingresa un precio unitario válido mayor a 0' });
      return;
    }

    setAddForm(detalle.id, { loading: true, error: '' });
    try {
      await agregarCotizacionProducto(compraReq.id, {
        requisicionDetalleId: detalle.id,
        proveedorId: provId,
        precioUnitario: precio,
        tiempoEntrega: form.tiempoEntrega || undefined,
        formaPago: form.formaPago || undefined,
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        observaciones: form.observaciones || undefined,
      });
      await refreshCompra(compraReq.id);
      setAddForm(detalle.id, { ...emptyAddForm() });
      onRefresh();
    } catch (err: unknown) {
      const _d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setAddForm(detalle.id, { loading: false, error: _d?.error ?? _d?.message ?? 'Error al agregar cotización' });
    }
  };

  const handleSeleccionar = async (cotizacionId: number) => {
    if (!compraReq) return;
    setSeleccionando(cotizacionId);
    try {
      await seleccionarCotizacionProducto(compraReq.id, cotizacionId);
      await refreshCompra(compraReq.id);
      onRefresh();
    } catch (err: unknown) {
      const _d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setErrorAdmin(_d?.error ?? _d?.message ?? 'Error al seleccionar proveedor');
    } finally {
      setSeleccionando(null);
    }
  };

  const handleEliminarCotizacion = async (cotizacionId: number) => {
    if (!compraReq) return;
    setEliminando(cotizacionId);
    try {
      await eliminarCotizacion(compraReq.id, cotizacionId);
      await refreshCompra(compraReq.id);
      onRefresh();
    } catch (err: unknown) {
      const _d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setErrorAdmin(_d?.error ?? _d?.message ?? 'Error al eliminar cotización');
    } finally {
      setEliminando(null);
    }
  };

  const handleEnviarAdmin = async () => {
    if (!compraReq) return;
    setEnviandoAdmin(true);
    setErrorAdmin(null);
    try {
      await enviarARevisionAdministrativa(compraReq.id);
      setExito(true);
      onRefresh();
      setTimeout(() => { setExito(false); handleClose(); }, 1800);
    } catch (err: unknown) {
      const _d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setErrorAdmin(_d?.error ?? _d?.message ?? 'Error al enviar a revisión administrativa');
    } finally {
      setEnviandoAdmin(false);
    }
  };

  const handleClose = () => {
    setTab('info');
    setAddForms({});
    setCompraReq(null);
    setErrorInicio(null);
    setErrorAdmin(null);
    setExito(false);
    setProvModalDetalleId(null);
    onClose();
  };

  // ── Estado general ─────────────────────────────────────────────────────────

  const totalArts = req.detalles.length;
  const conCotizacion = compraReq ? req.detalles.filter(d => getCotsPorDetalle(d.id).length >= MIN_COTIZACIONES).length : 0;
  const conSeleccion = compraReq ? req.detalles.filter(d => getCotsPorDetalle(d.id).some(c => c.esMejorOpcion)).length : 0;

  const estadoBadge = () => {
    if (!compraReq) return <span style={badge('#b45309', '#fffbeb', '#fde68a')}>Sin proceso</span>;
    if (compraReq.estado === 'EN_COMPRAS') return <span style={badge('#1d4ed8', '#eff6ff', '#bfdbfe')}>En proceso</span>;
    if (compraReq.estado === 'COTIZACIONES_CARGADAS') return <span style={badge('#0891b2', '#ecfeff', '#a5f3fc')}>Cotizaciones cargadas</span>;
    if (compraReq.estado === 'EN_REVISION_ADMINISTRACION') return <span style={badge('#ca8a04', '#fefce8', '#fef08a')}>En revisión admin.</span>;
    if (compraReq.estado === 'DEVUELTA_A_COMPRAS') return <span style={badge('#ea580c', '#fff7ed', '#fed7aa')}>Devuelta a compras</span>;
    return <span style={badge('#64748b', '#f1f5f9', '#e2e8f0')}>{compraReq.estado}</span>;
  };

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '93vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)' }}>

          {/* ── Encabezado ── */}
          <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ background: '#fffbeb', padding: '0.6rem', borderRadius: '11px' }}>
                <ClipboardList size={19} color="#f59e0b" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>Requisición {req.folio}</h2>
                  <span style={{ background: '#fffbeb', color: '#b45309', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid #fde68a' }}>EXTRAORDINARIA</span>
                  {estadoBadge()}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
                  {req.areaSolicitante} · {new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button onClick={handleClose} style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #f1f5f9', background: 'white', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
              <X size={17} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div style={{ padding: '0.65rem 1.75rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px', gap: '0.2rem' }}>
              <button style={tabBtn(tab === 'info')} onClick={() => setTab('info')}>
                <Info size={13} /> Información General
              </button>
              <button style={tabBtn(tab === 'cotizaciones')} onClick={() => setTab('cotizaciones')}>
                <Building2 size={13} />
                Cotizaciones
                {compraReq && (
                  <span style={{ background: tab === 'cotizaciones' ? '#dbeafe' : '#e2e8f0', color: tab === 'cotizaciones' ? '#2563eb' : '#64748b', borderRadius: '100px', fontSize: '10px', fontWeight: '800', padding: '1px 7px' }}>
                    {compraReq.cotizaciones.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Contenido scrolleable ── */}
          <div style={{ overflowY: 'auto', flex: 1 }}>

            {/* ─── Tab: Información General ─────────────────────────── */}
            {tab === 'info' && (
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {([
                    ['Folio', req.folio],
                    ['Fecha', new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })],
                    ['Área Solicitante', req.areaSolicitante],
                    ['Quién Solicita', req.usuarioSolicita ? `${req.usuarioSolicita.nombre} ${req.usuarioSolicita.apellidos}` : '—'],
                    ['Estado Requisición', req.estado.replace(/_/g, ' ')],
                    ['Artículos', String(req.detalles.length)],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                      <span style={fieldLabel}>{label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{val}</span>
                    </div>
                  ))}
                </div>

                {req.justificacion && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                    <span style={fieldLabel}>Justificación</span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{req.justificacion}</p>
                  </div>
                )}

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artículos Requisitados ({req.detalles.length})</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Artículo', 'Unidad', 'Cantidad'].map((h, i) => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: i === 0 ? 'center' : 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {req.detalles.map((det, idx) => (
                        <tr key={det.id} style={{ borderBottom: idx < req.detalles.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>{det.numero || idx + 1}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{det.productoNombre ?? '—'}</span>
                            {det.observaciones && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{det.observaciones}</div>}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>{det.unidadLibre ?? '—'}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>{det.cantidadSolicitada}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {compraReq && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {[
                      { label: 'Total artículos', val: totalArts, color: '#1e293b', bg: '#f1f5f9' },
                      { label: 'Con cotizaciones', val: conCotizacion, color: '#0891b2', bg: '#ecfeff' },
                      { label: 'Sin cotizaciones', val: totalArts - conCotizacion, color: totalArts - conCotizacion > 0 ? '#b91c1c' : '#15803d', bg: totalArts - conCotizacion > 0 ? '#fef2f2' : '#f0fdf4' },
                    ].map(({ label, val, color, bg }) => (
                      <div key={label} style={{ background: bg, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '26px', fontWeight: '900', color }}>{val}</div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!compraReq && (
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '800', color: '#92400e', fontSize: '14px' }}>Proceso de cotización no iniciado</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b45309' }}>Para comenzar a registrar cotizaciones, inicia el proceso de compras extraordinaria.</p>
                    </div>
                    <button onClick={handleIniciar} disabled={iniciando} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: iniciando ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', fontWeight: '700', fontSize: '13px', cursor: iniciando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {iniciando ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Iniciando...</> : <><Plus size={14} /> Iniciar cotización</>}
                    </button>
                  </div>
                )}

                {errorInicio && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>{errorInicio}</div>
                )}

                {compraReq && (
                  <button onClick={() => setTab('cotizaciones')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.8rem', borderRadius: '12px', background: '#f59e0b', color: 'white', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                    <Building2 size={16} /> Gestionar cotizaciones por producto
                  </button>
                )}
              </div>
            )}

            {/* ─── Tab: Cotizaciones ────────────────────────────────── */}
            {tab === 'cotizaciones' && (
              <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {!compraReq && (
                  <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                    <p style={{ margin: 0, fontWeight: '700', color: '#374151', fontSize: '15px' }}>Proceso no iniciado</p>
                    <p style={{ margin: '6px 0 0.85rem', fontSize: '13px', color: '#64748b' }}>Primero inicia el proceso de cotización desde la pestaña "Información General"</p>
                    <button onClick={handleIniciar} disabled={iniciando} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: iniciando ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', fontWeight: '700', fontSize: '13px', cursor: iniciando ? 'not-allowed' : 'pointer' }}>
                      {iniciando ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Iniciando...</> : <><Plus size={14} /> Iniciar proceso</>}
                    </button>
                  </div>
                )}

                {compraReq && !esEditable && (
                  <div style={{ background: '#fefce8', border: '1.5px solid #fef08a', borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle2 size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: '800', color: '#92400e', fontSize: '14px' }}>
                        {req.estado === 'FINALIZADA' ? 'Proceso finalizado' : 'Enviado a revisión'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b45309' }}>Información general de la requisición y su seguimiento.</p>
                    </div>
                  </div>
                )}

                {compraReq && (
                  <>
                    {/* Banner de progreso — solo en modo edición */}
                    {esEditable && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: conCotizacion === totalArts && totalArts > 0 ? '#f0fdf4' : '#eff6ff', borderRadius: '12px', border: `1px solid ${conCotizacion === totalArts && totalArts > 0 ? '#bbf7d0' : '#bfdbfe'}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: conCotizacion === totalArts && totalArts > 0 ? '#166534' : '#1d4ed8' }}>
                            {conCotizacion}/{totalArts} artículos con cotizaciones registradas
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                            {conCotizacion < totalArts
                              ? 'Registra mínimo 3 cotizaciones por artículo para continuar'
                              : 'Todos los artículos tienen al menos 3 cotizaciones — puedes seleccionar el proveedor final'}
                          </div>
                        </div>
                        {conCotizacion === totalArts && totalArts > 0 && <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0 }} />}
                      </div>
                    )}

                    {/* Lista de artículos */}
                    {req.detalles.map((det) => {
                      const cots = getCotsPorDetalle(det.id);
                      const seleccionada = cots.find(c => c.esMejorOpcion);
                      const addForm = getAddForm(det.id);

                      return (
                        <div key={det.id} style={{ border: `1.5px solid ${seleccionada ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '14px', overflow: 'hidden', background: seleccionada ? '#f0fdf4' : 'white' }}>
                          {/* Encabezado artículo */}
                          <div style={{ padding: '0.85rem 1.1rem', background: seleccionada ? '#f0fdf4' : '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', background: '#e2e8f0', padding: '2px 7px', borderRadius: '6px' }}>#{det.numero || '?'}</span>
                              <div>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{det.productoNombre ?? '—'}</span>
                                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '0.5rem' }}>({det.cantidadSolicitada} {det.unidadLibre ?? 'und.'})</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {seleccionada ? (
                                <span style={badge('#15803d', '#f0fdf4', '#86efac')}>
                                  <Star size={10} fill="#15803d" /> {typeof seleccionada.proveedor === 'object' ? seleccionada.proveedor.nombre : String(seleccionada.proveedor)}
                                </span>
                              ) : (
                                <span style={badge('#b91c1c', '#fef2f2', '#fecaca')}>
                                  <AlertTriangle size={10} /> Sin selección
                                </span>
                              )}
                              <span style={{ fontSize: '11px', fontWeight: '700', color: !esEditable ? '#475569' : cots.length >= MIN_COTIZACIONES ? '#15803d' : '#b45309', background: !esEditable ? '#f1f5f9' : cots.length >= MIN_COTIZACIONES ? '#f0fdf4' : '#fffbeb', border: `1px solid ${!esEditable ? '#e2e8f0' : cots.length >= MIN_COTIZACIONES ? '#86efac' : '#fde68a'}`, padding: '2px 8px', borderRadius: '6px' }}>
                                {esEditable
                                  ? `${cots.length}/${MIN_COTIZACIONES} cotizaciones${cots.length >= MIN_COTIZACIONES ? ' ✓' : ' mín.'}`
                                  : `${cots.length} cotización${cots.length !== 1 ? 'es' : ''}`}
                              </span>
                            </div>
                          </div>

                          {/* Tabla de cotizaciones — solo registro, sin columna Estado */}
                          {cots.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  {(['Proveedor', 'P. Unitario', 'Total', 'Entrega', 'Forma Pago'] as string[]).concat(esEditable ? [''] : ['Estado']).map((h, i) => (
                                    <th key={i} style={{ padding: '0.6rem 0.85rem', textAlign: i >= 3 ? 'center' : 'left', fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {cots.map((cot, idx) => {
                                  const provNombre = typeof cot.proveedor === 'object' ? cot.proveedor.nombre : String(cot.proveedor);
                                  return (
                                    <tr key={cot.id} style={{ borderBottom: idx < cots.length - 1 ? '1px solid #f1f5f9' : 'none', background: cot.esMejorOpcion ? '#f0fdf4' : 'white' }}>
                                      <td style={{ padding: '0.75rem 0.85rem' }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          {cot.esMejorOpcion && <Star size={11} color="#16a34a" fill="#16a34a" />}
                                          {provNombre}
                                        </div>
                                        {(cot.marca || cot.modelo) && (
                                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{[cot.marca, cot.modelo].filter(Boolean).join(' · ')}</div>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>
                                        ${Number(cot.precioUnitario ?? cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', fontSize: '13px' }}>
                                        ${Number(cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                                        {cot.tiempoEntrega ?? '—'}
                                      </td>
                                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                                        {cot.formaPago ?? '—'}
                                      </td>
                                      {esEditable && (
                                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                                          <button
                                            onClick={() => handleEliminarCotizacion(cot.id)}
                                            disabled={eliminando === cot.id}
                                            style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '6px', cursor: eliminando === cot.id ? 'not-allowed' : 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', padding: '4px 6px' }}
                                            title="Eliminar cotización"
                                          >
                                            {eliminando === cot.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                                          </button>
                                        </td>
                                      )}
                                      {!esEditable && (
                                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                                          {cot.esMejorOpcion
                                            ? <span style={{ ...badge('#15803d', '#f0fdf4', '#86efac'), gap: '4px' }}><CheckCircle2 size={10} /> Seleccionado</span>
                                            : <span style={badge('#64748b', '#f1f5f9', '#cbd5e1')}>No seleccionado</span>
                                          }
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}

                          {/* Formulario agregar cotización — solo en modo edición */}
                          {esEditable && <div style={{ padding: '0.85rem 1.1rem', borderTop: cots.length > 0 ? '1px solid #e2e8f0' : 'none', background: '#f8fafc' }}>
                            <button
                              onClick={() => setAddForm(det.id, { open: !addForm.open })}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#3b82f6', padding: 0 }}
                            >
                              {addForm.open ? <><ChevronUp size={14} /> Cerrar formulario</> : <><Plus size={14} /> Agregar cotización de proveedor</>}
                            </button>

                            {addForm.open && (
                              <div style={{ marginTop: '0.75rem', background: 'white', border: '1.5px solid #dbeafe', borderRadius: '10px', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                                  <div>
                                    <label style={fieldLabel}>Proveedor *</label>
                                    <button
                                      type="button"
                                      onClick={() => setProvModalDetalleId(det.id)}
                                      style={{ width: '100%', padding: '0.55rem 0.8rem', border: `1.5px solid ${addForm.error && !addForm.proveedorId ? '#ef4444' : '#e2e8f0'}`, borderRadius: '8px', fontSize: '13px', color: addForm.proveedorNombre ? '#1e293b' : '#94a3b8', fontWeight: addForm.proveedorNombre ? '700' : '400', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'inherit', textAlign: 'left', boxSizing: 'border-box' }}
                                    >
                                      <Building2 size={13} color={addForm.proveedorNombre ? '#3b82f6' : '#94a3b8'} style={{ flexShrink: 0 }} />
                                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {addForm.proveedorNombre || 'Seleccionar proveedor...'}
                                      </span>
                                      <Search size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                                    </button>
                                  </div>
                                  <div>
                                    <label style={fieldLabel}>Precio unitario ($) *</label>
                                    <input type="number" min="0" step="0.01" placeholder="0.00" value={addForm.precioUnitario} onChange={e => setAddForm(det.id, { precioUnitario: e.target.value })} style={inpStyle(!!addForm.error && !addForm.precioUnitario)} />
                                  </div>
                                  <div>
                                    <label style={fieldLabel}>Tiempo entrega</label>
                                    <input placeholder="Ej. 5 días" value={addForm.tiempoEntrega} onChange={e => setAddForm(det.id, { tiempoEntrega: e.target.value })} style={inpStyle()} />
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                  <div>
                                    <label style={fieldLabel}>Forma de pago</label>
                                    <input placeholder="Ej. Transferencia" value={addForm.formaPago} onChange={e => setAddForm(det.id, { formaPago: e.target.value })} style={inpStyle()} />
                                  </div>
                                  <div>
                                    <label style={fieldLabel}>Marca</label>
                                    <input placeholder="Opcional" value={addForm.marca} onChange={e => setAddForm(det.id, { marca: e.target.value })} style={inpStyle()} />
                                  </div>
                                  <div>
                                    <label style={fieldLabel}>Modelo</label>
                                    <input placeholder="Opcional" value={addForm.modelo} onChange={e => setAddForm(det.id, { modelo: e.target.value })} style={inpStyle()} />
                                  </div>
                                </div>
                                {addForm.error && (
                                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>{addForm.error}</div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => handleAgregarCotizacion(det)} disabled={addForm.loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: addForm.loading ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontWeight: '700', fontSize: '13px', cursor: addForm.loading ? 'not-allowed' : 'pointer' }}>
                                    {addForm.loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><Plus size={13} /> Registrar cotización</>}
                                  </button>
                                  <button onClick={() => setAddForm(det.id, emptyAddForm())} style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>}
                        </div>
                      );
                    })}

                    {/* ── Órdenes de Compra (solo en expediente) ── */}
                    {!esEditable && compraReq.ordenes && compraReq.ordenes.length > 0 && (
                      <div style={{ border: '1.5px solid #bfdbfe', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ padding: '0.85rem 1.1rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={14} color="#2563eb" />
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Órdenes de Compra Generadas
                          </span>
                          <span style={{ marginLeft: 'auto', background: '#dbeafe', color: '#1d4ed8', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                            {compraReq.ordenes.length} {compraReq.ordenes.length === 1 ? 'orden' : 'órdenes'}
                          </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Folio', 'Proveedor', 'Total', 'Elaborada por', 'Fecha'].map((h, i) => (
                                <th key={i} style={{ padding: '0.6rem 0.9rem', textAlign: i === 2 ? 'right' as const : 'left' as const, fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' as const }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(compraReq.ordenes as OrdenCompra[]).map((orden, idx) => {
                              const provNombre = typeof orden.proveedor === 'object' ? orden.proveedor.nombre : String(orden.proveedor);
                              return (
                                <tr key={orden.id} style={{ borderBottom: idx < (compraReq.ordenes?.length ?? 0) - 1 ? '1px solid #f1f5f9' : 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <td style={{ padding: '0.75rem 0.9rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: '5px' }}>{orden.folio}</span>
                                  </td>
                                  <td style={{ padding: '0.75rem 0.9rem', fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <Building2 size={12} color="#64748b" />
                                      {provNombre}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: '800', fontSize: '13px', color: '#16a34a' }}>
                                    ${Number(orden.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px', color: '#64748b' }}>
                                    {orden.elaboradoPor ? `${orden.elaboradoPor.nombre} ${orden.elaboradoPor.apellidos}` : '—'}
                                  </td>
                                  <td style={{ padding: '0.75rem 0.9rem', fontSize: '12px', color: '#64748b' }}>
                                    {orden.createdAt ? new Date(orden.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {errorAdmin && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '13px', color: '#b91c1c', fontWeight: '600' }}>{errorAdmin}</div>
                )}

                {exito && (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={20} color="#16a34a" />
                    <div>
                      <p style={{ margin: 0, fontWeight: '800', color: '#15803d', fontSize: '14px' }}>Enviado a Revisión Administrativa</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#16a34a' }}>Las cotizaciones y la selección de proveedores han sido enviadas al área administrativa</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'white', gap: '1rem' }}>
            <div>
              {compraReq && tab === 'cotizaciones' && esEditable && (
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                  {puedePasarSeleccion
                    ? <span style={{ color: '#15803d', fontWeight: '700' }}>✓ Cotizaciones completas — puedes seleccionar el proveedor final</span>
                    : `Registra 3 cotizaciones por artículo (${conCotizacion}/${totalArts} completos)`}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              {compraReq && tab === 'cotizaciones' && esEditable && (
                <button
                  onClick={() => setShowSeleccionFinal(true)}
                  disabled={!puedePasarSeleccion}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: !puedePasarSeleccion ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem 1.5rem', fontWeight: '700', fontSize: '13px', cursor: !puedePasarSeleccion ? 'not-allowed' : 'pointer' }}
                >
                  <Star size={14} /> Seleccionar proveedor final
                </button>
              )}
              <button onClick={handleClose} style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Sub-modal: selección de proveedor para formulario */}
      {provModalDetalleId !== null && (
        <SeleccionarProveedorModal
          proveedores={proveedores}
          onSelect={(p) => {
            setAddForm(provModalDetalleId, { proveedorId: String(p.id), proveedorNombre: p.nombre });
            setProvModalDetalleId(null);
          }}
          onClose={() => setProvModalDetalleId(null)}
        />
      )}

      {/* Sub-modal: seleccionar proveedor final y enviar a revisión */}
      {showSeleccionFinal && compraReq && (
        <SeleccionProveedorFinalModal
          detalles={req.detalles}
          getCots={getCotsPorDetalle}
          seleccionando={seleccionando}
          onSeleccionar={handleSeleccionar}
          enviandoAdmin={enviandoAdmin}
          puedeEnviar={puedeEnviarAdmin ?? false}
          onEnviarAdmin={handleEnviarAdmin}
          onClose={() => setShowSeleccionFinal(false)}
        />
      )}

    </>,
    document.body
  );
}
