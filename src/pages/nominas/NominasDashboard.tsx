import React, { useEffect } from 'react';
import {
  Users, Banknote, FileSignature, CheckCircle, 
  AlertCircle, Calendar, ChevronRight, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 1. Importamos el Store y los Tipos que creamos
import { useNominaStore } from '../../stores/nominaStore';
import { Nomina } from '../../types/index.ts';

// Configuración visual según el estado de la nómina
const getNominaStatusConfig = (estado: string) => {
  switch (estado) {
    case 'BORRADOR':
      return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: FileText, label: 'Borrador' };
    case 'PRE_NOMINA':
      return { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a', icon: AlertCircle, label: 'Pre-Nómina' };
    case 'SOLICITUD_SUBSIDIO':
      return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', icon: Banknote, label: 'Esperando Subsidio' };
    case 'EN_REVISION':
      return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', icon: FileSignature, label: 'En Revisión (Firmas)' };
    case 'AUTORIZADO':
      return { bg: '#f0fdf4', text: '#10b981', border: '#a7f3d0', icon: CheckCircle, label: 'Autorizada' };
    case 'PAGADO':
      return { bg: '#e0e7ff', text: '#4f46e5', border: '#c7d2fe', icon: CheckCircle, label: 'Pagada (Cerrada)' };
    default:
      return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: FileText, label: 'Desconocido' };
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const NominasDashboard: React.FC = () => {
  const navigate = useNavigate();

  // 2. Extraemos los datos y funciones de Zustand (nuestro Store)
  const { 
    nominas, 
    empleados, 
    isLoading: isLoadingNominas, 
    fetchNominas, 
    fetchEmpleados 
  } = useNominaStore();

  // 3. Ejecutamos la carga de datos al entrar a la pantalla
  useEffect(() => {
    fetchNominas();
    fetchEmpleados();
  }, [fetchNominas, fetchEmpleados]);

  // --- CÁLCULOS PARA LAS MÉTRICAS ---
  const empleadosActivos = empleados.length;
  const nominaEnProceso = nominas.find((n: Nomina) => n.estado !== 'PAGADO' && n.estado !== 'BORRADOR');
  const nominasPendientesFirma = nominas.filter((n: Nomina) => n.estado === 'EN_REVISION').length;

  const stats = [
    { label: 'Empleados Activos', value: empleadosActivos, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Nóminas en Proceso', value: nominaEnProceso ? 1 : 0, icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total a Pagar (Actual)', value: nominaEnProceso ? formatCurrency(nominaEnProceso.totalNetoPagar || 0) : '$0.00', icon: Banknote, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Pendientes de Firma', value: nominasPendientesFirma, icon: FileSignature, color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Dashboard de Nóminas</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Gestión de pre-nóminas, control de asistencia, firmas de Vo.Bo. y subsidios.</p>
        </div>
        <button 
          onClick={() => navigate('/nominas/nueva')}
          style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}
        >
          Generar Pre-Nómina
        </button>
      </div>

      {/* MÉTRICAS SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ backgroundColor: stat.bg, padding: '1rem', borderRadius: '16px', color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: stat.value.toString().includes('$') ? '22px' : '28px', fontWeight: '900', color: '#1e293b' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* HISTORIAL Y GESTIÓN DE NÓMINAS */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Registro de Quincenas</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Circuito de validación y pago del Instituto MARAKAME</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          {isLoadingNominas ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>Cargando datos de nóminas...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Folio / Periodo</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estado Actual</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Progreso de Firmas</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total a Pagar</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {nominas.map((nomina: Nomina) => {
                  const statusConf = getNominaStatusConfig(nomina.estado);
                  const StatusIcon = statusConf.icon;
                  
                  // Calcular progreso de firmas
                  const firmas = [nomina.firmaRecursosHumanos, nomina.firmaFinanzas, nomina.firmaAdministracion, nomina.firmaDireccion];
                  const firmasCompletadas = firmas.filter(Boolean).length;

                  return (
                    <tr key={nomina.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{nomina.periodo}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{nomina.folio}</p>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: statusConf.bg, color: statusConf.text, border: `1px solid ${statusConf.border}`, padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                          <StatusIcon size={14} />
                          {statusConf.label}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${(firmasCompletadas / 4) * 100}%`, height: '100%', backgroundColor: firmasCompletadas === 4 ? '#10b981' : '#3b82f6' }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{firmasCompletadas}/4</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ fontWeight: '800', color: '#1e293b' }}>
                          {nomina.totalNetoPagar ? formatCurrency(nomina.totalNetoPagar) : 'Pendiente Cálculo'}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => navigate(`/nominas/${nomina.id}`)}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px' }}
                          title="Ver Detalles"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {nominas.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                      No hay nóminas registradas. Haz clic en "Generar Pre-Nómina" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default NominasDashboard;