import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle2, AlertTriangle, Package, ArrowUpRight,
  Send, Info, Loader2, ClipboardList,
} from 'lucide-react';
import type { RequisicionDept, Producto } from '../../types';
import apiClient from '../../services/api';
import { enviarACompras } from '../../services/requisiciones.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface ProductoRow {
  id: number;
  numero: number;
  nombre: string;
  unidad: string;
  cantidadSolicitada: number;
  match: Producto | null;
  stockSuficiente: boolean;
}

interface ProductoLocalState {
  entregado: boolean;
  cantidadEntregada: number;
  enviadoCompras: boolean;
}

interface SalidaFormState {
  cantidad: string;
  quienRecibe: string;
  observaciones: string;
  loading: boolean;
  error: string;
}

interface Props {
  req: RequisicionDept | null;
  isOpen: boolean;
  productos: Producto[];
  onClose: () => void;
  onSalidaRegistrada: () => void;
  onEnviadoACompras?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyForm = (): SalidaFormState => ({
  cantidad: '', quienRecibe: '', observaciones: '', loading: false, error: '',
});

const matchProducto = (nombre: string, productos: Producto[]): Producto | null => {
  const n = nombre.toLowerCase().trim();
  return (
    productos.find(p => p.nombre.toLowerCase() === n) ??
    productos.find(p => p.nombre.toLowerCase().includes(n) || n.includes(p.nombre.toLowerCase())) ??
    null
  );
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function RequisicionAlmacenModal({ req, isOpen, productos, onClose, onSalidaRegistrada, onEnviadoACompras }: Props) {
  const [tab, setTab] = useState<'info' | 'articulos'>('info');
  const [activeSalidaIdx, setActiveSalidaIdx] = useState<number | null>(null);
  const [salidaForm, setSalidaForm] = useState<SalidaFormState>(emptyForm());
  const [localState, setLocalState] = useState<Record<number, ProductoLocalState>>({});
  const [enviandoComprasRows, setEnviandoComprasRows] = useState<Record<number, boolean>>({});
  const [errorCompras, setErrorCompras] = useState<string | null>(null);

  const rows = useMemo((): ProductoRow[] => {
    if (!req?.detalles) return [];
    return req.detalles.map((det, i) => {
      const nombre = det.productoNombre ?? '';
      const match = matchProducto(nombre, productos);
      const stock = match?.stockActual ?? 0;
      return {
        id: det.id,
        numero: det.numero || i + 1,
        nombre,
        unidad: det.unidadLibre ?? '',
        cantidadSolicitada: det.cantidadSolicitada,
        match,
        stockSuficiente: match !== null && stock >= det.cantidadSolicitada,
      };
    });
  }, [req, productos]);

  if (!isOpen || !req) return null;

  // ── Cálculos de estado general ─────────────────────────────────────────────

  const total = rows.length;
  const disponibles   = rows.filter(r => r.stockSuficiente).length;
  const sinExistencia = rows.filter(r => !r.stockSuficiente).length;
  const entregados    = rows.filter(r => localState[r.id]?.entregado).length;
  const aCompras      = rows.filter(r => localState[r.id]?.enviadoCompras).length;

  const getEstadoGeneral = () => {
    if (entregados === total && total > 0)         return { label: 'SURTIDA',         color: '#15803d', bg: '#f0fdf4' };
    if (entregados > 0 && aCompras > 0)            return { label: 'MIXTA',           color: '#d97706', bg: '#fffbeb' };
    if (entregados > 0 && entregados < total)      return { label: 'PARCIAL',         color: '#b45309', bg: '#fffbeb' };
    if (aCompras > 0 && entregados === 0)          return { label: 'ENVIADA COMPRAS', color: '#4338ca', bg: '#eef2ff' };
    if (disponibles === 0 && total > 0)            return { label: 'SIN EXISTENCIA',  color: '#b91c1c', bg: '#fef2f2' };
    return                                               { label: 'PENDIENTE',        color: '#64748b', bg: '#f1f5f9' };
  };
  const estadoG = getEstadoGeneral();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRegistrarSalida = async (rowIdx: number) => {
    const row = rows[rowIdx];
    if (!row.match) return;

    const cant = parseFloat(salidaForm.cantidad);
    if (!salidaForm.cantidad || isNaN(cant) || cant <= 0) {
      setSalidaForm(f => ({ ...f, error: 'Ingresa una cantidad válida mayor a 0' }));
      return;
    }
    if (!salidaForm.quienRecibe.trim()) {
      setSalidaForm(f => ({ ...f, error: 'Indica el nombre de quien recibe' }));
      return;
    }

    setSalidaForm(f => ({ ...f, loading: true, error: '' }));
    try {
      await apiClient.post('/almacen/movimientos', {
        productoId:     row.match.id,
        tipo:           'SALIDA',
        cantidad:       cant,
        areaSolicitante: req.areaSolicitante,
        motivo:          req.descripcion ?? req.justificacion ?? `Requisición ${req.folio}`,
        nombreRecibe:    salidaForm.quienRecibe.trim(),
        observaciones:   salidaForm.observaciones.trim() || undefined,
        requisicionId:   req.id,
        estadoSalida:    'AUTORIZADA',
      });

      setLocalState(prev => ({
        ...prev,
        [row.id]: { entregado: true, cantidadEntregada: cant, enviadoCompras: false },
      }));
      setActiveSalidaIdx(null);
      setSalidaForm(emptyForm());
      onSalidaRegistrada();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSalidaForm(f => ({ ...f, loading: false, error: msg || 'Error al registrar la salida. Verifique los datos.' }));
    }
  };

  const handleEnviarComprasRow = async (rowId: number) => {
    if (!req) return;
    setEnviandoComprasRows(prev => ({ ...prev, [rowId]: true }));
    setErrorCompras(null);

    const yaEnviada =
      req.estado === 'ENVIADA_A_COMPRAS' ||
      Object.values(localState).some(s => s.enviadoCompras);

    try {
      if (!yaEnviada) {
        await enviarACompras(req.id);
        onEnviadoACompras?.();
      }
      setLocalState(prev => ({
        ...prev,
        [rowId]: { entregado: false, cantidadEntregada: 0, enviadoCompras: true },
      }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorCompras(msg || 'Error al enviar a compras');
    } finally {
      setEnviandoComprasRows(prev => ({ ...prev, [rowId]: false }));
    }
  };

  const handleClose = () => {
    setTab('info');
    setActiveSalidaIdx(null);
    setSalidaForm(emptyForm());
    setErrorCompras(null);
    onClose();
  };

  // ── Estilos ────────────────────────────────────────────────────────────────

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '0.55rem 1.1rem',
    borderRadius: '9px', border: 'none',
    background: active ? 'white' : 'transparent',
    color: active ? '#1e293b' : '#64748b',
    fontWeight: active ? '800' : '600',
    fontSize: '13px', cursor: 'pointer',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.18s',
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  });

  const inpStyle: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.8rem',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#1e293b', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', background: 'white',
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: '10px', fontWeight: '800', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    display: 'block', marginBottom: '0.3rem',
  };

  const badge = (color: string, bg: string, border: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: bg, color, border: `1px solid ${border}`,
    padding: '3px 9px', borderRadius: '7px',
    fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap',
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '1rem',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '24px',
        width: '100%', maxWidth: '960px', maxHeight: '93vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)',
      }}>

