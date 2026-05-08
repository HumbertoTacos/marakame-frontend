import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2, Save, X } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';

// --- INTERFACES ---
interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
}

interface PreNomina {
  id: number;
  empleado: Empleado;
  sueldoBruto: number;
  compensacion: number;
  horasExtra: number;
  otrasPercepciones: number;
  retencionISR: number;
  descuentoIncidencias: number;
  otrasDeducciones: number;
  totalPercepciones: number;
  totalDeducciones: number;
  totalAPagar: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const DetalleNomina = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const nominaId = Number(id);

  const { 
    nominaActual: nomina, 
    isLoading: loading, 
    fetchNominaById, 
    actualizarPreNomina 
  } = useNominaStore();
  
  const [empleadoEditando, setEmpleadoEditando] = useState<PreNomina | null>(null);
  
  // 1. AHORA ACEPTAMOS STRINGS VACÍOS PARA PODER BORRAR EL CERO
  const [formData, setFormData] = useState({
    sueldoBruto: 0 as number | string,
    compensacion: 0 as number | string,
    horasExtra: 0 as number | string,
    otrasPercepciones: 0 as number | string,
    retencionISR: 0 as number | string,
    diasFalta: 0 as number | string, // <--- NUEVO CAMPO DE DÍAS
    otrasDeducciones: 0 as number | string
  });

  useEffect(() => {
    if (nominaId) {
      fetchNominaById(nominaId);
    }
  }, [nominaId, fetchNominaById]);

