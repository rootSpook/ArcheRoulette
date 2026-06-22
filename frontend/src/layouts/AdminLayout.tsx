import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { logout } = useAuth();
  return (
    <div className={styles.wrapper}>
      <div className={styles.overlay} />
      <nav className={styles.sidebar}>
        <div className={styles.logo}>ArcheRoulette<span>Admin</span></div>
        <ul className={styles.menu}>
          <li>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              Dashboard
            </NavLink>
          </li>
        </ul>
        <button onClick={logout} className={styles.logoutBtn}>Çıkış Yap</button>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
