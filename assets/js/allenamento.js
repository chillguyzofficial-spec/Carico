// Allenamento del giorno come SCHEDA UNICA (scelta di Francesco 2026-11-03: niente app che guida passo passo).
// Layout dal suo modello (IMG_6458, 2026-11-03): testata con foto e serie fatte, esercizi numerati 01, 02…
// uno aperto alla volta; dentro una tabella SERIE · KG · REP con i numeri scrivibili e la sk-casella da spuntare.
// Libertà dell'atleta: serie in più, esercizi aggiunti fuori programma, sostituzione con qualsiasi esercizio.
// Niente timer (tolti su richiesta di Francesco). La sessione è salvata (si chiude e si riprende).
(function () {
  const A = window.APP, D = A.D, { esc, kg } = A;
  const chiave = D.settimana[A.oggi];
  const all = A.allenamentoDi(A.oggi);
  const ESERCIZI = chiave ? D.esercizi[chiave] : [];
  const vista = () => document.querySelector('[data-vista="allenamento"]');
  // 2320 → «2.320», 2247.5 → «2.247,5» (il browser in italiano non mette il punto sotto le 5 cifre)
  const numIt = (n) => { const [i, d] = String(Math.round(Math.abs(n) * 10) / 10).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : ''); };
  const due = (n) => String(n).padStart(2, '0');

  let S = null;          // sessione salvata
  let foglio = null;     // { tipo: 'sostituisci' | 'cerca', i } (i = -1: esercizio nuovo)
  let aperto = null;     // esercizio aperto; null = il primo non finito
  let videoPer = 0;      // esercizio a cui va il video scelto

  const salva = () => A.scrivi(A.chiaveSessione, S);
  // «Firma» del programma di oggi: se il coach lo cambia dal gestionale, la scheda non ancora iniziata si aggiorna
  const firma = () => JSON.stringify(ESERCIZI.map((e) => [e.serie, e.reps, e.kg, e.nota]));
  function nuova() {
    return {
      inizio: null, finito: false, fine: null, prog: firma(),
      es: ESERCIZI.map((e) => ({ nome: null, nota: '', video: null, rec: null, serie: Array.from({ length: e.serie }, () => ({ kg: e.kg, reps: e.reps, fatta: false })) })),
    };
  }

  // Esercizi da cui scegliere quando se ne aggiunge o sostituisce uno: tutti quelli dei programmi + macchine comuni
  const ALTRI = ['Leg extension', 'Pec deck', 'Panca alla Smith', 'Shoulder press alla macchina', 'Dip alle parallele', 'Crunch ai cavi', 'Adduttori alla macchina', 'Abduttori alla macchina'];
  const LIBRERIA = (() => {
    const m = new Map();
    Object.values(D.esercizi).flat().forEach((e) => {
      if (!m.has(e.nome)) m.set(e.nome, { nome: e.nome, kg: e.prec[0][0], reps: e.reps });
      (e.alt || []).forEach((n) => { if (!m.has(n)) m.set(n, { nome: n, kg: 0, reps: e.reps }); });
    });
    ALTRI.forEach((n) => { if (!m.has(n)) m.set(n, { nome: n, kg: 0, reps: 10 }); });
    return [...m.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  })();

  // ---------- Calcoli ----------
  // Un esercizio aggiunto dall'atleta non è nel programma: niente confronti con le settimane prima né record
  const ex = (i) => ESERCIZI[i] || { nome: S.es[i].agg.nome, serie: S.es[i].serie.length, reps: S.es[i].agg.reps, kg: 0, rec: 90, prec: [], best: Infinity, inizio: 0, nota: '', alt: [], demo: null, mio: true };
  const nomeDi = (i) => S.es[i].nome || ex(i).nome;
  const contaFatte = () => S.es.reduce((t, s) => t + s.serie.filter((r) => r.fatta).length, 0);
  const contaTotali = () => S.es.reduce((t, s) => t + s.serie.length, 0);
  const volume = (serie) => serie.reduce((t, s) => t + s.kg * s.reps, 0);
  const finito = (i) => S.es[i].serie.every((r) => r.fatta);
  const primoAperto = () => S.es.findIndex((s) => s.serie.some((r) => !r.fatta));
  const apertoOra = () => (aperto === null ? primoAperto() : aperto);
  function record(i) {
    const e = ex(i);
    if (S.es[i].nome || e.mio) return null; // esercizio sostituito o aggiunto: nessun confronto
    const valide = S.es[i].serie.filter((s) => s.fatta && s.reps >= e.reps && s.kg > e.best);
    return valide.length ? valide.reduce((m, s) => (s.kg > m.kg ? s : m)) : null;
  }
  // Trazioni: il peso è la zavorra («+10 kg»), a 0 è corpo libero
  const zavorra = (i) => /^Trazioni/.test(nomeDi(i));
  const pesoTesto = (i, v) => (zavorra(i) ? (v ? `+${kg(v)} kg` : 'corpo libero') : `${kg(v)} kg`);
  const SPUNTA = (c, w = 16) => `<svg width="${w}" height="${w}" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const GUIDA = window.GUIDA || {}; // spiegazioni degli esercizi (guida.js)
  const FATICA = { facile: 'Facile', giusto: 'Giusto', limite: 'Al limite' }; // «Com'è andata?» dell'esercizio, la legge il coach
  // Record: più chili del miglior carico alle ripetizioni del programma (non per esercizi cambiati o aggiunti)
  const eRecord = (i, r) => !S.es[i].nome && !ex(i).mio && r.reps >= ex(i).reps && r.kg > ex(i).best;
  // «PR» nella tabella: a serie fatta, o se scrivi più del target (il target del coach è quasi sempre sopra il migliore)
  const mostraPR = (i, r) => eRecord(i, r) && (r.fatta || r.kg > ex(i).kg);
  const FRECCIA = '<svg class="freccia" width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 2l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------- Dischi per lato (bilanciere olimpico da 20 kg) ----------
  const BILANCIERE = ['Panca piana', 'Squat', 'Stacco da terra', 'Stacco rumeno', 'Lento avanti', 'Rematore con bilanciere', 'Hip thrust', 'Curl con bilanciere'];
  const DISCHI = [25, 20, 15, 10, 5, 2.5, 1.25];
  function dischi(totale) {
    let lato = (totale - 20) / 2;
    if (lato < 0) return null;
    const usati = [];
    for (const d of DISCHI) while (lato >= d - 0.001) { usati.push(d); lato -= d; }
    return lato > 0.01 ? null : usati;
  }
  function testoDischi(i) { // sul peso della prossima serie da fare
    if (!BILANCIERE.includes(nomeDi(i))) return '';
    const s = S.es[i], r = s.serie.find((x) => !x.fatta) || s.serie[s.serie.length - 1];
    const usati = dischi(r.kg);
    if (!usati) return '';
    return usati.length ? `Per lato: <b class="num">${usati.map(kg).join(' + ')}</b> · bilanciere da 20` : 'Solo il bilanciere (20 kg)';
  }

  // ---------- La scheda ----------
  function testata() {
    const fatte = contaFatte(), totali = contaTotali();
    return `
      <header class="testata-scheda">
        <img class="foto-scheda" src="assets/foto/${all.foto}.webp" alt="">
        <a class="icona-44 chiudi-scheda" href="#oggi" aria-label="Chiudi (la scheda resta salvata)"><svg width="18" height="18" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></a>
        <div class="testo-scheda">
          <h1 class="titolo-scheda">${esc(all.nome)}</h1>
          <div class="riga-scheda"><span>Settimana ${due(D.atleta.settimana)}</span><span class="num"><b>${fatte}</b> / ${totali} serie</span></div>
          <div class="barra-scheda" aria-hidden="true"><i style="width:${fatte / totali * 100}%"></i></div>
        </div>
      </header>`;
  }

  function rigaChiusa(i) {
    const e = ex(i), s = S.es[i], fatte = s.serie.filter((r) => r.fatta).length;
    const top = Math.max(...s.serie.map((r) => r.kg));
    const sotto = e.mio ? `${s.serie.length} serie · aggiunto da te` : `${s.serie.length} × ${e.reps} · ${pesoTesto(i, top)}`;
    const stato = fatte === s.serie.length ? `<span class="sk-casella piena" aria-label="Finito">${SPUNTA('#04140B', 18)}</span>`
      : fatte ? `<span class="parziale num" aria-label="${fatte} serie su ${s.serie.length}">${fatte}/${s.serie.length}</span>` : '';
    return `
      <section class="es" aria-labelledby="es-${i}">
        <button class="sk-riga" data-apri="${i}" aria-expanded="false">
          <span class="n-es num">${e.mio ? '+' : due(i + 1)}</span>
          <span class="nome-riga"><b id="es-${i}">${esc(nomeDi(i))}</b><small class="num">${sotto}</small></span>
          ${stato}${FRECCIA}
        </button>
      </section>`;
  }

  function esercizioAperto(i) {
    const e = ex(i), s = S.es[i];
    const ultima = e.prec.length ? Math.max(...e.prec.map((p) => p[0])) : null;
    const dati = e.mio ? '<span class="tuo">Aggiunto da te</span>'
      : s.nome ? `<span>Al posto di ${esc(e.nome)}</span>`
      : `<span>Ultima ${ultima !== null ? pesoTesto(i, ultima) : '—'}</span><span class="target">Target ${pesoTesto(i, e.kg)}</span>`;
    const togliOk = (r) => (e.mio || r.extra) && s.serie.length > 1;
    // «Prima»: la stessa serie la settimana scorsa (come Hevy e Strong); toccandola si ricopia
    const prima = (r, j) => (!e.mio && !s.nome && !r.extra ? e.prec[j] : null);
    const righe = s.serie.map((r, j) => `
      <div class="riga-serie${r.fatta ? ' fatta' : ''}${r.extra ? ' extra' : ''}${mostraPR(i, r) ? ' record' : ''}">
        <span class="n-serie num">${due(j + 1)}${togliOk(r) ? `<button class="togli-x" data-togli="${i}-${j}" aria-label="Togli la serie ${j + 1}">×</button>` : ''}</span>
        ${prima(r, j) ? `<button class="prima-cella num" data-copia="${i}-${j}" aria-label="La settimana scorsa ${kg(prima(r, j)[0])} chili per ${prima(r, j)[1]}: tocca per ricopiare">${kg(prima(r, j)[0])}<i>×</i>${prima(r, j)[1]}</button>` : '<span class="prima-cella vuota" aria-hidden="true">—</span>'}
        <input class="cella num" data-cella="kg" data-i="${i}" data-j="${j}" type="text" inputmode="decimal" value="${e.mio && !r.kg ? '' : kg(r.kg)}" placeholder="—" autocomplete="off" enterkeyhint="done" aria-label="Serie ${j + 1}, chili${zavorra(i) ? ' di zavorra' : ''}">
        <input class="cella num" data-cella="reps" data-i="${i}" data-j="${j}" type="text" inputmode="numeric" value="${r.reps}" autocomplete="off" enterkeyhint="done" aria-label="Serie ${j + 1}, ripetizioni">
        <button class="sk-casella${r.fatta ? ' piena' : ''}" data-spunta="${i}-${j}" aria-pressed="${r.fatta}" aria-label="Serie ${j + 1} fatta">${r.fatta ? SPUNTA('#04140B', 18) : ''}</button>
      </div>`).join('');
    const chiede = e.video && !s.video;
    const nota = e.nota || chiede ? `
      <div class="sk-nota">
        <img class="avatar" src="${D.coach.foto}" alt="" width="48" height="48">
        <div><span class="sk-chi"><b>${esc(D.coach.breve)}</b> / coach</span>
          ${e.nota ? `<p>“${esc(e.nota)}”</p>` : ''}
          ${chiede ? '<p class="chiede">Vuole il video di una serie.</p>' : ''}</div>
      </div>` : '';
    const dentro = `${nomeDi(i)} · ${all.nome}`;
    return `
      <section class="es aperto" aria-labelledby="es-${i}">
        <div class="sk-testa${e.demo && !s.nome ? ' con-video' : ''}">
          <span class="n-es num">${e.mio ? '+' : due(i + 1)}</span>
          <div class="titoli-es">
            <h2><button id="es-${i}" data-apri="${i}" aria-expanded="true">${esc(nomeDi(i))}</button></h2>
            ${GUIDA[nomeDi(i)] ? `<button class="come-si-fa" data-spiega="${i}"><span aria-hidden="true">i</span>Come si fa</button>` : ''}
          </div>
          ${e.demo && !s.nome ? `<button class="tecnica" data-demo="${i}" aria-label="Guarda come si fa: video di ${esc(D.coach.breve)}, ${e.durata}"><img src="assets/foto/${e.demo}.webp" alt=""><span class="play" aria-hidden="true"><svg width="12" height="14" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg></span><span class="etich">Vedi tecnica</span></button>` : ''}
          <div class="dati-es num"><span class="schema">${s.serie.length} × ${e.reps}</span><span class="ultima">${dati}</span><button class="chiudi-es" data-apri="${i}" aria-label="Chiudi ${esc(nomeDi(i))}">${FRECCIA}</button></div>
        </div>
        <div class="sk-tabella" role="group" aria-label="Serie di ${esc(nomeDi(i))}">
          <div class="intest-serie" aria-hidden="true"><span>Serie</span><span>Prima</span><span>${zavorra(i) ? '+Kg' : 'Kg'}</span><span>Rep</span><span></span></div>
          ${righe}
        </div>
        <p class="dischi-riga" id="dischi-${i}">${testoDischi(i)}</p>
        <div class="fatica" role="radiogroup" aria-label="Com'è andata?"><span class="quanto">Com'è andata?</span>${Object.entries(FATICA).map(([k, t]) => `<button role="radio" data-fatica="${i}-${k}" aria-checked="${s.fatica === k}">${t}</button>`).join('')}</div>
        ${nota}
        ${s.nota ? `<p class="nota-tua-es"><b>La tua nota:</b> «${esc(s.nota)}»</p>` : ''}
        <div class="due-azioni">
          <button class="btn-linea" data-video="${i}">${s.video ? `${SPUNTA('#C8F03C', 18)} Video inviato` : '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 6l6-3.5v11L15 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg> Invia video al coach'}</button>
          <button class="btn-linea" data-piu="${i}"><span aria-hidden="true">+</span> Aggiungi serie</button>
        </div>
        <div class="altre-azioni">
          ${e.mio ? `<button data-togli-es="${i}">Togli esercizio</button>` : `<button data-sost="${i}">Sostituisci</button>`}
          <button data-nota="${i}">${s.nota ? 'Cambia nota' : `Nota per ${esc(D.coach.breve)}`}</button>
          <a href="#coach/${encodeURIComponent(dentro)}">Chiedi a ${esc(D.coach.breve)}</a>
        </div>
      </section>`;
  }

  function scheda() {
    const fatte = contaFatte(), qui = apertoOra();
    return `
      ${testata()}
      <div class="corpo-scheda">
        ${fatte === 0 ? `<button class="link-tutto" id="tutto">${SPUNTA('#DDF77A', 16)} Fatto tutto come previsto</button>` : ''}
        <div class="elenco-es">${S.es.map((_, i) => (i === qui ? esercizioAperto(i) : rigaChiusa(i))).join('')}</div>
        <button class="aggiungi-es" id="aggiungi"><b>+ Aggiungi un esercizio</b><span>Fuori programma: ${esc(D.coach.breve)} lo vede nel riepilogo</span></button>
        <button class="btn-primario" id="concludi"${fatte ? '' : ' disabled'}>Concludi allenamento</button>
      </div>`;
  }

  // ---------- Fogli dal basso: sostituzione e ricerca di un esercizio ----------
  function schermoFoglio() {
    if (!foglio) return '';
    const i = foglio.i, e = i >= 0 ? ex(i) : null, s = S.es[i];
    let dentro;
    if (foglio.tipo === 'sostituisci') {
      dentro = `
        <div class="testa-foglio"><span class="titolo">Sostituisci ${esc(e.nome)}</span><span>Stessi target: ${e.serie} × ${e.reps}. ${esc(D.coach.breve)} vede il cambio nel riepilogo.</span></div>
        ${(e.alt || []).length ? `<span class="quando-foglio">Consigliati da ${esc(D.coach.breve)}</span>` : ''}
        ${(e.alt || []).map((n) => `<button class="voce-foglio" data-alt="${esc(n)}"><span class="testi"><b>${esc(n)}</b></span></button>`).join('')}
        <button class="voce-foglio" id="altro-esercizio"><span class="testi"><b>Un altro esercizio…</b><span>Scegli dalla lista o scrivi il nome</span></span></button>
        ${s.nome ? `<button class="voce-foglio" data-alt=""><span class="testi"><b>Torna a ${esc(e.nome)}</b></span></button>` : ''}
        <button class="chiudi-foglio" data-chiudi>Indietro</button>`;
    } else if (foglio.tipo === 'spiega') {
      // Grafica come la scheda: video in grande, muscoli come etichette, passi numerati in lime divisi da linee
      const g = GUIDA[nomeDi(i)], video = e.demo && !s.nome;
      const muscoli = g.muscoli.split(' · ');
      dentro = `
        ${video ? `<button class="guida-video" data-demo="${i}" aria-label="Guarda il video di ${esc(D.coach.breve)}, ${e.durata}">
          <img src="assets/foto/${e.demo}.webp" alt="">
          <span class="play" aria-hidden="true"><svg width="16" height="18" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#0A0A0A"/></svg></span>
          <span class="didascalia"><b>Video di ${esc(D.coach.breve)}</b><span class="num">${e.durata}</span></span>
        </button>` : ''}
        <div class="guida-testa">
          <span class="sopra">Come si fa</span>
          <span class="titolo">${esc(nomeDi(i))}</span>
          <div class="muscoli-chip">${muscoli.map((m, k) => `<span class="${k === 0 ? 'primo' : ''}">${esc(m)}</span>`).join('')}</div>
          ${!e.mio ? `<span class="oggi-chip num">Oggi ${s.serie.length} × ${e.reps} · ${pesoTesto(i, e.kg)}</span>` : ''}
        </div>
        <ol class="guida-passi">${g.passi.map((p, k) => `<li><span class="n num">${due(k + 1)}</span><span>${esc(p)}</span></li>`).join('')}</ol>
        <div class="guida-evita">
          <span class="sopra">Da evitare</span>
          ${g.errori.map((p) => `<p><span class="x" aria-hidden="true">✕</span>${esc(p)}</p>`).join('')}
        </div>
        ${e.nota && !s.nome ? `<div class="sk-nota guida-nota"><img class="avatar" src="${D.coach.foto}" alt="" width="44" height="44"><div><span class="sk-chi"><b>${esc(D.coach.breve)}</b> / coach</span><p>“${esc(e.nota)}”</p></div></div>` : ''}
        <button class="btn-linea guida-chiudi" data-chiudi>Ho capito</button>`;
    } else if (foglio.tipo === 'nota') {
      dentro = `
        <div class="testa-foglio"><span class="titolo">Nota per ${esc(D.coach.breve)}</span><span>${esc(nomeDi(i))} · la legge nel gestionale insieme alle tue serie.</span></div>
        <textarea class="campo-testo" id="testo-nota" rows="4" maxlength="400" placeholder="Es. fastidio alla spalla sull'ultima serie">${esc(s.nota || '')}</textarea>
        <button class="btn-primario" id="salva-nota">Salva nota</button>
        ${s.nota ? '<button class="chiudi-foglio" id="togli-nota">Togli la nota</button>' : '<button class="chiudi-foglio" data-chiudi>Annulla</button>'}`;
    } else {
      const oggiNomi = S.es.map((_, k) => nomeDi(k));
      const voci = LIBRERIA.filter((x) => !oggiNomi.includes(x.nome));
      dentro = `
        <div class="testa-foglio"><span class="titolo">${i === -1 ? 'Aggiungi esercizio' : `Al posto di ${esc(e.nome)}`}</span><span>Scegli dalla lista o scrivi il nome.</span></div>
        <input class="campo-testo" id="cerca" type="search" placeholder="Es. Leg extension" autocomplete="off" enterkeyhint="done" aria-label="Nome dell’esercizio">
        <div class="lista-cerca">
          ${voci.map((x) => `<button class="voce-scelta" data-scegli="${esc(x.nome)}">${esc(x.nome)}</button>`).join('')}
          <button class="voce-scelta nuova" id="scrivi-nome" hidden></button>
        </div>
        <button class="chiudi-foglio" data-chiudi>Annulla</button>`;
    }
    return `<div class="velo-foglio" data-chiudi></div><div class="foglio${foglio.tipo === 'spiega' ? ' foglio-guida' : ''}" role="dialog" aria-modal="true" aria-label="${i >= 0 ? esc(nomeDi(i)) : 'Aggiungi esercizio'}"><span class="maniglia" aria-hidden="true"></span>${dentro}</div>`;
  }

  // ---------- Fine allenamento ----------
  function schermoTotale() {
    const durata = S.inizio ? Math.max(1, Math.round(((S.fine || Date.now()) - S.inizio) / 60000)) : all.minuti;
    const vol = S.es.reduce((t, s) => t + volume(s.serie.filter((r) => r.fatta)), 0);
    const fatte = contaFatte(), records = S.es.map((_, i) => record(i)).filter(Boolean).length;
    const righe = S.es.map((s, i) => {
      const e = ex(i), f = s.serie.filter((r) => r.fatta), top = f.reduce((m, r) => Math.max(m, r.kg), 0);
      const quante = e.mio ? `${f.length} serie` : `${f.filter((r) => !r.extra).length} di ${e.serie} serie${f.some((r) => r.extra) ? ` +${f.filter((r) => r.extra).length}` : ''}`;
      const chip = record(i) ? '<span class="chip chip-info">Record</span>' : e.mio ? '<span class="chip chip-neutro">Aggiunto</span>' : s.nome ? '<span class="chip chip-neutro">Cambiato</span>' : '';
      return `<div class="riga-riep num"><span class="nome">${esc(nomeDi(i))}</span><span class="tenue">${f.length ? `${quante} · ${pesoTesto(i, top)}${s.fatica ? ` · ${FATICA[s.fatica].toLowerCase()}` : ''}` : 'non fatto'}${s.nota ? ` · nota: «${esc(s.nota)}»` : ''}</span>${chip}</div>`;
    }).join('');
    return `
      <header class="barra-top"><a class="icona-44" href="#oggi" aria-label="Torna a Oggi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A8A8A3" stroke-width="1.8" stroke-linecap="round"/></svg></a><div class="centro"><b>${esc(all.nome)} · completato</b><span class="num">${durata} min</span></div><button class="icona-44" id="riapri" aria-label="Riapri la scheda"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="#A8A8A3" stroke-width="1.8" stroke-linejoin="round"/></svg></button></header>
      <div class="corpo-es fine">
        <div class="pila-10"><span class="completato">Allenamento completato</span><h1 class="nome-es">${esc(all.nome)}</h1></div>
        <div class="tre-dati divisi num">
          <span><b>${durata}</b><small>minuti</small></span>
          <span><b>${fatte}/${contaTotali()}</b><small>serie</small></span>
          <span><b>${numIt(vol)}</b><small>kg di volume</small></span>
        </div>
        <div class="card riepilogo">${righe}</div>
        <p class="nota-tua">${records ? `${records === 1 ? 'Un record personale' : records + ' record personali'}. ` : ''}${esc(D.coach.breve)} riceve il riepilogo adesso.</p>
        <div class="in-fondo">
          <a class="btn-primario" href="#oggi">Torna a Oggi</a>
          <button class="btn-secondario" id="riapri-sotto">Riapri la scheda</button>
          <button class="link-azione" id="da-zero">Ricomincia da zero</button>
        </div>
      </div>`;
  }

  // ---------- Disegno e azioni ----------
  function disegna() {
    const v = vista();
    if (!all) { v.innerHTML = `<header class="barra-top"><a class="icona-44" href="#oggi" aria-label="Chiudi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A8A8A3" stroke-width="1.8" stroke-linecap="round"/></svg></a></header><div class="corpo-es fine"><h1 class="nome-es">Riposo</h1><p class="nota-tua">Oggi niente allenamento.</p><div class="in-fondo"><a class="btn-secondario" href="#programma">Vedi il programma</a></div></div>`; return; }
    v.innerHTML = S.finito ? schermoTotale() : scheda() + schermoFoglio();
    v.classList.toggle('con-foglio', !!foglio);
    if (foglio) { const f = v.querySelector('.foglio button, .foglio a'); f && f.focus({ preventScroll: true }); }
  }
  function ridisegnaTenendoPosizione() { const y = scrollY; disegna(); scrollTo(0, y); }
  // Dopo aver aperto un esercizio lo si porta in cima (le righe sopra si sono chiuse e la pagina è cambiata)
  function mostraAperto() {
    const s = vista().querySelector('.es.aperto');
    if (s && (s.getBoundingClientRect().top < 0 || s.getBoundingClientRect().top > innerHeight * 0.6)) s.scrollIntoView({ block: 'start' });
  }

  function spunta(i, j) {
    const r = S.es[i].serie[j], e = ex(i);
    if (r.fatta) { r.fatta = false; salva(); ridisegnaTenendoPosizione(); return; }
    r.fatta = true;
    if (!S.inizio) S.inizio = Date.now();
    salva();
    const completo = finito(i), rec = completo && record(i); // un solo annuncio, quando l'esercizio è finito
    const primaAperto = aperto;
    if (completo) { // si passa al prossimo esercizio da fare
      const dopo = S.es.findIndex((s, k) => k > i && s.serie.some((x) => !x.fatta));
      aperto = dopo >= 0 ? dopo : primoAperto();
      disegna(); mostraAperto();
    } else ridisegnaTenendoPosizione();
    A.avviso(rec ? `${nomeDi(i)} finito · record personale` : completo ? `${nomeDi(i)} finito` : `${nomeDi(i)} · serie ${j + 1}`,
      rec ? `${kg(rec.kg)} kg × ${rec.reps}: ${kg(rec.kg - e.best)} kg oltre il tuo migliore` : `${pesoTesto(i, r.kg)} × ${r.reps}`, () => {
        r.fatta = false; aperto = completo ? i : primaAperto; salva(); disegna(); mostraAperto();
      });
  }

  // Numero scritto nella tabella: aggiorna solo i dati (ridisegnare chiuderebbe la tastiera).
  // Il peso nuovo vale anche per le serie ancora da fare sotto.
  function scritto(campo, el) {
    const i = Number(el.dataset.i), j = Number(el.dataset.j), r = S.es[i].serie[j];
    const testo = el.value.trim(), n = Number(testo.replace(',', '.').replace(/[^\d.]/g, ''));
    if (testo === '' || !Number.isFinite(n)) return;
    if (campo === 'kg') {
      r.kg = Math.min(500, Math.round(n * 100) / 100);
      S.es[i].serie.forEach((s, k) => {
        if (k <= j || s.fatta) return;
        s.kg = r.kg;
        const c = vista().querySelector(`[data-cella="kg"][data-i="${i}"][data-j="${k}"]`);
        if (c) c.value = kg(r.kg);
      });
      const d = document.getElementById('dischi-' + i);
      if (d) d.innerHTML = testoDischi(i);
    } else r.reps = Math.min(100, Math.max(1, Math.round(n)));
    salva();
    vista().querySelectorAll(`.riga-serie [data-cella="kg"][data-i="${i}"]`).forEach((c) => {
      c.closest('.riga-serie').classList.toggle('record', mostraPR(i, S.es[i].serie[Number(c.dataset.j)]));
    });
  }
  // Uscendo dal campo si rimette il numero salvato (campo vuoto o scritto male)
  function riscrivi(el) {
    const r = S.es[Number(el.dataset.i)].serie[Number(el.dataset.j)];
    if (el.dataset.cella === 'kg') el.value = ex(Number(el.dataset.i)).mio && !r.kg ? '' : kg(r.kg);
    else el.value = r.reps;
  }

  // Esercizio scelto dalla lista (o scritto): si aggiunge in fondo, oppure prende il posto di quello del coach
  function scegli(nome) {
    if (!nome || !foglio) return;
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
    const dalla = LIBRERIA.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
    if (dalla) nome = dalla.nome;
    if (foglio.i >= 0) { // sostituzione
      const i = foglio.i; S.es[i].nome = nome === ex(i).nome ? null : nome; foglio = null; salva(); ridisegnaTenendoPosizione();
      A.avviso('Esercizio cambiato', `${nome} al posto di ${ex(i).nome}`);
      return;
    }
    const kgIni = dalla ? dalla.kg : 0, reps = dalla ? dalla.reps : 10;
    S.es.push({ nome: null, nota: '', video: null, rec: null, agg: { nome, reps }, serie: Array.from({ length: 3 }, () => ({ kg: kgIni, reps, fatta: false })) });
    foglio = null; aperto = S.es.length - 1; salva(); disegna(); mostraAperto();
    A.avviso(`${nome} aggiunto`, kgIni ? 'Controlla peso e ripetizioni' : 'Scrivi il peso nella tabella');
  }

  function video(file) {
    const i = videoPer, s = S.es[i], j = Math.max(0, s.serie.map((x) => x.fatta).lastIndexOf(true)), r = s.serie[j]; // l'ultima serie fatta
    s.video = { serie: j + 1, nome: file ? file.name : '', quando: Date.now() };
    salva();
    const chat = A.leggi('pt-chat') || [];
    chat.push({ da: 'atleta', istante: A.istante(), tipo: 'video', testo: 'Video della serie per la revisione.', contesto: `${nomeDi(i)} · ${all.nome} · Serie ${j + 1} · ${kg(r.kg)} kg × ${r.reps}` });
    A.scrivi('pt-chat', chat);
    ridisegnaTenendoPosizione();
    A.avviso(`Video inviato a ${D.coach.breve}`, `${nomeDi(i)} · lo rivede entro 24 h`);
  }

  function clic(ev) {
    const t = ev.target.closest('button, a, [data-chiudi]');
    if (!t) return;
    const d = t.dataset;
    if (t.matches('[data-chiudi]')) { foglio = null; ridisegnaTenendoPosizione(); return; }
    if (d.spunta) { const [i, j] = d.spunta.split('-').map(Number); spunta(i, j); return; }
    if (d.apri !== undefined) { // apre un esercizio; toccando quello aperto si chiude
      const i = Number(d.apri);
      aperto = apertoOra() === i ? -1 : i;
      disegna(); mostraAperto();
      return;
    }
    if (d.piu !== undefined) { // serie in più: copia l'ultima
      const i = Number(d.piu), u = S.es[i].serie[S.es[i].serie.length - 1];
      S.es[i].serie.push({ kg: u.kg, reps: u.reps, fatta: false, extra: !ex(i).mio });
      aperto = i; salva(); ridisegnaTenendoPosizione();
      A.avviso('Serie aggiunta', `${nomeDi(i)} · ${pesoTesto(i, u.kg)} × ${u.reps}`);
      return;
    }
    if (d.togli) { const [i, j] = d.togli.split('-').map(Number); S.es[i].serie.splice(j, 1); aperto = i; salva(); ridisegnaTenendoPosizione(); A.avviso('Serie tolta', nomeDi(i)); return; }
    if (d.togliEs !== undefined) {
      const i = Number(d.togliEs), via = S.es.splice(i, 1)[0]; aperto = null; salva(); ridisegnaTenendoPosizione();
      A.avviso('Esercizio tolto', via.agg.nome, () => { S.es.splice(i, 0, via); aperto = i; salva(); ridisegnaTenendoPosizione(); });
      return;
    }
    if (d.sost !== undefined) { foglio = { tipo: 'sostituisci', i: Number(d.sost) }; ridisegnaTenendoPosizione(); return; }
    if (d.video !== undefined) { videoPer = Number(d.video); document.getElementById('file-video').click(); return; }
    if (d.demo !== undefined) { A.avviso(`Dimostrazione di ${D.coach.breve}`, `Qui parte il video del coach (${ex(Number(d.demo)).durata})`); return; }
    if (d.alt !== undefined) { S.es[foglio.i].nome = d.alt || null; foglio = null; salva(); ridisegnaTenendoPosizione(); return; }
    if (d.scegli !== undefined) { scegli(d.scegli); return; }
    if (d.copia) { // ricopia la serie della settimana scorsa
      const [i, j] = d.copia.split('-').map(Number), p = ex(i).prec[j], r = S.es[i].serie[j];
      r.kg = p[0]; r.reps = p[1]; salva(); ridisegnaTenendoPosizione();
      return;
    }
    if (d.fatica) { const [i, k] = d.fatica.split('-'); const s = S.es[Number(i)]; s.fatica = s.fatica === k ? null : k; salva(); ridisegnaTenendoPosizione(); return; }
    if (d.spiega !== undefined) { foglio = { tipo: 'spiega', i: Number(d.spiega) }; ridisegnaTenendoPosizione(); return; }
    if (d.nota !== undefined) { foglio = { tipo: 'nota', i: Number(d.nota) }; ridisegnaTenendoPosizione(); setTimeout(() => { const t = document.getElementById('testo-nota'); t && t.focus(); }, 50); return; }
    switch (t.id) {
      case 'salva-nota': case 'togli-nota': {
        const s = S.es[foglio.i], prima = s.nota;
        s.nota = t.id === 'salva-nota' ? document.getElementById('testo-nota').value.trim() : '';
        foglio = null; salva(); ridisegnaTenendoPosizione();
        if (s.nota !== prima) A.avviso(s.nota ? 'Nota salvata' : 'Nota tolta', s.nota ? `${D.coach.breve} la legge nel gestionale` : '');
        break;
      }
      case 'altro-esercizio': foglio = { tipo: 'cerca', i: foglio.i }; ridisegnaTenendoPosizione(); break;
      case 'aggiungi': foglio = { tipo: 'cerca', i: -1 }; ridisegnaTenendoPosizione(); break;
      case 'scrivi-nome': scegli(document.getElementById('cerca').value.trim()); break;
      case 'tutto': {
        const prima = JSON.stringify(S);
        S.es.forEach((s) => s.serie.forEach((r) => { r.fatta = true; }));
        if (!S.inizio) S.inizio = Date.now() - all.minuti * 60000;
        S.finito = true; S.fine = Date.now();
        salva(); disegna(); scrollTo(0, 0);
        A.avviso('Allenamento segnato come previsto', `${contaTotali()} serie`, () => { S = JSON.parse(prima); salva(); disegna(); });
        break;
      }
      case 'concludi': S.finito = true; S.fine = Date.now(); salva(); disegna(); scrollTo(0, 0); break;
      case 'riapri': case 'riapri-sotto': S.finito = false; aperto = null; salva(); disegna(); scrollTo(0, 0); break;
      case 'da-zero':
        if (!confirm('Ricominciare l’allenamento di oggi da zero? Le serie segnate si cancellano.')) break;
        S = nuova(); aperto = null; salva(); disegna(); scrollTo(0, 0);
        break;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = vista();
    v.addEventListener('click', clic);
    v.addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.dataset.cella) { scritto(el.dataset.cella, el); return; }
      if (el.id !== 'cerca') return; // ricerca nella lista degli esercizi
      const q = el.value.trim().toLowerCase();
      let esatto = false;
      v.querySelectorAll('[data-scegli]').forEach((b) => { const n = b.dataset.scegli.toLowerCase(); b.hidden = !!q && !n.includes(q); if (n === q) esatto = true; });
      const nuovo = v.querySelector('#scrivi-nome');
      nuovo.hidden = !q || esatto;
      nuovo.textContent = `+ Aggiungi «${el.value.trim()}»`;
    });
    v.addEventListener('change', (ev) => { if (ev.target.dataset.cella) riscrivi(ev.target); });
    v.addEventListener('focusin', (ev) => { if (ev.target.dataset.cella) ev.target.select(); }); // si scrive sopra al numero
    v.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      if (ev.target.id === 'cerca') { ev.preventDefault(); scegli(ev.target.value.trim()); }
      if (ev.target.dataset.cella) { ev.preventDefault(); ev.target.blur(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && foglio) { foglio = null; ridisegnaTenendoPosizione(); } });
    document.getElementById('file-video').addEventListener('change', (e) => { if (e.target.files[0]) video(e.target.files[0]); e.target.value = ''; });
  });

  A.viste.allenamento = {
    render() {
      foglio = null; aperto = null;
      S = A.leggi(A.chiaveSessione);
      if (all && (!S || !S.es || S.es.length < ESERCIZI.length)) { S = nuova(); salva(); } // in più = esercizi aggiunti
      // Non ancora iniziata e senza cambi dell'atleta: riprende serie e pesi dal programma (il coach può averlo cambiato)
      else if (all && !S.finito && S.prog !== firma() && contaFatte() === 0 && S.es.length === ESERCIZI.length && !S.es.some((s) => s.nome || s.nota || s.fatica || s.serie.some((r) => r.extra))) { S = nuova(); salva(); }
      disegna();
    },
  };
})();
