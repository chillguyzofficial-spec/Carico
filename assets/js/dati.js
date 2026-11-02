// Dati dimostrativi condivisi da app (index.html) e gestionale del coach (coach.html).
// Settimana tipo di Marco: lun Gambe A · mar Pull A · mer riposo · gio Push A · ven Gambe B · sab riposo · dom Pull B.
window.DATI = {
  coach: { nome: 'Luca Ferri', breve: 'Luca', ruolo: 'Personal trainer', foto: 'assets/foto/coach-luca.webp' },

  atleta: {
    nome: 'Marco', cognome: 'Rossi', foto: 'assets/foto/atleta-marco.webp',
    settimana: 6, settimane: 12, programma: 'Push · Pull · Gambe',
  },

  // Allenamenti del programma
  allenamenti: {
    'gambe-a': { nome: 'Gambe A', breve: 'Gambe', muscoli: 'Quadricipiti · Glutei · Femorali', esercizi: 6, minuti: 58, foto: 'hero-gambe' },
    'pull-a':  { nome: 'Pull A',  breve: 'Pull',  muscoli: 'Dorso · Bicipiti · Deltoidi posteriori', esercizi: 6, minuti: 52, foto: 'hero-pull' },
    'push-a':  { nome: 'Push A',  breve: 'Push',  muscoli: 'Petto · Spalle · Tricipiti', esercizi: 6, minuti: 54, foto: 'hero-push' },
    'gambe-b': { nome: 'Gambe B', breve: 'Gambe', muscoli: 'Femorali · Glutei · Polpacci', esercizi: 5, minuti: 50, foto: 'hero-gambe' },
    'pull-b':  { nome: 'Pull B',  breve: 'Pull',  muscoli: 'Dorso · Bicipiti · Deltoidi posteriori', esercizi: 6, minuti: 50, foto: 'hero-pull' },
  },

  // Lunedì → domenica (null = riposo)
  settimana: ['gambe-a', 'pull-a', null, 'push-a', 'gambe-b', null, 'pull-b'],

  riposo: 'Recupero completo. Se ti va, 20–30 minuti di camminata e 10 di mobilità per anche e spalle.',

  // Progressi principali (6 settimane, kg per 8 o 5 ripetizioni)
  progressi: {
    'panca':  { nome: 'Panca piana', kg: 70, reps: 8, delta: '+12% in 6 settimane', punti: [62.5, 65, 65, 67.5, 70, 70] },
    'squat':  { nome: 'Squat', kg: 80, reps: 8, delta: '+10% in 6 settimane', punti: [72.5, 75, 75, 77.5, 77.5, 80] },
    'stacco': { nome: 'Stacco da terra', kg: 120, reps: 5, delta: '+9% in 6 settimane', punti: [110, 112.5, 112.5, 115, 117.5, 120] },
    'rematore': { nome: 'Rematore con bilanciere', kg: 67.5, reps: 8, delta: '+8% in 6 settimane', punti: [62.5, 62.5, 65, 65, 67.5, 67.5] },
  },

  // Esercizi di ogni allenamento.
  // kg = target di oggi · prec = serie dell'ultima volta [kg, reps] · best = miglior carico alle reps del target · inizio = carico della settimana 1
  // demo = miniatura del video del coach (assets/foto/demo-*.webp) · rec = recupero in secondi
  esercizi: {
    'push-a': [
      { nome: 'Panca piana', serie: 4, reps: 8, kg: 72.5, rec: 120, prec: [[70, 8], [70, 8], [70, 8], [70, 7]], best: 70, inizio: 62.5, nota: 'Scapole addotte, piedi fermi a terra.', alt: ['Panca piana con manubri', 'Chest press'], demo: null },
      { nome: 'Lento avanti', serie: 3, reps: 8, kg: 42.5, rec: 90, prec: [[40, 8], [40, 8], [40, 8]], best: 40, inizio: 35, nota: 'Glutei contratti, niente arco nella schiena.', alt: ['Lento con manubri da seduto'], demo: 'demo-lento', durata: '0:22' },
      { nome: 'Spinte inclinate con manubri', serie: 3, reps: 10, kg: 26, rec: 90, prec: [[24, 10], [24, 10], [24, 9]], best: 24, inizio: 20, nota: '', demo: null },
      { nome: 'Croci ai cavi', serie: 3, reps: 12, kg: 15, rec: 60, prec: [[15, 12], [15, 12], [15, 11]], best: 15, inizio: 12.5, nota: 'Gomiti morbidi, chiudi lento.', demo: null },
      { nome: 'Alzate laterali', serie: 3, reps: 15, kg: 10, rec: 60, prec: [[10, 15], [10, 14], [10, 13]], best: 10, inizio: 8, nota: '', demo: null },
      { nome: 'Pushdown ai cavi', serie: 3, reps: 12, kg: 25, rec: 60, prec: [[22.5, 12], [22.5, 12], [22.5, 12]], best: 22.5, inizio: 20, nota: '', demo: null },
    ],
    'gambe-a': [
      { nome: 'Squat', serie: 3, reps: 8, kg: 80, rec: 150, prec: [[77.5, 8], [77.5, 8], [77.5, 8]], best: 77.5, inizio: 72.5, nota: 'Registrami la terza serie, di profilo.', alt: ['Hack squat', 'Pressa 45°'], demo: null, video: true },
      { nome: 'Stacco rumeno', serie: 3, reps: 10, kg: 70, rec: 120, prec: [[67.5, 10], [67.5, 10], [67.5, 10]], best: 67.5, inizio: 60, nota: 'Bilanciere vicino alle gambe.', demo: null },
      { nome: 'Pressa', serie: 3, reps: 12, kg: 160, rec: 90, prec: [[150, 12], [150, 12], [150, 12]], best: 150, inizio: 130, nota: '', demo: null },
      { nome: 'Affondi con manubri', serie: 3, reps: 10, kg: 18, rec: 90, prec: [[16, 10], [16, 10], [16, 10]], best: 16, inizio: 12, nota: 'Ginocchio dietro quasi a terra.', demo: 'demo-affondi', durata: '0:18' },
      { nome: 'Leg curl', serie: 3, reps: 12, kg: 40, rec: 60, prec: [[37.5, 12], [37.5, 12], [37.5, 11]], best: 37.5, inizio: 30, nota: '', demo: null },
      { nome: 'Calf raise in piedi', serie: 4, reps: 15, kg: 60, rec: 45, prec: [[60, 15], [60, 15], [60, 14], [60, 13]], best: 60, inizio: 50, nota: '', demo: null },
    ],
    'pull-a': [
      { nome: 'Trazioni zavorrate', serie: 4, reps: 6, kg: 5, rec: 120, prec: [[2.5, 6], [2.5, 6], [2.5, 6], [2.5, 5]], best: 2.5, inizio: 0, nota: 'Mento sopra la sbarra, scendi fino in fondo.', demo: 'demo-trazioni', durata: '0:16' },
      { nome: 'Rematore con bilanciere', serie: 4, reps: 8, kg: 70, rec: 120, prec: [[67.5, 8], [67.5, 8], [67.5, 8], [67.5, 8]], best: 67.5, inizio: 62.5, nota: 'Busto fermo, tira verso l’ombelico.', alt: ['Rematore al cavo basso'], demo: 'demo-rematore', durata: '0:20' },
      { nome: 'Lat machine', serie: 3, reps: 10, kg: 60, rec: 90, prec: [[57.5, 10], [57.5, 10], [57.5, 9]], best: 57.5, inizio: 50, nota: '', demo: null },
      { nome: 'Face pull', serie: 3, reps: 15, kg: 20, rec: 60, prec: [[20, 15], [20, 15], [20, 15]], best: 20, inizio: 15, nota: '', demo: null },
      { nome: 'Curl con bilanciere', serie: 3, reps: 10, kg: 30, rec: 60, prec: [[27.5, 10], [27.5, 10], [27.5, 9]], best: 27.5, inizio: 25, nota: '', demo: null },
      { nome: 'Curl a martello', serie: 3, reps: 12, kg: 14, rec: 60, prec: [[14, 12], [14, 11], [14, 10]], best: 14, inizio: 12, nota: '', demo: null },
    ],
    'gambe-b': [
      { nome: 'Stacco da terra', serie: 3, reps: 5, kg: 122.5, rec: 180, prec: [[120, 5], [120, 5], [120, 5]], best: 120, inizio: 110, nota: 'Schiena neutra, spingi il pavimento.', alt: ['Stacco con trap bar'], demo: 'demo-stacco', durata: '0:24' },
      { nome: 'Hip thrust', serie: 3, reps: 10, kg: 100, rec: 120, prec: [[95, 10], [95, 10], [95, 10]], best: 95, inizio: 80, nota: 'Fermati un secondo in alto.', demo: 'demo-hip-thrust', durata: '0:19' },
      { nome: 'Squat bulgaro', serie: 3, reps: 10, kg: 16, rec: 90, prec: [[14, 10], [14, 10], [14, 10]], best: 14, inizio: 10, nota: '', demo: null },
      { nome: 'Leg curl', serie: 3, reps: 12, kg: 40, rec: 60, prec: [[40, 12], [40, 11], [40, 11]], best: 40, inizio: 30, nota: '', demo: null },
      { nome: 'Calf raise seduto', serie: 4, reps: 15, kg: 40, rec: 45, prec: [[40, 15], [40, 15], [40, 15], [40, 14]], best: 40, inizio: 30, nota: '', demo: null },
    ],
    'pull-b': [
      { nome: 'Rematore con manubrio', serie: 4, reps: 10, kg: 32, rec: 90, prec: [[30, 10], [30, 10], [30, 10], [30, 9]], best: 30, inizio: 26, nota: 'Una mano sulla panca, schiena piatta.', demo: null },
      { nome: 'Trazioni presa neutra', serie: 4, reps: 8, kg: 0, rec: 120, prec: [[0, 8], [0, 8], [0, 7], [0, 7]], best: 0, inizio: 0, nota: '', demo: null },
      { nome: 'Pulley basso', serie: 3, reps: 12, kg: 55, rec: 90, prec: [[52.5, 12], [52.5, 12], [52.5, 11]], best: 52.5, inizio: 45, nota: '', demo: null },
      { nome: 'Alzate posteriori', serie: 3, reps: 15, kg: 8, rec: 60, prec: [[8, 15], [8, 15], [8, 14]], best: 8, inizio: 6, nota: '', demo: null },
      { nome: 'Curl su panca inclinata', serie: 3, reps: 10, kg: 12, rec: 60, prec: [[12, 10], [12, 10], [12, 9]], best: 12, inizio: 10, nota: '', demo: null },
      { nome: 'Curl ai cavi', serie: 3, reps: 12, kg: 20, rec: 60, prec: [[20, 12], [20, 12], [20, 11]], best: 20, inizio: 15, nota: '', demo: null },
    ],
  },

  // Chat con il coach: messaggi precedenti (giorno = giorni dal lunedì della settimana in corso, negativo = settimana scorsa)
  chat: [
    { da: 'atleta', giorno: -2, ora: '10:05', testo: 'Sul lento avanti posso usare la cintura?', contesto: 'Lento avanti · Push A · Serie 2 · 40 kg × 8' },
    { da: 'coach', giorno: -2, ora: '11:32', testo: 'Per ora no: sotto i 50 kg impari a tenere l’addome da solo. Ne riparliamo al prossimo blocco.' },
    { da: 'coach', giorno: 0, ora: '07:55', tipo: 'carico', esercizio: 'Squat', da_kg: '77,5', a_kg: '80', testo: 'La settimana scorsa 77,5 × 8 senza sforzo. Oggi 80 kg: registrami la terza serie.' },
    { da: 'atleta', giorno: 0, ora: '18:42', tipo: 'video', testo: 'Ecco la terza serie.', contesto: 'Squat · Gambe A · Serie 3 · 80 kg × 8' },
  ],
  // Quale progresso mostrare in base all'allenamento del giorno
  progressoDelGiorno: { 'push-a': 'panca', 'pull-a': 'rematore', 'pull-b': 'rematore', 'gambe-a': 'stacco', 'gambe-b': 'squat', riposo: 'stacco' },

  // Aggiornamenti di carico dal coach, per il giorno in cui servono
  carichi: {
    'gambe-a': { esercizio: 'Squat', da: '77,5', a: '80', ora: '07:55', nota: 'La settimana scorsa 77,5 × 8 senza sforzo. Oggi 80 kg: registrami la terza serie.' },
    'push-a':  { esercizio: 'Lento avanti', da: '40', a: '42,5', ora: '09:42', nota: 'Hai chiuso 3 × 8 pulite due sessioni di fila. Oggi sali di 2,5 kg, stesse ripetizioni.' },
  },

  // Video di Marco in revisione: lo squat di lunedì (Gambe A)
  video: {
    id: 'marco-squat', esercizio: 'Squat', kg: 80, reps: 8, durata: '0:14', foto: 'assets/foto/video-squat-s8.webp',
    allenamento: 'Gambe A', giorno: 0, ora: '18:42',
    serie: [[80, 8, '7,5'], [80, 8, '8'], [80, 8, '8,5']],
    prima: 'Settimana 5: 77,5 kg × 8 · nota atleta: «ultima ripetizione dura»',
  },
  // Feedback già inviato dal coach lunedì sera (se il gestionale non ne ha mandato uno nuovo)
  feedbackPredefinito: {
    tecnica: 'Tecnica ottima', carico: 'Mantieni il carico', ora: '21:14', giorno: 0,
    nota: "Profondità costante fino all'ultima ripetizione. Venerdì resta a 80 kg.",
  },

  // Gestionale: altri atleti
  coda: [
    { id: 'marco-squat', nome: 'Marco Rossi', foto: 'assets/foto/atleta-marco.webp', chip: ['info', 'Video'], testo: 'Video · Squat 80 kg × 8 · 0:14', quando: 'video' },
    { id: 'elena', nome: 'Elena Ricci', ini: 'ER', chip: ['avviso', 'Dolore segnalato'], testo: 'Check-in · Fastidio al ginocchio sinistro, 3 su 10', quando: '3 h' },
    { id: 'davide', nome: 'Davide Moretti', ini: 'DM', chip: ['neutro', 'Gara tra 3 settimane'], testo: 'Video · Stacco 180 kg × 3 · 0:19', quando: '5 h' },
    { id: 'sara', nome: 'Sara Gallo', ini: 'SG', chip: ['errore', 'Da contattare'], testo: 'Due allenamenti saltati · nessun messaggio', quando: 'ieri' },
    { id: 'giulia', nome: 'Giulia Bianchi', ini: 'GB', chip: ['neutro', 'Check-in'], testo: 'Check-in settimana 3 · sonno 6 h, energia buona', quando: 'ieri' },
    { id: 'andrea', nome: 'Andrea Conti', ini: 'AC', chip: ['neutro', 'Video'], testo: 'Video · Panca piana 100 kg × 6 · 0:17', quando: 'sab' },
  ],

  // Tabella atleti: f = fatto, s = saltato, r = riposo, p = previsto
  atleti: [
    { nome: 'Marco Rossi', programma: 'Push · Pull · Gambe', settimana: '6 di 12', giorni: 'ffrffrf', chiave: 'Squat 80 × 8', punti: [72.5, 75, 75, 77.5, 77.5, 80], stato: ['ok', 'In linea'] },
    { nome: 'Davide Moretti', programma: 'Powerlifting · picco', settimana: '11 di 16', giorni: 'frfrffr', chiave: 'Stacco 180 × 3', punti: [165, 167.5, 167.5, 172.5, 177.5, 180], stato: ['ok', 'In linea'] },
    { nome: 'Elena Ricci', programma: 'Rientro post infortunio', settimana: '4 di 8', giorni: 'frfrfrp', chiave: 'Squat goblet 20 × 10', punti: [14, 16, 18, 18, 20, 20], stato: ['avviso', 'Da seguire'] },
    { nome: 'Sara Gallo', programma: 'Ricomposizione', settimana: '2 di 10', giorni: 'frsrsrp', chiave: 'Hip thrust 60 × 10', punti: [55, 60, 60, 60, 60, 60], stato: ['errore', 'Da contattare'] },
    { nome: 'Giulia Bianchi', programma: 'Forza 5 × 5', settimana: '3 di 8', giorni: 'frfrfrr', chiave: 'Squat 70 × 5', punti: [60, 65, 70], stato: ['ok', 'In linea'] },
    { nome: 'Andrea Conti', programma: 'Ipertrofia · blocco 2', settimana: '9 di 12', giorni: 'ffrfffr', chiave: 'Panca piana 100 × 6', punti: [92.5, 95, 95, 97.5, 97.5, 100], stato: ['ok', 'In linea'] },
  ],

  chiaveFeedback: 'pt-feedback-marco', // localStorage: il gestionale scrive, l'app legge
};
