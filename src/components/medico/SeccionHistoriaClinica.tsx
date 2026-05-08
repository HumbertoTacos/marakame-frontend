import React, { useEffect, useState } from 'react';
import {
  FileText,
  Activity,
  Brain,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  AlertCircle,
  User
} from 'lucide-react';
import apiClient from '../../services/api';

interface ValoracionMedica {
  id: number;
  estado: 'BORRADOR' | 'COMPLETADA' | 'FIRMADA';
  residente?: string;
  tipoValoracion?: string;
  fechaValoracion?: string;
  horaValoracion?: string;
  motivoConsulta?: string;
  padecimientoActual?: string;
  sintomasGenerales?: string;
  tratamientosPrevios?: string;
  antecedentesHeredofamiliares?: string;
  antecedentesPatologicos?: string;
  antecedentesNoPatologicos?: string;
  historialConsumo?: string;
  tensionArterial?: string;
  frecuenciaCardiaca?: string;
  frecuenciaRespiratoria?: string;
  temperatura?: string;
  peso?: string;
  talla?: string;
  exploracionFisicaDesc?: string;
  examenMental?: string;
  impresionDiagnostica?: string;
  pronostico?: string;
  planTratamiento?: string;
  esAptoParaIngreso: boolean;
  documentoFirmadoUrl?: string;
}

interface SeccionHistoriaClinicaProps {
  pacienteId: number;
}

const ESTADO_CONFIG = {
  BORRADOR:   { label: 'Borrador',   bg: '#fef9c3', color: '#854d0e' },
  COMPLETADA: { label: 'Completada', bg: '#dbeafe', color: '#1d4ed8' },
  FIRMADA:    { label: 'Firmada',    bg: '#dcfce7', color: '#166534' },
};

