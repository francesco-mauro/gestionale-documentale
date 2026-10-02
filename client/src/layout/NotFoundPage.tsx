import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="card">
      <h1>Pagina non trovata</h1>
      <p className="page-intro">
        L’indirizzo non corrisponde a nessuna pagina. <Link to="/">Torna all’inizio</Link>.
      </p>
    </section>
  );
}
