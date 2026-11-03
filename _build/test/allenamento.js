const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = 'C:/Users/Claude FK/.claude/projects/gym app';
const tipi = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': tipi[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8994);
const out = process.argv[2]; let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
const U = 'http://localhost:8994/app.html';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('pt-collegato')) localStorage.setItem('pt-collegato', '{"quando":1}'); });
  const p = await ctx.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  const larghezza = async (n) => { const x = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); v(x <= 0, `sborda ${n}: +${x}`); };
  await p.goto(U + '?giorno=4'); await p.waitForTimeout(800);
  await p.click('text=Inizia allenamento'); await p.waitForTimeout(300);
  v(await p.isHidden('.menu'), 'menu nascosto in allenamento');
  v((await p.textContent('.nome-es')).includes('Panca piana'), 'primo esercizio panca');
  v((await p.textContent('.serie-aperta')).includes('72,5'), 'serie 1 precompilata 72,5');
  await p.screenshot({ path: out + '/w-3a.png' }); await larghezza('3a');
  await p.click('#fatta'); await p.waitForTimeout(400);
  v(await p.isVisible('#cifre'), 'recupero parte dopo il segno');
  v(await p.isVisible('#avviso.su'), 'avviso serie salvata');
  await p.click('#piu30'); await p.waitForTimeout(300);
  v((await p.textContent('#cifre')).startsWith('2:'), '+30 s porta sopra i 2 minuti');
  await p.screenshot({ path: out + '/w-3b.png' }); await larghezza('3b');
  await p.click('#modifica'); await p.waitForTimeout(200);
  await p.click('[data-delta="1"]'); await p.waitForTimeout(100);
  v((await p.textContent('.serie-aperta')).includes('75'), 'kg +2,5 = 75');
  await p.click('[data-modo="reps"]'); await p.click('[data-delta="-1"]'); await p.click('[data-delta="1"]');
  v((await p.textContent('.riga-serie.corrente .reps')).trim() === '8', 'reps -1 +1');
  await p.click('#fatta'); await p.waitForTimeout(200); await p.click('#salta');
  v((await p.textContent('.riga-serie.corrente .kg')).trim() === '75', 'serie dopo seguono il nuovo peso');
  await p.click('#apri-menu'); await p.waitForTimeout(300);
  v(await p.isVisible('.foglio'), 'menu aperto');
  v((await p.textContent('.foglio')).includes('Panca piana · serie 3 · 75 kg × 8'), 'contesto nel menu');
  await p.screenshot({ path: out + '/w-3c.png' });
  await p.click('#sostituisci'); await p.waitForTimeout(200);
  await p.click('[data-alt="Chest press"]'); await p.waitForTimeout(200);
  v((await p.textContent('.nome-es')) === 'Chest press', 'sostituito');
  await p.click('#apri-menu'); await p.click('#sostituisci'); await p.click('[data-alt=""]'); await p.waitForTimeout(200);
  v((await p.textContent('.nome-es')) === 'Panca piana', 'torna originale');
  await p.click('a[aria-label^="Chiudi"]'); await p.waitForTimeout(300);
  v((await p.textContent('[data-vista="oggi"]')).includes('Riprendi allenamento'), 'Home: Riprendi');
  await p.click('text=Riprendi allenamento'); await p.waitForTimeout(300);
  v((await p.textContent('.riga-serie.corrente .n')).trim() === '3', 'ripresa dalla serie 3');
  for (let k = 0; k < 2; k++) { await p.click('#fatta'); await p.waitForTimeout(150); if (await p.isVisible('#salta')) await p.click('#salta'); }
  await p.waitForTimeout(300);
  v(await p.isVisible('.card-record'), 'record personale (75 > 70)');
  v((await p.textContent('.card-record')).includes('5 kg oltre il tuo migliore'), 'testo record');
  await p.screenshot({ path: out + '/w-3e.png' }); await larghezza('3e');
  await p.click('#nota'); await p.fill('#testo-nota', 'Ultima serie lenta'); await p.click('#salva-nota');
  v((await p.textContent('.nota-tua')).includes('Ultima serie lenta'), 'nota salvata');
  await p.click('#prossimo'); await p.waitForTimeout(200);
  v((await p.textContent('.nome-es')).includes('Lento avanti'), 'prossimo esercizio');
  v(await p.isVisible('#demo'), 'demo del coach (lento)');
  await p.click('#apri-menu'); await p.click('text=Chiedi al coach'); await p.waitForTimeout(400);
  v((await p.textContent('.contesto-scrivi')).includes('Lento avanti · Push A · Serie 1 · 42,5 kg × 8'), 'chat con contesto');
  await p.fill('#testo-chat', 'Sento la spalla destra a fine serie, normale?'); await p.click('.invia'); await p.waitForTimeout(300);
  const chat = await p.textContent('.messaggi');
  v(chat.includes('Sento la spalla destra') && chat.includes('Lento avanti · Push A'), 'messaggio con contesto in chat');
  v(chat.includes('Carico aggiornato') && chat.includes('Profondità costante'), 'storico chat');
  await p.screenshot({ path: out + '/w-chat.png' }); await larghezza('chat');
  await p.goto(U + '?giorno=4#allenamento'); await p.waitForTimeout(400);
  for (let guard = 0; guard < 60; guard++) {
    if (await p.isVisible('#concludi')) { await p.click('#concludi'); break; }
    if (await p.isVisible('#prossimo')) { await p.click('#prossimo'); continue; }
    if (await p.isVisible('#salta')) { await p.click('#salta'); continue; }
    if (await p.isVisible('#fatta')) { await p.click('#fatta'); continue; }
  }
  await p.waitForTimeout(300);
  v((await p.textContent('[data-vista="allenamento"]')).includes('Allenamento completato'), 'riepilogo finale');
  await p.screenshot({ path: out + '/w-fine.png', fullPage: true }); await larghezza('fine');
  await p.click('text=Torna a Oggi'); await p.waitForTimeout(300);
  v((await p.textContent('[data-vista="oggi"]')).includes('Completato'), 'Home: completato');
  await p.click('.menu a[href="#programma"]'); await p.waitForTimeout(300);
  v((await p.textContent('[data-vista="programma"]')).includes('Lento avanti'), 'programma: esercizi di oggi');
  await p.click('[data-vista="programma"] a[href="#programma/gambe-b"]'); await p.waitForTimeout(200);
  v((await p.textContent('.titolo-sezione')) === 'Gambe B', 'programma: anteprima altro giorno');
  await p.screenshot({ path: out + '/w-programma.png', fullPage: true }); await larghezza('programma');
  await p.goto(U + '?giorno=7'); await p.waitForTimeout(500);
  await p.click('text=Fai il check-in'); await p.waitForTimeout(300);
  v(await p.isDisabled('button[type=submit]'), 'check-in: invio bloccato');
  await p.click('[data-d="allenamenti"][data-v="4"]'); await p.click('[data-d="energia"][data-v="3"]'); await p.click('[data-d="carichi"][data-v="Giusti"]');
  await p.fill('#note-checkin', 'Giovedì dormito poco');
  await p.screenshot({ path: out + '/w-checkin.png', fullPage: true }); await larghezza('checkin');
  await p.click('button[type=submit]'); await p.waitForTimeout(400);
  v((await p.textContent('[data-vista="oggi"]')).includes('Check-in inviato'), 'Home: check-in inviato');
  const ci = await p.evaluate(() => localStorage.getItem('pt-checkin-s6'));
  const c = await b.newPage({ viewport: { width: 1440, height: 900 } }); c.on('pageerror', e => err.push('coach ' + e.message));
  await c.goto('http://localhost:8994/coach.html'); await c.evaluate(x => localStorage.setItem('pt-checkin-s6', x), ci); await c.reload(); await c.waitForTimeout(400);
  v((await c.textContent('#coda')).includes('allenamenti 4/5, energia 3/5, carichi giusti'), 'gestionale: check-in di Marco in coda');
  const s = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  await s.addInitScript(() => localStorage.setItem('pt-collegato', '{"quando":1}'));
  const q = await s.newPage();
  for (const h of ['#allenamento', '#programma', '#checkin', '#coach', '#oggi']) {
    await q.goto(U + '?giorno=5' + h); await q.waitForTimeout(400);
    const x = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    v(x <= 0, `320 sborda ${h}: +${x}`);
  }
  await q.goto(U + '?giorno=5#allenamento'); await q.waitForTimeout(300); await q.screenshot({ path: out + '/w-320.png' });
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(`${ok} ok, ${ko} ko`);
  await b.close(); srv.close();
})();
