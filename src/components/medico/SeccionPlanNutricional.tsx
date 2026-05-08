import React, { useEffect, useState } from 'react';
import {
  Apple,
  Plus,
  X,
  Save,
  FileText,
  AlertCircle,
  Ban,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import apiClient from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface SeccionPlanNutricionalProps {
  expedienteId: number;
}

interface PlanNutricional {
  id: number;
  expedienteId: number;
  dietaSugerida: string;
  alergiasAlimentarias?: string;
  restricciones?: string;
  observaciones?: string;
  createdAt: string;
  nutricionista?: {
    id: number;
    nombre: string;
    apellidos: string;
  };
}

const SeccionPlanNutricional: React.FC<SeccionPlanNutricionalProps> = ({ expedienteId }) => {
  const { usuario } = useAuthStore();

  const [planes, setPlanes] = useState<PlanNutricional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [planActivo, setPlanActivo] = useState<PlanNutricional | null>(null);

  const [form, setForm] = useState({
    dietaSugerida: '',
    alergiasAlimentarias: '',
    restricciones: '',
    observaciones: ''
  });

  const puedeEditar = ['NUTRICION', 'ADMIN_GENERAL', 'AREA_MEDICA'].includes(usuario?.rol ?? '');

  const fetchPlanes = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/clinica/expediente/${expedienteId}/plan-nutricional`);
      const data: PlanNutricional[] = res.data.data ?? [];
      setPlanes(data);
      if (data.length > 0) setPlanActivo(data[0]);
    } catch {
      console.error('Error cargando plan nutricional');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlanes(); }, [expedienteId]);

  const abrirModal = () => {
    if (planActivo) {
      setForm({
        dietaSugerida: planActivo.dietaSugerida,
        alergiasAlimentarias: planActivo.alergiasAlimentarias ?? '',
        restricciones: planActivo.restricciones ?? '',
        observaciones: planActivo.observaciones ?? ''
      });
    } else {
      setForm({ dietaSugerida: '', alergiasAlimentarias: '', restricciones: '', observaciones: '' });
    }
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!form.dietaSugerida.trim()) {
      alert('La dieta sugerida es requerida');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post(`/clinica/expediente/${expedienteId}/plan-nutricional`, form);
      setShowModal(false);
      setForm({ dietaSugerida: '', alergiasAlimentarias: '', restricciones: '', observaciones: '' });
      fetchPlanes();
    } catch {
      alert('Error al guardar el plan nutricional');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
      Cargando plan nutricional...
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '12px', color: '#d97706' }}>
            <Apple size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Plan Nutricional</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              {planes.length === 0
                ? 'Sin planes registrados'
                : `${planes.length} plan${planes.length !== 1 ? 'es' : ''} registrado${planes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {puedeEditar && (
          <button
            onClick={abrirModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 1.25rem', backgroundColor: '#d97706',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(217,119,6,0.3)'
            }}
          >
            <Plus size={18} /> {planActivo ? 'Actualizar Plan' : 'Registrar Plan'}
          </button>
        )}
      </div>

      {/* Vista del plan activo */}
      {planActivo ? (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Plan Vigente
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#94a3b8' }}>
              {planActivo.nutricionista && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} />
                  {planActivo.nutricionista.nombre} {planActivo.nutricionista.apellidos}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                {new Date(planActivo.createdAt).toLocaleDateString('es-MX')}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <CampoNutricional
              label="Dieta Sugerida"
              value={planActivo.dietaSugerida}
              icon={<FileText size={15} />}
              color="#d97706"
              bg="#fef3c7"
            />
            <CampoNutricional
              label="Alergias Alimentarias"
              value={planActivo.alergiasAlimentarias || 'No registradas'}
              icon={<AlertCircle size={15} />}
              color="#ef4444"
              bg="#fee2e2"
            />
            <CampoNutricional
              label="Restricciones"
              value={planActivo.restricciones || 'Sin restricciones especiales'}
              icon={<Ban size={15} />}
              color="#f97316"
              bg="#fff7ed"
            />
            <CampoNutricional
              label="Observaciones"
              value={planActivo.observaciones || 'Sin observaciones adicionales'}
              icon={<MessageSquare size={15} />}
              color="#64748b"
              bg="#f8fafc"
            />
          </div>
        </div>
      ) : (
        <div style={{
          padding: '3rem', textAlign: 'center',
          border: '1px dashed #e2e8f0', borderRadius: '20px',
          color: '#94a3b8', marginBottom: '2.5rem'
        }}>
          No hay un plan nutricional registrado para este paciente.
        </div>
      )}

      {/* Historial de planes */}
      {planes.length > 1 && (
        <>
          <p style={{
            fontSize: '12px', fontWeight: '800', color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem'
          }}>
            Historial de Planes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {planes.slice(1).map((plan, idx) => (
              <div
                key={plan.id}
                onClick={() => setPlanActivo(plan)}
                style={{
                  padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc',
                  borderRadius: '16px', border: '1px solid #f1f5f9',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer',
                  transition: 'all 0.15s ease', opacity: 0.75
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    backgroundColor: '#94a3b8', color: 'white',
                    borderRadius: '8px', padding: '4px 10px',
                    fontSize: '11px', fontWeight: '800'
                  }}>
                    V{planes.length - 1 - idx}
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: '#475569', margin: 0, fontSize: '14px' }}>
                      {plan.dietaSugerida.length > 70
                        ? plan.dietaSugerida.slice(0, 70) + '...'
                        : plan.dietaSugerida}
                    </p>
                    {plan.alergiasAlimentarias && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                        Alergias: {plan.alergiasAlimentarias}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {plan.nutricionista && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <User size={11} /> {plan.nutricionista.nombre} {plan.nutricionista.apellidos}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Calendar size={11} /> {new Date(plan.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: Registrar / Actualizar Plan */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  {planActivo ? 'Actualizar Plan Nutricional' : 'Registrar Plan Nutricional'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Complete los campos del plan
                </p>
              </div>
              <X size={20} cursor="pointer" onClick={() => setShowModal(false)} />
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Dieta Sugerida *</label>
                <textarea
                  rows={4}
                  placeholder="Descripción completa de la dieta recomendada para el paciente..."
                  value={form.dietaSugerida}
                  onChange={e => setForm({ ...form, dietaSugerida: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Alergias Alimentarias</label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Lactosa, gluten, nueces..."
                    value={form.alergiasAlimentarias}
                    onChange={e => setForm({ ...form, alergiasAlimentarias: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Restricciones</label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Sin azúcar, bajo en sodio, sin grasa..."
                    value={form.restricciones}
                    onChange={e => setForm({ ...form, restricciones: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Observaciones</label>
                <textarea
                  rows={3}
                  placeholder="Notas adicionales sobre el plan nutricional o el estado del paciente..."
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <button onClick={handleGuardar} disabled={isSaving} style={btnSaveStyle}>
                {isSaving ? 'Guardando...' : <><Save size={18} /> {planActivo ? 'Actualizar Plan' : 'Guardar Plan'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CampoNutricionalProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const CampoNutricional: React.FC<CampoNutricionalProps> = ({ label, value, icon, color, bg }) => (
  <div style={{ backgroundColor: bg, borderRadius: '16px', padding: '1.25rem 1.5rem', border: `1px solid ${color}33` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color }}>
      {icon}
      <p style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
        {label}
      </p>
    </div>
    <p style={{ fontSize: '14px', color: '#1e293b', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
      {value}
    </p>
  </div>
);

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalHeaderStyle: React.CSSProperties = { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBodyStyle: React.CSSProperties = { padding: '2rem' };
const formGroupStyle: React.CSSProperties = { marginBottom: '1.25rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const btnSaveStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', boxShadow: '0 4px 6px -1px rgba(217,119,6,0.3)' };

export default SeccionPlanNutricional;
