import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../lib/api';
import { Champion } from '../../types/champion';
import { StreamerStats } from '../../types/stats';
import ChampionCard from '../../components/ChampionCard';
import VoteResults from '../../components/VoteResults';
import StatsPanel from '../../components/StatsPanel';
import styles from './Home.module.css';

const VOTED_KEY = 'votedChampionId';
const POLL_INTERVAL = 5000;

export default function Home() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [stats, setStats] = useState<StreamerStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votedId, setVotedId] = useState<string | null>(
    () => localStorage.getItem(VOTED_KEY)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchRef = useRef(search);
  searchRef.current = search;

  const hasVoted = votedId !== null;

  const fetchChampions = useCallback(async (query: string, showLoading = false) => {
    if (showLoading) setLoading(true);
    const { data } = await api.get<Champion[]>('/public/champions', {
      params: query ? { search: query } : {},
    });
    setChampions(data);
    if (showLoading) setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const { data } = await api.get<StreamerStats>('/public/stats');
    setStats(data);
  }, []);

  // Initial load
  useEffect(() => {
    fetchChampions(search, true);
    fetchStats();
  }, []);

  // Debounced search re-fetch
  useEffect(() => {
    const timer = setTimeout(() => fetchChampions(search, true), 300);
    return () => clearTimeout(timer);
  }, [search, fetchChampions]);

  // Silent polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChampions(searchRef.current, false);
      fetchStats();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchChampions, fetchStats]);

  async function handleReset() {
    await api.delete('/public/votes/reset');
    localStorage.removeItem(VOTED_KEY);
    setVotedId(null);
    setSelectedId(null);
    setError('');
    fetchChampions(search, true);
  }

  async function handleOyla() {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post<Champion>(`/public/champions/${selectedId}/vote`);
      localStorage.setItem(VOTED_KEY, selectedId);
      setVotedId(selectedId);
      setChampions((prev) =>
        prev.map((c) => (c._id === selectedId ? { ...c, counter: data.counter } : c))
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Bir hata oluştu.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedChamp = champions.find((c) => c._id === selectedId);

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>Hangi Şampiyon Oynasın?</h1>
        <p className={styles.sub}>
          Yayıncının bir sonraki oyunda oynamasını istediğin şampiyonu seç ve oyla.
        </p>

        <div className={styles.mainRow}>
          <div className={styles.pollSection}>
            <VoteResults champions={champions} />

            <input
              className={styles.search}
              type="text"
              placeholder="Şampiyon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
              <p className={styles.status}>Şampiyonlar yükleniyor...</p>
            ) : champions.length === 0 ? (
              <p className={styles.status}>Şampiyon bulunamadı.</p>
            ) : (
              <div className={styles.grid}>
                {champions.map((champ) => (
                  <ChampionCard
                    key={champ._id}
                    champion={champ}
                    selected={selectedId === champ._id}
                    hasVoted={hasVoted}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            )}

            {hasVoted && (
              <p className={styles.alreadyVoted}>Oyunuzu kullandınız. Teşekkürler!</p>
            )}

            {import.meta.env.DEV && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={handleReset} style={{
                  padding: '0.4rem 1rem',
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#666',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}>
                  [DEV] Oyu Sıfırla
                </button>
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            <StatsPanel stats={stats} />
          </aside>
        </div>
      </div>

      <div className={`${styles.voteBar} ${selectedId && !hasVoted ? styles.visible : ''}`}>
        <div className={styles.selectedName}>
          Seçilen: <span>{selectedChamp?.name ?? ''}</span>
        </div>
        <div className={styles.oylaBtnWrapper}>
          <button
            className={styles.oylaBtn}
            onClick={handleOyla}
            disabled={submitting}
          >
            {submitting ? 'Gönderiliyor...' : 'Oyla'}
          </button>
          {error && <span style={{ color: '#e03030', fontSize: '0.8rem' }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}
