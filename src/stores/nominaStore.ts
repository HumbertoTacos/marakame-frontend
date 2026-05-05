import { create } from 'zustand';
import apiClient from '../services/api';
import { Nomina, Empleado } from '../types';

interface NominaState {
  // Estado
  nominas: Nomina[];
  empleados: Empleado[];
  nominaActual: Nomina | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchNominas: () => Promise<void>;
  fetchEmpleados: () => Promise<void>;
  fetchNominaById: (id: number | string) => Promise<void>;
  setNominaActual: (nomina: Nomina | null) => void;
  limpiarErrores: () => void;
}

export const useNominaStore = create<NominaState>((set) => ({
  nominas: [],
  empleados: [],
  nominaActual: null,
  isLoading: false,
  error: null,

  fetchNominas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/nominas');
      // Aseguramos que data.data exista según el estándar de tu API
      set({ nominas: response.data.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error al cargar la lista de nóminas:", error);
      set({ error: error.message || 'Error al cargar nóminas', isLoading: false });
    }
  },

  fetchEmpleados: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/empleados');
      set({ empleados: response.data.data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error al cargar empleados activos:", error);
      set({ error: error.message || 'Error al cargar empleados', isLoading: false });
    }
  },

  fetchNominaById: async (id: number | string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/nominas/${id}`);
      set({ nominaActual: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error(`Error al cargar los detalles de la nómina ${id}:`, error);
      set({ error: error.message || 'Error al cargar el detalle', isLoading: false });
    }
  },

  setNominaActual: (nomina) => set({ nominaActual: nomina }),
  
  limpiarErrores: () => set({ error: null }),
}));