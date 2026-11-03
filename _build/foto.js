// Prepara le foto per il web: da design-source/foto-chatgpt (PNG originali di ChatGPT)
// ad assets/foto (webp ridimensionati). Si lancia con: node _build/foto.js
// Usa Chromium (canvas → webp) perché sul PC non c'è sharp.
const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/Claude FK/.claude/projects/hedonè progetto serio/node_modules/playwright');

const RADICE = path.join(__dirname, '..');
const SORGENTE = path.join(RADICE, 'design-source', 'foto-chatgpt');
const USCITA = path.join(RADICE, 'assets', 'foto');

// crop = [x, y, larghezza, altezza] sull'originale; w = larghezza finale
const FOTO = [
  { da: 'Ritratto fitness in chiaroscuro drammatico.png', a: 'hero-push', w: 1180 },
  { da: 'Palestra Cinematica in Luce Blu.png', a: 'hero-pull', w: 1180 },
  { da: 'Interno industriale in cemento e ombre.png', a: 'hero-gambe', w: 1180 },
  { da: 'Palestra Blu con Pesi in Ombra.png', a: 'hero-riposo', w: 1180 },
  { da: 'Ritratto noir in bianco e nero.png', a: 'coach-luca', w: 240, crop: [330, 110, 720, 720] },
  { da: 'Ritratto di fatica in palestra.png', a: 'atleta-marco', w: 240, crop: [190, 40, 600, 600] },
  { da: 'Squat profondo in palestravetica.png', a: 'video-squat-s8', w: 600 },
  { da: 'Ritratto di fatica in palestra.png', a: 'record-marco', w: 600 },
  { da: 'Momento di concentrazione in palestra.png', a: 'onboarding', w: 1000 },
  { da: 'Sfondo Fitness Cinematico Blu Notte.png', a: 'trag-notte', w: 800 },
  { da: 'Dettaglio Piastra 20 KG in Palestra.png', a: 'trag-piastra', w: 600, crop: [140, 0, 801, 1672] },
  // Sito di presentazione (foto non usate nell'app)
  { da: 'Ritratto atletico in palestra al buio.png', a: 'sito-hero', w: 1122 },
  { da: 'Panca piana in palestra monocromatica.png', a: 'sito-coach', w: 1400 },
  // Libreria esercizi: miniature dei video dimostrativi del coach (16:9)
  { da: 'Trazioni alla sbarra in palestra industriale.png', a: 'demo-trazioni', w: 480 },
  { da: 'Sollevamento pesi in palestra industriale.png', a: 'demo-stacco', w: 480 },
  { da: 'Sollevamento olimpico in palestra.png', a: 'demo-lento', w: 480 },
  { da: 'Rematore con bilanciere in palestra.png', a: 'demo-rematore', w: 480 },
  { da: 'Hip thrust in palestra industriale-1.png', a: 'demo-hip-thrust', w: 480 },
  { da: 'Affondo con manubri in palestra.png', a: 'demo-affondi', w: 480 },
  // 2026-11-03 sera: testata di Progressi, card «12 settimane», video della panca piana (Luca)
  { da: 'Bilanciere e ghisa nella penombra.png', a: 'progressi-testa', w: 1180 },
  { da: "Pausa dopo l'allenamento.png", a: 'trag-dodici', w: 800 },
  { da: 'Panca piana in palestra industriale.png', a: 'demo-panca', w: 480 },
  // Profilo: foto grande e nitida di Marco (prima era l'avatar da 240 px allargato, sfocato)
  { da: 'Squat con bilanciere in palestra.png', a: 'profilo-marco', w: 900, crop: [0, 230, 941, 1000] },
  // Profilo degli atleti aggiunti dal coach (non hanno ancora una foto loro)
  { da: 'Palestra industriale tra luce e ombre.png', a: 'profilo-atleta', w: 900 },
  // Account di prova (2026-11-03): Giulia appena iscritta, Davide avanzato; Luca col tablet per l'accesso al gestionale
  { da: 'Ritratto atletico in palestra monocromatica.png', a: 'profilo-giulia', w: 900, crop: [0, 80, 941, 1000] },
  { da: 'Ritratto atletico in palestra monocromatica.png', a: 'atleta-giulia', w: 240, crop: [430, 190, 380, 380] },
  { da: 'Forza e concentrazione sotto le luci.png', a: 'profilo-davide', w: 900, crop: [0, 120, 941, 1000] },
  { da: 'Forza e concentrazione sotto le luci.png', a: 'atleta-davide', w: 240, crop: [470, 190, 320, 320] },
  { da: 'Allenamento concentrato in palestra.png', a: 'accesso-coach', w: 1400 },
];

(async () => {
  fs.mkdirSync(USCITA, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const f of FOTO) {
    const dati = fs.readFileSync(path.join(SORGENTE, f.da)).toString('base64');
    const webp = await page.evaluate(async ({ dati, w, crop }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + dati;
      await img.decode();
      const [x, y, cw, ch] = crop || [0, 0, img.naturalWidth, img.naturalHeight];
      const h = Math.round(ch * w / cw);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x, y, cw, ch, 0, 0, w, h);
      return c.toDataURL('image/webp', 0.8).split(',')[1];
    }, { dati, w: f.w, crop: f.crop });
    const file = path.join(USCITA, f.a + '.webp');
    fs.writeFileSync(file, Buffer.from(webp, 'base64'));
    console.log(f.a + '.webp', Math.round(fs.statSync(file).size / 1024) + ' KB');
  }
  await browser.close();
})();
