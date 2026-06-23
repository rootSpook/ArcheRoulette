import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import StreamerStats from '../models/StreamerStats';
import Match from '../models/Match';
import Champion from '../models/Champion';
import VotingSession from '../models/VotingSession';
import VoterLog from '../models/VoterLog';
import User from '../models/User';
import Settings from '../models/Settings';
import { syncRank } from '../lib/rankSync';
import { isValidServer, SERVERS } from '../lib/riotRegions';
import { setEnvVar } from '../lib/envFile';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  res.json({ message: 'Welcome to the admin dashboard', userId: req.userId });
});

// ── Account ──────────────────────────────────────────────────────────────────

router.put('/account/password', async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Mevcut ve yeni şifre gerekli.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalı.' });
    return;
  }

  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    return;
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    res.status(401).json({ message: 'Mevcut şifre yanlış.' });
    return;
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Şifre güncellendi.' });
});

// ── Settings ─────────────────────────────────────────────────────────────────

router.get('/settings', async (_req: Request, res: Response) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

router.put('/settings', async (req: Request, res: Response) => {
  const { cooldownEnabled, cooldownRounds } = req.body;
  if (cooldownRounds !== undefined && Number(cooldownRounds) < 1) {
    res.status(400).json({ message: 'Bekleme süresi en az 1 round olmalı.' });
    return;
  }

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ cooldownEnabled, cooldownRounds });
  } else {
    settings.cooldownEnabled = cooldownEnabled ?? settings.cooldownEnabled;
    settings.cooldownRounds = cooldownRounds ?? settings.cooldownRounds;
    await settings.save();
  }

  res.json(settings);
});

router.put('/settings/riot-api-key', (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.includes('\n')) {
    res.status(400).json({ message: 'Geçerli bir API anahtarı girin.' });
    return;
  }

  setEnvVar('RIOT_API_KEY', apiKey.trim());
  res.json({ message: 'Riot API anahtarı güncellendi.' });
});

// ── Danger zone ──────────────────────────────────────────────────────────────

router.post('/reset-all', async (_req: Request, res: Response) => {
  await Promise.all([
    Champion.updateMany({}, { $set: { counter: 0, wins: 0, timesPlayed: 0, cooldownRemaining: 0, banned: false } }),
    VoterLog.deleteMany({}),
    Match.deleteMany({}),
    VotingSession.deleteMany({}),
    StreamerStats.deleteMany({}),
  ]);
  res.json({ message: 'Tüm veriler sıfırlandı.' });
});

// ── Champion bans ────────────────────────────────────────────────────────────

router.put('/champions/:id/ban', async (req: Request, res: Response) => {
  const { banned } = req.body;
  const champion = await Champion.findByIdAndUpdate(
    req.params.id,
    { $set: { banned: !!banned } },
    { new: true }
  );
  if (!champion) {
    res.status(404).json({ message: 'Şampiyon bulunamadı.' });
    return;
  }
  res.json(champion);
});

// ── Voting controls ──────────────────────────────────────────────────────────

router.post('/voting/start', async (req: Request, res: Response) => {
  const { minutes = 0, seconds = 0 } = req.body;
  const durationMs = (Number(minutes) * 60 + Number(seconds)) * 1000;
  if (durationMs <= 0) {
    res.status(400).json({ message: 'Geçerli bir süre girin.' });
    return;
  }

  // Reset all votes for a fresh session
  await VoterLog.deleteMany({});
  await Champion.updateMany({}, { $set: { counter: 0 } });

  // Always delete and recreate so a new _id is generated.
  // The frontend uses _id to detect a new session and clear localStorage votes.
  await VotingSession.deleteMany({});
  const session = await VotingSession.create({
    status: 'active',
    endsAt: new Date(Date.now() + durationMs),
  });
  res.json(session);
});

router.post('/voting/end', async (_req: Request, res: Response) => {
  const session = await VotingSession.findOne();
  if (!session || session.status !== 'active') {
    res.status(400).json({ message: 'Aktif bir oylama yok.' });
    return;
  }
  session.status = 'ended';
  await session.save();
  res.json(session);
});

router.post('/voting/cancel', async (_req: Request, res: Response) => {
  const session = await VotingSession.findOne();
  if (!session) { res.json({ status: 'idle' }); return; }
  session.status = 'idle';
  session.endsAt = undefined;
  session.winner = undefined;
  await session.save();
  res.json(session);
});

router.post('/voting/spin', async (_req: Request, res: Response) => {
  const session = await VotingSession.findOne();
  if (!session || session.status !== 'ended') {
    res.status(400).json({ message: 'Oylama henüz bitmedi.' });
    return;
  }

  const voted = await Champion.find({ counter: { $gt: 0 } });
  if (voted.length === 0) {
    res.status(400).json({ message: 'Hiç oy kullanılmamış.' });
    return;
  }

  // Weighted random pick
  const total = voted.reduce((s, c) => s + c.counter, 0);
  let rand = Math.random() * total;
  let winner = voted[0];
  for (const champ of voted) {
    rand -= champ.counter;
    if (rand <= 0) { winner = champ; break; }
  }

  session.status = 'result';
  session.winner = winner._id;
  await session.save();
  await session.populate('winner', 'name imgLink championId');
  res.json(session);
});

