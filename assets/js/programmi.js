// Modelli di programma che il coach assegna a ogni atleta dal gestionale (richiesta di Francesco 2026-11-03:
// «se fossero diverse da persona a persona, chi inizia 3 settimane, chi è più allenato 2...»).
// Due modi: «fissi» (ogni allenamento ha il suo giorno, si può spostare) e «flessibile» (N a settimana, quando vuoi:
// l'app propone il prossimo della sequenza). Gli esercizi vengono da quelli di Marco: stessi carichi e storico.
(function () {
  const D = window.DATI;
  const tutti = Object.values(D.esercizi).flat();
  // Copia un esercizio del programma di Marco cambiando serie e ripetizioni
  const es = (nome, serie, reps) => {
    const base = tutti.find((e) => e.nome === nome);
    return { ...base, serie, reps, prec: base.prec.slice(0, serie).map((p) => [p[0], reps]), video: false, nota: base.nota };
  };
  const all = (nome, breve, muscoli, foto, lista) => ({ meta: { nome, breve, muscoli, esercizi: lista.length, minuti: 15 + lista.reduce((t, e) => t + e.serie * 3, 0), foto }, lista });

  const NUOVI = {
    'intero-a': all('Corpo intero A', 'Intero', 'Gambe · Petto · Schiena', 'hero-gambe', [es('Squat', 3, 8), es('Panca piana', 3, 8), es('Rematore con bilanciere', 3, 10), es('Leg curl', 3, 12), es('Alzate laterali', 2, 15)]),
    'intero-b': all('Corpo intero B', 'Intero', 'Femorali · Spalle · Dorso', 'hero-pull', [es('Stacco rumeno', 3, 10), es('Lento avanti', 3, 8), es('Lat machine', 3, 10), es('Affondi con manubri', 2, 10), es('Face pull', 2, 15)]),
    'intero-c': all('Corpo intero C', 'Intero', 'Gambe · Petto · Glutei', 'hero-push', [es('Pressa', 3, 12), es('Spinte inclinate con manubri', 3, 10), es('Rematore con manubrio', 3, 10), es('Hip thrust', 3, 10), es('Curl con bilanciere', 2, 12)]),
    'sopra-a': all('Sopra A', 'Sopra', 'Petto · Schiena · Spalle', 'hero-push', [es('Panca piana', 4, 6), es('Rematore con bilanciere', 4, 8), es('Lento avanti', 3, 8), es('Lat machine', 3, 10), es('Pushdown ai cavi', 2, 12)]),
    'sotto-a': all('Sotto A', 'Sotto', 'Quadricipiti · Femorali · Polpacci', 'hero-gambe', [es('Squat', 4, 6), es('Stacco rumeno', 3, 8), es('Leg curl', 3, 12), es('Calf raise in piedi', 3, 15)]),
    'sopra-b': all('Sopra B', 'Sopra', 'Petto alto · Dorso · Braccia', 'hero-pull', [es('Spinte inclinate con manubri', 3, 10), es('Pulley basso', 3, 12), es('Alzate laterali', 3, 15), es('Curl con bilanciere', 3, 10), es('Face pull', 3, 15)]),
    'sotto-b': all('Sotto B', 'Sotto', 'Glutei · Femorali · Polpacci', 'hero-gambe', [es('Stacco da terra', 3, 5), es('Squat bulgaro', 3, 10), es('Hip thrust', 3, 10), es('Calf raise seduto', 3, 15)]),
  };
  Object.entries(NUOVI).forEach(([k, a]) => { D.allenamenti[k] = a.meta; D.esercizi[k] = a.lista; });

  // giorni = lunedì → domenica (modo fissi) · sequenza = ordine degli allenamenti (modo flessibile)
  // storico = giorni della settimana usati nelle settimane passate (per il calendario)
  window.MODELLI = [
    { id: 'intero-2', nome: 'Corpo intero', livello: 'Principiante', aSettimana: 2, modo: 'flessibile', sequenza: ['intero-a', 'intero-b'], giorni: ['intero-a', null, null, 'intero-b', null, null, null], storico: [0, 3] },
    { id: 'intero-3', nome: 'Corpo intero', livello: 'Base', aSettimana: 3, modo: 'flessibile', sequenza: ['intero-a', 'intero-b', 'intero-c'], giorni: ['intero-a', null, 'intero-b', null, 'intero-c', null, null], storico: [0, 2, 4] },
    { id: 'sopra-sotto-4', nome: 'Sopra · Sotto', livello: 'Intermedio', aSettimana: 4, modo: 'fissi', sequenza: ['sopra-a', 'sotto-a', 'sopra-b', 'sotto-b'], giorni: ['sopra-a', 'sotto-a', null, 'sopra-b', 'sotto-b', null, null], storico: [0, 1, 3, 4] },
    { id: 'ppl-5', nome: 'Push · Pull · Gambe', livello: 'Avanzato', aSettimana: 5, modo: 'fissi', sequenza: ['gambe-a', 'pull-a', 'push-a', 'gambe-b', 'pull-b'], giorni: D.settimana.slice(), storico: [0, 1, 3, 4, 6] },
  ];
  D.modelloBase = 'ppl-5'; // quello di Marco nella storia della demo
})();
