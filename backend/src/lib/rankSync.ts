import StreamerStats, { IStreamerStats } from '../models/StreamerStats';
import { fetchSoloRank } from './riotApi';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export async function syncRank() {
  const stats = await StreamerStats.findOne();
  if (!stats?.riotGameName || !stats.riotTagLine || !stats.riotServer) return stats;

  try {
    const rank = await fetchSoloRank(stats.riotGameName, stats.riotTagLine, stats.riotServer);
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
