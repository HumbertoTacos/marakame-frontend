import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Folder, 
  ArrowLeft, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  User,
  Bed,
  Calendar,
  ExternalLink,
  Loader2
} from 'lucide-react';
import apiClient from '../../services/api';

interface DocumentoExpediente {
  id: number;
  nombre: string;
  ubicacion: 'LADO_IZQ' | 'LADO_DER' | 'EVALUACIONES';
  estado: 'PENDIENTE' | 'ENTREGADO' | 'COMPLETADO';
  archivoUrl?: string;
}

export const ExpedienteDigitalPage: React.FC = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  
  const [paciente, setPaciente] = useState<any>(null);
  const [documentos, setDocumentos] = useState<DocumentoExpediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [pacienteId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [pRes, dRes] = await Promise.all([
        apiClient.get(`/pacientes/${pacienteId}`),
        apiClient.get(`/documentos/expediente/${pacienteId}`)
      ]);
      
      setPaciente(pRes.data.data);
      setDocumentos(dRes.data.data);
    } catch (error) {
      console.error('Error fetching expediente data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (docId: number, file: File) => {
    setUploadingId(docId);
    const formData = new FormData();
    formData.append('archivo', file);

    try {
      await apiClient.put(`/documentos/${docId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refrescar solo documentos
      const dRes = await apiClient.get(`/documentos/expediente/${pacienteId}`);
      setDocumentos(dRes.data.data);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
        <span style={{ fontWeight: '600', color: '#64748b' }}>Cargando Expediente Digital...</span>
      </div>
    );
  }

  const leftDocs = documentos.filter(d => d.ubicacion === 'LADO_IZQ');
  const rightDocs = documentos.filter(d => d.ubicacion === 'LADO_DER' || d.ubicacion === 'EVALUACIONES');

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', marginBottom: '1.5rem' }}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '20px' }}>
                <Folder size={32} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Expediente Digital Híbrido</h1>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Gestión de Papelería y Resguardo Legal</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
              <InfoItem icon={<User size={16} />} label="Paciente" value={`${paciente?.nombre} ${paciente?.apellidoPaterno}`} />
              <InfoItem icon={<FileText size={16} />} label="Clave Única" value={paciente?.claveUnica || 'P-000'} />
              <InfoItem icon={<Bed size={16} />} label="Cama" value={paciente?.cama?.numero || 'S/A'} />
              <InfoItem icon={<Calendar size={16} />} label="Ingreso" value={paciente?.fechaIngreso ? new Date(paciente.fechaIngreso).toLocaleDateString() : '---'} />
            </div>
          </div>
        </div>

        {/* LAYOUT DOS COLUMNAS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* COLUMNA IZQUIERDA: ADMINISTRATIVA */}
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '28px', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eff6ff', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></span>
                Área Administrativa (Frente)
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {leftDocs.map(doc => <DocumentCard key={doc.id} doc={doc} onUpload={handleUpload} isUploading={uploadingId === doc.id} />)}
              {leftDocs.length === 0 && <EmptyState />}
            </div>
          </div>

          {/* COLUMNA DERECHA: CLÍNICA/EVALUACIONES */}
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '28px', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #fff7ed', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '8px', height: '24px', backgroundColor: '#f59e0b', borderRadius: '4px' }}></span>
                Área Clínica y Evaluaciones (Vuelta)
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rightDocs.map(doc => <DocumentCard key={doc.id} doc={doc} onUpload={handleUpload} isUploading={uploadingId === doc.id} />)}
              {rightDocs.length === 0 && <EmptyState />}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div style={{ color: '#94a3b8' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{value}</div>
    </div>
  </div>
);

const DocumentCard = ({ doc, onUpload, isUploading }: { doc: DocumentoExpediente, onUpload: (id: number, f: File) => void, isUploading: boolean }) => {
  const isCompleted = doc.estado === 'COMPLETADO';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '1rem 1.25rem', 
      borderRadius: '16px', 
      border: isCompleted ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
      backgroundColor: isCompleted ? '#f0fdf4' : '#f8fafc',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isCompleted ? (
          <CheckCircle2 size={24} color="#10b981" />
        ) : (
          <AlertCircle size={24} color="#94a3b8" />
        )}
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: isCompleted ? '#166534' : '#475569' }}>{doc.nombre}</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: isCompleted ? '#10b981' : '#94a3b8' }}>
            {isCompleted ? 'Resguardado en servidor' : 'Pendiente de formalizar'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {isCompleted && doc.archivoUrl && (
          <a 
            href={`${API_URL}/${doc.archivoUrl}`} 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              padding: '0.5rem', 
              borderRadius: '10px', 
              backgroundColor: 'white', 
              color: '#10b981', 
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <ExternalLink size={18} />
          </a>
        )}
        
        <label style={{ 
          padding: '0.5rem 1rem', 
          borderRadius: '10px', 
          backgroundColor: isCompleted ? '#ffffff' : '#3b82f6', 
          color: isCompleted ? '#10b981' : 'white', 
          border: isCompleted ? '1px solid #bbf7d0' : 'none',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          boxShadow: isCompleted ? 'none' : '0 4px 6px -1px rgba(59,130,246,0.3)'
        }}>
          {isUploading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Upload size={16} />
          )}
          {isCompleted ? 'Reemplazar' : 'Subir PDF'}
          <input 
            type="file" 
            accept=".pdf,image/*" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(doc.id, file);
            }}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
    No se han encontrado registros de documentos para este paciente.
  </div>
);
