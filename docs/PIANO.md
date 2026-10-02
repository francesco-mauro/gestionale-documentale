# Piano di lavoro

Le fasi del progetto, cosa contiene ciascuna e a che punto siamo. Si aggiorna a fine fase insieme a [CHANGELOG.md](../CHANGELOG.md). Il "come" è descritto in [ARCHITETTURA.md](ARCHITETTURA.md), il "perché" in [DECISIONI.md](DECISIONI.md).

## Obiettivo

L'azienda, una piccola impresa di serramenti, tiene i documenti in cartelle sparse su vari PC. Il gestionale dà un archivio unico dove ogni documento sta sotto **cliente → pratica** e si ritrova in pochi secondi, con accesso controllato per ruolo. Chi lo mantiene dopo il rilascio è uno sviluppatore junior: codice piccolo, poche dipendenze, tutto documentato in italiano.

## Decisioni concordate prima di iniziare

| Tema                                        | Scelta                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Ruoli                                       | 3: Amministratore (`ADMIN`), Operatore (`OPERATOR`), Venditore (`SELLER`)                                    |
| Proposte del venditore                      | Crea clienti, pratiche e documenti che nascono "da confermare"; Operatore o Amministratore conferma o scarta |
| Visibilità                                  | Tutti gli utenti vedono tutto l'archivio                                                                     |
| Cestino                                     | Solo per i documenti. Clienti e pratiche si eliminano solo se vuoti e solo da Amministratore                 |
| Liste (tipi pratica, stati, tipi documento) | Fisse in un file di configurazione, non modificabili dall'interfaccia                                        |
| Dove gira                                   | PC o server Windows in ufficio, rete locale, HTTP, servizio Windows                                          |
| Interfaccia                                 | CSS scritto a mano, nessuna libreria di componenti                                                           |
| Test                                        | Solo backend (API) con vitest + supertest su database temporaneo                                             |
| Limite upload                               | 20 MB, configurabile da `.env`                                                                               |

Assunzioni ancora aperte a correzioni: un documento appartiene sempre a una pratica; il venditore modifica solo i propri record non ancora confermati; il registro attività è visibile ad Amministratore e Operatore; il reset password lo fa l'Amministratore, ogni utente può cambiare la propria; anteprima solo per PDF e immagini.

## Stato delle fasi

| #   | Fase                   | Stato              |
| --- | ---------------------- | ------------------ |
| 1   | Setup del progetto     | fatta (2026-09-29) |
| 2   | Database               | fatta (2026-09-29) |
| 3   | Login e ruoli          | fatta (2026-09-29) |
| 4   | Clienti e pratiche     | da fare            |
| 5   | Documenti e upload     | da fare            |
| 6   | Ricerca e filtri       | da fare            |
| 7   | Registro attività      | da fare            |
| 8   | Backup e installazione | da fare            |

Ogni fase finisce con: test e lint verdi, documentazione aggiornata, commit, riepilogo per lo sviluppatore (cosa è stato fatto, file toccati, come verificare a mano, concetti da capire).

## Fase 1: setup del progetto

**Contenuto:** repository git, monorepo npm con workspace `server` e `client`, TypeScript strict, ESLint e Prettier, Vite con proxy verso il backend, Express con `GET /api/health`, gestore centrale degli errori, configurazione validata con zod, vitest + supertest con il primo test, backend che serve il frontend compilato in produzione.

**Documenti:** README, CLAUDE.md, CHANGELOG, `docs/ARCHITETTURA.md`, `docs/DECISIONI.md`, questo file.

**Verifica a mano:** `npm run dev` mostra "Server: collegato" su http://localhost:5173; `npm run build` + `npm start` mostra la stessa pagina su http://localhost:3000 da un solo processo; `npm test`, `npm run lint`, `npm run typecheck` senza errori.

## Fase 2: database

**Contenuto:** `schema.prisma` con le tabelle `User`, `Session`, `Client`, `Practice`, `Document`, `AuditLog`; `prisma.config.ts`; prima migrazione; `db.ts` con adapter better-sqlite3 e modalità WAL; `lists.ts` con tipi pratica, stati e tipi documento; seed con 3 utenti (uno per ruolo), 5 clienti, 8 pratiche e alcuni documenti di esempio con file veri in `prisma/seed-files/`.

**Documenti:** `docs/DATABASE.md` con diagramma ER in Mermaid, tabelle, campi e relazioni.

