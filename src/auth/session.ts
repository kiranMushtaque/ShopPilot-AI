import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getValidatedConfig } from '../config/env';
import { db } from '../db/store';
import { User, UserRole, UserSession } from '../types';

export const SESSION_COOKIE_NAME = 'shoppilot_session';
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// In-Memory Active Session Registry
const activeSessions: Map<string, { session: UserSession; expiresAt: number }> = new Map();

export function createSessionToken(user: User): string {
  const token = crypto.randomBytes(32).toString('hex');
  const session: UserSession = {
    userId: user.id,
    storeId: user.storeId,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  activeSessions.set(token, {
    session,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  });

  return token;
}

export function getSession(token: string): UserSession | null {
  if (!token) return null;
  const entry = activeSessions.get(token);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return entry.session;
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export function setSessionCookie(res: Response, token: string): void {
  const config = getValidatedConfig();
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: '/',
  });
}

// Session Token resolver from Cookie or Bearer Header
export function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
