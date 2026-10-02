import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';

// Pagina iniziale dopo l'accesso. Per ora orienta l'utente; con le prossime fasi
// ospiterà le scorciatoie verso clienti, pratiche e ricerca.
export function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Ciao, {user.name.split(' ')[0]}</h1>
          <p className="page-intro">Hai fatto l’accesso come {user.email}.</p>
        </div>
      </header>

      <section className="card stack">
        <h2>Cosa puoi fare adesso</h2>
        <p>
          Da <Link to="/profilo">Il mio profilo</Link> puoi cambiare la tua password.
        </p>
        {user.role === 'ADMIN' && (
          <p>
            Da <Link to="/utenti">Utenti</Link> puoi creare i colleghi, assegnare i ruoli e
            reimpostare le password.
          </p>
        )}
        <p>Clienti, pratiche, documenti e ricerca arrivano con le prossime fasi del progetto.</p>
      </section>
    </>
  );
}
