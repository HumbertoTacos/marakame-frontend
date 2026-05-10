import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import marakameLogo from '../assets/Marakame_Logo.png';

export function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3000/api/v1/auth/login', {
        correo,
        password,
      });

      if (data.success) {
        const usuario = data.data.usuario;
        // Guardamos la sesión en Zustand
        setAuth(usuario, data.data.accessToken);

        // --- LÓGICA DE REDIRECCIÓN POR ROL ---
        const rol = usuario.rol?.toUpperCase(); // Convertimos a mayúsculas para evitar errores de dedo

        if (rol === 'RRHH_FINANZAS' || rol === 'RECURSOS_HUMANOS') {
          navigate('/nominas');
        } else if (rol === 'RECURSOS_FINANCIEROS') {
          navigate('/finanzas');
        } else if (rol === 'JEFE_ADMINISTRATIVO') {
          navigate('/administracion');
        } else if (rol === 'ADMISIONES') {
          navigate('/admisiones');
        } else {
          navigate('/dashboard'); // Ruta por defecto para ADMIN y otros
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Error al iniciar sesión');
      } else {
        setError('Error inesperado al iniciar sesión');
      }
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={marakameLogo} alt="Marakame" style={{ width: '100%', maxWidth: '260px', objectFit: 'contain', marginBottom: '1rem' }} />
          <p style={{ color: '#718096' }}>Ingresa tus credenciales</p>
        </div>

        {error && (
          <div style={{ color: 'white', backgroundColor: '#e53e3e', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0' }} 
              required 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0' }} 
              required 
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
}