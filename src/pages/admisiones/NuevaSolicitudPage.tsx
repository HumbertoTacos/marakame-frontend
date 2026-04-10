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
  UserPlus,
  Stethoscope,
  X,
  BedDouble,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIngresoStore } from '../../stores/ingresoStore';
import { NivelUrgencia, TipoAdiccion, AreaCentro, EstadoCama } from '../../types';
import apiClient from '../../services/api';

const NuevaSolicitudPage: React.FC = () => {
  const navigate = useNavigate();
  const { submitSolicitud, isLoading, camas, fetchCamas } = useIngresoStore();
  
  // Estados de flujo
  const [pasoActual, setPasoActual] = useState(1);
  const [isAprobado, setIsAprobado] = useState(false);
  const [showAprobadosModal, setShowAprobadosModal] = useState(false);
  const [pacientesAprobados, setPacientesAprobados] = useState<any[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);

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
    // Cama (Para pre-aprobados)
    camaId: undefined as number | undefined
  });

  // Definición dinámica de pasos
  const PASOS = [
    { id: 1, label: 'Solicitante', icon: Users },
    { id: 2, label: 'Paciente', icon: User },
    { id: 3, label: 'Urgencia', icon: AlertCircle },
    ...(isAprobado ? [{ id: 4, label: 'Asignación Cama', icon: BedDouble }] : []),
    { id: isAprobado ? 5 : 4, label: 'Confirmación', icon: CheckCircle },
  ];

  const MAX_PASO = isAprobado ? 5 : 4;

  useEffect(() => {
    if (showAprobadosModal) {
      apiClient.get('/pacientes/aprobados-para-ingreso').then(res => {
        setPacientesAprobados(res.data.data);
      });
    }
  }, [showAprobadosModal]);

  useEffect(() => {
    if (pasoActual === 4 && isAprobado) {
      fetchCamas(formData.areaDeseada);
    }
  }, [pasoActual, isAprobado, formData.areaDeseada, fetchCamas]);

  const handleNext = () => setPasoActual(prev => Math.min(prev + 1, MAX_PASO));
  const handleBack = () => setPasoActual(prev => Math.max(prev - 1, 1));

  const handleSelectAprobado = (paciente: any) => {
    setIsAprobado(true);
    setSelectedPacienteId(paciente.id);
    
    // Obtener datos del primer contacto (fuente primaria de familiar/solicitante)
    const pc = paciente.primerContacto?.[0] || {};
    
    setFormData({
      ...formData,
      pacienteId: paciente.id,
      nombre: paciente.nombre,
      apellidoPaterno: paciente.apellidoPaterno,
      apellidoMaterno: paciente.apellidoMaterno,
      fechaNacimiento: paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toISOString().split('T')[0] : '',
      sexo: paciente.sexo,
      curp: paciente.curp || '',
      // Mapeo EXPLÍCITO desde Primer Contacto (Requerimiento Crítico)
      solicitanteNombre: pc.solicitanteNombre || '',
      solicitanteParentesco: pc.relacionPaciente || '',
      solicitanteTelefono: pc.solicitanteTelefono || pc.solicitanteCelular || '',
      solicitanteCorreo: paciente.familiar?.correo || '',
      solicitanteMunicipio: paciente.familiar?.municipio || '',
      solicitanteEstado: paciente.familiar?.estado || '',
      // Datos clínicos del primer contacto
      tipoAdiccion: pc.sustancias?.[0] || TipoAdiccion.ALCOHOL,
      motivoIngreso: pc.observaciones || ''
    });
    setShowAprobadosModal(false);
    setPasoActual(1); // Reiniciar al inicio con datos cargados
  };

  const handleSubmit = async () => {
    try {
      const result = await submitSolicitud(formData);
      alert(isAprobado 
        ? `¡Internamiento Formalizado con Éxito! Clave Única asignada. Proceda al área de enfermería.` 
        : `Solicitud creada con éxito. Folio: ${result.folio}`
      );
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      
      {/* Selector de Aprobados Modal */}
      {showAprobadosModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
             <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b' }}>Prospectos con Valoración Aprobada</h3>
                <button onClick={() => setShowAprobadosModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
             </div>
             <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                {pacientesAprobados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No hay pacientes pendientes de formalizar ingreso.</div>
                ) : (
                  pacientesAprobados.map(p => (
                    <div key={p.id} onClick={() => handleSelectAprobado(p)} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', marginBottom: '1rem', cursor: 'pointer' }} className="hover-card">
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{p.nombre} {p.apellidoPaterno}</div>
                            <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>✓ Aprobado por Médico</div>
                          </div>
                          <ArrowRight size={20} color="#3b82f6" />
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/admisiones/dashboard')} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}>
            <Home size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Nueva Solicitud de Ingreso</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Registre los datos para iniciar el proceso administrativo.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAprobadosModal(true)}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#eff6ff', 
            color: '#3b82f6', 
            border: '2px dashed #bfdbfe', 
            borderRadius: '16px', 
            fontWeight: '900', 
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Stethoscope size={18} /> Cargar Prospecto Aprobado
        </button>
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
              {isAprobado && <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>✓ Paciente Precargado</div>}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', opacity: !isAprobado ? 0.6 : 1, pointerEvents: !isAprobado ? 'none' : 'auto' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.solicitanteNombre} 
                  onChange={e => setFormData({...formData, solicitanteNombre: e.target.value})}
                  disabled={!isAprobado}
                  placeholder={!isAprobado ? "Use el botón de arriba ↑" : "Ej. Juan Pérez López"}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Parentesco</label>
                <select 
                  value={formData.solicitanteParentesco} 
                  onChange={e => setFormData({...formData, solicitanteParentesco: e.target.value})}
                  disabled={!isAprobado}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
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
                  disabled={!isAprobado}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.solicitanteCorreo} 
                  onChange={e => setFormData({...formData, solicitanteCorreo: e.target.value})}
                  disabled={!isAprobado}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} 
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual === 2 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem' }}>Identificación del Paciente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', opacity: !isAprobado ? 0.6 : 1, pointerEvents: !isAprobado ? 'none' : 'auto' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Nombre(s)</label>
                <input type="text" value={formData.nombre} disabled={!isAprobado} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Apellido Paterno</label>
                <input type="text" value={formData.apellidoPaterno} disabled={!isAprobado} onChange={e => setFormData({...formData, apellidoPaterno: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Apellido Materno</label>
                <input type="text" value={formData.apellidoMaterno} disabled={!isAprobado} onChange={e => setFormData({...formData, apellidoMaterno: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>CURP / ID Oficial</label>
                <input type="text" value={formData.curp} disabled={!isAprobado} onChange={e => setFormData({...formData, curp: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }} placeholder="Opcional en crisis" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Fecha de Nacimiento</label>
                <input type="date" value={formData.fechaNacimiento} disabled={!isAprobado} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Sexo</label>
                <select value={formData.sexo} disabled={!isAprobado} onChange={e => setFormData({...formData, sexo: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
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
                <select value={formData.urgencia} onChange={e => setFormData({...formData, urgencia: e.target.value as NivelUrgencia})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <option value={NivelUrgencia.BAJA}>Baja - Programada</option>
                  <option value={NivelUrgencia.MEDIA}>Media - Requerida</option>
                  <option value={NivelUrgencia.ALTA}>Alta - Prioritaria</option>
                  <option value={NivelUrgencia.CRITICA}>Crítica - Inmediata</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Área de Asignación</label>
                <select value={formData.areaDeseada} onChange={e => setFormData({...formData, areaDeseada: e.target.value as AreaCentro})} style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
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
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', minHeight: '120px', resize: 'vertical' }}
                  placeholder="Detalles sobre el consumo o crisis actual..."
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual === 4 && isAprobado && (
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
               {isAprobado && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase' }}>Asignación Clínica</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Cama Seleccionada</div>
                    <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '800' }}>Habitación {camas.find(c => c.id === formData.camaId)?.habitacion?.nombre || '-'}</div>
                  </div>
               )}
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
              disabled={pasoActual === 4 && isAprobado && !formData.camaId}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', 
                backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '16px', 
                fontWeight: '900', cursor: (pasoActual === 4 && isAprobado && !formData.camaId) ? 'not-allowed' : 'pointer',
                opacity: (pasoActual === 4 && isAprobado && !formData.camaId) ? 0.5 : 1,
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
