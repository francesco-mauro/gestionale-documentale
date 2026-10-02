import { Router } from 'express';
import { config } from '../config.js';
import { validate } from '../shared/validate.js';
import { currentUser, requireAuth, SESSION_COOKIE } from './middleware.js';
import { changePasswordSchema, loginSchema } from './schemas.js';
import * as auth from './service.js';

// Cookie di sessione: httpOnly (il JavaScript nel browser non può leggerlo),
// SameSite=Lax (non viene inviato da siti terzi), senza scadenza nel browser
// (si cancella chiudendolo; la scadenza vera è nella tabella Session).
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.COOKIE_SECURE,
  path: '/',
};

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = validate(loginSchema, req.body);
  const { user, token } = await auth.login(email, password);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.json(user);
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) await auth.logout(token);
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(currentUser(req));
});

authRouter.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = validate(changePasswordSchema, req.body);
  const token = req.cookies[SESSION_COOKIE] as string;
  await auth.changePassword(currentUser(req), token, currentPassword, newPassword);
  res.status(204).end();
});
