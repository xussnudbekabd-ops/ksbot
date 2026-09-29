/**
 * Bot oqimlarini Telegram API'siz tekshirish: haqiqiy update'lar yaratilib
 * botning middleware zanjiri orqali yuboriladi, barcha API so'rovlari
 * intercept qilinadi (tarmoqqa chiqmaydi).
 */
import { createBot } from '../src/bot.js';
import { config } from '../src/config.js';
import { CH } from '../src/constants.js';
import { getAllRegistrations, deleteRegistration } from '../src/db.js';
import db from '../src/db.js';

const STUDENT_ID = 555000111;
const STUDENT2_ID = 555000222;
const ADMIN_ID = config.adminIds[0];

/* toza baza */
db.exec('DELETE FROM registrations');

const calls = [];
let messageId = 100;

const bot = createBot({ botOptions: { botInfo: { id: 1, is_bot: true, first_name: 'test', username: 'test_bot' } } });

bot.api.config.use((_prev, method, payload) => {
  calls.push({ method, payload });
  const result =
    method === 'answerCallbackQuery'
      ? true
      : {
          message_id: ++messageId,
          date: Math.floor(Date.now() / 1000),
          chat: { id: payload?.chat_id ?? payload?.user_id, type: 'private', first_name: 'Test' },
          text: payload?.text ?? '',
        };
  return { ok: true, result };
});

const user = (id) => ({ id, is_bot: false, first_name: 'Test', username: 'testuser' });
const chat = (id) => ({ id, type: 'private', first_name: 'Test' });

let updateId = 1;
const text = (id, body) => ({
  update_id: updateId++,
  message: { message_id: ++messageId, date: Math.floor(Date.now() / 1000), from: user(id), chat: chat(id), text: body },
});

/** Telegram buyruq xabari (bot_command entity'si bilan) */
const cmd = (id, body) => ({
  ...text(id, body),
  message: {
    ...text(id, body).message,
    entities: [{ type: 'bot_command', offset: 0, length: body.length }],
  },
});

const press = (id, data, messageText = 'x') => ({
  update_id: updateId++,
  callback_query: {
    id: String(updateId),
    from: user(id),
    chat_instance: 'test',
    message: { message_id: ++messageId, date: Math.floor(Date.now() / 1000), chat: chat(id), text: messageText },
    data,
  },
});

const send = async (update, label) => {
  const before = calls.length;
  await bot.handleUpdate(update);
  const used = calls.slice(before);
  const last = used.at(-1);
  console.log(`\n▶ ${label}`);
  console.log(`  API: ${used.map((c) => c.method).join(', ')}`);
  const line = (s) => String(s).replace(/\n/g, ' ⏎ ');
  if (last?.method === 'sendMessage') console.log(`  → ${line(last.payload.text)}`);
  if (last?.method === 'sendDocument') console.log(`  → ${last.payload.document?.filename}`);
};

const ok = [];
const fail = [];
const check = (cond, label) => (cond ? ok.push(label) : fail.push(label));

/* ============ 1. TELEFON FORMATLARI (o'quvchi 1, to'ldirmasdan) ============ */
await send(cmd(STUDENT_ID, '/start'), 'Oquvchi 1: /start');
await send(press(STUDENT_ID, `${CH}start`), "Oquvchi 1: 'Ro'yxatdan o'tish'");
await send(text(STUDENT_ID, 'Ali'), 'Ism-familiya: "Ali" (qisqa — qayta so\'raydi)');
await send(text(STUDENT_ID, 'Alisher Karimov'), "Ism-familiya: Alisher Karimov");
await send(text(STUDENT_ID, '12345'), "Telefon: 12345 (noto'g'ri)");
await send(text(STUDENT_ID, '90 123'), "Telefon: 90 123 (noto'g'ri)");
const beforePhone = calls.length;
await send(text(STUDENT_ID, '0901234567'), "Telefon: 0901234567 → +998901234567 (qabul qilindi)");
const phoneAccepted = calls.length > beforePhone && String(calls[beforePhone].payload.text).includes('Yo\'nalishingiz');
check(phoneAccepted, "Telefon '0901234567' → +998901234567 qabul qilindi");
await send(press(STUDENT_ID, `${CH}cancel`), 'Oquvchi 1: bekor qilish');

/* ============ 2. TO'LIQ RO'YXAT OQIMI (o'quvchi 2) ============ */
await send(text(STUDENT2_ID, 'salom'), 'Oquvchi 2: holatsiz matn (javob yo\'q emas)');
await send(press(STUDENT2_ID, `${CH}start`), "Oquvchi 2: 'Ro'yxatdan o'tish'");
await send(text(STUDENT2_ID, 'Sardor Olimov'), "Ism-familiya: Sardor Olimov");
await send(text(STUDENT2_ID, '998 90 555 44 33'), "Telefon: 998 90 555 44 33");
await send(text(STUDENT2_ID, 'IT'), "Yo'nalish: 'IT' (2 belgi — qayta so'raydi)");
const beforeDir = calls.length;
await send(text(STUDENT2_ID, 'Tarix - B guruh'), "Yo'nalish: Tarix - B guruh");
check(
  calls.length > beforeDir && String(calls[beforeDir].payload.text).includes('bo\'sh vaqt'),
  "Yo'nalish matn sifatida qabul qilindi",
);
await send(press(STUDENT2_ID, `${CH}time:next`), "Vaqt: hech narsa tanlanmagan — alert");
await send(press(STUDENT2_ID, `${CH}time:13:00`), "Vaqt: 13:00");
await send(press(STUDENT2_ID, `${CH}time:15:00`), "Vaqt: 15:00 (qo'shimcha)");
await send(press(STUDENT2_ID, `${CH}time:13:00`), "Vaqt: 13:00 (bekor qilindi)");
await send(press(STUDENT2_ID, `${CH}time:17:00`), "Vaqt: 17:00");
await send(press(STUDENT2_ID, `${CH}time:next`), "Vaqt: tanlangan bo'lishi");
await send(press(STUDENT2_ID, `${CH}comment:none`), "Izoh: 'Izoh yo'q'");
await send(press(STUDENT2_ID, `${CH}confirm:yes`), 'Tasdiqlash');

