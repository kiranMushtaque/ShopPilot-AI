import { Request, Response, NextFunction } from 'express';
import { extractToken, getSession } from './session';
import { UserRole, UserSession } from '../types';

declare global {
  namespace Express {
    interface Request {
      userSession?: UserSession;
      sessionToken?: string;
    }
  }
}

// Middleware: Attaches session if present, but does not reject guests
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    req.sessionToken = token;
    const session = getSession(token);
    if (session) {
      req.userSession = session;
    }
  }
  next();
}

// Middleware: Enforces that user is logged in
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session has expired or is invalid. Please log in again.',
    });
  }

  req.sessionToken = token;
  req.userSession = session;
  next();
}

// Middleware: Enforces specific roles (ADMIN, SUPPORT)
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userSession) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.userSession.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to ${allowedRoles.join(' or ')}. Your role is ${req.userSession.role}.`,
      });
    }

    next();
  };
}
