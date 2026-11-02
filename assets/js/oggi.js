// Schermata «Oggi» dell'atleta. Lo stato dipende dal giorno della settimana:
// allenamento (lun, mar, gio, ven), check-in (domenica, con allenamento), riposo (mer, sab).
// Per vedere un giorno preciso: index.html?giorno=1 … 7 (1 = lunedì).
(function () {
  const D = window.DATI;
  const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
  const BREVI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  const LETTERE = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

  const adesso = new Date();
  const scelto = Number(new URLSearchParams(location.search).get('giorno'));
  const oggi = scelto >= 1 && scelto <= 7 ? scelto - 1 : (adesso.getDay() + 6) % 7; // 0 = lunedì
  const lunedi = new Date(adesso);
  lunedi.setDate(adesso.getDate() - ((adesso.getDay() + 6) % 7) + 0);
  const data = (i) => { const d = new Date(lunedi); d.setDate(lunedi.getDate() + i); return d; };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kg = (n) => String(n).replace('.', ',');

  const chiave = D.settimana[oggi];
  const all = chiave ? D.allenamenti[chiave] : null;

  // ---------- Hero ----------
  function hero() {
    const testata = `
      <div class="testata">
        <div class="saluto"><b>Ciao ${esc(D.atleta.nome)}</b><span>Settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span></div>
        <button class="profilo" aria-label="Il tuo profilo"><img class="avatar" src="${D.atleta.foto}" alt=""></button>
      </div>`;

    if (all) {
      const tipo = all.breve.toLowerCase();
      return `
      <section class="hero ${tipo}" aria-label="Allenamento di oggi">
        <div class="hero-foto"><img src="assets/foto/${all.foto}.webp" alt="" fetchpriority="high"></div>
        ${testata}
        <div class="hero-testo">
          <span class="sopratitolo">Oggi</span>
          <h1 class="titolone">${esc(all.nome)}</h1>
          <span class="muscoli">${esc(all.muscoli)}</span>
          <span class="durata-all">${all.esercizi} esercizi · ~${all.minuti} min</span>
          <button class="btn-primario" id="inizia">
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1.5v13l11-6.5z" fill="#fff"/></svg>
            Inizia allenamento
          </button>
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
          <button class="domani">
            <span class="cosa">
              <span class="quando">${quando} · ${BREVI[(oggi + dopo) % 7]} ${data(oggi + dopo).getDate()}</span>
              <span class="riga"><span class="nome">${esc(prossimo.nome)}</span><span class="info num">${prossimo.esercizi} esercizi · ~${prossimo.minuti} min</span></span>
            </span>
            <span class="vai">Anteprima</span>
            <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="#7AA2FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </section>`;
  }

  // ---------- Settimana ----------
  function settimana() {
    const inizio = data(0), fine = data(6);
    const periodo = inizio.getMonth() === fine.getMonth()
      ? `${inizio.getDate()}–${fine.getDate()} ${MESI[fine.getMonth()]}`
      : `${inizio.getDate()} ${MESI[inizio.getMonth()]} – ${fine.getDate()} ${MESI[fine.getMonth()]}`;
    const spunta = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#7AA2FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const giorni = D.settimana.map((k, i) => {
      const cls = ['giorno'];
      if (!k) cls.push('libero');
      if (i === oggi) cls.push('oggi');
      const fatto = k && i < oggi;
      if (fatto) cls.push('fatto');
      const tipo = k ? D.allenamenti[k].breve : 'Riposo';
      const stato = i === oggi ? 'oggi' : fatto ? 'fatto' : k ? 'previsto' : 'riposo';
      return `<li class="${cls.join(' ')}" aria-label="${GIORNI[i]} ${data(i).getDate()}, ${tipo}, ${stato}">
        <span class="lettera" aria-hidden="true">${LETTERE[i]}</span>
        <span class="cerchio" aria-hidden="true">${fatto ? spunta : data(i).getDate()}</span>
        <span class="tipo" aria-hidden="true">${tipo}</span>
      </li>`;
    }).join('');
    return `
      <section class="blocco settimana" aria-labelledby="t-sett">
        <div class="intesta etichetta"><h2 id="t-sett" class="etichetta" style="margin:0">Questa settimana</h2><span class="num">${periodo}</span></div>
        <ul class="giorni">${giorni}</ul>
      </section>`;
  }

  // ---------- Dal tuo coach: una sola cosa, la più importante ----------
  function feedbackSalvato() {
    try { return JSON.parse(localStorage.getItem(D.chiaveFeedback) || 'null'); } catch (e) { return null; }
  }

  function quandoFeedback(f) {
    if (f.istante) {
      const t = new Date(f.istante);
      const ora = t.toTimeString().slice(0, 5);
      return t.toDateString() === adesso.toDateString() ? `oggi ${ora}` : `${BREVI[(t.getDay() + 6) % 7]} ${ora}`;
    }
    return oggi - f.giorno === 1 ? `ieri ${f.ora}` : `${BREVI[f.giorno]} ${f.ora}`;
  }

  function cosaDalCoach() {
    if (oggi === 6) return { tipo: 'checkin' };
    const nuovo = feedbackSalvato();
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
          <div style="display:flex;flex-direction:column;gap:6px">
            <h3 class="titolo-card">Check-in settimana ${D.atleta.settimana}</h3>
            <p class="nota" style="font-weight:500"><span style="color:var(--voltaico-chiaro)">1 minuto</span> · Allenamenti, energia, carichi e note. Lo leggo domattina e sistemo la settimana ${D.atleta.settimana + 1}.</p>
          </div>
          <button class="btn-secondario">Fai il check-in</button>
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
      const tecnicaOk = f.tecnica === 'Tecnica ottima';
      corpo = `
        <div class="coach-card card">
          ${chi(quandoFeedback(f))}
          <div class="feedback">
            <button class="mini-video" aria-label="Rivedi il video: ${v.esercizio} ${v.kg} chili per ${v.reps}">
              <img src="${v.foto}" alt="">
              <span class="play"><svg width="10" height="12" viewBox="0 0 10 12"><path d="M1 1v10l8-5z" fill="#fff"/></svg></span>
              <span class="durata">${v.durata}</span>
            </button>
            <div class="dettagli">
              <span class="esercizio">${esc(v.esercizio)} ${v.kg} kg × ${v.reps}</span>
              <span class="chips"><span class="chip ${tecnicaOk ? 'chip-ok' : 'chip-avviso'}">${esc(f.tecnica)}</span><span class="chip chip-neutro">${esc(f.carico)}</span></span>
              <p class="nota">${esc(f.nota)}</p>
            </div>
          </div>
        </div>`;
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
    const pts = p.punti.map((v, i) => [i * 120 / (p.punti.length - 1), 40 - (v - min) / (max - min || 1) * 34.7 + 0]);
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

  const cosa = cosaDalCoach();
  document.getElementById('oggi').innerHTML = hero() + settimana() + coach(cosa) + progresso(cosa);
  // Il titolone resta su una riga: se il nome è lungo («GAMBE B») si riduce fino a starci
  const adatta = () => {
    const t = document.querySelector('.titolone');
    t.style.fontSize = '';
    let size = parseFloat(getComputedStyle(t).fontSize);
    while (t.scrollWidth > t.clientWidth && size > 56) { size -= 2; t.style.fontSize = size + 'px'; }
  };
  adatta();
  document.fonts && document.fonts.ready.then(adatta);
  window.addEventListener('resize', adatta);

  if (cosa && (cosa.tipo === 'checkin' || (cosa.tipo === 'feedback' && cosa.f.istante))) {
    document.getElementById('voce-coach').classList.add('novita');
  }

  // Se il coach invia un feedback dal gestionale in un'altra scheda, la Home si aggiorna da sola
  window.addEventListener('storage', (e) => { if (e.key === D.chiaveFeedback) location.reload(); });
})();
