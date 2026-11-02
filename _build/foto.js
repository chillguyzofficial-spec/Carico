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
