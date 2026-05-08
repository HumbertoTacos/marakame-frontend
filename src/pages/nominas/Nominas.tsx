import api from '../../services/api'

export default function Nominas() {
  const generarPrenomina = async () => {
    await api.post('/nominas/generar', {
      fechaInicio: '2026-05-01',
      fechaFin: '2026-05-15',
    })

    alert('Prenómina generada')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Nóminas
      </h1>

      <button
        onClick={generarPrenomina}
        className="bg-green-600 text-white px-4 py-2"
      >
        Generar Prenómina
      </button>
    </div>
  )
}