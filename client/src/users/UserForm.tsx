import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api/client';
import { ROLE_LABELS, ROLES, type Role, type User } from '../api/types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';

// Form per creare un utente (senza "user") o modificarne uno (con "user").
// La password si chiede solo alla creazione: per cambiarla c'è "Reimposta password".
export function UserForm({
  user,
  onSaved,
  onCancel,
}: {
  user?: User;
  onSaved: (saved: User) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'OPERATOR');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const saved = user
        ? await api.put<User>(`/users/${user.id}`, { name, email, role })
        : await api.post<User>('/users', { name, email, role, password });
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <Alert kind="error">{error}</Alert>}

      <Field label="Nome e cognome" htmlFor="user-name">
        <input
          id="user-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </Field>
      <Field label="Email" htmlFor="user-email" hint="Serve per entrare nel gestionale.">
        <input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Field label="Ruolo" htmlFor="user-role">
        <select id="user-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </Field>
      {!user && (
        <Field label="Password iniziale" htmlFor="user-password" hint="Almeno 8 caratteri.">
          <input
            id="user-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
      )}

      <div className="form-actions">
        <Button onClick={onCancel}>Annulla</Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Salvataggio…' : user ? 'Salva le modifiche' : 'Crea utente'}
        </Button>
      </div>
    </form>
  );
}
