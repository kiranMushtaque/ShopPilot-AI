import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { knowledgeService } from '../services/knowledge.service';
import { requireAuth, requireRole } from '../auth/rbac';

export const knowledgeRouter = Router();

// GET /api/knowledge/search (Public/Customer RAG Search)
knowledgeRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const results = await knowledgeService.searchKnowledge(q);
    return res.status(200).json({ success: true, data: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Knowledge search failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/knowledge/documents (Admin list)
knowledgeRouter.get('/documents', requireAuth, requireRole(['ADMIN']), async (_req: Request, res: Response) => {
  try {
    const docs = await knowledgeService.getAllDocuments();
    return res.status(200).json({ success: true, data: docs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch knowledge documents';
    return res.status(500).json({ success: false, error: msg });
  }
});

const SaveDocSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  category: z.enum(['FAQ', 'SHIPPING', 'RETURN', 'WARRANTY', 'POLICY']),
  rawContent: z.string().min(10),
});

// POST /api/knowledge/documents (Admin create/edit)
knowledgeRouter.post('/documents', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const parsed = SaveDocSchema.parse(req.body);
    const doc = await knowledgeService.saveDocument(parsed);
    return res.status(200).json({ success: true, data: doc, message: 'Document saved and indexed.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save document';
    return res.status(400).json({ success: false, error: msg });
  }
});
