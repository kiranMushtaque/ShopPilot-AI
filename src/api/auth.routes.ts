import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../auth/password';
import { createSessionToken, setSessionCookie, clearSessionCookie } from '../auth/session';
import { requireAuth } from '../auth/rbac';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.parse(req.body);
    const pwdCheck = validatePasswordStrength(parsed.password);
    if (!pwdCheck.isValid) {
      return res.status(400).json({ success: false, error: pwdCheck.message });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await db.createUser({
      email: parsed.email,
      passwordHash,
      name: parsed.name,
      phone: parsed.phone,
      role: 'CUSTOMER',
    });

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    return res.status(201).json({
      success: true,
      data: { user, token },
      message: 'Account created successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.parse(req.body);
    const userRecord = await db.getUserByEmail(parsed.email);

    if (!userRecord || !userRecord.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = await verifyPassword(parsed.password, userRecord.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const { passwordHash: _, ...safeUser } = userRecord;
    const token = createSessionToken(safeUser);
    setSessionCookie(res, token);

    return res.status(200).json({
      success: true,
      data: { user: safeUser, token },
      message: `Welcome back, ${safeUser.name}!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await db.getUserById(req.userSession!.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  return res.status(200).json({ success: true, data: { user } });
});
