// Programma: la settimana e, sotto, gli esercizi del giorno scelto (anteprima).
(function () {
  const A = window.APP, D = A.D, { esc, kg, GIORNI, BREVI } = A;

  A.viste.programma = {
    render(param) {
      const scelto = D.allenamenti[param] ? param : (D.settimana[A.oggi] || D.settimana.find((k, i) => k && i > A.oggi) || D.settimana.find(Boolean));
      const sessione = A.leggi(A.chiaveSessione);
      const giorni = D.settimana.map((k, i) => {
        const a = k ? D.allenamenti[k] : null;
        const st = A.piano.stato(i); // fatto, oggi, non fatto, saltato (piano.js)
        const stato = st === 'fatto' ? '<span class="chip chip-ok">Fatto</span>' : st === 'oggi' ? '<span class="chip chip-info">Oggi</span>' : st === 'nonfatto' ? '<span class="chip chip-errore">Non fatto</span>' : st === 'saltato' ? '<span class="chip chip-neutro">Saltato</span>' : '';
        const dentro = `<span class="quando num"><b>${BREVI[i]}</b><span>${A.data(i).getDate()}</span></span>
          <span class="cosa"><b>${a ? esc(a.nome) : 'Riposo'}</b><span>${a ? `${esc(a.muscoli)}` : 'Camminata e mobilità'}</span></span>${stato}`;
        return k
          ? `<li><a class="giorno-prog${k === scelto ? ' scelto' : ''}" href="#programma/${k}" aria-label="${GIORNI[i]}: ${esc(a.nome)}"${k === scelto ? ' aria-current="true"' : ''}>${dentro}</a></li>`
          : `<li><div class="giorno-prog riposo">${dentro}</div></li>`;
      }).join('');

      const a = D.allenamenti[scelto];
      const oggiQuesto = D.settimana[A.oggi] === scelto;
      const esercizi = D.esercizi[scelto].map((e, n) => `
        <li class="riga-es">
          <span class="n num">${n + 1}</span>
          <span class="cosa"><b>${esc(e.nome)}</b><span class="num">${e.serie} × ${e.reps} · ${e.kg ? kg(e.kg) + ' kg' : 'corpo libero'} · recupero ${A.mmss(e.rec)}</span>${e.nota ? `<span class="nota-breve">${esc(D.coach.breve)} · ${esc(e.nota)}</span>` : ''}</span>
          ${e.demo ? `<img class="mini" src="assets/foto/${e.demo}.webp" alt="" width="64" height="36">` : ''}
        </li>`).join('');

      document.querySelector('[data-vista="programma"]').innerHTML = `
        <header class="testa-pagina">
          <span class="sopratitolo">Settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span>
          <h1 class="titolo-pagina">Programma</h1>
          <span class="sotto">${esc(D.atleta.programma)} · preparato da ${esc(D.coach.nome)}</span>
        </header>
        <ul class="settimana-prog card" aria-label="Questa settimana">${giorni}</ul>
        <section class="blocco" aria-labelledby="t-giorno">
          <div class="intesta"><h2 id="t-giorno" class="titolo-sezione">${esc(a.nome)}</h2><span class="etichetta num" style="letter-spacing:0">${a.esercizi} esercizi · ~${a.minuti} min</span></div>
          <ol class="lista-es">${esercizi}</ol>
          ${oggiQuesto && !(sessione && sessione.finito) ? `<a class="btn-primario btn-scheda" href="#allenamento">${sessione ? 'Riprendi la scheda' : 'Apri scheda'} <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M1 7h19M14 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` : ''}
        </section>`;
    },
  };
})();
