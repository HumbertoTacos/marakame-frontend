import React, { useEffect, useState } from 'react';
import { useEstudioSocioeconomicoStore } from '../../stores/formDraftStore';
import { 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  User, 
  Home, 
  DollarSign, 
  HeartPulse, 
  Utensils 
} from 'lucide-react';
import apiClient from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { SeccionDatosSolicitante } from '../../components/estudioSocioeconomico/SeccionDatosSolicitante';
import { SeccionFotografia } from '../../components/estudioSocioeconomico/SeccionFotografia';
import { SeccionDatosPaciente } from '../../components/estudioSocioeconomico/SeccionDatosPaciente';
import { SeccionInfoFamiliar } from '../../components/estudioSocioeconomico/SeccionInfoFamiliar';
import SeccionSituacionLaboral from '../../components/estudioSocioeconomico/SeccionSituacionLaboral';
import SeccionIngresos from '../../components/estudioSocioeconomico/SeccionIngresos';
import SeccionEgresos from '../../components/estudioSocioeconomico/SeccionEgresos';
import SeccionBienes from '../../components/estudioSocioeconomico/SeccionBienes';
import SeccionSalud from '../../components/estudioSocioeconomico/SeccionSalud';
import SeccionInfoSocial from '../../components/estudioSocioeconomico/SeccionInfoSocial';
import SeccionVivienda from '../../components/estudioSocioeconomico/SeccionVivienda';
import SeccionAlimentacion from '../../components/estudioSocioeconomico/SeccionAlimentacion';
import SeccionReferencias from '../../components/estudioSocioeconomico/SeccionReferencias';
import SeccionObservaciones from '../../components/estudioSocioeconomico/SeccionObservaciones';
import SeccionResultado from '../../components/estudioSocioeconomico/SeccionResultado';
import SeccionFirmas from '../../components/estudioSocioeconomico/SeccionFirmas';

const SECCIONES = [
  'I. Datos del solicitante',
  'II. Fotografía',
  'III. Datos del Paciente (Lectura)',
  'IV. Información Familiar',
  'V. Situación laboral',
  'VI. Ingresos Económicos Familiares',
  'VII. Egresos Mensuales',
  'VIII. Bienes',
  'IX. Área de Salud',
  'X. Información social',
  'XI. Vivienda',
  'XII. Alimentación',
  'XIII. Referencias',
  'XIV. Observaciones',
  'XV. Resultado',
  'XVI. Firmas',
];

const FRECUENCIAS = ['Diario', 'Semanal', 'Quincenal', 'Rara vez'];
const ALIMENTOS_LIST = [
  { key: 'carnes', label: 'Carnes (Res/Pollo/Pescado)' },
  { key: 'lacteos', label: 'Leche y Lácteos' },
  { key: 'huevos', label: 'Huevos' },
  { key: 'verduras', label: 'Verduras' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'cereales', label: 'Cereales y Tubérculos' },
  { key: 'leguminosas', label: 'Leguminosas (Frijoles, Lentejas)' }
];

