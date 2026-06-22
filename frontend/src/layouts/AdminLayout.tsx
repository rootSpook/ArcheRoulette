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
            <NavLink to="/admin/oylama" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              Oylama
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/rank" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              Rank
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/mac-gecmisi" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              Maç Geçmişi
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/istatistikler" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              İstatistikler
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
