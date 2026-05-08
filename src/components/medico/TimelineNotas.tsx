import React from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  Plus
} from 'lucide-react';
import type { NotaEvolucion, TipoNota } from '../../types';

interface TimelineNotasProps {
  notas: NotaEvolucion[];
  onAddNota?: () => void;
}

const TimelineNotas: React.FC<TimelineNotasProps> = ({ notas, onAddNota }) => {
  const getBadgeColor = (tipo: TipoNota) => {
    const colors = {
      MEDICA: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      PSICOLOGICA: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
      NUTRICIONAL: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
      ENFERMERIA: { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' },
      GENERAL: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' }
    };
    return colors[tipo] || colors.GENERAL;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header de Sección */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
            <Clock size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Historial de Evolución</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Registro cronológico de intervenciones clínicas.</p>
          </div>
        </div>
        
        {onAddNota && (
          <button
            onClick={onAddNota}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1.25rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)'
            }}
          >
            <Plus size={18} /> Agregar Nota
          </button>
        )}
      </div>

      {/* Timeline List */}
      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        {/* Línea vertical del timeline */}
        <div style={{ 
          position: 'absolute', 
          left: '7px', 
          top: '0', 
          bottom: '0', 
          width: '2px', 
          backgroundColor: '#e2e8f0' 
        }} />

        {notas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '20px', marginLeft: '1rem' }}>
            No hay notas de evolución registradas para este paciente.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {notas.map((nota) => (
              <div key={nota.id} style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                {/* Punto en el timeline */}
                <div style={{ 
                  position: 'absolute', 
                  left: '-24px', 
                  top: '10px', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  backgroundColor: 'white', 
                  border: `4px solid ${getBadgeColor(nota.tipo).bg}`,
                  boxShadow: '0 0 0 4px white'
                }} />

                <div style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '20px', 
                  border: '1px solid #e2e8f0', 
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '8px', 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        backgroundColor: getBadgeColor(nota.tipo).bg,
                        color: getBadgeColor(nota.tipo).text,
                        border: `1px solid ${getBadgeColor(nota.tipo).border}`
                      }}>
                        NOTA {nota.tipo}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                        <Calendar size={14} /> {new Date(nota.fecha).toLocaleString('es-MX')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '13px', fontWeight: '700' }}>
                      <User size={16} color="#3b82f6" /> {nota.usuario?.nombre} {nota.usuario?.apellidos}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ 
                    color: '#334155', 
                    fontSize: '15px', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap', // Requerimiento del usuario para saltos de línea
                    backgroundColor: '#fafafa',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9'
                  }}>
                    {nota.nota}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineNotas;
