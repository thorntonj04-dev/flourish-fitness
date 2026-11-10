// Workout streak: counts completed workouts and only breaks when a SCHEDULED workout
// day passes with no workout. Rest days (and days with nothing scheduled) never break it.
// The schedule used is the client's current one — program weekly days or direct weekly
// schedule, plus any ad-hoc dates.
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../firebase';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const localDateStr = (dateLike) => {
  const d = new Date(dateLike);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// -> { weekdays: Set<'Monday'...>, adhocDates: Set<'YYYY-MM-DD'> }
export async function loadWorkoutSchedule(userId) {
  const weekdays = new Set();
  const adhocDates = new Set();
  const assignSnap = await get(dbRef(db, `programAssignments/${userId}`));
  if (assignSnap.exists()) {
    const { weeklySchedule = {}, adhocSchedule = {} } = assignSnap.val();
    Object.entries(weeklySchedule).forEach(([day, phaseDayId]) => { if (phaseDayId) weekdays.add(day); });
    Object.entries(adhocSchedule).forEach(([date, e]) => { if (e?.workoutId) adhocDates.add(date); });
  } else {
    const schedSnap = await get(dbRef(db, `clientSchedules/${userId}`));
    if (schedSnap.exists()) {
      const { adhoc = {}, ...days } = schedSnap.val();
      Object.entries(days).forEach(([day, e]) => { if (e?.workoutId) weekdays.add(day); });
      Object.entries(adhoc).forEach(([date, e]) => { if (e?.workoutId) adhocDates.add(date); });
    }
  }
  return { weekdays, adhocDates };
}

// True if any scheduled workout day falls strictly between the last workout and today.
export function missedScheduledDay(lastWorkoutDate, schedule, now = Date.now()) {
  if (!lastWorkoutDate || !schedule) return false;
  const day = new Date(lastWorkoutDate);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() + 1);
  const todayStr = localDateStr(now);
  for (let i = 0; i < 366 && localDateStr(day) < todayStr; i++) {
    if (schedule.weekdays.has(DAY_NAMES[day.getDay()]) || schedule.adhocDates.has(localDateStr(day))) return true;
    day.setDate(day.getDate() + 1);
  }
  return false;
}

// Streak to display: the stored streak, or 0 if a scheduled day has been missed since.
export const currentStreak = (stats, schedule) =>
  !stats?.currentStreak || missedScheduledDay(stats.lastWorkoutDate, schedule) ? 0 : stats.currentStreak;
