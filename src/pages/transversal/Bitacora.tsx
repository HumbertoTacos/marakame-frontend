import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Server, Calendar, Filter } from 'lucide-react';
import apiClient from '../../services/api';
import type { Auditoria } from '../../types';

export function Bitacora() {
  const [modulo, setModulo] = useState('');
  
  const { data: logs, isLoading } = useQuery<Auditoria[]>({
    queryKey: ['auditoria', modulo],
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ShieldAlert size={28} color="#e53e3e" style={{ marginRight: '1rem' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>Bitácora de Auditoría del Sistema</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Filter size={18} color="#718096" />
          <select 
            value={modulo} 
            onChange={(e) => setModulo(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', color: '#4a5568' }}
          >
            <option value="">Todos los Módulos</option>
            <option value="LOGIN">Autenticación (Login)</option>
            <option value="COMPRAS">Compras / Gastos</option>
            <option value="EXPEDIENTE">Expediente Clínico</option>
            <option value="INGRESO">Admisiones</option>
            <option value="ALMACEN">Kardex y Almacén</option>
            <option value="NOMINA">Nóminas</option>
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
              <th style={{ padding: '1rem', textAlign: 'left' }}>Detalle Técnico (JSON)</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>IP Intranet</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Inspeccionando registros de auditoría...</td></tr>
            ) : (!logs || logs.length === 0) ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No hay registros en la bitácora transversal.</td></tr>
            ) : (
              logs?.map((log: Auditoria) => (
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
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#4a5568', fontSize: '12px' }}>Ver Payload</summary>
                      <pre style={{ margin: '0.5rem 0 0 0', backgroundColor: '#1a202c', color: '#a0aec0', padding: '0.5rem', borderRadius: '4px', fontSize: '10px', maxWidth: '300px', overflowX: 'auto' }}>
                        {formatearDetalles(log.detalle)}
                      </pre>
                    </details>
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

    </div>
  );
}
