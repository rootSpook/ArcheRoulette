import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  res.json({ message: 'Welcome to the admin dashboard', userId: req.userId });
});

export default router;
