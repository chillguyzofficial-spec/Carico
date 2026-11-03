// Calendario del programma, mese per mese (si apre da «Calendario» in Oggi, in un foglio dal basso: non invadente).
// Settimane passate: dallo storico (22 su 25 fatti, 3 saltati) · settimana in corso: lo stato vero (piano.js) · future: previste.
(function () {
  const A = window.APP, D = A.D, { esc, MESI, BREVI } = A;
  const MESI_LUNGHI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const STORICO_SALTATI = [[2, 4], [3, 1], [5, 6]]; // [settimana, giorno] saltati prima di questa settimana (3 su 25)
  const NOMI = { fatto: 'Fatto', oggi: 'Oggi', previsto: 'Previsto', nonfatto: 'Non fatto', saltato: 'Saltato', riposo: 'Riposo' };

  const inizio = () => A.data(-(D.atleta.settimana - 1) * 7); // lunedì della settimana 1
  const giorniTra = (a, b) => Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);

  function giorno(d) {
    const n = giorniTra(inizio(), d), sett = Math.floor(n / 7) + 1, dow = ((n % 7) + 7) % 7;
    if (n < 0 || sett > D.atleta.settimane) return { stato: 'fuori' };
    if (sett === D.atleta.settimana) { const k = D.settimana[dow]; return { stato: A.piano.stato(dow), k, sett }; }
    // Settimane passate e future: giorni fissi del coach, oppure («quando vuoi») i giorni tipici con la sequenza
    const p = D.piano, j = p.storico.indexOf(dow);
    const k = p.modo === 'fissi' ? D.settimanaBase[dow] : j < 0 ? null : p.sequenza[((sett - 1) * p.aSettimana + j) % p.sequenza.length];
    if (!k) return { stato: 'riposo', sett };
    if (sett > D.atleta.settimana) return { stato: 'previsto', k, sett };
    return { stato: STORICO_SALTATI.some(([s, g]) => s === sett && g === dow) ? 'saltato' : 'fatto', k, sett };
  }

  function html(offset, scelto) {
    const oggiD = A.data(A.oggi), primo = new Date(oggiD.getFullYear(), oggiD.getMonth() + offset, 1);
    const vuoti = (primo.getDay() + 6) % 7, nGiorni = new Date(primo.getFullYear(), primo.getMonth() + 1, 0).getDate();
    const celle = [];
    for (let v = 0; v < vuoti; v++) celle.push('<span class="cal-vuoto"></span>');
    for (let g = 1; g <= nGiorni; g++) {
      const d = new Date(primo.getFullYear(), primo.getMonth(), g), x = giorno(d), iso = A.iso(d);
      const cls = ['cal-g', 'cal-' + x.stato];
      if (iso === A.iso(oggiD)) cls.push('cal-oggi');
      if (iso === scelto) cls.push('cal-scelto');
      const nome = x.k ? D.allenamenti[x.k].nome : '';
      celle.push(x.stato === 'fuori'
        ? `<span class="${cls.join(' ')}"><span class="num">${g}</span></span>`
        : `<button class="${cls.join(' ')}" data-cal-giorno="${iso}" aria-label="${g} ${MESI_LUNGHI[d.getMonth()]}: ${nome ? esc(nome) + ', ' : ''}${NOMI[x.stato].toLowerCase()}"><span class="num">${g}</span></button>`);
    }
    let dettaglio = '<p class="cal-dettaglio tenue">Tocca un giorno per vedere cosa c’era in programma.</p>';
    if (scelto) {
      const d = new Date(scelto + 'T12:00:00'), x = giorno(d);
      dettaglio = `<p class="cal-dettaglio"><b>${BREVI[(d.getDay() + 6) % 7]} ${d.getDate()} ${MESI[d.getMonth()]}</b>${x.sett ? ` · settimana ${x.sett}` : ''}<br>${x.k ? `${esc(D.allenamenti[x.k].nome)} · ` : ''}<span class="cal-stato-${x.stato}">${NOMI[x.stato]}</span></p>`;
    }
    return `
      <div class="cal-testa">
        <button class="icona-44" data-cal-mese="${offset - 1}" aria-label="Mese prima"><svg width="10" height="16" viewBox="0 0 10 16"><path d="M8 2L2 8l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <span class="titolo">${MESI_LUNGHI[primo.getMonth()]} ${primo.getFullYear()}</span>
        <button class="icona-44" data-cal-mese="${offset + 1}" aria-label="Mese dopo"><svg width="10" height="16" viewBox="0 0 10 16"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
      <div class="cal-griglia" role="group" aria-label="${MESI_LUNGHI[primo.getMonth()]}">
        ${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((l) => `<span class="cal-lettera" aria-hidden="true">${l}</span>`).join('')}
        ${celle.join('')}
      </div>
      ${dettaglio}
      <div class="cal-legenda" aria-hidden="true"><span><i class="cal-fatto"></i>Fatto</span><span><i class="cal-previsto"></i>Previsto</span><span><i class="cal-saltato"></i>Saltato</span><span><i class="cal-nonfatto"></i>Non fatto</span></div>
      <p class="cal-nota tenue">${esc(D.atleta.programma)} · ${D.atleta.settimane} settimane, dal ${inizio().getDate()} ${MESI[inizio().getMonth()]}</p>`;
  }

  A.calendario = { html, giorno };
})();
