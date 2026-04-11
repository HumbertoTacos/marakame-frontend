import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  History, 
  Activity, 
  Brain, 
  FileCheck, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle,
  Printer,
  Upload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import apiClient from '../../services/api';
import { useValoracionMedicaStore } from '../../stores/formDraftStore';

const CIE10_COMMON = [
  { code: 'F10', label: 'F10 - Trastornos por consumo de Alcohol' },
  { code: 'F12', label: 'F12 - Trastornos por consumo de Cannabinoides' },
  { code: 'F14', label: 'F14 - Trastornos por consumo de Cocaína' },
  { code: 'F15', label: 'F15 - Trastornos por consumo de Estimulantes / Cristal' },
  { code: 'F17', label: 'F17 - Trastornos por consumo de Tabaco' },
  { code: 'F63.0', label: 'F63.0 - Ludopatía (Juego patológico)' },
];

interface Props {
  pacienteId: number;
  onSuccess?: () => void;
}

export const ValoracionMedicaForm: React.FC<Props> = ({ pacienteId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCIE10Other, setIsCIE10Other] = useState(false);
  const [fileFirmado, setFileFirmado] = useState<File | null>(null);
  const [pacienteData, setPacienteData] = useState<any>(null);

  // Zustand Store Persistence
  const { 
    formData, activeTab, lastUpdated,
    setFormData, setActiveTab, resetForm 
  } = useValoracionMedicaStore();

  // 10-Minute Expiration Logic
  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - lastUpdated > TEN_MINUTES) {
      resetForm();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Manejo de campos anidados (Json)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      const parentData = formData[parent as keyof typeof formData];
      setFormData({
        [parent]: {
          ...(parentData as any),
          [child]: value
        }
      });
    } else {
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setFormData({ [name]: val });
    }
  };

  useEffect(() => {
    // Cargar datos básicos del paciente para el PDF (No persistente en store)
    const fetchPaciente = async () => {
      try {
        const response = await apiClient.get(`/admisiones/primer-contacto/${pacienteId}`);
        if (response.data.success) {
          setPacienteData(response.data.data.paciente);
        }
      } catch (err) {
        console.error('Error fetching paciente data:', err);
      }
    };
    fetchPaciente();
  }, [pacienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDACIÓN ESTRICTA: Decisión Médica
    if (formData.esAptoParaIngreso === null) {
      alert('Debes seleccionar explícitamente si el paciente es Apto o No Apto antes de guardar.');
      return;
    }

    setIsSubmitting(true);

    const clinicalData = {
      pacienteId,
      padecimientoActual: `MOTIVO: ${formData.motivoConsulta}\nEVOLUCIÓN: ${formData.evolucionEstado}\nFACTORES: ${formData.factoresDesencadenantes}`,
      antecedentes: formData.antecedentes,
      signosVitales: formData.signosVitales,
      exploracionFisica: formData.exploracionFisica,
      examenMental: formData.examenMental,
      diagnosticoCIE10: isCIE10Other ? formData.diagnosticoOtro : formData.diagnosticoCIE10,
      pronostico: formData.pronostico,
      tratamientoSugerido: formData.tratamientoSugerido,
      esAptoParaIngreso: formData.esAptoParaIngreso
    };

    const finalFormData = new FormData();
    finalFormData.append('data', JSON.stringify(clinicalData));
    if (fileFirmado) {
      finalFormData.append('archivo', fileFirmado);
    }

    try {
      await apiClient.post('/admisiones/valoracion-medica', finalFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Valoración Médica (Digital + Física) guardada exitosamente.');
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving medical valuation:', error);
      alert('Hubo un error al guardar la valoración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // --- ENCABEZADO FORMAL ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTITUTO MARAKAME', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text('DEPARTAMENTO MÉDICO', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(14);
    doc.text('HOJA DE VALORACIÓN MÉDICA', 105, y, { align: 'center' });
    y += 15;

    // --- DATOS DEL PACIENTE ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const nombreFull = pacienteData ? `${pacienteData.nombre} ${pacienteData.apellidoPaterno} ${pacienteData.apellidoMaterno}` : '---';
    doc.text(`PACIENTE: ${nombreFull}`, margin, y);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 150, y);
    y += 10;
    doc.line(margin, y, 190, y);
    y += 10;

    // --- CONTENIDO CLÍNICO ---
    const addSection = (title: string, content: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content || 'Sin reporte', 170);
      doc.text(lines, margin, y);
      y += (lines.length * 5) + 8;
      
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
    };

    addSection('PADECIMIENTO ACTUAL:', `MOTIVO: ${formData.motivoConsulta}\nEVOLUCIÓN: ${formData.evolucionEstado}`);
    addSection('SIGNOS VITALES:', `TA: ${formData.signosVitales.ta} | FC: ${formData.signosVitales.fc} | FR: ${formData.signosVitales.fr} | TEMP: ${formData.signosVitales.temp}°C | PESO: ${formData.signosVitales.peso}kg`);
    addSection('EXPLORACIÓN FÍSICA:', formData.exploracionFisica);
    addSection('EXAMEN MENTAL:', `Aspecto: ${formData.examenMental.aspectoGeneral}\nAfectividad: ${formData.examenMental.afectividad}`);
    addSection('DIAGNÓSTICO CIE-10:', isCIE10Other ? formData.diagnosticoOtro : formData.diagnosticoCIE10);
    addSection('DICTRÁMEN:', formData.esAptoParaIngreso ? 'APTO PARA INGRESO' : 'NO APTO PARA INGRESO');

    // --- ESPACIO PARA FIRMA ---
    y = 260;
    doc.line(70, y, 140, y);
    y += 5;
    doc.setFontSize(10);
    doc.text('FIRMA Y CÉDULA DEL MÉDICO', 105, y, { align: 'center' });

    // Descargar
    const fileName = `VALORACION_PACIENTE_${pacienteId}_${new Date().toLocaleDateString('es-MX').replace(/\//g,'')}.pdf`;
    doc.save(fileName);
  };

  const tabs = [
    { title: 'Padecimiento', icon: <Stethoscope size={18} /> },
    { title: 'Antecedentes', icon: <History size={18} /> },
    { title: 'Examen Físico', icon: <Activity size={18} /> },
    { title: 'Examen Mental', icon: <Brain size={18} /> },
    { title: 'Resolución', icon: <FileCheck size={18} /> },
  ];

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    marginTop: '0.25rem',
    fontSize: '14px'
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
    display: 'block',
    marginBottom: '4px'
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden' }}>
      {/* Header de Pestañas */}
      <div style={{ display: 'flex', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              flex: 1,
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              border: 'none',
              background: activeTab === idx ? 'white' : 'transparent',
              color: activeTab === idx ? '#3b82f6' : '#64748b',
              fontWeight: activeTab === idx ? '800' : '600',
              cursor: 'pointer',
              borderBottom: activeTab === idx ? '3px solid #3b82f6' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '12px' }}>{tab.title}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
        
        {/* TAB 1: PADECIMIENTO ACTUAL */}
        {activeTab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Motivo de consulta</label>
              <textarea name="motivoConsulta" style={inputStyle} rows={3} onChange={handleChange} required placeholder="¿Por qué acude al centro?" />
            </div>
            <div>
              <label style={labelStyle}>Evolución y estado actual (Patrón de consumo)</label>
              <textarea name="evolucionEstado" style={inputStyle} rows={4} onChange={handleChange} required placeholder="Tiempo de consumo, frecuencia, última dosis..." />
            </div>
            <div>
              <label style={labelStyle}>Factores desencadenantes</label>
              <textarea name="factoresDesencadenantes" style={inputStyle} rows={2} onChange={handleChange} placeholder="Eventos que dispararon la crisis actual..." />
            </div>
          </div>
        )}

        {/* TAB 2: ANTECEDENTES */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#c2410c', border: '1px solid #fed7aa' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '12px', fontWeight: '600' }}>El médico debe interrogar activamente. No asuma faltas de antecedentes sin preguntar.</span>
            </div>
            <div>
              <label style={labelStyle}>Heredofamiliares</label>
              <textarea name="antecedentes.heredofamiliares" style={inputStyle} rows={3} onChange={handleChange} placeholder="Diabetes, HTAs, Adicciones en la familia..." />
            </div>
            <div>
              <label style={labelStyle}>Personales Patológicos</label>
              <textarea name="antecedentes.personalesPatologicos" style={inputStyle} rows={3} onChange={handleChange} placeholder="Cirugías, alergias, enfermedades crónicas..." />
            </div>
            <div>
              <label style={labelStyle}>Historial Psiquiátrico / Psicología</label>
              <textarea name="antecedentes.psiquiatricos" style={inputStyle} rows={3} onChange={handleChange} placeholder="Diagnósticos previos, intentos de suicidio, fármacos..." />
            </div>
          </div>
        )}

        {/* TAB 3: EXPLORACIÓN FÍSICA Y SIGNOS */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '16px' }}>
              <div>
                <label style={labelStyle}>Tensión Arterial</label>
                <input name="signosVitales.ta" style={inputStyle} placeholder="120/80" onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle}>Frec. Cardiaca (lpm)</label>
                <input type="number" name="signosVitales.fc" style={inputStyle} onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle}>Frec. Respiratoria (rpm)</label>
                <input type="number" name="signosVitales.fr" style={inputStyle} onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle}>Temperatura (°C)</label>
                <input type="number" step="0.1" name="signosVitales.temp" style={inputStyle} onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle}>Peso (kg)</label>
                <input type="number" step="0.1" name="signosVitales.peso" style={inputStyle} onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle}>Talla (cm)</label>
                <input type="number" name="signosVitales.talla" style={inputStyle} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Exploración y auscultación general</label>
              <textarea name="exploracionFisica" style={inputStyle} rows={5} onChange={handleChange} placeholder="Cabeza, cuello, tórax, abdomen, extremidades..." />
            </div>
          </div>
        )}

        {/* TAB 4: EXAMEN MENTAL (IDX 3) */}
        {activeTab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Aspecto General</label>
              <textarea name="examenMental.aspectoGeneral" style={inputStyle} rows={2} onChange={handleChange} placeholder="Higiene, vestimenta, actitud ante la entrevista..." />
            </div>
            <div>
              <label style={labelStyle}>Psicomotricidad</label>
              <textarea name="examenMental.psicomotricidad" style={inputStyle} rows={2} onChange={handleChange} placeholder="Marcha, tics, inquietud, lentitud..." />
            </div>
            <div>
              <label style={labelStyle}>Afectividad</label>
              <textarea name="examenMental.afectividad" style={inputStyle} rows={2} onChange={handleChange} placeholder="Euforia, labilidad, aplanamiento..." />
            </div>
            <div>
              <label style={labelStyle}>Ideación / Conciencia</label>
              <textarea name="examenMental.ideacion" style={inputStyle} rows={2} onChange={handleChange} placeholder="Delirios, obsesiones, conciencia de enfermedad..." />
            </div>
          </div>
        )}

        {/* TAB 5: RESOLUCIÓN (IDX 4) */}
        {activeTab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ padding: '2rem', backgroundColor: '#f0fdf4', borderRadius: '24px', border: '1px solid #bbf7d0' }}>
              <label style={{ ...labelStyle, fontSize: '16px', color: '#166534', textAlign: 'center', marginBottom: '1.5rem' }}>
                ¿CUMPLE CRITERIOS Y ES APTO PARA INGRESO?
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                <button 
                  type="button"
                  onClick={() => setFormData({ esAptoParaIngreso: true })}
                  style={{
                    padding: '1.5rem 3rem',
                    borderRadius: '16px',
                    border: formData.esAptoParaIngreso === true ? '4px solid #10b981' : '1px solid #d1d5db',
                    backgroundColor: formData.esAptoParaIngreso === true ? '#dcfce7' : 'white',
                    fontWeight: '800',
                    fontSize: '18px',
                    color: formData.esAptoParaIngreso === true ? '#166534' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  APTO ✅
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({ esAptoParaIngreso: false })}
                  style={{
                    padding: '1.5rem 3rem',
                    borderRadius: '16px',
                    border: formData.esAptoParaIngreso === false ? '4px solid #ef4444' : '1px solid #d1d5db',
                    backgroundColor: formData.esAptoParaIngreso === false ? '#fee2e2' : 'white',
                    fontWeight: '800',
                    fontSize: '18px',
                    color: formData.esAptoParaIngreso === false ? '#991b1b' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  NO APTO ❌
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Diagnóstico CIE-10 Principal</label>
                <select 
                  name="diagnosticoCIE10" 
                  style={inputStyle} 
                  onChange={(e) => {
                    handleChange(e);
                    setIsCIE10Other(e.target.value === 'OTRO');
                  }}
                >
                  <option value="">Seleccione código...</option>
                  {CIE10_COMMON.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  <option value="OTRO">OTRO (Especificar...)</option>
                </select>
                {isCIE10Other && (
                  <input name="diagnosticoOtro" style={{ ...inputStyle, marginTop: '1rem' }} placeholder="Escriba el código o diagnóstico..." onChange={handleChange} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Pronóstico</label>
                <textarea name="pronostico" style={inputStyle} rows={3} onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle}>Tratamiento sugerido</label>
                <textarea name="tratamientoSugerido" style={inputStyle} rows={3} onChange={handleChange} />
              </div>
            </div>

            {/* SECCIÓN PHYigital: GENERACIÓN Y CARGA */}
            <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={20} color="#3b82f6" /> Respaldo Legal y Evidencia
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
                    1. Genera el documento oficial pre-llenado, imprímelo y recaba la firma del médico responsable.
                  </p>
                  <button 
                    type="button"
                    onClick={handleGeneratePDF}
                    style={{ 
                      width: '100%',
                      padding: '1rem', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: '#6366f1', 
                      color: 'white', 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Printer size={20} /> Generar PDF para Firma
                  </button>
                </div>

                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
                    2. Escanea o toma una foto de la valoración firmada y súbela aquí (Obligatorio).
                  </p>
                  <label style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: fileFirmado ? '2px solid #10b981' : '2px dashed #3b82f6',
                    backgroundColor: fileFirmado ? '#f0fdf4' : '#eff6ff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <Upload size={24} color={fileFirmado ? '#10b981' : '#3b82f6'} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: fileFirmado ? '#166534' : '#3b82f6' }}>
                      {fileFirmado ? fileFirmado.name : 'Seleccionar Archivo Firmado'}
                    </span>
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      onChange={(e) => setFileFirmado(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN ENTRE TABS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <button 
            type="button" 
            disabled={activeTab === 0}
            onClick={() => setActiveTab(activeTab - 1)}
            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', cursor: activeTab === 0 ? 'not-allowed' : 'pointer', opacity: activeTab === 0 ? 0.5 : 1 }}
          >
            <ArrowLeft size={18} /> Anterior
          </button>
          
          {activeTab < 4 ? (
            <button 
              type="button"
              onClick={() => setActiveTab(activeTab + 1)}
              style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer' }}
            >
              Siguiente <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              type="submit"
              disabled={isSubmitting || !fileFirmado || formData.esAptoParaIngreso === null}
              style={{ padding: '0.75rem 3rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '10px', border: 'none', background: (isSubmitting || !fileFirmado || formData.esAptoParaIngreso === null) ? '#94a3b8' : '#10b981', color: 'white', fontWeight: '800', cursor: (isSubmitting || !fileFirmado || formData.esAptoParaIngreso === null) ? 'not-allowed' : 'pointer', boxShadow: '0 10px 15px -3px rgba(16,185,129,0.3)' }}
            >
              {isSubmitting ? 'Guardando...' : <><Save size={20} /> Guardar Valoración Médica</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
