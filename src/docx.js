import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { config } from './config.js';

const COLUMNS = [
  { title: '№', width: 700, align: AlignmentType.CENTER },
  { title: 'Ism-familiya', width: 3400, align: AlignmentType.LEFT },
  { title: 'Telefon', width: 2200, align: AlignmentType.LEFT },
  { title: 'Yo`nalish / guruh', width: 3000, align: AlignmentType.LEFT },
  { title: 'Kurs', width: 3400, align: AlignmentType.LEFT },
  { title: 'Bo`sh vaqti', width: 2600, align: AlignmentType.LEFT },
  { title: 'Sana', width: 2000, align: AlignmentType.LEFT },
];

const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso ?? '');
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${p(d.getFullYear())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const cell = (text, { bold = false, align = AlignmentType.LEFT, width = 2000, size = 18 } = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    verticalAlign: 'center',
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: String(text ?? ''), bold, size, font: 'Arial' })],
      }),
    ],
  });

const border = { style: BorderStyle.SINGLE, size: 4, color: '9AA0A6' };
const borders = { top: border, bottom: border, left: border, right: border };

/** Barcha ro'yxatni Word (.docx) fayliga aylantiradi va Buffer qaytaradi. */
export async function buildRegistrationsDocx(rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: COLUMNS.map((c) => cell(c.title, { bold: true, align: c.align, width: c.width, size: 18 })),
  });

  const bodyRows = rows.map((row, i) =>
    new TableRow({
      children: [
        cell(String(i + 1), { align: AlignmentType.CENTER, width: COLUMNS[0].width }),
        cell(row.full_name, { width: COLUMNS[1].width }),
        cell(`+${row.phone}`, { width: COLUMNS[2].width }),
        cell(row.direction, { width: COLUMNS[3].width }),
        cell(row.course, { width: COLUMNS[4].width }),
        cell(row.free_time, { width: COLUMNS[5].width }),
        cell(formatDate(row.created_at), { width: COLUMNS[6].width }),
      ],
    }),
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [headerRow, ...bodyRows],
  });

  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 60 },
      children: [new TextRun({ text: config.courseName, bold: true, size: 30, font: 'Arial' })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Kurs ro'yxati | narx: ${config.coursePrice} | jami: ${rows.length} ta talaba | sana: ${formatDate(new Date().toISOString())}`,
          size: 18,
          font: 'Arial',
        }),
      ],
    }),
  ];

  if (config.adminPhone) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: `Administrator: ${config.adminPhone}`, size: 18, font: 'Arial' })],
      }),
    );
  } else {
    children[children.length - 1].spacing.after = 120;
  }

  if (!rows.length) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Hozircha ro'yxatda talaba yo'q.", size: 20, font: 'Arial' })] }));
  } else {
    children.push(table);
  }

  const doc = new Document({
    creator: 'Telegram royxat boti',
    title: `${config.courseName} — ro'yxat`,
    description: `${rows.length} ta talaba`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906, orientation: 'landscape' },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Sahifa ', size: 16, font: 'Arial' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial' }),
                  new TextRun({ text: ' / ', size: 16, font: 'Arial' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: 'Arial' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
