import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Stethoscope,
  Apple,
  Brain,
  MessageCircle,
  Users,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';

import SeccionHistoriaClinica from '../../components/medico/SeccionHistoriaClinica';
import SeccionMedica from '../../components/medico/SeccionMedica';
import SeccionPlanNutricional from '../../components/medico/SeccionPlanNutricional';
import SeccionSesiones from '../../components/medico/SeccionSesiones';

type TabId = 'preAdmision' | 'areaMedica' | 'nutricion' | 'psicologia' | 'consejeria' | 'familia' | 'seguimiento';

const TABS: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'preAdmision',  label: 'Historia Médica',       icon: BookOpen,       color: '#0891b2' },
  { id: 'areaMedica',   label: 'Área Médica',          icon: Stethoscope,    color: '#10b981' },
  { id: 'nutricion',    label: 'Plan Nutricional',     icon: Apple,          color: '#d97706' },
  { id: 'psicologia',   label: 'Psicología',           icon: Brain,          color: '#7c3aed' },
  { id: 'consejeria',   label: 'Consejería',           icon: MessageCircle,  color: '#ec4899' },
  { id: 'familia',      label: 'Familia',              icon: Users,          color: '#f97316' },
  { id: 'seguimiento',  label: 'Seguimiento',          icon: TrendingUp,     color: '#6366f1' },
];

const ExpedienteDigitalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('preAdmision');
  const [expedienteRaw, setExpedienteRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpediente = async () => {
    try {
      const res = await apiClient.get(`/expedientes/paciente/${id}`);
      if (res.data.success) setExpedienteRaw(res.data.data);
    } catch (error) {
      console.error('Error fetching expediente:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpediente(); }, [id]);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      Cargando expediente clínico...
    </div>
  );
  if (!expedienteRaw?.paciente) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
      No se encontró el expediente del paciente.
    </div>
  );

  const { paciente } = expedienteRaw;
  const activeColor = TABS.find(t => t.id === activeTab)?.color ?? '#0891b2';

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header / Banner del paciente */}
      <div style={{
        backgroundColor: 'white', borderRadius: '24px',
        border: '1px solid #e2e8f0', padding: '2rem',
        marginBottom: '2rem', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            backgroundColor: '#eff6ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
          }}>
            <User size={40} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: '#1e293b' }}>
                Paciente #{paciente.claveUnica}
              </h1>
              <span style={{
                backgroundColor: '#dcfce7', color: '#166534',
                padding: '4px 12px', borderRadius: '8px',
                fontSize: '12px', fontWeight: 'bold'
              }}>
                {paciente.estado}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: '#64748b', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} /> Ingreso: {new Date(paciente.fechaIngreso).toLocaleDateString('es-MX')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} /> Nivel: {paciente.nivelTratamiento}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} /> Hab: {paciente.cama?.habitacion?.nombre} — Cama: {paciente.cama?.numero}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '10px 20px', borderRadius: '12px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#64748b', fontWeight: '600', cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} /> Volver
        </button>
      </div>

      {/* Navegación de pestañas — scroll horizontal en pantallas pequeñas */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
        borderBottom: '1px solid #e2e8f0', overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.9rem 1.4rem', border: 'none', background: 'none',
              fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap',
              color: activeTab === tab.id ? tab.color : '#94a3b8',
              borderBottom: activeTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <div style={{
        backgroundColor: 'white', borderRadius: '24px',
        border: '1px solid #e2e8f0', padding: '2rem',
        minHeight: '600px',
        borderTop: `3px solid ${activeColor}`
      }}>

        {activeTab === 'preAdmision' && (
          <SeccionHistoriaClinica pacienteId={paciente.id} />
        )}

        {activeTab === 'areaMedica' && (
          <SeccionMedica expediente={expedienteRaw} onRefresh={fetchExpediente} />
        )}

        {activeTab === 'nutricion' && (
          <SeccionPlanNutricional expedienteId={expedienteRaw.id} />
        )}

        {activeTab === 'psicologia' && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="PSICOLOGIA" />
        )}

        {activeTab === 'consejeria' && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="CONSEJERIA" />
        )}

        {activeTab === 'familia' && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="FAMILIA" />
        )}

        {activeTab === 'seguimiento' && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="SEGUIMIENTO" />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ExpedienteDigitalPage;
