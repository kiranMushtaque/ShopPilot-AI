import { db } from '../db/store';
import { Product, Category } from '../types';

export class ProductService {
  public async getProducts(params: {
    categorySlug?: string;
    categoryId?: string;
    search?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    return db.getProducts(params);
  }

  public async getProductById(id: string): Promise<Product | null> {
    return db.getProductById(id);
  }

  public async getProductBySlug(slug: string): Promise<Product | null> {
    return db.getProductBySlug(slug);
  }

  public async getCategories(): Promise<Category[]> {
    return db.getCategories();
  }

  public async checkInventory(productId: string): Promise<{ inStock: boolean; availableQuantity: number; product: Product | null }> {
    const product = await db.getProductById(productId);
    if (!product || !product.isActive) {
      return { inStock: false, availableQuantity: 0, product: null };
    }
    return {
      inStock: product.stockQuantity > 0,
      availableQuantity: product.stockQuantity,
      product,
    };
  }

  public async compareProducts(productIds: string[]): Promise<Product[]> {
    const products: Product[] = [];
    for (const id of productIds.slice(0, 4)) {
      const p = await db.getProductById(id);
      if (p && p.isActive) {
        products.push(p);
      }
    }
    return products;
  }

  public async saveProduct(data: Partial<Product>): Promise<Product> {
    return db.saveProduct(data);
  }

  public async adjustInventory(productId: string, newStock: number, actorName = 'Admin'): Promise<Product> {
    return db.updateInventory(productId, newStock, actorName);
  }
}

export const productService = new ProductService();
