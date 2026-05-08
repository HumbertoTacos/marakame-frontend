import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

// Implementación de Lazy Loading
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Ingreso = lazy(() => import('./pages/admisiones/Ingreso').then(m => ({ default: m.Ingreso })));
const EstudioSocioeconomicoPage = lazy(() => import('./pages/admisiones/EstudioSocioeconomicoPage'));
const Almacen = lazy(() => import('./pages/operativos/Almacen').then(m => ({ default: m.Almacen })));
const Compras = lazy(() => import('./pages/operativos/Compras').then(m => ({ default: m.Compras })));

const Nominas = lazy(() => import('./pages/nominas/NominasDashboard'));
const GenerarPreNomina = lazy(() => import('./pages/nominas/GenerarPrenomina'));

const AreaMedica = lazy(() => import('./pages/medica/AreaMedica').then(m => ({ default: m.AreaMedica })));
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
const DetalleNomina = lazy(() => import('./pages/nominas/DetalleNomina').then(m => ({ default: m.DetalleNomina })));
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Módulo de Admisiones */}
            <Route path="admisiones" element={
              <ProtectedRoute allowedRoles={['ADMISIONES', 'ADMIN_GENERAL', 'AREA_MEDICA', 'PSICOLOGIA']}>
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
                <ProtectedRoute allowedRoles={['ADMIN_GENERAL', 'AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMISIONES']}>
                  <ExpedienteDigitalPage />
                </ProtectedRoute>
              } />
              <Route path="ingreso" element={<Ingreso />} />
              <Route path="estudio-socioeconomico/:id" element={<EstudioSocioeconomicoPage />} />
            </Route>
            
            <Route path="medica" element={
              <ProtectedRoute allowedRoles={['AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL']}>
                <AreaMedica />
              </ProtectedRoute>
            } />
            
            <Route path="almacen" element={
              <ProtectedRoute allowedRoles={['ALMACEN', 'ADMIN_GENERAL']}>
                <Almacen />
              </ProtectedRoute>
            } />

            <Route path="compras" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'ADMIN_GENERAL']}>
                <Compras />
              </ProtectedRoute>
            } />
            
            {/* Módulo de Nóminas Protegido */}
            <Route path="nominas" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'ADMIN_GENERAL']}>
                <Outlet /> {/* El Outlet permite renderizar las rutas hijas aquí abajo */}
              </ProtectedRoute>
            }>
              <Route index element={<Nominas />} /> {/* Dashboard */}
              <Route path="nueva" element={<GenerarPreNomina />} /> {/* Captura de archivo */}
              
              {/* 👇 NUEVA RUTA PARA EL DETALLE 👇 */}
              <Route path=":id" element={<DetalleNomina />} /> 
            </Route>
            
            <Route path="exportaciones" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL']}>
                <Reportes />
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