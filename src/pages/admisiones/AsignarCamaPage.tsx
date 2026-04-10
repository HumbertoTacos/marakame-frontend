import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bed as BedIcon, 
  User, 
  MapPin, 
  CheckCircle, 
  ArrowLeft,
  Users
} from 'lucide-react';
import { useIngresoStore } from '../../stores/ingresoStore';
import { AreaCentro } from '../../types';
import type { SolicitudIngreso, Cama } from '../../types';
import CamaCard from '../../components/admisiones/CamaCard';

const AsignarCamaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    camas, 
    fetchCamas, 
    asignarCama, 
    isLoading 
  } = useIngresoStore();

  const [solicitud, setSolicitud] = useState<SolicitudIngreso | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaCentro>(AreaCentro.HOMBRES);
  const [selectedCama, setSelectedCama] = useState<Cama | null>(null);
  const [medico, setMedico] = useState({ id: '1', nombre: '' });
  const [fechaCita, setFechaCita] = useState(new Date().toISOString().split('T')[0]);

  // En un entorno real, buscaríamos la solicitud por ID desde el store o API
  useEffect(() => {
    const loadData = async () => {
      // Simulación de carga de solicitud (podríamos añadir fetchSolicitudById al store)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admisiones/solicitudes`);
      const data = await response.json();
      const found = data.data.find((s: SolicitudIngreso) => s.id === parseInt(id || ''));
      if (found) {
        setSolicitud(found);
        setSelectedArea(found.paciente?.areaDeseada || AreaCentro.HOMBRES);
      }
    };
    loadData();
    fetchCamas();
  }, [id, fetchCamas]);

  const handleAssign = async () => {
    if (!selectedCama || !medico.nombre) {
      alert('Por favor selecciona una cama y asigna un médico.');
      return;
    }

    try {
      await asignarCama(parseInt(id || ''), {
        camaId: selectedCama.id,
        fechaIngresoEstimada: fechaCita,
        medicoId: medico.id,
        medicoNombre: medico.nombre,
        observaciones: 'Asignación desde dashboard administrativo.'
      });
      alert('Cama asignada correctamente. El paciente ya figura como INTERNADO.');
      navigate('/admisiones/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    }
  };

  if (!solicitud) return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando datos de la solicitud...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/admisiones/dashboard')} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Asignación de Cama</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Folio: <strong>{solicitud.folio}</strong> - Paciente: <strong>{solicitud.paciente?.nombre} {solicitud.paciente?.apellidoPaterno}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Left Column: Bed Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Area Selector */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {Object.values(AreaCentro).map(area => (
              <button 
                key={area}
                onClick={() => setSelectedArea(area)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: selectedArea === area ? '#3b82f6' : 'white',
                  color: selectedArea === area ? 'white' : '#64748b',
                  fontWeight: 'bold',
                  boxShadow: selectedArea === area ? '0 10px 15px -3px rgba(59,130,246,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <MapPin size={18} /> {area}
              </button>
            ))}
          </div>

          {/* Bed Grid */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            border: '1px solid #e2e8f0', 
            padding: '2rem',
            minHeight: '400px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BedIcon size={20} color="#3b82f6" /> Mapa de Camas - Área {selectedArea}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {camas.filter(c => c.area === selectedArea).map(cama => (
                <CamaCard 
                  key={cama.id} 
                  cama={cama} 
                  selected={selectedCama?.id === cama.id}
                  onSelect={setSelectedCama}
                />
              ))}
            </div>
            
            {camas.filter(c => c.area === selectedArea).length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                No hay camas registradas en esta área.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assignment Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '1.25rem' }}>Detalles de Asignación</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Cama Seleccionada</label>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', fontWeight: '700', color: selectedCama ? '#1e293b' : '#94a3b8' }}>
                  {selectedCama ? (selectedCama.codigo || `Cama ${selectedCama.numero}`) : 'Ninguna seleccionada'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Médico Responsable</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Nombre del médico..." 
                    value={medico.nombre}
                    onChange={e => setMedico({...medico, nombre: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Fecha de Ingreso</label>
                <input 
                  type="date" 
                  value={fechaCita}
                  onChange={e => setFechaCita(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>

              <button 
                onClick={handleAssign}
                disabled={!selectedCama || isLoading}
                style={{ 
                  marginTop: '1rem',
                  padding: '1rem', 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  cursor: (selectedCama && !isLoading) ? 'pointer' : 'not-allowed',
                  opacity: (selectedCama && !isLoading) ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)'
                }}
              >
                {isLoading ? 'Procesando...' : <><CheckCircle size={20} /> Finalizar Asignación</>}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ backgroundColor: '#eff6ff', padding: '1.5rem', borderRadius: '24px', color: '#1e40af' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Users size={20} />
              <h4 style={{ margin: 0, fontWeight: '800' }}>Información</h4>
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
              Al finalizar, el sistema actualizará automáticamente el estado del paciente a <strong>INTERNADO</strong> y marcará la cama como <strong>OCUPADA</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarCamaPage;
