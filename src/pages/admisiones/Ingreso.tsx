import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, ChevronRight, ChevronLeft, Activity, Home } from 'lucide-react';
import apiClient from '../../services/api';

interface FormData {
  nombre: string;
  motivoIngreso: string;
  fechaCita: string;
  esApto: boolean;
  areaAsignada: string;
  habitacionAsignada: string;
  fuente?: string;
  solicitante?: string;
}

const PASOS = [
  { id: 1, titulo: 'Solicitud' },
  { id: 2, titulo: 'Cita' },
  { id: 3, titulo: 'Valoración Médica' },
  { id: 4, titulo: 'Valoración Psicológica' },
  { id: 5, titulo: 'Aptitud' },
  { id: 6, titulo: 'Estudio Socioeconómico' },
  { id: 7, titulo: 'Inventario' },
  { id: 8, titulo: 'Asignación Habitación' },
];

export function Ingreso() {
  const [pasoActual, setPasoActual] = useState(1);
  const [ingresoId, setIngresoId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    motivoIngreso: '',
    fechaCita: '',
    esApto: false,
    areaAsignada: 'HOMBRES',
    habitacionAsignada: ''
  });

  // const queryClient = useQueryClient();

  const createIngreso = useMutation({
    mutationFn: async (data: FormData) => {
      const patRes = await apiClient.post('/pacientes', { nombre: data.nombre });
      const newPatId = patRes.data.data.id;

      return apiClient.post('/admisiones/ingreso', {
        pacienteId: newPatId,
        motivoIngreso: data.motivoIngreso
      });
    },
    onSuccess: (res) => {
      setIngresoId(res.data.data.id);
      setPasoActual(2);
    }
  });

  const updateIngreso = useMutation({
    mutationFn: async (payload: { paso: number; data: FormData; finalizar?: boolean }) => {
      return apiClient.put(`/admisiones/ingreso/${ingresoId}`, {
        ...payload.data,
        pasoActual: payload.paso,
        estado: payload.finalizar ? 'COMPLETADO' : 'EN_PROCESO'
      });
    },
    onSuccess: (_, variables) => {
      if (variables.finalizar) {
        alert('Ingreso Completado Exitosamente');
        // Reset or navigate away
      } else {
        setPasoActual(variables.paso);
      }
    }
  });

  const handleNext = () => {
    if (pasoActual === 1) {
      createIngreso.mutate(formData);
    } else if (pasoActual < 8) {
      updateIngreso.mutate({ paso: pasoActual + 1, data: formData });
    } else if (pasoActual === 8) {
      updateIngreso.mutate({ paso: 8, data: formData, finalizar: true });
    }
  };

  const handleBack = () => {
    if (pasoActual > 1) setPasoActual(pasoActual - 1);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '2.5rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem 2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary), #60a5fa)', 
          padding: '0.75rem', 
          borderRadius: '12px', 
          marginRight: '1.25rem',
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
        }}>
          <Home size={28} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>Asistente de Ingreso Residencial</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '500' }}>Siga los pasos descritos en el Manual de Procedimientos (Actividades 1-14)</p>
        </div>
      </div>

      {/* Stepper Premium */}
      <div style={{ 
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '2.5rem', 
        position: 'relative' 
      }}>
        {/* Line connection */}
        <div style={{ position: 'absolute', top: '50px', left: '6%', right: '6%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
        
        {PASOS.map((paso) => {
          const isCompleted = pasoActual > paso.id;
          const isCurrent = pasoActual === paso.id;
          return (
            <div key={paso.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '12%', cursor: 'pointer' }} onClick={() => isCompleted && setPasoActual(paso.id)}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '14px', 
                backgroundColor: isCompleted ? '#10b981' : isCurrent ? 'var(--primary)' : 'white',
                color: isCompleted || isCurrent ? 'white' : '#94a3b8', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', marginBottom: '0.75rem', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isCurrent ? 'none' : '1px solid #e2e8f0',
                boxShadow: isCurrent ? '0 10px 15px -3px rgba(59, 130, 246, 0.4)' : isCompleted ? '0 10px 15px -3px rgba(16, 185, 129, 0.2)' : 'none',
                transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
              }}>
                {isCompleted ? <CheckCircle size={22} /> : paso.id}
              </div>
              <span style={{ 
                fontSize: '11px', 
                textAlign: 'center', 
                color: isCurrent ? 'var(--text-h)' : '#64748b', 
                fontWeight: isCurrent ? '800' : '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {paso.titulo}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Content Area Premium */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '3rem', 
        borderRadius: 'var(--radius-xl)', 
        boxShadow: 'var(--shadow-lg)', 
        minHeight: '500px',
        border: '1px solid var(--border)',
        position: 'relative'
      }}>
        {pasoActual === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Paso 1: Datos de Solicitud</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre del Paciente</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Motivo de Ingreso</label>
                <input 
                  type="text" 
                  value={formData.motivoIngreso} 
                  onChange={e => setFormData({...formData, motivoIngreso: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                />
              </div>
            </div>
          </div>
        )}
        
        {pasoActual === 6 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Paso 6: Estudio Socioeconómico</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold' }}>Fuente</label>
                <input 
                  type="text" 
                  name="fuente" 
                  value={formData.fuente || ''} 
                  onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold' }}>Solicitante</label>
                <input 
                  type="text" 
                  name="solicitante" 
                  value={formData.solicitante || ''} 
                  onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                />
              </div>
            </div>
          </div>
        )}

        {pasoActual > 1 && pasoActual < 8 && pasoActual !== 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#718096' }}>
            <Activity size={48} style={{ marginBottom: '1rem', color: '#cbd5e0' }} />
            <h2 style={{ fontSize: '20px' }}>Completando {PASOS[pasoActual - 1].titulo}...</h2>
            <p>Formulario dinámico conectado al backend API en desarrollo.</p>
          </div>
        )}

        {pasoActual === 8 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Paso 8: Asignación de Habitación</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Área</label>
                <select 
                  value={formData.areaAsignada} 
                  onChange={e => setFormData({...formData, areaAsignada: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <option value="HOMBRES">Hombres</option>
                  <option value="MUJERES">Mujeres</option>
                  <option value="DETOX">Desintoxicación (Detox)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Número de Cama</label>
                <input 
                  type="text" 
                  value={formData.habitacionAsignada} 
                  onChange={e => setFormData({...formData, habitacionAsignada: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                  placeholder="Ej: Cama 12"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingBottom: '3rem' }}>
        <button 
          onClick={handleBack} 
          disabled={pasoActual === 1 || createIngreso.isPending || updateIngreso.isPending}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '1rem 2rem', 
            backgroundColor: pasoActual === 1 ? 'transparent' : 'white', 
            color: pasoActual === 1 ? '#cbd5e1' : '#64748b', 
            border: `1px solid ${pasoActual === 1 ? '#e2e8f0' : '#e2e8f0'}`, 
            borderRadius: '16px', 
            cursor: pasoActual === 1 ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { if (pasoActual !== 1) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
          onMouseLeave={(e) => { if (pasoActual !== 1) e.currentTarget.style.backgroundColor = 'white'; }}
        >
          <ChevronLeft size={20} style={{ marginRight: '0.5rem' }} /> Atrás
        </button>
        <button 
          onClick={handleNext}
          disabled={createIngreso.isPending || updateIngreso.isPending}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '1rem 2.5rem', 
            backgroundColor: 'var(--primary)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '16px', 
            cursor: 'pointer', 
            fontWeight: '700',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
        >
          {pasoActual === 8 ? 'Finalizar Ingreso' : 'Continuar'} 
          {pasoActual !== 8 && <ChevronRight size={20} style={{ marginLeft: '0.5rem' }} />}
        </button>
      </div>
    </div>
  );
}
