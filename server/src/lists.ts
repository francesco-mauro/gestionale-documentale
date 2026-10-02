// Liste fisse usate da tutto il gestionale (backend e, tramite l'API, frontend).
// Per cambiarle basta modificare questo file e riavviare: non servono migrazioni,
// perché nel database sono salvate come semplici stringhe.

export const ROLES = ['ADMIN', 'OPERATOR', 'SELLER'] as const;
export type Role = (typeof ROLES)[number];

export const PRACTICE_TYPES = [
  'preventivo',
  'ordine',
  'installazione',
  'detrazioni fiscali',
] as const;
export type PracticeType = (typeof PRACTICE_TYPES)[number];

export const PRACTICE_STATUSES = ['aperta', 'in corso', 'chiusa'] as const;
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];

export const DOCUMENT_TYPES = [
  'preventivo',
  'contratto',
  'ordine al fornitore',
  'scheda tecnica',
  'fattura',
  'foto del cantiere',
  'pratica ENEA',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
