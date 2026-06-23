import { Champion } from '../types/champion';
import styles from './BannedChampionsPanel.module.css';

interface Props {
  champions: Champion[];
  cooldownEnabled: boolean;
}

export default function BannedChampionsPanel({ champions, cooldownEnabled }: Props) {
  const cooldownChampions = cooldownEnabled
    ? champions.filter((c) => !c.banned && c.cooldownRemaining > 0).sort((a, b) => b.cooldownRemaining - a.cooldownRemaining)
    : [];
  const bannedChampions = champions.filter((c) => c.banned);

  if (cooldownChampions.length === 0 && bannedChampions.length === 0) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Beklemede</p>
        {cooldownChampions.length === 0 ? (
          <p className={styles.empty}>Yok</p>
        ) : (
          <div className={styles.list}>
            {cooldownChampions.map((c) => (
              <div key={c._id} className={styles.item}>
                <img src={c.imgLink} alt={c.name} className={styles.img} />
                <div className={styles.info}>
                  <div className={styles.name}>{c.name}</div>
                  <div className={styles.cooldown}>{c.cooldownRemaining} round kaldı</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Yasaklı</p>
        {bannedChampions.length === 0 ? (
          <p className={styles.empty}>Yok</p>
        ) : (
          <div className={styles.list}>
            {bannedChampions.map((c) => (
              <div key={c._id} className={styles.item}>
                <img src={c.imgLink} alt={c.name} className={`${styles.img} ${styles.bannedImg}`} />
                <div className={styles.info}>
                  <div className={styles.name}>{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
