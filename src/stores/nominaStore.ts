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

  // Acciones
  fetchNominas: () => Promise<void>;
  fetchEmpleados: () => Promise<void>;
  fetchNominaById: (id: number | string) => Promise<void>;
  setNominaActual: (nomina: Nomina | null) => void;
  limpiarErrores: () => void;
  
  createNomina: (nomina: Partial<Nomina>) => Promise<void>; 
  
  // NUEVA DEFINICIÓN: Para actualizar un recibo de un empleado
  actualizarPreNomina: (id: number, data: any) => Promise<boolean>;
}

// Agregamos "get" al callback de create para poder leer el estado interno
export const useNominaStore = create<NominaState>((set, get) => ({
  nominas: [],
  empleados: [],
  nominaActual: null,
  isLoading: false,
  error: null,

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
  
  limpiarErrores: () => set({ error: null }),

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

  // NUEVA LÓGICA: Actualiza la prenómina y refresca los totales globales
  actualizarPreNomina: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/nominas/prenominas/${id}`, data);
      
      // Obtenemos el ID de la nómina que estamos viendo actualmente
      const currentNominaId = get().nominaActual?.id;
      
      // Si tenemos una nómina abierta, mandamos a pedir sus nuevos totales al backend
      if (currentNominaId) {
        await get().fetchNominaById(currentNominaId);
      }
      
      set({ isLoading: false });
      return true; // Retornamos true para que el componente sepa que todo salió bien
    } catch (error: any) {
      console.error("Error al actualizar recibo:", error);
      set({ error: error.message || 'Error al actualizar recibo', isLoading: false });
      return false; // Retornamos false si falló
    }
  },

}));