import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Save,
  Printer,
  Activity,
  User,
  ClipboardList,
  AlertTriangle,
  FileText,
  Loader2,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import apiClient from '../../services/api';
import { useValoracionMedicaStore } from '../../stores/formDraftStore';

interface Props {
  pacienteId: number;
  onSuccess?: () => void;
}

interface PreFillData {
  identificacion: {
    nombreCompleto: string;
    edad: number;
    estadoCivil: string;
    ocupacion: string;
    direccion: string;
    escolaridad: string;
  };
  crm: {
    sustancias: string[];
    edadInicioConsumo: number | null;
    ultimoConsumo: string | null;
    sintomasReportados: string;
  };
}

export const ValoracionMedicaForm: React.FC<Props> = ({ pacienteId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preFillData, setPreFillData] = useState<PreFillData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    formData, setFormData, resetForm
  } = useValoracionMedicaStore();

  // 1. Cargar datos de Pre-Fill
  useEffect(() => {
    const fetchPreFill = async () => {
      try {
        const response = await apiClient.get(`/admisiones/valoracion-medica/${pacienteId}/pre-fill`);
        if (response.data.success) {
          setPreFillData(response.data.data);
          // Opcional: Si el historial de consumo está vacío, pre-llenar con algo del CRM
          if (!formData.historialConsumo && response.data.data.crm.sustancias.length > 0) {
            setFormData({
              historialConsumo: `Sustancias reportadas en CRM: ${response.data.data.crm.sustancias.join(', ')}.\nEdad de inicio: ${response.data.data.crm.edadInicioConsumo || 'No especificada'}.\nÚltimo consumo: ${response.data.data.crm.ultimoConsumo ? new Date(response.data.data.crm.ultimoConsumo).toLocaleDateString() : 'No especificado'}.`
            });
          }
        }
      } catch (err) {
        console.error('Error fetching pre-fill data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreFill();
  }, [pacienteId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.esAptoParaIngreso === null) {
      alert('Debe seleccionar si el paciente es Apto o No Apto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        institucionDestino,
        fechaCanalizacion,
        motivoCanalizacion,
        ...dataSinCanalizacion
      } = formData;

      const response = await apiClient.post('/admisiones/valoracion-medica', {
        ...dataSinCanalizacion,
        pacienteId
      });

      if (response.data.success) {
        alert('Valoración guardada exitosamente. Ahora proceda a imprimir el documento oficial.');
        window.print(); // Disparar impresión oficial
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error saving valuation:', error);
      alert('Error al guardar la valoración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      <span style={{ fontWeight: '700', color: '#64748b' }}>Cargando Estructura Clínica...</span>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '32px',
    padding: '2rem',
    border: '1px solid #f1f5f9',
    boxShadow: 'var(--shadow)',
    marginBottom: '2rem'
  };

  const glassCardStyle: React.CSSProperties = {
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    borderRadius: '32px',
    padding: '2rem',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-lg)',
    marginBottom: '2rem'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1rem',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '900',
    color: '#64748b',
    marginBottom: '0.6rem',
    marginLeft: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    marginTop: '1rem'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>

      {/* HEADER EXCLUSIVO PARA IMPRESIÓN (OCULTO EN WEB) */}
      <div className="hidden print:flex flex-col mb-10 w-full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ width: '220px', height: '90px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Logo Marakame Oficial</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: 0 }}>HISTORIA CLÍNICA DE INGRESO</h1>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', margin: '4px 0 0' }}>SISTEMA DE GESTIÓN CLÍNICA MARAKAME</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Expediente: {pacienteId} • Fecha: {new Date().toLocaleDateString('es-MX')}</p>
          </div>
        </div>
      </div>

      {/* HEADER WEB PREMIUM */}
      <div className="print:hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', backgroundColor: 'white', padding: '1.5rem 2.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', borderRadius: '20px', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)' }}>
            <Stethoscope size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Valoración Médica</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Formato Institucional de Ingreso</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', backgroundColor: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', fontWeight: '800', color: '#475569', cursor: 'pointer', fontSize: '13px' }}
          >
            <Printer size={18} /> Vista Impresión
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* SECCIÓN 1: IDENTIFICACIÓN */}
        <div style={sectionHeaderStyle} className="print:hidden">
          <div style={{ width: '8px', height: '28px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>1. Ficha de Identificación</h2>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Paciente</label>
              <div style={{ ...inputStyle, backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>{preFillData?.identificacion.nombreCompleto}</div>
            </div>
            <div>
              <label style={labelStyle}>Edad</label>
              <div style={{ ...inputStyle, backgroundColor: '#f1f5f9' }}>{preFillData?.identificacion.edad} años</div>
            </div>
            <div>
              <label style={labelStyle}>Estado Civil</label>
              <div style={{ ...inputStyle, backgroundColor: '#f1f5f9' }}>{preFillData?.identificacion.estadoCivil}</div>
            </div>
            <div>
              <label style={labelStyle}>Ocupación</label>
              <div style={{ ...inputStyle, backgroundColor: '#f1f5f9' }}>{preFillData?.identificacion.ocupacion}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Domicilio</label>
              <div style={{ ...inputStyle, backgroundColor: '#f1f5f9', fontSize: '12px' }}>{preFillData?.identificacion.direccion}</div>
            </div>

            {/* NUEVOS CAMPOS INSTITUCIONALES */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Médico Residente / Responsable</label>
              <input
                type="text"
                name="residente"
                value={formData.residente}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Nombre del médico que realiza la valoración..."
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Valoración</label>
              <select name="tipoValoracion" value={formData.tipoValoracion} onChange={handleChange} style={inputStyle}>
                <option value="">Seleccione...</option>
                <option value="PRESENCIAL">PRESENCIAL</option>
                <option value="TELEFONICA">TELEFÓNICA</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha de Valoración</label>
              <input type="date" name="fechaValoracion" value={formData.fechaValoracion} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hora de Valoración</label>
              <input type="time" name="horaValoracion" value={formData.horaValoracion} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INTERROGATORIO */}
        <div style={sectionHeaderStyle} className="print:hidden">
          <div style={{ width: '8px', height: '28px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>2. Interrogatorio</h2>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Motivo de Consulta</label>
              <textarea
                name="motivoConsulta"
                value={formData.motivoConsulta}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '80px' }}
                required
                placeholder="Especifique el motivo principal del ingreso..."
              />
            </div>
            <div>
              <label style={labelStyle}>Padecimiento Actual</label>
              <textarea
                name="padecimientoActual"
                value={formData.padecimientoActual}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '100px' }}
                required
                placeholder="Estado actual del paciente, crisis, síntomas recientes..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="print:block print:space-y-4">
              <div>
                <label style={labelStyle}>Síntomas Generales</label>
                <textarea
                  name="sintomasGenerales"
                  value={formData.sintomasGenerales}
                  onChange={handleChange}
                  style={{ ...inputStyle, minHeight: '80px' }}
                  placeholder="Fiebre, astenia, adinamia, cefaleas..."
                />
              </div>
              <div>
                <label style={labelStyle}>Tratamientos Previos / Actuales</label>
                <textarea
                  name="tratamientosPrevios"
                  value={formData.tratamientosPrevios}
                  onChange={handleChange}
                  style={{ ...inputStyle, minHeight: '80px' }}
                  placeholder="Medicamentos, dosis, tiempo de uso..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: EXPLORACIÓN FÍSICA */}
        <div style={sectionHeaderStyle} className="print:hidden">
          <div style={{ width: '8px', height: '28px', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>3. Exploración Física</h2>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ ...labelStyle, marginBottom: '1rem', color: '#475569' }}>Signos Vitales</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }} className="print:grid-cols-6">
              {[
                { name: 'tensionArterial', label: 'T.A. (mmHg)', ph: '120/80' },
                { name: 'frecuenciaCardiaca', label: 'F.C. (lpm)', ph: '72' },
                { name: 'frecuenciaRespiratoria', label: 'F.R. (rpm)', ph: '18' },
                { name: 'temperatura', label: 'Temp (°C)', ph: '36.5' },
                { name: 'peso', label: 'Peso (Kg)', ph: '75' },
                { name: 'talla', label: 'Talla (cm)', ph: '175' }
              ].map(s => (
                <div key={s.name}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>{s.label}</label>
                  <input type="text" name={s.name} value={(formData as any)[s.name]} onChange={handleChange} style={{ ...inputStyle, padding: '0.6rem' }} placeholder={s.ph} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Exploración y auscultación</label>
            <textarea
              name="exploracionFisicaDesc"
              value={formData.exploracionFisicaDesc}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: '100px' }}
              placeholder="Describa hallazgos por sistemas, integridad neurológica, auscultación cardiopulmonar, etc."
            />
          </div>
        </div>

        {/* BLOQUE FINAL: DIAGNÓSTICO Y CIERRE */}
        <div style={sectionHeaderStyle} className="print:hidden">
          <div style={{ width: '8px', height: '28px', backgroundColor: '#6366f1', borderRadius: '4px' }}></div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: 0 }}>4. Conclusiones y Dictamen</h2>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Examen mental (aspecto general, actitud, aliño, actividad motora, orientación, atención, concentración, funciones cognitivas, etc.):</label>
              <textarea name="examenMental" value={formData.examenMental} onChange={handleChange} style={{ ...inputStyle, minHeight: '120px' }} placeholder="Describa el estado mental actual..." />
            </div>
            <div>
              <label style={labelStyle}>3.- DIAGNOSTICO:</label>
              <textarea name="impresionDiagnostica" value={formData.impresionDiagnostica} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }} placeholder="CIE-10 y descripción diagnóstica..." />
            </div>
            <div>
              <label style={labelStyle}>4.- PRONOSTICO:</label>
              <textarea name="pronostico" value={formData.pronostico} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Evolución esperada del paciente..." />
            </div>
            <div>
              <label style={labelStyle}>5.- TRATAMIENTO SUGERIDO:</label>
              <textarea name="planTratamiento" value={formData.planTratamiento} onChange={handleChange} style={{ ...inputStyle, minHeight: '120px' }} placeholder="Indicaciones médicas iniciales, farmacoterapia, etc." />
            </div>
          </div>
        </div>

        {/* DICTAMEN FINAL */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#111827 45%,#1e293b 100%)', borderRadius: '36px', padding: '3.2rem', marginBottom: '3rem', color: 'white', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 25px 60px rgba(15,23,42,0.28)' }} className="print:bg-white print:border-2 print:border-slate-800 print:text-black">
          <h3 style={{ margin: '0 0 2.2rem', fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '0.04em', textShadow: '0 4px 12px rgba(0,0,0,0.25)' }} className="print:text-black">DICTAMEN MÉDICO DE APTITUD</h3>
          <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '760px', margin: '0 auto' }} className="print:hidden">
            <button
              type="button"
              onClick={() => setFormData({ esAptoParaIngreso: true })}
              style={{ flex: 1, height: '190px', borderRadius: '28px', border: 'none', background: formData.esAptoParaIngreso === true ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', transition: 'all 0.2s', transform: formData.esAptoParaIngreso === true ? 'scale(1.04)' : 'scale(1)', boxShadow: formData.esAptoParaIngreso === true ? '0 18px 35px rgba(16,185,129,.35)' : 'none' }}
            >
              <div style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'center' }}>
                <ShieldCheck size={58} strokeWidth={2.5} />
              </div>
              <div style={{ fontWeight: '900', fontSize: '22px' }}>APTO</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ esAptoParaIngreso: false })}
              style={{ flex: 1, height: '190px', borderRadius: '28px', border: 'none', background: formData.esAptoParaIngreso === false ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', transition: 'all 0.2s', transform: formData.esAptoParaIngreso === false ? 'scale(1.04)' : 'scale(1)', boxShadow: formData.esAptoParaIngreso === false ? '0 18px 35px rgba(239,68,68,.35)' : 'none' }}
            >
              <div style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'center' }}>
                <ShieldX size={58} strokeWidth={2.5} />
              </div>
              <div style={{ fontWeight: '900', fontSize: '22px' }}>NO APTO</div>
            </button>
          </div>
          <div className="hidden print:block" style={{ fontSize: '18px', fontWeight: '900', textDecoration: 'underline' }}>
            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '18px', background: formData.esAptoParaIngreso === true ? 'rgba(16,185,129,.22)' : 'rgba(239,68,68,.22)', fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '0.03em' }} className="print:hidden">
              {formData.esAptoParaIngreso ? 'EL PACIENTE SE CONSIDERA APTO PARA SU INGRESO' : 'EL PACIENTE NO SE CONSIDERA APTO PARA SU INGRESO'}
            </div>
          </div>
        </div>

        {formData.esAptoParaIngreso === false && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '28px',
            padding: '2rem',
            marginBottom: '3rem',
            border: '1px solid #fee2e2',
            boxShadow: 'var(--shadow)'
          }}>
            
            <h3 style={{
              margin: '0 0 1.5rem',
              fontSize: '20px',
              fontWeight: '900',
              color: '#dc2626'
            }}>
              Canalización a Otra Institución
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>

              <div>
                <label style={labelStyle}>Institución Destino</label>
                <input
                  type="text"
                  name="institucionDestino"
                  value={formData.institucionDestino || ''}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Hospital General, Psiquiátrico, etc."
                />
              </div>

              <div>
                <label style={labelStyle}>Fecha de Canalización</label>
                <input
                  type="date"
                  name="fechaCanalizacion"
                  value={formData.fechaCanalizacion || ''}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Motivo</label>
                <textarea
                  name="motivoCanalizacion"
                  value={formData.motivoCanalizacion || ''}
                  onChange={handleChange}
                  style={{ ...inputStyle, minHeight: '100px' }}
                  placeholder="Paciente requiere atención especializada..."
                />
              </div>

            </div>
          </div>
        )}

        {/* FIRMA IMPRESIÓN */}
        <div className="hidden print:flex flex-col items-center mt-20">
          <div style={{ width: '350px', borderBottom: '2px solid #0f172a', marginBottom: '0.5rem' }}></div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Firma y Cédula del Médico Responsable</p>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ textAlign: 'center', marginTop: '4rem' }} className="print:hidden">
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '1.25rem 3rem', borderRadius: '24px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white',
              fontSize: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.4)',
              transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: '1rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={24} /> Guardar Registro Institucional <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
