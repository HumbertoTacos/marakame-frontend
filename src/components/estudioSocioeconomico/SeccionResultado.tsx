import React, { useEffect, useState } from 'react';

interface Props {
    datos: any;
    }

    export default function SeccionResultado({ datos }: Props) {
    const [score, setScore] = useState(0);
    const [nivel, setNivel] = useState<number | null>(null);

    // CALCULAR SCORE
    useEffect(() => {
        let puntos = 0;

        // Vivienda
        if (datos?.regimen === 'PROPIA') puntos += 20;
        if (datos?.regimen === 'RENTADA') puntos += 10;
        if (datos?.regimen === 'SIN_VIVIENDA') puntos -= 20;

        if (datos?.piso === 'TIERRA') puntos -= 10;
        if (datos?.techo === 'LAMINA_CARTON') puntos -= 10;

        if ((datos?.habitaciones || 0) >= 3) puntos += 10;

        // Ingresos
        if (datos?.ingresoSolicitante === 'ALTO') puntos += 20;
        if (datos?.ingresoSolicitante === 'MEDIO') puntos += 10;
        if (datos?.ingresoSolicitante === 'BAJO') puntos += 5;

        // Alimentación
        if (datos?.frutasVerduras === 'DIARIO') puntos += 10;
        if (datos?.comidaChatarra === 'DIARIO') puntos -= 10;

        // Salud
        if (datos?.tipoAtencion === 'PRIVADO') puntos += 10;
        if (datos?.tipoAtencion === 'NINGUNA') puntos -= 10;

        // Limitar score
        puntos = Math.max(0, Math.min(100, puntos));

        setScore(puntos);
    }, [datos]);

    // Cuota sugerida
    const getCuota = () => {
        if (nivel === 1) return 1500;
        if (nivel === 2) return 2500;
        if (nivel === 3) return 4000;
        return 0;
    };

    return (
        <div>
        <h3 style={{ marginBottom: '2rem' }}>
            15. Resultado del Estudio
        </h3>

        <div
            style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
            }}
        >
            {/* SCORE */}
            <div
            style={{
                padding: '2rem',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
            }}
            >
            <div style={{ fontWeight: 700, color: '#64748b' }}>
                Puntaje Total Calculado
            </div>

            <div
                style={{
                fontSize: '48px',
                fontWeight: 900,
                margin: '10px 0'
                }}
            >
                {score}
            </div>

            <div style={{ color: '#94a3b8' }}>
                Puntos sobre 100
            </div>
            </div>

            {/* NIVEL */}
            <div
            style={{
                padding: '2rem',
                borderRadius: '20px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff'
            }}
            >
            <div
                style={{
                fontWeight: 800,
                marginBottom: '1rem'
                }}
            >
                Nivel Socioeconómico Asignado
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3].map((n) => (
                <button
                    key={n}
                    onClick={() => setNivel(n)}
                    style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5f5',
                    background:
                        nivel === n ? '#3b82f6' : '#e2e8f0',
                    color:
                        nivel === n ? 'white' : '#1e293b',
                    fontWeight: 800,
                    cursor: 'pointer'
                    }}
                >
                    {n}
                </button>
                ))}
            </div>

            <div
                style={{
                marginTop: '1rem',
                fontSize: '13px',
                color: '#475569'
                }}
            >
                Seleccione un nivel para la cuota
            </div>
            </div>
        </div>

        {/* CUOTA */}
        <div style={{ marginTop: '2rem' }}>
            <label
            style={{
                fontWeight: 800,
                display: 'block',
                marginBottom: '8px'
            }}
            >
            Costo Estimado de Tratamiento (Cuota Mensual)
            </label>

            <input
            type="text"
            value={`$ ${getCuota().toLocaleString()}`}
            readOnly
            style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '16px'
            }}
            />
        </div>
        </div>
    );
}