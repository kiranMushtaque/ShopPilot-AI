import React from 'react';
import { CheckCircle2, Package, Truck, ArrowRight, X } from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderNumber: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onTrackOrder,
}) => {
  if (!order) return null;

  return (
    <div id="order-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-black text-white mb-1">Order Placed Successfully!</h2>
        <p className="text-xs text-neutral-400 mb-5">
          Thank you for shopping with ShopPilot PK. Your parcel is being packed.
        </p>

        {/* Receipt Box */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-left space-y-3 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">Order Number:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{order.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">Total Amount (COD):</span>
            <span className="font-bold text-white">Rs. {order.totalAmountPkr.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">Recipient:</span>
            <span className="text-neutral-300 font-medium">{order.shippingAddress.fullName}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">Delivery City:</span>
            <span className="text-neutral-300 font-medium">{order.shippingAddress.city}</span>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-400">
            <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Estimated Courier Arrival: 2 to 3 Business Days</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onTrackOrder(order.orderNumber);
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>Live Track Order #{order.orderNumber}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-neutral-400 hover:text-white font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
