import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api/client';
import type { User } from '../api/types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';

// L'Amministratore assegna una nuova password a un collega (es. se l'ha dimenticata).
// Il backend chiude le sessioni aperte di quell'utente: dovrà rientrare con la nuova password.
export function ResetPasswordForm({
  user,
  onDone,
  onCancel,
}: {
  user: User;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== repeat) {
      setError('Le due password non coincidono.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/users/${user.id}/password`, { password });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p>
        Nuova password per <strong>{user.name}</strong>. Comunicagliela di persona: al prossimo
        accesso dovrà usare questa.
      </p>
      {error && <Alert kind="error">{error}</Alert>}

      <Field label="Nuova password" htmlFor="reset-password" hint="Almeno 8 caratteri.">
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoFocus
        />
      </Field>
      <Field label="Ripeti la password" htmlFor="reset-repeat">
        <input
          id="reset-repeat"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          required
        />
      </Field>

      <div className="form-actions">
        <Button onClick={onCancel}>Annulla</Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Salvataggio…' : 'Reimposta password'}
        </Button>
      </div>
    </form>
  );
}
