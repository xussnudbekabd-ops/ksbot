import { createBot } from '../src/bot.js';
import { config } from '../src/config.js';
import { CH } from '../src/constants.js';
import {
  commentKeyboard,
  confirmKeyboard,
  directionKeyboard,
  startKeyboard,
  timeKeyboard,
} from '../src/keyboards/registration.js';
import { adminMenuKeyboard } from '../src/keyboards/admin.js';

const keys = {
  start: startKeyboard(),
  'Yo\'nalish (matn kiritiladi)': directionKeyboard(),
  "Bo'sh vaqt (tanlanmagan)": timeKeyboard(),
  "Bo'sh vaqt (13:00 tanlangan)": timeKeyboard(['13:00', '17:00']),
  Izoh: commentKeyboard(),
  Tasdiqlash: confirmKeyboard(),
  'Admin menyu': adminMenuKeyboard(),
};

let bad = 0;
for (const [name, kb] of Object.entries(keys)) {
  const json = JSON.parse(JSON.stringify(kb));
  const rows = json.inline_keyboard;
  const buttons = rows.flat();
  const problems = [];
  if (rows.some((r) => !Array.isArray(r) || r.length === 0)) problems.push('bo\'sh/nest qator');
  if (buttons.some((b) => !b.callback_data || typeof b.callback_data !== 'string')) problems.push('callback_data yo\'q');
  if (buttons.some((b) => b.callback_data?.length > 64)) problems.push('callback_data 64 belgidan uzun');
  bad += problems.length;
  console.log(`\n${name}: ${rows.length} qator, ${buttons.length} tugma ${problems.length ? '❌ ' + problems.join(', ') : '✅'}`);
  rows.forEach((r) => console.log('   ' + r.map((b) => b.text).join(' | ')));
}
console.log(`\nXatolar: ${bad} | slotlar soni: ${config.timeSlots.length}`);
process.exit(bad ? 1 : 0);
