import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="admisiones/ingreso" element={<Ingreso />} />
          <Route path="admisiones/estudio" element={<EstudioSocioeconomicoForm pacienteId={1} />} />
          
          <Route path="almacen" element={<Almacen />} />
          <Route path="compras" element={<Compras />} />
          <Route path="rrhh-nominas" element={<Nominas />} />
          
          <Route path="clinica" element={<AreaClinica />} />
          
          <Route path="auditoria" element={<Bitacora />} />
          <Route path="exportaciones" element={<Reportes />} />
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
