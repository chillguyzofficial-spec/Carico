// Schermata «Oggi». Lo stato dipende dal giorno della settimana:
// allenamento (lun, mar, gio, ven), check-in (domenica, con allenamento), riposo (mer, sab).
(function () {
  const A = window.APP, D = A.D, { esc, kg, oggi, data, GIORNI, BREVI, LETTERE, MESI } = A;
  const chiave = D.settimana[oggi];
  const all = A.allenamentoDi(oggi);

  function hero(sessione) {
    const testata = `
      <div class="testata">
        <div class="saluto"><b>Ciao ${esc(D.atleta.nome)}</b><span>Settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span></div>
        <button class="profilo" aria-label="Il tuo profilo"><img class="avatar" src="${D.atleta.foto}" alt=""></button>
      </div>`;

    if (all) {
      const finito = sessione && sessione.finito;
      const azione = finito
        ? `<a class="btn-secondario" href="#allenamento">Completato · rivedi le serie</a>`
        : `<a class="btn-primario" href="#allenamento">
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1.5v13l11-6.5z" fill="#fff"/></svg>
            ${sessione ? 'Riprendi allenamento' : 'Inizia allenamento'}
          </a>`;
      return `
      <section class="hero ${all.breve.toLowerCase()}" aria-label="Allenamento di oggi">
        <div class="hero-foto"><img src="assets/foto/${all.foto}.webp" alt="" fetchpriority="high"></div>
        ${testata}
        <div class="hero-testo">
          <span class="sopratitolo">${finito ? 'Oggi · fatto' : 'Oggi'}</span>
          <h1 class="titolone">${esc(all.nome)}</h1>
          <span class="muscoli">${esc(all.muscoli)}</span>
          <span class="durata-all">${all.esercizi} esercizi · ~${all.minuti} min</span>
          ${azione}
        </div>
      </section>`;
    }

    // Riposo: anteprima del prossimo allenamento
    let dopo = 1;
    while (!D.settimana[(oggi + dopo) % 7]) dopo++;
    const prossimo = D.allenamenti[D.settimana[(oggi + dopo) % 7]];
    const quando = dopo === 1 ? 'Domani' : GIORNI[(oggi + dopo) % 7];
    return `
      <section class="hero riposo" aria-label="Giorno di riposo">
        <div class="hero-foto"><img src="assets/foto/hero-riposo.webp" alt="" fetchpriority="high"></div>
        ${testata}
        <div class="hero-testo">
          <span class="sopratitolo">Oggi · ${GIORNI[oggi]} ${data(oggi).getDate()}</span>
          <h1 class="titolone">Riposo</h1>
          <p class="consiglio">${esc(D.riposo)}</p>
          <a class="domani" href="#programma/${D.settimana[(oggi + dopo) % 7]}">
            <span class="cosa">
              <span class="quando">${quando} · ${BREVI[(oggi + dopo) % 7]} ${data(oggi + dopo).getDate()}</span>
              <span class="riga"><span class="nome">${esc(prossimo.nome)}</span><span class="info num">${prossimo.esercizi} esercizi · ~${prossimo.minuti} min</span></span>
            </span>
            <span class="vai">Anteprima</span>
            <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="#7AA2FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </section>`;
  }

  function settimana(sessione) {
    const inizio = data(0), fine = data(6);
    const periodo = inizio.getMonth() === fine.getMonth()
      ? `${inizio.getDate()}–${fine.getDate()} ${MESI[fine.getMonth()]}`
      : `${inizio.getDate()} ${MESI[inizio.getMonth()]} – ${fine.getDate()} ${MESI[fine.getMonth()]}`;
    const spunta = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#7AA2FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const giorni = D.settimana.map((k, i) => {
      const cls = ['giorno'];
      if (!k) cls.push('libero');
      const fatto = k && (i < oggi || (i === oggi && sessione && sessione.finito));
      if (i === oggi && !fatto) cls.push('oggi');
      if (i === oggi) cls.push('corrente');
      if (fatto) cls.push('fatto');
      const tipo = k ? D.allenamenti[k].breve : 'Riposo';
      const stato = fatto ? 'fatto' : i === oggi ? 'oggi' : k ? 'previsto' : 'riposo';
      const dentro = `<span class="lettera" aria-hidden="true">${LETTERE[i]}</span>
        <span class="cerchio" aria-hidden="true">${fatto ? spunta : data(i).getDate()}</span>
        <span class="tipo" aria-hidden="true">${tipo}</span>`;
      const etichetta = `${GIORNI[i]} ${data(i).getDate()}, ${tipo}, ${stato}`;
      return `<li class="${cls.join(' ')}">${k
        ? `<a href="#programma/${k}" aria-label="${etichetta}">${dentro}</a>`
        : `<span aria-label="${etichetta}">${dentro}</span>`}</li>`;
    }).join('');
    return `
      <section class="blocco settimana" aria-labelledby="t-sett">
        <div class="intesta etichetta"><h2 id="t-sett" class="etichetta" style="margin:0">Questa settimana</h2><span class="num">${periodo}</span></div>
        <ul class="giorni">${giorni}</ul>
      </section>`;
  }

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

  // ---------- Progresso: un solo dato, diverso dall'esercizio di cui parla il coach ----------
  function progresso(cosa) {
    let k = D.progressoDelGiorno[chiave || 'riposo'];
    const nomeCoach = cosa && (cosa.tipo === 'carico' ? cosa.c.esercizio : cosa.tipo === 'feedback' ? D.video.esercizio : '');
    if (nomeCoach && D.progressi[k].nome.startsWith(nomeCoach)) k = 'panca';
    const p = D.progressi[k];
    const min = Math.min(...p.punti), max = Math.max(...p.punti);
    const pts = p.punti.map((v, i) => [i * 120 / (p.punti.length - 1), 40 - (v - min) / (max - min || 1) * 34.7]);
    const linea = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const [ux, uy] = pts[pts.length - 1];
    return `
      <section class="blocco" aria-labelledby="t-prog">
        <h2 id="t-prog" class="etichetta" style="margin:0">Progresso</h2>
        <div class="progresso">
          <div class="dato">
            <span class="nome">${esc(p.nome)}</span>
            <span class="valore">${kg(p.kg)} kg × ${p.reps}</span>
            <span class="delta">${esc(p.delta)}</span>
          </div>
          <svg width="124" height="56" viewBox="-4 -4 128 52" aria-hidden="true">
            <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563FF" stop-opacity=".35"/><stop offset="1" stop-color="#2563FF" stop-opacity="0"/></linearGradient></defs>
            <path d="M${linea.replace(/ /g, 'L')}V44H0Z" fill="url(#area)"/>
            <polyline points="${linea}" fill="none" stroke="#7AA2FF" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <circle cx="${ux}" cy="${uy.toFixed(1)}" r="4" fill="#070B14" stroke="#7AA2FF" stroke-width="2"/>
          </svg>
        </div>
      </section>`;
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
      document.querySelector('[data-vista="oggi"]').innerHTML = hero(sessione) + settimana(sessione) + coach(cosa) + progresso(cosa);
      document.getElementById('voce-coach').classList.toggle('novita', !!(cosa && (cosa.tipo === 'checkin' || (cosa.tipo === 'feedback' && cosa.f.istante))));
      adatta();
    },
  };

  // Se il coach invia un feedback dal gestionale in un'altra scheda, la Home si aggiorna da sola
  window.addEventListener('storage', (e) => { if (e.key === D.chiaveFeedback && !location.hash.match(/allenamento|checkin/)) A.viste.oggi.render(); });
})();
