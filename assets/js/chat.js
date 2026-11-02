// Chat col coach. Non è una copia di WhatsApp: ogni domanda può portarsi dietro il contesto
// dell'allenamento (esercizio · giorno · serie · kg × reps), che arriva da «Chiedi al coach».
(function () {
  const A = window.APP, D = A.D, { esc, BREVI } = A;
  let contesto = '';

  // Tutti i messaggi con un istante: quelli dei dati (giorno/ora), il feedback sul video, quelli scritti qui
  function messaggi() {
    const quando = (giorno, ora) => { const d = A.data(giorno); const [h, m] = ora.split(':'); d.setHours(+h, +m); return d.getTime(); };
    const lista = D.chat.filter((m) => m.giorno <= A.oggi).map((m) => ({ ...m, istante: quando(m.giorno, m.ora) }));
    const fb = A.leggi(D.chiaveFeedback) || (A.oggi > D.feedbackPredefinito.giorno ? { ...D.feedbackPredefinito, istante: quando(D.feedbackPredefinito.giorno, D.feedbackPredefinito.ora) } : null);
    if (fb) lista.push({ da: 'coach', tipo: 'feedback', istante: fb.istante, f: fb });
    return lista.concat(A.leggi('pt-chat') || []).sort((a, b) => a.istante - b.istante);
  }

  function etichettaGiorno(t) {
    const d = new Date(t), oggi = A.data(A.oggi);
    const diff = Math.round((new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (diff <= 0) return 'Oggi';
    if (diff === 1) return 'Ieri';
    return `${A.GIORNI[(d.getDay() + 6) % 7]} ${d.getDate()} ${A.MESI[d.getMonth()]}`;
  }

  function bolla(m) {
    const ora = new Date(m.istante).toTimeString().slice(0, 5);
    const ctx = m.contesto ? `<span class="contesto-msg">${esc(m.contesto)}</span>` : '';
    let corpo = '';
    if (m.tipo === 'feedback') {
      const v = D.video, f = m.f;
      corpo = `<span class="msg-video"><span class="mini-video"><img src="${v.foto}" alt=""><span class="durata">${v.durata}</span></span>
        <span class="pila-6"><b class="titolo-msg">${esc(v.esercizio)} ${v.kg} kg × ${v.reps}</b><span class="chips"><span class="chip ${f.tecnica === 'Tecnica ottima' ? 'chip-ok' : 'chip-avviso'}">${esc(f.tecnica)}</span><span class="chip chip-neutro">${esc(f.carico)}</span></span></span></span>
        <p>${esc(f.nota)}</p>`;
    } else if (m.tipo === 'carico') {
      corpo = `<span class="msg-carico"><span class="cosa">Carico aggiornato · ${esc(m.esercizio)}</span><span class="valori num"><span class="da">${m.da_kg}</span> → ${m.a_kg} <small>kg</small></span></span><p>${esc(m.testo)}</p>`;
    } else if (m.tipo === 'video') {
      corpo = `${ctx}<span class="msg-allegato">▶ Video della serie</span>${m.testo ? `<p>${esc(m.testo)}</p>` : ''}`;
    } else if (m.tipo === 'allegato') {
      corpo = `${ctx}<span class="msg-allegato">${m.immagine ? 'Foto' : 'Video'} · ${esc(m.nomeFile || '')}</span>${m.testo ? `<p>${esc(m.testo)}</p>` : ''}`;
    } else {
      corpo = `${ctx}<p>${esc(m.testo)}</p>`;
    }
    return `<li class="msg ${m.da}"><div class="bolla">${corpo}</div><time class="num">${ora}</time></li>`;
  }

  function disegna() {
    let giorno = '';
    const righe = messaggi().map((m) => {
      const g = etichettaGiorno(m.istante);
      const sep = g !== giorno ? `<li class="sep-giorno">${g}</li>` : '';
      giorno = g;
      return sep + bolla(m);
    }).join('');
    const v = document.querySelector('[data-vista="coach"]');
    v.innerHTML = `
      <header class="testa-chat">
        <img class="avatar" src="${D.coach.foto}" alt="" width="40" height="40">
        <div><b>${esc(D.coach.nome)}</b><span>Il tuo coach · risponde in giornata</span></div>
      </header>
      <ol class="messaggi" aria-label="Conversazione con ${esc(D.coach.nome)}">${righe}</ol>
      <form class="scrivi" id="scrivi">
        ${contesto ? `<div class="contesto-scrivi"><span><small>Stai chiedendo di</small>${esc(contesto)}</span><button type="button" class="icona-44" id="togli-contesto" aria-label="Togli il riferimento all'esercizio"><svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="2" stroke-linecap="round"/></svg></button></div>` : ''}
        <div class="riga-scrivi">
          <button type="button" class="icona-44 allega" id="allega" aria-label="Allega foto o video"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></button>
          <label class="vh" for="testo-chat">Messaggio</label>
          <textarea id="testo-chat" rows="1" placeholder="${contesto ? 'Scrivi solo la domanda' : `Scrivi a ${esc(D.coach.breve)}`}"></textarea>
          <button class="invia" type="submit" aria-label="Invia"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </form>`;
    // l'ultimo messaggio resta sopra la casella di scrittura (la pagina ha il margine apposta)
    requestAnimationFrame(() => window.scrollTo(0, document.documentElement.scrollHeight));
    if (contesto) document.getElementById('testo-chat').focus();
  }

  function aggiungi(msg) {
    const chat = A.leggi('pt-chat') || [];
    chat.push({ da: 'atleta', istante: A.istante(), ...msg });
    A.scrivi('pt-chat', chat);
    contesto = '';
    history.replaceState(null, '', location.pathname + location.search + '#coach');
    disegna();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const v = document.querySelector('[data-vista="coach"]');
    v.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = document.getElementById('testo-chat').value.trim();
      if (!t) return;
      aggiungi({ testo: t, contesto });
    });
    v.addEventListener('keydown', (e) => {
      if (e.target.id === 'testo-chat' && e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); v.querySelector('#scrivi').requestSubmit(); }
    });
    v.addEventListener('input', (e) => { if (e.target.id === 'testo-chat') { e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px'; } });
    v.addEventListener('click', (e) => {
      if (e.target.closest('#togli-contesto')) { contesto = ''; history.replaceState(null, '', location.pathname + location.search + '#coach'); disegna(); }
      if (e.target.closest('#allega')) document.getElementById('file-allegato').click();
    });
    document.getElementById('file-allegato').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) aggiungi({ tipo: 'allegato', immagine: f.type.startsWith('image'), nomeFile: f.name, testo: document.getElementById('testo-chat').value.trim(), contesto });
      e.target.value = '';
    });
  });

  A.viste.coach = {
    render(param) {
      contesto = param || '';
      document.getElementById('voce-coach').classList.remove('novita');
      disegna();
    },
  };
})();
