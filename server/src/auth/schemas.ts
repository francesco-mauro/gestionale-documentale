import { z } from 'zod';

// Schemi zod dei dati in ingresso del modulo auth. I messaggi sono in italiano
// perché arrivano così com'è all'utente (vedi shared/validate.ts).

// Email: prima si puliscono spazi e maiuscole, poi si controlla il formato.
export const emailSchema = z
  .string('Inserisci l’email')
  .trim()
  .toLowerCase()
  .pipe(z.email('Email non valida'));

// Il limite di 72 caratteri è quello dell'algoritmo bcrypt.
export const passwordSchema = z
  .string('Inserisci la password')
  .min(8, 'La password deve avere almeno 8 caratteri')
  .max(72, 'La password può avere al massimo 72 caratteri');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string('Inserisci la password').min(1, 'Inserisci la password'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string('Inserisci la password attuale')
    .min(1, 'Inserisci la password attuale'),
  newPassword: passwordSchema,
});
