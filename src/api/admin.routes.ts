import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store';
import { requireAuth, requireRole } from '../auth/rbac';
import { productService } from '../services/product.service';
import { orderService } from '../services/order.service';
import { analyticsService } from '../services/analytics.service';
import { OrderStatus } from '../types';

export const adminRouter = Router();

// Enforce ADMIN role on all admin routes
adminRouter.use(requireAuth, requireRole(['ADMIN']));

// GET /api/admin/dashboard
adminRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    const recentOrders = (await orderService.getAllOrders()).slice(0, 5);
    const auditLogs = (await analyticsService.getAuditLogs()).slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        metrics,
        recentOrders,
        auditLogs,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/admin/products
adminRouter.get('/products', async (_req: Request, res: Response) => {
  try {
    const result = await productService.getProducts({ limit: 100 });
    return res.status(200).json({ success: true, data: result.products });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load products';
    return res.status(500).json({ success: false, error: msg });
  }
});

const SaveProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  brand: z.string().min(1),
  categoryId: z.string().optional(),
  pricePkr: z.number().min(0),
  compareAtPricePkr: z.number().optional(),
  stockQuantity: z.number().int().min(0),
  description: z.string(),
  imageUrl: z.string().optional(),
});

// POST /api/admin/products
adminRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const parsed = SaveProductSchema.parse(req.body);
    const prod = await productService.saveProduct(parsed);
    return res.status(200).json({ success: true, data: prod, message: 'Product saved successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save product';
    return res.status(400).json({ success: false, error: msg });
  }
});

// PATCH /api/admin/inventory
adminRouter.patch('/inventory', async (req: Request, res: Response) => {
  try {
    const { productId, newStock } = req.body;
    if (!productId || newStock === undefined) {
      return res.status(400).json({ success: false, error: 'Product ID and new stock are required' });
    }
    const updated = await productService.adjustInventory(
      String(productId),
      Number(newStock),
      req.userSession?.name || 'Admin'
    );
    return res.status(200).json({ success: true, data: updated, message: 'Inventory updated.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update inventory';
    return res.status(400).json({ success: false, error: msg });
  }
});

// GET /api/admin/orders
adminRouter.get('/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    return res.status(200).json({ success: true, data: orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
    return res.status(500).json({ success: false, error: msg });
  }
});

// PATCH /api/admin/orders/:id/status
adminRouter.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await orderService.updateOrderStatus(
      req.params.id,
      status as OrderStatus,
      req.userSession?.name || 'Admin'
    );
    return res.status(200).json({ success: true, data: updated, message: `Order updated to ${status}.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update order status';
    return res.status(400).json({ success: false, error: msg });
  }
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', async (_req: Request, res: Response) => {
  try {
    const logs = await analyticsService.getAuditLogs();
    return res.status(200).json({ success: true, data: logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch audit logs';
    return res.status(500).json({ success: false, error: msg });
  }
});
