import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

// Implementación de Lazy Loading para optimización de recursos y bundle size
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Ingreso = lazy(() => import('./pages/admisiones/Ingreso').then(m => ({ default: m.Ingreso })));
const EstudioSocioeconomicoForm = lazy(() => import('./pages/admisiones/EstudioSocioeconomicoForm').then(m => ({ default: m.EstudioSocioeconomicoForm })));
const Almacen = lazy(() => import('./pages/operativos/Almacen').then(m => ({ default: m.Almacen })));
const Compras = lazy(() => import('./pages/operativos/Compras').then(m => ({ default: m.Compras })));
const Nominas = lazy(() => import('./pages/operativos/Nominas').then(m => ({ default: m.Nominas })));
const AreaMedica = lazy(() => import('./pages/medica/AreaMedica').then(m => ({ default: m.AreaMedica })));
const Bitacora = lazy(() => import('./pages/transversal/Bitacora').then(m => ({ default: m.Bitacora })));
const Reportes = lazy(() => import('./pages/transversal/Reportes').then(m => ({ default: m.Reportes })));

// Admisiones Nuevas
const AdmisionesDashboard = lazy(() => import('./pages/admisiones/AdmisionesDashboard'));
const NuevaSolicitudPage = lazy(() => import('./pages/admisiones/NuevaSolicitudPage'));
const AsignarCamaPage = lazy(() => import('./pages/admisiones/AsignarCamaPage'));
const AreasPage = lazy(() => import('./pages/admisiones/AreasPage'));
const PrimerContactoPage = lazy(() => import('./pages/admisiones/PrimerContactoPage'));
const ValoracionMedicaPage = lazy(() => import('./pages/admisiones/ValoracionMedicaPage'));
const ExpedienteDigitalPage = lazy(() => import('./pages/admisiones/ExpedienteDigitalPage').then(m => ({ default: m.ExpedienteDigitalPage })));
const SeguimientoProspectosPage = lazy(() => import('./pages/admisiones/SeguimientoProspectosPage'));

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
            
            {/* Módulo de Admisiones - Restringido */}
            <Route path="admisiones" element={
              <ProtectedRoute allowedRoles={['ADMISIONES', 'ADMIN_GENERAL', 'AREA_MEDICA', 'PSICOLOGIA']}>
                <Outlet />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdmisionesDashboard />} />
              <Route path="nueva-solicitud" element={<NuevaSolicitudPage />} />
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
              <Route path="estudio" element={<EstudioSocioeconomicoForm pacienteId={1} />} />
            </Route>
            
            {/* Módulo Médico - Restringido */}
            <Route path="medica" element={
              <ProtectedRoute allowedRoles={['AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL']}>
                <AreaMedica />
              </ProtectedRoute>
            } />
            
            {/* Almacén - Restringido */}
            <Route path="almacen" element={
              <ProtectedRoute allowedRoles={['ALMACEN', 'ADMIN_GENERAL']}>
                <Almacen />
              </ProtectedRoute>
            } />

            {/* Compras y Nóminas - Restringido */}
            <Route path="compras" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'ADMIN_GENERAL']}>
                <Compras />
              </ProtectedRoute>
            } />
            
            <Route path="rrhh-nominas" element={
              <ProtectedRoute allowedRoles={['RRHH_FINANZAS', 'ADMIN_GENERAL']}>
                <Nominas />
              </ProtectedRoute>
            } />
            
            {/* Gerencial - Solo Admin General */}
            <Route path="auditoria" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL']}>
                <Bitacora />
              </ProtectedRoute>
            } />
            
            <Route path="exportaciones" element={
              <ProtectedRoute allowedRoles={['ADMIN_GENERAL']}>
                <Reportes />
              </ProtectedRoute>
            } />
            {/* Añadir más rutas según los módulos */}
          </Route>
          
          {/* Rutas no autorizadas o 404 */}
          <Route path="/unauthorized" element={<h2>No tienes permisos para ver esta página</h2>} />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
