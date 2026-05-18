import React, { useState, useEffect } from 'react';
import { Dumbbell, Layers, Users, Heart, ChevronRight, Play, CalendarDays, Trophy, SlidersHorizontal, TrendingUp, Clock, Sparkles, Check } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function AdminDashboard({ user, onNavigate }) {
  const [expandedSection, setExpandedSection] = useState(null);
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

  return (
    <div className="space-y-5 pb-20">

      {/* Welcome banner */}
      <div className="hero-gradient rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-pink-200" />
            <span className="text-emerald-100 text-sm font-medium">Welcome back</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Your Training Hub 💪</h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Everything you need to run your coaching business — built just for you.
          </p>
        </div>
      </div>

      {/* Client overview stats */}
      <div className="grid grid-cols-3 gap-3">
        <OverviewChip
          value={clientStats ? clientStats.total : '—'}
          label="Total Clients"
          color="blue"
        />
        <OverviewChip
          value={clientStats ? clientStats.trainedRecently : '—'}
          label="Active (7 days)"
          color="emerald"
        />
        <OverviewChip
          value={clientStats ? clientStats.needAttention : '—'}
          label="Need Attention"
          color={clientStats?.needAttention > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Updates since you last saw this */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'updates' ? null : 'updates')}
          className="w-full px-5 py-4 flex items-center justify-between text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[56px]"
        >
          <div>
            <div className="font-bold text-gray-900 dark:text-[#d8e7de] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Updates Since You Last Saw This
              <span className="text-[10px] font-black bg-purple-500 text-white px-2 py-0.5 rounded-full">NEW</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">Recent additions and improvements</div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'updates' ? 'rotate-90' : ''}`} />
        </button>

        {expandedSection === 'updates' && (
          <div className="border-t border-gray-100 dark:border-[#C6A45F]/10 p-4 space-y-5">

            {[
              {
                date: 'May 2025',
                label: 'Client Profile Upgrades',
                color: 'bg-emerald-500',
                items: [
                  'Clients can upload a profile photo — tap their avatar in the Profile tab',
                  'Clients can edit their display name inline — the change reflects in the app header immediately',
                  'New ⓘ info button on the profile hero card opens a "What\'s in your app" features panel',
                ]
              },
              {
                date: 'May 2025',
                label: 'Workout Session Redesign',
                color: 'bg-teal-500',
                items: [
                  'Weight and reps fields are now correctly sized — weight is fixed-width, reps is larger',
                  'Rest controls replaced with Off / 30s / 60s / 90s preset buttons — one tap to set',
                  'Colored section chips (amber warmup, emerald work, teal cooldown) visible on every exercise card',
                  'Circular progress ring on each exercise card shows set completion at a glance',
                  'Frosted glass sticky header with live timer and overall progress percentage',
                ]
              },
              {
                date: 'May 2025',
                label: 'Workout Builder Power Tools',
                color: 'bg-orange-500',
                items: [
                  '500+ exercise autocomplete — tap Add, search by name or filter by muscle group',
                  'Quick scheme presets: tap 3×8, 5×5, 4×12, etc. to fill sets and reps instantly',
                  'Superset pairing — expand any exercise and use the Superset dropdown to link it with another',
                  'Equipment picker per exercise: Barbell/Machine, 1 Dumbbell, 2 Dumbbells (auto-calculates ×2 volume)',
                ]
              },
              {
                date: 'May 2025',
                label: 'Inquiries Panel',
                color: 'bg-blue-500',
                items: [
                  'Contact form on the public landing page captures name, email, and message',
                  'New Inquiries tab in your admin panel — view, manage, and mark leads as reviewed',
                ]
              },
              {
                date: 'May 2025',
                label: 'Visual & UX Polish',
                color: 'bg-purple-500',
                items: [
                  'Floating pill navigation bar — active tab highlighted with emerald gradient',
                  'Press animations on every button — subtle scale-down on tap for native app feel',
                  'Shimmer loading skeletons on all data-heavy screens',
                  'Card shadows, gradient header text, and color palette unified across the app',
                ]
              },
            ].map(({ date, label, color, items }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                  <span className="text-xs font-bold text-gray-900 dark:text-[#d8e7de]">{label}</span>
                  <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40 ml-auto">{date}</span>
                </div>
                <ul className="space-y-1.5 pl-4">
                  {items.map((item, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-[#d8e7de]/65 leading-snug flex gap-2">
                      <span className="text-gray-300 dark:text-[#d8e7de]/25 flex-shrink-0 mt-0.5">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation cards */}
      <div>
        <div className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wide px-1 mb-2">
          Jump To
        </div>
        <div className="space-y-2.5">
          <NavCard
            gradient="from-yellow-400 to-orange-500"
            icon={<Dumbbell className="w-6 h-6" />}
            title="Workout Builder"
            description="Build reusable workout templates with exercises, sets, reps, and rest timers."
            onClick={() => onNavigate('workout-days')}
          />
          <NavCard
            gradient="from-emerald-500 to-teal-500"
            icon={<Layers className="w-6 h-6" />}
            title="Programs"
            description="Combine workout days into multi-phase training programs."
            onClick={() => onNavigate('programs')}
          />
          <NavCard
            gradient="from-blue-500 to-indigo-500"
            icon={<Users className="w-6 h-6" />}
            title="Clients"
            description="Add clients, assign programs, and preview their experience."
            onClick={() => onNavigate('clients')}
          />
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'howto' ? null : 'howto')}
          className="w-full px-5 py-4 flex items-center justify-between text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[56px]"
        >
          <div>
            <div className="font-bold text-gray-900 dark:text-[#d8e7de] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              How It Works
            </div>
            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">Your full workflow, step by step</div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'howto' ? 'rotate-90' : ''}`} />
        </button>

        {expandedSection === 'howto' && (
          <div className="border-t border-gray-100 dark:border-[#C6A45F]/10 divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
            {[
              { step: 1, label: 'Build Workouts', detail: 'Go to Workout Builder and create each training session — Push Day, Leg Day, Full Body, whatever you need. Add exercises with sets, reps, recommended weight, and coaching notes. Build once, reuse everywhere.', icon: <Dumbbell className="w-4 h-4" />, color: 'bg-yellow-500' },
              { step: 2, label: 'Build a Program', detail: 'Head to Programs. A program groups your workout days into phases — each with a set duration and weekly frequency. For example: Phase 1 (Foundation) = 4 weeks × 3 days/week. Phase 2 (Progression) = 6 weeks × 4 days/week.', icon: <Layers className="w-4 h-4" />, color: 'bg-emerald-500' },
              { step: 3, label: 'Add Your Client', detail: "Go to Clients and tap Add Client. Enter their name and email. Send them the app link and ask them to sign up with that exact email — they'll automatically be set up as a client with the right role.", icon: <Users className="w-4 h-4" />, color: 'bg-blue-500' },
              { step: 4, label: 'Assign the Program', detail: "On their client card, tap Assign Program. Select the program, choose a start date, and set their weekly schedule — which days they'll train each week. They can always rearrange this themselves.", icon: <CalendarDays className="w-4 h-4" />, color: 'bg-purple-500' },
              { step: 5, label: 'Client Trains', detail: "Your client opens the app and sees their full week — rest days, upcoming workouts, and today's session. They tap Start and get guided set-by-set with their recommended weights and rest timers. Everything saves automatically.", icon: <Play className="w-4 h-4" />, color: 'bg-pink-500' },
              { step: 6, label: 'Adjust as They Progress', detail: "Tap the eye icon on any client card to open their full detail view — see their program progress, strength charts, body weight trend, personal records, and complete workout history including session notes. Reassign programs or build new ones from the admin tabs.", icon: <TrendingUp className="w-4 h-4" />, color: 'bg-orange-500' },
            ].map(({ step, label, detail, icon, color }) => (
              <div key={step} className="flex items-start gap-3 p-4">
                <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm mb-0.5">
                    <span className="text-gray-400 dark:text-[#d8e7de]/40 font-normal">Step {step} — </span>
                    {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 leading-relaxed">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client experience */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'client' ? null : 'client')}
          className="w-full px-5 py-4 flex items-center justify-between text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[56px]"
        >
          <div>
            <div className="font-bold text-gray-900 dark:text-[#d8e7de] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              What Your Clients Experience
            </div>
            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">Their workout journey, from login to celebration</div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'client' ? 'rotate-90' : ''}`} />
        </button>

        {expandedSection === 'client' && (
          <div className="border-t border-gray-100 dark:border-[#C6A45F]/10 p-4 space-y-3">
            {[
              { icon: CalendarDays, title: 'Weekly view on login', desc: "They see exactly which days they train and which are rest days. Today's workout is always highlighted with a Start button." },
              { icon: Play, title: 'Guided workout sessions', desc: 'Exercises are expanded one at a time. They log weight and reps for each set, with your recommended values pre-filled.' },
              { icon: Clock, title: 'Rest timers between sets', desc: 'If you set a rest period, a countdown appears automatically after each set. They can skip it if they feel ready.' },
              { icon: TrendingUp, title: 'Last session reference', desc: "They can see what weight they used last time for every exercise — no more guessing. One tap fills it in automatically." },
              { icon: Trophy, title: 'Post-workout celebration', desc: 'Confetti, stats, and achievements appear when they finish. They rate the difficulty and can leave a session note so nothing gets forgotten.' },
              { icon: SlidersHorizontal, title: 'Flexible schedule', desc: 'They can rearrange which days they train each week without changing their program — life happens.' },
              { icon: TrendingUp, title: 'Body weight tracking', desc: 'They can log their weight right from their profile. You can see their full weight trend in the client detail view.' },
              { icon: Users, title: 'Editable profile & photo', desc: 'They can tap their avatar to upload a profile photo and edit their display name — changes reflect everywhere in the app instantly.' },
              { icon: Sparkles, title: 'App features panel', desc: 'A small ⓘ button on their profile opens a full list of everything the app offers, so they always know what tools are available to them.' },
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
        )}
      </div>

      {/* Feature checklist */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-5">
        <div className="font-bold text-gray-900 dark:text-[#d8e7de] mb-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          Everything That's Built In
        </div>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
          {[
            'Workout builder',
            '500+ exercise autocomplete',
            'Muscle group filter chips',
            'Quick set/rep scheme presets',
            'Superset pairing',
            'Equipment picker (barbell / dumbbells)',
            'Multi-phase programs',
            'Phase auto-advancement',
            'Client management',
            'Program assignment',
            'Weekly schedule view',
            'Rest preset buttons (Off/30/60/90s)',
            'Live workout sessions',
            'Colored section chips (warmup/work/cooldown)',
            'Per-exercise progress ring',
            'Session notes',
            'Last session reference',
            'Workout history',
            'Strength progress charts',
            'Body weight tracking',
            'Personal records podium',
            'Streak tracking',
            'Client detail view',
            'Client progress & history',
            'Workout rating',
            'Schedule adjustment',
            'Profile photo upload',
            'Editable display name',
            'App features info panel (clients)',
            'Inquiry form + admin panel',
            'Floating pill navigation',
            'Shimmer loading skeletons',
            'Dark mode',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-[#d8e7de]/70">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Personal message */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-pink-200 animate-pulse" />
          <span className="font-bold text-base">Built Just for You, Babe</span>
        </div>
        <p className="text-emerald-100 text-sm leading-relaxed mb-3">
          This platform was designed and built exclusively for you — a place where your passion for fitness, your care for clients, and your expertise all come together in one beautiful system.
        </p>
        <p className="text-emerald-100 text-sm leading-relaxed mb-3">
          You are not just another trainer, and your clients deserve more than a generic app. This isn't a generic app. It's handcrafted, one of a kind — built to reflect your approach, your standards, and your passion for helping others flourish.
        </p>
        <p className="text-emerald-100 text-sm leading-relaxed">
          Tell me when something doesn't make sense and I'll fix it. I need your help to keep adding things that work for you. This will only get better. 💚
        </p>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div>
            <p className="font-bold">I love you!</p>
            <p className="text-emerald-200 text-sm">— John</p>
          </div>
          <Heart className="w-8 h-8 text-pink-200/60" />
        </div>
      </div>
    </div>
  );
}

function OverviewChip({ value, label, color }) {
  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-3 text-center border border-gray-200 dark:border-[#C6A45F]/25">
      <div className={`text-2xl font-bold ${textColors[color] || textColors.blue}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

function NavCard({ gradient, icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-4 text-left flex items-center gap-4 active:bg-gray-50 dark:active:bg-[#0a0a0a]/20 min-h-[80px]"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{title}</div>
        <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-0.5 leading-snug">{description}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-[#d8e7de]/30 flex-shrink-0" />
    </button>
  );
}
