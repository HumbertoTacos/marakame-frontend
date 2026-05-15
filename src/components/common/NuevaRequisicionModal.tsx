import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';
import { createRequisicion } from '../../services/requisiciones.service';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ArticuloForm {
  articulo: string;
  descripcion: string;
  unidad: string;
  cantidadSolicitada: string;
  cantidadEntregada: string;
  cantidadPendiente: string;
  justificacion: string;
}

interface RequisicionForm {
  fecha: string;
  areaSolicitante: string;
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA';
  quienSolicita: string;
  responsableArea: string;
  justificacion: string;
  selloRecibido: string;
  firmaResponsable: string;
  firmaAdministradora: string;
  firmaDirector: string;
  articulos: ArticuloForm[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyArticulo = (): ArticuloForm => ({
  articulo: '',
  descripcion: '',
  unidad: '',
  cantidadSolicitada: '',
  cantidadEntregada: '',
  cantidadPendiente: '',
  justificacion: '',
});

const emptyForm = (): RequisicionForm => ({
  fecha: new Date().toISOString().split('T')[0],
  areaSolicitante: '',
  tipo: 'ORDINARIA',
  quienSolicita: '',
  responsableArea: '',
  justificacion: '',
  selloRecibido: '',
  firmaResponsable: '',
  firmaAdministradora: '',
  firmaDirector: '',
  articulos: [emptyArticulo()],
});

// ─── Estilos reutilizables ────────────────────────────────────────────────────

const sLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#64748b',
  marginBottom: '5px',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const sErrorMsg: React.CSSProperties = {
  fontSize: '11px',
  color: '#ef4444',
  marginTop: '3px',
  fontWeight: '600',
};

const sSectionTitle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '800',
  color: '#1e293b',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  margin: '0 0 1rem 0',
  paddingBottom: '0.6rem',
  borderBottom: '2px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const inp = (hasError = false): React.CSSProperties => ({
  width: '100%',
  padding: '0.6rem 0.85rem',
  border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: '10px',
  fontSize: '13.5px',
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: 'white',
});

// ─── Componente ───────────────────────────────────────────────────────────────

