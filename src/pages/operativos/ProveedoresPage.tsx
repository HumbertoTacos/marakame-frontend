import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Search, Plus, X, ChevronRight, Eye, Edit2, ToggleLeft,
  ToggleRight, Upload, Phone, Mail, MapPin, CreditCard, FileText,
  Package, Star, AlertCircle, CheckCircle, XCircle, Filter,
  ExternalLink, Banknote, Globe,
} from 'lucide-react';
import { proveedoresService } from '../../services/proveedores.service';
import type {
  Proveedor, EstadoProveedor, GiroProveedor, TipoPersonaProveedor,
  CondicionesPagoProveedor, MonedaProveedor,
} from '../../types';
import { GiroLabel, CondicionesLabel } from '../../types';

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const GIROS: { value: GiroProveedor; label: string }[] = [
  { value: 'TECNOLOGIA',   label: 'Tecnología' },
  { value: 'PAPELERIA',    label: 'Papelería' },
  { value: 'REFACCIONES',  label: 'Refacciones' },
  { value: 'SERVICIOS',    label: 'Servicios' },
  { value: 'LIMPIEZA',     label: 'Limpieza' },
  { value: 'ALIMENTOS',    label: 'Alimentos' },
  { value: 'MEDICAMENTOS', label: 'Medicamentos' },
  { value: 'OTROS',        label: 'Otros' },
];

const REGIMENES_FISCALES = [
  { value: '601', label: '601 — General de Ley Personas Morales' },
  { value: '603', label: '603 — Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 — Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 — Arrendamiento' },
  { value: '607', label: '607 — Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 — Demás ingresos' },
  { value: '610', label: '610 — Residentes en el Extranjero sin Establecimiento Permanente' },
  { value: '611', label: '611 — Ingresos por Dividendos' },
  { value: '612', label: '612 — Personas Físicas con Actividades Empresariales y Profesionales' },
  { value: '614', label: '614 — Ingresos por Intereses' },
  { value: '615', label: '615 — Ingresos por Obtención de Premios' },
  { value: '616', label: '616 — Sin Obligaciones Fiscales' },
  { value: '620', label: '620 — Sociedades Cooperativas de Producción' },
  { value: '621', label: '621 — Incorporación Fiscal' },
  { value: '622', label: '622 — Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 — Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 — Coordinados' },
  { value: '625', label: '625 — Actividades Empresariales con Plataformas Tecnológicas' },
  { value: '626', label: '626 — Régimen Simplificado de Confianza' },
  { value: '628', label: '628 — Hidrocarburos' },
  { value: '629', label: '629 — Regímenes Fiscales Preferentes y Empresas Multinacionales' },
];

const USOS_CFDI = [
  { value: 'G01', label: 'G01 — Adquisición de mercancías' },
  { value: 'G02', label: 'G02 — Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 — Gastos en general' },
  { value: 'I01', label: 'I01 — Construcciones' },
  { value: 'I02', label: 'I02 — Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 — Equipo de transporte' },
  { value: 'I04', label: 'I04 — Equipo de cómputo y accesorios' },
  { value: 'I05', label: 'I05 — Dados, troqueles, moldes y herramental' },
  { value: 'I06', label: 'I06 — Comunicaciones telefónicas' },
  { value: 'I07', label: 'I07 — Comunicaciones satelitales' },
  { value: 'I08', label: 'I08 — Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 — Honorarios médicos y gastos hospitalarios' },
  { value: 'D03', label: 'D03 — Gastos funerales' },
  { value: 'D04', label: 'D04 — Donativos' },
  { value: 'D07', label: 'D07 — Primas por seguros de gastos médicos' },
  { value: 'D10', label: 'D10 — Pagos por servicios educativos' },
  { value: 'S01', label: 'S01 — Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 — Pagos' },
  { value: 'CN01', label: 'CN01 — Nómina' },
];

const METODOS_PAGO_SAT = [
  { value: 'PUE', label: 'PUE — Pago en una sola exhibición' },
  { value: 'PPD', label: 'PPD — Pago en parcialidades o diferido' },
];

const FORMAS_PAGO = [
  'Transferencia bancaria',
  'Efectivo',
  'Cheque nominativo',
  'Tarjeta de débito',
  'Tarjeta de crédito',
  'Depósito bancario',
  'Domiciliación bancaria',
];

const BANCOS_MX = [
  'BBVA', 'Banamex (Citibanamex)', 'HSBC', 'Santander', 'Banorte',
  'Scotiabank', 'Inbursa', 'Afirme', 'BanBajío', 'Banco Azteca',
  'Invex', 'Mifel', 'CI Banco', 'Multiva', 'Hey Banco', 'Otro',
];

const TIEMPOS_ENTREGA = [
  '1-3 días hábiles',
  '3-5 días hábiles',
  '5-10 días hábiles',
  '10-15 días hábiles',
  '15-30 días',
  'Más de 30 días',
  'Inmediato (mismo día)',
  'Bajo pedido',
];

