import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  FileEdit, 
  Download, 
  AlertCircle 
} from 'lucide-react';
import apiClient from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface DocumentoExpediente {
  id: number;
  nombre: string;
  estado: 'PENDIENTE' | 'ENTREGADO';
  ubicacion: string;
}

interface SeccionAdministrativaProps {
  pacienteId: number;
}

const SeccionAdministrativa: React.FC<SeccionAdministrativaProps> = ({ pacienteId }) => {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoExpediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocumentos = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/expedientes/paciente/${pacienteId}/documentos-expediente`);
      setDocumentos(response.data.data);
    } catch (error) {
      console.error('Error fetching documentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [pacienteId]);

  const handleToggleEstado = async (doc: DocumentoExpediente) => {
    const nuevoEstado = doc.estado === 'PENDIENTE' ? 'ENTREGADO' : 'PENDIENTE';
    try {
      await apiClient.patch(`/expedientes/documentos-expediente/${doc.id}`, { estado: nuevoEstado });
      setDocumentos(prev => prev.map(d => d.id === doc.id ? { ...d, estado: nuevoEstado } : d));
    } catch (error) {
      alert('Error al actualizar el estado del documento.');
    }
  };

  const handleGenerarPDF = (docId: number) => {
    const url = `${import.meta.env.VITE_API_URL}/reportes/documentos/${docId}/firma-pdf`;
    window.open(url, '_blank');
  };

  const handleCompletarFormulario = (nombre: string) => {
    if (nombre === 'Estudio socioeconómico') {
      navigate(`/admisiones/estudio-socioeconomico/${pacienteId}`);
    } else {
      alert(`El formulario para "${nombre}" se habilitará en la siguiente fase.`);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando checklist administrativo...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Control de Expediente Físico (Lado Izquierdo)</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Estado de los 15 documentos obligatorios para el ingreso.</p>
        </div>
        <div style={{ backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
          Progreso: {documentos.filter(d => d.estado === 'ENTREGADO').length} / {documentos.length}
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Documento</th>
              <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Ubicación</th>
              <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: doc.estado === 'ENTREGADO' ? '#10b981' : '#94a3b8' }}>
                      <FileText size={18} />
                    </div>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                  <span 
                    onClick={() => handleToggleEstado(doc)}
                    style={{ 
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: '800',
                      cursor: 'pointer',
                      backgroundColor: doc.estado === 'ENTREGADO' ? '#dcfce7' : '#fee2e2',
                      color: doc.estado === 'ENTREGADO' ? '#166534' : '#991b1b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {doc.estado === 'ENTREGADO' ? <><CheckCircle size={10} /> ENTREGADO</> : <><Clock size={10} /> PENDIENTE</>}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                  {doc.ubicacion}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {/* Botón Formulario (Solo para Estudio Socioeconómico) */}
                    {doc.nombre.includes('Estudio socioeconómico') && (
                      <button 
                        onClick={() => handleCompletarFormulario(doc.nombre)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #3b82f6', background: 'white', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileEdit size={14} /> Completar Formulario
                      </button>
                    )}

                    {/* Botón PDF (Para Convenios, Consentimientos, etc.) */}
                    {(doc.nombre.includes('Convenio') || doc.nombre.includes('Consentimiento') || doc.nombre.includes('Reglamento')) && (
                      <button 
                        onClick={() => handleGenerarPDF(doc.id)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={14} /> Generar PDF
                      </button>
                    )}

                    {/* Stub para el resto */}
                    {!doc.nombre.includes('Estudio') && !doc.nombre.includes('Convenio') && !doc.nombre.includes('Consentimiento') && !doc.nombre.includes('Reglamento') && (
                      <button 
                        disabled
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed' }}
                      >
                         Marcar Entregado
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: '16px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', gap: '1rem' }}>
        <AlertCircle size={24} color="#f59e0b" />
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#9a3412' }}>Importante</h4>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#c2410c' }}>
            Los documentos marcados como <strong>ENTREGADO</strong> deben estar físicamente presentes en la carpeta de papel del paciente. El sistema digital actúa como un espejo del control físico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeccionAdministrativa;
