import { Champion } from '../types/champion';
import styles from './ChampionCard.module.css';

interface Props {
  champion: Champion;
  selected: boolean;
  hasVoted: boolean;
  onSelect: (id: string) => void;
}

export default function ChampionCard({ champion, selected, hasVoted, onSelect }: Props) {
  const classes = [
    styles.card,
    selected ? styles.selected : '',
    hasVoted ? styles.voted : '',
  ].join(' ');

  return (
    <div className={classes} onClick={() => !hasVoted && onSelect(champion._id)}>
      <img src={champion.imgLink} alt={champion.name} className={styles.img} />
      <div className={styles.name}>{champion.name}</div>
      <div className={styles.counter}>{champion.counter} oy</div>
      {hasVoted && selected && <div className={styles.votedBadge}>Oyunuz bu</div>}
    </div>
  );
}
