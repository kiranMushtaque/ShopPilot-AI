import React, { useState, useEffect } from 'react';
import { Headphones, CheckCircle2, AlertCircle, X, MessageSquare, Phone, User as UserIcon } from 'lucide-react';
import { SupportTicket } from '../types';

interface SupportDeskProps {
  onClose: () => void;
}

export const SupportDesk: React.FC<SupportDeskProps> = ({ onClose }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch {
      // Error fetching tickets
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      const data = await res.json();
      if (data.success) {
        loadTickets();
      }
    } catch {
      // Error resolving ticket
    }
  };

  return (
    <div id="support-desk-page" className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 text-white p-4 sm:p-6 lg:p-8 animate-in fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">Customer Support & Escalation Desk</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-950 text-blue-400 border border-blue-800/40">
                  Role: SUPPORT
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage AI-escalated customer conversations and support tickets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tickets Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-300">
            Active Support Escalation Queue ({tickets.length})
          </h3>

          {tickets.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">All tickets resolved!</p>
              <p className="text-xs text-neutral-500 mt-1">No open customer escalations at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-blue-400 text-xs">#{t.ticketNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{t.subject}</h4>
                    <p className="text-xs text-neutral-300 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                      "{t.reason}"
                    </p>

                    <div className="space-y-1 text-xs text-neutral-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Customer: {t.customerName}</span>
                      </div>
                      {t.customerPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Phone: {t.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">
                      Created: {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {t.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleResolve(t.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
