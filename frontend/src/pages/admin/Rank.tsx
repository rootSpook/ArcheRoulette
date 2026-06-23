import { useEffect, useState, FormEvent } from 'react';
import api from '../../lib/api';
import { StreamerStats, Tier, Division, RiotServer } from '../../types/stats';
import styles from './admin.module.css';

const TIERS: Tier[] = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
const DIVISIONS: Division[] = ['I','II','III','IV'];
const NO_DIVISION: Tier[] = ['MASTER','GRANDMASTER','CHALLENGER'];

function formatSyncTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('tr-TR');
}

export default function AdminRank() {
  const [stats, setStats] = useState<StreamerStats | null>(null);
  const [servers, setServers] = useState<RiotServer[]>([]);
  const [saved, setSaved] = useState(false);

  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [server, setServer] = useState('');
  const [riotSaving, setRiotSaving] = useState(false);
  const [riotError, setRiotError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    api.get<StreamerStats>('/public/stats').then(({ data }) => setStats(data));
    api.get<RiotServer[]>('/admin/servers').then(({ data }) => {
      setServers(data);
      if (data.length > 0) setServer(data[0].value);
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stats) return;
    const { data } = await api.put<StreamerStats>('/admin/stats', stats);
    setStats(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const { data } = await api.post<StreamerStats>('/admin/stats/sync-rank');
      setStats(data);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: StreamerStats } })?.response?.data;
      if (data) setStats(data);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const { data } = await api.delete<StreamerStats>('/admin/stats/riot-account');
      setStats(data);
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleLinkRiotAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRiotSaving(true);
    setRiotError('');
    try {
      const { data } = await api.put<StreamerStats>('/admin/stats/riot-account', { gameName, tagLine, server });
      setStats(data);
      setGameName('');
      setTagLine('');
      await handleSync();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bir hata oluştu.';
      setRiotError(msg);
    } finally {
      setRiotSaving(false);
    }
  }

  if (!stats) return <p className={styles.status}>Yükleniyor...</p>;

  const showDivision = !NO_DIVISION.includes(stats.tier);
  const hasRiotAccount = !!stats.riotGameName;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Rank Bilgileri</h1>

      <div className={styles.card}>
        <p style={{ color: '#884444', fontSize: '0.85rem', marginBottom: '1rem' }}>Riot Hesabı (Otomatik Senkronizasyon)</p>

        {hasRiotAccount ? (
          <>
            <p style={{ color: '#e8d0d0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Bağlı hesap: <strong>{stats.riotGameName}#{stats.riotTagLine}</strong>{' '}
              <span style={{ color: '#664444' }}>({servers.find((s) => s.value === stats.riotServer)?.label ?? stats.riotServer})</span>
            </p>
            <p style={{ color: '#664444', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {formatSyncTime(stats.riotLastSyncAt)
                ? `Son senkronizasyon: ${formatSyncTime(stats.riotLastSyncAt)}`
                : 'Henüz senkronize edilmedi.'}
              {' · '}5 dakikada bir otomatik güncellenir.
            </p>
            {stats.riotLastError && (
              <p style={{ color: '#e03030', fontSize: '0.82rem', marginBottom: '1rem' }}>{stats.riotLastError}</p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className={styles.btnOutline} onClick={handleSync} disabled={syncing}>
                {syncing ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}
              </button>
              <button
                className={styles.btnOutline}
                style={{ color: '#e03030', borderColor: '#5a1010' }}
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? 'Kaldırılıyor...' : 'Bağlantıyı Kaldır'}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleLinkRiotAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.row}>
              <label>Riot ID</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                <input placeholder="Oyuncu Adı" value={gameName} onChange={(e) => setGameName(e.target.value)} required style={{ flex: 1 }} />
                <span style={{ color: '#664444' }}>#</span>
                <input placeholder="TAG" value={tagLine} onChange={(e) => setTagLine(e.target.value)} required style={{ width: 90 }} />
              </div>
            </div>
            <div className={styles.row}>
              <label>Sunucu</label>
              <select value={server} onChange={(e) => setServer(e.target.value)}>
                {servers.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className={styles.btn} disabled={riotSaving}>
                {riotSaving ? 'Bağlanıyor...' : 'Hesabı Bağla'}
              </button>
              {riotError && <span style={{ color: '#e03030', fontSize: '0.85rem' }}>{riotError}</span>}
            </div>
          </form>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.row}>
          <label>Rank</label>
          <select
            value={stats.tier}
            disabled={hasRiotAccount}
            onChange={(e) => setStats({ ...stats, tier: e.target.value as Tier })}
          >
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {showDivision && (
          <div className={styles.row}>
            <label>Bölüm</label>
            <select
              value={stats.division}
              disabled={hasRiotAccount}
              onChange={(e) => setStats({ ...stats, division: e.target.value as Division })}
            >
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        <div className={styles.row}>
          <label>LP</label>
          <input
            type="number" min={0} max={100} value={stats.lp}
            disabled={hasRiotAccount}
            onChange={(e) => setStats({ ...stats, lp: Number(e.target.value) })}
          />
        </div>

        {hasRiotAccount && (
          <p style={{ color: '#664444', fontSize: '0.78rem' }}>
            Rank/LP, bağlı Riot hesabından otomatik alındığı için düzenlenemez.
          </p>
        )}

        <p style={{ color: '#664444', fontSize: '0.82rem' }}>
          Galibiyet/Mağlubiyet artık otomatik takip ediliyor (
          <span style={{ color: '#4caf50', fontWeight: 600 }}>{stats.wins}G</span>
          {' / '}
          <span style={{ color: '#e03030', fontWeight: 600 }}>{stats.losses}M</span>
          ) — Oylama sayfasındaki Galibiyet/Mağlubiyet butonlarıyla güncellenir.
        </p>

        {!hasRiotAccount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" className={styles.btn}>Kaydet</button>
            {saved && <span className={styles.success}>Kaydedildi ✓</span>}
          </div>
        )}
      </form>
    </div>
  );
}
