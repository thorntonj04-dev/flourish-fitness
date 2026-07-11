import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ref as dbRef, update } from 'firebase/database';
import { db } from '../../firebase';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ScheduleAdjustModal({ userId, currentSchedule, availableDays, onClose, onSaved }) {
  const [schedule, setSchedule] = useState({ ...currentSchedule });
  const [saving, setSaving] = useState(false);

  const handleChange = (dayName, dayId) => {
    setSchedule(prev => ({ ...prev, [dayName]: dayId || null }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(dbRef(db, `programAssignments/${userId}`), { weeklySchedule: schedule });
      onSaved(schedule);
      onClose();
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = Object.values(schedule).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1E3328] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm max-h-[92svh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Adjust My Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">{assignedCount} workouts this week</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#0a0a0a]/40 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500 dark:text-[#d8e7de]/60" />
          </button>
        </div>

        {/* Schedule picker */}
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {DAYS_OF_WEEK.map(dayName => (
            <div key={dayName} className="flex items-center gap-3">
              <div className="w-10 text-xs font-bold text-gray-400 dark:text-[#d8e7de]/50 uppercase flex-shrink-0">
                {dayName.slice(0, 3)}
              </div>
              <select
                value={schedule[dayName] || ''}
                onChange={e => handleChange(dayName, e.target.value)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium min-h-[48px] focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] ${
                  schedule[dayName]
                    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-[#C6A45F]/20 text-gray-400 dark:text-[#d8e7de]/40'
                }`}
              >
                <option value="">Rest day</option>
                {availableDays.map(day => (
                  <option key={day.id} value={day.id}>
                    {day.label}{day.workoutName ? ` — ${day.workoutName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="p-4 pt-3 border-t border-gray-100 dark:border-[#C6A45F]/15 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
