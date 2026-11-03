// Programma per persona: il coach assegna modello, modo (giorni fissi / quando vuole) e allenamenti a settimana; l'app segue.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const BASE = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/';
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const guarda = (p) => { p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); }); };
  const testo = async (p, s) => (await p.textContent(s)).replace(/\s+/g, ' ').trim();
  // Un solo browser per app e gestionale (stessa memoria, come sullo stesso PC)
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => sessionStorage.setItem('pt-coach-sessione', '1')); // accesso al gestionale
  await ctx.addInitScript(() => { if (!localStorage.getItem('pt-collegato')) localStorage.setItem('pt-collegato', '{"quando":1}'); });
  const pc = await ctx.newPage(); guarda(pc); await pc.setViewportSize({ width: 1440, height: 900 });
  const app = await ctx.newPage(); guarda(app);

  // ---------- Progressione nella scheda (programma di sempre) ----------
  await app.goto(BASE + 'app.html?giorno=4#allenamento'); await app.waitForTimeout(400);
  await app.click('[data-apri="1"]'); await app.waitForTimeout(200);
  v((await testo(app, '.es.aperto')).includes('+2,5 kg da sola'), 'Lento avanti: progressione spiegata');

  // ---------- Il coach assegna «Corpo intero · 3 a settimana, quando vuole» ----------
  await pc.goto(BASE + 'coach.html#atleti'); await pc.waitForTimeout(500);
  v((await testo(pc, '#righe-atleti')).includes('5 giorni fissi') && (await testo(pc, '#righe-atleti')).includes('2 a settimana, quando vuole'), 'tabella: ogni atleta ha il suo ritmo');
  await pc.goto(BASE + 'coach.html#atleta/marco'); await pc.waitForTimeout(400);
  await pc.click('[data-modello="intero-3"]'); await pc.waitForTimeout(300);
  v(await pc.$('[data-modo="flessibile"][aria-checked="true"]') !== null && await pc.$('[data-n="3"][aria-checked="true"]') !== null, 'modello Base: 3 a settimana, quando vuole');
  v(await pc.$$eval('.giorni-prog .segmento', (a) => a.length) === 3 && (await testo(pc, '.giorni-prog')).includes('Corpo intero C'), 'editor: la sequenza A, B, C');
  await pc.goto(BASE + 'coach.html#atleti'); await pc.waitForTimeout(300);
  v((await testo(pc, '#righe-atleti')).includes('Corpo intero') && (await testo(pc, '#righe-atleti')).includes('3 a settimana, quando vuole'), 'tabella: Marco aggiornato');
  await pc.screenshot({ path: out + '/pi-coach.png', fullPage: true });

  // ---------- App: mercoledì propone il prossimo (lunedì fatto = A) ----------
  await app.goto(BASE + 'app.html?giorno=3#oggi'); await app.waitForTimeout(500);
  v((await testo(app, '.hero .titolone')) === 'Corpo intero B', 'mercoledì: propone Corpo intero B');
  v((await testo(app, '.hero .sopratitolo')).includes('allenamento 2 di 3'), '«allenamento 2 di 3»');
  v(!(await app.$('[data-sposta]')) && await app.isVisible('.nota-flessibile'), 'niente «Cambia giorno»: domani te lo ripropone');
  v(!(await app.$('.recupero')), 'nessun allenamento «non fatto»');
  v((await testo(app, '.conto-sett')) === '1 di 3', 'settimana: 1 di 3');
  await app.screenshot({ path: out + '/pi-oggi.png' });
  // martedì non si è allenato: nessun problema. Mercoledì lo fa.
  await app.click('.btn-scheda'); await app.waitForTimeout(300);
  v((await testo(app, '.titolo-scheda')) === 'Corpo intero B' && (await testo(app, '.es.aperto h2')).includes('Stacco rumeno'), 'scheda di Corpo intero B');
  await app.click('#tutto'); await app.waitForTimeout(300);
  // giovedì non si allena; venerdì: Corpo intero C
  await app.goto(BASE + 'app.html?giorno=5#oggi'); await app.waitForTimeout(400);
  v((await testo(app, '.hero .titolone')) === 'Corpo intero C' && (await testo(app, '.hero .sopratitolo')).includes('3 di 3'), 'venerdì: Corpo intero C, 3 di 3');
  await app.click('.btn-scheda'); await app.waitForTimeout(300); await app.click('#tutto'); await app.waitForTimeout(300);
  await app.goto(BASE + 'app.html?giorno=6#oggi'); await app.waitForTimeout(400);
  v((await testo(app, '.hero .titolone')) === 'Fatto' && (await testo(app, '.hero .sopratitolo')).includes('Settimana completata · 3 di 3'), 'sabato: settimana completata');
  await app.goto(BASE + 'app.html?giorno=6#programma'); await app.waitForTimeout(400);
  v((await testo(app, '.flex-spiega')).includes('3 di 3') && await app.$$eval('.settimana-prog .chip-ok', (a) => a.length) === 3, 'Programma: sequenza con 3 fatti');
  await app.screenshot({ path: out + '/pi-programma.png' });
  await app.goto(BASE + 'app.html?giorno=6#oggi'); await app.waitForTimeout(300);
  await app.click('[data-calendario]'); await app.waitForTimeout(300);
  v(await app.$$eval('.cal-fatto', (a) => a.length) >= 3, 'calendario con gli allenamenti fatti');

  // ---------- Il coach vede gli allenamenti «quando vuole» ----------
  await pc.goto(BASE + 'coach.html#atleta/marco'); await pc.waitForTimeout(400);
  const box = await testo(pc, '#atleta-allenamenti');
  v(box.includes('Mercoledì') && box.includes('Corpo intero B') && box.includes('Venerdì') && box.includes('Corpo intero C'), 'gestionale: allenamenti nei giorni scelti da Marco');

  // ---------- Giorni fissi, 2 a settimana ----------
  await pc.click('[data-modo="fissi"]'); await pc.waitForTimeout(200);
  await pc.click('[data-n="2"]'); await pc.waitForTimeout(200);
  await pc.goto(BASE + 'coach.html#atleti'); await pc.waitForTimeout(300);
  v((await testo(pc, '#righe-atleti')).includes('2 giorni fissi'), 'coach: 2 giorni fissi');
  await pc.goto(BASE + 'coach.html#atleta/marco'); await pc.waitForTimeout(300);
  await app.goto(BASE + 'app.html?giorno=1#oggi'); await app.waitForTimeout(400);
  const tipi = await app.$$eval('.giorno .tipo', (a) => a.map((x) => x.textContent));
  v(tipi[0] === 'Intero' && tipi[3] === 'Intero' && tipi.filter((t) => t === 'Intero').length === 2, 'app: lunedì e giovedì, ' + tipi.join(','));
  v(await app.isVisible('[data-sposta]'), 'giorni fissi: torna «Cambia giorno»');

  // ---------- Torna al programma di sempre ----------
  await pc.click('[data-modello="ppl-5"]'); await pc.waitForTimeout(200);
  await app.goto(BASE + 'app.html?giorno=4#oggi'); await app.waitForTimeout(400);
  v((await testo(app, '.hero .titolone')) === 'Push A', 'di nuovo Push · Pull · Gambe');
  const x = await pc.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, 'gestionale sborda +' + x);
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
