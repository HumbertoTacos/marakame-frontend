import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Activity, 
  MessageSquare, 
  DollarSign, 
  ClipboardList, 
  Save, 
  ChevronDown, 
  ChevronUp,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePrimerContactoStore } from '../../stores/formDraftStore';
import apiClient from '../../services/api';
import { CustomDatePicker } from '../common/DatePicker';
import { parseISO, format } from 'date-fns';

const SUSTANCIAS_LIST = [
  'Alcohol', 'Cristal/Metanfetamina', 'Marihuana', 'Cocaína', 'Ludopatía', 'TCA', 'Otro'
];

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection = React.memo<AccordionSectionProps>(({ title, icon, isOpen, onToggle, children }) => (
  <div style={{ 
    border: '1px solid #e2e8f0', 
    borderRadius: '16px', 
    marginBottom: '1.25rem', 
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }}>
    <button 
      onClick={(e) => { e.preventDefault(); onToggle(); }}
      style={{
        width: '100%',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isOpen ? 'linear-gradient(to right, #f8fafc, #ffffff)' : 'white',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          color: '#3b82f6', 
          backgroundColor: isOpen ? '#eff6ff' : '#f1f5f9',
          padding: '0.75rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>{icon}</div>
        <span style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b', letterSpacing: '-0.025em' }}>{title}</span>
      </div>
      <div style={{ 
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
        color: '#64748b'
      }}>
        <ChevronDown size={20} />
      </div>
    </button>
    <div style={{ 
      maxHeight: isOpen ? '2000px' : '0',
      opacity: isOpen ? 1 : 0,
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ padding: '0 1.5rem 2rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ paddingTop: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  </div>
));

export const PrimerContactoForm: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zustand Store Persistence
  const { 
    formData, openSection, lastUpdated,
    setFormData, setOpenSection, resetForm 
  } = usePrimerContactoStore();

  // 10-Minute Expiration Logic
  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - lastUpdated > TEN_MINUTES) {
      resetForm();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ [name]: val });
  };

  const handleSustanciaToggle = (sustancia: string) => {
    const current = [...formData.sustancias];
    if (current.includes(sustancia)) {
      setFormData({ sustancias: current.filter(s => s !== sustancia) });
    } else {
      setFormData({ sustancias: [...current, sustancia] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validación UI: Teléfono Obligatorio
    if (!formData.solicitanteTelefono) {
      alert('El teléfono del solicitante es obligatorio.');
      setIsSubmitting(false);
      return;
    }

    // Validación de CRM: Fecha Seguimiento
    if ((formData.acuerdoSeguimiento === 'LLAMARA_MARAKAME' || formData.acuerdoSeguimiento === 'CITA_PROGRAMADA') && !formData.fechaSeguimiento) {
      alert('Por favor seleccione una fecha de seguimiento para el acuerdo seleccionado.');
      setIsSubmitting(false);
      return;
    }

    // Aplicar Lógica de "Prospecto Anónimo" antes de enviar
    const nombreFinal = formData.nombrePaciente?.trim() || 'Prospecto Anónimo';
    const apPaternoFinal = formData.apellidoPaterno?.trim() || '';
    const apMaternoFinal = formData.apellidoMaterno?.trim() || '';

    // Preparar sustancias finales
    const sustanciasFinales = [...formData.sustancias];
    if (formData.otraSustancia && formData.sustancias.includes('Otro')) {
      // Reemplazamos 'Otro' por el valor específico o lo añadimos
      const index = sustanciasFinales.indexOf('Otro');
      if (index > -1) sustanciasFinales[index] = `Otro: ${formData.otraSustancia}`;
    }

    try {
      await apiClient.post('/admisiones/primer-contacto', {
        ...formData,
        nombrePaciente: nombreFinal,
        apellidoPaterno: apPaternoFinal,
        apellidoMaterno: apMaternoFinal,
        sustancias: sustanciasFinales,
        // Enviar edad como número si existe
        edad: formData.edad ? parseInt(formData.edad as string, 10) : null
      });
      alert('Registro de Primer Contacto guardado exitosamente');
      resetForm();
      navigate('/admisiones/seguimiento');
    } catch (error) {
      console.error('Error saving First Contact:', error);
      alert('Hubo un error al guardar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    marginTop: '0.4rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: '#f8fafc'
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
    marginLeft: '2px'
  };

  const sectionGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* SECCIÓN 1: CONTACTO INICIAL */}
      <AccordionSection 
        title="1. Contacto Inicial" 
        icon={<ClipboardList size={20} />} 
        isOpen={openSection === 0} 
        onToggle={() => setOpenSection(openSection === 0 ? -1 : 0)}
      >
        <div style={sectionGridStyle}>
          <div>
            <label style={labelStyle}>Fecha y Hora de Registro</label>
            <input 
              style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b' }} 
              value={format(new Date(), "dd/MM/yyyy HH:mm")} 
              disabled 
            />
          </div>
          <div>
            <label style={labelStyle}>Medio de Referencia</label>
            <select 
              name="fuenteReferencia" 
              style={inputStyle} 
              onChange={handleChange} 
              value={formData.fuenteReferencia}
              required
            >
              <option value="">Seleccione...</option>
              <option value="INTERNET">Internet / Redes Sociales</option>
              <option value="EX_PACIENTE">Ex-Paciente</option>
              <option value="FAMILIAR">Familiar / Conocido</option>
              <option value="PROFESIONAL_SALUD">Profesional de la Salud</option>
              <option value="ANUNCIO">Anuncio / Panorámico</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 2: SOLICITANTE */}
      <AccordionSection 
        title="2. Datos del Solicitante" 
        icon={<User size={20} />} 
        isOpen={openSection === 1} 
        onToggle={() => setOpenSection(openSection === 1 ? -1 : 1)}
      >
        <div style={sectionGridStyle}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Nombre Completo</label>
            <input 
              name="solicitanteNombre" 
              placeholder="Nombre de la persona que llama..."
              style={inputStyle} 
              onChange={handleChange} 
              value={formData.solicitanteNombre}
              required 
            />
          </div>
          <div>
            <label style={labelStyle}>Parentesco / Relación</label>
            <select 
              name="relacionPaciente" 
              style={inputStyle} 
              onChange={handleChange} 
              value={formData.relacionPaciente}
              required
            >
              <option value="">Seleccione...</option>
              <option value="PADRE_MADRE">Padre / Madre</option>
              <option value="ESPOSO_A">Esposo(a) / Pareja</option>
              <option value="HIJO_A">Hijo(a)</option>
              <option value="HERMANO_A">Hermano(a)</option>
              <option value="EL_MISMO">El Mismo (Prospecto)</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Teléfono de Contacto*</label>
            <input 
              name="solicitanteTelefono" 
              placeholder="Obligatorio para seguimiento"
              style={inputStyle} 
              onChange={handleChange} 
              value={formData.solicitanteTelefono}
              required
            />
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 3: PROSPECTO */}
      <AccordionSection 
        title="3. Información del Prospecto" 
        icon={<Activity size={20} />} 
        isOpen={openSection === 2} 
        onToggle={() => setOpenSection(openSection === 2 ? -1 : 2)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={sectionGridStyle}>
            <div>
              <label style={labelStyle}>Nombre (Opcional)</label>
              <input 
                name="nombrePaciente" 
                style={inputStyle} 
                onChange={handleChange} 
                value={formData.nombrePaciente}
                placeholder="En blanco para 'Anónimo'"
              />
            </div>
            <div>
              <label style={labelStyle}>Edad (Opcional)</label>
              <input 
                type="number" 
                name="edad" 
                style={inputStyle} 
                onChange={handleChange} 
                value={formData.edad}
                placeholder="Ej: 25"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sustancias de Consumo (Multi-select)</label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '0.75rem',
              marginTop: '0.75rem' 
            }}>
              {SUSTANCIAS_LIST.map(sustancia => (
                <div 
                  key={sustancia} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.6rem', 
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: formData.sustancias.includes(sustancia) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    backgroundColor: formData.sustancias.includes(sustancia) ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }} 
                  onClick={() => handleSustanciaToggle(sustancia)}
                >
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '4px', 
                    border: '2px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: formData.sustancias.includes(sustancia) ? '#3b82f6' : 'transparent'
                  }}>
                    {formData.sustancias.includes(sustancia) && <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: 'white' }} />}
                  </div>
                  <span style={{ 
                    fontSize: '13px', 
                    color: formData.sustancias.includes(sustancia) ? '#1e40af' : '#475569', 
                    fontWeight: formData.sustancias.includes(sustancia) ? '700' : '500' 
                  }}>{sustancia}</span>
                </div>
              ))}
            </div>
          </div>

          {formData.sustancias.includes('Otro') && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <label style={labelStyle}>Especifique otra sustancia</label>
              <input 
                name="otraSustancia" 
                style={inputStyle} 
                onChange={handleChange} 
                value={formData.otraSustancia}
                placeholder="Escriba aquí..."
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Observaciones del Caso</label>
            <textarea 
              name="observaciones" 
              rows={4} 
              style={{ ...inputStyle, resize: 'none' }} 
              onChange={handleChange} 
              value={formData.observaciones}
              placeholder="Describa brevemente la situación o requerimientos especiales..."
            />
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 4: SEGUIMIENTO Y ACUERDOS */}
      <AccordionSection 
        title="4. Seguimientos y Acuerdos" 
        icon={<Calendar size={20} />} 
        isOpen={openSection === 3} 
        onToggle={() => setOpenSection(openSection === 3 ? -1 : 3)}
      >
        <div style={sectionGridStyle}>
          <div>
            <label style={labelStyle}>Acuerdo de Seguimiento*</label>
            <select 
              name="acuerdoSeguimiento" 
              style={inputStyle} 
              value={formData.acuerdoSeguimiento}
              onChange={handleChange} 
              required
            >
              <option value="">Seleccione acuerdo...</option>
              <option value="LLAMARA_PROSPECTO">Prospecto llamará luego</option>
              <option value="LLAMARA_MARAKAME">Llamaremos Nosotros (Marakame)</option>
              <option value="CITA_PROGRAMADA">Cita Agendada / Visita</option>
              <option value="RECHAZADO">Rechazado / Descartado</option>
            </select>
          </div>

          {(formData.acuerdoSeguimiento === 'LLAMARA_MARAKAME' || formData.acuerdoSeguimiento === 'CITA_PROGRAMADA') && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <label style={labelStyle}>Fecha de Seguimiento*</label>
              <CustomDatePicker
                selected={formData.fechaSeguimiento ? parseISO(formData.fechaSeguimiento) : null}
                onChange={(date) => setFormData({ fechaSeguimiento: date ? date.toISOString() : '' })}
                placeholderText="¿Cuándo realizar la acción?"
              />
            </div>
          )}
        </div>
      </AccordionSection>

      {/* FOOTER: BOTONES DE ACCIÓN */}
      <div style={{ 
        marginTop: '2.5rem', 
        padding: '2.5rem', 
        backgroundColor: 'rgba(255, 255, 255, 0.5)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1.25rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
      }}>
        <button 
          type="button"
          onClick={() => navigate('/admisiones/dashboard')}
          style={{ 
            padding: '0.875rem 2rem', 
            borderRadius: '12px', 
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#475569',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Cancelar
        </button>
        <button 
          type="submit"
          disabled={isSubmitting}
          style={{ 
            padding: '0.875rem 2.5rem', 
            borderRadius: '12px', 
            border: 'none',
            background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            fontWeight: '700',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          {isSubmitting ? 'Registrando...' : <><Save size={20} /> Finalizar y Programar</>}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  );
};
