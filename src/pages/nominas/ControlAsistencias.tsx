import React, { useState, useEffect, useMemo } from 'react';
import { useNominaStore } from '../../stores/nominaStore';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';
import { 
  Users, CheckCircle, Clock, AlertOctagon, 
  UploadCloud, Save, FileText, Filter, Loader2, Eye, Building2, Calendar, Check, X
} from 'lucide-react';

const ControlAsistencias: React.FC = () => {
  const { empleados, fetchEmpleados } = useNominaStore();
  const { usuario } = useAuthStore();
  
  const esModoSupervision = usuario?.rol === 'ADMIN_GENERAL' || usuario?.rol === 'JEFE_MEDICO';

  // ================= ESTADOS PARA CAPTURA DIARIA (JEFES) =================
  const [fechaDia, setFechaDia] = useState(new Date().toISOString().split('T')[0]);
  const [captura, setCaptura] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= ESTADOS PARA REPORTE QUINCENAL (ADMIN) =================
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear());
  const [quincenaSeleccionada, setQuincenaSeleccionada] = useState<1 | 2>(fechaActual.getDate() <= 15 ? 1 : 2);
  const [filtroDeptoAdmin, setFiltroDeptoAdmin] = useState<'TODOS' | string>('TODOS');
  
  const [asistenciasGuardadas, setAsistenciasGuardadas] = useState<any[]>([]);
  const [isLoadingAsistencias, setIsLoadingAsistencias] = useState(false);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  // CALCULAR DÍAS DE LA QUINCENA
  const diasQuincena = useMemo(() => {
    const inicio = quincenaSeleccionada === 1 ? 1 : 16;
    const fin = quincenaSeleccionada === 1 ? 15 : new Date(anioSeleccionado, mesSeleccionado + 1, 0).getDate();
    const fechas = [];
    for (let i = inicio; i <= fin; i++) {
      const fechaStr = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      fechas.push({ dia: i, fechaStr });
    }
    return fechas;
  }, [mesSeleccionado, anioSeleccionado, quincenaSeleccionada]);

  // FETCH ASISTENCIAS QUINCENALES (SOLO ADMIN)
  useEffect(() => {
    if (esModoSupervision) {
      const fetchQuincena = async () => {
        setIsLoadingAsistencias(true);
        const fechaInicio = diasQuincena[0].fechaStr;
        const fechaFin = diasQuincena[diasQuincena.length - 1].fechaStr;
        try {
          const res = await apiClient.get(`/nominas/asistencias?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
          if (res.data.success) {
            setAsistenciasGuardadas(res.data.data);
          }
        } catch (error) {
          console.error("Error cargando reporte quincenal:", error);
        } finally {
          setIsLoadingAsistencias(false);
        }
      };
      fetchQuincena();
    }
  }, [diasQuincena, esModoSupervision]);

  // FILTRADO DE EMPLEADOS
  const empleadosFiltrados = useMemo(() => {
    if (!usuario) return [];
    const rolUsuario = usuario.rol?.toString().toUpperCase().trim();

    return empleados.filter(emp => {
      if (!emp.activo) return false;
      const deptoEmp = emp.departamento?.toString().toUpperCase().trim();

      if (esModoSupervision) {
        if (filtroDeptoAdmin === 'TODOS') return true;
        return deptoEmp === filtroDeptoAdmin.toUpperCase().trim();
      }
      
      if (rolUsuario === 'ADMISIONES') return deptoEmp === 'ADMISIONES';
      if (rolUsuario === 'ALMACEN') return deptoEmp === 'ALMACEN';
      if (rolUsuario === 'RRHH_FINANZAS') return deptoEmp === 'ADMINISTRACION' || deptoEmp === 'RECURSOS HUMANOS';
      
      const rolesClinicos = ['AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION'];
      if (rolesClinicos.includes(rolUsuario)) return deptoEmp === 'CLINICO' || deptoEmp === 'MEDICO';

      return deptoEmp === rolUsuario;
    });
  }, [empleados, usuario, filtroDeptoAdmin, esModoSupervision]);

  const empleadosPorDepartamento = useMemo(() => {
    const agrupados: Record<string, typeof empleadosFiltrados> = {};
    empleadosFiltrados.forEach(emp => {
      const depto = (emp.departamento || 'SIN ASIGNAR').toUpperCase();
      if (!agrupados[depto]) agrupados[depto] = [];
      agrupados[depto].push(emp);
    });
    return agrupados;
  }, [empleadosFiltrados]);

  // ================= LÓGICA DE CAPTURA (JEFES) =================
  useEffect(() => {
    if (!esModoSupervision && empleadosFiltrados.length > 0) {
      const inicial: Record<number, any> = {};
      empleadosFiltrados.forEach(emp => {
        if (!captura[emp.id]) {
          inicial[emp.id] = { tipo: 'ASISTENCIA', motivo: '', archivo: null, quiereJustificar: false };
        }
      });
      if (Object.keys(inicial).length > 0) setCaptura(prev => ({ ...prev, ...inicial }));
    }
  }, [empleadosFiltrados, esModoSupervision]);

  const handleTipoChange = (empleadoId: number, tipo: string) => { setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], tipo, motivo: '', archivo: null, quiereJustificar: false } })); };
  const handleQuiereJustificarChange = (empleadoId: number, quiere: boolean) => { setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], quiereJustificar: quiere, motivo: quiere ? prev[empleadoId].motivo : '', archivo: quiere ? prev[empleadoId].archivo : null } })); };
  const handleMotivoChange = (empleadoId: number, motivo: string) => { setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], motivo } })); };
  const handleArchivoChange = (empleadoId: number, e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], archivo: e.target.files![0] } })); };

  const handleGuardarAsistencias = async () => {
    const registrosAEnviar = empleadosFiltrados.map(emp => ({
      empleadoId: emp.id,
      tipo: captura[emp.id]?.tipo || 'ASISTENCIA',
      motivo: captura[emp.id]?.motivo || '',
      quiereJustificar: captura[emp.id]?.quiereJustificar || false
    }));

    if (registrosAEnviar.some(r => (r.tipo === 'FALTA' || r.tipo === 'RETARDO') && r.quiereJustificar === true && (!r.motivo || r.motivo.trim() === ''))) {
      alert("Por favor, escribe el motivo en las incidencias justificadas.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/nominas/asistencias', { fecha: fechaDia, registros: registrosAEnviar });
      if (response.data.success) alert(`¡Éxito! ${response.data.message}`);
    } catch (error: any) {
      if (error.response?.status === 400) alert("⚠️ " + error.response.data.message);
      else alert("❌ Error al guardar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const departamentosDisponibles = Array.from(new Set(empleados.map(e => e.departamento)));
  const listaDepartamentos = Object.keys(empleadosPorDepartamento).sort();

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {esModoSupervision ? <Calendar size={28} color="#8b5cf6" /> : <Users size={28} color="#3b82f6" />}
            {esModoSupervision ? 'Reporte Quincenal de Asistencias' : 'Captura de Asistencia Diaria'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            {esModoSupervision ? 'Monitoreo de incidencias para cálculo de nómina.' : `Gestionando personal de: ${usuario?.rol?.replace('_', ' ')}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* CONTROLES MODO SUPERVISIÓN */}
          {esModoSupervision ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Filter size={16} color="#64748b" />
                <select value={filtroDeptoAdmin} onChange={(e) => setFiltroDeptoAdmin(e.target.value)} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b' }}>
                  <option value="TODOS">Todos los Deptos</option>
                  {departamentosDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b' }}>
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={quincenaSeleccionada} onChange={(e) => setQuincenaSeleccionada(Number(e.target.value) as 1 | 2)} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                  <option value={1}>1ra Quincena</option>
                  <option value={2}>2da Quincena</option>
                </select>
              </div>
            </>
          ) : (
            /* CONTROLES MODO CAPTURA */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>Fecha a registrar:</span>
              <input type="date" value={fechaDia} onChange={(e) => setFechaDia(e.target.value)} style={{ border: 'none', outline: 'none', fontWeight: '900', color: '#1e293b', fontSize: '16px' }} />
            </div>
          )}
        </div>
      </div>

      {/* RENDERIZADO: MODO SUPERVISIÓN (TABLA QUINCENAL) */}
      {esModoSupervision ? (
        isLoadingAsistencias ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <Loader2 size={40} className="animate-spin" color="#8b5cf6" style={{ margin: '0 auto' }}/>
            <p style={{ color: '#64748b', marginTop: '1rem', fontWeight: '600' }}>Calculando matriz quincenal...</p>
          </div>
        ) : listaDepartamentos.length > 0 ? (
          listaDepartamentos.map(depto => (
            <div key={depto} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                <Building2 size={18} color="#8b5cf6" /> Depto: {depto}
              </h2>

              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>COLABORADOR</th>
                      {diasQuincena.map(d => (
                        <th key={d.dia} style={{ padding: '0.75rem 0.25rem', fontSize: '11px', fontWeight: '900', color: '#475569', width: '35px' }}>{d.dia}</th>
                      ))}
                      <th style={{ padding: '0.75rem 1rem', fontSize: '11px', fontWeight: '900', color: '#b91c1c' }}>FALTAS</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '11px', fontWeight: '900', color: '#b45309' }}>RET.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosPorDepartamento[depto].map((emp) => {
                      // Filtrar asistencias de este empleado en la quincena
                      const asistenciasEmp = asistenciasGuardadas.filter(a => a.empleadoId === emp.id);
                      let faltas = 0;
                      let retardos = 0;

                      return (
                        <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0', transition: '0.2s' }}>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>
                            <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '12px' }}>{emp.nombre} {emp.apellidos}</p>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '10px' }}>{emp.puesto}</p>
                          </td>
                          
                          {/* Días del 1 al 15 (o 16 al 30) */}
                          {diasQuincena.map(d => {
                            // Buscamos el registro comparando solo Año, Mes y Día (ignorando horas/zonas horarias)
                            const registroDia = asistenciasEmp.find(a => {
                                const fechaBD = new Date(a.fecha);
                                const fechaTabla = new Date(d.fechaStr + 'T12:00:00'); // Forzamos mediodía para evitar saltos de zona
                                return fechaBD.getUTCDate() === fechaTabla.getUTCDate() &&
                                    fechaBD.getUTCMonth() === fechaTabla.getUTCMonth() &&
                                    fechaBD.getUTCFullYear() === fechaTabla.getUTCFullYear();
                            });
                            
                            let icono = <span style={{ color: '#e2e8f0' }}>-</span>;
                            if (registroDia) {
                                if (registroDia.tipo === 'ASISTENCIA') icono = <Check size={16} color="#10b981" style={{ margin: '0 auto' }} />;
                                if (registroDia.tipo === 'RETARDO') { retardos++; icono = <Clock size={16} color="#f59e0b" style={{ margin: '0 auto' }} />; }
                                if (registroDia.tipo === 'FALTA') { faltas++; icono = <X size={16} color="#ef4444" style={{ margin: '0 auto' }} />; }
                            }

                            return (
                                <td key={d.dia} style={{ padding: '0.5rem', borderLeft: '1px solid #f1f5f9' }}>
                                {icono}
                                </td>
                            );
                            })}

                          {/* Resumen */}
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: faltas > 0 ? '#ef4444' : '#64748b', fontSize: '13px', backgroundColor: '#fef2f2' }}>{faltas}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: retardos > 0 ? '#f59e0b' : '#64748b', fontSize: '13px', backgroundColor: '#fffbeb' }}>{retardos}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '4rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold' }}>No se encontraron empleados.</p>
          </div>
        )
      ) : (
        /* RENDERIZADO: MODO CAPTURA DIARIA (JEFES) - (Se mantiene igual que antes) */
        listaDepartamentos.length > 0 ? listaDepartamentos.map(depto => (
           <div key={depto} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                <Building2 size={20} color="#3b82f6" /> Depto: {depto}
              </h2>
              {/* Aquí va la tabla de captura que ya teníamos (la omito para no hacer gigante el mensaje, pero en el código va completa) */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '12px', fontWeight: '900', color: '#475569' }}>COLABORADOR</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '12px', fontWeight: '900', color: '#475569', textAlign: 'center' }}>ESTATUS</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '12px', fontWeight: '900', color: '#475569' }}>DETALLE / MOTIVO</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosPorDepartamento[depto].map((emp) => {
                    const reg = captura[emp.id] || { tipo: 'ASISTENCIA', quiereJustificar: false };
                    const requiereJustificacion = reg.tipo === 'FALTA' || reg.tipo === 'RETARDO';

                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: reg.tipo === 'FALTA' ? '#fef2f2' : reg.tipo === 'RETARDO' ? '#fffbeb' : 'white' }}>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>{emp.nombre} {emp.apellidos}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>{emp.puesto.toUpperCase()}</p>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => handleTipoChange(emp.id, 'ASISTENCIA')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: reg.tipo === 'ASISTENCIA' ? '2px solid #10b981' : '1px solid #cbd5e1', backgroundColor: reg.tipo === 'ASISTENCIA' ? '#dcfce7' : 'white', fontWeight: 'bold', fontSize: '11px', color: reg.tipo === 'ASISTENCIA' ? '#047857' : '#64748b' }}>Presente</button>
                            <button onClick={() => handleTipoChange(emp.id, 'RETARDO')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: reg.tipo === 'RETARDO' ? '2px solid #f59e0b' : '1px solid #cbd5e1', backgroundColor: reg.tipo === 'RETARDO' ? '#fef3c7' : 'white', fontWeight: 'bold', fontSize: '11px', color: reg.tipo === 'RETARDO' ? '#b45309' : '#64748b' }}>Retardo</button>
                            <button onClick={() => handleTipoChange(emp.id, 'FALTA')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: reg.tipo === 'FALTA' ? '2px solid #ef4444' : '1px solid #cbd5e1', backgroundColor: reg.tipo === 'FALTA' ? '#fee2e2' : 'white', fontWeight: 'bold', fontSize: '11px', color: reg.tipo === 'FALTA' ? '#b91c1c' : '#64748b' }}>Falta</button>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', width: '40%' }}>
                          {requiereJustificacion ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                <span>¿Cuenta justificación?</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><input type="radio" checked={reg.quiereJustificar === true} onChange={() => handleQuiereJustificarChange(emp.id, true)} /> Sí</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><input type="radio" checked={reg.quiereJustificar === false} onChange={() => handleQuiereJustificarChange(emp.id, false)} /> No</label>
                              </div>
                              {reg.quiereJustificar ? (
                                <input type="text" placeholder="Motivo..." value={reg.motivo || ''} onChange={(e) => handleMotivoChange(emp.id, e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                              ) : (
                                <div style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'inline-block' }}><span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>❌ Incidencia sin justificación</span></div>
                              )}
                            </div>
                          ) : <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Sin incidencias</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
           </div>
        )) : <p>No hay empleados</p>
      )}

      {/* BOTÓN GUARDAR (SOLO JEFES) */}
      {!esModoSupervision && listaDepartamentos.length > 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
          <button onClick={handleGuardarAsistencias} disabled={isSubmitting} style={{ backgroundColor: isSubmitting ? '#94a3b8' : '#1e293b', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: '900', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} 
            {isSubmitting ? 'Guardando...' : `Guardar Lista de Hoy`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlAsistencias;