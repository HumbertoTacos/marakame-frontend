import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import marakameLogo from '../assets/Marakame_Logo.png';
import heroImage from '../assets/image.png';
import logoNayarit from '../assets/logo-nayarit.png';

export function Login() {
  const [correo, setCorreo]         = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [btnHover, setBtnHover]     = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('http://localhost:3000/api/v1/auth/login', { correo, password });
      if (data.success) {
        const usuario = data.data.usuario;
        setAuth(usuario, data.data.accessToken);
        const rol = usuario.rol?.toUpperCase();
        if      (rol === 'ADMIN_GENERAL' || rol === 'DIRECCION_GENERAL') navigate('/directora');
        else if (rol === 'RRHH_FINANZAS' || rol === 'RECURSOS_HUMANOS')  navigate('/nominas');
        else if (rol === 'RECURSOS_FINANCIEROS')   navigate('/finanzas');
        else if (rol === 'JEFE_ADMINISTRATIVO')    navigate('/administracion');
        else if (rol === 'JEFE_MEDICO')            navigate('/medico/dashboard');
        else if (rol === 'JEFE_CLINICO')           navigate('/jefe-clinico/dashboard');
        else if (rol === 'JEFE_ADMISIONES')        navigate('/jefe-admisiones/dashboard');
        else if (rol === 'ADMISIONES')             navigate('/admisiones');
        else navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Credenciales incorrectas. Verifica tus datos.');
      else setError('Error inesperado al iniciar sesión.');
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px 12px 42px',
    fontSize: 14, color: '#1e293b',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10, outline: 'none',
    background: '#f8fafc',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    fontFamily: 'inherit',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor  = '#7f1d1d';
    e.target.style.boxShadow    = '0 0 0 3px rgba(127,29,29,0.1)';
    e.target.style.background   = '#ffffff';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor  = '#e2e8f0';
    e.target.style.boxShadow    = 'none';
    e.target.style.background   = '#f8fafc';
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden',
      background: '#0f172a',
    }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div style={{
        flex: '1 1 0',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Hero photo */}
        <img
          src={heroImage}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
          }}
        />

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(155deg, rgba(90,8,8,0.90) 0%, rgba(15,23,42,0.88) 55%, rgba(10,10,20,0.92) 100%)',
        }} />


        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          height: '100%', padding: '2.5rem 3rem',
        }}>

          {/* Top: Nayarit escudo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={logoNayarit}
              alt="Escudo de Nayarit"
              style={{
                width: 54, height: 54, objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.6))',
              }}
            />
            <div>
              <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Estado de Nayarit
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>
                Servicios de Salud
              </div>
            </div>
          </div>

          {/* Center: branding */}
          <div style={{
            flex: 1, display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '2rem 0',
          }}>
            {/* Accent line */}
            <div style={{ width: 48, height: 3, background: '#b91c1c', borderRadius: 2, marginBottom: '2rem' }} />

            <h2 style={{
              margin: '0 0 6px',
              fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}>
              MARAKAME
            </h2>
            <p style={{
              margin: '0 0 2rem',
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>
              Instituto de Rehabilitación
            </p>

            <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: '1.75rem' }} />

            <p style={{
              margin: 0,
              maxWidth: 360,
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.75,
            }}>
              Sistema Integral de Gestión Institucional para la administración clínica, operativa y administrativa del instituto.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '2rem' }}>
              {['Expediente Clínico', 'Nóminas', 'Compras', 'Admisiones'].map(t => (
                <span key={t} style={{
                  padding: '5px 12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 20,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.65)',
                  fontWeight: 500,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            © {new Date().getFullYear()} Instituto Marakame · Todos los derechos reservados
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 460px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '3rem 3.5rem',
        overflowY: 'auto',
        boxShadow: '-24px 0 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: '2.5rem' }}>
          <img
            src={marakameLogo}
            alt="Instituto Marakame"
            style={{ width: '100%', maxWidth: 200, objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Acceso al Sistema
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
            Ingresa tus credenciales institucionales para continuar.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '3px solid #dc2626',
            borderRadius: 10,
            padding: '11px 14px',
            marginBottom: '1.5rem',
          }}>
            <span style={{ color: '#dc2626', fontWeight: 800, fontSize: 14, lineHeight: 1, marginTop: 1 }}>!</span>
            <span style={{ color: '#991b1b', fontSize: 13, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#9ca3af" style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }} />
              <input
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="usuario@marakame.mx"
                required
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', marginBottom: 7, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#9ca3af" style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputBase, paddingRight: 44 }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, color: '#9ca3af', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '13px',
              background: btnHover ? '#6b1818' : '#7f1d1d',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: btnHover
                ? '0 8px 28px rgba(127,29,29,0.4)'
                : '0 4px 14px rgba(127,29,29,0.25)',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogIn size={16} />
            Acceder al Sistema
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
            Acceso restringido exclusivamente a personal autorizado
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { flex: 1 1 100% !important; padding: 2rem 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
