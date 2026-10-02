# Decisioni tecniche

Le scelte importanti, con le alternative considerate e il motivo. Ogni voce indica la fase in cui è entrata nel codice. Le decisioni di prodotto (ruoli, permessi, cestino) vengono dal brief e dalle risposte del committente nella fase di pianificazione, riassunte in [PIANO.md](PIANO.md).

## 1. Un repository, due workspace npm (fase 1)

**Scelta:** una cartella principale con `package.json` che dichiara i workspace `server` e `client`. `npm install` dalla radice installa tutto; gli script comuni (`dev`, `build`, `test`, `lint`, `db:*`) stanno alla radice.

**Alternative:** due progetti separati (doppio `npm install`, doppia configurazione); un solo `package.json` per tutto (le dipendenze di frontend e backend si mescolano, la configurazione TypeScript diventa un compromesso).

**Motivo:** i workspace sono una funzione nativa di npm, senza strumenti in più, e tengono separate le dipendenze del browser da quelle di Node.

## 2. Express 5 (fase 1)

**Scelta:** Express nella versione 5.

**Alternative:** Express 4 (più tutorial in giro), Fastify (più veloce, ma meno diffuso).

**Motivo:** il brief chiede Express. La versione 5 gestisce da sola gli errori lanciati dentro le funzioni `async`: senza `try/catch` in ogni endpoint il codice resta più corto e più difficile da sbagliare.

## 3. Moduli ES con import che finiscono in `.js` (fase 1)

**Scelta:** backend in ESM (`"type": "module"`, `module: NodeNext`). Gli import relativi si scrivono con estensione `.js` (`./app.js`) anche se il file sorgente è `app.ts`.

**Alternative:** CommonJS (`require`), che non richiede estensioni ma è il formato "vecchio" e alcune librerie recenti non lo supportano più; l'opzione TypeScript `rewriteRelativeImportExtensions` per scrivere `.ts` negli import, ancora poco diffusa nei tutorial.

**Motivo:** ESM è lo standard verso cui va tutto l'ecosistema. L'estensione `.js` è ciò che Node vedrà dopo la compilazione: TypeScript non la riscrive. È una regola sola da ricordare. Anche il client generato da Prisma usa la stessa convenzione (`importFileExtension = "js"`).

## 4. TypeScript 5.9, non 7 (fase 1)

**Scelta:** TypeScript 5.9.

**Alternativa:** TypeScript 7, la nuova versione nativa (molto più veloce).

**Motivo:** al momento typescript-eslint non supporta la versione 7. Si aggiorna quando gli strumenti la supportano.

## 5. Niente `dotenv`: Node legge `.env` da solo (fase 1, esteso in fase 2)

**Scelta:** gli script usano `node --env-file-if-exists=.env`. `config.ts` valida i valori con zod e ferma l'avvio se qualcosa è sbagliato. Per la riga di comando di Prisma, che non legge `.env` da sola, `prisma.config.ts` usa la funzione integrata `process.loadEnvFile`.

**Alternativa:** il pacchetto `dotenv` (è quello che i documenti di Prisma suggeriscono).

**Motivo:** una dipendenza in meno; Node 24 ha questa funzione integrata. La validazione con zod trasforma un `.env` sbagliato in un errore chiaro all'avvio invece di un problema strano più tardi.

## 6. `tsx` solo in sviluppo, `tsc` per la produzione (fase 1)

**Scelta:** in sviluppo `node --import=tsx --watch src/index.ts` esegue il TypeScript direttamente e riavvia al salvataggio. In produzione si compila con `tsc` in `server/dist` e si avvia `node dist/index.js`. Anche il seed gira con `tsx`.

**Alternative:** eseguire TypeScript anche in produzione (Node 24 lo sa fare in parte, ma con limitazioni sugli import); `nodemon` + `ts-node` (due strumenti invece di uno).

**Motivo:** in produzione gira JavaScript puro, senza strumenti extra. `tsx` è un solo pacchetto di sviluppo.

## 7. Due `tsconfig` nel backend (fase 1)

**Scelta:** `tsconfig.json` controlla i tipi di tutto (codice, test, seed) senza produrre file; `tsconfig.build.json` lo estende e compila solo `src/` in `dist/`.

**Motivo:** i test e il seed devono essere controllati dai tipi ma non devono finire in produzione.

## 8. Test solo sul backend, su un database temporaneo creato dalle migrazioni (fase 1 e 2)

