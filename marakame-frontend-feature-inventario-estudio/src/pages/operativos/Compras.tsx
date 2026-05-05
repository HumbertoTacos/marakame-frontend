import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, CheckCircle, XCircle, Plus, FileText, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Requisicion, Cotizacion } from '../../types';

export function Compras() {
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const esDirectorOFinanzas = usuario?.rol === 'ADMIN_GENERAL' || usuario?.rol === 'RRHH_FINANZAS';

  const [showModalReq, setShowModalReq] = useState(false);
  const [showModalCot, setShowModalCot] = useState<number | null>(null); // Guardamos el ID de la requisicion

  // Form states
  const [nuevaReq, setNuevaReq] = useState({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '' });
  const [nuevaCot, setNuevaCot] = useState({ proveedor: '', precio: '', tiempoEntrega: '' });

  const { data: requisiciones, isLoading } = useQuery<Requisicion[]>({
    queryKey: ['requisiciones'],
    queryFn: () => apiClient.get('/compras/requisicion').then(res => res.data.data)
  });

  const crearReqMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/compras/requisicion', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
      setShowModalReq(false);
      setNuevaReq({ areaSolicitante: '', descripcion: '', justificacion: '', presupuestoEstimado: '' });
    }
  });

  const crearCotMut = useMutation({
    mutationFn: ({ reqId, data }: { reqId: number, data: Record<string, unknown> }) => apiClient.post(`/compras/requisicion/${reqId}/cotizacion`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
      setShowModalCot(null);
      setNuevaCot({ proveedor: '', precio: '', tiempoEntrega: '' });
    }
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ reqId, estado }: { reqId: number, estado: string }) => apiClient.put(`/compras/requisicion/${reqId}/estado`, { estado, observacionesVoBo: 'Aprobado Vía Sistema' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
    }
  });

  const generarOrdenMut = useMutation({
    mutationFn: ({ reqId, proveedor, total }: { reqId: number, proveedor: string, total: number }) => apiClient.post(`/compras/requisicion/${reqId}/orden`, { proveedor, total }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
    }
  });

  const mapEstadoTag = (estado: string) => {
    switch(estado) {
      case 'BORRADOR': case 'PENDIENTE_COTIZACION': return <span style={{ background: '#edf2f7', color: '#4a5568', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{estado}</span>;
      case 'EN_COMPARATIVO': return <span style={{ background: '#faf089', color: '#744210', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{estado}</span>;
      case 'PENDIENTE_AUTORIZACION': return <span style={{ background: '#feebc8', color: '#dd6b20', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{estado}</span>;
      case 'AUTORIZADO': case 'ORDEN_GENERADA': return <span style={{ background: '#c6f6d5', color: '#22543d', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{estado}</span>;
      case 'RECHAZADO': return <span style={{ background: '#fed7d7', color: '#822727', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{estado}</span>;
      default: return <span>{estado}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCart size={28} color="#3182ce" style={{ marginRight: '1rem' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>Módulo de Compras</h1>
        </div>
        <button 
          onClick={() => setShowModalReq(true)}
          style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nueva Requisición
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {isLoading ? (
          <div>Cargando requisiciones...</div>
        ) : requisiciones?.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px' }}>No hay requisiciones activas.</div>
        ) : (
          requisiciones?.map((req) => (
            <div key={req.id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '1.5rem', borderLeft: '4px solid #3182ce' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="#718096" /> Folio: {req.folio}
                  </h3>
                  <p style={{ color: '#718096', fontSize: '14px', marginTop: '0.25rem' }}>Solicitado por: {req.usuario.nombre} {req.usuario.apellidos} ({req.areaSolicitante})</p>
                </div>
                <div>{mapEstadoTag(req.estado)}</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p><strong>Descripción:</strong> {req.descripcion}</p>
                <p style={{ color: '#4a5568', fontSize: '14px', marginTop: '0.5rem' }}><strong>Justificación:</strong> {req.justificacion}</p>
                <p style={{ color: '#4a5568', fontSize: '14px', marginTop: '0.5rem' }}><strong>Presupuesto Estimado:</strong> ${req.presupuestoEstimado?.toLocaleString()} MXN</p>
              </div>

              {/* Sección de Cotizaciones */}
              {req.cotizaciones && req.cotizaciones.length > 0 && (
                <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Cotizaciones Recibidas:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {req.cotizaciones?.map((cot: Cotizacion) => (
                      <li key={cot.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span>🏢 {cot.proveedor}</span>
                        <span style={{ fontWeight: 'bold' }}>${cot.precio?.toLocaleString()} MXN</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botonera de Acciones según estado */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                {/* Flujo Normal: Solicitar Cotizaciones */}
                {(req.estado === 'BORRADOR' || req.estado === 'EN_COMPARATIVO') && (
                  <button onClick={() => setShowModalCot(req.id)} style={{ padding: '0.5rem 1rem', border: '1px solid #3182ce', color: '#3182ce', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                    + Añadir Cotización
                  </button>
                )}
                
                {/* Si hay cotizaciones, se puede mandar a Autorizar */}
                {(req.estado === 'EN_COMPARATIVO') && (
                  <button onClick={() => cambiarEstadoMut.mutate({ reqId: req.id, estado: 'PENDIENTE_AUTORIZACION' })} style={{ padding: '0.5rem 1rem', background: '#ed8936', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                    Enviar a Autorización
                  </button>
                )}

                {/* Si requiere autorización y soy Directivo/Finanzas */}
                {(req.estado === 'PENDIENTE_AUTORIZACION' && esDirectorOFinanzas) && (
                  <>
                    <button onClick={() => cambiarEstadoMut.mutate({ reqId: req.id, estado: 'RECHAZADO' })} style={{ display: 'flex', alignItems:'center', padding: '0.5rem 1rem', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                      <XCircle size={16} style={{marginRight:'0.5rem'}}/> Rechazar
                    </button>
                    <button onClick={() => cambiarEstadoMut.mutate({ reqId: req.id, estado: 'AUTORIZADO' })} style={{ display: 'flex', alignItems:'center', padding: '0.5rem 1rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                      <CheckCircle size={16} style={{marginRight:'0.5rem'}}/> Autorizar Gasto
                    </button>
                  </>
                )}

                {/* Si está Autorizado, Almacén puede generar la orden final */}
                {(req.estado === 'AUTORIZADO' && req.cotizaciones && req.cotizaciones.length > 0) && (
                   <button 
                     onClick={() => generarOrdenMut.mutate({ 
                       reqId: req.id, 
                       proveedor: req.cotizaciones ? req.cotizaciones[0].proveedor : '', 
                       total: req.cotizaciones ? req.cotizaciones[0].precio : 0 
                     })} 
                     style={{ padding: '0.5rem 1rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                     Generar Orden de Compra
                   </button>
                )}

                {/* Si ya hay orden generada */}
                {req.estado === 'ORDEN_GENERADA' && (
                  <div style={{ color: '#38a169', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle2 size={18} style={{marginRight:'0.5rem'}}/> Orden Emitida y en Tránsito
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Requisición */}
      {showModalReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nueva Requisición de Compra</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="Área solicitante (Ej: Mantenimiento)" value={nuevaReq.areaSolicitante} onChange={e => setNuevaReq({...nuevaReq, areaSolicitante: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}/>
              <textarea placeholder="Descripción exacta de los artículos o servicio requerido..." value={nuevaReq.descripcion} onChange={e => setNuevaReq({...nuevaReq, descripcion: e.target.value})} rows={3} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px', resize: 'vertical' }}></textarea>
              <textarea placeholder="Justificación (¿Por qué se necesita?)..." value={nuevaReq.justificacion} onChange={e => setNuevaReq({...nuevaReq, justificacion: e.target.value})} rows={2} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px', resize: 'vertical' }}></textarea>
              <input type="number" placeholder="Presupuesto Estimado (MXN)" value={nuevaReq.presupuestoEstimado} onChange={e => setNuevaReq({...nuevaReq, presupuestoEstimado: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setShowModalReq(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>Cancelar</button>
              <button onClick={() => crearReqMut.mutate(nuevaReq)} style={{ padding: '0.5rem 1rem', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar Requisición</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cotización */}
      {showModalCot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Añadir Cotización</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="Nombre del Proveedor" value={nuevaCot.proveedor} onChange={e => setNuevaCot({...nuevaCot, proveedor: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}/>
              <input type="number" placeholder="Precio Total (MXN)" value={nuevaCot.precio} onChange={e => setNuevaCot({...nuevaCot, precio: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}/>
              <input type="text" placeholder="Tiempo estimado de entrega" value={nuevaCot.tiempoEntrega} onChange={e => setNuevaCot({...nuevaCot, tiempoEntrega: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setShowModalCot(null)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>Cancelar</button>
              <button onClick={() => crearCotMut.mutate({ reqId: showModalCot, data: nuevaCot })} style={{ padding: '0.5rem 1rem', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
