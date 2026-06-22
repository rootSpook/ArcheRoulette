import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Champion } from '../../types/champion';
import styles from './admin.module.css';

export default function AdminIstatistikler() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Champion[]>('/public/champions').then(({ data }) => {
      setChampions(data);
      setLoading(false);
    });
  }, []);

  const filtered = champions
    .filter((c) => c.timesPlayed > 0 && c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.timesPlayed - a.timesPlayed);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>İstatistikler</h1>

      <div className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#884444', fontSize: '0.85rem' }}>
          Toplam oynanma: <strong style={{ color: '#e8d0d0' }}>{champions.reduce((s, c) => s + c.timesPlayed, 0)}</strong>
          &nbsp;·&nbsp;
          Toplam galibiyet: <strong style={{ color: '#4caf50' }}>{champions.reduce((s, c) => s + c.wins, 0)}</strong>
        </span>
        <input
          placeholder="Şampiyon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', background: '#0f0000', border: '1px solid #2a0a0a', borderRadius: 5, color: '#e8d0d0', fontSize: '0.85rem', outline: 'none', width: 200 }}
        />
      </div>

      {loading ? (
        <p className={styles.status}>Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.status}>Henüz oynanmış şampiyon yok.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th colSpan={2}>Şampiyon</th>
                <th>Oynanma</th>
                <th>Galibiyet</th>
                <th>Mağlubiyet</th>
                <th>Kazanma %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const losses = c.timesPlayed - c.wins;
                const rate = c.timesPlayed ? ((c.wins / c.timesPlayed) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={c._id}>
                    <td style={{ color: '#664444', width: 32 }}>{i + 1}</td>
                    <td style={{ width: 44 }}>
                      <img src={c.imgLink} alt={c.name} className={styles.img} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.timesPlayed}</td>
                    <td className={styles.win}>{c.wins}</td>
                    <td className={styles.loss}>{losses}</td>
                    <td style={{ color: Number(rate) >= 50 ? '#4caf50' : '#e03030', fontWeight: 700 }}>%{rate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
