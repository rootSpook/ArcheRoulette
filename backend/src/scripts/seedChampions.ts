import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Champion from '../models/Champion';

dotenv.config({ path: '../../.env' });
dotenv.config();

interface DDragonChampion {
  id: string;
  name: string;
}

interface DDragonResponse {
  data: Record<string, DDragonChampion>;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('MongoDB connected');

  const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await versionsRes.json() as string[];
  const version = versions[0];
  console.log(`Using Data Dragon version: ${version}`);

  const championsRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  const championsData = await championsRes.json() as DDragonResponse;

  const champions = Object.values(championsData.data);
  console.log(`Found ${champions.length} champions`);

  for (const champ of champions) {
    await Champion.updateOne(
      { championId: champ.id },
      {
        $setOnInsert: {
          championId: champ.id,
          name: champ.name,
          imgLink: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.id}.png`,
          timesPlayed: 0,
          wins: 0,
          counter: 0,
        },
      },
      { upsert: true }
    );
  }

  console.log(`Seeded ${champions.length} champions into the database`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
