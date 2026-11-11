import React from 'react';
import { ShoppingCart, Star, Eye, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleCompare: (product: Product) => void;
  isCompared?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  onToggleCompare,
  isCompared = false,
}) => {
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const discountPercent = product.compareAtPricePkr
    ? Math.round(((product.compareAtPricePkr - product.pricePkr) / product.compareAtPricePkr) * 100)
    : 0;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all duration-200 flex flex-col justify-between shadow-lg"
    >
      {/* Image and Badges */}
      <div className="relative aspect-square bg-neutral-950 overflow-hidden flex items-center justify-center p-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold text-[10px] tracking-wider uppercase">
              {discountPercent}% OFF
            </span>
          )}
          {product.brand && (
            <span className="px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 text-[10px] font-semibold">
              {product.brand}
            </span>
          )}
        </div>

        {/* Quick View & Compare Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <button
            onClick={() => onQuickView(product)}
            className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Details</span>
          </button>
          <button
            onClick={() => onToggleCompare(product)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 border ${
              isCompared
                ? 'bg-emerald-500 text-neutral-950 border-emerald-400'
                : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
            }`}
            title="Compare Specs"
          >
            <Scale className="w-4 h-4" />
            <span>{isCompared ? 'Added' : 'Compare'}</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 text-amber-400 text-xs mb-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-bold text-neutral-200">{product.rating}</span>
            <span className="text-neutral-500">({product.reviewCount})</span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onQuickView(product)}
            className="text-sm font-bold text-neutral-100 line-clamp-2 hover:text-emerald-400 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          {/* Key Specs tags */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(product.specs)
                .slice(0, 2)
                .map(([key, val]) => (
                  <span
                    key={key}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 truncate max-w-[140px]"
                  >
                    {String(val)}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Price and Stock Status */}
        <div className="pt-2 border-t border-neutral-800/80">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-black text-white">
              Rs. {product.pricePkr.toLocaleString()}
            </span>
            {product.compareAtPricePkr && (
              <span className="text-xs text-neutral-500 line-through">
                Rs. {product.compareAtPricePkr.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center justify-between text-[11px] mb-3">
            {isOutOfStock ? (
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </span>
            ) : isLowStock ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Only {product.stockQuantity} left!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock ({product.stockQuantity})</span>
              </span>
            )}
            <span className="text-neutral-400">{product.warrantyInfo || 'Official Warranty'}</span>
          </div>

          {/* Add to Cart Button */}
          <button
            id={`add-to-cart-${product.id}`}
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isOutOfStock
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-950/40'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
