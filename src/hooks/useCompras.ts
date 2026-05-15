import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRequisiciones,
    createRequisicion,
    updateEstado,
    addCotizacion,
    eliminarCotizacion,
    generarOrden,
    generarOrdenPago,
    subirFactura,
    registrarCotizacionCatalogo,
    registrarCotizacionesBulk,
    enviarARevisionAdministrativa,
    aprobarCompraAdministracion,
    generarExpedienteCompra,
    enviarAFinanzasCompra,
    finalizarCompraService,
    agregarCotizacionProducto,
    seleccionarCotizacionProducto,
    type NuevaCotizacionProductoPayload,
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
        mutationFn: (id: number) => generarOrden(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
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

    const createCotCatalogo = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: {
                proveedorId: number;
                precio: number;
                tiempoEntrega?: string;
                formaPago?: string;
            };
        }) => registrarCotizacionCatalogo(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const deleteCot = useMutation({
        mutationFn: ({ compraId, cotizacionId }: { compraId: number; cotizacionId: number }) =>
            eliminarCotizacion(compraId, cotizacionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const enviarAdministracion = useMutation({
        mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
            enviarARevisionAdministrativa(id, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const aprobarAdministracion = useMutation({
        mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
            aprobarCompraAdministracion(id, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const genExpediente = useMutation({
        mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
            generarExpedienteCompra(id, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const enviarFinanzas = useMutation({
        mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
            enviarAFinanzasCompra(id, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const finalizar = useMutation({
        mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
            finalizarCompraService(id, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const createCotBulk = useMutation({
        mutationFn: ({
            id,
            items,
        }: {
            id: number;
            items: {
                requisicionDetalleId: number;
                proveedorId: number;
                precioUnitario: number;
                tiempoEntrega?: string;
                formaPago?: string;
            }[];
        }) => registrarCotizacionesBulk(id, items),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const addCotProducto = useMutation({
        mutationFn: ({ id, data }: { id: number; data: NuevaCotizacionProductoPayload }) =>
            agregarCotizacionProducto(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    const selectCotProducto = useMutation({
        mutationFn: ({ compraId, cotizacionId }: { compraId: number; cotizacionId: number }) =>
            seleccionarCotizacionProducto(compraId, cotizacionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compras'] });
        },
    });

    return {
        requisiciones:
            requisicionesQuery.data || [],
        isLoading:
            requisicionesQuery.isLoading,
        createReq,
        changeEstado,
        createCot,
        deleteCot,
        createCotCatalogo,
        createCotBulk,
        addCotProducto,
        selectCotProducto,
        enviarAdministracion,
        aprobarAdministracion,
        createOrden,
        createOrdenPago,
        uploadFactura,
        genExpediente,
        enviarFinanzas,
        finalizar,
    };
};