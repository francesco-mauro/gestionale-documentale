# Componenti

Per ogni modulo del backend e del frontend: a cosa serve, i file principali, cosa riceve e cosa restituisce, da cosa dipende, come si modifica. Si aggiorna a ogni fase; i moduli delle fasi future non sono elencati finché non esistono.

## Backend (`server/src`)

### Avvio e configurazione

| File        | A cosa serve                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `index.ts`  | Crea l'app con `createApp()` e la mette in ascolto su `config.PORT`.                                               |
| `app.ts`    | Costruisce l'app Express: helmet, JSON, cookie, router di ogni modulo, 404 JSON, frontend statico, gestore errori. |
| `config.ts` | Legge `.env`, valida con zod, calcola i percorsi assoluti (`paths.databaseFile`, `paths.uploadDir`).               |
| `db.ts`     | L'unica istanza di `PrismaClient`, collegata a SQLite tramite adapter, in modalità WAL.                            |
| `lists.ts`  | Liste fisse: `ROLES`, `PRACTICE_TYPES`, `PRACTICE_STATUSES`, `DOCUMENT_TYPES`, con i tipi TypeScript.              |

**Come si modifica:** una nuova variabile d'ambiente si aggiunge allo schema in `config.ts` e a `.env.example`. Un nuovo modulo si monta in `app.ts` con `app.use('/api/nome', nomeRouter)` prima del 404 JSON.

### `shared/` - pezzi comuni

| File          | Cosa esporta                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `errors.ts`   | `HttpError(status, message)` da lanciare ovunque; `errorHandler`, il gestore finale che risponde in JSON.               |
| `validate.ts` | `validate(schema, dati)`: applica uno schema zod o risponde 400 con i messaggi; `parseId(stringa)` per gli id nell'URL. |

**Dipende da:** zod, express. **Come si modifica:** per un nuovo tipo di errore basta lanciare `HttpError` con lo status giusto; non servono nuove classi.

### `audit/` - registro attività

| File         | Cosa fa                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `service.ts` | `record(userId, action, entityType, entityId, summary)` scrive una riga in `AuditLog`. Esporta anche le liste `AUDIT_ACTIONS` e `AUDIT_ENTITIES`. |

**Chi lo usa:** i service di `auth` e `users` (e, dalle prossime fasi, clienti, pratiche, documenti). **Come si modifica:** per registrare una nuova azione si chiama `record` dal service che la esegue, con una frase in italiano già leggibile. L'endpoint di lettura arriva con la fase 7.

### `auth/` - accesso e sessioni

