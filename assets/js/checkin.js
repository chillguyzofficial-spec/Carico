// Check-in settimanale: tre risposte a tocco + note facoltative. Il coach lo vede nel gestionale.
(function () {
  const A = window.APP, D = A.D, { esc } = A;
  const DOMANDE = [
    { id: 'allenamenti', testo: 'Come sono andati gli allenamenti?', scala: ['Male', 'Benissimo'] },
    { id: 'energia', testo: 'Energia durante la settimana?', scala: ['A terra', 'Al massimo'] },
  ];
  const CARICHI = ['Leggeri', 'Giusti', 'Pesanti'];
  let r = {};

  function disegna() {
    const pronto = r.allenamenti && r.energia && r.carichi;
    document.querySelector('[data-vista="checkin"]').innerHTML = `
      <header class="barra-top">
        <a class="icona-44" href="#oggi" aria-label="Chiudi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A8A8A3" stroke-width="1.8" stroke-linecap="round"/></svg></a>
        <div class="centro"><b>Check-in · settimana ${D.atleta.settimana}</b><span>1 minuto</span></div>
        <span class="icona-44"></span>
      </header>
      <form class="corpo-es modulo" id="modulo-checkin" novalidate>
        <h1 class="nome-es medio">Com'è andata?</h1>
        ${DOMANDE.map((d) => `
        <fieldset class="domanda">
          <legend>${esc(d.testo)}</legend>
          <div class="scala" role="radiogroup">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="voto num" role="radio" data-d="${d.id}" data-v="${n}" aria-checked="${r[d.id] === n}">${n}</button>`).join('')}
          </div>
          <div class="estremi"><span>${d.scala[0]}</span><span>${d.scala[1]}</span></div>
        </fieldset>`).join('')}
        <fieldset class="domanda">
          <legend>Come senti i carichi?</legend>
          <div class="segmenti-3" role="radiogroup">
            ${CARICHI.map((c) => `<button type="button" role="radio" data-d="carichi" data-v="${c}" aria-checked="${r.carichi === c}">${c}</button>`).join('')}
          </div>
        </fieldset>
        <div class="domanda">
          <label for="note-checkin">Note per ${esc(D.coach.breve)} <span class="tenue">· facoltative</span></label>
          <textarea class="campo-testo" id="note-checkin" rows="3" placeholder="Sonno, dolori, impegni della prossima settimana">${esc(r.note || '')}</textarea>
        </div>
        <div class="in-fondo">
          <button class="btn-primario" type="submit"${pronto ? '' : ' disabled'}>Invia check-in</button>
          ${pronto ? '' : '<p class="aiuto">Rispondi alle tre domande per inviarlo.</p>'}
        </div>
      </form>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.querySelector('[data-vista="checkin"]');
    v.addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]');
      if (!b) return;
      r.note = document.getElementById('note-checkin').value;
      r[b.dataset.d] = b.dataset.d === 'carichi' ? b.dataset.v : Number(b.dataset.v);
      disegna();
      v.querySelector(`[data-d="${b.dataset.d}"][aria-checked="true"]`).focus();
    });
    v.addEventListener('submit', (e) => {
      e.preventDefault();
      r.note = document.getElementById('note-checkin').value.trim();
      A.scrivi(A.chiaveCheckin, { ...r, istante: Date.now() });
      A.avviso('Check-in inviato', `${D.coach.breve} lo legge domattina`);
      A.vai('#oggi');
    });
  });

  A.viste.checkin = {
    render() {
      r = A.leggi(A.chiaveCheckin) || {};
      disegna();
    },
  };
})();
