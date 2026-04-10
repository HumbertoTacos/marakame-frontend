import React from 'react';
import { Bed, User, AlertTriangle, Clock } from 'lucide-react';
import { EstadoCama } from '../../types';
import type { Cama } from '../../types';

interface CamaCardProps {
  cama: Cama;
  onSelect?: (cama: Cama) => void;
  selected?: boolean;
}

const CamaCard: React.FC<CamaCardProps> = ({ cama, onSelect, selected }) => {
  const isOccupied = cama.estado === EstadoCama.OCUPADA;
  const isMaintenance = cama.estado === EstadoCama.MANTENIMIENTO;
  const isReserved = cama.estado === EstadoCama.RESERVADA;
  const isAvailable = cama.estado === EstadoCama.DISPONIBLE;

  const bgColors = {
    [EstadoCama.DISPONIBLE]: '#ffffff',
    [EstadoCama.OCUPADA]: '#eff6ff',
    [EstadoCama.MANTENIMIENTO]: '#fff1f2',
    [EstadoCama.RESERVADA]: '#fffbeb',
  };

  const borderColors = {
    [EstadoCama.DISPONIBLE]: '#e2e8f0',
    [EstadoCama.OCUPADA]: '#3b82f6',
    [EstadoCama.MANTENIMIENTO]: '#f43f5e',
    [EstadoCama.RESERVADA]: '#f59e0b',
  };

  return (
    <div 
      onClick={() => isAvailable && onSelect?.(cama)}
      style={{
        backgroundColor: bgColors[cama.estado],
        border: `2px solid ${selected ? '#10b981' : borderColors[cama.estado]}`,
        borderRadius: '12px',
        padding: '1.25rem',
        cursor: isAvailable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: selected ? '0 0 0 4px rgba(16,185,129,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
        opacity: isMaintenance ? 0.7 : 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            backgroundColor: borderColors[cama.estado], 
            padding: '6px', 
            borderRadius: '8px' 
          }}>
            <Bed size={18} color="white" />
          </div>
          <span style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
            {cama.codigo || `Cama ${cama.numero}`}
          </span>
        </div>
        <div style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          backgroundColor: borderColors[cama.estado] 
        }} />
      </div>

      <div>
        {isOccupied && cama.paciente ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
            <User size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>
              {cama.paciente.nombre} {cama.paciente.apellidoPaterno}
            </span>
          </div>
        ) : isMaintenance ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>En Mantenimiento</span>
          </div>
        ) : isReserved ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <Clock size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Reservada</span>
          </div>
        ) : (
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Disponible</span>
        )}
      </div>

      {cama.descripcion && (
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{cama.descripcion}</p>
      )}
    </div>
  );
};

export default CamaCard;
