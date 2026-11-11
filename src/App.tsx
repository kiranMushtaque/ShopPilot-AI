import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductCompareModal } from './components/ProductCompareModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AiChatWidget } from './components/AiChatWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { SupportDesk } from './components/SupportDesk';
import { AuthModal } from './components/AuthModal';

import { Product, Category, Cart, Order, User } from './types';
import { Filter, Sparkles, Scale, AlertCircle } from 'lucide-react';

export function App() {
  // Master Store State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(250000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'newest'>('newest');

  // Modals & Drawers State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [activeView, setActiveView] = useState<'storefront' | 'tracking' | 'admin' | 'support'>('storefront');
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // AI Assistant Widget State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiPromptTrigger, setAiPromptTrigger] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch products on filter changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, selectedBrand, maxPriceFilter, inStockOnly, sortBy]);

  const fetchInitialData = async () => {
    try {
      const [catRes, meRes, cartRes] = await Promise.all([
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/auth/me').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/cart').then((r) => r.json()),
      ]);

      if (catRes.success) setCategories(catRes.data);
      if (meRes.success) setCurrentUser(meRes.data.user);
      if (cartRes.success) setCart(cartRes.data);
    } catch {
      // Offline fallback handling
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedBrand) params.append('brand', selectedBrand);
      if (maxPriceFilter < 250000) params.append('maxPrice', String(maxPriceFilter));
      if (inStockOnly) params.append('inStock', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch {
      // Products fetch error
    } finally {
      setLoadingProducts(false);
    }
  };

  // Cart Operations
  const handleAddToCart = async (product: Product, quantity = 1) => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
        setShowCartDrawer(true);
      }
    } catch {
      // Error adding to cart
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch {
      // Error updating quantity
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch {
      // Error removing item
    }
  };

  // Comparison Operations
  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 products at a time.');
        return prev;
      }
      return [...prev, product];
    });
  };

  // Auth Quick Switch
  const handleQuickLogin = async (role: 'ADMIN' | 'SUPPORT' | 'CUSTOMER') => {
    const creds = {
      ADMIN: { email: 'admin@shoppilot.pk', password: 'admin123' },
      SUPPORT: { email: 'support@shoppilot.pk', password: 'password123' },
      CUSTOMER: { email: 'customer@shoppilot.pk', password: 'password123' },
    }[role];

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data.user);
        if (role === 'ADMIN') setActiveView('admin');
        else if (role === 'SUPPORT') setActiveView('support');
        else setActiveView('storefront');
      }
    } catch {
      // Quick login failed
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setActiveView('storefront');
  };

  // Extract unique brands from all available products
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        categories={categories}
        cartCount={cart?.itemCount || 0}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setShowCartDrawer(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenTracking={() => {
          setActiveView('tracking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => setActiveView('admin')}
        onOpenSupport={() => setActiveView('support')}
        onLogout={handleLogout}
        onQuickLogin={handleQuickLogin}
      />

      {/* Main Content Area */}
      {activeView === 'tracking' ? (
        <main className="flex-1">
          <OrderTrackingView
            initialOrderNumber={trackingOrderNumber}
            onBackToShopping={() => setActiveView('storefront')}
          />
        </main>
      ) : activeView === 'admin' ? (
        <AdminDashboard onClose={() => setActiveView('storefront')} />
      ) : activeView === 'support' ? (
        <SupportDesk onClose={() => setActiveView('storefront')} />
      ) : (
        <main className="flex-1 space-y-6">
          {/* Hero Banner with Interactive AI Prompt Triggers */}
          <HeroBanner
            onAskAiPrompt={(promptText) => {
              setAiPromptTrigger(promptText);
              setIsAiChatOpen(true);
            }}
          />

          {/* Category Tabs */}
          <CategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Storefront Catalog Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Sidebar: Filter Panel */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Filter className="w-4 h-4 text-emerald-400" />
                      <span>Refine Catalog</span>
                    </div>
                    {(selectedBrand || maxPriceFilter < 250000 || inStockOnly) && (
                      <button
                        onClick={() => {
                          setSelectedBrand(null);
                          setMaxPriceFilter(250000);
                          setInStockOnly(false);
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Price Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-neutral-300">
                      <span>Max Price:</span>
                      <span className="text-emerald-400 font-black">Rs. {maxPriceFilter.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={2000}
                      max={250000}
                      step={1000}
                      value={maxPriceFilter}
                      onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-neutral-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Rs. 2k</span>
                      <span>Rs. 250k+</span>
                    </div>
                  </div>

                  {/* Stock Availability */}
                  <div className="pt-2 border-t border-neutral-800">
                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="rounded bg-neutral-950 border-neutral-700 text-emerald-500 focus:ring-0"
                      />
                      <span>In Stock Items Only</span>
                    </label>
                  </div>

                  {/* Brands */}
                  {uniqueBrands.length > 0 && (
                    <div className="pt-3 border-t border-neutral-800 space-y-2">
                      <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Brand
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        <button
                          onClick={() => setSelectedBrand(null)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedBrand === null
                              ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                              : 'text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          All Brands
                        </button>
                        {uniqueBrands.map((brand) => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selectedBrand === brand
                                ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                                : 'text-neutral-400 hover:bg-neutral-800'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Catalog Grid & Sort Controls */}
              <div className="lg:col-span-9 space-y-5">
                {/* Results Header & Sorting Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
                  <div className="text-xs text-neutral-400 font-medium">
                    Showing <span className="font-bold text-white">{products.length}</span> authentic products
                    {selectedCategory && <span> in category</span>}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-neutral-950 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="newest">Featured & Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Top Customer Rated</option>
                    </select>
                  </div>
                </div>

                {/* Products Grid */}
                {loadingProducts ? (
                  <div className="py-20 text-center text-neutral-500 flex flex-col items-center justify-center">
                    <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                    <p className="text-sm font-semibold text-neutral-300">Loading catalog...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-400">
                    <AlertCircle className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">No products found</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Try adjusting your budget filter, clearing search keywords, or asking our AI shopping assistant for recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onAddToCart={handleAddToCart}
                        onQuickView={setViewingProduct}
                        onToggleCompare={handleToggleCompare}
                        isCompared={comparedProducts.some((p) => p.id === prod.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Floating Comparison Sticky Dock */}
      {comparedProducts.length > 0 && (
        <div
          id="comparison-floating-dock"
          className="fixed bottom-6 left-6 z-40 bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom"
        >
          <div className="flex -space-x-2 overflow-hidden">
            {comparedProducts.map((p) => (
              <img
                key={p.id}
                src={p.imageUrl}
                alt={p.name}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-neutral-900 bg-neutral-950 object-contain p-0.5"
              />
            ))}
          </div>
          <div className="text-xs">
            <span className="font-bold text-white">{comparedProducts.length}</span>
            <span className="text-neutral-400"> items to compare</span>
          </div>
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Now</span>
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Product Comparison Modal */}
      {showCompareModal && (
        <ProductCompareModal
          products={comparedProducts}
          onClose={() => setShowCompareModal(false)}
          onRemove={(id) => setComparedProducts((prev) => prev.filter((p) => p.id !== id))}
          onAddToCart={handleAddToCart}
          onClearAll={() => setComparedProducts([])}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setShowCheckoutModal(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cart={cart}
        currentUser={currentUser}
        onOrderCompleted={(order) => {
          setShowCheckoutModal(false);
          setConfirmedOrder(order);
          setCart(null);
        }}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onTrackOrder={(orderNum) => {
          setConfirmedOrder(null);
          setTrackingOrderNumber(orderNum);
          setActiveView('tracking');
        }}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      {/* Autonomous Multilingual AI Shopping Assistant Widget */}
      <AiChatWidget
        isOpen={isAiChatOpen}
        onToggle={() => setIsAiChatOpen(!isAiChatOpen)}
        onAddToCart={handleAddToCart}
        onQuickView={setViewingProduct}
        onAskPromptTrigger={aiPromptTrigger}
        onClearPromptTrigger={() => setAiPromptTrigger(null)}
      />

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 text-neutral-400 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">ShopPilot PK Electronics</span>
            <span>•</span>
            <span>Local-First Autonomous E-Commerce Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            <span>Currency: PKR (Pakistani Rupee)</span>
            <span>•</span>
            <span>Zero Paid APIs Policy</span>
            <span>•</span>
            <span>Ollama qwen2.5:3b</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
