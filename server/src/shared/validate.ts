import type { ZodType } from 'zod';
import { HttpError } from './errors.js';

// Controlla i dati in ingresso con uno schema zod e restituisce i dati puliti e tipizzati.
// Se qualcosa non va, risponde 400 con i messaggi scritti negli schemi (in italiano),
// uniti in una frase sola: "Email non valida. La password deve avere almeno 8 caratteri".
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const message = result.error.issues.map((issue) => issue.message).join('. ');
  throw new HttpError(400, message);
}

// Legge un id numerico dai parametri dell'URL (es. /api/users/12).
export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificativo non valido');
  return id;
}
