/** Yaratilgan .docx faylini ochib, ichidagi XML ni tekshiradi. */
import fs from 'node:fs';
import JSZip from 'jszip';

const buf = fs.readFileSync('test-report.docx');
const zip = await JSZip.loadAsync(buf);
const names = Object.keys(zip.files);
console.log('Fayllar:', names.join(', '));

const xml = await zip.file('word/document.xml').async('string');
console.log('XML uzunligi:', xml.length);
console.log('landscape:', xml.includes('landscape'));
console.log('sarlavhalar:', ['Sardor Olimov', 'Tarix - B guruh', '+998901234567', 'Bo`ssh vaqti', '№'].map((t) => `${t}=${xml.includes(t)}`).join(' '));
const rows = (xml.match(/<w:tr[ >]/g) || []).length;
console.log('jadval qatorlari (1 sarlavha + ma\'lumot):', rows);
console.log('jami:', xml.match(/Jami/i) ? 'topildi' : 'yo\'q');
