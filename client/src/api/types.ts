// Tipi dei dati che arrivano dal backend. Devono corrispondere a ciò che le API restituiscono:
// se cambia un'API, si aggiorna qui e TypeScript segnala tutti i punti da sistemare.

export type Role = 'ADMIN' | 'OPERATOR' | 'SELLER';

// Come i ruoli si chiamano nell'interfaccia.
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Amministratore',
  OPERATOR: 'Operatore',
  SELLER: 'Venditore',
};

export const ROLES = Object.keys(ROLE_LABELS) as Role[];

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
