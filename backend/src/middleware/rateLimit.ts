import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.' },
});

export const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' },
});

export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' },
});
