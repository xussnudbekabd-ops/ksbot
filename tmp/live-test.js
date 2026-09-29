/** PDF va DOCX ni haqiqiy Telegram'da adminga yuboradi (tarmoq orqali). */
import { Bot, InputFile } from 'grammy';
import { config } from '../src/config.js';
import { getAllRegistrations } from '../src/db.js';
import { buildRegistrationsPdf } from '../src/pdf.js';
import { buildRegistrationsDocx } from '../src/docx.js';

const api = new Bot(config.botToken).api;
const me = await api.getMe();
console.log('Bot:', '@' + me.username);

let rows = getAllRegistrations();
if (!rows.length) {
  rows = [
    ['Sardor Olimov', '998901234567', 'Tarix - B guruh', '13:00, 15:00', 'Kechqurun kelaman'],
    ['Alisher Karimov', '998905554433', 'Tarix - A guruh', '16:00', null],
    ['Nodira Tosheva', '998907778899', 'Matematika - 2-kurs', '13:00, 17:00, 19:00', "Yangi o'quvchi"],
    ['Bekir Yo\'ldoshev', '998933445566', 'Fizika - A guruh', '14:00', null],
  ].map(([full_name, phone, direction, free_time, comment], i) => ({
    id: i + 1,
    telegram_id: 100000 + i,
    username: 'demo',
    full_name,
    phone,
    direction,
    course: config.course,
    free_time,
    comment,
    created_at: new Date(Date.now() - i * 3600_000).toISOString(),
  }));
  console.log('Eslatma: DB bo\'sh — namuna qatorlar bilan yuborilmoqda (bazaga yozilmaydi).');
}

const pdf = await buildRegistrationsPdf(rows);
await api.sendDocument(
  config.adminIds[0],
  new InputFile(pdf, `royxat-${Date.now()}.pdf`),
  { caption: `📋 <b>Sinov: PDF</b> — ${rows.length} ta qator.` },
);
console.log('✅ PDF yuborildi:', pdf.length, 'bayt');

const docx = await buildRegistrationsDocx(rows);
await api.sendDocument(
  config.adminIds[0],
  new InputFile(docx, `royxat-${Date.now()}.docx`),
  { caption: `📝 <b>Sinov: Word (docx)</b> — ${rows.length} ta qator.` },
);
console.log('✅ DOCX yuborildi:', docx.length, 'bayt');
