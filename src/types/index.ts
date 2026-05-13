// Core Type Definitions for Marakame Frontend

// --- Enums and Unions (Base Types) ---

export type Rol =
  | 'ADMIN_GENERAL'
  | 'DIRECCION'
  | 'AREA_MEDICA'
  | 'ENFERMERIA'
  | 'NUTRICION'
  | 'PSICOLOGIA'
  | 'RRHH_FINANZAS'           // legacy combinado: actúa como super-RH/Finanzas
  | 'RECURSOS_HUMANOS'
  | 'RECURSOS_FINANCIEROS'
  | 'JEFE_ADMINISTRATIVO'
  | 'ADMISIONES'
  | 'ALMACEN'
  | 'JEFE_MEDICO';

export const EstadoPaciente = {
  PROSPECTO: 'PROSPECTO',
  EN_VALORACION_SOCIOECONOMICA: 'EN_VALORACION_SOCIOECONOMICA',
  PENDIENTE_VALORACION_MEDICA: 'PENDIENTE_VALORACION_MEDICA',
  EN_VALORACION: 'EN_VALORACION',
  PENDIENTE_INGRESO: 'PENDIENTE_INGRESO',
  INTERNADO: 'INTERNADO',
  DETOX: 'DETOX',
  EGRESADO: 'EGRESADO',
  CANALIZADO: 'CANALIZADO'
} as const;
export type EstadoPaciente = (typeof EstadoPaciente)[keyof typeof EstadoPaciente];

export const AreaCentro = {
  MUJERES: 'MUJERES',
  HOMBRES: 'HOMBRES',
  DETOX: 'DETOX'
} as const;
export type AreaCentro = (typeof AreaCentro)[keyof typeof AreaCentro];

export const EstadoCama = {
  DISPONIBLE: 'DISPONIBLE',
  OCUPADA: 'OCUPADA',
  MANTENIMIENTO: 'MANTENIMIENTO',
  RESERVADA: 'RESERVADA'
} as const;
export type EstadoCama = (typeof EstadoCama)[keyof typeof EstadoCama];

export const NivelUrgencia = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  CRITICA: 'CRITICA'
} as const;
export type NivelUrgencia = (typeof NivelUrgencia)[keyof typeof NivelUrgencia];

export const EstadoSolicitud = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  EN_ESPERA: 'EN_ESPERA'
} as const;
export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];

export const TipoAdiccion = {
  ALCOHOL: 'ALCOHOL',
  COCAINA: 'COCAINA',
  METANFETAMINA: 'METANFETAMINA',
  MARIHUANA: 'MARIHUANA',
  HEROINA: 'HEROINA',
  BENZODIACEPINAS: 'BENZODIACEPINAS',
  MULTIPLE: 'MULTIPLE',
  OTRO: 'OTRO'
} as const;
export type TipoAdiccion = (typeof TipoAdiccion)[keyof typeof TipoAdiccion];

export const TipoIngreso = {
  PRIMARIO: 'PRIMARIO',
  REFORZAMIENTO: 'REFORZAMIENTO'
} as const;
export type TipoIngreso = (typeof TipoIngreso)[keyof typeof TipoIngreso];

export const UbicacionFisica = {
  LADO_IZQ: 'LADO_IZQ',
  LADO_DER: 'LADO_DER',
  EVALUACIONES: 'EVALUACIONES'
} as const;
export type UbicacionFisica = (typeof UbicacionFisica)[keyof typeof UbicacionFisica];

export type CategoriaProducto = 'MEDICAMENTO' | 'INSUMO_MEDICO' | 'MOBILIARIO' | 'PAPELERIA' | 'LIMPIEZA' | 'ALIMENTO' | 'OTRO';
export type EstadoStock = 'NORMAL' | 'BAJO' | 'CRITICO';

export const EstadoCompra = {
  REQUISICION_CREADA: 'REQUISICION_CREADA',

  EN_REVISION_RECURSOS: 'EN_REVISION_RECURSOS',
  EN_REVISION_COMPRAS: 'EN_REVISION_COMPRAS',
  EN_REVISION_ADMINISTRACION: 'EN_REVISION_ADMINISTRACION',
  EN_REVISION_DIRECCION: 'EN_REVISION_DIRECCION',

  COTIZACIONES_CARGADAS: 'COTIZACIONES_CARGADAS',
  PROVEEDOR_SELECCIONADO: 'PROVEEDOR_SELECCIONADO',
  NEGOCIACION_COMPLETADA: 'NEGOCIACION_COMPLETADA',

  AUTORIZADA: 'AUTORIZADA',

  ORDEN_GENERADA: 'ORDEN_GENERADA',
  FACTURAS_RECIBIDAS: 'FACTURAS_RECIBIDAS',
  ORDEN_PAGO_GENERADA: 'ORDEN_PAGO_GENERADA',
  PAGO_GENERADO: 'PAGO_GENERADO',

  FINALIZADO: 'FINALIZADO',
  RECHAZADO: 'RECHAZADO'
} as const;

