import React, { useState, useEffect } from 'react';
import {
  User, Users, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Save,
  Home, X, BedDouble, Activity, Phone, Lock, FileText, ChevronRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIngresoStore } from '../../stores/ingresoStore';
import { NivelUrgencia, TipoAdiccion, AreaCentro, EstadoCama } from '../../types';
import apiClient from '../../services/api';
import { CustomDatePicker } from '../../components/common/DatePicker';
import { parseISO } from 'date-fns';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '1rem', borderRadius: '14px',
  border: '1px solid #e2e8f0', outline: 'none',
  backgroundColor: '#f8fafc', fontSize: '14px'
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: '800',
  color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase'
};

const NuevaSolicitudPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { submitSolicitud, isLoading, camas, fetchCamas } = useIngresoStore();

  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [listaAprobados, setListaAprobados] = useState<any[]>([]);
  const [pasoActual, setPasoActual] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [vineDeMedica, setVineDeMedica] = useState(false);

  const [formData, setFormData] = useState({
    // ── Familiar Responsable (Paso 1) ──────────────────────
    solicitanteNombre: '',
    solicitanteParentesco: '',
    solicitanteTelefono: '',
    solicitanteCelular: '',
    solicitanteCorreo: '',
    solicitanteMunicipio: '',
    solicitanteEstado: '',
    // ── Paciente (Paso 2) ───────────────────────────────────
    pacienteId: undefined as number | undefined,
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'M',
    curp: '',
    // ── Urgencia y Área (Paso 3) ────────────────────────────
    tipoAdiccion: TipoAdiccion.ALCOHOL as TipoAdiccion,
    urgencia: NivelUrgencia.BAJA as NivelUrgencia,
    areaDeseada: AreaCentro.HOMBRES as AreaCentro,
    motivoIngreso: '',
    observaciones: '',
    // ── Asignación de Cama (Paso 4) ─────────────────────────
    camaId: undefined as number | undefined,
  });

  const PASOS = [
    { id: 1, label: 'Familiar',  icon: Users },
    { id: 2, label: 'Paciente',  icon: User },
    { id: 3, label: 'Urgencia',  icon: AlertCircle },
    { id: 4, label: 'Cama',      icon: BedDouble },
    { id: 5, label: 'Confirmar', icon: CheckCircle },
  ];
  const MAX_PASO = 5;
  const PASO_INICIO_MEDICA = 3; // si viene de valoración médica, salta aquí

  // ── Carga CRM ────────────────────────────────────────────
  useEffect(() => {
    if (!pacienteSeleccionado) {
      setIsFetching(true);
      apiClient.get('/admisiones/primer-contacto?incluirInactivos=false')
        .then(res => {
          setListaAprobados(
            res.data.data.filter((p: any) => p.acuerdoSeguimiento === 'POSIBLE_INGRESO')
          );
        })
        .catch(err => console.error('Error cargando posibles ingresos:', err))
        .finally(() => setIsFetching(false));
    }
  }, [pacienteSeleccionado]);

  // ── Auto-selección desde ?pacienteId=X ──────────────────
  useEffect(() => {
    const pid = searchParams.get('pacienteId');
    if (!pid || pacienteSeleccionado) return;

    // Intentar obtener primerContacto del paciente (incluye el objeto paciente completo)
    apiClient.get(`/admisiones/paciente/${pid}/primer-contacto`)
      .then(res => handleSelectAprobado(res.data.data, true))
      .catch(() => {
        // Fallback: construir pseudo-prospecto desde datos del paciente
        apiClient.get(`/pacientes/${pid}`)
          .then(res => {
            const p = res.data.data;
            handleSelectAprobado({
              nombrePaciente: `${p.nombre} ${p.apellidoPaterno}`.trim(),
              paciente: p,
              sustancias: p.sustancias || [],
              nombreLlamada: p.familiar?.nombre || '',
              parentescoLlamada: p.familiar?.parentesco || '',
              celularLlamada: p.familiar?.celular || p.familiar?.telefono || '',
              fechaAcuerdo: null,
            }, true);
          })
          .catch(() => console.warn(`No se pudo cargar el paciente ${pid}`));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Carga de camas al llegar al paso 4 ───────────────────
  useEffect(() => {
    if (pasoActual === 4 && pacienteSeleccionado) {
      fetchCamas(formData.areaDeseada);
    }
  }, [pasoActual, pacienteSeleccionado, formData.areaDeseada, fetchCamas]);

  // ── Selección de prospecto ────────────────────────────────
  const handleSelectAprobado = (prospecto: any, desdeMedica = false) => {
    setPacienteSeleccionado(prospecto);
    setVineDeMedica(desdeMedica);
    const paciente = prospecto.paciente || {};
    setFormData(prev => ({
      ...prev,
      pacienteId: paciente.id,
      nombre: paciente.nombre || prospecto.nombrePaciente?.split(' ')[0] || '',
      apellidoPaterno: paciente.apellidoPaterno || prospecto.nombrePaciente?.split(' ').slice(1).join(' ') || '',
      apellidoMaterno: paciente.apellidoMaterno || '',
      fechaNacimiento: paciente.fechaNacimiento
        ? new Date(paciente.fechaNacimiento).toISOString().split('T')[0] : '',
      sexo: paciente.sexo || 'M',
      curp: paciente.curp || '',
      solicitanteNombre: prospecto.nombreLlamada || paciente.familiar?.nombre || '',
      solicitanteParentesco: prospecto.parentescoLlamada || paciente.familiar?.parentesco || '',
      solicitanteTelefono: prospecto.telCasaLlamada || paciente.familiar?.telefono || '',
      solicitanteCelular: prospecto.celularLlamada || paciente.familiar?.celular || '',
      solicitanteCorreo: paciente.familiar?.correo || '',
      solicitanteMunicipio: paciente.familiar?.municipio || '',
      solicitanteEstado: paciente.familiar?.estado || '',
      tipoAdiccion: (prospecto.sustancias?.[0] as TipoAdiccion) || TipoAdiccion.ALCOHOL,
      motivoIngreso: prospecto.observaciones || 'Ingreso formalizado tras valoración médica.',
      areaDeseada: paciente.areaDeseada || AreaCentro.HOMBRES,
    }));
    setPasoActual(desdeMedica ? PASO_INICIO_MEDICA : 1);
  };

  const handleCancel = () => {
    setPacienteSeleccionado(null);
    setVineDeMedica(false);
    setPasoActual(1);
    setFormData({
      solicitanteNombre: '', solicitanteParentesco: '', solicitanteTelefono: '',
      solicitanteCelular: '', solicitanteCorreo: '', solicitanteMunicipio: '',
      solicitanteEstado: '',
      pacienteId: undefined, nombre: '', apellidoPaterno: '', apellidoMaterno: '',
      fechaNacimiento: '', sexo: 'M', curp: '',
      tipoAdiccion: TipoAdiccion.ALCOHOL, urgencia: NivelUrgencia.BAJA,
      areaDeseada: AreaCentro.HOMBRES, motivoIngreso: '', observaciones: '',
      camaId: undefined,
    });
  };

  const handleNext = () => setPasoActual(p => Math.min(p + 1, MAX_PASO));
  const handleBack = () => {
    if (vineDeMedica && pasoActual === PASO_INICIO_MEDICA) return;
    setPasoActual(p => Math.max(p - 1, 1));
  };

  const canNext = () => pasoActual !== 4 || !!formData.camaId;

  const handleSubmit = async () => {
    try {
      await submitSolicitud(formData);
      alert('¡Internamiento Formalizado con Éxito! Clave Única asignada. Proceda al área de enfermería.');
      // Ofrecer continuar con estudio socioeconómico
      if (formData.pacienteId) {
        const ir = window.confirm(
          '¿Desea continuar ahora con el Estudio Socioeconómico?\n\n' +
          'Trabajo Social puede completarlo en cualquier momento desde el expediente del paciente.'
        );
        if (ir) {
          navigate(`/admisiones/estudio/${formData.pacienteId}`);
          return;
        }
      }
      navigate('/admisiones/dashboard');
    } catch (err: unknown) {
      alert('Error: ' + (err as Error).message);
    }
  };

  // Camas agrupadas por habitación
  const camasPorHabitacion = camas.reduce((acc: any, cama: any) => {
    const hab = cama.habitacion?.nombre || 'General';
    if (!acc[hab]) acc[hab] = [];
    acc[hab].push(cama);
    return acc;
  }, {});

  // ── PANTALLA SELECTOR DE PROSPECTOS ──────────────────────
  if (!pacienteSeleccionado) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
              Nueva Solicitud de Ingreso
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Seleccione un prospecto marcado como "Posible Ingreso" para formalizar su entrada.
            </p>
          </div>
          <button
            onClick={() => navigate('/admisiones/dashboard')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}
          >
            <Home size={20} /> Dashboard
          </button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1.5rem 2rem', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Prospecto (Paciente)</th>
                <th style={{ padding: '1.5rem 2rem', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Contacto / Solicitante</th>
                <th style={{ padding: '1.5rem 2rem', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Fecha Programada</th>
                <th style={{ padding: '1.5rem 2rem', fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                  <Activity style={{ margin: '0 auto 1rem' }} /> Cargando posibles ingresos...
                </td></tr>
              ) : listaAprobados.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                  No hay prospectos con estatus de Posible Ingreso.
                </td></tr>
              ) : listaAprobados.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px' }}>{p.nombrePaciente || 'Sin Nombre'}</div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', marginTop: '0.25rem' }}>
                      {p.sustancias?.length > 0 ? `Sustancias: ${p.sustancias.slice(0, 2).join(', ')}` : 'Sustancias no registradas'}
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontWeight: '800', color: '#475569', fontSize: '14px' }}>{p.nombreLlamada}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <Phone size={12} /> {p.celularLlamada || 'Sin teléfono'}
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem', color: '#475569', fontWeight: '700', fontSize: '14px' }}>
                    {p.fechaAcuerdo
                      ? new Date(p.fechaAcuerdo).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'No definida'}
                  </td>
                  <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleSelectAprobado(p, false)}
                      style={{ padding: '0.75rem 1.5rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(139,92,246,0.2)' }}
                    >
                      Iniciar Ingreso <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── WIZARD ────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleCancel} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#ef4444', cursor: 'pointer' }} title="Cancelar">
            <X size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Registro de Ingreso Formal</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Formalizando estancia de: <strong style={{ color: '#1e293b' }}>{formData.nombre} {formData.apellidoPaterno}</strong>
            </p>
          </div>
        </div>
        <div style={{
          backgroundColor: vineDeMedica ? '#f0fdf4' : '#f5f3ff',
          color: vineDeMedica ? '#15803d' : '#7c3aed',
          border: `1px solid ${vineDeMedica ? '#86efac' : '#ede9fe'}`,
          padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '900',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {vineDeMedica
            ? <><CheckCircle size={14} /> Valoración Médica Completada</>
            : <>✓ Derivado de CRM</>}
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '22px', left: '8%', right: '8%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }} />
        {PASOS.map(paso => {
          const isActive = pasoActual === paso.id;
          const isCompleted = pasoActual > paso.id;
          const isLocked = vineDeMedica && (paso.id === 1 || paso.id === 2);
          return (
            <div key={paso.id} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / PASOS.length}%` }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                backgroundColor: isLocked ? '#f1f5f9' : isCompleted ? '#10b981' : isActive ? '#3b82f6' : 'white',
                border: (isActive || isCompleted || isLocked) ? 'none' : '2px solid #e2e8f0',
                color: isLocked ? '#94a3b8' : (isActive || isCompleted) ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive ? '0 8px 15px -3px rgba(59,130,246,0.3)' : 'none',
                transition: 'all 0.3s'
              }}>
                {isLocked ? <Lock size={18} /> : isCompleted ? <CheckCircle size={20} /> : <paso.icon size={20} />}
              </div>
              <span style={{ marginTop: '0.6rem', fontSize: '10px', fontWeight: '800', color: isActive ? '#1e293b' : '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Aviso pasos bloqueados */}
      {vineDeMedica && (pasoActual === 1 || pasoActual === 2) && (
        <div style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Lock size={16} color="#92400e" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>
            Datos capturados en Primer Contacto y Valoración Médica. Modo lectura.
          </span>
        </div>
      )}

      {/* Contenido del paso */}
      <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>

        {/* ═══════════════════════════════════════
            PASO 1 — Familiar Responsable
        ════════════════════════════════════════ */}
        {pasoActual === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Familiar Responsable / Solicitante</h3>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Tutor legal o contacto principal.</p>
              </div>
              {!vineDeMedica && (
                <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>
                  ℹ Datos del CRM Precargados
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                { label: 'Nombre Completo *', key: 'solicitanteNombre', type: 'text' },
                { label: 'Celular *', key: 'solicitanteCelular', type: 'tel' },
                { label: 'Teléfono Casa', key: 'solicitanteTelefono', type: 'tel' },
                { label: 'Correo Electrónico', key: 'solicitanteCorreo', type: 'email' },
                { label: 'Municipio', key: 'solicitanteMunicipio', type: 'text' },
                { label: 'Estado', key: 'solicitanteEstado', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type={type}
                    value={(formData as any)[key]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    readOnly={vineDeMedica}
                    style={{ ...inputStyle, opacity: vineDeMedica ? 0.7 : 1 }} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Parentesco *</label>
                <select value={formData.solicitanteParentesco}
                  onChange={e => setFormData({ ...formData, solicitanteParentesco: e.target.value })}
                  disabled={vineDeMedica}
                  style={{ ...inputStyle, opacity: vineDeMedica ? 0.7 : 1 }}>
                  <option value="">Seleccione...</option>
                  {['Padre', 'Madre', 'Hijo/a', 'Hermano/a', 'Esposo/a', 'Abuelo/a', 'Tío/a', 'Otro'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PASO 2 — Identificación del Paciente
        ════════════════════════════════════════ */}
        {pasoActual === 2 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem' }}>
              Identificación del Paciente
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[
                { label: 'Nombre(s) *', key: 'nombre' },
                { label: 'Apellido Paterno *', key: 'apellidoPaterno' },
                { label: 'Apellido Materno', key: 'apellidoMaterno' },
                { label: 'CURP / ID Oficial', key: 'curp', placeholder: 'Opcional en crisis' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type="text"
                    value={(formData as any)[key]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    readOnly={vineDeMedica} placeholder={placeholder}
                    style={{ ...inputStyle, opacity: vineDeMedica ? 0.7 : 1 }} />
                </div>
              ))}
              <div>
                <CustomDatePicker
                  label="Fecha de Nacimiento"
                  selected={formData.fechaNacimiento ? parseISO(formData.fechaNacimiento) : null}
                  onChange={(date: Date | null) =>
                    setFormData({ ...formData, fechaNacimiento: date ? date.toISOString().split('T')[0] : '' })
                  }
                  disabled={vineDeMedica}
                />
              </div>
              <div>
                <label style={labelStyle}>Sexo</label>
                <select value={formData.sexo}
                  onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                  disabled={vineDeMedica}
                  style={{ ...inputStyle, opacity: vineDeMedica ? 0.7 : 1 }}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PASO 3 — Urgencia y Área
        ════════════════════════════════════════ */}
        {pasoActual === 3 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem' }}>
              Urgencia y Área de Tratamiento
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Prioridad de Ingreso</label>
                <select value={formData.urgencia}
                  onChange={e => setFormData({ ...formData, urgencia: e.target.value as NivelUrgencia })}
                  style={inputStyle}>
                  <option value={NivelUrgencia.BAJA}>Baja — Programada</option>
                  <option value={NivelUrgencia.MEDIA}>Media — Requerida</option>
                  <option value={NivelUrgencia.ALTA}>Alta — Prioritaria</option>
                  <option value={NivelUrgencia.CRITICA}>Crítica — Inmediata</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Área de Asignación</label>
                <select value={formData.areaDeseada}
                  onChange={e => setFormData({ ...formData, areaDeseada: e.target.value as AreaCentro })}
                  style={inputStyle}>
                  <option value={AreaCentro.HOMBRES}>Sección Varonil</option>
                  <option value={AreaCentro.MUJERES}>Sección Femenil</option>
                  <option value={AreaCentro.DETOX}>Unidad de Detox (Agudo)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo de Adicción Principal</label>
                <select value={formData.tipoAdiccion}
                  onChange={e => setFormData({ ...formData, tipoAdiccion: e.target.value as TipoAdiccion })}
                  style={inputStyle}>
                  <option value={TipoAdiccion.ALCOHOL}>Alcohol</option>
                  <option value={TipoAdiccion.COCAINA}>Cocaína</option>
                  <option value={TipoAdiccion.METANFETAMINA}>Metanfetamina</option>
                  <option value={TipoAdiccion.MARIHUANA}>Marihuana</option>
                  <option value={TipoAdiccion.HEROINA}>Heroína</option>
                  <option value={TipoAdiccion.BENZODIACEPINAS}>Benzodiacepinas</option>
                  <option value={TipoAdiccion.MULTIPLE}>Múltiple</option>
                  <option value={TipoAdiccion.OTRO}>Otro</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>Diagnóstico / Motivo de Internamiento</label>
                <textarea
                  value={formData.motivoIngreso}
                  onChange={e => setFormData({ ...formData, motivoIngreso: e.target.value })}
                  placeholder="Detalles sobre el consumo, crisis actual o derivación médica..."
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>Observaciones Adicionales</label>
                <textarea
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Indicaciones especiales, alergias, medicamentos actuales..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PASO 4 — Selección de Cama
        ════════════════════════════════════════ */}
        {pasoActual === 4 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem' }}>
              Formalización: Selección de Cama
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '2rem' }}>
              Área seleccionada: <strong>{formData.areaDeseada}</strong>. Solo camas disponibles.
            </p>
            {Object.keys(camasPorHabitacion).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
                No hay camas disponibles en el área seleccionada.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                {Object.keys(camasPorHabitacion).sort().map(hab => (
                  <div key={hab} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase' }}>
                      Habitación {hab}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {camasPorHabitacion[hab].map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => setFormData({ ...formData, camaId: c.id })}
                          disabled={c.estado !== EstadoCama.DISPONIBLE}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: formData.camaId === c.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            backgroundColor: formData.camaId === c.id ? '#eff6ff' : c.estado !== EstadoCama.DISPONIBLE ? '#f1f5f9' : 'white',
                            color: c.estado !== EstadoCama.DISPONIBLE ? '#cbd5e1' : '#1e293b',
                            cursor: c.estado !== EstadoCama.DISPONIBLE ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontWeight: '700', fontSize: '13px', transition: 'all 0.2s'
                          }}
                        >
                          <BedDouble size={16} color={formData.camaId === c.id ? '#3b82f6' : c.estado !== EstadoCama.DISPONIBLE ? '#cbd5e1' : '#64748b'} />
                          Cama {c.numero}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!formData.camaId && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '1rem', fontWeight: '700' }}>
                * Debe seleccionar una cama para continuar.
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            PASO 5 — Confirmación Final
        ════════════════════════════════════════ */}
        {pasoActual === MAX_PASO && (
          <div>
            <div style={{ textAlign: 'center', backgroundColor: '#f0fdf4', padding: '2rem', borderRadius: '28px', marginBottom: '2.5rem', border: '1px solid #dcfce7' }}>
              <div style={{ width: '72px', height: '72px', backgroundColor: '#10b981', color: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={40} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#166534', margin: 0 }}>Revisión Final e Internamiento</h3>
              <p style={{ color: '#15803d', fontWeight: '600', marginTop: '0.5rem' }}>
                Al confirmar, el paciente pasará a estado <strong>INTERNADO</strong> con clave única asignada.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Paciente</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{formData.nombre} {formData.apellidoPaterno}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '0.25rem' }}>CURP: {formData.curp || 'N/A'}</div>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Asignación</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>
                  Cama {camas.find(c => c.id === formData.camaId)?.numero || '—'}
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '800', marginTop: '0.25rem' }}>
                  {camas.find(c => c.id === formData.camaId)?.habitacion?.nombre || '—'} · {formData.areaDeseada}
                </div>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#fefce8', borderRadius: '20px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#a16207', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Familiar Responsable</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{formData.solicitanteNombre || 'No capturado'}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{formData.solicitanteParentesco} · {formData.solicitanteCelular || '—'}</div>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#f5f3ff', borderRadius: '20px', border: '1px solid #ede9fe' }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Urgencia</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{formData.urgencia}</div>
                <div style={{ fontSize: '13px', color: '#7c3aed', marginTop: '0.25rem' }}>{formData.tipoAdiccion}</div>
              </div>
            </div>

            {/* CTA: Estudio Socioeconómico como siguiente paso */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={20} color="#92400e" />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#78350f' }}>Próximo paso: Estudio Socioeconómico</div>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>Trabajo Social debe completar las 16 secciones del estudio institucional.</div>
                </div>
              </div>
              {formData.pacienteId && (
                <button
                  onClick={() => navigate(`/admisiones/estudio/${formData.pacienteId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Ver Estudio <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
          <button
            onClick={handleBack}
            disabled={pasoActual === 1 || (vineDeMedica && pasoActual === PASO_INICIO_MEDICA)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 2rem', backgroundColor: 'white',
              color: (pasoActual === 1 || (vineDeMedica && pasoActual === PASO_INICIO_MEDICA)) ? '#cbd5e1' : '#64748b',
              border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: '900',
              cursor: (pasoActual === 1 || (vineDeMedica && pasoActual === PASO_INICIO_MEDICA)) ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowLeft size={20} /> Atrás
          </button>

          {pasoActual < MAX_PASO ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 2.5rem',
                backgroundColor: canNext() ? '#3b82f6' : '#e2e8f0',
                color: canNext() ? 'white' : '#94a3b8',
                border: 'none', borderRadius: '16px', fontWeight: '900',
                cursor: canNext() ? 'pointer' : 'not-allowed',
                boxShadow: canNext() ? '0 10px 15px -3px rgba(59,130,246,0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Siguiente Paso <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 3rem', backgroundColor: '#10b981',
                color: 'white', border: 'none', borderRadius: '16px',
                fontWeight: '900', cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(16,185,129,0.3)'
              }}
            >
              {isLoading ? 'Procesando...' : <><Save size={20} /> Formalizar Internamiento</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaSolicitudPage;
