import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { useAuthStore } from './stores/authStore';

// Redirige al landing correcto según el rol — usado en la ruta index para que un refresh
// o entrar a "/" aterrice en el panel del usuario y no en el Dashboard genérico.
const HomeRedirect = () => {
  const rol = useAuthStore(s => s.usuario?.rol?.toUpperCase());
  let destino = '/dashboard';
  if (rol === 'ADMIN_GENERAL' || rol === 'DIRECCION_GENERAL') destino = '/directora';
  else if (rol === 'RRHH_FINANZAS' || rol === 'RECURSOS_HUMANOS') destino = '/nominas';
  else if (rol === 'RECURSOS_FINANCIEROS') destino = '/finanzas';
  else if (rol === 'JEFE_ADMINISTRATIVO') destino = '/administracion';
  else if (rol === 'JEFE_MEDICO') destino = '/medico/dashboard';
  else if (rol === 'JEFE_CLINICO') destino = '/jefe-clinico/dashboard';
  else if (rol === 'JEFE_ADMISIONES') destino = '/jefe-admisiones/dashboard';
  else if (rol === 'ADMISIONES') destino = '/admisiones';
  return <Navigate to={destino} replace />;
};

// Implementación de Lazy Loading
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Ingreso = lazy(() => import('./pages/admisiones/Ingreso').then(m => ({ default: m.Ingreso })));
const EstudioSocioeconomicoPage = lazy(() => import('./pages/admisiones/EstudioSocioeconomicoPage'));
const Almacen = lazy(() => import('./pages/operativos/Almacen').then(m => ({ default: m.Almacen })));
const Compras = lazy(() => import('./pages/operativos/Compras').then(m => ({ default: m.Compras })));

const Nominas = lazy(() => import('./pages/nominas/NominasDashboard'));
const GenerarPreNomina = lazy(() => import('./pages/nominas/GenerarPrenomina'));
const DetalleNomina = lazy(() => import('./pages/nominas/DetalleNomina').then(m => ({ default: m.DetalleNomina })));
// NUEVO: Importación del control de asistencias
const ControlAsistencias = lazy(() => import('./pages/nominas/ControlAsistencias'));
// NUEVOS dashboards por rol del flujo de nómina
const DashboardFinanzas = lazy(() => import('./pages/operativos/DashboardFinanzas'));
const DashboardAdministracion = lazy(() => import('./pages/operativos/DashboardAdministracion'));

const AreaMedica = lazy(() => import('./pages/medica/AreaMedica').then(m => ({ default: m.AreaMedica })));
const DashboardMedico = lazy(() => import('./pages/medico/DashboardMedico').then(m => ({ default: m.DashboardMedico })));
const DesintoxicacionPage = lazy(() => import('./pages/medica/DesintoxicacionPage'));
const LaboratorioPage = lazy(() => import('./pages/medica/LaboratorioPage'));
const PersonalPage = lazy(() => import('./pages/medica/PersonalPage'));
const SolicitudesPage = lazy(() => import('./pages/medica/SolicitudesPage'));
const EgresoPacientePage = lazy(() => import('./pages/medica/EgresoPacientePage'));
const GenerarExpedientePage = lazy(() => import('./pages/medica/GenerarExpedientePage'));
const MedicoExpedienteDigitalPage = lazy(() => import('./pages/medico/ExpedienteDigitalPage'));
const Bitacora = lazy(() => import('./pages/transversal/Bitacora').then(m => ({ default: m.Bitacora })));
const Reportes = lazy(() => import('./pages/transversal/Reportes').then(m => ({ default: m.Reportes })));

// Admisiones Nuevas
const AdmisionesDashboard = lazy(() => import('./pages/admisiones/AdmisionesDashboard'));
const NuevoIngresoPage = lazy(() => import('./pages/admisiones/NuevoIngresoPage'));
const AsignarCamaPage = lazy(() => import('./pages/admisiones/AsignarCamaPage'));
const AreasPage = lazy(() => import('./pages/admisiones/AreasPage'));
const PrimerContactoPage = lazy(() => import('./pages/admisiones/PrimerContactoPage'));
const ValoracionMedicaPage = lazy(() => import('./pages/admisiones/ValoracionMedicaPage'));
const ExpedienteDigitalPage = lazy(() => import('./pages/admisiones/ExpedienteDigitalPage').then(m => ({ default: m.ExpedienteDigitalPage })));
const SeguimientoProspectosPage = lazy(() => import('./pages/admisiones/SeguimientoProspectosPage'));
const WizardPertenencias = lazy(() => import('./pages/admisiones/WizardPertenencias'));