check(
  calls.some((c) => c.method === 'answerCallbackQuery' && c.payload?.show_alert),
  "Vaqt tanlanmagan holda 'Keyingi' alert beradi",
);

const rows = getAllRegistrations();
const last = rows.at(-1);
check(rows.length === 1, 'DB ga 1 ta yozuv saqlandi');
check(last?.full_name === 'Sardor Olimov', "Ism-familiya to'g'ri saqlandi");
check(last?.phone === '998905554433', "Telefon 998905554433 saqlandi");
check(last?.direction === 'Tarix - B guruh', "Yo'nalish 'Tarix - B guruh' saqlandi");
check(last?.course === config.course, `Kurs avtomatik: ${config.course}`);
check(last?.free_time === '15:00, 17:00', "Bo'sh vaqtlar '15:00, 17:00'");
check(!last?.comment, "Bo'sh izoh saqlandi");

const notify = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === ADMIN_ID);
check(
  notify.some(
    (c) =>
      String(c.payload.text).includes('Sardor Olimov') &&
      String(c.payload.text).includes('Tarix - B guruh') &&
      String(c.payload.text).includes('+998905554433'),
  ),
  'Adminga to\'liq xabar yuborildi',
);

const confirmMsg = calls.find((c) => c.method === 'sendMessage' && String(c.payload.text).includes('Ro\'yxatdan o\'tdingiz'));
check(Boolean(confirmMsg), "O'quvchiga tasdiqlash xabari yuborildi");

/* ============ 3. QAYTA RO'YXATDAN O'TISH OGOHLANTIRISHI ============ */
await send(press(STUDENT2_ID, `${CH}start`), "Oquvchi 2: yana ro'yxatdan o'tish");
check(
  calls.some((c) => c.method === 'sendMessage' && String(c.payload.text).includes('allaqachon ro\'yxatdan o\'tgansiz')),
  "Qayta ro'yxatda ogohlantirildi",
);
await send(cmd(STUDENT2_ID, '/cancel'), "Oquvchi 2: /cancel buyrug'i");
await send(text(STUDENT2_ID, 'salom'), 'Oquvchi 2: bekor qilingandan keyin matn');

/* ============ 4. ADMIN PANELI ============ */
await send(cmd(999999, '/admin'), "Begona foydalanuvchi: /admin");
check(
  calls.some((c) => c.method === 'sendMessage' && String(c.payload.text).includes('faqat admin uchun')),
  "Begona foydalanuvchi admin paneliga kira olmadi",
);

await send(cmd(ADMIN_ID, '/admin'), 'Admin: /admin');
await send(text(ADMIN_ID, 'noto-gri-parol'), "Admin: noto'g'ri parol");
await send(text(ADMIN_ID, config.adminPassword), "Admin: to'g'ri parol");
await send(press(ADMIN_ID, 'adm:stats', 'Menyu'), 'Admin: Statistika');
await send(press(ADMIN_ID, 'adm:last', 'Menyu'), 'Admin: Oxirgi 10 ta');
await send(press(ADMIN_ID, 'adm:pdf', 'Menyu'), "Admin: Ro'yxat (PDF)");
await send(press(ADMIN_ID, 'adm:docx', 'Menyu'), "Admin: Ro'yxat (Word)");
await send(press(ADMIN_ID, 'adm:search', 'Menyu'), 'Admin: Qidiruv');
await send(text(ADMIN_ID, 'Tarix'), "Admin: qidiruv 'Tarix'");
await send(text(ADMIN_ID, 'yoq'), "Admin: qidiruv — natija yo'q");
await send(press(ADMIN_ID, 'adm:delete', 'Menyu'), "Admin: O'chirish");
await send(text(ADMIN_ID, 'abc'), "Admin: noto'g'ri raqam kiritdi");
await send(text(ADMIN_ID, '9999'), "Admin: mavjud bo'lmagan №");
await send(text(ADMIN_ID, String(last.id)), 'Admin: to\'g\'ri raqam — o\'chirish');

check(getAllRegistrations().length === 0, "Admin o'chirish ishladi");
check(
  calls.filter((c) => c.method === 'sendDocument').length >= 2 &&
    calls.some((c) => c.payload?.document?.filename?.endsWith('.pdf')) &&
    calls.some((c) => c.payload?.document?.filename?.endsWith('.docx')),
  'Admin uchun ham PDF, ham Word (docx) fayl yuborildi',
);
await send(press(ADMIN_ID, 'adm:pdf', 'Menyu'), "Admin: bo'sh ro'yxat PDF");
await send(press(ADMIN_ID, 'adm:exit', 'Menyu'), 'Admin: Chiqish');
await send(press(ADMIN_ID, 'adm:stats', 'Menyu'), 'Admin: sessiya yopilganini tekshirish');
check(
  calls.some((c) => c.method === 'sendMessage' && String(c.payload.text).includes('Sessiya tugadi')),
  "Chiqgandan keyin sessiya yopildi",
);

/* toza baza */
db.exec('DELETE FROM registrations');

console.log('\n================ NATIJA ================');
for (const label of ok) console.log('  ✅', label);
for (const label of fail) console.log('  ❌', label);
console.log(`\n${ok.length} ta o'tdi, ${fail.length} ta xato`);
process.exit(fail.length ? 1 : 0);
