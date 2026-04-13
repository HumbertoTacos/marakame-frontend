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
  fuenteReferencia: '',
  solicitanteNombre: '',
  solicitanteTelefono: '',
  relacionPaciente: '',
  nombrePaciente: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  edad: '',
  sustancias: [] as string[],
  otraSustancia: '',
  observaciones: '',
  acuerdoSeguimiento: '',
  fechaSeguimiento: '',
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
  formData: any;
  activeTab: number;
  lastUpdated: number;
  setFormData: (data: StateUpdater<any>) => void;
  setActiveTab: (tab: StateUpdater<number>) => void;
  resetForm: () => void;
}

const INITIAL_VALORACION_MEDICA = {
  motivoConsulta: '',
  evolucionEstado: '',
  factoresDesencadenantes: '',
  antecedentes: { heredofamiliares: '', personalesPatologicos: '', psiquiatricos: '' },
  signosVitales: { ta: '', fc: '', fr: '', temp: '', peso: '', talla: '' },
  exploracionFisica: '',
  examenMental: { aspectoGeneral: '', psicomotricidad: '', afectividad: '', ideacion: '' },
  diagnosticoCIE10: '',
  diagnosticoOtro: '',
  pronostico: '',
  tratamientoSugerido: '',
  esAptoParaIngreso: null,
};

export const useValoracionMedicaStore = create<ValoracionMedicaDraft>()(
  persist(
    (set) => ({
      formData: INITIAL_VALORACION_MEDICA,
      activeTab: 0,
      lastUpdated: Date.now(),
      setFormData: (data) => set((state) => ({ 
        formData: typeof data === 'function' ? data(state.formData) : { ...state.formData, ...data }, 
        lastUpdated: Date.now() 
      })),
      setActiveTab: (tab) => set((state) => ({ 
        activeTab: typeof tab === 'function' ? tab(state.activeTab) : tab, 
        lastUpdated: Date.now() 
      })),
      resetForm: () => set({ formData: INITIAL_VALORACION_MEDICA, activeTab: 0, lastUpdated: Date.now() }),
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
