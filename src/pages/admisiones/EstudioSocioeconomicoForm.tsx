import React, { useEffect, useState } from 'react';
import { useEstudioSocioeconomicoStore } from '../../stores/formDraftStore';
import { 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  User, 
  Home, 
  DollarSign, 
  HeartPulse, 
  Utensils 
} from 'lucide-react';
import apiClient from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

const SECCIONES = [
  'I. Identificación del Entrevistado',
  'II. Motivo de Consulta',
  'III. Datos del Paciente (Lectura)',
  'IV. Composición Familiar',
  'V. Dinámica Familiar',
  'VI. Ingresos Económicos Familiares',
  'VII. Egresos Mensuales',
  'VIII. Área Escolar',
  'IX. Área de Salud',
  'X. Área Laboral',
  'XI. Vivienda',
  'XII. Alimentación'
];

const FRECUENCIAS = ['Diario', 'Semanal', 'Quincenal', 'Rara vez'];
const ALIMENTOS_LIST = [
  { key: 'carnes', label: 'Carnes (Res/Pollo/Pescado)' },
  { key: 'lacteos', label: 'Leche y Lácteos' },
  { key: 'huevos', label: 'Huevos' },
  { key: 'verduras', label: 'Verduras' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'cereales', label: 'Cereales y Tubérculos' },
  { key: 'leguminosas', label: 'Leguminosas (Frijoles, Lentejas)' }
];

