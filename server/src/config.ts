import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Legge e valida le variabili d'ambiente una volta sola, all'avvio.
// Se un valore manca o è sbagliato il server si ferma subito con un messaggio chiaro,
// invece di fallire in modo strano più tardi.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Percorso del file SQLite, nella forma "file:./cartella/nome.db", relativo alla cartella server/.
  DATABASE_URL: z.string().startsWith('file:').default('file:./data/gestionale.db'),
  // Cartella dei documenti caricati, relativa alla cartella server/.
  UPLOAD_DIR: z.string().min(1).default('./uploads'),
  // Durata di una sessione di login, in ore. Si rinnova mentre l'utente lavora.
  SESSION_HOURS: z.coerce.number().positive().default(12),
  // "true" solo se il gestionale è servito in HTTPS: il cookie viaggia solo su connessioni cifrate.
  COOKIE_SECURE: z.stringbool().default(false),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  console.error('Configurazione non valida (controlla il file .env):');
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const config = result.data;

// Percorsi assoluti calcolati a partire dalla cartella server/, così non dipendono
// da dove viene lanciato il processo (sviluppo, produzione, test).
const serverRoot = fileURLToPath(new URL('..', import.meta.url));

export const paths = {
  serverRoot,
  databaseFile: path.resolve(serverRoot, config.DATABASE_URL.slice('file:'.length)),
  uploadDir: path.resolve(serverRoot, config.UPLOAD_DIR),
};
