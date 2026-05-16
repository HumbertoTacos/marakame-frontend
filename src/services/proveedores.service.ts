import api from './api';
import type { Proveedor, EstadoProveedor } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export interface ProveedoresQuery {
  q?: string;
  estado?: EstadoProveedor;
  giro?: string;
  page?: number;
  limit?: number;
}

export const proveedoresService = {
  async getAll(params?: ProveedoresQuery) {
    const res = await api.get<ApiResponse<Proveedor[]>>('/proveedores', { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<Proveedor>>(`/proveedores/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Proveedor>) {
    const res = await api.post<ApiResponse<Proveedor>>('/proveedores', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Proveedor>) {
    const res = await api.put<ApiResponse<Proveedor>>(`/proveedores/${id}`, data);
    return res.data.data;
  },

  async cambiarEstado(id: number, estado: EstadoProveedor) {
    const res = await api.patch<ApiResponse<Proveedor>>(`/proveedores/${id}/estado`, { estado });
    return res.data.data;
  },

  async subirDocumento(id: number, tipo: string, file: File) {
    const form = new FormData();
    form.append('archivo', file);
    const res = await api.post<ApiResponse<Proveedor>>(`/proveedores/${id}/documentos/${tipo}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
