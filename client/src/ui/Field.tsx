import type { ReactNode } from 'react';

// Etichetta + campo di un form. Il campo (input o select) si passa come figlio
// e deve avere lo stesso id indicato in htmlFor, così l'etichetta è cliccabile e accessibile.
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
