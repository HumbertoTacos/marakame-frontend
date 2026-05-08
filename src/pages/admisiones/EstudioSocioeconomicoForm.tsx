import React, { useEffect, useState } from 'react';
import { useEstudioSocioeconomicoStore } from '../../stores/formDraftStore';
import {
  AlertCircle, FileText, ChevronRight, ChevronLeft, User, Home,
  DollarSign, HeartPulse, Utensils, Check, Users, Briefcase,
  TrendingDown, Plus, Trash2, Car, Phone, Clock, MapPin, PenLine
} from 'lucide-react';
import apiClient from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

// ─── Constantes ────────────────────────────────────────────────────────────

const STRUCT_FAM_VACIO = { nombre: '', parentesco: '', edad: '', sexo: '', estadoCivil: '', ocupacionLugar: '' };
const APORTANTE_VACIO  = { parentesco: '', cantidadMensual: '' };
const VEHICULO_VACIO   = { marca: '', modelo: '', propietario: '' };

const SECCIONES = [
  { num: 1, label: 'Datos Generales',              icon: User },
  { num: 2, label: 'Ingreso y Egreso Familiar',    icon: DollarSign },
  { num: 3, label: 'Ingresos / Egresos / Trans.',  icon: TrendingDown },
  { num: 4, label: 'Salud y Adicciones',           icon: HeartPulse },
  { num: 5, label: 'Vivienda y Alimentación',      icon: Home },
  { num: 6, label: 'Referencias Personales',       icon: Users },
  { num: 7, label: 'Diagnóstico',                  icon: FileText },
  { num: 8, label: 'Obs. Trab. Social',            icon: Briefcase },
  { num: 9, label: 'Visita y Firmas',              icon: MapPin },
];

const TOTAL_SECCIONES = SECCIONES.length;

const FRECUENCIAS    = ['Diario', 'Semanal', 'Quincenal', 'Rara vez', 'Nunca'];
const FRECUENCIAS_P5 = ['Diario', 'Cada tercer día', 'Una vez a la semana', 'Una vez al mes', 'Ocasionalmente'];
const ALIMENTOS_LIST_P5 = [
  { key: 'alim2_carneRes',    label: 'Carne de res' },
  { key: 'alim2_pollo',       label: 'Pollo' },
  { key: 'alim2_cerdo',       label: 'Cerdo' },
  { key: 'alim2_pescado',     label: 'Pescado' },
  { key: 'alim2_leche',       label: 'Leche' },
  { key: 'alim2_cereales',    label: 'Cereales' },
  { key: 'alim2_huevo',       label: 'Huevo' },
  { key: 'alim2_frutas',      label: 'Frutas' },
  { key: 'alim2_verduras',    label: 'Verduras' },
  { key: 'alim2_leguminosas', label: 'Leguminosas' },
];
const REFERENCIA_VACIO  = { nombre: '', telefono: '', relacion: '', tiempo: '' };

// ─── Estilos base ────────────────────────────────────────────────────────────

