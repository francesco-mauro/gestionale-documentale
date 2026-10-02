import { prisma } from '../db.js';

// Registro attività: chi ha fatto cosa e quando.
// I service chiamano record() ogni volta che qualcosa cambia; la pagina che lo mostra arriva con la fase 7.

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'CONFIRM',
  'LOGIN',
  'LOGOUT',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = ['CLIENT', 'PRACTICE', 'DOCUMENT', 'USER'] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

// summary è la frase in italiano che il registro mostrerà così com'è,
// es. "Anna Ferrari ha creato l'utente Paola Neri".
export function record(
  userId: number,
  action: AuditAction,
  entityType: AuditEntity,
  entityId: number,
  summary: string,
) {
  return prisma.auditLog.create({ data: { userId, action, entityType, entityId, summary } });
}
