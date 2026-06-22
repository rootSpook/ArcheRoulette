import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import StreamerStats from '../models/StreamerStats';
import Match from '../models/Match';
import Champion from '../models/Champion';
import VotingSession from '../models/VotingSession';
import VoterLog from '../models/VoterLog';
import User from '../models/User';

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

// ── Danger zone ──────────────────────────────────────────────────────────────

router.post('/reset-all', async (_req: Request, res: Response) => {
  await Promise.all([
    Champion.updateMany({}, { $set: { counter: 0, wins: 0, timesPlayed: 0 } }),
    VoterLog.deleteMany({}),
    Match.deleteMany({}),
    VotingSession.deleteMany({}),
    StreamerStats.deleteMany({}),
  ]);
  res.json({ message: 'Tüm veriler sıfırlandı.' });
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
  const { tier, division, lp, wins, losses } = req.body;
  let stats = await StreamerStats.findOne();
  if (!stats) {
    stats = await StreamerStats.create({ tier, division, lp, wins, losses });
  } else {
    stats.tier = tier ?? stats.tier;
    stats.division = division ?? stats.division;
    stats.lp = lp ?? stats.lp;
    stats.wins = wins ?? stats.wins;
    stats.losses = losses ?? stats.losses;
    await stats.save();
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
  await champion.save();
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
  await match.deleteOne();
  res.json({ message: 'Maç silindi.' });
});

export default router;
