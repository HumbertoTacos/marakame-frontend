import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, Search, 
  FileText, ChevronRight, Stethoscope, Clock, Users, Calendar, Folder
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Paciente, Expediente } from '../../types';

// Componente para calcular edad
const calcularEdad = (fechaNacimiento: string) => {
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return edad;
};

export function AreaClinica() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Estados de navegación interna
  const [currentView, setCurrentView] = useState<'INBOX' | 'INTERNADOS'>('INBOX');
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'NOTAS' | 'SIGNOS' | 'NUTRICION' | 'PSICOLOGIA'>('NOTAS');
  
  // Estados de formulario
  const [nuevaNota, setNuevaNota] = useState('');

  // 1. Cargar prospectos (Cola de Valoración)
  const { data: prospectos, isLoading: isLoadingProspectos } = useQuery<Paciente[]>({
    queryKey: ['prospectos_pendientes'],
    queryFn: () => apiClient.get('/pacientes?estado=PROSPECTO&sinValorar=true').then(res => res.data.data)
  });

  // 2. Cargar pacientes internados (Seguimiento)
  const { data: pacientesInternados, isLoading: isLoadingInternados } = useQuery<Paciente[]>({
    queryKey: ['pacientes_internados'],
    queryFn: () => apiClient.get('/pacientes?estado=INTERNADO').then(res => res.data.data)
  });

  // 3. Cargar expediente detallado (para pacientes internados)
  const { data: expediente, isLoading: isLoadingExpediente } = useQuery<Expediente>({
    queryKey: ['expediente', pacienteId],
    queryFn: () => apiClient.get(`/expedientes/paciente/${pacienteId}`).then(res => res.data.data),
    enabled: !!pacienteId && currentView === 'INTERNADOS'
  });

  const saveNota = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post(`/expedientes/${expediente?.id}/notas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente', pacienteId] });
      setNuevaNota('');
    }
  });


  const handleSaveNota = () => {
    if (!nuevaNota.trim()) return;
    saveNota.mutate({
      usuarioId: usuario?.id,
      tipo: 'MEDICA',
      nota: nuevaNota
    });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
      
      {/* HEADER DASHBOARD CLINICO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '16px' }}>
            <Activity size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Área Clínica</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '600' }}>Panel del Médico • {usuario?.nombre}</p>
          </div>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.4rem', borderRadius: '14px', gap: '0.25rem' }}>
          <button 
            onClick={() => setCurrentView('INBOX')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '11px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: '700', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: currentView === 'INBOX' ? 'white' : 'transparent',
              color: currentView === 'INBOX' ? '#3b82f6' : '#64748b',
              boxShadow: currentView === 'INBOX' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
           <Clock size={16} /> Bandeja de Entrada ({prospectos?.length || 0})
          </button>
          <button 
            onClick={() => setCurrentView('INTERNADOS')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '11px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: '700', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: currentView === 'INTERNADOS' ? 'white' : 'transparent',
              color: currentView === 'INTERNADOS' ? '#3b82f6' : '#64748b',
              boxShadow: currentView === 'INTERNADOS' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} /> Seguimiento Internos
          </button>
        </div>
      </div>

      {/* VISTA: BANDEJA DE ENTRADA (PROSPECTOS) */}
      {currentView === 'INBOX' && (
        <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Cola de Valoración Médica</h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Prospectos registrados pendientes de evaluación clínica inicial.</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
              <thead>
                <tr style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Paciente</th>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Edad / Sexo</th>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Sustancia de Impacto</th>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Fecha Contacto</th>
                  <th style={{ textAlign: 'center', padding: '0 1.5rem', fontWeight: '800' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingProspectos ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Cargando prospectos...</td></tr>
                ) : prospectos?.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>No hay prospectos pendientes de valoración.</td></tr>
                ) : (
                  prospectos?.map((prospecto) => (
                    <tr key={prospecto.id} style={{ backgroundColor: '#f8fafc', borderRadius: '16px', transition: 'all 0.2s' }}>
                      <td style={{ padding: '1.25rem 1.5rem', borderRadius: '16px 0 0 16px' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{prospecto.nombre} {prospecto.apellidoPaterno}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Folio: PC-{prospecto.id}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: '600', color: '#475569' }}>{calcularEdad(prospecto.fechaNacimiento.toString())} años</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{prospecto.sexo === 'M' ? 'Masculino' : 'Femenina'}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prospecto.sustancias && prospecto.sustancias.length > 0 
                            ? prospecto.sustancias.join(', ')
                            : 'No especificada'}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                          <Calendar size={14} /> {prospecto.createdAt ? new Date(prospecto.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderRadius: '0 16px 16px 0' }}>
                        <button 
                          onClick={() => navigate(`/admisiones/valoracion-medica/${prospecto.id}`)}
                          style={{ 
                            padding: '0.6rem 1.25rem', 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '10px', 
                            fontWeight: '700', 
                            fontSize: '13px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto',
                            boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)'
                          }}
                        >
                          <Stethoscope size={16} /> Valorar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA: SEGUIMIENTO INTERNADOS (SIDEBAR + EXPEDIENTE) */}
      {currentView === 'INTERNADOS' && (
        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
          
          {/* SIDEBAR PACIENTES INTERNADOS */}
          <div style={{ width: '380px', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Users size={18} color="#3b82f6" /> Pacientes en Residencia
               </h3>
               <div style={{ marginTop: '1rem', position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Buscar por nombre..." style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }} className="custom-scrollbar">
              {isLoadingInternados ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando...</div>
              ) : (
                pacientesInternados?.map((pac) => (
                  <div 
                    key={pac.id} 
                    onClick={() => setPacienteId(pac.id)}
                    style={{ 
                      padding: '1.25rem', marginBottom: '0.6rem', cursor: 'pointer', 
                      backgroundColor: pacienteId === pac.id ? '#eff6ff' : 'white',
                      borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem',
                      border: pacienteId === pac.id ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: '800' }}>
                      {pac.nombre ? pac.nombre[0] : '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '14px' }}>{pac.nombre} {pac.apellidoPaterno}</p>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0, marginTop: '0.2rem' }}>
                         Cama: {pac.cama?.numero || 'N/A'} • {pac.cama?.habitacion?.area || 'General'}
                      </p>
                    </div>
                    {pacienteId === pac.id && <ChevronRight size={18} color="#3b82f6" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DETALLES DEL EXPEDIENTE (SOLO INTERNADOS) */}
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            {!pacienteId ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '3rem', textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                  <Users size={64} color="#cbd5e1" />
                </div>
                <h3 style={{ color: '#1e293b', fontWeight: '800' }}>Gestión Clínica de Internos</h3>
                <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6' }}>
                  Seleccione un paciente de la lista para ver su expediente digital, registrar notas de evolución o toma de signos vitales.
                </p>
              </div>
            ) : isLoadingExpediente ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p>Cargando información clínica...</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                      {expediente?.paciente?.nombre} {expediente?.paciente?.apellidoPaterno}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Activity size={14} /> Cama: {expediente?.paciente?.cama?.numero || 'N/A'}
                      </span>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                        ID: EXP-{expediente?.id}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/admisiones/expediente/${pacienteId}`)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      padding: '0.75rem 1.25rem', 
                      backgroundColor: 'white', 
                      color: '#10b981', 
                      border: '1.5px solid #10b981', 
                      borderRadius: '12px', 
                      fontWeight: '800', 
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <Folder size={18} /> Ver Expediente Digital
                  </button>
                </div>

                {/* Tabs Clínicos */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 2.5rem' }}>
                  {[
                    { id: 'NOTAS', label: 'Evolución', icon: FileText, color: '#3b82f6' },
                    { id: 'SIGNOS', label: 'Signos Vitales', icon: Activity, color: '#ef4444' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)} 
                      style={{ 
                        display: 'flex', alignItems: 'center', padding: '1.25rem 1rem', border: 'none', background: 'none', 
                        borderBottom: activeTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent', 
                        fontWeight: '800', color: activeTab === tab.id ? '#1e293b' : '#94a3b8', 
                        cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', marginRight: '1.5rem'
                      }}
                    >
                      <tab.icon size={16} style={{ marginRight: '0.5rem' }}/> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contenido Pestaña */}
                <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }} className="custom-scrollbar">
                  
                  {activeTab === 'NOTAS' && (
                    <div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                        <textarea 
                          value={nuevaNota}
                          onChange={(e) => setNuevaNota(e.target.value)}
                          placeholder="Registrar nueva evolución médica..."
                          style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '16px', minHeight: '120px', resize: 'vertical', fontSize: '14px', outline: 'none' }}
                        />
                        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                          <button 
                            onClick={handleSaveNota}
                            disabled={!nuevaNota.trim() || saveNota.isPending}
                            style={{ padding: '0.8rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}
                          >
                             {saveNota.isPending ? 'Guardando...' : 'Guardar Nota'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {expediente?.notasEvolucion?.map((nota: any) => (
                          <div key={nota.id} style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>{nota.usuario?.nombre} {nota.usuario?.apellidos}</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(nota.fecha).toLocaleString()}</span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{nota.nota}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'SIGNOS' && (
                     <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Módulo de toma de signos vitales (Visualización histórica).
                     </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