  const toggleEdicion = (prenomina: PreNomina) => {
    if (empleadoEditando?.id === prenomina.id) {
      setEmpleadoEditando(null); 
    } else {
      setEmpleadoEditando(prenomina); 
      
      // Calculamos cuántos días de falta tiene registrados actualmente
      const pagoDiario = prenomina.sueldoBruto > 0 ? (prenomina.sueldoBruto / 15) : 0;
      const diasRegistrados = pagoDiario > 0 ? (prenomina.descuentoIncidencias / pagoDiario) : 0;

      setFormData({
        sueldoBruto: prenomina.sueldoBruto === 0 ? '' : prenomina.sueldoBruto,
        compensacion: prenomina.compensacion === 0 ? '' : prenomina.compensacion,
        horasExtra: prenomina.horasExtra === 0 ? '' : prenomina.horasExtra,
        otrasPercepciones: prenomina.otrasPercepciones === 0 ? '' : prenomina.otrasPercepciones,
        retencionISR: prenomina.retencionISR === 0 ? '' : prenomina.retencionISR,
        diasFalta: diasRegistrados === 0 ? '' : diasRegistrados,
        otrasDeducciones: prenomina.otrasDeducciones === 0 ? '' : prenomina.otrasDeducciones
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Si borramos todo, dejamos la cadena vacía (el cero rebelde desaparece)
    if (value === '') {
      setFormData({ ...formData, [name]: '' });
      return;
    }

    const numero = Number(value);
    if (numero < 0) return; // Validación anti-negativos

    setFormData({ ...formData, [name]: numero });
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoEditando) return;

    // 2. CÁLCULO DE FALTAS ANTES DE ENVIAR AL BACKEND
    const sBruto = Number(formData.sueldoBruto) || 0;
    const dFalta = Number(formData.diasFalta) || 0;
    const pagoDiario = sBruto / 15;
    const descuentoCalculado = pagoDiario * dFalta;

    const payload = {
      sueldoBruto: sBruto,
      compensacion: Number(formData.compensacion) || 0,
      horasExtra: Number(formData.horasExtra) || 0,
      otrasPercepciones: Number(formData.otrasPercepciones) || 0,
      retencionISR: Number(formData.retencionISR) || 0,
      descuentoIncidencias: descuentoCalculado, // <--- Mandamos el descuento total monetario
      otrasDeducciones: Number(formData.otrasDeducciones) || 0
    };

    const exito = await actualizarPreNomina(empleadoEditando.id, payload);
    
    if (exito) {
      setEmpleadoEditando(null); 
    } else {
      alert("Error al actualizar el recibo.");
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>Cargando detalles...</div>;
  if (!nomina) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444', fontWeight: '700' }}>No se encontró la nómina.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* BOTÓN VOLVER */}
      <button 
        onClick={() => navigate('/nominas')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', padding: 0 }}
      >
        <ArrowLeft size={20} /> Volver al Dashboard
      </button>

      {/* CABECERA DE TOTALES GLOBALES */}
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: '0 0 1.5rem 0' }}>
          Folio: {nomina.folio} 
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 12px', borderRadius: '8px', marginLeft: '12px', border: '1px solid #bfdbfe' }}>
            {nomina.estado}
          </span>
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '16px', border: '1px solid #dcfce7' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Percepciones (+)</p>
            <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: '#15803d' }}>{formatCurrency(nomina.totalPercepciones || 0)}</p>
          </div>
          <div style={{ backgroundColor: '#fef2f2', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fee2e2' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Deducciones (-)</p>
            <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: '#b91c1c' }}>{formatCurrency(nomina.totalDeducciones || 0)}</p>
          </div>
          <div style={{ backgroundColor: '#eff6ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #dbeafe' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' }}>Gran Total a Pagar</p>
            <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: '#1d4ed8' }}>{formatCurrency(nomina.totalNetoPagar || 0)}</p>
          </div>
        </div>
      </div>

      {/* TABLA DE EMPLEADOS */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Empleado</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Sueldo Base</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Compensación</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase' }}>Retención ISR</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase' }}>Faltas</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>Total Neto</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {nomina.prenominas?.map((pn) => (
              <React.Fragment key={pn.id}>
                <tr style={{ 
                  borderBottom: empleadoEditando?.id === pn.id ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: empleadoEditando?.id === pn.id ? '#f8fafc' : 'transparent',
                  transition: 'background-color 0.2s'
                }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#1e293b' }}>
                    {pn.empleado?.nombre} {pn.empleado?.apellidos}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>{formatCurrency(pn.sueldoBruto)}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>{formatCurrency(pn.compensacion)}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#ef4444', fontWeight: '600' }}>-{formatCurrency(pn.retencionISR)}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#ef4444', fontWeight: '600' }}>-{formatCurrency(pn.descuentoIncidencias)}</td>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '900', color: '#1e293b', fontSize: '16px' }}>{formatCurrency(pn.totalAPagar)}</td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleEdicion(pn)}
                      style={{ 
                        backgroundColor: empleadoEditando?.id === pn.id ? '#e2e8f0' : '#eff6ff', 
                        border: 'none', 
                        color: empleadoEditando?.id === pn.id ? '#475569' : '#3b82f6', 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Settings2 size={16} />
                      {empleadoEditando?.id === pn.id ? 'Cerrar' : 'Ajustar'}
                    </button>
                  </td>
                </tr>

                {/* FILA DESPLEGABLE DE EDICIÓN EN LÍNEA */}
                {empleadoEditando?.id === pn.id && (
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <td colSpan={7} style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #cbd5e1', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                          <h4 style={{ margin: 0, color: '#3b82f6', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Settings2 size={18} /> Ajuste manual de nómina
                          </h4>
                        </div>
                        
                        <form onSubmit={guardarCambios} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Sueldo Bruto</label>
                            <input type="number" min="0" step="any" name="sueldoBruto" value={formData.sueldoBruto} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: '600', color: '#1e293b' }} />
                          </div>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Compensación</label>
                            <input type="number" min="0" step="any" name="compensacion" value={formData.compensacion} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: '600', color: '#1e293b' }} />
                          </div>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Otras Percepciones</label>
                            <input type="number" min="0" step="any" name="otrasPercepciones" value={formData.otrasPercepciones} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: '600', color: '#15803d' }} />
                          </div>
                          <div style={{ width: '1px', backgroundColor: '#e2e8f0', margin: '0 0.5rem', alignSelf: 'stretch' }}></div>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Retención ISR</label>
                            <input type="number" min="0" step="any" name="retencionISR" value={formData.retencionISR} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: '600', color: '#ef4444' }} />
                          </div>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Días de Falta</label>
                            {/* CAMPO DE DÍAS QUE CALCULA EL DINERO ABAJO */}
                            <input type="number" min="0" step="0.5" name="diasFalta" value={formData.diasFalta} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: '600', color: '#ef4444' }} />
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600', display: 'block', marginTop: '6px' }}>
                              Deducción: {formatCurrency(((Number(formData.sueldoBruto) || 0) / 15) * (Number(formData.diasFalta) || 0))}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto', alignSelf: 'flex-start', marginTop: '22px' }}>
                            <button type="button" onClick={() => setEmpleadoEditando(null)} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Cancelar">
                              <X size={20} />
                            </button>
                            <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Save size={18} /> Guardar Cambios
                            </button>
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};