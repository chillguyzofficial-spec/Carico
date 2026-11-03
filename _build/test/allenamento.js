// Scheda d'allenamento sul modello di Francesco: esercizi numerati uno aperto alla volta, tabella SERIE · KG · REP,
// caselle, numeri scrivibili, serie in più, esercizi aggiunti, sostituzione libera, riepilogo, riapri e ricomincia.
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
  const testo = async (s) => (await p.textContent(s)).replace(/\s+/g, ' ').trim();
  const cella = (i, j, c) => `[data-cella="${c}"][data-i="${i}"][data-j="${j}"]`;

  // ---------- Push A (giovedì) ----------
  await p.goto(U + '?giorno=4'); await p.waitForTimeout(600);
  await p.click('[data-vista="oggi"] .btn-primario'); await p.waitForTimeout(500);
  v(await p.$$eval('.es', a => a.length) === 6, '6 esercizi');
  v(await p.$$eval('.es.aperto', a => a.length) === 1, 'uno solo aperto');
  v((await testo('.es.aperto h2')).includes('Panca piana'), 'aperto il primo');
  v(await p.$$eval('.es.aperto .riga-serie', a => a.length) === 4, 'tabella con 4 serie');
  v((await testo('.testata-scheda')).includes('0 / 19 serie'), 'testata 0 / 19 serie');
  v((await testo('.dati-es')).includes('Ultima 70 kg') && (await testo('.dati-es')).includes('Target 72,5 kg'), 'ultima e target');
  v(await p.isVisible('#tutto'), 'Fatto tutto come previsto');
  v(await p.isDisabled('#concludi'), 'Concludi disattivo all’inizio');
  await p.screenshot({ path: out + '/k-inizio.png' }); await largo('inizio');

  // peso scritto a mano: 75 nella prima serie → le serie sotto seguono, dischi aggiornati
  await p.fill(cella(0, 0, 'kg'), '75'); await p.waitForTimeout(150);
  v((await p.inputValue(cella(0, 3, 'kg'))) === '75', 'le serie sotto seguono il peso scritto');
  v((await testo('#dischi-0')).includes('25 + 2,5'), 'dischi 75 kg = 25 + 2,5');
  await p.fill(cella(0, 0, 'reps'), '9');
  await p.click('[data-spunta="0-0"]'); await p.waitForTimeout(250);
  v(await p.$('[data-spunta="0-0"].piena') !== null, 'casella spuntata');
  v((await p.inputValue(cella(0, 0, 'kg'))) === '75' && (await p.inputValue(cella(0, 0, 'reps'))) === '9', 'serie salvata 75 × 9');
  v((await testo('.testata-scheda')).includes('1 / 19'), 'contatore aggiornato');
  await p.click('[data-spunta="0-0"]'); await p.waitForTimeout(200);
  v(await p.$('[data-spunta="0-0"].piena') === null, 'si toglie la spunta');
  // campo vuoto: torna il numero salvato
  await p.fill(cella(0, 1, 'kg'), ''); await p.click('.dati-es'); await p.waitForTimeout(150);
  v((await p.inputValue(cella(0, 1, 'kg'))) === '75', 'campo vuoto torna al numero');

  // serie in più e via
  await p.click('[data-piu="0"]'); await p.waitForTimeout(200);
  v(await p.$$eval('.es.aperto .riga-serie', a => a.length) === 5 && await p.$('.riga-serie.extra [data-togli="0-4"]') !== null, 'serie in più con ×');
  await p.click('[data-togli="0-4"]'); await p.waitForTimeout(200);
  v(await p.$$eval('.es.aperto .riga-serie', a => a.length) === 4, 'serie in più tolta');

  // finendo l'esercizio si apre il successivo, con record
  for (const j of [0, 1, 2, 3]) { await p.click(`[data-spunta="0-${j}"]`); await p.waitForTimeout(120); }
  v((await testo('#avviso strong')).includes('record personale'), 'record a esercizio finito');
  v((await testo('.es.aperto h2')).includes('Lento avanti'), 'si apre il prossimo esercizio');
  v(await p.$('.es:first-child .sk-riga .sk-casella.piena') !== null, 'esercizio finito chiuso con la spunta');
  await p.click('#avviso button'); await p.waitForTimeout(200);
  v((await testo('.es.aperto h2')).includes('Panca piana') && await p.$('[data-spunta="0-3"].piena') === null, 'Annulla riapre la panca');
  await p.click('[data-spunta="0-3"]'); await p.waitForTimeout(200);
  // apri a mano un altro esercizio, poi richiudilo
  await p.click('[data-apri="4"]'); await p.waitForTimeout(200);
  v((await testo('.es.aperto h2')).includes('Alzate laterali'), 'apre l’esercizio toccato');
  await p.click('.es.aperto h2 button'); await p.waitForTimeout(200);
  v(await p.$$eval('.es.aperto', a => a.length) === 0, 'toccando il titolo si chiude');
  await p.click('[data-apri="1"]'); await p.waitForTimeout(200);
  v((await testo('.es.aperto')).includes('Vedi tecnica') && /Luca \/ coach/i.test(await testo('.es.aperto')), 'video tecnica e nota del coach');
  await p.screenshot({ path: out + '/k-aperto.png' }); await largo('aperto');

  // sostituzione libera (Croci ai cavi non ha alternative del coach)
  await p.click('[data-apri="3"]'); await p.waitForTimeout(200);
  await p.click('[data-sost="3"]'); await p.waitForTimeout(200);
  await p.click('#altro-esercizio'); await p.waitForTimeout(200);
  await p.click('[data-scegli="Pec deck"]'); await p.waitForTimeout(250);
  v((await testo('.es.aperto h2')) === 'Pec deck' && (await testo('.es.aperto')).includes('Al posto di Croci ai cavi'), 'sostituito con Pec deck');

  // esercizio aggiunto dalla lista e scritto a mano
  await p.click('#aggiungi'); await p.waitForTimeout(200);
  v(!(await p.$('[data-scegli="Panca piana"]')), 'la lista non ripete gli esercizi di oggi');
  await p.fill('#cerca', 'leg ext'); await p.waitForTimeout(150);
  v(await p.$$eval('[data-scegli]:not([hidden])', a => a.length) === 1, 'ricerca filtra');
  await p.click('[data-scegli="Leg extension"]'); await p.waitForTimeout(300);
  v((await testo('.es.aperto')).includes('Aggiunto da te') && (await p.inputValue(cella(6, 0, 'kg'))) === '', 'aggiunto e aperto, peso da scrivere');
  await p.fill(cella(6, 0, 'kg'), '45'); await p.click('[data-spunta="6-0"]'); await p.waitForTimeout(200);
  await p.click('#aggiungi'); await p.waitForTimeout(200);
  await p.fill('#cerca', 'panca declinata'); await p.press('#cerca', 'Enter'); await p.waitForTimeout(300);
  v((await testo('.es.aperto h2')) === 'Panca declinata', 'esercizio scritto a mano');
  await p.click('[data-togli-es="7"]'); await p.waitForTimeout(200);
  v(await p.$$eval('.es', a => a.length) === 7, 'esercizio tolto');
  await p.click('#avviso button'); await p.waitForTimeout(200);
  v(await p.$$eval('.es', a => a.length) === 8, 'Annulla lo rimette');
  await p.screenshot({ path: out + '/k-aggiunti.png', fullPage: true }); await largo('aggiunti');

  // chiudi e riprendi
  await p.click('.chiudi-scheda'); await p.waitForTimeout(300);
  await p.click('[data-vista="oggi"] .btn-primario'); await p.waitForTimeout(400);
  v(await p.$$eval('.es', a => a.length) === 8 && (await testo('.testata-scheda')).includes('5 / '), 'scheda ripresa uguale');

  // riepilogo, riapri, ricomincia da zero
  await p.click('#concludi'); await p.waitForTimeout(300);
  const riep = await testo('.riepilogo');
  v(riep.includes('Leg extension') && riep.includes('Aggiunto') && riep.includes('Cambiato') && riep.includes('non fatto'), 'riepilogo con aggiunti, cambiati, non fatti');
  await p.click('#riapri-sotto'); await p.waitForTimeout(250);
  v(await p.isVisible('.elenco-es'), 'Riapri la scheda');
  await p.click('#concludi'); await p.waitForTimeout(250);
  p.once('dialog', d => d.accept());
  await p.click('#da-zero'); await p.waitForTimeout(300);
  v(await p.$$eval('.sk-casella.piena', a => a.length) === 0 && await p.$$eval('.es', a => a.length) === 6 && await p.isVisible('#tutto'), 'Ricomincia da zero');

  // trazioni: zavorra
  await p.goto(U + '?giorno=2#allenamento'); await p.waitForTimeout(500);
  v((await testo('.dati-es')).includes('Target +5 kg') && (await testo('.intest-serie')).includes('+Kg'), 'trazioni con zavorra');
  await p.click('#tutto'); await p.waitForTimeout(300);
  v((await testo('.tre-dati')).includes('20/20'), 'fatto tutto: riepilogo');
  v(await p.isVisible('#avviso.su'), 'avviso con Annulla');

  // 320
  const s = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await s.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const q = await s.newPage();
  await q.goto(U + '?giorno=5#allenamento'); await q.waitForTimeout(500);
  const x = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `320 +${x}`);
  v(await q.$eval('[data-cella="kg"][data-i="0"][data-j="0"]', (e) => e.scrollWidth <= e.clientWidth + 1), '122,5 entra nella cella a 320');
  await q.screenshot({ path: out + '/k-320.png', fullPage: true });
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
