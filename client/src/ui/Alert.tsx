import type { ReactNode } from 'react';

// Messaggio in evidenza: errore (rosso), conferma (verde) o informazione (grigio).
export function Alert({
  kind,
  children,
}: {
  kind: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