// ── Stats ────────────────────────────────────────────────────────────────────

router.put('/stats', async (req: Request, res: Response) => {
  // wins/losses are derived automatically from recorded matches, not editable here
  const { tier, division, lp } = req.body;
  let stats = await StreamerStats.findOne();
  if (!stats) {
    stats = await StreamerStats.create({ tier, division, lp });
  } else {
    stats.tier = tier ?? stats.tier;
    stats.division = division ?? stats.division;
    stats.lp = lp ?? stats.lp;
    await stats.save();
  }

  const [wins, losses] = await Promise.all([
    Match.countDocuments({ result: 'win' }),
    Match.countDocuments({ result: 'loss' }),
  ]);

  res.json({ ...stats.toObject(), wins, losses });
});

router.get('/servers', (_req: Request, res: Response) => {
  res.json(SERVERS);
});

router.put('/stats/riot-account', async (req: Request, res: Response) => {
  const { gameName, tagLine, server } = req.body;
  if (!gameName || !tagLine || !server) {
    res.status(400).json({ message: 'Riot ID ve sunucu gerekli.' });
    return;
  }
  if (!isValidServer(server)) {
    res.status(400).json({ message: 'Geçersiz sunucu.' });
    return;
  }

  let stats = await StreamerStats.findOne();
  if (!stats) stats = await StreamerStats.create({});
  stats.riotGameName = gameName;
  stats.riotTagLine = tagLine;
  stats.riotServer = server;
  stats.riotLastError = undefined;
  await stats.save();

  res.json(stats);
});

router.delete('/stats/riot-account', async (_req: Request, res: Response) => {
  const stats = await StreamerStats.findOne();
  if (stats) {
    stats.riotGameName = undefined;
    stats.riotTagLine = undefined;
    stats.riotServer = undefined;
    stats.riotLastSyncAt = undefined;
    stats.riotLastError = undefined;
    await stats.save();
  }
  res.json(stats ?? {});
});

router.post('/stats/sync-rank', async (_req: Request, res: Response) => {
  const existing = await StreamerStats.findOne();
  if (!existing?.riotGameName || !existing.riotTagLine || !existing.riotServer) {
    res.status(400).json({ message: 'Önce bir Riot ID kaydedin.' });
    return;
  }

  const stats = await syncRank();
  if (stats?.riotLastError) {
    res.status(502).json(stats);
    return;
  }
  res.json(stats);
});

// ── Matches ──────────────────────────────────────────────────────────────────

router.get('/matches', async (_req: Request, res: Response) => {
  const matches = await Match.find()
    .populate('champion', 'name imgLink championId')
    .sort({ playedAt: -1 });
  res.json(matches);
});

router.post('/matches', async (req: Request, res: Response) => {
  const { championId, result } = req.body;
  const champion = await Champion.findById(championId);
  if (!champion) {
    res.status(404).json({ message: 'Şampiyon bulunamadı.' });
    return;
  }
  const match = await Match.create({ champion: championId, result });
  champion.timesPlayed += 1;
  if (result === 'win') champion.wins += 1;

  // A round only "counts" against other champions' cooldowns once a match
  // result is actually recorded — a cancelled/reset round without a
  // recorded result must not tick anyone's cooldown down.
  await Champion.updateMany(
    { _id: { $ne: championId }, cooldownRemaining: { $gt: 0 } },
    { $inc: { cooldownRemaining: -1 } }
  );

  // Recording a match result puts the champion on cooldown
  const settings = await Settings.findOne();
  if (settings?.cooldownEnabled) {
    champion.cooldownRemaining = settings.cooldownRounds;
  }

  await champion.save();

  // Update the streamer's win/lose streak automatically.
  // wins/losses themselves are derived live from Match documents (see GET /stats),
  // so no separate counter is incremented here — it would only risk drifting.
  let stats = await StreamerStats.findOne();
  if (!stats) stats = await StreamerStats.create({});
  if (stats.streakType === result) {
    stats.streakCount += 1;
  } else {
    stats.streakType = result;
    stats.streakCount = 1;
  }
  await stats.save();

  await match.populate('champion', 'name imgLink championId');
  res.status(201).json(match);
});

router.delete('/matches/:id', async (req: Request, res: Response) => {
  const match = await Match.findById(req.params.id).populate<{ champion: InstanceType<typeof Champion> }>('champion');
  if (!match) {
    res.status(404).json({ message: 'Maç bulunamadı.' });
    return;
  }
  const champion = await Champion.findById(match.champion._id);
  if (champion) {
    champion.timesPlayed = Math.max(0, champion.timesPlayed - 1);
    if (match.result === 'win') champion.wins = Math.max(0, champion.wins - 1);
    await champion.save();
  }

  // No StreamerStats.wins/losses to update — those are derived live from
  // Match documents, so deleting this one automatically updates the count.
  await match.deleteOne();
  res.json({ message: 'Maç silindi.' });
});

export default router;
