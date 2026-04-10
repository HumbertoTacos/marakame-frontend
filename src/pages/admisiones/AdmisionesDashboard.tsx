import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  ArrowUpRight, 
  Users, 
  Bed, 
  Clock as ClockIcon,
  ClipboardList,
  Folder
} from 'lucide-react';
import { useIngresoStore } from '../../stores/ingresoStore';
import EstadoSolicitudChip from '../../components/admisiones/EstadoSolicitudChip';
import UrgenciaChip from '../../components/admisiones/UrgenciaChip';
import SolicitudDrawer from '../../components/admisiones/SolicitudDrawer';
import type { SolicitudIngreso } from '../../types';
import { useNavigate } from 'react-router-dom';

const AdmisionesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    solicitudes, 
    camas, 
    fetchSolicitudes, 
    fetchCamas, 
    isLoading 
  } = useIngresoStore();
  
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudIngreso | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSolicitudes();
    fetchCamas();
  }, [fetchSolicitudes, fetchCamas]);

  const openSolicitud = (sol: SolicitudIngreso) => {
    setSelectedSolicitud(sol);
    setIsDrawerOpen(true);
  };

  const stats = [
    { label: 'Camas Disponibles', value: camas.filter(c => c.estado === 'DISPONIBLE').length, icon: Bed, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Solicitudes Pendientes', value: solicitudes.filter(s => s.estado === 'PENDIENTE').length, icon: ClockIcon, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pacientes Internados', value: solicitudes.filter(s => s.estado === 'APROBADA').length, icon: Users, color: '#10b981', bg: '#f0fdf4' },
  ];

  const handleApprove = (id: number) => {
    setIsDrawerOpen(false);
    navigate(`/admisiones/asignar-cama/${id}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Dashboard de Admisiones</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Gestión centralizada de solicitudes e ingresos residenciales.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/admisiones/primer-contacto')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.875rem 1.5rem', 
              backgroundColor: '#1e293b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '14px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <ClipboardList size={20} /> Primer Contacto
          </button>
          
          <button 
            onClick={() => navigate('/admisiones/nueva-solicitud')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.875rem 1.5rem', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '14px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} /> Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ backgroundColor: stat.bg, padding: '1rem', borderRadius: '16px', color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Lista de Espera / Solicitudes</h2>
            <div style={{ background: '#e2e8f0', width: '1px', height: '24px' }}></div>
            <div style={{ backgroundColor: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Buscar por folio o nombre..." style={{ border: 'none', outline: 'none', fontSize: '14px', width: '250px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b' }}><Filter size={18} /></button>
            <button style={{ padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b' }}><LayoutGrid size={18} /></button>
            <button style={{ padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white' }}><ListIcon size={18} /></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Folio</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Paciente</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Urgencia</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Fecha Registro</th>
                <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    No hay solicitudes pendientes en este momento.
                  </td>
                </tr>
              ) : (
                solicitudes.map((sol) => (
                  <tr key={sol.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => openSolicitud(sol)}>
                    <td style={{ padding: '1.25rem 2rem', fontWeight: 'bold', color: '#334155' }}>{sol.folio}</td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>
                        {sol.paciente?.claveUnica 
                          ? `Paciente #${sol.paciente.claveUnica}` 
                          : (sol.paciente?.nombre ? `${sol.paciente.nombre} ${sol.paciente.apellidoPaterno}` : 'Sin nombre')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {sol.paciente?.claveUnica ? 'Identidad Protegida' : `CURP: ${sol.paciente?.curp || '---'}`}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}><UrgenciaChip nivel={sol.urgencia} /></td>
                    <td style={{ padding: '1.25rem 2rem' }}><EstadoSolicitudChip estado={sol.estado} /></td>
                    <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontSize: '14px' }}>
                      {new Date(sol.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {sol.estado === 'APROBADA' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admisiones/expediente/${sol.pacienteId}`);
                            }}
                            title="Ver Expediente Digital"
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#10b981', cursor: 'pointer' }}
                          >
                            <Folder size={18} />
                          </button>
                        )}
                        <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}>
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isLoading && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#3b82f6', color: 'white', padding: '1rem 2rem', borderRadius: '14px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Sincronizando con Marakame API...
        </div>
      )}

      {/* Detail Drawer */}
      <SolicitudDrawer 
        solicitud={selectedSolicitud}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApprove}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tbody tr:hover { background-color: #f8fafc; }
      `}</style>
    </div>
  );
};

export default AdmisionesDashboard;
