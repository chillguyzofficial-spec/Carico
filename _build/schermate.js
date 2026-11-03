// Fotografa le schermate vere di app e gestionale per il sito (assets/sito/*.webp).
// Da rilanciare dopo ogni modifica grafica dell'app: node _build/schermate.js
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');

const RADICE = path.join(__dirname, '..');
const USCITA = path.join(RADICE, 'assets', 'sito');
const URL = (f) => 'file:///' + path.join(RADICE, f).replace(/\\/g, '/').replace(/ /g, '%20');

async function webp(page, png, file, larghezza) {
  const dati = await page.evaluate(async ({ b64, w }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = Math.round(img.height * w / img.width);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', 0.86).split(',')[1];
  }, { b64: png.toString('base64'), w: larghezza });
  fs.writeFileSync(path.join(USCITA, file), Buffer.from(dati, 'base64'));
  console.log(file, Math.round(fs.statSync(path.join(USCITA, file)).size / 1024) + ' KB');
}

(async () => {
  fs.mkdirSync(USCITA, { recursive: true });
  const browser = await chromium.launch();
  const conv = await browser.newPage();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
  await ctx.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const p = await ctx.newPage();
  const scatta = async (url, file, prima) => {
    await p.goto(URL(url)); await p.waitForTimeout(900);
    if (prima) { await prima(); await p.waitForTimeout(500); }
    await p.evaluate(() => document.getElementById('avviso').classList.remove('su'));
    await webp(conv, await p.screenshot(), file, 600);
  };
  await scatta('app.html?giorno=4', 'app-oggi.webp');
  await scatta('app.html?giorno=4#allenamento', 'app-allenamento.webp', async () => { await p.evaluate(() => localStorage.removeItem('pt-sessione-' + new Date().toISOString())); });
  await scatta('app.html?giorno=4#allenamento', 'app-recupero.webp', async () => { await p.click('#fatta'); await p.waitForTimeout(1300); });
  await scatta('app.html?giorno=4#coach/' + encodeURIComponent('Lento avanti · Push A · Serie 2 · 42,5 kg × 8'), 'app-chat.webp', async () => { await p.fill('#testo-chat', 'A fine serie sento la spalla destra, è normale?'); });
  await scatta('app.html?giorno=4#progressi', 'app-progressi.webp');
  await p.evaluate(() => Object.keys(localStorage).forEach((k) => localStorage.removeItem(k)));

  const pc = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
  await pc.goto(URL('coach.html')); await pc.waitForTimeout(900);
  await webp(conv, await pc.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 1000 } }), 'coach.webp', 1600);
  await browser.close();
})();
