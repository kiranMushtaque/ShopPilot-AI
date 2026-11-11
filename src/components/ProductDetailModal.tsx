import React from 'react';
import { X, ShoppingCart, Star, CheckCircle2, AlertCircle, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div id="product-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="flex flex-col items-center justify-center bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-72 object-contain"
              />
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">{product.brand}</span>
                <span>•</span>
                <span>PTA Approved / Official Pakistan Stock</span>
              </div>
            </div>

            {/* Product Meta */}
            <div className="flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold text-neutral-200">{product.rating}</span>
                    <span className="text-neutral-500">({product.reviewCount} customer reviews)</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3">
                  {product.name}
                </h2>

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    Rs. {product.pricePkr.toLocaleString()}
                  </span>
                  {product.compareAtPricePkr && (
                    <span className="text-sm text-neutral-500 line-through">
                      Rs. {product.compareAtPricePkr.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Specs Table */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 mb-6">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Technical Specifications
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-neutral-500 capitalize">{key}:</span>
                          <span className="font-semibold text-neutral-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{product.warrantyInfo || 'Official Warranty'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2-3 Days Nationwide Delivery</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-4">
                <div>
                  {isOutOfStock ? (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Currently Out of Stock</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{product.stockQuantity} units available</span>
                    </span>
                  )}
                </div>

                <button
                  id="modal-add-to-cart-btn"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className={`px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-lg transition-all ${
                    isOutOfStock
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-950/50 active:scale-95'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart (Rs. {product.pricePkr.toLocaleString()})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
