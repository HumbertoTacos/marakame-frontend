import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../../services/api';
import { Trash2, Plus, UploadCloud } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';

/* ================= TYPES ================= */

interface Paciente {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    }

    /* ================= PAGE ================= */

    export default function InventarioPertenenciasPage({ pacienteId }: { pacienteId: number }) {

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPaciente = async () => {
        try {
            const res = await apiClient.get(`/pacientes/${pacienteId}`);
            setPaciente(res.data.data);
        } catch (error) {
            console.error('Error al obtener paciente:', error);
        } finally {
            setLoading(false);
        }
        };

        fetchPaciente();
    }, [pacienteId]);

    const nombreCompleto = paciente
        ? `${paciente.nombre || ''} ${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}`.trim()
        : 'No especificado';

    const fecha = new Date();
    const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;

    /* ================= DATA ================= */

    const [ropa, setRopa] = useState([
        { nombre: 'Pantalón / short / pants', cantidad: 0, descripcion: '' },
        { nombre: 'Ropa interior', cantidad: 0, descripcion: '' },
        { nombre: 'Calcetines', cantidad: 0, descripcion: '' },
        { nombre: 'Toallas', cantidad: 0, descripcion: '' },
        { nombre: 'Camisas / playeras', cantidad: 0, descripcion: '' },
        { nombre: 'Pijama', cantidad: 0, descripcion: '' },
        { nombre: 'Sudadera / chamarra', cantidad: 0, descripcion: '' }
    ]);

    const [calzado, setCalzado] = useState([
        { nombre: 'Zapatos', cantidad: 0, descripcion: '' },
        { nombre: 'Tenis', cantidad: 0, descripcion: '' },
        { nombre: 'Sandalias', cantidad: 0, descripcion: '' },
        { nombre: 'Pantuflas', cantidad: 0, descripcion: '' }
    ]);

    const [personales, setPersonales] = useState([
        { nombre: 'Desodorante', cantidad: 0, descripcion: '' },
        { nombre: 'Cepillo dental', cantidad: 0, descripcion: '' },
        { nombre: 'Pasta dental', cantidad: 0, descripcion: '' },
        { nombre: 'Shampoo', cantidad: 0, descripcion: '' },
        { nombre: 'Jabón', cantidad: 0, descripcion: '' },
        { nombre: 'Rastrillos', cantidad: 0, descripcion: '' },
        { nombre: 'Lentes', cantidad: 0, descripcion: '' },
        { nombre: 'Reloj', cantidad: 0, descripcion: '' }
    ]);

    const [especiales, setEspeciales] = useState('');

    const [files, setFiles] = useState<File[]>([]);

    const firmaPacienteRef = useRef<SignatureCanvas | null>(null);
    const firmaPersonalRef = useRef<SignatureCanvas | null>(null);

    const [nombreResponsable, setNombreResponsable] = useState('');
    const [aceptado, setAceptado] = useState(false);

    /* ================= FUNCIONES ================= */

    const actualizar = (set: any, data: any[], i: number, f: string, v: any) => {
        const copia = [...data];
        copia[i][f] = v;
        set(copia);
    };

    const agregarFila = (set: any) => {
        set((prev: any) => [...prev, { nombre: '', cantidad: 1, descripcion: '' }]);
    };

    const eliminar = (set: any, i: number) => {
        set((prev: any) => prev.filter((_: any, idx: number) => idx !== i));
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const nuevos = Array.from(e.target.files);
        setFiles(prev => [...prev, ...nuevos]);
    };

    // FUNCION FINALIZAR
    const finalizarInventario = async () => {
        if (!aceptado) {
            alert('Debes confirmar que las pertenencias son correctas');
            return;
        }

        const firmaPaciente = firmaPacienteRef.current?.toDataURL();
        const firmaPersonal = firmaPersonalRef.current?.toDataURL();

        if (!firmaPaciente || !firmaPersonal) {
            alert('Se requieren ambas firmas');
            return;
        }

        try {

            // 1️⃣ Guardar inventario
            await apiClient.post('/admisiones/inventario', {
            pacienteId,
            articulos: {
                ropa,
                calzado,
                personales,
                especiales
            },
            validado: true,
            firmaRecibido: true
            });

            // 2️⃣ Subir archivos
            if (files.length > 0) {
            const formData = new FormData();

            files.forEach(file => {
                formData.append('files', file);
            });

            await apiClient.post(
                `/admisiones/inventario/${pacienteId}/upload`,
                formData
            );
            }

            alert('Inventario guardado correctamente');
            navigate('/admisiones/nueva-solicitud');

        } catch (error) {
            console.error(error);
            alert('Error al guardar inventario');
        }
    };

    /* ================= UI ================= */

    return (
        <div style={page}>
        <div style={outerCard}>
            <div style={innerCard}>

            <h2 style={mainTitle}>Inventario de Pertenencias del Paciente</h2>
            <p style={subtitle}>
                Registro formal de pertenencias antes del ingreso a habitación.
            </p>

            {/* ================= SECCIÓN 1 ================= */}
            <div style={infoCard}>
                <h3 style={infoTitle}>1. INFORMACIÓN GENERAL</h3>

                <div style={infoGrid}>
                <div>
                    <span style={label}>Paciente</span>
                    <div style={value}>
                    {loading ? 'Cargando...' : nombreCompleto}
                    </div>
                </div>

                <div>
                    <span style={label}>Clave de Expediente</span>
                    <div style={value}>AUTOGENERADO</div>
                </div>

                <div>
                    <span style={label}>Unidad / Cama</span>
                    <div style={value}>Por asignar</div>
                </div>

                <div>
                    <span style={label}>Fecha de Ingreso</span>
                    <div style={value}>{fechaFormateada}</div>
                </div>
                </div>
            </div>

            {/* ================= SECCIÓN 2 ================= */}
            <h3 style={sectionTitle}>2. DETALLE DE INVENTARIO</h3>

            {/* ====== TABLA GENERICA ====== */}
            {[
                { titulo: 'Ropa de uso diario', data: ropa, set: setRopa },
                { titulo: 'Calzado', data: calzado, set: setCalzado },
                { titulo: 'Artículos personales', data: personales, set: setPersonales }
            ].map((tablaData, index) => (
                <div key={index} style={{ marginBottom: '35px' }}>

                {/* HEADER */}
                <div style={headerTabla}>
                    <div style={titleLeft}>
                    <div style={barra}></div>
                    <h3 style={tituloSeccion}>{tablaData.titulo}</h3>
                    </div>

                    <button
                    style={btnAdd}
                    onClick={() => agregarFila(tablaData.set)}
                    >
                    <Plus size={16} />
                    Agregar fila
                    </button>
                </div>

                {/* TABLA */}
                <div style={tabla}>

                    <div style={thead}>
                    <div>Artículo</div>
                    <div style={{ textAlign: 'center' }}>Cantidad</div>
                    <div>Observaciones</div>
                    <div></div>
                    </div>

                    {tablaData.data.map((item, i) => (
                    <div
                        key={i}
                        style={row}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >

                        <input
                        value={item.nombre}
                        placeholder="Nombre del artículo"
                        onChange={e => actualizar(tablaData.set, tablaData.data, i, 'nombre', e.target.value)}
                        style={input}
                        onFocus={e => e.currentTarget.style.border = '1px solid #3b82f6'}
                        onBlur={e => e.currentTarget.style.border = '1px solid transparent'}
                        />

                        <div style={cantidadWrapper}>
                            <input
                                type="number"
                                value={item.cantidad}
                                onChange={e => actualizar(tablaData.set, tablaData.data, i, 'cantidad', Number(e.target.value))}
                                style={cantidad}
                            />
                        </div>

                        <input
                        value={item.descripcion}
                        placeholder="Color, marca, estado..."
                        onChange={e => actualizar(tablaData.set, tablaData.data, i, 'descripcion', e.target.value)}
                        style={input}
                        />

                        <button style={deleteBtn} onClick={() => eliminar(tablaData.set, i)}>
                        <Trash2 size={18} color="#ef4444" />
                        </button>

                    </div>
                    ))}

                </div>
                </div>
            ))}

            {/* ================= PERTENENCIAS ESPECIALES ================= */}
            <div style={especialContainer}>
                <div style={titleLeft}>
                    <div style={barra}></div>
                    <h3 style={tituloSeccion}>Pertenencias Autorizadas Especiales</h3>
                </div>

                <p style={descripcionEspecial}>
                    Material médico, medicamentos, o artículos aprobados excepcionalmente por el área médica.
                </p>

                <textarea
                    placeholder="Describa los artículos autorizados..."
                    value={especiales}
                    onChange={(e) => setEspeciales(e.target.value)}
                    style={textarea}
                />

            </div>

            {/* ================= SECCIÓN 3 ================= */}
            <div style={{ marginTop: '30px' }}>

                <h3 style={sectionTitle}>3. EVIDENCIA VISUAL</h3>

                <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
                    Adjunte fotografías de las pertenencias o documentos relevantes
                    <br />
                    (Ej. Responsiva firmada).
                </p>

                {/* DROPZONE */}
                <label style={uploadBox}>
                    <UploadCloud size={36} color="#3b82f6" />

                    <div style={{ fontWeight: 600 }}>
                    Click para subir imágenes o PDFs
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    PNG, JPG o PDF hasta 10MB
                    </div>

                    <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFiles}
                    style={{ display: 'none' }}
                    />
                </label>

                {/* LISTA DE ARCHIVOS */}
                {files.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                    {files.map((file, i) => (
                        <div key={i} style={fileItem}>
                        📄 {file.name}
                        </div>
                    ))}
                    </div>
                )}

            </div>

            {/* ================= SECCIÓN 4 ================= */}
            <div style={{ marginTop: '40px' }}>
            <h3 style={sectionTitle}>4. VALIDACIONES Y FIRMAS</h3>
            <div style={firmasContainer}>

                {/* PACIENTE */}
                <div style={firmaBox}>

                <label style={label}>Nombre del Paciente</label>
                <input
                    value={nombreCompleto}
                    readOnly
                    style={inputFirmaDisabled}
                />

                <div style={canvasContainer}>
                    <SignatureCanvas
                    ref={firmaPacienteRef}
                    penColor="black"
                    canvasProps={{ width: 400, height: 150, style: canvas }}
                    />
                </div>

                <div style={lineaFirma}>Firma del paciente / tutor</div>

                <div style={firmaActions}>
                    <button onClick={() => firmaPacienteRef.current?.clear()} style={btnClear}>
                    Limpiar
                    </button>
                </div>

                </div>

                {/* PERSONAL */}
                <div style={firmaBox}>

                <label style={label}>Nombre del Terapeuta / Admisión</label>
                <input
                    placeholder="Nombre del responsable"
                    value={nombreResponsable}
                    onChange={(e) => setNombreResponsable(e.target.value)}
                    style={inputFirma}
                />

                <div style={canvasContainer}>
                    <SignatureCanvas
                    ref={firmaPersonalRef}
                    penColor="black"
                    canvasProps={{ width: 400, height: 150, style: canvas }}
                    />
                </div>

                <div style={lineaFirma}>Firma del personal</div>

                <div style={firmaActions}>
                    <button onClick={() => firmaPersonalRef.current?.clear()} style={btnClear}>
                    Limpiar
                    </button>
                </div>

                </div>

            </div>

            {/* ALERTA + CHECK */}
            <div style={alerta}>

                <input
                type="checkbox"
                checked={aceptado}
                onChange={() => setAceptado(!aceptado)}
                />

                <div>
                <div style={{ fontWeight: 700 }}>
                    El paciente confirma que estas son TODAS sus pertenencias ingresadas.
                </div>

                <div style={{ fontSize: '13px', marginTop: '4px', color: '#9a3412' }}>
                    El centro no se hace responsable por objetos de valor no declarados en este inventario.
                </div>
                </div>
            </div>

            </div>

            {/* ================= BOTÓN FINAL ================= */}
            <div style={footer}>
                <button
                    onClick={finalizarInventario}
                    style={btnFinalizar}
                >
                    Finalizar Inventario
                </button>
            </div>

            </div>
        </div>
        </div>
    );
}

