import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Champion } from '../../types/champion';
import { VotingSession } from '../../types/voting';
import RouletteWheel from '../../components/RouletteWheel';
import styles from './admin.module.css';

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

export default function AdminOylama() {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  // Spin state — keep pendingSession until animation finishes so the
  // wheel stays mounted through the 'ended' → 'result' transition
  const [spinning, setSpinning] = useState(false);
  const [spinWinnerId, setSpinWinnerId] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<VotingSession | null>(null);

  // Ref so polls can check spinning state without a stale closure
  const spinningRef = useRef(false);

  // Match result recording for the winning champion
  const [recordingMatch, setRecordingMatch] = useState(false);

  const countdown = useCountdown(session?.endsAt);

  const fetchData = useCallback(async () => {
    const [sessionRes, champsRes] = await Promise.all([
      api.get<VotingSession>('/public/voting'),
      api.get<Champion[]>('/public/champions'),
    ]);
    // Don't update session while wheel is spinning — it would reveal the
    // winner before the animation finishes
    if (!spinningRef.current) {
      setSession(sessionRes.data);
    }
    setChampions(champsRes.data.filter((c) => c.counter > 0).sort((a, b) => b.counter - a.counter));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!session || session.status === 'idle' || session.status === 'result') return;
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, [session?.status, fetchData]);

  async function handleStart() {
    const { data } = await api.post<VotingSession>('/admin/voting/start', { minutes, seconds });
    setSession(data);
    setSpinWinnerId(null);
    setPendingSession(null);
  }

  async function handleEndEarly() {
    const { data } = await api.post<VotingSession>('/admin/voting/end');
    setSession(data);
  }

  async function handleCancel() {
    const { data } = await api.post<VotingSession>('/admin/voting/cancel');
    spinningRef.current = false;
    setSession(data);
    setSpinning(false);
    setSpinWinnerId(null);
    setPendingSession(null);
  }

  // Records the match result, then auto-resets the session back to idle so
  // it's immediately ready for the next voting round — no extra click needed,
  // and a page refresh can't re-show these buttons since status is now idle.
  async function handleRecordMatch(result: 'win' | 'loss') {
    if (!session?.winner || recordingMatch) return;
    setRecordingMatch(true);
    try {
      await api.post('/admin/matches', { championId: session.winner._id, result });
      const { data } = await api.post<VotingSession>('/admin/voting/cancel');
      spinningRef.current = false;
      setSession(data);
      setSpinning(false);
      setSpinWinnerId(null);
      setPendingSession(null);
    } finally {
      setRecordingMatch(false);
    }
  }

  async function handleSpin() {
    if (spinning) return;
    const { data } = await api.post<VotingSession>('/admin/voting/spin');
    setPendingSession(data);
    setSpinWinnerId(data.winner?._id ?? null);
    spinningRef.current = true;
    setSpinning(true);
  }

  function handleSpinComplete() {
    spinningRef.current = false;
    setSpinning(false);
    if (pendingSession) {
      setSession(pendingSession);
      setPendingSession(null);
    }
  }

  if (loading) return <p className={styles.status}>Yükleniyor...</p>;

  const total = champions.reduce((s, c) => s + c.counter, 0);
  const winner = session?.winner;
  const splashUrl = winner
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${winner.championId}_0.jpg`
    : '';

  // Show wheel during 'ended' (including while spinning) or after result
  const showWheel = (session?.status === 'ended' || session?.status === 'result') && champions.length > 0;

  return (
    <div className={styles.page} style={{ maxWidth: 960 }}>
      <h1 className={styles.title}>Oylama Yönetimi</h1>

      {/* ── IDLE ── */}
      {(!session || session.status === 'idle') && (
        <div className={styles.card}>
          <p style={{ color: '#884444', fontSize: '0.85rem', marginBottom: '1rem' }}>Oylama Başlat</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ color: '#884444', fontSize: '0.85rem' }}>Süre:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="number" min={0} max={60} value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                style={{ width: 64, padding: '0.4rem 0.5rem', background: '#0f0000', border: '1px solid #2a0a0a', borderRadius: 5, color: '#e8d0d0', fontSize: '0.9rem', textAlign: 'center' }}
              />
              <span style={{ color: '#664444' }}>dk</span>
              <input type="number" min={0} max={59} value={seconds}
                onChange={(e) => setSeconds(Number(e.target.value))}
                style={{ width: 64, padding: '0.4rem 0.5rem', background: '#0f0000', border: '1px solid #2a0a0a', borderRadius: 5, color: '#e8d0d0', fontSize: '0.9rem', textAlign: 'center' }}
              />
              <span style={{ color: '#664444' }}>sn</span>
            </div>
            <button className={styles.btn} onClick={handleStart}>Oylamayı Başlat</button>
          </div>
        </div>
      )}

      {/* ── ACTIVE ── */}
      {session?.status === 'active' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#884444', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Kalan Süre</p>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#e03030', fontVariantNumeric: 'tabular-nums' }}>
                {countdown}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button className={styles.btn} onClick={handleEndEarly}>Oylamayı Erken Bitir</button>
              <button className={styles.btnOutline} onClick={handleCancel}>Oylamayı İptal Et</button>
            </div>
          </div>
          <p style={{ color: '#664444', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            Toplam oy: <strong style={{ color: '#e8d0d0' }}>{total}</strong>
          </p>
        </div>
      )}

      {/* ── ENDED + RESULT (wheel stays mounted through both) ── */}
      {(session?.status === 'ended' || session?.status === 'result') && (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Ended controls */}
            {session.status === 'ended' && (
              <div className={styles.card} style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#884444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Oylama sona erdi. Çarkı çevir veya iptal et.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className={styles.btn}
                    onClick={handleSpin}
                    disabled={spinning || champions.length === 0}
                  >
                    {spinning ? 'Çevriliyor...' : '🎯 Çarkı Çevir'}
                  </button>
                  <button className={styles.btnOutline} onClick={handleCancel} disabled={spinning}>
                    İptal Et
                  </button>
                </div>
                {champions.length === 0 && (
                  <p className={styles.status} style={{ marginTop: '0.5rem' }}>Hiç oy kullanılmamış.</p>
                )}
              </div>
            )}

            {/* Result info */}
            {session.status === 'result' && winner && (
              <div className={styles.card} style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#884444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Kazanan</p>
                <h2 style={{ fontSize: '2rem', color: '#e03030', margin: '0 0 1rem' }}>{winner.name}</h2>
                <img
                  src={splashUrl}
                  alt={winner.name}
                  style={{ width: '100%', maxWidth: 420, borderRadius: 8, border: '1px solid #2a0a0a' }}
                />

                <div style={{ marginTop: '1.25rem' }}>
                  <p style={{ color: '#884444', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                    Maç sonucu nasıl bitti? (Kaydettiğinde oylama otomatik olarak sıfırlanır.)
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className={styles.btn}
                      style={{ background: '#1f7a32' }}
                      onClick={() => handleRecordMatch('win')}
                      disabled={recordingMatch}
                    >
                      {recordingMatch ? 'Kaydediliyor...' : '✓ Galibiyet'}
                    </button>
                    <button
                      className={styles.btn}
                      style={{ background: '#7b0000' }}
                      onClick={() => handleRecordMatch('loss')}
                      disabled={recordingMatch}
                    >
                      {recordingMatch ? 'Kaydediliyor...' : '✗ Mağlubiyet'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button className={styles.btnOutline} onClick={handleCancel} disabled={recordingMatch}>
                    Sıfırla ve Kapat (sonuç kaydetmeden)
                  </button>
                </div>
              </div>
            )}

            {/* Vote standings table */}
            {champions.length > 0 && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>#</th><th colSpan={2}>Şampiyon</th><th>Oy</th><th>%</th></tr>
                  </thead>
                  <tbody>
                    {champions.map((c, i) => (
                      <tr key={c._id} style={c._id === winner?._id ? { background: 'rgba(80,10,10,0.5)' } : undefined}>
                        <td style={{ color: '#664444', width: 32 }}>{i + 1}</td>
                        <td style={{ width: 44 }}><img src={c.imgLink} alt={c.name} className={styles.img} /></td>
                        <td style={{ fontWeight: 600, color: c._id === winner?._id ? '#e03030' : undefined }}>{c.name}</td>
                        <td>{c.counter}</td>
                        <td style={{ color: '#e03030' }}>
                          %{total ? ((c.counter / total) * 100).toFixed(1) : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Wheel — stays mounted from 'ended' through spin into 'result' */}
          {showWheel && (
            <RouletteWheel
              champions={champions}
              winnerId={spinWinnerId}
              spinning={spinning}
              onSpinComplete={handleSpinComplete}
              size={360}
            />
          )}
        </div>
      )}
    </div>
  );
}
