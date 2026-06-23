import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Champion from '../models/Champion';

dotenv.config();

const SIMULATIONS = 10000;
const VOTE_SCENARIOS = [20, 200, 1000];
const MIN_CHAMPIONS = 3;
const MAX_CHAMPIONS = 8;

const FALLBACK_NAMES = [
  'Vladimir', 'Ashe', 'Kayle', 'Jinx', 'Yasuo', 'Lux', 'Garen', 'Zed',
  'Ahri', 'Lee Sin', 'Darius', 'Riven',
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

// Randomly splits `total` votes across `count` champions, summing exactly to `total`
function distributeVotes(total: number, count: number): number[] {
  const weights = Array.from({ length: count }, () => Math.random());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const votes = weights.map((w) => Math.round((w / weightSum) * total));

  let diff = total - votes.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0) {
    if (diff > 0) { votes[i % count]++; diff--; }
    else if (votes[i % count] > 0) { votes[i % count]--; diff++; }
    i++;
  }
  return votes;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function runScenario(totalVotes: number, names: string[]) {
  const championCount = Math.min(
    names.length,
    MIN_CHAMPIONS + Math.floor(Math.random() * (MAX_CHAMPIONS - MIN_CHAMPIONS + 1))
  );
  const chosenNames = shuffle(names).slice(0, championCount);
  const voteCounts = distributeVotes(totalVotes, championCount);

  const voted: Votable[] = chosenNames.map((name, i) => ({ name, counter: voteCounts[i] })).filter((c) => c.counter > 0);
  const total = voted.reduce((s, c) => s + c.counter, 0);

  const wins = new Map<string, number>();
  voted.forEach((c) => wins.set(c.name, 0));

  for (let i = 0; i < SIMULATIONS; i++) {
    const winner = pickWinner(voted);
    wins.set(winner.name, (wins.get(winner.name) ?? 0) + 1);
  }

  console.log(`\n=== Scenario: ${totalVotes} total votes across ${voted.length} champions ===`);
  console.log(`Simulated ${SIMULATIONS} spins\n`);

  const header = ['Champion', 'Votes', 'Expected %', 'Actual %', 'Diff'];
  console.log(header[0].padEnd(16), header[1].padEnd(8), header[2].padEnd(12), header[3].padEnd(10), header[4]);
  console.log('-'.repeat(58));

  [...voted]
    .sort((a, b) => b.counter - a.counter)
    .forEach((c) => {
      const expectedPct = (c.counter / total) * 100;
      const actualPct = ((wins.get(c.name) ?? 0) / SIMULATIONS) * 100;
      const diff = actualPct - expectedPct;
      console.log(
        c.name.padEnd(16),
        String(c.counter).padEnd(8),
        `${expectedPct.toFixed(2)}%`.padEnd(12),
        `${actualPct.toFixed(2)}%`.padEnd(10),
        `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`
      );
    });
}

async function run() {
  let names = FALLBACK_NAMES;

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const champions = await Champion.find().limit(200);
    if (champions.length >= MAX_CHAMPIONS) {
      names = champions.map((c) => c.name);
    }
  } catch {
    // No DB connection available — use fallback name pool
  }

  console.log(`Using ${names === FALLBACK_NAMES ? 'fallback' : 'database'} champion name pool (${names.length} names)`);

  for (const totalVotes of VOTE_SCENARIOS) {
    runScenario(totalVotes, names);
  }

  console.log('\n(Small diffs are expected — this is random sampling, not a deterministic split.)');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
