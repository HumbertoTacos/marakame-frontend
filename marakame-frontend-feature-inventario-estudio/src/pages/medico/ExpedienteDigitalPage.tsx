import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Stethoscope, 
  ClipboardCheck, 
  User, 
  Calendar, 
  MapPin, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import SeccionAdministrativa from '../../components/medico/SeccionAdministrativa';
import SeccionMedica from '../../components/medico/SeccionMedica';
import SeccionEvaluaciones from '../../components/medico/SeccionEvaluaciones';

const ExpedienteDigitalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'administrativo' | 'medico' | 'evaluaciones'>('administrativo');
  const [expedienteRaw, setExpedienteRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Carga de datos reales del expediente con carga profunda (notas, signos, paciente)
  const fetchExpediente = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/expedientes/paciente/${id}`);
      const data = await response.json();
      if (data.success) {
        setExpedienteRaw(data.data);
      }
    } catch (error) {
      console.error('Error fetching expediente:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpediente();
  }, [id]);

  const tabs = [
    { id: 'administrativo', label: 'Administrativo', icon: FileText, color: '#3b82f6' },
    { id: 'medico', label: 'Médico', icon: Stethoscope, color: '#10b981' },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck, color: '#f59e0b' },
  ];

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando expediente clínico...</div>;
  if (!expedienteRaw || !expedienteRaw.paciente) return <div style={{ padding: '4rem', textAlign: 'center' }}>No se encontró el expediente del paciente.</div>;

  const { paciente } = expedienteRaw;

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header / Banner */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        border: '1px solid #e2e8f0', 
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '20px', 
            backgroundColor: '#eff6ff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <User size={40} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: '#1e293b' }}>
                Paciente #{paciente.claveUnica}
              </h1>
              <span style={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534', 
                padding: '4px 12px', 
                borderRadius: '8px', 
                fontSize: '12px', 
                fontWeight: 'bold' 
              }}>
                {paciente.estado}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: '#64748b', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> Ingreso: {new Date(paciente.fechaIngreso).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={16} /> Nivel: {paciente.nivelTratamiento}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} /> Hab: {paciente.cama?.habitacion?.nombre} - Cama: {paciente.cama?.numero}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '10px 20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            background: 'white', 
            color: '#64748b', 
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} /> Volver
        </button>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              fontSize: '16px',
              fontWeight: '700',
              color: activeTab === tab.id ? tab.color : '#94a3b8',
              borderBottom: activeTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        border: '1px solid #e2e8f0', 
        padding: '2rem',
        minHeight: '600px'
      }}>
        {activeTab === 'administrativo' && (
          <SeccionAdministrativa pacienteId={paciente.id} />
        )}

        {activeTab === 'medico' && (
          <SeccionMedica expediente={expedienteRaw} onRefresh={fetchExpediente} />
        )}

        {activeTab === 'evaluaciones' && (
          <SeccionEvaluaciones pacienteId={paciente.id} />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ExpedienteDigitalPage;
