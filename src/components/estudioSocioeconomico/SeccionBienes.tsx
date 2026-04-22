import React from 'react';

interface Vehiculo {
    marca: string;
    modelo: string;
    propietario: string;
    }

    interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionBienes({ datos, setDatos }: Props) {

    const tieneAuto = datos.tieneAuto === 'SI';
    const cantidad = Number(datos.cantidadAutos || 0);

    // Manejar cambio simple
    const handleChange = (name: string, value: any) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: value
        }));
    };

    // Manejar lista de vehículos
    const handleVehiculoChange = (index: number, field: string, value: string) => {
        const nuevos = [...(datos.vehiculos || [])];
        nuevos[index] = {
        ...nuevos[index],
        [field]: value
        };

        setDatos((prev: any) => ({
        ...prev,
        vehiculos: nuevos
        }));
    };

    // Ajustar cantidad dinámicamente
    const actualizarCantidad = (value: number) => {
        let nuevaLista = [...(datos.vehiculos || [])];

        if (value > nuevaLista.length) {
        for (let i = nuevaLista.length; i < value; i++) {
            nuevaLista.push({
            marca: '',
            modelo: '',
            propietario: ''
            });
        }
        } else {
        nuevaLista = nuevaLista.slice(0, value);
        }

        setDatos((prev: any) => ({
        ...prev,
        cantidadAutos: value,
        vehiculos: nuevaLista
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
            8. Bienes
        </h3>

        {/* TIENE AUTO */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            
            <div>
            <label style={labelStyle}>¿Cuenta con automóvil?</label>
            <select
                value={datos.tieneAuto || 'NO'}
                onChange={(e) => handleChange('tieneAuto', e.target.value)}
                style={inputStyle}
            >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
            </select>
            </div>

            {/* CANTIDAD */}
            {tieneAuto && (
            <div>
                <label style={labelStyle}>Cantidad</label>
                <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => actualizarCantidad(Number(e.target.value))}
                style={{ ...inputStyle, width: '100px' }}
                />
            </div>
            )}
        </div>

        {/* TABLA VEHÍCULOS */}
        {tieneAuto && cantidad > 0 && (
            <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            overflow: 'hidden'
            }}>

            {/* HEADER */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                background: '#f8fafc',
                padding: '12px',
                fontWeight: 700
            }}>
                <span>Marca</span>
                <span>Modelo/Año</span>
                <span>Propietario</span>
            </div>

            {/* FILAS */}
            {datos.vehiculos?.map((vehiculo: Vehiculo, index: number) => (
                <div
                key={index}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '10px',
                    padding: '12px'
                }}
                >
                <input
                    placeholder="Ej. Nissan"
                    value={vehiculo.marca}
                    onChange={(e) =>
                    handleVehiculoChange(index, 'marca', e.target.value)
                    }
                    style={inputStyle}
                />

                <input
                    placeholder="Ej. Versa 2018"
                    value={vehiculo.modelo}
                    onChange={(e) =>
                    handleVehiculoChange(index, 'modelo', e.target.value)
                    }
                    style={inputStyle}
                />

                <input
                    placeholder="Nombre"
                    value={vehiculo.propietario}
                    onChange={(e) =>
                    handleVehiculoChange(index, 'propietario', e.target.value)
                    }
                    style={inputStyle}
                />
                </div>
            ))}

            </div>
        )}

        </div>
    );
}