import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Champion } from '../../types/champion';
import styles from './Istatistik.module.css';

type SortKey = 'timesPlayed' | 'wins' | 'losses' | 'winRate';

export default function Istatistik() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('timesPlayed');

  useEffect(() => {
    api.get<Champion[]>('/public/champions').then(({ data }) => {
      setChampions(data.filter((c) => c.timesPlayed > 0));
      setLoading(false);
    });
  }, []);

  const sorted = [...champions].sort((a, b) => {
    if (sortBy === 'winRate') {
      const rateA = a.timesPlayed ? a.wins / a.timesPlayed : 0;
      const rateB = b.timesPlayed ? b.wins / b.timesPlayed : 0;
      return rateB - rateA;
    }
    if (sortBy === 'losses') return (b.timesPlayed - b.wins) - (a.timesPlayed - a.wins);
    return b[sortBy] - a[sortBy];
  });

  function winRate(c: Champion) {
    return c.timesPlayed ? ((c.wins / c.timesPlayed) * 100).toFixed(1) : '0.0';
  }

  function SortBtn({ label, value }: { label: string; value: SortKey }) {
    return (
      <button
        className={`${styles.sortBtn} ${sortBy === value ? styles.sortActive : ''}`}
        onClick={() => setSortBy(value)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>Şampiyon İstatistikleri</h1>
        <p className={styles.sub}>Oynanan şampiyonların performans verileri.</p>

        {loading ? (
          <p className={styles.status}>Yükleniyor...</p>
        ) : sorted.length === 0 ? (
          <p className={styles.status}>Henüz oynanmış bir şampiyon bulunmuyor.</p>
        ) : (
          <>
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Sırala:</span>
              <SortBtn label="Oynanma" value="timesPlayed" />
              <SortBtn label="Galibiyet" value="wins" />
              <SortBtn label="Mağlubiyet" value="losses" />
              <SortBtn label="Kazanma Oranı" value="winRate" />
            </div>

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
                  {sorted.map((c, i) => {
                    const losses = c.timesPlayed - c.wins;
                    const rate = Number(winRate(c));
                    return (
                      <tr key={c._id}>
                        <td className={styles.rank}>{i + 1}</td>
                        <td className={styles.imgCell}>
                          <img src={c.imgLink} alt={c.name} className={styles.img} />
                        </td>
                        <td className={styles.name}>{c.name}</td>
                        <td>{c.timesPlayed}</td>
                        <td className={styles.win}>{c.wins}</td>
                        <td className={styles.loss}>{losses}</td>
                        <td>
                          <div className={styles.rateBar}>
                            <div
                              className={styles.rateFill}
                              style={{ width: `${rate}%`, background: rate >= 50 ? '#4caf50' : '#e03030' }}
                            />
                            <span className={styles.rateLabel}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
