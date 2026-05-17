import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, ChevronRight, AlertCircle, FileSignature, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNominaStore } from '../../stores/nominaStore';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { getComprasRevisionAdmin } from '../../services/compras.service';
import type { Nomina, Requisicion } from '../../types';

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

const DashboardAdministracion: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const { nominas, fetchNominas, isLoading } = useNominaStore();

  useEffect(() => { fetchNominas(); }, [fetchNominas]);

  const { data: comprasPendientes = [] } = useQuery<Requisicion[]>({
    queryKey: ['compras-revision-admin'],
    queryFn: getComprasRevisionAdmin,
  });

  // JEFE_ADMINISTRATIVO solo observa (sin firma). ADMIN_GENERAL puede entrar al detalle.
  const soloLectura = usuario?.rol === 'JEFE_ADMINISTRATIVO';
  const abrirDetalle = (id: number) => { if (!soloLectura) navigate(`/nominas/${id}`); };

  // Pendientes para Jefatura: ya firmó Finanzas pero falta tu firma de Administración.
  const pendientesAdmin = nominas.filter((n: Nomina) => n.firmaFinanzas && !n.firmaAdministracion);
  const haciaDireccion  = nominas.filter((n: Nomina) => n.firmaAdministracion && !n.firmaDireccion);
  const yaCerradas      = nominas.filter((n: Nomina) => n.firmaDireccion && n.estado !== 'PAGADO');

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Briefcase size={28} color="#7c3aed" /> Jefatura Administrativa
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
          {soloLectura
            ? 'Resumen del flujo de nómina (vista de solo lectura para Jefatura Administrativa).'
            : 'Revisión y firma intermedia del flujo de nómina antes de pasar a Dirección General.'}
        </p>
      </div>

      {/* Compras pendientes de revisión */}
      <div
        onClick={() => navigate('/revision-compras')}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: comprasPendientes.length > 0 ? '#FFF7ED' : 'white',
          border: `1px solid ${comprasPendientes.length > 0 ? '#FDE68A' : '#e2e8f0'}`,
          borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = comprasPendientes.length > 0 ? '#FEF3C7' : '#F8FAFC')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = comprasPendientes.length > 0 ? '#FFF7ED' : 'white')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: comprasPendientes.length > 0 ? '#FDE68A' : '#F1F5F9', borderRadius: '10px', padding: '10px', display: 'flex' }}>
            <ShoppingCart size={20} color={comprasPendientes.length > 0 ? '#D97706' : '#94a3b8'} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>Revisión Administrativa de Compras</p>
            <p style={{ margin: '2px 0 0', color: comprasPendientes.length > 0 ? '#D97706' : '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
              {comprasPendientes.length > 0
                ? `${comprasPendientes.length} requisición${comprasPendientes.length !== 1 ? 'es' : ''} esperando tu revisión`
                : 'Sin compras pendientes de revisión'}
            </p>
          </div>
        </div>
        <ArrowRight size={18} color="#94a3b8" />
      </div>

      {/* Pendientes de mi firma */}
      <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={20} color="#f59e0b" /> Pre-nóminas esperando tu revisión ({pendientesAdmin.length})
      </h2>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '2rem' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando…</div>
        ) : pendientesAdmin.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
            No hay pre-nóminas pendientes de tu revisión.
          </div>
        ) : (
          pendientesAdmin.map((n: Nomina) => <NominaRow key={n.id} nomina={n} onClick={() => abrirDetalle(n.id)} />)
        )}
      </div>

      {/* En camino a Dirección */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#475569', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileSignature size={16} /> En camino a Dirección General ({haciaDireccion.length})
      </h2>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '2rem' }}>
        {haciaDireccion.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros.</div>
        ) : (
          haciaDireccion.map((n: Nomina) => <NominaRow key={n.id} nomina={n} onClick={() => abrirDetalle(n.id)} compacto />)
        )}
      </div>

      {/* Cerradas / autorizadas recientes */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#475569', margin: '0 0 0.75rem 0' }}>Autorizadas recientemente</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {yaCerradas.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros.</div>
        ) : (
          yaCerradas.map((n: Nomina) => <NominaRow key={n.id} nomina={n} onClick={() => abrirDetalle(n.id)} compacto />)
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
        <FileText size={18} color="#7c3aed" />
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

export default DashboardAdministracion;
