// Primo avvio: il cliente inserisce il codice ricevuto dal coach (prova: LUCA26), vede a chi si collega, entra.
// Profilo: dati essenziali e «Ricomincia la prova» (cancella solo i dati di questa demo).
(function () {
  const A = window.APP, D = A.D, { esc } = A;
  const CODICE = 'LUCA26';
  let passo = 'codice', errore = '';

  function schermoCodice(valore) {
    return `
      <div class="benvenuto-foto"><img src="assets/foto/onboarding.webp" alt="" fetchpriority="high"></div>
      <div class="benvenuto-testo">
        <span class="marchio">CARICO</span>
        <span class="sopratitolo">Coaching personale</span>
        <h1 class="titolone-b">Il tuo coach ti aspetta</h1>
        <p class="consiglio">Non un'app di schede: il programma lo scrive il tuo personal trainer, tu registri le serie e lui ti segue davvero.</p>
        <form class="modulo-codice" id="form-codice" novalidate>
          <label for="codice" class="etichetta">Codice del tuo coach</label>
          <div class="riga-codice">
            <input id="codice" class="campo-codice${errore ? ' errato' : ''}" inputmode="text" autocapitalize="characters" autocomplete="one-time-code" maxlength="6" placeholder="ABC123" value="${esc(valore || '')}" aria-describedby="nota-codice" aria-invalid="${!!errore}">
            <button type="button" class="tasto-56 incolla" id="incolla">Incolla</button>
          </div>
          <p class="nota-codice${errore ? ' errore' : ''}" id="nota-codice">${errore ? esc(errore) : 'Te l’ha mandato il coach. Per provare: <b>LUCA26</b> Marco · <b>LUCA11</b> appena iscritta · <b>LUCA99</b> avanzato'}</p>
          <button class="btn-primario" type="submit">Collegati</button>
        </form>
      </div>`;
  }

  let scelto = null; // atleta del codice inserito (Marco con LUCA26, o uno aggiunto dal coach)
  function schermoConferma() {
    const P = window.ARCHIVIO.datiDi(scelto.id);
    return `
      <div class="corpo-es conferma-coach">
        <span class="sopratitolo">Codice corretto</span>
        <h1 class="nome-es medio">Ti stai collegando a</h1>
        <div class="card-coach card-rilievo">
          <img class="avatar" src="${D.coach.foto}" alt="" width="72" height="72">
          <div><b>${esc(D.coach.nome)}</b><span>${esc(D.coach.ruolo)}</span></div>
        </div>
        <ul class="cosa-ricevi">
          <li><b>Programma per ${esc(P.atleta.nome)}</b><span>${esc(P.atleta.programma)} · ${P.atleta.settimane} settimane · ${P.piano.aSettimana} allenamenti a settimana${P.piano.modo === 'flessibile' ? ', quando vuoi' : ''}</span></li>
          <li><b>Revisione tecnica</b><span>Mandi il video di una serie, ${esc(D.coach.breve)} ti risponde entro 24 h</span></li>
          <li><b>Check-in ogni domenica</b><span>Un minuto: ${esc(D.coach.breve)} sistema la settimana dopo</span></li>
        </ul>
        <div class="in-fondo">
          <button class="btn-primario" id="entra">Inizia con ${esc(D.coach.breve)}</button>
          <button class="link-azione" id="indietro">Non è il mio coach</button>
        </div>
      </div>`;
  }

  function disegna(valore) {
    const v = document.querySelector('[data-vista="benvenuto"]');
    v.innerHTML = passo === 'codice' ? schermoCodice(valore) : schermoConferma();
    v.classList.toggle('su-foto', passo === 'codice');
  }

  function prova(valore) {
    const c = (valore || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length < 6) { errore = 'Il codice ha 6 caratteri, lettere e numeri.'; disegna(c); return; }
    scelto = window.ARCHIVIO.atletaDaCodice(c); // LUCA26 = Marco; gli altri codici li crea il coach nel gestionale
    if (!scelto) { errore = 'Codice non valido. Controlla il messaggio del tuo coach.'; disegna(c); return; }
    errore = ''; passo = 'conferma'; disegna();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.querySelector('[data-vista="benvenuto"]');
    v.addEventListener('submit', (e) => { e.preventDefault(); prova(document.getElementById('codice').value); });
    v.addEventListener('input', (e) => {
      if (e.target.id !== 'codice') return;
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (errore) { errore = ''; e.target.classList.remove('errato'); e.target.setAttribute('aria-invalid', 'false'); document.getElementById('nota-codice').className = 'nota-codice'; document.getElementById('nota-codice').innerHTML = 'Te l’ha mandato il coach. Per provare: <b>LUCA26</b> Marco · <b>LUCA11</b> appena iscritta · <b>LUCA99</b> avanzato'; }
      if (e.target.value.length === 6) prova(e.target.value); // codice completo: si va avanti da soli
    });
    v.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'incolla') {
        try { const t = await navigator.clipboard.readText(); document.getElementById('codice').value = t.trim().toUpperCase().slice(0, 6); prova(t.trim()); }
        catch (err) { document.getElementById('codice').focus(); A.avviso('Non posso leggere gli appunti', 'Tieni premuto nel campo e scegli Incolla'); }
      }
      if (b.id === 'entra') {
        A.scrivi('pt-collegato', { coach: D.coach.nome, quando: Date.now(), atleta: scelto.id });
        if (scelto.id === D.id) { location.hash = '#oggi'; A.mostra(); } else { location.hash = '#oggi'; location.reload(); } // altro atleta: si ricaricano i suoi dati
      }
      if (b.id === 'indietro') { passo = 'codice'; disegna(); }
    });
    document.querySelector('[data-vista="profilo"]').addEventListener('click', (e) => {
      const tema = e.target.closest('button[data-tema]'); // non l'html, che porta anche lui data-tema
      if (tema) { // colore dell'app: vale per questo telefono, si vede subito ovunque
        document.documentElement.dataset.tema = tema.dataset.tema;
        try { localStorage.setItem('pt-tema', JSON.stringify(tema.dataset.tema)); } catch (err) { /* resta per questa visita */ }
        document.querySelectorAll('button[data-tema]').forEach((b) => b.setAttribute('aria-checked', b === tema));
        return;
      }
      const acc = e.target.closest('[data-account]');
      if (acc && acc.dataset.account !== D.id) { // cambia account di prova: si ricaricano i dati di quell'atleta
        const c = A.leggi('pt-collegato') || {};
        A.scrivi('pt-collegato', { ...c, coach: D.coach.nome, quando: c.quando || Date.now(), atleta: acc.dataset.account });
        location.hash = '#oggi'; location.reload(); return;
      }
      if (!e.target.closest('#ricomincia')) return;
      if (!confirm('Ricominciare la prova? Si cancellano serie, check-in e messaggi di questa demo.')) return;
      // Si cancellano solo i dati di questo atleta: gli atleti aggiunti dal coach e i loro dati restano
      const altri = window.ARCHIVIO.atleti().filter((a) => a.id !== D.id).map((a) => `pt-${a.id}-`);
      Object.keys(localStorage).filter((k) => (D.id === 'marco' ? k.startsWith('pt-') && k !== 'pt-atleti' && !altri.some((p) => k.startsWith(p)) : k.startsWith(`pt-${D.id}-`)) || k === 'pt-collegato')
        .forEach((k) => localStorage.removeItem(k));
      passo = 'codice'; errore = '';
      if (D.id === 'marco') { location.hash = '#oggi'; A.mostra(); } else { location.hash = '#oggi'; location.reload(); }
    });
  });

  A.viste.benvenuto = { render() { disegna(); } };

  A.viste.profilo = {
    render() {
      // Layout dal modello di Francesco (2026-11-03): foto grande col nome, coach, percorso in numeri, programma
      const c = A.leggi('pt-collegato') || {};
      const dal = c.quando ? new Date(c.quando) : null;
      const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
      const giornoMese = (d) => `${d.getDate()} ${MESI_LUNGHI[d.getMonth()]}`;
      const due = (n) => String(n).padStart(2, '0');
      const r = A.riepilogo();
      const inizio = A.data(-(D.atleta.settimana - 1) * 7), fine = A.data((D.atleta.settimane - D.atleta.settimana + 1) * 7 - 1);
      const aSettimana = D.piano.aSettimana;
      document.querySelector('[data-vista="profilo"]').innerHTML = `
        <header class="profilo-foto">
          <img src="assets/foto/${D.id === 'marco' ? 'profilo-marco' : 'profilo-atleta'}.webp" alt="">
          <a class="icona-44 indietro-profilo" href="${A.provenienza()}" aria-label="Indietro"><svg width="20" height="16" viewBox="0 0 22 16" aria-hidden="true"><path d="M21 8H2M8 1L1 8l7 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
          <div class="profilo-nome">
            <h1 class="titolo-pagina">${esc(D.atleta.nome)}<br>${esc(D.atleta.cognome)}</h1>
            <span class="ruolo num">Atleta · settimana <b>${due(D.atleta.settimana)}</b> / ${D.atleta.settimane}</span>
          </div>
        </header>
        <section class="blocco">
          <h2 class="etichetta" style="margin:0">Il tuo coach</h2>
          <div class="coach-profilo">
            <img class="avatar" src="${D.coach.foto}" alt="" width="64" height="64">
            <div class="chi-coach"><b>${esc(D.coach.nome)}</b><span>${esc(D.coach.ruolo)}</span>${dal ? `<span>Insieme dal ${giornoMese(dal)}</span>` : ''}</div>
            <a class="btn-contorno" href="#coach">Scrivi a ${esc(D.coach.breve)} <svg width="16" height="12" viewBox="0 0 22 14" aria-hidden="true"><path d="M1 7h19M14 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
          </div>
        </section>
        <section class="blocco">
          <h2 class="etichetta" style="margin:0">Il tuo percorso</h2>
          <div class="tre-dati divisi num">
            <span><b>${due(D.atleta.settimana)}<i>/</i>${D.atleta.settimane}</b><small>settimane</small></span>
            <span><b>${r.fatti}<i>/</i>${r.previsti}</b><small>allenamenti</small></span>
            <span><b>${r.aderenza}%</b><small>costanza</small></span>
          </div>
        </section>
        <section class="blocco programma-attuale">
          <h2 class="etichetta" style="margin:0">Programma attuale</h2>
          <div class="due-colonne">
            <div><b class="nome-prog">${esc(D.atleta.programma)}</b><span>${aSettimana} allenamenti a settimana</span></div>
            <dl class="date-prog"><div><dt>Iniziato il</dt><dd>${giornoMese(inizio)}</dd></div><div><dt>Fine prevista</dt><dd>${giornoMese(fine)}</dd></div></dl>
          </div>
        </section>
        <section class="blocco">
          <h2 class="etichetta" style="margin:0">Questa è una demo</h2>
          <p class="nota">I dati restano su questo telefono. Il gestionale di ${esc(D.coach.breve)} si apre da computer.</p>
          <a class="btn-secondario" href="coach.html" target="_blank" rel="noopener">Apri il gestionale del coach</a>
          <div class="temi" role="radiogroup" aria-label="Colore dell'app"><span class="etichetta">Colore dell'app</span>
            <div class="scelte-tema">${[['lime', 'Lime', '#C8F03C'], ['bianco', 'Bianco', '#F4F4F0'], ['brace', 'Brace', '#FF7A1A'], ['ghiaccio', 'Ghiaccio', '#4FD8FF']].map(([id, nome, c]) => `<button class="tema" role="radio" data-tema="${id}" aria-checked="${(document.documentElement.dataset.tema || 'lime') === id}"><span class="campione" style="background:${c}"></span>${nome}</button>`).join('')}</div>
          </div>
          <div class="account-prova"><span class="etichetta">Prova un altro account</span>
            ${window.ARCHIVIO.atleti().filter((a) => a.prova).map((a) => { const P = window.ARCHIVIO.datiDi(a.id); return `<button class="voce-account${a.id === D.id ? ' attivo' : ''}" data-account="${a.id}"${a.id === D.id ? ' aria-current="true"' : ''}><b>${esc(P.atleta.nome)} ${esc(P.atleta.cognome)}</b><span>${a.id === 'marco' ? 'Settimana 6 · Push Pull Gambe' : a.avanzato ? `Avanzato · settimana ${P.atleta.settimana} di ${P.atleta.settimane}` : 'Appena iscritta · settimana 1'}</span></button>`; }).join('')}
          </div>
          <button class="link-azione" id="ricomincia" style="align-self:flex-start">Ricomincia la prova</button>
        </section>`;
    },
  };
})();
