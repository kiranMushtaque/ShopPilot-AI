import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { requireAuth, requireRole } from '../auth/rbac';
import { ticketService } from '../services/ticket.service';

export const supportRouter = Router();

// Enforce SUPPORT or ADMIN role
supportRouter.use(requireAuth, requireRole(['SUPPORT', 'ADMIN']));

// GET /api/support/tickets
supportRouter.get('/tickets', async (_req: Request, res: Response) => {
  try {
    const tickets = await ticketService.getAllTickets();
    return res.status(200).json({ success: true, data: tickets });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch tickets';
    return res.status(500).json({ success: false, error: msg });
  }
});

// PATCH /api/support/tickets/:id/status
supportRouter.patch('/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const ticket = await ticketService.updateStatus(req.params.id, status);
    return res.status(200).json({ success: true, data: ticket, message: `Ticket marked as ${status}.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update ticket';
    return res.status(400).json({ success: false, error: msg });
  }
});

// GET /api/support/conversations
supportRouter.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const convs = await db.getAllConversations();
    return res.status(200).json({ success: true, data: convs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch conversations';
    return res.status(500).json({ success: false, error: msg });
  }
});
