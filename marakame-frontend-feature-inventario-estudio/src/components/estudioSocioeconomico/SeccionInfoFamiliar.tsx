import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export const SeccionInfoFamiliar: React.FC<Props> = ({ datos, setDatos }) => {

    const familia = datos.familia || [];

    const handleChange = (index: number, field: string, value: string) => {
        const nuevaFamilia = [...familia];
        nuevaFamilia[index][field] = value;
        setDatos({ familia: nuevaFamilia });
    };

    const agregarIntegrante = () => {
        setDatos({
        familia: [
            ...familia,
            { nombre: '', parentesco: '', edad: '', ocupacion: '' }
        ]
        });
    };

    const eliminarIntegrante = (index: number) => {
        const nuevaFamilia = familia.filter((_: any, i: number) => i !== index);
        setDatos({ familia: nuevaFamilia });
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: '700',
        color: '#334155',
        fontSize: '14px'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.6rem',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        fontSize: '14px'
    };

    return (
        <div>

        {/* TABLA */}
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            overflow: 'hidden'
        }}>

            {/* HEADER */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 2fr 50px',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            fontWeight: '700',
            fontSize: '14px',
            color: '#334155'
            }}>
            <div>Nombre</div>
            <div>Parentesco</div>
            <div>Edad</div>
            <div>Ocupación</div>
            <div></div>
            </div>

            {/* FILAS */}
            {familia.length === 0 && (
            <div style={{ padding: '1rem', color: '#94a3b8' }}>
                No hay integrantes aún
            </div>
            )}

            {familia.map((persona: any, index: number) => (
            <div
                key={index}
                style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 2fr 50px',
                padding: '1rem',
                gap: '0.5rem',
                borderTop: '1px solid #f1f5f9'
                }}
            >
                <input
                placeholder="Nombre"
                value={persona.nombre}
                onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                style={inputStyle}
                />

                <input
                placeholder="Parentesco"
                value={persona.parentesco}
                onChange={(e) => handleChange(index, 'parentesco', e.target.value)}
                style={inputStyle}
                />

                <input
                placeholder="Edad"
                value={persona.edad}
                onChange={(e) => handleChange(index, 'edad', e.target.value)}
                style={inputStyle}
                />

                <input
                placeholder="Ocupación"
                value={persona.ocupacion}
                onChange={(e) => handleChange(index, 'ocupacion', e.target.value)}
                style={inputStyle}
                />

                <button
                onClick={() => eliminarIntegrante(index)}
                style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#ef4444'
                }}
                >
                <Trash2 size={18} />
                </button>
            </div>
            ))}

        </div>

        {/* BOTÓN AGREGAR */}
        <button
            onClick={agregarIntegrante}
            style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.2rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: 'white',
            cursor: 'pointer',
            fontWeight: '600'
            }}
        >
            <Plus size={16} />
            Agregar integrante
        </button>

        </div>
    );
};