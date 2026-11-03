// Libertà dell'atleta: serie in più, peso scritto a mano, esercizio aggiunto, sostituzione libera, ricomincia da zero.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const U = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/app.html';
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  const largo = async (n) => { const x = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `sborda ${n}: +${x}`); };
  await p.goto(U + '?giorno=4#allenamento'); await p.waitForTimeout(500);
  v(await p.$$eval('.riquadro.piu', a => a.length) === 6, '«+ Serie» su ogni esercizio');
  v(await p.isVisible('#aggiungi'), '«Aggiungi un esercizio» in fondo');
  // serie in più sulla panca
  await p.click('.riquadro.piu[data-piu="0"]'); await p.waitForTimeout(250);
  v(await p.$$eval('.riquadro[data-i="0"]', a => a.length) === 5, 'panca: 5 serie');
  v((await p.textContent('.carta-es')).includes('+1 tua'), 'conteggio «+1 tua»');
  // peso scritto a mano: segna la prima, riaprila e scrivi 77,5
  await p.click('.riquadro[data-i="0"][data-j="0"]'); await p.waitForTimeout(250);
  await p.click('.riquadro[data-i="0"][data-j="0"]'); await p.waitForTimeout(250);
  await p.fill('[data-scrivi="kg"]', '77,5'); await p.press('[data-scrivi="kg"]', 'Enter'); await p.waitForTimeout(250);
  v((await p.inputValue('[data-scrivi="kg"]')) === '77,5', 'peso scritto: 77,5');
  v((await p.textContent('.foglio .dischi')).includes('25 + 2,5 + 1,25'), 'dischi aggiornati dopo Invio');
  await p.fill('[data-scrivi="reps"]', '6');
  await p.screenshot({ path: out + '/l-scrivi.png' }); await largo('scrivi');
  await p.click('#salva-serie'); await p.waitForTimeout(250);
  v((await p.textContent('.riquadro[data-i="0"][data-j="0"]')).replace(/\s+/g, ' ').includes('77,5 kg × 6'), 'serie salvata 77,5 × 6 (senza Invio sulle ripetizioni)');
  v((await p.textContent('.riquadro[data-i="0"][data-j="4"]')).includes('77,5'), 'le serie dopo seguono il peso scritto');
  // togli la serie in più
  await p.click('.riquadro[data-i="0"][data-j="4"]'); await p.waitForTimeout(250); // non fatta: segnata
  await p.click('.riquadro[data-i="0"][data-j="4"]'); await p.waitForTimeout(250);
  v(await p.isVisible('#togli-serie'), '«Togli questa serie» sulla serie in più');
  await p.click('#togli-serie'); await p.waitForTimeout(250);
  v(await p.$$eval('.riquadro[data-i="0"]', a => a.length) === 4, 'serie in più tolta');
  // aggiungi un esercizio dalla lista
  await p.click('#aggiungi'); await p.waitForTimeout(250);
  v(await p.isVisible('#cerca'), 'foglio di ricerca');
  v(!(await p.$('[data-scegli="Panca piana"]')), 'la lista non ripete gli esercizi di oggi');
  await p.fill('#cerca', 'leg ext'); await p.waitForTimeout(150);
  v(await p.$$eval('[data-scegli]:not([hidden])', a => a.length) === 1, 'ricerca filtra');
  await p.screenshot({ path: out + '/l-cerca.png' });
  await p.click('[data-scegli="Leg extension"]'); await p.waitForTimeout(300);
  v((await p.textContent('.carta-es.mia')).includes('Aggiunto da te'), 'esercizio aggiunto in fondo');
  await p.click('.carta-es.mia .riquadro[data-j="0"]'); await p.waitForTimeout(250);
  v(await p.isVisible('.foglio [data-scrivi="kg"]'), 'esercizio aggiunto: il tocco apre prima il peso');
  await p.fill('[data-scrivi="kg"]', '45'); await p.click('#salva-serie'); await p.waitForTimeout(250);
  v((await p.textContent('.carta-es.mia')).includes('45'), 'peso dell’esercizio aggiunto');
  // esercizio scritto a mano
  await p.click('#aggiungi'); await p.waitForTimeout(250);
  await p.fill('#cerca', 'panca declinata'); await p.waitForTimeout(150);
  v((await p.textContent('#scrivi-nome')).includes('panca declinata'), '«Aggiungi …» con il nome scritto');
  await p.press('#cerca', 'Enter'); await p.waitForTimeout(300);
  v(await p.$$eval('.carta-es.mia', a => a.length) === 2 && (await p.textContent('.corpo-scheda')).includes('Panca declinata'), 'esercizio scritto a mano aggiunto');
  await p.screenshot({ path: out + '/l-aggiunti.png', fullPage: true }); await largo('aggiunti');
  // togli e annulla
  await p.click('.carta-es.mia:last-of-type [data-menu]'); await p.waitForTimeout(250);
  await p.click('#togli-esercizio'); await p.waitForTimeout(250);
  v(await p.$$eval('.carta-es.mia', a => a.length) === 1, 'esercizio tolto');
  await p.click('#avviso button'); await p.waitForTimeout(250);
  v(await p.$$eval('.carta-es.mia', a => a.length) === 2, 'annulla lo rimette');
  // sostituzione libera (Croci ai cavi non ha alternative del coach)
  await p.click('[data-menu="3"]'); await p.waitForTimeout(250);
  v(await p.isVisible('#sostituisci'), 'sostituisci anche senza alternative del coach');
  await p.click('#sostituisci'); await p.waitForTimeout(200);
  await p.click('#altro-esercizio'); await p.waitForTimeout(200);
  await p.click('[data-scegli="Pec deck"]'); await p.waitForTimeout(250);
  v((await p.textContent('#es-3')) === 'Pec deck' && (await p.textContent('.corpo-scheda')).includes('al posto di Croci ai cavi'), 'sostituito con Pec deck');
  // riepilogo e ripresa
  await p.click('#concludi'); await p.waitForTimeout(300);
  const riep = await p.textContent('.riepilogo');
  v(riep.includes('Leg extension') && riep.includes('Aggiunto') && riep.includes('Cambiato'), 'riepilogo con aggiunti e cambiati');
  await p.screenshot({ path: out + '/l-riepilogo.png', fullPage: true });
  await p.reload(); await p.waitForTimeout(400);
  v((await p.textContent('.riepilogo')).includes('Panca declinata'), 'aggiunti salvati dopo ricarica');
  await p.click('#riapri-sotto'); await p.waitForTimeout(250);
  v(await p.isVisible('.carta-es'), '«Riapri la scheda»');
  await p.click('#concludi'); await p.waitForTimeout(250);
  p.once('dialog', d => d.accept());
  await p.click('#da-zero'); await p.waitForTimeout(300);
  v(await p.$$eval('.riquadro.fatta', a => a.length) === 0 && !(await p.$('.carta-es.mia')) && await p.isVisible('#tutto'), '«Ricomincia da zero»: scheda nuova');
  // 320
  const s = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await s.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const q = await s.newPage();
  await q.goto(U + '?giorno=5#allenamento'); await q.waitForTimeout(400);
  await q.click('.riquadro[data-i="0"][data-j="0"]'); await q.click('.riquadro[data-i="0"][data-j="0"]'); await q.waitForTimeout(300);
  const x = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `320 foglio +${x}`);
  v(await q.$eval('[data-scrivi="kg"]', (e) => e.scrollWidth <= e.clientWidth + 1), '122,5 entra nel campo a 320');
  await q.screenshot({ path: out + '/l-320.png' });
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
