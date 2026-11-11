import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit2,
  X,
  History,
  CheckCircle2,
} from 'lucide-react';
import { Product, Order, AuditLog, OrderStatus } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<{
    totalRevenuePkr: number;
    totalOrders: number;
    totalProducts: number;
    lowStockCount: number;
  } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'products' | 'orders' | 'logs'>('metrics');
  const [loading, setLoading] = useState(true);

  // Edit stock state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, ordRes, logsRes] = await Promise.all([
        fetch('/api/admin/dashboard').then((r) => r.json()),
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/orders').then((r) => r.json()),
        fetch('/api/admin/audit-logs').then((r) => r.json()),
      ]);

      if (dashRes.success) setMetrics(dashRes.data.metrics);
      if (prodRes.success) setProducts(prodRes.data);
      if (ordRes.success) setOrders(ordRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch {
      // Error fetching admin data
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string) => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newStock: newStockVal }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingStockId(null);
        loadData();
      }
    } catch {
      // Error updating stock
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch {
      // Error updating status
    }
  };

  return (
    <div id="admin-dashboard-page" className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 text-white p-4 sm:p-6 lg:p-8 animate-in fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">ShopPilot Store Administrator</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800/40">
                  Role: ADMIN
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Server-Authoritative Catalog, Inventory Locks, Order Fulfillment & Audit Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-neutral-800 pb-3">
          {[
            { id: 'metrics', label: 'Metrics Overview' },
            { id: 'products', label: `Inventory & Products (${products.length})` },
            { id: 'orders', label: `Orders & Fulfillment (${orders.length})` },
            { id: 'logs', label: `Security & Audit Logs (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* METRICS TAB */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
                  <span>Gross Sales Volume</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  Rs. {metrics.totalRevenuePkr.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 font-medium">Cash on Delivery Orders</div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
                  <span>Total Orders</span>
                  <ShoppingCart className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{metrics.totalOrders}</div>
                <div className="text-[11px] text-neutral-400 mt-1 font-medium">Nationwide Deliveries</div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
                  <span>Active SKUs</span>
                  <Package className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">{metrics.totalProducts}</div>
                <div className="text-[11px] text-neutral-400 mt-1 font-medium">Catalog Items</div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold mb-2">
                  <span>Low Stock Warnings</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{metrics.lowStockCount}</div>
                <div className="text-[11px] text-neutral-400 mt-1 font-medium">Items &lt; 5 units</div>
              </div>
            </div>

            {/* Recent Orders in Metrics */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
              <div className="divide-y divide-neutral-800">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-emerald-400 mr-2">#{ord.orderNumber}</span>
                      <span className="text-neutral-300">{ord.shippingAddress.fullName} ({ord.shippingAddress.city})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">Rs. {ord.totalAmountPkr.toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-950 border border-neutral-800 text-emerald-400">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS & INVENTORY TAB */}
        {activeTab === 'products' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Price (PKR)</th>
                    <th className="p-4">Stock Quantity</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-950/40">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg bg-neutral-950 object-contain p-1 border border-neutral-800" />
                        <div>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">ID: {p.id}</div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-neutral-300">{p.brand}</td>
                      <td className="p-4 font-black text-emerald-400">Rs. {p.pricePkr.toLocaleString()}</td>
                      <td className="p-4">
                        {editingStockId === p.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={newStockVal}
                              onChange={(e) => setNewStockVal(Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                            />
                            <button
                              onClick={() => handleUpdateStock(p.id)}
                              className="px-2 py-1 rounded bg-emerald-500 text-neutral-950 font-bold text-[10px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="px-2 py-1 rounded bg-neutral-800 text-neutral-400 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`font-bold ${
                              p.stockQuantity <= 0
                                ? 'text-rose-400'
                                : p.stockQuantity <= 5
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {p.stockQuantity} units
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setEditingStockId(p.id);
                            setNewStockVal(p.stockQuantity);
                          }}
                          className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS & FULFILLMENT TAB */}
        {activeTab === 'orders' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer & City</th>
                    <th className="p-4">Total (PKR)</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-950/40">
                      <td className="p-4 font-mono font-bold text-emerald-400">#{ord.orderNumber}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{ord.shippingAddress.fullName}</div>
                        <div className="text-neutral-500 text-[10px]">{ord.shippingAddress.phone} • {ord.shippingAddress.city}</div>
                      </td>
                      <td className="p-4 font-black text-white">Rs. {ord.totalAmountPkr.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-950 text-emerald-400 border border-emerald-800/40">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECURITY & AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Immutable System Audit Ledger</span>
            </div>

            <div className="divide-y divide-neutral-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex justify-between items-start text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{log.action}</span>
                      <span className="text-neutral-500 text-[10px]">by {log.actorName || log.actorType}</span>
                    </div>
                    <p className="text-neutral-300 mt-1 font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </p>
                  </div>
                  <span className="text-neutral-500 text-[10px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