export type EstadoCompra =
  (typeof EstadoCompra)[keyof typeof EstadoCompra];

export const EstadoCompraLabel: {
  [key in EstadoCompra]: string
} = {

  REQUISICION_CREADA: 'Requisición creada',

  EN_REVISION_RECURSOS:
    'Revisión recursos materiales',

  EN_REVISION_COMPRAS:
    'Compras e inventario',

  EN_REVISION_ADMINISTRACION:
    'Dirección administrativa',

  EN_REVISION_DIRECCION:
    'Dirección general',

  COTIZACIONES_CARGADAS:
    'Cotizaciones cargadas',

  PROVEEDOR_SELECCIONADO:
    'Proveedor seleccionado',

  NEGOCIACION_COMPLETADA:
    'Negociación completada',

  AUTORIZADA:
    'Autorizada',

  ORDEN_GENERADA:
    'Orden generada',

  FACTURAS_RECIBIDAS:
    'Facturas recibidas',

  ORDEN_PAGO_GENERADA:
    'Orden de pago generada',

  PAGO_GENERADO:
    'Pago generado',

  FINALIZADO:
    'Finalizado',

  RECHAZADO:
    'Rechazado'
};

export const EstadoCompraColor: {
  [key in EstadoCompra]: string
} = {

  REQUISICION_CREADA: 'gray',

  EN_REVISION_RECURSOS: 'blue',

  EN_REVISION_COMPRAS: 'orange',

  EN_REVISION_ADMINISTRACION: 'yellow',

  EN_REVISION_DIRECCION: 'pink',

  COTIZACIONES_CARGADAS: 'orange',

  PROVEEDOR_SELECCIONADO: 'purple',

  NEGOCIACION_COMPLETADA: 'cyan',

  AUTORIZADA: 'green',

  ORDEN_GENERADA: 'teal',

  FACTURAS_RECIBIDAS: 'indigo',

  ORDEN_PAGO_GENERADA: 'cyan',

  PAGO_GENERADO: 'pink',

  FINALIZADO: 'green',

  RECHAZADO: 'red'
};

export const getEstadoCompraUI = (estado: EstadoCompra) => {
  return {
    label: EstadoCompraLabel[estado] ?? estado,
    color: EstadoCompraColor[estado] ?? 'gray',
  };
};
  
export type TipoNota = 'MEDICA' | 'PSICOLOGICA' | 'NUTRICIONAL' | 'ENFERMERIA' | 'GENERAL';

export interface HistoriaClinica {
  estadoCivil: string;
  religion: string;
  lugarResidencia: string;
  lugarOrigen: string;
  ocupacion: string;
  escolaridad: string;
  historiaConsumo: string;
  alergias: string;
  enfermedadesExantem: string;
  otrasEnfermedades: string;
  antecedentesQx: string;
  transfusiones: string;
  antecSexuales: string;
  antecSuicidas: string;
  padrePatologia: string;
  madrePatologia: string;
  hermanosPatologia: string;
  esposaPatologia: string;
  hijosPatologia: string;
  sintCabeza: string;
  sintCardioresp: string;
  sintGastro: string;
  sintGenito: string;
  sintEndoNeuro: string;
  svPresion: string;
  svFrecResp: string;
  svFrecCard: string;
  svTemp: string;
  svPeso: string;
  svEstatura: string;
  fisicoHabitus: string;
  fisicoCabeza: string;
  fisicoOrl: string;
  fisicoOrofaringe: string;
  fisicoCuello: string;
  fisicoTorax: string;
  fisicoPulmones: string;
  fisicoCorazon: string;
  fisicoAbdomen: string;
  fisicoExtremidades: string;
  neuro: string;
  estadoMental: string;
  diagnosticos: string[];
  recomendacion1: string;
  recomendacion2: string;
  firma: string;
  cedula: string;
}

