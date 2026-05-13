import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Rol =
  | 'ADMIN_GENERAL'
  | 'AREA_MEDICA'
  | 'NUTRICION'
  | 'PSICOLOGIA'
  | 'RRHH_FINANZAS'           // legacy combinado
  | 'RECURSOS_HUMANOS'
  | 'RECURSOS_FINANCIEROS'
  | 'JEFE_ADMINISTRATIVO'
  | 'ADMISIONES'
  | 'ALMACEN'
  | 'ENFERMERIA'
  | 'JEFE_MEDICO'
  | 'JEFE_CLINICO'
  | 'JEFE_ADMISIONES'
  | 'DIRECCION_GENERAL';

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: Rol;
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  setAuth: (usuario: Usuario, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      setAuth: (usuario, accessToken) => set({ usuario, accessToken }),
      logout: () => set({ usuario: null, accessToken: null }),
    }),
    {
      name: 'marakame-auth',
    }
  )
);
