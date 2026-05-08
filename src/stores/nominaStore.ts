import { create } from 'zustand';
import apiClient from '../services/api';
import type { Nomina, Empleado } from '../types';

interface NominaState {
  // Estado
  nominas: Nomina[];
  empleados: Empleado[];
  nominaActual: Nomina | null;
  isLoading: boolean;
  error: string | null;

  // Acciones - Nóminas
  fetchNominas: () => Promise<void>;
  fetchNominaById: (id: number | string) => Promise<void>;
  setNominaActual: (nomina: Nomina | null) => void;
  createNomina: (nomina: Partial<Nomina>) => Promise<void>; 
  firmarNomina: (id: number) => Promise<boolean>;
  archivarNomina: (id: number) => Promise<boolean>; // <--- FALTABA ESTO AQUÍ
  actualizarPreNomina: (id: number, data: any) => Promise<boolean>;

  // Acciones - Empleados
  fetchEmpleados: () => Promise<void>;
  createEmpleado: (empleado: Partial<Empleado>) => Promise<void>;
  updateEmpleado: (id: number, data: Partial<Empleado>) => Promise<void>;

  // Utilidades
  limpiarErrores: () => void;
}

export const useNominaStore = create<NominaState>((set, get) => ({
  nominas: [],
  empleados: [],
  nominaActual: null,
  isLoading: false,
  error: null,

  // =====================================
  // NÓMINAS
  // =====================================
  fetchNominas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/nominas/ciclo');
      set({ nominas: response.data.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error al cargar la lista de nóminas:", error);
      set({ error: error.message || 'Error al cargar nóminas', isLoading: false });
    }
  },

  fetchNominaById: async (id: number | string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/nominas/ciclo/${id}`);
      set({ nominaActual: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error(`Error al cargar los detalles de la nómina ${id}:`, error);
      set({ error: error.message || 'Error al cargar el detalle', isLoading: false });
    }
  },

  setNominaActual: (nomina) => set({ nominaActual: nomina }),

  createNomina: async (nuevaNomina) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/nominas/ciclo', nuevaNomina);
      set((state) => ({ 
        nominas: [response.data.data, ...state.nominas],
        isLoading: false 
      }));
    } catch (error: any) {
      console.error("Error al guardar nómina:", error);
      set({ error: error.message || 'Error al guardar', isLoading: false });
      throw error; 
    }
  },

  firmarNomina: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/nominas/ciclo/${id}/firmar`);
      await get().fetchNominaById(id);
      await get().fetchNominas();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.error("Error al firmar nómina:", error);
      set({ error: error.message || 'Error al firmar', isLoading: false });
      return false;
    }
  },

  archivarNomina: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/nominas/ciclo/${id}/archivar`);
      await get().fetchNominaById(id);
      await get().fetchNominas();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.error("Error al archivar nómina:", error);
      set({ error: error.message || 'Error al archivar', isLoading: false });
      return false;
    }
  },

  actualizarPreNomina: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/nominas/prenominas/${id}`, data);
      const currentNominaId = get().nominaActual?.id;
      if (currentNominaId) {
        await get().fetchNominaById(currentNominaId);
      }
      set({ isLoading: false });
      return true; 
    } catch (error: any) {
      console.error("Error al actualizar recibo:", error);
      set({ error: error.message || 'Error al actualizar recibo', isLoading: false });
      return false; 
    }
  },

  // =====================================
  // EMPLEADOS
  // =====================================
  fetchEmpleados: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/nominas/empleados');
      set({ empleados: response.data.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error al cargar empleados activos:", error);
      set({ error: error.message || 'Error al cargar empleados', isLoading: false });
    }
  },

  createEmpleado: async (nuevoEmpleado) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/nominas/empleados', nuevoEmpleado);
      set((state) => ({
        empleados: [...state.empleados, response.data.data],
        isLoading: false
      }));
    } catch (error: any) {
      console.error("Error al crear empleado:", error);
      set({ error: error.message || 'Error al crear empleado', isLoading: false });
      throw error;
    }
  },

  updateEmpleado: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/nominas/empleados/${id}`, data);
      set((state) => ({
        empleados: state.empleados.map((emp) => 
          emp.id === id ? response.data.data : emp
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error("Error al actualizar empleado:", error);
      set({ error: error.message || 'Error al actualizar empleado', isLoading: false });
      throw error;
    }
  },

  limpiarErrores: () => set({ error: null }),
}));