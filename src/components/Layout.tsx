import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Search, Bell, HeartPulse, Stethoscope, PackageOpen, ShoppingCart, Banknote, ShieldAlert, FileOutput, ChevronRight, Users, Clock, ClipboardList, LayoutDashboard, Droplets, FlaskConical, UserCog, ClipboardCheck, Wallet, CalendarCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { notificacionService, type Notificacion } from '../services/notificacion.service';
import apiClient from '../services/api';
import marakameLogo from '../assets/Marakame_Logo.png';

export function Layout() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificaciones = async () => {
    try {
      const res = await notificacionService.getMisNotificaciones();
      if (res.success) {
        setNotificaciones(res.data);
        setUnreadCount(res.data.filter(n => !n.leida).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Heartbeat: actualiza ultimoAcceso en el servidor para el usuario activo
  const pingUltimoAcceso = async () => {
    try { await apiClient.get('/auth/me'); } catch { /* silencioso */ }
  };

  useEffect(() => {
    fetchNotificaciones();
    pingUltimoAcceso(); // Al montar el Layout, registrar actividad inmediatamente

    const intervalNotif  = setInterval(fetchNotificaciones, 60000);   // cada 60s
    const intervalPing   = setInterval(pingUltimoAcceso,   5 * 60000); // cada 5 min

    // Refresco inmediato cuando una acción del usuario apaga notificaciones en el backend
    // (p.ej. firmar/subir/archivar nómina). Cualquier vista puede disparar:
    //   window.dispatchEvent(new Event('notif-refresh'))
    const onRefresh = () => { fetchNotificaciones(); };
    window.addEventListener('notif-refresh', onRefresh);

    return () => {
      clearInterval(intervalNotif);
      clearInterval(intervalPing);
      window.removeEventListener('notif-refresh', onRefresh);
    };
  }, []);

  const handleMarcarLeida = async (id: number) => {
    await notificacionService.marcarComoLeida(id);
    fetchNotificaciones();
  };

  const handleMarcarTodasLeidas = async () => {
    await notificacionService.marcarTodasComoLeidas();
    fetchNotificaciones();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getHomeRoute = () => {
    const rol = usuario?.rol?.toUpperCase();
    if (rol === 'ADMIN_GENERAL') return '/directora';
    if (rol === 'RRHH_FINANZAS' || rol === 'RECURSOS_HUMANOS') return '/nominas';
    if (rol === 'RECURSOS_FINANCIEROS') return '/finanzas';
    if (rol === 'JEFE_ADMINISTRATIVO') return '/administracion';
    if (rol === 'ADMISIONES') return '/admisiones/dashboard';
    return '/dashboard';
  };

  const navItemStyle = (path: string) => {
    const isActive = location.pathname.includes(path);
    return {
      display: 'flex',
      alignItems: 'center',
      padding: '0.875rem 1.25rem',
      color: isActive ? '#ffffff' : '#94a3b8',
      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
      borderRadius: '12px',
      cursor: 'pointer',
      marginBottom: '0.5rem',
      fontWeight: isActive ? '600' as const : '500' as const,
      transition: 'all 0.25s ease',
      boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
      transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
    };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg)', background: 'radial-gradient(at top left, #f8fafc 0%, #f1f5f9 100%)', overflow: 'hidden' }}>
      {/* Navigation Sidebar */}
      <aside style={{ 
        width: '280px', 
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 20
      }}>
        <div
          onClick={() => navigate(getHomeRoute())}
          style={{ padding: '1.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <img src={marakameLogo} alt="Marakame" style={{ width: '100%', maxWidth: '200px', objectFit: 'contain' }} />
        </div>
        
        <div style={{ padding: '0 1.5rem 1.5rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
          
          {/* ========================================================= */}
          {/* Módulo Transversal: ASISTENCIAS (Visible para todos los jefes) */}
          {/* ========================================================= */}
          {(['ADMIN_GENERAL', 'RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'JEFE_ADMINISTRATIVO', 'JEFE_MEDICO', 'AREA_MEDICA', 'ADMISIONES', 'ALMACEN', 'PSICOLOGIA', 'NUTRICION', 'ENFERMERIA'].includes(usuario?.rol || '')) && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '1rem 0 1rem 0', fontWeight: '700' }}>Operación Diaria</div>
              <div style={navItemStyle('asistencias')} onClick={() => navigate('/asistencias')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('asistencias')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('asistencias')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <CalendarCheck size={20} style={{ marginRight: '1rem' }}/>
                {/* CONDICIONAL DEL TÍTULO SEGÚN EL ROL */}
                {usuario?.rol === 'ADMIN_GENERAL' || usuario?.rol === 'JEFE_MEDICO' || usuario?.rol === 'JEFE_ADMINISTRATIVO'
                  ? 'Reporte de Asistencias'
                  : 'Pasar Asistencia'}
              </div>
            </>
          )}

          {/* Módulo de Admisiones */}
          {(usuario?.rol === 'ADMISIONES' || usuario?.rol === 'ADMIN_GENERAL') && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Admisiones</div>
              <div style={navItemStyle('admisiones/dashboard')} onClick={() => navigate('/admisiones/dashboard')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('admisiones/dashboard')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('admisiones/dashboard')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Users size={20} style={{ marginRight: '1rem' }}/> Dashboard Admisión
              </div>
              <div style={navItemStyle('admisiones/primer-contacto')} onClick={() => navigate('/admisiones/primer-contacto')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('admisiones/primer-contacto')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('admisiones/primer-contacto')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <ClipboardList size={20} style={{ marginRight: '1rem' }}/> Primer Contacto
              </div>
              <div style={navItemStyle('admisiones/seguimiento')} onClick={() => navigate('/admisiones/seguimiento')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('admisiones/seguimiento')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('admisiones/seguimiento')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Clock size={20} style={{ marginRight: '1rem' }}/> Seguimiento de Prospectos
              </div>

              <div style={navItemStyle('admisiones/areas')} onClick={() => navigate('/admisiones/areas')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('admisiones/areas')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('admisiones/areas')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <PackageOpen size={20} style={{ marginRight: '1rem' }}/> Mapa de Áreas
              </div>
            </>
          )}

          {/* Módulo Médico — visible para médico, jefe médico, staff clínico y admin */}
          {(['AREA_MEDICA', 'JEFE_MEDICO', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Área Médica</div>
              <div style={navItemStyle('medico/dashboard')} onClick={() => navigate('/medico/dashboard')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('medico/dashboard')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('medico/dashboard')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Inicio
              </div>
              <div style={navItemStyle('medica/pacientes')} onClick={() => navigate('/medica/pacientes')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('medica/pacientes')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('medica/pacientes')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Stethoscope size={20} style={{ marginRight: '1rem' }}/> Pacientes
              </div>
              <div style={navItemStyle('medica/desintoxicacion')} onClick={() => navigate('/medica/desintoxicacion')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('medica/desintoxicacion')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('medica/desintoxicacion')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Droplets size={20} style={{ marginRight: '1rem' }}/> Desintoxicación
              </div>
              <div style={navItemStyle('medica/laboratorio')} onClick={() => navigate('/medica/laboratorio')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('medica/laboratorio')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('medica/laboratorio')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <FlaskConical size={20} style={{ marginRight: '1rem' }}/> Laboratorio
              </div>
            </>
          )}

          {/* Jefatura — visible solo para jefe médico y admin */}
          {(['JEFE_MEDICO', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Jefatura</div>
              <div style={navItemStyle('jefatura/personal')} onClick={() => navigate('/jefatura/personal')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('jefatura/personal')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('jefatura/personal')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <UserCog size={20} style={{ marginRight: '1rem' }}/> Personal
              </div>
              <div style={navItemStyle('jefatura/solicitudes')} onClick={() => navigate('/jefatura/solicitudes')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('jefatura/solicitudes')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('jefatura/solicitudes')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <ClipboardCheck size={20} style={{ marginRight: '1rem' }}/> Solicitudes
              </div>
            </>
          )}

          {/* Módulo Operativo - Almacén */}
          {(usuario?.rol === 'ALMACEN' || usuario?.rol === 'ADMIN_GENERAL') && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Logística</div>
              <div style={navItemStyle('almacen')} onClick={() => navigate('/almacen')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('almacen')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('almacen')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <PackageOpen size={20} style={{ marginRight: '1rem' }}/> Almacén General
              </div>
            </>
          )}

          {/* Recursos Humanos: gestiona empleados, sube prenómina y cierra el ciclo */}
          {(['RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Recursos Humanos</div>
              <div style={navItemStyle('nominas')} onClick={() => navigate('/nominas')}
                  onMouseEnter={(e) => { if (!location.pathname.includes('nominas')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  onMouseLeave={(e) => { if (!location.pathname.includes('nominas')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Banknote size={20} style={{ marginRight: '1rem' }}/> Nóminas y Personal
              </div>
            </>
          )}

          {/* Recursos Financieros: solicitud de subsidio + compras + pagos */}
          {(['RRHH_FINANZAS', 'RECURSOS_FINANCIEROS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Recursos Financieros</div>

              {(['RECURSOS_FINANCIEROS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
                <div style={navItemStyle('finanzas')} onClick={() => navigate('/finanzas')}
                    onMouseEnter={(e) => { if (!location.pathname.includes('finanzas')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                    onMouseLeave={(e) => { if (!location.pathname.includes('finanzas')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
                >
                  <Banknote size={20} style={{ marginRight: '1rem' }}/> Panel de Finanzas
                </div>
              )}

              <div style={navItemStyle('compras')} onClick={() => navigate('/compras')}
                  onMouseEnter={(e) => { if (!location.pathname.includes('compras')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  onMouseLeave={(e) => { if (!location.pathname.includes('compras')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <ShoppingCart size={20} style={{ marginRight: '1rem' }}/> Control de Compras
              </div>

              <div style={navItemStyle('pagos')} onClick={() => navigate('/pagos')}
                  onMouseEnter={(e) => { if (!location.pathname.includes('pagos')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  onMouseLeave={(e) => { if (!location.pathname.includes('pagos')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Wallet size={20} style={{ marginRight: '1rem' }}/> Pagos de Pacientes
              </div>
            </>
          )}

          {/* Jefatura Administrativa: paso intermedio del flujo de nómina antes de Dirección */}
          {(['JEFE_ADMINISTRATIVO', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Jefatura Administrativa</div>
              <div style={navItemStyle('administracion')} onClick={() => navigate('/administracion')}
                  onMouseEnter={(e) => { if (!location.pathname.includes('administracion')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  onMouseLeave={(e) => { if (!location.pathname.includes('administracion')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <ClipboardCheck size={20} style={{ marginRight: '1rem' }}/> Revisión de Pre-Nóminas
              </div>
              <div style={navItemStyle('nominas')} onClick={() => navigate('/nominas')}
                  onMouseEnter={(e) => { if (!location.pathname.includes('nominas')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  onMouseLeave={(e) => { if (!location.pathname.includes('nominas')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <Banknote size={20} style={{ marginRight: '1rem' }}/> Histórico de Nóminas
              </div>
            </>
          )}

          {/* Gerencial */}
          {usuario?.rol === 'ADMIN_GENERAL' && (
            <>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Dirección</div>
              <div style={navItemStyle('directora')} onClick={() => navigate('/directora')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('directora')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('directora')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Panel Ejecutivo
              </div>

              <div style={navItemStyle('exportaciones')} onClick={() => navigate('/exportaciones')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('exportaciones')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('exportaciones')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <FileOutput size={20} style={{ marginRight: '1rem' }}/> Exportar Datos
              </div>
              <div style={navItemStyle('usuarios')} onClick={() => navigate('/usuarios')}
                   onMouseEnter={(e) => { if (!location.pathname.includes('usuarios')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                   onMouseLeave={(e) => { if (!location.pathname.includes('usuarios')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <UserCog size={20} style={{ marginRight: '1rem' }}/> Gestión de Usuarios
              </div>
            </>
          )}

          {/* Opciones Generales (Para Todos) */}
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '2rem 0 1rem 0', fontWeight: '700' }}>Sistema</div>
          <div style={navItemStyle('bitacora')} onClick={() => navigate('/bitacora')}
               onMouseEnter={(e) => { if (!location.pathname.includes('bitacora')) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; } }}
               onMouseLeave={(e) => { if (!location.pathname.includes('bitacora')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            <ShieldAlert size={20} style={{ marginRight: '1rem' }}/> Bitácora {usuario?.rol !== 'ADMIN_GENERAL' ? 'Departamental' : ''}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header Premium */}
        <header style={{ 
          height: '80px', 
          backgroundColor: 'white',
          borderBottom: '1px solid var(--glass-border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 2.5rem', 
          zIndex: 10,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
          width: '100%', 
          boxSizing: 'border-box'
        }}>
          
          {/* Breadcrumb / Title area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
            <span>Portal</span>
            <ChevronRight size={16} />
            <span style={{ color: '#0f172a', fontWeight: '600', textTransform: 'capitalize' }}>
              {location.pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>

          {/* User & Notifications Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            
            {/* Buscador Global Mini */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 1rem 0.6rem 2.8rem', 
                  backgroundColor: '#f1f5f9', 
                  border: '1px solid transparent', 
                  borderRadius: '100px', 
                  fontSize: '14px', 
                  outline: 'none', 
                  transition: 'all 0.3s ease',
                  color: '#334155',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.border = '1px solid var(--primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--primary-bg)';
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.border = '1px solid transparent';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Campanita de Notificaciones */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ 
                  background: '#f1f5f9', 
                  border: '1px solid transparent', 
                  cursor: 'pointer', 
                  position: 'relative', 
                  padding: '0.6rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <Bell size={20} color="#475569" />
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-2px', 
                    backgroundColor: '#ef4444', 
                    color: 'white', 
                    fontSize: '10px', 
                    height: '18px', 
                    width: '18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '50%', 
                    fontWeight: 'bold', 
                    border: '2px solid white' 
                  }}>{unreadCount}</span>
                )}
              </button>

              {/* Dropdown de Notificaciones */}
              {showNotifications && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: '0', width: '340px', backgroundColor: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid #f1f5f9', overflow: 'hidden', zIndex: 50, transformOrigin: 'top right', animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Notificaciones</h3>
                    <span 
                      onClick={handleMarcarTodasLeidas}
                      style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}
                    >Marcar todas como leídas</span>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notificaciones.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay notificaciones</div>
                    ) : (
                      notificaciones.map(notif => (
                        <div key={notif.id} 
                        onClick={() => {
                          if (!notif.leida) handleMarcarLeida(notif.id);
                          if (notif.link) navigate(notif.link);
                          setShowNotifications(false);
                        }}
                        style={{ 
                          padding: '1.25rem', 
                          borderBottom: '1px solid #f8fafc', 
                          backgroundColor: !notif.leida ? '#f0f9ff' : 'white', 
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = !notif.leida ? '#e0f2fe' : '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notif.leida ? '#f0f9ff' : 'white'}
                        >
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '8px', height: '8px', borderRadius: '50%', 
                              backgroundColor: notif.tipo === 'ERROR' ? '#ef4444' : (notif.tipo === 'ALERTA' ? '#f59e0b' : '#3b82f6'),
                              marginTop: '5px', flexShrink: 0,
                              display: notif.leida ? 'none' : 'block'
                            }}></div>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', color: '#334155', fontWeight: !notif.leida ? '600' : '500', lineHeight: '1.4' }}>{notif.titulo}</p>
                              <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{notif.mensaje}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '0.5rem' }}>
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separador */}
            <div style={{ height: '32px', width: '1px', backgroundColor: '#e2e8f0' }}></div>

            {/* Perfil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '50px', transition: 'background-color 0.2s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{usuario?.nombre || 'Usuario'}</span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{usuario?.rol?.replace('_', ' ') || 'Admin'}</span>
              </div>
              <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, var(--primary), #60a5fa)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}>
                {usuario?.nombre?.[0] || 'U'}{usuario?.apellidos?.[0] || ''}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
                title="Cerrar Sesión"
                style={{ 
                  border: 'none', 
                  background: 'white', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#94a3b8', 
                  marginLeft: '0.25rem', 
                  padding: '0.6rem',
                  borderRadius: '50%',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)'; }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Backdrop */}
        <main className="animate-fade-in" style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}