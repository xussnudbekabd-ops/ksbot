import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config.js';

fs.mkdirSync(path.dirname(path.resolve(config.dbFile)), { recursive: true });

const db = new Database(config.dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    username    TEXT,
    full_name   TEXT NOT NULL,
    phone       TEXT NOT NULL,
    direction   TEXT NOT NULL,
    course      TEXT NOT NULL,
    free_time   TEXT NOT NULL,
    comment     TEXT,
    created_at  TEXT NOT NULL
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations (created_at DESC);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_registrations_tg ON registrations (telegram_id);`);

const columns = `id, telegram_id, username, full_name, phone, direction, course, free_time, comment, created_at`;

export function addRegistration(data) {
  const row = {
    telegram_id: data.telegramId,
    username: data.username ?? null,
    full_name: data.fullName,
    phone: data.phone,
    direction: data.direction,
    course: data.course,
    free_time: data.freeTime,
    comment: data.comment || null,
    created_at: new Date().toISOString(),
  };
  const info = db
    .prepare(
      `INSERT INTO registrations
        (telegram_id, username, full_name, phone, direction, course, free_time, comment, created_at)
       VALUES
        (@telegram_id, @username, @full_name, @phone, @direction, @course, @free_time, @comment, @created_at)`,
    )
    .run(row);
  return { id: Number(info.lastInsertRowid), ...row };
}

export function getAllRegistrations() {
  return db.prepare(`SELECT ${columns} FROM registrations ORDER BY id ASC`).all();
}

export function getRegistrationById(id) {
  return db.prepare(`SELECT ${columns} FROM registrations WHERE id = ?`).get(id);
}

export function searchRegistrations(query) {
  const like = `%${query}%`;
  return db
    .prepare(
      `SELECT ${columns} FROM registrations
        WHERE full_name LIKE ? OR phone LIKE ? OR direction LIKE ? OR course LIKE ?
        ORDER BY id ASC`,
    )
    .all(like, like, like, like);
}

export function deleteRegistration(id) {
  return db.prepare(`DELETE FROM registrations WHERE id = ?`).run(id).changes > 0;
}

export function getUserRegistration(telegramId) {
  return db
    .prepare(`SELECT ${columns} FROM registrations WHERE telegram_id = ? ORDER BY id DESC LIMIT 1`)
    .get(telegramId);
}

export function getStats() {
  const total = db.prepare(`SELECT COUNT(*) AS n FROM registrations`).get().n;
  const today = db
    .prepare(`SELECT COUNT(*) AS n FROM registrations WHERE date(created_at) = date('now')`)
    .get().n;
  const week = db
    .prepare(`SELECT COUNT(*) AS n FROM registrations WHERE created_at >= datetime('now', '-7 days')`)
    .get().n;
  const byDirection = db
    .prepare(`SELECT direction AS label, COUNT(*) AS n FROM registrations GROUP BY direction ORDER BY n DESC`)
    .all();
  const byCourse = db
    .prepare(`SELECT course AS label, COUNT(*) AS n FROM registrations GROUP BY course ORDER BY n DESC`)
    .all();
  const byTime = db
    .prepare(
      `SELECT direction AS label, free_time, COUNT(*) AS n FROM registrations
        GROUP BY direction, free_time ORDER BY n DESC`,
    )
    .all();
  return { total, today, week, byDirection, byCourse, byTime };
}

export default db;
