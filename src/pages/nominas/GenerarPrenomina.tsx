import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import type { Nomina } from '../../types';

// Arreglo de meses para facilitar validaciones y el select
const MESES_DEL_AÑO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const GenerarPreNomina: React.FC = () => {
  const navigate = useNavigate();
  
  // Extraemos también "nominas" para poder validar si ya existe una creada
  const { createNomina, nominas } = useNominaStore();

  const [mes, setMes] = useState('Mayo');
  const [quincena, setQuincena] = useState<1 | 2>(1);
  const [regimen, setRegimen] = useState('CONFIANZA');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert("Por favor adjunta el archivo de CONTPAQi antes de continuar.");
      return;
    }

    // ==========================================
    // 1. LÓGICA DE VALIDACIONES DE TIEMPO
    // ==========================================
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth(); // 0 para Enero, 4 para Mayo...
    const diaActual = fechaActual.getDate();
    const anioActual = fechaActual.getFullYear();
    const mesSeleccionadoIdx = MESES_DEL_AÑO.indexOf(mes);

    // Candado 1.1: No meses pasados
    if (mesSeleccionadoIdx < mesActual) {
      alert("Operación denegada: No puedes generar pre-nóminas de meses anteriores al actual.");
      return;
    }

    // Candado 1.2: No meses futuros (¡El que faltaba!)
    if (mesSeleccionadoIdx > mesActual) {
      alert("Operación denegada: No puedes generar pre-nóminas para meses futuros que aún no comienzan.");
      return;
    }

    // Candado 2: Lógica de Quincenas (sabiendo que estamos en el mes correcto)
    if (diaActual <= 15 && quincena === 2) {
      alert("Operación denegada: Aún estamos en la primera quincena del mes. No puedes adelantar la segunda.");
      return;
    }
    if (diaActual > 15 && quincena === 1) {
      alert("Operación denegada: La primera quincena ya concluyó y debió ser procesada.");
      return;
    }

    // ==========================================
    // 2. VALIDACIÓN ANTI-DUPLICIDAD
    // ==========================================
    const periodoStr = `${quincena}ª Quincena de ${mes} ${anioActual} - ${regimen === 'CONFIANZA' ? 'Confianza' : 'Lista de Raya'}`;
    
    // Buscamos si en nuestro historial ya hay una nómina con ese mismo periodo EXACTO
    const nominaDuplicada = nominas.some((n: Nomina) => n.periodo === periodoStr);
    
    if (nominaDuplicada) {
      alert(`¡Alto! Ya existe una nómina registrada para: "${periodoStr}". No se permiten duplicados.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Mandamos sólo metadata + archivo; los totales y el desglose viven en el archivo de CONTPAQi.
      const formData = new FormData();
      formData.append('periodo', periodoStr);
      formData.append('fechaInicio', new Date(anioActual, mesSeleccionadoIdx, quincena === 1 ? 1 : 16).toISOString());
      formData.append('fechaFin', new Date(anioActual, mesSeleccionadoIdx, quincena === 1 ? 15 : 30).toISOString());
      formData.append('regimen', regimen);
      formData.append('archivo', file);

      await createNomina(formData);
      navigate('/nominas');

    } catch (error: any) {
      console.error("Error al registrar pre-nómina:", error);
      if (error?.response?.status === 401) {
         alert("Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión.");
      } else {
         alert(error?.response?.data?.message || "Hubo un error al registrar la pre-nómina. Revisa la consola.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 0' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button 
            onClick={() => navigate('/nominas')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', padding: 0, marginBottom: '1rem' }}
          >
            <ArrowLeft size={20} /> Volver al Dashboard
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Importar Pre-Nómina</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Sube el borrador de CONTPAQi para iniciar el flujo administrativo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#10b981" /> Configuración del Periodo
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mes</label>
                <select 
                  value={mes} 
                  onChange={(e) => setMes(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  {MESES_DEL_AÑO.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Quincena</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setQuincena(1)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: quincena === 1 ? '#3b82f6' : '#cbd5e1', backgroundColor: quincena === 1 ? '#eff6ff' : 'white', color: quincena === 1 ? '#3b82f6' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>1ª Quin</button>
                  <button type="button" onClick={() => setQuincena(2)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: quincena === 2 ? '#3b82f6' : '#cbd5e1', backgroundColor: quincena === 2 ? '#eff6ff' : 'white', color: quincena === 2 ? '#3b82f6' : '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>2ª Quin</button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Tipo de Nómina (Régimen)
              </label>
              <select 
                value={regimen} 
                onChange={(e) => setRegimen(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', fontWeight: '600', color: '#1e293b' }}
              >
                <option value="CONFIANZA">Personal de Confianza</option>
                <option value="LISTA_RAYA">Lista de Raya</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: ARCHIVO Y GUARDAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px dashed #cbd5e1', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
               onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}>
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: 'none' }} 
              accept=".pdf,.xlsx,.xls"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                {file ? <FileText size={32} /> : <UploadCloud size={32} />}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                  {file ? file.name : 'Haz clic para subir el archivo de CONTPAQi'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  {file ? 'Archivo listo para procesar' : 'Soporta PDF o Excel (Max 10MB)'}
                </p>
              </div>
            </label>
          </div>

          <div style={{ backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', gap: '12px' }}>
            <AlertCircle color="#d97706" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>
              Al importar el archivo, la Pre-Nómina se guardará en estado <strong>Borrador</strong>. Posteriormente, Finanzas gestionará la solicitud de subsidio.
            </p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !file}
            style={{ 
              backgroundColor: (!file || isSubmitting) ? '#94a3b8' : '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '1rem', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              cursor: (!file || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {isSubmitting ? (
              'Procesando...'
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={20} /> Crear Pre-Nómina
              </span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default GenerarPreNomina;