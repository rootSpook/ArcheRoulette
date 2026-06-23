import jwt from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';

export const COOKIE_NAME = 'token';
// Should stay roughly in sync with JWT_EXPIRES_IN
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  id: string;
  v: number;
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Decoupled from NODE_ENV on purpose: a production deployment can still
    // be served over plain HTTP (e.g. IP-only, no domain/TLS yet). A `Secure`
    // cookie is silently dropped by the browser on HTTP, which would break
    // login without this being explicit. Flip COOKIE_SECURE=true once HTTPS
    // is actually in front of the site.
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
  };
}

export function signToken(userId: string, tokenVersion: number): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign({ id: userId, v: tokenVersion }, process.env.JWT_SECRET!, options);
}

export function setAuthCookie(res: Response, userId: string, tokenVersion: number) {
  const token = signToken(userId, tokenVersion);
  res.cookie(COOKIE_NAME, token, { ...baseCookieOptions(), maxAge: COOKIE_MAX_AGE_MS });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
}
