import { useState } from 'react';
import React from 'react';
import {
  ClipboardCheck, Eye, X, Send, RotateCcw, CheckCircle,
  Clock, AlertCircle, Search, Building2, Package, Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  getComprasRevisionAdmin,
  aprobarCompraAdministracion,
  devolverCompraACompras,
  seleccionarCotizacionProducto,
} from '../../services/compras.service';
import type { Requisicion, Cotizacion } from '../../types';
import { getCotizacionProveedorNombre } from '../../types';
import { useAuthStore } from '../../stores/authStore';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const Modal = ({
  children, onClose, title, width = 680
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
        flexShrink: 0,
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

const Btn = ({
  children, variant = 'primary', onClick, disabled, icon
}: {
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
      borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
    }}>
      {icon}{children}
    </button>
  );
};

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

// ─────────────────────────────────────────────
// HELPER: resumen por ganadores para tab info
// ─────────────────────────────────────────────
function calcularResumenGanadores(compra: Requisicion) {
  const cotizaciones = compra.cotizaciones ?? [];
  const detallesReq  = compra.requisicion?.detalles ?? [];

  const gruposGan: { nombre: string; cantidad: number; subtotal: number }[] = [];
  for (const d of detallesReq) {
    const ganadora = cotizaciones.find(c => c.requisicionDetalleId === d.id && c.esMejorOpcion);
    if (!ganadora) continue;
    const nombre = getCotizacionProveedorNombre(ganadora) || `Proveedor #${ganadora.proveedorId}`;
    const monto  = Number(ganadora.precioUnitario ?? ganadora.precio ?? 0) * d.cantidadSolicitada;
    const ex = gruposGan.find(g => g.nombre === nombre);
    if (ex) { ex.subtotal += monto; ex.cantidad += 1; }
    else gruposGan.push({ nombre, subtotal: monto, cantidad: 1 });
  }

  const subtotal    = gruposGan.reduce((s, g) => s + g.subtotal, 0);
  const iva         = subtotal * 0.16;
  const totalConIva = subtotal + iva;

  return { gruposGan, subtotal, iva, totalConIva };
}

