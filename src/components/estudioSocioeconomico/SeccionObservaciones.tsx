import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionObservaciones({ datos, setDatos }: Props) {

    const handleChange = (name: string, value: string) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    const textareaStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        minHeight: '120px',
        resize: 'vertical',
        fontSize: '14px'
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: 700,
        marginBottom: '6px',
        display: 'block',
        color: '#334155'
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '1.8rem'
    };

    return (
        <div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem' }}>
            14. Observaciones
        </h3>

        {/* Observaciones Generales */}
        <div style={sectionStyle}>
            <label style={labelStyle}>Observaciones Generales</label>
            <textarea
            placeholder="Anotaciones relevantes sobre la entrevista..."
            value={datos.observacionesGenerales || ''}
            onChange={(e) => handleChange('observacionesGenerales', e.target.value)}
            style={textareaStyle}
            />
        </div>

        {/* Trabajador Social */}
        <div style={sectionStyle}>
            <label style={labelStyle}>Observaciones del Trabajador Social</label>
            <textarea
            placeholder="Valoración profesional..."
            value={datos.observacionesTS || ''}
            onChange={(e) => handleChange('observacionesTS', e.target.value)}
            style={textareaStyle}
            />
        </div>

        {/* Visita domiciliaria */}
        <div style={sectionStyle}>
            <label style={labelStyle}>Observaciones de Visita Domiciliaria (Si aplica)</label>
            <textarea
            placeholder="Condiciones reales de la vivienda..."
            value={datos.observacionesVisita || ''}
            onChange={(e) => handleChange('observacionesVisita', e.target.value)}
            style={textareaStyle}
            />
        </div>

        </div>
    );
}