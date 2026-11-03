// La settimana di Marco non è più fissa (richiesta di Francesco 2026-11-03: «se non rispetto quel giorno che succede?»).
// - Un allenamento si può SPOSTARE su un altro giorno della settimana (se c'è già un allenamento, si scambiano).
// - Un allenamento passato e non fatto è «non fatto»: in Oggi si sceglie «Fallo oggi» oppure «Lo salto».
// - Il coach vede spostamenti e salti nel gestionale (archivio comune, pt-settimana-<lunedì>).
// Gli spostamenti valgono per la settimana in corso: la settimana dopo riparte dal programma del coach.
(function () {
  const A = window.APP, D = A.D, AR = window.ARCHIVIO;

  const sessione = (i) => A.leggi('pt-sessione-' + A.iso(A.data(i)));
  const iniziata = (s) => !!(s && s.es && s.es.some((e) => e.serie.some((r) => r.fatta)));

  // ---------- Modo «N a settimana, quando vuoi» (scelto dal coach nel gestionale) ----------
  // Nessun giorno fisso: oggi l'app propone il prossimo allenamento della sequenza, finché non hai fatto gli N della settimana.
  // Se oggi non ti alleni, domani te lo ripropone: niente «non fatto» da recuperare.
  const flessibile = D.piano && D.piano.modo === 'flessibile';
  let fattiPrima = 0; // allenamenti fatti questa settimana prima di oggi
  if (flessibile) {
    const seq = D.piano.sequenza, N = D.piano.aSettimana, base = (D.atleta.settimana - 1) * N;
    for (let i = 0; i < A.oggi; i++) {
      const s = sessione(i);
      // Nella storia della demo il lunedì è fatto (lo squat che il coach ha appena rivisto)
      if (iniziata(s) || (i === 0 && !s)) { D.settimana[i] = (s && s.k) || seq[(base + fattiPrima) % seq.length]; fattiPrima++; }
    }
    const s = sessione(A.oggi);
    D.settimana[A.oggi] = s && s.k ? s.k : fattiPrima < N ? seq[(base + fattiPrima) % seq.length] : null;
  }

  // fatto · oggi · previsto · riposo · nonfatto (passato, da decidere) · saltato (scelto dall'atleta)
  function stato(i) {
    const k = D.settimana[i], s = sessione(i);
    if (!k) return 'riposo';
    if (flessibile) return i < A.oggi || (s && s.finito) ? 'fatto' : 'oggi';
    if (s && s.finito) return 'fatto';
    if (i === A.oggi) return 'oggi';
    if (i > A.oggi) return 'previsto';
    if (iniziata(s)) return 'fatto';
    if (AR.settimanaDi(D).saltati.includes(i)) return 'saltato';
    // Nella storia della demo il lunedì è fatto (lo squat che il coach ha appena rivisto)
    if (i === 0 && D.settimanaBase[0] === k && !AR.settimanaDi(D).cambi.some((c) => c.da === 0 || c.a === 0)) return 'fatto';
    return 'nonfatto';
  }
  // Il più recente allenamento passato non fatto (quello da proporre in Oggi)
  const daRecuperare = () => { if (flessibile) return -1; for (let i = A.oggi - 1; i >= 0; i--) if (stato(i) === 'nonfatto') return i; return -1; };
  // Quanti allenamenti fatti questa settimana (anche oggi, se finito) su quanti previsti
  function conto() {
    const n = flessibile ? D.piano.aSettimana : D.settimana.filter(Boolean).length;
    const fatti = D.settimana.reduce((t, k, i) => t + (k && stato(i) === 'fatto' ? 1 : 0), 0);
    return { fatti, n, numero: Math.min(n, (flessibile ? fattiPrima : D.settimana.slice(0, A.oggi).filter(Boolean).length) + 1) };
  }
  // Primo giorno libero dopo oggi (per spostare l'allenamento di oggi quando si recupera)
  const liberoDopo = (da) => { for (let j = da + 1; j < 7; j++) if (!D.settimana[j]) return j; return -1; };

  function salva(s) { AR.scrivi(AR.chiaveSettimana(), s); AR.applicaSettimana(D); }
  // Sposta l'allenamento del giorno «da» al giorno «a» (scambio se «a» ne ha già uno)
  function sposta(da, a, s = AR.settimanaDi(D)) {
    const k = s.giorni[da];
    [s.giorni[a], s.giorni[da]] = [s.giorni[da], s.giorni[a]];
    s.cambi.push({ k, da, a, quando: Date.now() });
    s.saltati = s.saltati.filter((x) => x !== da && x !== a);
    return s;
  }
  function ricarica() { location.hash = '#oggi'; location.reload(); } // l'allenamento di oggi cambia: si riparte puliti

  A.piano = {
    stato, daRecuperare, liberoDopo, flessibile, conto,
    sposta(da, a) { salva(sposta(da, a)); ricarica(); },
    // Dove si può recuperare: oggi, se è libero o se l'allenamento di oggi non è ancora iniziato
    // (allora quello di oggi va al primo giorno libero dopo); se oggi è già iniziato, il primo giorno libero dopo.
    dove() {
      if (!D.settimana[A.oggi]) return { giorno: A.oggi, sposta: -1 };
      const j = liberoDopo(A.oggi);
      if (j < 0) return null;
      return iniziata(sessione(A.oggi)) ? { giorno: j, sposta: -1 } : { giorno: A.oggi, sposta: j };
    },
    recupera(i) {
      const d = A.piano.dove();
      if (!d) return false;
      let s = AR.settimanaDi(D);
      if (d.sposta >= 0) s = sposta(A.oggi, d.sposta, s);
      salva(sposta(i, d.giorno, s)); ricarica(); return true;
    },
    salta(i) { const s = AR.settimanaDi(D); if (!s.saltati.includes(i)) s.saltati.push(i); salva(s); },
    annullaSalto(i) { const s = AR.settimanaDi(D); s.saltati = s.saltati.filter((x) => x !== i); salva(s); },
  };
})();
