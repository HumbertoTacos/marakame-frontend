import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageSearch, ArrowDownRight, ArrowUpRight, Plus, Box, Search, Filter, MoreVertical } from 'lucide-react';
import apiClient from '../../services/api';
import type { Producto, Movimiento } from '../../types';

export function Almacen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'INVENTARIO' | 'KARDEX'>('INVENTARIO');
  const [showModal, setShowModal] = useState<'NUEVO_PRODUCTO' | 'NUEVO_MOVIMIENTO' | null>(null);

  // States para nuevos registros
  const [productoData, setProductoData] = useState({ codigo: '', nombre: '', categoria: 'MEDICAMENTO', stockMinimo: 5 });
  const [movimientoData, setMovimientoData] = useState({ productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '' });

  // Fetch
  const { data: productosData, isLoading: isLoadingProductos } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: () => apiClient.get('/almacen/productos').then(res => res.data.data)
  });

  const { data: movimientosData, isLoading: isLoadingMovimientos } = useQuery<Movimiento[]>({
    queryKey: ['movimientos'],
    queryFn: () => apiClient.get('/almacen/movimientos').then(res => res.data.data),
    enabled: activeTab === 'KARDEX'
  });

  // Muts
  const crearProducto = useMutation({
    mutationFn: (data: Record<string, any>) => apiClient.post('/almacen/productos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowModal(null);
      setProductoData({ codigo: '', nombre: '', categoria: 'MEDICAMENTO', stockMinimo: 5 });
    }
  });

  const registrarMovimiento = useMutation({
    mutationFn: (data: Record<string, any>) => apiClient.post('/almacen/movimientos', {
      ...data, 
      productoId: parseInt(data.productoId, 10),
      cantidad: parseInt(data.cantidad, 10)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      setShowModal(null);
      setMovimientoData({ productoId: '', tipo: 'ENTRADA', cantidad: 1, observaciones: '' });
    }
  });

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header Almacén Premium */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow)'
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
            onClick={() => setShowModal('NUEVO_PRODUCTO')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0.8rem 1.5rem', 
              backgroundColor: 'white', 
              color: 'var(--text-h)', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              cursor: 'pointer', 
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Plus size={18} style={{ marginRight: '0.6rem' }} /> Nuevo Producto
          </button>
          <button 
            onClick={() => setShowModal('NUEVO_MOVIMIENTO')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0.8rem 1.8rem', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '16px', 
              cursor: 'pointer', 
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <Box size={18} style={{ marginRight: '0.6rem' }} /> Reg. Movimiento
          </button>
        </div>
      </div>

      {/* Tabs Premium */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        background: 'rgba(241, 245, 249, 0.5)',
        padding: '0.5rem',
        borderRadius: '20px',
        width: 'fit-content',
        marginBottom: '2.5rem'
      }}>
        <button 
          onClick={() => setActiveTab('INVENTARIO')}
          style={{ 
            padding: '0.75rem 2rem', 
            border: 'none', 
            borderRadius: '15px',
            backgroundColor: activeTab === 'INVENTARIO' ? 'white' : 'transparent', 
            fontWeight: '700', 
            color: activeTab === 'INVENTARIO' ? 'var(--primary)' : '#64748b', 
            cursor: 'pointer', 
            fontSize: '14px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'INVENTARIO' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
          }}>
          Inventario Actual
        </button>
        <button 
          onClick={() => setActiveTab('KARDEX')}
          style={{ 
            padding: '0.75rem 2rem', 
            border: 'none', 
            borderRadius: '15px',
            backgroundColor: activeTab === 'KARDEX' ? 'white' : 'transparent', 
            fontWeight: '700', 
            color: activeTab === 'KARDEX' ? 'var(--primary)' : '#64748b', 
            cursor: 'pointer', 
            fontSize: '14px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'KARDEX' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
          }}>
          Kardex (Histórico)
        </button>
      </div>

      {/* Content Area Premium */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: 'var(--radius-xl)', 
        boxShadow: 'var(--shadow-lg)', 
        overflow: 'hidden',
        border: '1px solid var(--border)',
        minHeight: '600px'
      }}>
        
        {/* Filtros Internos */}
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
            <div style={{ position: 'relative', width: '400px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                <input 
                    type="text" 
                    placeholder="Buscar por código o nombre..." 
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} 
                />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center' }}><Filter size={18} color="#64748b" /></button>
                <button style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center' }}><MoreVertical size={18} color="#64748b" /></button>
            </div>
        </div>

        {activeTab === 'INVENTARIO' ? (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</th>
                <th style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Actual</th>
                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingProductos ? (
                <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Procesando base de datos...</td></tr>
              ) : productosData?.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.5rem 2.5rem' }}>
                    <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>{prod.codigo}</span>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '15px' }}>{prod.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '0.2rem' }}>ID: {prod.id}</div>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '10px' }}>{prod.categoria}</span>
                  </td>
                  <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '18px' }}>{prod.stockActual}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>{prod.unidad || 'UDS'}</div>
                  </td>
                  <td style={{ padding: '1.5rem 2.5rem', textAlign: 'center' }}>
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
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha y Hora</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                <th style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cant.</th>
                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMovimientos ? (
                <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Consultando kardex clínico...</td></tr>
              ) : movimientosData?.map((mov) => (
                <tr key={mov.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.5rem 2.5rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)' }}>{new Date(mov.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(mov.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-h)' }}>{mov.producto.nombre}</div>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: mov.tipo === 'ENTRADA' ? '#10b981' : '#ef4444', 
                        fontWeight: '800', fontSize: '13px'
                    }}>
                      {mov.tipo === 'ENTRADA' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                      {mov.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px' }}>{mov.cantidad}</div>
                  </td>
                  <td style={{ padding: '1.5rem 2.5rem' }}>
                    <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>{mov.usuario.nombre} {mov.usuario.apellidos}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALS PREMIUM - IMPLEMENTED AS GLASS OVERLAYS */}
      {showModal && (
          <div style={{ 
              position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(8px)', zIndex: 1000, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'fade-in 0.3s ease'
          }}>
              <div style={{ 
                  backgroundColor: 'white', padding: '3rem', borderRadius: '32px', 
                  width: '90%', maxWidth: '550px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.2)'
              }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '2rem', color: 'var(--text-h)' }}>
                      {showModal === 'NUEVO_PRODUCTO' ? 'Añadir al Inventario' : 'Registrar Nuevo Movimiento'}
                  </h2>
                  
                  {showModal === 'NUEVO_PRODUCTO' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <input type="text" placeholder="Código Único" value={productoData.codigo} onChange={e => setProductoData({...productoData, codigo: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}/>
                          <input type="text" placeholder="Nombre del Producto" value={productoData.nombre} onChange={e => setProductoData({...productoData, nombre: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}/>
                          <select value={productoData.categoria} onChange={e => setProductoData({...productoData, categoria: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}>
                              <option value="MEDICAMENTO">Medicamento</option>
                              <option value="INSUMO_MEDICO">Insumo Médico</option>
                              <option value="LIMPIEZA">Limpieza</option>
                          </select>
                      </div>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                           <select value={movimientoData.productoId} onChange={e => setMovimientoData({...movimientoData, productoId: e.target.value})} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                <option value="">Seleccione Producto...</option>
                                {productosData?.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre} (Disponibles: {p.stockActual})</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select value={movimientoData.tipo} onChange={e => setMovimientoData({...movimientoData, tipo: e.target.value})} style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                    <option value="ENTRADA">Entrada (+)</option>
                                    <option value="SALIDA">Salida (-)</option>
                                </select>
                                <input type="number" value={movimientoData.cantidad} onChange={e => setMovimientoData({...movimientoData, cantidad: parseInt(e.target.value) || 1})} style={{ width: '100px', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }}/>
                            </div>
                      </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                      <button onClick={() => setShowModal(null)} style={{ flex: 1, padding: '1rem', borderRadius: '18px', border: '1px solid #e2e8f0', fontWeight: '700', color: '#64748b' }}>Cerrar</button>
                      <button 
                        onClick={() => showModal === 'NUEVO_PRODUCTO' ? crearProducto.mutate(productoData) : registrarMovimiento.mutate(movimientoData)}
                        style={{ flex: 1, padding: '1rem', borderRadius: '18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '800', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
                      >
                        {crearProducto.isPending || registrarMovimiento.isPending ? 'Procesando...' : 'Confirmar Registro'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
