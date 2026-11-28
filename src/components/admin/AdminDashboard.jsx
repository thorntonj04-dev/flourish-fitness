import React, { useState, useEffect } from 'react';
import {
  Dumbbell, Layers, Users, ChevronRight, CalendarDays, Mail, MessageSquare,
  UserX, Clock, CheckCircle, Flag, Sparkles,
} from 'lucide-react';
import { ref as dbRef, get, query, orderByKey, limitToLast } from 'firebase/database';
import { db } from '../../firebase';
import { toPhaseArray, computePhaseStarts, addDays } from '../../utils/phase';

const INACTIVE_DAYS = 7;
const UPCOMING_DAYS = 14;
const RECENT_LIMIT = 6;

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysAgo(timestamp) {
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 86400000);
}

function relativeDay(timestamp) {
  const t = new Date(timestamp);
  const today = localDateStr();
  const day = localDateStr(t);
  if (day === today) return `Today, ${t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (day === addDays(today, -1)) return 'Yesterday';
  return t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function upcomingLabel(dateStr) {
  const today = localDateStr();
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, 1)) return 'Tomorrow';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AdminDashboard({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersSnap, statsSnap, assignSnap, schedSnap, programsSnap, inquiriesSnap, feedbackSnap] = await Promise.all([
          get(dbRef(db, 'users')),
          get(dbRef(db, 'user-stats')),
          get(dbRef(db, 'programAssignments')),
          get(dbRef(db, 'clientSchedules')),
          get(dbRef(db, 'programs')),
          get(dbRef(db, 'inquiries')).catch(() => null),
          get(dbRef(db, 'app-feedback')).catch(() => null),
        ]);

        const users = usersSnap.val() || {};
        const stats = statsSnap.val() || {};
        const assignments = assignSnap.val() || {};
        const schedules = schedSnap.val() || {};
        const programs = programsSnap.val() || {};
        const clients = Object.entries(users)
          .filter(([, u]) => u.role === 'client')
          .map(([id, u]) => ({ id, name: u.name || u.email?.split('@')[0] || 'Client' }));
        const nameOf = Object.fromEntries(clients.map(c => [c.id, c.name]));

        // Last 5 sessions per client (push keys sort chronologically), merged into one feed.
        const historySnaps = await Promise.all(clients.map(c =>
          get(query(dbRef(db, `workout-history/${c.id}`), orderByKey(), limitToLast(5))).catch(() => null)
        ));
        const recent = historySnaps.flatMap((snap, i) =>
          Object.values(snap?.val() || {})
            .filter(h => h.completed)
            .map(h => ({
              clientId: clients[i].id,
              clientName: clients[i].name,
              workoutName: h.workoutName || 'Workout',
              when: h.endTime || h.startTime,
              duration: h.duration,
            }))
        ).sort((a, b) => b.when - a.when).slice(0, RECENT_LIMIT);

        // Last workout per client: the newer of user-stats and the history we just fetched.
        const lastWorkout = {};
        clients.forEach(c => {
          const fromStats = stats[c.id]?.lastWorkoutDate ? new Date(stats[c.id].lastWorkoutDate).getTime() : 0;
          const fromHistory = Math.max(0, ...recent.filter(r => r.clientId === c.id).map(r => r.when));
          lastWorkout[c.id] = Math.max(fromStats, fromHistory) || null;
        });

        const hasPlan = (id) =>
          !!assignments[id] ||
          Object.entries(schedules[id] || {}).some(([k, v]) => k !== 'adhoc' && v);

        const noPlan = clients.filter(c => !hasPlan(c.id));
        const inactive = clients
          .filter(c => hasPlan(c.id) && (!lastWorkout[c.id] || daysAgo(lastWorkout[c.id]) >= INACTIVE_DAYS))
          .sort((a, b) => (lastWorkout[a.id] || 0) - (lastWorkout[b.id] || 0));
        const trainedThisWeek = clients.filter(c => lastWorkout[c.id] && daysAgo(lastWorkout[c.id]) < INACTIVE_DAYS).length;

        // Program starts and phase changes in the next two weeks.
        const today = localDateStr();
        const horizon = addDays(today, UPCOMING_DAYS);
        const upcoming = [];
        Object.entries(assignments).forEach(([clientId, a]) => {
          if (!nameOf[clientId] || !a?.startDate) return;
          const program = programs[a.programId];
          const phases = toPhaseArray(program?.phases);
          const fromIdx = a.currentPhase ?? 0;
          if (phases.length === 0) {
            if (a.startDate >= today && a.startDate <= horizon) {
              upcoming.push({ clientName: nameOf[clientId], date: a.startDate, title: `Starts ${a.programName || 'program'}` });
            }
            return;
          }
          const starts = computePhaseStarts(phases, fromIdx, a.startDate, a.phaseStartDates);
          starts.forEach((date, idx) => {
            if (!date || date < today || date > horizon) return;
            upcoming.push({
              clientName: nameOf[clientId],
              date,
              title: idx === fromIdx
                ? `Starts ${a.programName || program?.name || 'program'}`
                : `${phases[idx]?.name || `Phase ${idx + 1}`} begins`,
            });
          });
        });
        upcoming.sort((a, b) => a.date.localeCompare(b.date));

        const newInquiries = Object.values(inquiriesSnap?.val() || {}).filter(i => i.status === 'new').length;
        const newFeedback = Object.values(feedbackSnap?.val() || {}).filter(f => !f.status || f.status === 'new').length;

        setData({
          name: users[user?.uid]?.name || 'Lindsey',
          totalClients: clients.length,
          trainedThisWeek,
          noPlan,
          inactive,
          lastWorkout,
          upcoming,
          recent,
          newInquiries,
          newFeedback,
        });
      } catch (err) {
        console.error('Error loading admin home:', err);
        setError(true);
      }
    };
    load();
  }, [user?.uid]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const attentionCount = data
    ? data.noPlan.length + data.inactive.length + (data.newInquiries ? 1 : 0) + (data.newFeedback ? 1 : 0)
    : 0;

  return (
    <div className="space-y-4 pb-24">

      {/* Header */}
      <div className="hero-gradient rounded-2xl px-5 py-4 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-emerald-100 text-xs font-medium mb-0.5">{today}</p>
          <h2 className="text-xl font-bold">{greeting()}{data ? `, ${data.name}` : ''}</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatChip value={data?.totalClients ?? '—'} label="Clients" color="blue" onClick={() => onNavigate('clients')} />
        <StatChip value={data?.trainedThisWeek ?? '—'} label="Trained in last 7 days" color="emerald" onClick={() => onNavigate('clients')} />
        <StatChip
          value={data ? attentionCount : '—'}
          label="Need attention"
          color={attentionCount > 0 ? 'amber' : 'emerald'}
          onClick={() => document.getElementById('attention')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
          Couldn't load everything for your home page. Try reopening the app in a moment.
        </div>
      )}

      {/* Needs attention */}
      <Section id="attention" title="Needs Your Attention">
        {!data ? <Skeleton rows={2} /> : attentionCount === 0 ? (
          <EmptyRow icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} text="You're all caught up." />
        ) : (
          <>
            {data.newInquiries > 0 && (
              <Row
                icon={<Mail className="w-4 h-4" />} tone="purple"
                title={`${data.newInquiries} new ${data.newInquiries === 1 ? 'inquiry' : 'inquiries'}`}
                subtitle="Someone filled out the contact form"
                onClick={() => onNavigate('inquiries')}
              />
            )}
            {data.newFeedback > 0 && (
              <Row
                icon={<MessageSquare className="w-4 h-4" />} tone="blue"
                title={`${data.newFeedback} new feedback ${data.newFeedback === 1 ? 'note' : 'notes'}`}
                subtitle="From your clients"
                onClick={() => onNavigate('feedback')}
              />
            )}
            {data.noPlan.map(c => (
              <Row
                key={`np-${c.id}`}
                icon={<UserX className="w-4 h-4" />} tone="amber"
                title={c.name}
                subtitle="No program or workouts assigned"
                onClick={() => onNavigate('clients')}
              />
            ))}
            {data.inactive.map(c => (
              <Row
                key={`in-${c.id}`}
                icon={<Clock className="w-4 h-4" />} tone="amber"
                title={c.name}
                subtitle={data.lastWorkout[c.id]
                  ? `Last trained ${daysAgo(data.lastWorkout[c.id])} days ago`
                  : 'Hasn\'t logged a workout yet'}
                onClick={() => onNavigate('clients')}
              />
            ))}
          </>
        )}
      </Section>

      {/* Coming up */}
      <Section title="Coming Up" hint={`Next ${UPCOMING_DAYS} days`}>
        {!data ? <Skeleton rows={1} /> : data.upcoming.length === 0 ? (
          <EmptyRow icon={<CalendarDays className="w-4 h-4 text-gray-400" />} text="No program starts or phase changes coming up." />
        ) : data.upcoming.map((u, i) => (
          <Row
            key={i}
            icon={u.title.startsWith('Starts') ? <Flag className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            tone="emerald"
            title={u.clientName}
            subtitle={u.title}
            trailing={upcomingLabel(u.date)}
            onClick={() => onNavigate('clients')}
          />
        ))}
      </Section>

      {/* Recent workouts */}
      <Section title="Recent Workouts">
        {!data ? <Skeleton rows={3} /> : data.recent.length === 0 ? (
          <EmptyRow icon={<Sparkles className="w-4 h-4 text-gray-400" />} text="Completed client workouts will show up here." />
        ) : data.recent.map((r, i) => (
          <Row
            key={i}
            icon={<CheckCircle className="w-4 h-4" />}
            tone="teal"
            title={r.clientName}
            subtitle={`${r.workoutName}${r.duration ? ` · ${Math.round(r.duration / 60)} min` : ''}`}
            trailing={relativeDay(r.when)}
            onClick={() => onNavigate('clients')}
          />
        ))}
      </Section>

      {/* Shortcuts */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-widest px-1 mb-2">Shortcuts</p>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickLaunch gradient="from-yellow-400 to-orange-500" icon={<Dumbbell className="w-5 h-5" />} label="Workouts" onClick={() => onNavigate('workout-days')} />
          <QuickLaunch gradient="from-emerald-500 to-teal-500" icon={<Layers className="w-5 h-5" />} label="Programs" onClick={() => onNavigate('programs')} />
          <QuickLaunch gradient="from-blue-500 to-indigo-500" icon={<Users className="w-5 h-5" />} label="Clients" onClick={() => onNavigate('clients')} />
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, hint, children }) {
  return (
    <div id={id} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden scroll-mt-4">
      <div className="px-4 pt-4 pb-2 flex items-baseline justify-between">
        <h3 className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm">{title}</h3>
        {hint && <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{hint}</span>}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">{children}</div>
    </div>
  );
}

const TONES = {
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
};

function Row({ icon, tone, title, subtitle, trailing, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[56px]"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${TONES[tone]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm truncate">{title}</div>
        <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 truncate">{subtitle}</div>
      </div>
      {trailing && <span className="text-xs text-gray-400 dark:text-[#d8e7de]/45 flex-shrink-0 text-right">{trailing}</span>}
      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#d8e7de]/25 flex-shrink-0" />
    </button>
  );
}

function EmptyRow({ icon, text }) {
  return (
    <div className="px-4 py-4 flex items-center gap-3 text-sm text-gray-500 dark:text-[#d8e7de]/55">
      {icon}{text}
    </div>
  );
}

function Skeleton({ rows }) {
  return Array.from({ length: rows }, (_, i) => (
    <div key={i} className="px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#0a0a0a]/30 animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-[#0a0a0a]/30 animate-pulse" />
        <div className="h-2.5 w-1/2 rounded bg-gray-100 dark:bg-[#0a0a0a]/30 animate-pulse" />
      </div>
    </div>
  ));
}

function StatChip({ value, label, color, onClick }) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-[#1E3328] rounded-2xl p-3 text-center border border-gray-200 dark:border-[#C6A45F]/25 active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
    >
      <div className={`text-2xl font-bold ${colors[color] ?? colors.blue}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-0.5 leading-tight">{label}</div>
    </button>
  );
}

function QuickLaunch({ gradient, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-4 flex flex-col items-center gap-2 active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[80px]"
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-[#d8e7de]/80">{label}</span>
    </button>
  );
}