// ─────────────────────────────────────────────
// MODAL DETALLE
// ─────────────────────────────────────────────
function ModalDetalle({
  compra,
  onClose,
  onAprobar,
  onDevolver,
  onSelectGanador,
  aprobando,
  devolviendo,
  selectingGanador,
}: {
  compra: Requisicion;
  onClose: () => void;
  onAprobar: (observaciones?: string) => void;
  onDevolver: (motivo: string, observaciones?: string) => void;
  onSelectGanador: (compraId: number, cotizacionId: number) => void;
  aprobando: boolean;
  devolviendo: boolean;
  selectingGanador: boolean;
}) {
  const [tab, setTab] = useState<'info' | 'cotizaciones'>('info');
  const [observaciones, setObservaciones] = useState('');
  const [motivo, setMotivo] = useState('');
  const [accion, setAccion] = useState<'aprobar' | 'devolver' | null>(null);

  const todasCots   = compra.cotizaciones ?? [];
  const detallesReq = compra.requisicion?.detalles ?? [];
  const cotsLegacy  = todasCots.filter(c => !c.requisicionDetalleId);
  const area        = compra.requisicion?.areaSolicitante || compra.areaSolicitante;

  const { gruposGan, subtotal, iva, totalConIva } = calcularResumenGanadores(compra);

  const todoListo = detallesReq.length > 0 && detallesReq.every(d =>
    todasCots.some(c => c.requisicionDetalleId === d.id && c.esMejorOpcion)
  );

  const cotsDeDetalle = (detalleId: number): Cotizacion[] =>
    todasCots.filter(c => c.requisicionDetalleId === detalleId);

  const getBadges = (detalleId: number, cotId: number) => {
    const cots = cotsDeDetalle(detalleId);
    if (cots.length < 2) return { mejorPrecio: false, entregaRapida: false, creditoDisponible: false };
    const precios   = cots.map(c => Number(c.precioUnitario ?? c.precio ?? 0));
    const minPrecio = Math.min(...precios);
    const cot       = cots.find(c => c.id === cotId)!;
    const tiempos   = cots.map(c => parseInt(c.tiempoEntrega ?? '9999')).filter(n => !isNaN(n));
    const minTiempo = tiempos.length > 0 ? Math.min(...tiempos) : null;
    const miTiempo  = parseInt(cot.tiempoEntrega ?? '9999');
    return {
      mejorPrecio:       Number(cot.precioUnitario ?? cot.precio ?? 0) === minPrecio,
      entregaRapida:     minTiempo !== null && miTiempo === minTiempo,
      creditoDisponible: !!(cot.formaPago ?? '').toLowerCase().includes('crédit'),
    };
  };

  const tabStyle = (active: boolean) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', fontFamily: 'inherit', borderRadius: 8,
    background: active ? '#EFF6FF' : 'transparent',
    color: active ? '#2563EB' : '#6B7280',
  } as React.CSSProperties);

  return (
    <Modal title={`Revisión — ${compra.folio}`} onClose={onClose} width={1060}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E8ECF0', paddingBottom: 8 }}>
        <button style={tabStyle(tab === 'info')} onClick={() => setTab('info')}>Información general</button>
        <button style={tabStyle(tab === 'cotizaciones')} onClick={() => setTab('cotizaciones')}>
          Cotizaciones por artículo ({detallesReq.length})
        </button>
      </div>

      {/* ── TAB: COTIZACIONES ── */}
      {tab === 'cotizaciones' && (
        <>
          {/* Banner instrucción */}
          <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            Selecciona el proveedor ganador para cada artículo. Cuando todos estén elegidos podrás aprobar y enviar a Dirección General.
          </div>

          {/* Sección por artículo */}
          {detallesReq.map(d => {
            const cots     = cotsDeDetalle(d.id);
            const ganadora = cots.find(c => c.esMejorOpcion);
            return (
              <div key={d.id} style={{ border: `1.5px solid ${ganadora ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Cabecera artículo */}
                <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                  <span style={{ background: '#1E293B', color: 'white', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>#{d.numero}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{d.productoNombre ?? '—'}</span>
                  <span style={{ background: '#F1F5F9', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#64748B' }}>{d.cantidadSolicitada} {d.unidadLibre ?? ''}</span>
                  <div style={{ marginLeft: 'auto' }}>
                    {ganadora
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                          <CheckCircle size={11} /> {getCotizacionProveedorNombre(ganadora)}
                        </span>
                      : <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>⚠ Selecciona el proveedor ganador</span>
                    }
                  </div>
                </div>

                {/* Tabla cotizaciones del artículo */}
                {cots.length > 0 ? (
                  <div style={{ overflowX: 'auto' as const }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#1E293B' }}>
                          {['Proveedor', 'P. Unitario', 'Total', 'Entrega', 'Forma pago', 'Garantía', 'Marca / Modelo', 'Indicadores', 'Elegir'].map((h, i) => (
                            <th key={i} style={{ padding: '7px 10px', textAlign: (i === 1 || i === 2) ? 'right' as const : 'left' as const, fontWeight: 600, color: '#94A3B8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cots.map(c => {
                          const badges  = getBadges(d.id, c.id);
                          const esGan   = c.esMejorOpcion;
                          const precioU = Number(c.precioUnitario ?? c.precio ?? 0);
                          const totalL  = precioU * d.cantidadSolicitada;
                          return (
                            <tr key={c.id} style={{ background: esGan ? '#F0FDF4' : 'white', borderTop: '1px solid #F1F5F9', borderLeft: esGan ? '3px solid #22C55E' : '3px solid transparent' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>{getCotizacionProveedorNombre(c)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' as const, fontWeight: 700, color: '#16A34A' }}>
                                ${precioU.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' as const, fontWeight: 700, color: '#1E293B' }}>
                                ${totalL.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>{c.tiempoEntrega ?? '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>{c.formaPago ?? '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748B', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.garantia ?? '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>{[c.marca, c.modelo].filter(Boolean).join(' / ') || '—'}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                                  {badges.mejorPrecio && <span style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' as const }}>💰 Mejor precio</span>}
                                  {badges.entregaRapida && <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' as const }}>⚡ Entrega rápida</span>}
                                  {badges.creditoDisponible && <span style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' as const }}>💳 Crédito</span>}
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' as const }}>
                                <input
                                  type="radio"
                                  name={`ganador-${d.id}`}
                                  checked={esGan}
                                  disabled={selectingGanador}
                                  onChange={() => onSelectGanador(compra.id, c.id)}
                                  style={{ cursor: selectingGanador ? 'not-allowed' : 'pointer', accentColor: '#16A34A', width: 16, height: 16 }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Sin cotizaciones para este artículo.</div>
                )}
              </div>
            );
          })}

          {/* Cotizaciones legacy */}
          {cotsLegacy.length > 0 && (
            <div style={{ border: '1px solid #E8ECF0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', background: '#F9FAFB', fontWeight: 700, fontSize: 11, color: '#374151', borderBottom: '1px solid #E8ECF0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Cotizaciones ({cotsLegacy.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    {['Proveedor', 'Precio', 'Entrega', 'Pago'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cotsLegacy.map((c: Cotizacion) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 500, color: '#111827' }}>{getCotizacionProveedorNombre(c)}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#374151' }}>${Number(c.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '9px 14px', color: '#6B7280' }}>{c.tiempoEntrega ?? '—'}</td>
                      <td style={{ padding: '9px 14px', color: '#6B7280' }}>{c.formaPago ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detallesReq.length === 0 && cotsLegacy.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center' as const, color: '#9CA3AF' }}>
              <Building2 size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ margin: 0 }}>No hay cotizaciones registradas</p>
            </div>
          )}

          {/* Resumen ganadores */}
          {gruposGan.length > 0 && (
            <div style={{ border: '1px solid #BFDBFE', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={13} style={{ color: '#2563EB' }} />
                <span style={{ fontWeight: 700, fontSize: 11, color: '#1D4ED8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Órdenes que se generarán</span>
                <span style={{ marginLeft: 'auto', background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{gruposGan.length} {gruposGan.length === 1 ? 'proveedor' : 'proveedores'}</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap' as const, gap: 10, alignItems: 'flex-end' }}>
                {gruposGan.map((g, i) => (
                  <div key={i} style={{ flex: '1 1 170px', border: '1px solid #BFDBFE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: '10px 14px', background: '#F8FBFF' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B', marginBottom: 5 }}>{g.nombre}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }}>
                      <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{g.cantidad} art.</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>${g.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
                <div style={{ flex: '1 1 170px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>Subtotal: ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>IVA (16%): ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#15803D' }}>Total: ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: INFO ── */}
      {tab === 'info' && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)', borderRadius: 12, padding: '14px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Folio</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{compra.folio}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Área</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{area}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Total c/IVA</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{totalConIva > 0 ? `$${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'Pendiente'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '5px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Package size={12} /> {detallesReq.length} artículos
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '5px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Building2 size={12} /> {gruposGan.length} {gruposGan.length === 1 ? 'proveedor' : 'proveedores'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {compra.requisicion && <div><strong>Req. origen:</strong> {compra.requisicion.folio}</div>}
              <div><strong>Tipo:</strong> {compra.tipo}</div>
              <div><strong>Presupuesto estimado:</strong> ${(compra.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
              <div><strong>Fecha:</strong> {new Date(compra.createdAt).toLocaleDateString('es-MX')}</div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div><strong>Solicitante:</strong> {compra.requisicion?.usuarioSolicita
                ? `${compra.requisicion.usuarioSolicita.nombre} ${compra.requisicion.usuarioSolicita.apellidos}`
                : `${compra.usuario?.nombre ?? ''} ${compra.usuario?.apellidos ?? ''}`}
              </div>
              {totalConIva > 0 && <>
                <div><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                <div><strong>IVA (16%):</strong> ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                <div style={{ color: '#16A34A', fontWeight: 700 }}><strong style={{ color: '#374151', fontWeight: 600 }}>Total c/IVA:</strong> ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              </>}
            </div>
          </div>

          {compra.requisicion?.justificacion && (
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#111827' }}>Justificación</p>
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>{compra.requisicion.justificacion}</p>
            </div>
          )}
        </>
      )}

      {/* ── ACCIONES ── */}
      {!accion && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <Btn variant="success" icon={<CheckCircle size={15} />} disabled={!todoListo} onClick={() => setAccion('aprobar')}>
            Aprobar y enviar a Dirección
          </Btn>
          <Btn variant="danger" icon={<RotateCcw size={15} />} onClick={() => setAccion('devolver')}>
            Devolver a Compras
          </Btn>
          {!todoListo && detallesReq.length > 0 && (
            <span style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} /> Selecciona el proveedor ganador en cada artículo
            </span>
          )}
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        </div>
      )}

      {accion === 'aprobar' && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 12, fontSize: 13, color: '#166534' }}>
            Al aprobar, la compra pasará a revisión de Dirección General.
          </div>
          <Textarea label="Observaciones (opcionales)" placeholder="Notas para Dirección..." value={observaciones} onChange={e => setObservaciones(e.target.value)} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="success" icon={<Send size={15} />} disabled={aprobando} onClick={() => onAprobar(observaciones || undefined)}>
              {aprobando ? 'Aprobando…' : 'Confirmar aprobación'}
            </Btn>
            <Btn variant="ghost" onClick={() => setAccion(null)}>Cancelar</Btn>
          </div>
        </div>
      )}

      {accion === 'devolver' && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: 12, fontSize: 13, color: '#92400E' }}>
            Indica el motivo para que el equipo de compras pueda corregir las cotizaciones.
          </div>
          <Textarea
            label="Motivo de devolución (requerido)"
            placeholder="Ej: Faltan cotizaciones de proveedores nacionales..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
          />
          <Textarea label="Observaciones adicionales (opcionales)" placeholder="" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="danger" icon={<RotateCcw size={15} />} disabled={devolviendo || !motivo.trim()} onClick={() => onDevolver(motivo.trim(), observaciones || undefined)}>
              {devolviendo ? 'Devolviendo…' : 'Devolver a Compras'}
            </Btn>
            <Btn variant="ghost" onClick={() => setAccion(null)}>Cancelar</Btn>
          </div>
          {!motivo.trim() && <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>* El motivo de devolución es obligatorio.</p>}
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function RevisionAdministrativaCompras() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [notif, setNotif] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  };

  const { data: compras = [], isLoading } = useQuery<Requisicion[]>({
    queryKey: ['compras-admin-revision'],
    queryFn: getComprasRevisionAdmin,
    refetchInterval: 30000,
  });

  const aprobarMut = useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
      aprobarCompraAdministracion(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras-admin-revision'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setSelectedId(null);
      notify('Compra aprobada — enviada a Dirección General');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      notify(`Error: ${e?.response?.data?.message ?? e?.message}`);
    },
  });

  const devolverMut = useMutation({
    mutationFn: ({ id, motivoRechazo, observaciones }: { id: number; motivoRechazo: string; observaciones?: string }) =>
      devolverCompraACompras(id, { motivoRechazo, observaciones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras-admin-revision'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setSelectedId(null);
      notify('Compra devuelta al área de compras');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      notify(`Error: ${e?.response?.data?.message ?? e?.message}`);
    },
  });

  const selectGanadorMut = useMutation({
    mutationFn: ({ compraId, cotizacionId }: { compraId: number; cotizacionId: number }) =>
      seleccionarCotizacionProducto(compraId, cotizacionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras-admin-revision'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      notify(`Error: ${e?.response?.data?.message ?? e?.message}`);
    },
  });

  // Derivar la compra seleccionada desde datos frescos
  const seleccionada = selectedId !== null ? (compras.find(c => c.id === selectedId) ?? null) : null;

  const filtradas = compras.filter(c => {
    const area = c.requisicion?.areaSolicitante || c.areaSolicitante;
    return (
      c.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      area.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem', background: 'white', border: '1px solid #e2e8f0',
          padding: '1.5rem 2rem', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #CA8A04, #B45309)', padding: '0.75rem', borderRadius: 14, display: 'flex', boxShadow: '0 8px 16px rgba(202,138,4,0.25)' }}>
              <ClipboardCheck size={28} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Revisión Administrativa de Compras</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
                Compras pendientes de revisión · {usuario?.nombre ?? ''}
              </p>
            </div>
          </div>
          <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 12, padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#92400E' }}>{compras.length}</div>
            <div style={{ fontSize: 12, color: '#A16207', fontWeight: 600 }}>Pendientes</div>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Búsqueda */}
          <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#fcfcfc' }}>
            <div style={{ position: 'relative', maxWidth: 360 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
              <input
                placeholder="Buscar por folio o área..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <span>Cargando...</span>
            </div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151', fontSize: 15 }}>Sin compras pendientes</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>No hay compras en espera de revisión administrativa.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Folio', 'Área', 'Requisición origen', 'Artículos', 'Estado cotizaciones', 'Total (ganadores)', 'Fecha', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '1rem 1.5rem', textAlign: i === 7 ? 'right' as const : 'left' as const,
                      fontSize: 12, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((compra, idx) => {
                  const detalles   = compra.requisicion?.detalles ?? [];
                  const todasCots  = compra.cotizaciones ?? [];
                  const nArticulos = detalles.length;
                  const conGanador = detalles.filter(d => todasCots.some(c => c.requisicionDetalleId === d.id && c.esMejorOpcion)).length;
                  const area       = compra.requisicion?.areaSolicitante || compra.areaSolicitante;
                  const { gruposGan, totalConIva } = calcularResumenGanadores(compra);
                  const todoListo  = nArticulos > 0 && conGanador === nArticulos;

                  return (
                    <tr
                      key={compra.id}
                      style={{ borderBottom: idx < filtradas.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827', background: '#F3F4F6', padding: '3px 8px', borderRadius: 5 }}>
                          {compra.folio}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', fontSize: 14, color: '#374151', fontWeight: 500 }}>
                        {area}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', fontSize: 13, color: '#6B7280' }}>
                        {compra.requisicion ? (
                          <span style={{ fontFamily: 'monospace', background: '#EFF6FF', color: '#2563EB', padding: '2px 7px', borderRadius: 4, fontSize: 12 }}>
                            {compra.requisicion.folio}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          <Package size={12} /> {nArticulos}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: todoListo ? '#F0FDF4' : '#FEFCE8', color: todoListo ? '#16A34A' : '#92400E', border: `1px solid ${todoListo ? '#BBF7D0' : '#FEF08A'}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {todoListo ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {todoListo ? `${gruposGan.length} prov. elegidos` : `${conGanador}/${nArticulos} elegidos`}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        {totalConIva > 0 ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>
                              ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>IVA incluido</div>
                          </>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: 13 }}>Pendiente selección</span>
                        )}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', fontSize: 13, color: '#6B7280' }}>
                        {new Date(compra.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedId(compra.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#2563EB', color: 'white', border: 'none', borderRadius: 8,
                            padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                          }}
                        >
                          <Eye size={14} /> Revisar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal detalle */}
        {seleccionada && (
          <ModalDetalle
            compra={seleccionada}
            onClose={() => setSelectedId(null)}
            onAprobar={(obs) => aprobarMut.mutate({ id: seleccionada.id, observaciones: obs })}
            onDevolver={(motivo, obs) => devolverMut.mutate({ id: seleccionada.id, motivoRechazo: motivo, observaciones: obs })}
            onSelectGanador={(compraId, cotizacionId) => selectGanadorMut.mutate({ compraId, cotizacionId })}
            aprobando={aprobarMut.isPending}
            devolviendo={devolverMut.isPending}
            selectingGanador={selectGanadorMut.isPending}
          />
        )}

        {/* Notificación */}
        {notif && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
            background: '#111827', color: 'white', borderRadius: 12,
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)', maxWidth: 340,
          }}>
            <CheckCircle size={15} color="#22C55E" />
            <span style={{ fontSize: 14 }}>{notif}</span>
            <button onClick={() => setNotif(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', marginLeft: 8 }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}