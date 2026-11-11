import React, { useState } from 'react';
import { X, Truck, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Cart, Order, User } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  currentUser: User | null;
  onOrderCompleted: (order: Order) => void;
}

const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  currentUser,
  onOrderCompleted,
}) => {
  const [fullName, setFullName] = useState(currentUser?.name || 'Hamza Tariq');
  const [email, setEmail] = useState(currentUser?.email || 'customer@shoppilot.pk');
  const [phone, setPhone] = useState(currentUser?.phone || '03335554433');
  const [city, setCity] = useState('Lahore');
  const [addressLine, setAddressLine] = useState('House 42, Street 8, Sector Y, DHA Phase 3');
  const [notes, setNotes] = useState('Please call before delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !cart) return null;

  const totalAmount = cart.totalPkr;
  const isFreeShipping = totalAmount >= 15000;
  const shippingFee = isFreeShipping ? 0 : 250;
  const grandTotal = totalAmount + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
          addressLine,
          city,
          province: 'Punjab',
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      onOrderCompleted(data.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Checkout encountered an error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="checkout-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Cash on Delivery Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Shipping Details */}
          <div className="space-y-3.5">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Shipping & Recipient Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Mobile Phone (03XX-XXXXXXX) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Complete Street Address *</label>
              <textarea
                required
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Special Delivery Instructions (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Method: Cash on Delivery (COD)</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              You will pay cash directly to the courier rider upon physical inspection & delivery of your parcel.
            </p>
          </div>

          {/* Order Financials */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Items Total ({cart.itemCount} units)</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Courier Delivery (Pakistan)</span>
              <span>{isFreeShipping ? 'FREE' : `Rs. ${shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-neutral-800">
              <span>Grand Total</span>
              <span className="text-emerald-400">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="confirm-place-order-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying & Securing Inventory...' : `Confirm & Place Order (Rs. ${grandTotal.toLocaleString()})`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
