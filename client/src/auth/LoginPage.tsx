import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { errorMessage } from '../api/client';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Chi è già dentro non ha bisogno della pagina di accesso.
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <form className="login-box form" onSubmit={handleSubmit}>
        <div className="brand">
          <strong>Gestionale documentale</strong>
          <span>Gestionale documenti</span>
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Accesso in corso…' : 'Entra'}
        </Button>
      </form>
    </main>
  );
}
