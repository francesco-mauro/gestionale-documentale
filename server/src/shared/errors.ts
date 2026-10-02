import type { ErrorRequestHandler } from 'express';

// Errore "previsto", con uno status HTTP e un messaggio già pronto per l'utente.
// Lo lanciano service e router (es. throw new HttpError(404, 'Utente non trovato'));
// il gestore qui sotto lo trasforma nella risposta JSON.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// Ultimo anello della catena Express: qualsiasi errore non gestito arriva qui.
// Risponde sempre in JSON, così il frontend mostra un messaggio leggibile
// e non una pagina HTML di errore. Express riconosce un gestore di errori
// dal fatto che ha quattro parametri: per questo "_next" resta anche se non lo usiamo.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Errori con uno status "di richiesta" (es. JSON malformato: 400) li riportiamo così come sono.
  const status = hasStatus(err) && err.status >= 400 && err.status < 500 ? err.status : 500;

  if (status === 500) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
    return;
  }
  res.status(status).json({ error: 'Richiesta non valida' });
};

function hasStatus(err: unknown): err is { status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { status?: unknown }).status === 'number'
  );
}
