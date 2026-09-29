#!/bin/sh
# Render.com da ishga tushirish skripti
set -e

echo "========================================"
echo "  Telegram royxat boti (Render)"
echo "========================================"

if [ -z "$BOT_TOKEN" ]; then
  echo "[XATO] BOT_TOKEN sozlanmagan!"
  echo "Render da Environment Variables ga BOT_TOKEN qo'shing."
  exit 1
fi

# .env fayli yo'q bo'lsa, muhit o'zgaruvchilaridan yaratamiz
if [ ! -f .env ]; then
  echo "[1/2] .env yaratilmoqda (Render muhitidan)"
  cat > .env <<EOF
BOT_TOKEN=$BOT_TOKEN
ADMIN_IDS=${ADMIN_IDS:-}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
ADMIN_PHONE=${ADMIN_PHONE:-}
COURSE_NAME=${COURSE_NAME:-Kompyuter savodxonligi kursi}
COURSE_PRICE=${COURSE_PRICE:-100.000 so'm}
DIRECTION_EXAMPLE=${DIRECTION_EXAMPLE:-Tarix - B guruh}
COURSE=${COURSE:-Kompyuter savodxonligi kursi}
TIME_SLOTS=${TIME_SLOTS:-10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00}
DB_FILE=${DB_FILE:-/app/data/bot.db}
PDF_FONT=${PDF_FONT:-}
EOF
  chmod 600 .env
else
  echo "[1/2] .env topildi"
fi

# Eski ma'lumotlar bazasini tekshirish
if [ -f "$DB_FILE" ]; then
  QATOR=$(node -e "
    import('./src/db.js').then(({default:db}) => {
      console.log(db.prepare('SELECT COUNT(*) n FROM registrations').get().n);
    }).catch(() => console.log('?'));
  " 2>/dev/null || echo "?")
  echo "[2/2] Baza: $DB_FILE — $QATOR ta ro'yxat"
else
  echo "[2/2] Baza: $DB_FILE — yangi fayl yaratiladi"
fi

echo "Bot ishga tushmoqda..."
echo "------------------------------------------------------------"
exec node src/index.js