const S = {
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#334155',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1e293b',
    backgroundColor: 'white',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  },
  readonly: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#64748b',
    backgroundColor: '#f8fafc',
    cursor: 'not-allowed' as const,
    boxSizing: 'border-box' as const,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' } as React.CSSProperties,
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '16px',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '1.75rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f1f5f9',
  } as React.CSSProperties,
  subTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '1rem',
    paddingBottom: '0.6rem',
    borderBottom: '1px solid #f1f5f9',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as React.CSSProperties,
  infoBox: {
    padding: '1rem 1.25rem',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    fontSize: '13px',
    color: '#0369a1',
    fontWeight: '600',
    gridColumn: 'span 2' as unknown as number,
  } as React.CSSProperties,
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export function EstudioSocioeconomicoForm({ pacienteId }: { pacienteId: number }) {
  const navigate = useNavigate();

  const { datos, seccionActual, lastUpdated, setDatos, setSeccionActual, resetForm } =
    useEstudioSocioeconomicoStore();

  const [pacienteMaster, setPacienteMaster] = useState<any>(null);
  const [savedOk, setSavedOk]               = useState(false);
  const [fotoPreview, setFotoPreview]       = useState<string>(datos.solicitanteFoto ?? '');

  // Expirar borrador si lleva más de 20 minutos sin actividad
  useEffect(() => {
    if (Date.now() - lastUpdated > 20 * 60 * 1000) resetForm();
  }, []);

  // Cargar datos maestros del paciente y borrador previo
  useEffect(() => {
    const loadPaciente = async () => {
      try {
        const res = await apiClient.get(`/pacientes/${pacienteId}`);
        if (res.data.success) setPacienteMaster(res.data.data);
      } catch { /* silent */ }
    };
    const loadEstudio = async () => {
      try {
        const res = await apiClient.get(`/admisiones/estudio/paciente/${pacienteId}`);
        if (res.data.success && res.data.data) {
          setDatos(res.data.data.datos);
          setSeccionActual(res.data.data.seccionActual ?? 0);
        }
      } catch { /* silent */ }
    };
    loadPaciente();
    loadEstudio();
  }, [pacienteId]);

  // Pre-poblar campos del beneficiario desde el expediente maestro (solo si aún están vacíos)
  useEffect(() => {
    if (!pacienteMaster) return;
    const prefill: Record<string, string> = {};
    if (!datos.benef_nombre)          prefill.benef_nombre          = pacienteMaster.nombre          ?? '';
    if (!datos.benef_apellidoPaterno) prefill.benef_apellidoPaterno = pacienteMaster.apellidoPaterno ?? '';
    if (!datos.benef_apellidoMaterno) prefill.benef_apellidoMaterno = pacienteMaster.apellidoMaterno ?? '';
    if (!datos.benef_fechaNacimiento) prefill.benef_fechaNacimiento = pacienteMaster.fechaNacimiento
      ? String(pacienteMaster.fechaNacimiento).slice(0, 10) : '';
    if (!datos.benef_sexo)            prefill.benef_sexo            = pacienteMaster.sexo            ?? '';
    if (!datos.benef_escolaridad)     prefill.benef_escolaridad     = pacienteMaster.escolaridad     ?? '';
    if (!datos.benef_ocupacion)       prefill.benef_ocupacion       = pacienteMaster.ocupacion       ?? '';
    if (!datos.benef_estadoCivil)     prefill.benef_estadoCivil     = pacienteMaster.estadoCivil     ?? '';
    if (!datos.benef_telefono)        prefill.benef_telefono        = pacienteMaster.telefono        ?? '';
    if (!datos.benef_celular)         prefill.benef_celular         = pacienteMaster.celular         ?? '';
    if (Object.keys(prefill).length) setDatos(prefill);
  }, [pacienteMaster]);

  // ── Mutación ──────────────────────────────────────────────────────────────

  const guardarEstudio = useMutation({
    mutationFn: async ({ esUltimo }: { esUltimo: boolean }) =>
      apiClient.post('/admisiones/estudio', {
        pacienteId,
        datos,
        seccionActual,
        completado: esUltimo,
      }),
    onSuccess: (_, { esUltimo }) => {
      if (esUltimo) {
        resetForm();
        navigate('/admisiones/seguimiento');
      } else {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 1800);
        setSeccionActual(seccionActual + 1);
      }
    },
  });

  const handleSiguiente = () => guardarEstudio.mutate({ esUltimo: false });
  const handleFinalizar = () => guardarEstudio.mutate({ esUltimo: true });
  const handleAnterior  = () => setSeccionActual(Math.max(0, seccionActual - 1));

  const inp = (name: string) => ({
    name,
    value: datos[name] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { type } = e.target;
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setDatos({ [name]: val });
    },
    style: S.input,
  });


  // ── Características de vivienda (sección V) ──────────────────────────────

  const caracteristicasViv: string[] = datos.viv2_caracteristicas ?? [];
  const toggleCaracteristicaViv = (c: string) => {
    const updated = caracteristicasViv.includes(c)
      ? caracteristicasViv.filter(x => x !== c)
      : [...caracteristicasViv, c];
    setDatos({ viv2_caracteristicas: updated });
  };

  // ── Foto del solicitante ─────────────────────────────────────────────────

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFotoPreview(dataUrl);
      setDatos({ solicitanteFoto: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // ── Referencias del solicitante ──────────────────────────────────────────

  const referencias: string[] = datos.referencias ?? [''];
  const setReferencias   = (refs: string[]) => setDatos({ referencias: refs });
  const addReferencia    = () => setReferencias([...referencias, '']);
  const removeReferencia = (i: number) => setReferencias(referencias.filter((_, idx) => idx !== i));
  const updateReferencia = (i: number, val: string) =>
    setReferencias(referencias.map((r, idx) => (idx === i ? val : r)));

  // ── Estructura familiar del beneficiario ─────────────────────────────────

  const estructuraFamiliar: typeof STRUCT_FAM_VACIO[] = datos.estructuraFamiliarBenef ?? [{ ...STRUCT_FAM_VACIO }];
  const setEstructuraFamiliar = (rows: typeof STRUCT_FAM_VACIO[]) => setDatos({ estructuraFamiliarBenef: rows });
  const addMiembroFam    = () => setEstructuraFamiliar([...estructuraFamiliar, { ...STRUCT_FAM_VACIO }]);
  const removeMiembroFam = (i: number) => setEstructuraFamiliar(estructuraFamiliar.filter((_, idx) => idx !== i));
  const updateMiembroFam = (i: number, field: string, value: string) =>
    setEstructuraFamiliar(estructuraFamiliar.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  // ── Aportantes externos (sección II) ─────────────────────────────────────

  const aportantesExt: typeof APORTANTE_VACIO[] = datos.aportantesExt ?? [{ ...APORTANTE_VACIO }];
  const setAportantesExt = (rows: typeof APORTANTE_VACIO[]) => setDatos({ aportantesExt: rows });
  const addAportante     = () => setAportantesExt([...aportantesExt, { ...APORTANTE_VACIO }]);
  const removeAportante  = (i: number) => setAportantesExt(aportantesExt.filter((_, idx) => idx !== i));
  const updateAportante  = (i: number, field: string, value: string) =>
    setAportantesExt(aportantesExt.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));

  // ── Vehículos (sección III) ───────────────────────────────────────────────

  const vehiculos: typeof VEHICULO_VACIO[] = datos.vehiculos ?? [{ ...VEHICULO_VACIO }];
  const setVehiculos = (rows: typeof VEHICULO_VACIO[]) => setDatos({ vehiculos: rows });
  const addVehiculo     = () => setVehiculos([...vehiculos, { ...VEHICULO_VACIO }]);
  const removeVehiculo  = (i: number) => setVehiculos(vehiculos.filter((_, idx) => idx !== i));
  const updateVehiculo  = (i: number, field: string, value: string) =>
    setVehiculos(vehiculos.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));

  // ── Referencias personales (sección XVII) ────────────────────────────────

  const refPersonales: typeof REFERENCIA_VACIO[] = datos.refPersonales ?? [{ ...REFERENCIA_VACIO }, { ...REFERENCIA_VACIO }];
  const setRefPersonales  = (rows: typeof REFERENCIA_VACIO[]) => setDatos({ refPersonales: rows });
  const addRefPersonal    = () => setRefPersonales([...refPersonales, { ...REFERENCIA_VACIO }]);
  const removeRefPersonal = (i: number) => {
    if (refPersonales.length <= 1) return;
    setRefPersonales(refPersonales.filter((_, idx) => idx !== i));
  };
  const updateRefPersonal = (i: number, field: string, value: string) =>
    setRefPersonales(refPersonales.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  // ── Totales sección III ───────────────────────────────────────────────────

  const totalIngresosP3 = ['ingreso_solicitante', 'ingreso_conyuge', 'ingreso_hijos', 'ingreso_otros']
    .reduce((sum, k) => sum + (parseFloat(datos[k]) || 0), 0);

  const totalEgresosP3 = [
    'egreso_alimentacion', 'egreso_rentaPredio', 'egreso_luz', 'egreso_agua',
    'egreso_combustible',  'egreso_transporte2', 'egreso_educacion', 'egreso_telefono',
    'egreso_gastosMedicos', 'egreso_esparcimiento2', 'egreso_otros2',
  ].reduce((sum, k) => sum + (parseFloat(datos[k]) || 0), 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Stepper ─────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '1.5rem 2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f1f5f9',
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: 'max-content' }}>
          {SECCIONES.map((sec, idx) => {
            const done   = idx < seccionActual;
            const active = idx === seccionActual;
            return (
              <React.Fragment key={idx}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', minWidth: '64px' }}
                  onClick={() => setSeccionActual(idx)}
                  title={sec.label}
                >
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '800',
                    transition: 'all 0.2s',
                    backgroundColor: done ? '#0f172a' : active ? '#1e293b' : '#f1f5f9',
                    color: done || active ? 'white' : '#94a3b8',
                    border: active ? '2px solid #1e293b' : '2px solid transparent',
                    boxShadow: active ? '0 0 0 4px rgba(30,41,59,0.12)' : 'none',
                  }}>
                    {done ? <Check size={14} /> : sec.num}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: active ? '800' : '500', color: active ? '#1e293b' : '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sec.label}
                  </span>
                </div>
                {idx < SECCIONES.length - 1 && (
                  <div style={{ flex: 1, height: '2px', backgroundColor: idx < seccionActual ? '#0f172a' : '#e2e8f0', minWidth: '16px', marginBottom: '18px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Tarjeta del formulario ──────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
        border: '1px solid #f1f5f9',
        minHeight: '480px',
      }}>

        {/* ══════════════ PASO 1: DATOS DEL SOLICITANTE Y BENEFICIARIO ══════ */}
        {seccionActual === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* ── BLOQUE A: SOLICITANTE ─────────────────────────────────────── */}
            <section>
              <div style={{ ...S.sectionTitle, color: '#1d4ed8', borderBottomColor: '#bfdbfe' }}>
                <User size={20} color="#1d4ed8" /> A. Datos Generales del Solicitante
              </div>

              {/* Fila: foto + fecha estudio */}
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{
                    width: '100px', height: '120px', borderRadius: '12px', border: '2px dashed #cbd5e1',
                    backgroundColor: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {fotoPreview
                      ? <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={40} color="#cbd5e1" />}
                  </div>
                  <label style={{ cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#475569', padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                    Subir foto
                    <input type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Fecha de estudio</label>
                  <input {...inp('fechaEstudio')} type="date" />
                </div>
              </div>

              {/* Nombre completo */}
              <div style={{ ...S.grid3, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Nombre(s)</label>
                  <input {...inp('sol_nombre')} placeholder="Nombre(s)" />
                </div>
                <div>
                  <label style={S.label}>Apellido paterno</label>
                  <input {...inp('sol_apellidoPaterno')} placeholder="Apellido paterno" />
                </div>
                <div>
                  <label style={S.label}>Apellido materno</label>
                  <input {...inp('sol_apellidoMaterno')} placeholder="Apellido materno" />
                </div>
              </div>

              {/* Nacimiento / edad / sexo */}
              <div style={{ ...S.grid3, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Fecha de nacimiento</label>
                  <input {...inp('sol_fechaNacimiento')} type="date" />
                </div>
                <div>
                  <label style={S.label}>Lugar de nacimiento</label>
                  <input {...inp('sol_lugarNacimiento')} placeholder="Ciudad, Estado" />
                </div>
                <div>
                  <label style={S.label}>Edad</label>
                  <input {...inp('sol_edad')} type="number" min="0" max="120" placeholder="Años" />
                </div>
              </div>

              {/* Sexo / escolaridad / ocupación / estado civil */}
              <div style={{ ...S.grid2, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Sexo</label>
                  <div style={{ display: 'flex', gap: '2rem', paddingTop: '0.5rem' }}>
                    {[['M', 'Masculino'], ['F', 'Femenino']].map(([v, l]) => (
                      <label key={v} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                        <input type="radio" name="sol_sexo" checked={datos.sol_sexo === v} onChange={() => setDatos({ sol_sexo: v })} /> {l}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={S.label}>Estado civil</label>
                  <select {...inp('sol_estadoCivil')}>
                    <option value="">Seleccione...</option>
                    {['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Separado(a)', 'Viudo(a)'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Escolaridad</label>
                  <select {...inp('sol_escolaridad')}>
                    <option value="">Seleccione...</option>
                    {['Sin escolaridad', 'Primaria', 'Secundaria', 'Preparatoria / Bachillerato', 'Técnico / Comercial', 'Licenciatura', 'Posgrado'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Ocupación</label>
                  <input {...inp('sol_ocupacion')} placeholder="Ej: Comerciante, Ama de casa..." />
                </div>
              </div>

              {/* Dirección */}
              <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem', fontWeight: '700', fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Domicilio del solicitante</p>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={S.label}>Calle</label>
                    <input {...inp('sol_calle')} placeholder="Nombre de la calle" />
                  </div>
                  <div>
                    <label style={S.label}>Núm. exterior</label>
                    <input {...inp('sol_numExt')} placeholder="Ej: 145" />
                  </div>
                  <div>
                    <label style={S.label}>Núm. interior</label>
                    <input {...inp('sol_numInt')} placeholder="Ej: 3-B" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={S.label}>Colonia</label>
                    <input {...inp('sol_colonia')} placeholder="Colonia" />
                  </div>
                  <div>
                    <label style={S.label}>Municipio / Delegación</label>
                    <input {...inp('sol_municipio')} placeholder="Municipio" />
                  </div>
                  <div>
                    <label style={S.label}>C.P.</label>
                    <input {...inp('sol_cp')} placeholder="00000" maxLength={5} />
                  </div>
                  <div>
                    <label style={S.label}>Ciudad / Estado</label>
                    <input {...inp('sol_ciudad')} placeholder="Ciudad, Estado" />
                  </div>
                </div>
              </div>

              {/* Teléfonos */}
              <div style={{ ...S.grid2, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Teléfono fijo</label>
                  <input {...inp('sol_telFijo')} placeholder="(000) 000-0000" />
                </div>
                <div>
                  <label style={S.label}>Celular</label>
                  <input {...inp('sol_celular')} placeholder="(000) 000-0000" />
                </div>
              </div>

              {/* Tarjetas */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={S.label}>¿Cuenta con tarjeta?</label>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                  {[['sol_tarjetaCredito', 'Crédito'], ['sol_tarjetaDebito', 'Débito'], ['sol_tarjetaAhorro', 'Ahorro']].map(([key, label]) => (
                    <label key={key} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                      <input
                        type="checkbox"
                        checked={!!datos[key]}
                        onChange={e => setDatos({ [key]: e.target.checked })}
                      /> {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Referencias */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={S.label}>Referencias personales</label>
                  <button type="button" onClick={addReferencia}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                    <Plus size={13} /> Agregar
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {referencias.map((ref, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        value={ref}
                        onChange={e => updateReferencia(i, e.target.value)}
                        placeholder={`Referencia ${i + 1}: nombre, teléfono, relación...`}
                        style={{ ...S.input, flex: 1 }}
                      />
                      <button type="button" onClick={() => removeReferencia(i)} disabled={referencias.length === 1}
                        style={{ padding: '0.5rem', border: 'none', background: 'none', cursor: referencias.length === 1 ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: referencias.length === 1 ? 0.3 : 1, flexShrink: 0 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── BLOQUE B: BENEFICIARIO ────────────────────────────────────── */}
            <section>
              <div style={{ ...S.sectionTitle, color: '#065f46', borderBottomColor: '#a7f3d0' }}>
                <User size={20} color="#059669" /> B. Datos Generales del Beneficiario (Paciente)
              </div>

              <div style={{ ...S.grid3, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Nombre(s)</label>
                  <input {...inp('benef_nombre')} placeholder="Nombre(s)" />
                </div>
                <div>
                  <label style={S.label}>Apellido paterno</label>
                  <input {...inp('benef_apellidoPaterno')} placeholder="Apellido paterno" />
                </div>
                <div>
                  <label style={S.label}>Apellido materno</label>
                  <input {...inp('benef_apellidoMaterno')} placeholder="Apellido materno" />
                </div>
              </div>

              <div style={{ ...S.grid3, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Fecha de nacimiento</label>
                  <input {...inp('benef_fechaNacimiento')} type="date" />
                </div>
                <div>
                  <label style={S.label}>Lugar de nacimiento</label>
                  <input {...inp('benef_lugarNacimiento')} placeholder="Ciudad, Estado" />
                </div>
                <div>
                  <label style={S.label}>Edad</label>
                  <input {...inp('benef_edad')} type="number" min="0" max="120" placeholder="Años" />
                </div>
              </div>

              <div style={{ ...S.grid2, marginBottom: '1.5rem' }}>
                <div>
                  <label style={S.label}>Sexo</label>
                  <div style={{ display: 'flex', gap: '2rem', paddingTop: '0.5rem' }}>
                    {[['M', 'Masculino'], ['F', 'Femenino']].map(([v, l]) => (
                      <label key={v} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                        <input type="radio" name="benef_sexo" checked={datos.benef_sexo === v} onChange={() => setDatos({ benef_sexo: v })} /> {l}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={S.label}>Estado civil</label>
                  <select {...inp('benef_estadoCivil')}>
                    <option value="">Seleccione...</option>
                    {['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Separado(a)', 'Viudo(a)'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Escolaridad</label>
                  <select {...inp('benef_escolaridad')}>
                    <option value="">Seleccione...</option>
                    {['Sin escolaridad', 'Primaria', 'Secundaria', 'Preparatoria / Bachillerato', 'Técnico / Comercial', 'Licenciatura', 'Posgrado'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Ocupación</label>
                  <input {...inp('benef_ocupacion')} placeholder="Ej: Estudiante, Empleado..." />
                </div>
              </div>

              {/* Dirección beneficiario */}
              <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem', fontWeight: '700', fontSize: '12px', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Domicilio del beneficiario</p>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={S.label}>Calle</label>
                    <input {...inp('benef_calle')} placeholder="Nombre de la calle" />
                  </div>
                  <div>
                    <label style={S.label}>Núm. exterior</label>
                    <input {...inp('benef_numExt')} placeholder="Ej: 145" />
                  </div>
                  <div>
                    <label style={S.label}>Núm. interior</label>
                    <input {...inp('benef_numInt')} placeholder="Ej: 3-B" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={S.label}>Colonia</label>
                    <input {...inp('benef_colonia')} placeholder="Colonia" />
                  </div>
                  <div>
                    <label style={S.label}>Municipio / Delegación</label>
                    <input {...inp('benef_municipio')} placeholder="Municipio" />
                  </div>
                  <div>
                    <label style={S.label}>C.P.</label>
                    <input {...inp('benef_cp')} placeholder="00000" maxLength={5} />
                  </div>
                  <div>
                    <label style={S.label}>Ciudad / Estado</label>
                    <input {...inp('benef_ciudad')} placeholder="Ciudad, Estado" />
                  </div>
                </div>
              </div>

              <div style={{ ...S.grid2, marginBottom: '2rem' }}>
                <div>
                  <label style={S.label}>Teléfono fijo</label>
                  <input {...inp('benef_telefono')} placeholder="(000) 000-0000" />
                </div>
                <div>
                  <label style={S.label}>Celular</label>
                  <input {...inp('benef_celular')} placeholder="(000) 000-0000" />
                </div>
              </div>

              {/* Estructura familiar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '700', color: '#334155', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Estructura familiar</span>
                  <button type="button" onClick={addMiembroFam}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#065f46' }}>
                    <Plus size={13} /> Agregar integrante
                  </button>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0fdf4' }}>
                        {['Nombre completo', 'Parentesco', 'Edad', 'Sexo', 'Estado civil', 'Ocupación / Lugar', ''].map(h => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: '#065f46', borderBottom: '1px solid #bbf7d0', whiteSpace: 'nowrap', fontSize: '12px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {estructuraFamiliar.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input value={m.nombre} onChange={e => updateMiembroFam(i, 'nombre', e.target.value)} style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input value={m.parentesco} onChange={e => updateMiembroFam(i, 'parentesco', e.target.value)} style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', width: '70px' }}>
                            <input value={m.edad} onChange={e => updateMiembroFam(i, 'edad', e.target.value)} type="number" min="0" style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', width: '80px' }}>
                            <select value={m.sexo} onChange={e => updateMiembroFam(i, 'sexo', e.target.value)} style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }}>
                              <option value="">-</option>
                              <option value="M">M</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <select value={m.estadoCivil} onChange={e => updateMiembroFam(i, 'estadoCivil', e.target.value)} style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }}>
                              <option value="">-</option>
                              {['Soltero(a)', 'Casado(a)', 'U. libre', 'Divorciado(a)', 'Viudo(a)'].map(o => <option key={o}>{o}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input value={m.ocupacionLugar} onChange={e => updateMiembroFam(i, 'ocupacionLugar', e.target.value)} placeholder="Ocupación / empresa" style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <button type="button" onClick={() => removeMiembroFam(i)} disabled={estructuraFamiliar.length === 1}
                              style={{ padding: '0.4rem', border: 'none', background: 'none', cursor: estructuraFamiliar.length === 1 ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: estructuraFamiliar.length === 1 ? 0.3 : 1 }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══════════════ PASO 2: INGRESO Y EGRESO FAMILIAR ════════════════════ */}
        {seccionActual === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={S.sectionTitle}><DollarSign size={20} color="#10b981" /> II. Ingreso y Egreso Familiar</div>

            {/* A: Empleo del solicitante */}
            <section>
              <div style={{ ...S.subTitle, color: '#065f46' }}>
                <Briefcase size={15} color="#059669" /> A. Datos de Empleo del Solicitante
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>¿Cuenta con empleo actual?</label>
                  <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.5rem' }}>
                    {['Sí', 'No'].map(v => (
                      <label key={v} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                        <input type="radio" name="cuentaConEmpleo" checked={datos.cuentaConEmpleo === v} onChange={() => setDatos({ cuentaConEmpleo: v })} /> {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={S.label}>Ocupación</label>
                  <select {...inp('ocupacionTipo')}>
                    <option value="">Seleccione...</option>
                    {['Desempleado', 'Empleo temporal', 'Obrero / Empleado', 'Profesional', 'Empresario'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                {datos.cuentaConEmpleo === 'Sí' && (
                  <>
                    <div>
                      <label style={S.label}>Empresa en la que labora</label>
                      <input {...inp('empresaLabora')} placeholder="Nombre de la empresa" />
                    </div>
                    <div>
                      <label style={S.label}>Antigüedad</label>
                      <input {...inp('antiguedadEmpleo')} placeholder="Ej: 2 años, 6 meses..." />
                    </div>
                    <div>
                      <label style={S.label}>Puesto que ocupa</label>
                      <input {...inp('puestoOcupa')} placeholder="Ej: Contador, Operario..." />
                    </div>
                    <div>
                      <label style={S.label}>Horario de trabajo</label>
                      <input {...inp('horarioTrabajo')} placeholder="Ej: 8:00 – 17:00, Lun–Vie" />
                    </div>
                  </>
                )}
                <div>
                  <label style={S.label}>Número de dependientes económicos</label>
                  <input {...inp('numDependientesEconomicos')} type="number" min="0" placeholder="Ej: 3" />
                </div>
                <div>
                  <label style={S.label}>Ingreso mensual neto ($)</label>
                  <input {...inp('ingresoMensualNeto')} type="number" min="0" step="0.01" placeholder="$0.00" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={S.label}>Otros ingresos</label>
                  <input {...inp('otrosIngresos')} placeholder="Ej: Renta de propiedad, pensión alimenticia, apoyos..." />
                </div>
              </div>
            </section>

            {/* B: Datos del cónyuge */}
            <section>
              <div style={{ ...S.subTitle, color: '#1d4ed8' }}>
                <Users size={15} color="#1d4ed8" /> B. Datos del Cónyuge
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Ocupación del cónyuge</label>
                  <input {...inp('conyuge_ocupacion')} placeholder="Ej: Ama de casa, Comerciante..." />
                </div>
                <div>
                  <label style={S.label}>Empresa donde labora</label>
                  <input {...inp('conyuge_empresa')} placeholder="Nombre de la empresa o negocio" />
                </div>
                <div>
                  <label style={S.label}>Antigüedad</label>
                  <input {...inp('conyuge_antiguedad')} placeholder="Ej: 1 año, 3 meses..." />
                </div>
                <div>
                  <label style={S.label}>Ingreso mensual neto ($)</label>
                  <input {...inp('conyuge_ingresoNeto')} type="number" min="0" step="0.01" placeholder="$0.00" />
                </div>
              </div>
            </section>

            {/* C: Otros aportantes */}
            <section>
              <div style={{ ...S.subTitle, color: '#7c3aed' }}>
                <Users size={15} color="#7c3aed" /> C. Otros Aportantes al Ingreso Familiar
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={S.label}>¿Otro miembro de la familia aporta al ingreso familiar?</label>
                <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.5rem' }}>
                  {['Sí', 'No'].map(v => (
                    <label key={v} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                      <input type="radio" name="otroMiembroAporta" checked={datos.otroMiembroAporta === v} onChange={() => setDatos({ otroMiembroAporta: v })} /> {v}
                    </label>
                  ))}
                </div>
              </div>
              {datos.otroMiembroAporta === 'Sí' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                    <button type="button" onClick={addAportante}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>
                      <Plus size={13} /> Agregar
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f3ff' }}>
                          {['Parentesco', 'Cantidad mensual aportada ($)', ''].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: '#7c3aed', borderBottom: '1px solid #ddd6fe', whiteSpace: 'nowrap', fontSize: '12px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aportantesExt.map((a, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                value={a.parentesco}
                                onChange={e => updateAportante(i, 'parentesco', e.target.value)}
                                placeholder="Ej: Hermano(a), Hijo(a)..."
                                style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                value={a.cantidadMensual}
                                onChange={e => updateAportante(i, 'cantidadMensual', e.target.value)}
                                type="number" min="0" step="0.01" placeholder="$0.00"
                                style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <button type="button" onClick={() => removeAportante(i)} disabled={aportantesExt.length === 1}
                                style={{ padding: '0.4rem', border: 'none', background: 'none', cursor: aportantesExt.length === 1 ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: aportantesExt.length === 1 ? 0.3 : 1 }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* ══════════════ PASO 3: INGRESOS / EGRESOS / TRANSPORTE ══════════════ */}
        {seccionActual === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={S.sectionTitle}><TrendingDown size={20} color="#ef4444" /> III. Ingresos Mensuales, Egresos Mensuales y Transporte</div>

            {/* A: Ingresos mensuales */}
            <section>
              <div style={{ ...S.subTitle, color: '#065f46' }}>
                <DollarSign size={15} color="#059669" /> A. Ingresos Mensuales
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0fdf4' }}>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '700', color: '#065f46', borderBottom: '1px solid #bbf7d0', fontSize: '12px', width: '50%' }}>Fuente</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '700', color: '#065f46', borderBottom: '1px solid #bbf7d0', fontSize: '12px' }}>Cantidad ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'ingreso_solicitante', label: 'Solicitante' },
                      { key: 'ingreso_conyuge',     label: 'Esposo(a)' },
                      { key: 'ingreso_hijos',       label: 'Hijos(as)' },
                      { key: 'ingreso_otros',       label: 'Otros' },
                    ].map(({ key, label }) => (
                      <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 1.25rem', fontWeight: '600', color: '#374151' }}>{label}</td>
                        <td style={{ padding: '0.4rem 0.75rem' }}>
                          <input {...inp(key)} type="number" min="0" step="0.01" placeholder="$0.00" />
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f0fdf4' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#065f46', fontSize: '14px' }}>Total</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#065f46', fontSize: '16px' }}>
                        ${totalIngresosP3.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* B: Egresos mensuales */}
            <section>
              <div style={{ ...S.subTitle, color: '#b91c1c' }}>
                <TrendingDown size={15} color="#ef4444" /> B. Egresos Mensuales
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fef2f2' }}>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '700', color: '#b91c1c', borderBottom: '1px solid #fecaca', fontSize: '12px', width: '50%' }}>Concepto</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '700', color: '#b91c1c', borderBottom: '1px solid #fecaca', fontSize: '12px' }}>Cantidad ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'egreso_alimentacion',   label: 'Alimentación' },
                      { key: 'egreso_rentaPredio',    label: 'Renta o predio' },
                      { key: 'egreso_luz',            label: 'Luz' },
                      { key: 'egreso_agua',           label: 'Agua' },
                      { key: 'egreso_combustible',    label: 'Combustible' },
                      { key: 'egreso_transporte2',    label: 'Transporte' },
                      { key: 'egreso_educacion',      label: 'Educación' },
                      { key: 'egreso_telefono',       label: 'Teléfono' },
                      { key: 'egreso_gastosMedicos',  label: 'Gastos médicos' },
                      { key: 'egreso_esparcimiento2', label: 'Esparcimiento' },
                      { key: 'egreso_otros2',         label: 'Otros' },
                    ].map(({ key, label }) => (
                      <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 1.25rem', fontWeight: '600', color: '#374151' }}>{label}</td>
                        <td style={{ padding: '0.4rem 0.75rem' }}>
                          <input {...inp(key)} type="number" min="0" step="0.01" placeholder="$0.00" />
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#fef2f2' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#b91c1c', fontSize: '14px' }}>Total</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '800', color: '#b91c1c', fontSize: '16px' }}>
                        ${totalEgresosP3.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Resultado financiero */}
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '12px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontWeight: '700', color: '#92400e', fontSize: '14px', flexShrink: 0 }}>Resultado financiero:</span>
              <select {...inp('resultadoFinanciero')} style={{ ...S.input, maxWidth: '200px' }}>
                <option value="">Seleccione...</option>
                <option value="superavit">Superávit</option>
                <option value="deficit">Déficit</option>
              </select>
              <span style={{ fontSize: '13px', color: '#78350f', fontStyle: 'italic' }}>
                Diferencia calculada: {(totalIngresosP3 - totalEgresosP3) >= 0 ? '+' : ''}${(totalIngresosP3 - totalEgresosP3).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* C: Transporte */}
            <section>
              <div style={{ ...S.subTitle, color: '#1d4ed8' }}>
                <Car size={15} color="#1d4ed8" /> C. Transporte
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>¿Cuenta con automóvil?</label>
                  <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.5rem' }}>
                    {['Sí', 'No'].map(v => (
                      <label key={v} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                        <input type="radio" name="cuentaConAutomovil" checked={datos.cuentaConAutomovil === v} onChange={() => setDatos({ cuentaConAutomovil: v })} /> {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={S.label}>Clasificación</label>
                  <select {...inp('clasificacionAutomoviles')}>
                    <option value="">Seleccione...</option>
                    <option value="ninguno">Ninguno</option>
                    <option value="1-2 autos">1–2 autos</option>
                    <option value="mas de 2 autos">Más de 2 autos</option>
                  </select>
                </div>
                {datos.cuentaConAutomovil === 'Sí' && (
                  <div>
                    <label style={S.label}>Cantidad de automóviles</label>
                    <input {...inp('cantidadAutomoviles')} type="number" min="1" placeholder="Ej: 1" />
                  </div>
                )}
              </div>

              {datos.cuentaConAutomovil === 'Sí' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '700', color: '#334155', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Detalle de vehículos</span>
                    <button type="button" onClick={addVehiculo}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>
                      <Plus size={13} /> Agregar vehículo
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#eff6ff' }}>
                          {['Marca', 'Modelo', 'Propietario', ''].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: '#1d4ed8', borderBottom: '1px solid #bfdbfe', whiteSpace: 'nowrap', fontSize: '12px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vehiculos.map((v, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input value={v.marca} onChange={e => updateVehiculo(i, 'marca', e.target.value)} placeholder="Ej: Toyota" style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input value={v.modelo} onChange={e => updateVehiculo(i, 'modelo', e.target.value)} placeholder="Ej: Corolla 2019" style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input value={v.propietario} onChange={e => updateVehiculo(i, 'propietario', e.target.value)} placeholder="Nombre del propietario" style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <button type="button" onClick={() => removeVehiculo(i)} disabled={vehiculos.length === 1}
                                style={{ padding: '0.4rem', border: 'none', background: 'none', cursor: vehiculos.length === 1 ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: vehiculos.length === 1 ? 0.3 : 1 }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ══════════════ PASO 4: SALUD Y ADICCIONES ═══════════════════════════ */}
        {seccionActual === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={S.sectionTitle}><HeartPulse size={20} color="#ef4444" /> IV. Salud y Adicciones</div>

            {/* A: Asistencia médica */}
            <section>
              <div style={{ ...S.subTitle, color: '#1d4ed8' }}>
                <HeartPulse size={15} color="#1d4ed8" /> A. Asistencia Médica
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Tipo de asistencia médica</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '0.5rem' }}>
                    {[
                      ['salud_issste',             'ISSSTE'],
                      ['salud_imss',               'IMSS'],
                      ['salud_seguroPopular',       'Seguro Popular'],
                      ['salud_consultaParticular',  'Consulta particular'],
                    ].map(([key, label]) => (
                      <label key={key} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                        <input type="checkbox" checked={!!datos[key]} onChange={e => setDatos({ [key]: e.target.checked })} /> {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={S.label}>Monto en consultas ($)</label>
                    <input {...inp('salud_montoConsultas')} type="number" min="0" step="0.01" placeholder="$0.00" />
                  </div>
                  <div>
                    <label style={S.label}>Núm. de miembros con asistencia médica</label>
                    <input {...inp('salud_numMiembrosAsistencia')} type="number" min="0" placeholder="Ej: 3" />
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={S.label}>Otros servicios médicos</label>
                  <input {...inp('salud_otrosServicios')} placeholder="Ej: Cruz Roja, médico de empresa, seguro privado..." />
                </div>
              </div>
            </section>

            {/* B: Adicciones */}
            <section>
              <div style={{ ...S.subTitle, color: '#b91c1c' }}>
                <AlertCircle size={15} color="#ef4444" /> B. Adicciones
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fef2f2' }}>
                      {['Tipo', '¿Presente?', 'Cantidad', 'Frecuencia'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: '#b91c1c', borderBottom: '1px solid #fecaca', whiteSpace: 'nowrap', fontSize: '12px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'adic_alcoholismo',  label: 'Alcoholismo' },
                      { key: 'adic_tca',          label: 'TCA / Ludopatía' },
                      { key: 'adic_drogadiccion', label: 'Drogadicción' },
                    ].map(({ key, label }) => (
                      <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>{label}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '13px' }}>
                            <input type="checkbox" checked={!!datos[key]} onChange={e => setDatos({ [key]: e.target.checked })} />
                            {datos[key] ? 'Sí' : 'No'}
                          </label>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <input
                            {...inp(`${key}_cantidad`)}
                            placeholder="Ej: 3 cervezas, 1 dosis..."
                            style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px', opacity: datos[key] ? 1 : 0.4 }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <input
                            {...inp(`${key}_frecuencia`)}
                            placeholder="Ej: Diario, fines de semana..."
                            style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px', opacity: datos[key] ? 1 : 0.4 }}
                          />
                        </td>
                      </tr>
                    ))}
                    {/* Otros */}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input
                          {...inp('adic_otros')}
                          placeholder="Otro (especificar)"
                          style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '13px' }}>
                          <input type="checkbox" checked={!!datos.adic_otros_presente} onChange={e => setDatos({ adic_otros_presente: e.target.checked })} />
                          {datos.adic_otros_presente ? 'Sí' : 'No'}
                        </label>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input
                          {...inp('adic_otros_cantidad')}
                          placeholder="Cantidad"
                          style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px', opacity: datos.adic_otros_presente ? 1 : 0.4 }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input
                          {...inp('adic_otros_frecuencia')}
                          placeholder="Frecuencia"
                          style={{ ...S.input, padding: '0.4rem 0.6rem', fontSize: '13px', opacity: datos.adic_otros_presente ? 1 : 0.4 }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <label style={S.label}>Relación familiar (descripción)</label>
                <textarea
                  {...inp('adic_relacionFamiliar')}
                  rows={3}
                  style={{ ...S.input, resize: 'vertical' }}
                  placeholder="Describa la dinámica familiar en torno a las adicciones..."
                />
              </div>
            </section>
          </div>
        )}

        {/* ══════════════ PASO 5: VIVIENDA Y ALIMENTACIÓN ══════════════════════ */}
        {seccionActual === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={S.sectionTitle}><Home size={20} color="#6366f1" /> V. Vivienda y Alimentación</div>

            {/* A: Vivienda */}
            <section>
              <div style={{ ...S.subTitle, color: '#4c1d95' }}>
                <Home size={15} color="#6366f1" /> A. Vivienda
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Régimen de vivienda</label>
                  <select {...inp('viv2_regimen')}>
                    <option value="">Seleccione...</option>
                    {['Sin vivienda', 'Familiar', 'Prestada', 'Rentada', 'Propia', 'Más de una vivienda'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Tipo de vivienda</label>
                  <select {...inp('viv2_tipo')}>
                    <option value="">Seleccione...</option>
                    {['Vecindad', 'Condominio', 'Interés social', 'Casa habitación', 'Residencial media', 'Residencial alta'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Espacio</label>
                  <select {...inp('viv2_espacio')}>
                    <option value="">Seleccione...</option>
                    {['1 cuarto', '2 dormitorios', '3 dormitorios', '4 dormitorios', 'Más de 4'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={S.label}>Características</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                    {['Sala', 'Comedor', 'Cocina', '1 baño', '2 baños', '3 baños', '4 baños', 'Jardín', 'Otros'].map(c => (
                      <label key={c} style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                        <input type="checkbox" checked={caracteristicasViv.includes(c)} onChange={() => toggleCaracteristicaViv(c)} /> {c}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Materiales */}
              <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f5f3ff', borderRadius: '14px', border: '1px solid #ddd6fe', marginTop: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem', fontWeight: '700', color: '#4c1d95', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material de construcción</p>
                <div style={S.grid3}>
                  <div>
                    <label style={S.label}>Piso</label>
                    <select {...inp('viv2_piso')}>
                      <option value="">Seleccione...</option>
                      {['Tierra', 'Concreto', 'Mosaico', 'Vitropiso', 'Otros'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Muros</label>
                    <select {...inp('viv2_muros')}>
                      <option value="">Seleccione...</option>
                      {['Adobe', 'Tabique', 'Concreto', 'Otros'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Techo</label>
                    <select {...inp('viv2_techo')}>
                      <option value="">Seleccione...</option>
                      {['Lámina cartón', 'Lámina asbesto', 'Concreto', 'Otros'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={S.label}>Otros materiales</label>
                  <input {...inp('viv2_otrosMateriales')} placeholder="Describa otros materiales..." />
                </div>
              </div>
            </section>

            {/* B: Alimentación */}
            <section>
              <div style={{ ...S.subTitle, color: '#92400e' }}>
                <Utensils size={15} color="#f59e0b" /> B. Alimentación
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fffbeb' }}>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '700', color: '#92400e', borderBottom: '1px solid #fde68a', fontSize: '12px', width: '40%' }}>Alimento</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: '700', color: '#92400e', borderBottom: '1px solid #fde68a', fontSize: '12px' }}>Frecuencia de consumo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALIMENTOS_LIST_P5.map(al => (
                      <tr key={al.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: '600', color: '#374151' }}>{al.label}</td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <select
                            name={al.key}
                            value={datos[al.key] ?? ''}
                            onChange={e => setDatos({ [al.key]: e.target.value })}
                            style={{ ...S.input, padding: '0.5rem 0.75rem' }}
                          >
                            <option value="">Seleccione...</option>
                            {FRECUENCIAS_P5.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
        {/* ══════════════ PASO 6: REFERENCIAS PERSONALES ═══════════════════════ */}
        {seccionActual === 5 && (
          <>
            <div style={S.sectionTitle}><Users size={20} color="#3b82f6" /> VI. Referencias Personales</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem', fontWeight: '500' }}>
              Registre las referencias personales del solicitante: nombre completo, teléfono, relación y tiempo de conocerse.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={addRefPersonal}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1.1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus size={14} /> Agregar Referencia
              </button>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', width: '36px' }}>#</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Nombre</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Teléfono</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Relación</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Tiempo de conocerse</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {refPersonales.map((ref, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                          <User size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                          <input value={ref.nombre} onChange={e => updateRefPersonal(i, 'nombre', e.target.value)} placeholder="Nombre completo" style={{ ...S.input, paddingLeft: '2rem', fontSize: '13px' }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                          <Phone size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                          <input value={ref.telefono} onChange={e => updateRefPersonal(i, 'telefono', e.target.value)} placeholder="Teléfono" style={{ ...S.input, paddingLeft: '2rem', fontSize: '13px' }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                          <Users size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                          <input value={ref.relacion} onChange={e => updateRefPersonal(i, 'relacion', e.target.value)} placeholder="Ej: Amigo, Familiar" style={{ ...S.input, paddingLeft: '2rem', fontSize: '13px' }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                          <Clock size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                          <input value={ref.tiempo} onChange={e => updateRefPersonal(i, 'tiempo', e.target.value)} placeholder="Ej: 5 años" style={{ ...S.input, paddingLeft: '2rem', fontSize: '13px' }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeRefPersonal(i)}
                          disabled={refPersonales.length <= 1}
                          style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', backgroundColor: refPersonales.length <= 1 ? '#f1f5f9' : '#fff1f2', color: refPersonales.length <= 1 ? '#cbd5e1' : '#f43f5e', cursor: refPersonales.length <= 1 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
              Estas referencias son fundamentales para el proceso de validación socioeconómica y contacto en caso de emergencia.
            </div>
          </>
        )}

        {/* ══════════════ PASO 7: DIAGNÓSTICO ══════════════════════════════════ */}
        {seccionActual === 6 && (
          <>
            <div style={S.sectionTitle}><FileText size={20} color="#f59e0b" /> VII. Diagnóstico General</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem', fontWeight: '500' }}>
              Describa el diagnóstico socioeconómico general de la familia, basándose en la información recopilada en las secciones anteriores.
            </p>
            <textarea
              {...inp('diagnosticoGeneral')}
              rows={14}
              placeholder="Escriba libremente el diagnóstico socioeconómico general..."
              style={{ ...S.input, resize: 'vertical', lineHeight: '1.7', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
            />
          </>
        )}

        {/* ══════════════ PASO 8: OBSERVACIONES DEL TRABAJADOR SOCIAL ══════════ */}
        {seccionActual === 7 && (
          <>
            <div style={S.sectionTitle}><Briefcase size={20} color="#3b82f6" /> VIII. Observaciones del Trabajador Social</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem', fontWeight: '500' }}>
              Registre las observaciones, conclusiones y recomendaciones del trabajador social respecto al caso evaluado.
            </p>
            <textarea
              {...inp('obsTraSocial')}
              rows={14}
              placeholder="Escriba aquí las observaciones del trabajador social..."
              style={{ ...S.input, resize: 'vertical', lineHeight: '1.7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
            />
          </>
        )}

        {/* ══════════════ PASO 9: VISITA DOMICILIARIA Y FIRMAS ════════════════ */}
        {seccionActual === 8 && (
          <>
            <div style={S.sectionTitle}><MapPin size={20} color="#8b5cf6" /> IX. Observaciones de la Visita Domiciliaria y Firmas</div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.75rem', fontWeight: '500' }}>
              Describa los hallazgos y observaciones realizadas durante la visita domiciliaria (si aplica).
            </p>
            <textarea
              {...inp('obsVisitaDom')}
              rows={8}
              placeholder="Describa los hallazgos de la visita domiciliaria..."
              style={{ ...S.input, resize: 'vertical', lineHeight: '1.7', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', marginBottom: '2.5rem' }}
            />

            <p style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.04em' }}>
              Firmas de Conformidad
            </p>
            <div style={S.grid2}>
              {/* Firma Solicitante */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '34px', height: '34px', backgroundColor: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={17} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Solicitante</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Nombre y Firma</p>
                  </div>
                </div>
                <label style={S.label}>Nombre completo</label>
                <input {...inp('firmaSolicitanteNombre')} placeholder="Nombre del solicitante" style={{ ...S.input, marginBottom: '1.25rem' }} />
                <label style={S.label}>Firma</label>
                <div style={{ height: '72px', border: '2px dashed #cbd5e1', borderRadius: '10px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94a3b8' }}>
                  <PenLine size={18} />
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>Espacio para firma física</span>
                </div>
              </div>

              {/* Firma Trabajador Social */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '34px', height: '34px', backgroundColor: '#f0fdf4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={17} color="#10b981" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Trabajador Social</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Nombre y Firma</p>
                  </div>
                </div>
                <label style={S.label}>Nombre completo</label>
                <input {...inp('firmaTraSocialNombre')} placeholder="Nombre del trabajador social" style={{ ...S.input, marginBottom: '1.25rem' }} />
                <label style={S.label}>Firma</label>
                <div style={{ height: '72px', border: '2px dashed #cbd5e1', borderRadius: '10px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94a3b8' }}>
                  <PenLine size={18} />
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>Espacio para firma física</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', fontSize: '13px', color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Check size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              Al completar este paso, el estudio socioeconómico quedará registrado en el sistema. Las firmas físicas deberán plasmarse en la versión impresa del documento.
            </div>
          </>
        )}

        {/* ── Navegación inferior ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={handleAnterior}
            disabled={seccionActual === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white', border: '1px solid #e2e8f0',
              borderRadius: '12px', fontSize: '14px', fontWeight: '700',
              color: seccionActual === 0 ? '#cbd5e1' : '#1e293b',
              cursor: seccionActual === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {savedOk && (
              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={14} /> Guardado
              </span>
            )}

            {seccionActual < TOTAL_SECCIONES - 1 ? (
              <button
                type="button"
                onClick={handleSiguiente}
                disabled={guardarEstudio.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#1e293b', color: 'white',
                  border: 'none', borderRadius: '12px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: guardarEstudio.isPending ? 'not-allowed' : 'pointer',
                  opacity: guardarEstudio.isPending ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(30,41,59,0.25)',
                }}
              >
                {guardarEstudio.isPending ? 'Guardando...' : <>Guardar y Continuar <ChevronRight size={16} /></>}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalizar}
                disabled={guardarEstudio.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 2.5rem',
                  backgroundColor: '#0f172a', color: 'white',
                  border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: '800',
                  cursor: guardarEstudio.isPending ? 'not-allowed' : 'pointer',
                  opacity: guardarEstudio.isPending ? 0.7 : 1,
                  boxShadow: '0 6px 16px rgba(15,23,42,0.3)',
                }}
              >
                {guardarEstudio.isPending ? 'Finalizando...' : <><Check size={16} /> Finalizar Estudio Socioeconómico</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
