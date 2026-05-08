import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  Users,
  Heart,
  BookOpen,
  Activity,
  MessageSquare,
  Pill,
  Brain,
  Dumbbell,
  Coffee,
  Trash2,
  Loader2,
} from 'lucide-react';
import apiClient from '../../services/api';

// ── Types ──────────────────────────────────────────────────────

type TipoActividad = 'INDIVIDUAL' | 'COMUNITARIA';
type IconoKey =
  | 'heart' | 'users' | 'book' | 'activity' | 'message'
  | 'pill'  | 'brain' | 'dumbbell' | 'coffee' | 'user';

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;       // ISO datetime string del backend
  hora: string;
  tipo: TipoActividad;
  responsable: string;
  icono: IconoKey;
}

interface FormState {
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  tipo: TipoActividad;
  responsable: string;
  icono: IconoKey;
}

// ── Constants ──────────────────────────────────────────────────

const ICONOS: Record<IconoKey, React.ElementType> = {
  heart:    Heart,
  users:    Users,
  book:     BookOpen,
  activity: Activity,
  message:  MessageSquare,
  pill:     Pill,
  brain:    Brain,
  dumbbell: Dumbbell,
  coffee:   Coffee,
  user:     User,
};

const ICONOS_OPCIONES: { key: IconoKey; label: string }[] = [
  { key: 'heart',    label: 'Salud'      },
  { key: 'users',    label: 'Grupo'      },
  { key: 'book',     label: 'Educación'  },
  { key: 'activity', label: 'Actividad'  },
  { key: 'message',  label: 'Terapia'    },
  { key: 'pill',     label: 'Medicación' },
  { key: 'brain',    label: 'Mental'     },
  { key: 'dumbbell', label: 'Ejercicio'  },
  { key: 'coffee',   label: 'Descanso'   },
  { key: 'user',     label: 'Individual' },
];

const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const SKY    = '#0ea5e9';
const VIOLET = '#8b5cf6';

// ── Helpers ────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Extrae YYYY-MM-DD de un ISO datetime del backend
function isoToDateKey(isoStr: string): string {
  return isoStr.slice(0, 10);
}

const FORM_DEFAULT: FormState = {
  titulo:      '',
  descripcion: '',
  fecha:       toLocalDateStr(new Date()),
  hora:        '09:00',
  tipo:        'INDIVIDUAL',
  responsable: '',
  icono:       'activity',
};

// ── Shared styles ──────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize:        '11px',
  fontWeight:      '800',
  color:           '#374151',
  textTransform:   'uppercase',
  letterSpacing:   '0.5px',
  display:         'block',
  marginBottom:    '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width:           '100%',
  padding:         '0.7rem 0.875rem',
  borderRadius:    '10px',
  border:          '1.5px solid #e2e8f0',
  fontSize:        '13px',
  color:           '#1e293b',
  outline:         'none',
  fontWeight:      '500',
  boxSizing:       'border-box',
  backgroundColor: '#fafafa',
  fontFamily:      'inherit',
};

const navBtnStyle: React.CSSProperties = {
  padding:         '0.5rem',
  borderRadius:    '10px',
  border:          '1px solid #e2e8f0',
  backgroundColor: 'white',
  cursor:          'pointer',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  color:           '#475569',
};

// ── Component ──────────────────────────────────────────────────

