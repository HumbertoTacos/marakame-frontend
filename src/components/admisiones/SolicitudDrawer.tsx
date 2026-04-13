import { X, Phone, Mail, MapPin, CheckCircle, Trash2, Stethoscope, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EstadoSolicitud } from '../../types';
import type { SolicitudIngreso } from '../../types';
import EstadoSolicitudChip from './EstadoSolicitudChip';
import UrgenciaChip from './UrgenciaChip';

interface SolicitudDrawerProps {
  solicitud: SolicitudIngreso | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const SolicitudDrawer: React.FC<SolicitudDrawerProps> = ({ 
  solicitud, 
  isOpen, 
  onClose,
  onApprove,
  onReject
}) => {
  const navigate = useNavigate();
  if (!solicitud) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }} 
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'white',
        boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.1)',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Solicitud de Ingreso</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{solicitud.folio}</h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <EstadoSolicitudChip estado={solicitud.estado} />
            <UrgenciaChip nivel={solicitud.urgencia} />
          </div>

          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', borderLeft: '4px solid #3b82f6', paddingLeft: '0.75rem' }}>Datos del Paciente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Nombre Completo</p>
                <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '16px' }}>{solicitud.paciente?.nombre} {solicitud.paciente?.apellidoPaterno} {solicitud.paciente?.apellidoMaterno}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>CURP</p>
                  <p style={{ margin: '2px 0 0', fontWeight: '600' }}>{solicitud.paciente?.curp || '---'}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Adicción</p>
                  <p style={{ margin: '2px 0 0', fontWeight: '600' }}>{solicitud.paciente?.tipoAdiccion || '---'}</p>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', borderLeft: '4px solid #10b981', paddingLeft: '0.75rem' }}>Información del Solicitante</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                <CheckCircle size={18} color="#10b981" />
                <span style={{ fontWeight: '600' }}>{solicitud.solicitante?.nombre} ({solicitud.solicitante?.parentesco})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                <Phone size={18} />
                <span>{solicitud.solicitante?.telefono || 'Sin teléfono'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                <Mail size={18} />
                <span>{solicitud.solicitante?.correo || 'Sin correo'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                <MapPin size={18} />
                <span>{solicitud.solicitante?.municipio}, {solicitud.solicitante?.estado}</span>
              </div>
            </div>
          </section>

          {solicitud.observaciones && (
            <section style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Observaciones</h3>
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '12px', fontSize: '14px', color: '#92400e', lineHeight: 1.5 }}>
                {solicitud.observaciones}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
          {solicitud.estado === EstadoSolicitud.PENDIENTE && (
            <>
              {solicitud.paciente?.estado === 'PROSPECTO' && (
                <button 
                  onClick={() => {
                    onClose();
                    navigate(`/admisiones/valoracion-medica/${solicitud.pacienteId}`);
                  }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #3b82f6', color: '#1e40af', backgroundColor: '#eff6ff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Stethoscope size={18} /> Valoración Médica
                </button>
              )}
              <button 
                onClick={() => onReject?.(solicitud.id)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #fecaca', color: '#dc2626', backgroundColor: '#fef2f2', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Trash2 size={18} /> Rechazar
              </button>
              <button 
                onClick={() => onApprove?.(solicitud.id)}
                style={{ flex: 2, padding: '0.75rem', borderRadius: '12px', border: 'none', color: 'white', backgroundColor: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}
              >
                <CheckCircle size={18} /> Aprobar y Asignar Cama
              </button>
            </>
          )}
          {solicitud.estado === EstadoSolicitud.APROBADA && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  onClose();
                  navigate(`/admisiones/expediente/${solicitud.pacienteId}`);
                }}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', color: 'white', backgroundColor: '#10b981', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)' }}
              >
                <Folder size={18} /> Ver Expediente Digital
              </button>
              <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px', color: '#166534', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '13px' }}>
                <CheckCircle size={16} /> Solicitud Procesada Correctamente
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SolicitudDrawer;
