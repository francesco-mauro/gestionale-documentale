import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { ROLE_LABELS, type User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ResetPasswordForm } from './ResetPasswordForm';
import { UserForm } from './UserForm';

// Quale finestra è aperta: nessuna, nuovo utente, modifica, reimposta password.
type Dialog =
  { kind: 'create' } | { kind: 'edit'; user: User } | { kind: 'password'; user: User } | null;

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    api
      .get<User[]>('/users')
      .then(setUsers)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  // Il backend restituisce l'utente aggiornato: lo sostituiamo nella lista senza ricaricarla.
  function replaceInList(saved: User) {
    setUsers((list) =>
      list ? [...list.filter((u) => u.id !== saved.id), saved].sort(byName) : [saved],
    );
  }

  async function toggleActive(user: User) {
    const question = user.active
      ? `Disattivare ${user.name}? Non potrà più entrare nel gestionale.`
      : `Riattivare ${user.name}?`;
    if (!window.confirm(question)) return;
    setError(null);
    try {
      replaceInList(await api.put<User>(`/users/${user.id}/active`, { active: !user.active }));
      setNotice(
        user.active ? `${user.name} è stato disattivato.` : `${user.name} è stato riattivato.`,
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Utenti</h1>
          <p className="page-intro">Chi può entrare nel gestionale e con quale ruolo.</p>
        </div>
        <Button variant="primary" onClick={() => setDialog({ kind: 'create' })}>
          Nuovo utente
        </Button>
      </header>

      <div className="stack">
        {error && <Alert kind="error">{error}</Alert>}
        {notice && <Alert kind="success">{notice}</Alert>}

        {users === null ? (
          <p className="page-loading">Caricamento…</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Stato</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{ROLE_LABELS[user.role]}</td>
                    <td>
                      <span className={`badge ${user.active ? 'badge-ok' : 'badge-off'}`}>
                        {user.active ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    <td className="actions">
                      <Button small onClick={() => setDialog({ kind: 'edit', user })}>
                        Modifica
                      </Button>
                      <Button small onClick={() => setDialog({ kind: 'password', user })}>
                        Reimposta password
                      </Button>
                      {user.id !== me?.id && (
                        <Button
                          small
                          variant={user.active ? 'danger' : 'secondary'}
                          onClick={() => toggleActive(user)}
                        >
                          {user.active ? 'Disattiva' : 'Riattiva'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialog?.kind === 'create' && (
        <Modal title="Nuovo utente" onClose={() => setDialog(null)}>
          <UserForm
            onSaved={(saved) => {
              replaceInList(saved);
              setNotice(`Utente ${saved.name} creato.`);
              setDialog(null);
            }}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}

      {dialog?.kind === 'edit' && (
        <Modal title={`Modifica ${dialog.user.name}`} onClose={() => setDialog(null)}>
          <UserForm
            user={dialog.user}
            onSaved={(saved) => {
              replaceInList(saved);
              setNotice(`Modifiche a ${saved.name} salvate.`);
              setDialog(null);
            }}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}

      {dialog?.kind === 'password' && (
        <Modal title="Reimposta password" onClose={() => setDialog(null)}>
          <ResetPasswordForm
            user={dialog.user}
            onDone={() => {
              setNotice(`Password di ${dialog.user.name} reimpostata.`);
              setDialog(null);
            }}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}
    </>
  );
}

function byName(a: User, b: User) {
  return a.name.localeCompare(b.name, 'it');
}