**Scelta:** vitest + supertest. I test chiamano `createApp()` senza aprire una porta. Prima di tutti i test, `tests/global-setup.ts` crea `tests/.tmp/test.db` con `prisma migrate deploy` e una cartella uploads temporanea; ogni file di test riparte dai dati del seed (`resetDatabase()`). I file di test girano uno alla volta. `loginAs(ruolo)` restituisce un agente supertest già autenticato.

**Alternative:** test anche sul frontend con React Testing Library; un database in memoria (`:memory:`) per ogni test; simulare Prisma con finti oggetti (mock).

**Motivo:** concordato col committente: le parti critiche (login, permessi, upload, ricerca) vivono nel backend. Usare le stesse migrazioni della produzione verifica anche quelle; usare il seed come dati di partenza evita di scrivere fixture doppie. Un database vero è più lento dei mock ma prova il comportamento reale.

## 9. Frontend senza libreria di componenti (fase 1, realizzato in fase 3)

**Scelta:** CSS scritto a mano in un solo file `styles.css`, pochi componenti base in `client/src/ui/` (`Button`, `Field`, `Alert`, `Modal`). Font di sistema, nessun font web.

**Alternativa:** Mantine, MUI o simili; Tailwind.

**Motivo:** concordato col committente. Una libreria UI è una dipendenza grossa da imparare e aggiornare; l'interfaccia ha poche schermate e può restare essenziale. Il font di sistema evita download: il gestionale gira in rete locale, anche senza internet.

## 10. Un solo wrapper per le chiamate API nel frontend (fase 1, esteso in fase 3)

**Scelta:** `client/src/api/client.ts` con `api.get/post/put/del`. Aggiunge il prefisso `/api`, invia JSON e cookie, converte gli errori in `ApiError` con il messaggio del backend. Su un 401 inatteso emette un evento che riporta l'app alla pagina di accesso.

**Alternativa:** librerie come TanStack Query o axios.

**Motivo:** con poche schermate `fetch` basta; un solo file da leggere per capire come il frontend parla col backend.

## 11. Prisma 7 con adapter `better-sqlite3` (fase 2)

**Scelta:** Prisma 7.10 (ultima versione stabile) con `@prisma/adapter-better-sqlite3` e `better-sqlite3`. Il client viene generato dal nuovo generatore `prisma-client` dentro `server/src/generated/prisma/` (ignorato da git, rigenerato da `postinstall` e `build`).

**Alternative:** Prisma 8, ancora in release candidate; Prisma 6, che non richiede l'adapter ma è la linea vecchia; l'adapter `libsql`; librerie più leggere di Prisma (Drizzle, Kysely) o `better-sqlite3` da solo con SQL a mano.

**Motivo:** il brief chiede Prisma. Dalla versione 7 Prisma richiede un adapter per parlare col database: `better-sqlite3` è il driver SQLite più diffuso e ha i binari precompilati per Windows, quindi `npm install` non deve compilare nulla. Generare il client dentro `src/` (invece che in `node_modules`) rende visibile che è codice del progetto e lo fa compilare con il resto.

## 12. Liste come stringhe validate dal codice, non enum del database (fase 2)

**Scelta:** ruoli, tipi pratica, stati e tipi documento sono colonne `String`. I valori ammessi stanno in `server/src/lists.ts` e vengono controllati con zod in ogni endpoint.

**Alternative:** enum di Prisma; tabelle di configurazione modificabili dall'interfaccia.

**Motivo:** concordato col committente che le liste siano fisse. Con le stringhe, aggiungere un tipo vuol dire toccare un solo file, senza migrazione. Le tabelle di configurazione avrebbero aggiunto tre tabelle e tre schermate.

## 13. Campi di testo facoltativi come stringa vuota, non `NULL` (fase 2)

**Scelta:** `phone`, `email`, `address`, `notes`, `siteAddress` hanno default `""`.

**Alternativa:** colonne nullable (`String?`), più "corrette" in teoria.

**Motivo:** i form del frontend lavorano con stringhe: con `""` non serve gestire il caso `null` in ogni campo, in TypeScript e nell'interfaccia. Per questo gestionale "telefono vuoto" e "telefono sconosciuto" sono la stessa cosa.

## 14. Il seed si rifiuta di toccare un database già popolato (fase 2)

**Scelta:** se esistono utenti, `npm run db:seed` non fa nulla e lo dice. Solo con `SEED_RESET=1` svuota le tabelle e rimuove i file dei documenti registrati, poi ricarica gli esempi.

**Alternativa:** un seed che cancella e ricarica sempre (comodo in sviluppo, pericoloso in produzione).

**Motivo:** lo stesso comando sarà a disposizione sul PC dell'ufficio: un lancio per sbaglio non deve cancellare i dati veri.

