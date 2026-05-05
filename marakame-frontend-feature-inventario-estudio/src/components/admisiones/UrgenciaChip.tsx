import React from 'react';
import { NivelUrgencia } from '../../types';

interface UrgenciaChipProps {
  nivel: NivelUrgencia;
}

const UrgenciaChip: React.FC<UrgenciaChipProps> = ({ nivel }) => {
  const styles = {
    [NivelUrgencia.BAJA]: { bg: '#dcfce7', text: '#166534', label: 'Baja' },
    [NivelUrgencia.MEDIA]: { bg: '#fef9c3', text: '#854d0e', label: 'Media' },
    [NivelUrgencia.ALTA]: { bg: '#ffedd5', text: '#9a3412', label: 'Alta' },
    [NivelUrgencia.CRITICA]: { bg: '#fee2e2', text: '#991b1b', label: 'Crítica' },
  };

  const { bg, text, label } = styles[nivel] || styles[NivelUrgencia.BAJA];

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

export default UrgenciaChip;
