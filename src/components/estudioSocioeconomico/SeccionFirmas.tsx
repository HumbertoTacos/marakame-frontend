import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Save, Trash2 } from 'lucide-react';

interface Props {
    datos: any;
    setDatos: (data: any) => void;
    }

    export default function SeccionFirmas({ datos, setDatos }: Props) {
    const sigSolicitante = useRef<SignatureCanvas>(null);
    const sigTrabajador = useRef<SignatureCanvas>(null);

    const guardarFirma = (tipo: 'solicitante' | 'trabajador') => {
        if (tipo === 'solicitante' && sigSolicitante.current) {
        if (sigSolicitante.current.isEmpty()) {
            alert('Debe firmar antes de guardar');
            return;
        }

        const firma = sigSolicitante.current.toDataURL();

        setDatos((prev: any) => ({
            ...prev,
            firmaSolicitante: firma
        }));
        }

        if (tipo === 'trabajador' && sigTrabajador.current) {
        if (sigTrabajador.current.isEmpty()) {
            alert('Debe firmar antes de guardar');
            return;
        }

        const firma = sigTrabajador.current.toDataURL();

        setDatos((prev: any) => ({
            ...prev,
            firmaTrabajador: firma
        }));
        }
    };

    const limpiarFirma = (tipo: 'solicitante' | 'trabajador') => {
        if (tipo === 'solicitante') {
        sigSolicitante.current?.clear();

        setDatos((prev: any) => ({
            ...prev,
            firmaSolicitante: null
        }));
        } else {
        sigTrabajador.current?.clear();

        setDatos((prev: any) => ({
            ...prev,
            firmaTrabajador: null
        }));
        }
    };

    return (
        <div>
        <h3 style={{ marginBottom: '1rem' }}>
            16. Firmas y Conformidad
        </h3>

        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Declaro bajo protesta de decir verdad que los datos aquí asentados son ciertos,
            autorizando a la institución para verificar la autenticidad de los mismos.
        </p>

        <div
            style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
            }}
        >
            {/* FIRMA SOLICITANTE */}
            <div style={cardStyle}>
            <SignatureCanvas
                ref={sigSolicitante}
                canvasProps={canvasStyle}
            />

            <div style={actionsStyle}>
                <button
                onClick={() => guardarFirma('solicitante')}
                style={btnGuardar}
                disabled={!!datos.firmaSolicitante}
                >
                <Save size={16} />
                Guardar
                </button>

                <button
                onClick={() => limpiarFirma('solicitante')}
                style={btnEliminar}
                >
                <Trash2 size={16} />
                Limpiar
                </button>
            </div>

            <div style={firmaInfo}>
                <div style={lineaFirma}>
                {datos.solicitanteNombre || 'Nombre del solicitante'}
                </div>
                <div style={subTexto}>
                Firma del Solicitante / Familiar Responsable
                </div>
            </div>
            </div>

            {/* FIRMA TRABAJADOR */}
            <div style={cardStyle}>
            <SignatureCanvas
                ref={sigTrabajador}
                canvasProps={canvasStyle}
            />

            <div style={actionsStyle}>
                <button
                onClick={() => guardarFirma('trabajador')}
                style={btnGuardar}
                disabled={!!datos.firmaTrabajador}
                >
                <Save size={16} />
                Guardar
                </button>

                <button
                onClick={() => limpiarFirma('trabajador')}
                style={btnEliminar}
                >
                <Trash2 size={16} />
                Limpiar
                </button>
            </div>

            <div style={firmaInfo}>
                <div style={lineaFirma}>
                {datos.trabajadorNombre || 'Nombre del trabajador social'}
                </div>
                <div style={subTexto}>
                Trabajador(a) Social que elaboró
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}

/* ================== ESTILOS ================== */

const cardStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem'
};

const canvasStyle = {
    width: 400,
    height: 200,
    style: {
        border: '1px dashed #cbd5f5',
        borderRadius: '12px',
        width: '100%'
    }
};

const actionsStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
};

const btnGuardar = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
};

const btnEliminar = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'white',
    color: '#ef4444',
    border: '2px solid #ef4444',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer'
};

const firmaInfo = {
    marginTop: '1rem',
    textAlign: 'center' as const
};

const lineaFirma = {
    borderTop: '1px solid #94a3b8',
    paddingTop: '8px'
};

const subTexto = {
    fontSize: '12px',
    color: '#64748b'
};