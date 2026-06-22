import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, padding: '1rem', borderRight: '1px solid #eee' }}>
        <strong>Admin Panel</strong>
        <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
          <li><Link to="/admin">Dashboard</Link></li>
        </ul>
        <button onClick={logout} style={{ marginTop: '2rem' }}>
          Logout
        </button>
      </nav>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
