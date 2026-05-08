import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Search,
  FileText, ChevronRight, Stethoscope, Clock, Users, Calendar, Folder, X, Save, Brain, Apple, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import SignosVitalesTable from '../../components/medico/SignosVitalesTable';
import type { Paciente, Expediente, TipoNota } from '../../types';

// ── Configuración por rol ────────────────────────────────────

type RolClinico = 'AREA_MEDICA' | 'PSICOLOGIA' | 'NUTRICION' | 'ENFERMERIA' | 'ADMIN_GENERAL';

const ROL_CONFIG: Record<RolClinico, {
  titulo: string;
  descripcion: string;
  acento: string;
  tipoNota: TipoNota;
  showInbox: boolean;
  showSignos: boolean;
  placeholder: string;
}> = {
  AREA_MEDICA:   { titulo: 'Área Médica',       descripcion: 'Panel del Médico',       acento: '#3b82f6', tipoNota: 'MEDICA',      showInbox: true,  showSignos: true,  placeholder: 'Registrar nueva nota médica de evolución...' },
  PSICOLOGIA:    { titulo: 'Área de Psicología', descripcion: 'Panel del Psicólogo',    acento: '#8b5cf6', tipoNota: 'PSICOLOGICA', showInbox: false, showSignos: false, placeholder: 'Registrar nota de evolución psicológica...' },
  NUTRICION:     { titulo: 'Área de Nutrición',  descripcion: 'Panel del Nutriólogo',   acento: '#10b981', tipoNota: 'NUTRICIONAL', showInbox: false, showSignos: false, placeholder: 'Registrar nota nutricional del paciente...' },
  ENFERMERIA:    { titulo: 'Área de Enfermería', descripcion: 'Panel de Enfermería',    acento: '#f59e0b', tipoNota: 'ENFERMERIA',  showInbox: false, showSignos: true,  placeholder: 'Registrar nota de enfermería...' },
  ADMIN_GENERAL: { titulo: 'Panel Clínico',       descripcion: 'Vista de Administrador', acento: '#64748b', tipoNota: 'GENERAL',     showInbox: true,  showSignos: true,  placeholder: 'Registrar nota de evolución general...' },
};

// ── Badge de tipo nota ───────────────────────────────────────

const NOTA_BADGE: Record<TipoNota, { bg: string; text: string }> = {
  MEDICA:      { bg: '#fee2e2', text: '#991b1b' },
  PSICOLOGICA: { bg: '#e0e7ff', text: '#3730a3' },
  NUTRICIONAL: { bg: '#dcfce7', text: '#166534' },
  ENFERMERIA:  { bg: '#fef9c3', text: '#854d0e' },
  GENERAL:     { bg: '#f1f5f9', text: '#475569' },
};

// ── Calcular edad ────────────────────────────────────────────

const calcularEdad = (fechaNacimiento: string) => {
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
  return edad;
};

// ── Modal: ver sustancias ────────────────────────────────────

const VerSustanciasModal = ({ isOpen, onClose, sustancias, nombrePaciente }: any) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '90%', maxWidth: '400px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Perfil de Sustancias</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{nombrePaciente}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: 'white', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          {sustancias?.map((s: string, i: number) => (
            <div key={i} style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '0.6rem 1rem', borderRadius: '14px', fontSize: '13px', fontWeight: '800', border: '1px solid #dbeafe' }}>{s}</div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Cerrar Vista</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════

