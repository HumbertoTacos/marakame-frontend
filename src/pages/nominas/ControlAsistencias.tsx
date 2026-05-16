import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNominaStore } from '../../stores/nominaStore';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';
import {
  Calendar, Check, X, Loader2, Filter, RefreshCw, FileText, Eye,
  Building2, Paperclip, UploadCloud, AlertOctagon
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Helpers de fechas (UTC-safe — México UTC-6 puede desplazar el día con toISOString)
// ────────────────────────────────────────────────────────────────────────────
const toYMD = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getEmpleadoId = (registro: any): number | null => {
  const raw = registro?.empleadoId ?? registro?.empleado_id ?? registro?.empleado?.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
};

// Roles que ven TODAS las áreas sin filtro: solo RH puro y Admin. El usuario "administracion"
// (RRHH_FINANZAS) queda recortado a su área en backend igual que JEFE_ADMINISTRATIVO.
const ROLES_VEN_TODO = new Set(['ADMIN_GENERAL', 'RECURSOS_HUMANOS']);

const ControlAsistencias: React.FC = () => {
  const { empleados, fetchEmpleados } = useNominaStore();
  const { usuario } = useAuthStore();

  const veTodo = ROLES_VEN_TODO.has(usuario?.rol || '');

  // ───────── ESTADO: rango quincenal + filtro de depto (solo si veTodo) ─────────
  const ahora = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(ahora.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(ahora.getFullYear());
  const [quincenaSeleccionada, setQuincenaSeleccionada] = useState<1 | 2>(ahora.getDate() <= 15 ? 1 : 2);
  const [filtroDepto, setFiltroDepto] = useState<'TODOS' | string>('TODOS');

  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ───────── MODALES ─────────
  const [celdaEditar, setCeldaEditar] = useState<{ empleado: any; fechaStr: string; registro: any | null } | null>(null);
  const [justificarEmpleado, setJustificarEmpleado] = useState<any | null>(null);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<any | null>(null);

  useEffect(() => { fetchEmpleados(); }, [fetchEmpleados]);

  // ───────── Cálculo de los días de la quincena ─────────
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

  // ───────── Fetch asistencias del rango ─────────
  const fetchQuincena = useCallback(async () => {
    if (diasQuincena.length === 0) return;
    setIsLoading(true);
    try {
      const fechaInicio = diasQuincena[0].fechaStr;
      const fechaFin = diasQuincena[diasQuincena.length - 1].fechaStr;
      const res = await apiClient.get(`/nominas/asistencias?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (res.data.success) setAsistencias(res.data.data || []);
    } catch (err) {
      console.error('Error cargando quincena:', err);
    } finally {
      setIsLoading(false);
    }
  }, [diasQuincena]);

  useEffect(() => { fetchQuincena(); }, [fetchQuincena]);

  // ───────── Filtro cliente de empleados (defensa en profundidad — backend ya filtra) ─────────
  const empleadosFiltrados = useMemo(() => {
    return empleados
      .filter((e: any) => e.activo !== false)
      .filter((e: any) => {
        if (!veTodo) return true; // ya viene filtrado por el backend
        if (filtroDepto === 'TODOS') return true;
        return (e.departamento || '').toUpperCase().trim() === filtroDepto.toUpperCase().trim();
      });
  }, [empleados, filtroDepto, veTodo]);

  const empleadosPorDepartamento = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    empleadosFiltrados.forEach((emp: any) => {
      const depto = (emp.departamento || 'SIN ASIGNAR').toUpperCase();
      if (!grupos[depto]) grupos[depto] = [];
      grupos[depto].push(emp);
    });
    return grupos;
  }, [empleadosFiltrados]);

  const listaDepartamentos = Object.keys(empleadosPorDepartamento).sort();
  const departamentosDisponibles = Array.from(new Set(empleados.map((e: any) => e.departamento)));

  // ───────── Guardar un registro individual (auto-save desde el editor de celda) ─────────
  const guardarRegistro = async (empleadoId: number, fechaStr: string, tipo: 'ASISTENCIA' | 'FALTA') => {
    try {
      const fd = new FormData();
      fd.append('fecha', fechaStr);
      fd.append('registros', JSON.stringify([{ empleadoId, tipo, quiereJustificar: false, motivo: '' }]));
      const res = await apiClient.post('/nominas/asistencias', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        await fetchQuincena();
      }
    } catch (error: any) {
      console.error('Error guardando registro:', error);
      alert(error.response?.data?.message || 'Error al guardar el registro.');
    }
  };

  // ───────── Justificación quincenal por empleado ─────────
  const handleJustificarQuincena = async (empleadoId: number, motivo: string, archivo: File | null) => {
    const fechaInicio = diasQuincena[0]?.fechaStr;
    const fechaFin = diasQuincena[diasQuincena.length - 1]?.fechaStr;
    if (!fechaInicio || !fechaFin) return;

    try {
      const fd = new FormData();
      fd.append('empleadoId', String(empleadoId));
      fd.append('motivo', motivo);
      fd.append('fechaInicio', fechaInicio);
      fd.append('fechaFin', fechaFin);
      if (archivo) fd.append('archivo', archivo);

      const res = await apiClient.post('/nominas/asistencias/justificar-quincena', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert(res.data.message || 'Justificación quincenal aplicada.');
        setJustificarEmpleado(null);
        await fetchQuincena();
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Error al aplicar justificación quincenal.');
    }
  };

  // ───────── Decidir justificación (RH/admin/jefe) ─────────
  const handleDecidirJustificacion = async (aprobar: boolean) => {
    if (!incidenciaSeleccionada) return;
    try {
      const res = await apiClient.patch(
        `/nominas/asistencias/${incidenciaSeleccionada.id}/justificacion`,
        { aprobar }
      );
      if (res.data.success) {
        setAsistencias(prev => prev.map(a =>
          a.id === incidenciaSeleccionada.id
            ? { ...a, estadoJustificacion: aprobar ? 'APROBADA' : 'RECHAZADA' }
            : a
        ));
        setIncidenciaSeleccionada(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar la decisión.');
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={28} color="#8b5cf6" /> Justificaciones de Asistencia
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            {veTodo
              ? 'Vista quincenal de todas las áreas — clic en una celda para editar el día; justificación quincenal por empleado.'
              : 'Vista quincenal de tu equipo — clic en una celda para editar el día; justificación quincenal por empleado.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {veTodo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Filter size={16} color="#64748b" />
              <select value={filtroDepto} onChange={(e) => setFiltroDepto(e.target.value)} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b' }}>
                <option value="TODOS">Todos los Deptos</option>
                {departamentosDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b' }}>
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
              {[ahora.getFullYear() - 1, ahora.getFullYear(), ahora.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={quincenaSeleccionada} onChange={(e) => setQuincenaSeleccionada(Number(e.target.value) as 1 | 2)} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
              <option value={1}>1ra Quincena</option>
              <option value={2}>2da Quincena</option>
            </select>
          </div>

          <button
            onClick={fetchQuincena}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '12px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '700', opacity: isLoading ? 0.7 : 1 }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <Loader2 size={40} className="animate-spin" color="#8b5cf6" style={{ margin: '0 auto' }} />
          <p style={{ color: '#64748b', marginTop: '1rem', fontWeight: '600' }}>Calculando matriz quincenal…</p>
        </div>
      ) : listaDepartamentos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '4rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <AlertOctagon size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold' }}>No hay empleados en tu visibilidad para la quincena seleccionada.</p>
        </div>
      ) : (
        listaDepartamentos.map(depto => (
          <div key={depto} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
              <Building2 size={18} color="#8b5cf6" /> Depto: {depto}
            </h2>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>COLABORADOR</th>
                    {diasQuincena.map(d => (
                      <th key={d.dia} style={{ padding: '0.75rem 0.25rem', fontSize: '11px', fontWeight: '900', color: '#475569', width: '32px' }}>{d.dia}</th>
                    ))}
                    <th style={{ padding: '0.75rem 0.75rem', fontSize: '11px', fontWeight: '900', color: '#b91c1c' }}>FALTAS</th>
                    <th style={{ padding: '0.75rem 0.75rem', fontSize: '11px', fontWeight: '900', color: '#64748b' }}>QUINCENA</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosPorDepartamento[depto].map((emp) => {
                    const asistenciasEmp = asistencias.filter(a => getEmpleadoId(a) === emp.id);
                    let faltas = 0;

                    diasQuincena.forEach(d => {
                      const r = asistenciasEmp.find(a => toYMD(a.fecha) === d.fechaStr);
                      if (!r) return;
                      if (r.tipo === 'FALTA' && r.estadoJustificacion !== 'APROBADA') faltas++;
                    });

                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '12px' }}>{emp.nombre} {emp.apellidos}</p>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '10px' }}>{emp.puesto}</p>
                        </td>

                        {diasQuincena.map(d => {
                          const registroDia = asistenciasEmp.find(a => toYMD(a.fecha) === d.fechaStr);
                          const tipo = registroDia?.tipo;
                          const estado = registroDia?.estadoJustificacion;
                          const aprobada = estado === 'APROBADA';
                          const rechazada = estado === 'RECHAZADA';
                          const pendiente = estado === 'PENDIENTE';
                          const tieneJustificante = !!(registroDia?.motivoJustificacion || registroDia?.documentoUrl);

                          let icono: React.ReactNode = <span style={{ color: '#cbd5e1', fontWeight: '700' }}>·</span>;
                          if (tipo === 'ASISTENCIA') icono = <Check size={15} color="#10b981" style={{ margin: '0 auto' }} />;
                          else if (tipo === 'FALTA') icono = aprobada
                            ? <Check size={15} color="#10b981" style={{ margin: '0 auto' }} />
                            : <X size={15} color={rechazada ? '#b91c1c' : '#ef4444'} style={{ margin: '0 auto' }} />;

                          return (
                            <td
                              key={d.dia}
                              onClick={() => setCeldaEditar({ empleado: emp, fechaStr: d.fechaStr, registro: registroDia || null })}
                              title={`${d.fechaStr} — click para editar`}
                              style={{
                                padding: '0.5rem',
                                borderLeft: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                position: 'relative',
                                backgroundColor: pendiente && tieneJustificante ? '#fefce8' : undefined
                              }}
                            >
                              {icono}
                              {aprobada && tipo === 'FALTA' && (
                                <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                              )}
                              {rechazada && tieneJustificante && (
                                <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#b91c1c' }} />
                              )}
                              {pendiente && tieneJustificante && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setIncidenciaSeleccionada({ ...registroDia, empleado: emp }); }}
                                  title="Revisar justificación"
                                  style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308', color: 'white', border: 'none', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}
                                >!</button>
                              )}
                            </td>
                          );
                        })}

                        <td style={{ padding: '0.75rem 0.75rem', fontWeight: 'bold', color: faltas > 0 ? '#ef4444' : '#64748b', fontSize: '13px', backgroundColor: '#fef2f2' }}>{faltas}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <button
                            onClick={() => setJustificarEmpleado(emp)}
                            disabled={faltas === 0}
                            title={faltas === 0 ? 'Sin faltas por justificar' : 'Justificar faltas de toda la quincena'}
                            style={{
                              padding: '5px 10px', borderRadius: '8px', border: 'none',
                              backgroundColor: faltas === 0 ? '#e2e8f0' : '#8b5cf6',
                              color: faltas === 0 ? '#94a3b8' : 'white',
                              cursor: faltas === 0 ? 'not-allowed' : 'pointer',
                              fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Paperclip size={12} /> Justificar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* LEYENDA */}
      <div style={{ marginTop: '1.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> Asistencia / justificación aprobada</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><X size={14} color="#ef4444" /> Falta</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#fefce8', border: '1px solid #facc15' }} /> Pendiente de revisión</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#b91c1c' }} /> Justificación rechazada</span>
      </div>

      {/* MODAL: editar celda */}
      {celdaEditar && (
        <CeldaEditor
          empleado={celdaEditar.empleado}
          fechaStr={celdaEditar.fechaStr}
          registro={celdaEditar.registro}
          onClose={() => setCeldaEditar(null)}
          onGuardar={async (tipo) => {
            await guardarRegistro(celdaEditar.empleado.id, celdaEditar.fechaStr, tipo);
            setCeldaEditar(null);
          }}
        />
      )}

      {/* MODAL: justificar quincena */}
      {justificarEmpleado && (
        <JustificarQuincenaModal
          empleado={justificarEmpleado}
          asistencias={asistencias.filter(a => getEmpleadoId(a) === justificarEmpleado.id)}
          diasQuincena={diasQuincena}
          onClose={() => setJustificarEmpleado(null)}
          onSubmit={(motivo, archivo) => handleJustificarQuincena(justificarEmpleado.id, motivo, archivo)}
        />
      )}

      {/* MODAL: revisar justificación individual (jefes/RH/admin) */}
      {incidenciaSeleccionada && (
        <RevisarModal
          incidencia={incidenciaSeleccionada}
          onClose={() => setIncidenciaSeleccionada(null)}
          onDecidir={handleDecidirJustificacion}
        />
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Modal: editar tipo de asistencia para un día
// ────────────────────────────────────────────────────────────────────────────
const CeldaEditor: React.FC<{
  empleado: any;
  fechaStr: string;
  registro: any | null;
  onClose: () => void;
  onGuardar: (tipo: 'ASISTENCIA' | 'FALTA') => Promise<void>;
}> = ({ empleado, fechaStr, registro, onClose, onGuardar }) => {
  const [guardando, setGuardando] = useState(false);
  const tipoActual = registro?.tipo;

  const click = async (tipo: 'ASISTENCIA' | 'FALTA') => {
    setGuardando(true);
    try { await onGuardar(tipo); } finally { setGuardando(false); }
  };

  return (
    <div onClick={() => !guardando && onClose()} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '420px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b', fontSize: '16px' }}>Editar asistencia</h3>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>
              {empleado.nombre} {empleado.apellidos} · {fechaStr}
            </p>
          </div>
          <button onClick={onClose} disabled={guardando} style={{ background: 'none', border: 'none', cursor: guardando ? 'not-allowed' : 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(['ASISTENCIA', 'FALTA'] as const).map(opc => {
            const conf = opc === 'ASISTENCIA'
              ? { color: '#047857', bg: '#dcfce7', border: '#86efac', icon: <Check size={16} /> }
              : { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', icon: <X size={16} /> };
            const activo = tipoActual === opc;
            return (
              <button
                key={opc}
                onClick={() => click(opc)}
                disabled={guardando}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: activo ? `2px solid ${conf.color}` : `1px solid ${conf.border}`,
                  backgroundColor: activo ? conf.bg : 'white',
                  color: conf.color, fontWeight: '800', cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {conf.icon}
                {opc === 'ASISTENCIA' ? 'Presente' : 'Falta'}
                {activo && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700' }}>actual</span>}
              </button>
            );
          })}
        </div>
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
          Cualquier registro previo de ese día se sobrescribe. Las justificaciones se aplican aparte con el botón "Justificar".
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Modal: justificar TODA la quincena de un empleado con UN motivo + UN archivo
// ────────────────────────────────────────────────────────────────────────────
const JustificarQuincenaModal: React.FC<{
  empleado: any;
  asistencias: any[];
  diasQuincena: { dia: number; fechaStr: string }[];
  onClose: () => void;
  onSubmit: (motivo: string, archivo: File | null) => Promise<void>;
}> = ({ empleado, asistencias, diasQuincena, onClose, onSubmit }) => {
  const [motivo, setMotivo] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const incidencias = useMemo(() => {
    return diasQuincena
      .map(d => {
        const r = asistencias.find(a => toYMD(a.fecha) === d.fechaStr);
        return r && r.tipo === 'FALTA' ? { ...r, fechaStr: d.fechaStr } : null;
      })
      .filter(Boolean) as any[];
  }, [asistencias, diasQuincena]);

  const submit = async () => {
    if (!motivo.trim()) { alert('Captura el motivo de la justificación.'); return; }
    setEnviando(true);
    try { await onSubmit(motivo.trim(), archivo); } finally { setEnviando(false); }
  };

  return (
    <div onClick={() => !enviando && onClose()} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '560px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b', fontSize: '18px' }}>Justificación quincenal</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
              {empleado.nombre} {empleado.apellidos} · {empleado.puesto || empleado.departamento}
            </p>
          </div>
          <button onClick={onClose} disabled={enviando} style={{ background: 'none', border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Días que se justifican */}
          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Incidencias cubiertas ({incidencias.length})
            </p>
            {incidencias.length === 0 ? (
              <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                Este empleado no tiene incidencias por justificar en la quincena.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {incidencias.map((inc: any) => (
                  <span key={inc.id} style={{
                    padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800',
                    backgroundColor: '#fee2e2', color: '#b91c1c',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    <X size={11} />
                    {inc.fechaStr.slice(8, 10)} · FALTA
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label style={{ display: 'block', margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Motivo
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Reposo médico por incapacidad IMSS del 5 al 11 de mayo."
              rows={3}
              disabled={enviando}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {/* Archivo */}
          <div>
            <label style={{ display: 'block', margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Documento (opcional)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 0.85rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: enviando ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
              <Paperclip size={14} color="#3b82f6" />
              <span style={{ flex: 1 }}>{archivo ? archivo.name : 'Adjuntar receta, incapacidad o constancia (opcional)'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setArchivo(e.target.files?.[0] || null)} disabled={enviando} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={enviando} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '700', cursor: enviando ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={enviando || incidencias.length === 0} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: enviando || incidencias.length === 0 ? '#94a3b8' : '#8b5cf6', color: 'white', fontWeight: '800', cursor: enviando || incidencias.length === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            {enviando ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {enviando ? 'Enviando…' : 'Aplicar a la quincena'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Modal: revisar justificación de UNA incidencia (RH / admin / jefe)
// ────────────────────────────────────────────────────────────────────────────
const RevisarModal: React.FC<{
  incidencia: any;
  onClose: () => void;
  onDecidir: (aprobar: boolean) => Promise<void>;
}> = ({ incidencia, onClose, onDecidir }) => {
  const [decidiendo, setDecidiendo] = useState(false);
  const aprobada = incidencia.estadoJustificacion === 'APROBADA';
  const rechazada = incidencia.estadoJustificacion === 'RECHAZADA';
  const pendiente = !aprobada && !rechazada;
  const tieneDocumento = !!incidencia.documentoUrl;
  const tieneMotivo = incidencia.motivoJustificacion && incidencia.motivoJustificacion.trim() !== '';
  const apiBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');

  const decidir = async (aprobar: boolean) => {
    setDecidiendo(true);
    try { await onDecidir(aprobar); } finally { setDecidiendo(false); }
  };

  return (
    <div onClick={() => !decidiendo && onClose()} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b', fontSize: '18px' }}>
              Revisar falta
            </h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
              {incidencia.empleado?.nombre} {incidencia.empleado?.apellidos} · {toYMD(incidencia.fecha)}
            </p>
          </div>
          <button onClick={onClose} disabled={decidiendo} style={{ background: 'none', border: 'none', cursor: decidiendo ? 'not-allowed' : 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Motivo</p>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: tieneMotivo ? '#1e293b' : '#94a3b8', fontStyle: tieneMotivo ? 'normal' : 'italic' }}>
              {tieneMotivo ? incidencia.motivoJustificacion : 'Sin motivo registrado'}
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Documento adjunto</p>
            {tieneDocumento ? (
              <a href={`${apiBase}${incidencia.documentoUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', color: '#1d4ed8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
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

          {!pendiente && (
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12px', color: '#854d0e' }}>
              Esta incidencia ya fue {aprobada ? 'aprobada' : 'rechazada'}. Puedes cambiar la decisión si es necesario.
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => decidir(false)}
            disabled={decidiendo}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid #fecaca', backgroundColor: rechazada ? '#fee2e2' : 'white', color: '#b91c1c', fontWeight: '700', cursor: decidiendo ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <X size={14} /> Rechazar
          </button>
          <button
            onClick={() => decidir(true)}
            disabled={decidiendo}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: aprobada ? '#047857' : '#10b981', color: 'white', fontWeight: '800', cursor: decidiendo ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            {decidiendo ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Aprobar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlAsistencias;
