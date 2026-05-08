import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, CheckCircle, Printer, Archive, Banknote } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';

// 1. CORRECCIÓN: Función blindada para aceptar números o textos y convertirlos a moneda
const formatCurrency = (amount: any) => {
  const validAmount = Number(amount) || 0;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(validAmount);
};

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

  const userRol = "RECURSOS_HUMANOS"; 

  useEffect(() => {
    if (nominaId) {
      fetchNominaById(nominaId);
    }
  }, [nominaId, fetchNominaById]);

  // Agrupamos de forma segura
  const prenominasPorDepto = nomina?.prenominas?.reduce((acc: any, pn: any) => {
    const depto = pn.empleado?.departamento || "GENERAL";
    if (!acc[depto]) acc[depto] = [];
    acc[depto].push(pn);
    return acc;
  }, {}) || {};

  // 2. CORRECCIÓN: Sumamos los totales en TIEMPO REAL leyendo a los empleados
  // Así nunca saldrá en $0 aunque el backend no lo haya actualizado
  const totalPercepcionesCalc = nomina?.prenominas?.reduce((sum: number, pn: any) => sum + (Number(pn.totalPercepciones) || 0), 0) || 0;
  const totalDeduccionesCalc = nomina?.prenominas?.reduce((sum: number, pn: any) => sum + (Number(pn.totalDeducciones) || 0), 0) || 0;
  const totalNetoPagarCalc = nomina?.prenominas?.reduce((sum: number, pn: any) => sum + (Number(pn.totalAPagar) || 0), 0) || 0;

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

  let mensajeTurno = "";
  let sePuedeFirmar = false;
  if (!nomina.firmaFinanzas) {
    mensajeTurno = "Turno: Recursos Financieros (Solicitud de Subsidio)";
    if (userRol === 'RRHH_FINANZAS') sePuedeFirmar = true;
  } else if (!nomina.firmaAdministracion) {
    mensajeTurno = "Turno: Depto. de Administración (Revisión)";
    if (userRol === 'ADMINISTRACION') sePuedeFirmar = true;
  } else if (!nomina.firmaDireccion) {
    mensajeTurno = "Turno: Dirección General (Autorización)";
    if (userRol === 'DIRECCION_GENERAL' || userRol === 'ADMIN_GENERAL') sePuedeFirmar = true;
  } else if (!nomina.firmaRecursosHumanos) {
    mensajeTurno = "Turno: Recursos Humanos (Cierre de Incidencias)";
    if (userRol === 'RECURSOS_HUMANOS') sePuedeFirmar = true;
  }

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

      {/* ZONA DE IMPRESIÓN */}
      <div className="zona-impresion">
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 4px 0' }}>Reporte de Nómina</h2>
              <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>{nomina.periodo}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Folio: {nomina.folio}</h3>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: estadoReal === 'PAGADO' ? '#166534' : '#3b82f6', backgroundColor: estadoReal === 'PAGADO' ? '#dcfce7' : '#eff6ff', padding: '4px 12px', borderRadius: '8px', display: 'inline-block', marginTop: '8px' }}>
                ESTADO: {estadoReal}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>PERCEPCIONES</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#14532d' }}>{formatCurrency(totalPercepcionesCalc)}</p>
            </div>
            <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#991b1b', fontWeight: 'bold' }}>DEDUCCIONES</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#7f1d1d' }}>{formatCurrency(totalDeduccionesCalc)}</p>
            </div>
            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>NETO A PAGAR</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>{formatCurrency(totalNetoPagarCalc)}</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '11px', color: '#64748b' }}>EMPLEADO</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '11px', color: '#64748b' }}>SUELDO BASE</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '11px', color: '#64748b' }}>COMPENSACIÓN</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '11px', color: '#ef4444' }}>ISR</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '11px', color: '#ef4444' }}>FALTAS</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '11px', color: '#1e293b' }}>NETO A PAGAR</th>
                <th className="no-imprimir" style={{ padding: '1rem 1.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(prenominasPorDepto).map((deptoNombre) => (
                <React.Fragment key={deptoNombre}>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <td colSpan={7} style={{ padding: '0.6rem 1.5rem', fontWeight: '900', color: '#475569', fontSize: '12px' }}>
                      DEPARTAMENTO: {deptoNombre.toUpperCase()}
                    </td>
                  </tr>

                  {prenominasPorDepto[deptoNombre].map((pn: any) => (
                    <tr key={pn.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>{pn.empleado?.nombre} {pn.empleado?.apellidos}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{formatCurrency(pn.sueldoBruto)}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{formatCurrency(pn.compensacion)}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#ef4444' }}>-{formatCurrency(pn.retencionISR)}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#ef4444' }}>-{formatCurrency(pn.descuentoIncidencias)}</td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '900' }}>{formatCurrency(pn.totalAPagar)}</td>
                      <td className="no-imprimir" style={{ padding: '1rem 1.5rem' }}></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
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