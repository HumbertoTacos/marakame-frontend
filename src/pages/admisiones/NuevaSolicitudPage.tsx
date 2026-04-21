import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Home,
  X,
  BedDouble,
  Activity,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIngresoStore } from '../../stores/ingresoStore';
import { NivelUrgencia, TipoAdiccion, AreaCentro, EstadoCama } from '../../types';
import apiClient from '../../services/api';
import { CustomDatePicker } from '../../components/common/DatePicker';
import { parseISO } from 'date-fns';

const NuevaSolicitudPage: React.FC = () => {
  const navigate = useNavigate();
  const { submitSolicitud, isLoading, camas, fetchCamas } = useIngresoStore();
  
  // Estados de flujo
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [listaAprobados, setListaAprobados] = useState<any[]>([]);
  const [pasoActual, setPasoActual] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState({
    // Solicitante
    solicitanteNombre: '',
    solicitanteParentesco: '',
    solicitanteTelefono: '',
    solicitanteCorreo: '',
    solicitanteMunicipio: '',
    solicitanteEstado: '',
    // Paciente
    pacienteId: undefined as number | undefined,
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'M',
    curp: '',
    // Detalles
    tipoAdiccion: TipoAdiccion.ALCOHOL as TipoAdiccion,
    urgencia: NivelUrgencia.BAJA as NivelUrgencia,
    areaDeseada: AreaCentro.HOMBRES as AreaCentro,
    motivoIngreso: '',
    observaciones: '',
    // Cama
    camaId: undefined as number | undefined
  });

  const PASOS = [
    { id: 1, label: 'Solicitante', icon: Users },
    { id: 2, label: 'Paciente', icon: User },
    { id: 3, label: 'Urgencia', icon: AlertCircle },
    { id: 4, label: 'Asignación Cama', icon: BedDouble },
    { id: 5, label: 'Confirmación', icon: CheckCircle },
  ];

  const MAX_PASO = 5;

  // Cargar lista de "Posibles Ingresos" desde el CRM
  useEffect(() => {
    if (!pacienteSeleccionado) {
      setIsFetching(true);
      apiClient.get('/admisiones/primer-contacto?incluirInactivos=false')
        .then(res => {
          // Filtramos solo los que tienen el estatus de POSIBLE INGRESO
          const posiblesIngresos = res.data.data.filter((p: any) => p.acuerdoSeguimiento === 'POSIBLE_INGRESO');
          setListaAprobados(posiblesIngresos);
          setIsFetching(false);
        })
        .catch(err => {
          console.error("Error cargando posibles ingresos:", err);
          setIsFetching(false);
        });
    }
  }, [pacienteSeleccionado]);

  useEffect(() => {
    if (pasoActual === 4 && pacienteSeleccionado) {
      fetchCamas(formData.areaDeseada);
    }
  }, [pasoActual, pacienteSeleccionado, formData.areaDeseada, fetchCamas]);

  const handleNext = () => setPasoActual(prev => Math.min(prev + 1, MAX_PASO));
  const handleBack = () => setPasoActual(prev => Math.max(prev - 1, 1));

  // Adaptado para recibir un objeto "Prospecto" del CRM
  const handleSelectAprobado = (prospecto: any) => {
    setPacienteSeleccionado(prospecto);
    
    // Si ya existe un paciente ligado en la base de datos, usamos sus datos, si no, usamos los del prospecto
    const paciente = prospecto.paciente || {};
    
    setFormData({
      ...formData,
      pacienteId: paciente.id,
      nombre: paciente.nombre || prospecto.nombrePaciente?.split(' ')[0] || '',
      apellidoPaterno: paciente.apellidoPaterno || prospecto.nombrePaciente?.split(' ').slice(1).join(' ') || '',
      apellidoMaterno: paciente.apellidoMaterno || '',
      fechaNacimiento: paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toISOString().split('T')[0] : '',
      sexo: paciente.sexo || 'M',
      curp: paciente.curp || '',
      solicitanteNombre: prospecto.nombreLlamada || '',
      solicitanteParentesco: prospecto.parentescoLlamada || '',
      solicitanteTelefono: prospecto.celularLlamada || prospecto.telefonoLlamada || '',
      solicitanteCorreo: paciente.familiar?.correo || '',
      solicitanteMunicipio: paciente.familiar?.municipio || '',
      solicitanteEstado: paciente.familiar?.estado || '',
      tipoAdiccion: prospecto.sustancias?.[0] || TipoAdiccion.ALCOHOL,
      motivoIngreso: prospecto.observaciones || `Ingreso derivado de seguimiento. Acuerdo programado para el: ${prospecto.fechaAcuerdo ? new Date(prospecto.fechaAcuerdo).toLocaleDateString() : 'N/A'}`,
      areaDeseada: paciente.areaDeseada || AreaCentro.HOMBRES
    });
    setPasoActual(1);
  };

  const handleCancel = () => {
    setPacienteSeleccionado(null);
    setFormData({
      solicitanteNombre: '', solicitanteParentesco: '', solicitanteTelefono: '', solicitanteCorreo: '', solicitanteMunicipio: '', solicitanteEstado: '',
      pacienteId: undefined, nombre: '', apellidoPaterno: '', apellidoMaterno: '', fechaNacimiento: '', sexo: 'M', curp: '',
      tipoAdiccion: TipoAdiccion.ALCOHOL, urgencia: NivelUrgencia.BAJA, areaDeseada: AreaCentro.HOMBRES, motivoIngreso: '', observaciones: '', camaId: undefined
    });
    setPasoActual(1);
  };

  const handleSubmit = async () => {
    try {
      await submitSolicitud(formData);
      alert('¡Internamiento Formalizado con Éxito! Clave Única asignada. Proceda al área de enfermería.');
      navigate('/admisiones/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error: ' + error.message);
    }
  };

  // Agrupar camas por habitación
  const camasPorHabitacion = camas.reduce((acc: any, cama: any) => {
    const habNombre = cama.habitacion?.nombre || 'General';
    if (!acc[habNombre]) acc[habNombre] = [];
    acc[habNombre].push(cama);
    return acc;
  }, {});

  if (!pacienteSeleccionado) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Nueva Solicitud de Ingreso</h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Seleccione un prospecto marcado como "Posible Ingreso" para formalizar su entrada.</p>
          </div>
          <button onClick={() => navigate('/admisiones/dashboard')} style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
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
                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}><Activity className="animate-spin" style={{ margin: '0 auto 1rem' }} /> Cargando posibles ingresos...</td></tr>
              ) : listaAprobados.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No hay prospectos con estatus de Posible Ingreso.</td></tr>
              ) : (
                listaAprobados.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px' }}>{p.nombrePaciente || 'Sin Nombre'}</div>
                      <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', marginTop: '0.25rem' }}>
                        {p.sustancias?.length > 0 ? `Sustancias: ${p.sustancias.slice(0,2).join(', ')}` : 'Sustancias no registradas'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ fontWeight: '800', color: '#475569', fontSize: '14px' }}>{p.nombreLlamada}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <Phone size={12} /> {p.celularLlamada || 'Sin teléfono'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', color: '#475569', fontWeight: '700', fontSize: '14px' }}>
                      {p.fechaAcuerdo ? new Date(p.fechaAcuerdo).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No definida'}
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleSelectAprobado(p)}
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(139,92,246,0.2)' }}
                      >
                        Iniciar Ingreso <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleCancel} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#ef4444', cursor: 'pointer' }} title="Cancelar y volver">
            <X size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Registro de Ingreso Activo</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Formalizando estancia de: <strong style={{ color: '#1e293b' }}>{formData.nombre} {formData.apellidoPaterno}</strong></p>
          </div>
        </div>
        <div style={{ backgroundColor: '#f5f3ff', color: '#7c3aed', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '900', border: '1px solid #ede9fe' }}>✓ Derivado de Posible Ingreso</div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', left: '8%', right: '8%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
        {PASOS.map(paso => {
          const isActive = pasoActual === paso.id;
          const isCompleted = pasoActual > paso.id;
          return (
            <div key={paso.id} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / PASOS.length}%` }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '16px', 
                backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : 'white',
                border: isActive || isCompleted ? 'none' : '2px solid #e2e8f0',
                color: isActive || isCompleted ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive ? '0 10px 15px -3px rgba(59,130,246,0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isCompleted ? <CheckCircle size={24} /> : <paso.icon size={24} />}
              </div>
              <span style={{ marginTop: '0.75rem', fontSize: '11px', fontWeight: '800', color: isActive ? '#1e293b' : '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        
        {pasoActual === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Datos del Solicitante</h3>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Familiar responsable o tutor legal.</p>
              </div>
              <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>ℹ Datos del CRM Precargados</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.solicitanteNombre} 
                  onChange={e => setFormData({...formData, solicitanteNombre: e.target.value})}
                  placeholder="Ej. Juan Pérez López"
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Parentesco</label>
                <select 
                  value={formData.solicitanteParentesco} 
                  onChange={e => setFormData({...formData, solicitanteParentesco: e.target.value})}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none' }}
                >
                  <option value="">Seleccione...</option>
                  <option value="Padre/Madre">Padre/Madre</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Esposo/a">Esposo/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Teléfono de Contacto</label>
                <input 
                  type="tel" 
                  value={formData.solicitanteTelefono} 
                  onChange={e => setFormData({...formData, solicitanteTelefono: e.target.value})}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.solicitanteCorreo} 
                  onChange={e => setFormData({...formData, solicitanteCorreo: e.target.value})}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none' }} 
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual === 2 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem' }}>Identificación del Paciente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Nombre(s)</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Apellido Paterno</label>
                <input type="text" value={formData.apellidoPaterno} onChange={e => setFormData({...formData, apellidoPaterno: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Apellido Materno</label>
                <input type="text" value={formData.apellidoMaterno} onChange={e => setFormData({...formData, apellidoMaterno: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>CURP / ID Oficial</label>
                <input type="text" value={formData.curp} onChange={e => setFormData({...formData, curp: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Opcional en crisis" />
              </div>
              <div>
                <CustomDatePicker 
                  label="Fecha de Nacimiento" 
                  selected={formData.fechaNacimiento ? parseISO(formData.fechaNacimiento) : null} 
                  onChange={(date: Date | null) => setFormData({...formData, fechaNacimiento: date ? date.toISOString().split('T')[0] : ''})} 
                  disabled={false} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Sexo</label>
                <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {pasoActual === 3 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem' }}>Urgencia y Área de Tratamiento</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Prioridad de Ingreso</label>
                <select value={formData.urgencia} onChange={e => setFormData({...formData, urgencia: e.target.value as NivelUrgencia})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option value={NivelUrgencia.BAJA}>Baja - Programada</option>
                  <option value={NivelUrgencia.MEDIA}>Media - Requerida</option>
                  <option value={NivelUrgencia.ALTA}>Alta - Prioritaria</option>
                  <option value={NivelUrgencia.CRITICA}>Crítica - Inmediata</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Área de Asignación</label>
                <select value={formData.areaDeseada} onChange={e => setFormData({...formData, areaDeseada: e.target.value as AreaCentro})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' }}>
                  <option value={AreaCentro.HOMBRES}>Sección Varonil</option>
                  <option value={AreaCentro.MUJERES}>Sección Femenil</option>
                  <option value={AreaCentro.DETOX}>Unidad de Detox (Agudo)</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Diagnóstico / Motivo de Internamiento</label>
                <textarea 
                  value={formData.motivoIngreso} 
                  onChange={e => setFormData({...formData, motivoIngreso: e.target.value})} 
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', minHeight: '120px', resize: 'vertical', outline: 'none' }}
                  placeholder="Detalles sobre el consumo o crisis actual..."
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual === 4 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem' }}>Formalización: Selección de Cama</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
               {Object.keys(camasPorHabitacion).sort().map(hab => (
                 <div key={hab} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase' }}>Habitación {hab}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {camasPorHabitacion[hab].map((c: any) => (
                        <button 
                          key={c.id}
                          onClick={() => setFormData({...formData, camaId: c.id})}
                          disabled={c.estado !== EstadoCama.DISPONIBLE}
                          style={{ 
                            padding: '0.75rem', 
                            borderRadius: '12px', 
                            border: formData.camaId === c.id ? `2px solid #3b82f6` : '1px solid #e2e8f0', 
                            backgroundColor: formData.camaId === c.id ? '#eff6ff' : (c.estado !== EstadoCama.DISPONIBLE ? '#f1f5f9' : 'white'),
                            color: c.estado !== EstadoCama.DISPONIBLE ? '#cbd5e1' : '#1e293b',
                            cursor: c.estado !== EstadoCama.DISPONIBLE ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '700',
                            fontSize: '13px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <BedDouble size={16} color={formData.camaId === c.id ? '#3b82f6' : (c.estado !== EstadoCama.DISPONIBLE ? '#cbd5e1' : '#64748b')} />
                          Cama {c.numero}
                        </button>
                      ))}
                    </div>
                 </div>
               ))}
            </div>
            {!formData.camaId && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '1rem', fontWeight: '700' }}>* Debe seleccionar una cama para formalizar el internamiento.</p>}
          </div>
        )}

        {pasoActual === MAX_PASO && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '2.5rem', borderRadius: '28px', marginBottom: '2rem', border: '1px solid #dcfce7' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#10b981', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={48} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#166534', margin: 0 }}>Revision Final e Internamiento</h3>
              <p style={{ color: '#15803d', fontWeight: '600', marginTop: '0.5rem' }}>Al confirmar, el paciente pasará a estado INTERNADO con clave única asignada.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left' }}>
               <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Paciente</span>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{formData.nombre} {formData.apellidoPaterno}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Curp: {formData.curp || 'N/A'}</div>
               </div>
               <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase' }}>Asignación Médica</span>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Cama Seleccionada</div>
                  <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '800' }}>Habitación {camas.find(c => c.id === formData.camaId)?.habitacion?.nombre || '-'}</div>
               </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
          <button 
            onClick={handleBack} 
            disabled={pasoActual === 1}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', 
              backgroundColor: 'white', color: pasoActual === 1 ? '#cbd5e1' : '#64748b', 
              border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: '900',
              cursor: pasoActual === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowLeft size={20} /> Atrás
          </button>
          
          {pasoActual < MAX_PASO ? (
            <button 
              onClick={handleNext} 
              disabled={pasoActual === 4 && !formData.camaId}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', 
                backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '16px', 
                fontWeight: '900', cursor: (pasoActual === 4 && !formData.camaId) ? 'not-allowed' : 'pointer',
                opacity: (pasoActual === 4 && !formData.camaId) ? 0.5 : 1,
                boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)'
              }}
            >
              Siguiente Paso <ArrowRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isLoading}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 3rem', 
                backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '16px', 
                fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(16,185,129,0.3)'
              }}
            >
              {isLoading ? 'Procesando...' : <><Save size={20} /> Formalizar Ingreso</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaSolicitudPage;