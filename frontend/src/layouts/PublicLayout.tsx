import { Outlet, NavLink } from 'react-router-dom';
import styles from './PublicLayout.module.css';

export default function PublicLayout() {
  return (
    <div>
      <header className={styles.header}>
        <strong className={styles.logo}>ArcheRoulette</strong>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
            Oylama
          </NavLink>
          <NavLink to="/istatistik" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
            İstatistik
          </NavLink>
          <NavLink to="/mac-gecmisi" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
            Maç Geçmişi
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
