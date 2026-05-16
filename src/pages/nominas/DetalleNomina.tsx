import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Archive, Banknote, FileText, ExternalLink,
  UploadCloud, Loader2, Calculator
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
    archivarNomina
  } = useNominaStore();

  const userRol = useAuthStore(s => s.usuario?.rol);

  // Estados para los pasos del flujo
  const [archivoSubsidio, setArchivoSubsidio] = useState<File | null>(null);
  const [subiendoSubsidio, setSubiendoSubsidio] = useState(false);
  const [firmandoAdmin, setFirmandoAdmin] = useState(false);
  const [enviandoAsistencias, setEnviandoAsistencias] = useState(false);
  const [cerrandoNomina, setCerrandoNomina] = useState(false);

  useEffect(() => {
    if (nominaId) fetchNominaById(nominaId);
  }, [nominaId, fetchNominaById]);

  // El backend marca como leídas las notificaciones del paso recién cerrado. Disparamos este
  // evento para que el Layout recargue el badge al instante en vez de esperar al polling de 60s.
  const refrescarNotificacionesHeader = () => {
    window.dispatchEvent(new Event('notif-refresh'));
  };

  const handleArchivar = async () => {
    if (window.confirm("¿Confirmas archivar esta nómina? Cerrará definitivamente el ciclo.")) {
      const exito = await archivarNomina(nominaId);
      if (exito) {
        alert("Nómina archivada y cerrada.");
        refrescarNotificacionesHeader();
      }
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
        refrescarNotificacionesHeader();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al subir el documento de subsidio.');
    } finally {
      setSubiendoSubsidio(false);
    }
  };

  const handleFirmarAdministracion = async () => {
    if (!window.confirm("Vas a aplicar la firma de Administración a esta pre-nómina. ¿Continuar?")) return;
    try {
      setFirmandoAdmin(true);
      const res = await apiClient.post(`/nominas/ciclo/${nominaId}/administracion-firma`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchNominaById(nominaId);
        refrescarNotificacionesHeader();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al firmar Administración.');
    } finally {
      setFirmandoAdmin(false);
    }
  };

  const handleFirmarDireccion = async () => {
    if (!window.confirm("Vas a aplicar la firma de Dirección General a esta pre-nómina. ¿Continuar?")) return;
    try {
      setEnviandoAsistencias(true);
      const res = await apiClient.put(`/nominas/ciclo/${nominaId}/firmar`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchNominaById(nominaId);
        refrescarNotificacionesHeader();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al firmar como Dirección.');
    } finally {
      setEnviandoAsistencias(false);
    }
  };

  const handleCerrarNomina = async () => {
    if (!window.confirm('Vas a cerrar la nómina aplicando los descuentos por faltas no justificadas del periodo y generar los recibos finales (PDF, un recibo por empleado para firma del trabajador). Esta acción no se puede deshacer. ¿Continuar?')) return;
    try {
      setCerrandoNomina(true);
      const res = await apiClient.post(`/nominas/ciclo/${nominaId}/cerrar`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchNominaById(nominaId);
        refrescarNotificacionesHeader();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar la nómina.');
    } finally {
      setCerrandoNomina(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Cargando detalles de la nómina...</div>;
  if (!nomina) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>No se encontró la nómina.</div>;

  let estadoReal = nomina.estado;
  const firmaRH = !!nomina.firmaRecursosHumanos;
  const firmaDireccion = !!(nomina as any).firmaDireccion;

  // Roles del flujo (4 firmas: Finanzas → Administración → Dirección → RH).
  //   Finanzas       → RECURSOS_FINANCIEROS o RRHH_FINANZAS  (sube subsidio)
  //   Administración → RRHH_FINANZAS                          (firma con botón)
  //   Dirección      → DIRECCION_GENERAL (direccion@marakame.com — firma y envía lista a RH)
  //   RH cierre      → RECURSOS_HUMANOS o RRHH_FINANZAS       (sube nómina firmada)
  const esFinanzas       = userRol === 'RECURSOS_FINANCIEROS' || userRol === 'RRHH_FINANZAS';
  const esAdministracion = userRol === 'RRHH_FINANZAS';
  const esDireccion      = userRol === 'DIRECCION_GENERAL';
  const esRH             = userRol === 'RECURSOS_HUMANOS' || userRol === 'RRHH_FINANZAS';

  // Mensaje del turno actual
  let mensajeTurno = "";
  if (!nomina.firmaFinanzas)             mensajeTurno = "Turno: Recursos Financieros (subir documento de subsidio)";
  else if (!nomina.firmaAdministracion)  mensajeTurno = "Turno: Administración (revisar y firmar)";
  else if (!firmaDireccion)              mensajeTurno = "Turno: Dirección General (firmar)";
  else if (!firmaRH)                     mensajeTurno = "Turno: Recursos Humanos (cerrar nómina y aplicar descuentos)";
  else                                   mensajeTurno = "Turno: Recursos Financieros (archivar nómina)";

  // Links absolutos a los archivos del ciclo.
  const apiBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  const link = (rel?: string | null) => (rel ? `${apiBase}${rel}` : null);
  const preNominaPdfAbs     = link((nomina as any).archivoUrl);
  const subsidioUrlAbs      = link((nomina as any).archivoSubsidioUrl);
  const nominaFinalPdfAbs   = link((nomina as any).archivoNominaFinalUrl);

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

      {/* PROGRESO DE FIRMAS (4/4) */}
      {estadoReal !== 'PAGADO' && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              <FirmaPaso label="Financieros" firmado={nomina.firmaFinanzas} />
              <FirmaPaso label="Administración" firmado={nomina.firmaAdministracion} />
              <FirmaPaso label="Dirección" firmado={firmaDireccion} />
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

          {/* PASO 2: Administración revisa y firma con un botón (sin subir documento). */}
          {nomina.firmaFinanzas && !nomina.firmaAdministracion && esAdministracion && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Firma de Administración</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Revisa el documento de subsidio que subió Recursos Financieros y aplica tu firma.
                Después, la pre-nómina pasará a Dirección General para generar el reporte de asistencias.
              </p>
              <button
                onClick={handleFirmarAdministracion}
                disabled={firmandoAdmin}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  backgroundColor: firmandoAdmin ? '#94a3b8' : '#0ea5e9',
                  color: 'white', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px',
                  fontWeight: '800', cursor: firmandoAdmin ? 'not-allowed' : 'pointer'
                }}
              >
                {firmandoAdmin ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {firmandoAdmin ? 'Firmando…' : 'Firmar como Administración'}
              </button>
            </div>
          )}

          {/* PASO 3: Dirección General aplica su firma (sin enviar listas adicionales). */}
          {nomina.firmaAdministracion && !firmaDireccion && esDireccion && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Firma de Dirección General</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Revisa la pre-nómina y aplica tu firma. Después, RH cerrará la nómina aplicando los descuentos por faltas no justificadas del periodo.
              </p>
              <button
                onClick={handleFirmarDireccion}
                disabled={enviandoAsistencias}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  backgroundColor: enviandoAsistencias ? '#94a3b8' : '#10b981',
                  color: 'white', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px',
                  fontWeight: '800', cursor: enviandoAsistencias ? 'not-allowed' : 'pointer'
                }}
              >
                {enviandoAsistencias ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {enviandoAsistencias ? 'Firmando…' : 'Firmar como Dirección'}
              </button>
            </div>
          )}

          {/* PASO 4: AUTORIZADO + RH sube nómina firmada */}
          {estadoReal === 'AUTORIZADO' && !firmaRH && esRH && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Acceso directo a documentos del flujo (pre-nómina + lista final de asistencias). */}
              <div style={{ backgroundColor: 'white', padding: '1.25rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '16px' }}>Pre-nómina autorizada</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  La pre-nómina ya tiene las firmas de Finanzas, Administración y Dirección. Al cerrar, el sistema recalcula cada recibo descontando las faltas no justificadas del periodo y aplica tu firma de RH.
                </p>
              </div>

              {/* CTA: Cerrar nómina (calcula descuentos, firma de RH y genera PDF final) */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Cerrar nómina y generar recibos finales</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  Antes de cerrar, ve a <strong>Justificaciones</strong> y aprueba/rechaza los pendientes — el salario calculado de cada empleado se actualiza en tiempo real. Al confirmar aquí, el sistema descuenta las faltas no aprobadas (sueldo/15 × días), aplica tu firma de RH y genera un PDF con un recibo por empleado listo para imprimir y recoger la firma del trabajador antes de mandarlo a Finanzas.
                </p>
                <button
                  onClick={handleCerrarNomina}
                  disabled={cerrandoNomina}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    backgroundColor: cerrandoNomina ? '#94a3b8' : '#0ea5e9',
                    color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '10px',
                    fontWeight: '800', cursor: cerrandoNomina ? 'not-allowed' : 'pointer'
                  }}
                >
                  {cerrandoNomina ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                  {cerrandoNomina ? 'Calculando, cerrando y generando PDF…' : 'Calcular, cerrar y generar recibos'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 5: Finanzas archiva */}
          {estadoReal === 'AUTORIZADO' && firmaRH && esFinanzas && (
            <div style={{ backgroundColor: '#1e293b', padding: '1.5rem 2rem', borderRadius: '20px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Banknote size={22} color="#34d399" />
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Lista para archivar</h2>
                  </div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', maxWidth: '600px' }}>
                    RH ya cerró la nómina y generó los recibos finales. Verifica que estén firmados por el trabajador y archiva para cerrar el ciclo.
                  </p>
                </div>
                <button onClick={handleArchivar} style={{ backgroundColor: '#34d399', color: '#064e3b', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Archive size={18} /> Archivar Nómina
                </button>
              </div>
              {nominaFinalPdfAbs && (
                <a
                  href={nominaFinalPdfAbs}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#a7f3d0', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}
                >
                  <FileText size={14} />
                  Ver recibos finales (PDF)
                  <ExternalLink size={12} />
                </a>
              )}
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
          Documentos del ciclo. La pre-nómina y los descuentos por faltas se calculan dentro del sistema.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ArchivoLink
            url={preNominaPdfAbs}
            etiqueta="Pre-nómina (PDF) — generado al crear el ciclo"
            faltaTexto="Aún no se ha generado el PDF de la pre-nómina"
          />
          <ArchivoLink
            url={subsidioUrlAbs}
            etiqueta="Solicitud de subsidio — subido por Finanzas"
            faltaTexto="Aún no se sube el documento de subsidio"
          />
          <ArchivoLink
            url={nominaFinalPdfAbs}
            etiqueta="Nómina final (PDF, un recibo por empleado) — generado al cerrar"
            faltaTexto="Aún no se cierra la nómina (paso de RH)"
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
