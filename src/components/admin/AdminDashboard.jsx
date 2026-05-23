import React, { useState, useEffect } from 'react';
import { Dumbbell, Layers, Users, Heart, ChevronDown, Play, CalendarDays, Trophy, SlidersHorizontal, TrendingUp, Clock, Sparkles, Check } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function AdminDashboard({ user, onNavigate }) {
  const [expanded, setExpanded] = useState(null);
  const [clientStats, setClientStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersSnap, statsSnap] = await Promise.all([
          get(dbRef(db, 'users')),
          get(dbRef(db, 'user-stats')),
        ]);
        const clients = usersSnap.exists()
          ? Object.entries(usersSnap.val()).filter(([, u]) => u.role === 'client')
          : [];
        const allStats = statsSnap.exists() ? statsSnap.val() : {};
        const sevenDaysAgo = Date.now() - 7 * 86400000;
        const trainedRecently = clients.filter(([uid]) => {
          const lwd = allStats[uid]?.lastWorkoutDate;
          return lwd && new Date(lwd).getTime() > sevenDaysAgo;
        }).length;
        setClientStats({ total: clients.length, trainedRecently, needAttention: clients.length - trainedRecently });
      } catch (err) {
        console.error('Error loading admin stats:', err);
      }
    };
    loadStats();
  }, []);

  const toggle = (key) => setExpanded(p => p === key ? null : key);

  return (
    <div className="space-y-4 pb-24">

      {/* ── Compact header ─────────────────────────────────────────────── */}
      <div className="hero-gradient rounded-2xl px-5 py-4 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs font-medium mb-0.5">Welcome back</p>
            <h2 className="text-xl font-bold">Your Training Hub 💪</h2>
          </div>
          <Heart className="w-6 h-6 text-pink-200/70" />
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatChip value={clientStats?.total ?? '—'} label="Clients" color="blue" />
        <StatChip value={clientStats?.trainedRecently ?? '—'} label="Active" color="emerald" />
        <StatChip
          value={clientStats?.needAttention ?? '—'}
          label="Attention"
          color={clientStats?.needAttention > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* ── Quick-launch grid ──────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-widest px-1 mb-2">Jump To</p>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickLaunch
            gradient="from-yellow-400 to-orange-500"
            icon={<Dumbbell className="w-5 h-5" />}
            label="Workouts"
            onClick={() => onNavigate('workout-days')}
          />
          <QuickLaunch
            gradient="from-emerald-500 to-teal-500"
            icon={<Layers className="w-5 h-5" />}
            label="Programs"
            onClick={() => onNavigate('programs')}
          />
          <QuickLaunch
            gradient="from-blue-500 to-indigo-500"
            icon={<Users className="w-5 h-5" />}
            label="Clients"
            onClick={() => onNavigate('clients')}
          />
        </div>
      </div>

      {/* ── Expandable panels ──────────────────────────────────────────── */}

      <Panel
        id="howto"
        expanded={expanded}
        onToggle={toggle}
        icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
        title="How It Works"
        subtitle="Your full workflow, step by step"
      >
        <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
          {[
            { step: 1, label: 'Build Workouts', detail: 'Go to Workout Builder and create each training session — Push Day, Leg Day, Full Body, whatever you need. Add exercises with sets, reps, recommended weight, and coaching notes.', icon: <Dumbbell className="w-4 h-4" />, color: 'bg-yellow-500' },
            { step: 2, label: 'Build a Program', detail: 'Head to Programs. A program groups your workout days into phases — each with a set duration and weekly frequency. For example: Phase 1 (Foundation) = 4 weeks × 3 days/week.', icon: <Layers className="w-4 h-4" />, color: 'bg-emerald-500' },
            { step: 3, label: 'Add Your Client', detail: "Go to Clients and tap Add Client. Enter their name and email. Send them the app link and ask them to sign up with that exact email — they'll automatically be set up as a client.", icon: <Users className="w-4 h-4" />, color: 'bg-blue-500' },
            { step: 4, label: 'Assign the Program', detail: "On their client card, tap Assign Program. Select the program, choose a start date, and set their weekly schedule. They can always rearrange this themselves.", icon: <CalendarDays className="w-4 h-4" />, color: 'bg-purple-500' },
            { step: 5, label: 'Client Trains', detail: "Your client opens the app and sees their full week. They tap Start and get guided set-by-set with their recommended weights and rest timers. Everything saves automatically.", icon: <Play className="w-4 h-4" />, color: 'bg-pink-500' },
            { step: 6, label: 'Adjust as They Progress', detail: "Tap the eye icon on any client card to open their full detail view — see their program progress, strength charts, personal records, and complete workout history.", icon: <TrendingUp className="w-4 h-4" />, color: 'bg-orange-500' },
          ].map(({ step, label, detail, icon, color }) => (
            <div key={step} className="flex items-start gap-3 p-4">
              <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm mb-0.5">
                  <span className="text-gray-400 dark:text-[#d8e7de]/40 font-normal">Step {step} — </span>{label}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 leading-relaxed">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        id="client"
        expanded={expanded}
        onToggle={toggle}
        icon={<Trophy className="w-4 h-4 text-yellow-500" />}
        title="What Clients Experience"
        subtitle="Their journey from login to celebration"
      >
        <div className="p-4 space-y-3">
          {[
            { icon: CalendarDays, title: 'Weekly view on login', desc: "They see exactly which days they train and which are rest days. Today's workout is always highlighted." },
            { icon: Play, title: 'Guided workout sessions', desc: 'One exercise card at a time. They log weight and reps for each set, with best weights pre-filled.' },
            { icon: Clock, title: 'Rest timers between sets', desc: 'A countdown appears automatically after each set. They can skip it if they feel ready.' },
            { icon: Trophy, title: 'Post-workout celebration', desc: 'Confetti, stats, and achievements appear when they finish. They rate difficulty and can leave a session note.' },
            { icon: SlidersHorizontal, title: 'Flexible schedule', desc: 'They can rearrange which days they train each week without changing their program.' },
            { icon: TrendingUp, title: 'Body weight tracking', desc: 'They log their weight from their profile. You can see their full trend in the client detail view.' },
            { icon: Users, title: 'Editable profile & photo', desc: 'They can upload a profile photo and edit their display name — changes reflect everywhere instantly.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm">{title}</div>
                <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        id="features"
        expanded={expanded}
        onToggle={toggle}
        icon={<Check className="w-4 h-4 text-emerald-500" />}
        title="Everything That's Built In"
        subtitle="Full feature list"
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {[
              'Workout builder', '500+ exercise autocomplete', 'Muscle group filters', 'Quick set/rep presets',
              'Superset pairing', 'Equipment picker', 'Multi-phase programs', 'Phase auto-advancement',
              'Client management', 'Program assignment', 'Weekly schedule view', 'Rest timer (30/60/90s)',
              'Live workout sessions', 'Section color coding', 'Per-exercise progress', 'Session notes',
              'Personal-best weights', 'Workout history', 'Strength charts', 'Body weight tracking',
              'Personal records', 'Streak tracking', 'Client detail view', 'Workout rating',
              'Schedule adjustment', 'Profile photo upload', 'Inquiry form + panel', 'Dark mode',
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-[#d8e7de]/70">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        id="updates"
        expanded={expanded}
        onToggle={toggle}
        icon={<Sparkles className="w-4 h-4 text-purple-500" />}
        title="Recent Updates"
        subtitle="Latest additions and improvements"
        badge="NEW"
      >
        <div className="p-4 space-y-5">
          {[
            { label: 'Workout Session', color: 'bg-teal-500', items: ['Card-based one-exercise-at-a-time flow', 'Personal-best weights auto-filled for every exercise', 'Section color coding: green work, amber warmup, blue cooldown', 'Depth and glow effects throughout the session UI'] },
            { label: 'Workout Builder', color: 'bg-orange-500', items: ['Up/down arrows to reorder exercises', 'Supersets auto-group adjacent when paired'] },
            { label: 'Client Profiles', color: 'bg-emerald-500', items: ['Profile photo upload', 'Editable display name'] },
            { label: 'Inquiries', color: 'bg-blue-500', items: ['Contact form on landing page', 'Admin inquiries tab to manage leads'] },
          ].map(({ label, color, items }) => (
            <div key={label}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-xs font-bold text-gray-900 dark:text-[#d8e7de]">{label}</span>
              </div>
              <ul className="space-y-1.5 pl-4">
                {items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-[#d8e7de]/65 leading-snug flex gap-2">
                    <span className="text-gray-300 dark:text-[#d8e7de]/25 flex-shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        id="note"
        expanded={expanded}
        onToggle={toggle}
        icon={<Heart className="w-4 h-4 text-pink-400" />}
        title="A Note from John"
        subtitle="Built just for you"
      >
        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-[#d8e7de]/70 leading-relaxed mb-3">
            This platform was designed and built exclusively for you — a place where your passion for fitness, your care for clients, and your expertise all come together in one beautiful system.
          </p>
          <p className="text-sm text-gray-600 dark:text-[#d8e7de]/70 leading-relaxed mb-3">
            You are not just another trainer, and your clients deserve more than a generic app. This isn't a generic app. It's handcrafted, one of a kind — built to reflect your approach, your standards, and your passion for helping others flourish.
          </p>
          <p className="text-sm text-gray-600 dark:text-[#d8e7de]/70 leading-relaxed">
            Tell me when something doesn't make sense and I'll fix it. This will only get better. 💚
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#C6A45F]/15 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 dark:text-[#d8e7de]">I love you!</p>
              <p className="text-sm text-gray-500 dark:text-[#d8e7de]/50">— John</p>
            </div>
            <Heart className="w-7 h-7 text-pink-400/60" />
          </div>
        </div>
      </Panel>

    </div>
  );
}

function StatChip({ value, label, color }) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-3 text-center border border-gray-200 dark:border-[#C6A45F]/25">
      <div className={`text-2xl font-bold ${colors[color] ?? colors.blue}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-0.5 leading-tight">{label}</div>
    </div>
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

function Panel({ id, expanded, onToggle, icon, title, subtitle, badge, children }) {
  const isOpen = expanded === id;
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full px-5 py-4 flex items-center justify-between text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[60px]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">{icon}</div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm flex items-center gap-2">
              {title}
              {badge && <span className="text-[9px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>}
            </div>
            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">{subtitle}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">
          {children}
        </div>
      )}
    </div>
  );
}
