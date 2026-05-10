import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, CheckCircle, Printer, Archive, Banknote, FileText, ExternalLink } from 'lucide-react';
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

  useEffect(() => {
    if (nominaId) {
      fetchNominaById(nominaId);
    }
  }, [nominaId, fetchNominaById]);

  const handleFirmar = async () => {
    if (window.confirm("¿Confirmas tu firma oficial para esta nómina?")) {
      const exito = await firmarNomina(nominaId);
      if (exito) alert("Firma aplicada exitosamente.");
    }
  };

  const handleImprimirRecibos = () => {
    window.print();
  };

  const handleArchivar = async () => {
    if (window.confirm("¿Confirmas que los recibos fueron firmados y entregados a Finanzas? Esta acción cerrará la nómina definitivamente.")) {
      const exito = await archivarNomina(nominaId);
      if (exito) alert("Nómina archivada y cerrada.");
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Cargando detalles de la nómina...</div>;
  if (!nomina) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>No se encontró la nómina.</div>;

  const firmasCompletadas = [nomina.firmaRecursosHumanos, nomina.firmaFinanzas, nomina.firmaAdministracion, nomina.firmaDireccion].filter(Boolean).length;
  
  let estadoReal = nomina.estado;
  if (firmasCompletadas === 4 && estadoReal === 'EN_REVISION') estadoReal = 'AUTORIZADO';

  // Secuencia: Finanzas → Jefatura Administrativa → Dirección General → cierre RH.
  // Cada paso lo firma su rol específico. Compatibilidad con el rol legacy RRHH_FINANZAS y
  // con ADMIN_GENERAL (super-admin) para no bloquear pruebas.
  const esFinanzas    = userRol === 'RECURSOS_FINANCIEROS' || userRol === 'RRHH_FINANZAS' || userRol === 'ADMIN_GENERAL';
  const esJefatura    = userRol === 'JEFE_ADMINISTRATIVO' || userRol === 'ADMIN_GENERAL';
  const esDireccion   = userRol === 'ADMIN_GENERAL';
  const esRH          = userRol === 'RECURSOS_HUMANOS' || userRol === 'RRHH_FINANZAS' || userRol === 'ADMIN_GENERAL';

  let mensajeTurno = "";
  let sePuedeFirmar = false;
  if (!nomina.firmaFinanzas) {
    mensajeTurno = "Turno: Recursos Financieros (Solicitud de Subsidio)";
    if (esFinanzas) sePuedeFirmar = true;
  } else if (!nomina.firmaAdministracion) {
    mensajeTurno = "Turno: Jefatura Administrativa (Revisión)";
    if (esJefatura) sePuedeFirmar = true;
  } else if (!nomina.firmaDireccion) {
    mensajeTurno = "Turno: Dirección General (Autorización)";
    if (esDireccion) sePuedeFirmar = true;
  } else if (!nomina.firmaRecursosHumanos) {
    mensajeTurno = "Turno: Recursos Humanos (Cierre del ciclo)";
    if (esRH) sePuedeFirmar = true;
  }

  // Link absoluto al archivo subido por RH (si existe). Servido desde /uploads en el backend.
  const apiBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  const archivoUrlAbs = (nomina as any).archivoUrl ? `${apiBase}${(nomina as any).archivoUrl}` : null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .zona-impresion, .zona-impresion * { visibility: visible; }
          .zona-impresion { position: absolute; left: 0; top: 0; width: 100%; }
          .no-imprimir { display: none !important; }
        }
      `}</style>

      <button className="no-imprimir" onClick={() => navigate('/nominas')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem' }}>
        <ArrowLeft size={20} /> Volver al Dashboard
      </button>

      {/* PANEL DE CIERRE (Solo AUTORIZADO) */}
      {estadoReal === 'AUTORIZADO' && (
        <div className="no-imprimir" style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '20px', marginBottom: '2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Banknote size={24} color="#34d399" />
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>Nómina Autorizada - Fase de Dispersión</h2>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', maxWidth: '600px', lineHeight: '1.5' }}>
              La nómina ha sido aprobada por Dirección. Imprime los recibos para recabar las firmas físicas de los trabajadores. Una vez entregados a Finanzas, archiva la nómina para cerrar el procedimiento.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleImprimirRecibos} style={{ backgroundColor: 'white', color: '#1e293b', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
              <Printer size={18} /> 1. Imprimir Recibos
            </button>
            <button onClick={handleArchivar} style={{ backgroundColor: '#34d399', color: '#064e3b', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
              <Archive size={18} /> 2. Archivar Nómina
            </button>
          </div>
        </div>
      )}

      {/* BANNER PAGADO */}
      {estadoReal === 'PAGADO' && (
        <div className="no-imprimir" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '1.5rem 2rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle size={32} color="#166534" />
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#166534' }}>Procedimiento Terminado</h2>
            <p style={{ margin: 0, color: '#15803d', fontSize: '14px', marginTop: '4px' }}>Esta nómina ha sido pagada, los recibos físicos fueron resguardados y el ciclo está cerrado.</p>
          </div>
        </div>
      )}

      {/* FIRMAS SECUENCIALES */}
      {estadoReal !== 'PAGADO' && (
        <div className="no-imprimir" style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            <FirmaPaso label="Financieros" firmado={nomina.firmaFinanzas} />
            <FirmaPaso label="Administración" firmado={nomina.firmaAdministracion} />
            <FirmaPaso label="Dirección" firmado={nomina.firmaDireccion} />
            <FirmaPaso label="Rec. Humanos" firmado={nomina.firmaRecursosHumanos} />
          </div>
          <div style={{ textAlign: 'right' }}>
            {estadoReal !== 'AUTORIZADO' ? (
              <>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: sePuedeFirmar ? '#3b82f6' : '#64748b' }}>
                  {mensajeTurno}
                </p>
                {sePuedeFirmar && (
                  <button onClick={handleFirmar} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PenTool size={18} /> Aplicar Firma Oficial
                  </button>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '900' }}>
                <CheckCircle size={20} /> 100% AUTORIZADA
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESUMEN + ARCHIVO DE CONTPAQi */}
      <div className="zona-impresion">
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 4px 0' }}>Pre-Nómina</h2>
              <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>{nomina.periodo}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Folio: {nomina.folio}</h3>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: estadoReal === 'PAGADO' ? '#166534' : '#3b82f6', backgroundColor: estadoReal === 'PAGADO' ? '#dcfce7' : '#eff6ff', padding: '4px 12px', borderRadius: '8px', display: 'inline-block', marginTop: '8px' }}>
                ESTADO: {estadoReal}
              </span>
            </div>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            El desglose por empleado, percepciones, deducciones y totales viven en el archivo de CONTPAQi/Nomipaq adjuntado por Recursos Humanos.
            Los responsables del flujo deben descargarlo para revisar y firmar.
          </p>

          {archivoUrlAbs ? (
            <a
              href={archivoUrlAbs}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.25rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none', fontWeight: '700' }}
            >
              <FileText size={18} />
              <span>Ver archivo de CONTPAQi</span>
              <ExternalLink size={14} />
            </a>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '13px', fontWeight: '700' }}>
              No hay archivo adjunto. Las pre-nóminas creadas antes de este flujo pueden no tener archivo asociado.
            </div>
          )}
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