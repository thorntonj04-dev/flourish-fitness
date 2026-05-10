import React, { useState, useEffect } from 'react';
import { ref as dbRef, onValue, update } from 'firebase/database';
import { db } from '../../firebase';
import { Inbox, ChevronDown, ChevronUp, Mail, Phone, Calendar, Tag, CheckCircle, Archive, RotateCcw } from 'lucide-react';

const STATUS_FILTERS = ['all', 'new', 'contacted', 'archived'];

const STATUS_STYLES = {
  new: { bg: 'rgba(139,92,246,0.18)', border: '#8b5cf6', text: '#c4b5fd', label: 'New' },
  contacted: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#6ee7b7', label: 'Contacted' },
  archived: { bg: 'rgba(100,116,139,0.15)', border: '#64748b', text: '#94a3b8', label: 'Archived' },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const q = dbRef(db, 'inquiries');
    const unsub = onValue(q, snap => {
      if (!snap.exists()) { setInquiries([]); return; }
      const data = snap.val();
      const list = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setInquiries(list);
    });
    return () => unsub();
  }, []);

  const setStatus = async (id, status) => {
    setUpdating(id);
    try {
      await update(dbRef(db, `inquiries/${id}`), { status });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);
  const counts = { new: 0, contacted: 0, archived: 0 };
  inquiries.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  return (
    <div className="space-y-6 pb-24">
      {/* Hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #2d1458 50%, #1a0a2e 100%)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', transform: 'translate(-20%, 20%)' }} />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#a78bfa' }}>
              Potential Clients
            </div>
            <h1 className="text-2xl font-bold text-white">Inquiries</h1>
            <p className="text-sm mt-1" style={{ color: '#c4b5fd' }}>
              {counts.new} new · {counts.contacted} contacted · {counts.archived} archived
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
            <Inbox className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize transition"
            style={{
              background: filter === f ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.07)',
              color: filter === f ? '#fff' : '#c4b5fd',
              border: `1px solid ${filter === f ? '#a78bfa' : 'rgba(167,139,250,0.25)'}`,
            }}
          >
            {f === 'all' ? `All (${inquiries.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Inquiry cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#c4b5fd' }}>
          <Inbox className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-semibold">No inquiries yet</p>
          <p className="text-sm opacity-60 mt-1">Submissions from your landing page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => {
            const st = STATUS_STYLES[inq.status] || STATUS_STYLES.new;
            const isOpen = expanded === inq.id;
            return (
              <div
                key={inq.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0f1a14', border: '1px solid rgba(167,139,250,0.2)' }}
              >
                {/* Card header */}
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                  onClick={() => setExpanded(isOpen ? null : inq.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                      {(inq.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{inq.name || 'Unknown'}</div>
                      <div className="text-xs truncate" style={{ color: '#c4b5fd' }}>{inq.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}
                    >
                      {st.label}
                    </span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4" style={{ color: '#a78bfa' }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: '#a78bfa' }} />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(167,139,250,0.15)' }}>
                    <div className="px-5 py-4 space-y-4">
                      {/* Meta row */}
                      <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#c4b5fd' }}>
                        {inq.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {inq.email}
                          </span>
                        )}
                        {inq.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> {inq.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(inq.submittedAt)}
                        </span>
                      </div>

                      {/* Detail fields */}
                      <div className="space-y-3">
                        {[
                          { label: 'Goal', value: inq.goal },
                          { label: 'Experience', value: inq.experience },
                          { label: 'Days / Week', value: inq.daysPerWeek },
                          { label: 'Health Concerns', value: inq.healthConcerns },
                          { label: 'Additional Info', value: inq.additionalInfo },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label}>
                            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#a78bfa' }}>
                              {f.label}
                            </div>
                            <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(139,92,246,0.1)', color: '#e9d5ff' }}>
                              {f.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {inq.status !== 'contacted' && (
                          <button
                            onClick={() => setStatus(inq.id, 'contacted')}
                            disabled={updating === inq.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Contacted
                          </button>
                        )}
                        {inq.status !== 'archived' && (
                          <button
                            onClick={() => setStatus(inq.id, 'archived')}
                            disabled={updating === inq.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition"
                            style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.4)' }}
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        )}
                        {inq.status === 'archived' && (
                          <button
                            onClick={() => setStatus(inq.id, 'new')}
                            disabled={updating === inq.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)' }}
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore
                          </button>
                        )}
                      </div>
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
