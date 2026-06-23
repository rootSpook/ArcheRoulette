import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { COOKIE_NAME, TokenPayload } from '../lib/authToken';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const user = await User.findById(payload.id).select('tokenVersion');
    if (!user || user.tokenVersion !== payload.v) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
