import api from './api';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'INFO' | 'ALERTA' | 'EXITO' | 'ERROR';
  leida: boolean;
  link?: string;
  createdAt: string;
}

export const notificacionService = {
  getMisNotificaciones: async () => {
    const response = await api.get<{ success: boolean; data: Notificacion[] }>('/notificaciones');
    return response.data;
  },

  marcarComoLeida: async (id: number) => {
    const response = await api.patch(`/notificaciones/${id}/leida`);
    return response.data;
  },

  marcarTodasComoLeidas: async () => {
    const response = await api.patch('/notificaciones/marcar-todas-leidas');
    return response.data;
  }
};
