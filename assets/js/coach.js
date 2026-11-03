// Gestionale del coach (rifatto il 2026-11-03: «costruisci tutto il gestionale», «il pt deve poter aggiungere un alunno dandogli una scheda»).
// Pagine: Oggi (coda da rivedere + revisione video), Atleti (+ Nuovo atleta), scheda di un atleta (allenamenti, piano, programma,
// codice per l'app), Programmi (modelli), Messaggi (chat collegata all'app), Libreria esercizi.
// Tutti i dati passano dall'archivio comune (archivio.js): quello che l'atleta fa nell'app compare qui, e viceversa.
(function () {
  const AR = window.ARCHIVIO, { leggi, scrivi } = AR;
  const D = AR.datiDi('marco'); // Marco: la sua revisione video è la scena della demo (anche se l'app nel browser è collegata a un altro atleta)
  const V = D.video;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kg = (n) => String(n).replace('.', ',');
  const kgv = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const FATICA = { facile: 'Facile', giusto: 'Giusto', limite: 'Al limite' };
  const OBIETTIVI = ['Forza e massa', 'Dimagrimento', 'Tonificazione', 'Rientro da infortunio', 'Preparazione atletica'];

  const adesso = new Date();
  const lunedi = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate() - ((adesso.getDay() + 6) % 7));
  const OGGI = (adesso.getDay() + 6) % 7;
  const giornoData = (i) => new Date(lunedi.getFullYear(), lunedi.getMonth(), lunedi.getDate() + i);
  const iso = AR.isoData;
  $('#data-oggi').textContent = `${GIORNI[OGGI]} ${adesso.getDate()} ${MESI[adesso.getMonth()]}`;
  $('#saluto').textContent = `${adesso.getHours() < 13 ? 'Buongiorno' : adesso.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera'}, ${D.coach.breve}`;

  // ---------- Atleti e loro settimana ----------
  const tutti = () => AR.atleti().map((a) => AR.datiDi(a.id));
  const nomeIntero = (DA) => `${DA.atleta.nome} ${DA.atleta.cognome}`;
  const faccia = (DA, cls = 'avatar') => (DA.atleta.foto ? `<img class="${cls}" src="${DA.atleta.foto}" alt="">` : `<span class="iniziali" aria-hidden="true">${esc(DA.atleta.nome[0] + DA.atleta.cognome[0])}</span>`);
  const ritmo = (DA) => (DA.piano.modo === 'fissi' ? `${DA.piano.aSettimana} giorni fissi` : `${DA.piano.aSettimana} a settimana, quando vuole`);
  const sessione = (DA, i) => leggi(DA.k('pt-sessione-' + iso(giornoData(i))));
  const iniziata = (S) => !!(S && S.es && S.es.some((e) => e.serie.some((r) => r.fatta)));
  // Stato dei 7 giorni: f fatto · s non fatto/saltato · r riposo o libero · p previsto
  function giorniDi(DA) {
    const sett = AR.settimanaDi(DA);
    return Array.from({ length: 7 }, (_, i) => {
      const S = sessione(DA, i);
      if (iniziata(S) || (S && S.finito)) return 'f';
      if (DA.piano.modo === 'flessibile') return DA.storia && i === 0 && i < OGGI && !S ? 'f' : 'r';
      const k = DA.settimana[i];
      if (!k) return 'r';
      if (i >= OGGI) return 'p';
      if (DA.storia && i === 0 && DA.settimanaBase[0] === k && !sett.cambi.some((c) => c.da === 0 || c.a === 0)) return 'f'; // lunedì della storia
      return 's';
    });
  }
  function situazione(DA) {
    const g = giorniDi(DA), fatti = g.filter((x) => x === 'f').length, mancati = g.filter((x) => x === 's').length;
    const stato = mancati ? ['avviso', mancati === 1 ? '1 da recuperare' : `${mancati} da recuperare`] : !DA.storia && !fatti ? ['info', 'Appena iniziato'] : ['ok', 'In linea'];
    return { g, fatti, n: DA.piano.aSettimana, stato };
  }
  const quadretti = (g) => `<span class="quadretti" aria-label="${g.map((x, i) => `${GIORNI[i]} ${{ f: 'fatto', s: 'non fatto', r: 'riposo', p: 'previsto' }[x]}`).join(', ')}">${g.map((x) => `<i class="q ${x}"></i>`).join('')}</span>`;

  // ---------- Coda «da rivedere» di tutti gli atleti ----------
  let inviato = leggi(D.chiaveFeedback);
  let filtro = 'tutto';
  function vociCoda() {
    const voci = [];
    if (V && !inviato) voci.push({ id: V.id, tipo: 'video', atleta: 'marco', nome: nomeIntero(D), DA: D, chip: ['info', 'Video'], testo: `Video · ${V.esercizio} ${V.kg} kg × ${V.reps} · ${V.durata}`, t: Date.now() + 1 });
    tutti().forEach((DA) => {
      const ci = leggi(DA.k('pt-checkin-s' + DA.atleta.settimana));
      if (ci) voci.push({ id: DA.id + '-checkin', tipo: 'check', atleta: DA.id, DA, chip: ['neutro', 'Check-in'], t: ci.quando || Date.now(),
        testo: `Check-in settimana ${DA.atleta.settimana} · allenamenti ${ci.allenamenti}/${DA.piano.aSettimana}, energia ${ci.energia}/5, carichi ${String(ci.carichi).toLowerCase()}${ci.note ? ' · «' + ci.note + '»' : ''}` });
      for (let i = 0; i < 7; i++) {
        const S = sessione(DA, i);
        if (!iniziata(S)) continue;
        const k = S.k || DA.settimana[i], note = S.es.filter((e) => e.nota).length, limite = S.es.filter((e) => e.fatica === 'limite').length;
        if (!S.finito && !note) continue;
        const fatte = S.es.reduce((t, e) => t + e.serie.filter((r) => r.fatta).length, 0), tot = S.es.reduce((t, e) => t + e.serie.length, 0);
        voci.push({ id: `${DA.id}-${i}`, tipo: 'allenamenti', atleta: DA.id, DA, chip: note || limite ? ['avviso', note ? 'Nota' : 'Al limite'] : ['ok', 'Allenamento'], t: S.fine || S.inizio || Date.now(),
          testo: `Allenamento · ${DA.allenamenti[k] ? DA.allenamenti[k].nome : ''} ${S.finito ? 'completato' : 'in corso'} · ${fatte}/${tot} serie${note ? ` · ${note === 1 ? '1 nota' : note + ' note'}` : ''}` });
      }
      const sett = AR.settimanaDi(DA);
      sett.saltati.forEach((i) => voci.push({ id: `${DA.id}-saltato-${i}`, tipo: 'allenamenti', atleta: DA.id, DA, chip: ['avviso', 'Saltato'], t: Date.now() - 1,
        testo: `Ha saltato ${DA.allenamenti[sett.giorni[i]].nome} di ${GIORNI[i].toLowerCase()}` }));
      sett.cambi.forEach((x) => voci.push({ id: `${DA.id}-spostato-${x.quando}`, tipo: 'allenamenti', atleta: DA.id, DA, chip: ['neutro', 'Spostato'], t: x.quando,
        testo: `Ha spostato ${DA.allenamenti[x.k].nome} da ${GIORNI[x.da].toLowerCase()} a ${GIORNI[x.a].toLowerCase()}` }));
    });
    return voci.sort((a, b) => b.t - a.t);
  }
  const quandoTesto = (t) => {
    const min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return 'ora'; if (min < 60) return `${min} min`; if (min < 60 * 24) return `${Math.round(min / 60)} h`;
    return GIORNI[(new Date(t).getDay() + 6) % 7].slice(0, 3).toLowerCase();
  };
  function coda() {
    const voci = vociCoda().filter((v) => filtro === 'tutto' || v.tipo === filtro);
    $('#coda').innerHTML = voci.map((v) => {
      const aperta = v.id === (V && V.id);
      const DA = v.DA;
      return `<li><${aperta ? 'div' : 'a'} class="voce-coda${aperta ? ' aperta' : ''}"${aperta ? ' aria-current="true"' : ` href="#atleta/${v.atleta}"`}>
        ${faccia(DA)}
        <span class="testi"><span class="nome">${esc(nomeIntero(DA))}<span class="chip chip-${aperta ? 'info' : v.chip[0]}">${aperta ? 'Aperto' : esc(v.chip[1])}</span></span><span class="cosa">${esc(v.testo)}</span></span>
        <span class="quando">${aperta ? '2 h' : quandoTesto(v.t)}</span>
      </${aperta ? 'div' : 'a'}></li>`;
    }).join('') || `<li class="vuoto"><p>${filtro === 'tutto' ? 'Niente da rivedere: quando un atleta finisce un allenamento, manda un video o un check-in, compare qui.' : 'Niente in questa categoria.'}</p></li>`;
  }
  function conteggi() {
    const voci = vociCoda(), at = tutti(), seguire = at.filter((DA) => situazione(DA).stato[0] === 'avviso').length;
    const video = voci.filter((v) => v.tipo === 'video').length, check = voci.filter((v) => v.tipo === 'check').length, all = voci.filter((v) => v.tipo === 'allenamenti').length;
    $('#riassunto').textContent = [video ? `${video} video da rivedere` : 'Nessun video da rivedere', `${check} check-in`, `${all} aggiornamenti dagli allenamenti`, seguire ? `${seguire} da seguire` : ''].filter(Boolean).join(' · ');
    $('#conta-oggi').textContent = voci.length || '';
    $('#conta-atleti').textContent = at.length;
    const msg = at.reduce((t, DA) => t + daLeggere(DA), 0);
    $('#conta-messaggi').textContent = msg || '';
  }

  // ---------- Revisione video (Marco, la scena della demo) ----------
  const PROBLEMI = ['Profondità', 'Ginocchia in dentro', 'Schiena', 'Velocità in salita'];
  const CARICHI = [['Riduci', V.kg - 2.5, 'Riduci a'], ['Mantieni', V.kg, 'Mantieni il carico'], ['Aumenta', V.kg + 2.5, 'Aumenta a']];
  function revisione() {
    const box = $('#revisione');
    if (inviato) {
      box.innerHTML = `
        <div class="vuoto">
          <span class="etichetta">Revisione video · ${esc(nomeIntero(D))}</span>
          <h3>Feedback inviato</h3>
          <p>${esc(D.atleta.nome)} lo vede in Home al prossimo accesso, sotto «Dal tuo coach».</p>
          <div class="azioni">
            <a class="btn-invia" href="app.html" target="_blank" rel="noopener" style="display:flex;align-items:center;text-decoration:none">Apri l'app di ${esc(D.atleta.nome)}</a>
            <button class="btn-sec" id="riapri">Riapri la revisione</button>
          </div>
        </div>`;
      $('#riapri').addEventListener('click', () => { inviato = null; scrivi(D.chiaveFeedback, null); tutto(); });
      return;
    }
    const bozza = leggi('pt-bozza-marco') || {};
    const problemi = bozza.problemi || [];
    const ottima = bozza.ottima !== undefined ? bozza.ottima : problemi.length === 0;
    const carico = bozza.carico !== undefined ? bozza.carico : 1;
    const testo = bozza.nota !== undefined ? bozza.nota : "Profondità costante fino all'ultima ripetizione. Venerdì resta a 80 kg.";
    const ultima = V.serie.length - 1;
    box.innerHTML = `
      <div class="rev-testa">
        <div><span class="etichetta">Revisione video · ${esc(nomeIntero(D))}</span>
        <span class="sotto">${esc(V.allenamento)} · lunedì ${lunedi.getDate()} ${MESI[lunedi.getMonth()].slice(0, 3)} · ${V.ora} · settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span></div>
        <a class="link" href="#atleta/marco">Apri scheda atleta</a>
      </div>
      <div class="rev-corpo">
        <div class="lettore">
          <img src="${V.foto}" alt="${esc(D.atleta.nome)} nel punto più basso dello squat, ripreso di profilo">
          <button class="play" id="play" aria-label="Riproduci il video"><svg width="14" height="16" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg></button>
          <div class="barra"><span class="traccia"><i id="avanzamento"></i></span><span class="tempi"><span id="tempo">0:00</span><span>${V.durata}</span></span></div>
        </div>
        <div class="dati-serie">
          <h3>${esc(V.esercizio)} ${V.kg} kg × ${V.reps}</h3>
          <div class="serie" role="table" aria-label="Serie registrate">
            <div class="r th" role="row"><span>Serie</span><span>Kg</span><span>Reps</span><span>RPE</span></div>
            ${V.serie.map((s, i) => `<div class="r${i === ultima ? ' ultima' : ''}" role="row"><span>${i + 1}</span><span>${kg(s[0])}</span><span>${s[1]}</span><span>${s[2]}</span></div>`).join('')}
          </div>
          <span class="prima">${esc(V.prima)}</span>
        </div>
      </div>
      <fieldset class="campo-rev">
        <legend class="etichetta">Valutazione</legend>
        <div class="scelte">
          <button class="scelta ottima" data-p="ottima" aria-pressed="${ottima}">Tecnica ottima</button>
          ${PROBLEMI.map((p) => `<button class="scelta" data-p="${esc(p)}" aria-pressed="${problemi.includes(p)}">${esc(p)}</button>`).join('')}
        </div>
      </fieldset>
      <fieldset class="campo-rev">
        <legend class="etichetta">Carico prossima sessione</legend>
        <div class="segmenti" role="radiogroup" aria-label="Carico prossima sessione">
          ${CARICHI.map(([n, v], i) => `<button class="segmento" role="radio" data-i="${i}" aria-checked="${i === carico}">${n} <span>${kg(v)}</span></button>`).join('')}
        </div>
      </fieldset>
      <div class="campo-rev">
        <label class="etichetta" for="messaggio">Messaggio a ${esc(D.atleta.nome)}</label>
        <textarea class="messaggio" id="messaggio" rows="3">${esc(testo)}</textarea>
      </div>
      <div class="azioni">
        <span class="info">${esc(D.atleta.nome)} lo vede in Home al prossimo accesso.</span>
        <button class="btn-sec" id="bozza">Salva bozza</button>
        <button class="btn-invia" id="invia">Invia a ${esc(D.atleta.nome)}</button>
      </div>`;
    // Valutazione: «Tecnica ottima» esclude i punti da correggere, e viceversa
    box.querySelectorAll('.scelta').forEach((b) => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on);
      if (on && b.dataset.p === 'ottima') box.querySelectorAll('.scelta:not(.ottima)').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      if (on && b.dataset.p !== 'ottima') box.querySelector('.scelta.ottima').setAttribute('aria-pressed', 'false');
      controlla();
    }));
    box.querySelectorAll('.segmento').forEach((b) => b.addEventListener('click', () => {
      box.querySelectorAll('.segmento').forEach((x) => x.setAttribute('aria-checked', x === b));
    }));
    $('#messaggio').addEventListener('input', controlla);
    $('#bozza').addEventListener('click', () => { scrivi('pt-bozza-marco', raccogli()); avviso('Bozza salvata', 'La ritrovi qui quando torni.', null); });
    $('#invia').addEventListener('click', invia);
    lettore();
    controlla();
  }
  function raccogli() {
    const box = $('#revisione');
    const problemi = [...box.querySelectorAll('.scelta:not(.ottima)[aria-pressed="true"]')].map((b) => b.dataset.p);
    return {
      ottima: box.querySelector('.scelta.ottima').getAttribute('aria-pressed') === 'true',
      problemi,
      carico: Number(box.querySelector('.segmento[aria-checked="true"]').dataset.i),
      nota: $('#messaggio').value.trim(),
    };
  }
  // Si invia solo con una valutazione scelta
  function controlla() { const r = raccogli(); $('#invia').disabled = !r.ottima && r.problemi.length === 0; }
  function invia() {
    const r = raccogli();
    const [, valore, frase] = CARICHI[r.carico];
    const feedback = {
      tecnica: r.ottima ? 'Tecnica ottima' : 'Da correggere: ' + r.problemi.join(', ').toLowerCase(),
      carico: r.carico === 1 ? frase : `${frase} ${kg(valore)} kg`,
      nota: r.nota || (r.ottima ? 'Bene così.' : 'Guarda i punti segnati prima della prossima serie.'),
      istante: Date.now(),
    };
    inviato = feedback;
    scrivi(D.chiaveFeedback, feedback);
    scrivi('pt-bozza-marco', null);
    tutto();
    avviso(`Inviato a ${D.atleta.nome}`, `${V.esercizio} ${V.kg} kg × ${V.reps} · ${feedback.carico.toLowerCase()}`, () => {
      inviato = null; scrivi(D.chiaveFeedback, null); scrivi('pt-bozza-marco', r); tutto();
    });
  }
  // Lettore dimostrativo: senza un video vero, la barra scorre sulla durata della serie
  function lettore() {
    const durata = 14, play = $('#play'), barra = $('#avanzamento'), tempo = $('#tempo');
    let t = 0, timer = null;
    const icona = (pausa) => pausa
      ? '<svg width="14" height="16" viewBox="0 0 14 16"><rect x="2" y="1" width="3.5" height="14" rx="1" fill="#fff"/><rect x="8.5" y="1" width="3.5" height="14" rx="1" fill="#fff"/></svg>'
      : '<svg width="14" height="16" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg>';
    play.addEventListener('click', () => {
      if (timer) { clearInterval(timer); timer = null; play.innerHTML = icona(false); play.setAttribute('aria-label', 'Riproduci il video'); return; }
      if (t >= durata) t = 0;
      play.innerHTML = icona(true); play.setAttribute('aria-label', 'Metti in pausa');
      timer = setInterval(() => {
        t = Math.min(durata, t + 0.1);
        barra.style.width = (t / durata * 100) + '%';
        tempo.textContent = `0:${String(Math.floor(t)).padStart(2, '0')}`;
        if (t >= durata) { clearInterval(timer); timer = null; play.innerHTML = icona(false); }
      }, 100);
    });
  }

  // ---------- Avviso con Annulla ----------
  let chiudi = null;
  function avviso(titolo, testo, annulla) {
    const a = $('#avviso');
    $('#avviso-titolo').textContent = titolo;
    $('#avviso-testo').textContent = testo;
    $('#annulla').hidden = !annulla;
    $('#annulla').onclick = () => { a.classList.remove('su'); if (annulla) annulla(); };
    a.classList.add('su');
    clearTimeout(chiudi);
    chiudi = setTimeout(() => a.classList.remove('su'), 5000);
  }

  // ---------- Assistente: legge i dati di tutti gli atleti e dice cosa fare, con il pulsante per farlo ----------
  // (richiesta di Francesco: «il gestionale è come il tuo aiutante AI, con tutte le cose e i dati»). Regole chiare, niente magia.
  function consigli() {
    const c = [];
    if (V && !inviato) c.push({ peso: 5, tipo: 'video', testo: `<b>${esc(D.atleta.nome)}</b> aspetta la tua revisione dello squat a ${V.kg} kg × ${V.reps}.`, azione: '<button class="btn-sec" data-vai="revisione">Rivedi il video</button>' });
    tutti().forEach((DX) => {
      const nome = esc(DX.atleta.nome), s = situazione(DX);
      const nuovi = daLeggere(DX);
      if (nuovi) c.push({ peso: 4, tipo: 'messaggio', testo: `<b>${nome}</b> ti ha scritto${nuovi > 1 ? ` (${nuovi} messaggi)` : ''}: ${esc((messaggiDi(DX).slice(-1)[0].testo || 'video').slice(0, 70))}`, azione: `<a class="btn-sec" href="#messaggi/${DX.id}">Rispondi</a>` });
      s.g.forEach((x, i) => { if (x === 's' && !AR.settimanaDi(DX).saltati.includes(i)) c.push({ peso: 3, tipo: 'mancato', testo: `<b>${nome}</b> non ha fatto ${esc(DX.allenamenti[DX.settimana[i]].nome)} di ${GIORNI[i].toLowerCase()}. Due righe aiutano a non perdere il ritmo.`, azione: `<a class="btn-sec" href="#messaggi/${DX.id}">Scrivigli</a>` }); });
      // Carichi di partenza mancanti (atleta appena aggiunto)
      const senza = DX.piano.sequenza.filter((k, i, a) => a.indexOf(k) === i && DX.esercizi[k].some((e) => !e.kg && !/^Trazioni/.test(e.nome)));
      if (!DX.storia && senza.length) c.push({ peso: 4, tipo: 'carichi', testo: `Mancano i carichi di partenza di <b>${nome}</b> (${senza.map((k) => esc(DX.allenamenti[k].nome)).join(', ')}).`, azione: `<a class="btn-sec" href="#atleta/${DX.id}">Imposta i carichi</a>` });
      // Progressione: tutte le serie chiuse al target → proponi il carico dopo
      for (let i = 0; i < 7; i++) {
        const S = sessione(DX, i);
        if (!S || !S.finito) continue;
        const k = S.k || DX.settimana[i];
        S.es.forEach((e, j) => {
          const b = (DX.esercizi[k] || [])[j];
          if (!b || e.nome || e.agg || !b.kg) return;
          const base = e.serie.filter((r) => !r.extra);
          if (base.length && base.every((r) => r.fatta && r.reps >= b.reps && r.kg >= b.kg) && e.fatica !== 'limite') {
            const passo = b.kg >= 60 ? 2.5 : b.kg >= 20 ? 2 : 1, nuovo = Math.round((b.kg + passo) * 100) / 100;
            c.push({ peso: 2, tipo: 'progressione', testo: `<b>${nome}</b> ha chiuso tutte le serie di ${esc(b.nome)} a ${kgv(b.kg)} kg. La prossima volta ${kgv(nuovo)} kg?`, azione: `<button class="btn-sec" data-alza="${DX.id}|${k}|${j}|${nuovo}">Alza a ${kgv(nuovo)} kg</button>` });
          }
          if (e.fatica === 'limite') c.push({ peso: 2, tipo: 'fatica', testo: `<b>${nome}</b> era al limite su ${esc(b.nome)}${e.nota ? ` («${esc(e.nota)}»)` : ''}: meglio tenere il carico.`, azione: `<a class="btn-sec" href="#atleta/${DX.id}">Apri la scheda</a>` });
        });
      }
      const ci = leggi(DX.k('pt-checkin-s' + DX.atleta.settimana));
      if (ci && (ci.energia <= 2 || /pesant/i.test(ci.carichi))) c.push({ peso: 3, tipo: 'checkin', testo: `<b>${nome}</b> nel check-in dice energia ${ci.energia}/5, carichi ${esc(String(ci.carichi).toLowerCase())}: valuta una settimana più leggera.`, azione: `<a class="btn-sec" href="#atleta/${DX.id}">Rivedi il programma</a>` });
    });
    return c.sort((a, b) => b.peso - a.peso);
  }
  function assistente() {
    const c = consigli(), at = tutti();
    const fatti = at.reduce((t, DX) => t + situazione(DX).fatti, 0), previsti = at.reduce((t, DX) => t + DX.piano.aSettimana, 0);
    const ICONE = { video: '▶', messaggio: '✉', mancato: '!', carichi: 'kg', progressione: '▲', fatica: '≈', checkin: '✓' };
    $('#assistente').innerHTML = `
      <div class="assistente-testa">
        <span class="sopra">Il tuo assistente</span>
        <h2 id="t-assistente">${c.length ? `${c.length} ${c.length === 1 ? 'cosa da fare' : 'cose da fare'} oggi` : 'Tutto in ordine'}</h2>
        <p>${at.length} ${at.length === 1 ? 'atleta' : 'atleti'} · ${fatti} allenamenti fatti su ${previsti} previsti questa settimana.${c.length ? ' Le più urgenti per prime.' : ' Nessuno da recuperare, niente in attesa.'}</p>
      </div>
      ${c.length ? `<ul class="consigli">${c.slice(0, 6).map((x) => `<li class="consiglio-g ${x.tipo}"><span class="icona-c" aria-hidden="true">${ICONE[x.tipo]}</span><p>${x.testo}</p>${x.azione}</li>`).join('')}</ul>` : ''}
      ${c.length > 6 ? `<p class="altri-consigli">E altre ${c.length - 6} nella coda qui sotto.</p>` : ''}`;
  }
  function alza(val) {
    const [id, k, j, nuovo] = val.split('|'), DX = AR.datiDi(id), tutte = leggi(DX.k(AR.CHIAVE_PROGRAMMA)) || {};
    const e = DX.esercizi[k][Number(j)], o = e.originale || e;
    tutte[k] = tutte[k] || DX.esercizi[k].map(() => null);
    tutte[k][Number(j)] = { serie: e.serie, reps: e.reps, kg: Number(nuovo), nota: e.nota || '' };
    if (o.kg === Number(nuovo)) tutte[k][Number(j)] = null;
    scrivi(DX.k(AR.CHIAVE_PROGRAMMA), tutte);
    avviso(`${e.nome}: ${kgv(Number(nuovo))} kg`, `${DX.atleta.nome} lo trova nella prossima ${DX.allenamenti[k].nome}`, () => {
      const t = leggi(DX.k(AR.CHIAVE_PROGRAMMA)) || {}; if (t[k]) t[k][Number(j)] = null; scrivi(DX.k(AR.CHIAVE_PROGRAMMA), t); assistente();
    });
    assistente();
  }

  // ---------- Oggi: schede veloci degli atleti ----------
  function schedeAtleti() {
    $('#schede-atleti').innerHTML = tutti().map((DA) => {
      const s = situazione(DA);
      return `<a class="scheda-atleta card" href="#atleta/${DA.id}">
        <span class="sa-testa">${faccia(DA)}<span><b>${esc(nomeIntero(DA))}</b><small>${esc(DA.piano.nome)} · ${ritmo(DA)}</small></span></span>
        <span class="sa-numeri num"><b>${s.fatti}</b>/${s.n} questa settimana</span>
        ${quadretti(s.g)}
        <span class="chip chip-${s.stato[0]}">${esc(s.stato[1])}</span>
      </a>`;
    }).join('') + '<button class="scheda-atleta nuova" data-nuovo><b>+ Nuovo atleta</b><small>Gli dai un programma e un codice per l’app</small></button>';
  }

  // ---------- Atleti ----------
  function paginaAtleti() {
    const at = tutti();
    $('#riassunto-atleti').textContent = `${at.length} ${at.length === 1 ? 'atleta' : 'atleti'} · ognuno con il suo programma e il suo ritmo`;
    $('#righe-atleti').innerHTML = at.map((DA) => {
      const s = situazione(DA);
      return `<a class="tr riga-link" role="row" href="#atleta/${DA.id}">
        <span class="atleta" role="cell">${faccia(DA)}${esc(nomeIntero(DA))}</span>
        <span class="tenue" role="cell">${esc(DA.piano.nome)}<small class="ritmo">${ritmo(DA)}</small></span>
        <span class="tenue" role="cell">${DA.atleta.settimana} di ${DA.atleta.settimane}</span>
        <span role="cell">${quadretti(s.g)}<small class="ritmo">${s.fatti} di ${s.n} fatti</small></span>
        <span class="codice-tab num" role="cell">${esc(AR.atleti().find((a) => a.id === DA.id).codice)}</span>
        <span role="cell"><span class="chip chip-${s.stato[0]}">${esc(s.stato[1])}</span></span>
      </a>`;
    }).join('');
  }

  // ---------- Scheda di un atleta ----------
  let DA = D; // atleta aperto
  function paginaAtleta(id) {
    const a = AR.atleti().find((x) => x.id === id);
    if (!a) { location.hash = '#atleti'; return; }
    DA = AR.datiDi(id);
    const s = situazione(DA);
    $('[data-pagina="atleta"]').innerHTML = `
      <header class="intestazione atleta-testa">
        <div class="titoli">
          <a class="link indietro-g" href="#atleti">← Atleti</a>
          <span class="nome-atleta">${faccia(DA, 'avatar grande')}<h1>${esc(nomeIntero(DA))}</h1></span>
          <span class="chips-atleta"><span class="chip chip-neutro">${esc(a.obiettivo || 'Allenamento')}</span><span class="chip chip-neutro">Settimana ${DA.atleta.settimana} di ${DA.atleta.settimane}</span><span class="chip chip-${s.stato[0]}">${esc(s.stato[1])}</span></span>
        </div>
        <div class="codice-box card">
          <span class="etichetta">Codice per l'app</span>
          <b class="num" id="codice-atleta">${esc(a.codice)}</b>
          <span class="info">${esc(DA.atleta.nome)} lo inserisce al primo avvio dell'app.</span>
          <button class="btn-sec" data-copia="${esc(a.codice)}">Copia messaggio d'invito</button>
        </div>
      </header>
      <div class="atleta-griglia">
        <div class="card marco-allenamenti" id="atleta-allenamenti" aria-live="polite"></div>
        <div class="card marco-programma" id="atleta-programma"></div>
      </div>
      <div class="azioni-atleta">
        <a class="btn-sec" href="#messaggi/${DA.id}">Scrivi a ${esc(DA.atleta.nome)}</a>
        <a class="btn-sec" href="app.html" target="_blank" rel="noopener">Apri l'app</a>
        ${DA.id === 'marco' ? '' : `<button class="link elimina" data-elimina="${DA.id}">Elimina atleta</button>`}
      </div>`;
    allenamentiAtleta(); programmaAtleta();
  }
  function allenamentiAtleta() {
    const box = $('#atleta-allenamenti');
    if (!box) return;
    const lista = [];
    for (let i = 6; i >= 0; i--) { const S = sessione(DA, i); if (iniziata(S)) lista.push({ i, d: giornoData(i), k: S.k || DA.settimana[i], S }); }
    const ci = leggi(DA.k('pt-checkin-s' + DA.atleta.settimana));
    const check = ci ? `<div class="checkin-atleta"><span class="etichetta">Check-in settimana ${DA.atleta.settimana}</span><p>Allenamenti ${ci.allenamenti}/${DA.piano.aSettimana} · energia ${ci.energia}/5 · carichi ${esc(String(ci.carichi).toLowerCase())}${ci.note ? ` · «${esc(ci.note)}»` : ''}</p></div>` : '';
    if (!lista.length) {
      box.innerHTML = `<h3>Allenamenti di questa settimana</h3>${check}<p class="vuoto-marco">Ancora niente: quando ${esc(DA.atleta.nome)} segna le serie nell'app, compaiono qui.</p>`;
      return;
    }
    box.innerHTML = '<h3>Allenamenti di questa settimana</h3>' + check + lista.map(({ i, d, k, S }) => {
      const base = DA.esercizi[k] || [], all = DA.allenamenti[k] || { nome: '' };
      const fatte = S.es.reduce((t, e) => t + e.serie.filter((r) => r.fatta).length, 0), tot = S.es.reduce((t, e) => t + e.serie.length, 0);
      const righe = S.es.map((e, j) => {
        const b = e.agg ? null : base[j], nome = e.nome || (b ? b.nome : e.agg ? e.agg.nome : '');
        const f = e.serie.filter((r) => r.fatta);
        const segni = [];
        if (!b) segni.push(`<span class="chip chip-neutro">Aggiunto da ${esc(DA.atleta.nome)}</span>`);
        if (e.nome && b) segni.push(`<span class="chip chip-neutro">Al posto di ${esc(b.nome)}</span>`);
        const extra = e.serie.filter((r) => r.extra && r.fatta).length;
        if (extra) segni.push(`<span class="chip chip-info">+${extra} serie</span>`);
        if (b && !e.nome && f.some((r) => r.reps >= b.reps && r.kg > b.best)) segni.push('<span class="chip chip-ok">Record</span>');
        if (e.fatica) segni.push(`<span class="chip chip-${e.fatica === 'limite' ? 'avviso' : 'neutro'}">${FATICA[e.fatica]}</span>`);
        return `<li><div class="es-marco"><b>${esc(nome)}</b>${segni.join('')}</div>
          <span class="serie-marco num">${f.length ? f.map((r) => `${kgv(r.kg)}×${r.reps}`).join(' · ') : 'non fatto'}</span>
          ${e.nota ? `<p class="nota-marco">«${esc(e.nota)}»</p>` : ''}</li>`;
      }).join('');
      return `<article class="sessione-marco">
        <div class="testa-sessione"><span><b>${GIORNI[i]} ${d.getDate()}</b> · ${esc(all.nome)}</span>
          <span class="chip chip-${S.finito ? 'ok' : 'info'}">${S.finito ? 'Completato' : 'In corso'}</span><span class="num tenue">${fatte}/${tot} serie</span></div>
        <ul class="lista-marco">${righe}</ul>
      </article>`;
    }).join('');
  }

  // Piano e programma dell'atleta aperto: modello, modo, allenamenti a settimana, poi serie/reps/kg/nota per esercizio
  const voci = () => (DA.piano.modo === 'fissi'
    ? DA.settimana.map((k, i) => k && [k, GIORNI[i].slice(0, 3)]).filter(Boolean)
    : DA.piano.sequenza.map((k, n) => [k, 'N° ' + (n + 1)]));
  let progScelto = null;
  const CAMPI = ['serie', 'reps', 'kg', 'nota'];
  function pannelloPiano() {
    const p = DA.piano;
    return `
      <div class="piano-coach">
        <div class="riga-piano"><span class="etichetta">Modello</span>
          <div class="modelli">${window.MODELLI.map((m) => `<button class="modello" data-modello="${m.id}" aria-pressed="${m.id === p.id}"><b>${esc(m.livello)}</b><span>${esc(m.nome)} · ${m.aSettimana} a sett.</span></button>`).join('')}</div></div>
        <div class="riga-piano"><span class="etichetta">Come si allena</span>
          <div class="segmenti due" role="radiogroup" aria-label="Come si allena">
            <button class="segmento" role="radio" data-modo="fissi" aria-checked="${p.modo === 'fissi'}">Giorni fissi <span>li può spostare</span></button>
            <button class="segmento" role="radio" data-modo="flessibile" aria-checked="${p.modo === 'flessibile'}">Quando vuole <span>l'app propone il prossimo</span></button>
          </div></div>
        <div class="riga-piano"><span class="etichetta">Allenamenti a settimana</span>
          <div class="segmenti numeri" role="radiogroup" aria-label="Allenamenti a settimana">${[2, 3, 4, 5, 6].map((n) => `<button class="segmento" role="radio" data-n="${n}" aria-checked="${n === p.aSettimana}">${n}</button>`).join('')}</div></div>
      </div>`;
  }
  function cambiaPiano(nuovo) {
    scrivi(DA.k(AR.CHIAVE_PIANO), nuovo);
    DA = AR.datiDi(DA.id); progScelto = null;
    programmaAtleta(); allenamentiAtleta();
    avviso('Piano aggiornato', `${DA.piano.nome} · ${ritmo(DA)} · ${DA.atleta.nome} lo vede alla prossima apertura dell'app`, null);
  }
  function programmaAtleta() {
    const box = $('#atleta-programma');
    if (!box) return;
    const tutte = leggi(DA.k(AR.CHIAVE_PROGRAMMA)) || {};
    if (!progScelto || !voci().some((v) => v[0] === progScelto)) progScelto = voci()[0][0];
    const lista = DA.esercizi[progScelto];
    const cambiato = (e) => e.originale && CAMPI.some((c) => (e[c] || '') !== (e.originale[c] || ''));
    const giorni = voci().map(([k, l]) => `<button class="segmento" role="radio" data-prog="${k}" aria-checked="${k === progScelto}">${l} <span>${esc(DA.allenamenti[k].nome)}</span></button>`).join('');
    const senzaPesi = lista.some((e) => !e.kg && !/^Trazioni/.test(e.nome));
    box.innerHTML = `
      <h3>Programma di ${esc(DA.atleta.nome)}</h3>
      ${pannelloPiano()}
      <div class="segmenti giorni-prog" role="radiogroup" aria-label="Allenamento" style="grid-template-columns: repeat(${voci().length}, 1fr)">${giorni}</div>
      ${senzaPesi ? `<p class="avviso-pesi">Metti i chili di partenza: se li lasci a 0, ${esc(DA.atleta.nome)} li scrive alla prima seduta.</p>` : ''}
      <div class="tab-prog" role="table" aria-label="Esercizi di ${esc(DA.allenamenti[progScelto].nome)}">
        <div class="rp th" role="row"><span>Esercizio</span><span>Serie</span><span>Reps</span><span>Kg</span><span>Nota per ${esc(DA.atleta.nome)}</span></div>
        ${lista.map((e, i) => `<div class="rp${cambiato(e) ? ' cambiato' : ''}" role="row">
          <span class="nome-prog-es">${esc(e.nome)}${cambiato(e) ? '<i>modificato</i>' : ''}</span>
          <input class="campo-prog num" data-c="serie" data-i="${i}" value="${e.serie}" inputmode="numeric" aria-label="${esc(e.nome)}: serie">
          <input class="campo-prog num" data-c="reps" data-i="${i}" value="${e.reps}" inputmode="numeric" aria-label="${esc(e.nome)}: ripetizioni">
          <input class="campo-prog num" data-c="kg" data-i="${i}" value="${kgv(e.kg)}" inputmode="decimal" aria-label="${esc(e.nome)}: chili">
          <input class="campo-prog nota" data-c="nota" data-i="${i}" value="${esc(e.nota || '')}" aria-label="${esc(e.nome)}: nota" placeholder="—">
        </div>`).join('')}
      </div>
      <div class="azioni">
        <span class="info">${esc(DA.atleta.nome)} lo trova nella scheda, se non l'ha già iniziata.</span>
        ${tutte[progScelto] ? '<button class="btn-sec" id="prog-ripristina">Torna al programma iniziale</button>' : ''}
        <button class="btn-invia" id="prog-invia">Invia a ${esc(DA.atleta.nome)}</button>
      </div>`;
  }
  function scriviProgramma(tutte) {
    scrivi(DA.k(AR.CHIAVE_PROGRAMMA), Object.keys(tutte).length ? tutte : null);
    AR.applicaProgramma(DA);
    programmaAtleta();
  }
  function salvaProgramma() {
    const tutte = leggi(DA.k(AR.CHIAVE_PROGRAMMA)) || {};
    const nuove = DA.esercizi[progScelto].map((e, i) => {
      const o = e.originale || e, v = (c) => $('#atleta-programma').querySelector(`[data-c="${c}"][data-i="${i}"]`).value.trim();
      const num = (x, min, max, def) => { const n = Number(String(x).replace(',', '.')); return x !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
      const m = { serie: Math.round(num(v('serie'), 1, 10, o.serie)), reps: Math.round(num(v('reps'), 1, 50, o.reps)), kg: Math.round(num(v('kg'), 0, 500, o.kg) * 100) / 100, nota: v('nota') };
      return CAMPI.some((c) => (m[c] || '') !== (o[c] || '')) ? m : null;
    });
    if (nuove.some(Boolean)) tutte[progScelto] = nuove; else delete tutte[progScelto];
    scriviProgramma(tutte);
    avviso('Programma aggiornato', `${DA.allenamenti[progScelto].nome} · ${DA.atleta.nome} lo trova nella prossima scheda`, null);
  }

  // ---------- Programmi (modelli) ----------
  function paginaProgrammi() {
    const at = tutti();
    $('[data-pagina="programmi"]').innerHTML = `
      <header class="intestazione"><div class="titoli"><span class="sopra">Programmi</span><h1>I tuoi modelli</h1><span class="riassunto">Il punto di partenza: per ogni atleta poi cambi modo, allenamenti a settimana, serie e carichi.</span></div></header>
      <div class="griglia-modelli">${window.MODELLI.map((m) => {
        const usano = at.filter((x) => x.piano.id === m.id);
        return `<article class="card modello-card">
          <span class="etichetta">${esc(m.livello)} · ${m.aSettimana} a settimana · ${m.modo === 'fissi' ? 'giorni fissi' : 'quando vuole'}</span>
          <h2>${esc(m.nome)}</h2>
          ${[...new Set(m.sequenza)].map((k) => `<div class="all-modello"><b>${esc(D.allenamenti[k].nome)}</b><span>${D.esercizi[k].map((e) => `${esc(e.nome)} ${e.serie}×${e.reps}`).join(' · ')}</span></div>`).join('')}
          <div class="piede-modello"><span class="info">${usano.length ? 'Lo usa: ' + usano.map((x) => esc(x.atleta.nome)).join(', ') : 'Nessun atleta per ora'}</span>
            <button class="btn-sec" data-nuovo data-preset="${m.id}">Nuovo atleta con questo</button></div>
        </article>`;
      }).join('')}</div>`;
  }

  // ---------- Messaggi ----------
  function messaggiDi(DX) {
    const lista = [];
    if (DX.storia) {
      DX.chat.filter((m) => m.giorno <= OGGI).forEach((m) => { const d = giornoData(m.giorno); const [h, mi] = m.ora.split(':'); d.setHours(+h, +mi); lista.push({ ...m, istante: d.getTime() }); });
      const fb = leggi(DX.chiaveFeedback) || (DX.feedbackPredefinito && OGGI > DX.feedbackPredefinito.giorno ? { ...DX.feedbackPredefinito, istante: giornoData(DX.feedbackPredefinito.giorno).setHours(21, 14) } : null);
      if (fb) lista.push({ da: 'coach', tipo: 'feedback', istante: fb.istante, testo: `${fb.tecnica} · ${fb.carico}. ${fb.nota}` });
    }
    return lista.concat(leggi(DX.k('pt-chat')) || []).sort((a, b) => a.istante - b.istante);
  }
  // Messaggi dell'atleta dopo l'ultima risposta del coach
  function daLeggere(DX) {
    const m = messaggiDi(DX); let n = 0;
    for (let i = m.length - 1; i >= 0 && m[i].da === 'atleta'; i--) n++;
    return n;
  }
  let conChi = 'marco';
  function paginaMessaggi(id) {
    if (id && AR.atleti().some((a) => a.id === id)) conChi = id;
    const at = tutti(), DX = at.find((x) => x.id === conChi) || at[0];
    const msg = messaggiDi(DX);
    let giorno = '';
    const bolle = msg.map((m) => {
      const d = new Date(m.istante), g = `${GIORNI[(d.getDay() + 6) % 7]} ${d.getDate()} ${MESI[d.getMonth()]}`;
      const sep = g !== giorno ? `<li class="sep-g">${g}</li>` : ''; giorno = g;
      const testo = m.tipo === 'carico' ? `Carico aggiornato · ${m.esercizio}: ${m.da_kg} → ${m.a_kg} kg. ${m.testo}` : m.tipo === 'video' ? `▶ Video della serie. ${m.testo || ''}` : m.testo;
      return `${sep}<li class="msg-g ${m.da}"><div class="bolla-g">${m.contesto ? `<span class="contesto-g">${esc(m.contesto)}</span>` : ''}<p>${esc(testo)}</p></div><time class="num">${d.toTimeString().slice(0, 5)}</time></li>`;
    }).join('');
    $('[data-pagina="messaggi"]').innerHTML = `
      <header class="intestazione"><div class="titoli"><span class="sopra">Messaggi</span><h1>Messaggi</h1><span class="riassunto">Ogni messaggio dall'app arriva con esercizio e serie di cui parla.</span></div></header>
      <div class="chat-g card">
        <ul class="chi-g">${at.map((x) => { const u = messaggiDi(x).slice(-1)[0], n = daLeggere(x); return `<li><a href="#messaggi/${x.id}" class="${x.id === DX.id ? 'attivo' : ''}">${faccia(x)}<span><b>${esc(nomeIntero(x))}</b><small>${u ? esc((u.da === 'coach' ? 'Tu: ' : '') + (u.testo || 'Video')).slice(0, 48) : 'Nessun messaggio'}</small></span>${n ? `<span class="conta">${n}</span>` : ''}</a></li>`; }).join('')}</ul>
        <div class="conversazione">
          <div class="conv-testa">${faccia(DX)}<b>${esc(nomeIntero(DX))}</b><a class="link" href="#atleta/${DX.id}">Scheda atleta</a></div>
          <ol class="bolle-g" id="bolle-g">${bolle || '<li class="vuoto-marco">Ancora nessun messaggio. Scrivi tu il primo.</li>'}</ol>
          <form class="scrivi-g" id="scrivi-g"><label class="vh" for="testo-g">Messaggio a ${esc(DX.atleta.nome)}</label><textarea id="testo-g" rows="2" placeholder="Scrivi a ${esc(DX.atleta.nome)}…"></textarea><button class="btn-invia" type="submit">Invia</button></form>
        </div>
      </div>`;
    const b = $('#bolle-g'); b.scrollTop = b.scrollHeight;
  }

  // ---------- Libreria esercizi ----------
  let cercaLib = '';
  function paginaLibreria() {
    const dove = {};
    Object.entries(D.esercizi).forEach(([k, l]) => l.forEach((e) => { (dove[e.nome] = dove[e.nome] || []).push(D.allenamenti[k].nome); }));
    const demo = {};
    Object.values(D.esercizi).flat().forEach((e) => { if (e.demo) demo[e.nome] = e.demo; });
    const nomi = Object.keys(window.GUIDA || {}).sort((a, b) => a.localeCompare(b, 'it'));
    $('[data-pagina="libreria"]').innerHTML = `
      <header class="intestazione"><div class="titoli"><span class="sopra">Libreria esercizi</span><h1>Esercizi</h1><span class="riassunto">${nomi.length} esercizi con la spiegazione che l'atleta vede toccando «Come si fa».</span></div>
        <label class="cerca"><span class="vh">Cerca esercizio</span><input type="search" id="cerca-lib" placeholder="Cerca esercizio o muscolo" value="${esc(cercaLib)}"></label></header>
      <div class="griglia-lib">${nomi.map((n) => {
        const g = window.GUIDA[n];
        return `<details class="card esercizio-lib" data-testo="${esc((n + ' ' + g.muscoli).toLowerCase())}">
          <summary>${demo[n] ? `<img src="assets/foto/${demo[n]}.webp" alt="">` : '<span class="senza-video">Video da registrare</span>'}<span class="nome-lib"><b>${esc(n)}</b><small>${esc(g.muscoli)}</small>${dove[n] ? `<small class="dove">Nei programmi: ${esc([...new Set(dove[n])].join(', '))}</small>` : ''}</span></summary>
          <ol>${g.passi.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
          <ul class="evita-lib">${g.errori.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        </details>`;
      }).join('')}</div>`;
    filtraLibreria();
  }
  function filtraLibreria() {
    const q = cercaLib.trim().toLowerCase();
    document.querySelectorAll('.esercizio-lib').forEach((d) => { d.hidden = !!q && !d.dataset.testo.includes(q); });
  }

  // ---------- Nuovo atleta ----------
  const lunediIso = iso(lunedi);
  let preset = null;
  function apriNuovo(modello) {
    preset = modello || 'intero-3';
    const m = window.MODELLI.find((x) => x.id === preset);
    $('#nuovo-atleta').innerHTML = `
      <form class="modulo-nuovo" id="modulo-nuovo" novalidate>
        <div class="testa-finestra"><h2 id="t-nuovo">Nuovo atleta</h2><button type="button" class="icona-44" data-chiudi-nuovo aria-label="Chiudi">✕</button></div>
        <div class="due-campi">
          <label>Nome<input id="n-nome" required autocomplete="off"></label>
          <label>Cognome<input id="n-cognome" required autocomplete="off"></label>
        </div>
        <label>Obiettivo<select id="n-obiettivo">${OBIETTIVI.map((o) => `<option>${o}</option>`).join('')}</select></label>
        <fieldset><legend>Programma di partenza</legend>
          <div class="modelli">${window.MODELLI.map((x) => `<button type="button" class="modello" data-n-modello="${x.id}" aria-pressed="${x.id === preset}"><b>${esc(x.livello)}</b><span>${esc(x.nome)} · ${x.aSettimana} a sett.</span></button>`).join('')}</div></fieldset>
        <fieldset><legend>Come si allena</legend>
          <div class="segmenti due"><button type="button" class="segmento" role="radio" data-n-modo="fissi" aria-checked="${m.modo === 'fissi'}">Giorni fissi <span>li può spostare</span></button><button type="button" class="segmento" role="radio" data-n-modo="flessibile" aria-checked="${m.modo === 'flessibile'}">Quando vuole <span>l'app propone il prossimo</span></button></div></fieldset>
        <fieldset><legend>Allenamenti a settimana</legend>
          <div class="segmenti numeri">${[2, 3, 4, 5, 6].map((n) => `<button type="button" class="segmento" role="radio" data-n-n="${n}" aria-checked="${n === m.aSettimana}">${n}</button>`).join('')}</div></fieldset>
        <div class="due-campi">
          <label>Inizio<input type="date" id="n-inizio" value="${lunediIso}"></label>
          <label>Durata<select id="n-durata"><option value="8">8 settimane</option><option value="12" selected>12 settimane</option><option value="16">16 settimane</option></select></label>
        </div>
        <p class="errore-nuovo" id="errore-nuovo" hidden>Scrivi nome e cognome.</p>
        <div class="azioni"><span class="info">Dopo gli dai i carichi di partenza e gli mandi il codice per l'app.</span><button type="button" class="btn-sec" data-chiudi-nuovo>Annulla</button><button class="btn-invia" type="submit">Crea atleta</button></div>
      </form>`;
    $('#velo-nuovo').hidden = false; $('#nuovo-atleta').hidden = false;
    setTimeout(() => $('#n-nome').focus(), 30);
  }
  function chiudiNuovo() { $('#velo-nuovo').hidden = true; $('#nuovo-atleta').hidden = true; }
  const scelto = (attr) => $(`#nuovo-atleta [${attr}][aria-checked="true"], #nuovo-atleta [${attr}][aria-pressed="true"]`);
  function creaAtleta() {
    const nome = $('#n-nome').value.trim(), cognome = $('#n-cognome').value.trim();
    if (!nome || !cognome) { $('#errore-nuovo').hidden = false; (nome ? $('#n-cognome') : $('#n-nome')).focus(); return; }
    const esistenti = AR.atleti();
    const base = (nome + '-' + cognome).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'atleta';
    let id = base, n = 2; while (esistenti.some((a) => a.id === id)) id = `${base}-${n++}`;
    let codice; do { codice = 'LUCA' + String(10 + Math.floor(Math.random() * 90)); } while (esistenti.some((a) => a.codice === codice));
    const a = {
      id, codice, nome, cognome, obiettivo: $('#n-obiettivo').value,
      modello: scelto('data-n-modello').dataset.nModello, modo: scelto('data-n-modo').dataset.nModo, aSettimana: Number(scelto('data-n-n').dataset.nN),
      inizio: $('#n-inizio').value || lunediIso, settimane: Number($('#n-durata').value), creato: Date.now(),
    };
    scrivi(AR.CHIAVE_ATLETI, (leggi(AR.CHIAVE_ATLETI) || []).concat(a));
    $('#nuovo-atleta').innerHTML = `
      <div class="modulo-nuovo fatto-nuovo">
        <div class="testa-finestra"><h2 id="t-nuovo">${esc(nome)} è nei tuoi atleti</h2><button type="button" class="icona-44" data-chiudi-nuovo aria-label="Chiudi">✕</button></div>
        <p>Mandagli questo codice: lo inserisce al primo avvio dell'app e trova il suo programma.</p>
        <b class="codice-grande num" id="codice-nuovo">${codice}</b>
        <div class="azioni"><button type="button" class="btn-sec" data-copia="${codice}" data-nome="${esc(nome)}">Copia messaggio d'invito</button><a class="btn-invia" href="#atleta/${id}" data-chiudi-nuovo>Imposta i carichi</a></div>
      </div>`;
    aggiorna();
  }

  // ---------- Pagine e navigazione ----------
  let pagina = 'oggi';
  function mostraPagina() {
    const [nome, param] = (location.hash.slice(1) || 'oggi').split('/');
    pagina = ['oggi', 'atleti', 'atleta', 'programmi', 'messaggi', 'libreria'].includes(nome) ? nome : 'oggi';
    document.querySelectorAll('.pagina').forEach((p) => { p.hidden = p.dataset.pagina !== pagina; });
    document.querySelectorAll('.navigazione a').forEach((a) => {
      const on = a.dataset.pag === pagina || (pagina === 'atleta' && a.dataset.pag === 'atleti');
      a.classList.toggle('attiva', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    if (pagina === 'oggi') { assistente(); coda(); revisione(); schedeAtleti(); }
    if (pagina === 'atleti') paginaAtleti();
    if (pagina === 'atleta') paginaAtleta(param || 'marco');
    if (pagina === 'programmi') paginaProgrammi();
    if (pagina === 'messaggi') paginaMessaggi(param);
    if (pagina === 'libreria') paginaLibreria();
    conteggi();
    window.scrollTo(0, 0);
  }
  // Ridisegna quando cambia qualcosa (dall'app in un'altra scheda), senza disturbare chi sta scrivendo
  function aggiorna() {
    const scrive = document.activeElement && document.activeElement.matches('input, textarea, select');
    conteggi();
    if (scrive) return;
    if (pagina === 'oggi') { assistente(); coda(); schedeAtleti(); }
    if (pagina === 'atleti') paginaAtleti();
    if (pagina === 'atleta') { DA = AR.datiDi(DA.id); allenamentiAtleta(); }
    if (pagina === 'messaggi') paginaMessaggi();
  }
  function tutto() { conteggi(); assistente(); coda(); revisione(); schedeAtleti(); }

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button, a');
    if (!b) return;
    const d = b.dataset;
    if (d.nuovo !== undefined) { ev.preventDefault(); apriNuovo(d.preset); return; }
    if (d.vai === 'revisione') { $('#revisione').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (d.alza) { alza(d.alza); return; }
    if (d.chiudiNuovo !== undefined) { chiudiNuovo(); if (b.tagName === 'BUTTON') ev.preventDefault(); return; }
    if (d.nModello) {
      const m = window.MODELLI.find((x) => x.id === d.nModello);
      document.querySelectorAll('[data-n-modello]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      document.querySelectorAll('[data-n-modo]').forEach((x) => x.setAttribute('aria-checked', x.dataset.nModo === m.modo));
      document.querySelectorAll('[data-n-n]').forEach((x) => x.setAttribute('aria-checked', Number(x.dataset.nN) === m.aSettimana));
      return;
    }
    if (d.nModo || d.nN) { const attr = d.nModo ? 'data-n-modo' : 'data-n-n'; document.querySelectorAll(`[${attr}]`).forEach((x) => x.setAttribute('aria-checked', x === b)); return; }
    if (d.copia) {
      const a = AR.atleti().find((x) => x.codice === d.copia);
      const testo = `Ciao ${a.nome}! Ti ho preparato il programma su Carico. Scarica l'app, apri e inserisci il codice ${a.codice}. A presto, ${D.coach.breve}`;
      (navigator.clipboard ? navigator.clipboard.writeText(testo) : Promise.reject()).then(() => avviso('Messaggio copiato', 'Incollalo su WhatsApp o dove preferisci', null), () => avviso('Codice: ' + a.codice, 'Copialo e mandalo all’atleta', null));
      return;
    }
    if (d.elimina) {
      const a = AR.atleti().find((x) => x.id === d.elimina);
      if (!confirm(`Eliminare ${a.nome} ${a.cognome}? Si cancellano il suo programma, i suoi allenamenti e i messaggi. Non si può annullare.`)) return;
      scrivi(AR.CHIAVE_ATLETI, (leggi(AR.CHIAVE_ATLETI) || []).filter((x) => x.id !== a.id));
      AR.chiavi(`pt-${a.id}-`).forEach((k) => scrivi(k, null));
      const c = leggi('pt-collegato'); if (c && c.atleta === a.id) scrivi('pt-collegato', null);
      location.hash = '#atleti'; avviso('Atleta eliminato', `${a.nome} ${a.cognome}`, null);
      return;
    }
    // Scheda atleta: piano e programma
    if (b.closest('#atleta-programma')) {
      if (d.prog) { progScelto = d.prog; programmaAtleta(); return; }
      const ora = leggi(DA.k(AR.CHIAVE_PIANO)) || {};
      if (d.modello) { if (d.modello !== DA.piano.id) cambiaPiano({ modello: d.modello }); return; }
      if (d.modo) { if (d.modo !== DA.piano.modo) cambiaPiano({ ...ora, modello: DA.piano.id, modo: d.modo }); return; }
      if (d.n) { if (Number(d.n) !== DA.piano.aSettimana) cambiaPiano({ ...ora, modello: DA.piano.id, aSettimana: Number(d.n) }); return; }
      if (b.id === 'prog-invia') { salvaProgramma(); return; }
      if (b.id === 'prog-ripristina') {
        const tutte = leggi(DA.k(AR.CHIAVE_PROGRAMMA)) || {};
        delete tutte[progScelto];
        scriviProgramma(tutte);
        avviso('Programma iniziale ripristinato', DA.allenamenti[progScelto].nome, null);
      }
    }
  });
  document.addEventListener('submit', (ev) => {
    if (ev.target.id === 'modulo-nuovo') { ev.preventDefault(); creaAtleta(); }
    if (ev.target.id === 'scrivi-g') {
      ev.preventDefault();
      const t = $('#testo-g').value.trim();
      if (!t) return;
      const DX = AR.datiDi(conChi), lista = leggi(DX.k('pt-chat')) || [];
      lista.push({ da: 'coach', istante: Date.now(), testo: t });
      scrivi(DX.k('pt-chat'), lista);
      paginaMessaggi(); conteggi(); $('#testo-g').focus();
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#nuovo-atleta').hidden) chiudiNuovo();
    if (ev.key === 'Enter' && !ev.shiftKey && ev.target.id === 'testo-g') { ev.preventDefault(); ev.target.form.requestSubmit(); }
  });
  document.addEventListener('input', (ev) => { if (ev.target.id === 'cerca-lib') { cercaLib = ev.target.value; filtraLibreria(); } });
  $('#velo-nuovo').addEventListener('click', chiudiNuovo);
  document.querySelectorAll('.filtro').forEach((b) => b.addEventListener('click', () => {
    filtro = b.dataset.f;
    document.querySelectorAll('.filtro').forEach((x) => { x.classList.toggle('attivo', x === b); x.setAttribute('aria-pressed', x === b); });
    coda();
  }));
  window.addEventListener('storage', (e) => { if (!e.key || e.key.startsWith('pt-')) aggiorna(); }); // l'app (in un'altra scheda) ha cambiato qualcosa
  window.addEventListener('hashchange', () => { if (entrato()) mostraPagina(); });

  // ---------- Accesso ----------
  // Demo: un account di prova controllato nel browser, la sessione dura finché è aperta la scheda (sessionStorage).
  // Con il database online (vedi archivio.js) diventa un accesso vero con utenti e password protetti.
  const SESSIONE = 'pt-coach-sessione', PROVA = { email: 'luca@carico.app', password: 'carico2026' };
  const entrato = () => { try { return sessionStorage.getItem(SESSIONE) === '1'; } catch (e) { return false; } };
  function apriGestionale() { $('#accesso').hidden = true; document.querySelector('.gestionale').hidden = false; mostraPagina(); }
  $('#form-accesso').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = $('#a-email').value.trim().toLowerCase() === PROVA.email && $('#a-password').value === PROVA.password;
    $('#errore-accesso').hidden = ok;
    if (!ok) { $('#a-password').focus(); return; }
    try { sessionStorage.setItem(SESSIONE, '1'); } catch (e) { /* senza memoria si entra lo stesso, per questa pagina */ }
    apriGestionale();
  });
  $('#usa-prova').addEventListener('click', () => { $('#a-email').value = PROVA.email; $('#a-password').value = PROVA.password; $('#errore-accesso').hidden = true; });
  $('#esci').addEventListener('click', () => { try { sessionStorage.removeItem(SESSIONE); } catch (e) { /* niente */ } location.hash = ''; location.reload(); });
  if (entrato()) apriGestionale(); else { $('#accesso').hidden = false; setTimeout(() => $('#a-email').focus(), 30); }
})();
