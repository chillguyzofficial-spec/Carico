// Settimana non fissa: allenamento non fatto (Fallo oggi / Lo salto), Cambia giorno, calendario, e il coach lo vede.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const BASE = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/';
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const nuovo = async () => {
    const c = await b.newContext({ ...devices['iPhone 13'] });
    await c.addInitScript(() => { if (!localStorage.getItem('pt-collegato')) localStorage.setItem('pt-collegato', '{"quando":1}'); });
    const p = await c.newPage(); p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
    return p;
  };
  const testo = async (p, s) => (await p.textContent(s)).replace(/\s+/g, ' ').trim();

  // ---------- Giovedì: martedì (Pull A) non fatto ----------
  let p = await nuovo();
  await p.goto(BASE + 'app.html?giorno=4#oggi'); await p.waitForTimeout(500);
  v(await p.isVisible('.recupero') && (await testo(p, '.recupero')).includes('Pull A'), 'avviso: Pull A di martedì non fatto');
  v(await p.$('.giorno.nonfatto') !== null && await p.$('.giorno.fatto') !== null, 'settimana: lunedì fatto, martedì non fatto');
  v((await testo(p, '.recupero')).includes('Push A passa a sabato'), 'spiega che Push A va al primo giorno libero');
  await p.click('[data-salta="1"]'); await p.waitForTimeout(300);
  v(!(await p.$('.recupero')) && await p.$('.giorno.saltato') !== null, 'Lo salto: avviso sparito, giorno saltato');
  await p.click('#avviso button'); await p.waitForTimeout(300);
  v(await p.isVisible('.recupero'), 'Annulla: torna da decidere');
  await Promise.all([p.waitForNavigation(), p.click('[data-recupera="1"]')]); await p.waitForTimeout(500);
  v((await testo(p, '.hero .titolone')) === 'Pull A', 'Fallo oggi: oggi c’è Pull A');
  const tipi = await p.$$eval('.giorno .tipo', (a) => a.map((x) => x.textContent));
  v(tipi[1] === 'Riposo' && tipi[3] === 'Pull' && tipi[5] === 'Push', 'Push A spostato a sabato, martedì libero: ' + tipi.join(','));
  v(!(await p.$('.recupero')), 'niente più da recuperare');
  await p.click('[data-vista="oggi"] .btn-scheda'); await p.waitForTimeout(400);
  v((await testo(p, '.titolo-scheda')) === 'Pull A' && (await testo(p, '.es.aperto h2')).includes('Trazioni'), 'la scheda di oggi è Pull A');
  await p.click('[data-spunta="0-0"]'); await p.waitForTimeout(200);
  const memoria = await p.evaluate(() => JSON.stringify(localStorage));
  await p.goto(BASE + 'app.html?giorno=4#programma'); await p.waitForTimeout(400);
  v((await testo(p, '.settimana-prog')).includes('Oggi'), 'Programma segue la settimana nuova');

  // ---------- Il coach vede spostamenti ----------
  const pc = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await pc.addInitScript((m) => { if (!sessionStorage.getItem('ok')) { Object.entries(JSON.parse(m)).forEach(([k, x]) => localStorage.setItem(k, x)); sessionStorage.setItem('ok', '1'); } }, memoria);
  const c = await pc.newPage(); c.on('pageerror', (e) => err.push(e.message));
  await c.goto(BASE + 'coach.html'); await c.waitForTimeout(500);
  const coda = await testo(c, '#coda');
  v(coda.includes('Ha spostato Pull A da martedì a giovedì') && coda.includes('Ha spostato Push A da giovedì a sabato'), 'gestionale: spostamenti in coda');
  v((await testo(c, '#marco-allenamenti')).includes('Giovedì') && (await testo(c, '#marco-allenamenti')).includes('Pull A'), 'gestionale: allenamento di giovedì è Pull A');

  // ---------- Martedì: Cambia giorno ----------
  p = await nuovo();
  await p.goto(BASE + 'app.html?giorno=2#oggi'); await p.waitForTimeout(500);
  v(!(await p.$('.recupero')), 'martedì: niente da recuperare (lunedì fatto)');
  await p.click('[data-sposta]'); await p.waitForTimeout(300);
  v(await p.$$eval('.voce-giorno', (a) => a.length) === 5, 'cambia giorno: 5 giorni dopo oggi');
  v((await testo(p, '[data-sposta-a="3"]')).includes('Push A: si scambiano'), 'giorno con allenamento: si scambiano');
  await p.screenshot({ path: out + '/p-sposta.png' });
  await Promise.all([p.waitForNavigation(), p.click('[data-sposta-a="2"]')]); await p.waitForTimeout(500);
  v((await testo(p, '.hero .titolone')) === 'Riposo', 'oggi diventa riposo');
  const t2 = await p.$$eval('.giorno .tipo', (a) => a.map((x) => x.textContent));
  v(t2[2] === 'Pull', 'Pull A spostato a mercoledì');

  // ---------- Calendario ----------
  await p.click('[data-calendario]'); await p.waitForTimeout(300);
  v(await p.isVisible('.cal-griglia') && await p.$('.cal-oggi') !== null, 'calendario aperto con oggi segnato');
  v(await p.$$eval('.cal-fatto', (a) => a.length) >= 1, 'calendario: giorni fatti');
  await p.click('[data-cal-mese="-1"]'); await p.waitForTimeout(200);
  v(await p.$$eval('.cal-fatto', (a) => a.length) >= 10 && await p.$$eval('.cal-saltato', (a) => a.length) >= 1, 'mese prima: storico con fatti e saltati');
  const g = await p.$('.cal-fatto'); await g.click(); await p.waitForTimeout(200);
  v((await testo(p, '.cal-dettaglio')).includes('Fatto'), 'tocco su un giorno: dettaglio');
  await p.screenshot({ path: out + '/p-calendario.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  v(!(await p.$('.foglio')), 'Esc chiude il calendario');
  const x = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, 'sborda +' + x);

  // 320
  const q = await b.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await q.addInitScript(() => localStorage.setItem('pt-collegato', '1'));
  const r = await q.newPage(); await r.goto(BASE + 'app.html?giorno=4#oggi'); await r.waitForTimeout(400);
  await r.click('[data-calendario]'); await r.waitForTimeout(300);
  const x2 = await r.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x2 <= 0, '320 +' + x2);
  await r.screenshot({ path: out + '/p-320.png' });
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
