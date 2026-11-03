// Schermata «Oggi». Lo stato dipende dal giorno della settimana:
// allenamento (lun, mar, gio, ven), check-in (domenica, con allenamento), riposo (mer, sab).
(function () {
  const A = window.APP, D = A.D, { esc, kg, oggi, data, GIORNI, BREVI, LETTERE, MESI } = A;
  const chiave = D.settimana[oggi];
  const all = A.allenamentoDi(oggi);

  function hero(sessione) {
    const testata = `
      <div class="testata">
        <a class="profilo" href="#profilo" aria-label="Il tuo profilo"><img class="avatar" src="${D.atleta.foto}" alt=""></a>
        <div class="saluto"><b>Ciao ${esc(D.atleta.nome)}</b><span>Settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span></div>
      </div>`;

    if (all) {
      const finito = sessione && sessione.finito;
      const azione = finito
        ? `<a class="btn-secondario" href="#allenamento">Completato · rivedi le serie</a>`
        : `<a class="btn-primario btn-scheda" href="#allenamento">
            ${sessione ? 'Riprendi la scheda' : 'Apri scheda'}
            <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M1 7h19M14 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>`;
      return `
      <section class="hero ${all.breve.toLowerCase()}" aria-label="Allenamento di oggi">
        <div class="hero-foto"><img src="assets/foto/${all.foto}.webp" alt="" fetchpriority="high"></div>
        ${testata}
        <div class="hero-testo">
          <span class="sopratitolo">${finito ? 'Oggi · fatto' : 'Oggi'}${A.piano.flessibile ? ` · allenamento ${A.piano.conto().numero} di ${D.piano.aSettimana}` : ''}</span>
          <h1 class="titolone">${esc(all.nome)}</h1>
          <span class="muscoli">${esc(all.muscoli)}</span>
          <span class="durata-all">${all.esercizi} esercizi · ~${all.minuti} min</span>
          ${azione}
          ${finito ? '' : A.piano.flessibile ? '<span class="nota-flessibile">Oggi non riesci? Nessun problema: domani te lo ripropongo.</span>' : '<button class="link-sposta" data-sposta>Oggi non riesci? Cambia giorno</button>'}
        </div>
      </section>`;
    }

    // Riposo: anteprima del prossimo allenamento
    let dopo = 1;
    while (dopo < 7 && !D.settimana[(oggi + dopo) % 7]) dopo++;
    if (dopo === 7) dopo = 0;
    const prossimo = dopo ? D.allenamenti[D.settimana[(oggi + dopo) % 7]] : null;
    const quando = dopo === 1 ? 'Domani' : GIORNI[(oggi + dopo) % 7];
    // Modo «quando vuoi»: se è riposo vuol dire che gli allenamenti della settimana sono fatti
    const completa = A.piano.flessibile;
    return `
      <section class="hero riposo" aria-label="Giorno di riposo">
        <div class="hero-foto"><img src="assets/foto/hero-riposo.webp" alt="" fetchpriority="high"></div>
        ${testata}
        <div class="hero-testo">
          <span class="sopratitolo">${completa ? `Settimana completata · ${D.piano.aSettimana} di ${D.piano.aSettimana}` : `Oggi · ${GIORNI[oggi]} ${data(oggi).getDate()}`}</span>
          <h1 class="titolone">${completa ? 'Fatto' : 'Riposo'}</h1>
          <p class="consiglio">${completa ? `Hai fatto i tuoi ${D.piano.aSettimana} allenamenti. Lunedì ripartiamo. ` : ''}${esc(D.riposo)}</p>
          ${prossimo ? `<a class="domani" href="#programma/${D.settimana[(oggi + dopo) % 7]}">
            <span class="cosa">
              <span class="quando">${quando} · ${BREVI[(oggi + dopo) % 7]} ${data(oggi + dopo).getDate()}</span>
              <span class="riga"><span class="nome">${esc(prossimo.nome)}</span><span class="info num">${prossimo.esercizi} esercizi · ~${prossimo.minuti} min</span></span>
            </span>
            <span class="vai">Anteprima</span>
            <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="#DDF77A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>` : ''}
        </div>
      </section>`;
  }

  function settimana(sessione) {
    const inizio = data(0), fine = data(6);
    const periodo = inizio.getMonth() === fine.getMonth()
      ? `${inizio.getDate()}–${fine.getDate()} ${MESI[fine.getMonth()]}`
      : `${inizio.getDate()} ${MESI[inizio.getMonth()]} – ${fine.getDate()} ${MESI[fine.getMonth()]}`;
    const spunta = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#DDF77A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const X = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const NOMI = { fatto: 'fatto', oggi: 'oggi', previsto: 'previsto', riposo: 'riposo', nonfatto: 'non fatto', saltato: 'saltato' };
    const giorni = D.settimana.map((k, i) => {
      const st = A.piano.stato(i), fatto = st === 'fatto';
      const cls = ['giorno'];
      if (!k) cls.push('libero');
      if (i === oggi && !fatto) cls.push('oggi');
      if (i === oggi) cls.push('corrente');
      if (fatto) cls.push('fatto');
      if (st === 'nonfatto' || st === 'saltato') cls.push(st);
      const tipo = k ? D.allenamenti[k].breve : A.piano.flessibile ? '—' : 'Riposo'; // «quando vuoi»: i giorni vuoti sono solo liberi
      const stato = NOMI[st];
      const dentro = `<span class="lettera" aria-hidden="true">${LETTERE[i]}</span>
        <span class="cerchio" aria-hidden="true">${fatto ? spunta : st === 'nonfatto' || st === 'saltato' ? X : data(i).getDate()}</span>
        <span class="tipo" aria-hidden="true">${tipo}</span>`;
      const etichetta = `${GIORNI[i]} ${data(i).getDate()}, ${tipo}, ${stato}`;
      return `<li class="${cls.join(' ')}">${k
        ? `<a href="#programma/${k}" aria-label="${etichetta}">${dentro}</a>`
        : `<span aria-label="${etichetta}">${dentro}</span>`}</li>`;
    }).join('');
    return `
      <section class="blocco settimana" aria-labelledby="t-sett">
        <div class="intesta etichetta"><h2 id="t-sett" class="etichetta" style="margin:0">Questa settimana</h2><span class="destra"><span class="num">${A.piano.flessibile ? `<b class="conto-sett">${A.piano.conto().fatti} di ${D.piano.aSettimana}</b>` : periodo}</span><button class="link-calendario" data-calendario aria-label="Apri il calendario del programma"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Calendario</button></span></div>
        <ul class="giorni">${giorni}</ul>
      </section>`;
  }

  // ---------- Allenamento non fatto: «Fallo oggi» o «Lo salto» ----------
  function recupero() {
    const i = A.piano.daRecuperare();
    if (i < 0) return '';
    const k = D.settimana[i], dove = A.piano.dove();
    let testo = '';
    if (dove && dove.giorno === oggi) testo = dove.sposta >= 0 ? `Lo fai oggi e ${esc(D.allenamenti[D.settimana[oggi]].nome)} passa a ${GIORNI[dove.sposta]}.` : 'Oggi sei libero: puoi farlo adesso.';
    else if (dove) testo = `Oggi hai già iniziato: lo sposti a ${GIORNI[dove.giorno]}.`;
    else testo = 'Questa settimana non ci sono più giorni liberi.';
    return `
      <section class="blocco recupero-blocco" aria-labelledby="t-rec">
        <div class="recupero card">
          <span class="sopra">Non fatto · ${GIORNI[i]} ${data(i).getDate()}</span>
          <h2 id="t-rec">${esc(D.allenamenti[k].nome)}</h2>
          <p>${testo} ${esc(D.coach.breve)} vede cosa scegli.</p>
          <div class="due">
            ${dove ? `<button class="btn-primario" data-recupera="${i}">${dove.giorno === oggi ? 'Fallo oggi' : `Spostalo a ${GIORNI[dove.giorno]}`}</button>` : ''}
            <button class="btn-secondario" data-salta="${i}">Lo salto</button>
          </div>
        </div>
      </section>`;
  }

  let foglio = null, mese = 0, giornoCal = '';
  function schermoFoglio() {
    if (!foglio) return '';
    let dentro;
    if (foglio === 'calendario') {
      dentro = A.calendario.html(mese, giornoCal) + '<button class="chiudi-foglio" data-chiudi>Chiudi</button>';
    } else { // cambia giorno all'allenamento di oggi
      const voci = D.settimana.map((k, j) => j > oggi ? `<button class="voce-giorno" data-sposta-a="${j}"><span class="g"><b>${BREVI[j]}</b><span class="num">${data(j).getDate()}</span></span><span class="testi"><b>${GIORNI[j][0].toUpperCase() + GIORNI[j].slice(1)}</b><span>${k ? `C'è ${esc(D.allenamenti[k].nome)}: si scambiano` : 'Libero'}</span></span></button>` : '').join('');
      dentro = `
        <div class="testa-foglio"><span class="titolo">Cambia giorno</span><span>${esc(all.nome)} si sposta nel giorno che scegli. ${esc(D.coach.breve)} lo vede nel gestionale.</span></div>
        ${voci || '<p class="nota-tua">Oggi è l’ultimo giorno della settimana: non ci sono altri giorni.</p>'}
        <button class="chiudi-foglio" data-chiudi>Annulla</button>`;
    }
    return `<div class="velo-foglio" data-chiudi></div><div class="foglio" role="dialog" aria-modal="true" aria-label="${foglio === 'calendario' ? 'Calendario' : 'Cambia giorno'}"><span class="maniglia" aria-hidden="true"></span>${dentro}</div>`;
  }
  function ridisegna() { const y = scrollY; A.viste.oggi.render(); scrollTo(0, y); }
  window.addEventListener('hashchange', () => { foglio = null; }); // un foglio non resta aperto tornando su Oggi
  document.addEventListener('DOMContentLoaded', () => {
    const v = document.querySelector('[data-vista="oggi"]');
    v.addEventListener('click', (ev) => {
      const t = ev.target.closest('button, [data-chiudi]');
      if (!t) return;
      const d = t.dataset;
      if (t.matches('[data-chiudi]')) { foglio = null; ridisegna(); return; }
      if (d.calendario !== undefined) { foglio = 'calendario'; mese = 0; giornoCal = A.iso(data(oggi)); ridisegna(); return; }
      if (d.calMese !== undefined) { mese = Number(d.calMese); giornoCal = ''; ridisegna(); return; }
      if (d.calGiorno) { giornoCal = d.calGiorno; ridisegna(); return; }
      if (d.sposta !== undefined) { foglio = 'sposta'; ridisegna(); return; }
      if (d.spostaA !== undefined) { A.piano.sposta(oggi, Number(d.spostaA)); return; }
      if (d.recupera !== undefined) { A.piano.recupera(Number(d.recupera)); return; }
      if (d.salta !== undefined) {
        const i = Number(d.salta);
        A.piano.salta(i); ridisegna();
        A.avviso(`${D.allenamenti[D.settimana[i]].nome} saltato`, `${D.coach.breve} lo vede nel gestionale`, () => { A.piano.annullaSalto(i); ridisegna(); });
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && foglio && !v.hidden) { foglio = null; ridisegna(); } });
  });

  // ---------- Dal tuo coach: una sola cosa, la più importante ----------
  function quandoFeedback(f) {
    if (f.istante) {
      const t = new Date(f.istante);
      const ora = t.toTimeString().slice(0, 5);
      return t.toDateString() === A.adesso.toDateString() ? `oggi ${ora}` : `${BREVI[(t.getDay() + 6) % 7]} ${ora}`;
    }
    return oggi - f.giorno === 1 ? `ieri ${f.ora}` : `${BREVI[f.giorno]} ${f.ora}`;
  }

  function cosaDalCoach() {
    if (oggi === 6) return { tipo: A.leggi(A.chiaveCheckin) ? 'checkin-fatto' : 'checkin' };
    const nuovo = A.leggi(D.chiaveFeedback);
    if (nuovo) return { tipo: 'feedback', f: nuovo };
    if (chiave && D.carichi[chiave]) return { tipo: 'carico', c: D.carichi[chiave] };
    if (oggi > D.feedbackPredefinito.giorno) return { tipo: 'feedback', f: D.feedbackPredefinito };
    return null;
  }

  function coach(cosa) {
    if (!cosa) return '';
    const chi = (ora) => `<div class="chi"><img class="avatar" src="${D.coach.foto}" alt=""><b>${esc(D.coach.nome)}</b><time>${esc(ora)}</time></div>`;
    let corpo;
    if (cosa.tipo === 'checkin') {
      corpo = `
        <div class="coach-card card-rilievo">
          ${chi('08:00')}
          <div class="pila-6">
            <h3 class="titolo-card">Check-in settimana ${D.atleta.settimana}</h3>
            <p class="nota" style="font-weight:500"><span class="accento">1 minuto</span> · Allenamenti, energia, carichi e note. Lo leggo domattina e sistemo la settimana ${D.atleta.settimana + 1}.</p>
          </div>
          <a class="btn-secondario" href="#checkin">Fai il check-in</a>
        </div>`;
    } else if (cosa.tipo === 'checkin-fatto') {
      corpo = `
        <div class="coach-card card">
          ${chi('08:00')}
          <div class="pila-6">
            <span class="chip chip-ok" style="align-self:flex-start">Check-in inviato</span>
            <p class="nota">Grazie. Lo leggo domattina e ti sistemo la settimana ${D.atleta.settimana + 1}.</p>
          </div>
        </div>`;
    } else if (cosa.tipo === 'carico') {
      const c = cosa.c;
      corpo = `
        <div class="coach-card card">
          ${chi(c.ora)}
          <div class="carico">
            <span class="cosa">Carico aggiornato · ${esc(c.esercizio)}</span>
            <div class="valori" aria-label="da ${c.da} a ${c.a} chili"><span class="da">${c.da}</span><span class="freccia">→</span><span>${c.a}</span><span class="kg">kg</span></div>
          </div>
          <p class="nota">${esc(c.nota)}</p>
        </div>`;
    } else {
      const f = cosa.f, v = D.video;
      corpo = `
        <a class="coach-card card" href="#coach">
          ${chi(quandoFeedback(f))}
          <div class="feedback">
            <span class="mini-video">
              <img src="${v.foto}" alt="">
              <span class="play"><svg width="10" height="12" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg></span>
              <span class="durata">${v.durata}</span>
            </span>
            <div class="dettagli">
              <span class="esercizio">${esc(v.esercizio)} ${v.kg} kg × ${v.reps}</span>
              <span class="chips"><span class="chip ${f.tecnica === 'Tecnica ottima' ? 'chip-ok' : 'chip-avviso'}">${esc(f.tecnica)}</span><span class="chip chip-neutro">${esc(f.carico)}</span></span>
              <p class="nota">${esc(f.nota)}</p>
            </div>
          </div>
        </a>`;
    }
    return `
      <section class="blocco" aria-labelledby="t-coach">
        <h2 id="t-coach" class="etichetta" style="margin:0">Dal tuo coach</h2>
        ${corpo}
      </section>`;
  }

  // ---------- Progresso: tutto il corpo, una card per gruppo muscolare (a scorrimento) ----------
  // Richiesta di Francesco 2026-11-03: la prima card resta quella del giorno, poi si scorre sugli altri gruppi;
  // se non la tocchi scorre da sola e ricomincia, così vedi come stai andando in generale.
  const GRUPPI = [
    { id: 'panca', gruppo: 'Petto' }, { id: 'rematore', gruppo: 'Schiena' }, { id: 'squat', gruppo: 'Gambe' }, { id: 'stacco', gruppo: 'Femorali e glutei' },
    { id: 'lento', gruppo: 'Spalle', nome: 'Lento avanti', kg: 40, reps: 8, punti: [35, 37.5, 40, 40, 40, 40] },
    { id: 'curl', gruppo: 'Braccia', nome: 'Curl con bilanciere', kg: 27.5, reps: 10, punti: [25, 25, 27.5, 30, 27.5, 27.5] },
  ].map((g) => ({ ...(D.progressi[g.id] || {}), ...g }));
  // In calo: sotto il massimo delle 3 settimane prima · in salita: sopra 3 settimane fa · altrimenti stabile
  function andamento(p) {
    const u = p.punti[p.punti.length - 1], prima = p.punti.slice(-4, -1), picco = Math.max(...prima);
    const perc = (a, b) => Math.round((a - b) / b * 100);
    if (u < picco) return { tipo: 'calo', testo: `▼ ${perc(u, picco)}% dal massimo di ${kg(picco)} kg`, colore: '#FF6166' };
    if (u > p.punti[p.punti.length - 4]) return { tipo: 'salita', testo: `▲ +${perc(u, p.punti[0])}% in ${p.punti.length} settimane`, colore: '#C8F03C' };
    const ferme = p.punti.slice().reverse().findIndex((v) => v !== u);
    return { tipo: 'stabile', testo: `= Stabile da ${ferme < 0 ? p.punti.length : ferme} settimane`, colore: '#A8A8A3' };
  }
  function cardProgresso(p, n, tot) {
    const a = andamento(p);
    const min = Math.min(...p.punti), max = Math.max(...p.punti);
    const pts = p.punti.map((v, i) => [i * 120 / (p.punti.length - 1), 40 - (v - min) / (max - min || 1) * 34.7]);
    const linea = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const [ux, uy] = pts[pts.length - 1];
    return `
        <div class="progresso card-prog ${a.tipo}" role="group" aria-roledescription="scheda" aria-label="${n + 1} di ${tot}: ${esc(p.gruppo)}">
          <div class="dato">
            <span class="gruppo">${esc(p.gruppo)}</span>
            <span class="nome">${esc(p.nome)}</span>
            <span class="valore">${kg(p.kg)} kg × ${p.reps}</span>
            <span class="delta">${a.testo}</span>
          </div>
          <svg width="124" height="56" viewBox="-4 -4 128 52" aria-hidden="true">
            <defs><linearGradient id="area-${p.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.colore}" stop-opacity=".3"/><stop offset="1" stop-color="${a.colore}" stop-opacity="0"/></linearGradient></defs>
            <path d="M${linea.replace(/ /g, 'L')}V44H0Z" fill="url(#area-${p.id})"/>
            <polyline points="${linea}" fill="none" stroke="${a.colore}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <circle cx="${ux}" cy="${uy.toFixed(1)}" r="4" fill="#000000" stroke="${a.colore}" stroke-width="2"/>
          </svg>
        </div>`;
  }
  function progresso(cosa) {
    // Prima card: quella del giorno (diversa dall'esercizio di cui parla il coach), poi gli altri gruppi
    let k = D.progressoDelGiorno[chiave] || D.progressoDelGiorno.riposo; // allenamenti di altri modelli: quella di riposo
    const nomeCoach = cosa && (cosa.tipo === 'carico' ? cosa.c.esercizio : cosa.tipo === 'feedback' ? D.video.esercizio : '');
    if (nomeCoach && D.progressi[k].nome.startsWith(nomeCoach)) k = 'panca';
    const ordine = [GRUPPI.find((g) => g.id === k)].concat(GRUPPI.filter((g) => g.id !== k));
    const conta = { salita: 0, stabile: 0, calo: 0 };
    GRUPPI.forEach((g) => conta[andamento(g).tipo]++);
    return `
      <section class="blocco" aria-labelledby="t-prog">
        <div class="intesta"><h2 id="t-prog" class="etichetta" style="margin:0">Progresso</h2>
          <span class="riassunto-corpo"><b class="salita">${conta.salita} in salita</b> · ${conta.stabile} stabil${conta.stabile === 1 ? 'e' : 'i'} · <b class="calo">${conta.calo} in calo</b></span></div>
        <div class="carosello-prog" tabindex="0" aria-label="Progresso per gruppo muscolare: scorri per vederli tutti">${ordine.map((p, n) => cardProgresso(p, n, ordine.length)).join('')}</div>
        <div class="puntini" aria-hidden="true">${ordine.map((p, n) => `<i${n === 0 ? ' class="on"' : ''}></i>`).join('')}</div>
      </section>`;
  }
  // Scorrimento automatico in loop finché non lo tocchi (niente se il telefono chiede meno movimento)
  let giro = null, fermo = false;
  function avviaGiro() {
    clearInterval(giro);
    const c = document.querySelector('[data-vista="oggi"] .carosello-prog');
    if (!c) return;
    const punti = c.parentNode.querySelectorAll('.puntini i');
    const attuale = () => Math.round(c.scrollLeft / c.clientWidth);
    c.addEventListener('scroll', () => punti.forEach((p, n) => p.classList.toggle('on', n === attuale())), { passive: true });
    ['pointerdown', 'touchstart', 'wheel', 'focus'].forEach((ev) => c.addEventListener(ev, () => { fermo = true; clearInterval(giro); }, { passive: true }));
    if (fermo || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    giro = setInterval(() => {
      if (document.hidden || c.closest('.vista').hidden || !c.isConnected) return;
      const dopo = (attuale() + 1) % punti.length;
      c.scrollTo({ left: dopo * c.clientWidth, behavior: dopo === 0 ? 'auto' : 'smooth' });
    }, 4000);
  }

  // Il titolone resta su una riga: se il nome è lungo («GAMBE B») si riduce fino a starci
  function adatta() {
    const t = document.querySelector('[data-vista="oggi"] .titolone');
    if (!t || !t.offsetParent) return;
    t.style.fontSize = '';
    let size = parseFloat(getComputedStyle(t).fontSize);
    while (t.scrollWidth > t.clientWidth && size > 56) { size -= 2; t.style.fontSize = size + 'px'; }
  }
  window.addEventListener('resize', adatta);
  document.fonts && document.fonts.ready.then(adatta);

  A.viste.oggi = {
    render() {
      const sessione = A.leggi(A.chiaveSessione);
      const cosa = cosaDalCoach();
      const v = document.querySelector('[data-vista="oggi"]');
      v.innerHTML = hero(sessione) + recupero() + settimana(sessione) + coach(cosa) + progresso(cosa) + schermoFoglio();
      v.classList.toggle('con-foglio', !!foglio);
      avviaGiro();
      document.getElementById('voce-coach').classList.toggle('novita', !!(cosa && (cosa.tipo === 'checkin' || (cosa.tipo === 'feedback' && cosa.f.istante))));
      adatta();
    },
  };

  // Se il coach invia un feedback dal gestionale in un'altra scheda, la Home si aggiorna da sola
  window.addEventListener('storage', (e) => { if (e.key === D.chiaveFeedback && !location.hash.match(/allenamento|checkin/)) A.viste.oggi.render(); });
})();
