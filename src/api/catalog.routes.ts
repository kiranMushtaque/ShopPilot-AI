import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service';

export const catalogRouter = Router();

// GET /api/products
catalogRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { category, search, brand, minPrice, maxPrice, inStock, sort, limit, offset } = req.query;

    const result = await productService.getProducts({
      categorySlug: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      brand: brand ? String(brand) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStockOnly: inStock === 'true',
      sortBy: sort as 'price_asc' | 'price_desc' | 'rating' | 'newest',
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch products';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/products/:id
catalogRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch product';
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/categories
catalogRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await productService.getCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
    return res.status(500).json({ success: false, error: msg });
  }
});
