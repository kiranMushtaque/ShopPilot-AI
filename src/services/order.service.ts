import { db } from '../db/store';
import { Order, OrderStatus, ShippingAddress } from '../types';

export class OrderService {
  public async createOrder(params: {
    sessionToken: string;
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: ShippingAddress;
    notes?: string;
    actorType?: 'CUSTOMER' | 'AI_AGENT';
  }): Promise<Order> {
    // Transactional creation with row-level stock locks and authoritative DB pricing
    return db.createOrderTransactional(params);
  }

  public async getOrderById(orderId: string, userId?: string, isAdminOrSupport = false): Promise<Order | null> {
    const order = await db.getOrderById(orderId);
    if (!order) return null;

    if (isAdminOrSupport) {
      return order;
    }

    if (userId && order.userId === userId) {
      return order;
    }

    return null;
  }

  // Multi-Factor verification for guest / customer tracking
  public async trackOrderByNumberAndContact(orderNumber: string, phoneOrEmail: string): Promise<Order | null> {
    return db.verifyAndGetGuestOrder(orderNumber, phoneOrEmail);
  }

  public async getCustomerOrders(userId: string): Promise<Order[]> {
    return db.getCustomerOrders(userId);
  }

  public async getAllOrders(): Promise<Order[]> {
    return db.getAllOrders();
  }

  public async updateOrderStatus(orderId: string, newStatus: OrderStatus, actorName = 'Admin'): Promise<Order> {
    return db.updateOrderStatus(orderId, newStatus, actorName);
  }
}

export const orderService = new OrderService();
