import { createStore, isBotCommand, isCancel } from '../state.js';
import { ctx as app } from '../context.js';
import { CH } from '../constants.js';
import { config } from '../config.js';
import { addRegistration, getUserRegistration } from '../db.js';
import { notifyAdmins } from '../helpers.js';
import {
  confirmKeyboard,
  commentKeyboard,
  directionKeyboard,
  timeKeyboard,
} from '../keyboards/registration.js';

const store = createStore();

/** Telefonni 998XXXXXXXXX ko'rinishiga keltiradi. */
export function normalizePhone(raw) {
  let digits = norm(raw).replace(/^\+/, '');
  if (digits.length === 9) digits = '998' + digits;
  else if (digits.length === 10 && digits.startsWith('0')) digits = '998' + digits.slice(1);
  return /^998\d{9}$/.test(digits) ? digits : null;
}

const fresh = () => ({
  step: 'name',
  data: { fullName: '', phone: '', direction: '', times: [], comment: '' },
});

const esc = (s) => String(s ?? '').replace(/[<>&]/g, '');
const tail = (payload) => payload.split(':').slice(2).join(':');
const norm = (s) => String(s ?? '').trim().replace(/[\s()\-]/g, '');

const summary = (d) =>
  "📝 <b>So'rovnoma tayyor. Tekshiring:</b>\n\n" +
  `👤 Ism-familiya: ${esc(d.fullName)}\n` +
  `📞 Telefon: +${esc(d.phone)}\n` +
  `🎯 Yo'nalish va guruh: ${esc(d.direction)}\n` +
  `📘 Kurs: ${esc(app.t('course'))}\n` +
  `🕒 Bo'sh vaqti: ${esc(d.times.join(', '))}\n` +
  (d.comment ? `💬 Izoh: ${esc(d.comment)}\n` : '');

const askName = (ctx) => ctx.reply("👤 <b>Ism-familiyangizni</b> yozing:", { parse_mode: 'HTML' });
const askDirection = (ctx) =>
  ctx.reply(
    "🎓 <b>Yo'nalishingiz va guruhingizni</b> yozing.\n" +
      `Masalan: <code>${esc(app.t('directionExample'))}</code>`,
    { parse_mode: 'HTML', reply_markup: directionKeyboard() },
  );
const askTime = (ctx, selected = []) =>
  ctx.reply("🕒 O'zingizga qulay <b>bo'sh vaqt(lar)ni</b> tanlang (bir nechta bo'lishi mumkin):", {
    parse_mode: 'HTML',
    reply_markup: timeKeyboard(selected),
  });
const askComment = (ctx) =>
  ctx.reply("💬 <b>Izohingiz</b> bo'lsa yozing (ixtiyoriy):", { parse_mode: 'HTML', reply_markup: commentKeyboard() });

async function startFlow(ctx) {
  store.set(ctx.chat.id, fresh());
  const prev = getUserRegistration(ctx.from.id);
  if (prev) {
    await ctx.reply(
      `ℹ️ Siz allaqachon ro'yxatdan o'tgansiz (<b>№${prev.id}</b>). ` +
        "Yangi so'rovnoma to'ldirilsa, yangi yozuv qo'shiladi.",
      { parse_mode: 'HTML' },
    );
  }
  await askName(ctx);
}

async function cancelFlow(ctx) {
  store.delete(ctx.chat.id);
  await ctx.reply("Ro'yxatdan o'tish bekor qilindi. /start bosing.");
}

async function handleText(ctx) {
  const key = ctx.chat.id;
  const state = store.get(key);
  if (!state || isBotCommand(ctx)) return false;

  const text = ctx.message.text;
  if (isCancel(text)) {
    await cancelFlow(ctx);
    return true;
  }

  const value = text.trim();

  if (state.step === 'name') {
    if (value.length < 5) {
      await ctx.reply("⚠️ Iltimos, ism-familiyani to'liq yozing (kamida 5 ta belgi).");
      return true;
    }
    if (value.length > 80) {
      await ctx.reply('⚠️ Juda uzun. Iltimos, qisqaroq yozing (80 belgidan kam).');
      return true;
    }
    state.data.fullName = value;
    state.step = 'phone';
    store.set(key, state);
    await ctx.reply(
      '📱 Endi <b>telefon raqamingizni</b> yozing.\nMasalan: <code>998901234567</code>',
      { parse_mode: 'HTML' },
    );
    return true;
  }

  if (state.step === 'phone') {
    const digits = normalizePhone(value);
    if (!digits) {
      await ctx.reply("❌ Raqam noto'g'ri. Format: <code>+998 90 123 45 67</code>", { parse_mode: 'HTML' });
      return true;
    }
    state.data.phone = digits;
    state.step = 'direction';
    store.set(key, state);
    await askDirection(ctx);
    return true;
  }

  if (state.step === 'direction') {
    if (value.length < 3) {
      await ctx.reply("⚠️ Yo'nalishingizni to'liqroq yozing (kamida 3 ta belgi).");
      return true;
    }
    if (value.length > 60) {
      await ctx.reply('⚠️ Juda uzun. Iltimos, qisqaroq yozing (60 belgidan kam).');
      return true;
    }
    state.data.direction = value;
    state.step = 'time';
    store.set(key, state);
    await askTime(ctx);
    return true;
  }

  if (state.step === 'comment') {
    state.data.comment = value.slice(0, 300);
    state.step = 'confirm';
    store.set(key, state);
    await ctx.reply(summary(state.data), { parse_mode: 'HTML', reply_markup: confirmKeyboard() });
    return true;
  }

  await ctx.reply("Iltimos, quyidagi tugmalardan birini bosing. Bekor qilish uchun /cancel yozing.");
  return true;
}

