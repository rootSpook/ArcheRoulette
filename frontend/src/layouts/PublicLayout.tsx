import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <strong>ArcheRoulette</strong>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
