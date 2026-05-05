import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    const RANGOS_INGRESO = [
    { label: 'Sin ingresos', value: 0 },
    { label: '$1 - $3,000', value: 1500 },
    { label: '$3,001 - $6,000', value: 4500 },
    { label: '$6,001 - $10,000', value: 8000 },
    { label: '$10,001 - $15,000', value: 12500 },
    { label: '$15,000+', value: 18000 }
    ];

    export default function SeccionIngresos({ datos, setDatos }: Props) {

    const handleChange = (name: string, value: any) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    // 🔥 Agregar aportante
    const agregarAportante = () => {
        setDatos((prev: any) => ({
        ...prev,
        otrosAportantes: [
            ...(prev.otrosAportantes || []),
            { nombre: '', monto: 0 }
        ]
        }));
    };

    // 🔥 Eliminar aportante
    const eliminarAportante = (index: number) => {
        const nuevos = [...(datos.otrosAportantes || [])];
        nuevos.splice(index, 1);
        setDatos((prev: any) => ({
        ...prev,
        otrosAportantes: nuevos
        }));
    };

    // 🔥 Total automático
    const totalIngresos =
        Number(datos.ingresoSolicitante || 0) +
        Number(datos.ingresoConyuge || 0) +
        Number(datos.ingresosExtra || 0) +
        (datos.otrosAportantes || []).reduce(
        (acc: number, a: any) => acc + Number(a.monto || 0),
        0
        );

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '14px'
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
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem' }}>
            6. Ingresos Mensuales
        </h3>

        {/* GRID */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
        }}>

            {/* Ingreso solicitante */}
            <div>
            <label style={labelStyle}>Ingreso del solicitante ($)</label>
            <select
                value={datos.ingresoSolicitante || ''}
                onChange={(e) => handleChange('ingresoSolicitante', Number(e.target.value))}
                style={inputStyle}
            >
                <option value="">Seleccionar rango...</option>
                {RANGOS_INGRESO.map((r, i) => (
                <option key={i} value={r.value}>{r.label}</option>
                ))}
            </select>
            </div>

            {/* Ingreso conyuge */}
            <div>
            <label style={labelStyle}>Ingreso del cónyuge ($)</label>
            <select
                value={datos.ingresoConyuge || ''}
                onChange={(e) => handleChange('ingresoConyuge', Number(e.target.value))}
                style={inputStyle}
            >
                <option value="">Seleccionar rango...</option>
                {RANGOS_INGRESO.map((r, i) => (
                <option key={i} value={r.value}>{r.label}</option>
                ))}
            </select>
            </div>

            {/* Ingresos extra */}
            <div>
            <label style={labelStyle}>Ingresos extra ($)</label>
            <select
                value={datos.ingresosExtra || ''}
                onChange={(e) => handleChange('ingresosExtra', Number(e.target.value))}
                style={inputStyle}
            >
                <option value="">Seleccionar rango...</option>
                {RANGOS_INGRESO.map((r, i) => (
                <option key={i} value={r.value}>{r.label}</option>
                ))}
            </select>
            </div>

        </div>

        {/* OTROS APORTANTES */}
        <div style={{ marginTop: '2rem' }}>
            <label style={labelStyle}>Otros aportantes</label>

            {(datos.otrosAportantes || []).map((a: any, index: number) => (
            <div key={index} style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '10px'
            }}>

                <input
                placeholder="Nombre/Parentesco"
                value={a.nombre}
                onChange={(e) => {
                    const nuevos = [...datos.otrosAportantes];
                    nuevos[index].nombre = e.target.value;
                    handleChange('otrosAportantes', nuevos);
                }}
                style={{ ...inputStyle, flex: 2 }}
                />

                <select
                value={a.monto}
                onChange={(e) => {
                    const nuevos = [...datos.otrosAportantes];
                    nuevos[index].monto = Number(e.target.value);
                    handleChange('otrosAportantes', nuevos);
                }}
                style={{ ...inputStyle, flex: 1 }}
                >
                <option value="">Monto...</option>
                {RANGOS_INGRESO.map((r, i) => (
                    <option key={i} value={r.value}>{r.label}</option>
                ))}
                </select>

                <button
                onClick={() => eliminarAportante(index)}
                style={{
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid #ef4444',
                    background: '#fee2e2',
                    cursor: 'pointer'
                }}
                >
                ✕
                </button>

            </div>
            ))}

            <button
            onClick={agregarAportante}
            style={{
                marginTop: '10px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #3b82f6',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                cursor: 'pointer'
            }}
            >
            + Agregar aportante
            </button>
        </div>

        {/* TOTAL */}
        <div style={{
            marginTop: '2rem',
            padding: '20px',
            borderRadius: '14px',
            background: '#ecfdf5',
            border: '1px solid #10b981',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 900,
            fontSize: '18px'
        }}>
            <span>Total Ingresos:</span>
            <span style={{ color: '#059669' }}>
            ${totalIngresos.toLocaleString()}
            </span>
        </div>

        </div>
    );
}