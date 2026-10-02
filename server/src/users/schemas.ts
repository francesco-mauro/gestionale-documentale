import { z } from 'zod';
import { emailSchema, passwordSchema } from '../auth/schemas.js';
import { ROLES } from '../lists.js';

const nameSchema = z
  .string('Inserisci il nome')
  .trim()
  .min(1, 'Inserisci il nome')
  .max(100, 'Il nome è troppo lungo');

const roleSchema = z.enum(ROLES, 'Ruolo non valido');

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export const updateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
});

export const setPasswordSchema = z.object({
  password: passwordSchema,
});

export const setActiveSchema = z.object({
  active: z.boolean('Valore non valido'),
});
