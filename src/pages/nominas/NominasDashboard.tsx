import React, { useEffect, useState } from 'react';
import {
  Users, Banknote, FileSignature, CheckCircle,
  AlertCircle, Calendar, ChevronRight, FileText, UserPlus, X, Briefcase, Trash2, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNominaStore } from '../../stores/nominaStore';
import { useAuthStore } from '../../stores/authStore';
import type { Nomina } from '../../types';

const getNominaStatusConfig = (estado: string) => {
  switch (estado) {
    case 'BORRADOR': return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: FileText, label: 'Borrador' };
    case 'PRE_NOMINA': return { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a', icon: AlertCircle, label: 'Pre-Nómina' };
    case 'SOLICITUD_SUBSIDIO': return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', icon: Banknote, label: 'Esperando Subsidio' };
    case 'EN_REVISION': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', icon: FileSignature, label: 'En Revisión (Firmas)' };
    case 'AUTORIZADO': return { bg: '#f0fdf4', text: '#10b981', border: '#a7f3d0', icon: CheckCircle, label: 'Autorizada' };
    case 'PAGADO': return { bg: '#e0e7ff', text: '#4f46e5', border: '#c7d2fe', icon: CheckCircle, label: 'Pagada (Cerrada)' };
    default: return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: FileText, label: 'Desconocido' };
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const NominasDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userRol = useAuthStore(s => s.usuario?.rol);

  // Solo RH (y el rol legacy combinado y el super-admin) puede crear empleados o subir prenómina.
  const puedeCrear = userRol === 'RECURSOS_HUMANOS' || userRol === 'RRHH_FINANZAS' || userRol === 'ADMIN_GENERAL';

  const {
    nominas,
    empleados,
    isLoading: isLoadingNominas,
    error: nominasError,
    fetchNominas,
    fetchEmpleados,
    createEmpleado,
    updateEmpleado
  } = useNominaStore();

  // Departamentos válidos del Instituto (restringe el select para evitar valores inventados).
  const DEPARTAMENTOS = [
    'ADMISIONES',
    'ALMACEN',
    'ADMINISTRACION',
    'RECURSOS HUMANOS',
    'CLINICO',
    'MEDICO',
    'MANTENIMIENTO',
    'COCINA',
  ];

  const [activeTab, setActiveTab] = useState<'nominas' | 'empleados'>('nominas');
  
  // --- ESTADO PARA EL FILTRO DE NÓMINAS ---
  const [filtroNomina, setFiltroNomina] = useState<'TODAS' | 'EN_PROCESO' | 'FINALIZADAS'>('EN_PROCESO');

  // --- CONTROL DEL MODAL DE EMPLEADOS ---
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [empleadoForm, setEmpleadoForm] = useState({
    id: null as number | null,
    nombre: '',
    apellidos: '',
    departamento: '',
    puesto: '',
    regimen: 'CONFIANZA',
    salarioBase: '' as number | string,
    activo: true
  });

  useEffect(() => {
    fetchNominas();
    fetchEmpleados();
  }, [fetchNominas, fetchEmpleados]);

  // Agrupamos empleados por departamento
  const empleadosPorDepto = empleados.reduce((acc: any, emp: any) => {
    const depto = emp.departamento || "SIN ASIGNAR";
    if (!acc[depto]) acc[depto] = [];
    acc[depto].push(emp);
    return acc;
  }, {});

  // --- HANDLERS DEL FORMULARIO DE EMPLEADOS ---
  const openCreateModal = () => {
    setModalMode('crear');
    setEmpleadoForm({ id: null, nombre: '', apellidos: '', departamento: '', puesto: '', regimen: 'CONFIANZA', salarioBase: '', activo: true });
    setShowModal(true);
  };

  const openEditModal = (emp: any) => {
    setModalMode('editar');
    setEmpleadoForm({
      id: emp.id,
      nombre: emp.nombre || '',
      apellidos: emp.apellidos || '',
      departamento: emp.departamento || '',
      puesto: emp.puesto || '',
      regimen: emp.regimen || 'CONFIANZA',
      salarioBase: emp.salarioBase || '',
      activo: emp.activo !== false   // true por default; sólo false cuando explícitamente está dado de baja
    });
    setShowModal(true);
  };

  const handleGuardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!empleadoForm.nombre.trim() || !empleadoForm.apellidos.trim()) {
      alert("Nombre y apellidos son obligatorios.");
      return;
    }
    if (!DEPARTAMENTOS.includes(empleadoForm.departamento)) {
      alert("Selecciona un departamento válido de la lista.");
      return;
    }
    if (!empleadoForm.salarioBase || Number(empleadoForm.salarioBase) <= 0) {
      alert("El salario base debe ser un número mayor a 0.");
      return;
    }

    const payload = {
      nombre: empleadoForm.nombre.trim(),
      apellidos: empleadoForm.apellidos.trim(),
      puesto: empleadoForm.puesto.trim() || 'Sin especificar',
      departamento: empleadoForm.departamento,
      regimen: empleadoForm.regimen as 'CONFIANZA' | 'LISTA_RAYA',
      salarioBase: Number(empleadoForm.salarioBase),
    };

    try {
      if (modalMode === 'crear') {
        await createEmpleado(payload);
        alert("Empleado registrado correctamente.");
      } else if (empleadoForm.id != null) {
        await updateEmpleado(empleadoForm.id, payload);
        alert("Datos del empleado actualizados.");
      }
      setShowModal(false);
      await fetchEmpleados();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al guardar el empleado.");
    }
  };

  const toggleEstadoEmpleado = async () => {
    if (empleadoForm.id == null) return;
    const nuevoActivo = !empleadoForm.activo;
    const accion = nuevoActivo ? 'reactivar' : 'dar de baja';

    if (window.confirm(`¿Estás seguro de que deseas ${accion} a este empleado?`)) {
      try {
        await updateEmpleado(empleadoForm.id, { activo: nuevoActivo });
        alert(`Empleado ${nuevoActivo ? 'reactivado' : 'dado de baja'}.`);
        setShowModal(false);
        await fetchEmpleados();
      } catch (error: any) {
        alert(error?.response?.data?.message || "Error al cambiar el estado.");
      }
    }
  };

  const empleadosActivos = empleados.filter((e: any) => e.activo !== false).length;
  const nominaEnProceso = nominas.find((n: Nomina) => n.estado !== 'PAGADO' && n.estado !== 'BORRADOR');
  
  // El flujo ya no incluye "Dirección" como paso explícito (se autocompleta con Administración).
  // Visiblemente contamos 3 firmas: Finanzas, Administración y RH.
  const nominasPendientesFirma = nominas.filter((n: Nomina) => {
    const firmas = [n.firmaRecursosHumanos, n.firmaFinanzas, n.firmaAdministracion];
    return firmas.filter(Boolean).length < 3 && n.estado !== 'BORRADOR';
  }).length;

  const stats = [
    { label: 'Empleados Activos', value: empleadosActivos, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Nóminas en Proceso', value: nominaEnProceso ? 1 : 0, icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total a Pagar (Actual)', value: nominaEnProceso ? formatCurrency(nominaEnProceso.totalNetoPagar || 0) : '$0.00', icon: Banknote, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Pendientes de Firma', value: nominasPendientesFirma, icon: FileSignature, color: '#ef4444', bg: '#fef2f2' },
  ];

  // --- LÓGICA DE FILTRADO DE NÓMINAS ---
  // Una nómina está "activa" mientras le falte cualquier acción: firmar Finanzas, firmar Administración,
  // subir nómina firmada (RH) o archivar (Finanzas). Sólo PAGADO se considera finalizada.
  const nominasFiltradas = nominas.filter((nomina: Nomina) => {
    if (filtroNomina === 'TODAS') return true;
    const esFinalizada = nomina.estado === 'PAGADO';
    if (filtroNomina === 'FINALIZADAS') return esFinalizada;
    if (filtroNomina === 'EN_PROCESO') return !esFinalizada;
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Recursos Humanos</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Gestión de personal, pre-nóminas y control de asistencias.</p>
        </div>
        
        {puedeCrear && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={openCreateModal}
              style={{ backgroundColor: 'white', color: '#1e293b', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <UserPlus size={20} color="#3b82f6" />
              Nuevo Empleado
            </button>
            <button
              onClick={() => navigate('/nominas/nueva')}
              style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}
            >
              <FileText size={20} />
              Importar Nómina
            </button>
          </div>
        )}
      </div>

      {/* Banner de error si fetchNominas falló */}
      {nominasError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="#b91c1c" />
            <div>
              <p style={{ margin: 0, fontWeight: '800', color: '#b91c1c' }}>No se pudo cargar la lista de nóminas</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#7f1d1d' }}>{nominasError}</p>
            </div>
          </div>
          <button
            onClick={() => { fetchNominas(); fetchEmpleados(); }}
            style={{ backgroundColor: '#b91c1c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* MÉTRICAS SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
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

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('nominas')}
          style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', fontSize: '16px', fontWeight: '800', cursor: 'pointer', color: activeTab === 'nominas' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'nominas' ? '3px solid #3b82f6' : '3px solid transparent', transition: 'all 0.2s' }}
        >
          Historial de Nóminas
        </button>
        <button 
          onClick={() => setActiveTab('empleados')}
          style={{ background: 'none', border: 'none', padding: '0 0 1rem 0', fontSize: '16px', fontWeight: '800', cursor: 'pointer', color: activeTab === 'empleados' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'empleados' ? '3px solid #3b82f6' : '3px solid transparent', transition: 'all 0.2s' }}
        >
          Directorio de Empleados
        </button>
      </div>

      {/* CONTENIDO DE LAS TABS */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
        
        {/* TAB 1: NÓMINAS */}
        {activeTab === 'nominas' && (
          <div style={{ padding: '1.5rem' }}>

            {/* CABECERA: filtros + botón refrescar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
              <button 
                onClick={() => setFiltroNomina('EN_PROCESO')}
                style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', backgroundColor: filtroNomina === 'EN_PROCESO' ? 'white' : 'transparent', color: filtroNomina === 'EN_PROCESO' ? '#1e293b' : '#64748b', boxShadow: filtroNomina === 'EN_PROCESO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Activas / En Proceso
              </button>
              <button
                onClick={() => setFiltroNomina('FINALIZADAS')}
                style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', backgroundColor: filtroNomina === 'FINALIZADAS' ? 'white' : 'transparent', color: filtroNomina === 'FINALIZADAS' ? '#10b981' : '#64748b', boxShadow: filtroNomina === 'FINALIZADAS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Pagadas / Archivadas
              </button>
              <button
                onClick={() => setFiltroNomina('TODAS')}
                style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', backgroundColor: filtroNomina === 'TODAS' ? 'white' : 'transparent', color: filtroNomina === 'TODAS' ? '#1e293b' : '#64748b', boxShadow: filtroNomina === 'TODAS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Ver Todas
              </button>
              </div>

              {/* Botón refrescar — útil si el listado se queda stale después de subir una pre-nómina */}
              <button
                onClick={() => { fetchNominas(); fetchEmpleados(); }}
                disabled={isLoadingNominas}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: '700', cursor: isLoadingNominas ? 'not-allowed' : 'pointer', opacity: isLoadingNominas ? 0.6 : 1 }}
              >
                <Filter size={14} /> {isLoadingNominas ? 'Cargando…' : 'Actualizar'}
              </button>
            </div>

            {isLoadingNominas ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: '700' }}>Cargando datos de nóminas...</div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Folio / Periodo</th>
                      <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estado Actual</th>
                      <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Progreso de Firmas</th>
                      <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nominasFiltradas.length > 0 ? nominasFiltradas.map((nomina: Nomina) => {
                      // Sólo contamos las 3 firmas visibles del flujo (Finanzas, Administración, RH).
                      // firmaDireccion se setea automáticamente cuando Administración firma.
                      const firmas = [nomina.firmaRecursosHumanos, nomina.firmaFinanzas, nomina.firmaAdministracion];
                      const firmasCompletadas = firmas.filter(Boolean).length;

                      let estadoVisual = nomina.estado;
                      if (firmasCompletadas === 3 && (estadoVisual === 'EN_REVISION' || estadoVisual === 'SOLICITUD_SUBSIDIO')) {
                        estadoVisual = 'AUTORIZADO';
                      }

                      const statusConf = getNominaStatusConfig(estadoVisual);
                      const StatusIcon = statusConf.icon;

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
                                <div style={{ width: `${(firmasCompletadas / 3) * 100}%`, height: '100%', backgroundColor: firmasCompletadas === 3 ? '#10b981' : '#3b82f6' }}></div>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{firmasCompletadas}/3</span>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                            <button onClick={() => navigate(`/nominas/${nomina.id}`)} style={{ backgroundColor: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px' }}>
                              <ChevronRight size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                          No hay nóminas en esta categoría.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIRECTORIO DE EMPLEADOS */}
        {activeTab === 'empleados' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Nombre del Empleado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Puesto</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Régimen</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Salario Base</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(empleadosPorDepto).map((depto) => (
                <React.Fragment key={depto}>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <td colSpan={6} style={{ padding: '0.75rem 1.5rem', fontWeight: '900', color: '#475569', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={16} /> DEPARTAMENTO: {depto.toUpperCase()}
                      </div>
                    </td>
                  </tr>
                  
                  {empleadosPorDepto[depto].map((emp: any) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0', opacity: emp.activo === false ? 0.6 : 1 }}>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#1e293b' }}>
                        {emp.nombre} {emp.apellidos}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>
                        {emp.puesto || 'No especificado'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>
                        <span style={{ backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                          {emp.regimen === 'LISTA_RAYA' ? 'Lista de Raya' : 'Confianza'}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: '#1e293b', fontWeight: '800' }}>
                        {emp.salarioBase ? formatCurrency(Number(emp.salarioBase)) : '-'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {emp.activo === false ? (
                          <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>BAJA</span>
                        ) : (
                          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>ACTIVO</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <button onClick={() => openEditModal(emp)} style={{ backgroundColor: '#eff6ff', border: 'none', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL INTELIGENTE (CREAR / EDITAR) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>
                  {modalMode === 'crear' ? 'Registrar Nuevo Empleado' : 'Editar Información del Empleado'}
                </h3>
                {modalMode === 'editar' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Modifica los datos fiscales o da de baja al elemento.</p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleGuardarEmpleado} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Nombre(s) *</label>
                  <input required type="text" value={empleadoForm.nombre} onChange={(e) => setEmpleadoForm({...empleadoForm, nombre: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Apellidos *</label>
                  <input required type="text" value={empleadoForm.apellidos} onChange={(e) => setEmpleadoForm({...empleadoForm, apellidos: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Departamento *</label>
                  <select
                    required
                    value={empleadoForm.departamento}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, departamento: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
                  >
                    <option value="" disabled>Selecciona un departamento</option>
                    {DEPARTAMENTOS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Puesto</label>
                  <input required type="text" placeholder="Ej. Auxiliar..." value={empleadoForm.puesto} onChange={(e) => setEmpleadoForm({...empleadoForm, puesto: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Régimen Fiscal *</label>
                  <select required value={empleadoForm.regimen} onChange={(e) => setEmpleadoForm({...empleadoForm, regimen: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
                    <option value="CONFIANZA">Personal de Confianza</option>
                    <option value="LISTA_RAYA">Lista de Raya</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Salario Base Diario ($) *</label>
                  <input required type="number" step="0.01" min="0" placeholder="0.00" value={empleadoForm.salarioBase} onChange={(e) => setEmpleadoForm({...empleadoForm, salarioBase: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                
                {modalMode === 'editar' && (
                  <button 
                    type="button" 
                    onClick={toggleEstadoEmpleado}
                    style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid', borderColor: empleadoForm.activo ? '#fca5a5' : '#86efac', backgroundColor: empleadoForm.activo ? '#fef2f2' : '#f0fdf4', color: empleadoForm.activo ? '#ef4444' : '#10b981', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {empleadoForm.activo ? <><Trash2 size={18} /> Dar de Baja</> : <><CheckCircle size={18} /> Reactivar</>}
                  </button>
                )}

                <div style={{ flex: 1, display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 'bold', cursor: 'pointer', color: '#64748b' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '0.8rem 2rem', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}>
                    {modalMode === 'crear' ? 'Registrar' : 'Guardar Cambios'}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NominasDashboard;