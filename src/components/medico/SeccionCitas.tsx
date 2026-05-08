import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  X,
  Save,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  ChevronDown
} from 'lucide-react';
import apiClient from '../../services/api';
import type { CitaAgenda, EstadoCita } from '../../types';

interface SeccionCitasProps {
  pacienteId: number;
}

const ESTADO_CONFIG: Record<EstadoCita, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PROGRAMADA:  { label: 'Programada',  color: '#1d4ed8', bg: '#dbeafe', icon: <Clock size={10} /> },
  COMPLETADA:  { label: 'Completada',  color: '#166534', bg: '#dcfce7', icon: <CheckCircle size={10} /> },
  CANCELADA:   { label: 'Cancelada',   color: '#991b1b', bg: '#fee2e2', icon: <XCircle size={10} /> },
  NO_ASISTIO:  { label: 'No asistió',  color: '#92400e', bg: '#fef3c7', icon: <AlertTriangle size={10} /> },
};

const SeccionCitas: React.FC<SeccionCitasProps> = ({ pacienteId }) => {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // mínimo: 1 minuto en el futuro, en formato datetime-local
  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  // Modales
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [showModalEstado, setShowModalEstado] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaAgenda | null>(null);

  // Formulario nueva cita
  const [nuevaCita, setNuevaCita] = useState({
    fechaHora: '',
    motivo: '',
    observaciones: ''
  });

  // Formulario actualizar estado
  const [actualizacion, setActualizacion] = useState<{ estado: EstadoCita; observaciones: string }>({
    estado: 'COMPLETADA',
    observaciones: ''
  });

  const fetchCitas = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/clinica/paciente/${pacienteId}/citas`);
      setCitas(res.data.data);
    } catch {
      console.error('Error cargando citas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [pacienteId]);

  const handleCrearCita = async () => {
    if (!nuevaCita.fechaHora || !nuevaCita.motivo.trim()) {
      alert('La fecha/hora y el motivo son requeridos');
      return;
    }
    if (new Date(nuevaCita.fechaHora) <= new Date()) {
      alert('La fecha y hora de la cita debe ser en el futuro.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post('/clinica/citas', { ...nuevaCita, pacienteId });
      setShowModalNueva(false);
      setNuevaCita({ fechaHora: '', motivo: '', observaciones: '' });
      fetchCitas();
    } catch {
      alert('Error al programar la cita');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActualizarEstado = async () => {
    if (!citaSeleccionada) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/clinica/citas/${citaSeleccionada.id}`, actualizacion);
      setShowModalEstado(false);
      setCitaSeleccionada(null);
      fetchCitas();
    } catch {
      alert('Error al actualizar el estado de la cita');
    } finally {
      setIsSaving(false);
    }
  };

  const abrirModalEstado = (cita: CitaAgenda) => {
    setCitaSeleccionada(cita);
    setActualizacion({ estado: cita.estado, observaciones: cita.observaciones || '' });
    setShowModalEstado(true);
  };

  const proximas = citas.filter(c => c.estado === 'PROGRAMADA');
  const historico = citas.filter(c => c.estado !== 'PROGRAMADA');

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando agenda...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ede9fe', padding: '10px', borderRadius: '12px', color: '#7c3aed' }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Agenda de Citas</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              Próximas: {proximas.length} &nbsp;·&nbsp; Historial: {historico.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModalNueva(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(124,58,237,0.3)' }}
        >
          <Plus size={18} /> Nueva Cita
        </button>
      </div>

      {/* Citas próximas */}
      <p style={{ fontSize: '12px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
        Próximas
      </p>
      {proximas.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: '20px', color: '#94a3b8', marginBottom: '2rem' }}>
          No hay citas programadas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {proximas.map(c => (
            <CitaCard key={c.id} cita={c} onActualizar={abrirModalEstado} />
          ))}
        </div>
      )}

      {/* Historial */}
      {historico.length > 0 && (
        <>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Historial
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {historico.map(c => (
              <CitaCard key={c.id} cita={c} onActualizar={abrirModalEstado} dimmed />
            ))}
          </div>
        </>
      )}

      {/* Modal: Nueva Cita */}
      {showModalNueva && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Programar Cita</h3>
              <X size={20} cursor="pointer" onClick={() => setShowModalNueva(false)} />
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Fecha y hora *</label>
                <input
                  type="datetime-local"
                  value={nuevaCita.fechaHora}
                  min={minDatetime}
                  onChange={e => setNuevaCita({ ...nuevaCita, fechaHora: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Motivo *</label>
                <input
                  type="text"
                  placeholder="Ej. Consulta de seguimiento psicológico"
                  value={nuevaCita.motivo}
                  onChange={e => setNuevaCita({ ...nuevaCita, motivo: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Observaciones (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Notas adicionales sobre la cita..."
                  value={nuevaCita.observaciones}
                  onChange={e => setNuevaCita({ ...nuevaCita, observaciones: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <button onClick={handleCrearCita} disabled={isSaving} style={btnSaveStyle}>
                {isSaving ? 'Guardando...' : <><Save size={18} /> Programar Cita</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Actualizar Estado */}
      {showModalEstado && citaSeleccionada && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Actualizar Cita</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{citaSeleccionada.motivo}</p>
              </div>
              <X size={20} cursor="pointer" onClick={() => { setShowModalEstado(false); setCitaSeleccionada(null); }} />
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Nuevo estado</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {(Object.keys(ESTADO_CONFIG) as EstadoCita[]).map(estado => {
                    const cfg = ESTADO_CONFIG[estado];
                    const selected = actualizacion.estado === estado;
                    return (
                      <button
                        key={estado}
                        onClick={() => setActualizacion({ ...actualizacion, estado })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer',
                          border: selected ? `2px solid ${cfg.color}` : '2px solid #e2e8f0',
                          backgroundColor: selected ? cfg.bg : 'white',
                          color: selected ? cfg.color : '#64748b',
                          fontWeight: selected ? '800' : '600',
                          fontSize: '13px', transition: 'all 0.15s ease'
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Observaciones</label>
                <textarea
                  rows={3}
                  placeholder="Notas sobre el resultado de la cita..."
                  value={actualizacion.observaciones}
                  onChange={e => setActualizacion({ ...actualizacion, observaciones: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <button onClick={handleActualizarEstado} disabled={isSaving} style={{ ...btnSaveStyle, backgroundColor: '#7c3aed', boxShadow: '0 4px 6px -1px rgba(124,58,237,0.3)' }}>
                {isSaving ? 'Guardando...' : <><CheckCircle size={18} /> Actualizar Estado</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-componente de tarjeta de cita
interface CitaCardProps {
  cita: CitaAgenda;
  onActualizar: (c: CitaAgenda) => void;
  dimmed?: boolean;
}

const CitaCard: React.FC<CitaCardProps> = ({ cita, onActualizar, dimmed }) => {
  const cfg = ESTADO_CONFIG[cita.estado];
  const fecha = new Date(cita.fechaHora);

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '20px',
      border: '1px solid #e2e8f0', padding: '1.5rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      opacity: dimmed ? 0.65 : 1
    }}>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        {/* Bloque de fecha */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '1rem 1.25rem', textAlign: 'center', minWidth: '64px', border: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0, lineHeight: 1 }}>{fecha.getDate()}</p>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', margin: '4px 0 0', textTransform: 'uppercase' }}>
            {fecha.toLocaleString('es-MX', { month: 'short' })}
          </p>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', margin: '2px 0 0' }}>
            {fecha.toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Detalle */}
        <div>
          <p style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b', margin: 0 }}>{cita.motivo}</p>
          {cita.especialista && (
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> {cita.especialista.nombre} {cita.especialista.apellidos}
            </p>
          )}
          {cita.observaciones && (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>{cita.observaciones}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span style={{
          backgroundColor: cfg.bg, color: cfg.color,
          padding: '4px 10px', borderRadius: '8px',
          fontSize: '11px', fontWeight: '800',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {cfg.icon} {cfg.label.toUpperCase()}
        </span>
        <button
          onClick={() => onActualizar(cita)}
          title="Actualizar estado"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: '10px',
            fontSize: '12px', fontWeight: '700', color: '#64748b', cursor: 'pointer'
          }}
        >
          <ChevronDown size={14} /> Actualizar
        </button>
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', boxShadow: '0 4px 6px -1px rgba(124,58,237,0.3)' };

export default SeccionCitas;
