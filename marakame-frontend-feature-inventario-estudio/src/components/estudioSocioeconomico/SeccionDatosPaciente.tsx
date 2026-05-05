import React, { useEffect } from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }

    export const SeccionDatosPaciente: React.FC<Props> = ({
    datos,
    setDatos,
    handleInputChange
    }) => {

    // Calcular edad automáticamente
    useEffect(() => {
        if (datos.pacienteFechaNacimiento) {
        const nacimiento = new Date(datos.pacienteFechaNacimiento);
        const hoy = new Date();

        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();

        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        setDatos({ pacienteEdad: edad.toString() });
        }
    }, [datos.pacienteFechaNacimiento]);

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '600',
        color: '#334155',
        fontSize: '14px'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '14px',
        backgroundColor: '#f8fafc'
    };

    const readonlyStyle: React.CSSProperties = {
        ...inputStyle,
        backgroundColor: '#e2e8f0',
        cursor: 'not-allowed'
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Nombre */}
        <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Nombre completo</label>
            <input
            name="pacienteNombre"
            value={datos.pacienteNombre || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Nombre del paciente"
            />
        </div>

        {/* Fecha nacimiento */}
        <div>
            <label style={labelStyle}>Fecha nac.</label>
            <input
            type="date"
            name="pacienteFechaNacimiento"
            value={datos.pacienteFechaNacimiento || ''}
            onChange={handleInputChange}
            style={inputStyle}
            />
        </div>

        {/* Edad */}
        <div>
            <label style={labelStyle}>Edad</label>
            <input
            name="pacienteEdad"
            value={datos.pacienteEdad || ''}
            readOnly
            style={readonlyStyle}
            placeholder="Edad"
            />
        </div>

        {/* Sexo */}
        <div>
            <label style={labelStyle}>Sexo</label>
            <input
            name="pacienteSexo"
            value={datos.pacienteSexo || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Masculino / Femenino"
            />
        </div>

        {/* Estado civil */}
        <div>
            <label style={labelStyle}>Estado civil</label>
            <input
            name="pacienteEstadoCivil"
            value={datos.pacienteEstadoCivil || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Estado civil"
            />
        </div>

        {/* Escolaridad */}
        <div>
            <label style={labelStyle}>Escolaridad</label>
            <input
            name="pacienteEscolaridad"
            value={datos.pacienteEscolaridad || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Nivel de estudios"
            />
        </div>

        {/* Ocupación */}
        <div>
            <label style={labelStyle}>Ocupación</label>
            <input
            name="pacienteOcupacion"
            value={datos.pacienteOcupacion || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="A qué se dedica"
            />
        </div>

        {/* Dirección */}
        <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Dirección</label>
            <input
            name="pacienteDireccion"
            value={datos.pacienteDireccion || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Dirección del paciente"
            />
        </div>

        {/* Teléfono */}
        <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Teléfono</label>
            <input
            name="pacienteTelefono"
            value={datos.pacienteTelefono || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Teléfono"
            />
        </div>

        </div>
    );
};