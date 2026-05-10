import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Pencil, Power, KeyRound, Search, X, Check, Shield } from 'lucide-react';
import apiClient from '../../services/api';

type Rol =
  | 'ADMIN_GENERAL' | 'AREA_MEDICA' | 'ENFERMERIA'
  | 'NUTRICION' | 'PSICOLOGIA' | 'RRHH_FINANZAS'
  | 'RECURSOS_HUMANOS' | 'RECURSOS_FINANCIEROS' | 'JEFE_ADMINISTRATIVO'
  | 'ADMISIONES' | 'ALMACEN' | 'JEFE_MEDICO';

interface UsuarioItem {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  ultimoAcceso: string | null;
  createdAt: string;
}

interface FormData {
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  password: string;
}

const ROLES: Rol[] = [
  'ADMIN_GENERAL', 'AREA_MEDICA', 'ENFERMERIA', 'NUTRICION',
  'PSICOLOGIA', 'RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'RECURSOS_FINANCIEROS',
  'JEFE_ADMINISTRATIVO', 'ADMISIONES', 'ALMACEN', 'JEFE_MEDICO',
];

const ROL_LABELS: Record<Rol, string> = {
  ADMIN_GENERAL:        'Admin General',
  AREA_MEDICA:          'Área Médica',
  ENFERMERIA:           'Enfermería',
  NUTRICION:            'Nutrición',
  PSICOLOGIA:           'Psicología',
  RRHH_FINANZAS:        'RRHH / Finanzas (legacy)',
  RECURSOS_HUMANOS:     'Recursos Humanos',
  RECURSOS_FINANCIEROS: 'Recursos Financieros',
  JEFE_ADMINISTRATIVO:  'Jefatura Administrativa',
  ADMISIONES:           'Admisiones',
  ALMACEN:              'Almacén',
  JEFE_MEDICO:          'Jefe Médico',
};

const ROL_COLORS: Record<Rol, string> = {
  ADMIN_GENERAL:        '#6366f1',
  AREA_MEDICA:          '#0891b2',
  ENFERMERIA:           '#0d9488',
  NUTRICION:             '#d97706',
  PSICOLOGIA:           '#7c3aed',
  RRHH_FINANZAS:        '#059669',
  RECURSOS_HUMANOS:     '#0891b2',
  RECURSOS_FINANCIEROS: '#0ea5e9',
  JEFE_ADMINISTRATIVO:  '#7c3aed',
  ADMISIONES:           '#2563eb',
  ALMACEN:              '#dc2626',
  JEFE_MEDICO:          '#0e7490',
};

const EMPTY_FORM: FormData = { nombre: '', apellidos: '', correo: '', rol: 'ADMISIONES', password: '' };

