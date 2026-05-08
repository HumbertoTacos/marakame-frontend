import React, { useState } from 'react';
import TimelineNotas from './TimelineNotas';
import SignosVitalesTable from './SignosVitalesTable';
import apiClient from '../../services/api';
import {
  X,
  Save,
  Pill
} from 'lucide-react';

interface SeccionMedicaProps {
  expediente: any; // El objeto expediente completo con notas y signos
  onRefresh: () => void;
}

const SeccionMedica: React.FC<SeccionMedicaProps> = ({ expediente, onRefresh }) => {
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
    peso: '',
    observaciones: ''
  });

  const handleSaveNota = async () => {
    if (!nuevaNota.nota.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/expedientes/${expediente.id}/notas`, nuevaNota);
      setShowModalNota(false);
      setNuevaNota({ tipo: 'GENERAL', nota: '' });
      onRefresh();
    } catch (error) {
      alert('Error al guardar la nota médica');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSignos = async () => {
    setIsSaving(true);
    try {
      await apiClient.post(`/expedientes/${expediente.id}/signos`, nuevosSignos);
      setShowModalSignos(false);
      setNuevosSignos({
        presionArterial: '',
        temperatura: '',
        frecuenciaCardiaca: '',
        frecuenciaRespiratoria: '',
        oxigenacion: '',
        glucosa: '',
        peso: '',
        observaciones: ''
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
        
        {/* Info: Tratamientos en pestaña dedicada */}
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '24px', border: '1px solid #bfdbfe', padding: '1.5rem', color: '#1e40af' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Pill size={20} color="#3b82f6" />
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Tratamientos Farmacológicos</span>
          </div>
          <p style={{ fontSize: '13px', margin: '8px 0 0', color: '#1d4ed8' }}>
            Gestiona medicamentos, dosis y registro de suministros en la pestaña <strong>Tratamientos</strong>.
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
                {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Nota Médica</>}
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
                  <label style={labelStyle}>Frec. Cardíaca (lpm)</label>
                  <input type="number" placeholder="70" value={nuevosSignos.frecuenciaCardiaca} onChange={e => setNuevosSignos({...nuevosSignos, frecuenciaCardiaca: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Frec. Respiratoria (rpm)</label>
                  <input type="number" placeholder="16" value={nuevosSignos.frecuenciaRespiratoria} onChange={e => setNuevosSignos({...nuevosSignos, frecuenciaRespiratoria: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Oxigenación (%)</label>
                  <input type="number" placeholder="98" value={nuevosSignos.oxigenacion} onChange={e => setNuevosSignos({...nuevosSignos, oxigenacion: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Glucosa (mg/dL)</label>
                  <input type="number" step="0.1" placeholder="90" value={nuevosSignos.glucosa} onChange={e => setNuevosSignos({...nuevosSignos, glucosa: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Peso (kg)</label>
                  <input type="number" step="0.1" value={nuevosSignos.peso} onChange={e => setNuevosSignos({...nuevosSignos, peso: e.target.value})} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Observaciones</label>
                  <input type="text" placeholder="Opcional" value={nuevosSignos.observaciones} onChange={e => setNuevosSignos({...nuevosSignos, observaciones: e.target.value})} style={inputStyle} />
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
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem' };

export default SeccionMedica;
