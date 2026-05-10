import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronRight } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutHistory({ user }) {
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const snap = await get(dbRef(db, `workout-history/${user.uid}`));
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, s]) => ({ id, ...s }))
          .filter(s => s.completed)
          .sort((a, b) => b.startTime - a.startTime);
        setSessions(list);
      }
    } catch (err) {
      console.error('Error loading workout history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const getExerciseList = (exercises) => {
    if (!exercises) return [];
    return Object.values(exercises);
  };

  const countSets = (exData) => {
    const total = (exData.sets || []).length;
    const done = (exData.sets || []).filter(s => s.completed).length;
    return { total, done };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 animate-pulse h-20" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Workout History</h2>
        <p className="text-emerald-100 text-sm mt-1">{sessions.length} completed session{sessions.length !== 1 ? 's' : ''}</p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <Dumbbell className="w-14 h-14 text-gray-300 dark:text-[#d8e7de]/20 mx-auto mb-4" />
          <p className="font-semibold text-gray-600 dark:text-[#d8e7de]/70 mb-1">No workouts yet</p>
          <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Complete your first workout to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id;
            const exerciseList = getExerciseList(session.exercises);
            const totalSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).length, 0);
            const doneSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.completed).length, 0);

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full p-4 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{session.workoutName}</div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#d8e7de]/50">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(session.startTime)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#d8e7de]/50">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(session.duration)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50">
                          {doneSets}/{totalSets} sets
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0}%
                        </div>
                        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">done</div>
                      </div>
                      {isExpanded
                        ? <ChevronDown className="w-5 h-5 text-gray-400" />
                        : <ChevronRight className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-[#C6A45F]/10 bg-gray-50 dark:bg-[#0a0a0a]/30 p-4 space-y-2">
                    {exerciseList.map((exData, i) => {
                      const { total, done } = countSets(exData);
                      const completedSets = (exData.sets || []).filter(s => s.completed);
                      const avgWeight = completedSets.length
                        ? Math.round(completedSets.reduce((s, set) => s + (set.weight || 0), 0) / completedSets.length)
                        : 0;

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border ${
                            done === total && total > 0
                              ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-[#C6A45F]/20 bg-white dark:bg-[#1E3328]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 dark:text-[#d8e7de] truncate text-sm">{exData.exerciseName}</div>
                              <div className="text-xs text-gray-400 dark:text-[#d8e7de]/50 mt-0.5">{done}/{total} sets</div>
                            </div>
                            {avgWeight > 0 && (
                              <div className="text-sm font-bold text-gray-700 dark:text-[#d8e7de]/80 flex-shrink-0">{avgWeight} lbs</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
