import { regionalRoutingFor } from './riotRegions';

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RankResult {
  tier: string;
  division: string;
  lp: number;
  unranked: boolean;
}

export async function fetchSoloRank(gameName: string, tagLine: string, platform: string): Promise<RankResult> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error('RIOT_API_KEY tanımlı değil.');

  const regional = regionalRoutingFor(platform);
  if (!regional) throw new Error('Geçersiz sunucu.');

  const accountRes = await fetch(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { headers: { 'X-Riot-Token': apiKey } }
  );
  if (accountRes.status === 404) throw new Error('Oyuncu bulunamadı.');
  if (!accountRes.ok) throw new Error(`Riot hesap sorgusu başarısız (${accountRes.status}).`);
  const account = await accountRes.json() as RiotAccount;

  const leagueRes = await fetch(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`,
    { headers: { 'X-Riot-Token': apiKey } }
  );
  if (!leagueRes.ok) throw new Error(`Riot rank sorgusu başarısız (${leagueRes.status}).`);
  const entries = await leagueRes.json() as LeagueEntry[];

  const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
  if (!solo) {
    return { tier: 'UNRANKED', division: '', lp: 0, unranked: true };
  }
  return { tier: solo.tier, division: solo.rank, lp: solo.leaguePoints, unranked: false };
}
