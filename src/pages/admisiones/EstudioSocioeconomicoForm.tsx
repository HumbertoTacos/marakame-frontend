import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import apiClient from '../../services/api';

const SECCIONES = [
  'I. Ficha de Identificación',
  'II. Motivo de Consulta',
  'III. Composición Familiar',
  'IV. Dinámica Familiar',
  'V. Ingresos Económicos Familiares',
  'VI. Egresos Económicos Familiares',
  'VII. Vivienda',
  // ... rest of the 16 sections
];

export function EstudioSocioeconomicoForm({ pacienteId }: { pacienteId: number }) {
  const [seccionActual, setSeccionActual] = useState(0);
  const [datos, setDatos] = useState<Record<string, string | number | boolean | null>>({});

  const guardarEstudio = useMutation({
    mutationFn: async (payload: Record<string, string | number | boolean | null>) => {
      return apiClient.post('/admisiones/estudio', {
        pacienteId,
        datos: payload,
        nivelSocioeconomico: 'Medio', // Calculate based on data
        puntajeCalculado: 75.5 // Calculate based on data
      });
    },
    onSuccess: () => {
      alert('Estudio Socioeconómico guardado exitosamente.');
    }
  });

  const handleSave = () => {
    guardarEstudio.mutate(datos);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDatos(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', height: '100%', alignItems: 'flex-start' }}>
      
      {/* Sidebar Integrado Premium */}
      <div style={{ 
        width: '320px', 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-lg)', 
        padding: '2rem', 
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--glass-border)',
        position: 'sticky',
        top: '0'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          paddingBottom: '0.75rem',
          color: 'var(--text-h)',
          fontWeight: '800',
          letterSpacing: '-0.5px'
        }}>
          <div style={{ background: 'var(--primary-bg)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '10px', marginRight: '0.75rem', display: 'flex' }}>
            <FileText size={20} />
          </div>
          Secciones
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {SECCIONES.map((seccion, idx) => (
            <li 
              key={idx}
              onClick={() => setSeccionActual(idx)}
              style={{
                padding: '1rem 1.25rem',
                marginBottom: '0.6rem',
                borderRadius: '16px',
                cursor: 'pointer',
                backgroundColor: seccionActual === idx ? 'var(--primary)' : 'transparent',
                color: seccionActual === idx ? '#ffffff' : '#64748b',
                fontWeight: seccionActual === idx ? '700' : '600',
                fontSize: '13px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: seccionActual === idx ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none',
                transform: seccionActual === idx ? 'translateX(5px)' : 'translateX(0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => { if (seccionActual !== idx) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'; }}
              onMouseLeave={(e) => { if (seccionActual !== idx) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {seccion}
              {seccionActual === idx && <ChevronRight size={14} />}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Form Content Area Premium */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: 'var(--radius-xl)', 
        padding: '3.5rem', 
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        minHeight: '600px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sección Actual</span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-h)', margin: '0.25rem 0 0 0', letterSpacing: '-1px' }}>{SECCIONES[seccionActual]}</h2>
          </div>
          <button 
            onClick={handleSave}
            disabled={guardarEstudio.isPending}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '1rem 2.5rem', 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '16px', 
              cursor: 'pointer', 
              fontWeight: '700',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <Save size={20} style={{ marginRight: '0.75rem' }} /> 
            {guardarEstudio.isPending ? 'Guardando...' : 'Guardar Progreso'}
          </button>
        </div>

        {/* Carga dinámica de campos según sección (Ejemplo Sección I) */}
        {seccionActual === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold' }}>Nombre del Entrevistado</label>
              <input 
                name="entrevistadoNombre" 
                value={(datos.entrevistadoNombre as string) || ''} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold' }}>Parentesco con el paciente</label>
              <select 
                name="parentesco" 
                value={(datos.parentesco as string) || ''} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              >
                <option value="">Seleccione...</option>
                <option value="MADRE">Madre</option>
                <option value="PADRE">Padre</option>
                <option value="ESPOSO_A">Esposo(a)</option>
                <option value="HIJO_A">Hijo(a)</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>
        )}

        {/* Ejemplo Sección V - Rangos Económicos como se refactorizó */}
        {seccionActual === 4 && (
          <div style={{ backgroundColor: '#fffaf0', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #ed8936' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#dd6b20' }}>
              <AlertCircle size={24} style={{ marginRight: '0.5rem' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>Sistema Modular de Combobox</h4>
            </div>
            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>Seleccione el rango de ingresos mensuales de la familia.</p>
            
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold' }}>Rango de Ingreso</label>
            <select 
              name="rangoIngreso" 
              value={(datos.rangoIngreso as string | number) || ''} 
              onChange={handleInputChange}
              style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            >
              <option value="">Seleccione rango...</option>
              <option value="1">Menos de $5,000 MXN</option>
              <option value="2">$5,001 - $10,000 MXN</option>
              <option value="3">$10,001 - $20,000 MXN</option>
              <option value="4">Más de $20,000 MXN</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
