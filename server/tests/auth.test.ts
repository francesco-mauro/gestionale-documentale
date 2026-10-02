import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, loginAs, resetDatabase, SEED_PASSWORD, SEED_USERS } from './helpers.js';

describe('POST /api/auth/login', () => {
  beforeAll(resetDatabase);

  it('con credenziali corrette risponde 200 con l’utente (senza hash) e imposta il cookie di sessione', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_USERS.admin.email, password: SEED_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: SEED_USERS.admin.email,
      name: 'Anna Ferrari',
      role: 'ADMIN',
    });
    expect(res.body.passwordHash).toBeUndefined();

    const cookie = String(res.headers['set-cookie']?.[0] ?? '');
    expect(cookie).toMatch(/^sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('accetta l’email scritta con maiuscole e spazi attorno', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  Admin@Esempio.IT ', password: SEED_PASSWORD });
    expect(res.status).toBe(200);
  });

  it('con password sbagliata risponde 401 con un messaggio in italiano', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_USERS.admin.email, password: 'sbagliata' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Email o password non corretti' });
  });

  it('con email sconosciuta risponde 401 con lo stesso messaggio, senza rivelare se l’email esiste', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nessuno@esempio.it', password: SEED_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Email o password non corretti' });
  });

  it('con utente disattivato risponde 403', async () => {
    await prisma.user.update({
      where: { email: SEED_USERS.seller.email },
      data: { active: false },
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_USERS.seller.email, password: SEED_PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Utente disattivato, contatta l’amministratore' });
    await prisma.user.update({ where: { email: SEED_USERS.seller.email }, data: { active: true } });
  });

  it('senza email o password risponde 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('registra l’accesso nel registro attività', async () => {
    const before = await prisma.auditLog.count({ where: { action: 'LOGIN' } });
    await loginAs('operator');
    const after = await prisma.auditLog.count({ where: { action: 'LOGIN' } });
    expect(after).toBe(before + 1);
  });

  it('dopo 5 tentativi falliti blocca l’email per un po’ (429)', async () => {
    const attempt = () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'sconosciuto@esempio.it', password: 'qualsiasi' });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: 'Troppi tentativi, riprova tra 15 minuti' });
  });
});

describe('GET /api/auth/me', () => {
  beforeAll(resetDatabase);

  it('senza cookie risponde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Accesso richiesto' });
  });

  it('con sessione valida risponde con l’utente corrente', async () => {
    const agent = await loginAs('seller');
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: SEED_USERS.seller.email, role: 'SELLER' });
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('con sessione scaduta risponde 401', async () => {
    const agent = await loginAs('operator');
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: SEED_USERS.operator.email },
    });
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  beforeAll(resetDatabase);

  it('chiude la sessione: dopo il logout /me risponde 401', async () => {
    const agent = await loginAs('admin');
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('senza sessione risponde comunque 204', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('PUT /api/auth/password', () => {
  beforeAll(resetDatabase);

  it('senza login risponde 401', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .send({ currentPassword: SEED_PASSWORD, newPassword: 'nuovaPassword1' });
    expect(res.status).toBe(401);
  });

  it('con password attuale sbagliata risponde 400', async () => {
    const agent = await loginAs('seller');
    const res = await agent
      .put('/api/auth/password')
      .send({ currentPassword: 'sbagliata', newPassword: 'nuovaPassword1' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'La password attuale non è corretta' });
  });

  it('con nuova password troppo corta risponde 400', async () => {
    const agent = await loginAs('seller');
    const res = await agent
      .put('/api/auth/password')
      .send({ currentPassword: SEED_PASSWORD, newPassword: 'corta' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('almeno 8 caratteri');
  });

  it('cambia la password, chiude le altre sessioni e mantiene quella corrente', async () => {
    const agent = await loginAs('operator');
    const otherDevice = await loginAs('operator');

    const res = await agent
      .put('/api/auth/password')
      .send({ currentPassword: SEED_PASSWORD, newPassword: 'nuovaPassword1' });
    expect(res.status).toBe(204);

    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await otherDevice.get('/api/auth/me')).status).toBe(401);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_USERS.operator.email, password: SEED_PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: SEED_USERS.operator.email, password: 'nuovaPassword1' });
    expect(newLogin.status).toBe(200);
  });
});
