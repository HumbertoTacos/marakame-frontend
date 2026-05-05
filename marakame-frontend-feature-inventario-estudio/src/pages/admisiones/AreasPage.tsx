import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  ShieldCheck, 
  Bed as BedIcon 
} from 'lucide-react';
import { useIngresoStore } from '../../stores/ingresoStore';
import { AreaCentro, EstadoCama } from '../../types';
import CamaCard from '../../components/admisiones/CamaCard';

const AreasPage: React.FC = () => {
  const { camas, fetchCamas, isLoading } = useIngresoStore();
  const [activeTab, setActiveTab] = useState<AreaCentro>(AreaCentro.HOMBRES);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCamas();
  }, [fetchCamas]);

  const getStats = (area: AreaCentro) => {
    const areaCamas = camas.filter(c => c.habitacion?.area === area);
    return {
      total: areaCamas.length,
      disponibles: areaCamas.filter(c => c.estado === EstadoCama.DISPONIBLE).length,
      ocupadas: areaCamas.filter(c => c.estado === EstadoCama.OCUPADA).length,
    };
  };

  const camasFiltradas = useMemo(() => {
    return camas
      .filter(c => c.habitacion?.area === activeTab)
      .filter(cama => {
        if (!searchTerm.trim()) return true;

        const texto = searchTerm.toLowerCase();

        return (
          cama.codigo?.toLowerCase().includes(texto) ||
          cama.numero?.toString().includes(texto) ||
          cama.descripcion?.toLowerCase().includes(texto) ||
          cama.habitacion?.area?.toLowerCase().includes(texto)
        );
      });
  }, [camas, activeTab, searchTerm]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Mapa de Áreas y Camas</h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Monitoreo en tiempo real de la capacidad instalada y ocupación por área.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {Object.values(AreaCentro).map(area => {
          const stats = getStats(area);
          const isActive = activeTab === area;
          return (
            <div 
              key={area}
              onClick={() => setActiveTab(area)}
              style={{ 
                backgroundColor: 'white', 
                padding: '1.5rem', 
                borderRadius: '24px', 
                border: `2px solid ${isActive ? '#3b82f6' : '#e2e8f0'}`, 
                cursor: 'pointer',
                boxShadow: isActive ? '0 15px 25px -5px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
                    <MapPin size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{area}</h3>
                </div>
                {isActive && <ShieldCheck size={24} color="#3b82f6" />}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Camas</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{stats.total}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Libres</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{stats.disponibles}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Ocupadas</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#f43f5e' }}>{stats.ocupadas}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Grid Container */}
      <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '3rem', minHeight: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BedIcon size={24} color="#3b82f6" /> Vista General: ÁREA {activeTab}
            </h2>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Search size={14} color="#94a3b8" />
                <input type="text" placeholder="Buscar cama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px', width: '150px' }} />
              </div>
            </div>
          </div>
          <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div> Ocupada</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0' }}></div> Disponible</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }}></div> Mantenimiento</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {camasFiltradas.map(cama => (
            <CamaCard key={cama.id} cama={cama} />
          ))}
        </div>

        {!isLoading && camasFiltradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🛏️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Sin registros de camas</h3>
            <p>No hay inventario de camas configurado para el área {activeTab}.</p>
          </div>
        )}
      </div>

      {isLoading && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 100 }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Cargando disponibilidad...
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AreasPage;
