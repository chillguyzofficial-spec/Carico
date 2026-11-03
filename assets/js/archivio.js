// Archivio condiviso da app (app.html) e gestionale del coach (coach.html).
// Oggi i dati stanno nella memoria del browser (localStorage): app e gestionale si parlano solo
// sullo stesso computer e browser. Per farli parlare tra telefono e PC basta cambiare QUESTO file
// con un database online (es. Supabase o Cloudflare): il resto dell'app usa solo queste funzioni.
//
// Più atleti (richiesta di Francesco 2026-11-03: «il pt deve poter aggiungere un alunno dandogli una scheda»):
// ogni atleta ha i suoi dati. Marco usa le chiavi di sempre (pt-sessione-…), gli altri pt-<id>-sessione-… .
// datiDi(id) restituisce i dati di un atleta (programma, piano, settimana) pronti per app e gestionale.
(function () {
  const leggi = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const scrivi = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* senza memoria si continua lo stesso */ } };
  const chiavi = (prefisso) => { try { return Object.keys(localStorage).filter((k) => k.startsWith(prefisso)).sort(); } catch (e) { return []; } };
  // Avvisa quando l'altra parte (app o gestionale, in un'altra scheda) cambia qualcosa
  const ascolta = (prefisso, fn) => window.addEventListener('storage', (e) => { if (e.key === null || e.key.includes(prefisso.replace(/^pt-/, ''))) fn(e.key); });

  const isoData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const lunediDi = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));

  // ---------- Atleti ----------
  // Marco è quello della demo; gli altri li aggiunge il coach (pt-atleti). Ognuno ha un codice d'invito.
  const CHIAVE_ATLETI = 'pt-atleti';
  // Tre account di prova (richiesta di Francesco 2026-11-03): Marco (quello di sempre), una appena iscritta, uno avanzatissimo
  const lunediOggi = isoData(lunediDi(new Date()));
  const PROVA = [
    { id: 'marco', codice: 'LUCA26', obiettivo: 'Forza e massa', prova: true },
    { id: 'giulia', codice: 'LUCA11', nome: 'Giulia', cognome: 'Bianchi', obiettivo: 'Tonificazione', modello: 'intero-2', modo: 'flessibile', aSettimana: 2, inizio: lunediOggi, settimane: 12, prova: true },
    { id: 'davide', codice: 'LUCA99', nome: 'Davide', cognome: 'Moretti', obiettivo: 'Powerlifting · gara a fine blocco', modello: 'ppl-5', modo: 'fissi', aSettimana: 5, settimane: 16, avanzato: { settimana: 11, scala: 1.45 }, prova: true },
  ];
  const atleti = () => PROVA.concat(leggi(CHIAVE_ATLETI) || []);
  const atletaDaCodice = (c) => atleti().find((a) => a.codice === String(c || '').trim().toUpperCase()) || null;
  // Chiave di un dato per un atleta: Marco usa le chiavi di sempre, gli altri hanno il loro prefisso
  const chiavePer = (id) => (base) => (id === 'marco' ? base : base.replace(/^pt-/, `pt-${id}-`));

  // ---------- Programma (serie, ripetizioni, chili e nota cambiati dal coach) ----------
  const CHIAVE_PROGRAMMA = 'pt-programma-marco';
  function applicaProgramma(D) {
    const modifiche = leggi(D.k(CHIAVE_PROGRAMMA)) || {};
    Object.values(D.esercizi).flat().forEach((e) => { if (e.originale) Object.assign(e, e.originale); }); // si riparte dal programma base
    Object.entries(modifiche).forEach(([all, lista]) => {
      (D.esercizi[all] || []).forEach((e, i) => {
        const m = lista[i];
        if (!m) return;
        if (!e.originale) e.originale = { serie: e.serie, reps: e.reps, kg: e.kg, nota: e.nota };
        Object.assign(e, m);
      });
    });
    return modifiche;
  }

  // ---------- Settimana (spostamenti e salti dell'atleta, pt-settimana-<lunedì>) ----------
  const chiaveSettimana = (D, d = new Date()) => D.k('pt-settimana-' + isoData(lunediDi(d)));
  // Gli spostamenti valgono solo per il piano con cui sono stati fatti (se il coach cambia piano, si riparte)
  const firmaPiano = (D) => D.piano ? `${D.piano.id}/${D.piano.modo}/${D.piano.aSettimana}` : '';
  function settimanaDi(D) {
    const s = leggi(chiaveSettimana(D));
    return s && s.piano === firmaPiano(D) ? s : { piano: firmaPiano(D), giorni: D.settimanaBase.slice(), saltati: [], cambi: [] };
  }
  function applicaSettimana(D) {
    if (!D.settimanaBase) D.settimanaBase = D.settimana.slice(); // il programma del coach, lunedì → domenica
    const s = leggi(chiaveSettimana(D));
    D.settimana = s && s.giorni && s.piano === firmaPiano(D) ? s.giorni.slice() : D.settimanaBase.slice();
  }

  // ---------- Piano (modello, modo fissi / quando vuole, allenamenti a settimana) ----------
  const CHIAVE_PIANO = 'pt-piano-marco';
  const SCHEMI = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 3, 4, 6], 6: [0, 1, 2, 3, 4, 5] }; // giorni fissi per N a settimana
  function applicaPiano(D) {
    if (!window.MODELLI) return;
    const p = leggi(D.k(CHIAVE_PIANO)) || {};
    const m = window.MODELLI.find((x) => x.id === p.modello) || window.MODELLI.find((x) => x.id === D.modelloBase);
    const n = p.aSettimana || D.nBase || m.aSettimana, modo = p.modo || D.modoBase || m.modo;
    const giorni = n === m.aSettimana ? m.giorni.slice() : Array.from({ length: 7 }, () => null);
    if (n !== m.aSettimana) SCHEMI[n].forEach((g, j) => { giorni[g] = m.sequenza[j % m.sequenza.length]; });
    D.piano = { id: m.id, nome: m.nome, livello: m.livello, modo, aSettimana: n, sequenza: m.sequenza, giorniFissi: giorni, storico: n === m.aSettimana ? m.storico : SCHEMI[n] };
    D.atleta.programma = m.nome;
    D.settimanaBase = modo === 'fissi' ? giorni : Array.from({ length: 7 }, () => null); // flessibile: i giorni li decide l'atleta
    D.settimana = D.settimanaBase.slice();
  }

  // ---------- Dati di un atleta ----------
  const BASE = window.DATI ? JSON.parse(JSON.stringify(window.DATI, (k, v) => (v === Infinity ? '∞' : v)), (k, v) => (v === '∞' ? Infinity : v)) : null;
  const copia = () => JSON.parse(JSON.stringify(BASE), (k, v) => (v === '∞' ? Infinity : v));
  function datiDi(id) {
    const D = copia();
    D.id = id; D.k = chiavePer(id);
    const av = (atleti().find((x) => x.id === id) || {}).avanzato;
    if (id === 'marco') { D.storia = true; D.storicoFatti = [22, 25]; D.scala = 1; } // la storia della demo: 5 settimane già fatte
    else if (av) {
      // Atleta avanzato: stessa struttura dello storico di Marco, carichi da powerlifter e 10 settimane già fatte
      const a = atleti().find((x) => x.id === id), r = (n) => Math.round(n * av.scala / 2.5) * 2.5;
      D.atleta = { nome: a.nome, cognome: a.cognome, foto: null, settimana: av.settimana, settimane: a.settimane, programma: '', obiettivo: a.obiettivo };
      D.modelloBase = a.modello; D.modoBase = a.modo; D.nBase = a.aSettimana;
      Object.values(D.esercizi).flat().forEach((e) => {
        if (/^Trazioni/.test(e.nome)) { e.kg += 15; e.best += 15; e.prec = e.prec.map(([k, n]) => [k + 15, n]); return; } // zavorra
        e.kg = r(e.kg); e.best = r(e.best); e.inizio = r(e.inizio); e.prec = e.prec.map(([k, n]) => [r(k), n]); e.video = false;
      });
      Object.values(D.progressi).forEach((p) => { p.kg = r(p.kg); p.punti = p.punti.map(r); });
      D.chat = []; D.carichi = {}; D.video = null; D.feedbackPredefinito = null;
      D.chiaveFeedback = D.k('pt-feedback-marco');
      D.storia = true; D.storicoFatti = [48, 50]; D.scala = av.scala;
    } else {
      const a = atleti().find((x) => x.id === id);
      const inizio = new Date(a.inizio + 'T12:00:00');
      const sett = Math.max(1, Math.floor((lunediDi(new Date()) - lunediDi(inizio)) / (7 * 86400000)) + 1);
      D.atleta = { nome: a.nome, cognome: a.cognome, foto: null, settimana: Math.min(sett, a.settimane), settimane: a.settimane, programma: '', obiettivo: a.obiettivo };
      D.modelloBase = a.modello; D.modoBase = a.modo; D.nBase = a.aSettimana;
      // Atleta nuovo: niente storico né carichi di Marco. I chili li mette il coach (o l'atleta alla prima seduta).
      Object.values(D.esercizi).flat().forEach((e) => { e.kg = 0; e.prec = []; e.best = Infinity; e.inizio = 0; e.nota = ''; e.video = false; });
      D.chat = []; D.carichi = {}; D.video = null; D.feedbackPredefinito = null; D.progressi = {};
      D.chiaveFeedback = D.k('pt-feedback-marco');
      D.storia = false; D.storicoFatti = [0, 0];
    }
    applicaPiano(D); applicaProgramma(D); applicaSettimana(D);
    return D;
  }
  // Atleta collegato nell'app (dal codice inserito al primo avvio); nel gestionale si sceglie a mano
  const collegato = leggi('pt-collegato');
  const attivo = collegato && collegato.atleta && atleti().some((a) => a.id === collegato.atleta) ? collegato.atleta : 'marco';

  window.ARCHIVIO = {
    leggi, scrivi, chiavi, ascolta, isoData, lunediDi,
    CHIAVE_ATLETI, atleti, atletaDaCodice, chiavePer, datiDi, attivo,
    CHIAVE_PROGRAMMA, applicaProgramma, chiaveSettimana, settimanaDi, applicaSettimana, firmaPiano,
    CHIAVE_PIANO, applicaPiano, SCHEMI,
  };
  if (window.DATI) window.DATI = datiDi(attivo); // l'app lavora sui dati dell'atleta collegato
})();
