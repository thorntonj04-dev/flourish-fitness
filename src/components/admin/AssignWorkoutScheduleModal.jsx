import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, set } from 'firebase/database';
import { db } from '../../firebase';
import { X, Save } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AssignWorkoutScheduleModal({ client, existingSchedule, onClose, onSaved }) {
  const [workouts, setWorkouts] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial = {};
    DAYS.forEach(day => { initial[day] = existingSchedule?.[day] || null; });
    setSchedule(initial);

    get(dbRef(db, 'workouts')).then(snap => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, w]) => ({ id, ...w }))
          .filter(w => !w.archived)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setWorkouts(list);
      }
    }).catch(err => console.error('Error loading workouts:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDayChange = (day, workoutId) => {
    if (!workoutId) {
      setSchedule(prev => ({ ...prev, [day]: null }));
      return;
    }
    const workout = workouts.find(w => w.id === workoutId);
    setSchedule(prev => ({
      ...prev,
      [day]: { workoutId, workoutName: workout?.name || '' },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Preserve any client-set ad-hoc day assignments — this save only manages the recurring weekly days.
      const toSave = existingSchedule?.adhoc ? { ...schedule, adhoc: existingSchedule.adhoc } : schedule;
      await set(dbRef(db, `clientSchedules/${client.id}`), toSave);
      onSaved(toSave);
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const scheduledCount = DAYS.filter(d => schedule[d]).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1E3328] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[90svh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Weekly Workouts</h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
              {client.name || client.email} · {scheduledCount} day{scheduledCount !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl active:bg-gray-100 dark:active:bg-[#0a0a0a]/40 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Day list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="rounded-xl bg-gray-100 dark:bg-[#0a0a0a]/30 animate-pulse h-14" />
            ))
          ) : (
            DAYS.map(day => (
              <div
                key={day}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0a0a0a]/30 rounded-xl"
              >
                <div className="w-10 flex-shrink-0 text-center">
                  <div className="text-xs font-bold text-gray-500 dark:text-[#d8e7de]/50">
                    {day.slice(0, 3).toUpperCase()}
                  </div>
                </div>
                <select
                  value={schedule[day]?.workoutId || ''}
                  onChange={e => handleDayChange(day, e.target.value)}
                  className="flex-1 py-2.5 px-3 border border-gray-200 dark:border-[#C6A45F]/30 rounded-xl text-sm bg-white dark:bg-[#1E3328] text-gray-900 dark:text-[#d8e7de] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]"
                >
                  <option value="">Rest day</option>
                  {workouts.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>

        {/* Save */}
        <div className="p-4 border-t border-gray-200 dark:border-[#C6A45F]/25 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
