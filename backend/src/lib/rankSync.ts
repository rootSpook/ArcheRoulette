import StreamerStats, { IStreamerStats } from '../models/StreamerStats';
import Settings from '../models/Settings';
import { fetchSoloRank } from './riotApi';
import { encrypt, decrypt } from './crypto';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

// Resolves the Riot API key from encrypted DB storage. Falls back to a
// legacy .env value once, migrating it into encrypted storage so the
// admin panel becomes the only place the key needs to be managed going forward.
async function resolveApiKey(): Promise<string | null> {
  let settings = await Settings.findOne();
  if (settings?.riotApiKeyEncrypted) {
    return decrypt(settings.riotApiKeyEncrypted);
  }
  if (process.env.RIOT_API_KEY) {
    if (!settings) settings = await Settings.create({});
    settings.riotApiKeyEncrypted = encrypt(process.env.RIOT_API_KEY);
    await settings.save();
    return process.env.RIOT_API_KEY;
  }
  return null;
}

export async function syncRank() {
  const stats = await StreamerStats.findOne();
  if (!stats?.riotGameName || !stats.riotTagLine || !stats.riotServer) return stats;

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    stats.riotLastError = 'Riot API anahtarı tanımlı değil. Ayarlar sayfasından ekleyin.';
    stats.riotLastSyncAt = new Date();
    await stats.save();
    return stats;
  }

  try {
    const rank = await fetchSoloRank(stats.riotGameName, stats.riotTagLine, stats.riotServer, apiKey);
    if (rank.unranked) {
      stats.riotLastError = 'Bu hesap şu anda derecesiz (unranked).';
    } else {
      stats.tier = rank.tier as IStreamerStats['tier'];
      stats.division = rank.division as IStreamerStats['division'];
      stats.lp = rank.lp;
      stats.riotLastError = undefined;
    }
  } catch (err: unknown) {
    stats.riotLastError = err instanceof Error ? err.message : 'Senkronizasyon başarısız.';
  }
  stats.riotLastSyncAt = new Date();
  await stats.save();
  return stats;
}

export function startRankSyncScheduler() {
  setInterval(() => {
    syncRank().catch((err) => console.error('Rank sync error:', err));
  }, SYNC_INTERVAL_MS);
}
