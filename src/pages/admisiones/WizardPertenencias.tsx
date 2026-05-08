import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Package, Plus, Trash2, CheckCircle, Loader2, ArrowRight, ShoppingBag
} from 'lucide-react';
import apiClient from '../../services/api';

interface Articulo {
  categoria: string;
  nombre: string;
  cantidad: number;
  observaciones: string;
}

interface PacienteInfo {
  id: number;
  claveUnica: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaIngreso?: string;
  cama?: { numero: string; codigo?: string; habitacion?: { nombre: string } };
}

const CATEGORIAS: { label: string; items: string[] }[] = [
  {
    label: 'Ropa de uso diario',
    items: ['Pantalón', 'Playera / Camiseta', 'Trusa / Calzón', 'Calcetines', 'Toalla', 'Pijama', 'Chamarra / Sudadera'],
  },
  {
    label: 'Calzado',
    items: ['Zapatos', 'Tenis', 'Sandalias', 'Pantuflas'],
  },
  {
    label: 'Artículos de higiene personal',
    items: [
      'Desodorante', 'Cepillo dental', 'Pasta dental', 'Shampoo',
      'Crema corporal', 'Rastrillo', 'Jabón', 'Peine / Cepillo cabello',
    ],
  },
];

const articuloVacio = (categoria: string, nombre: string): Articulo => ({
  categoria, nombre, cantidad: 0, observaciones: '',
});

const buildDefaultArticulos = (): Articulo[] =>
  CATEGORIAS.flatMap(cat => cat.items.map(item => articuloVacio(cat.label, item)));

export default function WizardPertenencias() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  const pid = parseInt(pacienteId ?? '0', 10);

  const [paciente, setPaciente] = useState<PacienteInfo | null>(null);
  const [articulos, setArticulos] = useState<Articulo[]>(buildDefaultArticulos());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pacRes, invRes] = await Promise.all([
          apiClient.get(`/pacientes/${pid}`),
          apiClient.get(`/inventario/paciente/${pid}`),
        ]);
        setPaciente(pacRes.data.data);
        if (invRes.data.data?.articulos?.length) {
          setArticulos(invRes.data.data.articulos);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pid]);

  const updateArticulo = (idx: number, field: keyof Articulo, value: string | number) => {
    setArticulos(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const addArticulo = () => {
    setArticulos(prev => [...prev, articuloVacio('Otros', '')]);
  };

  const removeArticulo = (idx: number) => {
    setArticulos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGuardarBorrador = async () => {
    try {
      await apiClient.post(`/inventario/paciente/${pid}`, { articulos, validado: false });
      alert('Borrador guardado.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el borrador.');
    }
  };

  const handleConfirmar = async () => {
    setSubmitting(true);
    try {
      await apiClient.post(`/inventario/paciente/${pid}`, {
        articulos,
        validado: true,
        firmaRecibido: true,
      });
      alert('Paciente internado correctamente. Redirigiendo al módulo médico...');
      navigate('/medico');
    } catch (err) {
      console.error(err);
      alert('Error al confirmar el inventario.');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        <span style={{ fontWeight: '700', color: '#64748b' }}>Cargando inventario...</span>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '24px',
    border: '1px solid #f1f5f9', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)',
    overflow: 'hidden', marginBottom: '1.5rem',
  };

  const thStyle: React.CSSProperties = {
    padding: '0.65rem 1rem', textAlign: 'left',
    fontWeight: '800', fontSize: '11px',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    color: '#475569', whiteSpace: 'nowrap',
    borderBottom: '1px solid #e2e8f0',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderBottom: '1px solid #f8fafc',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '0.45rem 0.65rem', fontSize: '13px', fontWeight: '600',
    color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none',
  };

  const categorias = [...new Set(articulos.map(a => a.categoria))];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '18px', color: 'white' }}>
          <ShoppingBag size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>Inventario de Pertenencias</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Registro de artículos al ingreso del paciente</p>
        </div>
        {paciente && (
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#475569' }}>
            <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>
              {paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno}
            </div>
            <div>Clave: <strong>#{paciente.claveUnica}</strong></div>
            {paciente.cama && (
              <div>Cama: <strong>{paciente.cama.codigo ?? paciente.cama.numero}</strong> — {paciente.cama.habitacion?.nombre}</div>
            )}
            {paciente.fechaIngreso && (
              <div>Ingreso: <strong>{new Date(paciente.fechaIngreso).toLocaleDateString('es-MX')}</strong></div>
            )}
          </div>
        )}
      </div>

      {/* Tabla por categoría */}
      {categorias.map(cat => {
        const rows = articulos.map((a, i) => ({ ...a, idx: i })).filter(a => a.categoria === cat);
        return (
          <div key={cat} style={cardStyle}>
            <div style={{ padding: '0.9rem 1.25rem', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={15} color="#f59e0b" />
              <span style={{ fontWeight: '900', fontSize: '13px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th style={{ ...thStyle, width: '35%' }}>Artículo</th>
                    <th style={{ ...thStyle, width: '15%' }}>Cantidad</th>
                    <th style={{ ...thStyle }}>Observaciones</th>
                    <th style={{ ...thStyle, width: '48px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.idx}>
                      <td style={tdStyle}>
                        <input
                          value={row.nombre}
                          onChange={e => updateArticulo(row.idx, 'nombre', e.target.value)}
                          style={inputStyle}
                          placeholder="Artículo..."
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min={0}
                          value={row.cantidad}
                          onChange={e => updateArticulo(row.idx, 'cantidad', parseInt(e.target.value) || 0)}
                          style={{ ...inputStyle, textAlign: 'center' }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={row.observaciones}
                          onChange={e => updateArticulo(row.idx, 'observaciones', e.target.value)}
                          style={inputStyle}
                          placeholder="Observaciones..."
                        />
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() => removeArticulo(row.idx)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.3rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Botón agregar artículo */}
      <button
        type="button"
        onClick={addArticulo}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', border: '1.5px dashed #cbd5e1', borderRadius: '14px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginBottom: '2rem' }}
      >
        <Plus size={15} /> Agregar artículo adicional
      </button>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleGuardarBorrador}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', fontWeight: '700', color: '#475569', cursor: 'pointer', fontSize: '14px' }}
        >
          Guardar Borrador
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          style={{ padding: '0.75rem 1.75rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CheckCircle size={16} /> Confirmar e Internar Paciente <ArrowRight size={15} />
        </button>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2.5rem', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
              ¿Confirmar Internamiento?
            </h3>
            <p style={{ margin: '0 0 2rem', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
              El inventario quedará registrado y el paciente pasará al estado <strong>INTERNADO</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={submitting}
                style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
