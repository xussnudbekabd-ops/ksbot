import { config, validateConfig } from './config.js';
import { createBot } from './bot.js';
import { closeDb } from './db.js';

validateConfig();

const bot = createBot();

bot
  .start({
    onStart: (me) => {
      console.log('✅ Bot ishga tushdi: @' + me.username);
      console.log('   Adminlar:', config.adminIds.join(', '));
      console.log('   Kurs:', config.courseName, '| narx:', config.coursePrice);
      console.log('   Baza:', config.dbFile);    },
  })
  .catch((err) => {
    if (err?.error_code === 409) {
      console.error("❌ Bot allaqachon ishlamoqda. Boshqa joyda (yoki boshqa terminalda) turibapti — o'ningni to'xtating.");
    } else {
      console.error('❌ Bot ishga tushmadi:', err?.error?.description ?? err.message);
    }
    process.exit(1);
  });

/* To'xtatish: avval pollingni, keyin bazani yopamiz — serverda ma'lumotlar saqlansin */
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    console.log('\nBot to\'xtatildi. Ma\'lumotlar bazasi saqlanmoqda...');
    try {
      await bot.stop();
    } catch {
      /* to'xtatishda xato bo'lsa ham davom etamiz */
    }
    closeDb();
    console.log('Saqlandi. Xayr!');
    process.exit(0);
  });
}
