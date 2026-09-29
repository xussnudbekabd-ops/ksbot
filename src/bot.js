import { Bot } from 'grammy';
import { config } from './config.js';
import { startHandler } from './handlers/start.js';
import { registerRegistrationHandlers } from './handlers/registration.js';
import { registerAdminHandlers } from './handlers/admin.js';

/** Botni yaratadi va barcha handlerlarni ulaydi. */
export function createBot(options = {}) {
  const bot = new Bot(options.token ?? config.botToken, options.botOptions);

  bot.catch((err) => {
    console.error('Bot xatosi:', err.error?.description ?? err.message);
  });

  startHandler(bot);
  registerRegistrationHandlers(bot);
  registerAdminHandlers(bot);

  bot.on('message:text', async (ctx) => {
    await ctx.reply("Nima qilishni bilmadim. Ro'yxatdan o'tish uchun /start bosing.");
  });

  return bot;
}
