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
    'panca':  { nome: 'Panca piana', kg: 80, reps: 8, delta: '+12,5% in 6 settimane', punti: [71, 73, 75, 75, 77.5, 80] },
    'squat':  { nome: 'Squat', kg: 80, reps: 8, delta: '+10% in 6 settimane', punti: [72.5, 75, 75, 77.5, 77.5, 80] },
    'stacco': { nome: 'Stacco da terra', kg: 120, reps: 5, delta: '+9% in 6 settimane', punti: [110, 112.5, 112.5, 115, 117.5, 120] },
    'rematore': { nome: 'Rematore con bilanciere', kg: 70, reps: 8, delta: '+7,5% in 6 settimane', punti: [65, 65, 67.5, 67.5, 70, 70] },
  },
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
    { nome: 'Marco Rossi', programma: 'Push · Pull · Gambe', settimana: '6 di 12', giorni: 'ffrffrf', chiave: 'Panca piana 80 × 8', punti: [71, 73, 75, 75, 77.5, 80], stato: ['ok', 'In linea'] },
    { nome: 'Davide Moretti', programma: 'Powerlifting · picco', settimana: '11 di 16', giorni: 'frfrffr', chiave: 'Stacco 180 × 3', punti: [165, 167.5, 167.5, 172.5, 177.5, 180], stato: ['ok', 'In linea'] },
    { nome: 'Elena Ricci', programma: 'Rientro post infortunio', settimana: '4 di 8', giorni: 'frfrfrp', chiave: 'Squat goblet 20 × 10', punti: [14, 16, 18, 18, 20, 20], stato: ['avviso', 'Da seguire'] },
    { nome: 'Sara Gallo', programma: 'Ricomposizione', settimana: '2 di 10', giorni: 'frsrsrp', chiave: 'Hip thrust 60 × 10', punti: [55, 60, 60, 60, 60, 60], stato: ['errore', 'Da contattare'] },
    { nome: 'Giulia Bianchi', programma: 'Forza 5 × 5', settimana: '3 di 8', giorni: 'frfrfrr', chiave: 'Squat 70 × 5', punti: [60, 65, 70], stato: ['ok', 'In linea'] },
    { nome: 'Andrea Conti', programma: 'Ipertrofia · blocco 2', settimana: '9 di 12', giorni: 'ffrfffr', chiave: 'Panca piana 100 × 6', punti: [92.5, 95, 95, 97.5, 97.5, 100], stato: ['ok', 'In linea'] },
  ],

  chiaveFeedback: 'pt-feedback-marco', // localStorage: il gestionale scrive, l'app legge
};
