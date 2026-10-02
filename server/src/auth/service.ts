import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as audit from '../audit/service.js';
import { config } from '../config.js';
import { prisma } from '../db.js';
import type { User } from '../generated/prisma/client.js';
import type { Role } from '../lists.js';
import { HttpError } from '../shared/errors.js';

// L'utente come lo vedono il resto del backend e il frontend: senza l'hash della password.
export type SessionUser = Omit<User, 'passwordHash' | 'role'> & { role: Role };

export function toSessionUser(user: User): SessionUser {
  const { passwordHash: _hash, ...rest } = user;
  return { ...rest, role: rest.role as Role };
}

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Hash "finto" usato quando l'email non esiste: così il confronto costa lo stesso tempo
// e dall'esterno non si capisce se l'email è registrata.
const DUMMY_HASH = bcrypt.hashSync('password-inesistente', BCRYPT_ROUNDS);

function sessionDurationMs() {
  return config.SESSION_HOURS * 60 * 60 * 1000;
}

// Verifica le credenziali e apre una sessione. Restituisce l'utente e il token
// che il router mette nel cookie.
export async function login(
  email: string,
  password: string,
): Promise<{ user: SessionUser; token: string }> {
  assertNotLocked(email);

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    recordFailedAttempt(email);
    throw new HttpError(401, 'Email o password non corretti');
  }
  if (!user.active) throw new HttpError(403, 'Utente disattivato, contatta l’amministratore');
  clearFailedAttempts(email);

  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + sessionDurationMs()) },
  });
  await audit.record(user.id, 'LOGIN', 'USER', user.id, `${user.name} ha effettuato l’accesso`);
  return { user: toSessionUser(user), token };
}

// Dato il token del cookie, restituisce l'utente se la sessione è valida, altrimenti null.
// Le sessioni scadute vengono eliminate. La scadenza si rinnova mentre l'utente lavora:
// se è passata più di metà della durata, viene allungata di nuovo.
export async function getSessionUser(token: string): Promise<SessionUser | null> {
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;

  const remainingMs = session.expiresAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    await prisma.session.delete({ where: { id: token } });
    return null;
  }
  if (!session.user.active) return null;

  if (remainingMs < sessionDurationMs() / 2) {
    await prisma.session.update({
      where: { id: token },
      data: { expiresAt: new Date(Date.now() + sessionDurationMs()) },
    });
  }
  return toSessionUser(session.user);
}

export async function logout(token: string) {
  await prisma.session.deleteMany({ where: { id: token } });
}

// Cambia la password dell'utente corrente e chiude le sue sessioni sugli altri dispositivi,
// lasciando aperta quella da cui sta operando.
export async function changePassword(
  user: SessionUser,
  currentToken: string,
  currentPassword: string,
  newPassword: string,
) {
  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(currentPassword, full.passwordHash))) {
    throw new HttpError(400, 'La password attuale non è corretta');
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await prisma.session.deleteMany({ where: { userId: user.id, id: { not: currentToken } } });
  await audit.record(
    user.id,
    'UPDATE',
    'USER',
    user.id,
    `${user.name} ha cambiato la propria password`,
  );
}

// Limite ai tentativi di login: dopo MAX_ATTEMPTS errori sulla stessa email
// l'accesso resta bloccato per LOCK_MINUTES. Il conteggio sta in memoria:
// si azzera al riavvio del server, ed è sufficiente per un'applicazione d'ufficio.
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();

function assertNotLocked(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry) return;
  if (Date.now() - entry.firstAt > LOCK_MINUTES * 60_000) {
    failedAttempts.delete(email);
    return;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    throw new HttpError(429, `Troppi tentativi, riprova tra ${LOCK_MINUTES} minuti`);
  }
}

function recordFailedAttempt(email: string) {
  const entry = failedAttempts.get(email);
  if (entry) entry.count += 1;
  else failedAttempts.set(email, { count: 1, firstAt: Date.now() });
}

function clearFailedAttempts(email: string) {
  failedAttempts.delete(email);
}
