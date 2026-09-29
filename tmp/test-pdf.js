/** Namuna ma'lumotlar bilan PDF yaratib, ko'rish uchun faylga saqlaydi. */
import fs from 'node:fs';
import db from '../src/db.js';
import { buildRegistrationsPdf } from '../src/pdf.js';

db.exec('DELETE FROM registrations');

const demo = [
  ['Tarix - B guruh', '998901234567', 'Sardor Olimov'],
  ['Tarix - A guruh', '998905554433', 'Alisher Karimov'],
  ['Matematika - 2-kurs', '998907778899', 'Nodira Tosheva'],
  ['Fizika - A guruh', '998933445566', 'Bekir Yo\'ldoshev'],
  ['Ona tili - 3-kurs', '998912345678', 'Kamola Saidova'],
];

demo.forEach(([direction, phone, fullName], i) =>
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
      i % 2 ? '13:00, 15:00' : '16:00',
      i === 0 ? 'Kechqurun kelaman' : null,
      new Date(Date.now() - i * 3600_000).toISOString(),
    ),
);

const rows = db.prepare('SELECT * FROM registrations ORDER BY id').all();
const pdf = await buildRegistrationsPdf(rows);
fs.writeFileSync('test-report.pdf', pdf);
console.log(`PDF: ${rows.length} qator, ${pdf.length} bayt`);
console.log('Birinchi 5 qator:');
for (const r of rows) console.log(`  ${r.id}. ${r.direction} | ${r.full_name} | ${r.free_time}`);
