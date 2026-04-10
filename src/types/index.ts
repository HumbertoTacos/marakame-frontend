// Core Type Definitions for Marakame Frontend

export type Rol = 'ADMIN_GENERAL' | 'AREA_MEDICA' | 'ENFERMERIA' | 'NUTRICION' | 'PSICOLOGIA' | 'RRHH_FINANZAS' | 'ADMISIONES' | 'ALMACEN';

export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  activo: boolean;
}

export type EstadoPaciente = 'PROSPECTO' | 'EN_VALORACION' | 'PENDIENTE_INGRESO' | 'INTERNADO' | 'EGRESADO' | 'CANALIZADO';

export interface Paciente {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  estado: EstadoPaciente;
  cama?: Cama;
  createdAt: string;
}

export type AreaCentro = 'MUJERES' | 'HOMBRES' | 'DETOX';
export type EstadoCama = 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO';

export interface Cama {
  id: number;
  numero: string;
  area: AreaCentro;
  estado: EstadoCama;
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

export type TipoNota = 'MEDICA' | 'PSICOLOGICA' | 'NUTRICIONAL' | 'ENFERMERIA' | 'GENERAL';

export interface NotaEvolucion {
  id: number;
  tipo: TipoNota;
  nota: string;
  fecha: string;
  usuario?: Usuario;
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

export type CategoriaProducto = 'MEDICAMENTO' | 'INSUMO_MEDICO' | 'MOBILIARIO' | 'PAPELERIA' | 'LIMPIEZA' | 'OTRO';
export type EstadoStock = 'NORMAL' | 'BAJO' | 'CRITICO';

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

export type EstadoCompra = 'BORRADOR' | 'PENDIENTE_COTIZACION' | 'EN_COMPARATIVO' | 'PENDIENTE_AUTORIZACION' | 'AUTORIZADO' | 'RECHAZADO' | 'ORDEN_GENERADA';

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
  detalle: any;
  ip: string;
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
