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
  let modo = 'kg';       // cosa modificano i tasti ± della serie aperta: 'kg' o 'reps'
  let orologio = null;   // aggiorna tempo trascorso e recupero
  let foglio = null;     // menu ··· aperto: 'menu' | 'sostituisci' | null
  let notaAperta = false;

  const salva = () => A.scrivi(A.chiaveSessione, S);
  function nuova() {
    return {
      inizio: Date.now(), idx: 0, finito: false, fine: null,
      es: ESERCIZI.map((e) => ({ nome: null, nota: '', video: null, serie: Array.from({ length: e.serie }, () => ({ kg: e.kg, reps: e.reps, fatta: false })) })),
      recupero: null, // { fine: timestamp, totale: secondi, es: indice }
    };
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
        <div class="centro"><b>${esc(all.nome)} · esercizio ${i + 1} di ${ESERCIZI.length}</b><span class="num" id="trascorso">${mmss((Date.now() - S.inizio) / 1000)}</span></div>
        <button class="icona-44" id="apri-menu" aria-label="Altre azioni sull'esercizio"><svg width="18" height="4" viewBox="0 0 18 4"><circle cx="2" cy="2" r="1.8" fill="#A3ACBD"/><circle cx="9" cy="2" r="1.8" fill="#A3ACBD"/><circle cx="16" cy="2" r="1.8" fill="#A3ACBD"/></svg></button>
      </header>
      <nav class="segmenti-es" aria-label="Esercizi">${segmenti}</nav>`;
  }

  const SPUNTA = (c) => `<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ---------- 3a · Serie in corso ----------
  function schermoSerie(i) {
    const e = ex(i), s = S.es[i], aperta = prossimaSerie(i);
    const sostituito = s.nome ? `<span class="sostituito">al posto di ${esc(e.nome)}</span>` : '';
    const richiesto = e.video && !s.video ? `<span class="chip chip-info">Video richiesto da ${esc(D.coach.breve)} · serie ${e.serie}</span>` : s.video ? `<span class="chip chip-ok">Video inviato a ${esc(D.coach.breve)}</span>` : '';
    const ultima = e.prec[0];
    const righe = s.serie.map((r, j) => {
      const p = e.prec[j] ? `${kg(e.prec[j][0])} × ${e.prec[j][1]}` : '—';
      if (j === aperta) {
        return `<div class="serie-aperta">
          <div class="riga-serie corrente">
            <span class="n">${j + 1}</span><span class="prec">${p}</span>
            <button class="valore kg${modo === 'kg' ? ' attivo' : ''}" data-modo="kg" aria-label="Peso ${kg(r.kg)} chili, modifica">${kg(r.kg)}</button>
            <button class="valore reps${modo === 'reps' ? ' attivo' : ''}" data-modo="reps" aria-label="${r.reps} ripetizioni, modifica">${r.reps}</button>
            <button class="conferma" id="fatta" aria-label="Serie ${j + 1} fatta: ${kg(r.kg)} chili per ${r.reps}">${SPUNTA('#fff')}</button>
          </div>
          <div class="regola">
            <button class="piu-meno" data-delta="-1" aria-label="${modo === 'kg' ? 'Meno 2,5 chili' : 'Una ripetizione in meno'}">${modo === 'kg' ? '−2,5' : '−1'}</button>
            <span class="cosa"><b>${modo === 'kg' ? 'Peso' : 'Ripetizioni'} · serie ${j + 1}</b><span>${modo === 'kg' ? 'tocca reps per ±1' : 'tocca kg per ±2,5'}</span></span>
            <button class="piu-meno" data-delta="1" aria-label="${modo === 'kg' ? 'Più 2,5 chili' : 'Una ripetizione in più'}">${modo === 'kg' ? '+2,5' : '+1'}</button>
          </div>
        </div>`;
      }
      const fatta = r.fatta;
      return `<div class="riga-serie${fatta ? ' fatta' : ''}">
        <span class="n">${j + 1}</span><span class="prec">${p}</span>
        <span class="valore">${kg(r.kg)}</span><span class="valore">${r.reps}</span>
        ${fatta ? `<button class="spunta-fatta" data-annulla="${j}" aria-label="Serie ${j + 1} fatta, tocca per riaprirla">${SPUNTA('#3DD68C')}</button>` : '<span class="casella" aria-hidden="true"></span>'}
      </div>`;
    }).join('');

    return `
      ${barraTop(i)}
      <div class="corpo-es">
        <h1 class="nome-es${nomeDi(i).length > 16 ? ' lungo' : ''}">${esc(nomeDi(i))}</h1>
        <div class="info-es num">
          ${sostituito}
          <span class="target">Target ${e.serie} × ${e.reps} · recupero ${mmss(e.rec)}</span>
          <span class="ultima">Ultima volta ${kg(ultima[0])} kg × ${ultima[1]}</span>
          ${e.nota ? `<span class="nota-coach"><img class="avatar" src="${D.coach.foto}" alt=""><span><span class="da-chi">${esc(D.coach.breve)} ·</span> ${esc(e.nota)}</span></span>` : ''}
          ${richiesto}
        </div>
        ${e.demo && !s.nome ? `
        <button class="demo" id="demo">
          <span class="miniatura"><img src="assets/foto/${e.demo}.webp" alt=""><span class="velo"><svg width="12" height="14" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg></span></span>
          <span class="testi"><b>Dimostrazione di ${esc(D.coach.breve)}</b><span>${e.durata} · facoltativa</span></span>
          <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="#7C8698" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>` : ''}
        <div class="tabella-serie">
          <div class="riga-serie testa" aria-hidden="true"><span><span class="lunga">Serie</span><span class="corta">#</span></span><span>Preced.</span><span class="dx">Kg</span><span class="dx">Reps</span><span></span></div>
          ${righe}
        </div>
        <p class="aiuto">Già compilato con il target. Tocca ✓ se è andata come previsto.</p>
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
            <span class="sotto num"><span>Vibrazione a 0:10</span><span>di ${mmss(S.recupero.totale)}</span></span>
          </div>
          <div class="due-tasti">
            <button class="tasto-56" id="piu30">+30 s</button>
            <button class="tasto-56" id="salta">Salta</button>
          </div>
        </div>
        <div class="prossima card">
          <div><span class="quando">Prossima · serie ${j + 1}</span><span class="cosa num">${kg(r.kg)} kg × ${r.reps}</span></div>
          <button class="link-azione" id="modifica">Modifica</button>
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
    if (t) t.textContent = mmss((Date.now() - S.inizio) / 1000);
    if (!S.recupero) return;
    const resta = (S.recupero.fine - Date.now()) / 1000;
    const c = document.getElementById('cifre');
    if (c) {
      c.textContent = mmss(Math.max(0, Math.ceil(resta)));
      document.getElementById('traccia-rec').style.width = Math.max(0, Math.min(100, resta / S.recupero.totale * 100)) + '%';
    }
    if (!S.recupero.vibrato && resta <= 10) { S.recupero.vibrato = true; navigator.vibrate && navigator.vibrate(200); }
    if (resta <= 0) { navigator.vibrate && navigator.vibrate([200, 100, 200]); S.recupero = null; salva(); if (!foglio) disegna(); }
  }

  function serieFatta() {
    const i = S.idx, j = prossimaSerie(i), r = S.es[i].serie[j], e = ex(i);
    r.fatta = true;
    const ultima = finitoEs(i);
    S.recupero = ultima ? null : { fine: Date.now() + e.rec * 1000, totale: e.rec, es: i };
    modo = 'kg';
    salva(); disegna();
    A.avviso(`Serie ${j + 1} salvata`, `${kg(r.kg)} kg × ${r.reps}${ultima ? '' : ` · recupero ${mmss(e.rec)}`}`, () => {
      r.fatta = false; S.recupero = null; salva(); disegna();
    });
  }

  function regola(delta) {
    const i = S.idx, j = prossimaSerie(i), r = S.es[i].serie[j];
    if (modo === 'kg') r.kg = Math.max(0, Math.round((r.kg + delta * 2.5) * 10) / 10);
    else r.reps = Math.max(1, r.reps + delta);
    // le serie ancora da fare dopo questa seguono il nuovo valore
    S.es[i].serie.forEach((s, k) => { if (k > j && !s.fatta) { if (modo === 'kg') s.kg = r.kg; } });
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
    if (t.matches('[data-chiudi]')) { foglio = null; disegna(); return; }
    if (t.dataset.vai !== undefined) { S.idx = Number(t.dataset.vai); modo = 'kg'; salva(); disegna(); return; }
    if (t.dataset.modo) { modo = t.dataset.modo; disegna(); return; }
    if (t.dataset.delta) { regola(Number(t.dataset.delta)); return; }
    if (t.dataset.annulla !== undefined) { S.es[i].serie[Number(t.dataset.annulla)].fatta = false; S.recupero = null; salva(); disegna(); return; }
    if (t.dataset.alt !== undefined) { S.es[i].nome = t.dataset.alt || null; foglio = null; salva(); disegna(); return; }
    switch (t.id) {
      case 'fatta': serieFatta(); break;
      case 'apri-menu': foglio = 'menu'; disegna(); break;
      case 'sostituisci': foglio = 'sostituisci'; disegna(); break;
      case 'registra': document.getElementById('file-video').click(); break;
      case 'piu30': S.recupero.fine += 30000; S.recupero.totale += 30; S.recupero.vibrato = false; salva(); tic(); break;
      case 'salta': S.recupero = null; salva(); disegna(); break;
      case 'modifica': S.recupero = null; salva(); disegna(); break;
      case 'prossimo': S.idx = i + 1; modo = 'kg'; notaAperta = false; salva(); disegna(); break;
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
      if (all && S.es.length !== ESERCIZI.length) { S = nuova(); salva(); } // programma cambiato: si riparte
      disegna();
      clearInterval(orologio);
      orologio = setInterval(() => { if (location.hash.startsWith('#allenamento') && S && !S.finito) tic(); }, 250);
    },
  };
})();
