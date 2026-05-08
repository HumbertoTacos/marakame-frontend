import React, { useEffect, useState } from 'react';
import {
  Pill,
  Plus,
  X,
  Save,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Syringe
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { TratamientoMedico, SuministroTratamiento } from '../../types';

interface SeccionTratamientosProps {
  expedienteId: number;
}

const SeccionTratamientos: React.FC<SeccionTratamientosProps> = ({ expedienteId }) => {
  const { usuario } = useAuthStore();

  const [tratamientos, setTratamientos] = useState<TratamientoMedico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modales
  const [showModalTratamiento, setShowModalTratamiento] = useState(false);
  const [showModalSuministro, setShowModalSuministro] = useState(false);
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState<TratamientoMedico | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Formulario nuevo tratamiento
  const [nuevoTratamiento, setNuevoTratamiento] = useState({
    medicamento: '',
    dosis: '',
    frecuencia: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    indicaciones: ''
  });

  // Formulario nuevo suministro
  const [nuevoSuministro, setNuevoSuministro] = useState({
    dosisAplicada: '',
    observaciones: ''
  });

  const puedeAgregarTratamiento = usuario?.rol === 'AREA_MEDICA' || usuario?.rol === 'ADMIN_GENERAL';
  const puedeRegistrarSuministro = usuario?.rol === 'ENFERMERIA' || usuario?.rol === 'AREA_MEDICA' || usuario?.rol === 'ADMIN_GENERAL';

  const fetchTratamientos = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/clinica/expediente/${expedienteId}/tratamientos`);
      setTratamientos(res.data.data);
    } catch {
      console.error('Error cargando tratamientos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTratamientos();
  }, [expedienteId]);

  const today = new Date().toISOString().split('T')[0];

  const handleCrearTratamiento = async () => {
    if (!nuevoTratamiento.medicamento || !nuevoTratamiento.dosis || !nuevoTratamiento.frecuencia || !nuevoTratamiento.fechaInicio) {
      alert('Medicamento, dosis, frecuencia y fecha de inicio son requeridos');
      return;
    }
    if (nuevoTratamiento.fechaFin && nuevoTratamiento.fechaFin < nuevoTratamiento.fechaInicio) {
      alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post(`/clinica/expediente/${expedienteId}/tratamientos`, nuevoTratamiento);
      setShowModalTratamiento(false);
      setNuevoTratamiento({ medicamento: '', dosis: '', frecuencia: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: '', indicaciones: '' });
      fetchTratamientos();
    } catch {
      alert('Error al registrar el tratamiento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    if (!confirm('¿Marcar este tratamiento como finalizado?')) return;
    try {
      await apiClient.patch(`/clinica/tratamientos/${id}/desactivar`);
      fetchTratamientos();
    } catch {
      alert('Error al finalizar el tratamiento');
    }
  };

  const handleRegistrarSuministro = async () => {
    if (!nuevoSuministro.dosisAplicada || !tratamientoSeleccionado) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/clinica/tratamientos/${tratamientoSeleccionado.id}/suministros`, nuevoSuministro);
      setShowModalSuministro(false);
      setNuevoSuministro({ dosisAplicada: '', observaciones: '' });
      setTratamientoSeleccionado(null);
      fetchTratamientos();
    } catch {
      alert('Error al registrar el suministro');
    } finally {
      setIsSaving(false);
    }
  };

  const activos = tratamientos.filter(t => t.activo);
  const finalizados = tratamientos.filter(t => !t.activo);

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando tratamientos...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '12px', color: '#d97706' }}>
            <Pill size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Plan Farmacológico</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              Activos: {activos.length} &nbsp;·&nbsp; Finalizados: {finalizados.length}
            </p>
          </div>
        </div>
        {puedeAgregarTratamiento && (
          <button
            onClick={() => setShowModalTratamiento(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(217,119,6,0.3)' }}
          >
            <Plus size={18} /> Nuevo Tratamiento
          </button>
        )}
      </div>

      {/* Tratamientos activos */}
      {activos.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: '20px', color: '#94a3b8', marginBottom: '2rem' }}>
          No hay tratamientos activos registrados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {activos.map(t => (
            <div key={t.id} style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              {/* Card principal */}
              <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '12px', color: '#d97706' }}>
                    <Pill size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b', margin: 0 }}>{t.medicamento}</p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                      {t.dosis} &nbsp;·&nbsp; {t.frecuencia}
                    </p>
                    {t.indicaciones && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>{t.indicaciones}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={10} /> ACTIVO
                  </span>
                  {puedeRegistrarSuministro && (
                    <button
                      onClick={() => { setTratamientoSeleccionado(t); setNuevoSuministro({ dosisAplicada: t.dosis, observaciones: '' }); setShowModalSuministro(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                    >
                      <Syringe size={14} /> Registrar Dosis
                    </button>
                  )}
                  {puedeAgregarTratamiento && (
                    <button
                      onClick={() => handleDesactivar(t.id)}
                      style={{ padding: '0.6rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Finalizar
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    style={{ padding: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
                  >
                    {expandedId === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Historial de suministros expandible */}
              {expandedId === t.id && (
                <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.75rem' }}>
                    Historial de suministros ({t.suministros?.length || 0})
                  </p>
                  {!t.suministros || t.suministros.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Sin suministros registrados.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {t.suministros.map((s: SuministroTratamiento) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{s.dosisAplicada}</span>
                            {s.observaciones && <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '0.75rem' }}>{s.observaciones}</span>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{s.enfermero?.nombre} {s.enfermero?.apellidos}</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{new Date(s.fechaSuministro).toLocaleString('es-MX')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tratamientos finalizados */}
      {finalizados.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Finalizados</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {finalizados.map(t => (
              <div key={t.id} style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                <div>
                  <p style={{ fontWeight: '700', color: '#475569', margin: 0 }}>{t.medicamento}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{t.dosis} · {t.frecuencia}</p>
                </div>
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} /> FINALIZADO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Nuevo Tratamiento */}
      {showModalTratamiento && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Registrar Tratamiento</h3>
              <X size={20} cursor="pointer" onClick={() => setShowModalTratamiento(false)} />
            </div>
            <div style={modalBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Medicamento *</label>
                  <input type="text" placeholder="Ej. Diazepam" value={nuevoTratamiento.medicamento} onChange={e => setNuevoTratamiento({ ...nuevoTratamiento, medicamento: e.target.value })} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Dosis *</label>
                  <input type="text" placeholder="Ej. 10 mg" value={nuevoTratamiento.dosis} onChange={e => setNuevoTratamiento({ ...nuevoTratamiento, dosis: e.target.value })} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Frecuencia *</label>
                  <input type="text" placeholder="Ej. Cada 8 horas" value={nuevoTratamiento.frecuencia} onChange={e => setNuevoTratamiento({ ...nuevoTratamiento, frecuencia: e.target.value })} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Fecha de inicio *</label>
                  <input type="date" min={today} value={nuevoTratamiento.fechaInicio} onChange={e => setNuevoTratamiento({ ...nuevoTratamiento, fechaInicio: e.target.value })} style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Fecha de fin (opcional)</label>
                  <input type="date" min={nuevoTratamiento.fechaInicio || today} value={nuevoTratamiento.fechaFin} onChange={e => setNuevoTratamiento({ ...nuevoTratamiento, fechaFin: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Indicaciones</label>
                  <textarea rows={3} placeholder="Observaciones o indicaciones especiales..." value={nuevoTratamiento.indicaciones} onChange={e => setNuevoTratamiento({ ...nuevoTratamiento, indicaciones: e.target.value })} style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={handleCrearTratamiento} disabled={isSaving} style={btnSaveStyle}>
                {isSaving ? 'Guardando...' : <><Save size={18} /> Registrar Tratamiento</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Suministro */}
      {showModalSuministro && tratamientoSeleccionado && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Registrar Dosis Aplicada</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{tratamientoSeleccionado.medicamento}</p>
              </div>
              <X size={20} cursor="pointer" onClick={() => { setShowModalSuministro(false); setTratamientoSeleccionado(null); }} />
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Dosis aplicada *</label>
                <input type="text" placeholder="Ej. 10 mg" value={nuevoSuministro.dosisAplicada} onChange={e => setNuevoSuministro({ ...nuevoSuministro, dosisAplicada: e.target.value })} style={inputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Observaciones</label>
                <input type="text" placeholder="Opcional" value={nuevoSuministro.observaciones} onChange={e => setNuevoSuministro({ ...nuevoSuministro, observaciones: e.target.value })} style={inputStyle} />
              </div>
              <button onClick={handleRegistrarSuministro} disabled={isSaving} style={{ ...btnSaveStyle, backgroundColor: '#3b82f6', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}>
                {isSaving ? 'Registrando...' : <><Syringe size={18} /> Confirmar Suministro</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '560px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', boxShadow: '0 4px 6px -1px rgba(217,119,6,0.3)' };

export default SeccionTratamientos;
