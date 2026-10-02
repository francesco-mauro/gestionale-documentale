import { Route, Routes } from 'react-router';
import { LoginPage } from './auth/LoginPage';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { HomePage } from './home/HomePage';
import { NotFoundPage } from './layout/NotFoundPage';
import { Shell } from './layout/Shell';
import { ProfilePage } from './profile/ProfilePage';
import { UsersPage } from './users/UsersPage';

// Le pagine dell'app e i loro indirizzi. Tutto ciò che sta sotto RequireAuth
// richiede l'accesso; ciò che sta sotto RequireRole anche un ruolo preciso.
export default function App() {
  return (
    <Routes>
      <Route path="/accesso" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="profilo" element={<ProfilePage />} />
          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="utenti" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
