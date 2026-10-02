# API

Tutte le rotte stanno sotto `/api`, parlano JSON e usano il cookie di sessione `sid` (impostato dal login). Questo documento elenca ogni endpoint con metodo, percorso, ruolo richiesto ed esempi. Si aggiorna a ogni fase.

## Regole comuni

- **Errori**: la risposta è sempre `{ "error": "messaggio in italiano" }`, pronto da mostrare all'utente.
  - `400` dati non validi (il messaggio elenca i problemi, es. `"Email non valida. La password deve avere almeno 8 caratteri"`)
  - `401` accesso richiesto (nessuna sessione o sessione scaduta)
  - `403` ruolo non sufficiente, oppure utente disattivato al login
  - `404` risorsa non trovata
  - `409` conflitto (es. email già usata)
  - `429` troppi tentativi di login
  - `500` errore interno (il dettaglio finisce nel log del server, non nella risposta)
- **Ruoli**: `ADMIN` (Amministratore), `OPERATOR` (Operatore), `SELLER` (Venditore). "Tutti" significa qualsiasi utente con sessione valida.
- **Utente nelle risposte**: gli endpoint restituiscono sempre l'utente senza l'hash della password:

```json
{
  "id": 1,
  "name": "Anna Ferrari",
  "email": "admin@esempio.it",
  "role": "ADMIN",
  "active": true,
  "createdAt": "2026-09-29T12:31:00.000Z",
  "updatedAt": "2026-09-29T12:31:00.000Z"
}
```

- `GET /api/health` (nessun login): risponde `{ "status": "ok" }`. Serve al frontend per capire se il server risponde.

## Accesso (`/api/auth`)

| Metodo | Percorso             | Ruolo | Cosa fa                                            |
| ------ | -------------------- | ----- | -------------------------------------------------- |
| POST   | `/api/auth/login`    | -     | Verifica email e password, apre la sessione        |
| POST   | `/api/auth/logout`   | -     | Chiude la sessione (funziona anche se già scaduta) |
| GET    | `/api/auth/me`       | Tutti | Restituisce l'utente corrente                      |
| PUT    | `/api/auth/password` | Tutti | Cambia la propria password                         |

### POST /api/auth/login

Richiesta:

```json
{ "email": "admin@esempio.it", "password": "password123" }
```

L'email viene pulita da spazi e maiuscole. Risposta `200`: l'utente (vedi sopra) e l'header `Set-Cookie: sid=...; HttpOnly; SameSite=Lax; Path=/`.

Errori: `400` campi mancanti; `401` `"Email o password non corretti"` (stesso messaggio se l'email non esiste); `403` `"Utente disattivato, contatta l’amministratore"`; `429` `"Troppi tentativi, riprova tra 15 minuti"` dopo 5 errori sulla stessa email.

### POST /api/auth/logout

Nessun corpo. Risposta `204` e cookie cancellato. Risponde `204` anche senza sessione.

### GET /api/auth/me

Risposta `200`: l'utente corrente. `401` `"Accesso richiesto"` se il cookie manca, la sessione è scaduta o l'utente è stato disattivato. La scadenza della sessione (12 ore, `SESSION_HOURS`) si rinnova a ogni richiesta quando ne è passata più della metà.

### PUT /api/auth/password

```json
{ "currentPassword": "password123", "newPassword": "nuovaPassword1" }
```

Risposta `204`. Chiude le sessioni dell'utente su altri dispositivi, non quella corrente. Errori: `400` `"La password attuale non è corretta"`, `400` `"La password deve avere almeno 8 caratteri"`.

## Utenti (`/api/users`) — solo ADMIN

| Metodo | Percorso                  | Cosa fa                                                    |
| ------ | ------------------------- | ---------------------------------------------------------- |
| GET    | `/api/users`              | Elenco di tutti gli utenti, in ordine di nome              |
| POST   | `/api/users`              | Crea un utente                                             |
| PUT    | `/api/users/:id`          | Modifica nome, email, ruolo                                |
| PUT    | `/api/users/:id/password` | Reimposta la password e chiude le sessioni di quell'utente |
| PUT    | `/api/users/:id/active`   | Attiva o disattiva l'utente                                |

Con un ruolo diverso da `ADMIN` tutte rispondono `403` `"Non hai i permessi per questa operazione"`.

### POST /api/users

```json
{ "name": "Paola Neri", "email": "paola@esempio.it", "password": "segreto123", "role": "OPERATOR" }
```

Risposta `201` con l'utente creato. Errori: `400` campi non validi o ruolo sconosciuto (`"Ruolo non valido"`); `409` `"Esiste già un utente con questa email"`.

### PUT /api/users/:id

```json
{ "name": "Paola Neri", "email": "paola@esempio.it", "role": "SELLER" }
```

Risposta `200` con l'utente aggiornato. Errori: `404` `"Utente non trovato"`, `409` email già di un altro utente.

### PUT /api/users/:id/password

```json
{ "password": "nuovaPassword1" }
```

Risposta `204`. L'utente dovrà rientrare con la nuova password.

### PUT /api/users/:id/active

```json
{ "active": false }
```

Risposta `200` con l'utente aggiornato. Disattivare chiude subito le sue sessioni e impedisce il login. `400` `"Non puoi disattivare il tuo utente"` se `:id` è l'Amministratore che fa la richiesta.

## Registro attività

Non ha ancora endpoint di lettura (fase 7), ma gli endpoint di questa fase scrivono già righe nella tabella `AuditLog`: login (`LOGIN`), cambio password, creazione e modifica utenti, reset password, attivazione e disattivazione (`CREATE` / `UPDATE` su `USER`).

## In arrivo

- Fase 4: `/api/clients`, `/api/practices`, `/api/pending`, `/api/lists`.
- Fase 5: `/api/documents` e `/api/practices/:id/documents`.
- Fase 6: `/api/search`.
- Fase 7: `/api/audit`.
