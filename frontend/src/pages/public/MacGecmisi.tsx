import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Match } from '../../types/match';
import styles from './Istatistik.module.css';

type ResultFilter = 'all' | 'win' | 'loss';

export default function MacGecmisi() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');

  useEffect(() => {
    api.get<Match[]>('/public/matches').then(({ data }) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const filtered = matches.filter((m) => {
    if (resultFilter !== 'all' && m.result !== resultFilter) return false;
    if (search && !m.champion.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalWins = matches.filter((m) => m.result === 'win').length;
  const totalLosses = matches.filter((m) => m.result === 'loss').length;
  const winRate = matches.length ? ((totalWins / matches.length) * 100).toFixed(1) : '0.0';

  function FilterBtn({ label, value }: { label: string; value: ResultFilter }) {
    return (
      <button
        className={`${styles.sortBtn} ${resultFilter === value ? styles.sortActive : ''}`}
        onClick={() => setResultFilter(value)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>Maç Geçmişi</h1>
        <p className={styles.sub}>Oynanan tüm maçların sonuçları.</p>

        {loading ? (
          <p className={styles.status}>Yükleniyor...</p>
        ) : matches.length === 0 ? (
          <p className={styles.status}>Henüz oynanmış bir maç bulunmuyor.</p>
        ) : (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem',
              background: 'rgba(10,0,0,0.7)', border: '1px solid #2a0a0a', borderRadius: 8,
              padding: '1rem', marginBottom: '1.25rem',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e8d0d0' }}>{matches.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#884444' }}>Toplam Maç</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4caf50' }}>{totalWins}</div>
                <div style={{ fontSize: '0.75rem', color: '#884444' }}>Galibiyet</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e03030' }}>{totalLosses}</div>
                <div style={{ fontSize: '0.75rem', color: '#884444' }}>Mağlubiyet</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e8d0d0' }}>%{winRate}</div>
                <div style={{ fontSize: '0.75rem', color: '#884444' }}>Kazanma Oranı</div>
              </div>
            </div>

            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Filtrele:</span>
              <FilterBtn label="Tümü" value="all" />
              <FilterBtn label="Galibiyet" value="win" />
              <FilterBtn label="Mağlubiyet" value="loss" />
              <input
                placeholder="Şampiyon ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  marginLeft: 'auto', padding: '0.35rem 0.75rem', background: 'rgba(15,0,0,0.7)',
                  border: '1px solid #2a0a0a', borderRadius: 4, color: '#e8d0d0', fontSize: '0.85rem',
                  outline: 'none', minWidth: 160,
                }}
              />
            </div>

            {filtered.length === 0 ? (
              <p className={styles.status}>Eşleşen maç bulunamadı.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr><th colSpan={2}>Şampiyon</th><th>Sonuç</th><th>Tarih</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m._id}>
                        <td className={styles.imgCell}>
                          <img src={m.champion.imgLink} alt={m.champion.name} className={styles.img} />
                        </td>
                        <td className={styles.name}>{m.champion.name}</td>
                        <td className={m.result === 'win' ? styles.win : styles.loss}>
                          {m.result === 'win' ? 'Galibiyet' : 'Mağlubiyet'}
                        </td>
                        <td style={{ color: '#664444', fontSize: '0.8rem' }}>
                          {new Date(m.playedAt).toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