export function EstudioSocioeconomicoForm({ pacienteId }: { pacienteId: number }) {
  const navigate = useNavigate();
  const [pacienteMaster, setPacienteMaster] = useState<any>(null);

  // Zustand Store Persistence
  const { 
    datos, seccionActual, lastUpdated,
    setDatos, setSeccionActual, resetForm 
  } = useEstudioSocioeconomicoStore();

  // 10-Minute Expiration Logic
  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - lastUpdated > TEN_MINUTES) {
      resetForm();
    }
  }, []);

  // Precarga de Datos Maestros del Paciente (SST)
  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const res = await apiClient.get(`/pacientes/${pacienteId}`);
        if (res.data.success) {
          setPacienteMaster(res.data.data);
        }
      } catch (err) {
        console.error('Error al precargar datos del paciente:', err);
      }
    };
    fetchPaciente();

    // Intentar cargar estudio previo
    const fetchEstudio = async () => {
      try {
        const res = await apiClient.get(`/admisiones/estudio/paciente/${pacienteId}`);
        if (res.data.success && res.data.data) {
          setDatos(res.data.data.datos);
          setSeccionActual(res.data.data.seccionActual);
        }
      } catch (err) {
        console.error('Error al cargar estudio previo:', err);
      }
    };
    fetchEstudio();
  }, [pacienteId]);

  const guardarEstudio = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admisiones/estudio', {
        pacienteId,
        datos: payload,
        seccionActual,
        completado: seccionActual === SECCIONES.length - 1
      });
    },
    onSuccess: () => {
      if (seccionActual === SECCIONES.length - 1) {
        alert('Estudio Socioeconómico finalizado y guardado exitosamente.');
        resetForm();
        navigate('/admisiones/dashboard');
      } else {
        // Guardado silencioso de progreso o feedback visual suave
        console.log('Progreso guardado en DB');
      }
    }
  });

  const handleSave = () => {
    guardarEstudio.mutate(datos);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;
    setDatos({ [name]: val });
  };

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold', fontSize: '14px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' };
  const readonlyStyle: React.CSSProperties = { ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', height: '100%', alignItems: 'flex-start', padding: '1rem' }}>
      
      {/* Sidebar de Navegación */}
      <div style={{ 
        width: '340px', 
        background: 'white', 
        borderRadius: '20px', 
        padding: '1.5rem', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: '1rem',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#1e293b' }}>
          <FileText size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
          Secciones
        </h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {SECCIONES.map((seccion, idx) => (
            <li 
              key={idx}
              onClick={() => setSeccionActual(idx)}
              style={{
                padding: '0.85rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: seccionActual === idx ? '#3b82f6' : 'transparent',
                color: seccionActual === idx ? 'white' : '#64748b',
                fontWeight: seccionActual === idx ? '700' : '500',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seccion}</span>
              {seccionActual === idx && <ChevronRight size={14} />}
            </li>
          ))}
        </ul>
      </div>

      {/* Área del Formulario */}
      <div style={{ flex: 1, background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <span style={{ color: '#3b82f6', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>Estudio Socioeconómico / {SECCIONES[seccionActual]}</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0.5rem 0' }}>Captura de Información</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button 
              onClick={() => setSeccionActual(prev => Math.max(0, prev - 1))}
              disabled={seccionActual === 0}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}
            >
              Anterior
            </button>
            <button 
              onClick={handleSave}
              disabled={guardarEstudio.isPending}
              style={{ padding: '0.75rem 2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              {guardarEstudio.isPending ? 'Guardando...' : 'Guardar Progreso'}
            </button>
          </div>
        </div>

        {/* CONTENIDO DINÁMICO POR SECCIÓN */}
        
        {/* SECCIÓN 1: IDENTIFICACIÓN */}
        {seccionActual === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
               <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: '700', marginBottom: '1rem' }}>
                <User size={18} /> Datos del Entrevistado
              </h4>
            </div>
            <div>
              <label style={labelStyle}>Nombre Completo</label>
              <input name="entrevistadoNombre" value={datos.entrevistadoNombre || ''} onChange={handleInputChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Parentesco con Paciente</label>
              <select name="parentesco" value={datos.parentesco || ''} onChange={handleInputChange} style={inputStyle}>
                <option value="">Seleccione...</option>
                <option value="MADRE">Madre</option>
                <option value="PADRE">Padre</option>
                <option value="ESPOSO_A">Esposo(a)</option>
                <option value="HIJO_A">Hijo(a)</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Teléfono de Contacto</label>
              <input name="entrevistadoTel" value={datos.entrevistadoTel || ''} onChange={handleInputChange} style={inputStyle} />
            </div>
          </div>
        )}

        {/* SECCIÓN 3: DATOS PACIENTE (READ ONLY - SST) */}
        {seccionActual === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ gridColumn: 'span 2', padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe', marginBottom: '1rem' }}>
              <p style={{ color: '#1e40af', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Estos datos provienen del expediente maestro. Para cambios, diríjase a la edición del Paciente.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Nombre(s)</label>
              <input value={pacienteMaster?.nombre || ''} readOnly style={readonlyStyle} />
            </div>
            <div>
              <label style={labelStyle}>Apellidos</label>
              <input value={`${pacienteMaster?.apellidoPaterno || ''} ${pacienteMaster?.apellidoMaterno || ''}`} readOnly style={readonlyStyle} />
            </div>
            <div>
              <label style={labelStyle}>CURP</label>
              <input value={pacienteMaster?.curp || ''} readOnly style={readonlyStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sexo</label>
              <input value={pacienteMaster?.sexo === 'M' ? 'Masculino' : 'Femenino'} readOnly style={readonlyStyle} />
            </div>
          </div>
        )}

        {/* SECCIÓN 6: INGRESOS FAMILIARES */}
        {seccionActual === 5 && (
          <div style={{ maxWidth: '600px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: '700', marginBottom: '1.5rem' }}>
              <DollarSign size={20} /> Rangos de Ingreso Económico
            </h4>
            <div style={{ padding: '2rem', backgroundColor: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
              <label style={labelStyle}>Ingresos Totales Mensuales Familiares*</label>
              <select 
                name="ingresoMensualRango" 
                value={datos.ingresoMensualRango || ''} 
                onChange={handleInputChange} 
                style={{ ...inputStyle, padding: '1rem', fontWeight: '700', fontSize: '16px' }}
              >
                <option value="">Seleccione rango...</option>
                <option value="$0 - $5,000">$0 - $5,000</option>
                <option value="$5,001 - $10,000">$5,001 - $10,000</option>
                <option value="$10,001 - $15,000">$10,001 - $15,000</option>
                <option value="Más de $15,000">Más de $15,000</option>
              </select>
              <p style={{ fontSize: '12px', color: '#166534', marginTop: '1rem', fontStyle: 'italic' }}>* Este rango se utilizará para tabular la cuota de recuperación.</p>
            </div>
          </div>
        )}

        {/* SECCIÓN 7: EGRESOS MENSUALES (CALCULADOS) */}
        {seccionActual === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <h4 style={{ color: '#334155', fontWeight: '700', marginBottom: '1rem' }}>Egresos Estimados (Cifras Mensuales)</h4>
            </div>
            <div>
              <label style={labelStyle}>Agua</label>
              <input type="number" name="egresoAgua" value={datos.egresoAgua || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Luz</label>
              <input type="number" name="egresoLuz" value={datos.egresoLuz || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Gas</label>
              <input type="number" name="egresoGas" value={datos.egresoGas || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Renta / Hipoteca</label>
              <input type="number" name="egresoRentaHipoteca" value={datos.egresoRentaHipoteca || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Alimentación</label>
              <input type="number" name="egresoAlimentacion" value={datos.egresoAlimentacion || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Transporte</label>
              <input type="number" name="egresoTransporte" value={datos.egresoTransporte || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Vestido / Calzado</label>
              <input type="number" name="egresoVestido" value={datos.egresoVestido || ''} onChange={handleInputChange} style={inputStyle} placeholder="0.00" />
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
              <label style={{ ...labelStyle, color: '#9a3412' }}>Esparcimientos (Obligatorio)*</label>
              <input type="number" name="egresoEsparcimientos" value={datos.egresoEsparcimientos || ''} onChange={handleInputChange} style={{ ...inputStyle, borderColor: '#fdba74' }} placeholder="0.00" />
            </div>
          </div>
        )}

        {/* SECCIÓN 9: SALUD */}
        {seccionActual === 8 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ gridColumn: 'span 2' }}><h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}><HeartPulse size={20} color="#ef4444" /> Área de Salud</h4></div>
            <div>
              <label style={labelStyle}>Institución de Atención Médica</label>
              <select name="saludInstitucion" value={datos.saludInstitucion || ''} onChange={handleInputChange} style={inputStyle}>
                <option value="">Seleccione...</option>
                <option value="IMSS">IMSS</option>
                <option value="ISSSTE">ISSSTE</option>
                <option value="SEDENA">SEDENA / SEMAR</option>
                <option value="PRIVADA">Privada</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Monto de Consulta</label>
              <select name="saludMontoConsulta" value={datos.saludMontoConsulta || ''} onChange={handleInputChange} style={inputStyle}>
                <option value="">Seleccione...</option>
                <option value="0">Gratuita</option>
                <option value="1-200">$1 - $200</option>
                <option value="201-500">$201 - $500</option>
                <option value="más de 500">Más de $500</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>
        )}

        {/* SECCIÓN 11: VIVIENDA */}
        {seccionActual === 10 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
             <div style={{ gridColumn: 'span 2' }}><h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}><Home size={20} color="#6366f1" /> Características de la Vivienda</h4></div>
            <div>
              <label style={labelStyle}>Tipo de Vivienda</label>
              <select name="viviendaTipo" value={datos.viviendaTipo || ''} onChange={handleInputChange} style={inputStyle}>
                <option value="">Seleccione...</option>
                {['Propia', 'Rentada', 'Prestada', 'Sin vivienda', 'Familiar', 'Condominio', 'Residencial'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>¿Tiene más de una vivienda?</label>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                <label style={{ cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="tieneMasDeUnaVivienda" checked={datos.tieneMasDeUnaVivienda === true} onChange={() => setDatos({ tieneMasDeUnaVivienda: true })} /> Sí</label>
                <label style={{ cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="tieneMasDeUnaVivienda" checked={datos.tieneMasDeUnaVivienda === false} onChange={() => setDatos({ tieneMasDeUnaVivienda: false })} /> No</label>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Número de Habitaciones</label>
              <select name="numeroHabitacionesRango" value={datos.numeroHabitacionesRango || ''} onChange={handleInputChange} style={inputStyle}>
                <option value="">Seleccione...</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2 o más">2 o más</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', padding: '1.5rem', backgroundColor: '#f5f3ff', borderRadius: '16px' }}>
              <div>
                <label style={labelStyle}>Material Piso</label>
                <select name="viviendaPiso" value={datos.viviendaPiso || ''} onChange={handleInputChange} style={inputStyle}>
                  <option value="">Seleccione...</option>
                  <option value="TIERRA">Tierra</option>
                  <option value="CEMENTO">Cemento / Firme</option>
                  <option value="LOSETA">Loseta / Cerámica</option>
                  <option value="MADERA">Madera / Otros</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Material Muros</label>
                <select name="viviendaMuros" value={datos.viviendaMuros || ''} onChange={handleInputChange} style={inputStyle}>
                  <option value="">Seleccione...</option>
                  <option value="LADRILLO">Ladrillo / Block</option>
                  <option value="ADOBE">Adobe</option>
                  <option value="MADERA">Madera</option>
                  <option value="LAMINA">Lámina</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Material Techo</label>
                <select name="viviendaTecho" value={datos.viviendaTecho || ''} onChange={handleInputChange} style={inputStyle}>
                  <option value="">Seleccione...</option>
                  <option value="CONCRETO">Concreto / Losa</option>
                  <option value="LAMINA">Lámina</option>
                  <option value="TEJA">Teja</option>
                  <option value="PALMA">Palma / Madera</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 12: ALIMENTACIÓN */}
        {seccionActual === 11 && (
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '1.5rem' }}><Utensils size={20} color="#f59e0b" /> Frecuencia de Consumo de Alimentos</h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#fffbeb' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#92400e' }}>Alimento</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#92400e' }}>Frecuencia de Consumo</th>
                  </tr>
                </thead>
                <tbody>
                  {ALIMENTOS_LIST.map(al => (
                    <tr key={al.key}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: '600', color: '#475569' }}>{al.label}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <select 
                          name={`freq_${al.key}`} 
                          value={datos[`freq_${al.key}`] || ''} 
                          onChange={handleInputChange}
                          style={{ ...inputStyle, padding: '0.5rem' }}
                        >
                          <option value="">Seleccione frecuencia...</option>
                          {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECCIONES RESTANTES (PLACEHOLDERS O GENÉRICOS) */}
        {![0, 2, 5, 6, 8, 10, 11].includes(seccionActual) && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <FileText size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#94a3b8' }}>Sección en Captura Genérica</h3>
            <p style={{ color: '#cbd5e1' }}>Esta sección ({SECCIONES[seccionActual]}) se captura mediante notas generales y campos básicos.</p>
            <textarea 
              name={`obs_seccion_${seccionActual}`}
              value={datos[`obs_seccion_${seccionActual}`] || ''}
              onChange={handleInputChange}
              style={{ ...inputStyle, marginTop: '2rem', height: '200px' }}
              placeholder="Ingrese las observaciones recolectadas para esta sección..."
            />
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
           <button 
              onClick={() => setSeccionActual(prev => Math.min(SECCIONES.length - 1, prev + 1))}
              disabled={seccionActual === SECCIONES.length - 1}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: '700', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              Ir a la Siguiente Sección <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
}