const RETENCIONES_OPTS = [
  'Ninguna',
  'IVA',
  'ISR',
  'IEPS',
  'IVA + ISR',
  'IVA + IEPS',
  'ISR + IEPS',
];

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Guanajuato',
  'Guerrero','Hidalgo','Jalisco','México','Michoacán','Morelos','Nayarit',
  'Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí',
  'Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
];

const estadoBadge = (estado: EstadoProveedor) => {
  if (estado === 'ACTIVO')   return { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', label: 'Activo' };
  if (estado === 'INACTIVO') return { bg: '#f8fafc', text: '#64748b', dot: '#94a3b8', label: 'Inactivo' };
  return                            { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', label: 'Bloqueado' };
};

const emptyForm = (): Partial<Proveedor> => ({
  nombre: '', razonSocial: '', rfc: '', curp: '', giro: undefined, tipoPersona: undefined,
  estadoProveedor: 'ACTIVO',
  contactoPrincipal: '', cargoContacto: '', telefono: '', celular: '', correo: '', paginaWeb: '',
  pais: 'México', estadoRepublica: '', ciudad: '', colonia: '', calle: '',
  numExterior: '', numInterior: '', codigoPostal: '', referencias: '',
  banco: '', cuentaBancaria: '', clabe: '', metodoPago: '',
  condicionesPago: undefined, moneda: 'MXN',
  regimenFiscal: '', usoCFDI: '', metodoFacturacion: '', retencionesAplicables: '',
  productosServicios: '', marcas: '', tiempoEntregaPromedio: '', garantias: '', convenios: '',
  calificacion: undefined, observaciones: '', notas: '',
});

// ─── HELPERS UI ───────────────────────────────────────────────────────────────

const Inp = ({
  label, required, ...rest
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    <input
      {...rest}
      style={{
        padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        background: rest.disabled ? '#f8fafc' : 'white',
        ...rest.style,
      }}
    />
  </div>
);

const Sel = ({
  label, required, children, ...rest
}: { label: string; required?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    <select
      {...rest}
      style={{
        padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        background: 'white', cursor: 'pointer',
      }}
    >
      {children}
    </select>
  </div>
);

const Txt = ({
  label, required, ...rest
}: { label: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    <textarea
      {...rest}
      rows={3}
      style={{
        padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        resize: 'vertical', fontFamily: 'inherit',
      }}
    />
  </div>
);

const Grid2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>{children}</div>
);

const Grid3 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>{children}</div>
);

const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ color: '#3b82f6' }}>{icon}</span>
    <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{children}</span>
  </div>
);

// ─── MODAL BASE ───────────────────────────────────────────────────────────────

const ModalBase = ({ children, onClose, title, width = 860 }: { children: React.ReactNode; onClose: () => void; title: string; width?: number }) =>
  createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 10000, backdropFilter: 'blur(4px)', padding: '1rem',
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: width,
        maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)', margin: 'auto',
      }}>
        <div style={{
          padding: '1.1rem 1.5rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{title}</div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 10,
            padding: 8, cursor: 'pointer', display: 'flex',
          }}>
            <X size={16} color="#64748b" />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>,
    document.body,
  );

// ─── FORMULARIO PROVEEDOR ─────────────────────────────────────────────────────

type FormTab = 'general' | 'contacto' | 'direccion' | 'bancaria' | 'fiscal' | 'productos' | 'docs' | 'internos';

const FORM_TABS: { key: FormTab; label: string; icon: React.ReactNode; desc: string; requiredFields: string[] }[] = [
  { key: 'general',   label: 'Datos Generales',    icon: <Building2 size={15} />, desc: 'Nombre, RFC, tipo',        requiredFields: ['nombre','razonSocial','rfc'] },
  { key: 'contacto',  label: 'Contacto',            icon: <Phone size={15} />,    desc: 'Teléfono, correo',         requiredFields: ['contactoPrincipal','telefono','correo'] },
  { key: 'direccion', label: 'Dirección Fiscal',    icon: <MapPin size={15} />,   desc: 'Domicilio registrado',     requiredFields: ['codigoPostal'] },
  { key: 'bancaria',  label: 'Info. Bancaria',      icon: <CreditCard size={15}/>, desc: 'Banco, CLABE, pagos',     requiredFields: ['banco','clabe'] },
  { key: 'fiscal',    label: 'Info. Fiscal',        icon: <FileText size={15} />, desc: 'Régimen, CFDI',            requiredFields: ['regimenFiscal'] },
  { key: 'productos', label: 'Productos/Servicios', icon: <Package size={15} />,  desc: 'Catálogo, marcas',         requiredFields: [] },
  { key: 'docs',      label: 'Documentos',          icon: <Upload size={15} />,   desc: 'INE, constancias, contratos', requiredFields: [] },
  { key: 'internos',  label: 'Datos Internos',      icon: <Star size={15} />,     desc: 'Calificación, notas',      requiredFields: [] },
];

