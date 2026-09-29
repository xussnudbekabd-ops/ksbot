import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import { config } from './config.js';

const FONT_CANDIDATES = [
  'C:/Windows/Fonts/arial.ttf',
  'C:/Windows/Fonts/calibri.ttf',
  'C:/Windows/Fonts/segoeui.ttf',
  'C:/Windows/Fonts/times.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
];

let cachedFont;

function resolveFont() {
  if (cachedFont !== undefined) return cachedFont;
  const candidates = config.pdfFont ? [config.pdfFont, ...FONT_CANDIDATES] : FONT_CANDIDATES;
  cachedFont = candidates.find((file) => {
    try {
      return fs.existsSync(file);
    } catch {
      return false;
    }
  });
  return cachedFont;
}

const COLUMNS = [
  { title: 'в„–', width: 34, align: 'center' },
  { title: 'Ism-familiya', width: 160, align: 'left' },
  { title: 'Telefon', width: 100, align: 'left' },
  { title: 'Yo`nalish / guruh', width: 110, align: 'left' },
  { title: 'Kurs', width: 145, align: 'left' },
  { title: 'Bo`sh vaqti', width: 145, align: 'left' },
  { title: 'Sana', width: 90, align: 'left' },
];

const INK = '#1a1a1a';
const LINE = '#9aa0a6';
const HEAD_BG = '#e8eef5';

const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${p(d.getFullYear())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function makeDoc() {
  return new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 26, bottom: 34, left: 26, right: 26 },
    autoFirstPage: true,
  });
}

function usableWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function drawPageFooter(doc, fontName) {
  const y = doc.page.height - 24;
  const bottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc
    .font(fontName ?? 'Helvetica')
    .fontSize(7)
    .fillColor('#70757a')
    .text(
      `${config.courseName} вЂ” ro'yxat. Sahifa ${doc.page.number}`,
      doc.page.margins.left,
      y,
      { width: usableWidth(doc), align: 'center', lineBreak: false },
    );
  doc.page.margins.bottom = bottom;
}

function drawTitle(doc, fontName, rows) {
  doc.font(fontName ?? 'Helvetica').fontSize(15).fillColor(INK).text(config.courseName, { align: 'left' });
  doc
    .font(fontName ?? 'Helvetica')
    .fontSize(9)
    .fillColor('#4a5057')
    .text(
      `Kurs ro'yxati | narx: ${config.coursePrice} | jami: ${rows.length} ta talaba | sana: ${formatDate(
        new Date().toISOString(),
      )}`,
      { align: 'left' },
    );
  if (config.adminPhone) {
    doc
      .font(fontName ?? 'Helvetica')
      .fontSize(9)
      .fillColor('#4a5057')
      .text(`Administrator: ${config.adminPhone}`, { align: 'left' });
  }
  doc.moveDown(0.7);
}

function drawHeaderRow(doc, fontName) {
  const y = doc.y;
  const x0 = doc.page.margins.left;
  doc.rect(x0, y, usableWidth(doc), 20).fill(HEAD_BG);

  let x = x0;
  doc.font(fontName ?? 'Helvetica').fontSize(8.5).fillColor(INK);
  for (const col of COLUMNS) {
    doc.text(col.title, x + 4, y + 6, { width: col.width - 8, align: col.align, lineBreak: false });
    x += col.width;
  }

  doc.y = y + 20;
  doc
    .moveTo(x0, doc.y)
    .lineTo(x0 + usableWidth(doc), doc.y)
    .lineWidth(0.8)
    .strokeColor(INK)
    .stroke();
  return doc.y + 2;
}

function measureRow(doc, fontName, cells) {
  doc.font(fontName ?? 'Helvetica').fontSize(8.5);
  let height = 6;
  cells.forEach((value, i) => {
    const h = doc.heightOfString(String(value ?? ''), { width: COLUMNS[i].width - 8 });
    if (h + 8 > height) height = h + 8;
  });
  return height;
}

function drawRow(doc, fontName, cells, y, height) {
  const x0 = doc.page.margins.left;
  let x = x0;

  cells.forEach((value, i) => {
    const col = COLUMNS[i];
    doc
      .font(fontName ?? 'Helvetica')
      .fontSize(8.5)
      .fillColor(INK)
      .text(String(value ?? ''), x + 4, y + 4, {
        width: col.width - 8,
        align: col.align,
        lineBreak: false,
        ellipsis: true,
      });
    x += col.width;
  });

  doc
    .moveTo(x0, y + height)
    .lineTo(x0 + usableWidth(doc), y + height)
    .lineWidth(0.3)
    .strokeColor(LINE)
    .stroke();

  doc.y = y + height;
}

function toCells(row, index) {
  return [
    index,
    row.full_name,
    row.phone,
    row.direction,
    row.course,
    row.free_time,
    formatDate(row.created_at),
  ];
}

export async function buildRegistrationsPdf(rows, { title = 'Kurs ro\'yxati' } = {}) {
  const fontName = resolveFont();
  if (!fontName) {
    console.warn('PDF shrifti topilmadi — standart Helvetica ishlatiladi (PDF_FONT ni .env da ko\'rsating).');
  }
  const doc = makeDoc();
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  if (fontName) doc.font(fontName ?? 'Helvetica');

  if (!rows.length) {
    doc.font(fontName ?? 'Helvetica').fontSize(11).fillColor(INK).text('Hozircha ro\'yxatda talaba yo\'q.');
    drawPageFooter(doc, fontName ?? 'Helvetica');
    doc.end();
    return done;
  }

  drawTitle(doc, fontName, rows);
  let y = drawHeaderRow(doc, fontName);

  rows.forEach((row, index) => {
    const cells = toCells(row, index + 1);
    const height = measureRow(doc, fontName, cells);
    const limit = doc.page.height - doc.page.margins.bottom - 18;

    if (y + height > limit) {
      drawPageFooter(doc, fontName);
      doc.addPage();
      if (fontName) doc.font(fontName ?? 'Helvetica');
      drawTitle(doc, fontName, rows);
      y = drawHeaderRow(doc, fontName);
    }

    drawRow(doc, fontName, cells, y, height);
    y += height;
  });

  drawPageFooter(doc, fontName);
  doc.end();
  return done;
}
