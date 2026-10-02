import * as audit from '../audit/service.js';
import { hashPassword, toSessionUser, type SessionUser } from '../auth/service.js';
import { prisma } from '../db.js';
import type { Role } from '../lists.js';
import { HttpError } from '../shared/errors.js';

// Gestione degli utenti, riservata all'Amministratore. "actor" è chi sta facendo l'operazione,
// serve per il registro attività.

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
  return users.map(toSessionUser);
}

export async function createUser(
  actor: SessionUser,
  input: { name: string; email: string; password: string; role: Role },
) {
  await assertEmailFree(input.email);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
  });
  await audit.record(
    actor.id,
    'CREATE',
    'USER',
    user.id,
    `${actor.name} ha creato l’utente ${user.name}`,
  );
  return toSessionUser(user);
}

export async function updateUser(
  actor: SessionUser,
  id: number,
  input: { name: string; email: string; role: Role },
) {
  await findUserOrThrow(id);
  await assertEmailFree(input.email, id);
  const user = await prisma.user.update({ where: { id }, data: input });
  await audit.record(
    actor.id,
    'UPDATE',
    'USER',
    id,
    `${actor.name} ha modificato l’utente ${user.name}`,
  );
  return toSessionUser(user);
}

// Reimposta la password e chiude tutte le sessioni dell'utente: dovrà rientrare con quella nuova.
export async function setPassword(actor: SessionUser, id: number, password: string) {
  const user = await findUserOrThrow(id);
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await audit.record(
    actor.id,
    'UPDATE',
    'USER',
    id,
    `${actor.name} ha reimpostato la password di ${user.name}`,
  );
}

// Un utente disattivato non può più accedere; le sue sessioni aperte vengono chiuse subito.
export async function setActive(actor: SessionUser, id: number, active: boolean) {
  if (id === actor.id && !active) throw new HttpError(400, 'Non puoi disattivare il tuo utente');
  await findUserOrThrow(id);
  const user = await prisma.user.update({ where: { id }, data: { active } });
  if (!active) await prisma.session.deleteMany({ where: { userId: id } });
  await audit.record(
    actor.id,
    'UPDATE',
    'USER',
    id,
    `${actor.name} ha ${active ? 'riattivato' : 'disattivato'} l’utente ${user.name}`,
  );
  return toSessionUser(user);
}

async function findUserOrThrow(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'Utente non trovato');
  return user;
}

// L'email è unica: prima di creare o modificare controlliamo che non sia già di un altro utente.
async function assertEmailFree(email: string, exceptId?: number) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== exceptId) {
    throw new HttpError(409, 'Esiste già un utente con questa email');
  }
}
