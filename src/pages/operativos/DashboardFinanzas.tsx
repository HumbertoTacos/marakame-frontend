import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, FileText, ChevronRight, Wallet, ShoppingCart, AlertCircle } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import type { Nomina } from '../../types';

const getEstadoConfig = (estado: string) => {
  switch (estado) {
    case 'PRE_NOMINA':         return { bg: '#fffbeb', text: '#b45309', label: 'Pre-Nómina' };
    case 'SOLICITUD_SUBSIDIO': return { bg: '#eff6ff', text: '#1d4ed8', label: 'Esperando Subsidio' };
    case 'EN_REVISION':        return { bg: '#fef3c7', text: '#d97706', label: 'En Revisión' };
    case 'AUTORIZADO':         return { bg: '#f0fdf4', text: '#047857', label: 'Autorizada' };
    case 'PAGADO':             return { bg: '#e0e7ff', text: '#4338ca', label: 'Pagada' };
    default:                   return { bg: '#f1f5f9', text: '#64748b', label: estado };
  }
};

const DashboardFinanzas: React.FC = () => {
  const navigate = useNavigate();
  const { nominas, fetchNominas, isLoading } = useNominaStore();

  useEffect(() => { fetchNominas(); }, [fetchNominas]);

  // Lo que está esperando la firma de Recursos Financieros
  const pendientesFinanzas = nominas.filter((n: Nomina) => !n.firmaFinanzas && n.estado !== 'BORRADOR');
  const enFlujoPosterior = nominas.filter((n: Nomina) => n.firmaFinanzas && n.estado !== 'PAGADO');

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>
          Recursos Financieros
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
          Solicitud de subsidio, control de pagos y compras del Instituto.
        </p>
      </div>

      {/* Accesos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/nominas')} style={cardBtnStyle('#0ea5e9')}>
          <Banknote size={28} /> <span>Nóminas en flujo</span>
        </button>
        <button onClick={() => navigate('/compras')} style={cardBtnStyle('#10b981')}>
          <ShoppingCart size={28} /> <span>Compras</span>
        </button>
        <button onClick={() => navigate('/pagos')} style={cardBtnStyle('#f59e0b')}>
          <Wallet size={28} /> <span>Pagos de Pacientes</span>
        </button>
      </div>

      {/* Pendientes de firma */}
      <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={20} color="#f59e0b" /> Pre-nóminas esperando tu firma ({pendientesFinanzas.length})
      </h2>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '2rem' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando…</div>
        ) : pendientesFinanzas.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No hay pre-nóminas pendientes de tu firma.</div>
        ) : (
          pendientesFinanzas.map((n: Nomina) => <NominaRow key={n.id} nomina={n} onClick={() => navigate(`/nominas/${n.id}`)} />)
        )}
      </div>

      {/* En flujo posterior */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#475569', margin: '0 0 0.75rem 0' }}>Pre-nóminas que ya pasaron por Finanzas</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {enFlujoPosterior.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros.</div>
        ) : (
          enFlujoPosterior.map((n: Nomina) => <NominaRow key={n.id} nomina={n} onClick={() => navigate(`/nominas/${n.id}`)} compacto />)
        )}
      </div>
    </div>
  );
};

const NominaRow: React.FC<{ nomina: Nomina; onClick: () => void; compacto?: boolean }> = ({ nomina, onClick, compacto }) => {
  const conf = getEstadoConfig(nomina.estado);
  return (
    <div
      onClick={onClick}
      style={{ padding: compacto ? '0.85rem 1.25rem' : '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FileText size={18} color="#3b82f6" />
        <div>
          <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{nomina.periodo}</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{nomina.folio}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ backgroundColor: conf.bg, color: conf.text, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>{conf.label}</span>
        <ChevronRight size={18} color="#94a3b8" />
      </div>
    </div>
  );
};

const cardBtnStyle = (color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '12px', padding: '1.25rem 1.5rem',
  backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
  cursor: 'pointer', fontWeight: '800', color, fontSize: '15px', textAlign: 'left',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
});

export default DashboardFinanzas;
