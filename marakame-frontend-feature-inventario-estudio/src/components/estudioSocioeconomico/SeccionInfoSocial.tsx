import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    const FRECUENCIAS = ['Diario', 'Semanal', 'Ocasional'];

    export default function SeccionInfoSocial({ datos, setDatos }: Props) {

    const handleChange = (name: string, value: any) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: 700,
        color: '#475569'
    };

    return (
        <div>

        {/* TÍTULO */}
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem' }}>
            10. Información social
        </h3>

        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
        }}>

            {/* ALCOHOL */}
            <div>
            <label style={labelStyle}>Alcoholismo</label>

            <input
                placeholder="Cantidad"
                value={datos.alcoholCantidad || ''}
                onChange={(e) => handleChange('alcoholCantidad', e.target.value)}
                style={inputStyle}
            />

            <select
                value={datos.alcoholFrecuencia || ''}
                onChange={(e) => handleChange('alcoholFrecuencia', e.target.value)}
                style={{ ...inputStyle, marginTop: '8px' }}
            >
                <option value="">Frecuencia</option>
                {FRECUENCIAS.map(f => (
                <option key={f} value={f}>{f}</option>
                ))}
            </select>
            </div>

            {/* DROGAS */}
            <div>
            <label style={labelStyle}>Drogadicción</label>

            <input
                placeholder="Sustancia / Cantidad"
                value={datos.drogaCantidad || ''}
                onChange={(e) => handleChange('drogaCantidad', e.target.value)}
                style={inputStyle}
            />

            <select
                value={datos.drogaFrecuencia || ''}
                onChange={(e) => handleChange('drogaFrecuencia', e.target.value)}
                style={{ ...inputStyle, marginTop: '8px' }}
            >
                <option value="">Frecuencia</option>
                {FRECUENCIAS.map(f => (
                <option key={f} value={f}>{f}</option>
                ))}
            </select>
            </div>

            {/* TCA / LUDOPATÍA */}
            <div>
            <label style={labelStyle}>TCA / Ludopatía</label>

            <input
                placeholder="Describa (ej. apuestas, juego, trastornos alimenticios...)"
                value={datos.tcaLudopatia || ''}
                onChange={(e) => handleChange('tcaLudopatia', e.target.value)}
                style={inputStyle}
            />
            </div>

            {/* OTROS */}
            <div>
            <label style={labelStyle}>Otros</label>

            <input
                placeholder="Especificar"
                value={datos.otrosAdiccion || ''}
                onChange={(e) => handleChange('otrosAdiccion', e.target.value)}
                style={inputStyle}
            />

            <select
                value={datos.otrosFrecuencia || ''}
                onChange={(e) => handleChange('otrosFrecuencia', e.target.value)}
                style={{ ...inputStyle, marginTop: '8px' }}
            >
                <option value="">Frecuencia</option>
                {FRECUENCIAS.map(f => (
                <option key={f} value={f}>{f}</option>
                ))}
            </select>
            </div>

        </div>

        {/* DINÁMICA FAMILIAR */}
        <div style={{ marginTop: '2rem' }}>
            <label style={labelStyle}>Dinámica y relación familiar</label>
            <textarea
            placeholder="Describa cómo es la relación familiar y el impacto de la adicción..."
            value={datos.dinamicaFamiliar || ''}
            onChange={(e) => handleChange('dinamicaFamiliar', e.target.value)}
            style={{
                ...inputStyle,
                minHeight: '120px'
            }}
            />
        </div>

        </div>
    );
}