        {/* ── Encabezado ── */}
        <div style={{
          padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ background: '#eff6ff', padding: '0.6rem', borderRadius: '11px' }}>
              <ClipboardList size={19} color="#3b82f6" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>
                  Requisición {req.folio}
                </h2>
                <span style={{ background: estadoG.bg, color: estadoG.color, fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {estadoG.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
                {req.areaSolicitante} ·{' '}
                {new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
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
            <button style={tabBtn(tab === 'articulos')} onClick={() => setTab('articulos')}>
              <Package size={13} />
              Artículos y Existencia
              <span style={{
                background: tab === 'articulos' ? '#dbeafe' : '#e2e8f0',
                color: tab === 'articulos' ? '#2563eb' : '#64748b',
                borderRadius: '100px', fontSize: '10px', fontWeight: '800',
                padding: '1px 7px',
              }}>{total}</span>
            </button>
          </div>
        </div>

        {/* ── Contenido scrolleable ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Tab: Información General */}
          {tab === 'info' && (
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Grid de datos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {([
                  ['Folio',             req.folio],
                  ['Fecha',            new Date(req.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })],
                  ['Área Solicitante', req.areaSolicitante],
                  ['Quien Solicita',   req.usuarioSolicita ? `${req.usuarioSolicita.nombre} ${req.usuarioSolicita.apellidos}`.trim() : '—'],
                  ['Estado',           req.estado.replace(/_/g, ' ')],
                  ['Artículos',        String(req.detalles.length)],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                    <span style={fieldLabel}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{val}</span>
                  </div>
                ))}
              </div>

              {req.descripcion && (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <span style={fieldLabel}>Descripción</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{req.descripcion}</p>
                </div>
              )}

              {req.justificacion && (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <span style={fieldLabel}>Justificación</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{req.justificacion}</p>
                </div>
              )}

              {/* Contador de artículos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Total artículos', val: total,        color: '#1e293b', bg: '#f1f5f9' },
                  { label: 'Con existencia',  val: disponibles,  color: '#15803d', bg: '#f0fdf4' },
                  { label: 'Sin existencia',  val: sinExistencia,color: '#b91c1c', bg: '#fef2f2' },
                  { label: 'Entregados',      val: entregados,   color: '#2563eb', bg: '#eff6ff' },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '26px', fontWeight: '900', color }}>{val}</div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTab('articulos')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.8rem', borderRadius: '12px', background: '#1e293b', color: 'white', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                <Package size={16} /> Ver artículos y procesar existencia
              </button>
            </div>
          )}

          {/* Tab: Artículos y Existencia */}
          {tab === 'articulos' && (
            <>
              {rows.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Package size={32} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                  <p style={{ margin: 0, fontWeight: '700' }}>Sin artículos registrados en esta requisición</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['#', 'Artículo / Descripción', 'Unidad', 'Solicitado', 'Existencia actual', 'Estado existencia', 'Acción'].map((h, i) => (
                        <th key={h} style={{
                          padding: '0.9rem 1rem', textAlign: i === 0 ? 'center' : 'left',
                          fontSize: '11px', fontWeight: '800', color: '#64748b',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const ls = localState[row.id];
                      const entregado    = ls?.entregado     ?? false;
                      const aCompras     = ls?.enviadoCompras ?? false;
                      const reqEstado    = req?.estado ?? '';
                      const compraEnCurso = aCompras || reqEstado === 'ENVIADA_A_COMPRAS';
                      const compraTerminada = reqEstado === 'FINALIZADA' || reqEstado === 'FINALIZADO';
                      const salidaOpen   = activeSalidaIdx === idx;
                      const rowBg        = entregado ? '#f0fdf4' : aCompras ? '#eef2ff' : 'white';

                      return (
                        <React.Fragment key={row.id}>
                          <tr
                            style={{ borderBottom: salidaOpen ? 'none' : '1px solid #f1f5f9', background: rowBg, transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (!entregado && !aCompras) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                          >
                            {/* # */}
                            <td style={{ padding: '1rem', textAlign: 'center', width: 40 }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>{row.numero}</span>
                            </td>

                            {/* Artículo */}
                            <td style={{ padding: '1rem', maxWidth: 220 }}>
                              <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{row.nombre}</div>
                              {row.match && row.match.nombre !== row.nombre && (
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Catálogo: {row.match.nombre}</div>
                              )}
                              {row.match?.descripcion && (
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.match.descripcion}</div>
                              )}
                            </td>

                            {/* Unidad */}
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontSize: '13px', color: '#64748b' }}>{row.unidad}</span>
                            </td>

                            {/* Solicitado */}
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>{row.cantidadSolicitada}</span>
                              {entregado && (
                                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                                  Entregado: {ls?.cantidadEntregada}
                                </div>
                              )}
                            </td>

                            {/* Existencia actual */}
                            <td style={{ padding: '1rem' }}>
                              {row.match ? (
                                <div>
                                  <span style={{
                                    fontWeight: '800', fontSize: '16px',
                                    color: row.stockSuficiente ? '#15803d' : '#b91c1c',
                                  }}>
                                    {row.match.stockActual}
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>{row.match.unidad}</span>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mín: {row.match.stockMinimo}</div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Sin catálogo</span>
                              )}
                            </td>

                            {/* Badge de estado */}
                            <td style={{ padding: '1rem' }}>
                              {entregado ? (
                                <span style={badge('#15803d', '#f0fdf4', '#86efac')}>
                                  <CheckCircle2 size={11} /> Entregado
                                </span>
                              ) : compraTerminada ? (
                                <span style={badge('#15803d', '#f0fdf4', '#86efac')}>
                                  <CheckCircle2 size={11} /> Finalizado
                                </span>
                              ) : compraEnCurso ? (
                                <span style={badge('#4338ca', '#eef2ff', '#c7d2fe')}>
                                  <ArrowUpRight size={11} /> En compras
                                </span>
                              ) : row.stockSuficiente ? (
                                <span style={badge('#15803d', '#f0fdf4', '#bbf7d0')}>
                                  <CheckCircle2 size={11} /> Disponible
                                </span>
                              ) : (
                                <span style={badge('#b91c1c', '#fef2f2', '#fecaca')}>
                                  <AlertTriangle size={11} /> Sin existencia
                                </span>
                              )}
                            </td>

                            {/* Acción */}
                            <td style={{ padding: '1rem' }}>
                              {entregado ? (
                                <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '700' }}>✓ Completado</span>
                              ) : compraTerminada ? (
                                <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '700' }}>✓ Finalizado</span>
                              ) : compraEnCurso ? (
                                <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: '700' }}>→ En compras</span>
                              ) : row.stockSuficiente ? (
                                <button
                                  onClick={() => {
                                    setActiveSalidaIdx(salidaOpen ? null : idx);
                                    if (!salidaOpen) setSalidaForm({ ...emptyForm(), cantidad: String(row.cantidadSolicitada) });
                                  }}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    background: salidaOpen ? '#f1f5f9' : '#1e293b',
                                    color: salidaOpen ? '#64748b' : 'white',
                                    border: '1px solid #e2e8f0', borderRadius: '8px',
                                    padding: '6px 11px', fontSize: '12px', fontWeight: '700',
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                  }}
                                >
                                  <ArrowUpRight size={12} />
                                  {salidaOpen ? 'Cerrar' : 'Registrar salida'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEnviarComprasRow(row.id)}
                                  disabled={!!enviandoComprasRows[row.id]}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    background: enviandoComprasRows[row.id] ? '#94a3b8' : '#4338ca',
                                    color: 'white', border: 'none',
                                    borderRadius: '8px', padding: '6px 11px',
                                    fontSize: '12px', fontWeight: '700',
                                    cursor: enviandoComprasRows[row.id] ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Send size={12} /> {enviandoComprasRows[row.id] ? 'Enviando…' : 'Enviar a compras'}
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* ── Formulario inline de salida ── */}
                          {salidaOpen && (
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td colSpan={7} style={{ padding: '0.85rem 1.5rem' }}>
                                <div style={{
                                  background: 'white', border: '1.5px solid #dbeafe',
                                  borderRadius: '12px', padding: '1.1rem 1.25rem',
                                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                }}>
                                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ArrowUpRight size={15} color="#2563eb" />
                                    Registrar Salida —{' '}
                                    <span style={{ color: '#3b82f6' }}>{row.nombre}</span>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginLeft: '4px' }}>
                                      (stock actual: {row.match?.stockActual ?? 0} {row.match?.unidad ?? ''})
                                    </span>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '0.75rem' }}>
                                    <div>
                                      <label style={fieldLabel}>Cantidad a entregar *</label>
                                      <input
                                        type="number" min="1"
                                        max={row.match?.stockActual ?? undefined}
                                        value={salidaForm.cantidad}
                                        onChange={e => setSalidaForm(f => ({ ...f, cantidad: e.target.value }))}
                                        style={inpStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={fieldLabel}>Quién recibe *</label>
                                      <input
                                        placeholder="Nombre del responsable"
                                        value={salidaForm.quienRecibe}
                                        onChange={e => setSalidaForm(f => ({ ...f, quienRecibe: e.target.value }))}
                                        style={inpStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={fieldLabel}>Observaciones</label>
                                      <input
                                        placeholder="Opcional"
                                        value={salidaForm.observaciones}
                                        onChange={e => setSalidaForm(f => ({ ...f, observaciones: e.target.value }))}
                                        style={inpStyle}
                                      />
                                    </div>
                                  </div>

                                  {salidaForm.error && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>
                                      {salidaForm.error}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => handleRegistrarSalida(idx)}
                                      disabled={salidaForm.loading}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                        background: salidaForm.loading ? '#94a3b8' : '#16a34a',
                                        color: 'white', border: 'none', borderRadius: '8px',
                                        padding: '0.55rem 1.25rem', fontWeight: '700',
                                        fontSize: '13px', cursor: salidaForm.loading ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {salidaForm.loading
                                        ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</>
                                        : <><CheckCircle2 size={13} /> Confirmar salida</>
                                      }
                                    </button>
                                    <button
                                      onClick={() => { setActiveSalidaIdx(null); setSalidaForm(emptyForm()); }}
                                      style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem 1rem', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Error de envío a compras */}
              {errorCompras && (
                <div style={{ padding: '0.6rem 1.5rem' }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>
                    {errorCompras}
                  </div>
                </div>
              )}

              {/* Barra de resumen */}
              {rows.length > 0 && (
                <div style={{
                  padding: '0.85rem 1.5rem', borderTop: '2px solid #f1f5f9',
                  background: '#f8fafc', display: 'flex', gap: '0.75rem',
                  flexWrap: 'wrap', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Resumen:</span>
                  {disponibles > 0 && (
                    <span style={{ ...badge('#15803d', '#f0fdf4', '#86efac'), fontSize: '12px' }}>
                      <CheckCircle2 size={11} /> {disponibles} con existencia
                    </span>
                  )}
                  {sinExistencia > 0 && (
                    <span style={{ ...badge('#b91c1c', '#fef2f2', '#fecaca'), fontSize: '12px' }}>
                      <AlertTriangle size={11} /> {sinExistencia} sin existencia
                    </span>
                  )}
                  {entregados > 0 && (
                    <span style={{ ...badge('#2563eb', '#eff6ff', '#bfdbfe'), fontSize: '12px' }}>
                      <CheckCircle2 size={11} /> {entregados} entregados
                    </span>
                  )}
                  {aCompras > 0 && (
                    <span style={{ ...badge('#4338ca', '#eef2ff', '#c7d2fe'), fontSize: '12px' }}>
                      <ArrowUpRight size={11} /> {aCompras} enviados a compras
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', flexShrink: 0, background: 'white',
        }}>
          <button
            onClick={handleClose}
            style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}