**Verifica a mano:** `npx prisma migrate dev` crea il database; `npx prisma db seed` carica i dati; `npx prisma studio` li mostra.

## Fase 3: login e ruoli

**Contenuto:** modulo `auth` (login, logout, utente corrente, cambio password, sessioni in tabella con cookie `httpOnly`, limite ai tentativi di login); modulo `users` per l'Amministratore (elenco, nuovo, modifica, reset password, attiva/disattiva); middleware `requireAuth` e `requireRole`; helmet. Frontend: pagina Accesso, contesto utente, menu laterale che cambia per ruolo, pagine Utenti e Profilo.

**Test:** login corretto e sbagliato, sessione scaduta, utente disattivato, Operatore che chiama `/api/users` riceve 403.

**Verifica a mano:** entrare con i tre utenti di esempio e vedere menu diversi.

## Fase 4: clienti e pratiche

**Contenuto:** moduli `clients` e `practices` con creazione, modifica, dettaglio, eliminazione (solo se vuoti, solo Amministratore); logica "da confermare" per il Venditore con funzione unica `assertCanEdit`; endpoint `pending` con tutto ciò che aspetta conferma. Frontend: pagine Clienti, Cliente, Pratica (senza documenti), Da confermare.

**Test:** il Venditore crea un cliente e nasce non confermato; l'Operatore lo conferma; il Venditore non modifica un record confermato; l'Amministratore non elimina un cliente con pratiche.

**Documenti:** `docs/API.md` e `docs/COMPONENTI.md` (primi moduli).

## Fase 5: documenti e upload

**Contenuto:** modulo `documents` con upload multipart (multer), controllo di dimensione, tipo dichiarato e primi byte del file, salvataggio su disco in `server/uploads/` con nome casuale, anteprima e download solo passando dal backend, cestino con ripristino ed eliminazione definitiva. Frontend: sezione documenti nella pagina Pratica, form di caricamento, anteprima PDF e immagini, pagina Cestino.

**Test:** upload di un PDF; file `.exe` rifiutato; file oltre il limite rifiutato; download senza login rifiutato; cestino e ripristino; nessun file orfano se il salvataggio nel database fallisce.

**Documenti:** `docs/ARCHITETTURA.md` con il percorso completo di un caricamento, `docs/API.md`, `docs/COMPONENTI.md`.

## Fase 6: ricerca e filtri

**Contenuto:** modulo `search` con un endpoint che combina testo (nome file e note), cliente, pratica, tipo documento e intervallo di date, con risultati paginati. Frontend: pagina Cerca documenti con link alla pratica.

**Test:** ogni filtro da solo e combinati; testo con maiuscole e minuscole.

## Fase 7: registro attività

**Contenuto:** modulo `audit` con funzione `record` chiamata dai service quando si crea, modifica, elimina, ripristina o conferma qualcosa, e al login; endpoint di lettura con filtri per utente e tipo. Frontend: pagina Registro attività per Amministratore e Operatore.

**Test:** upload ed eliminazione producono le righe attese.

## Fase 8: backup e installazione

**Contenuto:** `scripts/backup.ps1` (copia sicura del database con `VACUUM INTO` e archivio zip della cartella documenti), `scripts/restore.ps1`, `scripts/update.ps1` (aggiorna il codice, installa, compila, applica le migrazioni, riavvia il servizio), `scripts/install-service.ps1` con NSSM per avviare il gestionale come servizio Windows.

**Documenti:** README completo (installazione, aggiornamento, backup e ripristino provati), `docs/MANUALE_UTENTE.md` senza termini tecnici, CHANGELOG finale, confronto finale tra codice e documentazione.

**Verifica a mano:** backup su una cartella di prova, cancellazione dei dati, ripristino: l'archivio torna identico.

## Il lavoro è finito quando

- Un utente accede, crea un cliente, apre una pratica, carica un documento e lo ritrova con la ricerca.
- I permessi funzionano: per esempio un Operatore non può gestire gli utenti.
- `npm test` è verde con test su login, permessi, upload e ricerca.
- Ci sono dati di esempio per provare subito il gestionale.
- Backup e ripristino sono stati eseguiti davvero e descritti nel README.
- La documentazione descrive il codice così com'è.

## Idee proposte, non nel brief (solo con approvazione)

- Pulsante "Scarica tutti i documenti della pratica" in un unico zip.
- Campo codice fiscale / partita IVA sul cliente.
- Promemoria per le scadenze delle pratiche (fuori ambito per questa versione).
