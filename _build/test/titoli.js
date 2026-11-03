const { chromium } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); let ko = 0, n = 0;
  for (const w of [320, 375, 390, 430]) for (let g = 1; g <= 7; g++) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } }); await p.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
    await p.goto(`file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/app.html?giorno=${g}`); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const t = document.querySelector('.titolone'), v = document.querySelector('.valore');
      return { t: t.scrollWidth <= t.clientWidth, size: getComputedStyle(t).fontSize, v: v.getBoundingClientRect().height < 60, txt: t.textContent }; });
    n++; if (!r.t || !r.v) { ko++; console.log('KO', w, g, r); }
    if (w === 390) console.log(w, r.txt, r.size);
    await p.close();
  }
  console.log(`${n - ko}/${n} ok`); await b.close();
})();
