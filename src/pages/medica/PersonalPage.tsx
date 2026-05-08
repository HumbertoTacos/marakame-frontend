import { useQuery } from '@tanstack/react-query';
import { UserCog, Users, CheckCircle2, XCircle } from 'lucide-react';
import apiClient from '../../services/api';

// ─── Constantes ────────────────────────────────────────────────────────────────

const ROLES_CLINICOS = ['AREA_MEDICA', 'JEFE_MEDICO', 'ENFERMERIA', 'NUTRICION'];

const ROL_LABELS: Record<string, { label: string; color: string; light: string }> = {
  JEFE_MEDICO: { label: 'Jefe Médico',  color: '#1d4ed8', light: '#eff6ff' },
  AREA_MEDICA: { label: 'Médico',        color: '#3b82f6', light: '#dbeafe' },
  ENFERMERIA:  { label: 'Enfermería',    color: '#0891b2', light: '#e0f2fe' },
  NUTRICION:   { label: 'Nutrición',     color: '#059669', light: '#d1fae5' },
};

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: string;
  activo: boolean;
  ultimoAcceso?: string | null;
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function PersonalPage() {
  const { data: usuarios, isLoading, isError } = useQuery<Usuario[]>({
    queryKey: ['personal_clinico'],
    queryFn: () =>
      apiClient
        .get(`/usuarios?roles=${ROLES_CLINICOS.join(',')}`)
        .then(r => r.data.data),
  });

  const total = usuarios?.length ?? 0;
  const activos = usuarios?.filter(u => u.activo).length ?? 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '16px' }}>
            <UserCog size={26} color="#059669" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>Personal Clínico</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Equipo médico y de atención del centro</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '14px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#15803d' }}>{activos} activos</span>
          </div>
          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '14px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="#64748b" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>{total} total</span>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>Cargando personal...</div>
        ) : isError ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>Error al cargar el personal. Verifique la conexión.</div>
        ) : total === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <UserCog size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#94a3b8', fontWeight: '600', margin: 0 }}>No hay personal registrado con estos roles.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Nombre', 'Rol', 'Correo', 'Último Acceso', 'Estado'].map((h, i) => (
                  <th key={h} style={{ padding: '1rem 1.5rem', textAlign: i === 4 ? 'center' : 'left', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).map((u, idx) => {
                const rolCfg = ROL_LABELS[u.rol] ?? { label: u.rol, color: '#64748b', light: '#f8fafc' };
                const ultimoAcceso = u.ultimoAcceso
                  ? new Date(u.ultimoAcceso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                return (
                  <tr
                    key={u.id}
                    style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fafafa'; }}
                  >
                    {/* Nombre */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `linear-gradient(135deg, ${rolCfg.color}, ${rolCfg.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '15px', flexShrink: 0 }}>
                          {u.nombre[0]}{u.apellidos[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{u.nombre} {u.apellidos}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Rol */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ display: 'inline-block', backgroundColor: rolCfg.light, color: rolCfg.color, borderRadius: '100px', padding: '0.3rem 0.9rem', fontSize: '12px', fontWeight: '800' }}>
                        {rolCfg.label}
                      </span>
                    </td>
                    {/* Correo */}
                    <td style={{ padding: '1rem 1.5rem', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                      {u.correo}
                    </td>
                    {/* Último acceso */}
                    <td style={{ padding: '1rem 1.5rem', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                      {ultimoAcceso}
                    </td>
                    {/* Estado */}
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      {u.activo ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '100px', padding: '0.3rem 0.85rem', fontSize: '12px', fontWeight: '800' }}>
                          <CheckCircle2 size={13} /> Activo
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '100px', padding: '0.3rem 0.85rem', fontSize: '12px', fontWeight: '800' }}>
                          <XCircle size={13} /> Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