export function EstudioSocioeconomicoForm({ pacienteId }: { pacienteId: number }) {
  const navigate = useNavigate();
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Zustand Store Persistence
  const { 
    datos, seccionActual, lastUpdated,
    setDatos, setSeccionActual, resetForm 
  } = useEstudioSocioeconomicoStore();

  // 10-Minute Expiration Logic
  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - lastUpdated > TEN_MINUTES) {
      resetForm();
    }
  }, []);

  // Auto-calcular edad
  useEffect(() => {
    if (datos.solicitanteFechaNacimiento) {
      const nacimiento = new Date(datos.solicitanteFechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();

      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }

      setDatos((prev: any) => ({
        ...prev,
        solicitanteEdad: edad.toString()
      }));
    }
  }, [datos.solicitanteFechaNacimiento]);

  // Precarga de Datos Maestros del Paciente (SST)
  useEffect(() => {
    let isMounted = true;
    const currentPacienteId = pacienteId;

    const loadData = async () => {
      resetForm();
      setSeccionActual(0);

      try {
        const pacienteRes = await apiClient.get(`/pacientes/${pacienteId}`);
        if (!isMounted || currentPacienteId !== pacienteId) return;

        const paciente = pacienteRes.data.data;

        const estudioRes = await apiClient.get(`/admisiones/estudio/paciente/${pacienteId}`);
        if (!isMounted || currentPacienteId !== pacienteId) return;

        if (estudioRes.data.success && estudioRes.data.data) {
          setDatos(estudioRes.data.data.datos);
          setSeccionActual(estudioRes.data.data.seccionActual);
        } else {
          setDatos((prev: any) => ({
            ...prev,
            pacienteNombre: `${paciente.nombre || ''} ${paciente.apellidoPaterno || ''}`,
            pacienteFechaNacimiento: paciente.fechaNacimiento?.split('T')[0] || '',
            pacienteSexo: paciente.sexo || '',
            pacienteEstadoCivil: paciente.estadoCivil || '',
            pacienteEscolaridad: paciente.escolaridad || '',
            pacienteOcupacion: paciente.ocupacion || '',
            pacienteDireccion: paciente.direccion || '',
            pacienteTelefono: paciente.telefono || '',
          }));
        }

      } catch (err) {
        if (isMounted) {
          console.error('Error al cargar datos:', err);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [pacienteId]);

  const guardarEstudio = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admisiones/estudio', {
        pacienteId,
        datos: payload,
        seccionActual,
        completado: seccionActual === SECCIONES.length - 1
      });
    },
    onSuccess: () => {
      if (seccionActual === SECCIONES.length - 1) {
        alert('Estudio Socioeconómico finalizado y guardado exitosamente.');
        resetForm();
        navigate(`/admisiones/inventario/${pacienteId}`);
      } else {
        setMensajeGuardado(true);

        setTimeout(() => {
          setMensajeGuardado(false);
        }, 2500);
      }
    }
  });

  const handleSave = () => {
    guardarEstudio.mutate(datos);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;
    setDatos((prev: any) => ({
      ...prev,
      [name]: val
    }));
  };

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', color: '#4a5568', fontWeight: 'bold', fontSize: '14px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' };
  const readonlyStyle: React.CSSProperties = { ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' };

  const validarSeccion = () => {
    switch (seccionActual) {

      case 0:
        if (!datos.solicitanteSexo || !datos.solicitanteEstadoCivil) {
          alert('Completa sexo y estado civil');
          return false;
        }
        break;

      case 4: // Situación laboral
        if (!datos.tieneEmpleo) {
          alert('Selecciona si tiene empleo');
          return false;
        }

        if (datos.tieneEmpleo === 'SI') {
          if (!datos.lugarTrabajo || !datos.puesto) {
            alert('Completa los datos laborales');
            return false;
          }
        }
        break;

      case 5: // Ingresos
        if (!datos.ingresoSolicitante) {
          alert('Selecciona ingreso del solicitante');
          return false;
        }
        break;

      case 6: // Egresos
        const totalEgresos =
          (Number(datos.alimentacion) || 0) +
          (Number(datos.vivienda) || 0) +
          (Number(datos.luz) || 0);

        if (totalEgresos === 0) {
          alert('Captura al menos un egreso');
          return false;
        }
        break;

      case 15: // Firmas
        if (!datos.firmaSolicitante || !datos.firmaTrabajador) {
          alert('Se requieren ambas firmas');
          return false;
        }
        break;

      default:
        break;
    }

    return true;
  };

  const progreso = ((seccionActual + 1) / SECCIONES.length) * 100;

  return (
    <div style={{ display: 'flex', gap: '2.5rem', height: '100%', alignItems: 'flex-start', padding: '1rem' }}>
      {mensajeGuardado && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '12px 18px',
          borderRadius: '12px',
          fontWeight: '700',
          boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
          zIndex: 9999
        }}>
          ✅ Progreso guardado correctamente
        </div>
      )}
      {/* Sidebar de Navegación */}
      <div style={{ 
        width: '340px', 
        background: 'white', 
        borderRadius: '20px', 
        padding: '1.5rem', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: '1rem',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', color: '#1e293b' }}>
          <FileText size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
          Secciones
        </h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {SECCIONES.map((seccion, idx) => (
            <li 
              key={idx}
              onClick={() => setSeccionActual(idx)}
              style={{
                padding: '0.85rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: seccionActual === idx ? '#3b82f6' : 'transparent',
                color: seccionActual === idx ? 'white' : '#64748b',
                fontWeight: seccionActual === idx ? '700' : '500',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seccion}</span>
              {seccionActual === idx && <ChevronRight size={14} />}
            </li>
          ))}
        </ul>
      </div>

      {/* Área del Formulario */}
      <div style={{ flex: 1, background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <span style={{ color: '#3b82f6', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>Estudio Socioeconómico / {SECCIONES[seccionActual]}</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0.5rem 0' }}>Captura de Información</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  height: '10px',
                  background: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${progreso}%`,
                    background: '#3b82f6',
                    height: '100%',
                    transition: '0.3s'
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', marginTop: '6px', color: '#64748b' }}>
                {Math.round(progreso)}% completado
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setSeccionActual(prev => Math.max(0, prev - 1))}
              disabled={seccionActual === 0}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}
            >
              Anterior
            </button>
            <button 
              onClick={handleSave}
              disabled={guardarEstudio.isPending}
              style={{ padding: '0.75rem 2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              {guardarEstudio.isPending ? 'Guardando...' : 'Guardar Progreso'}
            </button>
          </div>
        </div>

        {/* CONTENIDO DINÁMICO POR SECCIÓN */}
        
        {/* SECCIÓN 1: IDENTIFICACIÓN */}
        {seccionActual === 0 && (
          <SeccionDatosSolicitante 
            datos={datos} 
            handleInputChange={handleInputChange} 
          />
        )}

        {seccionActual === 1 && (
          <SeccionFotografia 
            datos={datos}
            setDatos={setDatos}
          />
        )}

        {seccionActual === 2 && (
          <SeccionDatosPaciente 
            datos={datos}
            setDatos={setDatos}
            handleInputChange={handleInputChange}
          />
        )}

        {seccionActual === 3 && (
          <SeccionInfoFamiliar
            datos={datos}
            setDatos={setDatos}
          />
        )}

        {seccionActual === 4 && (
          <SeccionSituacionLaboral
            datos={datos}
            setDatos={setDatos}
          />
        )}

        {seccionActual === 5 && (
          <SeccionIngresos 
            datos={datos} 
            setDatos={setDatos} />
        )}

        {seccionActual === 6 && (
          <SeccionEgresos 
            datos={datos} 
            setDatos={setDatos} />
        )}

        {seccionActual === 7 && (
          <SeccionBienes 
            datos={datos} 
            setDatos={setDatos} />
        )}

        {seccionActual === 8 && (
          <SeccionSalud 
            datos={datos} 
            setDatos={setDatos} />
        )}

        {seccionActual === 9 && (
          <SeccionInfoSocial 
            datos={datos} 
            setDatos={setDatos} />
        )}

        {seccionActual === 10 && (
          <SeccionVivienda 
            datos={datos} 
            setDatos={setDatos} />
        )}

        {seccionActual === 11 && (
          <SeccionAlimentacion
            datos={datos}
            setDatos={setDatos}
          />
        )}

        {seccionActual === 12 && (
          <SeccionReferencias
            datos={datos}
            setDatos={setDatos}
          />
        )}

        {seccionActual === 13 && (
          <SeccionObservaciones
            datos={datos}
            setDatos={setDatos}
          />
        )}

        {seccionActual === 14 && (
          <SeccionResultado
            datos={datos}
          />
        )}

        {seccionActual === 15 && (
          <SeccionFirmas
            datos={datos}
            setDatos={setDatos}
          />
        )}

        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          {seccionActual === SECCIONES.length - 1 ? (
            <button
              onClick={() => {
                if (!validarSeccion()) return;

                handleSave();
                alert('Estudio finalizado correctamente');
              }}
              style={{
                padding: '14px 22px',
                borderRadius: '14px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Terminar Estudio
            </button>
          ) : (
            <button
              onClick={() => {
                if (!validarSeccion()) return;

                setSeccionActual(prev =>
                  Math.min(SECCIONES.length - 1, prev + 1)
                );
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#3b82f6',
                fontWeight: '700',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              Ir a la Siguiente Sección
            </button>
          )}
                  </div>
      </div>
    </div>
  );
}
