import 'dotenv/config';

const list = (value, fallback) => {
  if (value === undefined || value === null || value.trim() === '') return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const config = {
  botToken: process.env.BOT_TOKEN ?? '',
  adminIds: list(process.env.ADMIN_IDS, []).map(Number).filter((n) => Number.isFinite(n)),
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  adminPhone: process.env.ADMIN_PHONE ?? '',
  courseName: process.env.COURSE_NAME || "Kompyuter savodxonligi kursi",
  course: process.env.COURSE || process.env.COURSE_NAME || "Kompyuter savodxonligi kursi",
  coursePrice: process.env.COURSE_PRICE || "100.000 so'm",
  directionExample: process.env.DIRECTION_EXAMPLE || 'Tarix - B guruh',
  timeSlots: list(process.env.TIME_SLOTS, [
    '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00',
  ]),
  dbFile: process.env.DB_FILE || 'data/bot.db',
  pdfFont: process.env.PDF_FONT || '',
  maxLoginAttempts: 3,
  blockMinutes: 15,
  sessionMinutes: 30,
};

export const isAdmin = (userId) => config.adminIds.includes(Number(userId));

export function validateConfig() {
  const errors = [];
  if (!config.botToken) errors.push('BOT_TOKEN bo\'sh');
  if (!config.adminIds.length) errors.push('ADMIN_IDS bo\'sh');
  if (!config.adminPassword) errors.push('ADMIN_PASSWORD bo\'sh');
  if (errors.length) {
    console.error('Sozlamalar xatosi: ' + errors.join(', '));
    console.error('.env faylini to\'ldiring (namuna uchun .env.example)');
    process.exit(1);
  }
}
