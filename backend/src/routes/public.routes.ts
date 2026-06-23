import { Router, Request, Response } from 'express';
import Champion from '../models/Champion';
import VoterLog from '../models/VoterLog';
import StreamerStats from '../models/StreamerStats';
import VotingSession from '../models/VotingSession';
import Match from '../models/Match';
import Settings from '../models/Settings';

const router = Router();

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || 'unknown';
}

async function getSession() {
  let session = await VotingSession.findOne();
  if (!session) session = await VotingSession.create({ status: 'idle' });

  // Lazily transition active → ended when timer expires
  if (session.status === 'active' && session.endsAt && session.endsAt < new Date()) {
    session.status = 'ended';
    await session.save();
  }
  return session;
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/stats', async (_req: Request, res: Response) => {
  let stats = await StreamerStats.findOne();
  if (!stats) stats = await StreamerStats.create({});

  // wins/losses are always derived live from match history so they can
  // never drift from what Maç Geçmişi shows
  const [wins, losses] = await Promise.all([
    Match.countDocuments({ result: 'win' }),
    Match.countDocuments({ result: 'loss' }),
  ]);

  res.json({ ...stats.toObject(), wins, losses });
});

router.get('/settings', async (_req: Request, res: Response) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

router.get('/voting', async (_req: Request, res: Response) => {
  const session = await getSession();
  await session.populate('winner', 'name imgLink championId');
  res.json(session);
});

router.get('/matches', async (_req: Request, res: Response) => {
  const matches = await Match.find()
    .populate('champion', 'name imgLink championId')
    .sort({ playedAt: -1 });
  res.json(matches);
});

router.get('/champions', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
  const champions = await Champion.find(filter).sort({ name: 1 });
  res.json(champions);
});

router.post('/champions/:id/vote', async (req: Request, res: Response) => {
  const session = await getSession();
  if (session.status !== 'active') {
    res.status(403).json({ message: 'Şu anda aktif bir oylama bulunmuyor.' });
    return;
  }

  const ip = getIp(req);
  const existing = await VoterLog.findOne({ ip });
  if (existing) {
    res.status(403).json({ message: 'Zaten oy kullandınız.' });
    return;
  }

  const target = await Champion.findById(req.params.id);
  if (!target) {
    res.status(404).json({ message: 'Şampiyon bulunamadı.' });
    return;
  }

  if (target.banned) {
    res.status(403).json({ message: 'Bu şampiyon yasaklı.' });
    return;
  }

  const settings = await Settings.findOne();
  if (settings?.cooldownEnabled && target.cooldownRemaining > 0) {
    res.status(403).json({ message: 'Bu şampiyon şu anda beklemede.' });
    return;
  }

  const champion = await Champion.findByIdAndUpdate(
    req.params.id,
    { $inc: { counter: 1 } },
    { new: true }
  );
  if (!champion) {
    res.status(404).json({ message: 'Şampiyon bulunamadı.' });
    return;
  }

  await VoterLog.create({ ip, championId: champion._id });
  res.json(champion);
});

export default router;