const UsuariosPage = lazy(() => import('./pages/admin/UsuariosPage'));
const DashboardDirectora = lazy(() => import('./pages/admin/DashboardDirectora'));
const PagosPacientePage = lazy(() => import('./pages/operativos/PagosPacientePage'));

// Recursos Financieros — Fase 1: Ingresos Propios
const IngresosPendientes = lazy(() => import('./pages/financieros/IngresosPendientes'));
const FacturasMensuales  = lazy(() => import('./pages/financieros/FacturasMensuales'));

// Paneles de jefatura (solo lectura/resumen)
const DashboardJefeClinico = lazy(() => import('./pages/jefes/DashboardJefeClinico'));
const DashboardJefeAdmisiones = lazy(() => import('./pages/jefes/DashboardJefeAdmisiones'));

// Loader Premium para Suspense
const PageLoader = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '60vh', width: '100%', gap: '1.5rem'
  }}>
    <div className="animate-spin" style={{
      width: '40px', height: '40px', border: '3px solid #f3f3f3',
      borderTop: '3px solid #3b82f6', borderRadius: '50%'
    }}></div>
    <span style={{ color: '#64748b', fontWeight: '600', fontSize: '14px' }}>Optimizando recursos...</span>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Módulo de Admisiones */}
            <Route path="admisiones" element={
              <ProtectedRoute allowedRoles={['ADMISIONES', 'ADMIN_GENERAL', 'AREA_MEDICA', 'JEFE_MEDICO', 'PSICOLOGIA']}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdmisionesDashboard />} />
              <Route path="nuevo-ingreso" element={<NuevoIngresoPage />} />
              <Route path="asignar-cama/:id" element={<AsignarCamaPage />} />
              <Route path="areas" element={<AreasPage />} />
              <Route path="primer-contacto" element={<PrimerContactoPage />} />
              <Route path="valoracion-medica/:id" element={<ValoracionMedicaPage />} />
              <Route path="seguimiento" element={<SeguimientoProspectosPage />} />
              <Route path="expediente/:pacienteId" element={
                <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'AREA_MEDICA', 'JEFE_MEDICO', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMISIONES']}>
                  <ExpedienteDigitalPage />
                </ProtectedRoute>
              } />
              <Route path="ingreso" element={<Ingreso />} />
              <Route path="estudio-socioeconomico/:id" element={<EstudioSocioeconomicoPage />} />
              <Route path="pertenencias/:pacienteId" element={<WizardPertenencias />} />
            </Route>

            <Route path="medico/dashboard" element={
              <ProtectedRoute allowedRoles={['AREA_MEDICA', 'JEFE_MEDICO', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL']}>
                <DashboardMedico />
              </ProtectedRoute>
            } />

            {/* Módulo Área Médica — JEFE_MEDICO queda restringido a su panel/justificaciones */}
            <Route path="medica" element={
              <ProtectedRoute allowedRoles={['AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL']}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route path="pacientes" element={<AreaMedica />} />
              <Route path="desintoxicacion" element={<DesintoxicacionPage />} />
              <Route path="laboratorio" element={<LaboratorioPage />} />
              <Route path="expediente/:id" element={<MedicoExpedienteDigitalPage />} />
              <Route path="egreso/:id" element={
                <ProtectedRoute allowedRoles={['AREA_MEDICA', 'ADMIN_GENERAL']}>
                  <EgresoPacientePage />
                </ProtectedRoute>
              } />
              <Route path="historia-clinica/:pacienteId" element={
                <ProtectedRoute allowedRoles={['AREA_MEDICA', 'ADMIN_GENERAL']}>
                  <GenerarExpedientePage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Módulo Jefatura — JEFE_MEDICO mantiene la lista de personal (vista), Solicitudes pasa a Dirección */}
            <Route path="jefatura" element={
              <ProtectedRoute allowedRoles={['JEFE_MEDICO', 'ADMIN_GENERAL']}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route path="personal" element={<PersonalPage />} />
              <Route path="solicitudes" element={
                <ProtectedRoute allowedRoles={['ADMIN_GENERAL']}>
                  <SolicitudesPage />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="almacen" element={
              <ProtectedRoute allowedRoles={['ALMACEN', 'ADMIN_GENERAL']}>
                <Almacen />
              </ProtectedRoute>
            } />

            <Route path="compras" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'RECURSOS_FINANCIEROS', 'ADMIN_GENERAL']}>
                <Compras />
              </ProtectedRoute>
            } />

            <Route path="pagos" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'RECURSOS_FINANCIEROS', 'ADMIN_GENERAL', 'ADMISIONES']}>
                <PagosPacientePage />
              </ProtectedRoute>
            } />

            {/* Dashboard de Recursos Financieros */}
            <Route path="finanzas" element={
              <ProtectedRoute allowedRoles={['RECURSOS_FINANCIEROS', 'RRHH_FINANZAS', 'ADMIN_GENERAL']}>
                <DashboardFinanzas />
              </ProtectedRoute>
            } />

            {/* Recursos Financieros — Fase 1: Ingresos Propios */}
            <Route path="financieros" element={
              <ProtectedRoute allowedRoles={['RECURSOS_FINANCIEROS', 'RRHH_FINANZAS', 'ADMIN_GENERAL']}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="ingresos" replace />} />
              <Route path="ingresos" element={<IngresosPendientes />} />
              <Route path="facturas" element={<FacturasMensuales />} />
            </Route>

            {/* Dashboard de Jefatura Administrativa */}
            <Route path="administracion" element={
              <ProtectedRoute allowedRoles={['JEFE_ADMINISTRATIVO', 'ADMIN_GENERAL']}>
                <DashboardAdministracion />
              </ProtectedRoute>
            } />

            {/* Paneles de jefatura — solo lectura/resumen */}
            <Route path="jefe-clinico/dashboard" element={
              <ProtectedRoute allowedRoles={['JEFE_CLINICO', 'ADMIN_GENERAL']}>
                <DashboardJefeClinico />
              </ProtectedRoute>
            } />
            <Route path="jefe-admisiones/dashboard" element={
              <ProtectedRoute allowedRoles={['JEFE_ADMISIONES', 'ADMIN_GENERAL']}>
                <DashboardJefeAdmisiones />
              </ProtectedRoute>
            } />

            {/* Justificaciones de Asistencia — solo jefes departamentales y RH/Dirección */}
            <Route path="asistencias" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'JEFE_ADMINISTRATIVO', 'JEFE_MEDICO', 'JEFE_CLINICO', 'JEFE_ADMISIONES']}>
                <ControlAsistencias />
              </ProtectedRoute>
            } />

            {/* Módulo de Nóminas — Dirección General firma el paso 3; admin tiene acceso total */}
            <Route path="nominas" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'RECURSOS_FINANCIEROS', 'ADMIN_GENERAL', 'DIRECCION_GENERAL']}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route index element={<Nominas />} />
              <Route path="nueva" element={
                <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'ADMIN_GENERAL']}>
                  <GenerarPreNomina />
                </ProtectedRoute>
              } />
              <Route path=":id" element={<DetalleNomina />} />
            </Route>

            <Route path="auditoria" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'DIRECCION_GENERAL']}>
                <Bitacora />
              </ProtectedRoute>
            } />

            <Route path="exportaciones" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'DIRECCION_GENERAL']}>
                <Reportes />
              </ProtectedRoute>
            } />

            <Route path="usuarios" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'DIRECCION_GENERAL']}>
                <UsuariosPage />
              </ProtectedRoute>
            } />

            <Route path="directora" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'DIRECCION_GENERAL']}>
                <DashboardDirectora />
              </ProtectedRoute>
            } />

          </Route>

          <Route path="/unauthorized" element={<h2>No tienes permisos para ver esta página</h2>} />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;