# Changelog

Cosa cambia a ogni fase del progetto.

## Fase 1 - Setup del progetto (2026-09-29)

### Aggiunto

- Repository git e monorepo npm con due workspace: `server` (Express 5 + TypeScript) e `client` (React 19 + Vite 8).
- Backend con `GET /api/health`, risposta 404 in JSON per percorsi `/api` sconosciuti, gestore centrale degli errori, lettura e validazione della configurazione da `.env` con zod.
- In produzione il backend serve anche il frontend compilato (`client/dist`), con rimando a `index.html` per le rotte del frontend.
- Frontend minimo che chiama `/api/health` e mostra se il server è collegato; wrapper unico per le chiamate API (`client/src/api/client.ts`).
- Strumenti: TypeScript strict, ESLint (flat config), Prettier, vitest + supertest con un primo test sul backend.
- Documentazione: README, CLAUDE.md, `docs/ARCHITETTURA.md`, `docs/DECISIONI.md`.

## Fase 2 - Database (2026-09-29)

### Aggiunto

- Schema Prisma con sei tabelle (`User`, `Session`, `Client`, `Practice`, `Document`, `AuditLog`) e prima migrazione in `server/prisma/migrations`.
- Connessione a SQLite tramite Prisma 7 con adapter better-sqlite3 (`server/src/db.ts`), in modalità WAL.
- Liste fisse di ruoli, tipi pratica, stati e tipi documento in `server/src/lists.ts`.
- Seed con 3 utenti (uno per ruolo, password `password123`), 5 clienti, 8 pratiche, 8 documenti con file PDF e PNG veri (uno nel cestino) e righe nel registro attività. Non sovrascrive un database già popolato, salvo `SEED_RESET=1`.
- Test del seed su un database temporaneo creato dalle migrazioni (`server/tests/global-setup.ts`).
- Variabili `DATABASE_URL` e `UPLOAD_DIR`; percorsi assoluti calcolati in `server/src/config.ts`.
- Script `db:migrate`, `db:deploy`, `db:seed`, `db:studio` (anche dalla radice); `prisma generate` eseguito da `postinstall` e da `build`.
- Documentazione: `docs/DATABASE.md`.

### Corretto

- `npm run db:studio` non partiva: Prisma Studio 7.10 accetta solo URL `file://`, mentre le migrazioni accettano solo `file:`. `prisma.config.ts` adatta l'URL per il solo comando `studio`; lo script fissa la porta 5555 e inoltra le opzioni (es. `npm run db:studio -- --browser none`).

## Fase 3 - Login e ruoli (2026-09-29)

### Aggiunto

- Modulo `auth`: login con email e password (hash bcrypt), sessione in tabella `Session` con cookie `sid` httpOnly e SameSite=Lax, scadenza rinnovabile (`SESSION_HOURS`), logout, utente corrente, cambio password, blocco dopo 5 tentativi falliti.
- Middleware `requireAuth` e `requireRole`, classe `HttpError`, helper `validate` e `parseId`, header di sicurezza con helmet.
- Modulo `users` per l'Amministratore: elenco, creazione, modifica, reset password, attivazione e disattivazione (con chiusura delle sessioni).
- Modulo `audit` con `record()`: login, cambio password e operazioni sugli utenti finiscono nel registro attività.
- Frontend: pagina di accesso, contesto utente, rotte protette per login e ruolo, barra laterale con menu per ruolo, pagina Utenti con finestre di creazione, modifica e reset password, pagina Il mio profilo, componenti base (`Button`, `Field`, `Alert`, `Modal`) e foglio di stile del gestionale.
- Test: 30 nuovi test su login, sessioni, permessi e gestione utenti (38 in totale).
- Variabili `SESSION_HOURS` e `COOKIE_SECURE`.
- Documentazione: `docs/API.md`, `docs/COMPONENTI.md`, `docs/MANUALE_UTENTE.md`.
