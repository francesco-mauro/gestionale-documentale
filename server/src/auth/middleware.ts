import type { Request, RequestHandler } from 'express';
import type { Role } from '../lists.js';
import { HttpError } from '../shared/errors.js';
import { getSessionUser, type SessionUser } from './service.js';

// Nome del cookie che contiene il token di sessione.
export const SESSION_COOKIE = 'sid';

// Aggiunge a Request il campo "user", che requireAuth valorizza.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

// Controlla che la richiesta abbia una sessione valida e mette l'utente in req.user.
// Si usa su ogni rotta riservata: router.get('/x', requireAuth, ...).
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const user = token ? await getSessionUser(token) : null;
  if (!user) throw new HttpError(401, 'Accesso richiesto');
  req.user = user;
  next();
};

// Controlla che l'utente abbia uno dei ruoli indicati. Va sempre dopo requireAuth:
// router.get('/x', requireAuth, requireRole('ADMIN'), ...).
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(currentUser(req).role)) {
      throw new HttpError(403, 'Non hai i permessi per questa operazione');
    }
    next();
  };
}

// L'utente della richiesta corrente, garantito presente. Da usare solo dopo requireAuth.
export function currentUser(req: Request): SessionUser {
  if (!req.user) throw new HttpError(401, 'Accesso richiesto');
  return req.user;
}
