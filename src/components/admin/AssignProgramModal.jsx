import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Layers, AlertCircle } from 'lucide-react';
import { ref as dbRef, get, set } from 'firebase/database';
import { db, auth } from '../../firebase';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getNextMonday() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 1 ? 7 : (8 - day) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split('T')[0];
}

function getDefaultSchedule(workoutsPerWeek) {
  const base = { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null };
  if (workoutsPerWeek === 3) return { ...base, Monday: 'day-0', Wednesday: 'day-1', Friday: 'day-2' };
  if (workoutsPerWeek === 4) return { ...base, Monday: 'day-0', Tuesday: 'day-1', Thursday: 'day-2', Friday: 'day-3' };
  if (workoutsPerWeek === 5) return { ...base, Monday: 'day-0', Tuesday: 'day-1', Wednesday: 'day-2', Thursday: 'day-3', Friday: 'day-4' };
  return base;
}

export default function AssignProgramModal({ client, programs, existingAssignment, onClose, onSaved }) {
  const [selectedProgramId, setSelectedProgramId] = useState(existingAssignment?.programId || '');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [startDate, setStartDate] = useState(existingAssignment?.startDate || getNextMonday());
  const [schedule, setSchedule] = useState({ Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null });
  const [saving, setSaving] = useState(false);

  // Load program detail when selection changes
  useEffect(() => {
    if (!selectedProgramId) { setSelectedProgram(null); return; }

    const program = programs.find(p => p.id === selectedProgramId);
    if (program) {
      setSelectedProgram(program);
      // Set a smart default schedule based on first phase's workoutsPerWeek
      const wpw = program.phases?.[0]?.workoutsPerWeek || 3;
      const defaultSched = getDefaultSchedule(wpw);
      // If there's an existing assignment for this same program, use its schedule
      if (existingAssignment?.programId === selectedProgramId && existingAssignment?.weeklySchedule) {
        setSchedule(existingAssignment.weeklySchedule);
      } else {
        setSchedule(defaultSched);
      }
    }
  }, [selectedProgramId, programs]);

  const rawPhase0Days = selectedProgram?.phases?.[0]?.days;
  const phase0Days = rawPhase0Days
    ? (Array.isArray(rawPhase0Days) ? rawPhase0Days : Object.values(rawPhase0Days))
    : [];

  const handleScheduleChange = (dayOfWeek, dayId) => {
    setSchedule(prev => ({ ...prev, [dayOfWeek]: dayId || null }));
  };

  const assignedCount = Object.values(schedule).filter(v => v !== null).length;
  const expectedCount = selectedProgram?.phases?.[0]?.workoutsPerWeek || 0;

  const handleSave = async () => {
    if (!selectedProgramId) { alert('Please select a program.'); return; }
    if (!startDate) { alert('Please choose a start date.'); return; }

    setSaving(true);
    try {
      const adminUser = auth.currentUser;
      const assignmentData = {
        programId: selectedProgramId,
        programName: selectedProgram.name,
        assignedAt: new Date().toISOString(),
        assignedBy: adminUser?.email || 'admin',
        startDate,
        currentPhase: 0,
        currentWeek: 1,
        weeklySchedule: schedule,
      };
      // Preserve any client-set ad-hoc single-day assignments across reassignment.
      if (existingAssignment?.adhocSchedule) {
        assignmentData.adhocSchedule = existingAssignment.adhocSchedule;
      }

      await set(dbRef(db, `programAssignments/${client.id}`), assignmentData);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error assigning program:', err);
      alert('Failed to assign program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1E3328] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">
              {existingAssignment ? 'Change Program' : 'Assign Program'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">{client.name || client.email}</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#0a0a0a]/40 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Program picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-2">
              Select Program
            </label>
            {programs.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                No programs found. Create a program first.
              </div>
            ) : (
              <div className="space-y-2">
                {programs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProgramId(p.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${
                      selectedProgramId === p.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-[#C6A45F]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate ${selectedProgramId === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-[#d8e7de]'}`}>
                          {p.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(p.phases || []).map((ph, i) => (
                            <span key={i} className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                              {ph.name} ({ph.durationWeeks}w)
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedProgramId === p.id && <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-2">
              <Calendar className="inline w-3.5 h-3.5 mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-base focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
            />
          </div>

          {/* Weekly schedule */}
          {selectedProgram && phase0Days.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide">
                  Weekly Schedule
                </label>
                {assignedCount !== expectedCount && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {assignedCount}/{expectedCount} days assigned
                  </span>
                )}
                {assignedCount === expectedCount && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> All days set
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mb-3">
                Set which day of the week each workout falls on. The client can adjust this later.
              </p>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map(dayName => (
                  <div key={dayName} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-bold text-gray-400 dark:text-[#d8e7de]/50 uppercase flex-shrink-0">
                      {dayName.slice(0, 3)}
                    </div>
                    <select
                      value={schedule[dayName] || ''}
                      onChange={e => handleScheduleChange(dayName, e.target.value)}
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium min-h-[44px] focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] ${
                        schedule[dayName]
                          ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-[#C6A45F]/20 text-gray-400 dark:text-[#d8e7de]/40'
                      }`}
                    >
                      <option value="">Rest day</option>
                      {phase0Days.map(day => (
                        <option key={day.id} value={day.id}>
                          {day.label}{day.workoutName ? ` — ${day.workoutName}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save footer */}
        <div className="p-4 border-t border-gray-200 dark:border-[#C6A45F]/25 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || !selectedProgramId}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50"
          >
            <Layers className="w-5 h-5" />
            {saving ? 'Assigning…' : (existingAssignment ? 'Update Assignment' : 'Assign Program')}
          </button>
        </div>
      </div>
    </div>
  );
}
