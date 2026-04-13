import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ValoracionMedicaForm } from '../../components/admisiones/ValoracionMedicaForm';
import { Stethoscope, ArrowLeft, UserCircle } from 'lucide-react';
import apiClient from '../../services/api';

const ValoracionMedicaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const response = await apiClient.get(`/pacientes/${id}`);
        setPaciente(response.data.data);
      } catch (error) {
        console.error('Error fetching patient for valuation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaciente();
  }, [id]);

  if (isLoading) return <div style={{ padding: '2rem' }}>Cargando datos del prospecto...</div>;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header con Info del Paciente */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <button
              onClick={() => navigate('/admisiones/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', marginBottom: '1rem' }}
            >
              <ArrowLeft size={18} /> Volver al Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '14px' }}>
                <Stethoscope size={32} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Valoración Médica</h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Historia Médica de Ingreso</p>
              </div>
            </div>
          </div>

          {paciente && (
            <div style={{ backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <UserCircle size={40} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155' }}>{paciente.nombre} {paciente.apellidoPaterno}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {paciente.sexo === 'M' ? 'Hombre' : 'Mujer'} • {paciente.ocupacion || 'Sin ocupación'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario Principal */}
        <ValoracionMedicaForm
          pacienteId={parseInt(id!, 10)}
          onSuccess={() => navigate('/admisiones/dashboard')}
        />

        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          Este documento forma parte del expediente clínico legal del paciente.
        </div>
      </div>
    </div>
  );
};

export default ValoracionMedicaPage;
