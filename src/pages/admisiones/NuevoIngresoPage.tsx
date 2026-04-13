import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Home, ArrowLeft, User, Phone, Users, Heart,
    MapPin, Briefcase, Info, CheckCircle2, ChevronRight,
    GraduationCap, Globe, Baby, ArrowRight, Camera, Calendar, Hash,
    CreditCard, Navigation, Venus, Mars, List, Shield, Stethoscope, DollarSign, Activity,
    UserCheck, Wallet, BriefcaseIcon, Building2, Clock, Users2, Plus, Trash2, Utensils, FileText, Check
} from 'lucide-react';
import apiClient from '../../services/api';

const NuevoIngresoPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const pacienteId = searchParams.get('pacienteId');

    const [currentStep, setCurrentStep] = useState(1);
    const [currentSubStep, setCurrentSubStep] = useState(1); // Para el Paso 3
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [sustanciasCatalogo, setSustanciasCatalogo] = useState<{ id: number, nombre: string }[]>([]);

    // Estado del Formulario
    const [formData, setFormData] = useState({
        // Paso 1: Datos del Solicitante (CRM / Básicos)
        solicitanteNombre: '',
        solicitanteParentesco: '',
        solicitanteCelular: '',
        solicitanteMedio: '',
        solicitanteOcupacion: '',
        solicitanteLugar: '',
        solicitanteDomicilio: '',

        // Paso 2: Datos del Prospecto
        pacienteNombre: '',
        pacienteEdad: '',
        pacienteEstadoCivil: '',
        pacienteHijos: '',
        pacienteDireccion: '',
        pacienteEscolaridad: '',
        pacienteOrigen: '',
        pacienteTelefono: '',
        pacienteOcupacion: '',

        // Paso 3: Estudio Socioeconómico - División 1 (1-3)
        socioFoto: null as string | null,
        socioFechaAplicacion: new Date().toISOString().split('T')[0],
        socioFolio: '',

        // Paso 3: Estudio Socioeconómico - División 2 (4-15) - Solicitante
        solicitanteFechaNac: '',
        solicitanteLugarNac: '',
        solicitanteEdadSocio: '',
        solicitanteSexo: '',
        solicitanteEscolaridadSocio: '',
        solicitanteEdoCivilSocio: '',
        solicitanteTarjetas: '',
        solicitanteReferencias: '',

        // Paso 3: Estudio Socioeconómico - División 3 (16-25) - Beneficiario
        pacienteFechaNac: '',
        pacienteLugarNac: '',
        pacienteSexo: '',
        pacienteAgeSocio: '',

        // Paso 3: Estudio Socioeconomico - Division 4 (27-42) - Ingreso/Egreso
        socioSolicitanteEmpleo: '',
        socioSolicitanteEmpresa: '',
        socioSolicitanteAntiguedad: '',
        socioSolicitantePuesto: '',
        socioSolicitanteHorario: '',
        socioSolicitanteDependientes: '',
        socioSolicitanteIngreso: '',
        socioSolicitanteExtra: '',
        socioSolicitanteOcupacionCod: '', // 0, 1, 2, 3
        socioConyugeOcupacion: '',
        socioConyugeEmpresa: '',
        socioConyugeAntiguedad: '',
        socioConyugeIngreso: '',
        socioOtrosAportan: '',
        socioOtrosAportanDetalle: [] as { parentesco: string, cantidad: string }[], // Punto 41
        socioIntegrantesAportan: '', // Punto 42 (0, 1, 2, 3)
        socioGrupoFamiliar: [] as { nombre: string, parentesco: string, edad: string, sexo: string, edoCivil: string, ocupacion: string }[], // Punto 26

        // Paso 3: Estudio Socioeconómico - División 5 (43-45) - III. Ingresos y Egresos mensuales
        socioIngresoSolicitante: '',
        socioIngresoEsposo: '',
        socioIngresoHijos: '',
        socioIngresosOtrosDetalle: [] as { concepto: string, cantidad: string }[], // Reemplaza socioIngresoOtros (43)
        socioEgresoAlimentacion: '',
        socioEgresoRenta: '',
        socioEgresoLuz: '',
        socioEgresoAgua: '',
        socioEgresoCombustible: '',
        socioEgresoTransporte: '',
        socioEgresoEducacion: '',
        socioEgresoTelefono: '',
        socioEgresoMedicos: '',
        socioEgresoEsparcimiento: '',
        socioEgresosOtrosDetalle: [] as { concepto: string, cantidad: string }[], // Reemplaza socioEgresoOtros
        socioBalanceCod: '', // 0=Déficit, 1=Superávit (Punto 45)

        // Paso 3: Estudio Socioeconómico - División 6 (46-49) - IV. Transporte
        socioTieneAuto: '', // 46
        socioCantAutos: '', // 47
        socioAutosDetalle: [] as { marca: string, modelo: string, propietario: string }[], // 48
        socioAutoCod: '', // 49

        // Paso 3: Estudio Socioeconómico - División 7 (50-53) - V. Salud y Adicciones
        socioSaludIssste: false, // 50
        socioSaludImss: false,
        socioSaludSeguroPopular: false,
        socioSaludParticular: false,
        socioSaludOtrosCheck: false,
        socioSaludMontoConsultas: '', // 51
        socioSaludOtros: '', // 52
        socioSaludIntegrantesConAsistencia: '', // 53

        // Paso 3: Estudio Socioeconómico - División 7 (54-55) - Adicciones y Relación
        socioAdiccionesDetalle: [] as { nombre: string, cantidadFrecuencia: string }[], // Punto 54 dinámico
        socioRelacionFamiliar: '', // 55

        // Paso 3: Estudio Socioeconómico - División 8 (56-64) - IV. Vivienda
        socioViviendaRegimenCod: '', // 56
        socioViviendaTipoCod: '', // 57
        socioViviendaEspacioCod: '', // 58
        socioViviendaSala: false, // 59
        socioViviendaComedor: false,
        socioViviendaCocina: false,
        socioViviendaJardin: false,
        socioViviendaBanios: '', // 1, 2, 3, 4, Otros
        socioViviendaBaniosOtro: '', // 60
        socioViviendaOtrosChar: '', // 61
        socioViviendaPisoCod: '', // 62
        socioViviendaMurosCod: '', // 63
        socioViviendaMurosOtro: '',
        socioViviendaTechoCod: '', // 64
        socioViviendaTechoOtro: '',

        socioAlimentacionDetalle: [
            { tipo: 'Carne de res', frecuencia: '' },
            { tipo: 'Carne de pollo', frecuencia: '' },
            { tipo: 'Carne de cerdo', frecuencia: '' },
            { tipo: 'Pescado', frecuencia: '' },
            { tipo: 'Leche', frecuencia: '' },
            { tipo: 'Cereales', frecuencia: '' },
            { tipo: 'Huevo', frecuencia: '' },
            { tipo: 'Frutas', frecuencia: '' },
            { tipo: 'Verduras', frecuencia: '' },
            { tipo: 'Leguminosas (Frijol, lentejas, etc.)', frecuencia: '' },
        ] as { tipo: string, frecuencia: string }[],

        // Paso 3: Estudio Socioeconómico - División 10 (66) - V. Referencias Personales
        socioReferenciasDetalle: [
            { nombre: '', telefono: '', relacion: '', tiempo: '' },
            { nombre: '', telefono: '', relacion: '', tiempo: '' },
        ] as { nombre: string, telefono: string, relacion: string, tiempo: string }[],

        // Paso 3: Estudio Socioeconómico - Divisiones 11, 12, 13 (67-69) - Cierre
        socioDiagEconomico: '', // 67
        socioPuntosObtenidos: '', // 67 (Puntos)
        socioCostoTratamiento: '', // 67 (Costo)
        socioObsTS: '', // 68
        socioEstudioCampo: '', // 69
    });

    // Cargar datos pre-llenados (Primer Contacto) y Catálogos
    useEffect(() => {
        // Cargar Catálogo de Sustancias
        apiClient.get('/admisiones/sustancias')
            .then(res => setSustanciasCatalogo(res.data.data || []))
            .catch(err => console.error("Error cargando sustancias:", err));

        if (pacienteId) {
            apiClient.get(`/admisiones/paciente/${pacienteId}/primer-contacto`)
                .then(res => {
                    const data = res.data.data;
                    setFormData(prev => ({
                        ...prev,
                        solicitanteNombre: data.nombreLlamada || '',
                        solicitanteParentesco: data.parentescoLlamada || '',
                        solicitanteCelular: data.celularLlamada || '',
                        solicitanteMedio: data.medioEnterado || '',
                        solicitanteOcupacion: data.ocupacionLlamada || '',
                        solicitanteLugar: data.lugarLlamada || '',
                        solicitanteDomicilio: data.domicilioLlamada || '',

                        pacienteNombre: data.nombrePaciente || '',
                        pacienteEdad: data.edadPaciente?.toString() || '',
                        pacienteEstadoCivil: data.estadoCivilPaciente || '',
                        pacienteHijos: data.hijosPaciente?.toString() || '',
                        pacienteDireccion: data.direccionPaciente || '',
                        pacienteEscolaridad: data.escolaridadPaciente || '',
                        pacienteOrigen: data.origenPaciente || '',
                        pacienteTelefono: data.telefonoPaciente || '',
                        pacienteOcupacion: data.ocupacionPaciente || '',
                    }));
                })
                .catch(err => {
                    console.error("Error cargando primer contacto:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [pacienteId]);

    // Efecto secundario para inicializar socioAdiccionesDetalle cuando carguen catálogo y primer contacto
    useEffect(() => {
        if (sustanciasCatalogo.length > 0) {
            setFormData(prev => {
                // Solo si el array está vacío (primera carga)
                if (prev.socioAdiccionesDetalle.length === 0) {
                    // Obtener nombres de sustancias del primer contacto (normalizados a mayúsculas para comparar)
                    // Nota: Necesitamos acceder a los datos que cargamos en el useEffect anterior.
                    // Como no tenemos una variable de estado externa para 'primerContactoData', 
                    // lo ideal sería que este efecto dependiera de una señal de que el primer contacto cargó.
                    // Por simplicidad en este wizard, asumiremos que si ya hay datos en pacienteNombre, el PC cargó.
                    
                    return {
                        ...prev,
                        socioAdiccionesDetalle: sustanciasCatalogo.map(s => {
                            // Si quieres pre-llenar de verdad, necesitaríamos guardar el data.sustancias en un ref o state
                            // Por ahora, lo dejaremos listo para que el usuario lo llene como pidió.
                            return {
                                nombre: s.nombre,
                                cantidadFrecuencia: ''
                            };
                        })
                    };
                }
                return prev;
            });
        }
    }, [sustanciasCatalogo]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => {
        if (currentStep === 3) {
            if (currentSubStep < 13) {
                setCurrentSubStep(prev => prev + 1);
                window.scrollTo(0, 0);
            } else {
                setIsSaving(true);
                setTimeout(() => { setIsSaving(false); setCurrentStep(prev => prev + 1); window.scrollTo(0, 0); }, 600);
            }
        } else {
            setIsSaving(true);
            setTimeout(() => { setIsSaving(false); setCurrentStep(prev => prev + 1); window.scrollTo(0, 0); }, 600);
        }
    };

    const handleBackStep = () => {
        if (currentStep === 3 && currentSubStep > 1) {
            setCurrentSubStep(prev => prev - 1);
            window.scrollTo(0, 0);
        } else {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateField('socioFoto', url);
        }
    };

    const addAportadorRow = () => {
        updateField('socioOtrosAportanDetalle', [...formData.socioOtrosAportanDetalle, { parentesco: '', cantidad: '' }]);
    };

    const updateAportadorRow = (index: number, field: string, value: string) => {
        const newList = [...formData.socioOtrosAportanDetalle];
        newList[index] = { ...newList[index], [field]: value };
        updateField('socioOtrosAportanDetalle', newList);
    };

    const removeAportadorRow = (index: number) => {
        const newList = formData.socioOtrosAportanDetalle.filter((_, i) => i !== index);
        updateField('socioOtrosAportanDetalle', newList);
    };

    const addGrupoFamiliarRow = () => {
        updateField('socioGrupoFamiliar', [...formData.socioGrupoFamiliar, { nombre: '', parentesco: '', edad: '', sexo: '', edoCivil: '', ocupacion: '' }]);
    };

    const updateGrupoFamiliarRow = (index: number, field: string, value: string) => {
        const newList = [...formData.socioGrupoFamiliar];
        newList[index] = { ...newList[index], [field]: value };
        updateField('socioGrupoFamiliar', newList);
    };

    const removeGrupoFamiliarRow = (index: number) => {
        const newList = formData.socioGrupoFamiliar.filter((_, i) => i !== index);
        updateField('socioGrupoFamiliar', newList);
    };

    const addIngresoOtroRow = () => {
        updateField('socioIngresosOtrosDetalle', [...formData.socioIngresosOtrosDetalle, { concepto: '', cantidad: '' }]);
    };
    const updateIngresoOtroRow = (index: number, field: string, value: string) => {
        const newList = [...formData.socioIngresosOtrosDetalle];
        newList[index] = { ...newList[index], [field]: value };
        updateField('socioIngresosOtrosDetalle', newList);
    };
    const removeIngresoOtroRow = (index: number) => {
        const newList = formData.socioIngresosOtrosDetalle.filter((_, i) => i !== index);
        updateField('socioIngresosOtrosDetalle', newList);
    };

    const addEgresoOtroRow = () => {
        updateField('socioEgresosOtrosDetalle', [...formData.socioEgresosOtrosDetalle, { concepto: '', cantidad: '' }]);
    };
    const updateEgresoOtroRow = (index: number, field: string, value: string) => {
        const newList = [...formData.socioEgresosOtrosDetalle];
        newList[index] = { ...newList[index], [field]: value };
        updateField('socioEgresosOtrosDetalle', newList);
    };
    const removeEgresoOtroRow = (index: number) => {
        const newList = formData.socioEgresosOtrosDetalle.filter((_, i) => i !== index);
        updateField('socioEgresosOtrosDetalle', newList);
    };

    const handleCantAutosChange = (val: string) => {
        const cant = parseInt(val) || 0;
        updateField('socioCantAutos', val);
        
        let newDetalle = [...formData.socioAutosDetalle];
        if (cant > newDetalle.length) {
            // Añadir filas
            for (let i = newDetalle.length; i < cant; i++) {
                newDetalle.push({ marca: '', modelo: '', propietario: '' });
            }
        } else if (cant < newDetalle.length) {
            // Quitar filas
            newDetalle = newDetalle.slice(0, cant);
        }
        updateField('socioAutosDetalle', newDetalle);
    };

    const updateAutoRow = (idx: number, field: string, val: string) => {
        const newDetalle = [...formData.socioAutosDetalle];
        newDetalle[idx] = { ...newDetalle[idx], [field]: val };
        updateField('socioAutosDetalle', newDetalle);
    };

    const updateAdiccionDetalle = (idx: number, val: string) => {
        const newList = [...formData.socioAdiccionesDetalle];
        newList[idx] = { ...newList[idx], cantidadFrecuencia: val };
        updateField('socioAdiccionesDetalle', newList);
    };

    const updateAlimentacionFrecuencia = (idx: number, frecuencia: string) => {
        const newList = [...formData.socioAlimentacionDetalle];
        newList[idx] = { ...newList[idx], frecuencia };
        updateField('socioAlimentacionDetalle', newList);
    };

    const updateReferenciaRow = (idx: number, field: string, val: string) => {
        const newList = [...formData.socioReferenciasDetalle];
        newList[idx] = { ...newList[idx], [field]: val };
        updateField('socioReferenciasDetalle', newList);
    };

    const inputStyle = { width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', fontWeight: '600', outline: 'none', transition: 'all 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' as const };

    // Lista de Divisiones para el Sidebar del Paso 3
    const socioDivisions = [
        { id: 1, title: '1-3. Control Aplicación', icon: <Hash size={16} /> },
        { id: 2, title: '4-15. Datos Solicitante', icon: <User size={16} /> },
        { id: 3, title: '16-25. Datos Beneficiario', icon: <UserCheck size={16} /> },
        { id: 4, title: 'II. Ingreso y Egreso (27-42)', icon: <Wallet size={16} /> },
        { id: 5, title: 'III. Ingresos y Egresos (43-45)', icon: <DollarSign size={16} /> },
        { id: 6, title: 'IV. Transporte (46-49)', icon: <Navigation size={16} /> },
        { id: 7, title: 'V. Salud y Adicciones (50-55)', icon: <Activity size={16} /> },
        { id: 8, title: 'IV. Vivienda (56-64)', icon: <Home size={16} /> },
        { id: 9, title: 'V. Alimentación (65)', icon: <Utensils size={16} /> },
        { id: 10, title: 'V. Referencias (66)', icon: <Users2 size={16} /> },
        { id: 11, title: 'VI. Diagnóstico (67)', icon: <CreditCard size={16} /> },
        { id: 12, title: 'VII. Obs. Trabajador Social (68)', icon: <Info size={16} /> },
        { id: 13, title: 'VIII. Obs. Visita Domiciliaria (69)', icon: <MapPin size={16} /> }
    ];

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ fontWeight: '700', color: '#64748b' }}>Cargando información...</p></div>;

    return (
        <div style={{ padding: '0 1rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Nuevo Ingreso</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Expediente Digital</span>
                        <ChevronRight size={12} color="#94a3b8" />
                        <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>Paso {currentStep}: {currentStep === 3 ? `Estudio Socioec. (${currentSubStep})` : currentStep === 1 ? 'Solicitante' : 'Paciente'}</span>
                    </div>
                </div>
                <button onClick={() => navigate('/admisiones/seguimiento')} style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '13px' }}>
                    <ArrowLeft size={16} /> Salir
                </button>
            </div>

            {/* STEPPER SUPERIOR */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem' }}>
                {[1, 2, 3, 4, 5].map(step => (
                    <div key={step} style={{ height: '6px', flex: 1, borderRadius: '10px', backgroundColor: step <= currentStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.5s ease' }} />
                ))}
            </div>

            <div className="animate-fade-in" key={`${currentStep}-${currentSubStep}`}>

                {/* PASOS 1 Y 2 ... */}
                {currentStep < 3 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                        <aside>
                            <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                <div style={{ width: '48px', height: '48px', backgroundColor: currentStep === 1 ? '#eff6ff' : '#f0fdf4', color: currentStep === 1 ? '#3b82f6' : '#10b981', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    {currentStep === 1 ? <User size={24} /> : <Users size={24} />}
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 0.5rem' }}>{currentStep === 1 ? 'El Solicitante' : 'El Paciente'}</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>Valide y complete la información básica para iniciar el expediente.</p>
                            </div>
                        </aside>
                        <main style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            {currentStep === 1 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>4) Nombre Completo</label><div style={{ position: 'relative' }}><User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="text" value={formData.solicitanteNombre} onChange={(e) => updateField('solicitanteNombre', e.target.value)} style={inputStyle} /></div></div>
                                    <div><label style={labelStyle}>Parentesco</label><input type="text" value={formData.solicitanteParentesco} onChange={(e) => updateField('solicitanteParentesco', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div><label style={labelStyle}>Celular</label><input type="text" value={formData.solicitanteCelular} onChange={(e) => updateField('solicitanteCelular', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div><label style={labelStyle}>Ocupación</label><input type="text" value={formData.solicitanteOcupacion} onChange={(e) => updateField('solicitanteOcupacion', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div><label style={labelStyle}>Medio de Enterado</label><input type="text" value={formData.solicitanteMedio} onChange={(e) => updateField('solicitanteMedio', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Domicilio completo</label><textarea value={formData.solicitanteDomicilio} onChange={(e) => updateField('solicitanteDomicilio', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', minHeight: '80px', fontFamily: 'inherit' }} /></div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre Completo</label><input type="text" value={formData.pacienteNombre} onChange={(e) => updateField('pacienteNombre', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div><label style={labelStyle}>Edad</label><input type="number" value={formData.pacienteEdad} onChange={(e) => updateField('pacienteEdad', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div><label style={labelStyle}>Estado Civil</label><select value={formData.pacienteEstadoCivil} onChange={(e) => updateField('pacienteEstadoCivil', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}><option value="">Seleccionar...</option><option value="SOLTERO(A)">SOLTERO(A)</option><option value="CASADO(A)">CASADO(A)</option><option value="DIVORCIADO(A)">DIVORCIADO(A)</option><option value="VIUDO(A)">VIUDO(A)</option><option value="UNIÓN LIBRE">UNIÓN LIBRE</option></select></div>
                                    <div><label style={labelStyle}>Hijos</label><input type="number" value={formData.pacienteHijos} onChange={(e) => updateField('pacienteHijos', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div><label style={labelStyle}>Escolaridad</label><input type="text" value={formData.pacienteEscolaridad} onChange={(e) => updateField('pacienteEscolaridad', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Dirección Actual</label><textarea value={formData.pacienteDireccion} onChange={(e) => updateField('pacienteDireccion', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', minHeight: '80px', fontFamily: 'inherit' }} /></div>
                                </div>
                            )}
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: currentStep === 1 ? 'flex-end' : 'space-between' }}>
                                {currentStep > 1 && <button onClick={handleBackStep} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer' }}><ArrowLeft size={18} /> Regresar</button>}
                                <button onClick={handleNextStep} style={{ padding: '0.8rem 2rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>{isSaving ? 'Guardando...' : (<>Continuar <ArrowRight size={18} /></>)}</button>
                            </div>
                        </main>
                    </div>
                )}

                {/* PASO 3: ESTUDIO SOCIOECONÓMICO */}
                {currentStep === 3 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
                        <aside style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.25rem', position: 'sticky', top: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                            <div style={{ padding: '0.5rem 0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Divisiones del Estudio</h4>
                            </div>
                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {socioDivisions.map(div => (
                                    <button key={div.id} onClick={() => setCurrentSubStep(div.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13.5px', fontWeight: currentSubStep === div.id ? '800' : '600', color: currentSubStep === div.id ? '#3b82f6' : '#64748b', backgroundColor: currentSubStep === div.id ? '#eff6ff' : 'transparent', transition: 'all 0.2s ease', outline: 'none' }}>
                                        <div style={{ minWidth: '24px', height: '24px', borderRadius: '7px', backgroundColor: currentSubStep === div.id ? '#3b82f6' : '#f1f5f9', color: currentSubStep === div.id ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{div.id}</div>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{div.title}</span>
                                    </button>
                                ))}
                            </nav>
                        </aside>

                        <main style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '3rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>

                            <div style={{ flex: 1 }}>
                                {/* 3.1: CONTROL */}
                                {currentSubStep === 1 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }} /> 1, 2 y 3. Control de Aplicación</h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '3rem', alignItems: 'start' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <label style={labelStyle}>1) Foto Paga Tratamiento</label>
                                                <div style={{ width: '160px', height: '180px', borderRadius: '24px', backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', position: 'relative', margin: '0 auto', overflow: 'hidden' }}>
                                                    {formData.socioFoto ? <img src={formData.socioFoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Camera size={36} color="#94a3b8" /><span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Subir Foto</span></>}
                                                    <input type="file" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                <div><label style={labelStyle}>2) Fecha de Aplicación</label><div style={{ position: 'relative' }}><Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="date" value={formData.socioFechaAplicacion} onChange={(e) => updateField('socioFechaAplicacion', e.target.value)} style={inputStyle} /></div></div>
                                                <div><label style={labelStyle}>3) Número de Folio</label><div style={{ position: 'relative' }}><Hash size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="text" value={formData.socioFolio} onChange={(e) => updateField('socioFolio', e.target.value)} style={inputStyle} placeholder="Folio institucional" /></div></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3.2: SOLICITANTE */}
                                {currentSubStep === 2 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '8px', height: '24px', backgroundColor: '#10b981', borderRadius: '4px' }} /> 4-15. Datos Generales del Solicitante</h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>4) Nombre Completo</label><input type="text" value={formData.solicitanteNombre} disabled style={{ ...inputStyle, paddingLeft: '1rem', backgroundColor: '#f1f5f9', color: '#64748b' }} /></div>
                                            <div><label style={labelStyle}>5) Fecha Nacimiento</label><input type="date" value={formData.solicitanteFechaNac} onChange={(e) => updateField('solicitanteFechaNac', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div><label style={labelStyle}>6) Lugar Nacimiento</label><input type="text" value={formData.solicitanteLugarNac} onChange={(e) => updateField('solicitanteLugarNac', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div><label style={labelStyle}>7) Edad</label><input type="number" value={formData.solicitanteEdadSocio} onChange={(e) => updateField('solicitanteEdadSocio', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div><label style={labelStyle}>8) Sexo</label><select value={formData.solicitanteSexo} onChange={(e) => updateField('solicitanteSexo', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}><option value="">Seleccionar...</option><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                                            <div><label style={labelStyle}>11) Estado Civil</label><select value={formData.solicitanteEdoCivilSocio} onChange={(e) => updateField('solicitanteEdoCivilSocio', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}><option value="">Seleccionar...</option><option value="SOLTERO(A)">SOLTERO(A)</option><option value="CASADO(A)">CASADO(A)</option><option value="DIVORCIADO(A)">DIVORCIADO(A)</option><option value="VIUDO(A)">VIUDO(A)</option><option value="UNIÓN LIBRE">UNIÓN LIBRE</option></select></div>
                                            <div><label style={labelStyle}>9) Escolaridad</label><input type="text" value={formData.solicitanteEscolaridadSocio} onChange={(e) => updateField('solicitanteEscolaridadSocio', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>12 y 13) Dirección y Teléfonos</label>
                                                <div style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
                                                    <strong>Dir:</strong> {formData.solicitanteDomicilio}<br /><strong>Tel:</strong> {formData.solicitanteCelular}
                                                </div>
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>14) Tarjeta de crédito/débito</label><input type="text" value={formData.solicitanteTarjetas} onChange={(e) => updateField('solicitanteTarjetas', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>15) Referencias de domicilio</label><textarea value={formData.solicitanteReferencias} onChange={(e) => updateField('solicitanteReferencias', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', minHeight: '80px', fontFamily: 'inherit' }} /></div>
                                        </div>
                                    </div>
                                )}

                                {/* 3.3: BENEFICIARIO (16-25) */}
                                {currentSubStep === 3 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }} /> 16-25. Datos Generales del Beneficiario</h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>16) Nombre Completo del Beneficiario</label>
                                                <input type="text" value={formData.pacienteNombre} disabled style={{ ...inputStyle, paddingLeft: '1rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                                            </div>
                                            <div><label style={labelStyle}>17) Fecha de Nacimiento</label><input type="date" value={formData.pacienteFechaNac} onChange={(e) => updateField('pacienteFechaNac', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div><label style={labelStyle}>18) Lugar de Nacimiento</label><input type="text" value={formData.pacienteLugarNac} onChange={(e) => updateField('pacienteLugarNac', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div><label style={labelStyle}>19) Edad Cumplida</label><input type="number" value={formData.pacienteAgeSocio || formData.pacienteEdad} onChange={(e) => updateField('pacienteAgeSocio', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div><label style={labelStyle}>20) Sexo</label><select value={formData.pacienteSexo} onChange={(e) => updateField('pacienteSexo', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}><option value="">Seleccionar...</option><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                                            <div><label style={labelStyle}>21) Escolaridad Terminada</label><input type="text" value={formData.pacienteEscolaridad} disabled style={{ ...inputStyle, paddingLeft: '1rem', backgroundColor: '#f1f5f9' }} /></div>
                                            <div><label style={labelStyle}>22) Ocupación Actual</label><input type="text" value={formData.pacienteOcupacion} disabled style={{ ...inputStyle, paddingLeft: '1rem', backgroundColor: '#f1f5f9' }} /></div>
                                            <div><label style={labelStyle}>23) Estado Civil</label><input type="text" value={formData.pacienteEstadoCivil} disabled style={{ ...inputStyle, paddingLeft: '1rem', backgroundColor: '#f1f5f9' }} /></div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>24 y 25) Dirección y Teléfonos</label>
                                                <div style={{ padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
                                                    <strong>Dir:</strong> {formData.pacienteDireccion}<br /><strong>Tel:</strong> {formData.pacienteTelefono}
                                                </div>
                                            </div>
                                        </div>

                                        {/* PUNTO 26: ESTRUCTURA FAMILIAR */}
                                        <div style={{ borderTop: '2px solid #f1f5f9', marginTop: '3rem', paddingTop: '2.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Estructura familiar: (Personas que habitan en el domicilio)</h3>
                                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Añade a todos los integrantes de la vivienda.</p>
                                                </div>
                                                <button onClick={addGrupoFamiliarRow} style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}><Plus size={16} /> Añadir Integrante (26)</button>
                                            </div>

                                            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: 'white', borderBottom: '2px solid #e2e8f0' }}>
                                                            <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', textTransform: 'uppercase' }}>Nombre</th>
                                                            <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', textTransform: 'uppercase' }}>Parentesco</th>
                                                            <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', textTransform: 'uppercase', width: '80px' }}>Edad</th>
                                                            <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', textTransform: 'uppercase', width: '100px' }}>Sexo</th>
                                                            <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', textTransform: 'uppercase' }}>Edo. Civil</th>
                                                            <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#475569', textAlign: 'left', textTransform: 'uppercase' }}>Ocupación/Lugar</th>
                                                            <th style={{ width: '50px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.socioGrupoFamiliar.map((member, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                                                                <td style={{ padding: '8px' }}><input type="text" value={member.nombre} onChange={(e) => updateGrupoFamiliarRow(idx, 'nombre', e.target.value)} style={{ ...inputStyle, paddingLeft: '0.75rem', height: '38px', borderRadius: '8px' }} /></td>
                                                                <td style={{ padding: '8px' }}><input type="text" value={member.parentesco} onChange={(e) => updateGrupoFamiliarRow(idx, 'parentesco', e.target.value)} style={{ ...inputStyle, paddingLeft: '0.75rem', height: '38px', borderRadius: '8px' }} /></td>
                                                                <td style={{ padding: '8px' }}><input type="number" value={member.edad} onChange={(e) => updateGrupoFamiliarRow(idx, 'edad', e.target.value)} style={{ ...inputStyle, paddingLeft: '0.75rem', height: '38px', borderRadius: '8px' }} /></td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <select value={member.sexo} onChange={(e) => updateGrupoFamiliarRow(idx, 'sexo', e.target.value)} style={{ ...inputStyle, paddingLeft: '0.75rem', height: '38px', borderRadius: '8px' }}>
                                                                        <option value="">-</option>
                                                                        <option value="M">M</option>
                                                                        <option value="F">F</option>
                                                                    </select>
                                                                </td>
                                                                <td style={{ padding: '8px' }}><input type="text" value={member.edoCivil} onChange={(e) => updateGrupoFamiliarRow(idx, 'edoCivil', e.target.value)} style={{ ...inputStyle, paddingLeft: '0.75rem', height: '38px', borderRadius: '8px' }} /></td>
                                                                <td style={{ padding: '8px' }}><input type="text" value={member.ocupacion} onChange={(e) => updateGrupoFamiliarRow(idx, 'ocupacion', e.target.value)} style={{ ...inputStyle, paddingLeft: '0.75rem', height: '38px', borderRadius: '8px' }} /></td>
                                                                <td style={{ textAlign: 'center' }}><button onClick={() => removeGrupoFamiliarRow(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                                                            </tr>
                                                        ))}
                                                        {formData.socioGrupoFamiliar.length === 0 && (
                                                            <tr>
                                                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                                                    No hay integrantes registrados. Haz clic en "Añadir Integrante" para comenzar.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3.4: INGRESO Y EGRESO familiar (V2 Ajustada) */}
                                {currentSubStep === 4 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '8px', height: '24px', backgroundColor: '#f59e0b', borderRadius: '4px' }} /> II. INGRESO Y EGRESO FAMILIAR (27)</h2>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', alignItems: 'end', marginBottom: '2.5rem' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>27) ¿Cuenta con empleo actual?</label>
                                                <div style={{ display: 'flex', gap: '2rem', padding: '0.8rem 1rem' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}><input type="radio" checked={formData.socioSolicitanteEmpleo === 'SI'} onChange={() => updateField('socioSolicitanteEmpleo', 'SI')} /> Si ( )</label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}><input type="radio" checked={formData.socioSolicitanteEmpleo === 'NO'} onChange={() => updateField('socioSolicitanteEmpleo', 'NO')} /> No ( )</label>
                                                </div>
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>28) Empresa en la que labora</label><input type="text" value={formData.socioSolicitanteEmpresa} onChange={(e) => updateField('socioSolicitanteEmpresa', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>

                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>29) Antigüedad</label><input type="text" value={formData.socioSolicitanteAntiguedad} onChange={(e) => updateField('socioSolicitanteAntiguedad', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>30) Puesto que ocupa</label><input type="text" value={formData.socioSolicitantePuesto} onChange={(e) => updateField('socioSolicitantePuesto', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>

                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>31) Horario de trabajo</label><input type="text" value={formData.socioSolicitanteHorario} onChange={(e) => updateField('socioSolicitanteHorario', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>32) No. de dependientes económicos</label><input type="number" value={formData.socioSolicitanteDependientes} onChange={(e) => updateField('socioSolicitanteDependientes', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>

                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>33) Ingreso mensual neto</label><div style={{ position: 'relative' }}><DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="number" value={formData.socioSolicitanteIngreso} onChange={(e) => updateField('socioSolicitanteIngreso', e.target.value)} style={inputStyle} /></div></div>
                                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>34) Otros ingresos</label><div style={{ position: 'relative' }}><DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="number" value={formData.socioSolicitanteExtra} onChange={(e) => updateField('socioSolicitanteExtra', e.target.value)} style={inputStyle} /></div></div>
                                        </div>

                                        {/* PUNTO 35: TABLA DE OCUPACION */}
                                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', alignItems: 'center' }}>
                                            <table style={{ borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '220px' }}>
                                                <thead><tr style={{ backgroundColor: '#f8fafc' }}><th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>OCUPACIÓN</th><th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Cód.</th></tr></thead>
                                                <tbody>
                                                    {[['Desempleado / Emp. Temporal', '0'], ['Obrero / Empleado', '1'], ['Profesional', '2'], ['Empresario', '3']].map(([name, code]) => (
                                                        <tr key={code}>
                                                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: '600' }}>{name}</td>
                                                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', fontWeight: '800' }}>{code}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={labelStyle}>35) Cód. Ocupación</label>
                                                <input type="text" maxLength={1} value={formData.socioSolicitanteOcupacionCod} onChange={(e) => updateField('socioSolicitanteOcupacionCod', e.target.value.replace(/[^0-3]/g, ''))} style={{ width: '60px', height: '60px', borderRadius: '12px', border: '2px solid #3b82f6', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: '#1e40af', outline: 'none' }} />
                                            </div>
                                        </div>

                                        {/* CONYUGE */}
                                        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2rem', marginBottom: '2.5rem' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '1.5rem' }}>Datos del cónyuge</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                                <div><label style={labelStyle}>36) Ocupación</label><input type="text" value={formData.socioConyugeOcupacion} onChange={(e) => updateField('socioConyugeOcupacion', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                                <div><label style={labelStyle}>37) Empresa donde labora</label><input type="text" value={formData.socioConyugeEmpresa} onChange={(e) => updateField('socioConyugeEmpresa', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                                <div><label style={labelStyle}>38) Antigüedad</label><input type="text" value={formData.socioConyugeAntiguedad} onChange={(e) => updateField('socioConyugeAntiguedad', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                                <div><label style={labelStyle}>39) Ingreso mensual neto</label><input type="number" value={formData.socioConyugeIngreso} onChange={(e) => updateField('socioConyugeIngreso', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }} /></div>
                                            </div>
                                        </div>

                                        {/* 40 y SIGUIENTES */}
                                        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2rem' }}>
                                            <label style={{ ...labelStyle, fontSize: '13px' }}>40) ¿Otro miembro de su familia aporta al ingreso familiar?</label>
                                            <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}><input type="radio" checked={formData.socioOtrosAportan === 'SI'} onChange={() => updateField('socioOtrosAportan', 'SI')} /> Si ( )</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}><input type="radio" checked={formData.socioOtrosAportan === 'NO'} onChange={() => updateField('socioOtrosAportan', 'NO')} /> No ( )</label>
                                            </div>
                                        </div>

                                        <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b', margin: 0 }}>41) En el caso de ser afirmativa favor de especificar:</h4>
                                                {formData.socioOtrosAportan === 'SI' && (
                                                    <button onClick={addAportadorRow} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Añadir Fila</button>
                                                )}
                                            </div>

                                            {formData.socioOtrosAportan === 'SI' ? (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                                                    <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: 'white' }}><th style={{ padding: '10px 1rem', fontSize: '11px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>Parentesco</th><th style={{ padding: '10px 1rem', fontSize: '11px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>Cantidad mensual aportada</th><th style={{ width: '50px' }}></th></tr></thead>
                                                    <tbody>
                                                        {formData.socioOtrosAportanDetalle.map((row, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '12px 0.5rem' }}><input type="text" value={row.parentesco} onChange={(e) => updateAportadorRow(idx, 'parentesco', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', height: '42px' }} /></td>
                                                                <td style={{ padding: '12px 0.5rem' }}><div style={{ position: 'relative' }}><DollarSign size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="number" value={row.cantidad} onChange={(e) => updateAportadorRow(idx, 'cantidad', e.target.value)} style={{ ...inputStyle, paddingLeft: '2rem', height: '42px' }} /></div></td>
                                                                <td style={{ textAlign: 'center' }}><button onClick={() => removeAportadorRow(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                                                            </tr>
                                                        ))}
                                                        {formData.socioOtrosAportanDetalle.length === 0 && (
                                                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>Da clic en "Añadir Fila" para registrar las aportaciones familiares.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '16px', color: '#94a3b8', fontSize: '13px', marginBottom: '2rem' }}>
                                                    Indica "Si" en la pregunta 40 para desglosar las aportaciones.
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                                                <table style={{ borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12px', minWidth: '180px', backgroundColor: 'white' }}>
                                                    <tbody>
                                                        {[['1 integrante', '0'], ['2 integrantes', '1'], ['3 integrantes', '2'], ['4 integrantes', '3']].map(([name, code]) => (
                                                            <tr key={code}><td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: '600' }}>{name}</td><td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', fontWeight: '800' }}>{code}</td></tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                                                    <label style={{ ...labelStyle, fontSize: '10px', lineHeight: '1.4' }}>42) Anotar en el recuadro la numeración correspondiente a la cantidad de integrantes, en caso de que algún miembro de la familia aporte al ingreso familiar:</label>
                                                    <input type="text" maxLength={1} value={formData.socioIntegrantesAportan} onChange={(e) => updateField('socioIntegrantesAportan', e.target.value.replace(/[^0-3]/g, ''))} style={{ width: '60px', height: '60px', borderRadius: '12px', border: '2px solid #f59e0b', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: '#92400e', outline: 'none', backgroundColor: 'white' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3.5: III. INGRESOS Y EGRESOS MENSUALES (43-45) */}
                                {currentSubStep === 5 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#e11d48', borderRadius: '4px' }} /> III. INGRESOS Y EGRESOS MENSUALES
                                        </h2>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr) 200px', gap: '2rem', alignItems: 'start' }}>

                                            {/* TABLA INGRESOS */}
                                            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                <div style={{ backgroundColor: '#f8fafc', padding: '12px 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#475569', margin: 0, textTransform: 'uppercase' }}>Ingresos Mensuales</h3>
                                                    <button onClick={addIngresoOtroRow} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>+ Añadir Otros</button>
                                                </div>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <tbody>
                                                        {[
                                                            { label: 'Solicitante', field: 'socioIngresoSolicitante' },
                                                            { label: 'Esposo (a)', field: 'socioIngresoEsposo' },
                                                            { label: 'Hijos (as)', field: 'socioIngresoHijos' },
                                                        ].map((row, i) => (
                                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '10px 1rem', fontSize: '13px', fontWeight: '700', color: '#1e293b', backgroundColor: '#fcfcfc', width: '45%' }}>{row.label}</td>
                                                                <td style={{ padding: '6px 1rem' }}>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <span style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', fontWeight: '800' }}>$</span>
                                                                        <input type="number" value={formData[row.field as keyof typeof formData] as string} onChange={(e) => updateField(row.field, e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 4px 8px 12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', outline: 'none' }} />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {formData.socioIngresosOtrosDetalle.map((row, idx) => (
                                                            <tr key={`otro-in-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '4px 8px', backgroundColor: '#fcfcfc' }}>
                                                                    <input type="text" placeholder="Concepto (43)" value={row.concepto} onChange={(e) => updateIngresoOtroRow(idx, 'concepto', e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', fontSize: '12px', fontWeight: '600', outline: 'none' }} />
                                                                </td>
                                                                <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <div style={{ position: 'relative', flex: 1 }}>
                                                                        <span style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px', fontWeight: '800' }}>$</span>
                                                                        <input type="number" value={row.cantidad} onChange={(e) => updateIngresoOtroRow(idx, 'cantidad', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 4px 8px 12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', outline: 'none' }} />
                                                                    </div>
                                                                    <button onClick={() => removeIngresoOtroRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr style={{ backgroundColor: '#eff6ff' }}>
                                                            <td style={{ padding: '12px 1rem', fontSize: '13px', fontWeight: '900', color: '#1e40af' }}>TOTAL</td>
                                                            <td style={{ padding: '12px 1rem', fontSize: '15px', fontWeight: '900', color: '#1e40af' }}>
                                                                $ {(
                                                                    (parseFloat(formData.socioIngresoSolicitante) || 0) +
                                                                    (parseFloat(formData.socioIngresoEsposo) || 0) +
                                                                    (parseFloat(formData.socioIngresoHijos) || 0) +
                                                                    formData.socioIngresosOtrosDetalle.reduce((acc, curr) => acc + (parseFloat(curr.cantidad) || 0), 0)
                                                                ).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* TABLA EGRESOS */}
                                            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                <div style={{ backgroundColor: '#f8fafc', padding: '12px 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#475569', margin: 0, textTransform: 'uppercase' }}>Egresos Mensuales</h3>
                                                    <button onClick={addEgresoOtroRow} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#e11d48', color: 'white', border: 'none', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>+ Añadir Otros</button>
                                                </div>
                                                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <tbody>
                                                            {[
                                                                { label: 'Alimentación', field: 'socioEgresoAlimentacion' },
                                                                { label: 'Renta o Predio', field: 'socioEgresoRenta' },
                                                                { label: 'Luz', field: 'socioEgresoLuz' },
                                                                { label: 'Agua', field: 'socioEgresoAgua' },
                                                                { label: 'Combustible', field: 'socioEgresoCombustible' },
                                                                { label: 'Transporte (44)', field: 'socioEgresoTransporte' },
                                                                { label: 'Educación', field: 'socioEgresoEducacion' },
                                                                { label: 'Teléfono', field: 'socioEgresoTelefono' },
                                                                { label: 'Gastos Médicos', field: 'socioEgresoMedicos' },
                                                                { label: 'Esparcimiento', field: 'socioEgresoEsparcimiento' },
                                                            ].map((row, i) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '10px 1rem', fontSize: '13px', fontWeight: '700', color: '#1e293b', backgroundColor: '#fcfcfc', width: '55%' }}>{row.label}</td>
                                                                    <td style={{ padding: '6px 1rem' }}>
                                                                        <div style={{ position: 'relative' }}>
                                                                            <span style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', fontWeight: '800' }}>$</span>
                                                                            <input type="number" value={formData[row.field as keyof typeof formData] as string} onChange={(e) => updateField(row.field, e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 4px 8px 12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', outline: 'none' }} />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {formData.socioEgresosOtrosDetalle.map((row, idx) => (
                                                                <tr key={`otro-eg-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                    <td style={{ padding: '4px 8px', backgroundColor: '#fcfcfc' }}>
                                                                        <input type="text" placeholder="Otro concepto" value={row.concepto} onChange={(e) => updateEgresoOtroRow(idx, 'concepto', e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', fontSize: '12px', fontWeight: '600', outline: 'none' }} />
                                                                    </td>
                                                                    <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                                            <span style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px', fontWeight: '800' }}>$</span>
                                                                            <input type="number" value={row.cantidad} onChange={(e) => updateEgresoOtroRow(idx, 'cantidad', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 4px 8px 12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', outline: 'none' }} />
                                                                        </div>
                                                                        <button onClick={() => removeEgresoOtroRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr style={{ backgroundColor: '#fff1f2', position: 'sticky', bottom: 0 }}>
                                                                <td style={{ padding: '12px 1rem', fontSize: '13px', fontWeight: '900', color: '#9f1239' }}>TOTAL</td>
                                                                <td style={{ padding: '12px 1rem', fontSize: '15px', fontWeight: '900', color: '#9f1239' }}>
                                                                    $ {(
                                                                        ['socioEgresoAlimentacion', 'socioEgresoRenta', 'socioEgresoLuz', 'socioEgresoAgua', 'socioEgresoCombustible', 'socioEgresoTransporte', 'socioEgresoEducacion', 'socioEgresoTelefono', 'socioEgresoMedicos', 'socioEgresoEsparcimiento'].reduce((acc, field) => acc + (parseFloat(formData[field as keyof typeof formData] as string) || 0), 0) +
                                                                        formData.socioEgresosOtrosDetalle.reduce((acc, curr) => acc + (parseFloat(curr.cantidad) || 0), 0)
                                                                    ).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* PUNTO 45: BALANCE */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <tbody>
                                                            <tr><td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', fontWeight: '700' }}>Déficit</td><td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: '900', width: '30px', backgroundColor: 'white' }}>0</td></tr>
                                                            <tr><td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', fontWeight: '700' }}>Superávit</td><td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: '900', backgroundColor: 'white' }}>1</td></tr>
                                                        </tbody>
                                                    </table>
                                                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                        <label style={{ ...labelStyle, textAlign: 'center', fontSize: '11px', color: '#1e293b' }}>45) COD. BALANCE</label>
                                                        <input type="text" maxLength={1} value={formData.socioBalanceCod} onChange={(e) => updateField('socioBalanceCod', e.target.value.replace(/[^0-1]/g, ''))} style={{ width: '80px', height: '80px', borderRadius: '20px', border: '3px solid #e11d48', textAlign: 'center', fontSize: '36px', fontWeight: '900', color: '#9f1239', outline: 'none', backgroundColor: '#fff1f2' }} />
                                                    </div>
                                                </div>

                                                <div style={{ padding: '1.25rem', borderRadius: '16px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: '600', lineHeight: '1.5' }}>
                                                    <strong>💡 Tip de Trabajo Social:</strong>
                                                    <p style={{ margin: '8px 0 0', fontWeight: '500', opacity: 0.9 }}>Si los egresos son mayores a los ingresos, marque 0 (Déficit). Si hay ahorro o balance positivo, marque 1 (Superávit).</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3.6: IV. TRANSPORTE (46-49) */}
                                {currentSubStep === 6 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }} /> IV. TRANSPORTE
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3rem', marginBottom: '2rem' }}>
                                                {/* 46: TIENE AUTO */}
                                                <div>
                                                    <label style={{ ...labelStyle, fontSize: '13px' }}>46) ¿Cuenta con automóvil?</label>
                                                    <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1rem' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                                            <input type="radio" checked={formData.socioTieneAuto === 'SI'} onChange={() => updateField('socioTieneAuto', 'SI')} style={{ width: '18px', height: '18px' }} /> Sí
                                                        </label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                                            <input type="radio" checked={formData.socioTieneAuto === 'NO'} onChange={() => updateField('socioTieneAuto', 'NO')} style={{ width: '18px', height: '18px' }} /> No
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* 47: CANTIDAD */}
                                                <div>
                                                    <label style={{ ...labelStyle, fontSize: '13px' }}>47) Cantidad</label>
                                                    <input 
                                                        type="number" 
                                                        value={formData.socioCantAutos} 
                                                        onChange={(e) => handleCantAutosChange(e.target.value)} 
                                                        placeholder="0"
                                                        style={{ ...inputStyle, paddingLeft: '1rem', width: '120px', height: '50px', fontSize: '18px', textAlign: 'center' }} 
                                                    />
                                                </div>
                                            </div>

                                            {/* 48: DETALLE TABLA DINAMICA */}
                                            {formData.socioAutosDetalle.length > 0 && (
                                                <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                                                    <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#475569', marginBottom: '1.5rem', textTransform: 'uppercase' }}>48) Especificaciones de vehículos</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        {formData.socioAutosDetalle.map((auto, idx) => (
                                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                                <div>
                                                                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>MARCA</label>
                                                                    <input type="text" value={auto.marca} onChange={(e) => updateAutoRow(idx, 'marca', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', height: '42px', fontSize: '13px' }} />
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>MODELO</label>
                                                                    <input type="text" value={auto.modelo} onChange={(e) => updateAutoRow(idx, 'modelo', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', height: '42px', fontSize: '13px' }} />
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>PROPIETARIO</label>
                                                                    <input type="text" value={auto.propietario} onChange={(e) => updateAutoRow(idx, 'propietario', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', height: '42px', fontSize: '13px' }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 49: CODIGO */}
                                            <div style={{ marginTop: '3rem', display: 'flex', gap: '3rem', alignItems: 'center', borderTop: '2px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                                <table style={{ borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '220px', backgroundColor: 'white' }}>
                                                    <thead><tr style={{ backgroundColor: '#f8fafc' }}><th style={{ border: '1px solid #cbd5e1', padding: '10px' }}>TRANSPORTE</th><th style={{ border: '1px solid #cbd5e1', padding: '10px' }}>Cód.</th></tr></thead>
                                                    <tbody>
                                                        {[
                                                            { label: 'Ninguno', cod: '0' },
                                                            { label: '1-2 auto', cod: '1' },
                                                            { label: 'Más de 2 autos', cod: '2' },
                                                        ].map((row, i) => (
                                                            <tr key={i}>
                                                                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: '600' }}>{row.label}</td>
                                                                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'center', fontWeight: '900' }}>{row.cod}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                                    <label style={{ ...labelStyle, textAlign: 'center' }}>49) Cód. Transporte</label>
                                                    <input 
                                                        type="text" 
                                                        maxLength={1} 
                                                        value={formData.socioAutoCod} 
                                                        onChange={(e) => updateField('socioAutoCod', e.target.value.replace(/[^0-2]/g, ''))} 
                                                        style={{ width: '80px', height: '80px', borderRadius: '20px', border: '3px solid #3b82f6', textAlign: 'center', fontSize: '32px', fontWeight: '900', color: '#1e40af', outline: 'none', backgroundColor: '#eff6ff' }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3.7: V. SALUD Y ADICCIONES (50-53) */}
                                {currentSubStep === 7 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#e11d48', borderRadius: '4px' }} /> III. SALUD Y ADICCIONES
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <div style={{ marginBottom: '2.5rem' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>50) Asistencia Médica</h3>
                                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem', fontWeight: '500' }}>Marcar con una (x) el lugar donde recibe la asistencia médica el solicitante y los miembros de su familia:</p>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                    {[
                                                        { label: 'ISSSTE', field: 'socioSaludIssste' },
                                                        { label: 'IMSS', field: 'socioSaludImss' },
                                                        { label: 'Seguro Popular', field: 'socioSaludSeguroPopular' },
                                                        { label: 'Consulta particular', field: 'socioSaludParticular' },
                                                        { label: 'Otros', field: 'socioSaludOtrosCheck' },
                                                    ].map((item, idx) => (
                                                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: '12px', border: formData[item.field as keyof typeof formData] ? '2px solid #3b82f6' : '1px solid #e2e8f0', backgroundColor: formData[item.field as keyof typeof formData] ? '#eff6ff' : 'white', transition: 'all 0.2s' }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formData[item.field as keyof typeof formData] as boolean} 
                                                                onChange={(e) => updateField(item.field, e.target.checked)} 
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <span style={{ fontSize: '14px', fontWeight: '700', color: formData[item.field as keyof typeof formData] ? '#1e40af' : '#475569' }}>{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                                                {/* 51: SOLO SI ES PARTICULAR */}
                                                <div style={{ opacity: formData.socioSaludParticular ? 1 : 0.4, pointerEvents: formData.socioSaludParticular ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                                                    <label style={labelStyle}>51) Monto en consultas (si es particular)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                        <input 
                                                            type="number" 
                                                            disabled={!formData.socioSaludParticular} 
                                                            value={formData.socioSaludMontoConsultas} 
                                                            onChange={(e) => updateField('socioSaludMontoConsultas', e.target.value)} 
                                                            style={inputStyle} 
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                {/* 52: SOLO SI ES OTROS */}
                                                <div style={{ opacity: formData.socioSaludOtrosCheck ? 1 : 0.4, pointerEvents: formData.socioSaludOtrosCheck ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                                                    <label style={labelStyle}>52) Especificar Otros</label>
                                                    <input 
                                                        type="text" 
                                                        disabled={!formData.socioSaludOtrosCheck} 
                                                        value={formData.socioSaludOtros} 
                                                        onChange={(e) => updateField('socioSaludOtros', e.target.value)} 
                                                        style={{ ...inputStyle, paddingLeft: '1rem' }} 
                                                        placeholder="Nombre de la institución"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ maxWidth: '450px' }}>
                                                    <label style={{ ...labelStyle, fontSize: '13px', color: '#0f172a', marginBottom: '8px' }}>53) ¿Cuántos miembros de la familia cuentan con asistencia médica?</label>
                                                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '-4px', marginBottom: '1rem', fontStyle: 'italic' }}>Indique la cantidad exacta de integrantes con derechohabiencia.</p>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={formData.socioSaludIntegrantesConAsistencia} 
                                                    onChange={(e) => updateField('socioSaludIntegrantesConAsistencia', e.target.value)} 
                                                    style={{ ...inputStyle, paddingLeft: '1rem', width: '100px', height: '60px', textAlign: 'center', fontSize: '24px', fontWeight: '900', border: '2px solid #cbd5e1' }} 
                                                />
                                            </div>

                                            {/* SECCION ADICCIONES (Punto 54-55) DINAMICA */}
                                            <div style={{ marginTop: '3.5rem', borderTop: '2px solid #f1f5f9', paddingTop: '3rem' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '1.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Briefcase size={16} /> 54) ADICCIONES:
                                                </h3>
                                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2rem', fontWeight: '500' }}>Anotar tipo de adicción, cantidad y frecuencia de consumo que padece tanto el paciente como algún otro miembro cercano.</p>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 3rem', marginBottom: '3rem' }}>
                                                    {formData.socioAdiccionesDetalle.map((adic, idx) => (
                                                        <div key={idx}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                <label style={{ fontSize: '11px', fontWeight: '900', color: adic.nombre === 'ALCOHOL' || adic.nombre === 'CRISTAL' ? '#3b82f6' : '#475569', textTransform: 'uppercase' }}>{adic.nombre}</label>
                                                                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>CANTIDAD Y FRECUENCIA</span>
                                                            </div>
                                                            <input 
                                                                type="text"
                                                                value={adic.cantidadFrecuencia}
                                                                onChange={(e) => updateAdiccionDetalle(idx, e.target.value)}
                                                                placeholder="..."
                                                                style={{ ...inputStyle, paddingLeft: '1rem', height: '42px', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ backgroundColor: '#fff7ed', padding: '2rem', borderRadius: '20px', border: '1px solid #fed7aa' }}>
                                                    <label style={{ ...labelStyle, color: '#9a3412', marginBottom: '1rem' }}>55) Relación Familiar (Describa)</label>
                                                    <p style={{ fontSize: '12px', color: '#c2410c', marginBottom: '1.5rem', fontWeight: '500' }}>Describir en resumen la relación familiar del solicitante y la familia con el paciente.</p>
                                                    <textarea 
                                                        value={formData.socioRelacionFamiliar} 
                                                        onChange={(e) => updateField('socioRelacionFamiliar', e.target.value)} 
                                                        placeholder="Detalle la dinámica familiar..."
                                                        style={{ ...inputStyle, paddingLeft: '1rem', height: '120px', resize: 'none', backgroundColor: 'white' }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DIVISIÓN 8: VIVIENDA (56-64) */}
                                {currentSubStep === 8 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#8b5cf6', borderRadius: '4px' }} /> IV. VIVIENDA
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem', textTransform: 'uppercase' }}>RÉGIMEN DE VIVIENDA</h3>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                                                {/* 56: Regimen */}
                                                <div>
                                                    <label style={labelStyle}>56) Régimen de Vivienda</label>
                                                    <select value={formData.socioViviendaRegimenCod} onChange={(e) => updateField('socioViviendaRegimenCod', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}>
                                                        <option value="">Seleccione...</option>
                                                        <option value="0">Sin vivienda / Familiar / Prestada / Rentada (0)</option>
                                                        <option value="1">Propia (1)</option>
                                                        <option value="2">Más de 1 vivienda (2)</option>
                                                    </select>
                                                </div>
                                                {/* 57: Tipo */}
                                                <div>
                                                    <label style={labelStyle}>57) Tipo de Vivienda</label>
                                                    <select value={formData.socioViviendaTipoCod} onChange={(e) => updateField('socioViviendaTipoCod', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}>
                                                        <option value="">Seleccione...</option>
                                                        <option value="0">Vecindad / Condominio / Interés Social / Casa (0)</option>
                                                        <option value="1">Residencial M. (1)</option>
                                                        <option value="2">Residencial A. (2)</option>
                                                    </select>
                                                </div>
                                                {/* 58: Espacio */}
                                                <div>
                                                    <label style={labelStyle}>58) Espacio (Habitaciones)</label>
                                                    <select value={formData.socioViviendaEspacioCod} onChange={(e) => updateField('socioViviendaEspacioCod', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}>
                                                        <option value="">Seleccione...</option>
                                                        <option value="0">1 solo cuarto / 2 dormitorios (0)</option>
                                                        <option value="1">3 dormitorios / 4 dormitorios (1)</option>
                                                        <option value="2">Más de 4 (2)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2.5rem', marginBottom: '3rem' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem', textTransform: 'uppercase' }}>59) CARACTERÍSTICAS DE LA VIVIENDA:</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                                                    <div onClick={() => updateField('socioViviendaSala', !formData.socioViviendaSala)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: formData.socioViviendaSala ? '#f0f9ff' : 'transparent', borderLeft: formData.socioViviendaSala ? '4px solid #3b82f6' : '1px solid #e2e8f0' }}>
                                                        <div style={{ width: '20px', height: '20px', border: '2px solid #3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {formData.socioViviendaSala && <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '1px' }} />}
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>SALA</span>
                                                    </div>
                                                    <div onClick={() => updateField('socioViviendaComedor', !formData.socioViviendaComedor)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: formData.socioViviendaComedor ? '#f0f9ff' : 'transparent', borderLeft: formData.socioViviendaComedor ? '4px solid #3b82f6' : '1px solid #e2e8f0' }}>
                                                        <div style={{ width: '20px', height: '20px', border: '2px solid #3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {formData.socioViviendaComedor && <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '1px' }} />}
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>COMEDOR</span>
                                                    </div>
                                                    <div onClick={() => updateField('socioViviendaCocina', !formData.socioViviendaCocina)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: formData.socioViviendaCocina ? '#f0f9ff' : 'transparent', borderLeft: formData.socioViviendaCocina ? '4px solid #3b82f6' : '1px solid #e2e8f0' }}>
                                                        <div style={{ width: '20px', height: '20px', border: '2px solid #3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {formData.socioViviendaCocina && <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '1px' }} />}
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>COCINA</span>
                                                    </div>
                                                    <div onClick={() => updateField('socioViviendaJardin', !formData.socioViviendaJardin)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: formData.socioViviendaJardin ? '#f0f9ff' : 'transparent', borderLeft: formData.socioViviendaJardin ? '4px solid #3b82f6' : '1px solid #e2e8f0' }}>
                                                        <div style={{ width: '20px', height: '20px', border: '2px solid #3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {formData.socioViviendaJardin && <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '1px' }} />}
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>JARDÍN</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'end' }}>
                                                    <div>
                                                        <label style={labelStyle}>60) Baños (Cantidad / Otros)</label>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {['1', '2', '3', '4', 'Otro'].map(opt => (
                                                                <button key={opt} onClick={() => updateField('socioViviendaBanios', opt)} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: formData.socioViviendaBanios === opt ? '#3b82f6' : 'white', color: formData.socioViviendaBanios === opt ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>{opt}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Especifique otro servicio..."
                                                            disabled={formData.socioViviendaBanios !== 'Otro'}
                                                            value={formData.socioViviendaBaniosOtro}
                                                            onChange={(e) => updateField('socioViviendaBaniosOtro', e.target.value)}
                                                            style={{ ...inputStyle, paddingLeft: '1rem', opacity: formData.socioViviendaBanios === 'Otro' ? 1 : 0.5 }}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '2rem' }}>
                                                    <label style={labelStyle}>61) Otros (Especifique):</label>
                                                    <textarea 
                                                        value={formData.socioViviendaOtrosChar}
                                                        onChange={(e) => updateField('socioViviendaOtrosChar', e.target.value)}
                                                        placeholder="Otras características no mencionadas..."
                                                        style={{ ...inputStyle, paddingLeft: '1rem', height: '60px', resize: 'none' }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '2rem', textTransform: 'uppercase' }}>MATERIAL DE CONSTRUCCIÓN</h3>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                                    {/* 62: PISO */}
                                                    <div>
                                                        <label style={labelStyle}>62) Material de Piso</label>
                                                        <select value={formData.socioViviendaPisoCod} onChange={(e) => updateField('socioViviendaPisoCod', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem' }}>
                                                            <option value="">Seleccione...</option>
                                                            <option value="0">Tierra / Concreto / Mosaico (0)</option>
                                                            <option value="1">Vitropiso (1)</option>
                                                            <option value="2">Otros (2)</option>
                                                        </select>
                                                    </div>
                                                    {/* 63: MUROS */}
                                                    <div style={{ position: 'relative' }}>
                                                        <label style={labelStyle}>63) Material de Muros</label>
                                                        <select value={formData.socioViviendaMurosCod} onChange={(e) => updateField('socioViviendaMurosCod', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', marginBottom: '8px' }}>
                                                            <option value="">Seleccione...</option>
                                                            <option value="0">Adobe / Tabique (0)</option>
                                                            <option value="1">Concreto (1)</option>
                                                            <option value="Otros">Otros (Especifique)</option>
                                                        </select>
                                                        {formData.socioViviendaMurosCod === 'Otros' && (
                                                            <input type="text" placeholder="Especifique..." value={formData.socioViviendaMurosOtro} onChange={(e) => updateField('socioViviendaMurosOtro', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', height: '36px', fontSize: '12px' }} />
                                                        )}
                                                    </div>
                                                    {/* 64: TECHO */}
                                                    <div style={{ position: 'relative' }}>
                                                        <label style={labelStyle}>64) Material de Techo</label>
                                                        <select value={formData.socioViviendaTechoCod} onChange={(e) => updateField('socioViviendaTechoCod', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', marginBottom: '8px' }}>
                                                            <option value="">Seleccione...</option>
                                                            <option value="0">Lámina cartón / asbesto (0)</option>
                                                            <option value="1">Concreto (1)</option>
                                                            <option value="Otros">Otros (Especifique)</option>
                                                        </select>
                                                        {formData.socioViviendaTechoCod === 'Otros' && (
                                                            <input type="text" placeholder="Especifique..." value={formData.socioViviendaTechoOtro} onChange={(e) => updateField('socioViviendaTechoOtro', e.target.value)} style={{ ...inputStyle, paddingLeft: '1rem', height: '36px', fontSize: '12px' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DIVISIÓN 9: ALIMENTACIÓN (65) */}
                                {currentSubStep === 9 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#ec4899', borderRadius: '4px' }} /> V. ALIMENTACIÓN
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>65) FRECUENCIA CON QUE LO CONSUME</h3>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2.5rem', fontWeight: '500' }}>Marque la frecuencia dominante para cada tipo de alimento mencionado.</p>

                                            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                                            <th style={{ padding: '1.2rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '250px' }}>TIPO DE ALIMENTO</th>
                                                            {['DIARIO', 'C/ TERCER DIA', '1 VEZ A LA SEMANA', '1 VEZ AL MES', 'OCASIONALMENTE'].map(col => (
                                                                <th key={col} style={{ padding: '1.2rem', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{col}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.socioAlimentacionDetalle.map((row, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '1.2rem', fontSize: '13px', fontWeight: '800', color: '#1e293b', backgroundColor: '#fafafa' }}>{row.tipo}</td>
                                                                {['DIARIO', 'C/ TERCER DIA', '1 VEZ A LA SEMANA', '1 VEZ AL MES', 'OCASIONALMENTE'].map(frec => (
                                                                    <td key={frec} onClick={() => updateAlimentacionFrecuencia(idx, frec)} style={{ padding: '0', textAlign: 'center', cursor: 'pointer', backgroundColor: row.frecuencia === frec ? '#fdf2f8' : 'white', transition: 'background-color 0.2s' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}>
                                                                            <div style={{ width: '22px', height: '22px', border: '2px solid #ec4899', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: row.frecuencia === frec ? '#ec4899' : 'transparent', transition: 'all 0.2s' }}>
                                                                                {row.frecuencia === frec && <Check size={14} color="white" />}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                 {/* DIVISIÓN 10: REFERENCIAS PERSONALES (66) */}
                                {currentSubStep === 10 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }} /> V. REFERENCIAS PERSONALES
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '1.25rem', textTransform: 'uppercase' }}>66) Referencias Personales</h3>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2.5rem', fontWeight: '500' }}>Anotar dos referencias personales del solicitante: nombre completo, teléfono, relación y tiempo de conocerse.</p>

                                            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#fcfcfc' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: 'white', borderBottom: '2px solid #e2e8f0' }}>
                                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>Nombre</th>
                                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>Teléfono</th>
                                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>Relación</th>
                                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>Tiempo de conocerse</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.socioReferenciasDetalle.map((ref, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                                                                <td style={{ padding: '12px' }}>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <User size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                                        <input type="text" value={ref.nombre} onChange={(e) => updateReferenciaRow(idx, 'nombre', e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem', height: '42px', fontSize: '13px', borderRadius: '10px' }} placeholder={idx === 0 ? "Referencia 1" : "Referencia 2"} />
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <Phone size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                                        <input type="text" value={ref.telefono} onChange={(e) => updateReferenciaRow(idx, 'telefono', e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem', height: '42px', fontSize: '13px', borderRadius: '10px' }} placeholder="Teléfono" />
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <Users size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                                        <input type="text" value={ref.relacion} onChange={(e) => updateReferenciaRow(idx, 'relacion', e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem', height: '42px', fontSize: '13px', borderRadius: '10px' }} placeholder="Ej: Amigo, Familiar" />
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <Clock size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                                        <input type="text" value={ref.tiempo} onChange={(e) => updateReferenciaRow(idx, 'tiempo', e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem', height: '42px', fontSize: '13px', borderRadius: '10px' }} placeholder="Ej: 5 años" />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div style={{ marginTop: '2.5rem', backgroundColor: '#eff6ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #dbeafe', color: '#1e40af', fontSize: '12px', lineHeight: '1.5' }}>
                                                <strong>Nota:</strong> Estas referencias son fundamentales para el proceso de validación socioeconómica y contacto en caso de emergencia.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DIVISIÓN 11: DIAGNÓSTICO (67) */}
                                {currentSubStep === 11 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#f59e0b', borderRadius: '4px' }} /> VI. DIAGNÓSTICO
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <textarea 
                                                value={formData.socioDiagEconomico} 
                                                onChange={(e) => updateField('socioDiagEconomico', e.target.value)} 
                                                placeholder="Escriba libremente el diagnóstico económico basado en el tabulador de costos..."
                                                style={{ ...inputStyle, paddingLeft: '1rem', height: '400px', resize: 'none', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* DIVISIÓN 12: OBSERVACIONES DEL TRABAJADOR SOCIAL (68) */}
                                {currentSubStep === 12 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '4px' }} /> VII. OBSERVACIONES DEL TRABAJADOR SOCIAL
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <textarea 
                                                value={formData.socioObsTS} 
                                                onChange={(e) => updateField('socioObsTS', e.target.value)} 
                                                placeholder="68) Escriba aquí las observaciones finales del trabajador social..."
                                                style={{ ...inputStyle, paddingLeft: '1rem', height: '400px', resize: 'none', backgroundColor: '#fcfcfc', border: '1px dotted #3b82f6' }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* DIVISIÓN 13: OBSERVACIONES DE LA VISITA DOMICILIARIA (69) */}
                                {currentSubStep === 13 && (
                                    <div className="animate-fade-in">
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', backgroundColor: '#8b5cf6', borderRadius: '4px' }} /> VIII. OBSERVACIONES DE LA VISITA DOMICILIARIA
                                        </h2>

                                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                                            <textarea 
                                                value={formData.socioEstudioCampo} 
                                                onChange={(e) => updateField('socioEstudioCampo', e.target.value)} 
                                                placeholder="69) Describa los hallazgos de la visita de campo (si aplica)..."
                                                style={{ ...inputStyle, paddingLeft: '1rem', height: '400px', resize: 'none', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* SUB-PASOS EN CONSTRUCCIÓN ... */}
                                {currentSubStep > 13 && (
                                    <div style={{ textAlign: 'center', padding: '10rem 0' }}>
                                        <div style={{ width: '64px', height: '64px', backgroundColor: '#f1f5f9', color: '#94a3b8', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}><List size={32} /></div>
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{socioDivisions.find(d => d.id === currentSubStep)?.title}</h2>
                                        <p style={{ color: '#64748b' }}>Sección en desarrollo administrativo.</p>
                                    </div>
                                )}
                            </div>

                            {/* PIE DE NAVEGACIÓN */}
                            <div style={{ marginTop: '3rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={handleBackStep} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer' }}>Regresar</button>
                                <button onClick={handleNextStep} style={{ padding: '0.8rem 2.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>Siguiente División <ArrowRight size={18} style={{ marginLeft: '8px' }} /></button>
                            </div>
                        </main>
                    </div>
                )}

            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
      `}</style>
        </div>
    );
};

export default NuevoIngresoPage;
