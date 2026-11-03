// Navigazione: da ogni schermata si esce (menu in basso oppure X / freccia indietro), e il Profilo torna da dove si viene.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const U = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/app.html';
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message));
  const uscita = () => p.evaluate(() => {
    const vista = [...document.querySelectorAll('.vista')].find((x) => !x.hidden);
    const menu = !document.querySelector('.menu').hidden;
    const via = [...vista.querySelectorAll('a[href^="#"], button')].some((a) => /indietro|chiudi|torna/i.test(a.getAttribute('aria-label') || a.textContent) && a.offsetParent);
    return { nome: vista.dataset.vista, menu, via };
  });
  const schermate = [['?giorno=2', '#oggi'], ['?giorno=2', '#programma'], ['?giorno=2', '#programma/pull-a'], ['?giorno=7', '#checkin'], ['?giorno=2', '#coach'],
    ['?giorno=2', '#progressi'], ['?giorno=2', '#traguardo/dodici'], ['?giorno=2', '#profilo'], ['?giorno=2', '#allenamento'], ['?giorno=3', '#allenamento']];
  for (const [q, h] of schermate) {
    await p.goto(U + q + h); await p.waitForTimeout(350);
    const u = await uscita();
    v(u.menu || u.via, `${h} (${q}) senza uscita`);
  }
  // Profilo: la freccia torna da dove si arriva
  for (const da of ['#progressi', '#programma', '#oggi']) {
    await p.goto(U + '?giorno=2' + da); await p.waitForTimeout(300);
    await p.evaluate(() => { location.hash = '#profilo'; }); await p.waitForTimeout(300);
    await p.click('.indietro-profilo'); await p.waitForTimeout(300);
    v((await p.evaluate(() => location.hash)) === da, `profilo → indietro torna a ${da}`);
  }
  // dalla foto in Oggi
  await p.goto(U + '?giorno=2#oggi'); await p.waitForTimeout(300);
  await p.click('a.profilo'); await p.waitForTimeout(300);
  v(await p.isVisible('.indietro-profilo'), 'freccia indietro visibile nel profilo');
  await p.click('.indietro-profilo'); await p.waitForTimeout(300);
  v(await p.isVisible('[data-vista="oggi"]'), 'dal profilo si torna a Oggi');
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
