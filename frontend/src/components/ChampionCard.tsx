import { Champion } from '../types/champion';
import styles from './ChampionCard.module.css';

interface Props {
  champion: Champion;
  selected: boolean;
  hasVoted: boolean;
  onSelect: (id: string) => void;
}

export default function ChampionCard({ champion, selected, hasVoted, onSelect }: Props) {
  const isRestricted = champion.banned || champion.cooldownRemaining > 0;
  const disabled = hasVoted || isRestricted;

  const classes = [
    styles.card,
    selected ? styles.selected : '',
    hasVoted ? styles.voted : '',
    isRestricted ? styles.restricted : '',
  ].join(' ');

  return (
    <div className={classes} onClick={() => !disabled && onSelect(champion._id)}>
      <img src={champion.imgLink} alt={champion.name} className={styles.img} />
      <div className={styles.name}>{champion.name}</div>
      <div className={styles.counter}>{champion.counter} oy</div>
      {hasVoted && selected && <div className={styles.votedBadge}>Oyunuz bu</div>}
      {champion.banned && <div className={styles.restrictedBadge}>Yasaklı</div>}
      {!champion.banned && champion.cooldownRemaining > 0 && (
        <div className={styles.restrictedBadge}>{champion.cooldownRemaining} round bekliyor</div>
      )}
    </div>
  );
}
