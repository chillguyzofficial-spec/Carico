// Allenamento del giorno come SCHEDA UNICA (scelta di Francesco 2026-11-03: niente app che guida passo passo).
// Tutti gli esercizi su una pagina, ogni serie è un riquadro già compilato: un tocco = fatta, in qualsiasi ordine.
// Toccando una serie fatta si cambiano peso e ripetizioni. Niente timer (tolti su richiesta di Francesco).
// In cima «Fatto tutto come previsto» per chi ha fretta. La sessione è salvata (si chiude e si riprende).
(function () {
  const A = window.APP, D = A.D, { esc, kg, mmss } = A;
  const chiave = D.settimana[A.oggi];
  const all = A.allenamentoDi(A.oggi);
  const ESERCIZI = chiave ? D.esercizi[chiave] : [];
  const vista = () => document.querySelector('[data-vista="allenamento"]');
  // 2320 → «2.320», 2247.5 → «2.247,5» (il browser in italiano non mette il punto sotto le 5 cifre)
  const numIt = (n) => { const [i, d] = String(Math.round(Math.abs(n) * 10) / 10).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : ''); };

  let S = null;          // sessione salvata
  let foglio = null;     // { tipo: 'serie' | 'menu' | 'sostituisci', i, j }
  const aperti = new Set(); // esercizi finiti riaperti a mano

  const salva = () => A.scrivi(A.chiaveSessione, S);
  function nuova() {
    return {
      inizio: null, finito: false, fine: null,
      es: ESERCIZI.map((e) => ({ nome: null, nota: '', video: null, rec: null, serie: Array.from({ length: e.serie }, () => ({ kg: e.kg, reps: e.reps, fatta: false })) })),
      recupero: null, // { fine: timestamp, totale: secondi, es: indice }
    };
  }

  // ---------- Calcoli ----------
  const ex = (i) => ESERCIZI[i];
  const nomeDi = (i) => S.es[i].nome || ex(i).nome;
  const recDi = (i) => S.es[i].rec || ex(i).rec;
  const contaFatte = () => S.es.reduce((t, s) => t + s.serie.filter((r) => r.fatta).length, 0);
  const contaTotali = () => S.es.reduce((t, s) => t + s.serie.length, 0);
  const volume = (serie) => serie.reduce((t, s) => t + s.kg * s.reps, 0);
  const prossima = (i) => S.es[i].serie.findIndex((s) => !s.fatta);
  function record(i) {
    const e = ex(i);
    if (S.es[i].nome) return null; // esercizio sostituito: nessun confronto
    const valide = S.es[i].serie.filter((s) => s.fatta && s.reps >= e.reps && s.kg > e.best);
    return valide.length ? valide.reduce((m, s) => (s.kg > m.kg ? s : m)) : null;
  }
  const SPUNTA = (c, w = 16) => `<svg width="${w}" height="${w}" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
  function storia(i) { // migliori carichi delle ultime 5 settimane; l'ultimo è la sessione vera della settimana scorsa
    const e = ex(i), n = 5;
    const pr = Object.values(D.progressi).find((p) => p.nome === e.nome);
    const punti = pr ? pr.punti.slice(-n) : Array.from({ length: n }, (_, k) => Math.round((e.inizio + (e.best - e.inizio) * k / (n - 1)) / 1.25) * 1.25);
    punti[n - 1] = Math.max(...e.prec.map((p) => p[0]));
    return punti;
  }
  function differenza(i, oggi) {
    const scorsa = storia(i).slice(-1)[0], d = Math.round((oggi - scorsa) * 100) / 100;
    return { d, scorsa, segno: d > 0 ? 'su' : d < 0 ? 'giu' : 'pari', testo: d > 0 ? `▲ +${kg(d)} kg` : d < 0 ? `▼ −${kg(-d)} kg` : '= stesso peso' };
  }
  function confronto(i, oggi) {
    const passati = storia(i), { scorsa, segno, testo } = differenza(i, oggi);
    const punti = passati.concat(oggi), min = Math.min(...punti), max = Math.max(...punti);
    const X = (k) => 4 + k * 112 / (punti.length - 1), Y = (v) => 34 - (v - min) / (max - min || 1) * 28;
    return `
      <div class="confronto">
        <span class="delta ${segno} num">${testo}<small>rispetto alla settimana scorsa (${kg(scorsa)} kg)</small></span>
        <svg width="120" height="40" viewBox="0 0 120 40" role="img" aria-label="Ultime settimane: ${passati.map(kg).join(', ')} chili; oggi ${kg(oggi)}">
          <polyline points="${passati.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="#7C8698" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
          <line x1="${X(passati.length - 1).toFixed(1)}" y1="${Y(scorsa).toFixed(1)}" x2="${X(punti.length - 1).toFixed(1)}" y2="${Y(oggi).toFixed(1)}" stroke="#7AA2FF" stroke-width="2" stroke-dasharray="3 3"/>
          ${passati.map((v, k) => `<circle cx="${X(k).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2" fill="#7C8698"/>`).join('')}
          <circle cx="${X(punti.length - 1).toFixed(1)}" cy="${Y(oggi).toFixed(1)}" r="5" fill="#2563FF" stroke="#F2F4F8" stroke-width="1.5"/>
        </svg>
      </div>`;
  }

  // ---------- La scheda ----------
  // Regola di chiarezza: un solo colore per «fatta» (verde), un solo riquadro «Adesso» (blu),
  // esercizi finiti chiusi in una riga, niente etichette in più.
  function scheda() {
    const fatte = contaFatte(), totali = contaTotali();
    const iAdesso = S.es.findIndex((s) => s.serie.some((r) => !r.fatta));
    const carte = ESERCIZI.map((e, i) => {
      const s = S.es[i], tutte = s.serie.every((r) => r.fatta);
      const MENU = `<button class="icona-44 menu-es" data-menu="${i}" aria-label="Altre azioni su ${esc(nomeDi(i))}"><svg width="18" height="4" viewBox="0 0 18 4"><circle cx="2" cy="2" r="1.8" fill="#A3ACBD"/><circle cx="9" cy="2" r="1.8" fill="#A3ACBD"/><circle cx="16" cy="2" r="1.8" fill="#A3ACBD"/></svg></button>`;
      if (tutte && !aperti.has(i)) { // esercizio finito: una riga sola, si riapre col tocco
        const top = Math.max(...s.serie.map((r) => r.kg));
        return `<section class="riga-finito" aria-label="${esc(nomeDi(i))}, finito">
          <button class="apri-finito" data-apri="${i}">${SPUNTA('#3DD68C', 18)}<span><b>${esc(nomeDi(i))}</b><small class="num">${s.serie.length} serie · ${kg(top)} kg</small></span><span class="tenue">Modifica</span></button>
        </section>`;
      }
      const jAdesso = i === iAdesso ? s.serie.findIndex((r) => !r.fatta) : -1;
      const pesoOggi = Math.max(...s.serie.map((r) => r.kg));
      const diff = !s.nome && pesoOggi > 0 ? differenza(i, pesoOggi) : null;
      const prima = e.prec[0];
      const serie = s.serie.map((r, j) => {
        const stato = r.fatta ? 'fatta' : j === jAdesso ? 'adesso' : 'dopo';
        return `<button class="riquadro ${stato}" data-i="${i}" data-j="${j}" aria-label="Serie ${j + 1}: ${kg(r.kg)} chili per ${r.reps}. ${r.fatta ? 'Fatta, tocca per cambiarla' : 'Tocca quando l’hai fatta'}">
          <span class="etich">${r.fatta ? `${SPUNTA('#3DD68C', 13)} Fatta` : stato === 'adesso' ? 'Adesso' : `Serie ${j + 1}`}</span>
          <span class="v num"><b>${kg(r.kg)}</b> kg × <b>${r.reps}</b></span>
        </button>`;
      }).join('');
      return `
      <section class="carta-es${i === iAdesso ? ' attiva' : ''}" aria-labelledby="es-${i}">
        <div class="carta-testa">
          <div class="titoli-es">
            <h2 id="es-${i}">${esc(nomeDi(i))}</h2>
            <span class="num">${e.serie} serie da ${e.reps} · recupero ${mmss(recDi(i))}${s.nome ? ` · al posto di ${esc(e.nome)}` : ''}</span>
            ${diff ? `<span class="num confronto-riga">La volta scorsa ${kg(prima[0])} kg → oggi <b class="${diff.segno}">${kg(pesoOggi)} kg</b></span>` : ''}
          </div>
          ${MENU}
        </div>
        <div class="riquadri">${serie}</div>
        ${e.nota || (e.video && !s.video) ? `<p class="nota-es">${e.video && !s.video ? `<b>${esc(D.coach.breve)} vuole il video di una serie</b> (menu ···). ` : ''}${e.nota ? `<span class="da-chi">${esc(D.coach.breve)}:</span> ${esc(e.nota)}` : ''}</p>` : ''}
      </section>`;
    }).join('');

    return `
      <header class="barra-top">
        <a class="icona-44" href="#oggi" aria-label="Chiudi (la scheda resta salvata)"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a>
        <div class="centro"><b>${esc(all.nome)}</b><span class="num">${fatte} di ${totali} serie</span></div>
        <span class="icona-44"></span>
      </header>
      <div class="avanza" aria-hidden="true"><i style="width:${fatte / totali * 100}%"></i></div>
      <div class="corpo-scheda">
        ${fatte === 0 ? '<p class="aiuto-scheda">Tocca la serie quando l’hai fatta.</p><button class="btn-secondario" id="tutto">✓ Fatto tutto come previsto</button>' : ''}
        ${carte}
        <button class="btn-primario" id="concludi"${fatte ? '' : ' disabled'}>Concludi allenamento</button>
      </div>`; // timer tolti su richiesta di Francesco (2026-11-03): niente capsula del recupero né tempo trascorso
  }

  // ---------- Fogli dal basso: modifica serie, menu esercizio, sostituzione ----------
  function schermoFoglio() {
    if (!foglio) return '';
    const i = foglio.i, e = ex(i), s = S.es[i];
    let dentro;
    if (foglio.tipo === 'serie') {
      const r = s.serie[foglio.j];
      const reg = (campo, valore, unita, meno, piu) => `
        <div class="regolatore">
          <button class="tondo" data-campo="${campo}" data-delta="-1" aria-label="${meno}">−</button>
          <span class="numero"><b class="num">${valore}</b><small>${unita}</small></span>
          <button class="tondo" data-campo="${campo}" data-delta="1" aria-label="${piu}">+</button>
        </div>`;
      const usati = !s.nome && BILANCIERE.includes(e.nome) ? dischi(r.kg) : null;
      dentro = `
        <div class="testa-foglio"><span class="titolo">${esc(nomeDi(i))}</span><span class="num">Serie ${foglio.j + 1} di ${e.serie} · target ${e.reps} ripetizioni</span></div>
        ${reg('kg', kg(r.kg), 'kg', 'Meno 2,5 chili', 'Più 2,5 chili')}
        ${reg('reps', r.reps, r.reps === 1 ? 'ripetizione' : 'ripetizioni', 'Una ripetizione in meno', 'Una ripetizione in più')}
        ${!s.nome && r.kg > 0 ? confronto(i, r.kg) : ''}
        ${usati ? `<div class="dischi"><span class="quando">Per lato</span>${disegnoDischi(usati)}</div>` : ''}
        <button class="btn-primario" id="salva-serie">${SPUNTA('#fff', 18)} ${r.fatta ? 'Salva' : 'Segna come fatta'}</button>
        ${r.fatta ? '<button class="chiudi-foglio" id="non-fatta">Non l’ho fatta</button>' : '<button class="chiudi-foglio" data-chiudi>Chiudi</button>'}`;
    } else if (foglio.tipo === 'sostituisci') {
      dentro = `
        <div class="testa-foglio"><span class="titolo">Sostituisci ${esc(e.nome)}</span><span>Stessi target: ${e.serie} × ${e.reps}. ${esc(D.coach.breve)} vede il cambio nel riepilogo.</span></div>
        ${(e.alt || []).map((n) => `<button class="voce-foglio" data-alt="${esc(n)}"><span class="testi"><b>${esc(n)}</b></span></button>`).join('')}
        ${s.nome ? `<button class="voce-foglio" data-alt=""><span class="testi"><b>Torna a ${esc(e.nome)}</b></span></button>` : ''}
        <button class="chiudi-foglio" data-chiudi>Indietro</button>`;
    } else {
      const j = Math.max(0, prossima(i) === -1 ? e.serie - 1 : prossima(i)), r = s.serie[j];
      dentro = `
        <div class="testa-foglio"><span class="titolo">${esc(nomeDi(i))}</span><span class="num">${e.serie} × ${e.reps} · ${kg(r.kg)} kg</span></div>
        <button class="voce-foglio card" id="cambia">
          <span class="icona-tonda"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14" stroke="#F2F4F8" stroke-width="1.8" stroke-linecap="round"/></svg></span>
          <span class="testi"><b>Cambia peso o ripetizioni</b><span>Vale anche per le serie dopo</span></span>
        </button>
        ${e.demo && !s.nome ? `<button class="voce-foglio card" id="demo"><span class="icona-tonda"><svg width="14" height="16" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#F2F4F8"/></svg></span><span class="testi"><b>Guarda come si fa</b><span>Video di ${esc(D.coach.breve)} · ${e.durata}</span></span></button>` : ''}
        <button class="voce-foglio card" id="registra">
          <span class="icona-tonda"><span class="rec"></span></span>
          <span class="testi"><b>Registra una serie</b><span>Video per ${esc(D.coach.breve)} · lo rivede entro 24 h</span></span>
        </button>
        <a class="voce-foglio card" href="#coach/${encodeURIComponent(`${nomeDi(i)} · ${all.nome} · Serie ${j + 1} · ${kg(r.kg)} kg × ${r.reps}`)}">
          <span class="icona-tonda"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="none" stroke="#F2F4F8" stroke-width="1.8" stroke-linejoin="round"/></svg></span>
          <span class="testi"><b>Chiedi al coach</b><span class="contesto">${esc(`${nomeDi(i)} · serie ${j + 1} · ${kg(r.kg)} kg × ${r.reps}`)}</span></span>
        </a>
        ${(e.alt || []).length ? `<button class="voce-foglio" id="sostituisci"><span class="icona-tonda vuota"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 8h13l-3-3M19 16H6l3 3" fill="none" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="testi"><b>Sostituisci esercizio</b><span class="tenue">Attrezzo occupato o fastidio</span></span></button>` : ''}
        <button class="chiudi-foglio" data-chiudi>Chiudi</button>`;
    }
    return `<div class="velo-foglio" data-chiudi></div><div class="foglio" role="dialog" aria-modal="true" aria-label="${esc(nomeDi(i))}"><span class="maniglia" aria-hidden="true"></span>${dentro}</div>`;
  }

  // ---------- Fine allenamento ----------
  function schermoTotale() {
    const durata = S.inizio ? Math.max(1, Math.round(((S.fine || Date.now()) - S.inizio) / 60000)) : all.minuti;
    const vol = S.es.reduce((t, s) => t + volume(s.serie.filter((r) => r.fatta)), 0);
    const fatte = contaFatte(), records = ESERCIZI.map((_, i) => record(i)).filter(Boolean).length;
    const righe = ESERCIZI.map((e, i) => {
      const f = S.es[i].serie.filter((r) => r.fatta), top = f.reduce((m, r) => Math.max(m, r.kg), 0);
      return `<div class="riga-riep num"><span class="nome">${esc(nomeDi(i))}</span><span class="tenue">${f.length ? `${f.length} di ${e.serie} serie · ${kg(top)} kg` : 'non fatto'}</span>${record(i) ? '<span class="chip chip-info">Record</span>' : ''}</div>`;
    }).join('');
    return `
      <header class="barra-top"><a class="icona-44" href="#oggi" aria-label="Torna a Oggi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a><div class="centro"><b>${esc(all.nome)} · completato</b><span class="num">${durata} min</span></div><button class="icona-44" id="riapri" aria-label="Riapri la scheda"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="#A3ACBD" stroke-width="1.8" stroke-linejoin="round"/></svg></button></header>
      <div class="corpo-es fine">
        <div class="pila-10"><span class="completato">Allenamento completato</span><h1 class="nome-es">${esc(all.nome)}</h1></div>
        <div class="tre-dati num">
          <span><b>${durata}</b><small>minuti</small></span>
          <span><b>${fatte}/${contaTotali()}</b><small>serie</small></span>
          <span><b>${numIt(vol)}</b><small>kg di volume</small></span>
        </div>
        <div class="card riepilogo">${righe}</div>
        <p class="nota-tua">${records ? `${records === 1 ? 'Un record personale' : records + ' record personali'}. ` : ''}${esc(D.coach.breve)} riceve il riepilogo adesso.</p>
        <div class="in-fondo"><a class="btn-primario" href="#oggi">Torna a Oggi</a></div>
      </div>`;
  }

  // ---------- Disegno e azioni ----------
  function disegna() {
    const v = vista();
    if (!all) { v.innerHTML = `<div class="corpo-es fine"><h1 class="nome-es">Riposo</h1><p class="nota-tua">Oggi niente allenamento.</p><div class="in-fondo"><a class="btn-secondario" href="#programma">Vedi il programma</a></div></div>`; return; }
    v.innerHTML = S.finito ? schermoTotale() : scheda() + schermoFoglio();
    v.classList.toggle('con-foglio', !!foglio);
    if (foglio) { const f = v.querySelector('.foglio button, .foglio a'); f && f.focus({ preventScroll: true }); }
  }
  function ridisegnaTenendoPosizione() { const y = scrollY; disegna(); scrollTo(0, y); }

  function segnaFatta(i, j) {
    const r = S.es[i].serie[j], e = ex(i);
    r.fatta = true;
    const completo = S.es[i].serie.every((x) => x.fatta);
    if (!S.inizio) S.inizio = Date.now();
    const resta = S.es.some((s) => s.serie.some((x) => !x.fatta));
    S.recupero = null;
    salva(); ridisegnaTenendoPosizione();
    const rec = completo && record(i); // un solo annuncio, quando l'esercizio è finito
    A.avviso(rec ? `${nomeDi(i)} finito · record personale` : completo ? `${nomeDi(i)} finito` : `${nomeDi(i)} · serie ${j + 1}`, rec ? `${kg(rec.kg)} kg × ${rec.reps}: ${kg(rec.kg - e.best)} kg oltre il tuo migliore` : `${kg(r.kg)} kg × ${r.reps}`, () => {
      r.fatta = false; S.recupero = null; salva(); ridisegnaTenendoPosizione();
    });
  }

  function regola(campo, delta) {
    const i = foglio.i, j = foglio.j, r = S.es[i].serie[j];
    if (campo === 'kg') r.kg = Math.max(0, Math.round((r.kg + delta * 2.5) * 100) / 100);
    else r.reps = Math.max(1, r.reps + delta);
    // le serie ancora da fare dopo questa seguono il nuovo peso
    if (campo === 'kg') S.es[i].serie.forEach((s, k) => { if (k > j && !s.fatta) s.kg = r.kg; });
    salva(); ridisegnaTenendoPosizione();
  }

  function video(file) {
    const i = foglio ? foglio.i : 0, e = ex(i), j = prossima(i) === -1 ? e.serie - 1 : prossima(i), r = S.es[i].serie[j];
    S.es[i].video = { serie: j + 1, nome: file ? file.name : '', quando: Date.now() };
    salva();
    const chat = A.leggi('pt-chat') || [];
    chat.push({ da: 'atleta', istante: A.istante(), tipo: 'video', testo: 'Video della serie per la revisione.', contesto: `${nomeDi(i)} · ${all.nome} · Serie ${j + 1} · ${kg(r.kg)} kg × ${r.reps}` });
    A.scrivi('pt-chat', chat);
    foglio = null; ridisegnaTenendoPosizione();
    A.avviso(`Video inviato a ${D.coach.breve}`, `${nomeDi(i)} · serie ${j + 1} · lo rivede entro 24 h`);
  }

  function clic(ev) {
    const t = ev.target.closest('button, a, [data-chiudi]');
    if (!t) return;
    if (t.matches('[data-chiudi]')) { foglio = null; ridisegnaTenendoPosizione(); return; }
    if (t.dataset.j !== undefined) { // riquadro di una serie
      const i = Number(t.dataset.i), j = Number(t.dataset.j);
      if (S.es[i].serie[j].fatta) { foglio = { tipo: 'serie', i, j }; ridisegnaTenendoPosizione(); } else segnaFatta(i, j);
      return;
    }
    if (t.dataset.apri !== undefined) { aperti.add(Number(t.dataset.apri)); ridisegnaTenendoPosizione(); return; }
    if (t.dataset.menu !== undefined) { foglio = { tipo: 'menu', i: Number(t.dataset.menu) }; ridisegnaTenendoPosizione(); return; }
    if (t.dataset.delta) { regola(t.dataset.campo, Number(t.dataset.delta)); return; }
    if (t.dataset.alt !== undefined) { S.es[foglio.i].nome = t.dataset.alt || null; foglio = null; salva(); ridisegnaTenendoPosizione(); return; }
    switch (t.id) {
      case 'salva-serie': {
        const { i, j } = foglio; foglio = null;
        if (!S.es[i].serie[j].fatta) segnaFatta(i, j); else { salva(); ridisegnaTenendoPosizione(); A.avviso('Serie aggiornata', `${kg(S.es[i].serie[j].kg)} kg × ${S.es[i].serie[j].reps}`); }
        break;
      }
      case 'non-fatta': S.es[foglio.i].serie[foglio.j].fatta = false; foglio = null; salva(); ridisegnaTenendoPosizione(); break;
      case 'cambia': { const i = foglio.i, j = prossima(i) === -1 ? ex(i).serie - 1 : prossima(i); foglio = { tipo: 'serie', i, j }; ridisegnaTenendoPosizione(); break; }
      case 'sostituisci': foglio = { tipo: 'sostituisci', i: foglio.i }; ridisegnaTenendoPosizione(); break;
      case 'registra': document.getElementById('file-video').click(); break;
      case 'demo': A.avviso(`Dimostrazione di ${D.coach.breve}`, `Qui parte il video del coach (${ex(foglio.i).durata})`); break;
      case 'tutto': {
        const prima = JSON.stringify(S);
        S.es.forEach((s) => s.serie.forEach((r) => { r.fatta = true; }));
        if (!S.inizio) S.inizio = Date.now() - all.minuti * 60000;
        S.recupero = null; S.finito = true; S.fine = Date.now();
        salva(); disegna(); scrollTo(0, 0);
        A.avviso('Allenamento segnato come previsto', `${contaTotali()} serie`, () => { S = JSON.parse(prima); salva(); disegna(); });
        break;
      }
      case 'concludi': S.recupero = null; S.finito = true; S.fine = Date.now(); salva(); disegna(); scrollTo(0, 0); break;
      case 'riapri': S.finito = false; salva(); disegna(); break;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    vista().addEventListener('click', clic);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && foglio) { foglio = null; ridisegnaTenendoPosizione(); } });
    document.getElementById('file-video').addEventListener('change', (e) => { if (e.target.files[0]) video(e.target.files[0]); e.target.value = ''; });
  });

  A.viste.allenamento = {
    render() {
      foglio = null;
      S = A.leggi(A.chiaveSessione);
      if (all && (!S || !S.es || S.es.length !== ESERCIZI.length)) { S = nuova(); salva(); }
      disegna();
      if (S && S.recupero) { S.recupero = null; salva(); } // sessioni salvate quando c'era il timer
    },
  };
})();
