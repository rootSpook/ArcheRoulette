import { z } from 'zod';
import { isValidServer } from './riotRegions';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const settingsSchema = z.object({
  cooldownEnabled: z.boolean().optional(),
  cooldownRounds: z.number().int().min(1).optional(),
});

export const riotApiKeySchema = z.object({
  apiKey: z.string().min(1).refine((v) => !v.includes('\n'), 'Tek satır olmalı.'),
});

export const statsSchema = z.object({
  tier: z.enum(['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER']).optional(),
  division: z.enum(['I','II','III','IV']).optional(),
  lp: z.number().int().min(0).optional(),
});

export const riotAccountSchema = z.object({
  gameName: z.string().min(1),
  tagLine: z.string().min(1),
  server: z.string().refine(isValidServer, 'Geçersiz sunucu.'),
});

export const banSchema = z.object({
  banned: z.boolean(),
});

export const votingStartSchema = z.object({
  minutes: z.number().int().min(0).max(60).optional(),
  seconds: z.number().int().min(0).max(59).optional(),
});

export const matchCreateSchema = z.object({
  championId: z.string().min(1),
  result: z.enum(['win', 'loss']),
});
