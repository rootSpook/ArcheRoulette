import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Champion } from '../types/champion';
import styles from './VoteResults.module.css';

interface Props {
  champions: Champion[];
}

const COLORS = [
  '#e03030', '#c0392b', '#a93226', '#922b21', '#7b241c',
  '#ff6b6b', '#ff4757', '#ff6348', '#ff7f50', '#e84393',
];

export default function VoteResults({ champions }: Props) {
  const voted = champions.filter((c) => c.counter > 0).sort((a, b) => b.counter - a.counter);
  if (voted.length === 0) return null;

  const total = voted.reduce((sum, c) => sum + c.counter, 0);
  const data = voted.map((c) => ({ name: c.name, value: c.counter }));

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Mevcut Sonuçlar</h2>

      <div className={styles.inner}>
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={50}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} oy`, '']}
                contentStyle={{ background: '#1a0000', border: '1px solid #3a0a0a', color: '#e8d0d0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.list}>
          {voted.map((champ, i) => {
            const pct = ((champ.counter / total) * 100).toFixed(1);
            return (
              <div key={champ._id} className={styles.row}>
                <div className={styles.rank} style={{ color: COLORS[i % COLORS.length] }}>
                  #{i + 1}
                </div>
                <img src={champ.imgLink} alt={champ.name} className={styles.splash} />
                <div className={styles.info}>
                  <div className={styles.champName}>{champ.name}</div>
                  <div className={styles.bar}>
                    <div
                      className={styles.fill}
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
                <div className={styles.pct} style={{ color: COLORS[i % COLORS.length] }}>
                  {pct}%
                  <span className={styles.voteCount}>{champ.counter} oy</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