/* ================= ESTILOS ================= */

const page = { background: '#f1f5f9', minHeight: '100vh', padding: '40px' };

const outerCard = {
    background: 'white',
    borderRadius: '20px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
};

const innerCard = {
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '30px'
};

const mainTitle = { fontSize: '22px', fontWeight: 800 };
const subtitle = { color: '#64748b', marginBottom: '20px' };

const infoCard = {
    background: '#eef2ff',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '20px'
};

const infoTitle = { color: '#1e3a8a', fontWeight: 700 };

const infoGrid = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' };

const label = { color: '#64748b', fontSize: '13px' };
const value = { fontWeight: 700 };

const sectionTitle = { color: '#64748b', fontWeight: 700, marginBottom: '20px' };

const headerTabla = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
};

const titleLeft = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
};

const tituloSeccion = {
    fontWeight: 700,
    fontSize: '16px',
    margin: 0
};

const barra = {
    width: '6px',
    height: '20px',
    background: '#2563eb',
    borderRadius: '10px'
};

const btnAdd = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #3b82f6',
    color: '#3b82f6',
    borderRadius: '10px',
    padding: '6px 14px',
    background: 'white',
    cursor: 'pointer',
    fontWeight: 600
};

const tabla = {
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    overflow: 'hidden'
};