export function NuevaRequisicionModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<RequisicionForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [exito, setExito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const setField = (field: keyof RequisicionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const setArticuloField = (idx: number, field: keyof ArticuloForm, value: string) => {
    setForm(prev => {
      const articulos = [...prev.articulos];
      articulos[idx] = { ...articulos[idx], [field]: value };

      // Calcular cantidad pendiente automáticamente
      if (field === 'cantidadSolicitada' || field === 'cantidadEntregada') {
        const sol = parseFloat(field === 'cantidadSolicitada' ? value : articulos[idx].cantidadSolicitada);
        const ent = parseFloat(field === 'cantidadEntregada' ? value : articulos[idx].cantidadEntregada);
        if (!isNaN(sol) && !isNaN(ent)) {
          articulos[idx].cantidadPendiente = String(Math.max(0, sol - ent));
        }
      }
      return { ...prev, articulos };
    });
    const key = `art_${idx}_${field}`;
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const agregarArticulo = () =>
    setForm(prev => ({ ...prev, articulos: [...prev.articulos, emptyArticulo()] }));

  const eliminarArticulo = (idx: number) => {
    if (form.articulos.length <= 1) return;
    setForm(prev => ({ ...prev, articulos: prev.articulos.filter((_, i) => i !== idx) }));
  };

  // ── Validación ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fecha) e.fecha = 'La fecha es requerida';
    if (!form.areaSolicitante.trim()) e.areaSolicitante = 'Requerido';
    if (!form.quienSolicita.trim()) e.quienSolicita = 'Requerido';
    if (!form.responsableArea.trim()) e.responsableArea = 'Requerido';
    if (!form.justificacion.trim()) e.justificacion = 'La justificación es requerida';

    form.articulos.forEach((art, idx) => {
      if (!art.articulo.trim()) e[`art_${idx}_articulo`] = 'Requerido';
      if (!art.unidad) e[`art_${idx}_unidad`] = 'Requerida';
      const sol = parseFloat(art.cantidadSolicitada);
      if (!art.cantidadSolicitada || isNaN(sol) || sol <= 0) e[`art_${idx}_cantidadSolicitada`] = 'Cantidad inválida';
      if (art.cantidadEntregada) {
        const ent = parseFloat(art.cantidadEntregada);
        if (isNaN(ent) || ent < 0) e[`art_${idx}_cantidadEntregada`] = 'Cantidad inválida';
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      await createRequisicion({
        areaSolicitante: form.areaSolicitante.trim(),
        justificacion: form.justificacion.trim(),
        tipo: form.tipo,
        descripcion: form.responsableArea.trim() ? `Responsable: ${form.responsableArea.trim()}` : undefined,
        detalles: form.articulos.map(a => ({
          productoNombre: a.articulo.trim(),
          unidadLibre: a.unidad,
          cantidadSolicitada: parseInt(a.cantidadSolicitada, 10) || 0,
          observaciones: [a.descripcion, a.justificacion].filter(Boolean).join(' — ') || undefined,
        })),
      });
      setExito(true);
      onSuccess?.();
      setTimeout(() => {
        setExito(false);
        setForm(emptyForm());
        setErrors({});
        setApiError(null);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg || 'Error al guardar la requisición. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(emptyForm());
    setErrors({});
    setExito(false);
    setApiError(null);
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(15,23,42,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.6rem', borderRadius: '12px' }}>
              <ClipboardList size={20} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Nueva Requisición</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                Complete los campos para registrar la solicitud de compra
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={{
            padding: '0.45rem', borderRadius: '10px', border: '1px solid #f1f5f9',
            backgroundColor: 'white', cursor: 'pointer', color: '#94a3b8', display: 'flex',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Contenido scrolleable ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.75rem 2rem' }}>

          {/* Error de API */}
          {apiError && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '14px',
              padding: '1rem 1.25rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: '800', color: '#b91c1c', fontSize: '14px' }}>Error al crear la requisición</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#ef4444' }}>{apiError}</p>
              </div>
            </div>
          )}

          {/* Estado de éxito */}
          {exito && (
            <div style={{
              backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px',
              padding: '1rem 1.25rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <div>
                <p style={{ margin: 0, fontWeight: '800', color: '#15803d', fontSize: '14px' }}>Requisición registrada exitosamente</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#16a34a' }}>En breve se cerrará este formulario</p>
              </div>
            </div>
          )}

          {/* ── Tipo de Requisición ── */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ ...sLabel, fontSize: '12px', marginBottom: '0.75rem' }}>
              Tipo de Requisición <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* Ordinaria */}
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, tipo: 'ORDINARIA' }))}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  border: form.tipo === 'ORDINARIA' ? '2.5px solid #3b82f6' : '2px solid #e2e8f0',
                  backgroundColor: form.tipo === 'ORDINARIA' ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: form.tipo === 'ORDINARIA' ? '0 0 0 4px rgba(59,130,246,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                    border: form.tipo === 'ORDINARIA' ? '4px solid #3b82f6' : '2px solid #cbd5e1',
                    backgroundColor: form.tipo === 'ORDINARIA' ? 'white' : 'transparent',
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: form.tipo === 'ORDINARIA' ? '#1d4ed8' : '#475569' }}>
                    Ordinaria
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: form.tipo === 'ORDINARIA' ? '#3b82f6' : '#94a3b8', lineHeight: '1.5', paddingLeft: '1.35rem' }}>
                  Compra planificada dentro del presupuesto regular. Sigue el flujo estándar de aprobación.
                </p>
              </button>

              {/* Extraordinaria */}
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, tipo: 'EXTRAORDINARIA' }))}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  border: form.tipo === 'EXTRAORDINARIA' ? '2.5px solid #f59e0b' : '2px solid #e2e8f0',
                  backgroundColor: form.tipo === 'EXTRAORDINARIA' ? '#fffbeb' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: form.tipo === 'EXTRAORDINARIA' ? '0 0 0 4px rgba(245,158,11,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                    border: form.tipo === 'EXTRAORDINARIA' ? '4px solid #f59e0b' : '2px solid #cbd5e1',
                    backgroundColor: form.tipo === 'EXTRAORDINARIA' ? 'white' : 'transparent',
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: form.tipo === 'EXTRAORDINARIA' ? '#b45309' : '#475569' }}>
                    Extraordinaria
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: form.tipo === 'EXTRAORDINARIA' ? '#d97706' : '#94a3b8', lineHeight: '1.5', paddingLeft: '1.35rem' }}>
                  Compra urgente o fuera de presupuesto. Requiere justificación y autorización directa de Dirección.
                </p>
              </button>
            </div>
          </div>

          {/* ── Datos generales ── */}
          <p style={sSectionTitle}>
            <span style={{ width: 6, height: 6, backgroundColor: '#3b82f6', borderRadius: '50%', flexShrink: 0 }} />
            Datos Generales
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={sLabel}>Fecha de la Requisición *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setField('fecha', e.target.value)}
                style={inp(!!errors.fecha)}
              />
              {errors.fecha && <p style={sErrorMsg}>{errors.fecha}</p>}
            </div>
            <div>
              <label style={sLabel}>Área Solicitante *</label>
              <select
                value={form.areaSolicitante}
                onChange={e => setField('areaSolicitante', e.target.value)}
                style={inp(!!errors.areaSolicitante)}
              >
                <option value="">— Seleccionar área —</option>
                <option>Dirección General</option>
                <option>Unidad de Transparencia</option>
                <option>Departamento Clínico</option>
                <option>Departamento Médico</option>
                <option>Departamento de Admisiones</option>
                <option>Departamento de Administración</option>
                <option>Oficina de Recursos Materiales</option>
              </select>
              {errors.areaSolicitante && <p style={sErrorMsg}>{errors.areaSolicitante}</p>}
            </div>
            <div>
              <label style={sLabel}>Quién Solicita *</label>
              <input
                placeholder="Nombre completo del solicitante"
                value={form.quienSolicita}
                onChange={e => setField('quienSolicita', e.target.value)}
                style={inp(!!errors.quienSolicita)}
              />
              {errors.quienSolicita && <p style={sErrorMsg}>{errors.quienSolicita}</p>}
            </div>
            <div>
              <label style={sLabel}>Responsable del Área *</label>
              <input
                placeholder="Nombre del responsable del área"
                value={form.responsableArea}
                onChange={e => setField('responsableArea', e.target.value)}
                style={inp(!!errors.responsableArea)}
              />
              {errors.responsableArea && <p style={sErrorMsg}>{errors.responsableArea}</p>}
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={sLabel}>Justificación General de la Compra *</label>
            <textarea
              placeholder="Describa la razón por la que se requieren los artículos solicitados…"
              value={form.justificacion}
              onChange={e => setField('justificacion', e.target.value)}
              rows={3}
              style={{ ...inp(!!errors.justificacion), resize: 'vertical' }}
            />
            {errors.justificacion && <p style={sErrorMsg}>{errors.justificacion}</p>}
          </div>

          {/* ── Artículos ── */}
          <p style={sSectionTitle}>
            <span style={{ width: 6, height: 6, backgroundColor: '#10b981', borderRadius: '50%', flexShrink: 0 }} />
            Artículos Requisitados
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '0.85rem' }}>
            {form.articulos.map((art, idx) => (
              <div key={idx} style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.1rem 1.25rem',
              }}>
                {/* Encabezado del artículo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Artículo #{idx + 1}
                  </span>
                  {form.articulos.length > 1 && (
                    <button
                      onClick={() => eliminarArticulo(idx)}
                      style={{
                        background: '#fef2f2', border: '1px solid #fecaca',
                        color: '#ef4444', borderRadius: '8px',
                        padding: '0.25rem 0.6rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '11px', fontWeight: '700',
                      }}
                    >
                      <Trash2 size={11} /> Eliminar
                    </button>
                  )}
                </div>

                {/* Fila 1: Artículo / Descripción / Unidad */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={sLabel}>Artículo *</label>
                    <input
                      placeholder="Nombre del artículo"
                      value={art.articulo}
                      onChange={e => setArticuloField(idx, 'articulo', e.target.value)}
                      style={inp(!!errors[`art_${idx}_articulo`])}
                    />
                    {errors[`art_${idx}_articulo`] && <p style={sErrorMsg}>{errors[`art_${idx}_articulo`]}</p>}
                  </div>
                  <div>
                    <label style={sLabel}>Descripción</label>
                    <input
                      placeholder="Especificaciones, marca, modelo…"
                      value={art.descripcion}
                      onChange={e => setArticuloField(idx, 'descripcion', e.target.value)}
                      style={inp()}
                    />
                  </div>
                  <div>
                    <label style={sLabel}>Unidad *</label>
                    <select
                      value={art.unidad}
                      onChange={e => setArticuloField(idx, 'unidad', e.target.value)}
                      style={{ ...inp(!!errors[`art_${idx}_unidad`]) }}
                    >
                      <option value="">—</option>
                      <option>Piezas</option>
                      <option>Cajas</option>
                      <option>Paquetes</option>
                      <option>Litros</option>
                      <option>Kilogramos</option>
                      <option>Metros</option>
                      <option>Rollos</option>
                      <option>Frascos</option>
                      <option>Ampollas</option>
                      <option>Sobres</option>
                      <option>Juegos</option>
                      <option>Otro</option>
                    </select>
                    {errors[`art_${idx}_unidad`] && <p style={sErrorMsg}>{errors[`art_${idx}_unidad`]}</p>}
                  </div>
                </div>

                {/* Fila 2: Cantidades */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={sLabel}>Cant. Solicitada *</label>
                    <input
                      type="number" min="0" placeholder="0"
                      value={art.cantidadSolicitada}
                      onChange={e => setArticuloField(idx, 'cantidadSolicitada', e.target.value)}
                      style={inp(!!errors[`art_${idx}_cantidadSolicitada`])}
                    />
                    {errors[`art_${idx}_cantidadSolicitada`] && <p style={sErrorMsg}>{errors[`art_${idx}_cantidadSolicitada`]}</p>}
                  </div>
                  <div>
                    <label style={sLabel}>Cant. Entregada</label>
                    <input
                      type="number" min="0" placeholder="0"
                      value={art.cantidadEntregada}
                      onChange={e => setArticuloField(idx, 'cantidadEntregada', e.target.value)}
                      style={inp(!!errors[`art_${idx}_cantidadEntregada`])}
                    />
                    {errors[`art_${idx}_cantidadEntregada`] && <p style={sErrorMsg}>{errors[`art_${idx}_cantidadEntregada`]}</p>}
                  </div>
                  <div>
                    <label style={sLabel}>Cant. Pendiente</label>
                    <input
                      type="number" min="0" placeholder="0"
                      value={art.cantidadPendiente}
                      onChange={e => setArticuloField(idx, 'cantidadPendiente', e.target.value)}
                      style={{ ...inp(), backgroundColor: '#f1f5f9', color: '#64748b' }}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Botón agregar artículo */}
          <button
            onClick={agregarArticulo}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.7rem',
              backgroundColor: '#eff6ff', color: '#3b82f6',
              border: '1.5px dashed #bfdbfe', borderRadius: '12px',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              marginBottom: '1.75rem',
            }}
          >
            <Plus size={15} /> Agregar artículo
          </button>

          {/* ── Autorizaciones y firmas ── */}
          <p style={sSectionTitle}>
            <span style={{ width: 6, height: 6, backgroundColor: '#8b5cf6', borderRadius: '50%', flexShrink: 0 }} />
            Autorizaciones y Firmas
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={sLabel}>Sello de Recibido — Área Encargada</label>
              <input
                placeholder="Nombre / sello del área encargada"
                value={form.selloRecibido}
                onChange={e => setField('selloRecibido', e.target.value)}
                style={inp()}
              />
            </div>
            <div>
              <label style={sLabel}>Firma del Responsable del Área</label>
              <input
                placeholder="Nombre del responsable"
                value={form.firmaResponsable}
                onChange={e => setField('firmaResponsable', e.target.value)}
                style={inp()}
              />
            </div>
            <div>
              <label style={sLabel}>Firma de la Administradora del Instituto</label>
              <input
                placeholder="Nombre de la administradora"
                value={form.firmaAdministradora}
                onChange={e => setField('firmaAdministradora', e.target.value)}
                style={inp()}
              />
            </div>
            <div>
              <label style={sLabel}>Autorización — Dirección General</label>
              <input
                placeholder="Nombre del Director General"
                value={form.firmaDirector}
                onChange={e => setField('firmaDirector', e.target.value)}
                style={inp()}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '1.25rem 2rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          flexShrink: 0, backgroundColor: 'white',
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '0.7rem 1.5rem', borderRadius: '12px',
              border: '1px solid #e2e8f0', backgroundColor: 'white',
              color: '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={exito || loading}
            style={{
              padding: '0.7rem 1.75rem', borderRadius: '12px',
              border: 'none',
              backgroundColor: exito ? '#16a34a' : loading ? '#64748b' : '#3b82f6',
              color: 'white', fontWeight: '700', fontSize: '14px',
              cursor: exito || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)',
              transition: 'background-color 0.2s',
            }}
          >
            {exito
              ? <><CheckCircle2 size={16} /> Requisición creada</>
              : loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
              : <><ClipboardList size={16} /> Crear Requisición</>
            }
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>,
    document.body
  );
}
