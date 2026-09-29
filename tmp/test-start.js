/** Botni 12 soniya ishga tushirib, logini chiqarib, to'xtatadi. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const out = fs.openSync('bot.log', 'w');
const err = fs.openSync('bot.err.log', 'w');
const child = spawn(process.execPath, ['src/index.js'], { stdio: ['ignore', out, err] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(12000);

const pid = child.pid;
const alive = child.exitCode === null && !child.killed;
child.kill('SIGINT');
await sleep(2000);
if (child.exitCode === null) child.kill('SIGKILL');
fs.closeSync(out);
fs.closeSync(err);

console.log(`PID ${pid}: ${alive ? 'jarayon tirik edi' : 'jarayon o\'lgan'}`);
console.log('signal code:', child.signalCode ?? child.exitCode);
console.log('=== stdout ===');
console.log(fs.readFileSync('bot.log', 'utf8').trim() || '(bo\'sh)');
console.log('=== stderr ===');
console.log(fs.readFileSync('bot.err.log', 'utf8').trim() || "(bo'sh)");
