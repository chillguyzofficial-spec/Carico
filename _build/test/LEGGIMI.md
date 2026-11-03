# Prove

Si lanciano dalla cartella del progetto passando una cartella dove salvare gli screenshot:

    node _build/test/allenamento.js <cartella>   # scheda sul modello di Francesco: tabella, numeri scritti, serie/esercizi aggiunti, sostituzione, riepilogo (45)
    node _build/test/collegamento.js <cartella>  # app ↔ gestionale: allenamenti al coach, programma del coach all’app; Prima, PR, fatica, nota (25)
    node _build/test/navigazione.js              # da ogni schermata si esce; il Profilo torna da dove vieni (16)
    node _build/test/guida.js <cartella>         # «Come si fa»: spiegazione di ogni esercizio, foglio che si apre e chiude (10)
    node _build/test/piano.js <cartella>         # settimana non fissa: non fatto (fallo oggi / lo salto), cambia giorno, calendario, coach (25)
    node _build/test/progresso.js                # Progresso a scorrimento: 6 gruppi, salita/stabile/calo, giro automatico che si ferma al tocco (12)
    node _build/test/piani.js <cartella>         # programma per persona: modelli, giorni fissi / quando vuole, N a settimana, progressione (22)
    node _build/test/gestionale.js <cartella>    # gestionale completo: accesso, 3 account, assistente, nuovo atleta, messaggi, libreria, temi (37)
    node _build/test/novita.js <cartella>        # primo avvio, progressi, traguardi, profilo (31)
    node _build/test/coach-app.js <cartella>     # feedback dal gestionale alla Home (20)
    node _build/test/titoli.js                   # titoli su una riga, 4 larghezze x 7 giorni (28)
    node _build/test/sito.js <cartella>          # sito da 320 a 1920 (25)

Usano Playwright di `hedonè progetto serio/node_modules`. Le prove con server usano le porte 8993-8995.
