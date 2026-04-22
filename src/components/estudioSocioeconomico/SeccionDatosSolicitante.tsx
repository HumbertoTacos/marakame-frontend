import React from 'react';

export const SeccionDatosSolicitante = ({ datos, handleInputChange }: any) => {
    const labelStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: '700',
        color: '#334155',
        marginBottom: '0.4rem',
        display: 'block'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        fontSize: '14px'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            1. Datos del solicitante (Responsable de pago)
        </h2>

        {/* FILA 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div>
            <label style={labelStyle}>Nombre completo</label>
            <input
                name="solicitanteNombre"
                value={datos.solicitanteNombre || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Nombre"
            />
            </div>

            <div>
            <label style={labelStyle}>Fecha nac.</label>
            <input
                type="date"
                name="solicitanteFechaNacimiento"
                value={datos.solicitanteFechaNacimiento || ''}
                onChange={handleInputChange}
                style={inputStyle}
            />
            </div>

            <div>
            <label style={labelStyle}>Edad</label>
            <input
                name="solicitanteEdad"
                value={datos.solicitanteEdad || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Años"
            />
            </div>
        </div>

        {/* FILA 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
            <label style={labelStyle}>Sexo</label>
            <select
                name="solicitanteSexo"
                value={datos.solicitanteSexo || ''}
                onChange={handleInputChange}
                style={inputStyle}
            >
                <option value="">Seleccionar...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
            </select>
            </div>

            <div>
            <label style={labelStyle}>Estado civil</label>
            <select
                name="solicitanteEstadoCivil"
                value={datos.solicitanteEstadoCivil || ''}
                onChange={handleInputChange}
                style={inputStyle}
            >
                <option value="">Seleccionar...</option>
                <option value="SOLTERO">Soltero/a</option>
                <option value="CASADO">Casado/a</option>
                <option value="DIVORCIADO">Divorciado/a</option>
                <option value="VIUDO">Viudo/a</option>
            </select>
            </div>
        </div>

        {/* FILA 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
            <label style={labelStyle}>Escolaridad</label>
            <input
                name="solicitanteEscolaridad"
                value={datos.solicitanteEscolaridad || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Nivel de estudios"
            />
            </div>

            <div>
            <label style={labelStyle}>Ocupación</label>
            <input
                name="solicitanteOcupacion"
                value={datos.solicitanteOcupacion || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="A qué se dedica"
            />
            </div>
        </div>

        {/* DIRECCIÓN */}
        <div>
            <label style={labelStyle}>Dirección completa</label>
            <input
            name="solicitanteDireccion"
            value={datos.solicitanteDireccion || ''}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Calle, Número, Colonia, C.P., Ciudad"
            />
        </div>

        {/* TEL + TARJETAS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
            <label style={labelStyle}>Teléfonos</label>
            <input
                name="solicitanteTelefonos"
                value={datos.solicitanteTelefonos || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Celular / Casa"
            />
            </div>

            <div>
            <label style={labelStyle}>Tarjetas bancarias</label>
            <input
                name="solicitanteTarjetas"
                value={datos.solicitanteTarjetas || ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Crédito / Débito / Ahorro"
            />
            </div>
        </div>

        </div>
    );
};