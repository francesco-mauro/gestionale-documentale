import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './auth/router.js';
import { errorHandler } from './shared/errors.js';
import { usersRouter } from './users/router.js';

// Costruisce l'applicazione Express senza metterla in ascolto:
// così i test la usano direttamente e index.ts la avvia sulla porta configurata.
export function createApp() {
  const app = express();

  // Header di sicurezza standard. Togliamo solo "upgrade-insecure-requests":
  // in ufficio il gestionale gira in HTTP sulla rete locale e quell'header
  // costringerebbe il browser a cercare una versione HTTPS che non esiste.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: { 'upgrade-insecure-requests': null },
      },
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);

  // Qualsiasi altro percorso /api sconosciuto risponde 404 in JSON, non con la pagina HTML.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Percorso non trovato' });
  });

  serveFrontend(app);
  app.use(errorHandler);
  return app;
}

// In produzione il backend serve anche il frontend compilato (client/dist),
// così c'è un solo processo da avviare. In sviluppo la cartella non esiste
// (il frontend lo serve Vite) e questa funzione non fa nulla.
function serveFrontend(app: express.Express) {
  const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
  if (!fs.existsSync(clientDist)) return;

  app.use(express.static(clientDist));
  // Le pagine del frontend (es. /clienti/12) le gestisce React nel browser:
  // per qualsiasi percorso non-API rimandiamo sempre index.html.
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
