import { useState } from 'react';
import React from 'react';
import {
  ShieldCheck, X, CheckCircle, XCircle, Building2,
  Clock, Search, FileText, ChevronDown, ChevronUp,
  AlertCircle, Loader2, Package,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  getComprasRevisionDireccion,
  autorizarCompraDireccion,
  rechazarCompraDireccion,
} from '../../services/compras.service';
import type { Requisicion, Cotizacion } from '../../types';
import { getCotizacionProveedorNombre } from '../../types';

// ─────────────────────────────────────────────
// HELPERS UI
// ─────────────────────────────────────────────
const Modal = ({
  children, onClose, title, width = 760,
}: {
  children: React.ReactNode; onClose: () => void; title: string; width?: number;
}) => createPortal(
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    zIndex: 999999, backdropFilter: 'blur(3px)', padding: '32px 24px', overflowY: 'auto',
  }}>
    <div style={{
      background: 'white', borderRadius: 16, width: '100%', maxWidth: width,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 25px 60px rgba(0,0,0,0.2)', margin: 'auto',
    }}>
      <div style={{
        padding: '18px 24px', borderBottom: '1px solid #E8ECF0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{title}</span>
        <button onClick={onClose} style={{
          background: '#F3F4F6', border: 'none', cursor: 'pointer',
          color: '#6B7280', display: 'flex', borderRadius: 8, padding: 6,
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
  children, variant = 'primary', onClick, disabled, icon,
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
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
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
      fontFamily: 'inherit', background: 'white',
    }} />
  </div>
);

// ─────────────────────────────────────────────
// HELPER: totales correctos por producto
// ─────────────────────────────────────────────
function calcularResumen(compra: Requisicion) {
  const cotizaciones = compra.cotizaciones ?? [];
  const detallesReq  = compra.requisicion?.detalles ?? [];

  const filasPorProducto = detallesReq.map(d => {
    const cot        = cotizaciones.find(c => c.requisicionDetalleId === d.id);
    const precioUnit = cot ? Number(cot.precioUnitario ?? cot.precio ?? 0) : 0;
    const total      = precioUnit * d.cantidadSolicitada;
    return { detalle: d, cot, precioUnit, total };
  });

  const cotsLegacy         = cotizaciones.filter(c => !c.requisicionDetalleId);
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
    resumenProv[nombre].cantidad += 1;
    resumenProv[nombre].subtotal += f.total;
  }
  const gruposProv = Object.values(resumenProv);

  return { filasPorProducto, cotsLegacy, usaFlujoPorProducto, subtotal, iva, totalConIva, gruposProv };
}

