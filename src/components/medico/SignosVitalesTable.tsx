import React from 'react';
import { 
  Activity, 
  Plus,
  Thermometer,
  Wind,
  Droplet,
  Heart
} from 'lucide-react';
import type { SignoVital } from '../../types';

interface SignosVitalesTableProps {
  signos: SignoVital[];
  onAddSignos?: () => void;
}

const SignosVitalesTable: React.FC<SignosVitalesTableProps> = ({ signos, onAddSignos }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
            <Activity size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Historial de Signos Vitales</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Monitoreo técnico de constantes fisiológicas.</p>
          </div>
        </div>
        
        {onAddSignos && (
          <button
            onClick={onAddSignos}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1.25rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)'
            }}
          >
            <Plus size={18} /> Registrar Signos
          </button>
        )}
      </div>

      {/* Tabla Técnica Densa */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Fecha y Hora</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>P. Arterial</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Temp (°C)</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>F. Card.</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>F. Resp.</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Oxig. (%)</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Glucosa</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Peso (kg)</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Personal</th>
              </tr>
            </thead>
            <tbody>
              {signos.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Sin registros de signos vitales disponibles.
                  </td>
                </tr>
              ) : (
                signos.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>
                      {new Date(s.fecha).toLocaleString('es-MX', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{s.presionArterial || '--/--'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{s.temperatura ? `${s.temperatura}°` : '--'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{s.frecuenciaCardiaca || '--'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ (s as any).frecuenciaRespiratoria || '--'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{s.oxigenacion ? `${s.oxigenacion}%` : '--'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ (s as any).glucosa || '--'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{s.peso || '--'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {s.usuario?.nombre} {s.usuario?.apellidos?.charAt(0)}.
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* At-a-glance Icons Legend (Optional but professional) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', color: '#64748b' }}><Heart size={14} color="#f43f5e" /> Cardiaca</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', color: '#64748b' }}><Thermometer size={14} color="#ef4444" /> Temperatura</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', color: '#64748b' }}><Wind size={14} color="#3b82f6" /> Oxigenación</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', color: '#64748b' }}><Droplet size={14} color="#10b981" /> Glucosa</div>
      </div>
    </div>
  );
};

export default SignosVitalesTable;
