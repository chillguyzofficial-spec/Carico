const { chromium } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const out = process.argv[2];
const U = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/index.html';
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  for (const w of [320, 390, 768, 1024, 1440, 1920]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    p.on('pageerror', e => err.push(w + ' ' + e.message));
    await p.goto(U); await p.waitForTimeout(900);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });
    const r = await p.evaluate(() => {
      const largo = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const rotte = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src);
      const piccoli = [...document.querySelectorAll('a, button')].filter(a => { const r = a.getBoundingClientRect(); return r.width && r.height < 40 && !a.closest('.piede'); }).map(a => a.textContent.trim());
      return { largo, rotte, piccoli, noindex: !!document.querySelector('meta[name=robots][content*=noindex]') };
    });
    v(r.largo <= 0, `${w}: sborda +${r.largo}`);
    v(r.rotte.length === 0, `${w}: immagini rotte ${r.rotte}`);
    v(r.piccoli.length === 0, `${w}: tocchi sotto 40px ${r.piccoli}`);
    v(r.noindex, 'noindex');
    if (w === 390 || w === 1440) await p.screenshot({ path: `${out}/sito-${w}.png`, fullPage: true });
    await p.close();
  }
  v(err.length === 0, 'errori ' + err.join(' | '));
  console.log(`${ok} ok, ${ko} ko`); await b.close();
})();
