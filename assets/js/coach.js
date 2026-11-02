// Gestionale del coach. Scena: lunedì sera della settimana in corso, Marco ha appena mandato lo squat.
// Il feedback inviato finisce in localStorage e l'app di Marco (index.html) lo mostra in Home.
(function () {
  const D = window.DATI;
  const V = D.video;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kg = (n) => String(n).replace('.', ',');
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  const adesso = new Date();
  const lunedi = new Date(adesso);
  lunedi.setDate(adesso.getDate() - ((adesso.getDay() + 6) % 7));
  const dataLunedi = `${lunedi.getDate()} ${MESI[lunedi.getMonth()]}`;

  $('#data-oggi').textContent = `Lunedì ${dataLunedi}`;

  // ---------- Stato ----------
  const leggi = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const scrivi = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* senza memoria la prova resta in pagina */ } };
  let inviato = leggi(D.chiaveFeedback);
  let filtro = 'tutto';

  const tipoVoce = (v) => v.testo.startsWith('Video') ? 'video' : v.testo.startsWith('Check-in') ? 'check' : 'altro';

  function conteggi() {
    const video = 4 - (inviato ? 1 : 0);
    $('#conta-video').textContent = video;
    $('#conta-oggi').textContent = video + 7 + 2;
    $('#riassunto').textContent = `${video} video da rivedere · 7 check-in · 2 atleti da contattare`;
  }

  // ---------- Coda ----------
  function coda() {
    // Il check-in mandato dall'app di Marco entra in cima alla coda
    const ci = leggi('pt-checkin-s' + D.atleta.settimana);
    const extra = ci ? [{ id: 'marco-checkin', nome: 'Marco Rossi', foto: D.atleta.foto, chip: ['neutro', 'Check-in'], quando: 'nuovo',
      testo: `Check-in settimana ${D.atleta.settimana} · allenamenti ${ci.allenamenti}/5, energia ${ci.energia}/5, carichi ${ci.carichi.toLowerCase()}${ci.note ? ' · «' + ci.note + '»' : ''}` }] : [];
    const voci = extra.concat(D.coda).filter((v) => !(v.id === V.id && inviato))
      .filter((v) => filtro === 'tutto' || tipoVoce(v) === filtro);
    $('#coda').innerHTML = voci.map((v) => {
      const marco = v.id === V.id;
      const tag = marco ? 'button' : 'div';
      const faccia = v.foto ? `<img class="avatar" src="${v.foto}" alt="">` : `<span class="iniziali" aria-hidden="true">${v.ini}</span>`;
      const chip = marco ? ['info', 'Aperto'] : v.chip;
      return `<li><${tag} class="voce-coda${marco ? ' aperta' : ''}"${marco ? ' aria-current="true"' : ''}>
        ${faccia}
        <span class="testi"><span class="nome">${esc(v.nome)}<span class="chip chip-${chip[0]}">${esc(chip[1])}</span></span><span class="cosa">${esc(v.testo)}</span></span>
        <span class="quando">${marco ? '2 h' : esc(v.quando)}</span>
      </${tag}></li>`;
    }).join('') || '<li class="vuoto"><p>Niente da rivedere in questa categoria.</p></li>';
  }

  // ---------- Revisione ----------
  const PROBLEMI = ['Profondità', 'Ginocchia in dentro', 'Schiena', 'Velocità in salita'];
  const CARICHI = [['Riduci', V.kg - 2.5, 'Riduci a'], ['Mantieni', V.kg, 'Mantieni il carico'], ['Aumenta', V.kg + 2.5, 'Aumenta a']];

  function revisione() {
    const box = $('#revisione');
    if (inviato) {
      box.innerHTML = `
        <div class="vuoto">
          <span class="etichetta">Revisione video · ${esc(D.atleta.nome)} ${esc(D.atleta.cognome)}</span>
          <h3>Feedback inviato</h3>
          <p>${esc(D.atleta.nome)} lo vede in Home al prossimo accesso, sotto «Dal tuo coach».</p>
          <div class="azioni">
            <a class="btn-invia" href="index.html" target="_blank" rel="noopener" style="display:flex;align-items:center;text-decoration:none">Apri l'app di ${esc(D.atleta.nome)}</a>
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
        <div><span class="etichetta">Revisione video · ${esc(D.atleta.nome)} ${esc(D.atleta.cognome)}</span>
        <span class="sotto">${esc(V.allenamento)} · lunedì ${lunedi.getDate()} ${MESI[lunedi.getMonth()].slice(0, 3)} · ${V.ora} · settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span></div>
        <a class="link" href="#atleti">Apri scheda atleta</a>
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
  function controlla() {
    const r = raccogli();
    $('#invia').disabled = !r.ottima && r.problemi.length === 0;
  }

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

  // ---------- Tabella atleti ----------
  function tabella() {
    const nomi = { f: 'fatto', s: 'saltato', r: 'riposo', p: 'previsto' };
    $('#righe-atleti').innerHTML = D.atleti.map((a) => {
      const min = Math.min(...a.punti), max = Math.max(...a.punti);
      const pts = a.punti.map((v, i) => `${(i * 24).toFixed(0)},${(40 - (v - min) / (max - min || 1) * 34).toFixed(1)}`).join(' ');
      return `<div class="tr" role="row">
        <span class="atleta" role="cell">${esc(a.nome)}</span>
        <span class="tenue" role="cell">${esc(a.programma)}</span>
        <span class="tenue" role="cell">${esc(a.settimana)}</span>
        <span class="quadretti" role="cell" aria-label="${[...a.giorni].map((g) => nomi[g]).join(', ')}">${[...a.giorni].map((g) => `<i class="q ${g}"></i>`).join('')}</span>
        <span class="chiave" role="cell">${esc(a.chiave)}</span>
        <span role="cell"><svg width="84" height="24" viewBox="-2 -2 124 48" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#7AA2FF" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg></span>
        <span role="cell"><span class="chip chip-${a.stato[0]}">${esc(a.stato[1])}</span></span>
      </div>`;
    }).join('');
  }

  // ---------- Filtri ----------
  document.querySelectorAll('.filtro').forEach((b) => b.addEventListener('click', () => {
    filtro = b.dataset.f;
    document.querySelectorAll('.filtro').forEach((x) => { x.classList.toggle('attivo', x === b); x.setAttribute('aria-pressed', x === b); });
    coda();
  }));

  function tutto() { conteggi(); coda(); revisione(); }
  window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith('pt-checkin')) coda(); });
  tutto();
  tabella();
})();
