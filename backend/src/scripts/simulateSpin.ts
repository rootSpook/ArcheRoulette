import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Champion from '../models/Champion';

dotenv.config();

const SIMULATIONS = 10000;

// Falls back to the user's example scenario when no real votes exist in the DB
const FALLBACK_VOTES: { name: string; counter: number }[] = [
  { name: 'Vladimir', counter: 3 },
  { name: 'Ashe', counter: 2 },
  { name: 'Kayle', counter: 8 },
];

interface Votable {
  name: string;
  counter: number;
}

// Same cumulative-weight algorithm used in admin.routes.ts /voting/spin
function pickWinner<T extends Votable>(voted: T[]): T {
  const total = voted.reduce((s, c) => s + c.counter, 0);
  let rand = Math.random() * total;
  let winner = voted[0];
  for (const champ of voted) {
    rand -= champ.counter;
    if (rand <= 0) { winner = champ; break; }
  }
  return winner;
}

async function run() {
  let voted: Votable[] = [];
  let usingRealData = false;

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const champions = await Champion.find({ counter: { $gt: 0 } });
    if (champions.length > 0) {
      voted = champions.map((c) => ({ name: c.name, counter: c.counter }));
      usingRealData = true;
    }
  } catch {
    // No DB connection available — fall back to example data
  }

  if (voted.length === 0) {
    voted = FALLBACK_VOTES;
  }

  const total = voted.reduce((s, c) => s + c.counter, 0);
  const wins = new Map<string, number>();
  voted.forEach((c) => wins.set(c.name, 0));

  for (let i = 0; i < SIMULATIONS; i++) {
    const winner = pickWinner(voted);
    wins.set(winner.name, (wins.get(winner.name) ?? 0) + 1);
  }

  console.log(`\nData source: ${usingRealData ? 'live database votes' : 'fallback example (no DB votes found)'}`);
  console.log(`Simulated ${SIMULATIONS} spins — total votes: ${total}\n`);

  const header = ['Champion', 'Votes', 'Expected %', 'Actual %', 'Diff'];
  console.log(header[0].padEnd(20), header[1].padEnd(8), header[2].padEnd(12), header[3].padEnd(10), header[4]);
  console.log('-'.repeat(62));

  [...voted]
    .sort((a, b) => b.counter - a.counter)
    .forEach((c) => {
      const expectedPct = (c.counter / total) * 100;
      const actualPct = ((wins.get(c.name) ?? 0) / SIMULATIONS) * 100;
      const diff = actualPct - expectedPct;
      console.log(
        c.name.padEnd(20),
        String(c.counter).padEnd(8),
        `${expectedPct.toFixed(2)}%`.padEnd(12),
        `${actualPct.toFixed(2)}%`.padEnd(10),
        `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`
      );
    });

  console.log('\n(Small diffs are expected — this is random sampling, not a deterministic split.)');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
