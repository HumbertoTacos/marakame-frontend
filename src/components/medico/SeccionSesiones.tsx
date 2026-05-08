import React, { useEffect, useState } from 'react';
import {
  Brain,
  MessageCircle,
  Users,
  TrendingUp,
  Plus,
  X,
  Save,
  User,
  Calendar
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type TipoSesion = 'PSICOLOGIA' | 'CONSEJERIA' | 'FAMILIA' | 'SEGUIMIENTO';

interface SeccionSesionesProps {
  expedienteId: number;
  tipo: TipoSesion;
}

interface Sesion {
  id: number;
  expedienteId: number;
  tipo: TipoSesion;
  nota: string;
  fecha: string;
  profesionalNombre?: string;
  profesional?: {
    id: number;
    nombre: string;
    apellidos: string;
  };
  createdAt: string;
}

const TIPO_CONFIG: Record<TipoSesion, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  shadow: string;
  labelNota: string;
}> = {
  PSICOLOGIA: {
    label: 'Psicología',
    icon: Brain,
    color: '#7c3aed',
    bg: '#ede9fe',
    shadow: 'rgba(124,58,237,0.3)',
    labelNota: 'Nota Psicológica'
  },
  CONSEJERIA: {
    label: 'Consejería',
    icon: MessageCircle,
    color: '#ec4899',
    bg: '#fce7f3',
    shadow: 'rgba(236,72,153,0.3)',
    labelNota: 'Nota de Consejería'
  },
  FAMILIA: {
    label: 'Familia',
    icon: Users,
    color: '#f97316',
    bg: '#fff7ed',
    shadow: 'rgba(249,115,22,0.3)',
    labelNota: 'Nota de Sesión Familiar'
  },
  SEGUIMIENTO: {
    label: 'Seguimiento',
    icon: TrendingUp,
    color: '#6366f1',
    bg: '#eef2ff',
    shadow: 'rgba(99,102,241,0.3)',
    labelNota: 'Nota de Seguimiento'
  }
};

