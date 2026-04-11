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
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';
import { CustomDatePicker } from '../common/DatePicker';
import { parseISO, format } from 'date-fns';

const SUSTANCIAS_LIST = [
  'Cristal', 'Alcohol', 'Cocaína', 'Marihuana', 'Éxtasis', 
  'Tabaco', 'Medicamentos', 'Heroína', 'Ludopatía', 'TCA'
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
    borderRadius: '12px', 
    marginBottom: '1rem', 
    overflow: isOpen ? 'visible' : 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  }}>
    <button 
      onClick={(e) => { e.preventDefault(); onToggle(); }}
      style={{
        width: '100%',
        padding: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isOpen ? '#f8fafc' : 'white',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ color: '#3b82f6' }}>{icon}</div>
        <span style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>{title}</span>
      </div>
      {isOpen ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
    </button>
    {isOpen && (
      <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
        {children}
      </div>
    )}
  </div>
));

export const PrimerContactoForm: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [openSection, setOpenSection] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitanteEsPaciente, setSolicitanteEsPaciente] = useState(false);
  const [edad, setEdad] = useState<number | null>(null);

  const INITIAL_STATE = {
    // General
    fuenteReferencia: '',
    
    // Solicitante
    solicitanteNombre: '',
    solicitanteTelefono: '',
    solicitanteCelular: '',
    solicitanteDireccion: '',
    solicitanteOcupacion: '',
    relacionPaciente: '',

    // Paciente
    nombrePaciente: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'M',
    curp: '',
    estadoCivil: '',
    hijos: '0',
    escolaridad: '',
    lugarOrigen: '',
    ocupacion: '',
    telefonoPaciente: '',
    celularPaciente: '',
    direccionPaciente: '',

    // Sustancias
    sustancias: [] as string[],
    otraSustancia: '',

    // Evaluación
    dispuestoInternarse: 'DUDA',
    requiereIntervencion: false,
    estadoPrevioTratamiento: false,

    // Observaciones y Seguimiento
    observaciones: '',
    posibilidadesEconomicas: '',
    acuerdo: '',
  };

  const [formData, setFormData] = useState(INITIAL_STATE);

  // Cálculo de edad automático
  useEffect(() => {
    if (formData.fechaNacimiento) {
      const birth = new Date(formData.fechaNacimiento);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      setEdad(age >= 0 ? age : null);
    }
  }, [formData.fechaNacimiento]);

  // Lógica de autollenado
  useEffect(() => {
    if (solicitanteEsPaciente) {
      setFormData(prev => ({
        ...prev,
        nombrePaciente: prev.solicitanteNombre.split(' ')[0] || '',
        apellidoPaterno: prev.solicitanteNombre.split(' ')[1] || '',
        apellidoMaterno: prev.solicitanteNombre.split(' ')[2] || '',
        telefonoPaciente: prev.solicitanteTelefono,
        celularPaciente: prev.solicitanteCelular,
        direccionPaciente: prev.solicitanteDireccion,
        ocupacion: prev.solicitanteOcupacion,
        relacionPaciente: 'EL MISMO'
      }));
    }
  }, [solicitanteEsPaciente, formData.solicitanteNombre, formData.solicitanteTelefono, formData.solicitanteCelular, formData.solicitanteDireccion, formData.solicitanteOcupacion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSustanciaToggle = (sustancia: string) => {
    setFormData(prev => {
      const current = [...prev.sustancias];
      if (current.includes(sustancia)) {
        return { ...prev, sustancias: current.filter(s => s !== sustancia) };
      } else {
        return { ...prev, sustancias: [...current, sustancia] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Preparar sustancias finales (incluyendo 'Otros' si aplica)
    const sustanciasFinales = [...formData.sustancias];
    if (formData.otraSustancia) {
      sustanciasFinales.push(`OTRO: ${formData.otraSustancia}`);
    }

    try {
      await apiClient.post('/admisiones/primer-contacto', {
        ...formData,
        sustancias: sustanciasFinales
      });
      alert('Registro de Primer Contacto guardado exitosamente');
      setFormData(INITIAL_STATE);
      setSolicitanteEsPaciente(false);
      navigate('/admisiones/dashboard');
    } catch (error) {
      console.error('Error saving First Contact:', error);
      alert('Hubo un error al guardar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    marginTop: '0.25rem'
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569'
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
      <AccordionSection 
        title="1. Información General" 
        icon={<ClipboardList size={22} />} 
        isOpen={openSection === 0} 
        onToggle={() => setOpenSection(openSection === 0 ? -1 : 0)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Atendido por</label>
            <input 
              style={{ ...inputStyle, backgroundColor: '#f1f5f9' }} 
              value={`${usuario?.nombre} ${usuario?.apellidos}`} 
              disabled 
            />
          </div>
          <div>
            <label style={labelStyle}>Fuente de Referencia</label>
            <select name="fuenteReferencia" style={inputStyle} onChange={handleChange} required>
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

      {/* SECCIÓN 2: DATOS DEL SOLICITANTE */}
      <AccordionSection 
        title="2. Datos del Solicitante" 
        icon={<User size={22} />} 
        isOpen={openSection === 1} 
        onToggle={() => setOpenSection(openSection === 1 ? -1 : 1)}
      >
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="solicitanteEsPaciente" 
            checked={solicitanteEsPaciente}
            onChange={(e) => setSolicitanteEsPaciente(e.target.checked)}
          />
          <label htmlFor="solicitanteEsPaciente" style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6', cursor: 'pointer' }}>
            El solicitante es el paciente
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Nombre Completo</label>
            <input name="solicitanteNombre" style={inputStyle} onChange={handleChange} required />
          </div>
          <div>
            <label style={labelStyle}>Teléfono Local</label>
            <input name="solicitanteTelefono" style={inputStyle} onChange={handleChange} />
          </div>
          <div>
            <label style={labelStyle}>Celular</label>
            <input name="solicitanteCelular" style={inputStyle} onChange={handleChange} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Dirección</label>
            <input name="solicitanteDireccion" style={inputStyle} onChange={handleChange} />
          </div>
          <div>
            <label style={labelStyle}>Ocupación</label>
            <input name="solicitanteOcupacion" style={inputStyle} onChange={handleChange} />
          </div>
          <div>
            <label style={labelStyle}>Relación con el Paciente</label>
            <input name="relacionPaciente" style={inputStyle} onChange={handleChange} required disabled={solicitanteEsPaciente} value={solicitanteEsPaciente ? 'EL MISMO' : formData.relacionPaciente} />
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 3: DATOS DEL PACIENTE */}
      <AccordionSection 
        title="3. Datos del Paciente (Prospecto)" 
        icon={<User size={22} />} 
        isOpen={openSection === 2} 
        onToggle={() => setOpenSection(openSection === 2 ? -1 : 2)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Nombre(s)</label>
            <input name="nombrePaciente" style={inputStyle} onChange={handleChange} required value={formData.nombrePaciente} />
          </div>
          <div>
            <label style={labelStyle}>Ap. Paterno</label>
            <input name="apellidoPaterno" style={inputStyle} onChange={handleChange} required value={formData.apellidoPaterno} />
          </div>
          <div>
            <label style={labelStyle}>Ap. Materno</label>
            <input name="apellidoMaterno" style={inputStyle} onChange={handleChange} value={formData.apellidoMaterno} />
          </div>
          <div>
            <CustomDatePicker 
              label="F. Nacimiento" 
              selected={formData.fechaNacimiento ? parseISO(formData.fechaNacimiento) : null} 
              onChange={(date) => {
                setFormData(prev => ({ 
                  ...prev, 
                  fechaNacimiento: date ? format(date, 'yyyy-MM-dd') : '' 
                }));
              }} 
              required 
            />
          </div>
          <div>
            <label style={labelStyle}>Edad Calculada</label>
            <input style={{ ...inputStyle, backgroundColor: '#f8fafc' }} value={edad !== null ? `${edad} años` : '--'} disabled />
          </div>
          <div>
            <label style={labelStyle}>Sexo</label>
            <select name="sexo" style={inputStyle} onChange={handleChange} value={formData.sexo}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado Civil</label>
            <select name="estadoCivil" style={inputStyle} onChange={handleChange}>
              <option value="">Seleccione...</option>
              <option value="SOLTERO">Soltero(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="UNION_LIBRE">Unión Libre</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="VIUDO">Viudo(a)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hijos</label>
            <input type="number" name="hijos" style={inputStyle} onChange={handleChange} value={formData.hijos} />
          </div>
          <div>
            <label style={labelStyle}>Escolaridad</label>
            <select name="escolaridad" style={inputStyle} onChange={handleChange}>
              <option value="">Seleccione...</option>
              <option value="PRIMARIA">Primaria</option>
              <option value="SECUNDARIA">Secundaria</option>
              <option value="PREPARATORIA">Preparatoria</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="POSTGRADO">Postgrado</option>
              <option value="NINGUNA">Ninguna</option>
            </select>
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 4: SUSTANCIAS */}
      <AccordionSection 
        title="4. Sustancias de Consumo" 
        icon={<Activity size={22} />} 
        isOpen={openSection === 3} 
        onToggle={() => setOpenSection(openSection === 3 ? -1 : 3)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {SUSTANCIAS_LIST.map(sustancia => (
            <div key={sustancia} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem',
              borderRadius: '8px',
              border: formData.sustancias.includes(sustancia) ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              backgroundColor: formData.sustancias.includes(sustancia) ? '#eff6ff' : 'white',
              cursor: 'pointer'
            }} onClick={() => handleSustanciaToggle(sustancia)}>
              <input 
                type="checkbox" 
                checked={formData.sustancias.includes(sustancia)} 
                onChange={() => {}} // Manejado por el click en el div
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{sustancia}</span>
            </div>
          ))}
          <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
            <label style={labelStyle}>Otros (especificar)</label>
            <input 
              name="otraSustancia" 
              placeholder="Ej: Inhalantes, Solventes..." 
              style={inputStyle} 
              onChange={handleChange} 
              value={formData.otraSustancia}
            />
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 5: EVALUACIÓN RÁPIDA */}
      <AccordionSection 
        title="5. Evaluación Rápida" 
        icon={<ClipboardList size={22} />} 
        isOpen={openSection === 4} 
        onToggle={() => setOpenSection(openSection === 4 ? -1 : 4)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>¿Está dispuesto a internarse?</label>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
              {['SI', 'NO', 'DUDA'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" name="dispuestoInternarse" value={opt} checked={formData.dispuestoInternarse === opt} onChange={handleChange} /> 
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <label style={labelStyle}>¿Requiere intervención?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '14px' }}><input type="radio" name="requiereIntervencion" value="true" checked={formData.requiereIntervencion === true} onChange={() => setFormData(p => ({...p, requiereIntervencion: true}))} /> Sí</label>
                <label style={{ fontSize: '14px' }}><input type="radio" name="requiereIntervencion" value="false" checked={formData.requiereIntervencion === false} onChange={() => setFormData(p => ({...p, requiereIntervencion: false}))} /> No</label>
              </div>
            </div>
            <div>
              <label style={labelStyle}>¿Tiene tratamiento previo?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '14px' }}><input type="radio" name="estadoPrevioTratamiento" value="true" checked={formData.estadoPrevioTratamiento === true} onChange={() => setFormData(p => ({...p, estadoPrevioTratamiento: true}))} /> Sí</label>
                <label style={{ fontSize: '14px' }}><input type="radio" name="estadoPrevioTratamiento" value="false" checked={formData.estadoPrevioTratamiento === false} onChange={() => setFormData(p => ({...p, estadoPrevioTratamiento: false}))} /> No</label>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* SECCIÓN 6: OBSERVACIONES GENERALES */}
      <AccordionSection 
        title="6. Observaciones Generales" 
        icon={<MessageSquare size={22} />} 
        isOpen={openSection === 5} 
        onToggle={() => setOpenSection(openSection === 5 ? -1 : 5)}
      >
        <label style={labelStyle}>Actitud del solicitante y contexto inicial</label>
        <textarea 
          name="observaciones" 
          rows={4} 
          style={inputStyle} 
          onChange={handleChange} 
          placeholder="Describa la actitud, dudas o peticiones especiales..."
        />
      </AccordionSection>

      {/* SECCIÓN 7: PERFIL ECONÓMICO */}
      <AccordionSection 
        title="7. Perfil Económico" 
        icon={<DollarSign size={22} />} 
        isOpen={openSection === 6} 
        onToggle={() => setOpenSection(openSection === 6 ? -1 : 6)}
      >
        <label style={labelStyle}>Posibilidades de pago / Subsidios</label>
        <textarea 
          name="posibilidadesEconomicas" 
          rows={3} 
          style={inputStyle} 
          onChange={handleChange} 
          placeholder="Mencione si requiere beca, subsidio o si cuenta con recursos propios..."
        />
      </AccordionSection>

      {/* SECCIÓN 8: SEGUIMIENTO Y ACUERDOS */}
      <AccordionSection 
        title="8. Seguimiento y Acuerdos" 
        icon={<ClipboardList size={22} />} 
        isOpen={openSection === 7} 
        onToggle={() => setOpenSection(openSection === 7 ? -1 : 7)}
      >
        <label style={labelStyle}>Acción acordada</label>
        <select name="acuerdo" style={inputStyle} onChange={handleChange} required>
          <option value="">Seleccione acción...</option>
          <option value="LLAMAR_NOSOTROS">Llamar nosotros</option>
          <option value="ESPERAR_LLAMADA">Esperar llamada</option>
          <option value="PROGRAMO_VISITA">Programó visita</option>
          <option value="INGRESO_INMINENTE">Ingreso inminente</option>
          <option value="DESCARTADO">Descartado</option>
        </select>
      </AccordionSection>


      {/* BOTONES DE ACCIÓN */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '2rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        border: '1px solid #e2e8f0'
      }}>
        <button 
          type="button"
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '10px', 
            border: '1px solid #cbd5e1',
            background: 'white',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
        <button 
          type="submit"
          disabled={isSubmitting}
          style={{ 
            padding: '0.75rem 2rem', 
            borderRadius: '10px', 
            border: 'none',
            background: isSubmitting ? '#94a3b8' : '#3b82f6',
            color: 'white',
            fontWeight: '700',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
          }}
        >
          {isSubmitting ? 'Guardando...' : <><Save size={18} /> Guardar Primer Contacto</>}
        </button>
      </div>

    </form>
  );
};
