import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { beforeAll, describe, expect, it } from 'vitest';
import { runSeed, SEED_PASSWORD } from '../prisma/seed.js';
import { paths } from '../src/config.js';
import { prisma } from '../src/db.js';

describe('seed dei dati di esempio', () => {
  beforeAll(async () => {
    await runSeed({ reset: true });
  });

  it('crea un utente per ogni ruolo, con password verificabile', async () => {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    expect(users.map((u) => u.role)).toEqual(['ADMIN', 'OPERATOR', 'SELLER']);
    expect(await bcrypt.compare(SEED_PASSWORD, users[0]!.passwordHash)).toBe(true);
  });

  it('crea clienti, pratiche e documenti collegati tra loro', async () => {
    expect(await prisma.client.count()).toBe(5);
    expect(await prisma.practice.count()).toBe(8);
    const documents = await prisma.document.findMany({
      include: { practice: { include: { client: true } } },
    });
    expect(documents.length).toBeGreaterThanOrEqual(6);
    for (const doc of documents) expect(doc.practice.client.name).not.toBe('');
  });

  it('copia i file dei documenti nella cartella uploads', async () => {
    const documents = await prisma.document.findMany();
    for (const doc of documents) {
      const file = path.join(paths.uploadDir, doc.storedName);
      expect(fs.existsSync(file), `manca il file ${doc.storedName}`).toBe(true);
      expect(fs.statSync(file).size).toBe(doc.sizeBytes);
    }
  });

  it('lascia qualcosa da confermare e un documento nel cestino, per provare le schermate', async () => {
    expect(await prisma.client.count({ where: { confirmedAt: null } })).toBeGreaterThan(0);
    expect(await prisma.practice.count({ where: { confirmedAt: null } })).toBeGreaterThan(0);
    expect(await prisma.document.count({ where: { deletedAt: { not: null } } })).toBe(1);
  });

  it('scrive nel registro attività', async () => {
    expect(await prisma.auditLog.count()).toBeGreaterThan(0);
  });

  it('se rilanciato senza reset non duplica i dati', async () => {
    expect(await runSeed({ reset: false })).toBe('skipped');
    expect(await prisma.user.count()).toBe(3);
  });
});
