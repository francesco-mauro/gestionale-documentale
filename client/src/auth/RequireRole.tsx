import { Outlet } from 'react-router';
import type { Role } from '../api/types';
import { useAuth } from './AuthContext';

// Mostra le pagine figlie solo se l'utente ha uno dei ruoli indicati. Va dentro RequireAuth.
// Il backend fa comunque il suo controllo: questo serve solo a non mostrare pagine inutili.
export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <section className="card">
        <h1>Pagina riservata</h1>
        <p className="page-intro">Il tuo ruolo non permette di vedere questa pagina.</p>
      </section>
    );
  }
  return <Outlet />;
}
