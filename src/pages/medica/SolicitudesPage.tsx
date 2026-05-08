import { ClipboardCheck, Clock } from 'lucide-react';

export default function SolicitudesPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header card */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.75rem 2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '16px' }}>
          <ClipboardCheck size={26} color="#059669" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>Solicitudes</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Gestión administrativa de jefatura</p>
        </div>
      </div>

      {/* Próximamente */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '5rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
        <div style={{ width: '72px', height: '72px', backgroundColor: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Clock size={34} color="#94a3b8" />
        </div>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>
          Próximamente
        </h2>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: '500', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
          Gestión de Solicitudes Administrativas
        </p>
        <p style={{ margin: '0.75rem 0 0', fontSize: '13px', color: '#94a3b8' }}>
          Este módulo estará disponible en una próxima actualización del sistema.
        </p>
      </div>

    </div>
  );
}