async function handleCallback(ctx) {
  const key = ctx.chat.id;
  const payload = ctx.callbackQuery.data;
  const action = payload.split(':')[1];

  let acked = false;
  const ack = async (opts) => {
    if (acked) return;
    acked = true;
    await ctx.answerCallbackQuery(opts);
  };

  if (action === 'start') {
    await ack();
    await startFlow(ctx);
    return;
  }
  if (action === 'cancel') {
    await ack();
    await cancelFlow(ctx);
    return;
  }

  const state = store.get(key);
  if (!state) {
    await ack();
    await ctx.reply("Ro'yxat jarayoni tugagan. Yana boshlash uchun /start bosing.");
    return;
  }

  const data = state.data;

  if (action === 'restart') {
    await ack();
    store.set(key, fresh());
    await ctx.reply("🔄 So'rovnoma tozalandi. Qaytadan boshlaymiz.");
    await askName(ctx);
    return;
  }

  if (action === 'time') {
    const value = tail(payload);

    if (value === 'next') {
      if (!data.times.length) {
        await ack({ text: 'Avval kamida bitta vaqt tanlang', show_alert: true });
        return;
      }
      state.step = 'comment';
      store.set(key, state);
      await ack();
      await askComment(ctx);
      return;
    }

    if (!config.timeSlots.includes(value)) {
      await ack();
      return;
    }

    await ack();
    data.times = data.times.includes(value)
      ? data.times.filter((t) => t !== value)
      : [...data.times, value].sort((a, b) => config.timeSlots.indexOf(a) - config.timeSlots.indexOf(b));

    try {
      await ctx.editMessageReplyMarkup({ reply_markup: timeKeyboard(data.times) });
    } catch {
      /* eski xabar bo'lsa e'tiborsiz qoldiramiz */
    }
    return;
  }

  if (payload === `${CH}back:direction`) {
    state.step = 'direction';
    store.set(key, state);
    await ack();
    await askDirection(ctx);
    return;
  }

  if (payload === `${CH}back:time`) {
    state.step = 'time';
    store.set(key, state);
    await ack();
    await askTime(ctx, data.times);
    return;
  }

  if (action === 'comment') {
    if (tail(payload) === 'none') data.comment = '';
    state.step = 'confirm';
    store.set(key, state);
    await ack();
    await ctx.reply(summary(data), { parse_mode: 'HTML', reply_markup: confirmKeyboard() });
    return;
  }

  if (action === 'confirm') {
    if (!payload.endsWith(':yes')) {
      await ack();
      await cancelFlow(ctx);
      return;
    }
    store.delete(key);
    await ack();
    try {
      const row = addRegistration({
        telegramId: ctx.from.id,
        username: ctx.from.username ?? null,
        fullName: data.fullName,
        phone: data.phone,
        direction: data.direction,
        course: app.t('course'),
        freeTime: data.times.join(', '),
        comment: data.comment,
      });
      await ctx.reply(
        "✅ <b>Ro'yxatdan o'tdingiz!</b>\n\n" +
          `🎯 Yo'nalish va guruh: ${esc(data.direction)}\n` +
          `📘 Kurs: ${esc(app.t('course'))}\n` +
          `🕒 Bo'sh vaqti: ${esc(data.times.join(', '))}\n` +
          `💰 Narxi: ${esc(app.t('coursePrice'))}\n\n` +
          "Ma'lumotlaringiz saqlandi va administratorga yuborildi. Siz bilan bog'lanamiz.\n" +
          `Ro'yxat raqami: <b>№${row.id}</b>`,
        { parse_mode: 'HTML' },
      );
      await notifyAdmins(ctx, row);
    } catch (err) {
      console.error('Saqlashda xatolik:', err);
      await ctx.reply("❌ Xatolik yuz berdi. Iltimos, administratorga murojaat qiling.");
    }
    return;
  }

  await ack();
}

export function registerRegistrationHandlers(bot) {
  bot.callbackQuery(new RegExp(`^${CH}`), (ctx) => handleCallback(ctx));

  bot.command('cancel', async (ctx, next) => {
    if (!store.has(ctx.chat.id)) return next();
    await cancelFlow(ctx);
  });

  bot.on('message:text', async (ctx, next) => {
    const handled = await handleText(ctx);
    if (!handled) return next();
  });
}
