import { Router } from 'express';
import { currentUser, requireAuth, requireRole } from '../auth/middleware.js';
import { parseId, validate } from '../shared/validate.js';
import {
  createUserSchema,
  setActiveSchema,
  setPasswordSchema,
  updateUserSchema,
} from './schemas.js';
import * as users from './service.js';

export const usersRouter = Router();

// Tutte le rotte di questo modulo richiedono un Amministratore.
usersRouter.use(requireAuth, requireRole('ADMIN'));

usersRouter.get('/', async (_req, res) => {
  res.json(await users.listUsers());
});

usersRouter.post('/', async (req, res) => {
  const input = validate(createUserSchema, req.body);
  res.status(201).json(await users.createUser(currentUser(req), input));
});

usersRouter.put('/:id', async (req, res) => {
  const input = validate(updateUserSchema, req.body);
  res.json(await users.updateUser(currentUser(req), parseId(req.params.id), input));
});

usersRouter.put('/:id/password', async (req, res) => {
  const { password } = validate(setPasswordSchema, req.body);
  await users.setPassword(currentUser(req), parseId(req.params.id), password);
  res.status(204).end();
});

usersRouter.put('/:id/active', async (req, res) => {
  const { active } = validate(setActiveSchema, req.body);
  res.json(await users.setActive(currentUser(req), parseId(req.params.id), active));
});
