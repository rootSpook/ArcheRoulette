import { useEffect, useState, FormEvent } from 'react';
import api from '../../lib/api';
import { StreamerStats, Tier, Division } from '../../types/stats';
import styles from './Dashboard.module.css';

const TIERS: Tier[] = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
const DIVISIONS: Division[] = ['I','II','III','IV'];
const NO_DIVISION: Tier[] = ['MASTER','GRANDMASTER','CHALLENGER'];

export default function Dashboard() {
  const [stats, setStats] = useState<StreamerStats | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<StreamerStats>('/public/stats').then(({ data }) => setStats(data));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stats) return;
    const { data } = await api.put<StreamerStats>('/admin/stats', stats);
    setStats(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!stats) return <p>Yükleniyor...</p>;

  const showDivision = !NO_DIVISION.includes(stats.tier);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Yayıncı İstatistikleri</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <label>Rank</label>
          <select value={stats.tier} onChange={(e) => setStats({ ...stats, tier: e.target.value as Tier })}>
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {showDivision && (
          <div className={styles.row}>
            <label>Bölüm</label>
            <select value={stats.division} onChange={(e) => setStats({ ...stats, division: e.target.value as Division })}>
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        <div className={styles.row}>
          <label>LP</label>
          <input
            type="number" min={0} max={100}
            value={stats.lp}
            onChange={(e) => setStats({ ...stats, lp: Number(e.target.value) })}
          />
        </div>

        <div className={styles.row}>
          <label>Galibiyet</label>
          <input
            type="number" min={0}
            value={stats.wins}
            onChange={(e) => setStats({ ...stats, wins: Number(e.target.value) })}
          />
        </div>

        <div className={styles.row}>
          <label>Mağlubiyet</label>
          <input
            type="number" min={0}
            value={stats.losses}
            onChange={(e) => setStats({ ...stats, losses: Number(e.target.value) })}
          />
        </div>

        <button type="submit" className={styles.btn}>
          {saved ? 'Kaydedildi ✓' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
