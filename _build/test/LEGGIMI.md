# Prove

Si lanciano dalla cartella del progetto passando una cartella dove salvare gli screenshot:

    node _build/test/allenamento.js <cartella>   # scheda unica: serie, recupero, modifica, record, riprendi (25)
    node _build/test/novita.js <cartella>        # primo avvio, progressi, traguardi, profilo (31)
    node _build/test/coach-app.js <cartella>     # feedback dal gestionale alla Home (20)
    node _build/test/titoli.js                   # titoli su una riga, 4 larghezze x 7 giorni (28)
    node _build/test/sito.js <cartella>          # sito da 320 a 1920 (25)

Usano Playwright di `hedonè progetto serio/node_modules`. Le prove con server usano le porte 8993-8995.
