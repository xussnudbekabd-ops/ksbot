import { ctx as app } from '../context.js';
import { CH } from '../constants.js';
import { startKeyboard } from '../keyboards/registration.js';

export async function startHandler(bot) {
  bot.command('start', async (ctx) => {
    await ctx.reply(
      `Assalomu alaykum! 👋\n\n` +
        `📚 <b>${app.t('courseName')}</b>\n` +
        `💰 Narxi: <b>${app.t('coursePrice')}</b>\n\n` +
        `Ro'yxatdan o'tish uchun quyidagi tugmani bosing. So'rovnomada ism-familiya, telefon raqami, ` +
        `yo'nalishingiz va guruhingiz (masalan: ${app.t('directionExample')}) hamda o'zingizga qulay ` +
        `bo'sh vaqtni ko'rsatasiz.` +
        (app.t('adminPhone') ? `\n\n☎️ Savollar uchun: <b>${app.t('adminPhone')}</b>` : ''),
      { parse_mode: 'HTML', reply_markup: startKeyboard() },
    );
  });

  bot.callbackQuery(`${CH}info`, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📚 <b>${app.t('courseName')}</b>\n\n` +
        `💰 Narxi: <b>${app.t('coursePrice')}</b>\n` +
        `🎓 So'rovnomada yo'nalishingiz va guruhingizni yozing (masalan: <code>${app.t('directionExample')}</code>)\n` +
        `🕒 Dars vaqtlari: ${app.t('timeSlots').join(', ')}\n` +
        (app.t('adminPhone') ? `☎️ Administrator: <b>${app.t('adminPhone')}</b>\n` : '') +
        `\nBarcha savollar uchun administratorga murojaat qiling.`,
      { parse_mode: 'HTML' },
    );
  });
}
