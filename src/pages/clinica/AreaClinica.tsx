import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Apple, BrainCircuit, Activity, Search, Save, 
  FileText, User, ChevronRight, Thermometer, Droplets, 
  Heart, Wind, Weight, ClipboardCheck
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Paciente, Expediente, NotaEvolucion, SignoVital } from '../../types';

export function AreaClinica() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'NOTAS' | 'SIGNOS' | 'NUTRICION' | 'PSICOLOGIA'>('NOTAS');
  
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('MEDICA');
  const [showAddVital, setShowAddVital] = useState(false);

  // 1. Cargar pacientes internados
  const { data: pacientes, isLoading: isLoadingPacientes } = useQuery<Paciente[]>({
    queryKey: ['pacientes_internados'],
    queryFn: () => apiClient.get('/pacientes?estado=INTERNADO').then(res => res.data.data)
  });

  // 2. Cargar expediente detallado
  const { data: expediente, isLoading: isLoadingExpediente } = useQuery<Expediente>({
    queryKey: ['expediente', pacienteId],
    queryFn: () => apiClient.get(`/expedientes/paciente/${pacienteId}`).then(res => res.data.data),
    enabled: !!pacienteId
  });

  const saveNota = useMutation({
    mutationFn: (data: Record<string, any>) => apiClient.post(`/expedientes/${expediente?.id}/notas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente', pacienteId] });
      setNuevaNota('');
    }
  });

  const saveSignos = useMutation({
    mutationFn: (data: Record<string, any>) => apiClient.post(`/expedientes/${expediente?.id}/signos`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente', pacienteId] });
      setShowAddVital(false);
    }
  });

  const handleSaveNota = () => {
    if (!nuevaNota.trim()) return;
    saveNota.mutate({
      usuarioId: usuario?.id,
      tipo: tipoNota,
      nota: nuevaNota
    });
  };

  const handleSaveSignos = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveSignos.mutate({
      usuarioId: usuario?.id,
      presionArterial: formData.get('presion'),
      temperatura: parseFloat(formData.get('temp') as string),
      frecuenciaCardiaca: parseInt(formData.get('fc') as string),
      frecuenciaRespiratoria: parseInt(formData.get('fr') as string),
      oxigenacion: parseInt(formData.get('spo2') as string),
      glucosa: parseFloat(formData.get('glucosa') as string),
      peso: parseFloat(formData.get('peso') as string),
    });
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', height: 'calc(100vh - 160px)', alignItems: 'stretch' }}>
      
      {/* SIDEBAR: Lista de Pacientes Premium */}
      <div style={{ 
        width: '350px', 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--glass-border)',
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', display: 'flex', alignItems: 'center', margin: 0 }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: '10px', marginRight: '0.75rem', display: 'flex' }}>
              <Activity size={20} />
            </div>
            Pacientes 
          </h2>
          <div style={{ marginTop: '1.5rem', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.8rem', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                backgroundColor: 'rgba(255,255,255,0.5)',
                outline: 'none',
                fontSize: '14px'
              }} 
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }} className="custom-scrollbar">
          {isLoadingPacientes ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando pacientes...</div>
          ) : (
            pacientes?.map((pac) => (
              <div 
                key={pac.id} 
                onClick={() => setPacienteId(pac.id)}
                style={{ 
                  padding: '1.25rem', 
                  marginBottom: '0.5rem',
                  cursor: 'pointer', 
                  backgroundColor: pacienteId === pac.id ? 'white' : 'transparent',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: pacienteId === pac.id ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
                  border: pacienteId === pac.id ? '1px solid var(--border)' : '1px solid transparent'
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', color: 'var(--text-h)', margin: 0, fontSize: '15px' }}>{pac.nombre} {pac.apellidoPaterno}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, marginTop: '0.25rem', fontWeight: '600' }}>
                    Cama {pac.cama?.numero || 'S/A'} • {pac.cama?.area || 'Sin Áreas'}
                  </p>
                </div>
                {pacienteId === pac.id && <ChevronRight size={18} color="var(--primary)" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: Expediente Premium */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: 'var(--radius-xl)', 
        boxShadow: 'var(--shadow-lg)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        
        {!pacienteId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '4rem', textAlign: 'center' }}>
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
              <User size={64} color="#cbd5e1" />
            </div>
            <h2 style={{ color: 'var(--text-h)', fontWeight: '800' }}>Área Clínica Central</h2>
            <p style={{ maxWidth: '400px', fontSize: '15px', lineHeight: '1.6' }}>
              Seleccione un paciente del panel lateral para gestionar su historial médico, signos vitales y evolución en tiempo real.
            </p>
          </div>
        ) : isLoadingExpediente ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p>Cargando expediente clínico...</p>
          </div>
        ) : (
          <>
            {/* Header Expediente Premium */}
            <div style={{ 
              padding: '2rem 3rem', 
              background: 'linear-gradient(to right, #f8fafc, #ffffff)', 
              borderBottom: '1px solid var(--border)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ background: 'var(--primary-bg)', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>EXP #{expediente?.id}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Ingresado el {expediente && new Date(expediente.createdAt).toLocaleDateString()}</span>
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>
                  {expediente?.paciente?.nombre} {expediente?.paciente?.apellidoPaterno} {expediente?.paciente?.apellidoMaterno}
                </h1>
                <p style={{ color: '#64748b', margin: 0, marginTop: '0.4rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ClipboardCheck size={16} /> DX: {expediente?.diagnosticoPrincipal || 'Pendiente'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Activity size={16} /> Cama: {expediente?.paciente?.cama?.numero || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Pestañas Clínicas Premium */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 3rem' }}>
              {[
                { id: 'NOTAS', label: 'Evolución', icon: FileText, color: 'var(--primary)' },
                { id: 'SIGNOS', label: 'Vitales', icon: Activity, color: '#ef4444' },
                { id: 'NUTRICION', label: 'Nutrición', icon: Apple, color: '#10b981' },
                { id: 'PSICOLOGIA', label: 'Psicología', icon: BrainCircuit, color: '#8b5cf6' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'NOTAS' | 'SIGNOS' | 'NUTRICION' | 'PSICOLOGIA')} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '1.25rem 1.5rem', 
                    border: 'none', 
                    background: 'none', 
                    borderBottom: activeTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent', 
                    fontWeight: '700', 
                    color: activeTab === tab.id ? 'var(--text-h)' : '#94a3b8', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    marginRight: '1rem'
                  }}
                >
                  <tab.icon size={18} style={{ marginRight: '0.6rem' }}/> {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido de la Pestaña */}
            <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }} className="custom-scrollbar">
              
              {/* NOTAS DE EVOLUCIÓN */}
              {activeTab === 'NOTAS' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', margin: 0 }}>Bitácora de Evolución</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        value={tipoNota} 
                        onChange={(e) => setTipoNota(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '700', outline: 'none' }}
                      >
                        <option value="MEDICA">Médica</option>
                        <option value="ENFERMERIA">Enfermería</option>
                        <option value="PSICOLOGICA">Psicología</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Editor de Nota */}
                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: '2rem', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid #e2e8f0',
                    marginBottom: '3rem'
                  }}>
                    <textarea 
                      value={nuevaNota}
                      onChange={(e) => setNuevaNota(e.target.value)}
                      placeholder="Escriba aquí la evolución del paciente..."
                      style={{ 
                        width: '100%', 
                        padding: '1.25rem', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '16px', 
                        minHeight: '150px', 
                        resize: 'vertical', 
                        marginBottom: '1.5rem',
                        fontSize: '15px',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button 
                         onClick={handleSaveNota}
                         disabled={!nuevaNota.trim() || saveNota.isPending}
                         style={{ 
                           padding: '1rem 2rem', 
                           backgroundColor: 'var(--primary)', 
                           color: 'white', 
                           border: 'none', 
                           borderRadius: '14px', 
                           cursor: 'pointer', 
                           fontWeight: '700',
                           display: 'flex',
                           alignItems: 'center',
                           marginLeft: 'auto',
                           boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                         }}
                      >
                         <Save size={18} style={{ marginRight: '0.5rem' }} /> {saveNota.isPending ? 'Guardando...' : 'Registrar Nota'}
                      </button>
                    </div>
                  </div>

                  {/* Línea de Tiempo de Notas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '1.5rem' }}>
                    <div style={{ position: 'absolute', left: '0', top: 0, bottom: 0, width: '2px', backgroundColor: '#e2e8f0' }}></div>
                    {expediente?.notasEvolucion?.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay registros en la bitácora.</p>
                    ) : (
                      expediente?.notasEvolucion?.map((nota: NotaEvolucion) => (
                        <div key={nota.id} style={{ position: 'relative', backgroundColor: 'white', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
                          <div style={{ position: 'absolute', left: '-1.5rem', top: '2rem', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: nota.tipo === 'MEDICA' ? '#3b82f6' : '#10b981', border: '3px solid white', boxShadow: '0 0 0 2px #e2e8f0' }}></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-h)' }}>{nota.usuario?.nombre} {nota.usuario?.apellidos}</span>
                              <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: '700' }}>{nota.tipo}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{nota.fecha && new Date(nota.fecha).toLocaleString()}</span>
                          </div>
                          <p style={{ color: '#334155', margin: 0, whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.6' }}>{nota.nota}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SIGNOS VITALES */}
              {activeTab === 'SIGNOS' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', margin: 0 }}>Histórico de Signos Vitales</h3>
                    <button 
                      onClick={() => setShowAddVital(true)}
                      style={{ 
                        padding: '0.75rem 1.5rem', 
                        backgroundColor: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        cursor: 'pointer', 
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      Tomar Signos
                    </button>
                  </div>

                  {showAddVital && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                      <form onSubmit={handleSaveSignos} style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: 'var(--shadow-lg)' }}>
                        <h2 style={{ marginBottom: '2rem', fontWeight: '800' }}>Nuevo Registro Clínico</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <input name="presion" placeholder="Presión (ej. 120/80)" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                          <input name="temp" type="number" step="0.1" placeholder="Temp °C" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                          <input name="fc" type="number" placeholder="FC (lpm)" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                          <input name="fr" type="number" placeholder="FR (rpm)" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                          <input name="spo2" type="number" placeholder="SpO2 (%)" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                          <input name="peso" type="number" step="0.1" placeholder="Peso (kg)" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                          <button type="button" onClick={() => setShowAddVital(false)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700' }}>Cancelar</button>
                          <button type="submit" style={{ flex: 1, padding: '1rem', borderRadius: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontWeight: '700' }}>Guardar Signos</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Listado de Signos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {expediente?.signosVitales?.map((s: SignoVital) => (
                      <div key={s.id} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', gap: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                              <Thermometer size={16} color="#ef4444" style={{ marginBottom: '0.25rem' }} />
                              <div style={{ fontSize: '14px', fontWeight: '800' }}>{s.temperatura}°C</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Temp</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <Heart size={16} color="#ef4444" style={{ marginBottom: '0.25rem' }} />
                              <div style={{ fontSize: '14px', fontWeight: '800' }}>{s.frecuenciaCardiaca}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>FC</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <Droplets size={16} color="#3b82f6" style={{ marginBottom: '0.25rem' }} />
                              <div style={{ fontSize: '14px', fontWeight: '800' }}>{s.presionArterial}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Presión</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <Wind size={16} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                              <div style={{ fontSize: '14px', fontWeight: '800' }}>{s.oxigenacion}%</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>SpO2</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <Weight size={16} color="#64748b" style={{ marginBottom: '0.25rem' }} />
                              <div style={{ fontSize: '14px', fontWeight: '800' }}>{s.peso}kg</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Peso</div>
                            </div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Por: {s.usuario?.nombre}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.fecha && new Date(s.fecha).toLocaleString()}</div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
