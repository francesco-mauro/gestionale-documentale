import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('risponde 200 con { status: "ok" }', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('un percorso /api sconosciuto risponde 404 in JSON, non in HTML', async () => {
    const res = await request(createApp()).get('/api/non-esiste');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Percorso non trovato' });
  });
});
