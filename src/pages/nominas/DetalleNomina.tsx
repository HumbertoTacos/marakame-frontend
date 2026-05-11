import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, PenTool, CheckCircle, Archive, Banknote, FileText, ExternalLink,
  UploadCloud, Loader2
} from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';

export const DetalleNomina = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const nominaId = Number(id);

  const {
    nominaActual: nomina,
    isLoading: loading,
    fetchNominaById,
    firmarNomina,
    archivarNomina
  } = useNominaStore();

  const userRol = useAuthStore(s => s.usuario?.rol);

  // Estados para los uploads del flujo
  const [archivoSubsidio, setArchivoSubsidio] = useState<File | null>(null);
  const [archivoFinal, setArchivoFinal] = useState<File | null>(null);
  const [subiendoSubsidio, setSubiendoSubsidio] = useState(false);
  const [subiendoFinal, setSubiendoFinal] = useState(false);

  useEffect(() => {
    if (nominaId) fetchNominaById(nominaId);
  }, [nominaId, fetchNominaById]);

  const handleFirmar = async () => {
    if (window.confirm("¿Confirmas tu firma oficial para esta nómina?")) {
      const exito = await firmarNomina(nominaId);
      if (exito) alert("Firma aplicada exitosamente.");
    }
  };

  const handleArchivar = async () => {
    if (window.confirm("¿Confirmas archivar esta nómina? Cerrará definitivamente el ciclo.")) {
      const exito = await archivarNomina(nominaId);
      if (exito) alert("Nómina archivada y cerrada.");
    }
  };

  const handleSubirSubsidio = async () => {
    if (!archivoSubsidio) return alert("Selecciona el documento de subsidio antes de subir.");
    try {
      setSubiendoSubsidio(true);
      const fd = new FormData();
      fd.append('archivo', archivoSubsidio);
      const res = await apiClient.post(`/nominas/ciclo/${nominaId}/subsidio`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert(res.data.message);
        setArchivoSubsidio(null);
        await fetchNominaById(nominaId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al subir el documento de subsidio.');
    } finally {
      setSubiendoSubsidio(false);
    }
  };

  const handleSubirNominaFinal = async () => {
    if (!archivoFinal) return alert("Selecciona la nómina escaneada con la firma del trabajador.");
    try {
      setSubiendoFinal(true);
      const fd = new FormData();
      fd.append('archivo', archivoFinal);
      const res = await apiClient.post(`/nominas/ciclo/${nominaId}/nomina-final`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert(res.data.message);
        setArchivoFinal(null);
        await fetchNominaById(nominaId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al subir la nómina firmada.');
    } finally {
      setSubiendoFinal(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Cargando detalles de la nómina...</div>;
  if (!nomina) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>No se encontró la nómina.</div>;

  let estadoReal = nomina.estado;
  const firmaRH = !!nomina.firmaRecursosHumanos;

  // Roles del flujo. admin@marakame.com no participa: administracion@marakame.com (RRHH_FINANZAS)
  // hace el paso intermedio (revisión + autorización). Su firma cubre Jefatura y Dirección.
  const esFinanzas       = userRol === 'RECURSOS_FINANCIEROS' || userRol === 'RRHH_FINANZAS';
  const esAdministracion = userRol === 'JEFE_ADMINISTRATIVO' || userRol === 'RRHH_FINANZAS';
  const esRH             = userRol === 'RECURSOS_HUMANOS' || userRol === 'RRHH_FINANZAS';

  // Mensaje del turno actual
  let mensajeTurno = "";
  if (!nomina.firmaFinanzas)             mensajeTurno = "Turno: Recursos Financieros (subir documento de subsidio)";
  else if (!nomina.firmaAdministracion)  mensajeTurno = "Turno: Administración General (revisión y autorización)";
  else if (!firmaRH)                     mensajeTurno = "Turno: Recursos Humanos (subir nómina firmada por el trabajador)";
  else                                   mensajeTurno = "Turno: Recursos Financieros (archivar nómina)";

  // Links absolutos a los archivos
  const apiBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  const link = (rel?: string | null) => (rel ? `${apiBase}${rel}` : null);
  const archivoUrlAbs       = link((nomina as any).archivoUrl);
  const subsidioUrlAbs      = link((nomina as any).archivoSubsidioUrl);
  const nominaFinalUrlAbs   = link((nomina as any).archivoNominaFinalUrl);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      <button onClick={() => navigate('/nominas')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem' }}>
        <ArrowLeft size={20} /> Volver al Dashboard
      </button>

      {/* BANNER PAGADO */}
      {estadoReal === 'PAGADO' && (
        <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '1.5rem 2rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle size={32} color="#166534" />
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#166534' }}>Procedimiento Terminado</h2>
            <p style={{ margin: 0, color: '#15803d', fontSize: '14px', marginTop: '4px' }}>Esta nómina ya fue archivada por Finanzas. Ciclo cerrado.</p>
          </div>
        </div>
      )}

      {/* PROGRESO DE FIRMAS */}
      {estadoReal !== 'PAGADO' && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              <FirmaPaso label="Financieros" firmado={nomina.firmaFinanzas} />
              <FirmaPaso label="Administración" firmado={nomina.firmaAdministracion} />
              <FirmaPaso label="Rec. Humanos" firmado={firmaRH} />
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#3b82f6' }}>{mensajeTurno}</p>
          </div>
        </div>
      )}

      {/* ACCIONES SEGÚN PASO Y ROL */}
      {estadoReal !== 'PAGADO' && (
        <div style={{ marginBottom: '2rem' }}>

          {/* PASO 1: Finanzas sube documento de subsidio */}
          {!nomina.firmaFinanzas && esFinanzas && (
            <UploadCard
              titulo="Subir documento de solicitud de subsidio"
              descripcion="Al cargar el oficio de subsidio se aplica automáticamente la firma de Recursos Financieros y la nómina pasa al siguiente paso."
              file={archivoSubsidio}
              onFile={setArchivoSubsidio}
              onSubmit={handleSubirSubsidio}
              loading={subiendoSubsidio}
              ctaLabel="Subir documento y firmar"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
            />
          )}

          {/* PASO 2: Administración revisa y autoriza (cubre Jefatura + Dirección) */}
          {nomina.firmaFinanzas && !nomina.firmaAdministracion && esAdministracion && (
            <FirmarCard etiqueta="Firmar como Administración General (revisión y autorización)" onFirmar={handleFirmar} />
          )}

          {/* PASO 4: AUTORIZADO + RH sube nómina firmada */}
          {estadoReal === 'AUTORIZADO' && !firmaRH && esRH && (
            <UploadCard
              titulo="Subir nómina firmada por el trabajador"
              descripcion="Adjunta la nómina formal escaneada con las firmas físicas del personal. Al subirla se aplica la firma de RH y queda lista para que Finanzas archive el ciclo."
              file={archivoFinal}
              onFile={setArchivoFinal}
              onSubmit={handleSubirNominaFinal}
              loading={subiendoFinal}
              ctaLabel="Subir nómina firmada"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          )}

          {/* PASO 5: Finanzas archiva */}
          {estadoReal === 'AUTORIZADO' && firmaRH && esFinanzas && (
            <div style={{ backgroundColor: '#1e293b', padding: '1.5rem 2rem', borderRadius: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Banknote size={22} color="#34d399" />
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Lista para archivar</h2>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', maxWidth: '600px' }}>
                  RH ya entregó la nómina firmada por el trabajador. Archiva para cerrar el ciclo.
                </p>
              </div>
              <button onClick={handleArchivar} style={{ backgroundColor: '#34d399', color: '#064e3b', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={18} /> Archivar Nómina
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESUMEN + ARCHIVOS */}
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: '0 0 4px 0' }}>Pre-Nómina</h2>
            <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>{nomina.periodo}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Folio: {nomina.folio}</h3>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: estadoReal === 'PAGADO' ? '#166534' : '#3b82f6', backgroundColor: estadoReal === 'PAGADO' ? '#dcfce7' : '#eff6ff', padding: '4px 12px', borderRadius: '8px', display: 'inline-block', marginTop: '8px' }}>
              ESTADO: {estadoReal}
            </span>
          </div>
        </div>

        <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          Documentos del ciclo. Cada paso del flujo agrega su archivo correspondiente.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ArchivoLink
            url={archivoUrlAbs}
            etiqueta="Pre-nómina (CONTPAQi/Nomipaq) — subido por RH"
            faltaTexto="Sin archivo de pre-nómina"
          />
          <ArchivoLink
            url={subsidioUrlAbs}
            etiqueta="Solicitud de subsidio — subido por Finanzas"
            faltaTexto="Aún no se sube el documento de subsidio"
          />
          <ArchivoLink
            url={nominaFinalUrlAbs}
            etiqueta="Nómina firmada por el trabajador — subido por RH"
            faltaTexto="Aún no se sube la nómina firmada"
          />
        </div>
      </div>

    </div>
  );
};

const FirmaPaso = ({ label, firmado }: { label: string, firmado: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    {firmado ? (
      <CheckCircle size={24} color="#10b981" />
    ) : (
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px dashed #cbd5e1' }} />
    )}
  </div>
);

const FirmarCard = ({ etiqueta, onFirmar }: { etiqueta: string, onFirmar: () => void }) => (
  <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
    <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{etiqueta}</p>
    <button onClick={onFirmar} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <PenTool size={18} /> Aplicar Firma Oficial
    </button>
  </div>
);

const UploadCard = ({
  titulo, descripcion, file, onFile, onSubmit, loading, ctaLabel, accept
}: {
  titulo: string;
  descripcion: string;
  file: File | null;
  onFile: (f: File | null) => void;
  onSubmit: () => void;
  loading: boolean;
  ctaLabel: string;
  accept: string;
}) => (
  <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
    <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{titulo}</h3>
    <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{descripcion}</p>
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.7rem 1rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '600', flex: 1, minWidth: '260px' }}>
        <UploadCloud size={16} color="#3b82f6" />
        <span style={{ flex: 1 }}>{file ? file.name : `Seleccionar archivo (${accept})`}</span>
        <input type="file" accept={accept} style={{ display: 'none' }}
          onChange={(e) => onFile(e.target.files?.[0] || null)} />
      </label>
      <button
        onClick={onSubmit}
        disabled={!file || loading}
        style={{
          backgroundColor: (!file || loading) ? '#94a3b8' : '#10b981',
          color: 'white', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '10px',
          fontWeight: '800', cursor: (!file || loading) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {ctaLabel}
      </button>
    </div>
  </div>
);

const ArchivoLink = ({ url, etiqueta, faltaTexto }: { url: string | null, etiqueta: string, faltaTexto: string }) => {
  if (!url) {
    return (
      <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
        {faltaTexto}
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
      <FileText size={16} />
      <span style={{ flex: 1 }}>{etiqueta}</span>
      <ExternalLink size={14} />
    </a>
  );
};