// --- NUEVOS ENUMS DE NÓMINA ---
export type EstadoNomina = 'BORRADOR' | 'PRE_NOMINA' | 'SOLICITUD_SUBSIDIO' | 'EN_REVISION' | 'AUTORIZADO' | 'PAGADO';
export type RegimenLaboral = 'CONFIANZA' | 'LISTA_RAYA';
export type TipoIncidencia = 'INASISTENCIA' | 'RETARDO' | 'SALIDA_ANTICIPADA' | 'FALTA_JUSTIFICADA';

// --- Base Interfaces ---

export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  esJefe?: boolean;
  activo: boolean;
}

export interface FamiliarResponsable {
  id: number;
  pacienteId: number;
  nombre: string;
  parentesco: string;
  telefono?: string;
  celular?: string;
  correo?: string;
  municipio?: string;
  estado?: string;
}

export interface SignoVital {
  id: number;
  expedienteId: number;
  fecha: string;
  presionArterial?: string;
  temperatura?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  oxigenacion?: number;
  glucosa?: number;
  peso?: number;
  observaciones?: string;
  usuario?: Usuario;
}

export interface TratamientoMedico {
  id: number;
  expedienteId: number;
  medicoId: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  indicaciones?: string;
  createdAt: string;
  medico?: Usuario;
  suministros?: SuministroTratamiento[];
}

export interface SuministroTratamiento {
  id: number;
  tratamientoId: number;
  enfermeroId: number;
  fechaSuministro: string;
  dosisAplicada: string;
  observaciones?: string;
  enfermero?: Usuario;
}

export type EstadoCita = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export interface CitaAgenda {
  id: number;
  pacienteId: number;
  especialistaId: number;
  fechaHora: string;
  motivo: string;
  estado: EstadoCita;
  observaciones?: string;
  createdAt: string;
  paciente?: Paciente;
  especialista?: Usuario;
}

export interface NotaEvolucion {
  id: number;
  tipo: TipoNota;
  nota: string;
  fecha: string;
  usuario?: Usuario;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaProducto;
  stockActual: number;
  stockMinimo: number;
  estadoStock: EstadoStock;
  unidad?: string;
  ubicacion?: string;
}

export interface Movimiento {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  createdAt: string;
  producto: Producto;
  usuario: Usuario;
}

export type TipoCompra = 'ORDINARIA' | 'EXTRAORDINARIA';

export interface Requisicion {
  id: number;
  folio: string;

  areaSolicitante: string;
  descripcion: string;
  justificacion: string;

  presupuestoEstimado?: number;

  estado: EstadoCompra;
  tipo: TipoCompra;

  usuario?: Pick<Usuario, 'nombre' | 'apellidos'>;

  cotizaciones?: Cotizacion[];

  ordenCompra?: OrdenCompra;

  facturas?: {
    id: number;
    numero: string;
    documentoUrl?: string;
    monto: number;
  }[];

  detalles?: {
    id: number;
    numero: number;
    producto: string;
    unidad: string;
    cantidad: number;
  }[];

  createdAt: string;
}

export interface Cotizacion {
  id: number;
  proveedor: string;
  precio: number;
  tiempoEntrega?: string;
  requisicionId?: number;
  esMejorOpcion?: boolean;
}

export interface OrdenCompra {
  id: number;

  requisicionId: number;

  folio: string;

  fecha: string;

  proveedor: string;

  total: number;

  elaboradoPorId?: number;
  revisadoPorId?: number;
  autorizadoPorId?: number;

  elaboradoPor?: {
    id: number;
    nombre: string;
    apellidos: string;
  };

  revisadoPor?: {
    id: number;
    nombre: string;
    apellidos: string;
  };

  autorizadoPor?: {
    id: number;
    nombre: string;
    apellidos: string;
  };

  createdAt?: string;
}

// --- INTERFACES ACTUALIZADAS DE NÓMINA Y RH ---

export interface Empleado {
  id: number;
  numeroEmpleado?: string;
  nombre: string;
  apellidos: string;
  puesto: string;
  departamento: string;
  regimen: RegimenLaboral;
  salarioBase: number;
  compensacionFija?: number;
  activo: boolean;
  incidencias?: IncidenciaNomina[];
}

export interface IncidenciaNomina {
  id: number;
  empleadoId: number;
  fecha: string;
  tipo: TipoIncidencia;
  minutosRetardo?: number;
  justificada: boolean;
  vistoBuenoJefe: boolean;
  documentoJustifUrl?: string;
  descuentoAplicar: number;
  aplicadoEnNominaId?: number;
  createdAt: string;
  empleado?: Empleado;
}

