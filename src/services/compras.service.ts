import api from '../services/api';
import type { Requisicion, Cotizacion, OrdenCompra } from '../types';
import { EstadoCompra } from '../types';

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// GET
export const getRequisiciones = async () => {
    const res = await api.get<ApiResponse<Requisicion[]>>(
        '/compras/requisiciones'
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
export const updateEstado = async (id: number, estado: EstadoCompra) => {
    const res = await api.patch<ApiResponse<Requisicion>>(
        `/compras/requisiciones/${id}/estado`,
        { estado }
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
export const generarOrden = async (
    id: number,
    data: {
        proveedor: string;
        total: number;
    }
    ) => {
    const res = await api.post<ApiResponse<OrdenCompra>>(
        `/compras/requisiciones/${id}/orden`,
        data
    );
    return res.data.data;
};

// FACTURA
export const subirFactura = async (id: number, file: File) => {
    const form = new FormData();
    form.append('factura', file);
    const res = await api.post(`/compras/requisiciones/${id}/factura`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};