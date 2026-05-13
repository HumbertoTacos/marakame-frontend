import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import type { Nomina } from '../../types';

const MESES_DEL_AÑO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const GenerarPreNomina: React.FC = () => {
  const navigate = useNavigate();
  const { createNomina, nominas } = useNominaStore();

  const fechaActual = new Date();
  const [mes, setMes] = useState(MESES_DEL_AÑO[fechaActual.getMonth()]);
  const [quincena, setQuincena] = useState<1 | 2>(fechaActual.getDate() <= 15 ? 1 : 2);
  const [regimen, setRegimen] = useState('CONFIANZA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mesActual = fechaActual.getMonth();
    const diaActual = fechaActual.getDate();
    const anioActual = fechaActual.getFullYear();
    const mesSeleccionadoIdx = MESES_DEL_AÑO.indexOf(mes);

    if (mesSeleccionadoIdx < mesActual) {
      alert("No puedes generar pre-nóminas de meses anteriores al actual.");
      return;
    }
    if (mesSeleccionadoIdx > mesActual) {
      alert("No puedes generar pre-nóminas para meses futuros.");
      return;
    }
    if (diaActual <= 15 && quincena === 2) {
      alert("Aún estamos en la primera quincena del mes.");
      return;
    }
    if (diaActual > 15 && quincena === 1) {
      alert("La primera quincena ya concluyó y debió ser procesada.");
      return;
    }

    const periodoStr = `${quincena}ª Quincena de ${mes} ${anioActual} - ${regimen === 'CONFIANZA' ? 'Confianza' : 'Lista de Raya'}`;
    if (nominas.some((n: Nomina) => n.periodo === periodoStr)) {
      alert(`Ya existe una pre-nómina para "${periodoStr}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createNomina({
        periodo: periodoStr,
        fechaInicio: new Date(anioActual, mesSeleccionadoIdx, quincena === 1 ? 1 : 16).toISOString(),
        fechaFin:    new Date(anioActual, mesSeleccionadoIdx, quincena === 1 ? 15 : 30).toISOString(),
        regimen,
      } as any);
      navigate('/nominas');
    } catch (error: any) {
      console.error('Error creando pre-nómina:', error);
      alert(error?.response?.data?.message || 'No se pudo crear la pre-nómina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/nominas')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', padding: 0, marginBottom: '1rem' }}
        >
          <ArrowLeft size={20} /> Volver al Dashboard
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Crear Pre-Nómina</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
          El sistema calcula automáticamente el desglose por empleado a partir de los datos institucionales. Las faltas se descuentan al cerrar la nómina.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* CONFIG */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#10b981" /> Configuración del Periodo
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mes</label>
              <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                {MESES_DEL_AÑO.map(m => <option key={m} value={m}>{m}</option>)}
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

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
              Régimen
            </label>
            <select value={regimen} onChange={(e) => setRegimen(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', fontWeight: '600', color: '#1e293b' }}>
              <option value="CONFIANZA">Personal de Confianza</option>
              <option value="LISTA_RAYA">Lista de Raya</option>
            </select>
          </div>
        </div>

        {/* QUÉ HACE EL SISTEMA */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem 1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#8b5cf6" /> Qué hace el sistema al crearla
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
            <li>Toma todos los empleados <strong>activos</strong> del régimen seleccionado.</li>
            <li>Calcula percepciones = <strong>sueldo base + compensación fija</strong>.</li>
            <li>Calcula deducciones preliminares (retención ISR del 8 %).</li>
            <li>Genera el folio NOM-AAAA-### y deja la pre-nómina en estado <strong>PRE_NOMINA</strong>.</li>
            <li>Las <strong>faltas no justificadas</strong> se descontarán al cierre, después de la firma de Dirección.</li>
          </ul>
        </div>

        {/* ALERTA */}
        <div style={{ backgroundColor: '#fffbeb', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', gap: '12px' }}>
          <AlertCircle color="#d97706" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#b45309', lineHeight: 1.5 }}>
            Al confirmar, la pre-nómina pasará a <strong>Finanzas</strong> para solicitud de subsidio. Se sigue el flujo de 4 firmas.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: isSubmitting ? '#94a3b8' : '#3b82f6',
            color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? (
            'Calculando…'
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} /> Crear Pre-Nómina
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default GenerarPreNomina;
