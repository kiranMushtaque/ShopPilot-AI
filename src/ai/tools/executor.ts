import { productService } from '../../services/product.service';
import { cartService } from '../../services/cart.service';
import { orderService } from '../../services/order.service';
import { knowledgeService } from '../../services/knowledge.service';
import { ticketService } from '../../services/ticket.service';
import { UserRole, Product } from '../../types';
import {
  SearchProductsSchema,
  GetProductSchema,
  CheckInventorySchema,
  CompareProductsSchema,
  CartActionSchema,
  TrackOrderSchema,
  SearchKnowledgeSchema,
  EscalateToHumanSchema,
  AdminInventorySchema,
  AdminOrderStatusSchema,
} from './definitions';

export interface ToolExecutionContext {
  sessionToken: string;
  userId?: string;
  userRole?: UserRole;
  customerName?: string;
  conversationId?: string;
}

export interface ToolResult {
  toolName: string;
  status: 'SUCCESS' | 'FAILED';
  data?: unknown;
  suggestedProducts?: Product[];
  error?: string;
  message: string;
}

export class ToolExecutor {
  public static async execute(
    toolName: string,
    args: Record<string, unknown>,
    ctx: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      switch (toolName) {
        // 1. PRODUCT SEARCH
        case 'search_products': {
          const parsed = SearchProductsSchema.parse(args);
          const res = await productService.getProducts({
            search: parsed.query,
            categoryId: parsed.categoryId,
            brand: parsed.brand,
            minPrice: parsed.minPrice,
            maxPrice: parsed.maxPrice,
            limit: parsed.limit,
          });

          return {
            toolName,
            status: 'SUCCESS',
            data: res.products,
            suggestedProducts: res.products,
            message: `Found ${res.products.length} products matching criteria.`,
          };
        }

        // 2. GET PRODUCT DETAILS
        case 'get_product': {
          const parsed = GetProductSchema.parse(args);
          const product = await productService.getProductById(parsed.productId);
          if (!product) {
            return { toolName, status: 'FAILED', error: 'Product not found', message: 'Product not found in database.' };
          }
          return {
            toolName,
            status: 'SUCCESS',
            data: product,
            suggestedProducts: [product],
            message: `Retrieved details for ${product.name}.`,
          };
        }

        // 3. CHECK INVENTORY
        case 'check_inventory': {
          const parsed = CheckInventorySchema.parse(args);
          const inv = await productService.checkInventory(parsed.productId);
          if (!inv.product) {
            return { toolName, status: 'FAILED', error: 'Product not found', message: 'Product was not found.' };
          }
          return {
            toolName,
            status: 'SUCCESS',
            data: inv,
            suggestedProducts: inv.product ? [inv.product] : [],
            message: `${inv.product.name} currently has ${inv.availableQuantity} units available in stock.`,
          };
        }

        // 4. COMPARE PRODUCTS
        case 'compare_products': {
          const parsed = CompareProductsSchema.parse(args);
          const products = await productService.compareProducts(parsed.productIds);
          return {
            toolName,
            status: 'SUCCESS',
            data: products,
            suggestedProducts: products,
            message: `Compared ${products.length} products.`,
          };
        }

        // 5. GET CART
        case 'get_cart': {
          const cart = await cartService.getCart(ctx.sessionToken, ctx.userId);
          return {
            toolName,
            status: 'SUCCESS',
            data: cart,
            message: `Cart currently has ${cart.itemCount} items with total Rs. ${cart.totalPkr.toLocaleString()}.`,
          };
        }

        // 6. ADD TO CART
        case 'add_to_cart': {
          const parsed = CartActionSchema.parse(args);
          const cart = await cartService.addItem(ctx.sessionToken, parsed.productId, parsed.quantity, ctx.userId);
          const addedItem = cart.items.find((i) => i.productId === parsed.productId);
          return {
            toolName,
            status: 'SUCCESS',
            data: cart,
            suggestedProducts: addedItem?.product ? [addedItem.product] : [],
            message: `Successfully added ${addedItem?.product.name || 'item'} to cart. Cart total: Rs. ${cart.totalPkr.toLocaleString()}.`,
          };
        }

        // 7. TRACK ORDER
        case 'get_order_status': {
          const parsed = TrackOrderSchema.parse(args);
          const order = await orderService.trackOrderByNumberAndContact(
            parsed.orderNumber,
            parsed.phoneOrEmail || ''
          );

          if (!order) {
            // Check if user is authenticated and order belongs to them
            if (ctx.userId) {
              const directOrder = await orderService.getOrderById(parsed.orderNumber, ctx.userId);
              if (directOrder) {
                return {
                  toolName,
                  status: 'SUCCESS',
                  data: directOrder,
                  message: `Order #${directOrder.orderNumber} status: ${directOrder.status}. Total: Rs. ${directOrder.totalAmountPkr.toLocaleString()}.`,
                };
              }
            }

            return {
              toolName,
              status: 'FAILED',
              error: 'Order verification failed.',
              message: 'Order number was not found or phone/email did not match our records.',
            };
          }

          return {
            toolName,
            status: 'SUCCESS',
            data: order,
            message: `Order #${order.orderNumber} is currently ${order.status}. Tracking code: ${order.trackingCode || 'Pending courier assignment'}.`,
          };
        }

        // 8. SEARCH KNOWLEDGE BASE (RAG)
        case 'search_knowledge_base': {
          const parsed = SearchKnowledgeSchema.parse(args);
          const chunks = await knowledgeService.searchKnowledge(parsed.query);
          return {
            toolName,
            status: 'SUCCESS',
            data: chunks,
            message: chunks.length > 0 ? chunks.map((c) => c.chunkText).join('\n\n') : 'No verified policy document matches this query.',
          };
        }

        // 9. HUMAN ESCALATION
        case 'escalate_to_human': {
          const parsed = EscalateToHumanSchema.parse(args);
          const ticket = await ticketService.createTicket({
            customerName: ctx.customerName || 'Customer',
            customerPhone: parsed.customerPhone,
            subject: 'AI Support Escalation Request',
            reason: parsed.reason,
            conversationId: ctx.conversationId,
            userId: ctx.userId,
            transcriptSnippet: parsed.customerSummary,
          });

          return {
            toolName,
            status: 'SUCCESS',
            data: ticket,
            message: `Created support ticket #${ticket.ticketNumber}. A human support representative has been notified and will take over this conversation shortly.`,
          };
        }

        // 10. ADMIN MUTATIONS (RBAC ENFORCED)
        case 'admin_adjust_inventory': {
          if (ctx.userRole !== 'ADMIN') {
            return { toolName, status: 'FAILED', error: 'Forbidden: Admin only', message: 'You do not have permission to adjust inventory.' };
          }
          const parsed = AdminInventorySchema.parse(args);
          const prod = await productService.adjustInventory(parsed.productId, parsed.newStock, ctx.customerName || 'Admin');
          return {
            toolName,
            status: 'SUCCESS',
            data: prod,
            message: `Updated stock for ${prod.name} to ${prod.stockQuantity}.`,
          };
        }

        default:
          return {
            toolName,
            status: 'FAILED',
            error: `Unknown tool: ${toolName}`,
            message: `Tool ${toolName} does not exist.`,
          };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        toolName,
        status: 'FAILED',
        error: msg,
        message: `Execution failed: ${msg}`,
      };
    }
  }
}
