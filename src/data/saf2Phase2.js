// StrongAF 2.0 — Phase 2 workouts, built from the client's app screenshots.
// Imported 2026-11-24. Kept as a record; scripts/seed-saf2-p2.mjs can re-run the import.
import { ref as dbRef, set, get, update } from 'firebase/database';

export const PROGRAM_ID = '-P1_RjYRNhNLrzf8oDTd';     // StrongAF 2.0
export const PHASE_NAME = 'StrongAF Phase 2';

let tempId = Date.now();
// opts: { rest, notes, perSide, secs (timed set), ss (superset group id) }
const ex = (name, section, muscleGroup, sets, reps, opts = {}) => ({
  name,
  section,
  muscleGroup,
  sets,
  reps: opts.secs ? 10 : reps,
  restSeconds: opts.rest ?? (section === 'warmup' ? 30 : section === 'cooldown' ? 0 : 60),
  recommendedWeight: 0,
  notes: opts.notes || '',
  oneArmPerSet: !!opts.perSide,
  useDuration: !!opts.secs,
  durationMinutes: 0,
  durationSeconds: opts.secs || 30,
  ...(opts.ss ? { supersetGroupId: opts.ss } : {}),
  tempId: tempId++,
});

const GLUTE_WARMUP = [
  ex('Banded Glute Bridge', 'warmup', 'legs', 1, 20),
  ex('Banded Side Clams', 'warmup', 'legs', 1, 15, { notes: '15 each side' }),
];

export const WORKOUTS = [
  {
    key: 'saf2-p2-glutes-hammies',
    day: 'day-0',
    name: "SAF 2.0 P2 Glutes and Hammy's",
    description: 'StrongAF 2.0 Phase 2 — 4 Day Split 2: Glutes and Hamstrings',
    exercises: [
      ...GLUTE_WARMUP,
      ex('BB Romanian Deadlift', 'work', 'legs', 5, '8-12', { rest: 90, notes: 'Sets 1–2: heavy, 4 reps. Remaining sets: 8–12 reps.' }),
      ex('Bulgarian Split Squat', 'work', 'legs', 3, '8-10', { perSide: true, notes: 'Each leg' }),
      ex('Lying Hamstring Curl', 'work', 'legs', 3, '10-12'),
      ex('Curtsy Lunge Dumbbell', 'work', 'legs', 3, '10-12', { perSide: true, notes: 'Each leg' }),
      ex('Cable Glute Kickback', 'work', 'legs', 3, '12-15', { perSide: true, notes: 'Each leg' }),
    ],
  },
  {
    key: 'saf2-p2-back-arms',
    day: 'day-1',
    name: 'SAF 2.0 P2 Back & Arms',
    description: 'StrongAF 2.0 Phase 2 — 4 Day Split 2: Back & Arms',
    exercises: [
      ex('Barbell Pendlay Row', 'work', 'back', 3, '8-12'),
      ex('Seated Double Arm Cable Row', 'work', 'back', 3, '8-12', { ss: 'ss_p2_back_1' }),
      ex('Bent Over Rear Delt Fly Dumbbell', 'work', 'shoulders', 3, '10-12', { ss: 'ss_p2_back_1', perSide: true }),
      ex('Lat Pull Down Wide', 'work', 'back', 3, '8-10', { ss: 'ss_p2_back_2' }),
      ex('Lat Pull Down Wide', 'work', 'back', 3, 12, { ss: 'ss_p2_back_2', notes: 'Lighter weight, 12 reps' }),
      ex('Seated Rope Face Pull', 'work', 'shoulders', 4, '10-12', { notes: 'Last sets: 12–15 reps' }),
      ex('Standing Lateral into Front Raise Dumbbell', 'work', 'shoulders', 4, 10, { perSide: true }),
      ex('Straight Arm Cable Push Down', 'work', 'back', 4, '10-12'),
      ex('Standing Alternating Bicep Curl Dumbbell', 'work', 'arms', 4, 0, { secs: 30, ss: 'ss_p2_back_3', perSide: true }),
      ex('Bench Dips', 'work', 'arms', 4, 0, { secs: 30, ss: 'ss_p2_back_3' }),
      ex('Standing Alternating Front Raise Dumbbell', 'work', 'shoulders', 4, 0, { secs: 30, ss: 'ss_p2_back_3', perSide: true }),
      ex('Seated Shoulder Press Dumbbell', 'work', 'shoulders', 4, 0, { secs: 30, ss: 'ss_p2_back_3', perSide: true }),
      ex('Lying Chest Shoulder Stretch', 'cooldown', 'mobility', 1, 0, { secs: 30, ss: 'ss_p2_back_cd' }),
      ex('Standing Tricep Stretch', 'cooldown', 'mobility', 1, 0, { secs: 30, ss: 'ss_p2_back_cd' }),
    ],
  },
  {
    key: 'saf2-p2-quads-glutes',
    day: 'day-2',
    name: 'SAF 2.0 P2 Quads and Glutes',
    description: 'StrongAF 2.0 Phase 2 — 4 Day Split 2: Quads and Glutes',
    exercises: [
      ...GLUTE_WARMUP.map(e => ({ ...e, tempId: tempId++ })),
      ex('Smith Machine Back Squat Quad Dominant', 'work', 'legs', 4, '8-12', { rest: 90 }),
      ex('Hip Thrust B Stance', 'work', 'legs', 3, '10-12', { perSide: true, notes: 'Each leg' }),
      ex('Reverse Lunge Dumbbell', 'work', 'legs', 3, '10-12', { perSide: true, notes: 'Each leg' }),
      ex('Leg Extension 1 1/4 Reps', 'work', 'legs', 3, 12, { ss: 'ss_p2_quads_1', notes: '1¼ reps: full rep, lower ¼ of the way, back up, then all the way down = 1 rep' }),
      ex('Heels Elevated Goblet Squat Dumbbell', 'work', 'legs', 3, '10-12', { ss: 'ss_p2_quads_1' }),
    ],
  },
  {
    key: 'saf2-p2-chest-abs',
    day: 'day-3',
    name: 'SAF 2.0 P2 Chest & Abs',
    description: 'StrongAF 2.0 Phase 2 — 4 Day Split 2: Chest & Abs',
    exercises: [
      ex('Cable Crossover', 'work', 'chest', 3, '8-12'),
      ex('Press Up', 'work', 'chest', 3, '6-8'),
      ex('Incline Chest Press Dumbbell', 'work', 'chest', 3, '8-12', { perSide: true }),
      ex('Dumbbell Incline Seated Hammer Curl', 'work', 'arms', 3, '8-12', { ss: 'ss_p2_chest_1', perSide: true }),
      ex('Dumbbell Standing Overhead Tricep Extension', 'work', 'arms', 3, '10-12', { ss: 'ss_p2_chest_1', perSide: false }),
      ex('Cable Rope Bicep Curl', 'work', 'arms', 3, '12-15'),
      ex('Weighted Crunch', 'work', 'core', 3, '12-15', { ss: 'ss_p2_chest_2' }),
      ex('Forearm Plank Hip Dips', 'work', 'core', 3, 20, { ss: 'ss_p2_chest_2' }),
      ex('Lying Bicycle', 'work', 'core', 3, 20, { ss: 'ss_p2_chest_2' }),
      ex('Bench Dips', 'work', 'arms', 3, 15, { notes: 'Abs workout' }),
      ex('Crunch', 'work', 'core', 4, 0, { secs: 30, notes: 'Abs workout' }),
      ex('Side Plank Hip Drops', 'work', 'core', 4, 0, { secs: 30, notes: 'Abs workout' }),
      ex('Russian Twist', 'work', 'core', 4, 0, { secs: 30, notes: 'Abs workout' }),
    ],
  },
];

