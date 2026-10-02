import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, SESSION_EXPIRED_EVENT } from '../api/client';
import type { User } from '../api/types';

// Tiene in memoria l'utente che ha fatto l'accesso e lo rende disponibile a tutta l'app
// con useAuth(). All'avvio chiede al backend chi è l'utente corrente (GET /auth/me):
// finché non risponde, "loading" è true e le pagine riservate mostrano "Caricamento".

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Se una chiamata qualsiasi riceve 401, la sessione non vale più: torniamo alla pagina di accesso.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  async function login(email: string, password: string) {
    setUser(await api.post<User>('/auth/login', { email, password }));
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth va usato dentro AuthProvider');
  return ctx;
}
