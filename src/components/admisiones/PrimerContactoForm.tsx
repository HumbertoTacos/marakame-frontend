import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, User, Activity,
  Calendar, Save, ChevronDown,
  Phone, MessageSquare, Heart,
  Stethoscope, ShieldAlert,
  ArrowRightCircle,
  Home,
  MapPin,
  Briefcase,
  Skull
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import { usePrimerContactoStore } from '../../stores/formDraftStore';
import apiClient from '../../services/api';
import { CustomDatePicker } from '../common/DatePicker';

const SUSTANCIAS_LIST = [
  'Alcohol', 'Cristal', 'Cocaína', 'Marihuana', 'Heroína', 'Benzodiacepinas', 'Inhalantes', 'Ludopatía', 'Otro'
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
        padding: '1.25rem 1.5rem',
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
          padding: '0.6rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>{icon}</div>
        <span style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b', letterSpacing: '-0.01em' }}>{title}</span>
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

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? '#3b82f6' : '#cbd5e1',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }} />
    </button>
  </div>
);

export const PrimerContactoForm: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogoSustancias, setCatalogoSustancias] = useState<{ id: number, nombre: string }[]>([]);

  const {
    formData, openSection, lastUpdated,
    setFormData, setOpenSection, resetForm
  } = usePrimerContactoStore();

  // Cargar Catálogo de Sustancias
  useEffect(() => {
    const fetchSustancias = async () => {
      try {
        const response = await apiClient.get('/admisiones/sustancias');
        setCatalogoSustancias(response.data.data);
      } catch (error) {
        console.error('Error fetching substances:', error);
      }
    };
    fetchSustancias();

    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - lastUpdated > TEN_MINUTES) {
      resetForm();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Lógica Especial: Autofill "EL MISMO"
    if (name === 'parentescoLlamada' && value === 'EL MISMO') {
      setFormData({
        parentescoLlamada: value,
        nombrePaciente: formData.nombreLlamada,
        direccionPaciente: formData.domicilioLlamada,
        telefonoPaciente: formData.celularLlamada || formData.telCasaLlamada,
        ocupacionPaciente: formData.ocupacionLlamada
      });
      return;
    }

    setFormData({ [name]: value });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ [name]: checked });
  };

  const handleSustanciaToggle = (nombre: string) => {
    const current = formData.sustancias || [];
    if (current.includes(nombre)) {
      setFormData({ sustancias: current.filter((s: string) => s !== nombre) });
    } else {
      setFormData({ sustancias: [...current, nombre] });
    }
  };

  const handleAddSustanciaOtro = () => {
    const current = formData.sustanciasOtros || [];
    setFormData({ sustanciasOtros: [...current, ''] });
  };

  const handleSustanciaOtroChange = (index: number, val: string) => {
    const current = [...(formData.sustanciasOtros || [])];
    current[index] = val;
    setFormData({ sustanciasOtros: current });
  };

  const handleRemoveSustanciaOtro = (index: number) => {
    const current = [...(formData.sustanciasOtros || [])];
    current.splice(index, 1);
    setFormData({ sustanciasOtros: current });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submissionData = { ...formData };
    
    // Mapeo Inteligente de "OTRO" antes de enviar a la BD
    if (submissionData.medioEnterado === 'OTRO') {
      submissionData.medioEnterado = formData.medioEnteradoOtro;
    }
    if (submissionData.estadoCivilPaciente === 'OTRO') {
      submissionData.estadoCivilPaciente = formData.estadoCivilOtro;
    }
    if (submissionData.escolaridadPaciente === 'OTRO') {
      submissionData.escolaridadPaciente = formData.escolaridadOtro;
    }
    if (submissionData.parentescoLlamada === 'OTRO') {
      submissionData.parentescoLlamada = formData.parentescoOtro;
    }
    if (submissionData.acuerdoSeguimiento === 'OTRO') {
      submissionData.acuerdoSeguimiento = formData.acuerdoOtro;
    }

    try {
      await apiClient.post('/admisiones/primer-contacto', submissionData);
      alert('Registro de 31 Puntos digitalizado exitosamente');
      resetForm();
      navigate('/admisiones/seguimiento');
    } catch (error: any) {
      console.error('Error saving First Contact:', error);
      if (error.response?.status === 401) {
        alert('⚠️ Tu sesión ha expirado por seguridad (esto ocurre tras actualizaciones del sistema). \n\nNo te preocupes: Tus datos están a salvo en el borrador automático. \n\nPor favor, refresca la página (F5) o inicia sesión nuevamente en otra pestaña para terminar de guardar.');
      } else {
        alert('Hubo un error al guardar el registro. Por favor, verifica tu conexión.');
      }
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
    outline: 'none',
    backgroundColor: '#fff'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    marginLeft: '2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em'
  };

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' };
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* SECCIÓN 1: FICHA DE REGISTRO (1-3) */}
      <AccordionSection
        title="1. Ficha de Registro"
        icon={<ClipboardList size={20} />}
        isOpen={openSection === 0}
        onToggle={() => setOpenSection(openSection === 0 ? -1 : 0)}
      >
        <div style={grid2}>
          <div>
            <label style={labelStyle}>1) Fecha</label>
            <input style={{ ...inputStyle, backgroundColor: '#f1f5f9' }} value={format(new Date(), "dd/MM/yyyy")} disabled />
          </div>
          <div>
            <label style={labelStyle}>2) Atendió</label>
            <input style={{ ...inputStyle, backgroundColor: '#f1f5f9' }} value={`${usuario?.nombre} ${usuario?.apellidos}`} disabled />
          </div>
          <div>
            <label style={labelStyle}>3) Hora</label>
            <input name="hora" placeholder="Ej: 14:20" style={inputStyle} onChange={handleChange} value={formData.hora} />
          </div>
          <div>
            <label style={labelStyle}>Fuente de Referencia / Medio</label>
            <select name="medioEnterado" style={inputStyle} onChange={handleChange} value={formData.medioEnterado}>
              <option value="">Seleccione...</option>
              <option value="INTERNET">INTERNET</option>
              <option value="EX_PACIENTE">EX PACIENTE</option>
              <option value="FAMILIAR">FAMILIAR</option>
              <option value="REVISTA">REVISTA</option>
              <option value="ANUNCIO">ANUNCIO</option>
              <option value="PROF./SALUD">PROF./SALUD</option>
              <option value="OTRO">OTRO</option>
            </select>
            {formData.medioEnterado === 'OTRO' && (
              <div style={{ marginTop: '0.5rem', animation: 'fadeIn 0.3s ease' }}>
                <input 
                  name="medioEnteradoOtro" 
                  placeholder="Especifique medio..." 
                  style={inputStyle} 
                  onChange={handleChange} 
                  value={formData.medioEnteradoOtro} 
                />
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 2: DATOS DEL SOLICITANTE (4-9) */}
      <AccordionSection
        title="2. Datos del Solicitante"
        icon={<Phone size={20} />}
        isOpen={openSection === 1}
        onToggle={() => setOpenSection(openSection === 1 ? -1 : 1)}
      >
        <div style={grid2}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>4) Nombre Completo</label>
            <input name="nombreLlamada" placeholder="Nombre de quien llama..." style={inputStyle} onChange={handleChange} value={formData.nombreLlamada} />
          </div>
          <div>
            <label style={labelStyle}>5) Lugar</label>
            <input name="lugarLlamada" placeholder="Ciudad, Municipio..." style={inputStyle} onChange={handleChange} value={formData.lugarLlamada} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>6) Dirección</label>
            <input name="domicilioLlamada" placeholder="Calle, número, colonia..." style={inputStyle} onChange={handleChange} value={formData.domicilioLlamada} />
          </div>
          <div>
            <label style={labelStyle}>7) Tel Casa</label>
            <input name="telCasaLlamada" style={inputStyle} onChange={handleChange} value={formData.telCasaLlamada} />
          </div>
          <div>
            <label style={labelStyle}>8) Celular</label>
            <input name="celularLlamada" style={inputStyle} onChange={handleChange} value={formData.celularLlamada} />
          </div>
          <div>
            <label style={labelStyle}>9) Ocupación</label>
            <input name="ocupacionLlamada" style={inputStyle} onChange={handleChange} value={formData.ocupacionLlamada} />
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 3: PROSPECTO (10-19) */}
      <AccordionSection
        title="3. Datos del Prospecto (Paciente)"
        icon={<User size={20} />}
        isOpen={openSection === 2}
        onToggle={() => setOpenSection(openSection === 2 ? -1 : 2)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>10) Parentesco / Relación</label>
              <select name="parentescoLlamada" style={inputStyle} onChange={handleChange} value={formData.parentescoLlamada}>
                <option value="">Seleccione...</option>
                {['PAPÁ', 'MAMÁ', 'ESPOSO(A)', 'HIJO(A)', 'TÍO(A)', 'SOBRINO(A)', 'AMIGO', 'PRIMO(A)', 'ABUELO(A)', 'EL MISMO', 'OTRO'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {formData.parentescoLlamada === 'OTRO' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <label style={labelStyle}>Especifique Otro</label>
                <input name="parentescoOtro" style={inputStyle} onChange={handleChange} value={formData.parentescoOtro} />
              </div>
            )}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>11) Nombre del Prospecto</label>
              <input name="nombrePaciente" style={inputStyle} onChange={handleChange} value={formData.nombrePaciente} required />
            </div>
          </div>

          <div style={grid2}>
            <div style={grid2}>
              <div>
                <label style={labelStyle}>12) Edad</label>
                <input type="number" name="edadPaciente" style={inputStyle} onChange={handleChange} value={formData.edadPaciente} />
              </div>
              <div>
                <label style={labelStyle}>13) Edo. Civil</label>
                <select name="estadoCivilPaciente" style={inputStyle} onChange={handleChange} value={formData.estadoCivilPaciente}>
                  <option value="">Seleccione...</option>
                  <option value="SOLTERO(A)">SOLTERO(A)</option>
                  <option value="CASADO(A)">CASADO(A)</option>
                  <option value="DIVORCIADO(A)">DIVORCIADO(A)</option>
                  <option value="VIUDO(A)">VIUDO(A)</option>
                  <option value="UNIÓN LIBRE">UNIÓN LIBRE</option>
                  <option value="OTRO">OTRO</option>
                </select>
                {formData.estadoCivilPaciente === 'OTRO' && (
                  <div style={{ marginTop: '0.5rem', animation: 'fadeIn 0.3s ease' }}>
                    <input 
                      name="estadoCivilOtro" 
                      placeholder="Especifique..." 
                      style={inputStyle} 
                      onChange={handleChange} 
                      value={formData.estadoCivilOtro} 
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>14) Hijos</label>
              <input type="number" name="hijosPaciente" style={inputStyle} onChange={handleChange} value={formData.hijosPaciente} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>15) Dirección</label>
            <input name="direccionPaciente" style={inputStyle} onChange={handleChange} value={formData.direccionPaciente} />
          </div>

          <div style={grid3}>
            <div>
              <label style={labelStyle}>16) Escolaridad</label>
              <select name="escolaridadPaciente" style={inputStyle} onChange={handleChange} value={formData.escolaridadPaciente}>
                <option value="">Seleccione...</option>
                <option value="NINGUNA">NINGUNA</option>
                <option value="PRIMARIA">PRIMARIA</option>
                <option value="SECUNDARIA">SECUNDARIA</option>
                <option value="PREPARATORIA">PREPARATORIA</option>
                <option value="LICENCIATURA">LICENCIATURA</option>
                <option value="POSTGRADO">POSTGRADO</option>
                <option value="OTRO">OTRO</option>
              </select>
              {formData.escolaridadPaciente === 'OTRO' && (
                <div style={{ marginTop: '0.5rem', animation: 'fadeIn 0.3s ease' }}>
                  <input 
                    name="escolaridadOtro" 
                    placeholder="Especifique..." 
                    style={inputStyle} 
                    onChange={handleChange} 
                    value={formData.escolaridadOtro} 
                  />
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>17) Origen</label>
              <input name="origenPaciente" style={inputStyle} onChange={handleChange} value={formData.origenPaciente} />
            </div>
            <div>
              <label style={labelStyle}>18) Tel</label>
              <input name="telefonoPaciente" style={inputStyle} onChange={handleChange} value={formData.telefonoPaciente} />
            </div>
            <div>
              <label style={labelStyle}>19) Ocupación</label>
              <input name="ocupacionPaciente" style={inputStyle} onChange={handleChange} value={formData.ocupacionPaciente} />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 4: SUSTANCIAS (20) */}
      <AccordionSection
        title="4. Sustancias de Consumo (20)"
        icon={<Skull size={20} />}
        isOpen={openSection === 3}
        onToggle={() => setOpenSection(openSection === 3 ? -1 : 3)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {catalogoSustancias.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSustanciaToggle(s.nombre)}
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: formData.sustancias?.includes(s.nombre) ? '#3b82f6' : '#e2e8f0',
                  backgroundColor: formData.sustancias?.includes(s.nombre) ? '#eff6ff' : 'white',
                  color: formData.sustancias?.includes(s.nombre) ? '#1d4ed8' : '#475569',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {s.nombre}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <label style={labelStyle}>20. OTROS (AGREGAR MULTIPLES)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {(formData.sustanciasOtros || []).map((val: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    style={inputStyle}
                    value={val}
                    onChange={(e) => handleSustanciaOtroChange(idx, e.target.value)}
                    placeholder="Escriba sustancia..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSustanciaOtro(idx)}
                    style={{ padding: '0 1rem', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSustanciaOtro}
                style={{ width: 'fit-content', padding: '0.5rem 1rem', fontSize: '12px', fontWeight: '800', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', cursor: 'pointer' }}
              >
                + AGREGAR OTRO
              </button>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 5: DISPOSICIÓN, ANTECEDENTES Y ECONOMÍA (21-24) */}
      <AccordionSection
        title="5. Disposición y Antecedentes (21-24)"
        icon={<Activity size={20} />}
        isOpen={openSection === 4}
        onToggle={() => setOpenSection(openSection === 4 ? -1 : 4)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>21) ¿Está dispuesto a internarse?</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              {['SI', 'NO', 'DUDA'].map(opt => (
                <button
                  key={opt} type="button" onClick={() => setFormData({ dispuestoInternarse: opt })}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid',
                    borderColor: formData.dispuestoInternarse === opt ? '#3b82f6' : '#e2e8f0',
                    backgroundColor: formData.dispuestoInternarse === opt ? '#eff6ff' : 'white',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                  }}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div style={grid2}>
            <div>
              <label style={labelStyle}>22) ¿Se realizó intervención?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                {['SI', 'NO'].map(opt => (
                  <button
                    key={opt} type="button" onClick={() => setFormData({ realizoIntervencion: opt })}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid',
                      borderColor: formData.realizoIntervencion === opt ? '#3b82f6' : '#e2e8f0',
                      backgroundColor: formData.realizoIntervencion === opt ? '#eff6ff' : 'white',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Conclusión (Intervención)</label>
              <input name="conclusionIntervencion" style={inputStyle} onChange={handleChange} value={formData.conclusionIntervencion} />
            </div>
          </div>

          <div style={grid2}>
            <div>
              <label style={labelStyle}>23) ¿Ha estado en tratamiento?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                {['SI', 'NO'].map(opt => (
                  <button
                    key={opt} type="button" onClick={() => setFormData({ tratamientoPrevio: opt })}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid',
                      borderColor: formData.tratamientoPrevio === opt ? '#3b82f6' : '#e2e8f0',
                      backgroundColor: formData.tratamientoPrevio === opt ? '#eff6ff' : 'white',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Donde (Tratamiento)</label>
              <input name="lugarTratamiento" style={inputStyle} onChange={handleChange} value={formData.lugarTratamiento} />
            </div>
          </div>

          {/* AGREGADO EL PUNTO 24 AQUÍ */}
          <div style={{ marginTop: '0.5rem' }}>
            <label style={labelStyle}>24) Posibilidades Económicas</label>
            <textarea 
              name="posibilidadesEconomicas" 
              rows={3} 
              style={{ ...inputStyle, resize: 'none' }} 
              onChange={handleChange} 
              value={formData.posibilidadesEconomicas || ''} 
              placeholder="Describa la situación económica o posibilidades de pago..." 
            />
          </div>

        </div>
      </AccordionSection>

      {/* SECCIÓN 6: ACUERDO (25-29) */}
      <AccordionSection
        title="6. Acuerdo y Seguimiento"
        icon={<ShieldAlert size={20} />}
        isOpen={openSection === 5}
        onToggle={() => setOpenSection(openSection === 5 ? -1 : 5)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem', backgroundColor: '#f8fafc' }}>
            <p style={{ ...labelStyle, marginBottom: '1rem', color: '#1e40af' }}>ACUERDO Y SEGUIMIENTO:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Seleccione el Acuerdo</label>
                <select 
                  name="acuerdoSeguimiento" 
                  value={formData.acuerdoSeguimiento} 
                  onChange={handleChange} 
                  style={inputStyle}
                >
                  <option value="LLAMARLE"> Llamarle nosotros</option>
                  <option value="ESPERAR_LLAMADA"> Esperar llamada de ellos</option>
                  <option value="ESPERAR_VISITA"> Esperar visita</option>
                  <option value="POSIBLE_INGRESO"> Posible Ingreso (Agendar)</option>
                  <option value="RECHAZADO">No le interesa / Rechazado</option>
                  <option value="OTRO"> Otro (Especifique)</option>
                </select>
              </div>

              {['LLAMARLE', 'ESPERAR_LLAMADA', 'POSIBLE_INGRESO'].includes(formData.acuerdoSeguimiento) && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <label style={{ ...labelStyle, color: '#2563eb' }}>📅 Fecha Programada</label>
                  <input 
                    type="date" 
                    name="fechaAcuerdo" 
                    value={formData.fechaAcuerdo} 
                    onChange={handleChange} 
                    style={{ ...inputStyle, borderColor: '#3b82f6', backgroundColor: '#eff6ff' }} 
                  />
                </div>
              )}
            </div>

            {formData.acuerdoSeguimiento === 'OTRO' && (
              <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
                <label style={labelStyle}>26) OTRO ACUERDO (ESPECIFIQUE)</label>
                <textarea 
                  name="acuerdoOtro" 
                  rows={2} 
                  style={{ ...inputStyle, resize: 'none' }} 
                  onChange={handleChange} 
                  value={formData.acuerdoOtro} 
                  placeholder="Detalle el acuerdo personalizado..."
                />
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 7: CIERRE MÉDICO (30-31) */}
      <AccordionSection
        title="7. Cierre Médico"
        icon={<Stethoscope size={20} />}
        isOpen={openSection === 6}
        onToggle={() => setOpenSection(openSection === 6 ? -1 : 6)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>30) Nombre del médico que lo valoró</label>
            <input name="medicoValoro" style={inputStyle} onChange={handleChange} value={formData.medicoValoro} />
          </div>
          <div>
            <label style={labelStyle}>31) Conclusión Médica</label>
            <textarea name="conclusionMedica" rows={4} style={{ ...inputStyle, resize: 'none' }} onChange={handleChange} value={formData.conclusionMedica} placeholder="Resultados clínicos de la valoración inicial..." />
          </div>
        </div>
      </AccordionSection>

      {/* BOTÓN FINAL */}
      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          type="button" onClick={() => navigate('/admisiones/seguimiento')}
          style={{ padding: '0.85rem 2rem', borderRadius: '14px', border: '1px solid #cbd5e1', background: 'white', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
        >
          Regresar a Seguimiento
        </button>
        <button
          type="submit" disabled={isSubmitting}
          style={{
            padding: '0.85rem 2.5rem', borderRadius: '14px', border: 'none',
            background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}
        >
          {isSubmitting ? 'Guardando...' : <><Save size={20} /> Finalizar Hoja 31 Puntos</>}
        </button>
      </div>

    </form>
  );
};

const ToggleCheck: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      padding: '0.75rem',
      borderRadius: '12px',
      border: '1px solid',
      borderColor: checked ? '#3b82f6' : '#e2e8f0',
      backgroundColor: checked ? '#eff6ff' : 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      cursor: 'pointer',
      textAlign: 'left'
    }}
  >
    <div style={{
      width: '18px', height: '18px', borderRadius: '4px', border: '2px solid',
      borderColor: checked ? '#3b82f6' : '#cbd5e1',
      backgroundColor: checked ? '#3b82f6' : 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: '12px'
    }}>{checked && '✓'}</div>
    <span style={{ fontSize: '13px', fontWeight: '700', color: checked ? '#1e40af' : '#475569' }}>{label}</span>
  </button>
);