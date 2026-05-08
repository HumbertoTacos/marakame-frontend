import React, { useState, useEffect } from 'react';
import {
  FileText,
  Stethoscope,
  ClipboardCheck,
  Pill,
  CalendarDays,
  BookOpen,
  Apple,
  Brain,
  MessageCircle,
  Users,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Pencil,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { generarExpedientePDF } from '../../utils/expedientePDF';

import SeccionHistoriaClinica from '../../components/medico/SeccionHistoriaClinica';
import SeccionMedica from '../../components/medico/SeccionMedica';
import SeccionEvaluaciones from '../../components/medico/SeccionEvaluaciones';
import SeccionTratamientos from '../../components/medico/SeccionTratamientos';
import SeccionCitas from '../../components/medico/SeccionCitas';
import SeccionPlanNutricional from '../../components/medico/SeccionPlanNutricional';
import SeccionSesiones from '../../components/medico/SeccionSesiones';

type TabId =
  | 'preAdmision'
  | 'areaMedica'
  | 'tratamientos'
  | 'evaluaciones'
  | 'citas'
  | 'nutricion'
  | 'psicologia'
  | 'consejeria'
  | 'familia'
  | 'seguimiento';

const TABS: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'preAdmision',  label: 'Resumen Médico',   icon: BookOpen,       color: '#0891b2' },
  { id: 'areaMedica',   label: 'Área Médica',       icon: Stethoscope,    color: '#10b981' },
  { id: 'tratamientos', label: 'Tratamientos',      icon: Pill,           color: '#d97706' },
  { id: 'evaluaciones', label: 'Evaluaciones',      icon: ClipboardCheck, color: '#f59e0b' },
  { id: 'citas',        label: 'Citas',             icon: CalendarDays,   color: '#7c3aed' },
  { id: 'nutricion',    label: 'Plan Nutricional',  icon: Apple,          color: '#d97706' },
  { id: 'psicologia',   label: 'Psicología',        icon: Brain,          color: '#7c3aed' },
  { id: 'consejeria',   label: 'Consejería',        icon: MessageCircle,  color: '#ec4899' },
  { id: 'familia',      label: 'Familia',           icon: Users,          color: '#f97316' },
  { id: 'seguimiento',  label: 'Seguimiento',       icon: TrendingUp,     color: '#6366f1' },
];

const ExpedienteDigitalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('preAdmision');
  const [expedienteRaw, setExpedienteRaw] = useState<any>(null);
  const [pacienteLocal, setPacienteLocal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleImprimirPDF = () => {
    if (!pacienteLocal && !expedienteRaw?.paciente) return;
    if (!expedienteRaw?.historiaClinica) return;
    const pac = expedienteRaw?.paciente ?? pacienteLocal;
    generarExpedientePDF(pac, expedienteRaw.historiaClinica, usuario?.nombre ?? 'Médico', expedienteRaw.id);
  };

  const fetchExpediente = async () => {
    try {
      const [expRes, pacRes] = await Promise.allSettled([
        apiClient.get(`/expedientes/paciente/${id}`),
        apiClient.get(`/pacientes/${id}`),
      ]);
      if (expRes.status === 'fulfilled' && expRes.value.data.success) {
        setExpedienteRaw(expRes.value.data.data);
      }
      if (pacRes.status === 'fulfilled' && pacRes.value.data.data) {
        setPacienteLocal(pacRes.value.data.data);
      }
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

  const paciente = expedienteRaw?.paciente ?? pacienteLocal;

  if (!paciente) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
      No se encontró el paciente.
    </div>
  );
  const activeColor = TABS.find(t => t.id === activeTab)?.color ?? '#0891b2';
  const historiaGenerada = !!(expedienteRaw?.historiaClinica);

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
                <Calendar size={16} /> Ingreso: {paciente.fechaIngreso ? new Date(paciente.fechaIngreso).toLocaleDateString('es-MX') : 'N/A'}
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

      {/* Banner condicional: Expediente Clínico Inicial */}
      {!historiaGenerada ? (
        <div style={{
          backgroundColor: '#fffbeb', border: '1.5px solid #fcd34d',
          borderRadius: '20px', padding: '1.25rem 1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#fef3c7', padding: '0.6rem', borderRadius: '12px', color: '#d97706', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '800', color: '#92400e', fontSize: '14px' }}>
                Historia Clínica Inicial pendiente
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
                Para acceder a todas las secciones del expediente es necesario generar la historia clínica inicial del paciente.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/medica/historia-clinica/${paciente.id}`)}
            style={{
              padding: '0.7rem 1.4rem', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg,#d97706,#b45309)',
              color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0,
            }}
          >
            <FileText size={15} /> Generar Historia Clínica Inicial
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1.5px solid #86efac',
          borderRadius: '20px', padding: '1.25rem 1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#dcfce7', padding: '0.6rem', borderRadius: '12px', color: '#16a34a', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '800', color: '#166534', fontSize: '15px' }}>
                Expediente Clínico Inicial
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                Historia clínica generada y disponible para consulta e impresión.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/medica/historia-clinica/${paciente.id}`)}
              style={{
                padding: '0.6rem 1.1rem', borderRadius: '12px',
                border: '1.5px solid #86efac', background: 'white',
                color: '#166534', fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
              }}
            >
              <Eye size={14} /> Ver
            </button>
            <button
              onClick={() => navigate(`/medica/historia-clinica/${paciente.id}`)}
              style={{
                padding: '0.6rem 1.1rem', borderRadius: '12px',
                border: '1.5px solid #6ee7b7', background: '#f0fdf4',
                color: '#047857', fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
              }}
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={handleImprimirPDF}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
              }}
            >
              <Printer size={14} /> Imprimir PDF
            </button>
          </div>
        </div>
      )}

      {/* Navegación de pestañas */}
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

        {activeTab === 'areaMedica' && expedienteRaw && (
          <SeccionMedica expediente={expedienteRaw} onRefresh={fetchExpediente} />
        )}

        {activeTab === 'tratamientos' && expedienteRaw && (
          <SeccionTratamientos expedienteId={expedienteRaw.id} />
        )}

        {activeTab === 'evaluaciones' && (
          <SeccionEvaluaciones pacienteId={paciente.id} />
        )}

        {activeTab === 'citas' && (
          <SeccionCitas pacienteId={paciente.id} />
        )}

        {activeTab === 'nutricion' && expedienteRaw && (
          <SeccionPlanNutricional expedienteId={expedienteRaw.id} />
        )}

        {activeTab === 'psicologia' && expedienteRaw && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="PSICOLOGIA" />
        )}

        {activeTab === 'consejeria' && expedienteRaw && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="CONSEJERIA" />
        )}

        {activeTab === 'familia' && expedienteRaw && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="FAMILIA" />
        )}

        {activeTab === 'seguimiento' && expedienteRaw && (
          <SeccionSesiones expedienteId={expedienteRaw.id} tipo="SEGUIMIENTO" />
        )}

        {!historiaGenerada && ['areaMedica','tratamientos','nutricion','psicologia','consejeria','familia','seguimiento'].includes(activeTab) && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #fcd34d', borderRadius: '20px', backgroundColor: '#fffbeb' }}>
            <AlertTriangle size={32} color="#d97706" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: '700', color: '#92400e', margin: '0 0 0.5rem' }}>Historia Clínica Inicial no generada</p>
            <p style={{ fontSize: '13px', color: '#b45309', margin: 0 }}>
              Genera la historia clínica inicial para desbloquear esta sección.
            </p>
          </div>
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
