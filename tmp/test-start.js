/**
 * Botni haqiqiy ishga tushirib, tayyor bo'lguncha o'tgan vaqtni o'lchaydi
 * va to'xtatadi. Vaqt inchalar ichida o'lchanadi (tayyor bo'lish + to'xtatish).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const t0 = performance.now();
const out = fs.openSync('bot.log', 'w');
const err = fs.openSync('bot.err.log', 'w');
const child = spawn(process.execPath, ['src/index.js'], { stdio: ['ignore', out, err] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let readyMs = null;

for (let i = 0; i < 60 && readyMs === null; i += 1) {
  await sleep(100);
  if (fs.readFileSync('bot.log', 'utf8').includes('Bot ishga tushdi')) {
    readyMs = performance.now() - t0;
  }
}

const pid = child.pid;
const alive = child.exitCode === null && !child.killed;
child.kill('SIGINT');
await sleep(1500);
if (child.exitCode === null) child.kill('SIGKILL');
fs.closeSync(out);
fs.closeSync(err);

console.log(`PID ${pid}: ${alive ? "jarayon tirik edi" : "jarayon o'lgan"}`);
console.log(`Tayyor bo'lish vaqti: ${readyMs === null ? 'aniqlanmadi' : Math.round(readyMs) + ' ms'}`);
console.log('=== stdout ===');
console.log(fs.readFileSync('bot.log', 'utf8').trim() || "(bo'sh)");
console.log('=== stderr ===');
console.log(fs.readFileSync('bot.err.log', 'utf8').trim() || "(bo'sh)");
