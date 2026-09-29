/**
 * Sodda holat (step) boshqaruvi: Map asosida, konversatsiya pluginisiz.
 * Kalit -> { step, data }
 */
export function createStore() {
  const map = new Map();
  return {
    get(key) {
      return map.get(key);
    },
    set(key, value) {
      map.set(key, value);
    },
    delete(key) {
      map.delete(key);
    },
    has(key) {
      return map.has(key);
    },
  };
}

export const isCancel = (text) => /^\/cancel(@\w+)?/i.test(String(text ?? '').trim());

/** Xabar buyruqmi (/start, /admin ...)? */
export const isBotCommand = (ctx) => {
  if (ctx.msg?.entities?.some((e) => e.type === 'bot_command')) return true;
  return /^\/[a-z0-9_]+(@\w+)?(\s|$)/i.test(ctx.msg?.text ?? '');
};