export function AreaMedica() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const config = ROL_CONFIG[(usuario?.rol as RolClinico) ?? 'AREA_MEDICA'];

  // ── Estado de navegación ─────────────────────────────────
  const [currentView, setCurrentView] = useState<'INBOX' | 'INTERNADOS'>(config.showInbox ? 'INBOX' : 'INTERNADOS');
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'NOTAS' | 'SIGNOS'>('NOTAS');
  const [busqueda, setBusqueda] = useState('');

  // ── Estado de formularios ─────────────────────────────────
  const [nuevaNota, setNuevaNota] = useState('');
  const [showModalSignos, setShowModalSignos] = useState(false);
  const [nuevosSignos, setNuevosSignos] = useState({
    presionArterial: '', temperatura: '', frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '', oxigenacion: '', glucosa: '', peso: '', observaciones: ''
  });
  const [sustanciasModal, setSustanciasModal] = useState<{ isOpen: boolean; sustancias: string[]; nombre: string }>({
    isOpen: false, sustancias: [], nombre: ''
  });

  // ── Queries ───────────────────────────────────────────────
  const { data: prospectos, isLoading: isLoadingProspectos } = useQuery<Paciente[]>({
    queryKey: ['prospectos_pendientes'],
    queryFn: () => apiClient.get('/pacientes?estado=EN_VALORACION&sinValorar=true').then(r => r.data.data),
    enabled: config.showInbox
  });

  const { data: pacientesInternados, isLoading: isLoadingInternados } = useQuery<Paciente[]>({
    queryKey: ['pacientes_internados'],
    queryFn: () => apiClient.get('/pacientes?estado=INTERNADO').then(r => r.data.data)
  });

  const { data: expediente, isLoading: isLoadingExpediente } = useQuery<Expediente>({
    queryKey: ['expediente', pacienteId],
    queryFn: () => apiClient.get(`/expedientes/paciente/${pacienteId}`).then(r => r.data.data),
    enabled: !!pacienteId && currentView === 'INTERNADOS'
  });

  // ── Mutations ─────────────────────────────────────────────
  const saveNota = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post(`/expedientes/${expediente?.id}/notas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente', pacienteId] });
      setNuevaNota('');
    }
  });

  const saveSignos = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post(`/expedientes/${expediente?.id}/signos`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expediente', pacienteId] });
      setShowModalSignos(false);
      setNuevosSignos({ presionArterial: '', temperatura: '', frecuenciaCardiaca: '', frecuenciaRespiratoria: '', oxigenacion: '', glucosa: '', peso: '', observaciones: '' });
    }
  });

  const handleSaveNota = () => {
    if (!nuevaNota.trim()) return;
    saveNota.mutate({ tipo: config.tipoNota, nota: nuevaNota });
  };

  const handleSaveSignos = () => {
    saveSignos.mutate(nuevosSignos as Record<string, unknown>);
  };

  // ── Tabs de INTERNADOS según rol ──────────────────────────
  const tabsInternados = [
    { id: 'NOTAS', label: 'Evolución', icon: FileText, color: config.acento },
    ...(config.showSignos ? [{ id: 'SIGNOS', label: 'Signos Vitales', icon: Activity, color: '#ef4444' }] : [])
  ];

  // ── Filtro de búsqueda ────────────────────────────────────
  const pacientesFiltrados = (pacientesInternados ?? []).filter(p =>
    `${p.nombre} ${p.apellidoPaterno}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Notas filtradas por rol (primero las propias, luego resto) ──
  const notasOrdenadas = [...(expediente?.notasEvolucion ?? [])].sort((a, b) => {
    // Notas del propio tipo del rol van primero
    const aMatch = a.tipo === config.tipoNota ? 0 : 1;
    const bMatch = b.tipo === config.tipoNota ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  // ── Ícono del rol ─────────────────────────────────────────
  const RolIcon = usuario?.rol === 'PSICOLOGIA' ? Brain
    : usuario?.rol === 'NUTRICION' ? Apple
    : usuario?.rol === 'ENFERMERIA' ? Heart
    : Stethoscope;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: config.acento, color: 'white', borderRadius: '16px' }}>
            <RolIcon size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{config.titulo}</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '600' }}>{config.descripcion} • {usuario?.nombre}</p>
          </div>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.4rem', borderRadius: '14px', gap: '0.25rem' }}>
          {config.showInbox && (
            <button
              onClick={() => setCurrentView('INBOX')}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '11px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: currentView === 'INBOX' ? 'white' : 'transparent', color: currentView === 'INBOX' ? config.acento : '#64748b', boxShadow: currentView === 'INBOX' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
            >
              <Clock size={16} /> Bandeja de Entrada ({prospectos?.length || 0})
            </button>
          )}
          <button
            onClick={() => setCurrentView('INTERNADOS')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '11px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: currentView === 'INTERNADOS' ? 'white' : 'transparent', color: currentView === 'INTERNADOS' ? config.acento : '#64748b', boxShadow: currentView === 'INTERNADOS' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            <Users size={16} /> Seguimiento Internos
          </button>
        </div>
      </div>

      {/* ── VISTA: BANDEJA DE ENTRADA (solo roles con showInbox) ── */}
      {currentView === 'INBOX' && config.showInbox && (
        <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Cola de Valoración Médica</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Prospectos registrados pendientes de evaluación médica inicial.</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
              <thead>
                <tr style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Paciente</th>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Edad / Sexo</th>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Sustancia Principal</th>
                  <th style={{ textAlign: 'left', padding: '0 1.5rem', fontWeight: '800' }}>Fecha Contacto</th>
                  <th style={{ textAlign: 'center', padding: '0 1.5rem', fontWeight: '800' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingProspectos ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Cargando prospectos...</td></tr>
                ) : !prospectos?.length ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>No hay prospectos pendientes de valoración.</td></tr>
                ) : prospectos.map(prospecto => (
                  <tr key={prospecto.id} style={{ backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                    <td style={{ padding: '1.25rem 1.5rem', borderRadius: '16px 0 0 16px' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{prospecto.nombre} {prospecto.apellidoPaterno}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Folio: PC-{prospecto.id}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: '600', color: '#475569' }}>
                        {prospecto.primerContacto?.[0]?.edadPaciente || calcularEdad(prospecto.fechaNacimiento.toString())} años
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{prospecto.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {(() => {
                        const list = prospecto.primerContacto?.[0]?.sustancias || prospecto.sustancias || [];
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                            {list.slice(0, 2).map((s, i) => (
                              <span key={i} style={{ backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '4px', color: '#475569' }}>{s}</span>
                            ))}
                            {list.length > 2 && (
                              <button onClick={() => setSustanciasModal({ isOpen: true, sustancias: list, nombre: `${prospecto.nombre} ${prospecto.apellidoPaterno}` })} style={{ border: 'none', backgroundColor: 'transparent', fontSize: '11px', fontWeight: '900', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                                +{list.length - 2}
                              </button>
                            )}
                            {!list.length && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No especificada</span>}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                        <Calendar size={14} /> {prospecto.createdAt ? new Date(prospecto.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderRadius: '0 16px 16px 0' }}>
                      <button
                        onClick={() => navigate(`/admisiones/valoracion-medica/${prospecto.id}`)}
                        style={{ padding: '0.6rem 1.25rem', backgroundColor: config.acento, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', boxShadow: `0 4px 6px -1px ${config.acento}55` }}
                      >
                        <Stethoscope size={16} /> Valorar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISTA: SEGUIMIENTO INTERNADOS ─────────────────────── */}
      {currentView === 'INTERNADOS' && (
        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>

          {/* SIDEBAR */}
          <div style={{ width: '380px', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color={config.acento} /> Pacientes en Residencia
              </h3>
              <div style={{ marginTop: '1rem', position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }} className="custom-scrollbar">
              {isLoadingInternados ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando...</div>
              ) : !pacientesFiltrados.length ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '13px' }}>No hay pacientes internados.</div>
              ) : pacientesFiltrados.map(pac => (
                <div
                  key={pac.id}
                  onClick={() => { setPacienteId(pac.id); setActiveTab('NOTAS'); }}
                  style={{ padding: '1.25rem', marginBottom: '0.6rem', cursor: 'pointer', backgroundColor: pacienteId === pac.id ? '#eff6ff' : 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem', border: pacienteId === pac.id ? `1px solid ${config.acento}55` : '1px solid #f1f5f9', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.acento, fontWeight: '800', fontSize: '18px' }}>
                    {pac.nombre?.[0] ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '14px' }}>{pac.nombre} {pac.apellidoPaterno}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0, marginTop: '0.2rem' }}>
                      Cama: {pac.cama?.numero || 'N/A'} · {pac.cama?.habitacion?.area || 'General'}
                    </p>
                  </div>
                  {pacienteId === pac.id && <ChevronRight size={18} color={config.acento} />}
                </div>
              ))}
            </div>
          </div>

          {/* PANEL EXPEDIENTE */}
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            {!pacienteId ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: '3rem', textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                  <Users size={64} color="#cbd5e1" />
                </div>
                <h3 style={{ color: '#1e293b', fontWeight: '800' }}>Selecciona un paciente</h3>
                <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6' }}>
                  Selecciona un paciente de la lista para registrar notas de evolución{config.showSignos ? ', tomar signos vitales' : ''} y ver su expediente completo.
                </p>
              </div>
            ) : isLoadingExpediente ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: '#64748b' }}>Cargando información clínica...</p>
              </div>
            ) : (
              <>
                {/* Header del paciente */}
                <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                      {expediente?.paciente?.nombre} {expediente?.paciente?.apellidoPaterno}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Activity size={13} /> Cama: {expediente?.paciente?.cama?.numero || 'N/A'}
                      </span>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                        EXP-{expediente?.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/medica/expediente/${pacienteId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', backgroundColor: 'white', color: '#10b981', border: '1.5px solid #10b981', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <Folder size={18} /> Ver Expediente Completo
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 2.5rem' }}>
                  {tabsInternados.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'NOTAS' | 'SIGNOS')}
                      style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1rem', border: 'none', background: 'none', borderBottom: activeTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent', fontWeight: '800', color: activeTab === tab.id ? '#1e293b' : '#94a3b8', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', marginRight: '1.5rem' }}
                    >
                      <tab.icon size={16} style={{ marginRight: '0.5rem' }} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contenido pestaña */}
                <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }} className="custom-scrollbar">

                  {/* ── PESTAÑA NOTAS ── */}
                  {activeTab === 'NOTAS' && (
                    <div>
                      {/* Formulario nueva nota */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: `1px solid ${config.acento}33`, marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <span style={{ backgroundColor: NOTA_BADGE[config.tipoNota].bg, color: NOTA_BADGE[config.tipoNota].text, padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                            NOTA {config.tipoNota}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tu rol registra notas de tipo <strong>{config.tipoNota}</strong></span>
                        </div>
                        <textarea
                          value={nuevaNota}
                          onChange={e => setNuevaNota(e.target.value)}
                          placeholder={config.placeholder}
                          style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '16px', minHeight: '120px', resize: 'vertical', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                        />
                        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                          <button
                            onClick={handleSaveNota}
                            disabled={!nuevaNota.trim() || saveNota.isPending}
                            style={{ padding: '0.8rem 1.5rem', backgroundColor: config.acento, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', opacity: !nuevaNota.trim() ? 0.5 : 1 }}
                          >
                            {saveNota.isPending ? 'Guardando...' : 'Guardar Nota'}
                          </button>
                        </div>
                      </div>

                      {/* Lista de notas (todas las del expediente, ordenadas por rol) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!notasOrdenadas.length ? (
                          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #e2e8f0', borderRadius: '20px', color: '#94a3b8' }}>
                            Sin notas de evolución registradas.
                          </div>
                        ) : notasOrdenadas.map((nota: any) => (
                          <div key={nota.id} style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '20px', border: `1px solid ${nota.tipo === config.tipoNota ? config.acento + '44' : '#f1f5f9'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ backgroundColor: NOTA_BADGE[nota.tipo as TipoNota]?.bg ?? '#f1f5f9', color: NOTA_BADGE[nota.tipo as TipoNota]?.text ?? '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                                  {nota.tipo}
                                </span>
                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{nota.usuario?.nombre} {nota.usuario?.apellidos}</span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(nota.fecha).toLocaleString('es-MX')}</span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{nota.nota}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── PESTAÑA SIGNOS ── */}
                  {activeTab === 'SIGNOS' && config.showSignos && (
                    <SignosVitalesTable
                      signos={expediente?.signosVitales || []}
                      onAddSignos={() => setShowModalSignos(true)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Registrar Signos ──────────────────────────── */}
      {showModalSignos && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '90%', maxWidth: '560px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: '800' }}>Registrar Signos Vitales</h3>
              <X size={20} cursor="pointer" onClick={() => setShowModalSignos(false)} />
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {([
                  { label: 'Presión Arterial', key: 'presionArterial', placeholder: '120/80', type: 'text' },
                  { label: 'Temperatura (°C)', key: 'temperatura', placeholder: '36.5', type: 'number' },
                  { label: 'Frec. Cardíaca (lpm)', key: 'frecuenciaCardiaca', placeholder: '72', type: 'number' },
                  { label: 'Frec. Respiratoria (rpm)', key: 'frecuenciaRespiratoria', placeholder: '16', type: 'number' },
                  { label: 'Oxigenación (%)', key: 'oxigenacion', placeholder: '98', type: 'number' },
                  { label: 'Glucosa (mg/dL)', key: 'glucosa', placeholder: '90', type: 'number' },
                  { label: 'Peso (kg)', key: 'peso', placeholder: '70', type: 'number' },
                  { label: 'Observaciones', key: 'observaciones', placeholder: 'Opcional', type: 'text' },
                ] as const).map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '0.4rem' }}>{label}</label>
                    <input type={type} step={type === 'number' ? '0.1' : undefined} placeholder={placeholder} value={nuevosSignos[key]} onChange={e => setNuevosSignos({ ...nuevosSignos, [key]: e.target.value })} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveSignos} disabled={saveSignos.isPending} style={{ width: '100%', marginTop: '1.25rem', padding: '1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)' }}>
                <Save size={18} /> {saveSignos.isPending ? 'Guardando...' : 'Guardar Signos Vitales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Sustancias ─────────────────────────────────── */}
      <VerSustanciasModal
        isOpen={sustanciasModal.isOpen}
        onClose={() => setSustanciasModal({ ...sustanciasModal, isOpen: false })}
        sustancias={sustanciasModal.sustancias}
        nombrePaciente={sustanciasModal.nombre}
      />
    </div>
  );
}
