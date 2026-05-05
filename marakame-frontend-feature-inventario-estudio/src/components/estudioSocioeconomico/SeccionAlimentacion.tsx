import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    const FRECUENCIAS = [
    { label: 'Seleccionar...', value: '' },
    { label: 'Diario', value: 'DIARIO' },
    { label: 'C/ Tercer día', value: 'TERCER_DIA' },
    { label: '1 vez a la semana', value: 'SEMANA' },
    { label: '1 vez al mes', value: 'MES' },
    { label: 'Ocasionalmente', value: 'OCASIONAL' }
    ];

    export default function SeccionAlimentacion({ datos, setDatos }: Props) {

    const handleChange = (name: string, value: string) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    const inputStyle: React.CSSProperties = {
        width: '200px',
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        fontWeight: 600
    };

    const cardStyle: React.CSSProperties = {
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: 700,
        color: '#334155'
    };

    const renderSelect = (name: string) => (
        <select
        value={datos[name] || ''}
        onChange={(e) => handleChange(name, e.target.value)}
        style={inputStyle}
        >
        {FRECUENCIAS.map((f, i) => (
            <option key={i} value={f.value}>
            {f.label}
            </option>
        ))}
        </select>
    );

    return (
        <div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '0.5rem' }}>
            12. Alimentación
        </h3>

        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Indique la frecuencia semanal de consumo de los siguientes grupos de alimentos en el hogar.
        </p>

        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
        }}>

            <div style={cardStyle}>
            <span style={labelStyle}>Carnes rojas</span>
            {renderSelect('carnesRojas')}
            </div>

            <div style={cardStyle}>
            <span style={labelStyle}>Frutas y verduras</span>
            {renderSelect('frutasVerduras')}
            </div>

            <div style={cardStyle}>
            <span style={labelStyle}>Lácteos y huevos</span>
            {renderSelect('lacteosHuevos')}
            </div>

            <div style={cardStyle}>
            <span style={labelStyle}>Pollo / Pescado</span>
            {renderSelect('polloPescado')}
            </div>

            <div style={cardStyle}>
            <span style={labelStyle}>Cereales y leguminosas</span>
            {renderSelect('cereales')}
            </div>

            <div style={cardStyle}>
            <span style={labelStyle}>Comida chatarra / refrescos</span>
            {renderSelect('chatarra')}
            </div>

        </div>

        </div>
    );
}