| File            | Cosa fa                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `router.ts`     | Endpoint `/api/auth/*` (login, logout, me, password). Imposta e cancella il cookie `sid`.                             |
| `service.ts`    | `login`, `getSessionUser`, `logout`, `changePassword`, `hashPassword`, `toSessionUser`; limite ai tentativi di login. |
| `middleware.ts` | `requireAuth` (carica l'utente da cookie in `req.user`), `requireRole(...ruoli)`, `currentUser(req)`.                 |
| `schemas.ts`    | Schemi zod: `emailSchema`, `passwordSchema`, `loginSchema`, `changePasswordSchema`.                                   |

**Entrata:** email e password (login), cookie `sid` (tutto il resto). **Uscita:** `SessionUser` (l'utente senza hash) e il token di sessione. **Dipende da:** `db.ts`, `config.ts` (durata sessione, cookie sicuro), `audit`, bcryptjs.

**Come si modifica:**

- Per proteggere una rotta: `router.get('/x', requireAuth, requireRole('ADMIN', 'OPERATOR'), handler)` e dentro l'handler `currentUser(req)`.
- La durata della sessione è `SESSION_HOURS` in `.env`; il numero di tentativi e la durata del blocco sono le costanti `MAX_ATTEMPTS` e `LOCK_MINUTES` in `service.ts`.
- La regola sulle password (lunghezza) è `passwordSchema` in `schemas.ts`, usata anche da `users`.

### `users/` - gestione utenti (Amministratore)

| File         | Cosa fa                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `router.ts`  | Endpoint `/api/users/*`; tutte le rotte passano da `requireAuth` e `requireRole('ADMIN')`.                                   |
| `service.ts` | `listUsers`, `createUser`, `updateUser`, `setPassword`, `setActive`; controlli su email unica, 404, "non puoi disattivarti". |
| `schemas.ts` | Schemi zod per creazione, modifica, reset password, attivazione.                                                             |

**Entrata:** i dati dei form utenti. **Uscita:** `SessionUser`. **Dipende da:** `auth/service` (hash password, `toSessionUser`), `db.ts`, `audit`, `lists.ts` (ruoli).

**Come si modifica:** un nuovo campo dell'utente si aggiunge allo schema Prisma (migrazione), agli schemi zod, al service e al tipo `User` del frontend.

## Test (`server/tests`)

| File              | Cosa copre                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `helpers.ts`      | `app`, `resetDatabase()`, `loginAs('admin' \| 'operator' \| 'seller')`, `SEED_USERS`.           |
| `global-setup.ts` | Crea il database temporaneo con le migrazioni prima di tutti i test.                            |
| `health.test.ts`  | `/api/health` e 404 JSON.                                                                       |
| `seed.test.ts`    | I dati di esempio.                                                                              |
| `auth.test.ts`    | Login (ok, errori, disattivato, blocco tentativi, registro), sessione, logout, cambio password. |
| `users.test.ts`   | Permessi (401/403), elenco, creazione, modifica, reset password, disattivazione.                |

Ogni file parte con `beforeAll(resetDatabase)`. Un test che ha bisogno di un utente loggato usa `loginAs`, che restituisce un agente supertest con il cookie già impostato.

## Frontend (`client/src`)

### `api/` - dialogo con il backend

| File        | Cosa fa                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts` | `api.get/post/put/del(path, body)`: prefisso `/api`, JSON, cookie, errori come `ApiError`. `errorMessage(err)` per il testo da mostrare. Su un 401 inatteso emette l'evento `SESSION_EXPIRED_EVENT`. |
| `types.ts`  | I tipi delle risposte (`User`, `Role`) e le etichette dei ruoli (`ROLE_LABELS`).                                                                                                                     |

**Come si modifica:** ogni nuova risposta del backend ha il suo tipo in `types.ts`; le pagine chiamano `api.*` con quel tipo.

### `auth/` - accesso

| File              | Cosa fa                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthContext.tsx` | `AuthProvider` tiene l'utente loggato (chiede `/auth/me` all'avvio) ed espone `useAuth()` con `user`, `loading`, `login`, `logout`. Ascolta l'evento di sessione scaduta. |
| `RequireAuth.tsx` | Rotta contenitore: senza utente rimanda a `/accesso`.                                                                                                                     |
| `RequireRole.tsx` | Rotta contenitore: mostra "Pagina riservata" se il ruolo non è tra quelli ammessi.                                                                                        |
| `LoginPage.tsx`   | La pagina di accesso.                                                                                                                                                     |

Nota: all'avvio, se nessuno è loggato, la console del browser mostra un 401 su `/auth/me`. È normale: è la domanda "chi sono?" a cui il backend risponde "nessuno".

### `layout/` - struttura delle pagine

| File               | Cosa fa                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `Shell.tsx`        | Barra laterale (nome azienda, menu per ruolo, utente, Esci) e area contenuto (`<Outlet />`). |
| `NotFoundPage.tsx` | Pagina per indirizzi sconosciuti.                                                            |

**Come si modifica:** una nuova sezione si aggiunge come `NavLink` in `Shell.tsx` e come `Route` in `App.tsx`.

### `home/`, `profile/`, `users/` - le pagine

| File                          | Cosa fa                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `home/HomePage.tsx`           | Pagina iniziale dopo l'accesso.                                                                          |
| `profile/ProfilePage.tsx`     | Cambio della propria password (`PUT /auth/password`).                                                    |
| `users/UsersPage.tsx`         | Tabella utenti, apre le finestre di creazione, modifica e reset password; attiva/disattiva con conferma. |
| `users/UserForm.tsx`          | Form usato sia per creare (con password) sia per modificare (senza).                                     |
| `users/ResetPasswordForm.tsx` | Form per assegnare una nuova password a un collega.                                                      |

Schema comune a tutte le pagine: stato locale con `useState`, caricamento in `useEffect`, chiamate `api.*`, errori mostrati in un `Alert`. Dopo un salvataggio la pagina aggiorna la lista con l'oggetto restituito dal backend, senza ricaricare tutto.

### `ui/` - componenti condivisi

| File         | Cosa fa                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `Button.tsx` | Pulsante con varianti `primary`, `secondary`, `danger`, `ghost` e taglia `small`.              |
| `Field.tsx`  | Etichetta + campo + eventuale suggerimento.                                                    |
| `Alert.tsx`  | Messaggio di errore, conferma o informazione.                                                  |
| `Modal.tsx`  | Finestra di dialogo basata su `<dialog>`: Esc e clic fuori la chiudono, focus sul primo campo. |

Lo stile è tutto in `styles.css`, con le classi usate da questi componenti (`.btn`, `.field`, `.alert`, `.modal`, `.table`, `.badge`).
