import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-Memory Token Bucket Rate Limiter
class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  public check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetInSec: number } {
    const now = Date.now();
    const existing = this.records.get(key);

    if (!existing || now > existing.resetTime) {
      this.records.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: limit - 1, resetInSec: Math.ceil(windowMs / 1000) };
    }

    if (existing.count >= limit) {
      const resetInSec = Math.ceil((existing.resetTime - now) / 1000);
      return { allowed: false, remaining: 0, resetInSec };
    }

    existing.count += 1;
    this.records.set(key, existing);
    const resetInSec = Math.ceil((existing.resetTime - now) / 1000);
    return { allowed: true, remaining: limit - existing.count, resetInSec };
  }
}

export const rateLimiter = new RateLimiter();

// Strict Rate Limiter for Guest Order Lookups: 5 attempts per 15 minutes per IP
export function guestOrderLookupRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown-client';
  const key = `guest-order-track:${clientIp}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const limit = 5;

  const result = rateLimiter.check(String(key), limit, windowMs);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many order lookup attempts. Please wait ${result.resetInSec} seconds before trying again.`,
    });
  }

  next();
}

// General API Rate Limiter: 100 requests per minute
export function generalApiRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown-client';
  const key = `general-api:${clientIp}`;
  const windowMs = 60 * 1000; // 1 minute
  const limit = 100;

  const result = rateLimiter.check(String(key), limit, windowMs);

  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded. Please wait ${result.resetInSec} seconds.`,
    });
  }

  next();
}
