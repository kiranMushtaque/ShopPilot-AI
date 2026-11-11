import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { AgentOrchestrator } from '../ai/agent/orchestrator';

export const chatRouter = Router();

function getSessionToken(req: Request): string {
  return req.sessionToken || (req.headers['x-session-token'] as string) || 'guest-session-default';
}

const ChatMessageSchema = z.object({
  message: z.string().min(1),
});

// POST /api/chat/message (Customer sends message to AI Shopping Assistant)
chatRouter.post('/message', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const parsed = ChatMessageSchema.parse(req.body);

    const result = await AgentOrchestrator.handleUserMessage({
      sessionToken: token,
      message: parsed.message,
      userId: req.userSession?.userId,
      userRole: req.userSession?.role,
      customerName: req.userSession?.name || 'Customer',
    });

    return res.status(200).json({
      success: true,
      data: result.message,
      suggestedProducts: result.suggestedProducts,
      ollamaStatus: result.ollamaStatus,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat processing failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/chat/history
chatRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const conv = await db.getOrCreateConversation(token, req.userSession?.userId);
    return res.status(200).json({
      success: true,
      data: conv,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch chat history';
    return res.status(500).json({ success: false, error: msg });
  }
});
