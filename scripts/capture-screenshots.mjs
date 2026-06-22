import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'brand', 'screens');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3000';
const SHOTS = [
  { name: 'home',     url: '/ar' },
  { name: 'products', url: '/ar/products' },
  { name: 'configure', url: '/ar/configure' },
  { name: 'designer', url: '/ar/configure/signs/outdoor/led-letters/designer' },
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });

for (const s of SHOTS) {
  try {
    await page.goto(BASE + s.url, { waitUntil: 'networkidle2', timeout: 45000 });
    // امنح الوقت لمزامنة الألوان من Supabase والرسوم
    await new Promise(r => setTimeout(r, 3500));
    // أوقف الأنيميشن لالتقاط ثابت
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
    await new Promise(r => setTimeout(r, 400));
    const file = path.join(OUT, s.name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    console.log('✓', s.name, '→', file);
  } catch (e) {
    console.log('✗', s.name, '—', e.message);
  }
}

await browser.close();
console.log('done');
