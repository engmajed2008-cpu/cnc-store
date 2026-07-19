import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, '..', 'e3lani-investor.html');
const PDF  = path.join(__dirname, '..', 'e3lani-investor.pdf');

const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();

await page.goto('file:///' + HTML.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 30000 });

await page.pdf({
  path: PDF,
  format: 'A4',
  printBackground: true,
  // هوامش رأسية لمنع التصاق المحتوى بحافتي الصفحة عند انقسامه؛ الجوانب 0 لإبقاء الأقسام الملوّنة ملء العرض
  margin: { top: '9mm', right: '0', bottom: '9mm', left: '0' },
  displayHeaderFooter: false,
});

await browser.close();
console.log('Investor PDF saved:', PDF);
