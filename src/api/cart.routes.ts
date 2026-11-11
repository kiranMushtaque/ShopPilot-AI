import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { cartService } from '../services/cart.service';

export const cartRouter = Router();

function getSessionToken(req: Request): string {
  return req.sessionToken || (req.headers['x-session-token'] as string) || 'guest-session-default';
}

const AddItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

const UpdateItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0),
});

// GET /api/cart
cartRouter.get('/', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const cart = await cartService.getCart(token, req.userSession?.userId);
    return res.status(200).json({ success: true, data: cart });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch cart';
    return res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/cart/items
cartRouter.post('/items', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const parsed = AddItemSchema.parse(req.body);
    const cart = await cartService.addItem(token, parsed.productId, parsed.quantity, req.userSession?.userId);
    return res.status(200).json({ success: true, data: cart, message: 'Item added to cart.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add item to cart';
    return res.status(400).json({ success: false, error: msg });
  }
});

// PATCH /api/cart/items
cartRouter.patch('/items', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const parsed = UpdateItemSchema.parse(req.body);
    const cart = await cartService.updateItemQuantity(token, parsed.productId, parsed.quantity);
    return res.status(200).json({ success: true, data: cart });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update item';
    return res.status(400).json({ success: false, error: msg });
  }
});

// DELETE /api/cart/items/:id
cartRouter.delete('/items/:productId', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const cart = await cartService.removeItem(token, req.params.productId);
    return res.status(200).json({ success: true, data: cart, message: 'Item removed from cart.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove item';
    return res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/cart/clear
cartRouter.post('/clear', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    await cartService.clearCart(token);
    return res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear cart';
    return res.status(500).json({ success: false, error: msg });
  }
});