const SeccionHistoriaClinica: React.FC<SeccionHistoriaClinicaProps> = ({ pacienteId }) => {
  const [valoracion, setValoracion] = useState<ValoracionMedica | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchValoracion = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/admisiones/valoracion-medica/paciente/${pacienteId}`);
        setValoracion(res.data.data);
      } catch {
        console.error('Error cargando historia clínica');
      } finally {
        setIsLoading(false);
      }
    };
    fetchValoracion();
  }, [pacienteId]);

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando historia clínica...</div>;

  if (!valoracion) return (
    <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: '20px', color: '#94a3b8' }}>
      <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
      <p style={{ fontWeight: '700', margin: 0 }}>Sin Historia Clínica registrada</p>
      <p style={{ fontSize: '13px', margin: '8px 0 0' }}>La valoración médica de ingreso no ha sido completada aún.</p>
    </div>
  );

  const estado = ESTADO_CONFIG[valoracion.estado] ?? ESTADO_CONFIG.BORRADOR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>

      {/* Header con estado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f0fdfa', padding: '10px', borderRadius: '12px', color: '#0891b2' }}>
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Historia Clínica</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              Valoración médica de ingreso · {valoracion.tipoValoracion || 'N/A'} ·{' '}
              {valoracion.fechaValoracion ? new Date(valoracion.fechaValoracion).toLocaleDateString('es-MX') : '--'}{' '}
              {valoracion.horaValoracion || ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ backgroundColor: estado.bg, color: estado.color, padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
            {estado.label.toUpperCase()}
          </span>
          {valoracion.residente && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
              <User size={14} /> {valoracion.residente}
            </span>
          )}
        </div>
      </div>

      {/* Aptitud para ingreso */}
      <div style={{
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        backgroundColor: valoracion.esAptoParaIngreso ? '#dcfce7' : '#fee2e2',
        border: `1px solid ${valoracion.esAptoParaIngreso ? '#bbf7d0' : '#fecaca'}`,
        display: 'flex', alignItems: 'center', gap: '0.75rem'
      }}>
        <ShieldCheck size={20} color={valoracion.esAptoParaIngreso ? '#166534' : '#991b1b'} />
        <span style={{ fontWeight: '800', fontSize: '14px', color: valoracion.esAptoParaIngreso ? '#166534' : '#991b1b' }}>
          {valoracion.esAptoParaIngreso ? 'Paciente apto para ingreso al programa residencial' : 'Paciente NO apto para ingreso en este momento'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Motivo de Consulta y Padecimiento */}
        <Bloque icono={<Stethoscope size={18} />} titulo="Motivo de Consulta" color="#0891b2">
          <Campo label="Motivo" valor={valoracion.motivoConsulta} multilinea />
          <Campo label="Padecimiento actual" valor={valoracion.padecimientoActual} multilinea />
          <Campo label="Síntomas generales" valor={valoracion.sintomasGenerales} multilinea />
          <Campo label="Tratamientos previos" valor={valoracion.tratamientosPrevios} multilinea />
        </Bloque>

        {/* Antecedentes */}
        <Bloque icono={<ClipboardList size={18} />} titulo="Antecedentes" color="#7c3aed">
          <Campo label="Heredofamiliares" valor={valoracion.antecedentesHeredofamiliares} multilinea />
          <Campo label="Patológicos" valor={valoracion.antecedentesPatologicos} multilinea />
          <Campo label="No patológicos" valor={valoracion.antecedentesNoPatologicos} multilinea />
        </Bloque>

        {/* Historial de Consumo */}
        <Bloque icono={<FlaskConical size={18} />} titulo="Historia de Consumo" color="#d97706">
          <Campo label="Historial de consumo" valor={valoracion.historialConsumo} multilinea />
        </Bloque>

        {/* Exploración Física */}
        <Bloque icono={<Activity size={18} />} titulo="Exploración Física" color="#10b981">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
            <Campo label="Tensión Arterial" valor={valoracion.tensionArterial} />
            <Campo label="Frec. Cardiaca" valor={valoracion.frecuenciaCardiaca ? `${valoracion.frecuenciaCardiaca} lpm` : undefined} />
            <Campo label="Frec. Respiratoria" valor={valoracion.frecuenciaRespiratoria ? `${valoracion.frecuenciaRespiratoria} rpm` : undefined} />
            <Campo label="Temperatura" valor={valoracion.temperatura ? `${valoracion.temperatura} °C` : undefined} />
            <Campo label="Peso" valor={valoracion.peso ? `${valoracion.peso} kg` : undefined} />
            <Campo label="Talla" valor={valoracion.talla ? `${valoracion.talla} m` : undefined} />
          </div>
          <Campo label="Exploración física" valor={valoracion.exploracionFisicaDesc} multilinea />
        </Bloque>

        {/* Examen Mental */}
        <Bloque icono={<Brain size={18} />} titulo="Examen Mental" color="#8b5cf6">
          <Campo label="Estado mental" valor={valoracion.examenMental} multilinea />
        </Bloque>

        {/* Diagnóstico y Plan */}
        <Bloque icono={<AlertCircle size={18} />} titulo="Diagnóstico y Plan de Tratamiento" color="#ef4444">
          <Campo label="Impresión diagnóstica" valor={valoracion.impresionDiagnostica} multilinea />
          <Campo label="Pronóstico" valor={valoracion.pronostico} multilinea />
          <Campo label="Plan de tratamiento" valor={valoracion.planTratamiento} multilinea />
        </Bloque>

      </div>

      {/* Documento firmado */}
      {valoracion.documentoFirmadoUrl && (
        <div style={{ padding: '1rem 1.5rem', borderRadius: '16px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8' }}>Documento firmado disponible</span>
          <a
            href={`http://localhost:3000${valoracion.documentoFirmadoUrl}`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
          >
            Ver PDF
          </a>
        </div>
      )}
    </div>
  );
};

// ── Sub-componentes reutilizables ────────────────────────────

interface BloqueProps {
  icono: React.ReactNode;
  titulo: string;
  color: string;
  children: React.ReactNode;
}

const Bloque: React.FC<BloqueProps> = ({ icono, titulo, color, children }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ backgroundColor: `${color}18`, padding: '6px', borderRadius: '8px', color }}>{icono}</div>
      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{titulo}</h4>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{children}</div>
  </div>
);

interface CampoProps {
  label: string;
  valor?: string | null;
  multilinea?: boolean;
}

const Campo: React.FC<CampoProps> = ({ label, valor, multilinea }) => (
  <div>
    <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
    {valor ? (
      multilinea
        ? <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{valor}</p>
        : <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{valor}</p>
    ) : (
      <p style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>No registrado</p>
    )}
  </div>
);

export default SeccionHistoriaClinica;
