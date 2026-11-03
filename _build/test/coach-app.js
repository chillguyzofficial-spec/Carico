const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = 'C:/Users/Claude FK/.claude/projects/gym app';
const tipi = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'content-type': tipi[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); }).listen(8995);
const out = process.argv[2]; let ok = 0, ko = 0;
const verifica = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(() => sessionStorage.setItem('pt-coach-sessione', '1')); // accesso al gestionale
  const c = await ctx.newPage(); const err = []; c.on('pageerror', e => err.push(e.message));
  await c.goto('http://localhost:8995/coach.html'); await c.waitForTimeout(800);
  verifica((await c.textContent('#riassunto')).startsWith('1 video da rivedere'), 'riassunto iniziale');
  await c.click('.scelta[data-p="Profondità"]');
  verifica(await c.getAttribute('.scelta.ottima', 'aria-pressed') === 'false', 'ottima si spegne');
  await c.click('.scelta[data-p="Profondità"]');
  verifica(await c.isDisabled('#invia'), 'invia disattivo senza valutazione');
  await c.click('.scelta[data-p="Profondità"]');
  await c.click('.segmento[data-i="2"]');
  await c.fill('#messaggio', 'Scendi ancora un dito sotto il parallelo.');
  await c.click('#play'); await c.waitForTimeout(1200);
  verifica((await c.textContent('#tempo')) !== '0:00', 'lettore avanza');
  await c.click('#invia'); await c.waitForTimeout(300);
  verifica(await c.isVisible('#avviso.su'), 'avviso visibile');
  verifica((await c.textContent('#riassunto')).startsWith('Nessun video'), 'conteggio scende');
  verifica(!(await c.textContent('#coda')).includes('Marco Rossi'), 'Marco fuori dalla coda');
  await c.screenshot({ path: out + '/coach-inviato.png' });
  // l'app di Marco
  const tel = await b.newContext({ ...devices['iPhone 13'] });
  await tel.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const p = await tel.newPage(); p.on('pageerror', e => err.push(e.message));
  // stessa memoria: copio il feedback
  const fb = await c.evaluate(() => localStorage.getItem('pt-feedback-marco'));
  await p.goto('http://localhost:8995/app.html?giorno=5');
  await p.evaluate(v => localStorage.setItem('pt-feedback-marco', v), fb); await p.reload(); await p.waitForTimeout(800);
  const testo = await p.textContent('[data-vista="oggi"]');
  verifica(testo.includes('Da correggere: profondità'), 'app: tecnica da correggere');
  verifica(testo.includes('Aumenta a 82,5 kg'), 'app: aumenta');
  verifica(testo.includes('Scendi ancora un dito'), 'app: nota');
  verifica(testo.includes('oggi '), 'app: oggi + ora');
  verifica(await p.$('#voce-coach.novita') !== null, 'app: puntino su Coach');
  await p.screenshot({ path: out + '/app-feedback.png' });
  // Annulla dal gestionale
  await c.click('#riapri'); await c.waitForTimeout(300);
  verifica((await c.textContent('#coda')).includes('Marco Rossi'), 'riapri: Marco torna');
  // larghezze
  for (const [w, url] of [[320, 'index.html?giorno=4'], [320, 'index.html?giorno=3'], [390, 'coach.html'], [768, 'coach.html'], [1024, 'coach.html'], [1280, 'coach.html']]) {
    const x = await b.newPage({ viewport: { width: w, height: 800 } });
    await x.goto('http://localhost:8995/' + url); await x.waitForTimeout(500);
    const largo = await x.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    verifica(largo <= 0, `scorrimento orizzontale ${w} ${url}: +${largo}px`);
    if (w === 390 || w === 320) await x.screenshot({ path: `${out}/w${w}-${url.replace(/\W/g,'')}.png`, fullPage: true });
    await x.close();
  }
  verifica(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(`${ok} ok, ${ko} ko`);
  await b.close(); srv.close();
})();
