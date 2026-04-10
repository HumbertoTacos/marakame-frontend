import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Ingreso } from './pages/admisiones/Ingreso';
import { EstudioSocioeconomicoForm } from './pages/admisiones/EstudioSocioeconomicoForm';
import { Almacen } from './pages/operativos/Almacen';
import { Compras } from './pages/operativos/Compras';
import { Nominas } from './pages/operativos/Nominas';
import { Dashboard } from './pages/Dashboard';
import { AreaClinica } from './pages/clinica/AreaClinica';
import { Bitacora } from './pages/transversal/Bitacora';
import { Reportes } from './pages/transversal/Reportes';

// Admisiones Nuevas
import AdmisionesDashboard from './pages/admisiones/AdmisionesDashboard';
import NuevaSolicitudPage from './pages/admisiones/NuevaSolicitudPage';
import AsignarCamaPage from './pages/admisiones/AsignarCamaPage';
import AreasPage from './pages/admisiones/AreasPage';
import PrimerContactoPage from './pages/admisiones/PrimerContactoPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Módulo de Admisiones - Restringido */}
          <Route path="admisiones" element={
            <ProtectedRoute allowedRoles={['ADMISIONES', 'ADMIN_GENERAL']}>
              <Outlet />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdmisionesDashboard />} />
            <Route path="nueva-solicitud" element={<NuevaSolicitudPage />} />
            <Route path="asignar-cama/:id" element={<AsignarCamaPage />} />
            <Route path="areas" element={<AreasPage />} />
            <Route path="primer-contacto" element={<PrimerContactoPage />} />
            <Route path="ingreso" element={<Ingreso />} />
            <Route path="estudio" element={<EstudioSocioeconomicoForm pacienteId={1} />} />
          </Route>
          
          {/* Módulo Clínico - Restringido */}
          <Route path="clinica" element={
            <ProtectedRoute allowedRoles={['AREA_MEDICA', 'ENFERMERIA', 'PSICOLOGIA', 'NUTRICION', 'ADMIN_GENERAL']}>
              <AreaClinica />
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
    </Router>
  );
}

export default App;
