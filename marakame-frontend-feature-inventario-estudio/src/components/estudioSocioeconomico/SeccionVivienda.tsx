import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionVivienda({ datos, setDatos }: Props) {

    const handleChange = (name: string, value: any) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    const toggleCheckbox = (name: string) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: !prev[name]
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

        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem' }}>
            11. Vivienda
        </h3>

        {/* FILA PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>

            <div>
            <label style={labelStyle}>Régimen</label>
            <select
                value={datos.regimen || ''}
                onChange={(e) => handleChange('regimen', e.target.value)}
                style={inputStyle}
            >
                <option value="">Seleccionar</option>
                <option value="PROPIA">Propia</option>
                <option value="RENTADA">Rentada</option>
                <option value="PRESTADA">Prestada</option>
                <option value="SIN_VIVIENDA">Sin vivienda</option>
            </select>
            </div>

            <div>
            <label style={labelStyle}>Tipo</label>
            <select
                value={datos.tipoVivienda || ''}
                onChange={(e) => handleChange('tipoVivienda', e.target.value)}
                style={inputStyle}
                disabled={datos.regimen === 'SIN_VIVIENDA'}
            >
                <option value="">Seleccionar</option>
                <option value="CASA">Casa</option>
                <option value="DEPARTAMENTO">Departamento</option>
                <option value="VECINDAD">Vecindad</option>
                <option value="CUARTO">Cuarto</option>
            </select>
            </div>

            <div>
            <label style={labelStyle}>N° de habitaciones</label>
            <select
                value={datos.habitaciones || ''}
                onChange={(e) => handleChange('habitaciones', e.target.value)}
                style={inputStyle}
                disabled={datos.regimen === 'SIN_VIVIENDA'}
            >
                <option value="">Seleccionar</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4+">4 o más</option>
            </select>
            </div>

        </div>

        {/* OCULTAR TODO SI NO TIENE VIVIENDA */}
        {datos.regimen === 'SIN_VIVIENDA' ? (
            <div style={{ marginTop: '2rem', color: '#ef4444', fontWeight: 700 }}>
            El solicitante no cuenta con vivienda.
            </div>
        ) : (
            <>
            {/* CARACTERÍSTICAS */}
            <div style={{ marginTop: '2rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '1rem' }}>
                ¿Cómo está conformada su vivienda?
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'sala', label: 'Sala' },
                    { key: 'comedor', label: 'Comedor' },
                    { key: 'cocina', label: 'Cocina' },
                    { key: 'jardin', label: 'Jardín' }
                ].map(item => (
                    <label key={item.key} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={datos[item.key] || false}
                        onChange={() => toggleCheckbox(item.key)}
                    />
                    {item.label}
                    </label>
                ))}
                </div>
            </div>

            <div style={{
                marginTop: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '1.5rem'
            }}>

                <div>
                <label style={labelStyle}>N° de baños</label>
                <select
                    value={datos.banos || ''}
                    onChange={(e) => handleChange('banos', e.target.value)}
                    style={inputStyle}
                >
                    <option value="">Seleccionar</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4+">4 o más</option>
                </select>
                </div>

                <div>
                <label style={labelStyle}>Otros (especifique)</label>
                <input
                    value={datos.otrosVivienda || ''}
                    onChange={(e) => handleChange('otrosVivienda', e.target.value)}
                    style={inputStyle}
                />
                </div>

            </div>

            {/* MATERIALES */}
            <div style={{
                marginTop: '2rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1.5rem'
            }}>

                <div>
                <label style={labelStyle}>Material de piso</label>
                <select
                    value={datos.piso || ''}
                    onChange={(e) => handleChange('piso', e.target.value)}
                    style={inputStyle}
                >
                    <option value="">Seleccionar</option>
                    <option value="TIERRA">Tierra</option>
                    <option value="CONCRETO">Concreto</option>
                    <option value="MOSAICO">Mosaico</option>
                    <option value="VITROPISO">Vitropiso</option>
                    <option value="OTROS">Otros</option>
                </select>
                </div>

                <div>
                <label style={labelStyle}>Material de muros</label>
                <select
                    value={datos.muros || ''}
                    onChange={(e) => handleChange('muros', e.target.value)}
                    style={inputStyle}
                >
                    <option value="">Seleccionar</option>
                    <option value="ADOBE">Adobe</option>
                    <option value="TAPIQUE">Tabique</option>
                    <option value="CONCRETO">Concreto</option>
                    <option value="OTROS">Otros</option>
                </select>
                </div>

                <div>
                <label style={labelStyle}>Material de techo</label>
                <select
                    value={datos.techo || ''}
                    onChange={(e) => handleChange('techo', e.target.value)}
                    style={inputStyle}
                >
                    <option value="">Seleccionar</option>
                    <option value="LAMINA_CARTON">Lámina cartón</option>
                    <option value="LAMINA_ASBESTO">Lámina asbesto</option>
                    <option value="CONCRETO">Concreto</option>
                    <option value="OTROS">Otros</option>
                </select>
                </div>

            </div>
            </>
        )}

        </div>
    );
}