// Total-pounds ("volume") math, shared by every screen that shows it.
//
// What gets logged: the weight on ONE dumbbell (or the bar/stack), and reps for ONE side.
// Weight charts and PRs use that number as-is. Only volume accounts for both sides:
//   per-side exercises (two dumbbells, or one-arm/one-leg work done on both sides) count x2.
// Bodyweight moves log 0 lbs (or just the added weight) and timed sets count 0.

const PER_SIDE_PATTERN = /dumbbell|\bdb\b|single[\s-](arm|leg)|one[\s-](arm|leg)|bulgarian/i;
const SINGLE_WEIGHT_PATTERN = /pullover|goblet/i;

// Default for the builder checkbox, and fallback for history saved before the flag existed.
export const guessPerSide = (name = '') =>
  PER_SIDE_PATTERN.test(name) && !SINGLE_WEIGHT_PATTERN.test(name);

// `ex` is a workout exercise definition or a saved session entry (which uses exerciseName).
export const isPerSide = (ex = {}) =>
  ex.perSide ?? ex.oneArmPerSet ?? guessPerSide(ex.exerciseName || ex.name);

export const exerciseVolume = (exData = {}) => {
  if (exData.useDuration) return 0;
  const multiplier = isPerSide(exData) ? 2 : 1;
  return (exData.sets || [])
    .filter(s => s.completed)
    .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0) * multiplier, 0);
};

// Accepts a session's exercises as either an object keyed by index or an array.
export const sessionVolume = (exercises) =>
  Object.values(exercises || {}).reduce((sum, ex) => sum + exerciseVolume(ex || {}), 0);
