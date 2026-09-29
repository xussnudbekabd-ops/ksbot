/** Eski (statik import) variant bilan taqqoslash uchun. */
const t0 = performance.now();
await import('../src/config.js');
await import('../src/db.js');
await import('../src/pdf.js');
await import('../src/docx.js');
await import('../src/bot.js');
console.log(`>>> BOT TAYYOR: ${(performance.now() - t0).toFixed(0)} ms (hammasi darhol yuklangan)`);
