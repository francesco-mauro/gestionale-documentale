import request from 'supertest';
import { runSeed, SEED_PASSWORD } from '../prisma/seed.js';
import { createApp } from '../src/app.js';

// Un'unica app Express per tutti i test: non si mette in ascolto su nessuna porta,
// supertest le passa le richieste direttamente.
export const app = createApp();

// Gli utenti creati dal seed, uno per ruolo. La password è la stessa per tutti.
export const SEED_USERS = {
  admin: { email: 'admin@esempio.it', name: 'Anna Ferrari' },
  operator: { email: 'operatore@esempio.it', name: 'Luca Bianchi' },
  seller: { email: 'venditore@esempio.it', name: 'Marco Colombo' },
} as const;
export type SeedRole = keyof typeof SEED_USERS;

export { SEED_PASSWORD };

// Riporta il database di test ai dati del seed. Da chiamare in beforeAll di ogni file di test.
export async function resetDatabase() {
  await runSeed({ reset: true });
}

// Restituisce un "agente" supertest già autenticato con l'utente di esempio del ruolo dato.
// L'agente conserva il cookie di sessione tra una chiamata e l'altra, come farebbe un browser.
export async function loginAs(role: SeedRole) {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: SEED_USERS[role].email, password: SEED_PASSWORD })
    .expect(200);
  return agent;
}
