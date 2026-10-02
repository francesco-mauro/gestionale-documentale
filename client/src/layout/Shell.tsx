import { NavLink, Outlet } from 'react-router';
import { ROLE_LABELS } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/Button';

// Struttura comune di tutte le pagine riservate: barra laterale con menu e utente,
// contenuto a destra. Le voci del menu dipendono dal ruolo.
export function Shell() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Gestionale documentale</strong>
          <span>Gestionale documenti</span>
        </div>

        <nav className="nav" aria-label="Sezioni">
          <NavLink to="/" end>
            Inizio
          </NavLink>
          {user.role === 'ADMIN' && <NavLink to="/utenti">Utenti</NavLink>}
          <NavLink to="/profilo">Il mio profilo</NavLink>
        </nav>

        <div className="sidebar-user">
          <strong>{user.name}</strong>
          <span>{ROLE_LABELS[user.role]}</span>
          <Button variant="ghost" small onClick={logout}>
            Esci
          </Button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
