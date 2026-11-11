import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { Cart } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const items = cart?.items || [];
  const totalAmount = cart?.totalPkr || 0;
  const freeShippingThreshold = 15000;
  const isFreeShipping = totalAmount >= freeShippingThreshold;
  const remainingForFreeShipping = freeShippingThreshold - totalAmount;

  return (
    <div id="cart-drawer-container" className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Your Shopping Cart ({cart?.itemCount || 0})</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Goal Progress */}
          <div className="bg-emerald-950/40 border-b border-emerald-800/30 p-3 text-xs">
            {isFreeShipping ? (
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>You qualify for FREE Nationwide Delivery! 🎉</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-300">
                  <span>Add <b>Rs. {remainingForFreeShipping.toLocaleString()}</b> for FREE delivery</span>
                  <span>{Math.round((totalAmount / freeShippingThreshold) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalAmount / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-800/60">
            {items.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-neutral-600 mb-3" />
                <p className="font-semibold text-neutral-300">Your cart is empty</p>
                <p className="text-xs text-neutral-500 mt-1">Browse our electronics catalog or ask our AI assistant!</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-3.5 items-center">
                  <img
                    src={item.product?.imageUrl}
                    alt={item.product?.name}
                    className="w-16 h-16 rounded-xl bg-neutral-950 object-contain p-2 border border-neutral-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.product?.name}</h4>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">
                      Rs. {item.unitPricePkr.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2.5 mt-2">
                      <div className="flex items-center border border-neutral-700 rounded-lg bg-neutral-950">
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-neutral-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-neutral-200">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-neutral-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-neutral-800 bg-neutral-950 space-y-4">
              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">Rs. {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery (Pakistan)</span>
                  <span className="font-semibold text-emerald-400">
                    {isFreeShipping ? 'FREE' : 'Rs. 250'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">
                    Rs. {(totalAmount + (isFreeShipping ? 0 : 250)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                id="drawer-proceed-checkout-btn"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cash on Delivery Demo • Server-Authoritative Pricing</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
