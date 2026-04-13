import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  Info,
  LayoutGrid
} from 'lucide-react';
import apiClient from '../../services/api';

interface DocumentoExpediente {
  id: number;
  nombre: string;
  estado: 'PENDIENTE' | 'ENTREGADO';
  ubicacion: string;
}

interface SeccionEvaluacionesProps {
  pacienteId: number;
}

const SeccionEvaluaciones: React.FC<SeccionEvaluacionesProps> = ({ pacienteId }) => {
  const [documentos, setDocumentos] = useState<DocumentoExpediente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluaciones = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/expedientes/paciente/${pacienteId}/documentos-expediente`);
      // Filtramos solo las evaluaciones psicométricas
      const evals = (response.data.data as DocumentoExpediente[]).filter(d => d.ubicacion === 'EVALUACIONES');
      setDocumentos(evals);
    } catch (error) {
      console.error('Error fetching evaluaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluaciones();
  }, [pacienteId]);

  const handleToggleEstado = async (doc: DocumentoExpediente) => {
    const nuevoEstado = doc.estado === 'PENDIENTE' ? 'ENTREGADO' : 'PENDIENTE';
    try {
      await apiClient.patch(`/expedientes/documentos-expediente/${doc.id}`, { estado: nuevoEstado });
      setDocumentos(prev => prev.map(d => d.id === doc.id ? { ...d, estado: nuevoEstado } : d));
    } catch (error) {
      alert('Error al actualizar el estado de la evaluación.');
    }
  };

  const handleStubAction = (nombre: string) => {
    alert(`[Módulo en construcción]\n\nPróximamente podrás registrar los puntajes específicos y observaciones clínicas para: ${nombre}`);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando instrumentos psicométricos...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Instrumentos de Evaluación Psicométrica</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Control de aplicación de pruebas y tamizajes clínicos.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
             Aplicadas: {documentos.filter(d => d.estado === 'ENTREGADO').length} / {documentos.length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {documentos.map((doc) => (
          <div 
            key={doc.id}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ 
                  backgroundColor: doc.estado === 'ENTREGADO' ? '#dcfce7' : '#f8fafc', 
                  color: doc.estado === 'ENTREGADO' ? '#166534' : '#94a3b8',
                  padding: '8px',
                  borderRadius: '10px'
                }}>
                  <LayoutGrid size={20} />
                </div>
                <span 
                  onClick={() => handleToggleEstado(doc)}
                  style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '10px', 
                    fontWeight: '800',
                    cursor: 'pointer',
                    backgroundColor: doc.estado === 'ENTREGADO' ? '#dcfce7' : '#fee2e2',
                    color: doc.estado === 'ENTREGADO' ? '#166534' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {doc.estado === 'ENTREGADO' ? <><CheckCircle size={10} /> APLICADA</> : <><Clock size={10} /> PENDIENTE</>}
                </span>
              </div>
              
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{doc.nombre}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                Prueba estandarizada para evaluar el perfil clínico y nivel de riesgo del paciente.
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button 
                onClick={() => handleStubAction(doc.nombre)}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <PlusCircle size={16} /> Registrar Puntaje / Resultados
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '16px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', gap: '1rem' }}>
        <Info size={24} color="#3b82f6" />
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>Información sobre Evaluaciones</h4>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#1e3a8a' }}>
            Los instrumentos mostrados son los tamizajes de ley requeridos por las normas de salud. Al marcar como <strong>APLICADA</strong>, se confirma que el paciente ha respondido físicamente la prueba.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeccionEvaluaciones;
