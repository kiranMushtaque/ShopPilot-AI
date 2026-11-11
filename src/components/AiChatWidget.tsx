import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShoppingCart,
  Eye,
  Headphones,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { ChatMessage, Product } from '../types';

interface AiChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAskPromptTrigger?: string | null;
  onClearPromptTrigger?: () => void;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  isOpen,
  onToggle,
  onAddToCart,
  onQuickView,
  onAskPromptTrigger,
  onClearPromptTrigger,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'online' | 'fallback_mode'>('fallback_mode');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/chat/history');
      const data = await res.json();
      if (data.success && data.data?.messages?.length > 0) {
        setMessages(data.data.messages);
      } else {
        // Default initial greeting in Roman Urdu / English
        setMessages([
          {
            id: 'init-msg',
            conversationId: 'default',
            sender: 'AGENT',
            content: `Assalam-o-Alaikum! Main ShopPilot AI hoon — aapka 24/7 personal shopping assistant.
Aap mujhse Roman Urdu, Urdu ya English mein products dhoondne, specs compare karne, order track karne ya store policies poochne ke liye keh sakte hain!

Kaise madad karoon aapki?`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // Offline fallback initial greeting
    }
  };

  // Handle external prompt trigger (e.g. hero banner prompt click)
  useEffect(() => {
    if (onAskPromptTrigger && onAskPromptTrigger.trim()) {
      if (!isOpen) onToggle();
      sendMessage(onAskPromptTrigger);
      if (onClearPromptTrigger) onClearPromptTrigger();
    }
  }, [onAskPromptTrigger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      conversationId: 'default',
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
        if (data.ollamaStatus) {
          setOllamaStatus(data.ollamaStatus);
        }
      } else {
        throw new Error(data.error || 'Response error');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversationId: 'default',
          sender: 'AGENT',
          content: 'Maazrat! Request process karne mein masla aya. Barah-e-karam dobara koshish karein.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const quickPrompts = [
    '🎧 5000 ke andar best earbuds dikhao',
    '📦 Mera order SP-10001 track karo',
    '📋 Return and refund policy kya hai?',
    '📱 8GB RAM smartphone under 60k PKR',
    '👤 Human support se baat karni hai',
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          id="ai-chat-launcher-btn"
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-2xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group font-bold text-sm"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-neutral-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neutral-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neutral-950" />
          </div>
          <span className="hidden sm:inline">Ask AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className={`fixed z-50 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-16'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] h-[600px] max-h-[90vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">ShopPilot AI Assistant</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    {ollamaStatus === 'online' ? 'Ollama qwen2.5:3b' : 'Local NLP Fallback'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">English • اردو • Roman Urdu</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAgent = msg.sender === 'AGENT' || msg.sender === 'SYSTEM';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isAgent
                        ? 'bg-neutral-950 text-neutral-200 border border-neutral-800'
                        : 'bg-emerald-500 text-neutral-950 font-medium'
                    }`}
                  >
                    {/* Tool Calls Execution Tag */}
                    {isAgent && msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mb-2 pb-2 border-b border-neutral-800 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                        <Wrench className="w-3 h-3" />
                        <span>Executed: {msg.toolCalls.map((t) => t.name).join(', ')}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Interactive Product Cards inside Chat Bubble */}
                    {isAgent && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Recommended Products ({msg.suggestedProducts.length}):</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {msg.suggestedProducts.map((p) => (
                            <div
                              key={p.id}
                              className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between gap-2.5"
                            >
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg bg-neutral-950 object-contain p-1 border border-neutral-800"
                              />

                              <div className="flex-1 min-w-0">
                                <h5 className="text-[11px] font-bold text-white line-clamp-1">{p.name}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-emerald-400">
                                    Rs. {p.pricePkr.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-neutral-500">
                                    Stock: {p.stockQuantity}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => onQuickView(p)}
                                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                                  title="View Specs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onAddToCart(p)}
                                  disabled={p.stockQuantity <= 0}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-neutral-500 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-400 text-xs py-2">
                <Bot className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>Checking store catalog & policies...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-neutral-950/60 border-t border-neutral-800/80 overflow-x-auto scrollbar-none flex gap-1.5">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => sendMessage(qp.replace(/^[^\s]+\s/, ''))}
                className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 whitespace-nowrap transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
            <input
              id="ai-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask in Roman Urdu, Urdu, or English..."
              className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              id="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all disabled:bg-neutral-800 disabled:text-neutral-500 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
