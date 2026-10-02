import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

// Protegge le pagine riservate: senza utente rimanda alla pagina di accesso,
// ricordando dove si voleva andare per tornarci dopo il login.
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="page-loading">Caricamento…</p>;
  if (!user) return <Navigate to="/accesso" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
