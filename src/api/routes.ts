import { Router, Request, Response, NextFunction } from 'express';
import { getValidatedConfig } from '../config/env';
import { HealthCheckResponse } from '../types';
import { db } from '../db/store';
import { ollamaProvider } from '../ai/providers/ollama.provider';

import { authRouter } from './auth.routes';
import { catalogRouter } from './catalog.routes';
import { cartRouter } from './cart.routes';
import { orderRouter } from './order.routes';
import { chatRouter } from './chat.routes';
import { adminRouter } from './admin.routes';
import { supportRouter } from './support.routes';
import { knowledgeRouter } from './knowledge.routes';
import { optionalAuthMiddleware } from '../auth/rbac';
import { generalApiRateLimit } from '../middleware/rate-limit';

export const apiRouter = Router();
const startTime = Date.now();

// Attach session context and rate limiting across API
apiRouter.use(generalApiRateLimit);
apiRouter.use(optionalAuthMiddleware);

// Health Check Endpoint (GET /api/health)
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const config = getValidatedConfig();
  const isOllamaOnline = await ollamaProvider.isAvailable();

  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: config.NODE_ENV,
    database: db.getPostgresStatus(),
    app: {
      name: 'ShopPilot AI',
      version: '1.0.0',
      aiProvider: config.AI_PROVIDER,
      model: config.AI_MODEL,
      ollamaStatus: isOllamaOnline ? 'online' : 'fallback_mode',
    },
  };
  res.status(200).json(response);
});

// Mount Sub-Routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/', catalogRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/knowledge', knowledgeRouter);

// Generic 404 for undefined API routes
apiRouter.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// Central API Error Handler
export function apiErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[API Error]:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
