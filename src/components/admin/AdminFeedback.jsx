import React, { useState, useEffect, useCallback } from 'react';
import { ref as dbRef, onValue, update, get } from 'firebase/database';
import { db } from '../../firebase';
import { MessageSquare, ChevronDown, ChevronUp, CheckCircle, Archive, RotateCcw, Lightbulb, Bug, MessageCircle, RefreshCw } from 'lucide-react';

const STATUS_FILTERS = ['all', 'new', 'reviewed', 'done', 'archived'];

// Separate styles for header chips (always on dark green) vs card badges (light or dark bg)
const CHIP_STYLES = {
  new:      { bg: 'rgba(139,92,246,0.25)', border: '#8b5cf6', text: '#e9d5ff', label: 'New' },
  reviewed: { bg: 'rgba(234,179,8,0.25)',  border: '#eab308', text: '#fef08a', label: 'Reviewed' },
  done:     { bg: 'rgba(16,185,129,0.25)', border: '#10b981', text: '#a7f3d0', label: 'Done' },
  archived: { bg: 'rgba(148,163,184,0.25)', border: '#94a3b8', text: '#e2e8f0', label: 'Archived' },
};

const BADGE_CLS = {
  new:      'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300',
  reviewed: 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-300',
  done:     'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300',
  archived: 'bg-gray-100 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
};

const BADGE_LABEL = { new: 'New', reviewed: 'Reviewed', done: 'Done', archived: 'Archived' };

const CATEGORY_META = {
  enhancement: { icon: Lightbulb,     label: 'Enhancement', cls: 'text-amber-600 dark:text-amber-400' },
  bug:         { icon: Bug,           label: 'Bug Report',  cls: 'text-red-600 dark:text-red-400' },
  general:     { icon: MessageCircle, label: 'General',     cls: 'text-blue-600 dark:text-blue-400' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminFeedback() {
  const [items, setItems]       = useState([]);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [permError, setPermError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setPermError(false);
    get(dbRef(db, 'app-feedback'))
      .then(snap => {
        if (!snap.exists()) { setItems([]); }
        else {
          const list = Object.entries(snap.val())
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setItems(list);
        }
      })
      .catch(() => setPermError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const unsub = onValue(
      dbRef(db, 'app-feedback'),
      snap => {
        if (!snap.exists()) { setItems([]); }
        else {
          const list = Object.entries(snap.val())
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setItems(list);
        }
        setLoading(false);
        setPermError(false);
      },
      () => { setPermError(true); setLoading(false); },
    );
    return () => unsub();
  }, [load]);

  const setStatus = async (id, status) => {
    setUpdating(id);
    try { await update(dbRef(db, `app-feedback/${id}`), { status }); }
    catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const counts = { new: 0, reviewed: 0, done: 0, archived: 0 };
  items.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  return (
    <div className="space-y-6 pb-24">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Client Feedback</h1>
              <p className="text-emerald-200 text-sm mt-0.5">Enhancement requests & suggestions from your clients</p>
            </div>
          </div>
          <button
            onClick={load}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex-shrink-0"
            title="Reload"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {Object.entries(counts).map(([status, count]) => {
            const s = CHIP_STYLES[status];
            return count > 0 ? (
              <span
                key={status}
                className="text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{ background: s.bg, borderColor: s.border, color: s.text }}
              >
                {count} {s.label}
              </span>
            ) : null;
          })}
          {!loading && items.length === 0 && !permError && (
            <span className="text-xs text-emerald-300">No feedback yet</span>
          )}
        </div>
      </div>

      {/* Permission error */}
      {permError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-2xl p-4 text-sm text-red-700 dark:text-red-300">
          Could not read feedback — Firebase permission denied. Make sure the updated database rules have been published in the Firebase console, then tap the reload button above.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-[#1E3328] text-gray-700 dark:text-[#d8e7de]/70 border border-gray-200 dark:border-[#C6A45F]/25 hover:bg-gray-50 dark:hover:bg-[#1E3328]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && counts[f] > 0 && (
              <span className="ml-1.5 text-xs opacity-75">({counts[f]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-[#d8e7de]/60 text-sm">Loading feedback…</p>
        </div>
      )}

      {/* Feedback list */}
      {!loading && filtered.length === 0 && !permError && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-gray-600 dark:text-[#d8e7de]/60 text-sm font-medium">No feedback in this category yet.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(item => {
            const badgeCls = BADGE_CLS[item.status] || BADGE_CLS.new;
            const badgeLabel = BADGE_LABEL[item.status] || 'New';
            const catMeta = CATEGORY_META[item.category] || CATEGORY_META.general;
            const CatIcon = catMeta.icon;
            const isOpen = expanded === item.id;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden"
              >
                <button
                  className="w-full text-left p-4 flex items-start gap-3"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm">
                        {item.userName || 'Client'}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                        {badgeLabel}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${catMeta.cls}`}>
                        <CatIcon className="w-3 h-3" />
                        {catMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#d8e7de]/50 mb-1">{formatDate(item.createdAt)}</p>
                    {!isOpen && (
                      <p className="text-sm text-gray-700 dark:text-[#d8e7de]/70 truncate">{item.message}</p>
                    )}
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  }
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-sm text-gray-800 dark:text-[#d8e7de]/80 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-[#0a0a0a]/50 rounded-xl p-3">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {item.status !== 'reviewed' && item.status !== 'archived' && (
                        <button
                          onClick={() => setStatus(item.id, 'reviewed')}
                          disabled={updating === item.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/40 rounded-xl text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark Reviewed
                        </button>
                      )}
                      {item.status !== 'done' && item.status !== 'archived' && (
                        <button
                          onClick={() => setStatus(item.id, 'done')}
                          disabled={updating === item.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/40 rounded-xl text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark Done
                        </button>
                      )}
                      {item.status !== 'archived' && (
                        <button
                          onClick={() => setStatus(item.id, 'archived')}
                          disabled={updating === item.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700/40 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800/60 transition disabled:opacity-50"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archive
                        </button>
                      )}
                      {item.status === 'archived' && (
                        <button
                          onClick={() => setStatus(item.id, 'new')}
                          disabled={updating === item.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/40 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
