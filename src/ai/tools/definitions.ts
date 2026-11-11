import { z } from 'zod';

export const SearchProductsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  limit: z.number().default(4),
});

export const GetProductSchema = z.object({
  productId: z.string(),
});

export const CheckInventorySchema = z.object({
  productId: z.string(),
});

export const CompareProductsSchema = z.object({
  productIds: z.array(z.string()).min(2).max(4),
});

export const CartActionSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).default(1),
});

export const TrackOrderSchema = z.object({
  orderNumber: z.string(),
  phoneOrEmail: z.string().optional(),
});

export const SearchKnowledgeSchema = z.object({
  query: z.string(),
});

export const EscalateToHumanSchema = z.object({
  reason: z.string(),
  customerSummary: z.string(),
  customerPhone: z.string().optional(),
});

export const AdminInventorySchema = z.object({
  productId: z.string(),
  newStock: z.number().min(0),
});

export const AdminOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
});
