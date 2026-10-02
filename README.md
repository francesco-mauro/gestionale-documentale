# Gestionale documentale

Archivio unico di clienti, pratiche e documenti per una piccola azienda che vende e installa serramenti. Ogni documento è collegato a un cliente e a una pratica, così si ritrova in pochi secondi. L'accesso è controllato per ruolo: Amministratore, Operatore, Venditore.

Stato del progetto: **fase 3 di 8 (login e ruoli)**. Le funzionalità arrivano una fase alla volta, vedi [docs/PIANO.md](docs/PIANO.md) e [CHANGELOG.md](CHANGELOG.md).

Questa è la copia pubblica per il portfolio: nomi, clienti e documenti sono di esempio.

## Requisiti

- Node.js 24 o superiore (include npm)
- git

## Installazione

```bash
git clone <indirizzo-del-repository> gestionale
cd gestionale
npm install
```

Poi crea il file di configurazione del backend copiando l'esempio:

```powershell
Copy-Item server/.env.example server/.env
```

Apri `server/.env` e controlla i valori (vedi la sezione "Variabili d'ambiente"). Infine crea il database e, se vuoi provare subito il gestionale, carica i dati di esempio:

```bash
npm run db:deploy   # crea il database applicando le migrazioni
npm run db:seed     # carica utenti, clienti, pratiche e documenti di esempio
```

## Avvio in sviluppo

```bash
npm run dev
```

Avvia insieme:

- il backend Express su http://localhost:3000 (si riavvia da solo quando modifichi un file in `server/src`);
- il frontend Vite su http://localhost:5173 (si aggiorna da solo nel browser).

Apri http://localhost:5173 ed entra con uno degli utenti di esempio. Le chiamate del frontend a `/api/...` vengono inoltrate da Vite al backend, quindi nel codice non compaiono mai porte o indirizzi.

## Utenti di esempio

Creati da `npm run db:seed`. Tutti hanno password `password123`. Vanno cambiati o cancellati prima di usare il gestionale con dati veri.

| Email                  | Ruolo          |
| ---------------------- | -------------- |
| `admin@esempio.it`     | Amministratore |
| `operatore@esempio.it` | Operatore      |
| `venditore@esempio.it` | Venditore      |

## Comandi

Tutti si lanciano dalla cartella principale.

| Comando                              | Cosa fa                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `npm run dev`                        | Avvia backend e frontend in sviluppo                                             |
| `npm test`                           | Esegue i test del backend (vitest) su un database temporaneo                     |
| `npm run lint`                       | Controlla il codice con ESLint                                                   |
| `npm run typecheck`                  | Controlla i tipi TypeScript di backend e frontend                                |
| `npm run format`                     | Formatta tutto il codice con Prettier                                            |
| `npm run build`                      | Compila frontend (`client/dist`) e backend (`server/dist`)                       |
| `npm start`                          | Avvia il backend compilato, che serve anche il frontend                          |
| `npm run db:migrate -- --name testo` | Dopo una modifica allo schema: crea e applica una migrazione, rigenera il client |
| `npm run db:deploy`                  | Applica le migrazioni mancanti (installazione e aggiornamenti in produzione)     |
| `npm run db:seed`                    | Carica i dati di esempio (non tocca un database già popolato)                    |
| `npm run db:studio`                  | Apre Prisma Studio nel browser per guardare e modificare i dati                  |

## Messa in produzione

In produzione gira **un solo processo**: il backend serve le API e i file del frontend compilato.

```bash
npm ci              # installa le dipendenze esatte del package-lock
npm run build       # compila frontend e backend
npm run db:deploy   # crea o aggiorna il database
npm start           # avvia su http://localhost:PORT
```

Gli altri PC dell'ufficio aprono `http://<nome-del-pc>:<PORT>` dal browser.

Installazione come servizio Windows, script di aggiornamento e backup arrivano con la fase 8.

## Variabili d'ambiente

Si impostano in `server/.env` (mai su git). Il file `server/.env.example` è il modello. I percorsi sono relativi alla cartella `server/`.

| Nome            | Default                     | Significato                                                                 |
| --------------- | --------------------------- | --------------------------------------------------------------------------- |
| `PORT`          | `3000`                      | Porta su cui il backend ascolta                                             |
| `DATABASE_URL`  | `file:./data/gestionale.db` | File del database SQLite                                                    |
| `UPLOAD_DIR`    | `./uploads`                 | Cartella dei documenti caricati, non raggiungibile dal browser              |
| `SESSION_HOURS` | `12`                        | Durata di una sessione di login, in ore (si rinnova mentre l'utente lavora) |
| `COOKIE_SECURE` | `false`                     | `true` solo se il gestionale è servito in HTTPS                             |

Se un valore è sbagliato il backend si ferma all'avvio con un messaggio che indica il campo.

## Backup e ripristino

Tutti i dati stanno in due posti: il file del database (`server/data/gestionale.db`) e la cartella dei documenti (`server/uploads/`). Il backup consiste nel copiare entrambi. Gli script e la procedura provata arrivano con la fase 8.

## Struttura del progetto

```
package.json      script comuni e workspace npm (server, client)
server/           backend: Express + TypeScript + Prisma
  src/            codice, organizzato per funzionalità (auth, users, audit, shared, ...)
  prisma/         schema del database, migrazioni, seed e file di esempio
  tests/          test delle API
  data/           il database SQLite (creato al primo avvio, ignorato da git)
  uploads/        i documenti caricati (ignorati da git)
client/           frontend: React + TypeScript con Vite
  src/            codice, organizzato per funzionalità (auth, layout, users, profile, ui, ...)
docs/             documentazione tecnica e manuale utente
scripts/          script di backup, ripristino, installazione (fase 8)
```

## Documentazione

- [docs/PIANO.md](docs/PIANO.md): le fasi del progetto, cosa contiene ciascuna e a che punto siamo.
- [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md): come sono collegati i componenti e il percorso di una richiesta.
- [docs/COMPONENTI.md](docs/COMPONENTI.md): ogni modulo di backend e frontend, file principali e come modificarlo.
- [docs/DATABASE.md](docs/DATABASE.md): tabelle, campi, relazioni, migrazioni e dati di esempio.
- [docs/API.md](docs/API.md): ogni endpoint con metodo, percorso, ruolo richiesto ed esempi.
- [docs/DECISIONI.md](docs/DECISIONI.md): le scelte tecniche, con alternative e motivi.
- [docs/MANUALE_UTENTE.md](docs/MANUALE_UTENTE.md): guida per chi usa il gestionale, senza termini tecnici.
- [CHANGELOG.md](CHANGELOG.md): cosa cambia a ogni fase.
