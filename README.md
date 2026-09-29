# 📚 Kompyuter savodxonligi — ro'yxat boti

Telegram boti: o'quvchilar o'zlari ro'yxatdan o'tadi, ma'lumotlar SQLite'ga saqlanadi,
adminga darhol xabar yuboriladi va istalgan paytda barcha ro'yxat PDF holatda yuklab olinadi.

## Xususiyatlar

- **Bosqichli so'rovnoma**: ism-familiya → telefon → yo'nalish va guruh → bo'sh vaqt → izoh → tasdiqlash
- **Erkin matn**: yo'nalish va guruhni o'quvchi o'zi yozadi (masalan `Tarix - B guruh`)
- **Telefon validatsiyasi**: `+998 90 123 45 67`, `90 123 45 67`, `090 123 45 67` — hammasi qabul qilinadi
- **Ko'p vaqtli tanlov**: o'quvchi bir nechta qulay vaqtni belgilaydi
- **Admin xabari**: har bir yangi ro'yxat bo'yicha barcha adminlarga to'liq ma'lumot yuboriladi
- **Admin paneli**: parol bilan kirish, statistika, qidiruv, oxirgi 10 ta, o'chirish, PDF

## Talablar

- Node.js 22.5 yoki yangiroq (sinabdan o'tgan: Node 24)
- Telegram bot tokeni va o'zingizning Telegram ID

## O'rnatish

```bash
npm install
```

`.env.example` faylini `.env` ga ko'chiring va to'ldiring:

```bash
cp .env.example .env
```

| O'zgaruvchi | Tavsifi |
| --- | --- |
| `BOT_TOKEN` | @BotFather dan olingan token |
| `ADMIN_IDS` | admin Telegram ID (bir nechta bo'lsa vergul bilan) |
| `ADMIN_PASSWORD` | admin panel paroli |
| `ADMIN_PHONE` | admin telefon raqami — xabarlar va PDF da kontakt sifatida chiqadi |
| `COURSE_NAME` | bot xabarlarida chiqadigan kurs nomi |
| `COURSE_PRICE` | ko'rsatiladigan narx |
| `DIRECTION_EXAMPLE` | yo'nalish uchun namuna (masalan: `Tarix - B guruh`) |
| `COURSE` | saqlanadigan kurs nomi (barcha o'quvchilar uchun bir xil) |
| `TIME_SLOTS` | tanlanadigan dars vaqtlari |
| `DB_FILE` | SQLite fayli (odatda `data/bot.db`) |
| `PDF_FONT` | ixtiyoriy shrift nomi |

## Ishga tushirish

**Windows:** `start.bat` faylini ikki marta bosing — u Node.js, kutubxonalar va `.env` mavjudligini tekshirib, botni o'zi ishga tushiradi.

**Qo'lda:**

```bash
npm start
```

## Buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `/start` | botni ishga tushirish va ro'yxatdan o'tish tugmasi |
| `/cancel` | joriy so'rovnomani bekor qilish |
| `/admin` | admin paneli (faqat `ADMIN_IDS` dagi ID'lar uchun) |

## Admin paneli

`/admin` → parol kiriting (3 urinish, 3 xato bilan 15 daqiqa bloklanadi, sessiya 30 daqiqa).

> Kirish huquqi **Telegram ID** bo'yicha tekshiriladi (`ADMIN_IDS`), telefon raqam (`ADMIN_PHONE`)
> faqat o'quvchiga kontakt sifatida ko'rsatiladi.

| Tugma | Vazifasi |
| --- | --- |
| 📋 Ro'yxat (PDF) | barcha o'quvchilar ro'yxatini PDF qilib yuborish |
| 📝 Ro'yxat (Word) | bir xil ro'yxat `.docx` formatida (Word/Excel da ochiladi) |
| 🔢 Statistika | jami, bugun, oxirgi 7 kun; yo'nalish, kurs va vaqtlar kesimida |
| 🔍 Ism bo'yicha qidirish | ism, telefon, yo'nalish yoki guruh bo'yicha qidirish |
| 🕒 Oxirgi 10 ta | so'nggi 10 ta ro'yxat |
| 🗑️ O'quvchini o'chirish | ro'yxat raqami (№) bo'yicha o'chirish |
| 🚪 Chiqish | sessiyani yopish |

PDF yaratilishda xatolik bo'lsa, bot avtomatik ravishda bir xil ro'yxatni Word formatida yuboradi.

## Ma'lumotlar bazasi

`data/bot.db` (SQLite). Jadval `registrations`:

| Ustun | Ma'nosi |
| --- | --- |
| `id` | ro'yxat raqami (PDF va o'chirishda ishlatiladi) |
| `telegram_id`, `username` | o'quvchining Telegram ma'lumotlari |
| `full_name` | ism-familiya |
| `phone` | `998XXXXXXXXX` ko'rinishida |
| `direction` | yo'nalish va guruh (masalan `Tarix - B guruh`) |
| `course` | kurs nomi |
| `free_time` | tanlangan bo'sh vaqtlar |
| `comment` | ixtiyoriy izoh |
| `created_at` | ro'yxatdan o'tgan vaqt |

## Serverga o'tkazish (24/7 ishlash uchun)

### 1. Bepul server (Oracle Cloud Always Free)

Eng arzon va barqaror yo'l — Oracle Cloud'da **doimiy bepul** VPS (2 CPU, 12 GB RAM, 200 GB disk).
[oracle.com/cloud/free](https://www.oracle.com/cloud/free/) dan ro'yxatdan o'ting →
**Create VM Instance** → image: *Ubuntu 22.04* → **Always Free-eligible** yozuvi bo'lgan shaklni tanlang.

Keyin serverga SSH bilan kirib, bitta buyrumni bajaring:

```bash
curl -fsSL https://raw.githubusercontent.com/xussnudbekabd-ops/ksbot/main/deploy/install.sh | sudo bash
```

Skript Node.js 22, shriftlar, kod, bog'liqliklar va `ksbot` systemd xizmatini o'rnatadi.

### 2. Sozlash

```bash
nano /opt/ksbot/.env
```

| O'zgaruvchi | Qiymat |
| --- | --- |
| `BOT_TOKEN` | @BotFather dan olingan **yangi** token |
| `ADMIN_IDS` | `6021668919` |
| `ADMIN_PASSWORD` | kuchli parol |
| `ADMIN_PHONE` | `+998 93 174 16 08` |

### 3. Ishga tushirish va kuzatish

```bash
systemctl start ksbot      # ishga tushirish
systemctl status ksbot     # holati
systemctl stop ksbot       # to'xtatish
systemctl restart ksbot    # qayta ishga tushirish
journalctl -u ksbot -f     # jonli loglar
```

Xizmat `Restart=always` bilan sozlangan — server qayta ishga tushsa yoki bot xato bilan
to'xtasa, o'zi avtomatik qayta ishga tushadi.

**Zaxira nusxa (muhim!):**

```bash
# ro'yxatlar bazasini yuklab olish
scp sizning-server:/var/lib/ksbot/bot.db ./bot-backup.db
```

### Render.com (to'lovli reja)

`render.yaml` va `Dockerfile` tayyor. Render bepul reja **bot uchun ishlamaydi**:
15 daqiqa faollikdan keyin xizmat o'chadi, qayta ishga tushishi 1 daqiqa oladi va SQLite
fayli har deploy'da yo'qoladi (doimiy disk faqat to'lovli rejada bor — `starter`, ~$7/oy).

### Nima uchun SQLite fayli alohida joyda?

Serverda baza `/opt/ksbot/data/` emas, **`/var/lib/ksbot/bot.db`** da saqlanadi — kod yangilanishi
(`git pull`) yoki `npm ci` da o'quvchi ma'lumotlari o'chmaydi. `systemd` fayli `SIGTERM` signalini
kutadi, bot avval pollingni to'xtatadi, keyin bazani yopadi — ma'lumotlar to'liq saqlanadi.

## Tuzilma

```
src/
  index.js      bot ishga tushiriladi
  bot.js        bot yaratiladi, handlerlar ulanadi
  config.js     .env dan sozlamalar
  db.js         SQLite bilan ishlash
  pdf.js        PDF ro'yxat generatori
  docx.js       Word (.docx) ro'yxat generatori
  state.js      qo'lda qilingan holatlar (FSM)
  context.js    sozlamalarni matn ko'rinishida berish
  helpers.js    yordamchi funksiyalar
  handlers/     start, registration, admin
  keyboards/    tugmalar

deploy/
  ksbot.service   systemd xizmati (24/7 ishlash uchun)
  install.sh      serverga bir buyruq bilan o'rnatish
```

## Test

Telegram API'siz tekshirish uchun `tmp/` papkasidagi skriptlar (bazani tozalab, o'zgartirib yuboradi):

```bash
node tmp/test-keyboards.js   # tugmalar tuzilmasi
node tmp/test-flow.js        # to'liq oqimlar (17 ta tekshiruv)
node tmp/test-pdf.js         # namuna PDF
node tmp/test-docx.js        # namuna DOCX + node tmp/check-docx.js (ichini tekshirish)
node tmp/clean-db.js         # bazani tozalash
node tmp/test-start.js       # botni ishga tushirib tayyor bo'lish vaqtini o'lchash
node tmp/bench.js            # modullar yuklanish tezligi
node tmp/live-test.js        # PDF va DOCX ni haqiqiy Telegram'ga yuborish
```

## Tezlik

- `pdfkit` va `docx` modullari faqat admin ro'yxat so'raganda yuklanadi (`import()` orqali),
  shuning uchun bot ishga tushishi tez — o'lchilgan **~0.5–0.8 s** (server javobgarligidan).
- SQLite uchun `WAL`, `synchronous = NORMAL`, 8 MB xotira keshi va `mmap_size` yoqilgan.
- Holatlar (FSM) saqlanadigan `Map` eskirgan yozuvlarni avtomatik tozalaydi (6 soat TTL,
  ko'pi bilan 10 000 yozuv), shunda uzoq ishlagan bot xotira yo'qotmaydi.

## Xavfsizlik

- `.env` `.gitignore` da — tokenni hech qachon repositoriyaga yuklamang.
- Token chat yoki jamiyatda ko'rinib turgan bo'lsa, @BotFather orqali `/revoke` bilan yangilang va `.env` ni yangilang.
- To'lov qabul qilinmaydi: bot faqat ro'yxatni qayd etadi.
