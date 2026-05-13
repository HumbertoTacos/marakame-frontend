import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Server, Calendar, Filter, Eye, X, FileJson, CheckCircle, Trash2, Edit3, Activity } from 'lucide-react';
import apiClient from '../../services/api';
import type { RegistroBitacora } from '../../types';
import { CustomDatePicker } from '../../components/common/DatePicker';
import { format } from 'date-fns';

export function Bitacora() {
  const [modulo, setModulo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [accion, setAccion] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<RegistroBitacora | null>(null);
  
  const { data: logs, isLoading } = useQuery<RegistroBitacora[]>({
    queryKey: ['bitacora', modulo, busqueda, accion, fechaInicio, fechaFin],
    queryFn: () => {
      const params = new URLSearchParams();
      if (modulo) params.append('modulo', modulo);
      if (busqueda) params.append('busqueda', busqueda);
      if (accion) params.append('accion', accion);
      if (fechaInicio) params.append('fechaInicio', format(fechaInicio, 'yyyy-MM-dd'));
      if (fechaFin) params.append('fechaFin', format(fechaFin, 'yyyy-MM-dd'));
      
      return apiClient.get(`/bitacora?${params.toString()}`).then(res => res.data.data);
    }
  });

  const formatearDetalles = (detalle: unknown) => {
    try {
      if (typeof detalle === 'string') return detalle;
      return JSON.stringify(detalle, null, 2);
    } catch {
      return '';
    }
  };

  const renderValorGrafico = (detalleRaw: any) => {
    if (!detalleRaw || (typeof detalleRaw === 'object' && Object.keys(detalleRaw).length === 0)) {
      return <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', fontStyle: 'italic' }}>Sin detalles adicionales registrados.</p>;
    }
    
    if (typeof detalleRaw !== 'object') {
      return <p style={{ color: '#e2e8f0', margin: 0, fontSize: '14px', fontWeight: '500' }}>{String(detalleRaw)}</p>;
    }

    let detalle = { ...detalleRaw };

    if (detalle.body) {
      let bodyParsed = detalle.body;
      if (typeof bodyParsed === 'string') {
        try { bodyParsed = JSON.parse(bodyParsed); } catch (e) { }
      }
      if (typeof bodyParsed === 'object' && bodyParsed !== null) {
        delete detalle.body;
        detalle = { ...detalle, ...bodyParsed };
      }
    }

    if (detalle.url && typeof detalle.url === 'string') {
      const urlParts = detalle.url.split('/').filter(Boolean);
      if (urlParts.length > 2) {
        detalle.url = urlParts.slice(2).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
      }
    }
    
    ['metodo', 'headers', 'ip', 'query'].forEach(k => {
      if (detalle[k]) delete detalle[k];
    });

    const flatDetalle: Record<string, any> = {};
    const flatten = (obj: any, prefix = '') => {
      if (!obj) return;
      Object.entries(obj).forEach(([k, v]) => {
        const newKey = prefix ? `${prefix} > ${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          flatten(v, newKey);
        } else {
          flatDetalle[newKey] = v;
        }
      });
    };
    flatten(detalle);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {Object.entries(flatDetalle).map(([key, value]) => {
          const displayKey = key === 'url' ? 'Módulo Afectado' : key;
          const cleanKey = displayKey === 'Módulo Afectado' ? displayKey : displayKey.replace(/([A-Z])/g, ' $1').trim();
          
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#334155', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                {cleanKey}
              </span>
              <span style={{ fontSize: '14px', color: '#f8fafc', wordBreak: 'break-word', fontWeight: '500' }}>
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        padding: '2rem', 
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '16px', marginRight: '1rem', border: '1px solid #fee2e2' }}>
              <ShieldAlert size={28} color="#dc2626" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Bitácora del Sistema</h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Registro de auditoría transversal y control operativo</p>
            </div>
          </div>
        </div>

        {/* Panel de Filtros Robustos */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Búsqueda de Usuario</label>
            <input 
              type="text"
              placeholder="Nombre o apellidos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Acción / Evento</label>
            <select 
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="">Todas las Acciones</option>
              <option value="CREATE">Crear / Nuevo</option>
              <option value="UPDATE">Actualizar / Editar</option>
              <option value="DELETE">Eliminar / Borrar</option>
              <option value="LOGIN">Inicio de Sesión</option>
              <option value="RECHAZADO">Rechazos</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Módulo</label>
            <select 
              value={modulo} 
              onChange={(e) => setModulo(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="">Todos los Módulos</option>
              <option value="auth">Autenticación (Login)</option>
              <option value="Compras">Compras / Gastos</option>
              <option value="Expediente Clínico">Expediente Clínico</option>
              <option value="Admisiones">Admisiones</option>
              <option value="Almacén">Kardex y Almacén</option>
              <option value="Nóminas">Nóminas</option>
              <option value="Socioeconómico">Socioeconómico</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Desde</label>
            <CustomDatePicker 
              selected={fechaInicio}
              onChange={setFechaInicio}
              placeholderText="Desde..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hasta</label>
            <CustomDatePicker 
              selected={fechaFin}
              onChange={setFechaFin}
              placeholderText="Hasta..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={() => {
                setBusqueda('');
                setModulo('');
                setAccion('');
                setFechaInicio(null);
                setFechaFin(null);
              }}
              style={{ width: '100%', padding: '0.6rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', 
        overflow: 'hidden',
        border: '1px solid #f1f5f9'
      }}>
        {/* Contenedor con Scroll Interno */}
        <div style={{ maxHeight: '600px', overflowY: 'auto', position: 'relative' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>Fecha y Hora</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>Usuario Autor</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>Acción</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>Módulo</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>Detalles</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', borderBottom: '1px solid #e2e8f0' }}>IP</th>
              </tr>
            </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Inspeccionando registros de la bitácora...</td></tr>
            ) : (!logs || logs.length === 0) ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No hay registros en la bitácora transversal.</td></tr>
            ) : (
              logs?.map((log: RegistroBitacora) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                      <Calendar size={14} style={{ marginRight: '0.5rem', color: '#dc2626' }} />
                      {new Date(log.createdAt).toLocaleString('es-MX')}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{log.usuario.nombre} {log.usuario.apellidos}</div>
                    <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', textTransform: 'uppercase' }}>{log.usuario.rol}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: log.accion.includes('DELETE') || log.accion.includes('RECHAZADO') ? '#ef4444' : '#1e293b', fontSize: '13px' }}>
                    {log.accion}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid #e2e8f0' }}>
                      {log.modulo}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <button 
                      onClick={() => setSelectedLog(log)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', 
                        border: '1px solid #fee2e2', borderRadius: '10px', cursor: 'pointer',
                        color: '#dc2626', fontWeight: '700', fontSize: '12px',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                    >
                      <Eye size={16} /> Ver Detalles
                    </button>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>
                    <Server size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle', color: '#94a3b8' }} />
                    {log.ip}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal Gráfico de Detalles */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedLog(null)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '650px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
                  <Activity size={20} color="#0ea5e9" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Detalles de la Operación</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Inspección visual del registro</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, backgroundColor: selectedLog.accion.includes('DELETE') || selectedLog.accion.includes('RECHAZADO') ? '#fef2f2' : selectedLog.accion.includes('CREATE') ? '#f0fdf4' : selectedLog.accion.includes('UPDATE') ? '#fffbeb' : '#f1f5f9', padding: '1rem', borderRadius: '8px', border: '1px solid', borderColor: selectedLog.accion.includes('DELETE') || selectedLog.accion.includes('RECHAZADO') ? '#fecaca' : selectedLog.accion.includes('CREATE') ? '#bbf7d0' : selectedLog.accion.includes('UPDATE') ? '#fde68a' : '#e2e8f0' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 'bold' }}>Acción Realizada</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
                    {selectedLog.accion.includes('CREATE') ? <CheckCircle size={18} color="#10b981"/> : 
                     selectedLog.accion.includes('UPDATE') ? <Edit3 size={18} color="#f59e0b"/> : 
                     selectedLog.accion.includes('DELETE') || selectedLog.accion.includes('RECHAZADO') ? <Trash2 size={18} color="#ef4444"/> : 
                     <FileJson size={18} color="#3b82f6"/>}
                    {selectedLog.accion}
                  </p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 'bold' }}>Módulo Afectado</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>{selectedLog.modulo}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  Información del Autor
                </p>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '13px', color: '#475569' }}>
                  <div><strong>Nombre:</strong> {selectedLog.usuario.nombre} {selectedLog.usuario.apellidos}</div>
                  <div><strong>Rol:</strong> {selectedLog.usuario.rol}</div>
                  <div><strong>Fecha:</strong> {new Date(selectedLog.createdAt).toLocaleString('es-MX')}</div>
                </div>
              </div>

              <div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileJson size={16} /> Valores / Cambios Registrados
                </p>
                
                <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1.25rem', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)' }}>
                  {renderValorGrafico(selectedLog.detalle)}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
