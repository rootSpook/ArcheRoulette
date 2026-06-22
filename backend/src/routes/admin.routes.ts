import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import StreamerStats from '../models/StreamerStats';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  res.json({ message: 'Welcome to the admin dashboard', userId: req.userId });
});

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

export default router;