const thead = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 2fr 50px',
    background: '#f1f5f9',
    padding: '14px',
    fontWeight: 700,
    color: '#475569'
};

const row = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 2fr 50px',
    padding: '14px',
    borderTop: '1px solid #f1f5f9',
    alignItems: 'center',
    transition: 'background 0.2s ease'
};

const input = {
    width: '100%',
    border: '1px solid transparent',
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '14px'
};

const cantidad = {
    width: '70px',
    textAlign: 'center' as const,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '6px',
    fontSize: '14px'
};

const deleteBtn = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
};

const cantidadWrapper = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'    
};

const especialContainer = {
    marginTop: '20px',
    marginBottom: '30px'
};

const descripcionEspecial = {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: '12px'
};

const textarea = {
    width: '100%',
    minHeight: '90px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '14px',
    resize: 'none' as const,
    outline: 'none',
    background: '#f8fafc',
    transition: 'border 0.2s ease'
};

const uploadBox = {
    width: '100%',
    border: '2px dashed #cbd5e1',
    borderRadius: '14px',
    padding: '40px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    background: '#f8fafc',
    transition: 'all 0.2s ease',

    display: 'flex', 
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
};

const fileItem = {
    fontSize: '13px',
    color: '#334155',
    marginBottom: '6px',
    background: '#f1f5f9',
    padding: '6px 10px',
    borderRadius: '8px'
};

