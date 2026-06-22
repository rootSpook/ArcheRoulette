import { StreamerStats, Tier } from '../types/stats';
import styles from './StatsPanel.module.css';

interface Props {
  stats: StreamerStats | null;
}

const TIER_LABELS: Record<Tier, string> = {
  IRON: 'Demir',
  BRONZE: 'Bronz',
  SILVER: 'Gümüş',
  GOLD: 'Altın',
  PLATINUM: 'Platin',
  EMERALD: 'Zümrüt',
  DIAMOND: 'Elmas',
  MASTER: 'Ustalık',
  GRANDMASTER: 'Büyük Ustalık',
  CHALLENGER: 'Şampiyonluk',
};

// Master+ has no division
const NO_DIVISION: Tier[] = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

function emblemUrl(tier: Tier) {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/${tier.toLowerCase()}.png`;
}

export default function StatsPanel({ stats }: Props) {
  if (!stats) return null;

  const total = stats.wins + stats.losses;
  const winRate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : '0.0';
  const showDivision = !NO_DIVISION.includes(stats.tier);

  return (
    <div className={styles.panel}>
      <div className={styles.emblemBox}>
        <img
          src={emblemUrl(stats.tier)}
          alt={stats.tier}
          className={styles.emblem}
        />
      </div>

      <div className={styles.rankName}>
        {TIER_LABELS[stats.tier]}
        {showDivision && ` ${stats.division}`}
      </div>
      <div className={styles.lp}>{stats.lp} LP</div>

      <div className={styles.divider} />

      <div className={styles.record}>
        <span className={styles.wins}>{stats.wins}W</span>
        <span className={styles.slash}>/</span>
        <span className={styles.losses}>{stats.losses}L</span>
      </div>

      <div className={styles.winRate}>
        <div
          className={styles.winRateBar}
          style={{ width: `${winRate}%` }}
        />
        <span className={styles.winRateLabel}>%{winRate} Kazanma</span>
      </div>
    </div>
  );
}
