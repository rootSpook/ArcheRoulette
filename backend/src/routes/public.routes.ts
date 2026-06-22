import { Router, Request, Response } from 'express';
import Champion from '../models/Champion';
import VoterLog from '../models/VoterLog';
import StreamerStats from '../models/StreamerStats';

const router = Router();

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || 'unknown';
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/stats', async (_req: Request, res: Response) => {
  let stats = await StreamerStats.findOne();
  if (!stats) stats = await StreamerStats.create({});
  res.json(stats);
});

router.get('/champions', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
  const champions = await Champion.find(filter).sort({ name: 1 });
  res.json(champions);
});

router.delete('/votes/reset', async (_req: Request, res: Response) => {
  await VoterLog.deleteMany({});
  await Champion.updateMany({}, { $set: { counter: 0 } });
  res.json({ message: 'Tüm oylar sıfırlandı.' });
});

router.post('/champions/:id/vote', async (req: Request, res: Response) => {
  const ip = getIp(req);

  const existing = await VoterLog.findOne({ ip });
  if (existing) {
    res.status(403).json({ message: 'Zaten oy kullandınız.' });
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
