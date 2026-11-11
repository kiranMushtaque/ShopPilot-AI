import React from 'react';
import { X, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface ProductCompareModalProps {
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onClearAll: () => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  products,
  onClose,
  onRemove,
  onAddToCart,
  onClearAll,
}) => {
  if (products.length === 0) return null;

  return (
    <div id="product-compare-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-lg font-bold text-white">Compare Products ({products.length})</h2>
            <p className="text-xs text-neutral-400">Side-by-side specifications, prices, and stock comparison</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Comparison Table */}
        <div className="overflow-x-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[700px]">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-900 text-emerald-400 border border-neutral-800">
                      {product.brand}
                    </span>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1"
                      title="Remove from comparison"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="aspect-square bg-neutral-900 rounded-xl p-3 mb-3 flex items-center justify-center">
                    <img src={product.imageUrl} alt={product.name} className="max-h-32 object-contain" />
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-2 mb-2">{product.name}</h3>

                  <div className="text-base font-black text-emerald-400 mb-2">
                    Rs. {product.pricePkr.toLocaleString()}
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-4">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{product.rating} ({product.reviewCount})</span>
                  </div>

                  {/* Specs List */}
                  <div className="space-y-1.5 border-t border-neutral-800/80 pt-3 text-xs mb-4">
                    <div className="text-[11px] font-semibold text-neutral-400">Specifications:</div>
                    {product.specs &&
                      Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-[11px]">
                          <span className="text-neutral-500 capitalize">{key}:</span>
                          <span className="text-neutral-300 font-medium">{String(val)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-neutral-500">Warranty:</span>
                      <span className="text-emerald-400">{product.warrantyInfo || 'Official'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