const firmasContainer = {
  display: 'flex',
  gap: '30px',
  marginTop: '20px'
};

const firmaBox = {
  flex: 1
};

const canvasContainer = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  marginTop: '10px',
  background: '#fff'
};

const canvas = {
  width: '100%',
  height: '150px'
};

const lineaFirma = {
  textAlign: 'center' as const,
  fontSize: '12px',
  color: '#64748b',
  borderTop: '1px dashed #cbd5e1',
  marginTop: '8px',
  paddingTop: '6px'
};

const firmaActions = {
  marginTop: '8px'
};

const btnClear = {
  background: '#ef4444',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px'
};

const inputFirma = {
  width: '100%',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '10px',
  fontSize: '14px'
};

const inputFirmaDisabled = {
  ...inputFirma,
  background: '#f1f5f9',
  color: '#64748b'
};

const alerta = {
  marginTop: '25px',
  background: '#fff7ed',
  border: '1px solid #fdba74',
  borderRadius: '12px',
  padding: '15px',
  display: 'flex',
  gap: '10px',
  alignItems: 'flex-start'
};

const footer = {
  marginTop: '30px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const btnFinalizar = {
  background: '#10b981',
  color: 'white',
  border: 'none',
  padding: '12px 22px',
  borderRadius: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '14px',
  boxShadow: '0 6px 16px rgba(16,185,129,0.3)',
  transition: '0.2s'
};