export function CronogramaActividades() {
  const queryClient = useQueryClient();
  const today       = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(today));
  const [modalOpen, setModalOpen]       = useState(false);
  const [form, setForm]                 = useState<FormState>(FORM_DEFAULT);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  // ── Queries & Mutations ──────────────────────────────────────

  const { data: actividades = [], isLoading, isError } = useQuery<Actividad[]>({
    queryKey: ['actividades'],
    queryFn:  () => apiClient.get('/actividades').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormState) =>
      apiClient.post('/actividades', {
        titulo:      payload.titulo.trim(),
        descripcion: payload.descripcion.trim() || null,
        fecha:       payload.fecha,
        hora:        payload.hora,
        tipo:        payload.tipo,
        responsable: payload.responsable.trim(),
        icono:       payload.icono,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      setSelectedDate(vars.fecha);
      setCurrentDate(
        new Date(
          Number(vars.fecha.slice(0, 4)),
          Number(vars.fecha.slice(5, 7)) - 1,
          1
        )
      );
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/actividades/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['actividades'] }),
    onSettled:  () => setDeletingId(null),
  });

  // ── Calendar logic ───────────────────────────────────────────

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  type CalDay = { date: string; day: number; inMonth: boolean };
  const calendarDays: CalDay[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      date: toLocalDateStr(new Date(year, month - 1, daysInPrev - i)),
      day:  daysInPrev - i,
      inMonth: false,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: toLocalDateStr(new Date(year, month, i)),
      day:  i,
      inMonth: true,
    });
  }
  const trailing = 42 - calendarDays.length;
  for (let i = 1; i <= trailing; i++) {
    calendarDays.push({
      date: toLocalDateStr(new Date(year, month + 1, i)),
      day:  i,
      inMonth: false,
    });
  }

  // Index activities by local date key
  const byDate: Record<string, Actividad[]> = {};
  actividades.forEach(a => {
    const key = isoToDateKey(a.fecha);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  });

  const todayStr            = toLocalDateStr(today);
  const selectedActividades = (byDate[selectedDate] ?? [])
    .slice()
    .sort((a, b) => a.hora.localeCompare(b.hora));

  // ── Handlers ─────────────────────────────────────────────────

  const prevMonth = useCallback(() => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const openModal = useCallback(() => {
    setForm({ ...FORM_DEFAULT, fecha: selectedDate });
    setModalOpen(true);
  }, [selectedDate]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setForm(FORM_DEFAULT);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.titulo.trim() || !form.responsable.trim()) return;
    createMutation.mutate(form);
  }, [form, createMutation]);

  const handleDelete = useCallback((id: number) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const isFormValid =
    form.titulo.trim().length > 0 &&
    form.responsable.trim().length > 0 &&
    !createMutation.isPending;

  // ── Render ───────────────────────────────────────────────────

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius:    '24px',
        border:          '1px solid #e2e8f0',
        boxShadow:       'var(--shadow)',
        overflow:        'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding:        '1.75rem 2rem',
          borderBottom:   '1px solid #f1f5f9',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          flexWrap:       'wrap',
          gap:            '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              backgroundColor: `${SKY}18`,
              color:           SKY,
              padding:         '0.75rem',
              borderRadius:    '14px',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                Cronograma de Actividades
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, marginTop: '0.2rem', fontWeight: '500' }}>
                Agenda clínica y comunitaria del centro
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SKY, display: 'inline-block' }} />
                Individual
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: VIOLET, display: 'inline-block' }} />
                Comunitaria
              </span>
            </div>
            <button onClick={openModal} style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '0.4rem',
              padding:         '0.65rem 1.25rem',
              backgroundColor: '#1e293b',
              color:           'white',
              border:          'none',
              borderRadius:    '12px',
              fontWeight:      '700',
              fontSize:        '13px',
              cursor:          'pointer',
            }}>
              <Plus size={15} /> Nueva Actividad
            </button>
          </div>
        </div>

        {/* Body: Calendar + Detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px' }}>

          {/* Calendar */}
          <div style={{ padding: '1.75rem', borderRight: '1px solid #f1f5f9' }}>

            {/* Month nav */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              marginBottom:   '1.25rem',
            }}>
              <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={18} /></button>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                {MESES[month]} {year}
              </h3>
              <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={18} /></button>
            </div>

            {/* Day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.375rem' }}>
              {DIAS.map(d => (
                <div key={d} style={{
                  textAlign:     'center',
                  fontSize:      '10px',
                  fontWeight:    '800',
                  color:         '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding:       '0.35rem 0',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#94a3b8', gap: '0.5rem' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Cargando cronograma…</span>
              </div>
            ) : isError ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
                Error al cargar actividades. Verifica la conexión.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {calendarDays.map(({ date, day, inMonth }) => {
                  const dayActs        = byDate[date] ?? [];
                  const isSelected     = date === selectedDate;
                  const isToday        = date === todayStr;
                  const hasIndividual  = dayActs.some(a => a.tipo === 'INDIVIDUAL');
                  const hasComunitaria = dayActs.some(a => a.tipo === 'COMUNITARIA');

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      style={{
                        padding:         '0.45rem 0.2rem',
                        borderRadius:    '10px',
                        border:          isSelected
                          ? '2px solid #1e293b'
                          : isToday
                            ? `2px solid ${SKY}`
                            : '2px solid transparent',
                        backgroundColor: isSelected ? '#1e293b' : isToday ? '#f0f9ff' : 'transparent',
                        cursor:          'pointer',
                        display:         'flex',
                        flexDirection:   'column',
                        alignItems:      'center',
                        gap:             '3px',
                        transition:      'all 0.15s',
                        minHeight:       '50px',
                      }}
                    >
                      <span style={{
                        fontSize:   '13px',
                        fontWeight: isSelected || isToday ? '900' : inMonth ? '600' : '400',
                        color:      isSelected ? 'white' : isToday ? SKY : inMonth ? '#1e293b' : '#cbd5e1',
                      }}>
                        {day}
                      </span>
                      {dayActs.length > 0 && (
                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                          {hasIndividual && (
                            <span style={{
                              width:           '5px', height: '5px', borderRadius: '50%', display: 'inline-block',
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : SKY,
                            }} />
                          )}
                          {hasComunitaria && (
                            <span style={{
                              width:           '5px', height: '5px', borderRadius: '50%', display: 'inline-block',
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : VIOLET,
                            }} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Day detail panel */}
          <div style={{ padding: '1.75rem', backgroundColor: '#fafbfc', minHeight: '480px' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day:     'numeric',
                  month:   'long',
                })}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, marginTop: '0.2rem', fontWeight: '600' }}>
                {selectedActividades.length === 0
                  ? 'Sin actividades programadas'
                  : `${selectedActividades.length} actividad${selectedActividades.length !== 1 ? 'es' : ''} programada${selectedActividades.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {selectedActividades.length === 0 ? (
              <div style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '3rem 1rem',
                textAlign:      'center',
                gap:            '0.75rem',
              }}>
                <Calendar size={38} color="#e2e8f0" />
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', margin: 0 }}>
                  No hay actividades para este día
                </p>
                <button
                  onClick={openModal}
                  style={{
                    marginTop:       '0.25rem',
                    padding:         '0.55rem 1.25rem',
                    backgroundColor: '#f1f5f9',
                    color:           '#475569',
                    border:          '1px solid #e2e8f0',
                    borderRadius:    '10px',
                    fontWeight:      '700',
                    fontSize:        '12px',
                    cursor:          'pointer',
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '0.4rem',
                  }}
                >
                  <Plus size={13} /> Agregar actividad
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedActividades.map((act, idx) => {
                  const IconComponent = ICONOS[act.icono] ?? Activity;
                  const color  = act.tipo === 'INDIVIDUAL' ? SKY : VIOLET;
                  const isLast = idx === selectedActividades.length - 1;
                  const isBeingDeleted = deletingId === act.id;

                  return (
                    <div key={act.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                      {!isLast && (
                        <div style={{
                          position:        'absolute',
                          left:            '18px',
                          top:             '40px',
                          width:           '2px',
                          height:          'calc(100% + 0.75rem)',
                          backgroundColor: '#e2e8f0',
                          zIndex:          0,
                        }} />
                      )}

                      {/* Icon dot */}
                      <div style={{
                        width:           '38px',
                        height:          '38px',
                        borderRadius:    '12px',
                        backgroundColor: `${color}15`,
                        color,
                        border:          `1.5px solid ${color}30`,
                        display:         'flex',
                        alignItems:      'center',
                        justifyContent:  'center',
                        flexShrink:      0,
                        position:        'relative',
                        zIndex:          1,
                      }}>
                        <IconComponent size={16} />
                      </div>

                      {/* Card */}
                      <div style={{
                        flex:            1,
                        backgroundColor: 'white',
                        borderRadius:    '14px',
                        padding:         '0.875rem 1rem',
                        border:          '1px solid #e2e8f0',
                        boxShadow:       '0 1px 3px rgba(0,0,0,0.04)',
                        opacity:         isBeingDeleted ? 0.5 : 1,
                        transition:      'opacity 0.2s',
                      }}>
                        <div style={{
                          display:        'flex',
                          alignItems:     'flex-start',
                          justifyContent: 'space-between',
                          gap:            '0.5rem',
                        }}>
                          <p style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
                            {act.titulo}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                            <span style={{
                              backgroundColor: `${color}12`,
                              color,
                              fontSize:        '10px',
                              fontWeight:      '800',
                              padding:         '0.2rem 0.55rem',
                              borderRadius:    '100px',
                              border:          `1px solid ${color}25`,
                              textTransform:   'capitalize',
                              whiteSpace:      'nowrap',
                            }}>
                              {act.tipo === 'INDIVIDUAL' ? 'Individual' : 'Comunitaria'}
                            </span>
                            <button
                              onClick={() => handleDelete(act.id)}
                              disabled={isBeingDeleted}
                              title="Eliminar actividad"
                              style={{
                                padding:         '0.3rem',
                                borderRadius:    '7px',
                                border:          '1px solid #fee2e2',
                                backgroundColor: '#fff5f5',
                                color:           '#ef4444',
                                cursor:          isBeingDeleted ? 'not-allowed' : 'pointer',
                                display:         'flex',
                                alignItems:      'center',
                                justifyContent:  'center',
                                transition:      'all 0.15s',
                                flexShrink:      0,
                              }}
                            >
                              {isBeingDeleted
                                ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Trash2 size={12} />
                              }
                            </button>
                          </div>
                        </div>

                        {act.descripcion && (
                          <p style={{ fontSize: '11px', color: '#64748b', margin: 0, marginTop: '0.35rem', lineHeight: 1.5 }}>
                            {act.descripcion}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '0.6rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '11px', color: '#475569', fontWeight: '700' }}>
                            <Clock size={11} /> {act.hora}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '11px', color: '#475569', fontWeight: '600' }}>
                            <User size={11} /> {act.responsable}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spinner keyframe (injected once) */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position:        'fixed',
            inset:           0,
            backgroundColor: 'rgba(15,23,42,0.5)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          1000,
            padding:         '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius:    '24px',
            width:           '100%',
            maxWidth:        '520px',
            boxShadow:       '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow:        'hidden',
            maxHeight:       '90vh',
            display:         'flex',
            flexDirection:   'column',
          }}>

            {/* Modal header */}
            <div style={{
              padding:        '1.5rem 1.75rem',
              borderBottom:   '1px solid #f1f5f9',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              background:     'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              flexShrink:     0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  backgroundColor: '#1e293b',
                  padding:         '0.6rem',
                  borderRadius:    '10px',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                }}>
                  <Plus size={16} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                    Nueva Actividad
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, fontWeight: '500' }}>
                    Agenda una actividad clínica o comunitaria
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={navBtnStyle}><X size={18} /></button>
            </div>

            {/* Modal form */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

              {/* Tipo */}
              <div>
                <label style={labelStyle}>Tipo de Actividad</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.4rem' }}>
                  {(['INDIVIDUAL', 'COMUNITARIA'] as TipoActividad[]).map(t => {
                    const c      = t === 'INDIVIDUAL' ? SKY : VIOLET;
                    const active = form.tipo === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, tipo: t }))}
                        style={{
                          padding:         '0.75rem',
                          borderRadius:    '12px',
                          border:          active ? `2px solid ${c}` : '2px solid #e2e8f0',
                          backgroundColor: active ? `${c}10` : 'white',
                          color:           active ? c : '#64748b',
                          fontWeight:      '700',
                          fontSize:        '13px',
                          cursor:          'pointer',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          gap:             '0.4rem',
                          transition:      'all 0.15s',
                        }}
                      >
                        {t === 'INDIVIDUAL' ? <User size={14} /> : <Users size={14} />}
                        {t === 'INDIVIDUAL' ? 'Individual' : 'Comunitaria'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título */}
              <div>
                <label style={labelStyle}>Título <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Terapia individual de seguimiento"
                  style={inputStyle}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Detalles de la actividad…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              {/* Fecha y Hora */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Fecha <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hora <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Responsable */}
              <div>
                <label style={labelStyle}>Responsable <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={form.responsable}
                  onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                  placeholder="Ej: Dr. Martínez"
                  style={inputStyle}
                />
              </div>

              {/* Ícono */}
              <div>
                <label style={labelStyle}>Ícono Representativo</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {ICONOS_OPCIONES.map(({ key, label }) => {
                    const IconComp = ICONOS[key];
                    const active   = form.icono === key;
                    const c        = form.tipo === 'INDIVIDUAL' ? SKY : VIOLET;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, icono: key }))}
                        title={label}
                        style={{
                          padding:         '0.6rem',
                          borderRadius:    '10px',
                          border:          active ? `2px solid ${c}` : '2px solid #e2e8f0',
                          backgroundColor: active ? `${c}10` : 'white',
                          color:           active ? c : '#94a3b8',
                          cursor:          'pointer',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          transition:      'all 0.15s',
                        }}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding:        '1.25rem 1.75rem',
              borderTop:      '1px solid #f1f5f9',
              display:        'flex',
              gap:            '0.75rem',
              justifyContent: 'flex-end',
              flexShrink:     0,
            }}>
              <button
                onClick={closeModal}
                disabled={createMutation.isPending}
                style={{
                  padding:         '0.75rem 1.5rem',
                  borderRadius:    '12px',
                  border:          '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color:           '#475569',
                  fontWeight:      '700',
                  fontSize:        '13px',
                  cursor:          createMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                style={{
                  padding:         '0.75rem 1.5rem',
                  borderRadius:    '12px',
                  border:          'none',
                  backgroundColor: isFormValid ? '#1e293b' : '#94a3b8',
                  color:           'white',
                  fontWeight:      '700',
                  fontSize:        '13px',
                  cursor:          isFormValid ? 'pointer' : 'not-allowed',
                  display:         'flex',
                  alignItems:      'center',
                  gap:             '0.4rem',
                  transition:      'background-color 0.15s',
                }}
              >
                {createMutation.isPending
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</>
                  : <><Plus size={14} /> Agregar Actividad</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
