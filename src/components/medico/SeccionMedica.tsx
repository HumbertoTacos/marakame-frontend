import React, { useState } from 'react';
import { Stethoscope, Pill, CalendarDays, X, Save } from 'lucide-react';
import TimelineNotas from './TimelineNotas';
import SignosVitalesTable from './SignosVitalesTable';
import SeccionTratamientos from './SeccionTratamientos';
import SeccionCitas from './SeccionCitas';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type SubTab = 'notas' | 'tratamientos' | 'citas';

interface SeccionMedicaProps {
  expediente: any;
  onRefresh: () => void;
}

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'notas',        label: 'Notas y Signos',  icon: <Stethoscope size={16} />, color: '#10b981' },
  { id: 'tratamientos', label: 'Tratamientos',    icon: <Pill size={16} />,        color: '#d97706' },
  { id: 'citas',        label: 'Agenda',          icon: <CalendarDays size={16} />, color: '#7c3aed' },
];

const SeccionMedica: React.FC<SeccionMedicaProps> = ({ expediente, onRefresh }) => {
  const { usuario } = useAuthStore();
  const puedeCapturaClinica = ['AREA_MEDICA', 'ENFERMERIA', 'ADMIN_GENERAL'].includes(usuario?.rol ?? '');
  const [subTab, setSubTab] = useState<SubTab>('notas');
  const [showModalNota, setShowModalNota] = useState(false);
  const [showModalSignos, setShowModalSignos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [nuevaNota, setNuevaNota] = useState({ tipo: 'GENERAL', nota: '' });
  const [nuevosSignos, setNuevosSignos] = useState({
    presionArterial: '',
    temperatura: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    oxigenacion: '',
    glucosa: '',
    peso: '',
    observaciones: '',
  });

  const handleSaveNota = async () => {
    if (!nuevaNota.nota.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/expedientes/${expediente.id}/notas`, nuevaNota);
      setShowModalNota(false);
      setNuevaNota({ tipo: 'GENERAL', nota: '' });
      onRefresh();
    } catch {
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
        observaciones: '',
      });
      onRefresh();
    } catch {
      alert('Error al registrar signos vitales');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Sub-navegación interna */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.75rem',
        borderBottom: '1px solid #f1f5f9', paddingBottom: '0'
      }}>
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', border: 'none', background: 'none',
              fontSize: '14px', fontWeight: '700',
              color: subTab === tab.id ? tab.color : '#94a3b8',
              borderBottom: subTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido según sub-tab */}
      {subTab === 'notas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem' }}>
            <TimelineNotas
              notas={expediente.notasEvolucion || []}
              onAddNota={puedeCapturaClinica ? () => setShowModalNota(true) : undefined}
            />
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem' }}>
            <SignosVitalesTable
              signos={expediente.signosVitales || []}
              onAddSignos={puedeCapturaClinica ? () => setShowModalSignos(true) : undefined}
            />
          </div>
        </div>
      )}

      {subTab === 'tratamientos' && (
        <SeccionTratamientos expedienteId={expediente.id} />
      )}

      {subTab === 'citas' && (
        <SeccionCitas pacienteId={expediente.paciente?.id ?? expediente.pacienteId} />
      )}

      {/* Modal: Nueva Nota */}
      {showModalNota && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={headerStyle}>
              <h3 style={{ margin: 0 }}>Nueva Nota de Evolución</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowModalNota(false)} />
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={groupStyle}>
                <label style={labelStyle}>Tipo de Nota</label>
                <select
                  value={nuevaNota.tipo}
                  onChange={e => setNuevaNota({ ...nuevaNota, tipo: e.target.value })}
                  style={inputStyle}
                >
                  <option value="GENERAL">General</option>
                  <option value="MEDICA">Médica</option>
                  <option value="PSICOLOGICA">Psicología</option>
                  <option value="NUTRICIONAL">Nutrición</option>
                  <option value="ENFERMERIA">Enfermería</option>
                </select>
              </div>
              <div style={groupStyle}>
                <label style={labelStyle}>Contenido de la Nota</label>
                <textarea
                  rows={10}
                  value={nuevaNota.nota}
                  onChange={e => setNuevaNota({ ...nuevaNota, nota: e.target.value })}
                  placeholder="Escriba los detalles de la evolución del paciente..."
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', whiteSpace: 'pre-wrap' }}
                />
              </div>
              <button onClick={handleSaveNota} disabled={isSaving} style={{ ...btnStyle, backgroundColor: '#10b981' }}>
                {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Nota Médica</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Signos */}
      {showModalSignos && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={headerStyle}>
              <h3 style={{ margin: 0 }}>Registrar Signos Vitales</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowModalSignos(false)} />
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Presión Arterial',         key: 'presionArterial',        ph: '120/80', type: 'text'   },
                  { label: 'Temperatura (°C)',           key: 'temperatura',            ph: '36.5',   type: 'number' },
                  { label: 'Frec. Cardíaca (lpm)',       key: 'frecuenciaCardiaca',     ph: '70',     type: 'number' },
                  { label: 'Frec. Respiratoria (rpm)',   key: 'frecuenciaRespiratoria', ph: '16',     type: 'number' },
                  { label: 'Oxigenación (%)',             key: 'oxigenacion',            ph: '98',     type: 'number' },
                  { label: 'Glucosa (mg/dL)',             key: 'glucosa',                ph: '90',     type: 'number' },
                  { label: 'Peso (kg)',                   key: 'peso',                   ph: '70',     type: 'number' },
                  { label: 'Observaciones',               key: 'observaciones',          ph: 'Opcional', type: 'text' },
                ].map(({ label, key, ph, type }) => (
                  <div key={key} style={groupStyle}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type={type}
                      step="0.1"
                      placeholder={ph}
                      value={(nuevosSignos as any)[key]}
                      onChange={e => setNuevosSignos({ ...nuevosSignos, [key]: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveSignos} disabled={isSaving} style={{ ...btnStyle, backgroundColor: '#10b981', marginTop: '0.5rem' }}>
                {isSaving ? 'Registrando...' : <><Save size={18} /> Guardar Registro</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const headerStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const groupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '1rem', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem' };

export default SeccionMedica;
