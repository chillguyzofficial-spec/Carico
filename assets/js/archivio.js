// Archivio condiviso da app (app.html) e gestionale del coach (coach.html).
// Oggi i dati stanno nella memoria del browser (localStorage): app e gestionale si parlano solo
// sullo stesso computer e browser. Per farli parlare tra telefono e PC basta cambiare QUESTO file
// con un database online (es. Supabase o Cloudflare): il resto dell'app usa solo queste funzioni.
(function () {
  const leggi = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const scrivi = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* senza memoria si continua lo stesso */ } };
  const chiavi = (prefisso) => { try { return Object.keys(localStorage).filter((k) => k.startsWith(prefisso)).sort(); } catch (e) { return []; } };
  // Avvisa quando l'altra parte (app o gestionale, in un'altra scheda) cambia qualcosa
  const ascolta = (prefisso, fn) => window.addEventListener('storage', (e) => { if (e.key === null || e.key.startsWith(prefisso)) fn(e.key); });

  // Programma dell'atleta: il coach cambia serie, ripetizioni, peso e nota di ogni esercizio dal gestionale.
  // Le modifiche si applicano sopra ai dati del programma (D.esercizi), per app e gestionale.
  const CHIAVE_PROGRAMMA = 'pt-programma-marco';
  function applicaProgramma(D) {
    const modifiche = leggi(CHIAVE_PROGRAMMA) || {};
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

  // Settimana dell'atleta: i giorni del programma si possono spostare (imprevisti) e un allenamento si può saltare.
  // Salvata per settimana (pt-settimana-<lunedì>): { giorni: [7 allenamenti o null], saltati: [indici], cambi: [{ k, da, a, quando }] }
  const isoData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const lunediDi = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  const chiaveSettimana = (d = new Date()) => 'pt-settimana-' + isoData(lunediDi(d));
  // Gli spostamenti valgono solo per il piano con cui sono stati fatti (se il coach cambia piano, si riparte)
  const firmaPiano = (D) => D.piano ? `${D.piano.id}/${D.piano.modo}/${D.piano.aSettimana}` : '';
  function settimanaDi(D) {
    const s = leggi(chiaveSettimana());
    return s && s.piano === firmaPiano(D) ? s : { piano: firmaPiano(D), giorni: D.settimanaBase.slice(), saltati: [], cambi: [] };
  }
  function applicaSettimana(D) {
    if (!D.settimanaBase) D.settimanaBase = D.settimana.slice(); // il programma del coach, lunedì → domenica
    const s = leggi(chiaveSettimana());
    D.settimana = s && s.giorni && s.piano === firmaPiano(D) ? s.giorni.slice() : D.settimanaBase.slice();
  }

  // Piano dell'atleta scelto dal coach: modello (programmi.js), modo (fissi / flessibile) e allenamenti a settimana
  const CHIAVE_PIANO = 'pt-piano-marco';
  const SCHEMI = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 3, 4, 6], 6: [0, 1, 2, 3, 4, 5] }; // giorni fissi per N a settimana
  function applicaPiano(D) {
    if (!window.MODELLI) return;
    const p = leggi(CHIAVE_PIANO) || {};
    const m = window.MODELLI.find((x) => x.id === p.modello) || window.MODELLI.find((x) => x.id === D.modelloBase);
    const n = p.aSettimana || m.aSettimana, modo = p.modo || m.modo;
    const giorni = n === m.aSettimana ? m.giorni.slice() : Array.from({ length: 7 }, () => null);
    if (n !== m.aSettimana) SCHEMI[n].forEach((g, j) => { giorni[g] = m.sequenza[j % m.sequenza.length]; });
    D.piano = { id: m.id, nome: m.nome, livello: m.livello, modo, aSettimana: n, sequenza: m.sequenza, giorniFissi: giorni, storico: n === m.aSettimana ? m.storico : SCHEMI[n] };
    D.atleta.programma = m.nome;
    D.settimanaBase = modo === 'fissi' ? giorni : Array.from({ length: 7 }, () => null); // flessibile: i giorni li decide l'atleta
    D.settimana = D.settimanaBase.slice();
  }

  window.ARCHIVIO = { leggi, scrivi, chiavi, ascolta, CHIAVE_PROGRAMMA, applicaProgramma, isoData, chiaveSettimana, settimanaDi, applicaSettimana, CHIAVE_PIANO, applicaPiano, firmaPiano, SCHEMI };
  if (window.DATI) { applicaPiano(window.DATI); applicaProgramma(window.DATI); applicaSettimana(window.DATI); }
})();
