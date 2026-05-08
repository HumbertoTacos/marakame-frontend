import React, { useEffect, useState } from 'react';
import { BedDouble, CheckCircle, X, Loader2, Home } from 'lucide-react';
import apiClient from '../../services/api';

interface Cama {
  id: number;
  numero: string;
  codigo?: string;
  estado: string;
  habitacion?: { nombre: string; area: string };
}

interface Props {
  pacienteId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AsignacionCamaModal: React.FC<Props> = ({ pacienteId, onSuccess, onCancel }) => {
  const [camas, setCamas] = useState<Cama[]>([]);
  const [selectedCama, setSelectedCama] = useState<Cama | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admisiones/camas')
      .then(r => setCamas((r.data.data as Cama[]).filter(c => c.estado === 'DISPONIBLE')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmar = async () => {
    if (!selectedCama) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/admisiones/paciente/${pacienteId}/asignar-cama`, {
        camaId: selectedCama.id,
        fechaIngreso: new Date().toISOString(),
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Error al asignar la cama. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const areaColor: Record<string, string> = {
    HOMBRES: '#3b82f6',
    MUJERES: '#ec4899',
    DETOX: '#f59e0b',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '28px',
    padding: '2rem', width: '100%', maxWidth: '680px',
    maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: '14px', color: 'white' }}>
              <BedDouble size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Asignación de Cama</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Seleccione una cama disponible</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.4rem', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: '700' }}>Cargando camas disponibles...</p>
          </div>
        ) : camas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <BedDouble size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ fontWeight: '700' }}>No hay camas disponibles en este momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {camas.map(cama => {
              const area = cama.habitacion?.area ?? '';
              const isSelected = selectedCama?.id === cama.id;
              return (
                <button
                  key={cama.id}
                  type="button"
                  onClick={() => { setSelectedCama(cama); setConfirming(false); }}
                  style={{
                    border: isSelected ? `2.5px solid ${areaColor[area] ?? '#3b82f6'}` : '1.5px solid #e2e8f0',
                    borderRadius: '16px', padding: '1rem', cursor: 'pointer', textAlign: 'left',
                    backgroundColor: isSelected ? `${(areaColor[area] ?? '#3b82f6')}15` : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Home size={13} color={areaColor[area] ?? '#3b82f6'} />
                    <span style={{ fontSize: '10px', fontWeight: '800', color: areaColor[area] ?? '#3b82f6', textTransform: 'uppercase' }}>
                      {cama.habitacion?.nombre ?? '—'} · {area}
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                    {cama.codigo ?? `#${cama.numero}`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: '700', marginTop: '0.2rem' }}>Disponible</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Panel de confirmación */}
        {selectedCama && !confirming && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontWeight: '700', color: '#065f46', fontSize: '14px' }}>
              Cama seleccionada: <strong>{selectedCama.codigo ?? `#${selectedCama.numero}`}</strong>
              {selectedCama.habitacion && <> — {selectedCama.habitacion.nombre} ({selectedCama.habitacion.area})</>}
            </p>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', fontWeight: '700', color: '#475569', cursor: 'pointer', fontSize: '14px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedCama || submitting}
            onClick={handleConfirmar}
            style={{
              padding: '0.75rem 1.75rem', borderRadius: '14px', border: 'none',
              background: selectedCama ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#e2e8f0',
              color: selectedCama ? 'white' : '#94a3b8',
              fontWeight: '800', cursor: selectedCama ? 'pointer' : 'not-allowed',
              fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.15s',
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            Confirmar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};
