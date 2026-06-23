import { useEffect, useState, FormEvent } from 'react';
import api from '../../lib/api';
import { StreamerStats, Tier, Division } from '../../types/stats';
import styles from './admin.module.css';

const TIERS: Tier[] = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
const DIVISIONS: Division[] = ['I','II','III','IV'];
const NO_DIVISION: Tier[] = ['MASTER','GRANDMASTER','CHALLENGER'];

export default function AdminRank() {
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

  if (!stats) return <p className={styles.status}>Yükleniyor...</p>;

  const showDivision = !NO_DIVISION.includes(stats.tier);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Rank Bilgileri</h1>

      <form onSubmit={handleSubmit} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <input type="number" min={0} max={100} value={stats.lp}
            onChange={(e) => setStats({ ...stats, lp: Number(e.target.value) })} />
        </div>

        <p style={{ color: '#664444', fontSize: '0.82rem' }}>
          Galibiyet/Mağlubiyet artık otomatik takip ediliyor (
          <span style={{ color: '#4caf50', fontWeight: 600 }}>{stats.wins}G</span>
          {' / '}
          <span style={{ color: '#e03030', fontWeight: 600 }}>{stats.losses}M</span>
          ) — Oylama sayfasındaki Galibiyet/Mağlubiyet butonlarıyla güncellenir.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="submit" className={styles.btn}>Kaydet</button>
          {saved && <span className={styles.success}>Kaydedildi ✓</span>}
        </div>
      </form>
    </div>
  );
}