// Saves the 4 workouts (fixed keys, so re-running updates instead of duplicating) and fills
// Days A–D of the Phase 2 phase. Checks the program/phase/days exist before writing anything.
export async function importSaf2Phase2(db) {
  const program = (await get(dbRef(db, `programs/${PROGRAM_ID}`))).val();
  if (!program) throw new Error('StrongAF 2.0 program not found.');
  const phases = Array.isArray(program.phases) ? program.phases : Object.values(program.phases || {});
  const phaseIdx = phases.findIndex(p => p?.name === PHASE_NAME);
  if (phaseIdx < 0) throw new Error(`Phase "${PHASE_NAME}" not found in ${program.name}.`);
  const days = Array.isArray(phases[phaseIdx].days) ? phases[phaseIdx].days : Object.values(phases[phaseIdx].days || {});
  const dayIdxFor = (dayId) => {
    const i = days.findIndex(d => d?.id === dayId);
    if (i < 0) throw new Error(`${PHASE_NAME} has no ${dayId}.`);
    return i;
  };
  WORKOUTS.forEach(w => dayIdxFor(w.day));

  const now = new Date().toISOString();
  const programUpdates = { updatedAt: now };
  const log = [];
  for (const w of WORKOUTS) {
    await set(dbRef(db, `workouts/${w.key}`), {
      name: w.name,
      description: w.description,
      exercises: w.exercises,
      warmup: w.exercises.filter(e => e.section === 'warmup'),
      work: w.exercises.filter(e => e.section === 'work'),
      cooldown: w.exercises.filter(e => e.section === 'cooldown'),
      createdAt: now,
      updatedAt: now,
    });
    const dayIdx = dayIdxFor(w.day);
    programUpdates[`phases/${phaseIdx}/days/${dayIdx}/workoutId`] = w.key;
    programUpdates[`phases/${phaseIdx}/days/${dayIdx}/workoutName`] = w.name;
    log.push(`${w.name} → ${days[dayIdx].label}`);
  }
  await update(dbRef(db, `programs/${PROGRAM_ID}`), programUpdates);
  return { programName: program.name, log };
}
