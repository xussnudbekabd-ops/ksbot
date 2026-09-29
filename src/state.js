/**
 * Sodda holat (step) boshqaruvi: Map asosida, konversatsiya pluginisiz.
 * Kalit -> { step, data }
 *
 * Eskirgan yozuvlar vaqt o'tishi bilan o'z-o'zidan tozalanadi, shunda
 * bot uzoq ishlasa ham xotira oshmaydi (TTL: 6 soat).
 */
export function createStore({ ttlMs = 6 * 60 * 60 * 1000, maxKeys = 10000 } = {}) {
  const map = new Map();

  const purgeIfNeeded = () => {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (now - (entry.__at ?? now) > ttlMs) map.delete(key);
    }
    if (map.size > maxKeys) {
      const excess = map.size - maxKeys;
      let removed = 0;
      for (const key of map.keys()) {
        if (removed++ >= excess) break;
        map.delete(key);
      }
    }
  };

  let lastPurge = Date.now();
  const maybePurge = () => {
    const now = Date.now();
    if (now - lastPurge < 60 * 1000) return;
    lastPurge = now;
    purgeIfNeeded();
  };

  return {
    get(key) {
      const entry = map.get(key);
      if (entry) entry.__at = Date.now();
      return entry;
    },
    set(key, value) {
      value.__at = Date.now();
      map.set(key, value);
      maybePurge();
    },
    delete(key) {
      map.delete(key);
    },
    has(key) {
      return map.has(key);
    },
    get size() {
      return map.size;
    },
  };
}

export const isCancel = (text) => /^\/cancel(@\w+)?/i.test(String(text ?? '').trim());

/** Xabar buyruqmi (/start, /admin ...)? */
export const isBotCommand = (ctx) => {
  if (ctx.msg?.entities?.some((e) => e.type === 'bot_command')) return true;
  return /^\/[a-z0-9_]+(@\w+)?(\s|$)/i.test(ctx.msg?.text ?? '');
};