const SeccionSesiones: React.FC<SeccionSesionesProps> = ({ expedienteId, tipo }) => {
  const { usuario } = useAuthStore();
  const cfg = TIPO_CONFIG[tipo];
  const IconComp = cfg.icon;

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    nota: '',
    fecha: new Date().toISOString().split('T')[0],
    profesionalNombre: ''
  });

  const puedeRegistrar = ['PSICOLOGIA', 'AREA_MEDICA', 'ADMIN_GENERAL', 'JEFE_MEDICO'].includes(usuario?.rol ?? '');

  const fetchSesiones = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/clinica/expediente/${expedienteId}/sesiones?tipo=${tipo}`);
      setSesiones(res.data.data ?? []);
    } catch {
      console.error('Error cargando sesiones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSesiones();
  }, [expedienteId, tipo]);

  const handleGuardar = async () => {
    if (!form.nota.trim()) {
      alert('La nota de sesión es requerida');
      return;
    }
    if (!form.fecha) {
      alert('La fecha es requerida');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post(`/clinica/expediente/${expedienteId}/sesiones`, { ...form, tipo });
      setShowModal(false);
      setForm({ nota: '', fecha: new Date().toISOString().split('T')[0], profesionalNombre: '' });
      fetchSesiones();
    } catch {
      alert('Error al guardar la sesión');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
      Cargando sesiones de {cfg.label.toLowerCase()}...
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: cfg.bg, padding: '10px', borderRadius: '12px', color: cfg.color }}>
            <IconComp size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              Sesiones de {cfg.label}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              {sesiones.length === 0
                ? 'Sin sesiones registradas'
                : `${sesiones.length} sesión${sesiones.length !== 1 ? 'es' : ''} registrada${sesiones.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {puedeRegistrar && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 1.25rem', backgroundColor: cfg.color,
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 'bold', cursor: 'pointer',
              boxShadow: `0 4px 6px -1px ${cfg.shadow}`
            }}
          >
            <Plus size={18} /> Nueva Sesión
          </button>
        )}
      </div>

      {/* Timeline de sesiones */}
      {sesiones.length === 0 ? (
        <div style={{
          padding: '3rem', textAlign: 'center',
          border: '1px dashed #e2e8f0', borderRadius: '20px', color: '#94a3b8'
        }}>
          No hay sesiones de {cfg.label.toLowerCase()} registradas para este paciente.
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Línea vertical del timeline */}
          <div style={{
            position: 'absolute', left: '23px', top: '28px', bottom: '28px',
            width: '2px', backgroundColor: '#e2e8f0', zIndex: 0
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sesiones.map((sesion, idx) => {
              const esPrimera = idx === 0;
              const nombreProfesional =
                sesion.profesional
                  ? `${sesion.profesional.nombre} ${sesion.profesional.apellidos}`
                  : sesion.profesionalNombre || null;

              return (
                <div
                  key={sesion.id}
                  style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', position: 'relative' }}
                >
                  {/* Dot del timeline */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: esPrimera ? cfg.color : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: esPrimera ? 'white' : '#94a3b8',
                    zIndex: 1, border: '3px solid white',
                    boxShadow: `0 0 0 2px ${esPrimera ? cfg.color + '44' : '#e2e8f0'}`
                  }}>
                    <IconComp size={20} />
                  </div>

                  {/* Tarjeta de la sesión */}
                  <div style={{
                    flex: 1, backgroundColor: 'white', borderRadius: '20px',
                    border: esPrimera ? `2px solid ${cfg.color}55` : '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: esPrimera ? `0 4px 12px ${cfg.shadow}` : '0 1px 3px rgba(0,0,0,0.03)',
                    borderLeft: esPrimera ? `4px solid ${cfg.color}` : undefined
                  }}>
                    {/* Meta de la sesión */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        {esPrimera && (
                          <span style={{
                            backgroundColor: cfg.bg, color: cfg.color,
                            padding: '3px 10px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: '800',
                            display: 'inline-block', marginBottom: '0.5rem'
                          }}>
                            ÚLTIMA SESIÓN
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{
                          fontSize: '13px', color: '#475569', margin: 0, fontWeight: '700',
                          display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'
                        }}>
                          <Calendar size={13} />
                          {new Date(sesion.fecha).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                        {nombreProfesional && (
                          <p style={{
                            fontSize: '12px', color: '#94a3b8', margin: '3px 0 0',
                            display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'
                          }}>
                            <User size={11} /> {nombreProfesional}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Nota de la sesión */}
                    <p style={{
                      fontSize: '14px', color: '#334155', margin: 0,
                      lineHeight: '1.75', whiteSpace: 'pre-wrap'
                    }}>
                      {sesion.nota}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Nueva Sesión */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ ...modalHeaderStyle, borderBottom: `3px solid ${cfg.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: cfg.bg, padding: '8px', borderRadius: '10px', color: cfg.color }}>
                  <IconComp size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Nueva Sesión</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: cfg.color, fontWeight: '700' }}>
                    {cfg.label}
                  </p>
                </div>
              </div>
              <X size={20} cursor="pointer" onClick={() => setShowModal(false)} />
            </div>
            <div style={modalBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Fecha de la sesión *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Profesional que imparte</label>
                  <input
                    type="text"
                    placeholder="Nombre del terapeuta o especialista"
                    value={form.profesionalNombre}
                    onChange={e => setForm({ ...form, profesionalNombre: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>{cfg.labelNota} *</label>
                <textarea
                  rows={8}
                  placeholder="Redacta la nota completa de la sesión..."
                  value={form.nota}
                  onChange={e => setForm({ ...form, nota: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>
              <button
                onClick={handleGuardar}
                disabled={isSaving}
                style={{
                  ...btnSaveStyle,
                  backgroundColor: cfg.color,
                  boxShadow: `0 4px 6px -1px ${cfg.shadow}`
                }}
              >
                {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Sesión</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem' };

export default SeccionSesiones;
