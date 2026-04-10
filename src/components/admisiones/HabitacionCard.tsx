import React from 'react';
import { Home } from 'lucide-react';
import type { Habitacion, Cama } from '../../types';
import CamaCard from './CamaCard';

interface HabitacionCardProps {
  habitacion: Habitacion;
  camas: Cama[];
  selectedCamaId?: number;
  onSelectCama: (cama: Cama) => void;
}

const HabitacionCard: React.FC<HabitacionCardProps> = ({ 
  habitacion, 
  camas, 
  selectedCamaId, 
  onSelectCama 
}) => {
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#3b82f6' }}>
          <Home size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Habitación {habitacion.nombre}</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Capacidad: {habitacion.capacidadMax} camas</span>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '0.75rem' 
      }}>
        {camas.map(cama => (
          <CamaCard 
            key={cama.id}
            cama={cama}
            selected={selectedCamaId === cama.id}
            onSelect={onSelectCama}
          />
        ))}
        {/* Placeholder para camas vacías si no hay registros aún */}
        {Array.from({ length: Math.max(0, 4 - camas.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ 
            height: '100px', 
            border: '2px dashed #e2e8f0', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cbd5e1',
            fontSize: '12px'
          }}>
            Espacio Vacío
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitacionCard;
