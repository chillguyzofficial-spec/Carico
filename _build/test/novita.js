const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = 'C:/Users/Claude FK/.claude/projects/gym app';
const tipi = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': tipi[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8993);
const out = process.argv[2]; let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
const U = 'http://localhost:8993/app.html';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  p.on('dialog', d => d.accept());
  const largo = async (n) => { const x = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `sborda ${n}: +${x}`); };
  // primo avvio
  await p.goto(U + '?giorno=4'); await p.waitForTimeout(800);
  v(await p.isVisible('#codice'), 'primo avvio: campo codice');
  v(await p.isHidden('.menu'), 'primo avvio senza menu');
  await p.screenshot({ path: out + '/n-benvenuto.png' }); await largo('benvenuto');
  await p.fill('#codice', 'abc'); await p.click('button[type=submit]'); await p.waitForTimeout(200);
  v((await p.textContent('#nota-codice')).includes('6 caratteri'), 'errore codice corto');
  await p.fill('#codice', ''); await p.type('#codice', 'XYZ123'); await p.waitForTimeout(200);
  v((await p.textContent('#nota-codice')).includes('non valido'), 'errore codice sbagliato');
  await p.fill('#codice', ''); await p.type('#codice', 'luca26'); await p.waitForTimeout(400);
  v((await p.textContent('[data-vista="benvenuto"]')).includes('Ti stai collegando a'), 'codice giusto, conferma (minuscole accettate)');
  await p.screenshot({ path: out + '/n-conferma.png' }); await largo('conferma');
  await p.click('#entra'); await p.waitForTimeout(600);
  v((await p.textContent('[data-vista="oggi"]')).includes('Push A'), 'entra in Oggi');
  v(await p.isVisible('.menu'), 'menu visibile');
  // profilo
  await p.click('a.profilo'); await p.waitForTimeout(400);
  v((await p.textContent('[data-vista="profilo"]')).includes('Insieme dal'), 'profilo');
  await p.screenshot({ path: out + '/n-profilo.png' }); await largo('profilo');
  // progressi
  await p.click('.menu a[href="#progressi"]'); await p.waitForTimeout(400);
  v((await p.textContent('.kpi-lato')).includes('70 × 8') && (await p.textContent('.pr-valore')).includes('89'), 'progressi: panca record 70 × 8, massimale 89');
  v(await p.isVisible('.storico'), 'grafico storico');
  await p.screenshot({ path: out + '/n-progressi.png', fullPage: true }); await largo('progressi');
  await p.click('.seg-es[data-es="stacco"]'); await p.waitForTimeout(200);
  v((await p.textContent('.kpi-lato')).includes('120 × 5'), 'progressi: stacco');
  await p.click('[data-int="1M"]'); await p.waitForTimeout(200);
  v((await p.getAttribute('[data-int="1M"]', 'aria-pressed')) === 'true', 'intervallo 1M');
  v(await p.isDisabled('[data-int="1A"]'), '1A disattivo (meno di un anno)');
  // traguardo
  await p.click('a[href="#traguardo/panca70"]'); await p.waitForTimeout(400);
  v(await p.isVisible('#card-traguardo'), 'card traguardo');
  v(await p.isVisible('#condividi'), 'pulsante condividi');
  await p.screenshot({ path: out + '/n-traguardo.png' }); await largo('traguardo');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('#condividi')]);
  v(dl && dl.suggestedFilename() === 'carico-panca70.png', 'immagine scaricata');
  await p.goto(U + '?giorno=4#traguardo/dodici'); await p.waitForTimeout(400);
  v(await p.isHidden('#condividi') && (await p.textContent('[data-vista="traguardo"]')).includes('si sblocca'), 'traguardo futuro bloccato');
  // record di oggi aggiorna Progressi
  await p.goto(U + '?giorno=4#allenamento'); await p.waitForTimeout(400);
  await p.click('#tutto'); await p.waitForTimeout(300);
  await p.goto(U + '?giorno=4#progressi'); await p.waitForTimeout(400); await p.click('.seg-es[data-es="panca"]'); await p.waitForTimeout(200);
  v((await p.textContent('.kpi-lato')).includes('72,5 × 8'), 'record di oggi entra nei progressi');
  // ricomincia
  await p.goto(U + '?giorno=4#profilo'); await p.waitForTimeout(300);
  await p.click('#ricomincia'); await p.waitForTimeout(500);
  v(await p.isVisible('#codice'), 'ricomincia: torna al codice');
  // 320
  const s = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const q = await s.newPage(); q.on('pageerror', e => err.push('320 ' + e.message));
  await q.goto(U); await q.waitForTimeout(400);
  let x = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `320 benvenuto +${x}`);
  await q.screenshot({ path: out + '/n-320-benvenuto.png' });
  await q.evaluate(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  for (const h of ['#progressi', '#traguardo/dodici', '#profilo', '#oggi', '#coach']) {
    await q.goto(U + '?giorno=6' + h); await q.waitForTimeout(400);
    x = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `320 sborda ${h}: +${x}`);
  }
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(`${ok} ok, ${ko} ko`);
  await b.close(); srv.close();
})();
