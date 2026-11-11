import React, { useState } from 'react';
import { Package, Search, CheckCircle2, Clock, Truck, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  onBackToShopping: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber = '',
  onBackToShopping,
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phoneOrEmail, setPhoneOrEmail] = useState('03335554433');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber || !phoneOrEmail) {
      setErrorMsg('Please enter both Order Number and phone/email.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phoneOrEmail: phoneOrEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Order tracking lookup failed.');
      }

      setTrackedOrder(data.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Order tracking failed.');
      setTrackedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = trackedOrder ? getStatusStepIndex(trackedOrder.status) : 0;
  const steps = [
    { label: 'Order Placed', desc: 'Received in system' },
    { label: 'Confirmed', desc: 'Inventory allocated' },
    { label: 'Processing', desc: 'Packed in warehouse' },
    { label: 'Shipped', desc: 'Dispatched with rider' },
    { label: 'Delivered', desc: 'Completed with COD' },
  ];

  return (
    <div id="order-tracking-page" className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={onBackToShopping}
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </button>

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Package className="w-7 h-7 text-emerald-400" />
          <span>Live Order Tracking</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Enter your order number and contact information to check live dispatch and courier status.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Order Number *</label>
            <input
              type="text"
              placeholder="e.g. SP-10001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white uppercase placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone or Email *</label>
            <input
              type="text"
              placeholder="e.g. 03335554433 or email"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              id="submit-track-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {trackedOrder && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl space-y-6 p-6 animate-in fade-in">
          {/* Top Status Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">Order #{trackedOrder.orderNumber}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  {trackedOrder.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Placed on {new Date(trackedOrder.createdAt).toLocaleDateString()} • Cash on Delivery
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-neutral-400">Total Payable Amount</div>
              <div className="text-xl font-black text-emerald-400">
                Rs. {trackedOrder.totalAmountPkr.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="py-4">
            <div className="grid grid-cols-5 gap-2 relative">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={step.label} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all mb-2 ${
                        isPassed
                          ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30'
                          : 'bg-neutral-950 text-neutral-600 border border-neutral-800'
                      } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div className="text-xs font-bold text-neutral-200">{step.label}</div>
                    <div className="text-[10px] text-neutral-500 leading-tight hidden sm:block mt-0.5">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Items Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
            {/* Courier & Destination */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Courier & Destination</span>
              </div>
              <div className="text-neutral-300">
                <span className="text-neutral-500">Tracking Code: </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {trackedOrder.trackingCode || 'Pending Assignment'}
                </span>
              </div>
              <div className="text-neutral-300">
                <span className="text-neutral-500">Recipient: </span>
                <span>{trackedOrder.shippingAddress.fullName}</span>
              </div>
              <div className="text-neutral-300">
                <span className="text-neutral-500">Destination: </span>
                <span>{trackedOrder.shippingAddress.addressLine}, {trackedOrder.shippingAddress.city}</span>
              </div>
            </div>

            {/* Items Ordered */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Order Items ({trackedOrder.items.length})
              </div>
              <div className="space-y-1.5 divide-y divide-neutral-900">
                {trackedOrder.items.map((it) => (
                  <div key={it.id} className="pt-1.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-neutral-200 font-medium">{it.productName}</span>
                      <span className="text-neutral-500 ml-1.5">x{it.quantity}</span>
                    </div>
                    <span className="font-bold text-neutral-200">
                      Rs. {it.totalPricePkr.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
