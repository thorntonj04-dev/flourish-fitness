import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit, ChevronDown, ChevronUp, Layers, Dumbbell, AlertCircle } from 'lucide-react';
import { ref as dbRef, get, set, push, remove, update } from 'firebase/database';
import { db } from '../../firebase';
import WorkoutPickerModal from './WorkoutPickerModal';

const DAY_LABELS = ['Day A', 'Day B', 'Day C', 'Day D', 'Day E'];

function buildDefaultDays(count, existingDays = []) {
  return Array.from({ length: count }, (_, i) => ({
    id: `day-${i}`,
    label: DAY_LABELS[i],
    workoutId: existingDays[i]?.workoutId || null,
    workoutName: existingDays[i]?.workoutName || null,
  }));
}

function newPhase(number) {
  return {
    id: `phase-${Date.now()}-${number}`,
    name: `Phase ${number}`,
    durationWeeks: 4,
    workoutsPerWeek: 3,
    days: buildDefaultDays(3),
  };
}

export default function ProgramBuilder() {
  const [view, setView] = useState('list');
  const [programs, setPrograms] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [currentProgram, setCurrentProgram] = useState({ name: '', description: '', phases: [] });
  const [expandedPhases, setExpandedPhases] = useState({});
  const [saving, setSaving] = useState(false);

  // Workout picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // { phaseIndex, dayIndex }

  useEffect(() => {
    loadPrograms();
    loadWorkouts();
  }, []);

  const loadPrograms = async () => {
    try {
      const snap = await get(dbRef(db, 'programs'));
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, p]) => ({ id, ...p }))
          .filter(p => !p.archived)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPrograms(list);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  };

  const loadWorkouts = async () => {
    try {
      const snap = await get(dbRef(db, 'workouts'));
      if (snap.exists()) {
        setWorkouts(Object.entries(snap.val()).map(([id, w]) => ({ id, ...w })));
      }
    } catch (err) {
      console.error('Error loading workouts:', err);
    }
  };

  // ─── Program state helpers ────────────────────────────────────────────────

  const addPhase = () => {
    const n = currentProgram.phases.length + 1;
    const phase = newPhase(n);
    const newPhases = [...currentProgram.phases, phase];
    setCurrentProgram({ ...currentProgram, phases: newPhases });
    setExpandedPhases(prev => ({ ...prev, [newPhases.length - 1]: true }));
  };

  const removePhase = (index) => {
    if (!confirm(`Remove Phase ${index + 1}? This cannot be undone.`)) return;
    const newPhases = currentProgram.phases.filter((_, i) => i !== index);
    setCurrentProgram({ ...currentProgram, phases: newPhases });
  };

  const updatePhase = (index, updates) => {
    const newPhases = [...currentProgram.phases];
    newPhases[index] = { ...newPhases[index], ...updates };
    setCurrentProgram({ ...currentProgram, phases: newPhases });
  };

  const handleWorkoutsPerWeekChange = (phaseIndex, count) => {
    const existing = currentProgram.phases[phaseIndex].days || [];
    updatePhase(phaseIndex, {
      workoutsPerWeek: count,
      days: buildDefaultDays(count, existing),
    });
  };

  const openWorkoutPicker = (phaseIndex, dayIndex) => {
    setPickerTarget({ phaseIndex, dayIndex });
    setShowPicker(true);
  };

  const handlePickWorkout = (workout) => {
    const { phaseIndex, dayIndex } = pickerTarget;
    const newPhases = [...currentProgram.phases];
    const newDays = [...newPhases[phaseIndex].days];
    newDays[dayIndex] = { ...newDays[dayIndex], workoutId: workout.id, workoutName: workout.name };
    newPhases[phaseIndex] = { ...newPhases[phaseIndex], days: newDays };
    setCurrentProgram({ ...currentProgram, phases: newPhases });
    setShowPicker(false);
    setPickerTarget(null);
  };

  const clearDayWorkout = (phaseIndex, dayIndex) => {
    const newPhases = [...currentProgram.phases];
    const newDays = [...newPhases[phaseIndex].days];
    newDays[dayIndex] = { ...newDays[dayIndex], workoutId: null, workoutName: null };
    newPhases[phaseIndex] = { ...newPhases[phaseIndex], days: newDays };
    setCurrentProgram({ ...currentProgram, phases: newPhases });
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSaveProgram = async () => {
    if (!currentProgram.name.trim()) { alert('Please enter a program name.'); return; }
    if (currentProgram.phases.length === 0) { alert('Please add at least one phase.'); return; }

    setSaving(true);
    try {
      const programData = {
        name: currentProgram.name.trim(),
        description: currentProgram.description.trim(),
        phases: currentProgram.phases,
        updatedAt: new Date().toISOString(),
      };

      if (editingProgramId) {
        await update(dbRef(db, `programs/${editingProgramId}`), programData);
      } else {
        const ref = push(dbRef(db, 'programs'));
        await set(ref, { ...programData, createdAt: new Date().toISOString() });
      }

      setView('list');
      setCurrentProgram({ name: '', description: '', phases: [] });
      setEditingProgramId(null);
      setExpandedPhases({});
      loadPrograms();
    } catch (err) {
      console.error('Error saving program:', err);
      alert('Failed to save program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProgram = (program) => {
    setCurrentProgram({
      name: program.name,
      description: program.description || '',
      phases: program.phases || [],
    });
    setEditingProgramId(program.id);
    // Expand all phases by default in editor
    const expanded = {};
    (program.phases || []).forEach((_, i) => { expanded[i] = true; });
    setExpandedPhases(expanded);
    setView('editor');
  };

  const handleArchiveProgram = async (program) => {
    if (!confirm(`Archive "${program.name}"? It will no longer appear in the programs list.`)) return;
    await update(dbRef(db, `programs/${program.id}`), { archived: true });
    loadPrograms();
  };

  const handleBackToList = () => {
    if ((currentProgram.name || currentProgram.phases.length > 0) &&
        !confirm('Discard changes?')) return;
    setView('list');
    setCurrentProgram({ name: '', description: '', phases: [] });
    setEditingProgramId(null);
    setExpandedPhases({});
  };

  // ─── Incomplete day checker ───────────────────────────────────────────────

  const incompletePhases = currentProgram.phases.reduce((acc, phase, i) => {
    const missing = phase.days.filter(d => !d.workoutId).length;
    if (missing > 0) acc.push({ phaseIndex: i, missing });
    return acc;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'editor') {
    return (
      <div className="space-y-4 pb-28">
        <button onClick={handleBackToList} className="text-emerald-600 dark:text-emerald-400 font-medium text-sm py-3 min-h-[44px] flex items-center">
          ← Back to Programs
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold">{editingProgramId ? 'Edit Program' : 'New Program'}</h2>
          <p className="text-emerald-100 text-sm mt-1">Build your multi-phase training program</p>
        </div>

        {/* Program details */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-5 border border-gray-200 dark:border-[#C6A45F]/25 space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Program Details</h3>
          <input
            type="text"
            placeholder="Program name (e.g., 12-Week Strength Foundation)"
            value={currentProgram.name}
            onChange={e => setCurrentProgram({ ...currentProgram, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-base font-medium focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
          />
          <textarea
            placeholder="Description (optional)"
            value={currentProgram.description}
            onChange={e => setCurrentProgram({ ...currentProgram, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
            rows="2"
          />
        </div>

        {/* Incomplete warnings */}
        {incompletePhases.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <div className="font-semibold mb-1">Some workout slots are empty</div>
              {incompletePhases.map(({ phaseIndex, missing }) => (
                <div key={phaseIndex}>Phase {phaseIndex + 1}: {missing} day{missing > 1 ? 's' : ''} need a workout</div>
              ))}
              <div className="mt-1 text-amber-600 dark:text-amber-500">You can still save — just make sure to fill these in before assigning to clients.</div>
            </div>
          </div>
        )}

        {/* Phases */}
        {currentProgram.phases.length === 0 ? (
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-[#C6A45F]/30 text-center">
            <Layers className="w-10 h-10 mx-auto text-gray-300 dark:text-[#d8e7de]/30 mb-3" />
            <p className="text-gray-500 dark:text-[#d8e7de]/60 mb-4">No phases yet. Add your first phase to get started.</p>
            <button
              onClick={addPhase}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold inline-flex items-center gap-2 min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              Add Phase
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentProgram.phases.map((phase, phaseIndex) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                phaseIndex={phaseIndex}
                expanded={!!expandedPhases[phaseIndex]}
                onToggle={() => setExpandedPhases(prev => ({ ...prev, [phaseIndex]: !prev[phaseIndex] }))}
                onUpdate={(updates) => updatePhase(phaseIndex, updates)}
                onWorkoutsPerWeekChange={(count) => handleWorkoutsPerWeekChange(phaseIndex, count)}
                onPickWorkout={(dayIndex) => openWorkoutPicker(phaseIndex, dayIndex)}
                onClearDay={(dayIndex) => clearDayWorkout(phaseIndex, dayIndex)}
                onRemove={() => removePhase(phaseIndex)}
                canRemove={currentProgram.phases.length > 1}
              />
            ))}
          </div>
        )}

        {/* Add phase button */}
        {currentProgram.phases.length > 0 && (
          <button
            onClick={addPhase}
            className="w-full py-3.5 border-2 border-dashed border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-2xl font-semibold flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Plus className="w-5 h-5" />
            Add Phase {currentProgram.phases.length + 1}
          </button>
        )}

        {/* Fixed save bar */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-[#1E3328] border-t border-gray-200 dark:border-[#C6A45F]/25 md:relative md:bottom-auto md:border-0 md:bg-transparent md:dark:bg-transparent md:p-0">
          <button
            onClick={handleSaveProgram}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg min-h-[56px] disabled:opacity-60"
          >
            <Save className="w-6 h-6" />
            {saving ? 'Saving…' : (editingProgramId ? 'Update Program' : 'Save Program')}
          </button>
        </div>

        {/* Workout picker modal */}
        {showPicker && (
          <WorkoutPickerModal
            workouts={workouts}
            currentWorkoutId={pickerTarget ? currentProgram.phases[pickerTarget.phaseIndex]?.days[pickerTarget.dayIndex]?.workoutId : null}
            onSelect={handlePickWorkout}
            onClose={() => { setShowPicker(false); setPickerTarget(null); }}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Programs</h2>
        <p className="text-emerald-100 text-sm mt-1">Build and manage multi-phase training programs</p>
      </div>

      <button
        onClick={() => {
          setCurrentProgram({ name: '', description: '', phases: [newPhase(1)] });
          setExpandedPhases({ 0: true });
          setEditingProgramId(null);
          setView('editor');
        }}
        className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm min-h-[52px]"
      >
        <Plus className="w-5 h-5" />
        Create New Program
      </button>

      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25">
        <div className="p-5 border-b border-gray-100 dark:border-[#C6A45F]/15">
          <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Your Programs ({programs.length})</h3>
        </div>

        {programs.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="w-12 h-12 mx-auto text-gray-300 dark:text-[#d8e7de]/20 mb-3" />
            <p className="text-gray-500 dark:text-[#d8e7de]/60 mb-1">No programs yet.</p>
            <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Create a program to assign to your clients.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
            {programs.map(program => (
              <div key={program.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{program.name}</div>
                    {program.description && (
                      <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5 line-clamp-2">{program.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(program.phases || []).map((phase, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium"
                        >
                          <Layers className="w-3 h-3" />
                          {phase.name} · {phase.durationWeeks}w · {phase.workoutsPerWeek}x/wk
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditProgram(program)}
                      className="px-3.5 py-2.5 bg-blue-500 text-white rounded-xl flex items-center gap-1.5 text-sm font-semibold min-h-[44px]"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchiveProgram(program)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Archive program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {workouts.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">No workouts found.</span> Go to <span className="font-semibold">Workouts</span> to create some before building a program.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Phase Card sub-component ─────────────────────────────────────────────────

function PhaseCard({
  phase, phaseIndex, expanded, onToggle,
  onUpdate, onWorkoutsPerWeekChange,
  onPickWorkout, onClearDay, onRemove, canRemove
}) {
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
      {/* Phase header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{phaseIndex + 1}</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{phase.name || `Phase ${phaseIndex + 1}`}</div>
            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/50 mt-0.5">
              {phase.durationWeeks} weeks · {phase.workoutsPerWeek}x per week · {phase.days.filter(d => d.workoutId).length}/{phase.days.length} days assigned
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Phase editor */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-[#C6A45F]/15 p-4 space-y-4">
          {/* Phase name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">Phase Name</label>
            <input
              type="text"
              value={phase.name}
              onChange={e => onUpdate({ name: e.target.value })}
              placeholder="e.g., Foundation"
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">Duration (weeks)</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdate({ durationWeeks: Math.max(1, phase.durationWeeks - 1) })}
                className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-700 dark:text-[#d8e7de] font-bold text-xl flex items-center justify-center"
              >−</button>
              <span className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de] min-w-[3rem] text-center">{phase.durationWeeks}</span>
              <button
                onClick={() => onUpdate({ durationWeeks: Math.min(52, phase.durationWeeks + 1) })}
                className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-700 dark:text-[#d8e7de] font-bold text-xl flex items-center justify-center"
              >+</button>
              <span className="text-sm text-gray-500 dark:text-[#d8e7de]/60">weeks</span>
            </div>
          </div>

          {/* Workouts per week */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">Workouts per week</label>
            <div className="flex gap-2">
              {[3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => onWorkoutsPerWeekChange(n)}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg min-h-[52px] transition ${
                    phase.workoutsPerWeek === n
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-600 dark:text-[#d8e7de]/70'
                  }`}
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>

          {/* Workout day slots */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-2">Workouts</label>
            <div className="space-y-2">
              {phase.days.map((day, dayIndex) => (
                <div
                  key={day.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0a0a0a]/30 rounded-xl"
                >
                  <div className="w-14 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/50 uppercase">{day.label}</span>
                  </div>
                  {day.workoutId ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-800 dark:text-[#d8e7de] truncate">{day.workoutName}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onPickWorkout(dayIndex)}
                        className="px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-h-[44px]"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => onClearDay(dayIndex)}
                        className="p-2 text-gray-400 active:text-red-500 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 text-sm text-gray-400 dark:text-[#d8e7de]/40 italic">No workout assigned</div>
                      <button
                        onClick={() => onPickWorkout(dayIndex)}
                        className="px-3 py-2 text-xs font-semibold text-white bg-emerald-500 rounded-lg min-h-[44px]"
                      >
                        + Pick
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remove phase */}
          {canRemove && (
            <button
              onClick={onRemove}
              className="w-full py-2.5 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Remove Phase {phaseIndex + 1}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
