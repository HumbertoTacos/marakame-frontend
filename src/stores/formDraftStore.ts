import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==========================================
// TYPES
// ==========================================
type StateUpdater<T> = T | ((prev: T) => T);

// ==========================================
// STORE: PRIMER CONTACTO
// ==========================================
interface PrimerContactoDraft {
  formData: any;
  openSection: number;
  solicitanteEsPaciente: boolean;
  lastUpdated: number;
  setFormData: (data: StateUpdater<any>) => void;
  setOpenSection: (section: StateUpdater<number>) => void;
  setSolicitanteEsPaciente: (val: StateUpdater<boolean>) => void;
  resetForm: () => void;
}

const INITIAL_PRIMER_CONTACTO = {
  // 1-3. Generales
  hora: '',
  medioEnterado: '',
  medioEnteradoOtro: '',
  // 4-9. Datos del Solicitante
  nombreLlamada: '',
  lugarLlamada: '',
  domicilioLlamada: '',
  telCasaLlamada: '',
  celularLlamada: '',
  ocupacionLlamada: '',
  // 10-19. Datos del Prospecto
  parentescoLlamada: '',
  parentescoOtro: '',
  nombrePaciente: '',
  edadPaciente: '',
  estadoCivilPaciente: '',
  estadoCivilOtro: '',
  hijosPaciente: '',
  direccionPaciente: '',
  escolaridadPaciente: '',
  escolaridadOtro: '',
  origenPaciente: '',
  telefonoPaciente: '',
  ocupacionPaciente: '',
  // 20. Sustancias
  sustancias: [] as string[],
  sustanciasOtros: [] as string[],
  // 21-23. Disposición y Antecedentes
  dispuestoInternarse: '', // SI, NO, DUDA
  realizoIntervencion: '', // SI, NO
  conclusionIntervencion: '',
  tratamientoPrevio: '', // SI, NO
  lugarTratamiento: '',
  // 24. Otros
  posibilidadesEconomicas: '',
  // 25-29. Acuerdos
  acuerdoLlamarle: false,
  acuerdoOtro: '',
  acuerdoEsperarLlamada: false,
  acuerdoEsperarVisita: false,
  acuerdoPosibleIngreso: false,
  // CRM Tracking
  acuerdoSeguimiento: 'ESPERAR_LLAMADA',
  fechaAcuerdo: '',
  // 30-31. Cierre Médico
  medicoValoro: '',
  conclusionMedica: '',
};

export const usePrimerContactoStore = create<PrimerContactoDraft>()(
  persist(
    (set) => ({
      formData: INITIAL_PRIMER_CONTACTO,
      openSection: 0,
      solicitanteEsPaciente: false,
      lastUpdated: Date.now(),
      setFormData: (data) => set((state) => ({ 
        formData: typeof data === 'function' ? data(state.formData) : { ...state.formData, ...data }, 
        lastUpdated: Date.now() 
      })),
      setOpenSection: (section) => set((state) => ({ 
        openSection: typeof section === 'function' ? section(state.openSection) : section, 
        lastUpdated: Date.now() 
      })),
      setSolicitanteEsPaciente: (val) => set((state) => ({ 
        solicitanteEsPaciente: typeof val === 'function' ? val(state.solicitanteEsPaciente) : val, 
        lastUpdated: Date.now() 
      })),
      resetForm: () => set({ formData: INITIAL_PRIMER_CONTACTO, openSection: 0, solicitanteEsPaciente: false, lastUpdated: Date.now() }),
    }),
    { name: 'marakame-draft-primer-contacto' }
  )
);

// ==========================================
// STORE: VALORACIÓN MÉDICA
// ==========================================
interface ValoracionMedicaDraft {
  formData: {
    motivoConsulta: string;
    padecimientoActual: string;
    sintomasGenerales: string;
    tratamientosPrevios: string;
    antecedentesHeredofamiliares: string;
    antecedentesPatologicos: string;
    antecedentesNoPatologicos: string;
    historialConsumo: string;
    tensionArterial: string;
    frecuenciaCardiaca: string;
    frecuenciaRespiratoria: string;
    temperatura: string;
    peso: string;
    talla: string;
    exploracionFisicaDesc: string;
    examenMental: string;
    impresionDiagnostica: string;
    pronostico: string;
    planTratamiento: string;
    esAptoParaIngreso: boolean | null;
    // Nuevos campos
    residente: string;
    tipoValoracion: 'PRESENCIAL' | 'TELEFONICA' | '';
    fechaValoracion: string;
    horaValoracion: string;
  };
  lastUpdated: number;
  setFormData: (data: StateUpdater<any>) => void;
  resetForm: () => void;
}

