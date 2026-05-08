import { useMutation, useQuery } from '@tanstack/react-query'
import {
  crearPago,
  obtenerPagos,
} from '../services/ingresos.service'

export const usePagos = () => {
  return useQuery({
    queryKey: ['pagos'],
    queryFn: obtenerPagos,
  })
}

export const useCrearPago = () => {
  return useMutation({
    mutationFn: crearPago,
  })
}