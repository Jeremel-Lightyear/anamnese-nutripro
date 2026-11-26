// Exportação direta de PDF clínico A4 offline (jsPDF + jspdf-autotable) e importação via metadados UTF-8 Base64
import * as C from './calculations.js';
import { normalizePatient } from './state.js';
import { LAB_EXAMS, examForAge, labAgeBadge, labValue, evalExam } from './exams-data.js';
import { ageOf, anthroOf, buildSections } from './export.js';

const filled = (v) => v !== undefined && v !== null && String(v).trim() !== '';

/** Sanitiza caracteres fora do Latin-1 para fonte padrão do jsPDF preservando acentuação portuguesa. */
export function pdfText(str) {
  if (str === undefined || str === null) return '';
  let s = String(str)
    .replace(/\r\n/g, '\n')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[—–−]/g, '-')
    .replace(/[·•]/g, '-')
    .replace(/×/g, 'x')
    .replace(/→/g, '->')
    .replace(/≈/g, '~')
    .replace(/…/g, '...')
    .replace(/[µμ]g/g, 'mcg')
    .replace(/[µμ]/g, 'u')
    .replace(/Σ/g, 'Soma ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
  return s.replace(/[^\u0000-\u00FF]/g, '');
}

/** Codifica ficha do paciente em UTF-8 Base64 (somente ASCII) para embutir no PDF. */
export function encodePatientPayload(patient) {
  const json = JSON.stringify({ app: 'Anamnese NutriPro', schema: 1, patient });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `NUTRIPRO_V1_START:${btoa(bin)}:NUTRIPRO_V1_END`;
}

