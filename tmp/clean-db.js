import db from '../src/db.js';

const before = db.prepare('SELECT COUNT(*) AS c FROM registrations').get().c;
db.exec('DELETE FROM registrations');
db.exec("DELETE FROM sqlite_sequence WHERE name = 'registrations'");
const after = db.prepare('SELECT COUNT(*) AS c FROM registrations').get().c;
console.log(`registrations: ${before} → ${after}`);
