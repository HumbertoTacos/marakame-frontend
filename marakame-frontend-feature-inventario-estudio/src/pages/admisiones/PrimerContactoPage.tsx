import React from 'react';
import { PrimerContactoForm } from '../../components/admisiones/PrimerContactoForm';
import { ClipboardList, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrimerContactoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem 1rem', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Breadcrumbs / Botón de regreso */}
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/admisiones')}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              color: '#475569', 
              fontWeight: '700', 
              fontSize: '14px',
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: '12px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
        </div>

        {/* Header Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '16px', color: '#3b82f6', boxShadow: 'inset 0 2px 4px 0 rgba(255,255,255,0.5)' }}>
            <ClipboardList size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              Nuevo Primer Contacto
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
              Captura de información inicial e historial de consumo para prospectos.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '2.5rem', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            marginBottom: '2.5rem', 
            borderBottom: '1px solid #f1f5f9', 
            paddingBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ marginTop: '2px', color: '#10b981', backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '10px' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 0.5rem 0' }}>Registro de Prospecto</h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Complete las siguientes secciones para registrar una nueva solicitud de información o posible ingreso. 
                Este registro creará automáticamente un perfil de <strong style={{ color: '#0f172a', fontWeight: '800' }}>Paciente Prospecto</strong> seguro en el sistema.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <PrimerContactoForm />
          
        </div>

        {/* Info Footer */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>
          Instituto Marakame - Sistema de Gestión de Admisiones v1.0
        </div>
      </div>
    </div>
  );
};

export default PrimerContactoPage;