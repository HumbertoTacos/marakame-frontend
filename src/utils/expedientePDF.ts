import { jsPDF } from 'jspdf';
import type { HistoriaClinica } from '../types';

interface PacienteBasico {
  id: number;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaNacimiento: string | Date;
  sexo: string;
  claveUnica?: number;
}

function calcularEdad(fechaNacimiento: string | Date): number {
  const hoy = new Date();
  const d = new Date(fechaNacimiento as string);
  let a = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) a--;
  return a;
}

export function generarExpedientePDF(
  paciente: PacienteBasico,
  historia: Partial<HistoriaClinica> | null | undefined,
  medicoNombre: string,
  expedienteId: number,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = PW - M * 2;
  const H: Partial<HistoriaClinica> = historia ?? {};
  let y = M;

  const checkPage = (need: number) => {
    if (y + need > PH - 16) { doc.addPage(); y = M; }
  };

  const secHeader = (title: string) => {
    checkPage(14);
    doc.setFillColor(30, 41, 59);
    doc.rect(M, y, CW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, M + 3, y + 5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    y += 10;
  };

  const writeLine = (label: string, val: string | undefined) => {
    const v = val?.trim() || '—';
    checkPage(10);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label + ':', M, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(v, CW);
    checkPage(lines.length * 3.5 + 3);
    doc.text(lines, M, y);
    y += lines.length * 3.5 + 3;
  };

  const writeTwoCol = (
    l1: string, v1: string | undefined,
    l2: string, v2: string | undefined,
  ) => {
    const hw = CW / 2 - 4;
    const startY = y;
    checkPage(14);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(l1 + ':', M, startY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const lines1 = doc.splitTextToSize(v1?.trim() || '—', hw);
    doc.text(lines1, M, startY + 3.5);
    const h1 = lines1.length * 3.5 + 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(l2 + ':', M + hw + 8, startY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const lines2 = doc.splitTextToSize(v2?.trim() || '—', hw);
    doc.text(lines2, M + hw + 8, startY + 3.5);
    const h2 = lines2.length * 3.5 + 6;

    y += Math.max(h1, h2);
  };

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PW, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MARAKAME', M, 15);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Centro de Rehabilitación — Expediente Médico Clínico', M, 23);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generado: ${fecha}`, M, 31);
  doc.text(`Médico: ${medicoNombre || 'No especificado'}`, PW / 2, 31);

  y = 44;

  // ── Patient strip ────────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, CW, 18, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(M, y, 3, 18, 'F');

  const nombreCompleto = [paciente.nombre, paciente.apellidoPaterno, paciente.apellidoMaterno]
    .filter(Boolean).join(' ') || 'Paciente sin nombre';
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(nombreCompleto, M + 7, y + 7);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const sexoLabel = paciente.sexo === 'M' ? 'Masculino' : 'Femenino';
  doc.text(
    `Edad: ${calcularEdad(paciente.fechaNacimiento)} años  ·  Sexo: ${sexoLabel}  ·  Expediente #${expedienteId}  ·  ID Paciente: ${paciente.id}`,
    M + 7, y + 14,
  );
  y += 25;

  // ── 1. Historia Médica ───────────────────────────────────────────────────
  secHeader('1. HISTORIA MÉDICA');
  writeTwoCol('Estado Civil', H.estadoCivil, 'Religión', H.religion);
  writeTwoCol('Lugar de Residencia', H.lugarResidencia, 'Lugar de Origen', H.lugarOrigen);
  writeTwoCol('Ocupación', H.ocupacion, 'Escolaridad', H.escolaridad);

  // ── 2. Historia de Consumo ───────────────────────────────────────────────
  secHeader('2. HISTORIA DE CONSUMO');
  writeLine('Antecedentes de consumo de sustancias', H.historiaConsumo);

  // ── 3. Antecedentes Personales ───────────────────────────────────────────
  secHeader('3. ANTECEDENTES PERSONALES');
  writeLine('Alergias', H.alergias);
  writeLine('Enfermedades exantemáticas / Amigdalitis / Fiebre reumática', H.enfermedadesExantem);
  writeLine('Otras enfermedades', H.otrasEnfermedades);
  writeLine('Antecedentes quirúrgicos', H.antecedentesQx);
  writeLine('Transfusiones sanguíneas', H.transfusiones);
  writeLine('Antecedentes sexuales', H.antecSexuales);
  writeLine('Antecedentes suicidas (ideas y planes)', H.antecSuicidas);

  // ── 4. Historia Familiar ─────────────────────────────────────────────────
  secHeader('4. HISTORIA FAMILIAR');
  writeTwoCol('Padre — Patología', H.padrePatologia, 'Madre — Patología', H.madrePatologia);
  writeTwoCol('Hermanos — Patología', H.hermanosPatologia, 'Esposa/o — Patología', H.esposaPatologia);
  writeLine('Hijos — Patología', H.hijosPatologia);

  // ── 5. Interrogatorio ───────────────────────────────────────────────────
  secHeader('5. INTERROGATORIO POR APARATOS Y SISTEMAS');
  writeLine('Cabeza (cefalea, visión borrosa, tinnitus...)', H.sintCabeza);
  writeLine('Cardiorrespiratorio (palpitaciones, disnea, hipertensión...)', H.sintCardioresp);
  writeLine('Gastrointestinal (apetito, intolerancias, vómito, gastritis...)', H.sintGastro);
  writeLine('Genitourinario (menarca, vida sexual, gestas, secreciones...)', H.sintGenito);
  writeLine('Endocrino-Neuropsiquiátrico (convulsiones, alucinaciones...)', H.sintEndoNeuro);

  // Signos vitales
  checkPage(30);
  doc.setFillColor(239, 246, 255);
  doc.rect(M, y, CW, 6, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Signos Vitales', M + 3, y + 4.5);
  y += 8;

  const svData = [
    ['Presión Arterial', H.svPresion],
    ['F. Respiratoria', H.svFrecResp],
    ['F. Cardíaca', H.svFrecCard],
    ['Temperatura', H.svTemp],
    ['Peso', H.svPeso],
    ['Estatura', H.svEstatura],
  ];
  const svCols = 3;
  const svCellW = CW / svCols;
  for (let row = 0; row < 2; row++) {
    checkPage(16);
    for (let col = 0; col < svCols; col++) {
      const item = svData[row * svCols + col];
      if (!item) continue;
      const cx = M + col * svCellW;
      doc.setFillColor(248, 250, 252);
      doc.rect(cx, y, svCellW - 2, 13, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text((item[0] as string).toUpperCase(), cx + 2, y + 4.5);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text((item[1] as string | undefined)?.trim() || '—', cx + 2, y + 10.5);
    }
    y += 15;
  }
  y += 3;

  // ── 6. Examen Físico ────────────────────────────────────────────────────
  secHeader('6. EXAMEN FÍSICO');
  writeLine('Habitus exterior', H.fisicoHabitus);
  writeTwoCol('Cabeza', H.fisicoCabeza, 'ORL', H.fisicoOrl);
  writeTwoCol('Orofaringe', H.fisicoOrofaringe, 'Cuello', H.fisicoCuello);
  writeTwoCol('Tórax', H.fisicoTorax, 'Pulmones', H.fisicoPulmones);
  writeTwoCol('Corazón', H.fisicoCorazon, 'Abdomen', H.fisicoAbdomen);
  writeLine('Extremidades', H.fisicoExtremidades);

  // ── 7. Neurológico y Estado Mental ─────────────────────────────────────
  secHeader('7. EXAMEN NEUROLÓGICO Y ESTADO MENTAL');
  writeLine('Neurológico (reflejos, movimientos, función cerebral)', H.neuro);
  writeLine('Estado mental (orientación, lenguaje, afecto, juicio, memoria)', H.estadoMental);

  // ── 8. Diagnóstico ──────────────────────────────────────────────────────
  secHeader('8. DIAGNÓSTICO');
  const diags = (H.diagnosticos ?? []).filter(d => d?.trim());
  if (diags.length === 0) {
    checkPage(8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Sin diagnósticos registrados.', M, y);
    y += 6;
  } else {
    diags.forEach((d, i) => {
      checkPage(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${i + 1}.`, M, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(d.trim(), CW - 8);
      doc.text(lines, M + 6, y);
      y += lines.length * 3.5 + 2;
    });
  }
  y += 2;

  // ── 9. Recomendaciones ──────────────────────────────────────────────────
  secHeader('9. RECOMENDACIONES Y PLAN');
  writeLine('Plan / Recomendación 1', H.recomendacion1);
  writeLine('Plan / Recomendación 2', H.recomendacion2);

  // ── 10. Firma ────────────────────────────────────────────────────────────
  checkPage(35);
  secHeader('10. FIRMA DEL MÉDICO Y CÉDULA PROFESIONAL');
  if (H.firma?.trim()) {
    writeLine('Nombre / Firma del Médico', H.firma);
  } else {
    checkPage(22);
    doc.line(M, y + 12, M + 70, y + 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Firma del Médico Responsable', M, y + 16);
    y += 20;
  }
  writeLine('Cédula Profesional', H.cedula);

  // ── Footer en todas las páginas ──────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Marakame — Expediente Médico Clínico — Pág. ${i}/${pageCount}`, M, PH - 8);
    doc.text('CONFIDENCIAL — Uso exclusivo del personal médico autorizado', PW - M - 83, PH - 8);
  }

  const filename = `Expediente_${paciente.apellidoPaterno ?? 'Paciente'}_${paciente.id}.pdf`;
  doc.save(filename);
}
