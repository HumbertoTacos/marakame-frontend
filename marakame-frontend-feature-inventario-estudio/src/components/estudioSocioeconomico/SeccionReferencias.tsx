import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionReferencias({ datos, setDatos }: Props) {

    const referencias = datos.referencias || [
        { nombre: '', telefono: '', relacion: '', tiempo: '' },
        { nombre: '', telefono: '', relacion: '', tiempo: '' }
    ];

    const handleChange = (index: number, field: string, value: string) => {
        const nuevas = [...referencias];
        nuevas[index][field] = value;

        setDatos((prev: any) => ({
        ...prev,
        referencias: nuevas
        }));
    };

    const agregarReferencia = () => {
        setDatos((prev: any) => ({
        ...prev,
        referencias: [
            ...referencias,
            { nombre: '', telefono: '', relacion: '', tiempo: '' }
        ]
        }));
    };

    const eliminarReferencia = (index: number) => {
        const nuevas = referencias.filter((_: any, i: number) => i !== index);

        setDatos((prev: any) => ({
        ...prev,
        referencias: nuevas
        }));
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
    };

    return (
        <div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '0.5rem' }}>
            13. Referencias personales
        </h3>

        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Proporcione datos de personas que no vivan con usted.
        </p>

        {/* TABLA */}
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1rem'
        }}>

            {/* HEADERS */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
            gap: '1rem',
            fontWeight: 800,
            marginBottom: '1rem'
            }}>
            <span>Nombre completo</span>
            <span>Teléfono</span>
            <span>Relación</span>
            <span>Tiempo de conocerlo</span>
            <span></span>
            </div>

            {/* FILAS */}
            {referencias.map((ref: any, index: number) => (
            <div
                key={index}
                style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                gap: '1rem',
                marginBottom: '0.75rem'
                }}
            >
                <input
                placeholder="Nombre"
                value={ref.nombre}
                onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                style={inputStyle}
                />

                <input
                placeholder="Teléfono"
                value={ref.telefono}
                onChange={(e) => handleChange(index, 'telefono', e.target.value)}
                style={inputStyle}
                />

                <input
                placeholder="Amigo, vecino..."
                value={ref.relacion}
                onChange={(e) => handleChange(index, 'relacion', e.target.value)}
                style={inputStyle}
                />

                <input
                placeholder="Ej. 5 años"
                value={ref.tiempo}
                onChange={(e) => handleChange(index, 'tiempo', e.target.value)}
                style={inputStyle}
                />

                {/* BOTÓN ELIMINAR */}
                <button
                onClick={() => eliminarReferencia(index)}
                style={{
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    padding: '0 10px',
                    fontWeight: 700
                }}
                >
                ✕
                </button>
            </div>
            ))}

            {/* BOTÓN AGREGAR */}
            <button
            onClick={agregarReferencia}
            style={{
                marginTop: '1rem',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #3b82f6',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                cursor: 'pointer'
            }}
            >
            + Agregar referencia
            </button>

        </div>
        </div>
    );
}