import React from 'react';
import { PrimerContactoForm } from '../../components/admisiones/PrimerContactoForm';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrimerContactoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Breadcrumbs / Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/admisiones')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
              fontWeight: '600', 
              cursor: 'pointer' 
            }}
          >
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e293b' }}>
            <ClipboardList size={28} color="#3b82f6" />
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Nuevo Primer Contacto</h1>
          </div>
        </div>

        {/* Content Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '2.5rem', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', margin: '0 0 0.5rem 0' }}>Registro de Prospecto</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Complete las siguientes secciones para registrar una nueva solicitud de información o posible ingreso. 
              Este registro creará automáticamente un perfil de **Paciente Prospecto**.
            </p>
          </div>

          <PrimerContactoForm />
        </div>

        {/* Info Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Instituto Marakame - Sistema de Gestión de Admisiones v1.0
        </div>
      </div>
    </div>
  );
};

export default PrimerContactoPage;
