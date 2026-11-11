import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service';
import { requireAuth } from '../auth/rbac';
import { guestOrderLookupRateLimit } from '../middleware/rate-limit';

export const orderRouter = Router();

function getSessionToken(req: Request): string {
  return req.sessionToken || (req.headers['x-session-token'] as string) || 'guest-session-default';
}

const CheckoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/checkout (Transactional Checkout)
orderRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    const parsed = CheckoutSchema.parse(req.body);

    const order = await orderService.createOrder({
      sessionToken: token,
      userId: req.userSession?.userId,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone,
      shippingAddress: {
        fullName: parsed.customerName,
        phone: parsed.customerPhone,
        email: parsed.customerEmail,
        addressLine: parsed.addressLine,
        city: parsed.city,
        province: parsed.province,
        postalCode: parsed.postalCode,
      },
      notes: parsed.notes,
      actorType: req.userSession?.role === 'CUSTOMER' ? 'CUSTOMER' : 'CUSTOMER',
    });

    return res.status(201).json({
      success: true,
      data: order,
      message: `Order #${order.orderNumber} placed successfully with Cash on Delivery Demo.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed';
    return res.status(400).json({ success: false, error: msg });
  }
});

// POST /api/orders/track (Rate-Limited Multi-Factor Guest/Customer Order Tracking)
orderRouter.post('/track', guestOrderLookupRateLimit, async (req: Request, res: Response) => {
  try {
    const { orderNumber, phoneOrEmail } = req.body;
    if (!orderNumber || !phoneOrEmail) {
      return res.status(400).json({
        success: false,
        error: 'Both Order Number (e.g. SP-10001) and registered Phone or Email are required for tracking.',
      });
    }

    const order = await orderService.trackOrderByNumberAndContact(String(orderNumber), String(phoneOrEmail));
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'No matching order found with the provided details. Please verify your order number and contact information.',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Tracking failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/orders/my-orders (Authenticated Customer Order History)
orderRouter.get('/my-orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getCustomerOrders(req.userSession!.userId);
    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
    return res.status(500).json({ success: false, error: msg });
  }
});
