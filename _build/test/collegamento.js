// App ↔ gestionale: quello che Marco fa nell'app arriva al coach, il programma cambiato dal coach arriva all'app.
// Migliorie della scheda: colonna «Prima», record mentre si scrive, «Com'è andata?», nota per il coach.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const BASE = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/';
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('pt-collegato')) localStorage.setItem('pt-collegato', '{"quando":1}'); });
  const guarda = (p) => { p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); }); };
  const testo = async (p, s) => (await p.textContent(s)).replace(/\s+/g, ' ').trim();

  // ---------- App: allenamento di giovedì (Push A) ----------
  const app = await ctx.newPage(); guarda(app);
  await app.goto(BASE + 'app.html?giorno=4#allenamento'); await app.waitForTimeout(500);
  v((await testo(app, '.intest-serie')).includes('Prima'), 'colonna Prima');
  v((await testo(app, '[data-copia="0-3"]')).replace(/\s/g, '') === '70×7', 'Prima = settimana scorsa (70 × 7)');
  await app.click('[data-copia="0-3"]'); await app.waitForTimeout(200);
  v((await app.inputValue('[data-cella="kg"][data-i="0"][data-j="3"]')) === '70' && (await app.inputValue('[data-cella="reps"][data-i="0"][data-j="3"]')) === '7', 'tocco su Prima la ricopia');
  v(await app.$$eval('.riga-serie.record', a => a.length) === 0, 'target del coach sopra il migliore: niente PR prima di farla');
  await app.fill('[data-cella="kg"][data-i="0"][data-j="0"]', '65'); await app.waitForTimeout(150);
  v(await app.$$eval('.riga-serie.record', a => a.length) === 0, 'sotto il migliore: niente Record');
  await app.fill('[data-cella="kg"][data-i="0"][data-j="0"]', '75'); await app.waitForTimeout(150);
  v(await app.$$eval('.riga-serie.record', a => a.length) >= 1, 'PR si accende scrivendo più del target');
  await app.click('[data-spunta="0-1"]'); await app.waitForTimeout(150);
  v(await app.$('[data-spunta="0-1"]').then((x) => x.evaluate((n) => n.closest('.riga-serie').classList.contains('record'))), 'PR sulla serie fatta sopra il migliore');
  await app.click('[data-fatica="0-limite"]'); await app.waitForTimeout(150);
  v(await app.$('[data-fatica="0-limite"][aria-checked="true"]') !== null, 'Com’è andata: al limite');
  await app.click('[data-nota="0"]'); await app.waitForTimeout(200);
  await app.fill('#testo-nota', 'Fastidio alla spalla sull’ultima'); await app.click('#salva-nota'); await app.waitForTimeout(200);
  v((await testo(app, '.nota-tua-es')).includes('Fastidio alla spalla'), 'nota salvata nella scheda');
  await app.click('[data-piu="0"]'); await app.waitForTimeout(150);
  for (const j of [0, 2, 3, 4]) { await app.click(`[data-spunta="0-${j}"]`); await app.waitForTimeout(100); }
  await app.screenshot({ path: out + '/c-app.png' });
  await app.click('#concludi'); await app.waitForTimeout(300);
  v((await testo(app, '.riepilogo')).includes('al limite') && (await testo(app, '.riepilogo')).includes('Fastidio'), 'riepilogo con fatica e nota');

  // ---------- Gestionale: vede l'allenamento ----------
  const pc = await b.newContext({ viewport: { width: 1440, height: 900 } });
  // stesso «telefono» e stesso PC nella demo: si copia la memoria dell'app nel browser del gestionale
  const memoria = await app.evaluate(() => JSON.stringify(localStorage));
  await pc.addInitScript((m) => { if (!sessionStorage.getItem('copiata')) { Object.entries(JSON.parse(m)).forEach(([k, x]) => localStorage.setItem(k, x)); sessionStorage.setItem('copiata', '1'); } }, memoria);
  const coach = await pc.newPage(); guarda(coach);
  await coach.goto(BASE + 'coach.html'); await coach.waitForTimeout(500);
  const box = await testo(coach, '#marco-allenamenti');
  v(box.includes('Push A') && box.includes('Completato'), 'gestionale: allenamento completato');
  v(box.includes('75×8') && box.includes('+1 serie') && box.includes('Record') && box.includes('Al limite') && box.includes('Fastidio alla spalla'), 'gestionale: serie, extra, record, fatica, nota');
  v((await testo(coach, '#coda')).includes('Allenamento · Push A completato'), 'gestionale: in coda');
  await coach.screenshot({ path: out + '/c-coach.png', fullPage: true });

  // ---------- Gestionale: cambia il programma di martedì (Pull A) ----------
  await coach.click('[data-prog="pull-a"]'); await coach.waitForTimeout(150);
  await coach.fill('[data-c="kg"][data-i="0"]', '7,5');
  await coach.fill('[data-c="serie"][data-i="0"]', '5');
  await coach.fill('[data-c="nota"][data-i="0"]', 'Oggi prova 7,5 di zavorra.');
  await coach.click('#prog-invia'); await coach.waitForTimeout(250);
  v((await testo(coach, '#marco-programma')).includes('modificato') && await coach.isVisible('#prog-ripristina'), 'programma salvato e segnato come modificato');
  const prog = await coach.evaluate(() => localStorage.getItem('pt-programma-marco'));

  // ---------- App: la scheda di martedì segue il coach ----------
  await ctx.addInitScript((x) => localStorage.setItem('pt-programma-marco', x), prog);
  const app2 = await ctx.newPage(); guarda(app2);
  await app2.goto(BASE + 'app.html?giorno=2#allenamento'); await app2.waitForTimeout(500);
  v((await testo(app2, '.dati-es')).includes('Target +7,5 kg'), 'app: target nuovo del coach');
  v(await app2.$$eval('.es.aperto .riga-serie', a => a.length) === 5, 'app: 5 serie come deciso dal coach');
  v((await testo(app2, '.es.aperto .sk-nota')).includes('Oggi prova 7,5'), 'app: nota nuova del coach');

  // ---------- Dal vivo: con la scheda aperta, il coach cambia ancora ----------
  await app2.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('pt-programma-marco')); p['pull-a'][0].reps = 4;
    localStorage.setItem('pt-programma-marco', JSON.stringify(p));
    window.dispatchEvent(new StorageEvent('storage', { key: 'pt-programma-marco' }));
  });
  await app2.waitForTimeout(400);
  v((await app2.inputValue('[data-cella="reps"][data-i="0"][data-j="0"]')) === '4', 'app: si aggiorna da sola se la scheda non è iniziata');

  // ---------- Ripristina ----------
  await coach.click('#prog-ripristina'); await coach.waitForTimeout(200);
  v(!(await coach.evaluate(() => localStorage.getItem('pt-programma-marco'))) && !(await testo(coach, '#marco-programma')).includes('modificato'), 'programma iniziale ripristinato');

  // sborda?
  for (const [p, n] of [[app, 'app'], [coach, 'coach']]) { const x = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `sborda ${n} +${x}`); }
  const tel = await b.newContext({ viewport: { width: 390, height: 800 } });
  const c3 = await tel.newPage(); await c3.goto(BASE + 'coach.html'); await c3.waitForTimeout(400);
  const x3 = await c3.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x3 <= 0, `gestionale a 390 +${x3}`);
  const q = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await q.addInitScript(() => localStorage.setItem('pt-collegato', '1'));
  const p320 = await q.newPage(); await p320.goto(BASE + 'app.html?giorno=5#allenamento'); await p320.waitForTimeout(400);
  const x4 = await p320.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x4 <= 0, `scheda a 320 +${x4}`);
  v(await p320.$eval('[data-cella="kg"][data-i="0"][data-j="0"]', (e) => e.scrollWidth <= e.clientWidth + 1), '122,5 entra a 320 con la colonna Prima');
  await p320.screenshot({ path: out + '/c-320.png' });
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
