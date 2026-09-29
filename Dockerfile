# Render.com uchun Docker image
# Node.js 24 slim — kichikroq va tezroq

FROM node:24-slim

# pdfkit uchun shriftlar (Arial yo'q, Linux'da DejaVu kerak)
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Avval paketlar (qatlam keshi uchun)
COPY package*.json ./
RUN npm ci --omit=dev

# Kod
COPY src ./src
COPY start.sh ./

# Ma'lumotlar bazasi uchun papka (Render diskiga ulanadi)
RUN mkdir -p /app/data
ENV DB_FILE=/app/data/bot.db

ENV NODE_ENV=production

# SIGTERM ni to'g'ri qabul qilish uchun
STOPSIGNAL SIGTERM

CMD ["sh", "./start.sh"]
