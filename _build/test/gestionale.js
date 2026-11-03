// Gestionale completo: accesso, pagine, tre account di prova, assistente, nuovo atleta con codice per l'app,
// messaggi nei due versi, libreria, elimina; nell'app: account di prova e colori.
const { chromium, devices } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');
const BASE = 'file:///C:/Users/Claude%20FK/.claude/projects/gym%20app/';
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); let ok = 0, ko = 0; const err = [];
  const v = (c, m) => { if (c) ok++; else { ko++; console.log('KO', m); } };
  const guarda = (p) => { p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); }); };
  const testo = async (p, s) => (await p.textContent(s)).replace(/\s+/g, ' ').trim();
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); // stesso browser per app e gestionale (stessa memoria)
  const pc = await ctx.newPage(); guarda(pc); await pc.setViewportSize({ width: 1440, height: 900 });
  const app = await ctx.newPage(); guarda(app);

  // ---------- Accesso ----------
  await pc.goto(BASE + 'coach.html'); await pc.waitForTimeout(400);
  v(await pc.isVisible('#accesso') && !(await pc.isVisible('.gestionale')), 'prima si vede l’accesso');
  await pc.fill('#a-email', 'luca@carico.app'); await pc.fill('#a-password', 'sbagliata'); await pc.click('#form-accesso [type=submit]'); await pc.waitForTimeout(200);
  v(await pc.isVisible('#errore-accesso'), 'password sbagliata: errore');
  await pc.click('#usa-prova'); await pc.click('#form-accesso [type=submit]'); await pc.waitForTimeout(400);
  v(await pc.isVisible('.gestionale') && !(await pc.isVisible('#accesso')), 'account di prova: dentro');
  await pc.reload(); await pc.waitForTimeout(400);
  v(await pc.isVisible('.gestionale'), 'ricaricando resta dentro (stessa scheda)');

  // ---------- Oggi e assistente ----------
  v((await testo(pc, '#assistente')).includes('Il tuo assistente') && (await testo(pc, '#assistente')).includes('Mancano i carichi di partenza di Giulia'), 'assistente: carichi di Giulia');
  v((await testo(pc, '#assistente')).includes('aspetta la tua revisione'), 'assistente: video di Marco');
  v(await pc.$$eval('.scheda-atleta:not(.nuova)', (a) => a.length) === 3, 'Oggi: i 3 atleti');
  await pc.screenshot({ path: out + '/ge-oggi.png', fullPage: true });

  // ---------- Atleti: i tre account ----------
  await pc.goto(BASE + 'coach.html#atleti'); await pc.waitForTimeout(300);
  const tab = await testo(pc, '#righe-atleti');
  v(tab.includes('Marco Rossi') && tab.includes('LUCA26') && tab.includes('Giulia Bianchi') && tab.includes('LUCA11') && tab.includes('Davide Moretti') && tab.includes('LUCA99'), 'tabella: 3 account con codici');
  v(tab.includes('2 a settimana, quando vuole') && tab.includes('11 di 16'), 'ritmo di Giulia e settimana di Davide');
  // Giulia: carichi di partenza dal gestionale
  await pc.click('#righe-atleti a[href="#atleta/giulia"]'); await pc.waitForTimeout(300);
  v((await testo(pc, '#codice-atleta')) === 'LUCA11' && await pc.isVisible('.avviso-pesi'), 'scheda di Giulia: codice e avviso carichi');
  await pc.fill('#atleta-programma [data-c="kg"][data-i="0"]', '30');
  await pc.click('#prog-invia'); await pc.waitForTimeout(300);
  v((await testo(pc, '#atleta-programma')).includes('modificato'), 'carico di partenza salvato');

  // ---------- App: Giulia entra con il suo codice ----------
  await app.goto(BASE + 'app.html'); await app.waitForTimeout(400);
  v((await testo(app, '#nota-codice')).includes('LUCA11'), 'ingresso: i 3 codici di prova');
  await app.fill('#codice', 'LUCA11'); await app.waitForTimeout(400);
  v((await testo(app, '.cosa-ricevi')).includes('Programma per Giulia') && (await testo(app, '.cosa-ricevi')).includes('2 allenamenti a settimana, quando vuoi'), 'conferma: programma di Giulia');
  await Promise.all([app.waitForNavigation(), app.click('#entra')]); await app.waitForTimeout(500);
  v((await testo(app, '.saluto')).includes('Ciao Giulia') && (await testo(app, '.hero .titolone')) === 'Corpo intero A', 'app: Giulia, Corpo intero A');
  await app.click('.btn-scheda'); await app.waitForTimeout(300);
  v((await app.inputValue('[data-cella="kg"][data-i="0"][data-j="0"]')) === '30' && (await app.inputValue('[data-cella="kg"][data-i="0"][data-j="2"]')) === '30', 'carico del coach (30) su tutte le serie');
  v((await testo(app, '.es.aperto .dati-es')).includes('Target 30 kg'), 'target dal coach');
  await app.screenshot({ path: out + '/ge-giulia.png' });

  // ---------- Messaggi nei due versi ----------
  await app.goto(BASE + 'app.html#coach'); await app.waitForTimeout(400);
  await app.fill('#testo-chat', 'Ciao Luca, lo squat lo faccio con il bilanciere vuoto?'); await app.click('.invia'); await app.waitForTimeout(300);
  await pc.goto(BASE + 'coach.html#messaggi/giulia'); await pc.waitForTimeout(400);
  v((await testo(pc, '#bolle-g')).includes('bilanciere vuoto') && (await testo(pc, '#conta-messaggi')) === '1', 'il coach riceve il messaggio (1 da leggere)');
  await pc.fill('#testo-g', 'Sì, prima settimana bilanciere vuoto e tecnica.'); await pc.press('#testo-g', 'Enter'); await pc.waitForTimeout(300);
  v((await testo(pc, '#conta-messaggi')) === '', 'risposto: niente da leggere');
  await app.reload(); await app.waitForTimeout(400);
  v((await testo(app, '[data-vista="coach"]')).includes('prima settimana bilanciere vuoto'), 'Giulia riceve la risposta nell’app');
  await pc.screenshot({ path: out + '/ge-messaggi.png' });

  // ---------- Nuovo atleta ----------
  await pc.goto(BASE + 'coach.html#atleti'); await pc.waitForTimeout(300);
  await pc.click('[data-pagina="atleti"] [data-nuovo]'); await pc.waitForTimeout(200);
  await pc.click('#modulo-nuovo [type=submit]'); await pc.waitForTimeout(100);
  v(await pc.isVisible('#errore-nuovo'), 'nome obbligatorio');
  await pc.fill('#n-nome', 'Sara'); await pc.fill('#n-cognome', 'Gallo');
  await pc.click('[data-n-modello="sopra-sotto-4"]'); await pc.click('[data-n-n="3"]');
  await pc.screenshot({ path: out + '/ge-nuovo.png' });
  await pc.click('#modulo-nuovo [type=submit]'); await pc.waitForTimeout(300);
  const codice = (await testo(pc, '#codice-nuovo'));
  v(/^LUCA\d\d$/.test(codice) && !['LUCA26', 'LUCA11', 'LUCA99'].includes(codice), 'codice d’invito nuovo: ' + codice);
  await pc.click('a[data-chiudi-nuovo]'); await pc.waitForTimeout(300);
  v((await testo(pc, '.nome-atleta h1')) === 'Sara Gallo' && (await testo(pc, '#atleta-programma')).includes('Sopra'), 'scheda di Sara con il suo programma');
  v(await pc.$('[data-modo="fissi"][aria-checked="true"]') !== null && await pc.$('[data-n="3"][aria-checked="true"]') !== null, 'Sara: 3 giorni fissi');
  // Sara nell'app (dal Profilo: Ricomincia e nuovo codice)
  await app.evaluate(() => localStorage.removeItem('pt-collegato'));
  await app.goto(BASE + 'app.html'); await app.waitForTimeout(300);
  await app.fill('#codice', codice); await app.waitForTimeout(300);
  await Promise.all([app.waitForNavigation(), app.click('#entra')]); await app.waitForTimeout(500);
  v((await testo(app, '.saluto')).includes('Ciao Sara'), 'Sara entra con il suo codice');
  // elimina
  await pc.goto(BASE + 'coach.html#atleta/' + (await pc.evaluate(() => JSON.parse(localStorage.getItem('pt-atleti'))[0].id))); await pc.waitForTimeout(300);
  pc.once('dialog', (d) => d.accept());
  await pc.click('[data-elimina]'); await pc.waitForTimeout(400);
  v(!(await testo(pc, '#righe-atleti')).includes('Sara Gallo'), 'Sara eliminata');
  await app.reload(); await app.waitForTimeout(400);
  v(await app.isVisible('#codice'), 'l’app di Sara torna al codice (atleta eliminato)');

  // ---------- Davide (avanzato) e assistente: progressione ----------
  await app.evaluate(() => localStorage.setItem('pt-collegato', JSON.stringify({ quando: 1, atleta: 'davide' })));
  await app.goto(BASE + 'app.html?giorno=1#allenamento'); await app.waitForTimeout(400);
  v((await testo(app, '.titolo-scheda')) === 'Gambe A' && (await app.inputValue('[data-cella="kg"][data-i="0"][data-j="0"]')) === '115', 'Davide: squat 115 kg');
  await app.click('#tutto'); await app.waitForTimeout(300);
  await pc.goto(BASE + 'coach.html#oggi'); await pc.waitForTimeout(400);
  v((await pc.$$eval('.consiglio-g', (x) => x.length)) === 3 && await pc.isVisible('[data-consigli-tutti]'), 'assistente: prime 3 e «Mostra tutte»');
  await pc.click('[data-consigli-tutti]'); await pc.waitForTimeout(150);
  const ass = await testo(pc, '#assistente');
  v(ass.includes('Davide ha chiuso tutte le serie di Squat a 115 kg'), 'assistente: propone di alzare lo squat di Davide');
  await pc.click('[data-alza^="davide|gambe-a|0|"]'); await pc.waitForTimeout(300);
  v(!(await testo(pc, '#assistente')).includes('serie di Squat a 115 kg'), 'alzato: il consiglio sparisce');
  const prog = await pc.evaluate(() => JSON.parse(localStorage.getItem('pt-davide-programma-marco')));
  v(prog && prog['gambe-a'][0].kg === 117.5, 'squat di Davide a 117,5 per la prossima volta');

  // ---------- Programmi e libreria ----------
  await pc.goto(BASE + 'coach.html#programmi'); await pc.waitForTimeout(300);
  v(await pc.$$eval('.modello-card', (a) => a.length) === 4 && (await testo(pc, '[data-pagina="programmi"]')).includes('Lo usa: Marco, Davide'), 'Programmi: 4 modelli e chi li usa');
  await pc.goto(BASE + 'coach.html#libreria'); await pc.waitForTimeout(300);
  const tot = await pc.$$eval('.esercizio-lib', (a) => a.length);
  await pc.fill('#cerca-lib', 'femorali'); await pc.waitForTimeout(150);
  const vis = await pc.$$eval('.esercizio-lib:not([hidden])', (a) => a.length);
  v(tot === 43 && vis > 0 && vis < tot, `libreria: 43 esercizi, filtro ${vis}`);
  await pc.screenshot({ path: out + '/ge-libreria.png' });
  for (const w of [390, 768, 1024]) {
    await pc.setViewportSize({ width: w, height: 900 });
    for (const h of ['#oggi', '#atleti', '#atleta/marco', '#programmi', '#messaggi', '#libreria']) {
      await pc.goto(BASE + 'coach.html' + h); await pc.waitForTimeout(250);
      const x = await pc.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (x > 0) v(false, `sborda ${w} ${h} +${x}`);
    }
  }
  ok++;

  // ---------- App: account di prova e colori dal Profilo ----------
  await app.goto(BASE + 'app.html?giorno=2#profilo'); await app.waitForTimeout(300);
  v(await app.$$eval('.voce-account', (a) => a.length) === 3, 'Profilo: 3 account di prova');
  await app.click('[data-tema="brace"]'); await app.waitForTimeout(150);
  v(await app.evaluate(() => document.documentElement.dataset.tema) === 'brace' && (await app.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--voltaico').trim())) === '#FF7A1A', 'tema Brace applicato');
  await Promise.all([app.waitForNavigation(), app.click('[data-account="marco"]')]); await app.waitForTimeout(400);
  v((await testo(app, '.saluto')).includes('Ciao Marco') && await app.evaluate(() => document.documentElement.dataset.tema) === 'brace', 'cambio account, il colore resta');
  // ---------- Filtri e tendine (gestionale compatto) ----------
  await pc.setViewportSize({ width: 1440, height: 900 });
  await pc.goto(BASE + 'coach.html#atleti'); await pc.waitForTimeout(300);
  await pc.fill('#cerca-atleti', 'davide'); await pc.waitForTimeout(150);
  v(await pc.$$eval('#righe-atleti .tr', (a) => a.length) === 1, 'ricerca atleti: Davide');
  await pc.fill('#cerca-atleti', ''); await pc.click('[data-filtro-atleti="flessibile"]'); await pc.waitForTimeout(150);
  v((await testo(pc, '#righe-atleti')).includes('Giulia') && !(await testo(pc, '#righe-atleti')).includes('Davide'), 'filtro «Quando vuole»: Giulia');
  await pc.click('[data-filtro-atleti="tutti"]');
  await pc.goto(BASE + 'coach.html#programmi'); await pc.waitForTimeout(300);
  v(await pc.$$eval('details.modello-card[open]', (a) => a.length) === 0, 'programmi chiusi a tendina');
  await pc.fill('#cerca-programmi', 'stacco da terra'); await pc.waitForTimeout(150);
  v(await pc.$$eval('details.modello-card', (a) => a.length) === 2 && await pc.$$eval('details.modello-card mark', (a) => a.length) >= 1, 'ricerca «stacco da terra»: 2 programmi, evidenziato');
  await pc.goto(BASE + 'coach.html#atleta/marco'); await pc.waitForTimeout(300);
  v(!(await pc.isVisible('[data-modello]')) && (await testo(pc, '#tendina-piano summary')).includes('Avanzato'), 'piano chiuso in una riga');
  await pc.goto(BASE + 'coach.html#libreria'); await pc.waitForTimeout(300);
  await pc.fill('#cerca-lib', ''); // la ricerca di prima («femorali») resta finché non la cancelli
  await pc.click('[data-filtro-lib="video"]'); await pc.waitForTimeout(150);
  v((await testo(pc, '#conta-lib')) === '7 esercizi', 'libreria: 7 con video');
  await pc.goto(BASE + 'coach.html#oggi'); await pc.waitForTimeout(300);
  const alto = await pc.evaluate(() => document.documentElement.scrollHeight);
  v(alto < 1700, 'Oggi compatta: ' + alto + ' px');
  await pc.screenshot({ path: out + '/ge-compatto.png', fullPage: true });
  v(err.length === 0, 'errori: ' + err.join(' | '));
  console.log(ok + ' ok, ' + ko + ' ko'); await b.close(); process.exit(ko ? 1 : 0);
})();