// ─────────────────────────────────────────────
// MODAL DETALLE / AUTORIZACIÓN
// ─────────────────────────────────────────────
function ModalDetalle({
  compra, onClose, onAutorizar, onRechazar, autorizando, rechazando,
}: {
  compra: Requisicion;
  onClose: () => void;
  onAutorizar: (obs?: string) => void;
  onRechazar: (motivo: string) => void;
  autorizando: boolean;
  rechazando: boolean;
}) {
  const [tab, setTab]           = useState<'info' | 'cotizaciones'>('info');
  const [observaciones, setObs] = useState('');
  const [motivo, setMotivo]     = useState('');
  const [accion, setAccion]     = useState<'autorizar' | 'rechazar' | null>(null);
  const [enviado, setEnviado]   = useState(false);

  const { filasPorProducto, cotsLegacy, usaFlujoPorProducto, subtotal, iva, totalConIva, gruposProv } = calcularResumen(compra);
  const detallesReq = compra.requisicion?.detalles ?? [];
  const presupuesto = compra.presupuestoEstimado;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', fontFamily: 'inherit', borderRadius: 8,
    background: active ? '#FDF2F8' : 'transparent',
    color: active ? '#BE185D' : '#6B7280',
  });

  return (
    <Modal title={`Autorización — ${compra.folio}`} onClose={onClose} width={860}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E8ECF0', paddingBottom: 8 }}>
        <button style={tabStyle(tab === 'info')} onClick={() => setTab('info')}>Información</button>
        <button style={tabStyle(tab === 'cotizaciones')} onClick={() => setTab('cotizaciones')}>
          Mejor opción por artículo ({detallesReq.length || (compra.cotizaciones?.length ?? 0)})
        </button>
      </div>

      {/* TAB: INFORMACIÓN */}
      {tab === 'info' && (
        <>
          {/* Encabezado con gradiente */}
          <div style={{ background: 'linear-gradient(135deg, #831843 0%, #BE185D 100%)', borderRadius: 12, padding: '14px 20px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Folio</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{compra.folio}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Área</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{compra.areaSolicitante}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Total a autorizar (c/IVA)</div>
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
          </div>

          {/* Info general */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {compra.requisicion && <div><strong>Req. origen:</strong> {compra.requisicion.folio}</div>}
              <div><strong>Tipo:</strong> {compra.tipo}</div>
              <div>
                <strong>Presupuesto estimado:</strong>{' '}
                {presupuesto && presupuesto > 0
                  ? `$${presupuesto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                  : <span style={{ color: '#9CA3AF' }}>No especificado</span>}
              </div>
              <div><strong>Fecha:</strong> {new Date(compra.createdAt).toLocaleDateString('es-MX')}</div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div>
                <strong>Responsable:</strong>{' '}
                {compra.requisicion?.usuarioSolicita
                  ? `${compra.requisicion.usuarioSolicita.nombre} ${compra.requisicion.usuarioSolicita.apellidos}`
                  : `${compra.usuario?.nombre ?? ''} ${compra.usuario?.apellidos ?? ''}`}
              </div>
              <div><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div><strong>IVA (16%):</strong> ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div style={{ color: '#16A34A', fontWeight: 700 }}>
                <strong style={{ color: '#374151', fontWeight: 600 }}>Total c/IVA:</strong>{' '}
                ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {compra.requisicion?.justificacion && (
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#111827' }}>Justificación</p>
              <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>{compra.requisicion.justificacion}</p>
            </div>
          )}

          {/* Resumen por proveedor */}
          {gruposProv.length > 0 && (
            <div style={{ border: '1px solid #BFDBFE', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
              <div style={{ padding: '9px 16px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={13} style={{ color: '#2563EB' }} />
                <span style={{ fontWeight: 700, fontSize: 11, color: '#1D4ED8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                  Órdenes de compra que se autorizarán
                </span>
                <span style={{ marginLeft: 'auto', background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  {gruposProv.length} {gruposProv.length === 1 ? 'proveedor' : 'proveedores'}
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
                {gruposProv.map((g, i) => (
                  <div key={i} style={{ flex: '1 1 180px', border: '1px solid #BFDBFE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: '10px 14px', background: '#F8FBFF' }}>
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
        </>
      )}

      {/* TAB: MEJOR OPCIÓN POR ARTÍCULO */}
      {tab === 'cotizaciones' && (
        <>
          {/* Flujo nuevo: por producto */}
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
                      {['#', 'Artículo', 'Cant.', 'Proveedor seleccionado', 'P. Unit.', 'Total', 'Entrega', 'Forma pago'].map((h, i) => (
                        <th key={i} style={{
                          padding: '8px 12px', fontWeight: 600, color: '#94A3B8', fontSize: 10,
                          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                          textAlign: (i === 4 || i === 5) ? 'right' as const : (i === 2 ? 'center' as const : 'left' as const),
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasPorProducto.map((f, idx) => (
                      <tr key={f.detalle.id} style={{
                        borderTop: idx === 0 ? 'none' : '1px solid #F1F5F9',
                        background: f.cot ? 'white' : '#FFF8F0',
                        borderLeft: f.cot ? '3px solid transparent' : '3px solid #FED7AA',
                      }}>
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

          {/* Flujo legacy */}
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

          {!usaFlujoPorProducto && cotsLegacy.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center' as const, color: '#9CA3AF' }}>
              <Building2 size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ margin: 0 }}>No hay cotizaciones registradas</p>
            </div>
          )}
        </>
      )}

      {/* ACCIONES */}
      {!accion && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          <Btn variant="success" icon={<CheckCircle size={15} />} onClick={() => setAccion('autorizar')}>
            Autorizar Requisición
          </Btn>
          <Btn variant="danger" icon={<XCircle size={15} />} onClick={() => setAccion('rechazar')}>
            Rechazar Requisición
          </Btn>
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        </div>
      )}

      {accion === 'autorizar' && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} />
            La compra quedará autorizada y habilitada para continuar el proceso de adquisición.
          </div>
          <Textarea
            label="Observaciones de Dirección (opcionales)"
            placeholder="Comentarios adicionales para el expediente..."
            value={observaciones}
            onChange={e => setObs(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="success" icon={autorizando ? <Loader2 size={15} /> : <CheckCircle size={15} />} disabled={autorizando || enviado}
              onClick={() => {
                if (enviado) return;
                setEnviado(true);
                onAutorizar(observaciones.trim() || undefined);
              }}>
              {autorizando ? 'Autorizando…' : 'Confirmar autorización'}
            </Btn>
            <Btn variant="ghost" onClick={() => setAccion(null)}>Cancelar</Btn>
          </div>
        </div>
      )}

      {accion === 'rechazar' && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 14, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            Al rechazar, la requisición quedará cancelada y no continuará el proceso.
          </div>
          <Textarea
            label="Motivo de rechazo (requerido)"
            placeholder="Fundamento de la decisión de rechazo..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
          />
          {!motivo.trim() && (
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>* El motivo de rechazo es obligatorio.</p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="danger" icon={rechazando ? <Loader2 size={15} /> : <XCircle size={15} />}
              disabled={rechazando || !motivo.trim()}
              onClick={() => onRechazar(motivo.trim())}>
              {rechazando ? 'Rechazando…' : 'Confirmar rechazo'}
            </Btn>
            <Btn variant="ghost" onClick={() => setAccion(null)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function DireccionComprasPage() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda]     = useState('');
  const [seleccionada, setSelec]    = useState<Requisicion | null>(null);
  const [notif, setNotif]           = useState<string | null>(null);
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3500); };

  const { data: compras = [], isLoading } = useQuery<Requisicion[]>({
    queryKey: ['compras-direccion'],
    queryFn: getComprasRevisionDireccion,
  });

  const autorizarMut = useMutation({
    mutationFn: ({ id, obs }: { id: number; obs?: string }) =>
      autorizarCompraDireccion(id, obs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras-direccion'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setSelec(null);
      notify('✅ Requisición autorizada por Dirección General');
    },
    onError: (err: any) => notify(`❌ ${err?.response?.data?.message ?? err?.message}`),
  });

  const rechazarMut = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      rechazarCompraDireccion(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras-direccion'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setSelec(null);
      notify('Requisición rechazada por Dirección General');
    },
    onError: (err: any) => notify(`❌ ${err?.response?.data?.message ?? err?.message}`),
  });

  const toggle = (id: number) => {
    setExpandidas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtradas = compras.filter(c =>
    c.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.areaSolicitante.toLowerCase().includes(busqueda.toLowerCase())
  );

  const pendientes = compras.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Notificación */}
      {notif && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          background: '#111827', color: 'white', borderRadius: 12,
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)', maxWidth: 360,
        }}>
          <span style={{ fontSize: 14 }}>{notif}</span>
          <button onClick={() => setNotif(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Autorización de Requisiciones
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
            Dirección General — revisión y autorización de compras
          </p>
        </div>
        <div style={{
          background: pendientes > 0 ? '#FDF2F8' : '#F9FAFB',
          border: `1px solid ${pendientes > 0 ? '#FBCFE8' : '#E8ECF0'}`,
          borderRadius: 12, padding: '10px 18px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: pendientes > 0 ? '#BE185D' : '#6B7280' }}>{pendientes}</div>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            Pendiente{pendientes !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Banner informativo */}
      <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#9D174D' }}>
        <ShieldCheck size={18} color="#BE185D" style={{ flexShrink: 0 }} />
        <span>
          Las requisiciones listadas fueron aprobadas por Jefatura Administrativa y están pendientes de autorización final por Dirección General.
        </span>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', maxWidth: 380 }}>
        <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          placeholder="Buscar por folio o área..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            border: '1px solid #D1D5DB', borderRadius: 10,
            fontSize: 14, color: '#111827', outline: 'none',
            background: 'white', boxSizing: 'border-box' as const, fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8ECF0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '12px 20px', background: '#F9FAFB', borderBottom: '1px solid #E8ECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            Requisiciones pendientes de autorización
          </span>
          <span style={{ fontSize: 12, color: '#6B7280' }}>{filtradas.length} registro{filtradas.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Cargando requisiciones…</span>
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 600, color: '#6B7280', fontSize: 15 }}>
              {busqueda ? 'Sin resultados para la búsqueda' : 'No hay requisiciones pendientes de autorización'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              {busqueda ? 'Prueba con otro folio o área' : 'Las requisiciones aprobadas por Administración aparecerán aquí'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                {['Folio', 'Área solicitante', 'Responsable', 'Fecha', 'Artículos', 'Proveedores', 'Total estimado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontWeight: 700, color: '#374151', fontSize: 11,
                    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                    borderBottom: '1px solid #E8ECF0',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const { gruposProv, totalConIva } = calcularResumen(c);
                const detalles    = c.requisicion?.detalles ?? [];
                const nArticulos  = detalles.length || (c.cotizaciones?.length ?? 0);
                const nProveedores = gruposProv.length;
                const responsable = c.requisicion?.usuarioSolicita
                  ? `${c.requisicion.usuarioSolicita.nombre} ${c.requisicion.usuarioSolicita.apellidos}`
                  : `${c.usuario?.nombre ?? ''} ${c.usuario?.apellidos ?? ''}`.trim();
                const expanded = expandidas.has(c.id);

                return (
                  <React.Fragment key={c.id}>
                    <tr style={{ borderTop: '1px solid #E8ECF0', background: 'white' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => toggle(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 2 }}>
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <span style={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>{c.folio}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{c.areaSolicitante}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>{responsable || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                        {new Date(c.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      {/* Artículos */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: 6, padding: '3px 9px', fontWeight: 600, fontSize: 12 }}>
                          <Package size={11} /> {nArticulos}
                        </span>
                      </td>
                      {/* Proveedores */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: nProveedores > 0 ? '#F0FDF4' : '#FEF2F2', color: nProveedores > 0 ? '#16A34A' : '#DC2626', border: `1px solid ${nProveedores > 0 ? '#BBF7D0' : '#FECACA'}`, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600 }}>
                          {nProveedores > 0 ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                          {nProveedores > 0 ? `${nProveedores}` : '—'}
                        </span>
                      </td>
                      {/* Total estimado */}
                      <td style={{ padding: '12px 16px' }}>
                        {totalConIva > 0 ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>
                              ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>IVA incluido</div>
                          </>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => setSelec(c)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#FDF2F8', color: '#BE185D', border: '1px solid #FBCFE8',
                            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <ShieldCheck size={13} /> Revisar
                        </button>
                      </td>
                    </tr>

                    {/* Fila expandida — desglose por producto */}
                    {expanded && (
                      <tr style={{ background: '#FAFBFC', borderTop: '1px solid #E8ECF0' }}>
                        <td colSpan={8} style={{ padding: '0 16px 14px 48px' }}>
                          {(() => {
                            const { filasPorProducto: fps, cotsLegacy: legacy, usaFlujoPorProducto: porProd } = calcularResumen(c);
                            if (porProd) {
                              return (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 10 }}>
                                  <thead>
                                    <tr style={{ background: '#F3F4F6' }}>
                                      {['#', 'Artículo', 'Proveedor', 'P. Unit.', 'Cant.', 'Total', 'Entrega'].map(h => (
                                        <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E8ECF0' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {fps.map(f => (
                                      <tr key={f.detalle.id} style={{ borderTop: '1px solid #E8ECF0', background: f.cot ? 'white' : '#FFF8F0' }}>
                                        <td style={{ padding: '7px 12px', color: '#94A3B8' }}>{f.detalle.numero}</td>
                                        <td style={{ padding: '7px 12px', fontWeight: 600, color: '#0F172A' }}>{f.detalle.productoNombre ?? '—'}</td>
                                        <td style={{ padding: '7px 12px' }}>
                                          {f.cot
                                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                                                <CheckCircle size={10} /> {getCotizacionProveedorNombre(f.cot)}
                                              </span>
                                            : <span style={{ fontSize: 11, color: '#F97316' }}>Sin cotización</span>}
                                        </td>
                                        <td style={{ padding: '7px 12px', fontWeight: 600 }}>
                                          {f.precioUnit > 0 ? `$${f.precioUnit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                        <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700 }}>{f.detalle.cantidadSolicitada}</td>
                                        <td style={{ padding: '7px 12px', fontWeight: 700, color: f.total > 0 ? '#0F172A' : '#CBD5E1' }}>
                                          {f.total > 0 ? `$${f.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                        <td style={{ padding: '7px 12px', color: '#6B7280' }}>{f.cot?.tiempoEntrega ?? '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }
                            if (legacy.length > 0) {
                              return (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 10 }}>
                                  <thead>
                                    <tr style={{ background: '#F3F4F6' }}>
                                      {['Proveedor', 'Precio', 'Entrega', 'Pago'].map(h => (
                                        <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E8ECF0' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {legacy.map((cot: Cotizacion) => (
                                      <tr key={cot.id} style={{ borderTop: '1px solid #E8ECF0' }}>
                                        <td style={{ padding: '7px 12px', fontWeight: 500, color: '#111827' }}>{getCotizacionProveedorNombre(cot)}</td>
                                        <td style={{ padding: '7px 12px', fontWeight: 700 }}>${Number(cot.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '7px 12px', color: '#6B7280' }}>{cot.tiempoEntrega ?? '—'}</td>
                                        <td style={{ padding: '7px 12px', color: '#6B7280' }}>{cot.formaPago ?? '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            }
                            return <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9CA3AF' }}>Sin cotizaciones registradas.</p>;
                          })()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de detalle / autorización */}
      {seleccionada && (
        <ModalDetalle
          compra={seleccionada}
          onClose={() => setSelec(null)}
          autorizando={autorizarMut.isPending}
          rechazando={rechazarMut.isPending}
          onAutorizar={(obs) => autorizarMut.mutate({ id: seleccionada.id, obs })}
          onRechazar={(motivo) => rechazarMut.mutate({ id: seleccionada.id, motivo })}
        />
      )}
    </div>
  );
}
