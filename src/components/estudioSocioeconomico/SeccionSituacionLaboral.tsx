import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionSituacionLaboral({ datos, setDatos }: Props) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // 🔥 Si cambia a NO, limpiar campos
        if (name === 'tieneEmpleo' && value === 'NO') {
        setDatos((prev: any) => ({
            ...prev,
            tieneEmpleo: value,
            lugarTrabajo: '',
            puesto: '',
            antiguedad: '',
            horario: ''
        }));
        return;
        }

        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        outline: 'none'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: 700,
        color: '#475569',
        marginBottom: '6px',
        display: 'block'
    };

    return (
        <div>

        {/* TÍTULO */}
        <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 800, 
            marginBottom: '1.5rem',
            color: '#0f172a'
        }}>
            5. Situación laboral (del solicitante)
        </h3>

        {/* GRID */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
        }}>

            {/* ¿Cuenta con empleo? */}
            <div>
            <label style={labelStyle}>¿Cuenta con empleo?</label>
            <select
                name="tieneEmpleo"
                value={datos.tieneEmpleo || ''}
                onChange={handleChange}
                style={inputStyle}
            >
                <option value="">Seleccionar</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
            </select>
            </div>

            {/* Dependientes (siempre visible) */}
            <div>
            <label style={labelStyle}>Dependientes económicos</label>
            <input
                name="dependientes"
                type="number"
                value={datos.dependientes || ''}
                onChange={handleChange}
                placeholder="Cantidad de personas"
                style={inputStyle}
            />
            </div>

            {/* 👇 SOLO SI TIENE EMPLEO */}
            {datos.tieneEmpleo === 'SI' && (
            <>
                {/* Lugar de trabajo */}
                <div>
                <label style={labelStyle}>Lugar de trabajo</label>
                <input
                    name="lugarTrabajo"
                    value={datos.lugarTrabajo || ''}
                    onChange={handleChange}
                    placeholder="Empresa o negocio"
                    style={inputStyle}
                />
                </div>

                {/* Puesto */}
                <div>
                <label style={labelStyle}>Puesto</label>
                <input
                    name="puesto"
                    value={datos.puesto || ''}
                    onChange={handleChange}
                    placeholder="Puesto que desempeña"
                    style={inputStyle}
                />
                </div>

                {/* Antigüedad */}
                <div>
                <label style={labelStyle}>Antigüedad</label>
                <input
                    name="antiguedad"
                    value={datos.antiguedad || ''}
                    onChange={handleChange}
                    placeholder="Tiempo en el empleo"
                    style={inputStyle}
                />
                </div>

                {/* Horario */}
                <div>
                <label style={labelStyle}>Horario</label>
                <input
                    name="horario"
                    value={datos.horario || ''}
                    onChange={handleChange}
                    placeholder="Horario laboral"
                    style={inputStyle}
                />
                </div>
            </>
            )}

        </div>
        </div>
    );
}