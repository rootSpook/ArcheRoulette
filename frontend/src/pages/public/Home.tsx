import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../lib/api';
import { Champion } from '../../types/champion';
import { StreamerStats } from '../../types/stats';
import { VotingSession } from '../../types/voting';
import ChampionCard from '../../components/ChampionCard';
import VoteResults from '../../components/VoteResults';
import StatsPanel from '../../components/StatsPanel';
import styles from './Home.module.css';

const VOTED_KEY = 'votedChampionId';
const VOTED_SESSION_KEY = 'votedSessionId';
const POLL_INTERVAL = 5000;
const RESULT_DELAY_MS = 8000;

type Phase = 'loading' | 'wait' | 'vote' | 'see_champion';

function useCountdown(endsAt?: string) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function Home() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [stats, setStats] = useState<StreamerStats | null>(null);
  const [session, setSession] = useState<VotingSession | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votedId, setVotedId] = useState<string | null>(() => localStorage.getItem(VOTED_KEY));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchRef = useRef(search);
  searchRef.current = search;

  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const countdown = useCountdown(session?.endsAt);
  const hasVoted = votedId !== null;

  const fetchAll = useCallback(async (query: string, showLoading = false) => {
    if (showLoading) setLoading(true);
    const [champsRes, statsRes, sessionRes] = await Promise.all([
      api.get<Champion[]>('/public/champions', { params: query ? { search: query } : {} }),
      api.get<StreamerStats>('/public/stats'),
      api.get<VotingSession>('/public/voting'),
    ]);
    setChampions(champsRes.data);
    setStats(statsRes.data);

    const newSession = sessionRes.data;
    setSession(newSession);

    // Clear vote if a new session has started
    if (newSession._id && newSession._id !== localStorage.getItem(VOTED_SESSION_KEY)) {
      localStorage.removeItem(VOTED_KEY);
      localStorage.removeItem(VOTED_SESSION_KEY);
      setVotedId(null);
    }

    const hasWinner = !!newSession.winner;

    if (newSession.status === 'result' && hasWinner) {
      if (isInitialLoadRef.current) {
        // Page was refreshed while result already showing — reveal immediately
        setPhase('see_champion');
      } else if (prevStatusRef.current !== 'result') {
        // Fresh transition to result — delay to let the wheel finish
        setPhase('wait');
        if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
        resultTimerRef.current = setTimeout(() => setPhase('see_champion'), RESULT_DELAY_MS);
      }
    } else {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      setPhase(newSession.status === 'active' ? 'vote' : 'wait');
    }

    prevStatusRef.current = newSession.status;
    isInitialLoadRef.current = false;

    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => { fetchAll(search, true); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(search, true), 300);
    return () => clearTimeout(t);
  }, [search, fetchAll]);

  useEffect(() => {
    const id = setInterval(() => fetchAll(searchRef.current, false), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (resultTimerRef.current) clearTimeout(resultTimerRef.current); }, []);

  async function handleOyla() {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post<Champion>(`/public/champions/${selectedId}/vote`);
      localStorage.setItem(VOTED_KEY, selectedId);
      localStorage.setItem(VOTED_SESSION_KEY, session!._id);
      setVotedId(selectedId);
      setChampions((prev) => prev.map((c) => c._id === selectedId ? { ...c, counter: data.counter } : c));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bir hata oluştu.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedChamp = champions.find((c) => c._id === selectedId);

  let mainContent: JSX.Element;

  if (phase === 'loading' || phase === 'wait') {
    // ── WAIT phase ─────────────────────────────────────────────────────────
    mainContent = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <h1 className={styles.title} style={{ marginBottom: '1rem' }}>Oylama</h1>
        <p style={{ color: '#884444', fontSize: '1rem' }}>
          {phase === 'loading' ? 'Yükleniyor...' : 'Şu anda devam eden bir oylama bulunmamakta.'}
        </p>
      </div>
    );
  } else if (phase === 'see_champion' && session?.winner) {
    // ── SEE CHAMPION phase ───────────────────────────────────────────────────
    const w = session.winner;
    const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${w.championId}_0.jpg`;
    mainContent = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '1.5rem' }}>
        <p style={{ color: '#884444', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kazanan Şampiyon</p>
        <h1 style={{ fontSize: '3rem', color: '#e03030', textShadow: '0 0 30px rgba(200,0,0,0.7)', margin: 0 }}>{w.name}</h1>
        <img
          src={splashUrl}
          alt={w.name}
          style={{ width: '100%', maxWidth: 600, borderRadius: 12, border: '2px solid #2a0a0a', boxShadow: '0 0 40px rgba(200,0,0,0.4)' }}
        />
      </div>
    );
  } else {
    // ── VOTE phase ───────────────────────────────────────────────────────────
    mainContent = (
      <div>
        <h1 className={styles.title}>Hangi Şampiyon Oynasın?</h1>
        <p className={styles.sub}>Yayıncının bir sonraki oyunda oynamasını istediğin şampiyonu seç ve oyla.</p>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: '#e03030', fontVariantNumeric: 'tabular-nums' }}>
            {countdown}
          </span>
        </div>

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

        {hasVoted && <p className={styles.alreadyVoted}>Oyunuzu kullandınız. Teşekkürler!</p>}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.mainRow}>
          <div className={styles.pollSection}>{mainContent}</div>

          <aside className={styles.sidebar}>
            <StatsPanel stats={stats} />
          </aside>
        </div>
      </div>

      {phase === 'vote' && (
        <div className={`${styles.voteBar} ${selectedId && !hasVoted ? styles.visible : ''}`}>
          <div className={styles.selectedName}>Seçilen: <span>{selectedChamp?.name ?? ''}</span></div>
          <div className={styles.oylaBtnWrapper}>
            <button className={styles.oylaBtn} onClick={handleOyla} disabled={submitting}>
              {submitting ? 'Gönderiliyor...' : 'Oyla'}
            </button>
            {error && <span style={{ color: '#e03030', fontSize: '0.8rem' }}>{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