export interface Nomina {
  id: number;
  folio: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoNomina;
  usuarioAutorizaId?: number;
  fechaAutorizacion?: string;
  
  firmaRecursosHumanos: boolean;
  firmaFinanzas: boolean;
  firmaAdministracion: boolean;
  firmaDireccion: boolean;
  
  fechaSolicitudSubsidio?: string;
  fechaRecepcionRecurso?: string;
  
  totalPercepciones?: number;
  totalDeducciones?: number;
  totalNetoPagar?: number;
  totalGeneral?: number;
  
  prenominas?: PreNomina[];
  createdAt: string;
  updatedAt?: string;
}

export interface PreNomina {
  id: number;
  nominaId: number;
  empleadoId: number;
  diasTrabajados: number;
  horasExtra: number;
  
  sueldoBruto: number;
  compensacion: number;
  otrasPercepciones: number;
  totalPercepciones: number;
  
  retencionISR: number;
  descuentoIncidencias: number;
  otrasDeducciones: number;
  totalDeducciones: number;
  
  totalAPagar: number;
  
  incidencias?: string;
  reciboFirmado: boolean;
  urlReciboFirmado?: string;
  
  empleado?: Empleado;
}

export interface RegistroBitacora {
  id: number;
  createdAt: string;
  usuario: Usuario;
  accion: string;
  modulo: string;
  detalle: unknown;
  ip: string;
}

// --- Circular and Dependent Models (Paciente / Cama / Ingreso) ---

export interface PrimerContacto {
  id: number;
  pacienteId: number;
  usuarioId: number;
  fecha: string | Date;
  hora?: string;
  medioEnterado?: string;
  nombreLlamada?: string;
  celularLlamada?: string;
  parentescoLlamada?: string;
  nombrePaciente?: string;
  edadPaciente?: number | null;
  sustancias: string[];
  sustanciasOtros: string[];
  acuerdoSeguimiento?: string;
  fechaAcuerdo?: string | Date | null;
  medicoValoro?: string;
  conclusionMedica?: string;
  activo: boolean;
  createdAt: string | Date;
}

export interface Habitacion {
  id: number;
  nombre: string;
  capacidadMax: number;
  area: AreaCentro;
}

export interface Cama {
  id: number;
  codigo?: string;
  numero: string;
  estado: EstadoCama;
  descripcion?: string;
  pacienteId?: number;
  habitacionId: number;
  habitacion?: Habitacion;
  paciente?: Partial<Paciente>;
}

export interface Paciente {
  id: number;
  claveUnica?: number; // <-- Corregido de string a number para que empate con Prisma
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaNacimiento: string | Date;
  sexo: string;
  curp?: string;
  estado: EstadoPaciente;
  tipoAdiccion?: TipoAdiccion;
  areaDeseada?: AreaCentro;
  tipoIngreso?: TipoIngreso;
  nivelTratamiento?: number;
  fechaIngreso?: string;
  fechaEgresoPrevista?: string;
  totalDiasTratamiento?: number;
  cama?: Cama;
  sustancias?: string[];
  primerContacto?: PrimerContacto[];
  expediente?: { id: number } | null;
  createdAt?: string;
}

export interface AsignacionCama {
  id: number;
  solicitudId: number;
  camaId: number;
  fechaIngresoEstimada: string | Date;
  medicoResponsableNom: string;
  cama?: Cama;
}

export interface SolicitudIngreso {
  id: number;
  folio: string;
  estado: EstadoSolicitud;
  urgencia: NivelUrgencia;
  pacienteId: number;
  solicitanteId: number;
  paciente?: Paciente;
  solicitante?: FamiliarResponsable;
  asignacionCama?: AsignacionCama;
  observaciones?: string;
  motivoRechazo?: string;
  createdAt: string | Date;
}

export interface Expediente {
  id: number;
  pacienteId: number;
  paciente?: Paciente;
  diagnosticoPrincipal?: string;
  historiaClinica?: HistoriaClinica;
  notasEvolucion?: NotaEvolucion[];
  signosVitales?: SignoVital[];
  tratamientos?: TratamientoMedico[];
  createdAt: string;
}

export interface Ingreso {
  id: number;
  pacienteId: number;
  usuarioId: number;
  fechaIngreso?: string;
  motivoIngreso: string;
  estado: 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  pasoActual: number;
  habitacionAsignada?: string;
  areaAsignada?: string;
}
