import puppeteer from './_tmp_pup/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = 'file:///' + path.resolve(__dirname, 'archi.html').replace(/\/g, '/');

const browser = await puppeteer.launch({
  executablePath: 'C:\Program Files\Google\Chrome\Application\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 960, height: 800, deviceScaleFactor: 2 });
await page.goto(htmlPath, { waitUntil: 'networkidle0' });
const bodyH = await page.evaluate(() => document.body.scrollHeight);
await page.setViewport({ width: 960, height: bodyH + 20, deviceScaleFactor: 2 });
await page.goto(htmlPath, { waitUntil: 'networkidle0' });
await page.screenshot({ path: path.resolve(__dirname, 'archi.png'), fullPage: true });
await browser.close();
console.log('Done: archi.png');
