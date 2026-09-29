import { config } from './config.js';

const esc = (s) => String(s ?? '-').replace(/[<>]/g, '');

/** Yangi ro'yxatdan o'tgan talaba haqidagi xabarni barcha adminlarga yuboradi. */
export async function notifyAdmins(ctx, row) {
  const text =
    '🔔 <b>YANGI RO\'YXATDAN O\'TGAN TALABA</b>\n\n' +
    `👤 Ism-familiya: ${esc(row.full_name)}\n` +
    `📞 Telefon: +${esc(row.phone)}\n` +
    `🎓 Yo'nalish va guruh: ${esc(row.direction)}\n` +
    `📘 Kurs: ${esc(row.course)}\n` +
    `🕒 Bo'sh vaqti: ${esc(row.free_time)}\n` +
    (row.comment ? `💬 Izoh: ${esc(row.comment)}\n` : '') +
    `📅 Sana: ${new Date(row.created_at).toLocaleString('uz-UZ')}\n` +
    `🆔 Telegram: ${row.telegram_id}`;

  for (const adminId of config.adminIds) {
    try {
      await ctx.api.sendMessage(adminId, text, { parse_mode: 'HTML' });
    } catch (err) {
      console.error(`Adminga yuborib bo'lmadi (${adminId}):`, err.description ?? err.message);
    }
  }
}
