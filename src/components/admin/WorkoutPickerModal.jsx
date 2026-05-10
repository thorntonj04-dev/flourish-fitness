import React, { useState } from 'react';
import { Search, X, Dumbbell, Check } from 'lucide-react';

export default function WorkoutPickerModal({ workouts, currentWorkoutId, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = workouts.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const countSection = (workout, section) => {
    if (workout.exercises) return workout.exercises.filter(e => e.section === section).length;
    return (workout[section] || []).length;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1E3328] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Pick a Workout</h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">Tap to assign to this slot</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#0a0a0a]/40 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-[#d8e7de]/60" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-[#C6A45F]/15">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/40"
            />
          </div>
        </div>

        {/* Workout list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-[#d8e7de]/40">
              <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No workouts match "{search}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
              {filtered.map(workout => {
                const isSelected = workout.id === currentWorkoutId;
                return (
                  <button
                    key={workout.id}
                    onClick={() => onSelect(workout)}
                    className={`w-full text-left p-4 flex items-center gap-3 transition active:bg-gray-50 dark:active:bg-[#0a0a0a]/30 ${
                      isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-[#d8e7de]'}`}>
                        {workout.name}
                      </div>
                      {workout.description && (
                        <p className="text-xs text-gray-400 dark:text-[#d8e7de]/50 mt-0.5 truncate">{workout.description}</p>
                      )}
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-400 dark:text-[#d8e7de]/40">
                        <span>🔥 {countSection(workout, 'warmup')}</span>
                        <span>💪 {countSection(workout, 'work')}</span>
                        <span>🧘 {countSection(workout, 'cooldown')}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
