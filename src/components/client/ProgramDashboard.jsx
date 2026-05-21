import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, update } from 'firebase/database';
import { db } from '../../firebase';
import { Play, CheckCircle, Layers, CalendarDays, ChevronRight, SlidersHorizontal, Dumbbell, Eye, X } from 'lucide-react';
import ScheduleAdjustModal from './ScheduleAdjustModal';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getThisWeek() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return DAY_NAMES.map((name, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      name,
      date,
      dateStr: date.toISOString().split('T')[0],
      isToday: date.toDateString() === today.toDateString(),
      isPast: date < today && date.toDateString() !== today.toDateString(),
    };
  });
}

function getNextWeek() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + 7);
  monday.setHours(0, 0, 0, 0);
  return DAY_NAMES.map((name, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      name,
      date,
      dateStr: date.toISOString().split('T')[0],
      isToday: false,
      isPast: false,
    };
  });
}

function computeWeekNumber(startDate, durationWeeks) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
  return Math.min(Math.max(1, Math.floor(daysElapsed / 7) + 1), durationWeeks);
}

export default function ProgramDashboard({ user, onStartWorkout, readOnly = false }) {
  const [assignment, setAssignment] = useState(null);
  const [program, setProgram] = useState(null);
  const [directSchedule, setDirectSchedule] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showNextWeek, setShowNextWeek] = useState(false);
  const [previewWorkout, setPreviewWorkout] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const assignSnap = await get(dbRef(db, `programAssignments/${user.uid}`));
      if (!assignSnap.exists()) {
        const [schedSnap, historySnap] = await Promise.all([
          get(dbRef(db, `clientSchedules/${user.uid}`)),
          get(dbRef(db, `workout-history/${user.uid}`)),
        ]);
        if (schedSnap.exists()) {
          setDirectSchedule(schedSnap.val());
          if (historySnap.exists()) {
            setWorkoutHistory(Object.values(historySnap.val()).filter(h => h.completed));
          }
        }
        setLoading(false);
        return;
      }

      let assign = assignSnap.val();

      const [programSnap, historySnap] = await Promise.all([
        get(dbRef(db, `programs/${assign.programId}`)),
        get(dbRef(db, `workout-history/${user.uid}`)),
      ]);

      // Phase auto-advancement (skip when admin is previewing)
      if (!readOnly && programSnap.exists()) {
        const prog = programSnap.val();
        const phases = prog.phases
          ? (Array.isArray(prog.phases) ? prog.phases : Object.values(prog.phases))
          : [];
        const currentPhaseIdx = assign.currentPhase ?? 0;
        const currentPhaseData = phases[currentPhaseIdx];
        if (currentPhaseData && assign.startDate) {
          const start = new Date(assign.startDate);
          start.setHours(0, 0, 0, 0);
          const daysElapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
          const rawWeek = Math.max(1, Math.floor(daysElapsed / 7) + 1);
          if (rawWeek > (currentPhaseData.durationWeeks || 1) && currentPhaseIdx + 1 < phases.length) {
            const today = new Date().toISOString().split('T')[0];
            await update(dbRef(db, `programAssignments/${user.uid}`), {
              currentPhase: currentPhaseIdx + 1,
              startDate: today,
              weeklySchedule: {},
            });
            assign = { ...assign, currentPhase: currentPhaseIdx + 1, startDate: today, weeklySchedule: {} };
          }
        }
      }

      setAssignment(assign);
      setWeeklySchedule(assign.weeklySchedule || {});
      if (programSnap.exists()) setProgram(programSnap.val());

      if (historySnap.exists()) {
        const all = Object.values(historySnap.val()).filter(h => h.completed);
        setWorkoutHistory(all);
      }
    } catch (err) {
      console.error('Error loading program data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (workoutId) => {
    setPreviewLoading(true);
    setPreviewWorkout({ loading: true });
    try {
      const snap = await get(dbRef(db, `workouts/${workoutId}`));
      if (snap.exists()) setPreviewWorkout({ id: workoutId, ...snap.val() });
      else setPreviewWorkout(null);
    } catch (err) {
      console.error('Error loading workout preview:', err);
      setPreviewWorkout(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ─── Computed values ───────────────────────────────────────────────────────

  const phase = program?.phases?.[assignment?.currentPhase ?? 0] ?? null;

  const weekNumber = assignment && phase
    ? computeWeekNumber(assignment.startDate, phase.durationWeeks)
    : 1;

  const phaseProgress = phase ? Math.round((weekNumber / phase.durationWeeks) * 100) : 0;

  const phaseDaysArray = phase?.days
    ? (Array.isArray(phase.days) ? phase.days : Object.values(phase.days))
    : [];

  const buildWeekDays = (weekBase) =>
    weekBase.map(day => {
      const dayId = weeklySchedule[day.name] || null;
      const phaseDay = dayId ? phaseDaysArray.find(d => d.id === dayId) : null;
      const isCompleted = phaseDay?.workoutId
        ? workoutHistory.some(h =>
            h.workoutId === phaseDay.workoutId &&
            new Date(h.startTime).toISOString().split('T')[0] === day.dateStr
          )
        : false;
      return {
        ...day,
        dayId,
        workoutId: phaseDay?.workoutId ?? null,
        workoutName: phaseDay?.workoutName ?? null,
        dayLabel: phaseDay?.label ?? null,
        isRest: !phaseDay,
        isCompleted,
      };
    });

  const weekDays = buildWeekDays(getThisWeek());
  const nextWeekDays = buildWeekDays(getNextWeek());

  const displayDays = showNextWeek ? nextWeekDays : weekDays;

  const todayDay = weekDays.find(d => d.isToday);
  const completedCount = weekDays.filter(d => d.isCompleted).length;
  const workoutDaysCount = weekDays.filter(d => !d.isRest).length;

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl skeleton h-28" />
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl skeleton h-20" />
        ))}
      </div>
    );
  }

  // ─── No program — check direct schedule ───────────────────────────────────
  if (!assignment || !program) {
    if (directSchedule) {
      return (
        <DirectScheduleView
          directSchedule={directSchedule}
          workoutHistory={workoutHistory}
          onStartWorkout={onStartWorkout}
          readOnly={readOnly}
        />
      );
    }
    return (
      <div className="space-y-5">
        <div className="hero-gradient rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold">This Week</h2>
          <p className="text-emerald-100 text-sm mt-1">Your weekly workouts will appear here</p>
        </div>
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <Dumbbell className="w-14 h-14 mx-auto text-gray-300 dark:text-[#d8e7de]/20 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-[#d8e7de] mb-2">No Program Assigned Yet</h3>
          <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
            Your trainer hasn't assigned a program yet. Check back soon or reach out to them.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6 content-enter">

      {/* Program header / progress card */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-lg shadow-emerald-900/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 opacity-80" />
              <span className="text-sm font-semibold opacity-80 truncate">{assignment.programName}</span>
            </div>
            <h2 className="text-xl font-bold">{phase?.name ?? 'Current Phase'}</h2>
            <p className="text-emerald-100 text-sm mt-0.5">
              Week {weekNumber} of {phase?.durationWeeks ?? '?'} · {workoutDaysCount}× per week
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold">{completedCount}/{workoutDaysCount}</div>
            <div className="text-xs text-emerald-200">done this week</div>
          </div>
        </div>

        {/* Phase progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
            <span>Phase progress</span>
            <span>{phaseProgress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's quick-start */}
      {todayDay && !todayDay.isRest && !todayDay.isCompleted && !readOnly && (
        <button
          onClick={() => onStartWorkout(todayDay.workoutId)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-md active:opacity-90 min-h-[72px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">Start Today's Workout</div>
              <div className="text-sm text-emerald-100">{todayDay.dayLabel} · {todayDay.workoutName}</div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 opacity-70 flex-shrink-0" />
        </button>
      )}

      {/* Week schedule */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/20">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center justify-between gap-3">
          {/* This Week / Next Week toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setShowNextWeek(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition min-h-[36px] ${
                !showNextWeek
                  ? 'bg-white dark:bg-[#1E3328] text-gray-900 dark:text-[#d8e7de] shadow-sm'
                  : 'text-gray-500 dark:text-[#d8e7de]/50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setShowNextWeek(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition min-h-[36px] ${
                showNextWeek
                  ? 'bg-white dark:bg-[#1E3328] text-gray-900 dark:text-[#d8e7de] shadow-sm'
                  : 'text-gray-500 dark:text-[#d8e7de]/50'
              }`}
            >
              Next Week
            </button>
          </div>

          {!readOnly && (
            <button
              onClick={() => setShowAdjust(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 py-2 px-3 rounded-lg active:bg-emerald-50 dark:active:bg-emerald-900/20 min-h-[44px] flex-shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Adjust
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
          {displayDays.filter(d => !d.isRest).map(day => (
            <DayRow
              key={day.name}
              day={day}
              onStart={!showNextWeek && !readOnly ? () => onStartWorkout(day.workoutId) : undefined}
              onPreview={day.workoutId ? () => handlePreview(day.workoutId) : undefined}
              readOnly={readOnly}
            />
          ))}
          {displayDays.filter(d => !d.isRest).length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-[#d8e7de]/40">
              No workouts scheduled — tap Adjust to set your schedule.
            </div>
          )}
        </div>
      </div>

      {/* Schedule adjust modal */}
      {showAdjust && phase && (
        <ScheduleAdjustModal
          userId={user.uid}
          currentSchedule={weeklySchedule}
          availableDays={phaseDaysArray}
          onClose={() => setShowAdjust(false)}
          onSaved={(newSchedule) => {
            setWeeklySchedule(newSchedule);
            setAssignment(prev => ({ ...prev, weeklySchedule: newSchedule }));
          }}
        />
      )}

      {/* Workout preview modal */}
      {previewWorkout && (
        <WorkoutPreviewModal
          workout={previewWorkout}
          loading={previewLoading}
          onClose={() => setPreviewWorkout(null)}
          onStart={
            !readOnly && previewWorkout.id
              ? () => { setPreviewWorkout(null); onStartWorkout(previewWorkout.id); }
              : undefined
          }
        />
      )}
    </div>
  );
}

// ─── Day row ──────────────────────────────────────────────────────────────────

function DayRow({ day, onStart, onPreview, readOnly = false }) {
  const dayAbbr = day.name.slice(0, 3).toUpperCase();

  const EyeBtn = () => onPreview ? (
    <button
      onClick={onPreview}
      className="p-2.5 rounded-xl text-gray-400 dark:text-[#d8e7de]/40 active:bg-gray-100 dark:active:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
    >
      <Eye className="w-4 h-4" />
    </button>
  ) : null;

  // Today + workout available
  if (day.isToday && !day.isRest) {
    if (day.isCompleted) {
      return (
        <div className="px-4 py-3.5 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10">
          <div className="w-10 text-center flex-shrink-0">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{dayAbbr}</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{day.date.getDate()}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">{day.workoutName}</div>
            <div className="text-xs text-emerald-500 dark:text-emerald-500/80">{day.dayLabel}</div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <EyeBtn />
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Done</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-3.5 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10">
        <div className="w-10 text-center flex-shrink-0">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{dayAbbr}</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{day.date.getDate()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-emerald-700 dark:text-emerald-300 truncate">{day.workoutName}</div>
          <div className="text-xs text-emerald-500 dark:text-emerald-500/80">{day.dayLabel} · Today</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <EyeBtn />
          {readOnly ? (
            <span className="text-xs text-violet-400 font-semibold">Preview</span>
          ) : onStart ? (
            <button
              onClick={onStart}
              className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 min-h-[44px]"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // Rest day
  if (day.isRest) {
    return (
      <div className={`px-4 py-3.5 flex items-center gap-3 ${day.isToday ? 'bg-gray-50 dark:bg-[#0a0a0a]/20' : ''}`}>
        <div className="w-10 text-center flex-shrink-0">
          <div className={`text-xs font-bold ${day.isToday ? 'text-gray-500 dark:text-[#d8e7de]/60' : 'text-gray-300 dark:text-[#d8e7de]/30'}`}>{dayAbbr}</div>
          <div className={`text-lg font-bold ${day.isToday ? 'text-gray-600 dark:text-[#d8e7de]/70' : 'text-gray-300 dark:text-[#d8e7de]/30'}`}>{day.date.getDate()}</div>
        </div>
        <div className={`text-sm ${day.isToday ? 'text-gray-500 dark:text-[#d8e7de]/60 font-medium' : 'text-gray-300 dark:text-[#d8e7de]/30'}`}>
          Rest{day.isToday ? ' — Take it easy today' : ''}
        </div>
      </div>
    );
  }

  // Completed workout
  if (day.isCompleted) {
    return (
      <div className="px-4 py-3.5 flex items-center gap-3">
        <div className="w-10 text-center flex-shrink-0">
          <div className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40">{dayAbbr}</div>
          <div className="text-lg font-bold text-gray-400 dark:text-[#d8e7de]/40">{day.date.getDate()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-500 dark:text-[#d8e7de]/50 truncate line-through">{day.workoutName}</div>
          <div className="text-xs text-gray-400 dark:text-[#d8e7de]/30">{day.dayLabel}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <EyeBtn />
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    );
  }

  // Upcoming workout (future or past-missed)
  const isFuture = !day.isPast;
  return (
    <div className={`px-4 py-3.5 flex items-center gap-3 ${day.isPast ? 'opacity-50' : ''}`}>
      <div className="w-10 text-center flex-shrink-0">
        <div className={`text-xs font-bold ${isFuture ? 'text-gray-500 dark:text-[#d8e7de]/60' : 'text-gray-300 dark:text-[#d8e7de]/30'}`}>{dayAbbr}</div>
        <div className={`text-lg font-bold ${isFuture ? 'text-gray-700 dark:text-[#d8e7de]/80' : 'text-gray-300 dark:text-[#d8e7de]/30'}`}>{day.date.getDate()}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate ${isFuture ? 'text-gray-800 dark:text-[#d8e7de]' : 'text-gray-400 dark:text-[#d8e7de]/40'}`}>
          {day.workoutName}
        </div>
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{day.dayLabel}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <EyeBtn />
        {isFuture && !readOnly && onStart && (
          <button
            onClick={onStart}
            className="px-3.5 py-2 border border-gray-200 dark:border-[#C6A45F]/25 text-gray-600 dark:text-[#d8e7de]/70 rounded-xl font-semibold text-sm min-h-[44px]"
          >
            Start Early
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Workout preview modal ─────────────────────────────────────────────────────

function WorkoutPreviewModal({ workout, loading, onClose, onStart }) {
  const exercises = workout.exercises || [];

  const getSectionStyle = (section) => {
    if (section === 'warmup') return { chip: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: '🔥' };
    if (section === 'work')   return { chip: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: '💪' };
    return { chip: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', icon: '🧘' };
  };

  const formatScheme = (ex) => {
    if (ex.useDuration) {
      const dur = ex.durationMinutes > 0
        ? `${ex.durationMinutes}m ${ex.durationSeconds > 0 ? ex.durationSeconds + 's' : ''}`.trim()
        : `${ex.durationSeconds}s`;
      return `${ex.sets} set${ex.sets !== 1 ? 's' : ''} · ${dur}`;
    }
    const repStr = ex.reps != null ? String(ex.reps) : '—';
    const wt = ex.recommendedWeight > 0
      ? ` · ${ex.recommendedWeight}${ex.dumbbells === 2 ? ' lbs ea.' : ' lbs'}`
      : '';
    return `${ex.sets} set${ex.sets !== 1 ? 's' : ''} · ${repStr} reps${wt}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
      <div
        className="w-full bg-white dark:bg-[#1E3328] rounded-t-3xl flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-lg text-gray-900 dark:text-[#d8e7de] truncate">
              {loading ? 'Loading…' : workout.name}
            </h3>
            {!loading && (
              <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
          </button>
        </div>

        {/* Exercise list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl skeleton h-16" />
            ))
          ) : exercises.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-[#d8e7de]/40 py-8">No exercises found.</p>
          ) : (
            exercises.map((ex, i) => {
              const style = getSectionStyle(ex.section);
              return (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-white/[0.03] rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${style.chip}`}>
                        {style.icon} {ex.section}
                      </span>
                      {ex.supersetGroupId && (
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">SS</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-[#d8e7de] text-sm leading-tight">{ex.name}</div>
                    <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">{formatScheme(ex)}</div>
                    {ex.notes ? (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic leading-snug">{ex.notes}</div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Start button */}
        {onStart && !loading && (
          <div className="px-4 pb-6 pt-3 border-t border-gray-100 dark:border-[#C6A45F]/15 flex-shrink-0">
            <button
              onClick={onStart}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 min-h-[56px] shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-5 h-5" />
              Start Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Direct schedule view (no program) ────────────────────────────────────────

function DirectScheduleView({ directSchedule, workoutHistory, onStartWorkout, readOnly }) {
  const [previewWorkout, setPreviewWorkout] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreview = async (workoutId) => {
    setPreviewLoading(true);
    setPreviewWorkout({ loading: true });
    try {
      const snap = await get(dbRef(db, `workouts/${workoutId}`));
      if (snap.exists()) setPreviewWorkout({ id: workoutId, ...snap.val() });
      else setPreviewWorkout(null);
    } catch (err) {
      console.error('Error loading workout preview:', err);
      setPreviewWorkout(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const weekDays = getThisWeek().map(day => {
    const entry = directSchedule[day.name] || null;
    const isCompleted = entry?.workoutId
      ? workoutHistory.some(h =>
          h.workoutId === entry.workoutId &&
          new Date(h.startTime).toISOString().split('T')[0] === day.dateStr
        )
      : false;
    return {
      ...day,
      workoutId: entry?.workoutId ?? null,
      workoutName: entry?.workoutName ?? null,
      dayLabel: null,
      isRest: !entry,
      isCompleted,
    };
  });

  const todayDay = weekDays.find(d => d.isToday);
  const completedCount = weekDays.filter(d => d.isCompleted).length;
  const workoutDaysCount = weekDays.filter(d => !d.isRest).length;

  return (
    <div className="space-y-4 pb-6 content-enter">
      {/* Header */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-lg shadow-emerald-900/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">This Week</h2>
            <p className="text-emerald-100 text-sm mt-0.5">
              {workoutDaysCount} workout{workoutDaysCount !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold">{completedCount}/{workoutDaysCount}</div>
            <div className="text-xs text-emerald-200">done this week</div>
          </div>
        </div>
      </div>

      {/* Today's quick-start */}
      {todayDay && !todayDay.isRest && !todayDay.isCompleted && !readOnly && (
        <button
          onClick={() => onStartWorkout(todayDay.workoutId)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-md active:opacity-90 min-h-[72px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">Start Today's Workout</div>
              <div className="text-sm text-emerald-100">{todayDay.workoutName}</div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 opacity-70 flex-shrink-0" />
        </button>
      )}

      {/* Week schedule */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/20">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#C6A45F]/15">
          <span className="text-sm font-bold text-gray-700 dark:text-[#d8e7de]/80">Your Schedule</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
          {weekDays.filter(d => !d.isRest).map(day => (
            <DayRow
              key={day.name}
              day={day}
              onStart={!readOnly ? () => onStartWorkout(day.workoutId) : undefined}
              onPreview={day.workoutId ? () => handlePreview(day.workoutId) : undefined}
              readOnly={readOnly}
            />
          ))}
          {workoutDaysCount === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-[#d8e7de]/40">
              No workouts scheduled this week.
            </div>
          )}
        </div>
      </div>

      {/* Workout preview modal */}
      {previewWorkout && (
        <WorkoutPreviewModal
          workout={previewWorkout}
          loading={previewLoading}
          onClose={() => setPreviewWorkout(null)}
          onStart={
            !readOnly && previewWorkout.id
              ? () => { setPreviewWorkout(null); onStartWorkout(previewWorkout.id); }
              : undefined
          }
        />
      )}
    </div>
  );
}
