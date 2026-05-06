import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calculator, AlertCircle, Check } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import { Empleado, Nomina, PreNomina } from '../../types';

const GenerarPreNomina: React.FC = () => {
  const navigate = useNavigate();
  const { empleados, fetchEmpleados, createNomina } = useNominaStore();

  // Estados del formulario
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [quincena, setQuincena] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para la captura de datos de cada empleado
  const [captura, setCaptura] = useState<Record<number, Partial<PreNomina>>>( {});

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  // Inicializar captura cuando cargan los empleados
  useEffect(() => {
    if (empleados.length > 0) {
      const initialCaptura: Record<number, Partial<PreNomina>> = {};
      empleados.forEach(emp => {
        initialCaptura[emp.id] = {
          empleadoId: emp.id,
          diasTrabajados: 15,
          horasExtra: 0,
          compensacion: emp.compensacionFija || 0,
          otrasPercepciones: 0,
          otrasDeducciones: 0
        };
      });
      setCaptura(initialCaptura);
    }
  }, [empleados]);

  const handleInputChange = (empId: number, field: keyof PreNomina, value: number) => {
    setCaptura(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value }
    }));
  };

  // Función para calcular totales de un renglón
  const calcularTotalesEmpleado = (emp: Empleado, datos: Partial<PreNomina>) => {
    const sueldoBruto = (emp.salarioBase / 15) * (datos.diasTrabajados || 0);
    const totalPercepciones = sueldoBruto + (datos.compensacion || 0) + (datos.otrasPercepciones || 0);
    const totalDeducciones = (datos.otrasDeducciones || 0); // Aquí podrías sumar ISR automático
    const totalAPagar = totalPercepciones - totalDeducciones;

    return { sueldoBruto, totalPercepciones, totalDeducciones, totalAPagar };
  };

  const totalNomina = useMemo(() => {
    return empleados.reduce((acc, emp) => {
      const { totalAPagar } = calcularTotalesEmpleado(emp, captura[emp.id] || {});
      return acc + totalAPagar;
    }, 0);
  }, [captura, empleados]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const periodoStr = `${quincena}ª Quincena - ${new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2026, mes - 1))} 2026`;
      
      const nuevaNomina = {
        folio: `NOM-${Date.now()}`,
        periodo: periodoStr,
        fechaInicio: new Date(2026, mes - 1, quincena === 1 ? 1 : 16).toISOString(),
        fechaFin: new Date(2026, mes - 1, quincena === 1 ? 15 : 30).toISOString(),
        estado: 'PRE_NOMINA',
        totalNetoPagar: totalNomina,
        prenominas: empleados.map(emp => {
          const totales = calcularTotalesEmpleado(emp, captura[emp.id] || {});
          return {
            ...captura[emp.id],
            ...totales
          };
        })
      };

      await createNomina(nuevaNomina);
      navigate('/nominas');
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER ACCIONES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/nominas')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>
          <ArrowLeft size={20} /> Volver al Dashboard
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Guardando...' : <><Save size={20} /> Guardar Pre-Nómina</>}
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem 0' }}>Configuración del Periodo</h2>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Mes de Nómina</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '200px' }}>
              <option value={5}>Mayo 2026</option>
              <option value={6}>Junio 2026</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Quincena</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setQuincena(1)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid', borderColor: quincena === 1 ? '#3b82f6' : '#e2e8f0', backgroundColor: quincena === 1 ? '#eff6ff' : 'white', color: quincena === 1 ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>1ª Quincena</button>
              <button onClick={() => setQuincena(2)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid', borderColor: quincena === 2 ? '#3b82f6' : '#e2e8f0', backgroundColor: quincena === 2 ? '#eff6ff' : 'white', color: quincena === 2 ? '#3b82f6' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>2ª Quincena</button>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Total Estimado</p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalNomina)}
            </p>
          </div>
        </div>
      </div>

      {/* TABLA DE CAPTURA */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>EMPLEADO</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>DÍAS TRAB.</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>H. EXTRA</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>COMPENSACIÓN</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>S. BRUTO</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>TOTAL NETO</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => {
              const datos = captura[emp.id] || {};
              const totales = calcularTotalesEmpleado(emp, datos);
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{emp.nombre} {emp.apellidos}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{emp.puesto} | {emp.regimen}</p>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <input type="number" value={datos.diasTrabajados} onChange={(e) => handleInputChange(emp.id, 'diasTrabajados', Number(e.target.value))} style={{ width: '60px', padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <input type="number" value={datos.horasExtra} onChange={(e) => handleInputChange(emp.id, 'horasExtra', Number(e.target.value))} style={{ width: '60px', padding: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(datos.compensacion || 0)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totales.sueldoBruto)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totales.totalAPagar)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenerarPreNomina;