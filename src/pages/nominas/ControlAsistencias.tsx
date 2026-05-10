import React, { useState, useEffect, useMemo } from 'react';
import { useNominaStore } from '../../stores/nominaStore';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';
import {
  Users, CheckCircle, Clock, AlertOctagon,
  UploadCloud, Save, FileText, Filter, Loader2, Eye, Building2, Calendar, Check, X, RefreshCw,
  Paperclip, Lock
} from 'lucide-react';

// Normaliza cualquier fecha (ISO, Date, "YYYY-MM-DD") a "YYYY-MM-DD" sin saltos de zona horaria.
// Si viene como string con formato fecha, recortamos los primeros 10 chars (lo más seguro).
// Si viene como Date, usamos UTC para evitar que el TZ local desplace el día.
const toYMD = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.slice(0, 10);
  }
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// El backend podría devolver el id del empleado como `empleadoId`, `empleado_id`
// o anidado dentro de `empleado.id`. Lo resolvemos aquí para que el filtro no falle silencioso.
const getEmpleadoId = (registro: any): number | null => {
  const raw = registro?.empleadoId ?? registro?.empleado_id ?? registro?.empleado?.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
};

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

  // ================= ESTADO DE BLOQUEO (JEFES) =================
  // Si ya existe al menos un registro para `fechaDia` y los empleados a cargo del jefe,
  // no se permite volver a capturar ese día.
  const [yaCapturadoHoy, setYaCapturadoHoy] = useState(false);
  const [verificandoBloqueo, setVerificandoBloqueo] = useState(false);

  // ================= MODAL DE REVISIÓN DE JUSTIFICACIÓN (ADMIN) =================
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<any | null>(null);
  const [decidiendoJustif, setDecidiendoJustif] = useState(false);

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
  const fetchQuincena = React.useCallback(async () => {
    if (!esModoSupervision || diasQuincena.length === 0) return;
    setIsLoadingAsistencias(true);
    const fechaInicio = diasQuincena[0].fechaStr;
    const fechaFin = diasQuincena[diasQuincena.length - 1].fechaStr;
    try {
      const res = await apiClient.get(`/nominas/asistencias?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (res.data.success) {
        const data = res.data.data || [];
        // Diagnóstico: nos dice si el backend devuelve algo y con qué shape (campo de id, fecha)
        if (data.length > 0) {
          console.log('[Asistencias] muestra del registro recibido:', data[0]);
        } else {
          console.log('[Asistencias] backend devolvió 0 registros para', fechaInicio, '→', fechaFin);
        }
        setAsistenciasGuardadas(data);
      }
    } catch (error) {
      console.error("Error cargando reporte quincenal:", error);
    } finally {
      setIsLoadingAsistencias(false);
    }
  }, [diasQuincena, esModoSupervision]);

  useEffect(() => {
    fetchQuincena();
  }, [fetchQuincena]);

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

  // ============== VERIFICAR BLOQUEO DEL DÍA (SOLO JEFES) ==============
  // Cada vez que cambia `fechaDia` o el set de empleados del jefe, consultamos al backend
  // si ya hay registros para ese día. Si los hay → bloqueamos la captura.
  useEffect(() => {
    if (esModoSupervision || empleadosFiltrados.length === 0) {
      setYaCapturadoHoy(false);
      return;
    }
    let cancelado = false;
    const verificar = async () => {
      setVerificandoBloqueo(true);
      try {
        const res = await apiClient.get(`/nominas/asistencias?fechaInicio=${fechaDia}&fechaFin=${fechaDia}`);
        if (cancelado) return;
        if (res.data.success) {
          const idsDelJefe = new Set(empleadosFiltrados.map(e => e.id));
          const tieneRegistros = (res.data.data || []).some((a: any) => {
            const id = getEmpleadoId(a);
            return id != null && idsDelJefe.has(id) && toYMD(a.fecha) === fechaDia;
          });
          setYaCapturadoHoy(tieneRegistros);
        }
      } catch (error) {
        console.error('Error verificando bloqueo del día:', error);
      } finally {
        if (!cancelado) setVerificandoBloqueo(false);
      }
    };
    verificar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDia, esModoSupervision, empleadosFiltrados.length]);

  const handleTipoChange = (empleadoId: number, tipo: string) => { setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], tipo, motivo: '', archivo: null, quiereJustificar: false } })); };
  const handleQuiereJustificarChange = (empleadoId: number, quiere: boolean) => { setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], quiereJustificar: quiere, motivo: quiere ? prev[empleadoId].motivo : '', archivo: quiere ? prev[empleadoId].archivo : null } })); };
  const handleMotivoChange = (empleadoId: number, motivo: string) => { setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], motivo } })); };
  const handleArchivoChange = (empleadoId: number, e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setCaptura(prev => ({ ...prev, [empleadoId]: { ...prev[empleadoId], archivo: e.target.files![0] } })); };

  const handleGuardarAsistencias = async () => {
    if (yaCapturadoHoy) {
      alert("La asistencia de este día ya fue capturada y está bloqueada.");
      return;
    }

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

      // Enviamos como multipart/form-data: registros como JSON y cada archivo bajo `archivo_<empleadoId>`.
      const formData = new FormData();
      formData.append('fecha', fechaDia);
      formData.append('registros', JSON.stringify(registrosAEnviar));
      empleadosFiltrados.forEach(emp => {
        const archivo: File | null = captura[emp.id]?.archivo;
        if (archivo) {
          formData.append(`archivo_${emp.id}`, archivo);
        }
      });

      const response = await apiClient.post('/nominas/asistencias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        alert(`¡Éxito! ${response.data.message}`);
        setYaCapturadoHoy(true);
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert("⚠️ " + error.response.data.message);
        setYaCapturadoHoy(true); // backend confirma que ya está capturado
      } else if (error.response?.status === 400) {
        alert("⚠️ " + error.response.data.message);
      } else {
        alert("❌ Error al guardar.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const departamentosDisponibles = Array.from(new Set(empleados.map(e => e.departamento)));
  const listaDepartamentos = Object.keys(empleadosPorDepartamento).sort();

  // Decidir aprobación/rechazo de un justificante (modal del admin)
  const handleDecidirJustificacion = async (aprobar: boolean) => {
    if (!incidenciaSeleccionada) return;
    try {
      setDecidiendoJustif(true);
      const res = await apiClient.patch(
        `/nominas/asistencias/${incidenciaSeleccionada.id}/justificacion`,
        { aprobar }
      );
      if (res.data.success) {
        // Actualizamos en memoria para reflejar de inmediato sin refetch completo
        setAsistenciasGuardadas(prev => prev.map(a =>
          a.id === incidenciaSeleccionada.id
            ? { ...a, estadoJustificacion: aprobar ? 'APROBADA' : 'RECHAZADA' }
            : a
        ));
        setIncidenciaSeleccionada(null);
      }
    } catch (error: any) {
      console.error('Error decidiendo justificación:', error);
      alert(error.response?.data?.message || 'Error al guardar la decisión.');
    } finally {
      setDecidiendoJustif(false);
    }
  };

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

              <button
                onClick={fetchQuincena}
                disabled={isLoadingAsistencias}
                title="Actualizar reporte"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '12px', cursor: isLoadingAsistencias ? 'not-allowed' : 'pointer', fontWeight: '700', opacity: isLoadingAsistencias ? 0.7 : 1 }}
              >
                <RefreshCw size={16} className={isLoadingAsistencias ? 'animate-spin' : ''} />
                {isLoadingAsistencias ? 'Actualizando...' : 'Actualizar'}
              </button>
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
                      // Filtrar asistencias de este empleado en la quincena (defensivo: acepta varias formas del id)
                      const asistenciasEmp = asistenciasGuardadas.filter(a => getEmpleadoId(a) === emp.id);
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
                            // Comparamos como string YYYY-MM-DD: inmune a zonas horarias y a formatos de fecha del backend
                            const registroDia = asistenciasEmp.find(a => toYMD(a.fecha) === d.fechaStr);

                            // Solo cuentan como falta/retardo si NO están aprobadas (las aprobadas no descuentan en nómina)
                            const aprobada = registroDia?.estadoJustificacion === 'APROBADA';
                            const rechazada = registroDia?.estadoJustificacion === 'RECHAZADA';

                            let icono = <span style={{ color: '#e2e8f0' }}>-</span>;
                            let esIncidencia = false;
                            if (registroDia) {
                                if (registroDia.tipo === 'ASISTENCIA') {
                                    icono = <Check size={16} color="#10b981" style={{ margin: '0 auto' }} />;
                                } else if (registroDia.tipo === 'RETARDO') {
                                    if (!aprobada) retardos++;
                                    esIncidencia = true;
                                    icono = <Clock size={16} color={aprobada ? '#10b981' : rechazada ? '#b91c1c' : '#f59e0b'} style={{ margin: '0 auto' }} />;
                                } else if (registroDia.tipo === 'FALTA') {
                                    if (!aprobada) faltas++;
                                    esIncidencia = true;
                                    icono = aprobada
                                      ? <Check size={16} color="#10b981" style={{ margin: '0 auto' }} />
                                      : <X size={16} color={rechazada ? '#b91c1c' : '#ef4444'} style={{ margin: '0 auto' }} />;
                                }
                            }

                            const clickable = esIncidencia;
                            return (
                                <td
                                  key={d.dia}
                                  onClick={clickable ? () => setIncidenciaSeleccionada({ ...registroDia, empleado: emp }) : undefined}
                                  title={clickable ? 'Click para revisar justificación' : undefined}
                                  style={{
                                    padding: '0.5rem',
                                    borderLeft: '1px solid #f1f5f9',
                                    cursor: clickable ? 'pointer' : 'default',
                                    position: 'relative',
                                    backgroundColor: clickable && !aprobada && !rechazada ? '#fefce8' : undefined
                                  }}
                                >
                                  {icono}
                                  {/* Indicador de estado de revisión */}
                                  {esIncidencia && aprobada && (
                                    <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                                  )}
                                  {esIncidencia && rechazada && (
                                    <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#b91c1c' }} />
                                  )}
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
        /* RENDERIZADO: MODO CAPTURA DIARIA (JEFES) */
        <>
        {/* BANNER DE BLOQUEO: cuando la asistencia del día ya fue capturada */}
        {yaCapturadoHoy && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock size={20} color="#b91c1c" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: '800', color: '#b91c1c' }}>Captura bloqueada</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#7f1d1d' }}>
                La asistencia del <strong>{fechaDia}</strong> ya fue registrada. Podrás capturar nuevamente en una fecha distinta.
              </p>
            </div>
          </div>
        )}
        {verificandoBloqueo && !yaCapturadoHoy && (
          <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={14} className="animate-spin" /> Verificando captura del día...
          </div>
        )}
        {listaDepartamentos.length > 0 ? listaDepartamentos.map(depto => (
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
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', opacity: yaCapturadoHoy ? 0.55 : 1, pointerEvents: yaCapturadoHoy ? 'none' : 'auto' }}>
                            <button disabled={yaCapturadoHoy} onClick={() => handleTipoChange(emp.id, 'ASISTENCIA')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: yaCapturadoHoy ? 'not-allowed' : 'pointer', border: reg.tipo === 'ASISTENCIA' ? '2px solid #10b981' : '1px solid #cbd5e1', backgroundColor: reg.tipo === 'ASISTENCIA' ? '#dcfce7' : 'white', fontWeight: 'bold', fontSize: '11px', color: reg.tipo === 'ASISTENCIA' ? '#047857' : '#64748b' }}>Presente</button>
                            <button disabled={yaCapturadoHoy} onClick={() => handleTipoChange(emp.id, 'RETARDO')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: yaCapturadoHoy ? 'not-allowed' : 'pointer', border: reg.tipo === 'RETARDO' ? '2px solid #f59e0b' : '1px solid #cbd5e1', backgroundColor: reg.tipo === 'RETARDO' ? '#fef3c7' : 'white', fontWeight: 'bold', fontSize: '11px', color: reg.tipo === 'RETARDO' ? '#b45309' : '#64748b' }}>Retardo</button>
                            <button disabled={yaCapturadoHoy} onClick={() => handleTipoChange(emp.id, 'FALTA')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: yaCapturadoHoy ? 'not-allowed' : 'pointer', border: reg.tipo === 'FALTA' ? '2px solid #ef4444' : '1px solid #cbd5e1', backgroundColor: reg.tipo === 'FALTA' ? '#fee2e2' : 'white', fontWeight: 'bold', fontSize: '11px', color: reg.tipo === 'FALTA' ? '#b91c1c' : '#64748b' }}>Falta</button>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', width: '40%' }}>
                          {requiereJustificacion ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '13px', fontWeight: '600', color: '#334155', opacity: yaCapturadoHoy ? 0.55 : 1 }}>
                                <span>¿Cuenta justificación?</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: yaCapturadoHoy ? 'not-allowed' : 'pointer' }}><input type="radio" disabled={yaCapturadoHoy} checked={reg.quiereJustificar === true} onChange={() => handleQuiereJustificarChange(emp.id, true)} /> Sí</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: yaCapturadoHoy ? 'not-allowed' : 'pointer' }}><input type="radio" disabled={yaCapturadoHoy} checked={reg.quiereJustificar === false} onChange={() => handleQuiereJustificarChange(emp.id, false)} /> No</label>
                              </div>
                              {reg.quiereJustificar ? (
                                <>
                                  <input type="text" placeholder="Motivo..." value={reg.motivo || ''} onChange={(e) => handleMotivoChange(emp.id, e.target.value)} disabled={yaCapturadoHoy} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: yaCapturadoHoy ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                                    <Paperclip size={14} color="#3b82f6" />
                                    <span style={{ flex: 1 }}>
                                      {reg.archivo ? reg.archivo.name : 'Adjuntar receta médica o justificante (opcional)'}
                                    </span>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleArchivoChange(emp.id, e)} disabled={yaCapturadoHoy} style={{ display: 'none' }} />
                                  </label>
                                </>
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
        )) : <p>No hay empleados</p>}
        </>
      )}

      {/* BOTÓN GUARDAR (SOLO JEFES) */}
      {!esModoSupervision && listaDepartamentos.length > 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
          <button
            onClick={handleGuardarAsistencias}
            disabled={isSubmitting || yaCapturadoHoy || verificandoBloqueo}
            style={{
              backgroundColor: (isSubmitting || yaCapturadoHoy || verificandoBloqueo) ? '#94a3b8' : '#1e293b',
              color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: '900',
              cursor: (isSubmitting || yaCapturadoHoy || verificandoBloqueo) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (yaCapturadoHoy ? <Lock size={20} /> : <Save size={20} />)}
            {isSubmitting ? 'Guardando...' : yaCapturadoHoy ? 'Captura ya registrada' : 'Guardar Lista de Hoy'}
          </button>
        </div>
      )}

      {/* MODAL DE REVISIÓN DE JUSTIFICACIÓN (ADMIN) */}
      {incidenciaSeleccionada && (() => {
        const inc = incidenciaSeleccionada;
        const aprobada = inc.estadoJustificacion === 'APROBADA';
        const rechazada = inc.estadoJustificacion === 'RECHAZADA';
        const pendiente = !aprobada && !rechazada;
        const tieneDocumento = !!inc.documentoUrl;
        const tieneMotivo = inc.motivoJustificacion && inc.motivoJustificacion.trim() !== '';
        const apiBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');

        return (
          <div
            onClick={() => !decidiendoJustif && setIncidenciaSeleccionada(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b', fontSize: '18px' }}>
                    Revisar {inc.tipo === 'FALTA' ? 'falta' : 'retardo'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                    {inc.empleado?.nombre} {inc.empleado?.apellidos} · {toYMD(inc.fecha)}
                  </p>
                </div>
                <button onClick={() => setIncidenciaSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Estado actual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Estado:</span>
                  <span style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800',
                    backgroundColor: aprobada ? '#dcfce7' : rechazada ? '#fee2e2' : '#fef9c3',
                    color: aprobada ? '#047857' : rechazada ? '#b91c1c' : '#854d0e'
                  }}>
                    {aprobada ? 'APROBADA' : rechazada ? 'RECHAZADA' : 'PENDIENTE DE REVISIÓN'}
                  </span>
                </div>

                {/* Motivo */}
                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Motivo capturado por el jefe</p>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: tieneMotivo ? '#1e293b' : '#94a3b8', fontStyle: tieneMotivo ? 'normal' : 'italic' }}>
                    {tieneMotivo ? inc.motivoJustificacion : 'Sin motivo registrado'}
                  </div>
                </div>

                {/* Documento adjunto */}
                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Documento adjunto</p>
                  {tieneDocumento ? (
                    <a
                      href={`${apiBase}${inc.documentoUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}
                    >
                      <FileText size={16} />
                      <span style={{ flex: 1 }}>Ver justificante</span>
                      <Eye size={14} />
                    </a>
                  ) : (
                    <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                      No se adjuntó documento
                    </div>
                  )}
                </div>

                {/* Aviso si ya fue decidido */}
                {!pendiente && (
                  <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12px', color: '#854d0e' }}>
                    Esta incidencia ya fue {aprobada ? 'aprobada' : 'rechazada'}. Puedes cambiar la decisión si es necesario.
                  </div>
                )}
              </div>

              {/* Footer / Acciones */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                <button
                  onClick={() => handleDecidirJustificacion(false)}
                  disabled={decidiendoJustif}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid #fecaca',
                    backgroundColor: rechazada ? '#fee2e2' : 'white',
                    color: '#b91c1c', fontWeight: '700', cursor: decidiendoJustif ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px'
                  }}
                >
                  <X size={14} /> Rechazar
                </button>
                <button
                  onClick={() => handleDecidirJustificacion(true)}
                  disabled={decidiendoJustif}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none',
                    backgroundColor: aprobada ? '#047857' : '#10b981',
                    color: 'white', fontWeight: '800', cursor: decidiendoJustif ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px'
                  }}
                >
                  {decidiendoJustif ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Aprobar justificación
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ControlAsistencias;