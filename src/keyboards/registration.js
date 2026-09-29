import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { CH } from '../constants.js';

const PER_ROW = 3;

export const startKeyboard = () =>
  new InlineKeyboard()
    .text("Ro'yxatdan o'tish", `${CH}start`)
    .text('Ma\'lumot', `${CH}info`);

export const directionKeyboard = () =>
  new InlineKeyboard()
    .text('🔄', `${CH}restart`)
    .text('✖️ Bekor qilish', `${CH}cancel`);

export const timeKeyboard = (selected = []) => {
  const kb = new InlineKeyboard();
  config.timeSlots.forEach((slot, i) => {
    const mark = selected.includes(slot) ? '✅ ' : '';
    kb.text(`${mark}${slot}`, `${CH}time:${slot}`);
    if ((i + 1) % PER_ROW === 0 && i + 1 < config.timeSlots.length) kb.row();
  });
  if (kb.inline_keyboard.at(-1).length) kb.row();
  return kb
    .text('◀️ Orqaga', `${CH}back:direction`)
    .text('🔄', `${CH}restart`)
    .text('✖️ Bekor qilish', `${CH}cancel`)
    .text('Keyingi ▶️', `${CH}time:next`);
};

export const commentKeyboard = () =>
  new InlineKeyboard()
    .text("Izoh yo'q", `${CH}comment:none`)
    .row()
    .text('◀️ Orqaga', `${CH}back:time`)
    .text('🔄', `${CH}restart`)
    .text('✖️ Bekor qilish', `${CH}cancel`);

export const confirmKeyboard = () =>
  new InlineKeyboard()
    .text('✅ Tasdiqlash', `${CH}confirm:yes`)
    .row()
    .text('✖️ Bekor qilish', `${CH}cancel`);
