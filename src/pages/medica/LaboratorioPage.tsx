import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FlaskConical, X, Calendar, Building2, Users,
  CheckSquare, Square, Plus, Stethoscope,
} from 'lucide-react';
import apiClient from '../../services/api';
import type { Paciente } from '../../types';

// ─── Constantes ────────────────────────────────────────────────────────────────

const EXAMENES_CATALOGO = [
  'Química Sanguínea',
  'Examen General de Orina',
  'Coprológico',
  'Perfil Hepático',
  'Otro',
];

const AREA_CONFIG: Record<string, { color: string; light: string; label: string }> = {
  HOMBRES:     { color: '#3b82f6', light: '#eff6ff', label: 'Hombres' },
  MUJERES:     { color: '#ec4899', light: '#fdf2f8', label: 'Mujeres' },
  DETOX:       { color: '#f59e0b', light: '#fffbeb', label: 'Desintoxicación' },
  SIN_ASIGNAR: { color: '#64748b', light: '#f8fafc', label: 'Sin Área' },
};

const calcularEdad = (fechaNacimiento: string | Date) => {
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento as string);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
  return edad;
};

// ─── Modal de Solicitud ────────────────────────────────────────────────────────

interface SolicitudModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente | null;
}

const SolicitudModal = ({ isOpen, onClose, paciente }: SolicitudModalProps) => {
  const [examenes, setExamenes] = useState<string[]>([]);
  const [otroTexto, setOtroTexto] = useState('');
  const [fecha, setFecha] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [guardado, setGuardado] = useState(false);

  const resetModal = () => {
    setExamenes([]);
    setOtroTexto('');
    setFecha('');
    setLaboratorio('');
    setGuardado(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const toggleExamen = (examen: string) => {
    setExamenes(prev =>
      prev.includes(examen) ? prev.filter(e => e !== examen) : [...prev, examen]
    );
  };

  const handleGuardar = () => {
    const examenesFinales = examenes
      .filter(e => e !== 'Otro')
      .concat(examenes.includes('Otro') && otroTexto.trim() ? [otroTexto.trim()] : []);

    if (examenesFinales.length === 0) {
      alert('Selecciona al menos un estudio.');
      return;
    }

    const solicitud = {
      pacienteId: paciente?.id,
      paciente: `${paciente?.nombre} ${paciente?.apellidoPaterno}`,
      examenes: examenesFinales,
      fechaToma: fecha || null,
      laboratorio: laboratorio.trim() || null,
      creadoEn: new Date().toISOString(),
    };

    console.log('[Laboratorio] Solicitud registrada:', solicitud);
    setGuardado(true);
  };

  if (!isOpen || !paciente) return null;

  const nombre = `${paciente.nombre ?? ''} ${paciente.apellidoPaterno ?? ''}`.trim();
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#1e293b',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '520px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
              <FlaskConical size={20} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>Solicitar Laboratorio</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{nombre} · Cama {paciente.cama?.numero ?? 'S/A'}</p>
            </div>
          </div>
          <button onClick={handleClose} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          {guardado ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckSquare size={30} color="#22c55e" />
              </div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '17px', fontWeight: '900', color: '#15803d' }}>Solicitud Registrada</h4>
              <p style={{ margin: '0 0 1.5rem', fontSize: '13px', color: '#64748b' }}>La solicitud fue enviada al área de laboratorio.</p>
              <button onClick={handleClose} style={{ padding: '0.75rem 2rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Estudios */}
              <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.85rem' }}>Estudios a solicitar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {EXAMENES_CATALOGO.map(examen => {
                  const selected = examenes.includes(examen);
                  return (
                    <button
                      key={examen}
                      type="button"
                      onClick={() => toggleExamen(examen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        padding: '0.85rem 1rem', borderRadius: '12px',
                        border: `1.5px solid ${selected ? '#3b82f6' : '#e2e8f0'}`,
                        backgroundColor: selected ? '#eff6ff' : '#f8fafc',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      {selected
                        ? <CheckSquare size={18} color="#3b82f6" />
                        : <Square size={18} color="#cbd5e1" />}
                      <span style={{ fontSize: '14px', fontWeight: selected ? '700' : '600', color: selected ? '#1d4ed8' : '#475569' }}>{examen}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo "Otro" expandible */}
              {examenes.includes('Otro') && (
                <div style={{ marginBottom: '1.5rem', animation: 'none' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Especifique el estudio</label>
                  <input
                    type="text"
                    placeholder="Nombre del estudio..."
                    value={otroTexto}
                    onChange={e => setOtroTexto(e.target.value)}
                    style={inp}
                  />
                </div>
              )}

              {/* Fecha */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Calendar size={13} /> Fecha de toma
                </label>
                <input
                  type="date"
                  value={fecha}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFecha(e.target.value)}
                  style={inp}
                />
              </div>

              {/* Laboratorio */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Building2 size={13} /> Clínica / Laboratorio
                </label>
                <input
                  type="text"
                  placeholder="Ej: Laboratorio Central, IMSS..."
                  value={laboratorio}
                  onChange={e => setLaboratorio(e.target.value)}
                  style={inp}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!guardado && (
          <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={handleClose} style={{ padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: '14px', backgroundColor: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              style={{ padding: '0.75rem 1.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
            >
              <Plus size={15} /> Guardar Solicitud
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Página Principal ──────────────────────────────────────────────────────────

export default function LaboratorioPage() {
  const [modal, setModal] = useState<{ isOpen: boolean; paciente: Paciente | null }>({ isOpen: false, paciente: null });

  const { data: pacientes, isLoading } = useQuery<Paciente[]>({
    queryKey: ['pacientes_laboratorio'],
    queryFn: () =>
      Promise.all([
        apiClient.get('/pacientes?estado=INTERNADO').then(r => r.data.data as Paciente[]),
        apiClient.get('/pacientes?estado=DETOX').then(r => r.data.data as Paciente[]),
      ]).then(([internados, detox]) => [...internados, ...detox]),
  });

  const total = pacientes?.length ?? 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '16px' }}>
            <FlaskConical size={26} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>Laboratorio Clínico</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Solicitud de estudios para pacientes activos</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#f1f5f9', borderRadius: '14px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} color="#64748b" />
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>{total} paciente{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>Cargando pacientes...</div>
        ) : total === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <FlaskConical size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#94a3b8', fontWeight: '600', margin: 0 }}>No hay pacientes activos en este momento.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Paciente', 'Área / Cama', 'Estado', 'Edad', 'Acción'].map((h, i) => (
                  <th key={h} style={{ padding: '1rem 1.5rem', textAlign: i === 4 ? 'center' : 'left', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(pacientes ?? []).map((pac, idx) => {
                const areaKey = pac.estado === 'DETOX' ? 'DETOX' : (pac.cama?.habitacion?.area ?? 'SIN_ASIGNAR');
                const areaCfg = AREA_CONFIG[areaKey] ?? AREA_CONFIG.SIN_ASIGNAR;
                const isDetox = pac.estado === 'DETOX';
                return (
                  <tr
                    key={pac.id}
                    style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0f9ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fafafa'; }}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${areaCfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: areaCfg.color, fontWeight: '900', fontSize: '15px', flexShrink: 0 }}>
                          {pac.nombre?.[0] ?? '?'}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{pac.nombre} {pac.apellidoPaterno}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>#{pac.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: areaCfg.light, color: areaCfg.color, borderRadius: '100px', padding: '0.3rem 0.85rem', fontSize: '12px', fontWeight: '800' }}>
                        <Stethoscope size={12} />
                        {areaCfg.label} {pac.cama?.numero ? `· Cama ${pac.cama.numero}` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ display: 'inline-block', backgroundColor: isDetox ? '#fffbeb' : '#f0fdf4', color: isDetox ? '#92400e' : '#15803d', borderRadius: '100px', padding: '0.25rem 0.75rem', fontSize: '11px', fontWeight: '800' }}>
                        {isDetox ? 'DÉTOX' : 'INTERNADO'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                      {calcularEdad(pac.fechaNacimiento)} años
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setModal({ isOpen: true, paciente: pac })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', backgroundColor: '#eff6ff', color: '#3b82f6', border: '1.5px solid #bfdbfe', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                      >
                        <FlaskConical size={14} /> Solicitar Laboratorio
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <SolicitudModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, paciente: null })}
        paciente={modal.paciente}
      />
    </div>
  );
}
