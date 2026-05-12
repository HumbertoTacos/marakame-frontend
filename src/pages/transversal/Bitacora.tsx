import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Server, Calendar, Filter, Eye, X, FileJson, CheckCircle, Trash2, Edit3, Activity } from 'lucide-react';
import apiClient from '../../services/api';
import type { RegistroBitacora } from '../../types';

export function Bitacora() {
  const [modulo, setModulo] = useState('');
  const [selectedLog, setSelectedLog] = useState<RegistroBitacora | null>(null);
  
  const { data: logs, isLoading } = useQuery<RegistroBitacora[]>({
    queryKey: ['bitacora', modulo],
    queryFn: () => apiClient.get(`/bitacora${modulo ? `?modulo=${modulo}` : ''}`).then(res => res.data.data)
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ShieldAlert size={28} color="#e53e3e" style={{ marginRight: '1rem' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>Bitácora del Sistema</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Filter size={18} color="#718096" />
          <select 
            value={modulo} 
            onChange={(e) => setModulo(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', color: '#4a5568' }}
          >
            <option value="">Todos los Módulos</option>
            <option value="auth">Autenticación (Login)</option>
            <option value="Compras">Compras / Gastos</option>
            <option value="Expediente Clínico">Expediente Clínico</option>
            <option value="Admisiones">Admisiones</option>
            <option value="Almacén">Kardex y Almacén</option>
            <option value="Nóminas">Nóminas</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#2d3748', color: 'white' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha y Hora</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Usuario Autor</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Acción</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Módulo</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Detalles</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>IP Intranet</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Inspeccionando registros de la bitácora...</td></tr>
            ) : (!logs || logs.length === 0) ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No hay registros en la bitácora transversal.</td></tr>
            ) : (
              logs?.map((log: RegistroBitacora) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '1rem', color: '#718096' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Calendar size={14} style={{ marginRight: '0.5rem' }} />
                      {new Date(log.createdAt).toLocaleString('es-MX')}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: '#2b6cb0' }}>
                    {log.usuario.nombre} {log.usuario.apellidos}
                    <span style={{ display: 'block', fontSize: '11px', color: '#a0aec0', fontWeight: 'normal' }}>{log.usuario.rol}</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: log.accion.includes('DELETE') || log.accion.includes('RECHAZADO') ? '#e53e3e' : '#2d3748' }}>
                    {log.accion}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ backgroundColor: '#edf2f7', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px' }}>
                      {log.modulo}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => setSelectedLog(log)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        padding: '0.5rem 0.75rem', backgroundColor: '#ebf8ff', 
                        border: '1px solid #bee3f8', borderRadius: '6px', cursor: 'pointer',
                        color: '#2b6cb0', fontWeight: '600', fontSize: '12px',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bee3f8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ebf8ff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Eye size={16} /> Ver Detalles
                    </button>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#718096', fontFamily: 'monospace' }}>
                    <Server size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                    {log.ip}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
