import api from '../services/api';
import type { Requisicion, Cotizacion, OrdenCompra } from '../types';
import { EstadoCompra } from '../types';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: { total: number; page: number; limit: number; totalPages: number };
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// GET
export const getRequisiciones = async () => {
    const res = await api.get<ApiResponse<Requisicion[]>>(
        '/compras'
    );
    return res.data.data;
};

// CREATE
export const createRequisicion = async (data: {
    areaSolicitante: string;
    descripcion: string;
    justificacion: string;
    presupuestoEstimado?: number;

    tipo: 'ORDINARIA' | 'EXTRAORDINARIA';

    detalles: {
        producto: string;
        unidad: string;
        cantidad: number;
    }[];
}) => {
    const res = await api.post<ApiResponse<Requisicion>>(
        '/compras/requisiciones',
        data
    );
    return res.data.data;
};

// UPDATE ESTADO
export const updateEstado = async (
    id: number,
    estado: EstadoCompra,
    extra?: {
        observaciones?: string;
        fechaPago?: string;
        referenciaBancaria?: string;
        concepto?: string;
        monto?: number;
    }
) => {
    const body: Record<string, unknown> = { estado };

    if (extra?.observaciones)       body.observaciones      = extra.observaciones;
    if (extra?.fechaPago)           body.fechaPago          = extra.fechaPago;
    if (extra?.referenciaBancaria)  body.referenciaBancaria = extra.referenciaBancaria;
    if (extra?.concepto)            body.concepto           = extra.concepto;
    if (extra?.monto !== undefined) body.monto              = extra.monto;

    const res = await api.patch<ApiResponse<Requisicion>>(
        `/compras/requisiciones/${id}/estado`,
        body
    );
    return res.data.data;
};

// COTIZACION 
export const addCotizacion = async (
    id: number,
    data: {
        proveedor: string;
        precio: number;
        tiempoEntrega?: string;
    }
    ) => {
    const res = await api.post<ApiResponse<Cotizacion>>(
        `/compras/requisiciones/${id}/cotizaciones`,
        data
    );

    return res.data.data;
};

// ORDEN
export const generarOrden = async (id: number) => {
    const res = await api.post<ApiResponse<OrdenCompra>>(`/compras/${id}/orden`);
    return res.data.data;
};

// ORDEN DE PAGO
export const generarOrdenPago = async (id: number) => {
    const res = await api.post(`/compras/${id}/orden-pago`);
    return res.data.data;
};

// COTIZACIÓN CON CATÁLOGO (nuevo flujo desde Almacén)
export const registrarCotizacionCatalogo = async (
    id: number,
    data: {
        proveedorId: number;
        precio: number;
        tiempoEntrega?: string;
        formaPago?: string;
    }
) => {
    const res = await api.post<ApiResponse<Cotizacion>>(
        `/compras/${id}/cotizaciones`,
        data
    );
    return res.data.data;
};

// COMPRAS EN REVISIÓN DE DIRECCIÓN GENERAL
export const getComprasRevisionDireccion = async (): Promise<Requisicion[]> => {
    const res = await api.get<ApiResponse<Requisicion[]>>('/compras', {
        params: { estado: 'EN_REVISION_DIRECCION', limit: 100 }
    });
    return res.data.data;
};

// AUTORIZAR COMPRA (Dirección General)
export const autorizarCompraDireccion = async (id: number, observaciones?: string): Promise<void> => {
    await api.patch(`/compras/${id}/autorizar-direccion`, { observaciones });
};

// RECHAZAR COMPRA (Dirección General)
export const rechazarCompraDireccion = async (id: number, motivoRechazo: string): Promise<void> => {
    await api.patch(`/compras/${id}/rechazar-direccion`, { motivoRechazo });
};

// ELIMINAR COTIZACIÓN
export const eliminarCotizacion = async (compraId: number, cotizacionId: number): Promise<void> => {
    await api.delete(`/compras/${compraId}/cotizaciones/${cotizacionId}`);
};

// ENVIAR A REVISIÓN ADMINISTRATIVA
export const enviarARevisionAdministrativa = async (id: number, observaciones?: string): Promise<void> => {
    await api.patch(`/compras/${id}/enviar-administracion`, { observaciones });
};

// APROBAR ADMINISTRACIÓN
export const aprobarCompraAdministracion = async (id: number, observaciones?: string): Promise<void> => {
    await api.patch(`/compras/${id}/aprobar-administracion`, { observaciones });
};

// DEVOLVER A COMPRAS
export const devolverCompraACompras = async (
    id: number,
    data: { motivoRechazo: string; observaciones?: string }
): Promise<void> => {
    await api.patch(`/compras/${id}/devolver-compras`, data);
};

// GET COMPRAS PARA REVISIÓN ADMINISTRATIVA
export const getComprasRevisionAdmin = async (): Promise<Requisicion[]> => {
    const res = await api.get<ApiResponse<Requisicion[]>>('/compras', {
        params: { estado: 'EN_REVISION_ADMINISTRACION', limit: 100 }
    });
    return res.data.data;
};

// FACTURA
export const subirFactura = async (id: number, file: File, monto: number, numero: string, proveedorId?: number) => {
    const form = new FormData();
    form.append('factura', file);
    form.append('monto', String(monto));
    form.append('numero', numero);
    if (proveedorId) form.append('proveedorId', String(proveedorId));
    const res = await api.post<{ success: boolean; url: string }>(
        `/compras/${id}/factura-upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
};

// COTIZACIONES BULK POR PRODUCTO
export const registrarCotizacionesBulk = async (
    id: number,
    items: {
        requisicionDetalleId: number;
        proveedorId: number;
        precioUnitario: number;
        tiempoEntrega?: string;
        formaPago?: string;
    }[]
): Promise<void> => {
    await api.post(`/compras/${id}/cotizaciones-bulk`, { items });
};

// GENERAR EXPEDIENTE
export const generarExpedienteCompra = async (id: number, observaciones?: string): Promise<void> => {
    await api.patch(`/compras/${id}/generar-expediente`, { observaciones });
};

// ENVIAR A FINANZAS
export const enviarAFinanzasCompra = async (id: number, observaciones?: string): Promise<void> => {
    await api.patch(`/compras/${id}/enviar-finanzas`, { observaciones });
};

// FINALIZAR COMPRA
export const finalizarCompraService = async (id: number, observaciones?: string): Promise<void> => {
    await api.patch(`/compras/${id}/finalizar`, { observaciones });
};

// AGREGAR COTIZACIÓN INDIVIDUAL POR PRODUCTO
export interface NuevaCotizacionProductoPayload {
    requisicionDetalleId: number;
    proveedorId: number;
    precioUnitario: number;
    tiempoEntrega?: string;
    formaPago?: string;
    condicionesPago?: string;
    garantia?: string;
    marca?: string;
    modelo?: string;
    observaciones?: string;
}

export const agregarCotizacionProducto = async (
    id: number,
    data: NuevaCotizacionProductoPayload
): Promise<void> => {
    await api.post(`/compras/${id}/cotizacion-producto`, data);
};

// SELECCIONAR COTIZACIÓN GANADORA POR PRODUCTO
export const seleccionarCotizacionProducto = async (
    compraId: number,
    cotizacionId: number
): Promise<void> => {
    await api.patch(`/compras/${compraId}/cotizaciones/${cotizacionId}/seleccionar`);
};