import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRequisiciones,
    createRequisicion,
    updateEstado,
    addCotizacion,
    generarOrden,
    generarOrdenPago,
    subirFactura
    } from '../services/compras.service';
    import type { EstadoCompra } from '../types';

    export const useCompras = () => {
    const queryClient = useQueryClient();

    const requisicionesQuery = useQuery({
        queryKey: ['compras'],
        queryFn: getRequisiciones
    });

    const createReq = useMutation({
        mutationFn: createRequisicion,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['compras'] });
        }
    });

    const changeEstado = useMutation({
        mutationFn: ({
            id,
            estado,
            observaciones,
            fechaPago,
            referenciaBancaria,
            concepto,
            monto,
        }: {
            id: number;
            estado: EstadoCompra;
            observaciones?: string;
            fechaPago?: string;
            referenciaBancaria?: string;
            concepto?: string;
            monto?: number;
        }) =>
            updateEstado(id, estado, {
                observaciones,
                fechaPago,
                referenciaBancaria,
                concepto,
                monto,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const createCot = useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: number;
            data: {
                proveedor: string;
                precio: number;
                tiempoEntrega?: string;
                esMejorOpcion?: boolean;
            };
        }) => addCotizacion(id, data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['compras']
            });
        }
    });

    const createOrden = useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: number;
            data: {
                proveedor: string;
                total: number;
            };
        }) => generarOrden(id, data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['compras']
            });
        }
    });

    const createOrdenPago = useMutation({
        mutationFn: (id: number) =>
            generarOrdenPago(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['compras']
            });
        }
    });

    const uploadFactura = useMutation({
        mutationFn: ({
            id,
            file
        }: {
            id: number;
            file: File;
        }) =>
            subirFactura(id, file),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['compras']
            });
        }
    });

    return {
        requisiciones:
            requisicionesQuery.data || [],
        isLoading:
            requisicionesQuery.isLoading,
        createReq,
        changeEstado,
        createCot,
        createOrden,
        createOrdenPago,
        uploadFactura
    };
};