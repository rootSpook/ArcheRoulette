import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Champion } from '../../types/champion';
import { Match } from '../../types/match';
import styles from './admin.module.css';

export default function AdminMacGecmisi() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [selectedChampion, setSelectedChampion] = useState('');
  const [result, setResult] = useState<'win' | 'loss'>('win');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function fetchMatches() {
    const { data } = await api.get<Match[]>('/admin/matches');
    setMatches(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMatches();
    api.get<Champion[]>('/public/champions').then(({ data }) => {
      setChampions(data);
      if (data.length > 0) setSelectedChampion(data[0]._id);
    });
  }, []);

  async function handleAdd() {
    if (!selectedChampion) return;
    setSubmitting(true);
    await api.post('/admin/matches', { championId: selectedChampion, result });
    await fetchMatches();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await api.delete(`/admin/matches/${id}`);
    setMatches((prev) => prev.filter((m) => m._id !== id));
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Maç Geçmişi</h1>

      <div className={styles.card}>
        <p style={{ color: '#884444', fontSize: '0.85rem', marginBottom: '1rem' }}>Yeni maç ekle</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedChampion}
            onChange={(e) => setSelectedChampion(e.target.value)}
            style={{ flex: 1, minWidth: 160, padding: '0.45rem 0.75rem', background: '#0f0000', border: '1px solid #2a0a0a', borderRadius: 5, color: '#e8d0d0', fontSize: '0.9rem' }}
          >
            {champions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as 'win' | 'loss')}
            style={{ width: 130, padding: '0.45rem 0.75rem', background: '#0f0000', border: '1px solid #2a0a0a', borderRadius: 5, color: result === 'win' ? '#4caf50' : '#e03030', fontSize: '0.9rem', fontWeight: 700 }}
          >
            <option value="win">Galibiyet</option>
            <option value="loss">Mağlubiyet</option>
          </select>
          <button className={styles.btn} onClick={handleAdd} disabled={submitting}>
            {submitting ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className={styles.status}>Yükleniyor...</p>
      ) : matches.length === 0 ? (
        <p className={styles.status}>Henüz maç eklenmemiş.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th colSpan={2}>Şampiyon</th>
                <th>Sonuç</th>
                <th>Tarih</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m._id}>
                  <td style={{ width: 44 }}>
                    <img src={m.champion.imgLink} alt={m.champion.name} className={styles.img} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.champion.name}</td>
                  <td className={m.result === 'win' ? styles.win : styles.loss}>
                    {m.result === 'win' ? 'Galibiyet' : 'Mağlubiyet'}
                  </td>
                  <td style={{ color: '#664444', fontSize: '0.8rem' }}>
                    {new Date(m.playedAt).toLocaleString('tr-TR')}
                  </td>
                  <td>
                    <button className={styles.btnOutline} onClick={() => handleDelete(m._id)}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
