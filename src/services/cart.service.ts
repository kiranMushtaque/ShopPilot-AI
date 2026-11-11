import { db } from '../db/store';
import { Cart } from '../types';

export class CartService {
  public async getCart(sessionToken: string, userId?: string): Promise<Cart> {
    return db.getOrCreateCart(sessionToken, userId);
  }

  public async addItem(sessionToken: string, productId: string, quantity: number, userId?: string): Promise<Cart> {
    return db.addToCart(sessionToken, productId, quantity, userId);
  }

  public async updateItemQuantity(sessionToken: string, productId: string, quantity: number): Promise<Cart> {
    return db.updateCartItemQuantity(sessionToken, productId, quantity);
  }

  public async removeItem(sessionToken: string, productId: string): Promise<Cart> {
    return db.removeFromCart(sessionToken, productId);
  }

  public async clearCart(sessionToken: string): Promise<void> {
    return db.clearCart(sessionToken);
  }
}

export const cartService = new CartService();
