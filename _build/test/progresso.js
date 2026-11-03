// Progresso a scorrimento in Oggi: una card per gruppo muscolare, prima quella del giorno, giro automatico che si ferma al tocco.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const U = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/app.html';
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const p = await ctx.newPage(); p.on('pageerror', (e) => err.push(e.message));
  await p.goto(U + '?giorno=2#oggi'); await p.waitForTimeout(500);
  const card = () => p.evaluate(() => { const c = document.querySelector('.carosello-prog'); return Math.round(c.scrollLeft / c.clientWidth); });
  v(await p.$$eval('.card-prog', (a) => a.length) === 6, '6 gruppi muscolari');
  v((await p.textContent('.card-prog .gruppo')) === 'Schiena', 'martedì (Pull A): prima card Schiena');
  v((await p.textContent('.riassunto-corpo')).replace(/\s+/g, ' ').includes('4 in salita · 1 stabile · 1 in calo'), 'riassunto di tutto il corpo');
  v(await p.$('.card-prog.calo') !== null && (await p.textContent('.card-prog.calo .gruppo')) === 'Braccia', 'braccia in calo');
  v((await p.textContent('.card-prog.stabile .delta')).includes('Stabile'), 'spalle stabili');
  await p.waitForTimeout(4600);
  v(await card() === 1, 'scorre da sola dopo 4 secondi');
  v(await p.$eval('.puntini i:nth-child(2)', (x) => x.classList.contains('on')), 'puntino segue la card');
  await p.dispatchEvent('.carosello-prog', 'pointerdown');
  const ferma = await card(); await p.waitForTimeout(4600);
  v(await card() === ferma, 'si ferma quando la tocchi');
  // giro completo: torna alla prima
  const q = await ctx.newPage(); await q.goto(U + '?giorno=2#oggi'); await q.waitForTimeout(300);
  await q.evaluate(() => { const c = document.querySelector('.carosello-prog'); c.scrollLeft = c.clientWidth * 5; }); await q.waitForTimeout(4600);
  v(await q.evaluate(() => { const c = document.querySelector('.carosello-prog'); return Math.round(c.scrollLeft / c.clientWidth); }) === 0, 'dopo l’ultima ricomincia dalla prima');
  // meno movimento: niente giro
  const r = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  await r.addInitScript(() => localStorage.setItem('pt-collegato', '1'));
  const s = await r.newPage(); await s.goto(U + '?giorno=2#oggi'); await s.waitForTimeout(4800);
  v(await s.evaluate(() => document.querySelector('.carosello-prog').scrollLeft) === 0, '«Riduci movimento»: resta ferma');
  const x = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, 'sborda +' + x);
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
