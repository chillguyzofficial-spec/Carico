// Funzioni comuni dell'app atleta + navigazione tra le schermate (#oggi, #allenamento, #programma, #checkin, #coach).
// Il giorno si può forzare con ?giorno=1…7 (1 = lunedì) per vedere tutti gli stati.
(function () {
  const D = window.DATI;
  const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
  const BREVI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  const LETTERE = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

  const adesso = new Date();
  const scelto = Number(new URLSearchParams(location.search).get('giorno'));
  const oggi = scelto >= 1 && scelto <= 7 ? scelto - 1 : (adesso.getDay() + 6) % 7; // 0 = lunedì
  const lunedi = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate() - ((adesso.getDay() + 6) % 7));
  const data = (i) => new Date(lunedi.getFullYear(), lunedi.getMonth(), lunedi.getDate() + i);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kg = (n) => String(Math.round(n * 100) / 100).replace('.', ','); // due decimali: il disco da 1,25 non diventa «1,3»
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const leggi = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const scrivi = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* senza memoria si continua lo stesso */ } };

  const chiaveSessione = 'pt-sessione-' + iso(data(oggi));
  const chiaveCheckin = 'pt-checkin-s' + D.atleta.settimana;

  // Avviso in basso con «Annulla» (dalla tavola: «Serie 2 salvata · Annulla»)
  let timer = null;
  function avviso(titolo, testo, annulla) {
    const a = document.getElementById('avviso');
    a.querySelector('strong').textContent = titolo;
    a.querySelector('span:not(.spunta)').textContent = testo || '';
    const b = a.querySelector('button');
    b.hidden = !annulla;
    b.onclick = () => { a.classList.remove('su'); annulla && annulla(); };
    a.classList.add('su');
    clearTimeout(timer);
    timer = setTimeout(() => a.classList.remove('su'), annulla ? 5000 : 3000);
  }

  // ---------- Navigazione ----------
  const viste = {};
  const SENZA_MENU = ['allenamento', 'checkin', 'traguardo', 'benvenuto'];
  const collegato = () => !!leggi('pt-collegato');
  let primaVolta = true;
  function mostra() {
    // Passaggio animato tra schermate (View Transitions), tranne la prima volta e con «Riduci movimento»
    const fermo = primaVolta || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches;
    primaVolta = false;
    if (fermo) { cambia(); return; }
    const t = document.startViewTransition(cambia);
    t.ready.catch(() => {}); t.finished.catch(() => {}); // passaggio saltato se si tocca in fretta: non è un errore
  }
  function cambia() {
    let [nome, param] = (location.hash.slice(1) || 'oggi').split('/');
    if (!collegato()) nome = 'benvenuto'; // primo avvio: prima il codice del coach
    else if (nome === 'benvenuto') nome = 'oggi';
    const v = viste[nome] ? nome : 'oggi';
    document.querySelectorAll('.vista').forEach((s) => { s.hidden = s.dataset.vista !== v; });
    document.querySelector('.menu').hidden = SENZA_MENU.includes(v);
    document.querySelectorAll('.menu .voce').forEach((a) => {
      const attiva = a.getAttribute('href') === '#' + v;
      a.classList.toggle('attiva', attiva);
      attiva ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    document.getElementById('avviso').classList.remove('su'); // un avviso non segue in un'altra schermata
    viste[v].render(param ? decodeURIComponent(param) : '');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', mostra);
  document.addEventListener('DOMContentLoaded', mostra);

  window.APP = {
    D, GIORNI, BREVI, LETTERE, MESI, adesso, oggi, lunedi, data, iso,
    esc, kg, mmss, leggi, scrivi, avviso, viste, chiaveSessione, chiaveCheckin, mostra,
    vai: (h) => { if (location.hash === h) mostra(); else location.hash = h; },
    allenamentoDi: (i) => D.settimana[i] ? D.allenamenti[D.settimana[i]] : null,
    // «Adesso» nel giorno mostrato (con ?giorno= resta coerente con il resto della settimana)
    istante: () => { const d = data(oggi), n = new Date(); d.setHours(n.getHours(), n.getMinutes(), n.getSeconds()); return d.getTime(); },
  };
})();
