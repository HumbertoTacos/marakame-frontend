import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Usuario } from '../types';

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
