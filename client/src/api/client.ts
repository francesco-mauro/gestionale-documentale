// Unico punto da cui il frontend parla con il backend.
// Tutte le chiamate passano di qui: prefisso /api, JSON, cookie di sessione, errori.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Nome dell'evento che avvisa l'app quando il backend risponde "Accesso richiesto" (401):
// la sessione è scaduta o è stata chiusa, e AuthContext riporta l'utente alla pagina di accesso.
export const SESSION_EXPIRED_EVENT = 'gestionale:session-expired';

async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    // Invia il cookie di sessione: frontend e API stanno sullo stesso indirizzo.
    credentials: 'same-origin',
  });

  if (!res.ok) {
    // Il backend risponde sempre { error: "messaggio in italiano" }.
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, data.error ?? 'Errore di comunicazione con il server');
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => requestJson<T>('GET', path),
  post: <T>(path: string, body?: unknown) => requestJson<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => requestJson<T>('PUT', path, body),
  del: <T>(path: string) => requestJson<T>('DELETE', path),
};

// Testo da mostrare all'utente per un errore qualsiasi (di rete, del server, imprevisto).
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError)
    return 'Impossibile raggiungere il server. Controlla la connessione.';
  return 'Si è verificato un errore imprevisto.';
}
