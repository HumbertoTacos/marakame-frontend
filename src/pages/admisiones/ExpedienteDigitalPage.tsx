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
import { useAuthStore } from '../../stores/authStore';

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
  const { usuario } = useAuthStore();
  
  const [paciente, setPaciente] = useState<any>(null);
  const [documentos, setDocumentos] = useState<DocumentoExpediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [valoracionMedica, setValoracionMedica] = useState<any>(null);
  const [isUploadingFirma, setIsUploadingFirma] = useState(false);

  // Lógica de Permisos (RBAC Granular)
  const getCanUpload = (doc: DocumentoExpediente) => {
    if (!usuario) return false;
    const rol = usuario.rol;
    
    // El administrador general siempre puede
    if (rol === 'ADMIN_GENERAL') return true;

    // Columna Izquierda (Administrativa)
    if (doc.ubicacion === 'LADO_IZQ') {
      return rol === 'ADMISIONES';
    }

    // Columna Derecha (Evaluaciones - RBAC dinámico por tipo)
    if (doc.ubicacion === 'LADO_DER' || doc.ubicacion === 'EVALUACIONES') {
      const n = doc.nombre.toLowerCase();
      if (n.includes('médic') || n.includes('assist')) return rol === 'AREA_MEDICA';
      if (n.includes('psicoló')) return rol === 'PSICOLOGIA';
      if (n.includes('nutricio')) return rol === 'NUTRICION';
      if (n.includes('enfermer')) return rol === 'ENFERMERIA';
      
      // Si no es ninguno de los específicos, permitimos al staff clínico general si es un cuestionario
      if (n.includes('cuestionario') || n.includes('escala')) {
        return ['AREA_MEDICA', 'PSICOLOGIA', 'ENFERMERIA'].includes(rol);
      }
    }

    return false;
  };

  // AQUÍ ESTÁ LA CORRECCIÓN: Se reconstruyó la función fetchData completa
  const fetchData = async () => {
    try {
      const [pRes, dRes, vRes] = await Promise.all([
        apiClient.get(`/pacientes/${pacienteId}`),
        apiClient.get(`/documentos/expediente/${pacienteId}`),
        apiClient.get(`/admisiones/valoracion-medica/paciente/${pacienteId}`)
      ]);
      
      setPaciente(pRes.data.data);
      setDocumentos(dRes.data.data);
      setValoracionMedica(vRes.data.data);
    } catch (error) {
      console.error('Error fetching expediente data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pacienteId]);

  const handleUploadFirma = async (file: File) => {
    if (!valoracionMedica) return;
    setIsUploadingFirma(true);
    const formData = new FormData();
    formData.append('archivo', file);

    try {
      await apiClient.post(`/admisiones/valoracion-medica/${valoracionMedica.id}/upload-firma`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Valoración firmada cargada exitosamente.');
      fetchData(); // Recargar datos
    } catch (error) {
      console.error('Error uploading signature:', error);
      alert('Error al subir la valoración firmada');
    } finally {
      setIsUploadingFirma(false);
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

          {/* ALERTA DE VALORACIÓN PENDIENTE DE FIRMA (FLUJO PHYGITAL) */}
          {valoracionMedica?.estado === 'COMPLETADA' && usuario?.rol === 'AREA_MEDICA' && (
            <div style={{ marginTop: '2rem', padding: '1.5rem 2rem', backgroundColor: '#fdf2f8', borderRadius: '24px', border: '2px dashed #db2777', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'pulse 2s infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ padding: '0.8rem', backgroundColor: '#fce7f3', color: '#db2777', borderRadius: '50%' }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#9d174d' }}>Acción Pendiente: Subir Valoración Firmada</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#be185d', fontWeight: '600' }}>
                    El registro médico ha sido completado digitalmente. Por favor suba el formato oficial con la firma física.
                  </p>
                </div>
              </div>
              <label style={{ 
                padding: '0.8rem 1.5rem', 
                backgroundColor: '#db2777', 
                color: 'white', 
                borderRadius: '14px', 
                fontWeight: '800', 
                fontSize: '13px', 
                cursor: isUploadingFirma ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(219,39,119,0.3)'
              }}>
                {isUploadingFirma ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                Digitalizar Firma
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFirma(file);
                  }}
                  disabled={isUploadingFirma}
                />
              </label>
            </div>
          )}
        </div>

        {/* LAYOUT DOS COLUMNAS (CARPETA ABIERTA) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          
          {/* COLUMNA IZQUIERDA: ADMINISTRATIVA */}
          <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Área Administrativa</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '500px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
              {leftDocs.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  onUpload={handleUpload} 
                  isUploading={uploadingId === doc.id} 
                  canUpload={getCanUpload(doc)}
                />
              ))}
              {leftDocs.length === 0 && <EmptyState />}
            </div>
          </div>

          {/* COLUMNA DERECHA: MÉDICA/EVALUACIONES */}
          <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Área Médica y Evaluaciones</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '500px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
              {rightDocs.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  onUpload={handleUpload} 
                  isUploading={uploadingId === doc.id} 
                  canUpload={getCanUpload(doc)}
                />
              ))}
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
      <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>{value}</div>
    </div>
  </div>
);

const DocumentCard = ({ doc, onUpload, isUploading, canUpload }: { doc: DocumentoExpediente, onUpload: (id: number, f: File) => void, isUploading: boolean, canUpload: boolean }) => {
  const isCompleted = doc.estado === 'COMPLETADO';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '1.25rem 1.5rem', 
      borderRadius: '20px', 
      border: isCompleted ? '1px solid #bbf7d0' : '1px solid #fed7aa',
      backgroundColor: isCompleted ? '#f0fdf4' : '#fff7ed',
      transition: 'all 0.2s ease',
      boxShadow: isCompleted ? 'none' : '0 2px 4px rgba(251, 146, 60, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: isCompleted ? '#ffffff' : '#ffedd5'
        }}>
          {isCompleted ? (
            <CheckCircle2 size={24} color="#10b981" />
          ) : (
            <AlertCircle size={24} color="#f97316" />
          )}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: isCompleted ? '#166534' : '#9a3412' }}>{doc.nombre}</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: isCompleted ? '#10b981' : '#f97316' }}>
            {isCompleted ? 'Resguardado en servidor' : 'Falta documentación física'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        {isCompleted && doc.archivoUrl && (
          <a 
            href={`${API_URL}/${doc.archivoUrl}`} 
            target="_blank" 
            rel="noreferrer"
            title="Ver Documento"
            style={{ 
              padding: '0.6rem', 
              borderRadius: '12px', 
              backgroundColor: 'white', 
              color: '#3b82f6', 
              border: '1.5px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ExternalLink size={18} />
          </a>
        )}
        
        {canUpload && (
          <label style={{ 
            padding: '0.6rem 1rem', 
            borderRadius: '12px', 
            backgroundColor: isCompleted ? '#ffffff' : '#f97316', 
            color: isCompleted ? '#f97316' : 'white', 
            border: isCompleted ? '1.5px solid #fed7aa' : 'none',
            fontSize: '13px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            boxShadow: isCompleted ? 'none' : '0 4px 6px -1px rgba(249,115,22,0.3)',
            transition: 'all 0.2s'
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
        )}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
    <p>No se han encontrado registros de documentos para este paciente.</p>
  </div>
);