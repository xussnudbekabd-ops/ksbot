/** Namuna ma'lumotlar bilan DOCX yaratib, faylga saqlaydi va tekshiradi. */
import fs from 'node:fs';
import db from '../src/db.js';
import { buildRegistrationsDocx } from '../src/docx.js';

db.exec('DELETE FROM registrations');

const demo = [
  ['Tarix - B guruh', '998901234567', 'Sardor Olimov', '13:00, 15:00', 'Kechqurun kelaman'],
  ['Tarix - A guruh', '998905554433', 'Alisher Karimov', '16:00', null],
  ['Matematika - 2-kurs', '998907778899', 'Nodira Tosheva', '13:00, 17:00, 19:00', "Yangi o'quvchi"],
  ['Fizika - A guruh', '998933445566', "Bekir Yo'ldoshev", '14:00', null],
  ['Ona tili - 3-kurs', '998912345678', 'Kamola Saidova', '13:00', null],
];

demo.forEach(([direction, phone, fullName, free_time, comment], i) =>
  db
    .prepare(
      `INSERT INTO registrations
       (telegram_id, username, full_name, phone, direction, course, free_time, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      100000 + i,
      'demo',
      fullName,
      phone,
      direction,
      process.env.COURSE || 'Kompyuter savodxonligi kursi',
      free_time,
      comment,
      new Date(Date.now() - i * 3600_000).toISOString(),
    ),
);

const rows = db.prepare('SELECT * FROM registrations ORDER BY id').all();
const buf = await buildRegistrationsDocx(rows);
fs.writeFileSync('test-report.docx', buf);

/* tekshiruv: bu zip formatidagi OOXML hujjat bo'lishi kerak */
const head = buf.subarray(0, 2).toString('latin1');
const xml = buf.toString('utf8');
console.log(`DOCX: ${rows.length} qator, ${buf.length} bayt`);
console.log('zip sarlavhasi:', head === 'PK' ? 'PK (to\'g\'ri)' : `${head} (XATO)`);
console.log('word/document.xml bor:', xml.includes('word/document.xml'));
console.log('"Tarix - B guruh" matni bor:', xml.includes('Tarix - B guruh') || xml.includes('Sardor'));
console.log('landscape:', xml.includes('landscape'));
