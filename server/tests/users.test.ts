import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, loginAs, resetDatabase, SEED_USERS } from './helpers.js';

const newUser = {
  name: 'Paola Neri',
  email: 'paola@esempio.it',
  password: 'segreto123',
  role: 'OPERATOR',
};

async function idOf(email: string) {
  return (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
}

describe('/api/users (solo Amministratore)', () => {
  beforeAll(resetDatabase);

  it('senza login risponde 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('Operatore e Venditore ricevono 403', async () => {
    for (const role of ['operator', 'seller'] as const) {
      const agent = await loginAs(role);
      const res = await agent.get('/api/users');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Non hai i permessi per questa operazione' });
    }
  });

  it('GET elenca gli utenti in ordine di nome, senza hash delle password', async () => {
    const admin = await loginAs('admin');
    const res = await admin.get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.map((u: { name: string }) => u.name)).toEqual([
      'Anna Ferrari',
      'Luca Bianchi',
      'Marco Colombo',
    ]);
    for (const u of res.body) expect(u.passwordHash).toBeUndefined();
  });

  it('POST crea un utente (201) che può subito accedere', async () => {
    const admin = await loginAs('admin');
    const res = await admin.post('/api/users').send(newUser);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Paola Neri',
      email: 'paola@esempio.it',
      role: 'OPERATOR',
      active: true,
    });
    expect(res.body.passwordHash).toBeUndefined();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password });
    expect(login.status).toBe(200);
  });

  it('POST con email già usata risponde 409', async () => {
    const admin = await loginAs('admin');
    const res = await admin.post('/api/users').send({ ...newUser, email: SEED_USERS.seller.email });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Esiste già un utente con questa email' });
  });

  it('POST con password corta risponde 400', async () => {
    const admin = await loginAs('admin');
    const res = await admin
      .post('/api/users')
      .send({ ...newUser, email: 'x@esempio.it', password: 'corta' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('almeno 8 caratteri');
  });

  it('POST con ruolo sconosciuto risponde 400', async () => {
    const admin = await loginAs('admin');
    const res = await admin
      .post('/api/users')
      .send({ ...newUser, email: 'y@esempio.it', role: 'CAPO' });
    expect(res.status).toBe(400);
  });

  it('PUT /:id aggiorna nome, email e ruolo', async () => {
    const admin = await loginAs('admin');
    const id = await idOf(SEED_USERS.seller.email);
    const res = await admin
      .put(`/api/users/${id}`)
      .send({ name: 'Marco Colombo Rossi', email: 'marco@esempio.it', role: 'OPERATOR' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      name: 'Marco Colombo Rossi',
      email: 'marco@esempio.it',
      role: 'OPERATOR',
    });
  });

  it('PUT /:id con id inesistente risponde 404', async () => {
    const admin = await loginAs('admin');
    const res = await admin
      .put('/api/users/9999')
      .send({ name: 'Nessuno', email: 'nessuno@esempio.it', role: 'SELLER' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Utente non trovato' });
  });

  it('PUT /:id/password reimposta la password e chiude le sessioni di quell’utente', async () => {
    const operator = await loginAs('operator');
    const admin = await loginAs('admin');
    const id = await idOf(SEED_USERS.operator.email);

    const res = await admin.put(`/api/users/${id}/password`).send({ password: 'reimpostata1' });
    expect(res.status).toBe(204);

    expect((await operator.get('/api/auth/me')).status).toBe(401);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_USERS.operator.email, password: 'reimpostata1' });
    expect(login.status).toBe(200);
  });

  it('PUT /:id/active false chiude le sessioni e impedisce il login', async () => {
    const paola = request.agent(app);
    await paola
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password })
      .expect(200);
    const admin = await loginAs('admin');
    const id = await idOf(newUser.email);

    const res = await admin.put(`/api/users/${id}/active`).send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, active: false });

    expect((await paola.get('/api/auth/me')).status).toBe(401);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password });
    expect(login.status).toBe(403);
  });

  it('l’Amministratore non può disattivare il proprio utente (400)', async () => {
    const admin = await loginAs('admin');
    const id = await idOf(SEED_USERS.admin.email);
    const res = await admin.put(`/api/users/${id}/active`).send({ active: false });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Non puoi disattivare il tuo utente' });
  });

  it('registra creazione e modifica nel registro attività', async () => {
    const count = await prisma.auditLog.count({
      where: { entityType: 'USER', action: { in: ['CREATE', 'UPDATE'] } },
    });
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
