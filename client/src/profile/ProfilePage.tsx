import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api/client';
import { ROLE_LABELS } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';

export function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword !== repeatPassword) {
      setError('Le due password nuove non coincidono.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Il mio profilo</h1>
          <p className="page-intro">
            {user.name}, {ROLE_LABELS[user.role]}, {user.email}
          </p>
        </div>
      </header>

      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <h2>Cambia password</h2>
          {error && <Alert kind="error">{error}</Alert>}
          {saved && <Alert kind="success">Password cambiata.</Alert>}

          <Field label="Password attuale" htmlFor="current-password">
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Nuova password" htmlFor="new-password" hint="Almeno 8 caratteri.">
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          <Field label="Ripeti la nuova password" htmlFor="repeat-password">
            <input
              id="repeat-password"
              type="password"
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
          </Field>

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Salvataggio…' : 'Salva la nuova password'}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
