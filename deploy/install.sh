#!/usr/bin/env bash
# =====================================================================
#  Telegram royxat boti — Ubuntu/Debian serverga bir buyruq bilan
#  o'rnatish. Foydalanish:
#     curl -fsSL https://raw.githubusercontent.com/xussnudbekabd-ops/ksbot/main/deploy/install.sh | sudo bash
#
#  Keyin:  nano /opt/ksbot/.env   →  BOT_TOKEN va ADMIN_* larni yozing
#         systemctl start ksbot
# =====================================================================
set -euo pipefail

REPO="https://github.com/xussnudbekabd-ops/ksbot.git"
APP_DIR="/opt/ksbot"
DATA_DIR="/var/lib/ksbot"
SERVICE_USER="ksbot"

info() { printf '\033[1;36m[INFO]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ OK ]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[XATO]\033[0m %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { err "root/sudo bilan ishga tushiring: sudo bash install.sh"; exit 1; }

# --- 1. Node.js 22+ -------------------------------------------------------
if command -v node >/dev/null 2>&1 && [[ "$(node -v | sed 's/v//;s/\..*//')" -ge 22 ]]; then
  ok "Node.js $(node -v) allaqachon o'rnatilgan"
else
  info "Node.js 22+ o'rnatilmoqda..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
  ok "Node.js $(node -v) o'rnatildi"
fi

# --- 2. PDF shriftlari (Arial yo'q, Linux'da DejaVu kerak) ---------------
if ! fc-list 2>/dev/null | grep -qi "dejavu"; then
  info "DejaVu shriftlari o'rnatilmoqda..."
  apt-get update -qq
  apt-get install -y --no-install-recommends fonts-dejavu-core >/dev/null
  ok "Shriftlar o'rnatildi"
fi

# --- 3. Loyiha kodi -------------------------------------------------------
if [[ -d "$APP_DIR/.git" ]]; then
  info "Kod yangilanmoqda..."
  git -C "$APP_DIR" pull --ff-only
else
  info "Kod yuklanmoqda..."
  git clone "$REPO" "$APP_DIR"
fi

# --- 4. Tizim foydalanuvchisi va papkalar --------------------------------
if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
  ok "Foydalanuvchi '$SERVICE_USER' yaratildi"
fi
mkdir -p "$DATA_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" "$DATA_DIR"

# --- 5. Bog'liqliklar -----------------------------------------------------
info "Paketlar o'rnatilmoqda (bu 1-2 daqiqa davom etadi)..."
cd "$APP_DIR"
sudo -u "$SERVICE_USER" npm ci --omit=dev
ok "Paketlar o'rnatildi"

# --- 6. .env fayli --------------------------------------------------------
if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  ok ".env yaratildi ($APP_DIR/.env) — hozir tahrirlang"
else
  info ".env allaqachon bor — o'zgartirilmadi"
fi
chmod 600 "$APP_DIR/.env"
chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/.env"

# --- 7. systemd xizmati ---------------------------------------------------
sed -i "s#^DB_FILE=.*#DB_FILE=$DATA_DIR/bot.db#" "$APP_DIR/.env" 2>/dev/null || true
cp "$APP_DIR/deploy/ksbot.service" /etc/systemd/system/ksbot.service
systemctl daemon-reload
systemctl enable ksbot >/dev/null 2>&1
ok "ksbot xizmati yoqilgan (avtomatik ishga tushadi)"

echo
printf '\033[1;33m====================================================\033[0m\n'
printf '\033[1;33m  Qolgan oxirgi qadam:\033[0m\n'
printf '\033[1;33m====================================================\033[0m\n'
echo "  1) .env faylni tahrirlang:"
echo "       nano $APP_DIR/.env"
echo "     Quyidagilarni yozing:"
echo "       BOT_TOKEN=<BotFather'dan yangi token>"
echo "       ADMIN_IDS=6021668919"
echo "       ADMIN_PASSWORD=<kuchli parol>"
echo "       ADMIN_PHONE=+998 93 174 16 08"
echo
echo "  2) Botni ishga tushiring:"
echo "       systemctl start ksbot"
echo
echo "  3) Holatini kuzating:"
echo "       systemctl status ksbot"
echo "       journalctl -u ksbot -f"
echo
