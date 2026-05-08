import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import type { Nomina } from '../../types';

const GenerarPreNomina: React.FC = () => {
  const navigate = useNavigate();
  
  const createNomina = useNominaStore((state: any) => state.createNomina);

  // Estados del formulario
  const [mes, setMes] = useState('Mayo');
  const [quincena, setQuincena] = useState<1 | 2>(1);
  const [regimen, setRegimen] = useState('CONFIANZA'); // <--- NUEVO ESTADO PARA EL RÉGIMEN
  const [totalPercepciones, setTotalPercepciones] = useState<number | ''>('');
  const [totalDeducciones, setTotalDeducciones] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cálculos automáticos
  const totalNeto = (Number(totalPercepciones) || 0) - (Number(totalDeducciones) || 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totalPercepciones || !totalDeducciones) {
      alert("Por favor ingresa los totales arrojados por CONTPAQi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const periodoStr = `${quincena}ª Quincena de ${mes} 2026 - ${regimen === 'CONFIANZA' ? 'Confianza' : 'Lista de Raya'}`;
      
      // PAYLOAD ACTUALIZADO
      const payload = {
        periodo: periodoStr,
        fechaInicio: new Date(2026, 4, quincena === 1 ? 1 : 16).toISOString(),
        fechaFin: new Date(2026, 4, quincena === 1 ? 15 : 30).toISOString(),
        totalPercepciones: Number(totalPercepciones),
        totalDeducciones: Number(totalDeducciones),
        totalNetoPagar: Number(totalPercepciones) - Number(totalDeducciones),
        regimen: regimen // <--- SE ENVÍA EL RÉGIMEN AL BACKEND
      };

      await createNomina(payload);
      
      navigate('/nominas');
    } catch (error: any) {
      console.error("Error al registrar nómina:", error);
      if (error?.response?.status === 401) {
         alert("Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión.");
      } else {
         alert("Hubo un error al registrar la nómina. Revisa la consola.");
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
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Importar Nómina de CONTPAQi</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Sube el archivo de cálculo y registra los totales para iniciar el flujo de firmas.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* COLUMNA IZQUIERDA: ARCHIVO Y PERIODO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SECCIÓN 1: SUBIDA DE ARCHIVO */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px dashed #cbd5e1', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
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
                  {file ? 'Archivo listo para adjuntar' : 'Soporta PDF o Excel (Max 10MB)'}
                </p>
              </div>
            </label>
          </div>

          {/* SECCIÓN 2: PERIODO Y RÉGIMEN */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
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
                  <option value="Enero">Enero</option>
                  <option value="Febrero">Febrero</option>
                  <option value="Marzo">Marzo</option>
                  <option value="Abril">Abril</option>
                  <option value="Mayo">Mayo</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Quincena</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setQuincena(1)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: quincena === 1 ? '#3b82f6' : '#cbd5e1', backgroundColor: quincena === 1 ? '#eff6ff' : 'white', color: quincena === 1 ? '#3b82f6' : '#64748b', fontWeight: '600', cursor: 'pointer' }}>1ª Quin</button>
                  <button type="button" onClick={() => setQuincena(2)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: quincena === 2 ? '#3b82f6' : '#cbd5e1', backgroundColor: quincena === 2 ? '#eff6ff' : 'white', color: quincena === 2 ? '#3b82f6' : '#64748b', fontWeight: '600', cursor: 'pointer' }}>2ª Quin</button>
                </div>
              </div>
            </div>

            {/* NUEVO SELECTOR DE RÉGIMEN */}
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
                <option value="LISTA_DE_RAYA">Lista de Raya</option>
              </select>
            </div>

          </div>
        </div>

        {/* COLUMNA DERECHA: TOTALES Y GUARDAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b' }}>Resumen de CONTPAQi</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Total Percepciones (+)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: '600' }}>$</span>
                <input 
                  type="number" 
                  value={totalPercepciones}
                  onChange={(e) => setTotalPercepciones(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: '600', color: '#1e293b', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Total Deducciones (-)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontWeight: '600' }}>$</span>
                <input 
                  type="number" 
                  value={totalDeducciones}
                  onChange={(e) => setTotalDeducciones(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: '600', color: '#ef4444', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px dashed #e2e8f0' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Neto a Pagar</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#10b981' }}>
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalNeto)}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', gap: '12px' }}>
            <AlertCircle color="#d97706" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>
              Al guardar, la nómina pasará a estado <strong>"En Revisión"</strong> y se notificará a Finanzas y Dirección para sus firmas.
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
                <Save size={20} /> Iniciar Flujo de Firmas
              </span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default GenerarPreNomina;