const ProveedorForm = ({
  form, onChange, onFileUpload, savingDoc, providerId, errors, tab, setTab,
}: {
  form: Partial<Proveedor>;
  onChange: (field: string, value: unknown) => void;
  onFileUpload?: (tipo: string, file: File) => void;
  savingDoc?: string | null;
  providerId?: number;
  errors: Record<string, string>;
  tab: FormTab;
  setTab: (t: FormTab) => void;
}) => {
  const f = (field: keyof Proveedor) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange(field, e.target.value);

  const err = (field: string) => errors[field] ? (
    <span style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{errors[field]}</span>
  ) : null;

  const tabIdx  = FORM_TABS.findIndex(t => t.key === tab);
  const hasPrev = tabIdx > 0;
  const hasNext = tabIdx < FORM_TABS.length - 1;

  const DocField = ({ tipo, label, urlField }: { tipo: string; label: string; urlField: keyof Proveedor }) => {
    const url = form[urlField] as string | undefined;
    return (
      <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0', padding: '1rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{label}</div>
        {url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} color="#22c55e" />
            <a href={`http://localhost:3000${url}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver documento <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Sin archivo</div>
        )}
        {onFileUpload && providerId && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#374151', fontWeight: 600 }}>
            <Upload size={12} />
            {savingDoc === tipo ? 'Subiendo...' : url ? 'Reemplazar' : 'Subir archivo'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={savingDoc === tipo}
              onChange={e => { const file = e.target.files?.[0]; if (file) onFileUpload(tipo, file); }} />
          </label>
        )}
        {!providerId && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Guarda el proveedor primero para subir documentos.</div>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* ── SIDEBAR DE NAVEGACIÓN LATERAL ── */}
      <nav style={{
        width: 210, flexShrink: 0, borderRight: '1px solid #f1f5f9',
        background: '#fafafa', display: 'flex', flexDirection: 'column',
        padding: '1rem 0.75rem', gap: 2, overflowY: 'auto',
      }}>
        {FORM_TABS.map((t, i) => {
          const isActive  = tab === t.key;
          const hasError  = t.requiredFields.some(f => errors[f]);
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.65rem 0.75rem', borderRadius: 12,
                border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                background: isActive ? '#eff6ff' : 'transparent',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Número de paso */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? '#3b82f6' : hasError ? '#fef2f2' : '#f1f5f9',
                border: isActive ? 'none' : hasError ? '1.5px solid #fca5a5' : 'none',
                fontSize: 11, fontWeight: 800,
                color: isActive ? 'white' : hasError ? '#ef4444' : '#94a3b8',
              }}>
                {hasError ? '!' : i + 1}
              </div>
              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#1d4ed8' : '#374151', lineHeight: 1.2 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 10, color: isActive ? '#60a5fa' : '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.desc}
                </div>
              </div>
              {/* Indicador activo */}
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── CONTENIDO DEL PASO ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header del paso actual */}
        <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'white' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            {FORM_TABS[tabIdx].icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{FORM_TABS[tabIdx].label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Paso {tabIdx + 1} de {FORM_TABS.length}</div>
          </div>
          {/* Barra de progreso */}
          <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 4, marginLeft: 8 }}>
            <div style={{ height: '100%', borderRadius: 4, background: '#3b82f6', width: `${((tabIdx + 1) / FORM_TABS.length) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {Math.round(((tabIdx + 1) / FORM_TABS.length) * 100)}%
          </span>
        </div>

        {/* Campos del paso */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {tab === 'general' && (
          <>
            <SectionTitle icon={<Building2 size={16} />}>Datos Generales</SectionTitle>
            <Grid2>
              <div>
                <Inp label="Nombre comercial" required value={form.nombre ?? ''} onChange={f('nombre')} placeholder="Ej. Tech Solutions" />
                {err('nombre')}
              </div>
              <div>
                <Inp label="Razón social" required value={form.razonSocial ?? ''} onChange={f('razonSocial')} placeholder="Ej. Tech Solutions S.A. de C.V." />
                {err('razonSocial')}
              </div>
            </Grid2>
            <Grid3>
              <div>
                <Inp label="RFC" required value={form.rfc ?? ''} onChange={f('rfc')} placeholder="Ej. XAXX010101000" style={{ textTransform: 'uppercase' }} />
                {err('rfc')}
              </div>
              <Inp label="CURP (opcional)" value={form.curp ?? ''} onChange={f('curp')} placeholder="Opcional" />
              <Sel label="Tipo de persona" required value={form.tipoPersona ?? ''} onChange={f('tipoPersona')}>
                <option value="">Seleccionar...</option>
                <option value="FISICA">Persona Física</option>
                <option value="MORAL">Persona Moral / Empresa</option>
              </Sel>
            </Grid3>
            <Grid2>
              <Sel label="Giro / Categoría" required value={form.giro ?? ''} onChange={f('giro')}>
                <option value="">Seleccionar...</option>
                {GIROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </Sel>
              <Sel label="Estado del proveedor" required value={form.estadoProveedor ?? 'ACTIVO'} onChange={f('estadoProveedor')}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </Sel>
            </Grid2>
          </>
        )}

        {tab === 'contacto' && (
          <>
            <SectionTitle icon={<Phone size={16} />}>Información de Contacto</SectionTitle>
            <Grid2>
              <div>
                <Inp label="Nombre del contacto principal" required value={form.contactoPrincipal ?? ''} onChange={f('contactoPrincipal')} placeholder="Ej. Juan Pérez" />
                {err('contactoPrincipal')}
              </div>
              <Inp label="Cargo" value={form.cargoContacto ?? ''} onChange={f('cargoContacto')} placeholder="Ej. Gerente de Ventas" />
            </Grid2>
            <Grid3>
              <div>
                <Inp label="Teléfono" required type="tel" value={form.telefono ?? ''} onChange={f('telefono')} placeholder="Ej. 33 1234 5678" />
                {err('telefono')}
              </div>
              <Inp label="Celular" type="tel" value={form.celular ?? ''} onChange={f('celular')} placeholder="Ej. 33 9876 5432" />
              <div>
                <Inp label="Correo electrónico" required type="email" value={form.correo ?? ''} onChange={f('correo')} placeholder="correo@empresa.com" />
                {err('correo')}
              </div>
            </Grid3>
            <Inp label="Página web (opcional)" type="url" value={form.paginaWeb ?? ''} onChange={f('paginaWeb')} placeholder="https://www.empresa.com" />
          </>
        )}

        {tab === 'direccion' && (
          <>
            <SectionTitle icon={<MapPin size={16} />}>Dirección Fiscal</SectionTitle>
            <Grid3>
              <Inp label="País" required value={form.pais ?? ''} onChange={f('pais')} placeholder="México" />
              <Sel label="Estado" required value={form.estadoRepublica ?? ''} onChange={f('estadoRepublica')}>
                <option value="">Seleccionar...</option>
                {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
              </Sel>
              <div>
                <Inp label="Ciudad" required value={form.ciudad ?? ''} onChange={f('ciudad')} placeholder="Ej. Guadalajara" />
                {err('ciudad')}
              </div>
            </Grid3>
            <Grid2>
              <Inp label="Colonia" value={form.colonia ?? ''} onChange={f('colonia')} placeholder="Ej. Centro" />
              <Inp label="Calle" value={form.calle ?? ''} onChange={f('calle')} placeholder="Nombre de la calle" />
            </Grid2>
            <Grid3>
              <Inp label="Núm. exterior" value={form.numExterior ?? ''} onChange={f('numExterior')} placeholder="Ej. 123" />
              <Inp label="Núm. interior" value={form.numInterior ?? ''} onChange={f('numInterior')} placeholder="Ej. Piso 2" />
              <div>
                <Inp label="Código postal" required value={form.codigoPostal ?? ''} onChange={f('codigoPostal')} placeholder="Ej. 44100" />
                {err('codigoPostal')}
              </div>
            </Grid3>
            <Inp label="Referencias (opcional)" value={form.referencias ?? ''} onChange={f('referencias')} placeholder="Ej. Entre calles X e Y" />
          </>
        )}

        {tab === 'bancaria' && (
          <>
            <SectionTitle icon={<CreditCard size={16} />}>Información Bancaria</SectionTitle>
            <Grid3>
              <div>
                <Sel label="Banco" required value={form.banco ?? ''} onChange={f('banco')}>
                  <option value="">Seleccionar...</option>
                  {BANCOS_MX.map(b => <option key={b} value={b}>{b}</option>)}
                </Sel>
                {err('banco')}
              </div>
              <Inp label="Número de cuenta" value={form.cuentaBancaria ?? ''} onChange={f('cuentaBancaria')} placeholder="16 dígitos" />
              <div>
                <Inp label="CLABE interbancaria" required value={form.clabe ?? ''} onChange={f('clabe')} placeholder="18 dígitos" maxLength={18} />
                {err('clabe')}
              </div>
            </Grid3>
            <Grid3>
              <Sel label="Método de pago" value={form.metodoPago ?? ''} onChange={f('metodoPago')}>
                <option value="">Seleccionar...</option>
                {FORMAS_PAGO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
              </Sel>
              <Sel label="Condiciones de pago" required value={form.condicionesPago ?? ''} onChange={f('condicionesPago')}>
                <option value="">Seleccionar...</option>
                <option value="CONTADO">Contado</option>
                <option value="CREDITO_15">Crédito 15 días</option>
                <option value="CREDITO_30">Crédito 30 días</option>
              </Sel>
              <Sel label="Moneda" required value={form.moneda ?? ''} onChange={f('moneda')}>
                <option value="">Seleccionar...</option>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </Sel>
            </Grid3>
          </>
        )}

        {tab === 'fiscal' && (
          <>
            <SectionTitle icon={<FileText size={16} />}>Información Fiscal</SectionTitle>
            <Grid2>
              <div>
                <Sel label="Régimen fiscal" required value={form.regimenFiscal ?? ''} onChange={f('regimenFiscal')}>
                  <option value="">Seleccionar...</option>
                  {REGIMENES_FISCALES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Sel>
                {err('regimenFiscal')}
              </div>
              <Sel label="Uso CFDI (opcional)" value={form.usoCFDI ?? ''} onChange={f('usoCFDI')}>
                <option value="">Seleccionar...</option>
                {USOS_CFDI.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Sel>
            </Grid2>
            <Grid2>
              <Sel label="Método de facturación" value={form.metodoFacturacion ?? ''} onChange={f('metodoFacturacion')}>
                <option value="">Seleccionar...</option>
                {METODOS_PAGO_SAT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Sel>
              <Sel label="Retenciones aplicables" value={form.retencionesAplicables ?? ''} onChange={f('retencionesAplicables')}>
                <option value="">Seleccionar...</option>
                {RETENCIONES_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
              </Sel>
            </Grid2>
          </>
        )}

        {tab === 'productos' && (
          <>
            <SectionTitle icon={<Package size={16} />}>Productos o Servicios</SectionTitle>
            <Txt label="Productos/Servicios que suministra" value={form.productosServicios ?? ''} onChange={f('productosServicios')} placeholder="Describe los productos o servicios principales..." />
            <Grid2>
              <Inp label="Marcas" value={form.marcas ?? ''} onChange={f('marcas')} placeholder="Ej. HP, Dell, Epson" />
              <Sel label="Tiempo de entrega promedio" value={form.tiempoEntregaPromedio ?? ''} onChange={f('tiempoEntregaPromedio')}>
                <option value="">Seleccionar...</option>
                {TIEMPOS_ENTREGA.map(t => <option key={t} value={t}>{t}</option>)}
              </Sel>
            </Grid2>
            <Txt label="Garantías" value={form.garantias ?? ''} onChange={f('garantias')} placeholder="Política de garantías del proveedor..." />
            <Txt label="Convenios / Precios especiales" value={form.convenios ?? ''} onChange={f('convenios')} placeholder="Convenios o condiciones especiales negociadas..." />
          </>
        )}

        {tab === 'docs' && (
          <>
            <SectionTitle icon={<Upload size={16} />}>Documentos</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <DocField tipo="ine"        label="INE del representante"        urlField="ineRepresentanteUrl" />
              <DocField tipo="acta"       label="Acta constitutiva"            urlField="actaConstitutivaUrl" />
              <DocField tipo="constancia" label="Constancia situación fiscal"  urlField="constanciaFiscalUrl" />
              <DocField tipo="domicilio"  label="Comprobante de domicilio"     urlField="comprobanteDomicilioUrl" />
              <DocField tipo="contrato"   label="Contrato"                     urlField="contratoUrl" />
              <DocField tipo="catalogo"   label="Catálogo de productos"        urlField="catalogoProductosUrl" />
            </div>
          </>
        )}

        {tab === 'internos' && (
          <>
            <SectionTitle icon={<Star size={16} />}>Datos Internos</SectionTitle>
            <Grid2>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Calificación del proveedor
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button"
                      onClick={() => onChange('calificacion', form.calificacion === n ? undefined : n)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: (form.calificacion ?? 0) >= n ? '#f59e0b' : '#f1f5f9',
                        color: (form.calificacion ?? 0) >= n ? 'white' : '#94a3b8',
                        fontWeight: 700, fontSize: 14,
                      }}>
                      {n}
                    </button>
                  ))}
                  {form.calificacion && (
                    <span style={{ fontSize: 13, color: '#64748b' }}>{form.calificacion}/5</span>
                  )}
                </div>
              </div>
              <Inp label="Fecha de registro" value={new Date().toLocaleDateString('es-MX')} disabled />
            </Grid2>
            <Txt label="Observaciones" value={form.observaciones ?? ''} onChange={f('observaciones')} placeholder="Observaciones generales del proveedor..." />
            <Txt label="Notas internas" value={form.notas ?? ''} onChange={f('notas')} placeholder="Notas privadas (solo personal autorizado)..." />
          </>
        )}
        </div>

        {/* ── BOTONES ANTERIOR / SIGUIENTE ── */}
        <div style={{
          padding: '0.75rem 1.5rem', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0, background: 'white',
        }}>
          <button
            onClick={() => hasPrev && setTab(FORM_TABS[tabIdx - 1].key)}
            disabled={!hasPrev}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10,
              border: '1px solid #e2e8f0', background: hasPrev ? 'white' : '#f8fafc',
              color: hasPrev ? '#374151' : '#cbd5e1', fontWeight: 600, fontSize: 13,
              cursor: hasPrev ? 'pointer' : 'not-allowed',
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {tabIdx + 1} / {FORM_TABS.length}
          </span>
          <button
            onClick={() => hasNext && setTab(FORM_TABS[tabIdx + 1].key)}
            disabled={!hasNext}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10,
              border: 'none', background: hasNext ? '#eff6ff' : '#f8fafc',
              color: hasNext ? '#1d4ed8' : '#cbd5e1', fontWeight: 700, fontSize: 13,
              cursor: hasNext ? 'pointer' : 'not-allowed',
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────

const DetalleProveedor = ({ proveedor, onEdit, onClose }: { proveedor: Proveedor; onEdit: () => void; onClose: () => void }) => {
  const [tab, setTab] = useState<'info' | 'bancaria' | 'docs' | 'historial'>('info');
  const badge = estadoBadge(proveedor.estadoProveedor);

  return (
    <ModalBase title="Detalle del Proveedor" onClose={onClose} width={900}>
      {/* Header proveedor */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{proveedor.nombre}</div>
            {proveedor.razonSocial && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{proveedor.razonSocial}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.dot}33`, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: badge.dot, marginRight: 5 }} />{badge.label}
              </span>
              {proveedor.giro && (
                <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                  {GiroLabel[proveedor.giro]}
                </span>
              )}
              {proveedor.rfc && (
                <span style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                  RFC: {proveedor.rfc}
                </span>
              )}
            </div>
          </div>
          <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <Edit2 size={14} /> Editar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
        {([['info', 'Información'], ['bancaria', 'Bancaria'], ['docs', 'Documentos'], ['historial', 'Compras']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: tab === key ? '#3b82f6' : '#f1f5f9',
              color: tab === key ? 'white' : '#64748b',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {tab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contacto</div>
              {proveedor.contactoPrincipal && <InfoRow icon={<Phone size={14} />} label="Contacto" value={`${proveedor.contactoPrincipal}${proveedor.cargoContacto ? ` — ${proveedor.cargoContacto}` : ''}`} />}
              {proveedor.telefono && <InfoRow icon={<Phone size={14} />} label="Teléfono" value={proveedor.telefono} />}
              {proveedor.celular  && <InfoRow icon={<Phone size={14} />} label="Celular"  value={proveedor.celular} />}
              {proveedor.correo   && <InfoRow icon={<Mail size={14} />}  label="Correo"   value={proveedor.correo} />}
              {proveedor.paginaWeb && <InfoRow icon={<Globe size={14} />} label="Web"     value={proveedor.paginaWeb} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección</div>
              {(proveedor.calle || proveedor.colonia || proveedor.ciudad) && (
                <InfoRow icon={<MapPin size={14} />} label="Dirección" value={[proveedor.calle, proveedor.numExterior, proveedor.colonia, proveedor.ciudad, proveedor.estadoRepublica, proveedor.codigoPostal].filter(Boolean).join(', ')} />
              )}
              {proveedor.pais && <InfoRow icon={<MapPin size={14} />} label="País" value={proveedor.pais} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fiscal</div>
              {proveedor.regimenFiscal && <InfoRow icon={<FileText size={14} />} label="Régimen" value={proveedor.regimenFiscal} />}
              {proveedor.usoCFDI && <InfoRow icon={<FileText size={14} />} label="Uso CFDI" value={proveedor.usoCFDI} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estadísticas</div>
              {proveedor._count && (
                <>
                  <InfoRow icon={<Package size={14} />} label="Cotizaciones" value={String(proveedor._count.cotizaciones)} />
                  <InfoRow icon={<FileText size={14} />} label="Órdenes de compra" value={String(proveedor._count.ordenes)} />
                  <InfoRow icon={<Banknote size={14} />} label="Contra-recibos" value={String(proveedor._count.contraRecibos)} />
                </>
              )}
              {proveedor.calificacion && (
                <InfoRow icon={<Star size={14} />} label="Calificación" value={`${proveedor.calificacion}/5`} />
              )}
            </div>
          </div>
        )}

        {tab === 'bancaria' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {proveedor.banco           && <InfoCard label="Banco"           value={proveedor.banco} />}
            {proveedor.clabe           && <InfoCard label="CLABE"           value={proveedor.clabe} mono />}
            {proveedor.cuentaBancaria  && <InfoCard label="Núm. Cuenta"     value={proveedor.cuentaBancaria} mono />}
            {proveedor.condicionesPago && <InfoCard label="Condiciones pago" value={CondicionesLabel[proveedor.condicionesPago]} />}
            {proveedor.moneda          && <InfoCard label="Moneda"          value={proveedor.moneda} />}
            {proveedor.metodoPago      && <InfoCard label="Método de pago"  value={proveedor.metodoPago} />}
          </div>
        )}

        {tab === 'docs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'INE representante',        url: proveedor.ineRepresentanteUrl },
              { label: 'Acta constitutiva',         url: proveedor.actaConstitutivaUrl },
              { label: 'Constancia fiscal',         url: proveedor.constanciaFiscalUrl },
              { label: 'Comprobante domicilio',     url: proveedor.comprobanteDomicilioUrl },
              { label: 'Contrato',                  url: proveedor.contratoUrl },
              { label: 'Catálogo de productos',     url: proveedor.catalogoProductosUrl },
            ].map(doc => (
              <div key={doc.label} style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{doc.label}</div>
                {doc.url
                  ? <a href={`http://localhost:3000${doc.url}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6', fontSize: 12, fontWeight: 600 }}>Ver <ExternalLink size={12} /></a>
                  : <span style={{ fontSize: 12, color: '#94a3b8' }}>No cargado</span>}
              </div>
            ))}
          </div>
        )}

        {tab === 'historial' && (
          <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '2rem' }}>
            El historial de compras se refleja en el módulo de Control de Compras.
          </div>
        )}
      </div>
    </ModalBase>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
    <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#374151' }}>{value}</div>
    </div>
  </div>
);

const InfoCard = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>
    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
  </div>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

const FILTER_TABS: { key: EstadoProveedor | 'TODOS'; label: string }[] = [
  { key: 'TODOS',    label: 'Todos' },
  { key: 'ACTIVO',   label: 'Activos' },
  { key: 'INACTIVO', label: 'Inactivos' },
  { key: 'BLOQUEADO',label: 'Bloqueados' },
];

export default function ProveedoresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoProveedor | 'TODOS'>('TODOS');
  const [filterGiro, setFilterGiro] = useState<GiroProveedor | ''>('');
  const [page, setPage]           = useState(1);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selected, setSelected]   = useState<Proveedor | null>(null);
  const [form, setForm]           = useState<Partial<Proveedor>>(emptyForm());
  const [formTab, setFormTab]     = useState<FormTab>('general');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [savingDoc, setSavingDoc] = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const queryParams = useMemo(() => ({
    q:      search || undefined,
    estado: filterEstado !== 'TODOS' ? filterEstado : undefined,
    giro:   filterGiro   || undefined,
    page,
    limit:  20,
  }), [search, filterEstado, filterGiro, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['proveedores', queryParams],
    queryFn:  () => proveedoresService.getAll(queryParams),
  });

  const proveedores = data?.data ?? [];
  const meta        = data?.meta;

  const createMut = useMutation({
    mutationFn: (d: Partial<Proveedor>) => proveedoresService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      setSuccess(true);
      setTimeout(() => {
        setModalMode(null);
        setSelected(null);
        setSuccess(false);
      }, 1400);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Partial<Proveedor> }) => proveedoresService.update(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1400);
    },
  });

  const estadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoProveedor }) => proveedoresService.cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['proveedores-activos'] });
    },
  });

  const openCreate = () => {
    setForm(emptyForm());
    setFormTab('general');
    setErrors({});
    setSuccess(false);
    setModalMode('create');
  };

  const openEdit = (p: Proveedor) => {
    setForm({ ...p });
    setFormTab('general');
    setErrors({});
    setSuccess(false);
    setSelected(p);
    setModalMode('edit');
  };

  const openDetail = (p: Proveedor) => {
    setSelected(p);
    setModalMode('detail');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setSuccess(false);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nombre?.trim())            e.nombre            = 'Requerido';
    if (!form.razonSocial?.trim())       e.razonSocial       = 'Requerido';
    if (!form.rfc?.trim())               e.rfc               = 'Requerido';
    if (!form.contactoPrincipal?.trim()) e.contactoPrincipal = 'Requerido';
    if (!form.telefono?.trim())          e.telefono          = 'Requerido';
    if (!form.correo?.trim())            e.correo            = 'Requerido';
    if (!form.codigoPostal?.trim())      e.codigoPostal      = 'Requerido';
    if (!form.banco?.trim())             e.banco             = 'Requerido';
    if (!form.clabe?.trim())             e.clabe             = 'Requerido';
    if (!form.regimenFiscal?.trim())     e.regimenFiscal     = 'Requerido';
    if (form.clabe && !/^\d{18}$/.test(form.clabe)) e.clabe = 'Debe tener 18 dígitos';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) { setFormTab('general'); return; }
    if (modalMode === 'create') {
      createMut.mutate(form);
    } else if (modalMode === 'edit' && selected) {
      updateMut.mutate({ id: selected.id, d: form });
    }
  };

  const handleFileUpload = async (tipo: string, file: File) => {
    if (!selected) return;
    setSavingDoc(tipo);
    try {
      const res = await proveedoresService.subirDocumento(selected.id, tipo, file);
      if (res.data) {
        setForm(prev => ({ ...prev, ...(res.data as Proveedor) }));
        queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      }
    } finally {
      setSavingDoc(null);
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>
            Catálogo de Proveedores
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, marginTop: 4 }}>
            Registro, gestión y control de proveedores del Instituto.
          </p>
        </div>
        <button onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 14, padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      {/* KPIs rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total registrados', value: meta?.total ?? 0,  color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Activos',           value: proveedores.filter(p => p.estadoProveedor === 'ACTIVO').length,    color: '#10b981', bg: '#f0fdf4' },
          { label: 'Inactivos',         value: proveedores.filter(p => p.estadoProveedor === 'INACTIVO').length,  color: '#64748b', bg: '#f8fafc' },
          { label: 'Bloqueados',        value: proveedores.filter(p => p.estadoProveedor === 'BLOQUEADO').length, color: '#ef4444', bg: '#fef2f2' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{kpi.label}</div>
            </div>
            <div style={{ background: kpi.bg, borderRadius: 12, padding: '0.75rem' }}>
              <Building2 size={22} color={kpi.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtros + tabla */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {/* Filter bar */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, RFC, contacto..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Giro filter */}
          <select value={filterGiro} onChange={e => { setFilterGiro(e.target.value as GiroProveedor | ''); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer' }}>
            <option value="">Todos los giros</option>
            {GIROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>

          {/* Estado tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTER_TABS.map(ft => (
              <button key={ft.key} onClick={() => { setFilterEstado(ft.key); setPage(1); }}
                style={{
                  padding: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: filterEstado === ft.key ? '#1e293b' : 'white',
                  color:      filterEstado === ft.key ? 'white'    : '#64748b',
                }}>
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '115px' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Proveedor', 'RFC', 'Giro', 'Contacto', 'Teléfono', 'Condiciones', 'Estado', 'Acciones'].map((h, i) => (
                  <th key={i} style={{
                    padding: '0.9rem 1rem', textAlign: 'left', color: '#64748b',
                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                    ...(i === 7 && { textAlign: 'right' }),
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Cargando proveedores...</td></tr>
              ) : proveedores.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center' }}>
                    <Building2 size={36} color="#e2e8f0" style={{ display: 'block', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 700, color: '#374151', fontSize: 15 }}>Sin proveedores</div>
                    <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Agrega tu primer proveedor con el botón de arriba.</div>
                  </td>
                </tr>
              ) : proveedores.map((p, idx) => {
                const badge = estadoBadge(p.estadoProveedor);
                return (
                  <tr key={p.id}
                    style={{ borderBottom: idx < proveedores.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '1rem', maxWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{p.nombre}</div>
                      {p.razonSocial && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.razonSocial}</div>}
                    </td>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{p.rfc ?? '—'}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {p.giro
                        ? <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{GiroLabel[p.giro]}</span>
                        : <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem', fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.contactoPrincipal ?? '—'}</td>
                    <td style={{ padding: '1rem', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{p.telefono ?? '—'}</td>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {p.condicionesPago
                        ? <span style={{ fontSize: 12, color: '#374151' }}>{CondicionesLabel[p.condicionesPago]}</span>
                        : <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: badge.bg, color: badge.text, border: `1px solid ${badge.dot}33`, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot }} />
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', width: '115px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <ActionBtn icon={<Eye size={13} />} onClick={() => openDetail(p)} title="Ver detalle" />
                        <ActionBtn icon={<Edit2 size={13} />} onClick={() => openEdit(p)} title="Editar" />
                        <ActionBtn
                          icon={p.estadoProveedor === 'ACTIVO' ? <ToggleRight size={13} color="#10b981" /> : <ToggleLeft size={13} color="#94a3b8" />}
                          onClick={() => estadoMut.mutate({ id: p.id, estado: p.estadoProveedor === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' })}
                          title={p.estadoProveedor === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta && meta.totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} de {meta.total} proveedores
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#94a3b8' : '#374151', fontWeight: 600 }}>
                Anterior
              </button>
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: page === p ? '#3b82f6' : 'white', color: page === p ? 'white' : '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page === meta.totalPages ? 'not-allowed' : 'pointer', color: page === meta.totalPages ? '#94a3b8' : '#374151', fontWeight: 600 }}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <ModalBase
          title={modalMode === 'create' ? 'Nuevo Proveedor' : `Editar — ${selected?.nombre ?? ''}`}
          onClose={closeModal}
          width={920}
        >
          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
              <CheckCircle size={56} color="#10b981" />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                {modalMode === 'create' ? '¡Proveedor registrado!' : '¡Cambios guardados!'}
              </div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {modalMode === 'create' ? 'El proveedor ha sido registrado correctamente en el catálogo.' : 'Los datos han sido actualizados correctamente.'}
              </div>
            </div>
          ) : (
            <>
              <ProveedorForm
                form={form}
                onChange={(field, value) => setForm(prev => ({ ...prev, [field]: value }))}
                onFileUpload={modalMode === 'edit' ? handleFileUpload : undefined}
                savingDoc={savingDoc}
                providerId={selected?.id}
                errors={errors}
                tab={formTab}
                setTab={setFormTab}
              />
              {/* Footer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
                {(createMut.isError || updateMut.isError) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: 13, marginRight: 'auto' }}>
                    <AlertCircle size={16} />
                    {(createMut.error as Error)?.message || (updateMut.error as Error)?.message || 'Error al guardar. Verifica los datos.'}
                  </div>
                )}
                <button onClick={closeModal} style={{ padding: '8px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={isSaving}
                  style={{ padding: '8px 24px', borderRadius: 12, border: 'none', background: isSaving ? '#93c5fd' : '#3b82f6', color: 'white', fontSize: 13, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                  {isSaving ? 'Guardando...' : modalMode === 'create' ? 'Registrar Proveedor' : 'Guardar Cambios'}
                </button>
              </div>
            </>
          )}
        </ModalBase>
      )}

      {/* ── MODAL DETALLE ── */}
      {modalMode === 'detail' && selected && (
        <DetalleProveedor
          proveedor={selected}
          onEdit={() => { openEdit(selected); }}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

const ActionBtn = ({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) => (
  <button onClick={onClick} title={title}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
    {icon}
  </button>
);
