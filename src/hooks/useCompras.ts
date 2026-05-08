import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRequisiciones,
    createRequisicion,
    updateEstado,
    addCotizacion,
    generarOrden
    } from '../services/compras.service';
    import type { EstadoCompra } from '../types';

    export const useCompras = () => {
    const queryClient = useQueryClient();

    const requisicionesQuery = useQuery({
        queryKey: ['requisiciones'],
        queryFn: getRequisiciones
    });

    const createReq = useMutation({
        mutationFn: createRequisicion,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
        }
    });

    const changeEstado = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: EstadoCompra }) =>
        updateEstado(id, estado),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
        }
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
                queryKey: ['requisiciones']
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
                queryKey: ['requisiciones']
            });
        }
    });

    return {
        requisiciones: requisicionesQuery.data || [],
        isLoading: requisicionesQuery.isLoading,
        createReq,
        changeEstado,
        createCot,
        createOrden
    };
};