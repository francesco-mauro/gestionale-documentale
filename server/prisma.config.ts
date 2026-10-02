import { loadEnvFile } from 'node:process';
import { defineConfig } from 'prisma/config';

// Configurazione della riga di comando di Prisma (migrazioni, generate, seed, studio).
// Prisma 7 non legge il file .env da solo: usiamo la funzione integrata di Node.
// Se DATABASE_URL è già nell'ambiente (come nei test) il file .env non serve.
if (!process.env.DATABASE_URL) {
  try {
    loadEnvFile('.env');
  } catch {
    // Nessun .env: si usa il valore predefinito qui sotto, lo stesso di src/config.ts.
  }
}

const databaseUrl = process.env.DATABASE_URL ?? 'file:./data/gestionale.db';

// Limite di Prisma 7.10: le migrazioni vogliono "file:./percorso", Prisma Studio invece
// vuole "file://./percorso" (altrimenti risponde "protocol not supported").
// Teniamo in .env la forma delle migrazioni e la adattiamo solo per il comando studio.
const isStudio = process.argv.includes('studio');
const urlForCommand =
  isStudio && !databaseUrl.startsWith('file://')
    ? databaseUrl.replace('file:', 'file://')
    : databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --env-file-if-exists=.env --import=tsx prisma/seed.ts',
  },
  datasource: {
    url: urlForCommand,
  },
});
