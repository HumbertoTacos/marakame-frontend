import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Pencil, Power, KeyRound, Search, X, Check, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';

type Rol =
  | 'ADMIN_GENERAL' | 'DIRECCION' | 'DIRECCION_GENERAL' | 'AREA_MEDICA' | 'ENFERMERIA'
  | 'NUTRICION' | 'PSICOLOGIA' | 'RRHH_FINANZAS'
  | 'RECURSOS_HUMANOS' | 'RECURSOS_FINANCIEROS' | 'JEFE_ADMINISTRATIVO'
  | 'ADMISIONES' | 'ALMACEN' | 'JEFE_MEDICO' | 'JEFE_CLINICO' | 'JEFE_ADMISIONES';

interface UsuarioItem {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  esJefe: boolean;
  activo: boolean;
  ultimoAcceso: string | null;
  createdAt: string;
}

interface FormData {
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  esJefe: boolean;
  password: string;
}

const ROLES: Rol[] = [
  'ADMIN_GENERAL', 'DIRECCION_GENERAL', 'DIRECCION', 'AREA_MEDICA', 'ENFERMERIA', 'NUTRICION',
  'PSICOLOGIA', 'RRHH_FINANZAS', 'RECURSOS_HUMANOS', 'RECURSOS_FINANCIEROS',
  'JEFE_ADMINISTRATIVO', 'ADMISIONES', 'ALMACEN', 'JEFE_MEDICO', 'JEFE_CLINICO', 'JEFE_ADMISIONES',
];

const ROL_LABELS: Record<Rol, string> = {
  ADMIN_GENERAL:        'Admin General',
  DIRECCION:            'Dirección (legacy)',
  DIRECCION_GENERAL:    'Dirección General',
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
  JEFE_CLINICO:         'Jefe Clínico',
  JEFE_ADMISIONES:      'Jefe de Admisiones',
};

const ROL_COLORS: Record<Rol, string> = {
  ADMIN_GENERAL:        '#6366f1',
  DIRECCION:            '#4f46e5',
  DIRECCION_GENERAL:    '#4338ca',
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
  JEFE_CLINICO:         '#0369a1',
  JEFE_ADMISIONES:      '#1d4ed8',
};

const EMPTY_FORM: FormData = { nombre: '', apellidos: '', correo: '', rol: 'ADMISIONES', esJefe: false, password: '' };

