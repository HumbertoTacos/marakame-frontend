// Core Type Definitions for Marakame Frontend

// --- Enums and Unions (Base Types) - Converted to Constants + Type Unions for erasableSyntaxOnly ---

export type Rol = 'ADMIN_GENERAL' | 'AREA_MEDICA' | 'ENFERMERIA' | 'NUTRICION' | 'PSICOLOGIA' | 'RRHH_FINANZAS' | 'ADMISIONES' | 'ALMACEN';

export const EstadoPaciente = {
  PROSPECTO: 'PROSPECTO',
  EN_VALORACION: 'EN_VALORACION',
  PENDIENTE_INGRESO: 'PENDIENTE_INGRESO',
  INTERNADO: 'INTERNADO',
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

export type CategoriaProducto = 'MEDICAMENTO' | 'INSUMO_MEDICO' | 'MOBILIARIO' | 'PAPELERIA' | 'LIMPIEZA' | 'OTRO';
export type EstadoStock = 'NORMAL' | 'BAJO' | 'CRITICO';
export type EstadoCompra = 'BORRADOR' | 'PENDIENTE_COTIZACION' | 'EN_COMPARATIVO' | 'PENDIENTE_AUTORIZACION' | 'AUTORIZADO' | 'RECHAZADO' | 'ORDEN_GENERADA';
export type TipoNota = 'MEDICA' | 'PSICOLOGICA' | 'NUTRICIONAL' | 'ENFERMERIA' | 'GENERAL';

// --- Base Interfaces ---

export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
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
  fecha: string;
  presionArterial?: string;
  temperatura?: number;
  frecuenciaCardiaca?: number;
  oxigenacion?: number;
  peso?: number;
  usuario?: Usuario;
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
  categoria: CategoriaProducto;
  stockActual: number;
  stockMinimo: number;
  estadoStock: EstadoStock;
  unidad?: string;
}

export interface Movimiento {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  createdAt: string;
  producto: Producto;
  usuario: Usuario;
}

export interface Requisicion {
  id: number;
  folio: string;
  areaSolicitante: string;
  descripcion: string;
  justificacion: string;
  presupuestoEstimado?: number;
  estado: EstadoCompra;
  usuario: Usuario;
  cotizaciones?: Cotizacion[];
}

export interface Cotizacion {
  id: number;
  proveedor: string;
  precio: number;
  tiempoEntrega?: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  puesto: string;
  departamento: string;
  salarioBase: number;
  activo: boolean;
}

export interface Nomina {
  id: number;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'BORRADOR' | 'PENDIENTE' | 'AUTORIZADO' | 'PAGADO';
  totalGeneral?: number;
  prenominas?: PreNomina[];
  createdAt: string;
}

export interface PreNomina {
  id: number;
  empleado: Empleado;
  salarioBase: number;
  bonos: number;
  deducciones: number;
  totalAPagar: number;
}

export interface Auditoria {
  id: number;
  createdAt: string;
  usuario: Usuario;
  accion: string;
  modulo: string;
  detalle: unknown;
  ip: string;
}

// --- Circular and Dependent Models (Paciente / Cama / Ingreso) ---

export interface Cama {
  id: number;
  codigo?: string;
  numero: string;
  area: AreaCentro;
  estado: EstadoCama;
  descripcion?: string;
  pacienteId?: number;
  paciente?: Partial<Paciente>;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string | Date;
  sexo: string;
  curp?: string;
  estado: EstadoPaciente;
  tipoAdiccion?: TipoAdiccion;
  areaDeseada?: AreaCentro;
  cama?: Cama;
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
  notasEvolucion?: NotaEvolucion[];
  signosVitales?: SignoVital[];
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
