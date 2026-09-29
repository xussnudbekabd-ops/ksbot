import { InlineKeyboard } from 'grammy';

export const A = {
  menu: 'adm:menu',
  pdf: 'adm:pdf',
  docx: 'adm:docx',
  stats: 'adm:stats',
  search: 'adm:search',
  last: 'adm:last',
  delete: 'adm:delete',
  exit: 'adm:exit',
};

export const adminMenuKeyboard = () =>
  new InlineKeyboard()
    .text("📋 Ro'yxat (PDF)", A.pdf)
    .text('📝 Ro\'yxat (Word)', A.docx)
    .row()
    .text('🔢 Statistika', A.stats)
    .text("🔍 Ism bo'yicha qidirush", A.search)
    .row()
    .text('🕒 Oxirgi 10 ta', A.last)
    .text('🗑️ O\'quvchini o\'chirish', A.delete)
    .row()
    .text('🚪 Chiqish', A.exit);

export const adminBackKeyboard = () =>
  new InlineKeyboard().text('⬅️ Menyuga', A.menu);
