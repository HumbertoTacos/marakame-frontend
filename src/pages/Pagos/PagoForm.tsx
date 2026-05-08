import { useForm } from 'react-hook-form'
import { useCrearPago } from '../../hooks/usePagos'

export default function PagoForm() {
  const { register, handleSubmit, reset } = useForm()

  const mutation = useCrearPago()

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync({
      ...data,
      monto: Number(data.monto),
    })

    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <input
        {...register('pacienteId')}
        placeholder="Paciente"
        className="border p-2 w-full"
      />

      <input
        {...register('concepto')}
        placeholder="Concepto"
        className="border p-2 w-full"
      />

      <input
        type="number"
        {...register('monto')}
        placeholder="Monto"
        className="border p-2 w-full"
      />

      <select
        {...register('metodoPago')}
        className="border p-2 w-full"
      >
        <option value="EFECTIVO">Efectivo</option>
        <option value="TRANSFERENCIA">Transferencia</option>
        <option value="TARJETA">Tarjeta</option>
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2"
      >
        Registrar pago
      </button>
    </form>
  )
}