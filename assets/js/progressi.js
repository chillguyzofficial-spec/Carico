// Progressi: esercizio scelto a tocco, record, grafico storico (reale vs piano del coach), pochi dati utili, traguardi.
// Traguardo: card a tutto schermo che si salva/condivide come immagine verticale (canvas 1080×1920).
(function () {
  const A = window.APP, D = A.D, { esc, kg } = A;
  const ESERCIZI = ['panca', 'squat', 'stacco', 'rematore'];
  const OBIETTIVO = { panca: 80, squat: 90, stacco: 135, rematore: 77.5 };
  const NOME_ES = { panca: 'Panca piana', squat: 'Squat', stacco: 'Stacco da terra', rematore: 'Rematore con bilanciere' };
  const INTERVALLI = [['1M', 4], ['3M', 13], ['6M', 26], ['1A', 52], ['Tutto', 999]];
  let scelto = 'panca', intervallo = 'Tutto';

  // Storico settimanale: 20 settimane del blocco precedente + le 6 di questo blocco (dati dimostrativi, sempre uguali)
  function storico(k) {
    const p = D.progressi[k], punti = p.punti.slice();
    const prima = [];
    for (let s = 20; s >= 1; s--) {
      const v = p.punti[0] * (1 - s * 0.006) - (s % 3 === 0 ? 2.5 : 0);
      prima.push(Math.round(v / 2.5) * 2.5);
    }
    const tutto = prima.concat(punti);
    // un record fatto oggi in allenamento aggiorna l'ultimo punto
    const sess = A.leggi(A.chiaveSessione);
    const chiave = D.settimana[A.oggi];
    if (sess && chiave) {
      D.esercizi[chiave].forEach((e, i) => {
        if (e.nome !== NOME_ES[k] || !sess.es[i] || sess.es[i].nome) return;
        sess.es[i].serie.filter((s) => s.fatta && s.reps >= e.reps).forEach((s) => { tutto[tutto.length - 1] = Math.max(tutto[tutto.length - 1], s.kg); });
      });
    }
    return tutto;
  }
  const settimaneTotali = () => storico('panca').length;

  function grafico(k) {
    const tutto = storico(k);
    const n = Math.min(INTERVALLI.find((x) => x[0] === intervallo)[1], tutto.length);
    const reale = tutto.slice(-n);
    const inizioBlocco = tutto.length - D.progressi[k].punti.length; // indice della settimana 1
    // piano del coach: dalla settimana 1 all'obiettivo in 12 settimane (anche nel futuro)
    const s1 = D.progressi[k].punti[0], ob = OBIETTIVO[k];
    const futuro = D.atleta.settimane - D.atleta.settimana;
    const W = 353, H = 180, px = 8, top = 16, bot = 26;
    const tot = n + futuro;
    const valori = reale.concat([ob, s1]);
    const min = Math.floor(Math.min(...valori) / 5) * 5 - 2.5, max = Math.ceil(Math.max(...valori) / 5) * 5;
    const X = (i) => px + i * (W - 2 * px) / (tot - 1);
    const Y = (v) => top + (max - v) / (max - min) * (H - top - bot);
    const linea = reale.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const settimana1 = inizioBlocco - (tutto.length - n); // posizione della settimana 1 nel periodo mostrato
    const piano = [];
    for (let w = 0; w < D.atleta.settimane; w++) {
      const idx = settimana1 + w;
      if (idx < 0) continue;
      piano.push(`${X(idx).toFixed(1)},${Y(s1 + (ob - s1) * w / (D.atleta.settimane - 1)).toFixed(1)}`);
    }
    // righe della griglia su valori tondi (passo 10, o 20 per i carichi alti)
    const passo = max - min > 60 ? 20 : 10;
    const tacche = [];
    for (let t = Math.ceil(min / passo) * passo; t <= max; t += passo) tacche.push(t);
    const griglia = tacche.map((v) => `<g><line x1="0" x2="${W}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#1B2438"/><text x="${W}" y="${(Y(v) - 4).toFixed(1)}" text-anchor="end">${kg(Math.round(v))}</text></g>`).join('');
    const ux = X(n - 1), uy = Y(reale[n - 1]);
    const etichette = `<text x="${px}" y="${H - 6}">${n >= tutto.length ? 'inizio' : n + ' sett. fa'}</text><text x="${ux.toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="#7AA2FF">oggi</text><text x="${W - px}" y="${H - 6}" text-anchor="end">sett. ${D.atleta.settimane}</text>`;
    return `
      <svg class="storico" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(NOME_ES[k])}: da ${kg(reale[0])} a ${kg(reale[n - 1])} chili; obiettivo del coach ${kg(ob)}">
        <defs><linearGradient id="area-st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563FF" stop-opacity=".3"/><stop offset="1" stop-color="#2563FF" stop-opacity="0"/></linearGradient></defs>
        ${griglia}
        <line x1="0" x2="${W}" y1="${Y(ob).toFixed(1)}" y2="${Y(ob).toFixed(1)}" stroke="#7AA2FF" stroke-opacity=".35" stroke-dasharray="2 4"/>
        <text x="0" y="${(Y(ob) - 5).toFixed(1)}" fill="#7AA2FF">Obiettivo ${kg(ob)} kg</text>
        ${piano.length > 1 ? `<polyline points="${piano.join(' ')}" fill="none" stroke="#A3ACBD" stroke-width="1.5" stroke-dasharray="5 5" stroke-linecap="round"/>` : ''}
        <path d="M${linea.replace(/ /g, 'L')}V${H - bot}H${px}Z" fill="url(#area-st)"/>
        <polyline points="${linea}" fill="none" stroke="#7AA2FF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${ux.toFixed(1)}" cy="${uy.toFixed(1)}" r="5" fill="#070B14" stroke="#7AA2FF" stroke-width="2.5"/>
        ${etichette}
      </svg>
      <div class="legenda-st"><span><i class="l-reale"></i>Reale</span><span><i class="l-piano"></i>Piano di ${esc(D.coach.breve)}</span></div>`;
  }

  // ---------- Dati generali ----------
  function riepilogo() {
    const sess = A.leggi(A.chiaveSessione);
    let fattiSett = 0, previstiSett = 0;
    D.settimana.forEach((k, i) => { if (!k) return; if (i < A.oggi || (i === A.oggi && sess && sess.finito)) { fattiSett++; previstiSett++; } else if (i < A.oggi) previstiSett++; });
    const fatti = 22 + fattiSett, previsti = 25 + previstiSett; // settimane 1–5: 22 su 25 (3 saltati)
    return { fatti, previsti, aderenza: Math.round(fatti / previsti * 100) };
  }

  // ---------- Traguardi ----------
  function traguardi() {
    const r = riepilogo();
    return [
      { id: 'mese', fatto: true, quando: 'Settimana 4', titolo: 'Primo mese', riga: '4 settimane senza mollare', dato: `${r.fatti - 5 > 18 ? 18 : r.fatti - 5} allenamenti`, foto: 'trag-notte' },
      { id: 'panca70', fatto: true, quando: 'Settimana 5', titolo: 'Panca piana', riga: '70 kg × 8 · +7,5 kg dall’inizio', dato: '70 KG × 8', foto: 'record-marco' },
      { id: 'stacco120', fatto: true, quando: 'Settimana 5', titolo: 'Stacco da terra', riga: '120 kg × 5 · +10 kg dall’inizio', dato: '120 KG × 5', foto: 'trag-piastra' },
      { id: 'dodici', fatto: false, quando: `Mancano ${D.atleta.settimane - D.atleta.settimana} settimane`, titolo: `${D.atleta.settimane} settimane`, riga: `${r.fatti} / 60 allenamenti · ${r.aderenza}% costanza`, dato: `${D.atleta.settimane} SETTIMANE`, foto: 'hero-push' },
    ];
  }

  function render() {
    const tutto = storico(scelto), p = D.progressi[scelto];
    const attuale = tutto[tutto.length - 1], s1 = p.punti[0];
    const delta = Math.round((attuale - s1) / s1 * 100);
    const r = riepilogo();
    const disponibili = settimaneTotali();
    const chip = ESERCIZI.map((k) => `<button class="chip-scelta" data-es="${k}" aria-pressed="${k === scelto}">${esc(NOME_ES[k].split(' ')[0] === 'Stacco' ? 'Stacco' : NOME_ES[k].split(' con')[0])}</button>`).join('');
    const intervalli = INTERVALLI.map(([n, w]) => `<button class="intervallo" data-int="${n}" aria-pressed="${n === intervallo}"${w !== 999 && w > disponibili ? ' disabled title="Non ci sono ancora abbastanza settimane"' : ''}>${n}</button>`).join('');
    const tr = traguardi().map((t) => `
      <li><a class="riga-traguardo${t.fatto ? '' : ' futuro'}" href="#traguardo/${t.id}">
        <span class="segno">${t.fatto ? '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#7AA2FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#2E3A55" stroke-width="1.5" stroke-dasharray="2 2.5"/></svg>`}</span>
        <span class="cosa"><b>${esc(t.titolo)}</b><span>${esc(t.riga)}</span></span>
        <span class="quando-t">${esc(t.quando)}</span>
      </a></li>`).join('');

    document.querySelector('[data-vista="progressi"]').innerHTML = `
      <header class="testa-pagina">
        <span class="sopratitolo">Settimana ${D.atleta.settimana} di ${D.atleta.settimane}</span>
        <h1 class="titolo-pagina">Progressi</h1>
      </header>
      <div class="chips-scelta" role="group" aria-label="Esercizio">${chip}</div>
      <section class="blocco pr" aria-live="polite">
        <span class="etichetta">Record personale · ${esc(NOME_ES[scelto])}</span>
        <span class="pr-valore num">${kg(attuale)} kg × ${p.reps}</span>
        <span class="pr-delta num">+${delta}% dalla settimana 1 · ${kg(s1)} → ${kg(attuale)} kg</span>
        ${grafico(scelto)}
        <div class="intervalli" role="group" aria-label="Periodo">${intervalli}</div>
      </section>
      <section class="blocco" aria-labelledby="t-blocco">
        <h2 id="t-blocco" class="etichetta" style="margin:0">Questo blocco</h2>
        <div class="tre-dati num">
          <span><b>${r.fatti}/${r.previsti}</b><small>allenamenti fatti</small></span>
          <span><b>${r.aderenza}%</b><small>costanza</small></span>
          <span><b>${ESERCIZI.length}</b><small>record personali</small></span>
        </div>
      </section>
      <section class="blocco" aria-labelledby="t-trag">
        <h2 id="t-trag" class="etichetta" style="margin:0">Traguardi</h2>
        <ul class="lista-traguardi">${tr}</ul>
      </section>`;
  }

  // ---------- Card del traguardo (schermo + immagine) ----------
  function renderTraguardo(id) {
    const t = traguardi().find((x) => x.id === id) || traguardi()[0];
    const r = riepilogo();
    const sotto = t.id === 'dodici'
      ? `<span>${r.fatti} / 60 allenamenti</span><span>${r.aderenza}% costanza</span><span>+${kg(D.progressi.panca.punti.slice(-1)[0] - D.progressi.panca.punti[0])} kg in panca</span>`
      : `<span>${esc(t.riga)}</span><span>${esc(t.quando)} · con ${esc(D.coach.nome)}</span>`;
    document.querySelector('[data-vista="traguardo"]').innerHTML = `
      <header class="barra-top"><a class="icona-44" href="#progressi" aria-label="Chiudi"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#A3ACBD" stroke-width="1.8" stroke-linecap="round"/></svg></a><div class="centro"><b>Traguardo</b><span>${t.fatto ? esc(t.quando) : 'Anteprima · si sblocca a fine programma'}</span></div><span class="icona-44"></span></header>
      <div class="corpo-es">
        <figure class="card-traguardo${t.fatto ? '' : ' bloccato'}" id="card-traguardo">
          <img src="assets/foto/${t.foto}.webp" alt="">
          <figcaption>
            <span class="marchio">CARICO</span>
            <span class="sopratitolo">${t.id === 'dodici' ? 'Programma completato' : t.id === 'mese' ? 'Traguardo' : 'Record personale'}</span>
            <span class="grande">${esc(t.id === 'mese' ? '4 SETTIMANE' : t.dato)}</span>
            <span class="nome">${esc(t.id === 'mese' || t.id === 'dodici' ? D.atleta.nome + ' ' + D.atleta.cognome : t.titolo)}</span>
            <span class="righe num">${sotto}</span>
          </figcaption>
        </figure>
        <div class="in-fondo">
          ${t.fatto ? `<button class="btn-primario" id="condividi">Salva o condividi l'immagine</button>` : `<p class="aiuto">La card si sblocca quando chiudi la settimana ${D.atleta.settimane}.</p>`}
        </div>
      </div>`;
    const b = document.getElementById('condividi');
    if (b) b.onclick = () => immagine(t, sotto);
  }

  // Disegna la card su canvas 1080×1920 e la condivide (o la scarica)
  async function immagine(t, sottoHtml) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    await document.fonts.ready;
    const img = new Image(); img.src = `assets/foto/${t.foto}.webp`; await img.decode();
    const s = Math.max(1080 / img.width, 1920 / img.height);
    x.filter = 'grayscale(1) contrast(1.05)';
    x.drawImage(img, (1080 - img.width * s) / 2, (1920 - img.height * s) / 2 * 0.3, img.width * s, img.height * s);
    x.filter = 'none';
    x.globalCompositeOperation = 'color'; x.fillStyle = 'rgba(11,42,107,.45)'; x.fillRect(0, 0, 1080, 1920);
    x.globalCompositeOperation = 'source-over';
    const g = x.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, 'rgba(6,8,13,.55)'); g.addColorStop(.35, 'rgba(7,11,20,0)'); g.addColorStop(.62, 'rgba(7,11,20,.85)'); g.addColorStop(1, '#070B14');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
    x.fillStyle = '#F2F4F8'; x.font = '800 56px "Big Shoulders Display"'; x.fillText('CARICO', 80, 140);
    const fig = document.querySelector('#card-traguardo figcaption');
    x.fillStyle = '#7AA2FF'; x.font = '600 34px Geist'; x.fillText(fig.querySelector('.sopratitolo').textContent.toUpperCase().split('').join(' '), 80, 1290);
    x.fillStyle = '#F2F4F8'; x.font = '800 190px "Big Shoulders Display"'; x.fillText(fig.querySelector('.grande').textContent.toUpperCase(), 72, 1470);
    x.font = '600 52px Geist'; x.fillText(fig.querySelector('.nome').textContent, 80, 1560);
    x.fillStyle = '#A3ACBD'; x.font = '500 38px Geist';
    [...fig.querySelectorAll('.righe span')].forEach((sp, i) => x.fillText(sp.textContent, 80, 1650 + i * 56));
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    const file = new File([blob], `carico-${t.id}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Il mio traguardo' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    A.avviso('Immagine salvata', 'La trovi nei download');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-vista="progressi"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-es], [data-int]');
      if (!b || b.disabled) return;
      if (b.dataset.es) scelto = b.dataset.es; else intervallo = b.dataset.int;
      render();
    });
  });

  A.viste.progressi = { render };
  A.viste.traguardo = { render: renderTraguardo };
})();
