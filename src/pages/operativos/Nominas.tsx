import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Calculator, UserPlus, Clock, Search } from 'lucide-react';
import apiClient from '../../services/api';
import type { Empleado, Nomina, PreNomina } from '../../types';

export function Nominas() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'NÓMINAS' | 'EMPLEADOS'>('NÓMINAS');
  const [showModalEmp, setShowModalEmp] = useState(false);
  const [showModalNomina, setShowModalNomina] = useState(false);

  // States
  const [nuevoEmp, setNuevoEmp] = useState({ nombre: '', apellidos: '', puesto: '', departamento: '', salarioBase: '' });
  const [nuevaNomina, setNuevaNomina] = useState({ periodo: 'Abril 2026 - Q1', fechaInicio: '', fechaFin: '' });

  const { data: nominas, isLoading: isLoadingNom } = useQuery<Nomina[]>({
    queryKey: ['nominas'],
    queryFn: () => apiClient.get('/nominas/ciclo').then(res => res.data.data)
  });

  const { data: empleados, isLoading: isLoadingEmp } = useQuery<Empleado[]>({
    queryKey: ['empleados'],
    queryFn: () => apiClient.get('/nominas/empleados').then(res => res.data.data),
    enabled: activeTab === 'EMPLEADOS'
  });

  const crearEmpMut = useMutation({
    mutationFn: (data: Partial<Empleado>) => apiClient.post('/nominas/empleados', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      setShowModalEmp(false);
      setNuevoEmp({ nombre: '', apellidos: '', puesto: '', departamento: '', salarioBase: '' });
    }
  });

  const generarNominaMut = useMutation({
    mutationFn: (data: Partial<Nomina>) => apiClient.post('/nominas/ciclo', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
      setShowModalNomina(false);
    }
  });

  const autorizarMut = useMutation({
    mutationFn: (id: number) => apiClient.put(`/nominas/ciclo/${id}/autorizar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
    }
  });

  const updatePreNominaMut = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<PreNomina> }) => apiClient.put(`/nominas/prenomina/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas'] });
    }
  });

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header Nóminas Premium */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.75rem', borderRadius: '14px', marginRight: '1.25rem', display: 'flex', boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}>
            <DollarSign size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>Recursos Humanos</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '500' }}>Gestión de personal y dispersión de nóminas</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowModalEmp(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.8rem 1.5rem',
              backgroundColor: 'white',
              color: 'var(--text-h)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={18} style={{ marginRight: '0.6rem' }} /> Nuevo Empleado
          </button>
          <button
            onClick={() => setShowModalNomina(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.8rem 1.8rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Calculator size={18} style={{ marginRight: '0.6rem' }} /> Generar Nómina
          </button>
        </div>
      </div>

      {/* Tabs Premium */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(241, 245, 249, 0.5)',
        padding: '0.5rem',
        borderRadius: '20px',
        width: 'fit-content',
        marginBottom: '2.5rem'
      }}>
        <button
          onClick={() => setActiveTab('NÓMINAS')}
          style={{
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '15px',
            backgroundColor: activeTab === 'NÓMINAS' ? 'white' : 'transparent',
            fontWeight: '700',
            color: activeTab === 'NÓMINAS' ? 'var(--primary)' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}>
          Ciclos de Nómina
        </button>
        <button
          onClick={() => setActiveTab('EMPLEADOS')}
          style={{
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '15px',
            backgroundColor: activeTab === 'EMPLEADOS' ? 'white' : 'transparent',
            fontWeight: '700',
            color: activeTab === 'EMPLEADOS' ? 'var(--primary)' : '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}>
          Directorio Empleados
        </button>
      </div>

      {/* Content Area Premium */}
      <div style={{ minHeight: '600px' }}>

        {activeTab === 'EMPLEADOS' && (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
              <div style={{ position: 'relative', width: '400px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Buscar empleado..." style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: '1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Puesto</th>
                  <th style={{ padding: '1.25rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Departamento</th>
                  <th style={{ padding: '1.25rem', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Salario Base</th>
                  <th style={{ padding: '1.25rem 2.5rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingEmp ? (
                  <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Cargando personal...</td></tr>
                ) : empleados?.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.5rem 2.5rem' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-h)', fontSize: '15px' }}>{emp.nombre} {emp.apellidos}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: EMP-{emp.id}</div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{emp.puesto}</span>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', background: 'var(--primary-bg)', padding: '0.3rem 0.7rem', borderRadius: '8px' }}>{emp.departamento}</span>
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'right', fontWeight: '800', fontSize: '16px' }}>${emp.salarioBase?.toLocaleString()}</td>
                    <td style={{ padding: '1.5rem 2.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '11px', fontWeight: '800',
                        backgroundColor: emp.activo ? '#dcfce7' : '#fee2e2',
                        color: emp.activo ? '#166534' : '#991b1b'
                      }}>
                        {emp.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'NÓMINAS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {isLoadingNom ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Calculando ciclos de nómina...</div>
            ) : nominas?.map((nomina) => (
              <div key={nomina.id} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Header Premium de Ciclo */}
                <div style={{
                  padding: '2.5rem 3rem',
                  background: nomina.estado === 'AUTORIZADO' ? 'linear-gradient(to right, #f0fdf4, #ffffff)' : 'linear-gradient(to right, #fffbeb, #ffffff)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: nomina.estado === 'AUTORIZADO' ? '#166534' : '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>Ciclo de Nómina</span>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)', margin: '0.25rem 0 0 0' }}>{nomina.periodo}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {new Date(nomina.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{nomina.prenominas?.length} Empleados</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      {nomina.estado === 'AUTORIZADO' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: '#22c55e', color: 'white', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '800', boxShadow: '0 4px 10px rgba(34,197,94,0.2)' }}>
                          <CheckCircle size={16} style={{ marginRight: '0.4rem' }} /> AUTORIZADA DEFINITIVA
                        </span>
                      ) : (
                        <span style={{ background: '#f59e0b', color: 'white', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '12px', fontWeight: '800', boxShadow: '0 4px 10px rgba(245,158,11,0.2)' }}>
                          PENDIENTE DE REVISIÓN
                        </span>
                      )}
                    </div>
                    {nomina.estado === 'AUTORIZADO' && (
                      <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-h)', letterSpacing: '-1px' }}>${nomina.totalGeneral?.toLocaleString()}<span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600', marginLeft: '0.4rem' }}>MXN</span></div>
                    )}
                  </div>
                </div>

                {/* Lista de Prenominas con diseño refinado */}
                <div style={{ padding: '2rem 3rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f8fafc' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>Empleado</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>Días</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>Base</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>Bonos</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>Deduc.</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>Neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nomina.prenominas?.map((pre: PreNomina) => (
                        <tr key={pre.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-h)' }}>{pre.empleado.nombre} {pre.empleado.apellidos}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{pre.empleado.puesto}</div>
                          </td>
                          {/* @ts-expect-error diasTrabajados is dynamic */}
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: '700' }}>{pre.diasTrabajados || 15}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: '#64748b' }}>${pre.salarioBase?.toLocaleString()}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>+${pre.bonos?.toLocaleString()}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', color: '#ef4444' }}>-${pre.deducciones?.toLocaleString()}</td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '16px', color: 'var(--text-h)' }}>${pre.totalAPagar?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Acciones de Ciclo */}
                {nomina.estado === 'BORRADOR' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 3rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', color: '#64748b' }}>Exportar Reporte</button>
                    <button
                      onClick={() => autorizarMut.mutate(nomina.id)}
                      style={{
                        padding: '0.8rem 2rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      Autorizar Nómina
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EMPLEADO PREMIUM */}
      {showModalEmp && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '2rem' }}>Registro de Personal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input type="text" placeholder="Nombres" value={nuevoEmp.nombre} onChange={e => setNuevoEmp({ ...nuevoEmp, nombre: e.target.value })} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }} />
              <input type="text" placeholder="Apellidos" value={nuevoEmp.apellidos} onChange={e => setNuevoEmp({ ...nuevoEmp, apellidos: e.target.value })} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }} />
              <input type="text" placeholder="Puesto" value={nuevoEmp.puesto} onChange={e => setNuevoEmp({ ...nuevoEmp, puesto: e.target.value })} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }} />
              <input type="number" placeholder="Salario Base" value={nuevoEmp.salarioBase} onChange={e => setNuevoEmp({ ...nuevoEmp, salarioBase: e.target.value })} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
              <button onClick={() => setShowModalEmp(false)} style={{ flex: 1, padding: '1rem', borderRadius: '18px', border: '1px solid #e2e8f0', fontWeight: '700' }}>Cerrar</button>
              <button 
                onClick={() => crearEmpMut.mutate({ ...nuevoEmp, salarioBase: parseFloat(nuevoEmp.salarioBase) })} 
                style={{ flex: 2, padding: '1rem', borderRadius: '18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '800' }}
              >
                {crearEmpMut.isPending ? 'Guardando...' : 'Dar de Alta'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
