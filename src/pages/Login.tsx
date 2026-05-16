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

        // --- LÓGICA DE REDIRECCIÓN POR ROL (mantén en sincronía con Layout.getHomeRoute) ---
        const rol = usuario.rol?.toUpperCase();

        if (rol === 'ADMIN_GENERAL' || rol === 'DIRECCION_GENERAL') {
          navigate('/directora');
        } else if (rol === 'RRHH_FINANZAS' || rol === 'RECURSOS_HUMANOS') {
          navigate('/nominas');
        } else if (rol === 'RECURSOS_FINANCIEROS') {
          navigate('/finanzas');
        } else if (rol === 'JEFE_ADMINISTRATIVO') {
          navigate('/administracion');
        } else if (rol === 'JEFE_MEDICO') {
          navigate('/medico/dashboard');
        } else if (rol === 'JEFE_CLINICO') {
          navigate('/jefe-clinico/dashboard');
        } else if (rol === 'JEFE_ADMISIONES') {
          navigate('/jefe-admisiones/dashboard');
        } else if (rol === 'ADMISIONES') {
          navigate('/admisiones');
        } else {
          navigate('/dashboard');
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
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #4c0519 0%, #7f1d1d 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '3rem 2.5rem', 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
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
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              backgroundColor: '#7f1d1d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '700', 
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s'
            }}
          >
            Acceder al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}