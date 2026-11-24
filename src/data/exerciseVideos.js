// Short "how to" demo videos, matched to exercises by name.
// Each entry lists every spelling used across saved workouts; matching ignores case,
// punctuation and spacing (see normalizeExerciseName). An exercise's own `videoUrl`
// (set in the Workout Builder) always takes priority over this list.
//
// To add or change a video: edit the `id` (the part after "watch?v=" in a YouTube link)
// or add a spelling to `names`.

const VIDEO_GROUPS = [
  // ── Warm-up / mobility ─────────────────────────────────────────────────────
  { id: '_UvmPNGtlPM', names: ['Band External Rotation'] },
  { id: 'stwYTTPXubo', names: ['Band Pull-Apart', 'Band Pull Aparts'] },
  { id: 'UVMEnIaY8aU', names: ['Arm Circles'] },
  { id: 'GxDF2AYsI1Q', names: ['Cable External Rotation'] },
  { id: 'difYoBtZi2s', names: ['Leg Swings (Forward)', 'Leg Swings'] },
  { id: 'M5zfGCbqL3A', names: ['Hip Crossover'] },

  // ── Chest ──────────────────────────────────────────────────────────────────
  { id: 'CjHIKDQ4RQo', names: ['Barbell Bench Press', 'bench press'] },
  { id: '2jFFCy8JBU8', names: ['Incline Barbell Bench Press'] },
  { id: 'Oq5MMAbUE2o', names: ['Neutral-Grip Dumbbell Press'] },
  { id: 'oZVCBM9f8Eo', names: ['Incline Dumbbell Press', 'Incline Chest Press Dumbbell'] },
  { id: '4R_GwRhG0rY', names: ['Decline Dumbbell Press'] },
  { id: 'JSDpq14vCZ8', names: ['Incline Dumbbell Flyes', 'Incline Dumbbell Fly'] },
  { id: 'CIykDiF4sfg', names: ['Chest Press Machine'] },
  { id: 'sqNwDkUU_Ps', names: ['Incline Chest Press', 'Incline Chest Press Machine'] },
  { id: 'b8_hggYXiu8', names: ['Single Arm Chest Press'] },
  { id: 'eGjt4lk6g34', names: ['Pec Deck Machine', 'Pec Deck'] },
  { id: 'QcTcWpkn_bw', names: ['Cable Crossover', 'Cable Crossovers'] },
  { id: 'wnFEC_34Bls', names: ['Cable Flyes (Low to High)'] },
  { id: 'Env8gAr_QnE', names: ['Push-Up', 'Push-Ups', 'Press Up', 'Press Ups'] },
  { id: 'fx6lSVNvu-4', names: ['Landmine Press'] },

  // ── Back ───────────────────────────────────────────────────────────────────
  { id: 'JGeRYIZdojU', names: ['Lat Pulldown'] },
  { id: '7JnP8dFbS14', names: ['Wide Grip Lat Pulldowns', 'Wide Grip Lat Pulldown', 'Lat Pull Down Wide'] },
  { id: 'IjoFCmLX7z0', names: ['Lat Pulldown - Neutral Grip', 'Lat Pulldown V-bar'] },
  { id: 'SNiwpA13ZLU', names: ['Lat Pulldown Underhand Grip'] },
  { id: 'HBC5s98wXko', names: ['One-Arm Lat Pulldown', 'Single-Arm Cable Lat Pulldown', 'Single-Arm Lat Pulldown'] },
  { id: 'ey9Fv3FGrRg', names: ['Straight-Arm Pulldown', 'Strait Arm Cable Pushdown', 'Straight Arm Cable Pushdown', 'Straight Arm Cable Push Down'] },
  { id: 'PHdHnZcbsB8', names: ['Pull-Up', 'Pull-Ups', 'Chin-Up'] },
  { id: 'wFj808u2HWU', names: ['Assisted Pull-Up'] },
  { id: 'FsK19s8eGFs', names: ['Barbell Row', 'Bent Over Barbell Rows', 'Bent-Over Barbell Row', 'Bent Over Row'] },
  { id: '6gvmcqr226U', names: ['Bent-Over Row - DB'] },
  { id: 'ZRSGpBUVcNw', names: ['Single-Arm Dumbbell Row', 'Single-Arm Row'] },
  { id: 'vmX58YYK3-8', names: ['Chest-Supported Row'] },
  { id: 'lJoozxC0Rns', names: ['Seated Cable Row', 'Seated Double Arm Cable Row'] },
  { id: 'Wv7f0uIKh8o', names: ['Barbell Pendlay Row', 'Pendlay Row'] },
  { id: 'SkMJJKd8Bec', names: ['Seated Single Arm Cable Row'] },
  { id: '0Po47vvj9g4', names: ['Rope Face Pull', 'Face Pulls', 'Cable Face Pulls'] },
  { id: 'ya16Y_CbEBk', names: ['Seated Face Pull', 'Seated Rope Face Pull'] },
  { id: 'H8Swl1N-uis', names: ['Hyperextensions', 'Hyperextension - Weighted'] },
  { id: 'TizvV0WRALA', names: ['Back Extensions w/Ball'] },

  // ── Shoulders ──────────────────────────────────────────────────────────────
  { id: 'TsduLWuhlFM', names: ['DB Shoulder Press', 'Dumbbell Shoulder Press', 'Seated Shoulder Press', 'Seated Shoulder Press Dumbbell'] },
  { id: 'aI2hGzsAMXs', names: ['Standing Dumbelll Press', 'Standing Dumbbell Press'] },
  { id: 'GcY6TZxfS0k', names: ['Machine Shoulder Press', 'Shoulder Press Machine'] },
  { id: 'jeJttN2EWCo', names: ['Arnold Press'] },
  { id: 'z-kOn7flIZg', names: ['Dumbbell Lateral Raise', 'Lateral Raises', 'Standing Lateral into Front Raise Dumbbell', 'Standing Lateral Raise', 'Standing Lateral Raise DB'] },
  { id: 'Z5FA9aq3L6A', names: ['Cable Lateral Raise'] },
  { id: 'NNAs8jx_zJI', names: ['Seated Lateral Raise - Machine'] },
  { id: 'zkP0MsTcIVU', names: ['Standing Front Raise DB', 'Standing Alternating Front Raise Dumbbell'] },
  { id: 'nlkF7_2O_Lw', names: ['Rear Delt Fly', 'Bent Over Delt Raise', 'Bent Over Rear Delt Fly Dumbbell'] },
  { id: 'er15V96hG5U', names: ['Rear Delt Cable Fly'] },
  { id: 'pUFA_clWNKA', names: ['DB Seated Around the World', 'Seated DB around the world'] },

  // ── Arms ───────────────────────────────────────────────────────────────────
  { id: '6LrOTcr595A', names: ['EZ-Bar Curl'] },
  { id: 'MtXdEcW3Eog', names: ['Dumbbell Curl', 'Standing Bicep Curl', 'Standing Curl - DB'] },
  { id: 'iixND1P2lik', names: ['Alternating Dumbbell Curl', 'Standing Alternating Bicep Curl Dumbbell'] },
  { id: 'B4RznoFvTl4', names: ['Hammer Curl', 'Dumbbell Incline Seated Hammer Curl'] },
  { id: 'XVQBeug_9LU', names: ['Incline Dumbbell Curl'] },
  { id: '2MUEL4nL6hA', names: ['Cable Curl', 'Cable Curls'] },
  { id: 'NQpUonxlawY', names: ['Cable Rope Bicep Curl'] },
  { id: '2JOXXpD4HcY', names: ['21s Curl', '21’s', "21's"] },
  { id: '-xa-6cQaZKY', names: ['Tricep Pushdown (Rope)', 'Rope Tricep Pushdowns', 'Tricep Rope Cable Pulldown', 'Tricep Rope Pressdown'] },
  { id: 'Cp_bShvMY4c', names: ['Single-Arm Pushdown'] },
  { id: 'sDxcKjCqXAo', names: ['Skull Crusher', 'Skull Crushers'] },
  { id: '-Vyt2QdsR7E', names: ['Overhead Tricep Extension', 'DB Tricep Extensions', 'Dumbbell Standing Overhead Tricep Extension'] },
  { id: 'mcN3AGI4M1Q', names: ['Narrow Grip DB Tricep Press'] },
  { id: 'DzA2xZhDGeo', names: ['Close-Grip Bench Press'] },
  { id: 'JPmbMOu4IYw', names: ['Tricep Kickbacks'] },
  { id: 'c8_a-jjTrOo', names: ['Cable Tricep Kickbacks'] },
  { id: 'qrS6aa0aQ9I', names: ['Dips (Tricep-Focused)'] },
  { id: '0326dy_-CzM', names: ['Bench Dip', 'Bench Dips'] },

  // ── Legs ───────────────────────────────────────────────────────────────────
  { id: 'CqN02EAAtc8', names: ['Safety Bar Squat'] },
  { id: 'l83R5PblSMA', names: ['Bodyweight Squat'] },
  { id: 'GPzRf3sfpbU', names: ['Heel Elevated Squat', 'Elevated Goblet Squat', 'Heels Elevated Goblet Squat DB', 'Heels Elevated Goblet Squat Dumbbell'] },
  { id: '3zOtNKXkyt0', names: ['Suitcase Squat'] },
  { id: '_4Mxm3RAboU', names: ['Smith Machine Sumo Squat'] },
  { id: 'E5hxX8uCABo', names: ['Smith Machine Back Squat Quad Dominant', 'Back squat smith machine quad focus'] },
  { id: 'scs5XcsZuc8', names: ['Hack Squat'] },
  { id: 'q4W4_VJbKW0', names: ['Leg Press'] },
  { id: 'QPlMYBDSRE0', names: ['Leg Press (High and Narrow)', 'Leg Press Narrow and High'] },
  { id: '4ZDm5EbiFI8', names: ['Leg Extension', 'Leg Extensions', 'Leg Extension 1 1/4 Reps'] },
  { id: 'SbSNUXPRkc8', names: ['Lying Leg Curl', 'Lying Hamstring Curl', 'Hamstring Curl', 'Hamstring Curls', 'Leg Curls'] },
  { id: 'Orxowest56U', names: ['Seated Leg Curl', 'Seated hamstring curls'] },
  { id: 'XkESHgkTdFw', names: ['Hamstring Curls w/Ball'] },
  { id: 'zU-f6DMCdAI', names: ['Romanian Deadlift', 'BB Romanian Deadlift'] },
  { id: '5WxMW-Fu5KU', names: ['Romanian Deadlift - DB'] },
  { id: '93jCohkGzJQ', names: ['Kickstand Deadlift'] },
  { id: 'GxsLrTzyGUU', names: ['Conventional Deadlift', 'Deadlift'] },
  { id: 'v709aJKv-gM', names: ['Trap Bar Deadlift'] },
  { id: 'TEXl2b3__S4', names: ['Bulgarian Split Squat'] },
  { id: 'oLi2QcD0B3M', names: ['Smith Machine Bulgarian Split Squat'] },
  { id: 'mAgbXQdd4LM', names: ['Walking Lunge', 'Walking Lunges', 'Walking DB Lunge'] },
  { id: 'xrPteyQLGAo', names: ['Reverse Lunge', 'Reverse Lunges'] },
  { id: 'Q2k3kYbtOcI', names: ['Reverse Lunge - DB', 'Reverse Lunge Dumbbell'] },
  { id: 'S8UKm6oHGis', names: ['Alternating Posterior Deficit Lunge'] },
  { id: '2EyH9MN7hYE', names: ['Curtsy Lunge', 'Curtsy Lunge Dumbbell'] },
  { id: '5UlAVMb8PCc', names: ['Smith Machine Curtsy Lunge'] },
  { id: 'DxUNi119Qzs', names: ['Single-Leg Step Up', 'Step Up'] },
  { id: 'Zep-wKHWkNM', names: ['Standing Calf Raise', 'Standing Calf Raises'] },
  { id: '3ZRe_QpvRPg', names: ['Seated Calf Raise'] },

  // ── Glutes ─────────────────────────────────────────────────────────────────
  { id: 'aweBS7K71l8', names: ['Barbell Hip Thrust', 'Hip Thrusts', 'BB Hip Thrust Dead Start'] },
  { id: 'CXGJ36cQyWo', names: ['Smith Machine Hip Thrust', 'Smith Machine Hip-Thrust'] },
  { id: 'OjNdmHWVSek', names: ['Hip Thrust B Stance', 'B-Stance Hip Thrust'] },
  { id: 'Zr2RLjIjCN0', names: ['Banded Glute Bridge'] },
  { id: '7eDGseX8gbE', names: ['Banded Glute Kickbacks'] },
  { id: 'SqO-VUEak2M', names: ['Cable Kickback (Glute)', 'Gable Glute Kickback', 'Cable Glute Kickback'] },
  { id: 'InAOx0qA9EE', names: ['Banded Side Clams'] },
  { id: 'G_8LItOiZ0Q', names: ['Hip Abduction'] },
  { id: 'afpCTlFdyl8', names: ['Hip Abduction - Leaning Forward'] },

  // ── Core ───────────────────────────────────────────────────────────────────
  { id: 'q4rDeHYMcIg', names: ['Plank'] },
  { id: '2yenA3JNh5Q', names: ['Plank w/Ball'] },
  { id: 'o4GKiEoYClI', names: ['Dead Bug'] },
  { id: 'RD_A-Z15ER4', names: ['Hanging Knee Raise'] },
  { id: 'Yrtvs-nEnk0', names: ['Hanging Leg Raise'] },
  { id: 'JB2oyawG9KI', names: ['Laying Leg Raises', 'Lying Leg Raises'] },
  { id: 'ToJeyhydUxU', names: ['Cable Crunch', 'Cable Rope Crunch'] },
  { id: 'fuPFq2EYswE', names: ['Ab Crunch Machine'] },
  { id: 'O4d3kd1ZLyc', names: ['Stability Ball Crunch'] },
  { id: 'SBO5aFR09D4', names: ['Ab Wheel Rollout', 'Ab-Roller'] },
  { id: '99T1EfpMwPA', names: ['Russian Twist'] },
  { id: 'NnVhqMQRvmM', names: ['Crunch', 'Weighted Crunch'] },
  { id: 'wnuLak2onoA', names: ['Lying Bicycle', 'Bicycle Crunch'] },
  { id: 'em4gADvYvMA', names: ['Forearm Plank Hip Dips', 'Plank Hip Dips'] },
  { id: 'ia57H04rLyU', names: ['Side Plank Hip Drops'] },
  { id: 'mvvu8imyMFs', names: ['Cable Chops (Low to High)'] },
];

export function normalizeExerciseName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const VIDEO_BY_NAME = new Map();
VIDEO_GROUPS.forEach(({ id, names }) => {
  names.forEach(n => VIDEO_BY_NAME.set(normalizeExerciseName(n), id));
});

// Pull a YouTube video id out of any common link form (watch, youtu.be, shorts, embed).
export function youTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// -> { url, youTubeId } | null. Prefers the exercise's own videoUrl, then the name match.
export function getExerciseVideo(exercise) {
  const own = exercise?.videoUrl?.trim();
  if (own) return { url: own, youTubeId: youTubeId(own) };
  const id = VIDEO_BY_NAME.get(normalizeExerciseName(exercise?.name || exercise?.exerciseName));
  return id ? { url: `https://www.youtube.com/watch?v=${id}`, youTubeId: id } : null;
}

export const VIDEO_IDS = VIDEO_GROUPS.map(g => g.id);
