import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Search, Bell, HeartPulse, Stethoscope, PackageOpen, ShoppingCart, Banknote, ShieldAlert, FileOutput, ChevronRight, Users, Clock, ClipboardList, LayoutDashboard, Droplets, FlaskConical, UserCog, ClipboardCheck, Wallet, CalendarCheck, Inbox, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
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

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await notificacionService.getMisNotificaciones();
      if (res.success) {
        setNotificaciones(res.data);
        setUnreadCount(res.data.filter(n => !n.leida).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  const pingUltimoAcceso = async () => {
    try { await apiClient.get('/auth/me'); } catch { /* silencioso */ }
  };

  useEffect(() => {
    fetchNotificaciones();
    pingUltimoAcceso();

    const intervalNotif  = setInterval(fetchNotificaciones, 60000);
    const intervalPing   = setInterval(pingUltimoAcceso,   5 * 60000);

    const onRefresh = () => { fetchNotificaciones(); };
    window.addEventListener('notif-refresh', onRefresh);

    return () => {
      clearInterval(intervalNotif);
      clearInterval(intervalPing);
      window.removeEventListener('notif-refresh', onRefresh);
    };
  }, [fetchNotificaciones]);

  const handleMarcarLeida = async (id: number) => {
    // Optimistic Update: Actualizamos localmente de inmediato
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Llamada asíncrona en segundo plano
    try {
      await notificacionService.marcarComoLeida(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Opcionalmente: recargar si falla para sincronizar estado real
      fetchNotificaciones();
    }
  };

  const handleMarcarTodasLeidas = async () => {
    // Optimistic Update: Todo leído localmente
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setUnreadCount(0);

    try {
      await notificacionService.marcarTodasComoLeidas();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      fetchNotificaciones();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getHomeRoute = () => {
    const rol = usuario?.rol?.toUpperCase();
    if (rol === 'ADMIN_GENERAL') return '/directora';
    if (rol === 'DIRECCION_GENERAL') return '/directora';
    if (rol === 'RRHH_FINANZAS' || rol === 'RECURSOS_HUMANOS') return '/nominas';
    if (rol === 'RECURSOS_FINANCIEROS') return '/finanzas';
    if (rol === 'JEFE_ADMINISTRATIVO') return '/administracion';
    if (rol === 'JEFE_MEDICO') return '/medico/dashboard';
    if (rol === 'JEFE_CLINICO') return '/jefe-clinico/dashboard';
    if (rol === 'JEFE_ADMISIONES') return '/jefe-admisiones/dashboard';
    if (rol === 'ADMISIONES') return '/admisiones/dashboard';
    return '/dashboard';
  };

  const getNavItemClass = (path: string) => {
    const isActive = location.pathname.includes(path);
    return `nav-item ${isActive ? 'active' : ''}`;
  };

  return (
    <div className="layout-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate(getHomeRoute())}>
          <img src={marakameLogo} alt="Marakame" style={{ width: '100%', maxWidth: '200px', objectFit: 'contain' }} />
        </div>
        
        <div className="sidebar-content custom-scrollbar">
          
          {/* Operación Diaria */}
          {(['ADMIN_GENERAL', 'RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'JEFE_ADMINISTRATIVO', 'JEFE_MEDICO', 'JEFE_CLINICO', 'JEFE_ADMISIONES'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Operación Diaria</div>
              <div className={getNavItemClass('asistencias')} onClick={() => navigate('/asistencias')}>
                <CalendarCheck size={20} style={{ marginRight: '1rem' }}/>
                Justificaciones
              </div>
            </>
          )}

          {/* Admisiones */}
          {(usuario?.rol === 'ADMISIONES' || usuario?.rol === 'ADMIN_GENERAL') && (
            <>
              <div className="sidebar-section-title">Admisiones</div>
              <div className={getNavItemClass('admisiones/dashboard')} onClick={() => navigate('/admisiones/dashboard')}>
                <Users size={20} style={{ marginRight: '1rem' }}/> Dashboard Admisión
              </div>
              <div className={getNavItemClass('admisiones/primer-contacto')} onClick={() => navigate('/admisiones/primer-contacto')}>
                <ClipboardList size={20} style={{ marginRight: '1rem' }}/> Primer Contacto
              </div>
              <div className={getNavItemClass('admisiones/seguimiento')} onClick={() => navigate('/admisiones/seguimiento')}>
                <Clock size={20} style={{ marginRight: '1rem' }}/> Seguimiento de Prospectos
              </div>
              <div className={getNavItemClass('admisiones/areas')} onClick={() => navigate('/admisiones/areas')}>
                <PackageOpen size={20} style={{ marginRight: '1rem' }}/> Mapa de Áreas
              </div>
            </>
          )}

          {/* Área Médica */}
          {(['AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Área Médica</div>
              <div className={getNavItemClass('medico/dashboard')} onClick={() => navigate('/medico/dashboard')}>
                <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Inicio
              </div>
              <div className={getNavItemClass('medica/pacientes')} onClick={() => navigate('/medica/pacientes')}>
                <Stethoscope size={20} style={{ marginRight: '1rem' }}/> Pacientes
              </div>
              <div className={getNavItemClass('medica/desintoxicacion')} onClick={() => navigate('/medica/desintoxicacion')}>
                <Droplets size={20} style={{ marginRight: '1rem' }}/> Desintoxicación
              </div>
              <div className={getNavItemClass('medica/laboratorio')} onClick={() => navigate('/medica/laboratorio')}>
                <FlaskConical size={20} style={{ marginRight: '1rem' }}/> Laboratorio
              </div>
            </>
          )}

          {/* Jefaturas */}
          {(['JEFE_MEDICO', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Jefatura Médica</div>
              {usuario?.rol === 'JEFE_MEDICO' && (
                <div className={getNavItemClass('medico/dashboard')} onClick={() => navigate('/medico/dashboard')}>
                  <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Panel Médico
                </div>
              )}
              <div className={getNavItemClass('jefatura/personal')} onClick={() => navigate('/jefatura/personal')}>
                <UserCog size={20} style={{ marginRight: '1rem' }}/> Personal
              </div>
              {usuario?.rol === 'ADMIN_GENERAL' && (
                <div className={getNavItemClass('jefatura/solicitudes')} onClick={() => navigate('/jefatura/solicitudes')}>
                  <ClipboardCheck size={20} style={{ marginRight: '1rem' }}/> Solicitudes
                </div>
              )}
            </>
          )}

          {(['JEFE_CLINICO', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Jefatura Clínica</div>
              <div className={getNavItemClass('jefe-clinico/dashboard')} onClick={() => navigate('/jefe-clinico/dashboard')}>
                <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Panel Clínico
              </div>
            </>
          )}

          {(['JEFE_ADMISIONES', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Jefatura de Admisiones</div>
              <div className={getNavItemClass('jefe-admisiones/dashboard')} onClick={() => navigate('/jefe-admisiones/dashboard')}>
                <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Panel Admisiones
              </div>
            </>
          )}

          {/* Logística */}
          {(usuario?.rol === 'ALMACEN' || usuario?.rol === 'ADMIN_GENERAL') && (
            <>
              <div className="sidebar-section-title">Logística</div>
              <div className={getNavItemClass('almacen')} onClick={() => navigate('/almacen')}>
                <PackageOpen size={20} style={{ marginRight: '1rem' }}/> Almacén General
              </div>
            </>
          )}

          {/* Recursos Humanos */}
          {(['RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Recursos Humanos</div>
              <div className={getNavItemClass('nominas')} onClick={() => navigate('/nominas')}>
                <Banknote size={20} style={{ marginRight: '1rem' }}/> Nóminas y Personal
              </div>
            </>
          )}

          {/* Recursos Financieros */}
          {(['RRHH_FINANZAS', 'RECURSOS_FINANCIEROS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Recursos Financieros</div>
              {(['RECURSOS_FINANCIEROS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
                <div className={getNavItemClass('finanzas')} onClick={() => navigate('/finanzas')}>
                  <Banknote size={20} style={{ marginRight: '1rem' }}/> Panel de Finanzas
                </div>
              )}
              {(['RECURSOS_FINANCIEROS', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
                <>
                  <div className={getNavItemClass('financieros/ingresos')} onClick={() => navigate('/financieros/ingresos')}>
                    <Inbox size={20} style={{ marginRight: '1rem' }}/> Bandeja de Ingresos
                  </div>
                  <div className={getNavItemClass('financieros/facturas')} onClick={() => navigate('/financieros/facturas')}>
                    <FileText size={20} style={{ marginRight: '1rem' }}/> Facturas Mensuales
                  </div>
                </>
              )}
              <div className={getNavItemClass('compras')} onClick={() => navigate('/compras')}>
                <ShoppingCart size={20} style={{ marginRight: '1rem' }}/> Control de Compras
              </div>
              <div className={getNavItemClass('pagos')} onClick={() => navigate('/pagos')}>
                <Wallet size={20} style={{ marginRight: '1rem' }}/> Pagos de Pacientes
              </div>
            </>
          )}

          {/* Jefatura Administrativa */}
          {(['JEFE_ADMINISTRATIVO', 'ADMIN_GENERAL'].includes(usuario?.rol || '')) && (
            <>
              <div className="sidebar-section-title">Jefatura Administrativa</div>
              <div className={getNavItemClass('administracion')} onClick={() => navigate('/administracion')}>
                <ClipboardCheck size={20} style={{ marginRight: '1rem' }}/> Panel Administrativo
              </div>
              {usuario?.rol === 'ADMIN_GENERAL' && (
                <div className={getNavItemClass('nominas')} onClick={() => navigate('/nominas')}>
                  <Banknote size={20} style={{ marginRight: '1rem' }}/> Histórico de Nóminas
                </div>
              )}
            </>
          )}

          {/* Dirección */}
          {(usuario?.rol === 'DIRECCION_GENERAL' || usuario?.rol === 'ADMIN_GENERAL') && (
            <>
              <div className="sidebar-section-title">Dirección</div>
              <div className={getNavItemClass('directora')} onClick={() => navigate('/directora')}>
                <LayoutDashboard size={20} style={{ marginRight: '1rem' }}/> Panel Ejecutivo
              </div>
              {usuario?.rol === 'DIRECCION_GENERAL' && (
                <div className={getNavItemClass('nominas')} onClick={() => navigate('/nominas')}>
                  <Banknote size={20} style={{ marginRight: '1rem' }}/> Firma de Nóminas
                </div>
              )}
              <div className={getNavItemClass('auditoria')} onClick={() => navigate('/auditoria')}>
                <ShieldAlert size={20} style={{ marginRight: '1rem' }}/> Auditoría
              </div>
              <div className={getNavItemClass('exportaciones')} onClick={() => navigate('/exportaciones')}>
                <FileOutput size={20} style={{ marginRight: '1rem' }}/> Exportar Datos
              </div>
              <div className={getNavItemClass('usuarios')} onClick={() => navigate('/usuarios')}>
                <UserCog size={20} style={{ marginRight: '1rem' }}/> Gestión de Usuarios
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="main-header">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>Portal</span>
            <ChevronRight size={16} />
            <span className="breadcrumb-current">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>

          {/* User & Notifications Area */}
          <div className="header-controls">
            
            {/* Global Search */}
            <div className="search-container">
              <Search size={16} color="var(--primary-light)" className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="icon-btn-pill"
                title="Notificaciones"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h3 style={{ margin: 0, fontSize: '15px' }}>Notificaciones</h3>
                    <button 
                      onClick={handleMarcarTodasLeidas}
                      style={{ border: 'none', background: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >Marcar todas como leídas</button>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
                    {notificaciones.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>No hay notificaciones</div>
                    ) : (
                      notificaciones.map(notif => (
                        <div key={notif.id} 
                          onClick={() => {
                            if (!notif.leida) handleMarcarLeida(notif.id);
                            if (notif.link) navigate(notif.link);
                            setShowNotifications(false);
                          }}
                          className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                        >
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '8px', height: '8px', borderRadius: '50%', 
                              backgroundColor: notif.tipo === 'ERROR' ? '#ef4444' : (notif.tipo === 'ALERTA' ? '#f59e0b' : '#3b82f6'),
                              marginTop: '5px', flexShrink: 0,
                              display: notif.leida ? 'none' : 'block'
                            }}></div>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-h)', fontWeight: !notif.leida ? '600' : '500', lineHeight: '1.4' }}>{notif.titulo}</p>
                              <p style={{ margin: '0.25rem 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notif.mensaje}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-light)', marginTop: '0.5rem' }}>
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

            {/* Separator */}
            <div style={{ height: '32px', width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>

            {/* Profile */}
            <div className="user-profile-trigger">
              <div className="user-info">
                <span className="user-name">{usuario?.nombre || 'Usuario'}</span>
                <span className="user-role">{usuario?.rol?.replace('_', ' ') || 'Admin'}</span>
              </div>
              <div className="user-avatar">
                {usuario?.nombre?.[0] || 'U'}{usuario?.apellidos?.[0] || ''}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
                title="Cerrar Sesión"
                className="logout-btn"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="animate-fade-in custom-scrollbar" style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}