import React, { useState } from 'react';
import {
  Bot,
  ShoppingCart,
  Search,
  Package,
  ShieldCheck,
  Headphones,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { User, Category } from '../types';

interface NavbarProps {
  currentUser: User | null;
  categories: Category[];
  cartCount: number;
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
  onQuickLogin: (role: 'ADMIN' | 'SUPPORT' | 'CUSTOMER') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  cartCount,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenAuth,
  onOpenTracking,
  onOpenAdmin,
  onOpenSupport,
  onLogout,
  onQuickLogin,
}) => {
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  return (
    <header id="storefront-navbar" className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800">
      {/* Top Notification Strip */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 text-emerald-300 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-4">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pakistan's 1st Local-First Multilingual AI E-Commerce Store</span>
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline font-mono">Cash on Delivery Available Nationwide</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">Free Shipping on orders above Rs. 15,000</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                ShopPilot <span className="text-emerald-400">PK</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium tracking-wide">Autonomous AI Digital Store</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search earbuds, phones, laptops, chargers in PKR..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Track Order Button */}
            <button
              id="track-order-btn"
              onClick={onOpenTracking}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs font-medium text-neutral-200 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track Order</span>
            </button>

            {/* Role-Specific Portal Buttons */}
            {currentUser?.role === 'ADMIN' && (
              <button
                id="nav-admin-btn"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}

            {currentUser?.role === 'SUPPORT' && (
              <button
                id="nav-support-btn"
                onClick={onOpenSupport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-colors"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Support Desk</span>
              </button>
            )}

            {/* Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="demo-role-switcher"
                onClick={() => setShowDemoDropdown(!showDemoDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 text-xs text-neutral-300 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[90px] truncate">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Demo User'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showDemoDropdown && (
                <div
                  id="demo-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl py-1.5 z-50 text-xs"
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    Switch Active Role
                  </div>
                  <button
                    onClick={() => {
                      onQuickLogin('CUSTOMER');
                      setShowDemoDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200"
                  >
                    <span>Customer (Hamza Tariq)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">Buyer</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickLogin('SUPPORT');
                      setShowDemoDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200"
                  >
                    <span>Support (Ayesha S.)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400">Support</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickLogin('ADMIN');
                      setShowDemoDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-neutral-200"
                  >
                    <span>Admin (Bilal Khan)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400">Admin</span>
                  </button>
                  {currentUser && (
                    <div className="border-t border-neutral-800 mt-1 pt-1">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowDemoDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-neutral-800 flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Login/Register Modal Trigger */}
            {!currentUser && (
              <button
                id="login-btn"
                onClick={onOpenAuth}
                className="text-xs text-neutral-300 hover:text-white px-2.5 py-1.5"
              >
                Sign In
              </button>
            )}

            {/* Cart Drawer Trigger */}
            <button
              id="cart-drawer-btn"
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all shadow-md shadow-emerald-950/40"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  id="cart-badge-count"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-900 border-2 border-neutral-950 text-emerald-400 text-[10px] font-extrabold flex items-center justify-center"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search catalog in PKR..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
