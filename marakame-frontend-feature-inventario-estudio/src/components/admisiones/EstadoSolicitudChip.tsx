import React from 'react';
import { EstadoSolicitud } from '../../types';

interface EstadoSolicitudChipProps {
  estado: EstadoSolicitud;
}

const EstadoSolicitudChip: React.FC<EstadoSolicitudChipProps> = ({ estado }) => {
  const styles = {
    [EstadoSolicitud.PENDIENTE]: { bg: '#f3f4f6', text: '#374151', label: 'Pendiente' },
    [EstadoSolicitud.EN_PROCESO]: { bg: '#dbeafe', text: '#1e40af', label: 'En Proceso' },
    [EstadoSolicitud.APROBADA]: { bg: '#dcfce7', text: '#166534', label: 'Aprobada' },
    [EstadoSolicitud.RECHAZADA]: { bg: '#fee2e2', text: '#991b1b', label: 'Rechazada' },
    [EstadoSolicitud.EN_ESPERA]: { bg: '#fef9c3', text: '#854d0e', label: 'En Espera' },
  };

  const { bg, text, label } = styles[estado] || styles[EstadoSolicitud.PENDIENTE];

  return (
    <span style={{ 
      backgroundColor: bg, 
      color: text, 
      padding: '4px 12px', 
      borderRadius: '9999px', 
      fontSize: '12px', 
      fontWeight: 'bold',
      textTransform: 'uppercase',
      display: 'inline-block'
    }}>
      {label}
    </span>
  );
};

export default EstadoSolicitudChip;
