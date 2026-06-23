import { Router, Request, Response } from 'express';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { setAuthCookie, clearAuthCookie } from '../lib/authToken';
import { loginLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../lib/schemas';

const router = Router();

router.post('/login', loginLimiter, validateBody(loginSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  setAuthCookie(res, user._id.toString(), user.tokenVersion);
  res.json({ message: 'Giriş başarılı.' });
});

router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ message: 'Çıkış yapıldı.' });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ userId: req.userId });
});

export default router;
