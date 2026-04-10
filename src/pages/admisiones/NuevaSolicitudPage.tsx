import React, { useState } from 'react';
import { 
  User, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Home 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIngresoStore } from '../../stores/ingresoStore';
import { NivelUrgencia, TipoAdiccion, AreaCentro } from '../../types';

const PASOS = [
  { id: 1, label: 'Solicitante', icon: Users },
  { id: 2, label: 'Paciente', icon: User },
  { id: 3, label: 'Urgencia', icon: AlertCircle },
  { id: 4, label: 'Confirmación', icon: CheckCircle },
];

const NuevaSolicitudPage: React.FC = () => {
  const navigate = useNavigate();
  const { submitSolicitud, isLoading } = useIngresoStore();
  const [pasoActual, setPasoActual] = useState(1);
  
  const [formData, setFormData] = useState({
    // Solicitante
    solicitanteNombre: '',
    solicitanteParentesco: '',
    solicitanteTelefono: '',
    solicitanteCorreo: '',
    solicitanteMunicipio: '',
    solicitanteEstado: '',
    // Paciente
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'M',
    curp: '',
    // Detalles
    tipoAdiccion: TipoAdiccion.ALCOHOL,
    urgencia: NivelUrgencia.BAJA,
    areaDeseada: AreaCentro.HOMBRES,
    motivoIngreso: '',
    observaciones: ''
  });

  const handleNext = () => setPasoActual(prev => Math.min(prev + 1, 4));
  const handleBack = () => setPasoActual(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    try {
      const result = await submitSolicitud(formData);
      alert(`Solicitud creada con éxito. Folio: ${result.folio}`);
      navigate('/admisiones/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
        {PASOS.map(paso => {
          const isActive = pasoActual === paso.id;
          const isCompleted = pasoActual > paso.id;
          return (
            <div key={paso.id} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
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
              <span style={{ marginTop: '0.75rem', fontSize: '12px', fontWeight: '800', color: isActive ? '#1e293b' : '#94a3b8', textTransform: 'uppercase' }}>
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        
        {pasoActual === 1 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#3b82f6" /> Datos del Solicitante / Familiar
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.solicitanteNombre} 
                  onChange={e => setFormData({...formData, solicitanteNombre: e.target.value})}
                  placeholder="Ej. Juan Pérez López"
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Parentesco</label>
                <select 
                  value={formData.solicitanteParentesco} 
                  onChange={e => setFormData({...formData, solicitanteParentesco: e.target.value})}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Teléfono</label>
                <input 
                  type="tel" 
                  value={formData.solicitanteTelefono} 
                  onChange={e => setFormData({...formData, solicitanteTelefono: e.target.value})}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.solicitanteCorreo} 
                  onChange={e => setFormData({...formData, solicitanteCorreo: e.target.value})}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual === 2 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="#3b82f6" /> Datos del Paciente
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Nombre(s)</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Apellido Paterno</label>
                <input type="text" value={formData.apellidoPaterno} onChange={e => setFormData({...formData, apellidoPaterno: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Apellido Materno</label>
                <input type="text" value={formData.apellidoMaterno} onChange={e => setFormData({...formData, apellidoMaterno: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>CURP</label>
                <input type="text" value={formData.curp} onChange={e => setFormData({...formData, curp: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="Opcional en crisis" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Fecha de Nacimiento</label>
                <input type="date" value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Sexo</label>
                <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {pasoActual === 3 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="#f59e0b" /> Detalles de Urgencia e Ingreso
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Nivel de Urgencia</label>
                <select value={formData.urgencia} onChange={e => setFormData({...formData, urgencia: e.target.value as NivelUrgencia})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <option value={NivelUrgencia.BAJA}>Baja</option>
                  <option value={NivelUrgencia.MEDIA}>Media</option>
                  <option value={NivelUrgencia.ALTA}>Alta</option>
                  <option value={NivelUrgencia.CRITICA}>Crítica</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Sustancia Principal</label>
                <select value={formData.tipoAdiccion} onChange={e => setFormData({...formData, tipoAdiccion: e.target.value as TipoAdiccion})} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {Object.values(TipoAdiccion).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Observaciones / Motivo de Ingreso</label>
                <textarea 
                  value={formData.motivoIngreso} 
                  onChange={e => setFormData({...formData, motivoIngreso: e.target.value})} 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '120px', resize: 'vertical' }}
                  placeholder="Describa brevemente la situación actual..."
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '2rem', borderRadius: '20px', marginBottom: '2rem' }}>
              <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#166534' }}>Verificación Final</h3>
              <p style={{ color: '#15803d' }}>Revise que los datos ingresados sean correctos antes de confirmar la solicitud.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Resumen Paciente</p>
                <p style={{ fontSize: '18px', fontWeight: '800' }}>{formData.nombre} {formData.apellidoPaterno}</p>
                <p style={{ margin: 0 }}>Urgencia: <strong>{formData.urgencia}</strong></p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Resumen Solicitante</p>
                <p style={{ fontSize: '18px', fontWeight: '800' }}>{formData.solicitanteNombre}</p>
                <p style={{ margin: 0 }}>Vínculo: <strong>{formData.solicitanteParentesco}</strong></p>
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
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.875rem 1.5rem', 
              backgroundColor: 'white', 
              color: pasoActual === 1 ? '#cbd5e1' : '#64748b', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              fontWeight: 'bold',
              cursor: pasoActual === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowLeft size={20} /> Atrás
          </button>
          
          {pasoActual < 4 ? (
            <button 
              onClick={handleNext} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.875rem 2rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)'
              }}
            >
              Continuar <ArrowRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isLoading}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.875rem 2.5rem', 
                backgroundColor: '#10b981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)'
              }}
            >
              {isLoading ? 'Enviando...' : <><Save size={20} /> Confirmar Solicitud</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaSolicitudPage;
