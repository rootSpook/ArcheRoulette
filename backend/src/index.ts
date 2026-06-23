import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import { startRankSyncScheduler } from './lib/rankSync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

// Trust exactly one upstream proxy (e.g. the Vite dev proxy or a single
// reverse proxy/platform edge in production) so req.ip reflects the real
// client IP from X-Forwarded-For — needed for the vote-once-per-IP check.
app.set('trust proxy', 1);

app.use(helmet({
  // This server only ever returns JSON, never HTML, so its own CSP header
  // has no document to apply to. Allow cross-origin reads since the
  // frontend may be served from a different origin (CORS already governs this).
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  startRankSyncScheduler();
});
