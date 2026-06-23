import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Champion } from '../types/champion';
import styles from './BanManager.module.css';

export default function BanManager() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Champion[]>([]);
  const [bannedChampions, setBannedChampions] = useState<Champion[]>([]);

  useEffect(() => {
    refreshBannedList();
  }, []);

  useEffect(() => {
    if (!search) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await api.get<Champion[]>('/public/champions', { params: { search } });
      setSearchResults(data);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function refreshBannedList() {
    const { data } = await api.get<Champion[]>('/public/champions');
    setBannedChampions(data.filter((c) => c.banned));
  }

  async function handleToggleBan(championId: string, banned: boolean) {
    const { data } = await api.put<Champion>(`/admin/champions/${championId}/ban`, { banned });
    setSearchResults((prev) => prev.map((c) => (c._id === data._id ? data : c)));
    setBannedChampions((prev) =>
      banned ? [...prev.filter((c) => c._id !== data._id), data] : prev.filter((c) => c._id !== data._id)
    );
  }

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.search}
        placeholder="Yasaklamak için şampiyon ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {searchResults.length > 0 && (
        <div className={styles.list} style={{ marginBottom: '1.25rem' }}>
          {searchResults.map((c) => (
            <div key={c._id} className={styles.item}>
              <img src={c.imgLink} alt={c.name} className={styles.img} />
              <span className={styles.name}>{c.name}</span>
              <button className={styles.toggleBtn} onClick={() => handleToggleBan(c._id, !c.banned)}>
                {c.banned ? 'Yasağı Kaldır' : 'Yasakla'}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className={styles.bannedLabel}>Şu anda yasaklı ({bannedChampions.length})</p>
      {bannedChampions.length === 0 ? (
        <p className={styles.empty}>Yasaklı şampiyon yok.</p>
      ) : (
        <div className={styles.list}>
          {bannedChampions.map((c) => (
            <div key={c._id} className={styles.item}>
              <img src={c.imgLink} alt={c.name} className={styles.img} />
              <span className={styles.name}>{c.name}</span>
              <button className={styles.toggleBtn} onClick={() => handleToggleBan(c._id, false)}>
                Yasağı Kaldır
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
