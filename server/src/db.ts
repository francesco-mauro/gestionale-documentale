import fs from 'node:fs';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { paths } from './config.js';
import { PrismaClient } from './generated/prisma/client.js';

// Un solo client Prisma per tutto il backend: si importa da qui, non si crea altrove.
// Prisma 7 parla con SQLite tramite un "adapter" (better-sqlite3), a cui diamo il percorso del file.
fs.mkdirSync(path.dirname(paths.databaseFile), { recursive: true });

const adapter = new PrismaBetterSqlite3({ url: paths.databaseFile });

export const prisma = new PrismaClient({ adapter });

// Modalità WAL: più letture contemporanee senza bloccarsi a vicenda e backup sicuro
// (VACUUM INTO) mentre il gestionale è in funzione. Resta impostata sul file del database.
await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL');
