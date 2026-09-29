import { config, validateConfig } from './config.js';
import { createBot } from './bot.js';

validateConfig();

const bot = createBot();

bot
  .start({
    onStart: (me) => {
      console.log('✅ Bot ishga tushdi: @' + me.username);
      console.log('   Adminlar:', config.adminIds.join(', '));
      console.log('   Kurs:', config.courseName, '| narx:', config.coursePrice);
    },
  })
  .catch((err) => {
    if (err?.error_code === 409) {
      console.error("❌ Bot allaqachon ishlamoqda. Boshqa joyda (yoki boshqa terminalda) turibapti — o'ningni to'xtating.");
    } else {
      console.error('❌ Bot ishga tushmadi:', err?.error?.description ?? err.message);
    }
    process.exit(1);
  });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log("\nBot to'xtatildi.");
    try {
      await bot.stop();
    } catch {
      /* to'xtatishda xato bo'lsa ham chiqamiz */
    }
    process.exit(0);
  });
}