const INITIAL_VALORACION_MEDICA = {
  motivoConsulta: '',
  padecimientoActual: '',
  sintomasGenerales: '',
  tratamientosPrevios: '',
  antecedentesHeredofamiliares: '',
  antecedentesPatologicos: '',
  antecedentesNoPatologicos: '',
  historialConsumo: '',
  tensionArterial: '',
  frecuenciaCardiaca: '',
  frecuenciaRespiratoria: '',
  temperatura: '',
  peso: '',
  talla: '',
  exploracionFisicaDesc: '',
  examenMental: '',
  impresionDiagnostica: '',
  pronostico: '',
  planTratamiento: '',
  esAptoParaIngreso: null,
  residente: '',
  tipoValoracion: '',
  fechaValoracion: new Date().toISOString().split('T')[0],
  horaValoracion: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
};

export const useValoracionMedicaStore = create<ValoracionMedicaDraft>()(
  persist(
    (set) => ({
      formData: INITIAL_VALORACION_MEDICA,
      lastUpdated: Date.now(),
      setFormData: (data) => set((state) => ({ 
        formData: typeof data === 'function' ? data(state.formData) : { ...state.formData, ...data }, 
        lastUpdated: Date.now() 
      })),
      resetForm: () => set({ formData: INITIAL_VALORACION_MEDICA, lastUpdated: Date.now() }),
    }),
    { name: 'marakame-draft-valoracion-medica' }
  )
);

// ==========================================
// STORE: ESTUDIO SOCIOECONÓMICO
// ==========================================
interface EstudioSocioeconomicoDraft {
  datos: any;
  seccionActual: number;
  lastUpdated: number;
  setDatos: (data: StateUpdater<any>) => void;
  setSeccionActual: (seccion: StateUpdater<number>) => void;
  resetForm: () => void;
}

export const useEstudioSocioeconomicoStore = create<EstudioSocioeconomicoDraft>()(
  persist(
    (set) => ({
      datos: {},
      seccionActual: 0,
      lastUpdated: Date.now(),
      setDatos: (data) => set((state) => ({ 
        datos: typeof data === 'function' ? data(state.datos) : { ...state.datos, ...data }, 
        lastUpdated: Date.now() 
      })),
      setSeccionActual: (seccion) => set((state) => ({ 
        seccionActual: typeof seccion === 'function' ? seccion(state.seccionActual) : seccion, 
        lastUpdated: Date.now() 
      })),
      resetForm: () => set({ datos: {}, seccionActual: 0, lastUpdated: Date.now() }),
    }),
    { name: 'marakame-draft-estudio-socio' }
  )
);

// ==========================================
// STORE: INGRESO WIZARD (ADMIN)
// ==========================================
interface IngresoWizardDraft {
  formData: any;
  pasoActual: number;
  ingresoId: number | null;
  lastUpdated: number;
  setFormData: (data: StateUpdater<any>) => void;
  setPasoActual: (paso: StateUpdater<number>) => void;
  setIngresoId: (id: StateUpdater<number | null>) => void;
  resetForm: () => void;
}

const INITIAL_INGRESO = {
  nombre: '',
  motivoIngreso: '',
  fechaCita: '',
  esApto: false,
  areaAsignada: 'HOMBRES',
  habitacionAsignada: ''
};

export const useIngresoWizardStore = create<IngresoWizardDraft>()(
  persist(
    (set) => ({
      formData: INITIAL_INGRESO,
      pasoActual: 1,
      ingresoId: null,
      lastUpdated: Date.now(),
      setFormData: (data) => set((state) => ({ 
        formData: typeof data === 'function' ? data(state.formData) : { ...state.formData, ...data }, 
        lastUpdated: Date.now() 
      })),
      setPasoActual: (paso) => set((state) => ({ 
        pasoActual: typeof paso === 'function' ? paso(state.pasoActual) : paso, 
        lastUpdated: Date.now() 
      })),
      setIngresoId: (id) => set((state) => ({ 
        ingresoId: typeof id === 'function' ? id(state.ingresoId) : id, 
        lastUpdated: Date.now() 
      })),
      resetForm: () => set({ formData: INITIAL_INGRESO, pasoActual: 1, ingresoId: null, lastUpdated: Date.now() }),
    }),
    { name: 'marakame-draft-ingreso-wizard' }
  )
);
