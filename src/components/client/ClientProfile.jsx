import React, { useState, useEffect, useRef } from 'react';
import { ref as dbRef, get, set, push, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../../firebase';
import { Flame, Dumbbell, Trophy, TrendingUp, TrendingDown, Scale, Plus, X, Info, Edit2, Camera, Check, Send, Sparkles, Archive } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../../data/exerciseLibrary';
import { exerciseVolume, sessionVolume } from '../../utils/volume';
import { loadWorkoutSchedule, currentStreak } from '../../utils/streak';

const BODY_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'];
const GROUP_LABELS = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', legs: 'Legs' };
const NAME_TO_GROUP = EXERCISE_LIBRARY.reduce((map, ex) => { map[ex.name] = ex.group; return map; }, {});

function resolveGroup(exData) {
  return exData.muscleGroup || NAME_TO_GROUP[exData.exerciseName] || 'other';
}

function useCountUp(target, duration = 750) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!target) { setValue(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setValue(Math.round(target * eased));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const LEVELS = [
  { min: 0,   max: 4,        name: 'Rookie',   emoji: '🌱', color: 'from-slate-400 to-slate-500',      bar: 'bg-slate-400' },
  { min: 5,   max: 19,       name: 'Athlete',  emoji: '💪', color: 'from-blue-400 to-blue-600',        bar: 'bg-blue-400' },
  { min: 20,  max: 49,       name: 'Warrior',  emoji: '⚔️', color: 'from-emerald-400 to-teal-500',     bar: 'bg-emerald-400' },
  { min: 50,  max: 99,       name: 'Champion', emoji: '🏆', color: 'from-purple-400 to-violet-600',    bar: 'bg-purple-400' },
  { min: 100, max: Infinity, name: 'Legend',   emoji: '👑', color: 'from-yellow-400 to-orange-500',    bar: 'bg-yellow-400' },
];

function getLevel(n) { return LEVELS.find(l => n >= l.min && n <= l.max) || LEVELS[0]; }
function getLevelProgress(n) {
  const lvl = getLevel(n);
  const next = LEVELS.find(l => l.min > lvl.min);
  if (!next) return 100;
  return Math.min(100, Math.round(((n - lvl.min) / (next.min - lvl.min)) * 100));
}
function getNextLevelAt(n) {
  const lvl = getLevel(n);
  const next = LEVELS.find(l => l.min > lvl.min);
  return next ? next.min : null;
}

function getVolumeEquivalent(lbs) {
  if (lbs < 8000) return null;
  if (lbs < 80000) return { count: Math.round(lbs / 4000), thing: 'cars' };
  if (lbs < 400000) return { count: Math.round(lbs / 13000), thing: 'elephants' };
  return { count: Math.round(lbs / 30000), thing: 'school buses' };
}

const APP_FEATURES = [
  { icon: '📅', title: 'Your Program', desc: 'Structured, multi-phase programs built specifically for your goals by your trainer. Each phase adapts as you progress.' },
  { icon: '💪', title: 'Guided Workouts', desc: 'Step-by-step sessions with set, rep, and weight tracking. Rest timers and superset support built right in.' },
  { icon: '👁️', title: 'Workout Preview', desc: 'Tap the eye icon on any workout day to preview all exercises before you start — no commitment required.' },
  { icon: '📆', title: 'Next Week View', desc: 'Switch between This Week and Next Week on your dashboard to see what\'s coming up so you can plan ahead.' },
  { icon: '🗑️', title: 'Remove Exercises', desc: 'During a session, remove an exercise entirely by tapping minus on its last set — a confirmation keeps it accident-proof.' },
  { icon: '⏱️', title: 'Timed Sets', desc: 'Some exercises are done for time instead of reps. The duration is shown right on the set row so you always know how long to go.' },
  { icon: '↔️', title: 'Rep Ranges', desc: 'Your trainer can assign rep ranges like 8–12. Log the reps you actually completed each set.' },
  { icon: '📊', title: 'Workout History', desc: 'Every completed session is saved. Review past workouts, total volume, and see exactly how far you have come.' },
  { icon: '🏆', title: 'Personal Records', desc: 'Your heaviest lift per exercise is automatically tracked and displayed on a podium — gold, silver, and bronze.' },
  { icon: '⚖️', title: 'Body Weight Log', desc: 'Log your weight anytime and watch your trend over time with a visual chart.' },
  { icon: '🔥', title: 'Streak & Levels', desc: 'Build a streak by never missing a scheduled workout (rest days never count against you) and level up from Rookie all the way to Legend as your workout count grows.' },
  { icon: '📱', title: 'Home Screen App', desc: 'Add Flourish Fitness to your iPhone home screen for a full-screen experience — no browser chrome, just the app.' },
];

export default function ClientProfile({ user, onProfileUpdate }) {
  const [stats, setStats] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [savingMetric, setSavingMetric] = useState(false);

  // Info panel
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Feedback
  const [feedbackCategory, setFeedbackCategory] = useState('enhancement');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Start fresh (archive history)
  const [archives, setArchives] = useState([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Editable name
  const [loadedName, setLoadedName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Profile photo
  const [photoURL, setPhotoURL] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); loadArchives(); }, [user]);

  // Loaded separately so a missing/undeployed DB rule can't break the rest of the profile.
  const loadArchives = async () => {
    try {
      const snap = await get(dbRef(db, `workout-archives/${user.uid}`));
      const list = snap.exists()
        ? Object.entries(snap.val())
            .map(([id, a]) => ({ id, archivedAt: a.archivedAt, sessionCount: a.sessionCount || 0 }))
            .sort((a, b) => b.archivedAt - a.archivedAt)
        : [];
      setArchives(list);
    } catch (err) {
      console.error('Error loading archives:', err);
    }
  };

  // Moves workout history + stats into workout-archives/{uid}/{archiveId} in one atomic
  // write, so progress, PRs, streak and "last time" weights all start from zero.
  // A workout started in the last 24h that isn't finished is left in place so it can be resumed.
  const handleStartFresh = async () => {
    setArchiving(true);
    try {
      const [historySnap, statsSnap] = await Promise.all([
        get(dbRef(db, `workout-history/${user.uid}`)),
        get(dbRef(db, `user-stats/${user.uid}`)),
      ]);
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const toArchive = {};
      Object.entries(historySnap.val() || {}).forEach(([id, s]) => {
        if (s.completed || !s.startTime || s.startTime < cutoff) toArchive[id] = s;
      });
      const sessionCount = Object.values(toArchive).filter(s => s.completed).length;

      const archiveId = push(dbRef(db, `workout-archives/${user.uid}`)).key;
      const updates = {
        [`workout-archives/${user.uid}/${archiveId}`]: {
          archivedAt: Date.now(),
          sessionCount,
          history: toArchive,
          stats: statsSnap.val() || null,
        },
        [`user-stats/${user.uid}`]: null,
      };
      Object.keys(toArchive).forEach(id => { updates[`workout-history/${user.uid}/${id}`] = null; });
      await update(dbRef(db), updates);

      setConfirmArchive(false);
      setStats(null);
      setHistory([]);
      await Promise.all([loadData(), loadArchives()]);
    } catch (err) {
      console.error('Error archiving history:', err);
      alert('Could not archive your history. Please try again.');
    } finally {
      setArchiving(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [userSnap, statsSnap, historySnap, metricsSnap, workoutSchedule] = await Promise.all([
        get(dbRef(db, `users/${user.uid}`)),
        get(dbRef(db, `user-stats/${user.uid}`)),
        get(dbRef(db, `workout-history/${user.uid}`)),
        get(dbRef(db, `body-metrics/${user.uid}`)),
        loadWorkoutSchedule(user.uid),
      ]);
      setSchedule(workoutSchedule);
      if (userSnap.exists()) {
        const userData = userSnap.val();
        if (userData.name) setLoadedName(userData.name);
        if (userData.photoURL) setPhotoURL(userData.photoURL);
      }
      if (statsSnap.exists()) setStats(statsSnap.val());
      if (historySnap.exists()) {
        const sessions = Object.values(historySnap.val())
          .filter(s => s.completed)
          .sort((a, b) => b.startTime - a.startTime);
        setHistory(sessions);
      }
      if (metricsSnap.exists()) {
        const list = Object.entries(metricsSnap.val())
          .map(([id, m]) => ({ id, ...m }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setMetrics(list);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      await set(dbRef(db, `users/${user.uid}/name`), trimmed);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      setLoadedName(trimmed);
      setEditingName(false);
      onProfileUpdate?.(trimmed);
    } catch (err) {
      console.error('Error saving name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      await push(dbRef(db, 'app-feedback'), {
        userId: user.uid,
        userName: loadedName || user.email?.split('@')[0] || 'Client',
        category: feedbackCategory,
        message: feedbackText.trim(),
        createdAt: new Date().toISOString(),
        status: 'new',
      });
      setFeedbackText('');
      setFeedbackCategory('enhancement');
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 4000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Photo must be under 10 MB.');
      return;
    }
    setUploadingPhoto(true);
    setUploadError(null);
    try {
      const sRef = storageRef(storage, `profile-photos/${user.uid}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await set(dbRef(db, `users/${user.uid}/photoURL`), url);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
      }
      setPhotoURL(url);
    } catch (err) {
      console.error('Photo upload error:', err);
      const code = err?.code || '';
      if (code === 'storage/unauthorized') {
        setUploadError('Storage permission denied — Firebase Storage rules need to be published.');
      } else if (code === 'storage/unauthenticated') {
        setUploadError('Not signed in. Please sign out and back in, then try again.');
      } else if (code.startsWith('storage/')) {
        setUploadError(`Upload failed: ${code}`);
      } else {
        setUploadError(`Upload failed: ${err?.message || 'unknown error'}`);
      }
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getPersonalRecords = () => {
    const records = {};
    history.forEach(session => {
      if (!session.exercises) return;
      Object.values(session.exercises).forEach(ex => {
        if (!ex.exerciseName) return;
        (ex.sets || []).filter(s => s.completed && (s.weight || 0) > 0).forEach(s => {
          if (!records[ex.exerciseName] || s.weight > records[ex.exerciseName].weight) {
            records[ex.exerciseName] = { weight: s.weight, reps: s.reps, date: session.startTime };
          }
        });
      });
    });
    return Object.entries(records).sort(([, a], [, b]) => b.weight - a.weight).slice(0, 8);
  };

  const getTotalVolume = () => {
    let total = 0;
    history.forEach(session => {
      if (!session.exercises) return;
      total += sessionVolume(session.exercises);
    });
    return total;
  };

  const getGroupVolumes = () => {
    const totals = {};
    BODY_GROUPS.forEach(g => { totals[g] = 0; });
    history.forEach(session => {
      if (!session.exercises) return;
      Object.values(session.exercises).forEach(ex => {
        const group = resolveGroup(ex);
        if (!BODY_GROUPS.includes(group)) return;
        totals[group] += exerciseVolume(ex);
      });
    });
    return totals;
  };

  const getBalanceInsight = (groupVolumes) => {
    const entries = BODY_GROUPS.map(g => [g, groupVolumes[g] || 0]).filter(([, v]) => v > 0);
    if (entries.length < 2) return null;
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const [topGroup, topVol] = entries[0];
    const topPct = Math.round((topVol / total) * 100);
    const untrained = BODY_GROUPS.filter(g => !(groupVolumes[g] > 0));
    if (untrained.length > 0) {
      return {
        icon: '🧭',
        title: `${GROUP_LABELS[topGroup]} leads the way`,
        text: `${topPct}% of your total volume. You haven't logged any ${untrained.map(g => GROUP_LABELS[g]).join(' or ')} work yet — worth adding some.`,
      };
    }
    const [bottomGroup, bottomVol] = entries[entries.length - 1];
    if (topVol / bottomVol >= 2.5) {
      return {
        icon: '⚖️',
        title: `${GROUP_LABELS[topGroup]} vs ${GROUP_LABELS[bottomGroup]} imbalance`,
        text: `You've lifted ${Math.round(topVol / bottomVol)}x more for ${GROUP_LABELS[topGroup].toLowerCase()} than ${GROUP_LABELS[bottomGroup].toLowerCase()}. A little more balance can help avoid overuse issues.`,
      };
    }
    return {
      icon: '⚖️',
      title: 'Well-balanced training',
      text: `${GROUP_LABELS[topGroup]} leads at ${topPct}% of volume, but your training is spread fairly evenly across muscle groups.`,
    };
  };

  const getPushPullInsight = (groupVolumes) => {
    const push = (groupVolumes.chest || 0) + (groupVolumes.shoulders || 0);
    const pull = groupVolumes.back || 0;
    if (push === 0 && pull === 0) return null;
    if (pull === 0) {
      return { icon: '🔙', title: 'No pulling volume yet', text: 'Chest and shoulder work is logged, but no back work yet. Rows or pulldowns help balance out pressing movements.' };
    }
    if (push === 0) {
      return { icon: '🤝', title: 'No pushing volume yet', text: 'Back work is logged, but no chest or shoulder pressing yet. Adding some can round out your upper body.' };
    }
    const ratio = push / pull;
    if (ratio >= 1.5) {
      return { icon: '🔙', title: 'Push-heavy training', text: `You push ${ratio.toFixed(1)}x more than you pull. More rows or pull-ups can help offset shoulder strain from heavy pressing.` };
    }
    if (ratio <= 0.66) {
      return { icon: '🤝', title: 'Pull-heavy training', text: `You pull ${(1 / ratio).toFixed(1)}x more than you push. Solid back development — balance it out with some pressing work.` };
    }
    return { icon: '🤝', title: 'Push/pull balance is solid', text: 'Your pushing and pulling volume are well matched — great for shoulder health.' };
  };

  const getMostImprovedLift = () => {
    const byExercise = {};
    history.forEach(session => {
      if (!session.exercises || !session.startTime) return;
      Object.values(session.exercises).forEach(ex => {
        if (!ex.exerciseName) return;
        const maxSet = (ex.sets || []).filter(s => s.completed && s.weight > 0).reduce((m, s) => Math.max(m, s.weight), 0);
        if (maxSet <= 0) return;
        if (!byExercise[ex.exerciseName]) byExercise[ex.exerciseName] = [];
        byExercise[ex.exerciseName].push({ weight: maxSet, time: session.startTime });
      });
    });
    let best = null;
    Object.entries(byExercise).forEach(([name, entries]) => {
      if (entries.length < 2) return;
      entries.sort((a, b) => a.time - b.time);
      const first = entries[0].weight;
      const last = entries[entries.length - 1].weight;
      const daySpan = (entries[entries.length - 1].time - entries[0].time) / 86400000;
      if (first <= 0 || daySpan < 7) return;
      const pctGain = ((last - first) / first) * 100;
      if (pctGain > 0 && (!best || pctGain > best.pctGain)) {
        best = { name, first, last, pctGain, daySpan };
      }
    });
    return best;
  };

  const getVolumeTrend = () => {
    const now = Date.now();
    const day = 86400000;
    let recent = 0, prior = 0;
    history.forEach(session => {
      if (!session.exercises || !session.startTime) return;
      const age = now - session.startTime;
      const vol = sessionVolume(session.exercises);
      if (age >= 0 && age < 30 * day) recent += vol;
      else if (age >= 30 * day && age < 60 * day) prior += vol;
    });
    if (prior <= 0) return null;
    const pctChange = Math.round(((recent - prior) / prior) * 100);
    return { recent, prior, pctChange };
  };

  const getFavoriteDay = () => {
    const counts = {};
    history.forEach(s => {
      if (!s.startTime) return;
      const day = new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      counts[day] = (counts[day] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    if (entries[0][1] < 2) return null;
    return { day: entries[0][0], count: entries[0][1] };
  };

  const formatVolume = (lbs) => {
    if (lbs >= 1000000) return `${(lbs / 1000000).toFixed(1)}M`;
    if (lbs >= 1000) return `${Math.round(lbs / 1000)}K`;
    return lbs.toLocaleString();
  };

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!w || w <= 0) return;
    setSavingMetric(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newRef = push(dbRef(db, `body-metrics/${user.uid}`));
      await set(newRef, { date: today, weight: w, unit: 'lbs', loggedAt: Date.now() });
      setNewWeight('');
      loadData();
    } catch (err) {
      console.error('Error logging weight:', err);
    } finally {
      setSavingMetric(false);
    }
  };

  const build14DayCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = new Set(history.map(h => new Date(h.startTime).toDateString()));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: i === 13,
        hasWorkout: sessionDates.has(d.toDateString()),
      };
    });
  };

  const totalWorkouts = stats?.totalWorkouts || 0;
  const lvl = getLevel(totalWorkouts);
  const lvlProgress = getLevelProgress(totalWorkouts);
  const nextAt = getNextLevelAt(totalWorkouts);
  const personalRecords = getPersonalRecords();
  const totalVolume = getTotalVolume();
  const groupVolumes = getGroupVolumes();
  const insights = [
    getBalanceInsight(groupVolumes),
    getPushPullInsight(groupVolumes),
    (() => {
      const trend = getVolumeTrend();
      if (!trend) return null;
      const up = trend.pctChange >= 0;
      return {
        icon: up ? '📈' : '📉',
        title: `Volume ${up ? 'up' : 'down'} ${Math.abs(trend.pctChange)}% this month`,
        text: `You lifted ${formatVolume(trend.recent)} lbs in the last 30 days vs ${formatVolume(trend.prior)} lbs the 30 days before that.`,
      };
    })(),
    (() => {
      const best = getMostImprovedLift();
      if (!best) return null;
      return {
        icon: '🚀',
        title: `${best.name} is climbing fast`,
        text: `Up ${Math.round(best.pctGain)}% — from ${best.first} to ${best.last} lbs over ${Math.round(best.daySpan)} days.`,
      };
    })(),
    (() => {
      const fav = getFavoriteDay();
      if (!fav) return null;
      return {
        icon: '📅',
        title: `${fav.day} is your day`,
        text: `You've completed more workouts on ${fav.day} than any other day of the week.`,
      };
    })(),
  ].filter(Boolean);
  const animWorkouts = useCountUp(totalWorkouts);
  const streak = currentStreak(stats, schedule);
  const animStreak   = useCountUp(streak, 600);
  const animVolume   = useCountUp(totalVolume, 900);
  const volEquiv = getVolumeEquivalent(totalVolume);
  const calendar = build14DayCalendar();
  const chartMetrics = metrics.slice(-10);
  const latestWeight = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const weightDelta = metrics.length > 1 ? metrics[metrics.length - 1].weight - metrics[0].weight : null;
  const displayName = loadedName || user.displayName || user.email?.split('@')[0] || 'Athlete';
  const memberSince = (() => {
    const validTimes = history.map(h => h.startTime).filter(Boolean);
    return validTimes.length > 0
      ? new Date(Math.min(...validTimes)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null;
  })();

  const streakMessage = () => {
    const s = streak;
    if (s >= 30) return "You're absolutely unstoppable. 🌟";
    if (s >= 14) return "Fourteen straight. Don't stop now. 🔥";
    if (s >= 7) return "Seven in a row without missing one. That's discipline.";
    if (s >= 3) return "You're building real momentum.";
    if (s === 1) return "Every legend started with workout one.";
    return "Your next workout starts your streak.";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 skeleton rounded-full w-20" />
              <div className="h-5 skeleton rounded-full w-36" />
              <div className="h-3 skeleton rounded-full w-28" />
            </div>
          </div>
          <div className="h-2 skeleton rounded-full mb-5" />
          <div className="grid gap-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '3px' }}>
            {Array.from({ length: 14 }).map((_, i) => <div key={i} className="aspect-square skeleton rounded-sm" />)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl skeleton h-24" />)}
        </div>
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl skeleton h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 max-w-full overflow-x-hidden content-enter">

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="hero-gradient rounded-2xl p-4 text-white relative overflow-hidden shadow-xl shadow-emerald-900/30">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full" />
        <div className="absolute -bottom-14 -left-6 w-40 h-40 bg-white/5 rounded-full" />

        {/* Info button */}
        <button
          onClick={() => setShowInfoPanel(true)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:bg-white/35 z-10"
          aria-label="About this app"
        >
          <Info className="w-4 h-4 text-white/80" />
        </button>

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Upload error */}
        {uploadError && (
          <div className="relative mb-3 px-3 py-2 bg-red-500/20 border border-red-400/40 rounded-xl text-xs text-red-100 font-medium">
            {uploadError}
          </div>
        )}

        {/* Avatar + name */}
        <div className="relative flex items-start gap-4 mb-5">
          {/* Avatar — tap to upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden border-2 border-white/30 active:opacity-80"
            aria-label="Change profile photo"
          >
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-2xl font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Camera badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-white/30 backdrop-blur-sm flex items-center justify-center rounded-tl-lg">
              {uploadingPhoto ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </div>
          </button>

          <div className="flex-1 min-w-0 pr-8">
            <div className="text-emerald-200 text-xs font-semibold uppercase tracking-wide mb-0.5 truncate">Your Profile</div>

            {/* Editable name */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="flex-1 min-w-0 bg-white/20 text-white placeholder-white/50 rounded-lg px-2.5 py-1 text-lg font-bold border border-white/40 focus:outline-none focus:border-white/70"
                  maxLength={30}
                  placeholder="Your name"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 active:bg-white/35 disabled:opacity-50"
                >
                  {savingName ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 active:bg-white/25"
                >
                  <X className="w-4 h-4 text-white/80" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold capitalize truncate">{displayName}</div>
                <button
                  onClick={() => { setNameInput(displayName); setEditingName(true); }}
                  className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 active:bg-white/35"
                  aria-label="Edit name"
                >
                  <Edit2 className="w-3.5 h-3.5 text-white/80" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1.5">
              <span className={`bg-gradient-to-r ${lvl.color} text-white text-xs font-black px-2.5 py-1 rounded-full`}>
                {lvl.emoji} {lvl.name}
              </span>
              {memberSince && (
                <span className="text-emerald-200 text-xs">since {memberSince}</span>
              )}
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="relative mb-5">
          <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
            <span>{totalWorkouts} workouts</span>
            <span>
              {nextAt ? `${nextAt - totalWorkouts} to ${LEVELS.find(l => l.min === nextAt)?.name}` : '🏆 Max level reached'}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${lvlProgress}%` }}
            />
          </div>
        </div>

        {/* 14-day calendar */}
        <div className="relative">
          <div className="text-xs text-emerald-200 font-semibold mb-2">Last 14 days</div>
          <div className="grid grid-cols-14 gap-0.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '3px' }}>
            {calendar.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition ${
                    day.hasWorkout
                      ? 'bg-white text-emerald-700'
                      : day.isToday
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 text-emerald-300/60'
                  }`}
                >
                  {day.hasWorkout ? '✓' : day.isToday ? '·' : ''}
                </div>
                <div className="text-[8px] text-emerald-300/60 font-medium">{day.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          gradient="from-emerald-400 to-emerald-600"
          top={<Dumbbell className="w-4 h-4 text-white/80" />}
          value={animWorkouts}
          label="Workouts"
        />
        <StatCard
          gradient="from-orange-400 to-orange-600"
          top={<Flame className="w-4 h-4 text-white/80" />}
          value={animStreak}
          label="Streak"
          sub={stats?.longestStreak ? `Best ${stats.longestStreak}` : null}
        />
        <StatCard
          gradient="from-violet-400 to-violet-600"
          top={<TrendingUp className="w-4 h-4 text-white/80" />}
          value={formatVolume(animVolume)}
          label="lbs Lifted"
          sub={volEquiv ? `≈ ${volEquiv.count} ${volEquiv.thing}` : null}
        />
      </div>

      {/* ── Streak motivational banner ────────────────────── */}
      {streak > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/15 rounded-2xl p-4 border border-orange-200/60 dark:border-orange-700/30 flex items-center gap-3">
          <div className="text-3xl leading-none">
            {streak >= 7 ? '🔥' : '⚡'}
          </div>
          <div className="flex-1">
            <div className="font-bold text-orange-800 dark:text-orange-200 leading-tight">
              {streak} workout{streak !== 1 ? 's' : ''} in a row
            </div>
            <div className="text-sm text-orange-600/80 dark:text-orange-300/70 mt-0.5">{streakMessage()}</div>
          </div>
        </div>
      )}

      {/* ── Personal Records ──────────────────────────────── */}
      {personalRecords.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/20">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Personal Records</h3>
            <span className="ml-auto text-xs text-gray-400 dark:text-[#d8e7de]/40">{personalRecords.length} lifts</span>
          </div>

          {personalRecords.length >= 1 && (
            <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-100 dark:border-[#C6A45F]/10">
              {personalRecords[1] ? (
                <div className="flex flex-col items-center pt-3">
                  <div className="text-lg mb-1">🥈</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 font-semibold truncate w-full px-1">{personalRecords[1][0]}</div>
                    <div className="text-lg font-black text-gray-800 dark:text-[#d8e7de] mt-0.5">{personalRecords[1][1].weight}</div>
                    <div className="text-xs text-gray-400">lbs</div>
                  </div>
                </div>
              ) : <div />}

              <div className="flex flex-col items-center bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/15 rounded-2xl pt-2 pb-3 border border-yellow-200 dark:border-yellow-700/30">
                <div className="text-2xl mb-1">🥇</div>
                <div className="text-center px-2">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide truncate w-full">{personalRecords[0][0]}</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-[#d8e7de] mt-0.5 leading-none">{personalRecords[0][1].weight}</div>
                  <div className="text-xs text-amber-500 font-semibold mt-0.5">lbs</div>
                </div>
              </div>

              {personalRecords[2] ? (
                <div className="flex flex-col items-center pt-3">
                  <div className="text-lg mb-1">🥉</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 font-semibold truncate w-full px-1">{personalRecords[2][0]}</div>
                    <div className="text-lg font-black text-gray-800 dark:text-[#d8e7de] mt-0.5">{personalRecords[2][1].weight}</div>
                    <div className="text-xs text-gray-400">lbs</div>
                  </div>
                </div>
              ) : <div />}
            </div>
          )}

          {personalRecords.length > 3 && (
            <div className="divide-y divide-gray-50 dark:divide-[#C6A45F]/5">
              {personalRecords.slice(3).map(([name, record], i) => (
                <div key={name} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-sm text-gray-300 dark:text-[#d8e7de]/20 font-bold w-5 text-center">{i + 4}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-700 dark:text-[#d8e7de]/80 truncate">{name}</div>
                    <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                      {record.reps} reps · {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-base font-bold text-gray-800 dark:text-[#d8e7de] flex-shrink-0">
                    {record.weight} <span className="text-xs font-normal text-gray-400">lbs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Muscle group heatmap ───────────────────────────── */}
      {totalVolume > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/20">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Muscle Balance</h3>
            <span className="ml-auto text-xs text-gray-400 dark:text-[#d8e7de]/40">all-time volume</span>
          </div>
          <div className="p-5">
            <MuscleHeatmap groupVolumes={groupVolumes} formatVolume={formatVolume} />
          </div>
        </div>
      )}

      {/* ── Smart insights ─────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/20">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Smart Insights</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-[#C6A45F]/5">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3 px-5 py-4">
                <div className="text-2xl leading-none flex-shrink-0">{insight.icon}</div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm mb-0.5">{insight.title}</div>
                  <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 leading-snug">{insight.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Body weight tracker ───────────────────────────── */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/20">
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-[#d8e7de]">Body Weight</div>
              <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                {metrics.length} {metrics.length === 1 ? 'entry' : 'entries'} logged
              </div>
            </div>
          </div>
          {latestWeight && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de] leading-tight">
                {latestWeight.weight}
                <span className="text-sm font-normal text-gray-400 ml-1">lbs</span>
              </div>
              {weightDelta !== null && Math.abs(weightDelta) >= 0.1 && (
                <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 mt-0.5 ${weightDelta < 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {weightDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {Math.abs(weightDelta).toFixed(1)} lbs {weightDelta < 0 ? 'lost' : 'gained'}
                </div>
              )}
            </div>
          )}
        </div>

        {chartMetrics.length >= 2 && (
          <div className="px-4 pb-3">
            <WeightChart metrics={chartMetrics} />
          </div>
        )}

        {metrics.length > 0 && (
          <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">
            {[...metrics].reverse().slice(0, 5).map((m, i, arr) => {
              const older = arr[i + 1];
              const delta = older != null ? m.weight - older.weight : null;
              return (
                <div key={m.id} className={`flex items-center gap-3 px-5 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50 dark:border-[#C6A45F]/5' : ''}`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 flex-1">
                    {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{m.weight} lbs</div>
                  <div className={`text-xs font-semibold w-14 text-right ${delta == null ? 'text-gray-300' : delta < 0 ? 'text-emerald-500' : delta > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {delta == null ? '—' : delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 py-4 bg-gray-50 dark:bg-[#0a0a0a]/30 border-t border-gray-100 dark:border-[#C6A45F]/10">
          {metrics.length === 0 && (
            <p className="text-xs text-center text-gray-400 dark:text-[#d8e7de]/40 mb-3">
              Start logging your weight to see your trend over time.
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Today's weight (lbs)"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogWeight()}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/30 text-base"
              step="0.1" min="0"
            />
            <button
              onClick={handleLogWeight}
              disabled={savingMetric || !newWeight}
              className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-semibold active:bg-emerald-600 disabled:opacity-50 min-h-[52px] flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Log
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────── */}
      {history.length === 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="font-bold text-gray-800 dark:text-[#d8e7de] mb-2">Your journey starts here</h3>
          <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
            Complete your first workout to unlock your stats and start building your fitness story.
          </p>
        </div>
      )}

      {/* ── Start fresh ───────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Start Fresh</h3>
            <p className="text-xs text-gray-500 dark:text-[#d8e7de]/50">Archive your sessions and strength progress</p>
          </div>
        </div>

        {confirmArchive ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-[#d8e7de]/70">
              Your {history.length} completed workout{history.length !== 1 ? 's' : ''}, personal records, streak and
              stats will be archived and your progress will start from zero. Your archived history is kept, not deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmArchive(false)}
                disabled={archiving}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-[#d8e7de]/80 font-semibold rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleStartFresh}
                disabled={archiving}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl active:bg-amber-600 disabled:opacity-50 min-h-[44px]"
              >
                {archiving ? 'Archiving…' : 'Yes, Start Fresh'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmArchive(true)}
            disabled={history.length === 0 && !stats}
            className="w-full py-3 border-2 border-amber-300 dark:border-amber-600/40 text-amber-700 dark:text-amber-400 font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40"
          >
            <Archive className="w-4 h-4" />
            Archive History &amp; Start Fresh
          </button>
        )}

        {archives.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#C6A45F]/15">
            <div className="text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wide mb-2">Past archives</div>
            <div className="space-y-1">
              {archives.map(a => (
                <div key={a.id} className="flex justify-between text-sm text-gray-600 dark:text-[#d8e7de]/60">
                  <span>{new Date(a.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>{a.sessionCount} workout{a.sessionCount !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Feedback ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Share Feedback</h3>
            <p className="text-xs text-gray-500 dark:text-[#d8e7de]/50">Suggest features or report issues</p>
          </div>
        </div>

        {feedbackSent ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="text-4xl">🙌</div>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">Thanks! Your feedback was sent.</p>
            <p className="text-xs text-gray-400 dark:text-[#d8e7de]/50">Your trainer will review it shortly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[
                { value: 'enhancement', label: '💡 Enhancement' },
                { value: 'bug',         label: '🐛 Bug' },
                { value: 'general',     label: '💬 General' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFeedbackCategory(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    feedbackCategory === opt.value
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-gray-50 dark:bg-[#0a0a0a]/50 text-gray-600 dark:text-[#d8e7de]/60 border-gray-200 dark:border-[#C6A45F]/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Describe your idea or issue..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/30 text-sm resize-none"
            />

            <button
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback || !feedbackText.trim()}
              className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl active:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              {submittingFeedback ? 'Sending…' : 'Send Feedback'}
            </button>
          </div>
        )}
      </div>

      {/* ── App Features Info Panel ───────────────────────── */}
      {showInfoPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowInfoPanel(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full bg-white dark:bg-[#0d1a12] rounded-t-3xl shadow-2xl max-h-[85svh] overflow-y-auto scrollbar-hide"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>

            <div className="px-6 pb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-[#d8e7de]">What's in your app</h2>
                  <p className="text-xs text-gray-400 dark:text-[#d8e7de]/50 mt-0.5">Everything available to you</p>
                </div>
              </div>

              <div className="space-y-5">
                {APP_FEATURES.map(f => (
                  <div key={f.title} className="flex gap-4">
                    <div className="text-2xl leading-none mt-0.5 flex-shrink-0">{f.icon}</div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] mb-0.5">{f.title}</div>
                      <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 leading-snug">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowInfoPanel(false)}
                className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl mt-8 active:bg-emerald-600"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ gradient, top, value, label, sub }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-center shadow-lg shadow-black/15`}>
      <div className="flex justify-center mb-1.5 opacity-80">{top}</div>
      <div className="text-2xl font-black text-white leading-tight">{value}</div>
      <div className="text-xs text-white/70 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[10px] text-white/50 mt-1 leading-tight">{sub}</div>}
    </div>
  );
}

function MuscleHeatmap({ groupVolumes, formatVolume }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const maxVol = Math.max(1, ...BODY_GROUPS.map(g => groupVolumes[g] || 0));
  const totalVol = BODY_GROUPS.reduce((sum, g) => sum + (groupVolumes[g] || 0), 0);

  const toggleSelect = (g) => setSelectedGroup(prev => (prev === g ? null : g));
  const intensity = (g) => {
    const v = groupVolumes[g] || 0;
    return v <= 0 ? 0 : 0.25 + (v / maxVol) * 0.75;
  };

  const sorted = [...BODY_GROUPS].sort((a, b) => (groupVolumes[b] || 0) - (groupVolumes[a] || 0));
  const selectedVol = selectedGroup ? groupVolumes[selectedGroup] || 0 : 0;
  const selectedPct = selectedGroup && totalVol > 0 ? Math.round((selectedVol / totalVol) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Selection callout */}
      <div className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${selectedGroup ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-[#0a0a0a]/30'}`}>
        {selectedGroup ? (
          <>
            <div className="text-sm">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{GROUP_LABELS[selectedGroup]}</span>
              <span className="text-gray-500 dark:text-[#d8e7de]/50">
                {' · '}{selectedVol > 0 ? `${formatVolume(selectedVol)} lbs · ${selectedPct}%` : 'No volume logged yet'}
              </span>
            </div>
            <button onClick={() => setSelectedGroup(null)} className="text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/40 flex-shrink-0 pl-2">
              Clear
            </button>
          </>
        ) : (
          <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">Tap a muscle to see its details</div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <AnatomyFigure intensity={intensity} selectedGroup={selectedGroup} onSelect={toggleSelect} />

        <div className="flex-1 w-full space-y-1.5">
          {sorted.map(g => {
            const v = groupVolumes[g] || 0;
            const pct = totalVol > 0 ? Math.round((v / totalVol) * 100) : 0;
            const isSelected = selectedGroup === g;
            return (
              <button
                key={g}
                onClick={() => toggleSelect(g)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                  isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'active:bg-gray-50 dark:active:bg-white/5'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: muscleFill(intensity(g)) }}
                />
                <div className={`text-sm flex-1 ${isSelected ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-[#d8e7de]/80'}`}>
                  {GROUP_LABELS[g]}
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-[#d8e7de] tabular-nums whitespace-nowrap">
                  {v > 0 ? `${formatVolume(v)} lbs` : '—'}
                </div>
                <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 w-9 text-right tabular-nums">
                  {v > 0 ? `${pct}%` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeightChart({ metrics }) {
  const W = 340, H = 90;
  const pad = { t: 12, r: 10, b: 8, l: 10 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const weights = metrics.map(m => m.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 0.5;
  const toX = (i) => pad.l + (i / (metrics.length - 1)) * innerW;
  const toY = (w) => pad.t + ((maxW - w) / range) * innerH;
  const points = metrics.map((m, i) => ({ x: toX(i), y: toY(m.weight) }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},${H - pad.b} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${H - pad.b} Z`;

  return (
    <div className="rounded-xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/10 px-2 pt-2 pb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#wGrad)" />
        <polyline points={polyline} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? '#059669' : '#10b981'} />
        ))}
      </svg>
      <div className="flex justify-between px-1 pb-1">
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
          {new Date(metrics[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
          {new Date(metrics[metrics.length - 1].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

// ─── Anatomical (écorché) muscle figure ──────────────────────────────────────
// Front + back views in the style of a medical muscle chart. Each figure is drawn as
// its left half (x 0–60) and mirrored, so both sides stay symmetric. Muscles belonging
// to a tracked group are tinted by training volume; the rest are drawn as neutral muscle.

const MUSCLE_PALE = [222, 190, 182];   // untrained muscle
const MUSCLE_DEEP = [176, 30, 30];     // most-trained muscle
const FASCIA = '#ece0c8';              // tendon / bone / fascia
const FASCIA_LINE = '#b9a47c';
const OUTLINE = '#6b211b';
const DEEP_MUSCLE = '#9c4038';         // deeper muscle layer showing between surface muscles

// Body silhouette (left half) drawn first, so gaps between surface muscles read as deep muscle.
const BODY_UNDERLAYER = 'M60 28 L50 28 L46 46 L36 47 C26 49 21 57 21 66 C21 82 23 98 25 112 C20 124 17 138 17 152 L17 160 L33 161 C36 146 38 130 38 116 L39 98 L39 120 C40 128 40 134 41 140 C37 152 36 172 37 200 C38 212 40 222 42 236 C40 250 40 268 43 286 L51 286 C51 270 54 260 57 248 C58 238 57 230 57 224 C58 200 59.2 176 59.2 152 L60 152 Z';

function muscleFill(t) {
  const c = MUSCLE_PALE.map((p, i) => Math.round(p + (MUSCLE_DEEP[i] - p) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// Left-half paths. g = data group (null = decorative muscle), f = fiber direction.
const FRONT_MUSCLES = [
  { g: null, f: 'v', d: 'M50 30 L60 30 L60 52 L44 50 Z' },                                                   // neck (deep)
  { g: null, f: 'd', d: 'M50 31 C52 39 55 46 58 52 L60 52 L60 47 C56 42 53 37 52.5 31 Z' },               // sternocleidomastoid
  { g: 'back', f: 'd', d: 'M52 37 C48 43 42 46 34 49 L40 52 C46 50 52 49 58 50 Z' },                         // trapezius
  { g: 'core', f: 'd', d: 'M40 84 C44 82 50 84 52 88 L52 132 C48 136 44 138 42 140 C39 126 38 104 40 84 Z' }, // external oblique
  { g: 'core', f: 'd', d: 'M38 72 L44 76 L40 78 L45 82 L41 84 L46 88 L42 90 L46 94 L40 93 C38 86 37 79 38 72 Z' }, // serratus anterior
  { g: 'core', f: 'h', d: 'M53 84 L59.2 84 L59.2 146 L55 146 C53 136 53 110 53 84 Z' },                      // rectus abdominis
  { g: 'chest', f: 'd', d: 'M59.2 53 C52 52 45 52 39 54 C36 58 34 63 33 67 L38 69 C42 74 50 81 59.2 82 Z' },  // pectoralis major
  { g: 'shoulders', f: 'v', d: 'M37 49 C30 49 24 54 22 62 C21 70 23 78 27 86 L31 84 C32 76 34 68 39 60 C40 56 40 52 37 49 Z' }, // deltoid
  { g: 'arms', f: 'v', d: 'M27 86 C24 94 24 104 27 112 L31 112 C30 102 30 92 31 84 Z' },                     // triceps (lateral)
  { g: 'arms', f: 'v', d: 'M33 67 C30 74 29 86 30 100 C31 106 33 110 35 112 L38 110 C39 100 39 84 38 70 Z' }, // biceps
  { g: 'arms', f: 'v', d: 'M26 118 C21 126 18 138 18 150 L22 160 L26 158 C25 146 27 132 31 118 Z' },         // brachioradialis
  { g: 'arms', f: 'v', d: 'M31 118 C29 132 27 146 26 158 L32 160 C34 146 37 130 37 118 Z' },                 // forearm flexors
  { g: 'legs', f: 'v', d: 'M42 140 C39 146 38 154 38 162 L43 160 C44 152 45 146 46 144 Z' },                 // tensor fasciae latae
  { g: 'legs', f: 'v', d: 'M38 160 C36 180 37 204 41 222 L45 224 C44 204 43 182 44 162 Z' },                 // vastus lateralis
  { g: 'legs', f: 'v', d: 'M52 150 L59.2 152 L59.2 168 C58 180 57 192 56 204 C54 186 52 168 51 152 Z' },     // adductors
  { g: 'legs', f: 'v', d: 'M46 146 C43 166 43 196 46 220 L52 220 C54 196 54 170 51 150 Z' },                 // rectus femoris
  { g: 'legs', f: 'v', d: 'M52 196 C55 204 56 214 54 224 L48 226 C50 216 51 206 52 196 Z' },                 // vastus medialis
  { g: 'legs', f: 'd', d: 'M44 144 C48 160 54 186 57 214 L55 218 C52 190 46 164 42 146 Z' },                 // sartorius
  { g: 'legs', f: 'v', d: 'M43 238 C40 250 41 266 44 284 L46 284 C45 268 44 252 45 238 Z' },                 // peroneus
  { g: 'legs', f: 'v', d: 'M45 238 C44 252 45 268 47 284 L50 284 C50 268 50 252 50 238 Z' },                 // tibialis anterior
  { g: 'legs', f: 'v', d: 'M50 238 C55 246 57 256 55 270 L52 280 C51 266 51 252 50 238 Z' },                 // gastrocnemius (medial)
];
const FRONT_FASCIA = [
  'M60 4 C49 4 46 12 46 22 C46 30 48 35 52 38 C55 40 58 41 60 41 Z',                                        // head
  'M42 138 L59.2 146 L59.2 152 L46 150 Z',                                                                   // inguinal
  'M27 112 L38 110 L37 118 L26 118 Z',                                                                       // elbow
  'M18 158 L32 160 L33 168 C33 176 30 184 24 186 C19 184 16 176 17 168 Z',                                   // hand
  'M42 222 L56 222 L55 238 L43 238 Z',                                                                       // knee
  'M43 284 L51 284 L52 292 C52 296 48 298 42 298 C38 298 38 294 40 290 Z',                                   // foot
];
const FRONT_LINES = [
  'M58 51 C50 50 44 50 37 52',             // clavicle
  'M53.5 98 L59.2 98', 'M53.3 112 L59.2 112', 'M53.4 126 L59.2 126', // abdominal tendinous intersections
  'M46 228 C47 224 52 224 53 228 C53 233 51 236 49.5 236 C48 236 46 233 46 228 Z', // patella
];

const BACK_MUSCLES = [
  { g: 'core', f: 'd', d: 'M40 112 C39 120 39 128 41 136 L46 134 C44 126 42 120 42 112 Z' },                 // oblique (rear)
  { g: 'back', f: 'd', d: 'M36 78 C38 88 40 100 42 112 C46 122 52 128 58 132 L59.2 132 L59.2 108 C57 98 55 86 54 72 L50 78 L46 84 Z' }, // latissimus dorsi
  { g: 'back', f: 'v', d: 'M55 100 L59.2 100 L59.2 142 L54 142 C53 128 54 114 55 100 Z' },                   // erector spinae
  { g: 'back', f: 'd', d: 'M42 58 C46 56 52 60 54 70 L50 78 C46 76 42 74 38 72 C38 66 40 61 42 58 Z' },     // infraspinatus
  { g: 'back', f: 'd', d: 'M38 72 L50 78 L46 84 L36 78 Z' },                                                 // teres major
  { g: 'back', f: 'd', d: 'M59.2 26 C56 30 54 36 52 40 C46 44 40 47 34 50 C42 54 50 60 54 72 C56 84 58 96 59.2 108 Z' }, // trapezius
  { g: 'shoulders', f: 'v', d: 'M34 50 C27 52 22 58 22 66 C22 74 24 80 27 86 L31 84 C33 74 36 64 42 58 C40 54 37 51 34 50 Z' }, // rear deltoid
  { g: 'arms', f: 'v', d: 'M31 84 C27 86 26 92 26 100 C26 106 28 110 30 114 L37 112 C38 104 38 94 36 84 Z' }, // triceps
  { g: 'arms', f: 'v', d: 'M27 120 C22 130 20 142 20 156 L26 160 C27 146 30 132 32 120 Z' },                 // forearm extensors
  { g: 'arms', f: 'v', d: 'M32 120 C31 134 30 148 30 160 L34 160 C36 146 38 132 37 120 Z' },                 // forearm (ulnar)
  { g: 'legs', f: 'd', d: 'M42 132 C40 136 39 140 40 146 L50 144 C50 140 48 136 46 133 Z' },                 // gluteus medius
  { g: 'legs', f: 'd', d: 'M40 146 C38 154 40 164 46 170 C52 173 57 172 59.2 170 L59.2 140 C56 140 52 142 48 144 Z' }, // gluteus maximus
  { g: 'legs', f: 'v', d: 'M41 166 C40 186 41 206 44 226 L50 226 C49 206 48 186 48 170 Z' },                 // biceps femoris
  { g: 'legs', f: 'v', d: 'M48 170 C50 188 51 208 52 226 L57 224 C58 206 58 188 57 170 Z' },                 // semitendinosus
  { g: 'legs', f: 'v', d: 'M44 234 C40 244 40 258 45 272 L50 270 C49 256 49 244 50 234 Z' },                 // gastrocnemius (lateral)
  { g: 'legs', f: 'v', d: 'M50 234 C56 242 58 256 55 270 L50 272 C51 258 51 246 50 234 Z' },                 // gastrocnemius (medial)
];
const BACK_FASCIA = [
  'M60 4 C49 4 46 12 46 22 C46 30 48 35 52 38 C55 40 58 41 60 41 Z',                                        // head
  'M50 128 L59.2 120 L59.2 146 L52 142 Z',                                                                   // thoracolumbar fascia
  'M28 114 L37 112 L37 120 L27 120 Z',                                                                       // elbow
  'M20 158 L34 160 L34 168 C34 176 31 184 25 186 C20 184 17 176 18 168 Z',                                   // hand
  'M43 224 L57 224 L56 236 L44 236 Z',                                                                       // knee
  'M46 270 L54 270 L52 286 L48 286 Z',                                                                       // achilles
  'M44 286 L54 286 L54 294 C52 298 46 298 44 294 Z',                                                         // heel
];
const BACK_LINES = [
  'M31 88 C33 96 33 104 32 112',           // triceps long/lateral head split
  'M47 72 C49 66 51 63 52 62',             // spine of scapula
];

function AnatomyFigure({ intensity, selectedGroup, onSelect }) {
  const renderHalf = (muscles, fascia, lines) => (
    <>
      <path d={BODY_UNDERLAYER} fill={DEEP_MUSCLE} stroke={OUTLINE} strokeOpacity="0.5" strokeWidth="0.4" />
      {fascia.map((d, i) => <path key={`f${i}`} d={d} fill={FASCIA} stroke={FASCIA_LINE} strokeWidth="0.5" />)}
      {muscles.map((m, i) => {
        const tracked = !!m.g;
        const isSelected = tracked && selectedGroup === m.g;
        const isDimmed = tracked && selectedGroup && selectedGroup !== m.g;
        return (
          <g key={`m${i}`} onClick={tracked ? () => onSelect(m.g) : undefined} style={tracked ? { cursor: 'pointer' } : undefined}>
            <path
              d={m.d}
              fill={muscleFill(tracked ? intensity(m.g) : 0)}
              fillOpacity={isDimmed ? 0.35 : 1}
              stroke={isSelected ? '#C6A45F' : OUTLINE}
              strokeWidth={isSelected ? 1.4 : 0.45}
              strokeOpacity={isSelected ? 1 : 0.7}
              strokeLinejoin="round"
              style={{ transition: 'fill 0.25s ease, fill-opacity 0.25s ease' }}
            />
            <path d={m.d} fill={`url(#fib-${m.f})`} pointerEvents="none" />
          </g>
        );
      })}
      {lines.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke={OUTLINE} strokeOpacity="0.55" strokeWidth="0.5" pointerEvents="none" />)}
    </>
  );

  const figure = (muscles, fascia, lines, x, label) => (
    <g transform={`translate(${x} 0)`}>
      {renderHalf(muscles, fascia, lines)}
      <g transform="translate(120 0) scale(-1 1)">{renderHalf(muscles, fascia, lines)}</g>
      <text x="60" y="312" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" className="text-gray-400 dark:text-[#d8e7de]/40">{label}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 250 318" className="w-56 sm:w-60 h-auto flex-shrink-0" role="img" aria-label="Anatomical muscle chart, front and back, shaded by training volume">
      <defs>
        {[['v', 0], ['d', 35], ['h', 90]].map(([k, angle]) => (
          <pattern key={k} id={`fib-${k}`} width="1.8" height="1.8" patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="1.8" stroke={OUTLINE} strokeOpacity="0.16" strokeWidth="0.45" />
          </pattern>
        ))}
      </defs>
      {figure(FRONT_MUSCLES, FRONT_FASCIA, FRONT_LINES, 0, 'FRONT')}
      {figure(BACK_MUSCLES, BACK_FASCIA, BACK_LINES, 130, 'BACK')}
      {/* midlines: linea alba (front) and spine (back) */}
      <path d="M60 84 L60 146" stroke={OUTLINE} strokeOpacity="0.5" strokeWidth="0.6" />
      <path d="M190 30 L190 146" stroke={FASCIA_LINE} strokeWidth="1" strokeDasharray="1.5 1.2" />
    </svg>
  );
}
