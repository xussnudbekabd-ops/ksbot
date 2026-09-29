import crypto from 'node:crypto';
import { InlineKeyboard } from 'grammy';
import { createStore, isBotCommand, isCancel } from '../state.js';
import { ADM } from '../constants.js';
import { config, isAdmin } from '../config.js';
import {
  deleteRegistration,
  getAllRegistrations,
  getRegistrationById,
  getStats,
  searchRegistrations,
} from '../db.js';
import { buildRegistrationsPdf } from '../pdf.js';
import { buildRegistrationsDocx } from '../docx.js';
import { adminMenuKeyboard } from '../keyboards/admin.js';

const store = createStore();
const sessions = new Map();
const attempts = new Map();

const MIN = 60 * 1000;
const esc = (s) => String(s ?? '').replace(/[<>&]/g, '');
const fmtDate = (iso) => new Date(iso).toLocaleString('uz-UZ');

function checkPassword(input) {
  const a = Buffer.from(String(input));
  const b = Buffer.from(config.adminPassword);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const blockedFor = (id) => {
  const rec = attempts.get(id);
  if (!rec?.until) return 0;
  const left = rec.until - Date.now();
  return left > 0 ? left : 0;
};

function registerFailure(id) {
  const rec = attempts.get(id) ?? { count: 0, until: 0 };
  rec.count += 1;
  let left = config.maxLoginAttempts - rec.count;
  if (left <= 0) {
    rec.until = Date.now() + config.blockMinutes * MIN;
    left = 0;
  }
  attempts.set(id, rec);
  return { left, blocked: left === 0 };
}

const clearAttempts = (id) => attempts.delete(id);
const closeSession = (id) => {
  sessions.delete(id);
  store.delete(id);
};

function openSession(id) {
  sessions.set(id, Date.now() + config.sessionMinutes * MIN);
  store.set(id, { step: 'menu' });
}

/** Faollikni yangilaydi, lekin joriy qadamni o'zgartirmaydi. */
function touchSession(id) {
  sessions.set(id, Date.now() + config.sessionMinutes * MIN);
}

function sessionValid(id) {
  const exp = sessions.get(id);
  if (!exp) return false;
  if (exp < Date.now()) {
    closeSession(id);
    return false;
  }
  return true;
}

async function showMenu(ctx) {
  const s = getStats();
  await ctx.reply(
    '🔐 <b>Admin panel</b>\n\n' +
      `👥 Jami talabalar: <b>${s.total}</b>\n` +
      `📅 Bugun: <b>${s.today}</b>\n` +
      `🗓️ Oxirgi 7 kun: <b>${s.week}</b>\n\n` +
      "📋 Ro'yxatni PDF yoki Word (docx) formatida yuklab olishingiz mumkin.\n\n" +
      'Quyidagi menyudan foydalaning:',
    { parse_mode: 'HTML', reply_markup: adminMenuKeyboard() },
  );
}

const fileName = (ext) => `registr-list-${new Date().toISOString().slice(0, 10)}.${ext}`;

async function sendPdf(ctx) {
  const rows = getAllRegistrations();
  const buffer = await buildRegistrationsPdf(rows);
  await ctx.replyWithDocument(
    { document: buffer, filename: fileName('pdf') },
    {
      caption: `📋 <b>${esc(config.courseName)}</b> — jami: ${rows.length} ta talaba`,
      parse_mode: 'HTML',
    },
  );
}

async function sendDocx(ctx) {
  const rows = getAllRegistrations();
  const buffer = await buildRegistrationsDocx(rows);
  await ctx.replyWithDocument(
    { document: buffer, filename: fileName('docx') },
    {
      caption: `📝 <b>${esc(config.courseName)}</b> — jami: ${rows.length} ta talaba`,
      parse_mode: 'HTML',
    },
  );
}

async function showStats(ctx) {
  const s = getStats();
  const fmt = (arr) => (arr.length ? arr.map((r) => `  • ${esc(r.label)}: ${r.n}`).join('\n') : '  —');
  const byTime = s.byTime.length
    ? s.byTime.map((r) => `  • ${esc(r.label)} → ${esc(r.free_time)}: ${r.n}`).join('\n')
    : '  —';

  await ctx.reply(
    '🔢 <b>Statistika</b>\n\n' +
      `👥 Jami: <b>${s.total}</b>\n` +
      `📅 Bugun: <b>${s.today}</b>\n` +
      `🗓️ Oxirgi 7 kun: <b>${s.week}</b>\n\n` +
      `🎓 <b>Yo'nalish / guruh kesimida:</b>\n${fmt(s.byDirection)}\n\n` +
      `📘 <b>Kurslar kesimida:</b>\n${fmt(s.byCourse)}\n\n` +
      `🕒 <b>Yo'nalish → bo'sh vaqt:</b>\n${byTime}`,
    { parse_mode: 'HTML', reply_markup: adminMenuKeyboard() },
  );
}

const formatList = (rows) =>
  rows
    .map(
      (r) =>
        `<b>№${r.id}</b> — ${esc(r.full_name)}\n` +
        `   📞 +${esc(r.phone)}\n` +
        `   🎯 ${esc(r.direction)} | 📘 ${esc(r.course)}\n` +
        `   🕒 ${esc(r.free_time)} | 📅 ${fmtDate(r.created_at)}`,
    )
    .join('\n\n');

async function showLast(ctx) {
  const rows = getAllRegistrations().slice(-10).reverse();
  if (!rows.length) {
    await ctx.reply("📭 Hozircha ro'yxatda talaba yo'q.", { reply_markup: adminMenuKeyboard() });
    return;
  }
  await ctx.reply(`🕒 <b>Oxirgi 10 ta talaba</b>\n\n${formatList(rows)}`, {
    parse_mode: 'HTML',
    reply_markup: adminMenuKeyboard(),
  });
}

const navKeyboard = () =>
  new InlineKeyboard().text('⬅️ Menyuga', `${ADM}menu`).text('🚪 Chiqish', `${ADM}exit`);

async function askQuery(ctx) {
  await ctx.reply("🔍 Ism, telefon, yo'nalish yoki guruh nomini yozing:", { reply_markup: navKeyboard() });
}

async function askDeleteId(ctx) {
  await ctx.reply("🗑️ O'chiriladigan talabaning <b>№</b> raqamini yozing:", {
    parse_mode: 'HTML',
    reply_markup: navKeyboard(),
  });
}

async function handleCallback(ctx) {
  const id = ctx.from.id;
  const action = ctx.callbackQuery.data.split(':')[1];

  if (!isAdmin(id)) {
    await ctx.answerCallbackQuery({ text: "Ruxsat yo'q", show_alert: true });
    return;
  }

  if (action === 'exit') {
    await ctx.answerCallbackQuery();
    closeSession(id);
    clearAttempts(id);
    await ctx.reply('🚪 Admin panelidan chiqildi. Xayr!');
    return;
  }

  if (!sessionValid(id)) {
    await ctx.answerCallbackQuery({ text: 'Sessiya tugadi. /admin bosing.', show_alert: true });
    await ctx.reply('⏱ Sessiya tugadi. Qayta kirish uchun /admin bosing.');
    return;
  }

  touchSession(id);

  switch (action) {
    case 'menu':
      await ctx.answerCallbackQuery();
      await showMenu(ctx);
      return;

    case 'pdf':
      await ctx.answerCallbackQuery('📄 PDF tayyorlanmoqda...');
      try {
        await sendPdf(ctx);
      } catch (err) {
        console.error('PDF xatosi:', err);
        await ctx.reply(
          "❌ PDF yaratishda xatolik yuz berdi. Word formatini yuborib ko'ramiz...",
        );
        try {
          await sendDocx(ctx);
        } catch (errDocx) {
          console.error('DOCX xatosi:', errDocx);
          await ctx.reply('❌ Word faylini ham yaratib bo\'lmadi. Botni qayta ishga tushiring (start.bat).');
        }
      }
      return;

    case 'docx':
      await ctx.answerCallbackQuery('📝 Word fayli tayyorlanmoqda...');
      try {
        await sendDocx(ctx);
      } catch (err) {
        console.error('DOCX xatosi:', err);
        await ctx.reply("❌ Word faylini yaratishda xatolik yuz berdi. Botni qayta ishga tushiring (start.bat).");
      }
      return;

    case 'stats':
      await ctx.answerCallbackQuery();
      await showStats(ctx);
      return;

    case 'last':
      await ctx.answerCallbackQuery();
      await showLast(ctx);
      return;

    case 'search':
      await ctx.answerCallbackQuery();
      store.set(id, { step: 'search' });
      await askQuery(ctx);
      return;

    case 'delete':
      await ctx.answerCallbackQuery();
      store.set(id, { step: 'delete' });
      await askDeleteId(ctx);
      return;

    default:
      await ctx.answerCallbackQuery();
      await showMenu(ctx);
  }
}

async function handleText(ctx) {
  const id = ctx.from.id;
  if (!isAdmin(id) || isBotCommand(ctx)) return false;
  const state = store.get(id);
  if (!state) return false;

  const text = ctx.message.text.trim();

  if (isCancel(text)) {
    closeSession(id);
    await ctx.reply('Bekor qilindi. Qayta kirish uchun /admin.');
    return true;
  }

  if (state.step === 'login') {
    if (checkPassword(text)) {
      clearAttempts(id);
      openSession(id);
      await ctx.reply('✅ Xush kelibsiz, admin!');
      await showMenu(ctx);
      return true;
    }
    const { left, blocked } = registerFailure(id);
    if (blocked) {
      closeSession(id);
      await ctx.reply(
        `🚫 Parol ${config.maxLoginAttempts} marta noto'g'ri. ${config.blockMinutes} daqiqa bloklandi.`,
      );
      return true;
    }
    await ctx.reply(`❌ Noto'g'ri parol. Qolgan urinishlar: <b>${left}</b>`, { parse_mode: 'HTML' });
    return true;
  }

  touchSession(id);

  if (state.step === 'search') {
    if (!text) {
      await askQuery(ctx);
      return true;
    }
    const rows = searchRegistrations(text);
    store.set(id, { step: 'menu' });
    if (!rows.length) {
      await ctx.reply(`🔍 <b>${esc(text)}</b> bo'yicha hech narsa topilmadi.`, {
        parse_mode: 'HTML',
        reply_markup: adminMenuKeyboard(),
      });
      return true;
    }
    await ctx.reply(`🔍 <b>${esc(text)}</b> — ${rows.length} ta natija:\n\n${formatList(rows)}`, {
      parse_mode: 'HTML',
      reply_markup: adminMenuKeyboard(),
    });
    return true;
  }

  if (state.step === 'delete') {
    if (!/^\d+$/.test(text)) {
      await ctx.reply("❌ Iltimos, faqat raqam yozing. Masalan: <code>3</code>", { parse_mode: 'HTML' });
      await askDeleteId(ctx);
      return true;
    }
    const num = Number(text);
    const row = getRegistrationById(num);
    if (!row) {
      await ctx.reply(`❌ <b>№${num}</b> raqamli talaba topilmadi.`, { parse_mode: 'HTML' });
      await askDeleteId(ctx);
      return true;
    }
    deleteRegistration(num);
    store.set(id, { step: 'menu' });
    await ctx.reply(`🗑️ O'chirildi: <b>№${num}</b> — ${esc(row.full_name)} (+${esc(row.phone)})`, {
      parse_mode: 'HTML',
    });
    await showMenu(ctx);
    return true;
  }

  return false;
}

export function registerAdminHandlers(bot) {
  bot.command('admin', async (ctx) => {
    const id = ctx.from.id;
    if (!isAdmin(id)) {
      await ctx.reply("⛔️ Bu buyruq faqat admin uchun.");
      return;
    }
    const left = blockedFor(id);
    if (left > 0) {
      await ctx.reply(`🚫 Juda ko'p urinish. Yana ${Math.ceil(left / MIN)} daqiqa kutib turing.`);
      return;
    }
    if (sessionValid(id)) {
      openSession(id);
      await showMenu(ctx);
      return;
    }
    store.set(id, { step: 'login' });
    await ctx.reply('🔐 <b>Admin panel</b>\nParolni kiriting:', {
      parse_mode: 'HTML',
      reply_markup: navKeyboard(),
    });
  });

  bot.callbackQuery(new RegExp(`^${ADM}`), (ctx) => handleCallback(ctx));

  bot.on('message:text', async (ctx, next) => {
    const handled = await handleText(ctx);
    if (!handled) return next();
  });
}
