// Allenamento in corso (Claude Design 3a–3e): un esercizio per schermata, niente menu in basso.
// Serie già compilate col target → ✓ → recupero che parte da solo → riepilogo o record → prossimo.
// La sessione è salvata (si può chiudere e riprendere); a fine allenamento c'è il riepilogo totale.
(function () {
  const A = window.APP, D = A.D, { esc, kg, mmss } = A;
  const chiave = D.settimana[A.oggi];
  const all = A.allenamentoDi(A.oggi);
  const ESERCIZI = chiave ? D.esercizi[chiave] : [];
  const vista = () => document.querySelector('[data-vista="allenamento"]');
  // 2320 → «2.320», 2247.5 → «2.247,5» (il browser in italiano non mette il punto sotto le 5 cifre)
  const numIt = (n) => { const [i, d] = String(Math.round(Math.abs(n) * 10) / 10).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : ''); };

  let S = null;          // sessione salvata
  let orologio = null;   // aggiorna tempo trascorso e recupero
  let foglio = null;     // menu ··· aperto: 'menu' | 'sostituisci' | null
  let notaAperta = false;

  const salva = () => A.scrivi(A.chiaveSessione, S);
  function nuova() {
    return {
      inizio: null, avviato: false, idx: 0, finito: false, fine: null,
      es: ESERCIZI.map((e) => ({ nome: null, nota: '', video: null, rec: null, serie: Array.from({ length: e.serie }, () => ({ kg: e.kg, reps: e.reps, fatta: false })) })),
      recupero: null, // { fine: timestamp, totale: secondi, es: indice }
      avvio: null,    // { tipo: 'riscaldamento' | 'via', fine: timestamp }
    };
  }
  const recDi = (i) => S.es[i].rec || ex(i).rec; // recupero dell'esercizio (regolabile durante la sessione)
  const trascorso = () => (S.inizio ? (Date.now() - S.inizio) / 1000 : 0);

  // ---------- Suono: in palestra il telefono è sulla panca, e su iPhone il sito non può vibrare ----------
  let audio = null;
  const suonoAttivo = () => A.leggi('pt-suono') !== false;
  function sblocca() { // iPhone fa partire l'audio solo dopo un tocco
    if (audio || !window.AudioContext && !window.webkitAudioContext) return;
    audio = new (window.AudioContext || window.webkitAudioContext)();
  }
  function bip(lungo) {
    if (!suonoAttivo() || !audio) return;
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
    o.frequency.value = lungo ? 1046 : 784; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (lungo ? 0.6 : 0.15));
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + (lungo ? 0.65 : 0.2));
  }
  let ultimoSecondo = null;
  function contoBip(resta) { // bip corti agli ultimi 3 secondi, lungo allo zero
    const s = Math.ceil(resta);
    if (s === ultimoSecondo) return;
    ultimoSecondo = s;
    if (s <= 3 && s >= 1) bip(false);
  }

  // ---------- Calcoli ----------
  const ex = (i) => ESERCIZI[i];
  const nomeDi = (i) => S.es[i].nome || ex(i).nome;
  const prossimaSerie = (i) => S.es[i].serie.findIndex((s) => !s.fatta);
  const finitoEs = (i) => prossimaSerie(i) === -1;
  const volume = (serie) => serie.reduce((t, s) => t + (s.fatta !== false ? s.kg * s.reps : 0), 0);
  const volumePrima = (i) => ex(i).prec.reduce((t, [k, r]) => t + k * r, 0);
  function record(i) {
    const e = ex(i);
    if (S.es[i].nome) return null; // esercizio sostituito: nessun confronto
    const valide = S.es[i].serie.filter((s) => s.fatta && s.reps >= e.reps && s.kg > e.best);
    if (!valide.length) return null;
    return valide.reduce((m, s) => (s.kg > m.kg ? s : m));
  }

  // ---------- Pezzi comuni ----------
  function barraTop(i, tenue) {
    const segmenti = ESERCIZI.map((_, j) => {
      const pieno = finitoEs(j) ? 100 : j === i ? Math.round(S.es[j].serie.filter((s) => s.fatta).length / S.es[j].serie.length * 100) : 0;
      return `<button class="segmento-es" data-vai="${j}" aria-label="Esercizio ${j + 1}: ${esc(nomeDi(j))}"${j === i ? ' aria-current="step"' : ''}><span><i style="width:${pieno}%"></i></span></button>`;
    }).join('');
    return `
      <header class="barra-top${tenue ? ' tenue' : ''}">
        <a class="icona-44" href="#oggi" aria-label="Chiudi (la sessione resta salvata)"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a>
        <div class="centro"><b>Esercizio ${i + 1} di ${ESERCIZI.length}</b><span class="num">${esc(all.nome)} · <span id="trascorso">${mmss(trascorso())}</span></span></div>
        <button class="icona-44" id="apri-menu" aria-label="Altre azioni sull'esercizio"><svg width="18" height="4" viewBox="0 0 18 4"><circle cx="2" cy="2" r="1.8" fill="#A3ACBD"/><circle cx="9" cy="2" r="1.8" fill="#A3ACBD"/><circle cx="16" cy="2" r="1.8" fill="#A3ACBD"/></svg></button>
      </header>
      <nav class="segmenti-es" aria-label="Esercizi">${segmenti}</nav>`;
  }

  const SPUNTA = (c) => `<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ---------- Dischi per lato e confronto con le settimane prima ----------
  const BILANCIERE = ['Panca piana', 'Squat', 'Stacco da terra', 'Stacco rumeno', 'Lento avanti', 'Rematore con bilanciere', 'Hip thrust', 'Curl con bilanciere'];
  const DISCHI = [25, 20, 15, 10, 5, 2.5, 1.25];
  function dischi(totale) { // bilanciere olimpico da 20 kg
    let lato = (totale - 20) / 2;
    if (lato < 0) return null;
    const usati = [];
    for (const d of DISCHI) while (lato >= d - 0.001) { usati.push(d); lato -= d; }
    return lato > 0.01 ? null : usati;
  }
  function disegnoDischi(usati) {
    if (!usati.length) return '<span class="tenue">Solo il bilanciere (20 kg)</span>';
    const alt = { 25: 54, 20: 54, 15: 48, 10: 42, 5: 32, 2.5: 26, 1.25: 22 };
    return `<span class="bilanciere" aria-hidden="true"><i class="manico"></i>${usati.map((d) => `<i class="disco d${String(d).replace('.', '-')}" style="height:${alt[d]}px"></i>`).join('')}<i class="punta"></i></span>
      <span class="elenco num">${usati.map((d) => kg(d)).join(' + ')}</span>`;
  }
  // Carico migliore delle settimane passate (6 punti) + quello di oggi
  function storia(i) {
    const e = ex(i);
    const pr = Object.values(D.progressi).find((p) => p.nome === e.nome);
    const n = 5;
    const punti = pr ? pr.punti.slice(-n) : Array.from({ length: n }, (_, k) => Math.round((e.inizio + (e.best - e.inizio) * k / (n - 1)) / 1.25) * 1.25);
    punti[n - 1] = Math.max(...e.prec.map((p) => p[0])); // l'ultimo punto è sempre la sessione vera della settimana scorsa
    return punti;
  }
  function confronto(i, oggi) {
    const passati = storia(i), scorsa = passati[passati.length - 1];
    const diff = Math.round((oggi - scorsa) * 10) / 10;
    const punti = passati.concat(oggi);
    const min = Math.min(...punti), max = Math.max(...punti);
    const X = (k) => 4 + k * 112 / (punti.length - 1), Y = (v) => 34 - (v - min) / (max - min || 1) * 28;
    const linea = passati.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const segno = diff > 0 ? 'su' : diff < 0 ? 'giu' : 'pari';
    const testo = diff > 0 ? `+${kg(diff)} kg` : diff < 0 ? `−${kg(-diff)} kg` : 'Stesso carico';
    return `
      <div class="confronto">
        <span class="delta ${segno} num">${diff > 0 ? '▲' : diff < 0 ? '▼' : '='} ${testo}<small>rispetto alla settimana scorsa (${kg(scorsa)} kg)</small></span>
        <svg width="120" height="40" viewBox="0 0 120 40" role="img" aria-label="Ultime ${passati.length} settimane: ${passati.map(kg).join(', ')} chili; oggi ${kg(oggi)}">
          <polyline points="${linea}" fill="none" stroke="#7C8698" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
          <line x1="${X(passati.length - 1).toFixed(1)}" y1="${Y(scorsa).toFixed(1)}" x2="${X(punti.length - 1).toFixed(1)}" y2="${Y(oggi).toFixed(1)}" stroke="#7AA2FF" stroke-width="2" stroke-dasharray="3 3"/>
          ${passati.map((v, k) => `<circle cx="${X(k).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2" fill="#7C8698"/>`).join('')}
          <circle cx="${X(punti.length - 1).toFixed(1)}" cy="${Y(oggi).toFixed(1)}" r="5" fill="#2563FF" stroke="#F2F4F8" stroke-width="1.5"/>
        </svg>
      </div>`;
  }

  // ---------- Serie in corso ----------
  // Una serie alla volta: due numeri grandi con l'unità (kg, ripetizioni), − e + sempre visibili,
  // un solo pulsante «Serie fatta». Le serie fatte sono pallini sotto (si toccano per riaprirle).
  function schermoSerie(i) {
    const e = ex(i), s = S.es[i], j = prossimaSerie(i), r = s.serie[j];
    const prima = e.prec[j] || e.prec[e.prec.length - 1];
    const sostituito = s.nome ? `<span class="sostituito">al posto di ${esc(e.nome)}</span>` : '';
    const richiesto = e.video && !s.video
      ? `<p class="avviso-video">${esc(D.coach.breve)} ti chiede il video della serie ${e.serie}: lo registri dal menu ···</p>` : '';
    const pallini = s.serie.map((x, k) => {
      if (x.fatta) return `<li><button class="pallino fatto" data-annulla="${k}" aria-label="Serie ${k + 1} fatta: ${kg(x.kg)} chili per ${x.reps}. Tocca per riaprirla">${SPUNTA('#3DD68C')}<small class="num">${kg(x.kg)}×${x.reps}</small></button></li>`;
      return `<li><span class="pallino${k === j ? ' adesso' : ''}" aria-label="Serie ${k + 1}${k === j ? ', adesso' : ', da fare'}"><b class="num">${k + 1}</b><small>${k === j ? 'adesso' : ''}</small></span></li>`;
    }).join('');
    const regolatore = (campo, valore, unita, meno, piu) => `
      <div class="regolatore">
        <button class="tondo" data-campo="${campo}" data-delta="-1" aria-label="${meno}">−</button>
        <span class="numero"><b class="num">${valore}</b><small>${unita}</small></span>
        <button class="tondo" data-campo="${campo}" data-delta="1" aria-label="${piu}">+</button>
      </div>`;

    return `
      ${barraTop(i)}
      <div class="corpo-es semplice">
        <div class="testa-es">
          <h1 class="nome-es${nomeDi(i).length > 16 ? ' lungo' : ''}">${esc(nomeDi(i))}</h1>
          ${sostituito}
          <p class="obiettivo num">${e.serie} serie da ${e.reps} · recupero ${mmss(recDi(i))}</p>
        </div>

        <section class="serie-ora card-rilievo" aria-label="Serie ${j + 1} di ${e.serie}">
          <span class="quale num">Serie ${j + 1} <span>di ${e.serie}</span></span>
          ${regolatore('kg', kg(r.kg), 'kg', 'Meno 2,5 chili', 'Più 2,5 chili')}
          ${regolatore('reps', r.reps, r.reps === 1 ? 'ripetizione' : 'ripetizioni', 'Una ripetizione in meno', 'Una ripetizione in più')}
          <p class="volta-scorsa num">La volta scorsa: ${kg(prima[0])} kg × ${prima[1]}</p>
          ${!s.nome && r.kg > 0 ? confronto(i, r.kg) : ''}
          ${!s.nome && BILANCIERE.includes(e.nome) && dischi(r.kg) ? `<div class="dischi"><span class="quando">Per lato</span>${disegnoDischi(dischi(r.kg))}</div>` : ''}
        </section>

        <button class="btn-primario serie-fatta" id="fatta">${SPUNTA('#fff')} Serie fatta</button>

        <ul class="pallini" aria-label="Serie dell'esercizio">${pallini}</ul>

        ${richiesto}
        ${e.nota || (e.demo && !s.nome) ? `
        <div class="consigli">
          ${e.nota ? `<p class="nota-coach"><img class="avatar" src="${D.coach.foto}" alt=""><span><span class="da-chi">${esc(D.coach.breve)}:</span> ${esc(e.nota)}</span></p>` : ''}
          ${e.demo && !s.nome ? `<button class="demo-riga" id="demo"><span class="mini"><img src="assets/foto/${e.demo}.webp" alt=""><svg width="10" height="12" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg></span>Guarda come si fa <span class="tenue num">${e.durata}</span></button>` : ''}
        </div>` : ''}
      </div>`;
  }

  // ---------- 3b · Recupero ----------
  function schermoRecupero(i) {
    const e = ex(i), j = prossimaSerie(i), r = S.es[i].serie[j];
    const fatte = S.es[i].serie.filter((s) => s.fatta).length;
    return `
      ${barraTop(i)}
      <div class="corpo-es recupero">
        <div class="testa-rec"><h1 class="nome-es piccolo">${esc(nomeDi(i))}</h1><span class="ok num">Serie ${fatte} di ${e.serie} ✓</span></div>
        <div class="timer">
          <span class="sopratitolo">Recupero</span>
          <span class="cifre num" id="cifre" role="timer" aria-live="off">${mmss(Math.max(0, (S.recupero.fine - Date.now()) / 1000))}</span>
          <div class="pila-8">
            <span class="traccia"><i id="traccia-rec"></i></span>
            <span class="sotto num"><span>${suonoAttivo() ? 'Suono' : 'Vibrazione'} alla fine</span><span>di ${mmss(S.recupero.totale)}</span></span>
          </div>
          <div class="tre-tasti">
            <button class="tasto-56" data-rec="-15" aria-label="15 secondi in meno">−15 s</button>
            <button class="tasto-56" data-rec="15" aria-label="15 secondi in più">+15 s</button>
            <button class="tasto-56 salta" id="salta">Salta</button>
          </div>
          <p class="nota-rec num">Il recupero di ${esc(nomeDi(i))} resta ${mmss(recDi(i))} anche per le prossime serie.</p>
        </div>
        <div class="prossima card">
          <div><span class="quando">Dopo il recupero</span><b class="chi-esercizio">${esc(nomeDi(i))} · serie ${j + 1} di ${e.serie}</b><span class="cosa num">${kg(r.kg)} kg × ${r.reps} <small>ripetizioni</small></span></div>
          <button class="link-azione" id="modifica">Cambia peso</button>
        </div>
      </div>`;
  }

  // ---------- Prima di iniziare: riassunto, riscaldamento facoltativo, conto alla rovescia ----------
  function schermoPronto() {
    const righe = ESERCIZI.map((e, k) => `<li><span class="n num">${k + 1}</span><span class="cosa"><b>${esc(e.nome)}</b><span class="num">${e.serie} × ${e.reps} · ${e.kg ? kg(e.kg) + ' kg' : 'corpo libero'}</span></span></li>`).join('');
    return `
      <header class="barra-top"><a class="icona-44" href="#oggi" aria-label="Torna a Oggi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a><div class="centro"><b>Pronto?</b><span class="num">${ESERCIZI.length} esercizi · ~${all.minuti} min</span></div><span class="icona-44"></span></header>
      <div class="corpo-es fine">
        <div class="pila-10"><span class="sopratitolo">Oggi</span><h1 class="nome-es">${esc(all.nome)}</h1></div>
        <ol class="lista-pronto">${righe}</ol>
        <div class="in-fondo">
          <button class="btn-primario" id="via">Inizia</button>
          <button class="btn-secondario" id="riscaldamento">Prima 5 minuti di riscaldamento</button>
        </div>
      </div>`;
  }

  function schermoAvvio() {
    const resta = Math.max(0, (S.avvio.fine - Date.now()) / 1000);
    if (S.avvio.tipo === 'via') {
      return `<div class="via" role="timer" aria-live="assertive"><span class="sopratitolo">${esc(all.nome)} · si parte</span><span class="cifra-via num" id="cifre-avvio">${Math.ceil(resta)}</span><span class="primo">Primo: ${esc(nomeDi(0))} · ${kg(S.es[0].serie[0].kg)} kg × ${S.es[0].serie[0].reps}</span></div>`;
    }
    return `
      <header class="barra-top"><a class="icona-44" href="#oggi" aria-label="Torna a Oggi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a><div class="centro"><b>Riscaldamento</b><span>${esc(all.nome)}</span></div><span class="icona-44"></span></header>
      <div class="corpo-es recupero">
        <div class="timer">
          <span class="sopratitolo">Riscaldamento</span>
          <span class="cifre num" id="cifre-avvio" role="timer" aria-live="off">${mmss(Math.ceil(resta))}</span>
          <p class="consiglio-risc">3 minuti di cyclette o vogatore, poi 2 serie leggere di ${esc(nomeDi(0).toLowerCase())}.</p>
          <div class="due-tasti">
            <button class="tasto-56" id="piu1">+1 min</button>
            <button class="tasto-56" id="via">Inizia ora</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- 3d / 3e · Esercizio completato ----------
  function schermoFine(i) {
    const e = ex(i), s = S.es[i];
    const rec = record(i);
    const vol = volume(s.serie), prima = volumePrima(i), diff = vol - prima;
    const succ = ESERCIZI[i + 1];
    const aggiornato = succ && Object.values(D.carichi).find((c) => c.esercizio === succ.nome);
    const poi = succ
      ? `<div class="poi num"><span class="quando">Poi · ${i + 2} di ${ESERCIZI.length}</span><span>${succ.serie} × ${succ.reps} · ${kg(succ.kg)} kg${aggiornato ? ` <span class="accento">· aggiornato da ${esc(D.coach.breve)}</span>` : ''}</span></div>
         <button class="btn-primario" id="prossimo">Prossimo: ${esc(nomeDi(i + 1))}<svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
      : `<button class="btn-primario" id="concludi">Concludi allenamento</button>`;

    let centro;
    if (rec) {
      const pr = D.progressi[Object.keys(D.progressi).find((k) => D.progressi[k].nome === e.nome)];
      const punti = (pr ? pr.punti.slice() : [e.inizio, e.best]).concat(rec.kg);
      const min = Math.min(...punti), max = Math.max(...punti);
      const pts = punti.map((v, k) => `${(k * 100 / (punti.length - 1)).toFixed(1)},${(30 - (v - min) / (max - min || 1) * 26).toFixed(1)}`).join(' ');
      const ultimo = pts.split(' ').pop().split(',');
      centro = `
        <div class="card-record">
          <div class="foto"><img src="assets/foto/record-marco.webp" alt=""></div>
          <div class="testo">
            <span class="sopratitolo">Record personale</span>
            <span class="valore num">${kg(rec.kg)} kg<br>× ${rec.reps}</span>
            <span class="spiega">${kg(rec.kg - e.best)} kg oltre il tuo migliore · ${kg(e.best)} kg × ${e.reps} · +${kg(rec.kg - e.inizio)} kg dalla settimana 1</span>
            <svg width="110" height="34" viewBox="-3 -3 106 38" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#7AA2FF" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${ultimo[0]}" cy="${ultimo[1]}" r="3.5" fill="#7AA2FF"/></svg>
          </div>
        </div>
        <div class="riga-info num"><span>${s.serie.length} serie · volume ${numIt(vol)} kg</span><span class="tenue">${esc(D.coach.breve)} riceve il record</span></div>`;
    } else {
      const righe = s.serie.map((r, j) => {
        const piena = r.reps >= e.reps;
        return `<div class="riga-riep num"><span class="n">${j + 1}</span><span>${kg(r.kg)} kg × ${r.reps}${piena ? '' : ` <span class="tenue">· target ${e.reps}</span>`}</span>${piena ? SPUNTA('#3DD68C') : '<span class="trattino" aria-label="sotto il target"></span>'}</div>`;
      }).join('');
      const confronto = vol === 0 ? '' : diff > 0 ? `+${numIt(diff)} kg sull'ultima volta` : diff < 0 ? `${numIt(diff)} kg sull'ultima volta` : 'uguale all’ultima volta';
      centro = `
        <div class="card riepilogo">
          ${righe}
          ${vol > 0 ? `<div class="volume num"><span class="pila-2"><span class="quando">Volume</span><span class="cifra">${numIt(vol)} kg</span></span><span class="${diff >= 0 ? 'accento' : 'tenue'}">${confronto}</span></div>` : ''}
        </div>`;
    }
    const nota = notaAperta
      ? `<div class="nota-box"><label class="vh" for="testo-nota">Nota per ${esc(D.coach.breve)}</label><textarea class="campo-testo" id="testo-nota" rows="3" placeholder="Es. ultima serie lenta, spalla a posto">${esc(s.nota)}</textarea><button class="btn-secondario" id="salva-nota">Salva nota</button></div>`
      : s.nota
        ? `<p class="nota-tua">«${esc(s.nota)}» <button class="link-azione" id="nota">Modifica</button></p>`
        : `<p class="nota-tua">${esc(D.coach.breve)} vede il riepilogo a fine sessione. <button class="link-azione" id="nota">Aggiungi una nota</button></p>`;
    return `
      ${barraTop(i)}
      <div class="corpo-es fine">
        <div class="pila-10"><span class="completato">Esercizio completato</span><h1 class="nome-es medio${nomeDi(i).length > 16 ? ' lungo' : ''}">${esc(nomeDi(i))}</h1></div>
        ${centro}
        ${nota}
        <div class="in-fondo">${poi}</div>
      </div>`;
  }

  // ---------- Fine allenamento ----------
  function schermoTotale() {
    const durata = Math.round(((S.fine || Date.now()) - S.inizio) / 60000);
    const vol = S.es.reduce((t, s) => t + volume(s.serie.filter((r) => r.fatta)), 0);
    const serie = S.es.reduce((t, s) => t + s.serie.filter((r) => r.fatta).length, 0);
    const records = ESERCIZI.map((_, i) => record(i)).filter(Boolean).length;
    const righe = ESERCIZI.map((e, i) => {
      const fatte = S.es[i].serie.filter((r) => r.fatta);
      const top = fatte.reduce((m, r) => (r.kg > m ? r.kg : m), 0);
      return `<div class="riga-riep num"><span class="nome">${esc(nomeDi(i))}</span><span class="tenue">${fatte.length} × ${e.reps} · ${kg(top)} kg</span>${record(i) ? '<span class="chip chip-info">Record</span>' : ''}</div>`;
    }).join('');
    return `
      <header class="barra-top"><a class="icona-44" href="#oggi" aria-label="Torna a Oggi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a><div class="centro"><b>${esc(all.nome)} · completato</b><span class="num">${durata} min</span></div><span class="icona-44"></span></header>
      <div class="corpo-es fine">
        <div class="pila-10"><span class="completato">Allenamento completato</span><h1 class="nome-es">${esc(all.nome)}</h1></div>
        <div class="tre-dati num">
          <span><b>${durata}</b><small>minuti</small></span>
          <span><b>${serie}</b><small>serie</small></span>
          <span><b>${numIt(vol)}</b><small>kg di volume</small></span>
        </div>
        <div class="card riepilogo">${righe}</div>
        <p class="nota-tua">${records ? `${records === 1 ? 'Un record personale' : records + ' record personali'}. ` : ''}${esc(D.coach.breve)} riceve il riepilogo adesso.</p>
        <div class="in-fondo"><a class="btn-primario" href="#oggi">Torna a Oggi</a></div>
      </div>`;
  }

  // ---------- Menu ··· (3c) ----------
  function schermoFoglio(i) {
    if (!foglio) return '';
    const e = ex(i), j = prossimaSerie(i);
    const serieAtt = j === -1 ? e.serie : j + 1;
    const r = S.es[i].serie[j === -1 ? e.serie - 1 : j];
    const contesto = `${nomeDi(i)} · serie ${serieAtt} · ${kg(r.kg)} kg × ${r.reps}`;
    let dentro;
    if (foglio === 'sostituisci') {
      dentro = `
        <div class="testa-foglio"><span class="titolo">Sostituisci ${esc(e.nome)}</span><span>Stessi target: ${e.serie} × ${e.reps}. ${esc(D.coach.breve)} vede il cambio nel riepilogo.</span></div>
        ${(e.alt || []).map((n) => `<button class="voce-foglio" data-alt="${esc(n)}"><span class="testi"><b>${esc(n)}</b></span></button>`).join('')}
        ${S.es[i].nome ? `<button class="voce-foglio" data-alt=""><span class="testi"><b>Torna a ${esc(e.nome)}</b></span></button>` : ''}
        <button class="chiudi-foglio" data-chiudi>Indietro</button>`;
    } else {
      dentro = `
        <div class="testa-foglio"><span class="titolo">${esc(nomeDi(i))}</span><span class="num">Serie ${serieAtt} di ${e.serie} · ${kg(r.kg)} kg × ${r.reps}</span></div>
        <button class="voce-foglio card" id="registra">
          <span class="icona-tonda"><span class="rec"></span></span>
          <span class="testi"><b>Registra la serie</b><span>Video per ${esc(D.coach.breve)} · lo rivede entro 24 h</span></span>
        </button>
        <a class="voce-foglio card" href="#coach/${encodeURIComponent(`${nomeDi(i)} · ${all.nome} · Serie ${serieAtt} · ${kg(r.kg)} kg × ${r.reps}`)}">
          <span class="icona-tonda"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="none" stroke="#F2F4F8" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
          <span class="testi"><b>Chiedi al coach</b><span class="contesto">${esc(contesto)}</span></span>
        </a>
        ${(e.alt || []).length ? `<button class="voce-foglio" id="sostituisci">
          <span class="icona-tonda vuota"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 8h13l-3-3M19 16H6l3 3" fill="none" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <span class="testi"><b>Sostituisci esercizio</b><span class="tenue">Attrezzo occupato o fastidio</span></span>
        </button>` : ''}
        <button class="voce-foglio" id="suono" aria-pressed="${suonoAttivo()}">
          <span class="icona-tonda vuota"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="none" stroke="#A3ACBD" stroke-width="1.8" stroke-linejoin="round"/>${suonoAttivo() ? '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/>' : '<path d="M17 9.5l5 5M22 9.5l-5 5" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/>'}</svg></span>
          <span class="testi"><b>Suono a fine recupero: ${suonoAttivo() ? 'sì' : 'no'}</b><span class="tenue">Bip agli ultimi 3 secondi</span></span>
        </button>
        <button class="chiudi-foglio" data-chiudi>Chiudi</button>`;
    }
    return `<div class="velo-foglio" data-chiudi></div><div class="foglio" role="dialog" aria-modal="true" aria-label="Azioni esercizio"><span class="maniglia" aria-hidden="true"></span>${dentro}</div>`;
  }

  // ---------- Disegno e azioni ----------
  function disegna() {
    const v = vista();
    if (!all) { v.innerHTML = `<div class="corpo-es fine"><h1 class="nome-es">Riposo</h1><p class="nota-tua">Oggi niente allenamento.</p><div class="in-fondo"><a class="btn-secondario" href="#programma">Vedi il programma</a></div></div>`; return; }
    const i = S.idx;
    let html;
    if (S.avvio) { v.innerHTML = schermoAvvio(); v.classList.remove('con-foglio'); return; }
    if (!S.avviato) { v.innerHTML = schermoPronto(); v.classList.remove('con-foglio'); return; }
    if (S.finito) html = schermoTotale();
    else if (S.recupero && S.recupero.es === i && S.recupero.fine > Date.now() && !finitoEs(i)) html = schermoRecupero(i);
    else if (finitoEs(i)) html = schermoFine(i);
    else html = schermoSerie(i);
    v.innerHTML = html + (S.finito ? '' : schermoFoglio(i));
    v.classList.toggle('con-foglio', !!foglio);
    if (foglio) v.querySelector('.foglio button, .foglio a').focus();
  }

  function tic() {
    const t = document.getElementById('trascorso');
    if (t) t.textContent = mmss(trascorso());
    if (S.avvio) {
      const resta = (S.avvio.fine - Date.now()) / 1000;
      const c = document.getElementById('cifre-avvio');
      if (c) c.textContent = S.avvio.tipo === 'via' ? Math.max(1, Math.ceil(resta)) : mmss(Math.max(0, Math.ceil(resta)));
      contoBip(resta);
      if (resta <= 0) {
        if (S.avvio.tipo === 'riscaldamento') { S.avvio = { tipo: 'via', fine: Date.now() + 3000 }; }
        else { S.avvio = null; S.avviato = true; S.inizio = Date.now(); bip(true); navigator.vibrate && navigator.vibrate(300); }
        ultimoSecondo = null; salva(); disegna();
      }
      return;
    }
    if (!S.recupero) return;
    const resta = (S.recupero.fine - Date.now()) / 1000;
    const c = document.getElementById('cifre');
    if (c) {
      c.textContent = mmss(Math.max(0, Math.ceil(resta)));
      document.getElementById('traccia-rec').style.width = Math.max(0, Math.min(100, resta / S.recupero.totale * 100)) + '%';
    }
    contoBip(resta);
    if (!S.recupero.vibrato && resta <= 10) { S.recupero.vibrato = true; navigator.vibrate && navigator.vibrate(200); }
    if (resta <= 0) { bip(true); navigator.vibrate && navigator.vibrate([200, 100, 200]); S.recupero = null; ultimoSecondo = null; salva(); if (!foglio) disegna(); }
  }

  function serieFatta() {
    const i = S.idx, j = prossimaSerie(i), r = S.es[i].serie[j];
    r.fatta = true;
    const ultima = finitoEs(i);
    S.recupero = ultima ? null : { fine: Date.now() + recDi(i) * 1000, totale: recDi(i), es: i };
    ultimoSecondo = null;
    salva(); disegna();
    A.avviso(`Serie ${j + 1} salvata`, `${kg(r.kg)} kg × ${r.reps}${ultima ? '' : ` · recupero ${mmss(recDi(i))}`}`, () => {
      r.fatta = false; S.recupero = null; salva(); disegna();
    });
  }

  function regola(campo, delta) {
    const i = S.idx, j = prossimaSerie(i), r = S.es[i].serie[j];
    if (campo === 'kg') r.kg = Math.max(0, Math.round((r.kg + delta * 2.5) * 10) / 10);
    else r.reps = Math.max(1, r.reps + delta);
    // le serie ancora da fare dopo questa seguono il nuovo peso
    if (campo === 'kg') S.es[i].serie.forEach((s, k) => { if (k > j && !s.fatta) s.kg = r.kg; });
    salva(); disegna();
  }

  function video(file) {
    const i = S.idx, j = prossimaSerie(i), e = ex(i);
    const n = j === -1 ? e.serie : j + 1;
    const r = S.es[i].serie[n - 1];
    S.es[i].video = { serie: n, nome: file ? file.name : '', quando: Date.now() };
    salva();
    const chat = A.leggi('pt-chat') || [];
    chat.push({ da: 'atleta', istante: A.istante(), tipo: 'video', testo: 'Video della serie per la revisione.', contesto: `${nomeDi(i)} · ${all.nome} · Serie ${n} · ${kg(r.kg)} kg × ${r.reps}` });
    A.scrivi('pt-chat', chat);
    foglio = null; disegna();
    A.avviso(`Video inviato a ${D.coach.breve}`, `Serie ${n} · ${kg(r.kg)} kg × ${r.reps} · lo rivede entro 24 h`);
  }

  function clic(ev) {
    const t = ev.target.closest('button, a, [data-chiudi]');
    if (!t) return;
    const i = S.idx;
    sblocca();
    if (t.matches('[data-chiudi]')) { foglio = null; disegna(); return; }
    if (t.dataset.rec) { // −15 / +15: cambia il recupero di adesso e quello delle prossime serie di questo esercizio
      const d = Number(t.dataset.rec);
      const nuovo = Math.max(15, Math.min(600, recDi(i) + d));
      const diff = nuovo - recDi(i);
      S.es[i].rec = nuovo; S.recupero.fine += diff * 1000; S.recupero.totale = nuovo; S.recupero.vibrato = false;
      salva(); disegna(); return;
    }
    if (t.dataset.vai !== undefined) { S.idx = Number(t.dataset.vai); salva(); disegna(); return; }
    if (t.dataset.delta) { regola(t.dataset.campo, Number(t.dataset.delta)); return; }
    if (t.dataset.annulla !== undefined) { S.es[i].serie[Number(t.dataset.annulla)].fatta = false; S.recupero = null; salva(); disegna(); return; }
    if (t.dataset.alt !== undefined) { S.es[i].nome = t.dataset.alt || null; foglio = null; salva(); disegna(); return; }
    switch (t.id) {
      case 'fatta': serieFatta(); break;
      case 'apri-menu': foglio = 'menu'; disegna(); break;
      case 'sostituisci': foglio = 'sostituisci'; disegna(); break;
      case 'registra': document.getElementById('file-video').click(); break;
      case 'via': S.avvio = { tipo: 'via', fine: Date.now() + 3000 }; ultimoSecondo = null; salva(); disegna(); break;
      case 'riscaldamento': S.avvio = { tipo: 'riscaldamento', fine: Date.now() + 300000 }; salva(); disegna(); break;
      case 'piu1': S.avvio.fine += 60000; salva(); tic(); break;
      case 'suono': A.scrivi('pt-suono', !suonoAttivo()); if (suonoAttivo()) bip(false); disegna(); break;
      case 'salta': S.recupero = null; salva(); disegna(); break;
      case 'modifica': S.recupero = null; salva(); disegna(); break;
      case 'prossimo': S.idx = i + 1; notaAperta = false; salva(); disegna(); break;
      case 'concludi': S.finito = true; S.fine = Date.now(); salva(); disegna(); break;
      case 'demo': A.avviso(`Dimostrazione di ${D.coach.breve}`, `Qui parte il video del coach (${ex(i).durata})`); break;
      case 'nota': notaAperta = true; disegna(); document.getElementById('testo-nota').focus(); break;
      case 'salva-nota': S.es[i].nota = document.getElementById('testo-nota').value.trim(); notaAperta = false; salva(); disegna(); break;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    vista().addEventListener('click', clic);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && foglio) { foglio = null; disegna(); } });
    document.getElementById('file-video').addEventListener('change', (e) => { if (e.target.files[0]) video(e.target.files[0]); e.target.value = ''; });
  });

  A.viste.allenamento = {
    render() {
      foglio = null;
      S = A.leggi(A.chiaveSessione);
      if (!S && all) { S = nuova(); salva(); }
      if (S && S.avviato === undefined) { S.avviato = true; S.avvio = null; } // sessioni salvate prima dell'avvio
      if (all && S.es.length !== ESERCIZI.length) { S = nuova(); salva(); } // programma cambiato: si riparte
      disegna();
      clearInterval(orologio);
      orologio = setInterval(() => { if (location.hash.startsWith('#allenamento') && S && !S.finito) tic(); }, 250);
    },
  };
})();
