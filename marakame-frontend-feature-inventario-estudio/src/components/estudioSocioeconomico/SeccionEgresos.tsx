import React from 'react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionEgresos({ datos, setDatos }: Props) {

    const handleChange = (name: string, value: any) => {
        setDatos((prev: any) => ({
        ...prev,
        [name]: Number(value)
        }));
    };

    // TOTAL EGRESOS
    const totalEgresos =
        Number(datos.alimentacion || 0) +
        Number(datos.vivienda || 0) +
        Number(datos.agua || 0) +
        Number(datos.luz || 0) +
        Number(datos.telefono || 0) +
        Number(datos.transporte || 0) +
        Number(datos.educacion || 0) +
        Number(datos.salud || 0) +
        Number(datos.esparcimiento || 0) +
        Number(datos.otrosEgresos || 0);

    // 🔥 TOTAL INGRESOS (lo jalamos de sección 6)
    const totalIngresos =
        Number(datos.ingresoSolicitante || 0) +
        Number(datos.ingresoConyuge || 0) +
        Number(datos.ingresosExtra || 0) +
        (datos.otrosAportantes || []).reduce(
        (acc: number, a: any) => acc + Number(a.monto || 0),
        0
        );

    const balance = totalIngresos - totalEgresos;

    const getBalanceColor = () => {
        if (balance > 0) return '#16a34a'; // verde
        if (balance < 0) return '#dc2626'; // rojo
        return '#2563eb'; // azul
    };

    const getBalanceText = () => {
        if (balance > 0) return 'Superávit';
        if (balance < 0) return 'Déficit';
        return 'Equilibrio';
    };

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

    const renderInput = (label: string, name: string) => (
        <div>
        <label style={labelStyle}>{label}</label>
        <input
            type="number"
            placeholder="$0.00"
            value={datos[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            style={inputStyle}
        />
        </div>
    );

    return (
        <div>

        {/* TÍTULO */}
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem' }}>
            7. Egresos Mensuales
        </h3>

        {/* GRID */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1.5rem'
        }}>

            {renderInput('Alimentación', 'alimentacion')}
            {renderInput('Vivienda (renta/predial)', 'vivienda')}
            {renderInput('Agua', 'agua')}

            {renderInput('Luz', 'luz')}
            {renderInput('Teléfono/Internet', 'telefono')}
            {renderInput('Transporte/Gasolina', 'transporte')}

            {renderInput('Educación', 'educacion')}
            {renderInput('Salud', 'salud')}
            {renderInput('Esparcimientos', 'esparcimiento')}

            {renderInput('Otros', 'otrosEgresos')}

        </div>

        {/* TOTALES */}
        <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '2rem'
        }}>

            {/* TOTAL EGRESOS */}
            <div style={{
            flex: 1,
            padding: '20px',
            borderRadius: '14px',
            background: '#fef2f2',
            border: '1px solid #ef4444',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 900,
            fontSize: '18px'
            }}>
            <span>Total Egresos:</span>
            <span style={{ color: '#dc2626' }}>
                ${totalEgresos.toLocaleString()}
            </span>
            </div>

            {/* BALANCE */}
            <div style={{
            flex: 1,
            padding: '20px',
            borderRadius: '14px',
            background: '#eff6ff',
            border: '1px solid #3b82f6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontWeight: 900
            }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
                Balance:
            </span>

            <span style={{
                fontSize: '22px',
                color: getBalanceColor()
            }}>
                {getBalanceText()}
            </span>

            <span style={{
                fontSize: '14px',
                color: getBalanceColor()
            }}>
                (${balance.toLocaleString()})
            </span>
            </div>

        </div>

        </div>
    );
}