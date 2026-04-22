import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionSalud({ datos, setDatos }: Props) {

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
        color: '#475569',
        marginBottom: '6px'
    };

    return (
        <div>

        {/* TÍTULO */}
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem' }}>
            9. Salud
        </h3>

        {/* GRID */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
        }}>

            {/* TIPO DE ATENCIÓN */}
            <div>
            <label style={labelStyle}>Tipo de atención médica</label>
            <select
                value={datos.tipoAtencion || ''}
                onChange={(e) => handleChange('tipoAtencion', e.target.value)}
                style={inputStyle}
            >
                <option value="">Seleccionar...</option>
                <option value="NINGUNA">Ninguna</option>
                <option value="IMSS">IMSS</option>
                <option value="ISSSTE">ISSSTE</option>
                <option value="SEGURO_POPULAR">Seguro Popular</option>
                <option value="PRIVADO">Privado</option>
                <option value="OTRO">Otro</option>
            </select>
            </div>

            {/* INTEGRANTES */}
            <div>
            <label style={labelStyle}>N° de integrantes con atención</label>
            <input
                type="number"
                min={0}
                value={datos.integrantesSalud || ''}
                onChange={(e) => handleChange('integrantesSalud', e.target.value)}
                style={inputStyle}
            />
            </div>

            {/* GASTO */}
            <div>
            <label style={labelStyle}>
                Gasto aprox. en consultas/medicamentos (mensual)
            </label>
            <input
                type="number"
                min={0}
                value={datos.gastoSalud || ''}
                onChange={(e) => handleChange('gastoSalud', e.target.value)}
                style={inputStyle}
            />
            </div>

            {/* OTROS */}
            <div>
            <label style={labelStyle}>Otros</label>
            <input
                type="text"
                placeholder="Especifique"
                value={datos.saludOtros || ''}
                onChange={(e) => handleChange('saludOtros', e.target.value)}
                style={inputStyle}
            />
            </div>

        </div>

        {/* MENSAJE INTELIGENTE (PRO UX) */}
        {datos.tipoAtencion === 'NINGUNA' && (
            <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '12px',
            background: '#fef2f2',
            color: '#991b1b',
            fontWeight: 600,
            fontSize: '14px'
            }}>
            ⚠️ El solicitante no cuenta con acceso a servicios médicos.
            </div>
        )}

        {datos.tipoAtencion === 'PRIVADO' && (
            <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#065f46',
            fontWeight: 600,
            fontSize: '14px'
            }}>
            ✔️ Cuenta con atención médica privada.
            </div>
        )}

        </div>
    );
}