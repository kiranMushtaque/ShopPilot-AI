import React from 'react';
import { Bot, Sparkles, ShieldCheck, Truck, RotateCcw, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onAskAiPrompt: (promptText: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onAskAiPrompt }) => {
  return (
    <div id="hero-banner-section" className="relative overflow-hidden bg-neutral-900 border-b border-neutral-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-neutral-900 to-neutral-950 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Grounded Shopping Assistant Active</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Pakistan's Autonomous <br />
              <span className="text-emerald-400">Tech & Electronics</span> Store
            </h1>

            <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
              Find the best tech gadgets with live inventory, PTA verification, and authoritative pricing in Pakistani Rupees (PKR). Ask in English, Urdu, or Roman Urdu!
            </p>

            {/* Value Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">Cash on Delivery Across Pakistan</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">Official Brand Warranty & PTA</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">7 Days Hassle-Free Return Policy</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive AI Prompt Box */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-2xl shadow-emerald-950/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              <Bot className="w-4 h-4" />
              <span>Ask ShopPilot AI Anything</span>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Tap any prompt below to see the local multilingual AI recommend products, verify stock, or track orders:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onAskAiPrompt('5000 ke andar best earbuds dikhao')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/40 text-xs text-neutral-200 flex items-center justify-between transition-all group"
              >
                <span>🎧 "5000 ke andar best earbuds dikhao"</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => onAskAiPrompt('Mera order SP-10001 kahan tak pohncha?')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/40 text-xs text-neutral-200 flex items-center justify-between transition-all group"
              >
                <span>📦 "Mera order SP-10001 kahan tak pohncha?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => onAskAiPrompt('Shop ki return aur refund policy kya hai?')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/40 text-xs text-neutral-200 flex items-center justify-between transition-all group"
              >
                <span>📋 "Shop ki return aur refund policy kya hai?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => onAskAiPrompt('I need a smartphone with 8GB RAM under 60k PKR')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/40 text-xs text-neutral-200 flex items-center justify-between transition-all group"
              >
                <span>📱 "I need a smartphone with 8GB RAM under 60k PKR"</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
