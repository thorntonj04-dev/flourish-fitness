import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Dumbbell, Layers, Users, CalendarDays, Play, SlidersHorizontal, Trophy, Heart, Check } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    icon: Heart,
    iconBg: 'from-pink-500 to-rose-500',
    title: 'Welcome to Flourish Fitness! 💪',
    subtitle: 'Your personal training command center',
    body: [
      "This app is built to make running your personal training business effortless. Everything your clients need is handled right here — from their workout programs to their weekly schedules.",
      "This walkthrough will take you through the whole system in about 2 minutes. By the end, you'll know exactly how to set up a client from scratch.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-5 space-y-3">
        {[
          { icon: Dumbbell, label: 'Build Workouts', color: 'text-yellow-300' },
          { icon: Layers, label: 'Create Programs', color: 'text-emerald-300' },
          { icon: Users, label: 'Manage Clients', color: 'text-blue-300' },
          { icon: CalendarDays, label: 'Clients See Their Week', color: 'text-purple-300' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className="font-medium text-sm">{label}</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'workouts',
    icon: Dumbbell,
    iconBg: 'from-yellow-400 to-orange-500',
    title: 'Step 1 — Build Your Workouts',
    subtitle: 'Create the individual training days',
    body: [
      "Tap the Workouts tab in the bottom nav. This is where you build each individual training session — Push Day, Leg Day, Upper Body, whatever you need.",
      "Each workout is a reusable template. Build it once, then use it across as many programs and clients as you want. Add exercises from the library, set recommended weights, reps, and include coaching notes your clients will see during the session.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-4 space-y-2.5">
        <div className="text-white/70 text-xs font-bold uppercase tracking-wide mb-3">Example Workout</div>
        {[
          { section: '🔥', name: 'Treadmill Warmup', detail: '1 set · 5 min' },
          { section: '💪', name: 'Barbell Squat', detail: '4 sets · 8 reps · 135 lbs' },
          { section: '💪', name: 'Romanian Deadlift', detail: '3 sets · 10 reps · 95 lbs' },
          { section: '💪', name: 'Leg Press', detail: '3 sets · 12 reps' },
          { section: '🧘', name: 'Hamstring Stretch', detail: '1 set · 30 sec' },
        ].map((ex) => (
          <div key={ex.name} className="flex items-center gap-2.5">
            <span className="text-base w-6 text-center flex-shrink-0">{ex.section}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{ex.name}</div>
              <div className="text-white/60 text-xs">{ex.detail}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'programs',
    icon: Layers,
    iconBg: 'from-emerald-500 to-teal-500',
    title: 'Step 2 — Build a Program',
    subtitle: 'Combine workouts into a multi-phase plan',
    body: [
      "Tap Programs in the nav. A program is your full training plan — it can have multiple phases, each with a set duration and weekly frequency.",
      "For example: Phase 1 (Foundation) could be 4 weeks, 3x per week. Phase 2 (Progression) could be 6 weeks, 4x per week. Each phase gets its own set of workout days pulled from the workouts you already built.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-4 space-y-3">
        <div className="text-white font-bold text-sm">12-Week Strength Program</div>
        {[
          { phase: 'Phase 1', name: 'Foundation', detail: '4 weeks · 3× per week', days: ['Leg Day', 'Push Day', 'Pull Day'], color: 'bg-yellow-400/20 border-yellow-400/40' },
          { phase: 'Phase 2', name: 'Progression', detail: '8 weeks · 4× per week', days: ['Leg Day', 'Push Day', 'Pull Day', 'Full Body'], color: 'bg-emerald-400/20 border-emerald-400/40' },
        ].map((phase) => (
          <div key={phase.phase} className={`rounded-xl border p-3 ${phase.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">{phase.phase}: {phase.name}</span>
              <span className="text-white/60 text-xs">{phase.detail}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phase.days.map(d => (
                <span key={d} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{d}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'clients',
    icon: Users,
    iconBg: 'from-blue-500 to-indigo-500',
    title: 'Step 3 — Assign to a Client',
    subtitle: 'Connect the program to a real person',
    body: [
      "Head to the Clients tab. Every client who creates an account with a client role will appear here automatically. You'll see their name, email, and current program status at a glance.",
      "Tap Assign Program on any client card. Choose the program, set a start date, and configure their weekly schedule — which days of the week they'll train. Your client can always rearrange this themselves later.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-4 space-y-3">
        {[
          { name: 'Sarah M.', program: '12-Week Strength', phase: 'Phase 1 · Week 2/4', status: 'active' },
          { name: 'Jessica K.', program: 'No program yet', phase: null, status: 'none' },
        ].map((client) => (
          <div key={client.name} className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {client.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{client.name}</div>
                <div className={`text-xs mt-0.5 ${client.status === 'active' ? 'text-emerald-300' : 'text-white/50'}`}>
                  {client.program}
                </div>
                {client.phase && <div className="text-white/50 text-xs">{client.phase}</div>}
              </div>
              <div className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                client.status === 'active' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-white/50'
              }`}>
                {client.status === 'active' ? 'Active' : 'Assign'}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'schedule',
    icon: CalendarDays,
    iconBg: 'from-purple-500 to-violet-500',
    title: 'Step 4 — Client Gets Their Week',
    subtitle: 'This is what they see when they log in',
    body: [
      "The moment you assign a program, your client can log in and see their full week laid out — which days have workouts, which are rest days, and exactly what workout is coming up.",
      "Today's workout is always highlighted with a big Start button. Completed sessions get a green checkmark. If their schedule doesn't fit their week, they can tap Adjust to rearrange which days they train.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-4 space-y-2">
        {[
          { day: 'MON', workout: 'Leg Day', state: 'done' },
          { day: 'TUE', workout: 'Rest', state: 'rest' },
          { day: 'WED', workout: 'Push Day', state: 'today' },
          { day: 'THU', workout: 'Rest', state: 'rest' },
          { day: 'FRI', workout: 'Pull Day', state: 'upcoming' },
          { day: 'SAT', workout: 'Rest', state: 'rest' },
          { day: 'SUN', workout: 'Rest', state: 'rest' },
        ].map((row) => (
          <div key={row.day} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${row.state === 'today' ? 'bg-white/20' : ''}`}>
            <div className={`text-xs font-bold w-8 flex-shrink-0 ${row.state === 'rest' ? 'text-white/30' : 'text-white/70'}`}>{row.day}</div>
            <div className={`flex-1 text-sm font-medium ${row.state === 'rest' ? 'text-white/30' : 'text-white'}`}>{row.workout}</div>
            {row.state === 'done' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {row.state === 'today' && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-lg font-bold flex-shrink-0">START</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'session',
    icon: Play,
    iconBg: 'from-rose-500 to-pink-500',
    title: 'Step 5 — Inside the Workout',
    subtitle: 'Your clients are fully guided through every set',
    body: [
      "When a client taps Start, the full workout opens. Every exercise is listed with recommended weight and reps. They can see their last session's numbers as a reference and tap Use These to pre-fill them.",
      "They adjust weight and reps using big + / − buttons — easy to use even mid-workout with sweaty hands. When every set in an exercise is marked done, it turns green. A progress bar at the top shows how far they are.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl overflow-hidden">
        <div className="bg-white/10 px-4 py-3 flex items-center justify-between">
          <span className="text-white font-bold text-sm">Barbell Squat</span>
          <span className="text-white/60 text-xs">2/4 sets</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="bg-emerald-500/30 border border-emerald-400/40 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-white text-sm font-bold">Set 1</span>
            <span className="text-emerald-300 text-sm font-semibold">135 lbs × 8 reps ✓</span>
          </div>
          <div className="bg-emerald-500/30 border border-emerald-400/40 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-white text-sm font-bold">Set 2</span>
            <span className="text-emerald-300 text-sm font-semibold">135 lbs × 8 reps ✓</span>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-bold">Set 3</span>
              <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-lg">Mark Done</span>
            </div>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-white/50 text-xs mb-1">lbs</div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-bold">−</span>
                  <span className="text-white font-bold text-lg">135</span>
                  <span className="text-white/60 font-bold">+</span>
                </div>
              </div>
              <div>
                <div className="text-white/50 text-xs mb-1">reps</div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 font-bold">−</span>
                  <span className="text-white font-bold text-lg">8</span>
                  <span className="text-white/60 font-bold">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'flexibility',
    icon: SlidersHorizontal,
    iconBg: 'from-amber-400 to-orange-500',
    title: 'Step 6 — Staying Flexible',
    subtitle: 'You stay in control, clients stay on track',
    body: [
      "Life happens. Clients can tap Adjust on their week view to move workouts to different days — without changing their program. If they need a totally different program, you can reassign them in the Clients tab at any time.",
      "As they train, their session history builds automatically. You can see their progress, and the app remembers what weights they used last time so each workout gets smarter.",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-4 space-y-3">
        <div className="text-white/70 text-xs font-bold uppercase tracking-wide">Admin Controls</div>
        {[
          { action: 'Reassign program', detail: 'Swap a client to any program instantly', icon: Layers },
          { action: 'Change start date', detail: 'Shift when their phases begin', icon: CalendarDays },
          { action: 'Build new program', detail: 'Add phases as you evolve your system', icon: Dumbbell },
          { action: 'Preview workouts', detail: 'See exactly what your clients see', icon: Play },
        ].map(({ action, detail, icon: Icon }) => (
          <div key={action} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">{action}</div>
              <div className="text-white/60 text-xs">{detail}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'ready',
    icon: Trophy,
    iconBg: 'from-yellow-400 to-amber-500',
    title: "You're Ready! 🎉",
    subtitle: 'Go change lives',
    body: [
      "That's everything you need to run your training business through Flourish Fitness. Your clients get a professional, guided experience — and you get a system that keeps everyone organized and on track.",
      "This app was built with love, specifically for you. Every decision — from the big Start buttons to the weekly schedule view — was designed to make your job easier and your clients' results better. 💚",
    ],
    visual: (
      <div className="bg-white/10 rounded-2xl p-5">
        <div className="text-center mb-4">
          <div className="text-white/70 text-xs font-bold uppercase tracking-wide mb-3">The Full Workflow</div>
        </div>
        {[
          { step: '1', label: 'Build workouts in Workouts tab' },
          { step: '2', label: 'Combine into a program with phases' },
          { step: '3', label: 'Assign program to a client' },
          { step: '4', label: 'Client sees their week on login' },
          { step: '5', label: 'Client trains, data saves automatically' },
          { step: '6', label: 'Adjust & repeat as they progress' },
        ].map(({ step, label }) => (
          <div key={step} className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {step}
            </div>
            <span className="text-white text-sm">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function AppWalkthroughModal({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95 backdrop-blur-sm">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/60 active:text-white z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`rounded-full transition-all min-w-[8px] min-h-[8px] ${
              i === step ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-lg mx-auto space-y-5">

          {/* Icon + title */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${current.iconBg} mb-4 shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{current.title}</h2>
            <p className="text-sm text-white/60 mt-1">{current.subtitle}</p>
          </div>

          {/* Visual card */}
          <div className={`bg-gradient-to-br ${current.iconBg} rounded-2xl p-4`}>
            {current.visual}
          </div>

          {/* Body text */}
          <div className="space-y-3">
            {current.body.map((para, i) => (
              <p key={i} className="text-white/80 text-sm leading-relaxed">{para}</p>
            ))}
          </div>

          {/* Step counter */}
          <p className="text-center text-white/30 text-xs">
            Step {step + 1} of {STEPS.length}
          </p>

        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-5 pb-8 pt-4 border-t border-white/10 bg-gray-900/80 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-4 border border-white/20 text-white/70 rounded-2xl font-semibold min-h-[56px]"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={() => isLast ? onClose() : setStep(s => s + 1)}
          className={`flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 min-h-[56px] ${
            isLast
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
              : 'bg-white text-gray-900'
          }`}
        >
          {isLast ? (
            <>Let's go! <Heart className="w-5 h-5" /></>
          ) : (
            <>Next <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}
