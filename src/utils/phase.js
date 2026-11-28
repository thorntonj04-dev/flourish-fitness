// Phase scheduling for program assignments.
//
// An assignment stores the program's startDate plus an optional `phaseStartDates`
// map ({ phaseIndex: 'YYYY-MM-DD' }) of admin-chosen start dates for later phases.
// Phases without a chosen date start the day after the previous phase's
// durationWeeks run out.

// Parse 'YYYY-MM-DD' as a LOCAL date (new Date('YYYY-MM-DD') parses as UTC midnight).
function parseLocalDate(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

export function toPhaseArray(phases) {
  if (!phases) return [];
  return Array.isArray(phases) ? phases : Object.values(phases);
}

// Start date of every phase from `fromIndex` onward, given that phase `fromIndex`
// started on `fromStart`. Indexes before `fromIndex` are left undefined.
export function computePhaseStarts(phases, fromIndex, fromStart, customStarts = {}) {
  const starts = [];
  starts[fromIndex] = fromStart;
  for (let i = fromIndex + 1; i < phases.length; i++) {
    starts[i] = customStarts?.[i]
      || addDays(starts[i - 1], (phases[i - 1]?.durationWeeks || 1) * 7);
  }
  return starts;
}

// The phase in effect on a given date ('YYYY-MM-DD'), and the date it started.
// Admin-set phase dates win regardless of whether the previous phase ran its
// full length. Derived on every read rather than written back, so the stored
// assignment keeps the original program start date and the admin's phase dates.
// Dates before the program starts return the stored phase.
export function phaseOnDate(assignment, phases, dateStr) {
  const storedIdx = assignment?.currentPhase ?? 0;
  if (!assignment?.startDate || phases.length === 0) {
    return { phaseIndex: storedIdx, startDate: assignment?.startDate };
  }
  const starts = computePhaseStarts(phases, storedIdx, assignment.startDate, assignment.phaseStartDates);
  let idx = storedIdx;
  while (idx + 1 < phases.length && dateStr >= starts[idx + 1]) idx++;
  return { phaseIndex: idx, startDate: starts[idx] };
}

export function resolveCurrentPhase(assignment, phases, today = new Date()) {
  return phaseOnDate(assignment, phases, localDateStr(today));
}

// 1-based week within the phase, clamped to its duration; 0 if it hasn't started.
export function weekInPhase(startDate, durationWeeks, today = new Date()) {
  const daysElapsed = Math.floor((today.getTime() - parseLocalDate(startDate).getTime()) / 86400000);
  if (daysElapsed < 0) return 0;
  return Math.min(Math.floor(daysElapsed / 7) + 1, durationWeeks || 1);
}
