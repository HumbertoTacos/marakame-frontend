import api from './api';
import type { RequisicionDept } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface CreateRequisicionPayload {
  areaSolicitante: string;
  justificacion: string;
  descripcion?: string;
  detalles: {
    productoNombre: string;
    unidadLibre: string;
    cantidadSolicitada: number;
    observaciones?: string;
  }[];
}

export const createRequisicion = async (data: CreateRequisicionPayload): Promise<RequisicionDept> => {
  const res = await api.post<ApiResponse<RequisicionDept>>('/requisiciones', data);
  return res.data.data;
};

export const getRequisiciones = async (params?: {
  q?: string;
  estado?: string;
  page?: number;
  limit?: number;
}): Promise<RequisicionDept[]> => {
  const res = await api.get<ApiResponse<RequisicionDept[]>>('/requisiciones', { params });
  return res.data.data;
};

export const enviarACompras = async (id: number): Promise<void> => {
  await api.patch(`/requisiciones/${id}/enviar-compras`);
};
