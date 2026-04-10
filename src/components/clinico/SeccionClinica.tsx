import React, { useState } from 'react';
import TimelineNotas from './TimelineNotas';
import SignosVitalesTable from './SignosVitalesTable';
import apiClient from '../../services/api';
import { 
  X, 
  Save, 
  AlertCircle 
} from 'lucide-react';

interface SeccionClinicaProps {
  expediente: any; // El objeto expediente completo con notas y signos
  onRefresh: () => void;
}

const SeccionClinica: React.FC<SeccionClinicaProps> = ({ expediente, onRefresh }) => {
  const [showModalNota, setShowModalNota] = useState(false);
  const [showModalSignos, setShowModalSignos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de formularios
  const [nuevaNota, setNuevaNota] = useState({ tipo: 'GENERAL', nota: '' });
  const [nuevosSignos, setNuevosSignos] = useState({
    presionArterial: '',
    temperatura: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    oxigenacion: '',
    glucosa: '',
    peso: ''
  });

  const handleSaveNota = async () => {
    if (!nuevaNota.nota.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/expedientes/${expediente.id}/notas`, {
        ...nuevaNota,
        usuarioId: 1 // TODO: Obtener del AuthContext real
      });
      setShowModalNota(false);
      setNuevaNota({ tipo: 'GENERAL', nota: '' });
      onRefresh();
    } catch (error) {
      alert('Error al guardar la nota clínica');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSignos = async () => {
    setIsSaving(true);
    try {
      const payload: any = { ...nuevosSignos, usuarioId: 1 };
      // Conversión de tipos si es necesario
      if (payload.temperatura) payload.temperatura = parseFloat(payload.temperatura);
      if (payload.frecuenciaCardiaca) payload.frecuenciaCardiaca = parseInt(payload.frecuenciaCardiaca);
      if (payload.oxigenacion) payload.oxigenacion = parseInt(payload.oxigenacion);
      if (payload.peso) payload.peso = parseFloat(payload.peso);

      await apiClient.post(`/expedientes/${expediente.id}/signos`, payload);
      setShowModalSignos(false);
      setNuevosSignos({
        presionArterial: '',
        temperatura: '',
        frecuenciaCardiaca: '',
        frecuenciaRespiratoria: '',
        oxigenacion: '',
        glucosa: '',
        peso: ''
      });
      onRefresh();
    } catch (error) {
      alert('Error al registrar signos vitales');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Columna Izquierda: Línea de Tiempo de Notas */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem' }}>
        <TimelineNotas 
          notas={expediente.notasEvolucion || []} 
          onAddNota={() => setShowModalNota(true)} 
        />
      </div>

      {/* Columna Derecha: Signos Vitales y Alertas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          <SignosVitalesTable 
            signos={expediente.signosVitales || []} 
            onAddSignos={() => setShowModalSignos(true)} 
          />
        </div>
        
        {/* Placeholder para futuras herramientas */}
        <div style={{ backgroundColor: '#fff7ed', borderRadius: '24px', border: '1px solid #ffedd5', padding: '1.5rem', color: '#9a3412' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Próximamente: Histórico de Tratamientos</span>
          </div>
          <p style={{ fontSize: '13px', margin: '8px 0 0', color: '#c2410c' }}>
            Podrás visualizar la adherencia farmacológica y planes médicos aquí.
          </p>
        </div>
      </div>

      {/* Modal Nueva Nota */}
      {showModalNota && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0 }}>Nueva Nota de Evolución</h3>
              <X cursor="pointer" onClick={() => setShowModalNota(false)} />
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Tipo de Nota</label>
                <select 
                  value={nuevaNota.tipo}
                  onChange={e => setNuevaNota({...nuevaNota, tipo: e.target.value})}
                  style={inputStyle}
                >
                  <option value="GENERAL">General</option>
                  <option value="MEDICA">Médica</option>
                  <option value="PSICOLOGICA">Psicología</option>
                  <option value="NUTRICIONAL">Nutrición</option>
                  <option value="ENFERMERIA">Enfermería</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Contenido de la Nota</label>
                <textarea 
                  rows={10}
                  value={nuevaNota.nota}
                  onChange={e => setNuevaNota({...nuevaNota, nota: e.target.value})}
                  placeholder="Escriba los detalles de la evolución del paciente..."
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', whiteSpace: 'pre-wrap' }}
                />
              </div>
              <button onClick={handleSaveNota} disabled={isSaving} style={btnSaveStyle}>
                {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Nota Clinica</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Signos */}
      {showModalSignos && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0 }}>Registrar Signos Vitales</h3>
              <X cursor="pointer" onClick={() => setShowModalSignos(false)} />
            </div>
            <div style={modalBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Presión Arterial</label>
                  <input type="text" placeholder="120/80" value={nuevosSignos.presionArterial} onChange={e => setNuevosSignos({...nuevosSignos, presionArterial: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Temperatura (°C)</label>
                  <input type="number" step="0.1" placeholder="36.5" value={nuevosSignos.temperatura} onChange={e => setNuevosSignos({...nuevosSignos, temperatura: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Frec. Cardíaca</label>
                  <input type="number" placeholder="70" value={nuevosSignos.frecuenciaCardiaca} onChange={e => setNuevosSignos({...nuevosSignos, frecuenciaCardiaca: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Oxigenación (%)</label>
                  <input type="number" placeholder="98" value={nuevosSignos.oxigenacion} onChange={e => setNuevosSignos({...nuevosSignos, oxigenacion: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Glucosa (opcional)</label>
                  <input type="text" value={nuevosSignos.glucosa} onChange={e => setNuevosSignos({...nuevosSignos, glucosa: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Peso (kg)</label>
                  <input type="number" step="0.1" value={nuevosSignos.peso} onChange={e => setNuevosSignos({...nuevosSignos, peso: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <button 
                onClick={handleSaveSignos} 
                disabled={isSaving}
                style={{ ...btnSaveStyle, backgroundColor: '#10b981', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)' }}
              >
                {isSaving ? 'Registrando...' : <><Save size={18} /> Guardar Registro</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos rápidos (pueden venir de un sistema de diseño real)
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem' };

export default SeccionClinica;