## 15. Sessioni in una tabella propria, cookie senza scadenza nel browser (fase 3)

**Scelta:** al login si crea una riga in `Session` con un token casuale di 32 byte e una scadenza (`SESSION_HOURS`, 12 ore); il token va nel cookie `sid`, `httpOnly` e `SameSite=Lax`, senza `maxAge` (si cancella chiudendo il browser). A ogni richiesta `requireAuth` cerca la sessione, e se ne è passata più di metà la rinnova. Reset password e disattivazione cancellano le sessioni dell'utente.

**Alternative:** `express-session` con uno store SQLite (due pacchetti in più); token JWT firmati senza tabella (non si possono revocare: disattivare un utente non lo butta fuori).

**Motivo:** la tabella si legge in venti righe e permette di chiudere le sessioni dall'esterno, che per un gestionale con dati personali conta più della velocità. Il cookie di sessione senza scadenza nel browser fa rientrare ogni mattina: un'abitudine sana per PC condivisi in ufficio.

## 16. `bcryptjs` invece di `bcrypt` (fase 2 per il seed, fase 3 per il login)

**Scelta:** `bcryptjs` con costo 10. Al login, se l'email non esiste, si confronta comunque contro un hash finto, così il tempo di risposta non rivela se l'email è registrata.

**Alternative:** `bcrypt` (nativo, richiede compilazione o binari per Windows); `argon2` (più moderno, anch'esso nativo); `scrypt` integrato in Node (ottimo, ma il brief chiede bcrypt o argon2).

**Motivo:** stesso algoritmo di `bcrypt`, in puro JavaScript: `npm install` non compila nulla e non dipende dalla versione di Node.

## 17. Limite ai tentativi di login in memoria (fase 3)

**Scelta:** una `Map` nel service `auth`: dopo 5 errori sulla stessa email, l'accesso resta bloccato 15 minuti. Il conteggio si azzera al riavvio del server.

**Alternativa:** `express-rate-limit` (un pacchetto, più opzioni); salvare i tentativi nel database.

**Motivo:** venti righe di codice sono sufficienti per un'applicazione d'ufficio con un solo processo, e non aggiungono dipendenze.

## 18. Helmet con la CSP predefinita, senza `upgrade-insecure-requests` (fase 3)

**Scelta:** `helmet()` con tutti gli header standard, ma senza la direttiva `upgrade-insecure-requests`.

**Alternativa:** niente helmet; helmet senza Content-Security-Policy.

**Motivo:** gli header di sicurezza costano una riga. Quella direttiva però obbliga il browser a cercare la versione HTTPS di ogni risorsa, che in ufficio (HTTP in rete locale) non esiste: il gestionale non caricherebbe.

## 19. Un solo tipo `SessionUser` per l'utente "pubblico" (fase 3)

**Scelta:** `toSessionUser(user)` toglie `passwordHash` dal modello Prisma; tutto ciò che esce dal backend (login, `/me`, elenco utenti) passa da lì.

**Alternativa:** selezionare i campi a mano in ogni query (`select: {...}`).

**Motivo:** un punto solo in cui è impossibile dimenticare di togliere l'hash.

## 20. React Router in modalità dichiarativa e `<dialog>` nativo (fase 3)

**Scelta:** `BrowserRouter` + `Routes`/`Route`, con rotte contenitore `RequireAuth` e `RequireRole` che proteggono le pagine figlie. Le finestre sopra la pagina usano l'elemento `<dialog>` del browser (`showModal()`).

**Alternative:** la modalità "framework" di React Router (loader, azioni, generazione delle rotte dai file), più potente ma con molte più cose da imparare; una libreria di modali.

**Motivo:** poche schermate, tutto leggibile in `App.tsx`. `<dialog>` gestisce da solo blocco della pagina, tasto Esc e focus, senza codice o dipendenze.

## Decisioni prese in pianificazione, da realizzare nelle prossime fasi

- **Controllo del tipo di file con i primi byte** (fase 5): PDF, JPEG, PNG e ZIP (Word/Excel) si riconoscono da pochi byte iniziali; niente pacchetto `file-type`.
- **Ruoli e permessi**: 3 ruoli (`ADMIN`, `OPERATOR`, `SELLER`). Il venditore crea clienti, pratiche e documenti che nascono "da confermare"; Operatore e Amministratore confermano. Tutti vedono tutto l'archivio.
- **Cestino solo per i documenti**: clienti e pratiche si eliminano solo se vuoti e solo da Amministratore.
- **Dove gira**: PC o server Windows in ufficio, come servizio Windows (NSSM), in HTTP sulla rete locale.
