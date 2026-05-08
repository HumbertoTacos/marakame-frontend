import api from '../services/api'

export const crearPago = async (data: any) => {
  const response = await api.post('/ingresos', data)
  return response.data
}

export const obtenerPagos = async () => {
  const response = await api.get('/ingresos')
  return response.data
}

export const generarCorteCaja = async () => {
  const response = await api.post('/ingresos/corte-caja')
  return response.data
}