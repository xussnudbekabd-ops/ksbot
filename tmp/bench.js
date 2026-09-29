/** Bot ishga tushish tezligini o'lchaydi. */
const t = [];
const mark = (label) => t.push([label, performance.now()]);

mark('boshlanish');
await import('../src/config.js');
mark('config');
await import('../src/db.js');
mark('db');
await import('../src/bot.js');
mark('bot (grammy + handlerlar)');
console.log(`>>> BOT TAYYOR: ${(t.at(-1)[1] - t[0][1]).toFixed(0)} ms (pdf/docx yuklanmagan)`);

await import('../src/pdf.js');
mark('pdf.js (faqat admin so\'raganda)');
await import('../src/docx.js');
mark("docx.js (faqat admin so'raganda)");

let prev = t[0][1];
for (let i = 1; i < t.length; i += 1) {
  console.log(`${t[i][0].padEnd(42)}: ${(t[i][1] - prev).toFixed(0)} ms`);
  prev = t[i][1];
}