/** Extrai ficha do paciente a partir dos bytes de um PDF gerado pelo aplicativo. */
export function extractPatientFromPdfBytes(bufferOrUint8) {
  const u8 = bufferOrUint8 instanceof Uint8Array
    ? bufferOrUint8
    : new Uint8Array(bufferOrUint8);
  let text = '';
  if (typeof TextDecoder !== 'undefined') {
    text = new TextDecoder('latin1').decode(u8);
  } else {
    for (let i = 0; i < u8.length; i++) text += String.fromCharCode(u8[i]);
  }
  const m = /NUTRIPRO_V1_START:([A-Za-z0-9+/=]+):NUTRIPRO_V1_END/.exec(text);
  if (!m) {
    throw new Error('Este PDF não contém dados editáveis do Anamnese NutriPro. Use um PDF gerado pelo botão Salvar PDF do aplicativo.');
  }
  try {
    const bin = atob(m[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const jsonStr = new TextDecoder('utf-8').decode(bytes);
    const parsed = JSON.parse(jsonStr);
    const raw = parsed && parsed.patient ? parsed.patient : parsed;
    if (!raw || typeof raw !== 'object' || !raw.p || !raw.h) {
      throw new Error('Estrutura de paciente inválida');
    }
    return normalizePatient(raw);
  } catch (err) {
    if (err && String(err.message || '').includes('não contém dados')) throw err;
    throw new Error('Este PDF não contém dados editáveis do Anamnese NutriPro. Use um PDF gerado pelo botão Salvar PDF do aplicativo.');
  }
}

export function pdfFilename(patient) {
  const rawName = (patient && patient.p && patient.p.nome) ? patient.p.nome.trim() : 'Paciente';
  const cleanName = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Paciente';
  const dateStr = (patient && patient.p && /^\d{4}-\d{2}-\d{2}$/.test(patient.p.data || ''))
    ? patient.p.data
    : C.todayISO();
  return `Anamnese_${cleanName}_${dateStr}.pdf`;
}

function resolveJsPDF(opts) {
  const Ctor = (opts && opts.jsPDF)
    || (globalThis.jspdf && globalThis.jspdf.jsPDF)
    || globalThis.jsPDF;
  if (!Ctor) throw new Error('Biblioteca jsPDF não carregada.');
  return Ctor;
}

/** Gera documento jsPDF A4 clínico (sem elementos de Pokédex nas páginas visíveis). */
export function generatePatientPdf(patient, settings = {}, opts = {}) {
  const JsPDF = resolveJsPDF(opts);
  const doc = new JsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const S = settings || {};
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;
  const bottomLimit = pageH - 16;

  doc.setProperties({
    title: pdfText(`Anamnese Nutricional - ${(patient.p && patient.p.nome) || 'Paciente'}`),
    subject: 'Ficha de Anamnese Nutricional',
    author: pdfText(S.nome || 'Anamnese NutriPro'),
    creator: 'Anamnese NutriPro',
    keywords: encodePatientPayload(patient),
  });

  let y = 14;
  const ensureSpace = (h) => {
    if (y + h > bottomLimit) {
      doc.addPage();
      y = 14;
    }
  };

  // Cabeçalho clínico formal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 28, 34);
  doc.text(pdfText(S.clinica || 'Nutrição Clínica'), margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 90, 98);
  const rightTop = [S.nome, S.crn ? `CRN ${S.crn}` : ''].filter(filled).join(' - ');
  if (rightTop) doc.text(pdfText(rightTop), pageW - margin, y, { align: 'right' });

  const leftSub = [S.end, S.tel].filter(filled).join(' - ');
  if (leftSub) {
    y += 4;
    doc.text(pdfText(leftSub), margin, y);
  }
  y += 3;
  doc.setDrawColor(11, 122, 112);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 122, 112);
  doc.text('Ficha de Anamnese Nutricional', margin, y);
  y += 5;

  // Barra resumo do paciente
  const age = ageOf(patient);
  const pbarParts = [
    `Paciente: ${(patient.p && patient.p.nome) || '-'}`,
    filled(patient.p && patient.p.nasc) ? `Nasc.: ${C.fmtDateBR(patient.p.nasc)}${age ? ` (${age.years} anos)` : ''}` : '',
    filled(patient.p && patient.p.sexo) ? `Sexo: ${patient.p.sexo}` : '',
    `Data: ${C.fmtDateBR(patient.p && patient.p.data) || '-'}`,
  ].filter(Boolean);
  const pbarText = pdfText(pbarParts.join('   |   '));
  const pbarLines = doc.splitTextToSize(pbarText, contentW - 6);
  const pbarH = pbarLines.length * 4.2 + 4;
  doc.setFillColor(238, 245, 246);
  doc.setDrawColor(207, 221, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, pbarH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(25, 35, 42);
  doc.text(pbarLines, margin + 3, y + 4.5);
  y += pbarH + 5;

  const h = C.parseHeightM(patient.an && patient.an.altura);
  const labCtx = {
    sex: patient.p && patient.p.sexo,
    age: age ? age.years : null,
    ageMonths: age ? age.totalMonths : null,
    heightCm: h ? h * 100 : null,
  };

  const sections = buildSections(patient);
  sections.forEach((s) => {
    const isExamSec = s.title.startsWith('8.');
    ensureSpace(14);

    // Barra de título da seção
    doc.setFillColor(227, 242, 240);
    doc.rect(margin, y, contentW, 6.2, 'F');
    doc.setFillColor(11, 122, 112);
    doc.rect(margin, y, 1.6, 6.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(11, 90, 83);
    doc.text(pdfText(s.title), margin + 3.5, y + 4.3);
    y += 7.5;

    if (s.subtitle) {
      ensureSpace(5);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 90, 98);
      doc.text(pdfText(s.subtitle), margin, y + 2);
      y += 4.5;
    }

    // Linhas chave-valor
    s.rows.forEach(([label, val]) => {
      const lblTxt = pdfText(`${label}:`);
      const valTxt = pdfText(String(val));
      const lblW = 48;
      const valW = contentW - lblW - 2;
      const valLines = doc.splitTextToSize(valTxt, valW);
      const rowH = Math.max(4.6, valLines.length * 4.1 + 1.2);
      ensureSpace(rowH + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 60, 68);
      doc.text(doc.splitTextToSize(lblTxt, lblW - 2), margin, y + 3.4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 26, 30);
      doc.text(valLines, margin + lblW, y + 3.4);
      doc.setDrawColor(225, 230, 234);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, pageW - margin, y + rowH);
      y += rowH + 0.6;
    });

    if (s.rows.length) y += 2;

    if (isExamSec) {
      const dates = (patient.ex && patient.ex.dates) || [];
      const labRows = [];
      const rowTones = [];
      LAB_EXAMS.forEach((baseEx) => {
        const ex = examForAge(baseEx, labCtx);
        if (!dates.some((d) => filled(labValue(d, ex.k, labCtx)))) return;
        const cells = [pdfText(`${ex.n}${ex.u ? ' (' + ex.u + ')' : ''}`), pdfText(ex.r)];
        const tones = [null, null];
        dates.forEach((d) => {
          const val = labValue(d, ex.k, labCtx);
          if (!val) {
            cells.push('');
            tones.push(null);
          } else {
            const st = evalExam(ex.k, val, labCtx);
            const showSt = st && st.label ? `${val} (${st.label})` : val;
            cells.push(pdfText(showSt));
            tones.push(st ? st.tone : null);
          }
        });
        labRows.push(cells);
        rowTones.push(tones);
      });
      ((patient.ex && patient.ex.custom) || []).filter((c) => filled(c.nome)).forEach((c) => {
        if (!dates.some((d) => filled(labValue(d, c.id, labCtx)))) return;
        labRows.push([
          pdfText(`${c.nome}${c.unit ? ' (' + c.unit + ')' : ''}`),
          '-',
          ...dates.map((d) => pdfText(labValue(d, c.id, labCtx) || '')),
        ]);
        rowTones.push([null, null, ...dates.map(() => null)]);
      });

      if (labRows.length && typeof doc.autoTable === 'function') {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 40, 48);
        doc.text('Resultados', margin, y + 3);
        y += 4.5;
        const head = [['Exame', 'Referência', ...dates.map((d, i) => pdfText(filled(d.data) ? C.fmtDateBR(d.data) : `Coleta ${i + 1}`))]];
        doc.autoTable({
          startY: y,
          head,
          body: labRows,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 7.8, cellPadding: 1.6, textColor: [20, 26, 30], lineColor: [200, 212, 215], lineWidth: 0.2 },
          headStyles: { fillColor: [240, 244, 245], textColor: [20, 26, 30], fontStyle: 'bold' },
          didParseCell(data) {
            if (data.section === 'body') {
              const tone = rowTones[data.row.index] && rowTones[data.row.index][data.column.index];
              if (tone === 'bad') {
                data.cell.styles.textColor = [175, 32, 42];
                data.cell.styles.fillColor = [254, 242, 242];
                data.cell.styles.fontStyle = 'bold';
              } else if (tone === 'warn') {
                data.cell.styles.textColor = [154, 88, 12];
                data.cell.styles.fillColor = [255, 251, 235];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          },
        });
        y = doc.lastAutoTable.finalY + 4;
      }
    } else {
      s.tables.forEach((t) => {
        if (!t.body.length || typeof doc.autoTable !== 'function') return;
        ensureSpace(14);
        if (t.title) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 40, 48);
          doc.text(pdfText(t.title), margin, y + 3);
          y += 4.5;
        }
        doc.autoTable({
          startY: y,
          head: [t.head.map((c) => pdfText(c))],
          body: t.body.map((r) => r.map((c) => pdfText(c))),
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: t.wide ? 7.5 : 8, cellPadding: 1.6, textColor: [20, 26, 30], lineColor: [200, 212, 215], lineWidth: 0.2 },
          headStyles: { fillColor: [240, 244, 245], textColor: [20, 26, 30], fontStyle: 'bold' },
        });
        y = doc.lastAutoTable.finalY + 4;
      });
    }

    y += 2;
  });

  // Assinatura ao final
  ensureSpace(18);
  y += 4;
  doc.setDrawColor(60, 70, 78);
  doc.setLineWidth(0.35);
  const sigW = 80;
  doc.line((pageW - sigW) / 2, y + 6, (pageW + sigW) / 2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 58);
  const sigTxt = pdfText(`${S.nome || 'Assinatura do profissional'}${filled(S.crn) ? ' - CRN ' + S.crn : ''}`);
  doc.text(sigTxt, pageW / 2, y + 10.5, { align: 'center' });

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(210, 216, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 110, 118);
    doc.text(pdfText(`Anamnese NutriPro - Pagina ${p} de ${totalPages}`), pageW / 2, pageH - 7, { align: 'center' });
  }

  return { doc, filename: pdfFilename(patient) };
}

/** Dispara download direto do PDF via Blob (compatível com mobile/tablet/desktop). */
export function downloadPatientPdf(patient, settings = {}) {
  const { doc, filename } = generatePatientPdf(patient, settings);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
  return filename;
}