export default function UsuariosPage() {
  const { usuario: currentUser } = useAuthStore();
  const isAdminOrDirector = currentUser?.rol === 'ADMIN_GENERAL' || currentUser?.rol === 'DIRECCION_GENERAL' || (currentUser?.rol as string) === 'DIRECCION';
  const qc = useQueryClient();
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10;
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<Rol | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'inactivos' | ''>('');
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

  const filtrados = usuarios.filter(u => {
    const matchesBusqueda = `${u.nombre} ${u.apellidos} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase());
    const matchesRol = filtroRol ? u.rol === filtroRol : true;
    const matchesEstado = filtroEstado === 'activos' ? u.activo : filtroEstado === 'inactivos' ? !u.activo : true;
    return matchesBusqueda && matchesRol && matchesEstado;
  });

  const indiceUltimo = paginaActual * usuariosPorPagina;
  const indicePrimero = indiceUltimo - usuariosPorPagina;
  const usuariosPaginados = filtrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(filtrados.length / usuariosPorPagina);

  function abrirCrear() {
    setForm(EMPTY_FORM);
    setError('');
    setModal('crear');
  }

  function abrirEditar(u: UsuarioItem) {
    setSelected(u);
    setForm({ nombre: u.nombre, apellidos: u.apellidos, correo: u.correo, rol: u.rol, esJefe: u.esJefe || false, password: '' });
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
        {isAdminOrDirector && (
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
        )}
      </div>

      {/* Panel de Filtros Extenso */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '20px', 
        padding: '1.5rem', 
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        alignItems: 'flex-end',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ position: 'relative' }}>
          <label style={filterLabelStyle}>Búsqueda rápida</label>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem' }} />
          <input
            placeholder="Nombre, correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ ...filterInputStyle, paddingLeft: '2.25rem' }}
          />
        </div>

        <div>
          <label style={filterLabelStyle}>Filtrar por Rol</label>
          <select 
            value={filtroRol} 
            onChange={e => setFiltroRol(e.target.value as Rol | '')}
            style={filterInputStyle}
          >
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROL_LABELS[r]}</option>)}
          </select>
        </div>

        <div>
          <label style={filterLabelStyle}>Estado de Cuenta</label>
          <select 
            value={filtroEstado} 
            onChange={e => setFiltroEstado(e.target.value as any)}
            style={filterInputStyle}
          >
            <option value="">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>

        <button
          onClick={() => { setBusqueda(''); setFiltroRol(''); setFiltroEstado(''); setPaginaActual(1); }}
          style={{
            padding: '0.65rem', backgroundColor: '#f8fafc', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px',
            fontWeight: '700', cursor: 'pointer'
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p style={{ color: '#64748b' }}>Cargando usuarios...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['Usuario', 'Correo', 'Rol', 'Último acceso', 'Estado', isAdminOrDirector ? 'Acciones' : ''].filter(h => h !== '').map(h => (
                    <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuariosPaginados.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < usuariosPaginados.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: u.activo ? 1 : 0.55 }}>
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: `${ROL_COLORS[u.rol]}18`,
                        color: ROL_COLORS[u.rol],
                        padding: '0.3rem 0.75rem', borderRadius: '100px',
                        fontSize: '12px', fontWeight: '700',
                      }}>
                        {u.esJefe && <Shield size={12} />}
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
                    {isAdminOrDirector && (
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <IconBtn title="Editar" color="#3b82f6" onClick={() => abrirEditar(u)}><Pencil size={14} /></IconBtn>
                          <IconBtn title="Reset contraseña" color="#f59e0b" onClick={() => abrirReset(u)}><KeyRound size={14} /></IconBtn>
                          <IconBtn title={u.activo ? 'Desactivar' : 'Activar'} color={u.activo ? '#ef4444' : '#22c55e'} onClick={() => toggle.mutate(u.id)}>
                            <Power size={14} />
                          </IconBtn>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {usuariosPaginados.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          {totalPaginas > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem 1.25rem', 
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                Mostrando <span style={{ color: '#0f172a' }}>{usuariosPaginados.length}</span> de <span style={{ color: '#0f172a' }}>{filtrados.length}</span> usuarios
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual(p => p - 1)}
                  style={paginationBtnStyle(paginaActual === 1)}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPaginaActual(n)}
                    style={paginationNumStyle(paginaActual === n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual(p => p + 1)}
                  style={paginationBtnStyle(paginaActual === totalPaginas)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="esJefe"
                checked={form.esJefe}
                onChange={e => setForm(f => ({ ...f, esJefe: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="esJefe" style={{ fontSize: '14px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                Conceder privilegios de Supervisor / Jefatura (Acceso a Bitácora)
              </label>
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

const filterLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b',
  marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em'
};

const filterInputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1',
  borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: 'white',
  boxSizing: 'border-box', color: '#334155'
};

const paginationBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.4rem 0.8rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  backgroundColor: disabled ? '#f8fafc' : 'white',
  color: disabled ? '#cbd5e1' : '#475569',
  fontSize: '12px',
  fontWeight: '700',
  cursor: disabled ? 'not-allowed' : 'pointer'
});

const paginationNumStyle = (active: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  border: '1px solid',
  borderColor: active ? '#3b82f6' : '#e2e8f0',
  backgroundColor: active ? '#3b82f6' : 'white',
  color: active ? 'white' : '#475569',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer'
});