export default function UsuariosPage() {
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<'crear' | 'editar' | 'reset' | null>(null);
  const [selected, setSelected] = useState<UsuarioItem | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [newPass, setNewPass] = useState('');
  const [error, setError] = useState('');

  const { data: usuarios = [], isLoading } = useQuery<UsuarioItem[]>({
    queryKey: ['usuarios'],
    queryFn: () => apiClient.get('/usuarios').then(r => r.data.data),
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refrescar cada 30s para ver accesos en tiempo casi-real
  });

  const crear = useMutation({
    mutationFn: (data: FormData) => apiClient.post('/usuarios', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); cerrarModal(); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error al crear usuario'),
  });

  const editar = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      apiClient.put(`/usuarios/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); cerrarModal(); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error al actualizar'),
  });

  const toggle = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/usuarios/${id}/toggle-activo`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const resetPass = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      apiClient.patch(`/usuarios/${id}/reset-password`, { password }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); cerrarModal(); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error al resetear contraseña'),
  });

  const filtrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellidos} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  function abrirCrear() {
    setForm(EMPTY_FORM);
    setError('');
    setModal('crear');
  }

  function abrirEditar(u: UsuarioItem) {
    setSelected(u);
    setForm({ nombre: u.nombre, apellidos: u.apellidos, correo: u.correo, rol: u.rol, password: '' });
    setError('');
    setModal('editar');
  }

  function abrirReset(u: UsuarioItem) {
    setSelected(u);
    setNewPass('');
    setError('');
    setModal('reset');
  }

  function cerrarModal() {
    setModal(null);
    setSelected(null);
    setError('');
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (modal === 'crear') crear.mutate(form);
    else if (modal === 'editar' && selected) {
      const { password, ...rest } = form;
      editar.mutate({ id: selected.id, data: rest });
    }
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (selected) resetPass.mutate({ id: selected.id, password: newPass });
  }

  const isBusy = crear.isPending || editar.isPending || resetPass.isPending;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Gestión de Usuarios
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '14px' }}>
            Administra las cuentas del personal del sistema
          </p>
        </div>
        <button
          onClick={abrirCrear}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#3b82f6', color: 'white', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer',
          }}
        >
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '380px' }}>
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
        <input
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '0.65rem 1rem 0.65rem 2.75rem',
            border: '1px solid #e2e8f0', borderRadius: '10px',
            fontSize: '14px', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p style={{ color: '#64748b' }}>Cargando usuarios...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Usuario', 'Correo', 'Rol', 'Último acceso', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: u.activo ? 1 : 0.55 }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${ROL_COLORS[u.rol]}, ${ROL_COLORS[u.rol]}aa)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0,
                      }}>
                        {u.nombre[0]}{u.apellidos[0]}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{u.nombre} {u.apellidos}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>#{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '13px', color: '#475569' }}>{u.correo}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      backgroundColor: `${ROL_COLORS[u.rol]}18`,
                      color: ROL_COLORS[u.rol],
                      padding: '0.3rem 0.75rem', borderRadius: '100px',
                      fontSize: '12px', fontWeight: '700',
                    }}>
                      {ROL_LABELS[u.rol]}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '13px', color: '#64748b' }}>
                    {(() => {
                      if (!u.ultimoAcceso) return 'Nunca';
                      const date = new Date(u.ultimoAcceso);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffMins = Math.floor(diffMs / 60000);

                      if (diffMins < 5) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: '600' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', boxShadow: '0 0 8px #16a34a' }}></div>
                            En línea
                          </div>
                        );
                      }

                      if (diffMins < 60) return `Hace ${diffMins} min`;
                      
                      const isToday = date.toDateString() === now.toDateString();
                      if (isToday) {
                        return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
                      }

                      const yesterday = new Date(now);
                      yesterday.setDate(now.getDate() - 1);
                      if (date.toDateString() === yesterday.toDateString()) {
                        return `Ayer, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
                      }

                      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                    })()}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      backgroundColor: u.activo ? '#dcfce7' : '#fee2e2',
                      color: u.activo ? '#16a34a' : '#dc2626',
                      padding: '0.3rem 0.75rem', borderRadius: '100px',
                      fontSize: '12px', fontWeight: '700',
                    }}>
                      {u.activo ? <><Check size={12} /> Activo</> : <><X size={12} /> Inactivo</>}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <IconBtn title="Editar" color="#3b82f6" onClick={() => abrirEditar(u)}><Pencil size={14} /></IconBtn>
                      <IconBtn title="Reset contraseña" color="#f59e0b" onClick={() => abrirReset(u)}><KeyRound size={14} /></IconBtn>
                      <IconBtn title={u.activo ? 'Desactivar' : 'Activar'} color={u.activo ? '#ef4444' : '#22c55e'} onClick={() => toggle.mutate(u.id)}>
                        <Power size={14} />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {(modal === 'crear' || modal === 'editar') && (
        <Overlay onClose={cerrarModal}>
          <h2 style={{ margin: '0 0 1.5rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="#3b82f6" />
            {modal === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}
          </h2>
          {error && <p style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</p>}
          <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Nombre(s)" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} required />
              <Field label="Apellidos" value={form.apellidos} onChange={v => setForm(f => ({ ...f, apellidos: v }))} required />
            </div>
            <Field label="Correo electrónico" type="email" value={form.correo} onChange={v => setForm(f => ({ ...f, correo: v }))} required />
            <div>
              <label style={labelStyle}>Rol</label>
              <select
                value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value as Rol }))}
                style={inputStyle}
                required
              >
                {ROLES.map(r => <option key={r} value={r}>{ROL_LABELS[r]}</option>)}
              </select>
            </div>
            {modal === 'crear' && (
              <Field label="Contraseña inicial" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required minLength={6} />
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={cerrarModal} style={cancelBtnStyle}>Cancelar</button>
              <button type="submit" disabled={isBusy} style={submitBtnStyle}>
                {isBusy ? 'Guardando...' : modal === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* Modal reset contraseña */}
      {modal === 'reset' && selected && (
        <Overlay onClose={cerrarModal}>
          <h2 style={{ margin: '0 0 0.5rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} color="#f59e0b" /> Resetear Contraseña
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>
            Nueva contraseña para <strong>{selected.nombre} {selected.apellidos}</strong>
          </p>
          {error && <p style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</p>}
          <form onSubmit={submitReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Nueva contraseña" type="password" value={newPass} onChange={setNewPass} required minLength={6} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={cerrarModal} style={cancelBtnStyle}>Cancelar</button>
              <button type="submit" disabled={isBusy} style={{ ...submitBtnStyle, backgroundColor: '#f59e0b' }}>
                {isBusy ? 'Guardando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        </Overlay>
      )}
    </div>
  );
}

/* ── Componentes auxiliares ── */

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}
      >
        {children}
      </div>
    </div>
  );
}

function IconBtn({ children, title, color, onClick }: { children: React.ReactNode; title: string; color: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        backgroundColor: `${color}15`, color, border: 'none',
        width: '32px', height: '32px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${color}30`)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${color}15`)}
    >
      {children}
    </button>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}

function Field({ label, value, onChange, type = 'text', required, minLength }: FieldProps) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        style={inputStyle}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '700',
  color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #e2e8f0',
  borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  color: '#0f172a',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.7rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: '10px',
  backgroundColor: 'white', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '0.7rem 1.5rem', border: 'none', borderRadius: '10px',
  backgroundColor: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
};
