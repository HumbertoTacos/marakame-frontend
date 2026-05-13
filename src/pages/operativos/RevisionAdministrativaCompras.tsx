import { useState } from 'react';
import React from 'react';
import {
  ClipboardCheck, Eye, X, Send, RotateCcw, CheckCircle,
  Clock, AlertCircle, Search, Building2, Package,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  getComprasRevisionAdmin,
  aprobarCompraAdministracion,
  devolverCompraACompras,
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
// HELPER: calcular totales por producto
// ─────────────────────────────────────────────
function calcularResumen(compra: Requisicion) {
  const cotizaciones = compra.cotizaciones ?? [];
  const detallesReq  = compra.requisicion?.detalles ?? [];

  // Nuevo flujo: cot ligada a un detalle vía requisicionDetalleId
  const filasPorProducto = detallesReq.map(d => {
    const cot = cotizaciones.find(c => c.requisicionDetalleId === d.id);
    const precioUnit = cot ? Number(cot.precioUnitario ?? cot.precio ?? 0) : 0;
    const total      = precioUnit * d.cantidadSolicitada;
    return { detalle: d, cot, precioUnit, total };
  });

  // Cotizaciones legacy (sin requisicionDetalleId — flujo antiguo)
  const cotsLegacy         = cotizaciones.filter(c => !c.requisicionDetalleId);
  const usaFlujoPorProducto = filasPorProducto.some(f => f.cot);

  const subtotal = filasPorProducto.reduce((s, f) => s + f.total, 0)
                 + cotsLegacy.reduce((s, c) => s + Number(c.precio ?? 0), 0);
  const iva         = subtotal * 0.16;
  const totalConIva = subtotal + iva;

  // Resumen por proveedor
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
// MODAL DETALLE
// ─────────────────────────────────────────────
function ModalDetalle({
  compra,
  onClose,
  onAprobar,
  onDevolver,
  aprobando,
  devolviendo,
}: {
  compra: Requisicion;
  onClose: () => void;
  onAprobar: (observaciones?: string) => void;
  onDevolver: (motivo: string, observaciones?: string) => void;
  aprobando: boolean;
  devolviendo: boolean;
}) {
  const [tab, setTab] = useState<'info' | 'cotizaciones'>('info');
  const [observaciones, setObservaciones] = useState('');
  const [motivo, setMotivo] = useState('');
  const [accion, setAccion] = useState<'aprobar' | 'devolver' | null>(null);

  const { filasPorProducto, cotsLegacy, usaFlujoPorProducto, subtotal, iva, totalConIva, gruposProv } = calcularResumen(compra);
  const detallesReq = compra.requisicion?.detalles ?? [];

  const tabStyle = (active: boolean) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', fontFamily: 'inherit', borderRadius: 8,
    background: active ? '#EFF6FF' : 'transparent',
    color: active ? '#2563EB' : '#6B7280',
  } as React.CSSProperties);

  return (
    <Modal title={`Revisión — ${compra.folio}`} onClose={onClose} width={820}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E8ECF0', paddingBottom: 8 }}>
        <button style={tabStyle(tab === 'info')} onClick={() => setTab('info')}>Información</button>
        <button style={tabStyle(tab === 'cotizaciones')} onClick={() => setTab('cotizaciones')}>
          Mejor opción por artículo ({detallesReq.length || (compra.cotizaciones?.length ?? 0)})
        </button>
      </div>

      {tab === 'info' && (
        <>
          {/* Encabezado con gradiente */}
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
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{compra.areaSolicitante}</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
                <div>
                  <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>Total estimado (c/IVA)</div>
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
              <div><strong>Presupuesto estimado:</strong> ${(compra.presupuestoEstimado ?? 0).toLocaleString('es-MX')}</div>
              <div><strong>Fecha:</strong> {new Date(compra.createdAt).toLocaleDateString('es-MX')}</div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div><strong>Solicitante:</strong> {compra.requisicion?.usuarioSolicita
                ? `${compra.requisicion.usuarioSolicita.nombre} ${compra.requisicion.usuarioSolicita.apellidos}`
                : `${compra.usuario?.nombre ?? ''} ${compra.usuario?.apellidos ?? ''}`}
              </div>
              <div><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div><strong>IVA (16%):</strong> ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div style={{ color: '#16A34A', fontWeight: 700 }}><strong style={{ color: '#374151', fontWeight: 600 }}>Total c/IVA:</strong> ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
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
                  Órdenes que se generarán
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

      {tab === 'cotizaciones' && (
        <>
          {/* Flujo nuevo: por producto */}
          {usaFlujoPorProducto && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '9px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={13} style={{ color: '#D97706' }} />
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

      {/* Sección de acciones */}
      {!accion && (
        <div style={{ borderTop: '1px solid #E8ECF0', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          <Btn variant="success" icon={<CheckCircle size={15} />} onClick={() => setAccion('aprobar')}>
            Aprobar y enviar a Dirección
          </Btn>
          <Btn variant="danger" icon={<RotateCcw size={15} />} onClick={() => setAccion('devolver')}>
            Devolver a Compras
          </Btn>
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
  const [seleccionada, setSeleccionada] = useState<Requisicion | null>(null);
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
      setSeleccionada(null);
      notify('Compra aprobada — enviada a Dirección General');
    },
    onError: (err: any) => notify(`Error: ${err?.response?.data?.message ?? err?.message}`),
  });

  const devolverMut = useMutation({
    mutationFn: ({ id, motivoRechazo, observaciones }: { id: number; motivoRechazo: string; observaciones?: string }) =>
      devolverCompraACompras(id, { motivoRechazo, observaciones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras-admin-revision'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setSeleccionada(null);
      notify('Compra devuelta al área de compras');
    },
    onError: (err: any) => notify(`Error: ${err?.response?.data?.message ?? err?.message}`),
  });

  const filtradas = compras.filter(c =>
    c.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.areaSolicitante.toLowerCase().includes(busqueda.toLowerCase())
  );

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
              <Clock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
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
                  {['Folio', 'Área', 'Requisición origen', 'Artículos', 'Proveedores', 'Total estimado', 'Fecha', ''].map((h, i) => (
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
                  const { gruposProv, totalConIva } = calcularResumen(compra);
                  const detalles = compra.requisicion?.detalles ?? [];
                  const nArticulos = detalles.length || (compra.cotizaciones?.length ?? 0);
                  const nProveedores = gruposProv.length;

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
                        {compra.areaSolicitante}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', fontSize: 13, color: '#6B7280' }}>
                        {compra.requisicion ? (
                          <span style={{ fontFamily: 'monospace', background: '#EFF6FF', color: '#2563EB', padding: '2px 7px', borderRadius: 4, fontSize: 12 }}>
                            {compra.requisicion.folio}
                          </span>
                        ) : '—'}
                      </td>
                      {/* Artículos */}
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          <Package size={12} /> {nArticulos}
                        </span>
                      </td>
                      {/* Proveedores */}
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: nProveedores > 0 ? '#F0FDF4' : '#FEF2F2', color: nProveedores > 0 ? '#16A34A' : '#DC2626', border: `1px solid ${nProveedores > 0 ? '#BBF7D0' : '#FECACA'}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {nProveedores > 0 ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {nProveedores > 0 ? `${nProveedores} ${nProveedores === 1 ? 'proveedor' : 'proveedores'}` : 'Sin cotizar'}
                        </span>
                      </td>
                      {/* Total estimado */}
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle' }}>
                        {totalConIva > 0 ? (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>
                              ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>IVA incluido</div>
                          </>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', fontSize: 13, color: '#6B7280' }}>
                        {new Date(compra.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td style={{ padding: '1.1rem 1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          onClick={() => setSeleccionada(compra)}
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
            onClose={() => setSeleccionada(null)}
            onAprobar={(obs) => aprobarMut.mutate({ id: seleccionada.id, observaciones: obs })}
            onDevolver={(motivo, obs) => devolverMut.mutate({ id: seleccionada.id, motivoRechazo: motivo, observaciones: obs })}
            aprobando={aprobarMut.isPending}
            devolviendo={devolverMut.isPending}
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
