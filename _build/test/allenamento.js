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
  await p.goto(U + '?giorno=4'); await p.waitForTimeout(600);
  await p.click('[data-vista="oggi"] .btn-primario'); await p.waitForTimeout(500);
  v(await p.$$eval('.carta-es', a => a.length) === 6, '6 esercizi sulla scheda');
  v(await p.$$eval('.riquadro', a => a.length) === 19, '19 serie (4+3+3+3+3+3)');
  v(await p.isVisible('#tutto'), 'Fatto tutto come previsto');
  v(await p.isDisabled('#concludi'), 'Concludi disattivo all\u2019inizio');
  await p.screenshot({ path: out + '/k-inizio.png' }); await largo('inizio');
  // tocca una serie del secondo esercizio (ordine libero)
  await p.click('.riquadro[data-i="1"][data-j="0"]'); await p.waitForTimeout(300);
  v(await p.$('.riquadro[data-i="1"][data-j="0"].fatta') !== null, 'serie segnata con un tocco');
  v(await p.isVisible('.capsula'), 'capsula del recupero');
  v((await p.textContent('.capsula')).includes('Lento avanti'), 'capsula dice l\u2019esercizio');
  await p.click('[data-rec="15"]'); await p.waitForTimeout(200);
  v((await p.textContent('.titoli-es >> nth=1')).includes('recupero 1:45'), 'recupero +15 ricordato');
  await p.screenshot({ path: out + '/k-recupero.png' });
  await p.click('#salta'); await p.waitForTimeout(200);
  v(!(await p.isVisible('.capsula')), 'salta');
  // modifica una serie fatta: panca 75
  await p.click('.riquadro[data-i="0"][data-j="0"]'); await p.waitForTimeout(200);
  await p.click('.riquadro[data-i="0"][data-j="0"]'); await p.waitForTimeout(300);
  v(await p.isVisible('.foglio'), 'foglio di modifica');
  await p.click('.foglio [data-campo="kg"][data-delta="1"]'); await p.waitForTimeout(200);
  v((await p.textContent('.foglio .dischi')).includes('25 + 2,5'), 'dischi 75 kg = 25 + 2,5');
  v((await p.textContent('.foglio .delta')).includes('+5 kg'), 'confronto +5 kg');
  await p.screenshot({ path: out + '/k-modifica.png' }); await largo('modifica');
  await p.click('#salva-serie'); await p.waitForTimeout(300);
  for (const j of [1, 2, 3]) { await p.click('.riquadro[data-i="0"][data-j="' + j + '"]'); await p.waitForTimeout(150); if (await p.isVisible('#salta')) await p.click('#salta'); }
  v((await p.textContent('#avviso strong')).includes('record personale'), 'record annunciato a esercizio finito');
  v(await p.$('.riga-finito') !== null, 'esercizio finito chiuso in una riga');
  v((await p.textContent('.riga-finito')).includes('75 kg'), 'le serie dopo hanno seguito il nuovo peso (75)');
  // menu
  await p.click('[data-menu="1"]'); await p.waitForTimeout(200);
  v((await p.textContent('.foglio')).includes('Chiedi al coach') && (await p.textContent('.foglio')).includes('Guarda come si fa'), 'menu esercizio');
  await p.click('.foglio [data-chiudi].chiudi-foglio'); await p.waitForTimeout(200);
  // chiudi e riprendi
  await p.click('a[aria-label^="Chiudi"]'); await p.waitForTimeout(300);
  await p.click('[data-vista="oggi"] .btn-primario'); await p.waitForTimeout(400);
  v(await p.$$eval('.riga-finito', a => a.length) === 1 && await p.$$eval('.riquadro.fatta', a => a.length) === 1, 'scheda ripresa: panca chiusa + 1 serie fatta');
  await p.click('#concludi'); await p.waitForTimeout(300);
  v((await p.textContent('[data-vista="allenamento"]')).includes('Allenamento completato') && (await p.textContent('.riepilogo')).includes('non fatto'), 'concludi con riepilogo parziale');
  await p.click('#riapri'); await p.waitForTimeout(200);
  v(await p.isVisible('.carta-es'), 'riapri la scheda');
  // fatto tutto (nuovo giorno)
  await p.goto(U + '?giorno=2#allenamento'); await p.waitForTimeout(500);
  await p.click('#tutto'); await p.waitForTimeout(300);
  v((await p.textContent('.tre-dati')).includes('20/20'), 'fatto tutto: riepilogo');
  v(await p.isVisible('#avviso.su'), 'avviso con Annulla');
  // 320
  const s = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await s.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const q = await s.newPage();
  await q.goto(U + '?giorno=5#allenamento'); await q.waitForTimeout(500);
  await q.click('.riquadro[data-i="0"][data-j="0"]'); await q.waitForTimeout(300);
  const x = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `320 +${x}`);
  await q.screenshot({ path: out + '/k-320.png' });
  v(err.length === 0, 'errori ' + err.join(' | '));
  console.log(`${ok} ok, ${ko} ko`); await b.close();
})();
