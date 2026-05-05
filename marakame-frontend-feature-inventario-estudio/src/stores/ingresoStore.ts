import { create } from 'zustand';
import apiClient from '../services/api';
import { EstadoSolicitud, AreaCentro } from '../types';
import type { Cama, SolicitudIngreso } from '../types';

interface IngresoState {
  camas: Cama[];
  solicitudes: SolicitudIngreso[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchCamas: (area?: AreaCentro) => Promise<void>;
  fetchSolicitudes: () => Promise<void>;
  fetchSolicitudByFolio: (folio: string) => Promise<SolicitudIngreso | null>;
  submitSolicitud: (data: Partial<SolicitudIngreso> & Record<string, string | number | undefined>) => Promise<SolicitudIngreso>;
  updateEstadoSolicitud: (id: number, estado: EstadoSolicitud, motivoRechazo?: string) => Promise<void>;
  asignarCama: (solicitudId: number, data: { camaId: number; fechaIngresoEstimada: string; medicoId: string; medicoNombre: string; observaciones?: string }) => Promise<void>;
}

export const useIngresoStore = create<IngresoState>((set) => ({
  camas: [],
  solicitudes: [],
  isLoading: false,
  error: null,

  fetchCamas: async (area) => {
    set({ isLoading: true, error: null });
    try {
      const url = area ? `/admisiones/camas?area=${area}` : '/admisiones/camas';
      const response = await apiClient.get(url);
      set({ camas: response.data.data, isLoading: false });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ error: error.response?.data?.message || 'Error al obtener camas', isLoading: false });
    }
  },

  fetchSolicitudes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/admisiones/solicitudes');
      set({ solicitudes: response.data.data, isLoading: false });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ error: error.response?.data?.message || 'Error al obtener solicitudes', isLoading: false });
    }
  },

  fetchSolicitudByFolio: async (folio) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/admisiones/solicitudes/${folio}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ error: error.response?.data?.message || 'Error al obtener solicitud', isLoading: false });
      return null;
    }
  },

  submitSolicitud: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/admisiones/solicitudes', data);
      set((state) => ({ 
        solicitudes: [response.data.data, ...state.solicitudes],
        isLoading: false 
      }));
      return response.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Error al crear solicitud';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  updateEstadoSolicitud: async (id, estado, motivoRechazo) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.patch(`/admisiones/solicitudes/${id}/estado`, { estado, motivoRechazo });
      set((state) => ({
        solicitudes: state.solicitudes.map(s => s.id === id ? { ...s, estado, motivoRechazo } : s),
        isLoading: false
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ error: error.response?.data?.message || 'Error al actualizar estado', isLoading: false });
    }
  },

  asignarCama: async (solicitudId, data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/admisiones/solicitudes/${solicitudId}/asignar-cama`, data);
      set({ isLoading: false });
      // Refrescamos datos locales
      const responseSolicitudes = await apiClient.get('/admisiones/solicitudes');
      const responseCamas = await apiClient.get('/admisiones/camas');
      set({ 
        solicitudes: responseSolicitudes.data.data,
        camas: responseCamas.data.data
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Error al asignar cama';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  }
}));
