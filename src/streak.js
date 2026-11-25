// The streak: consecutive UTC days with a finished quiz, kept only in this browser.
// Days are the same UTC-day seeds the quiz uses (20261125). History keeps only 14 days, so the
// streak keeps its own small value ({ lastSeed, count }) and can run past that. A streak that
// has missed a whole UTC day reads as 0; there are no grace days.

import { getDailySeed } from "./quizEngine";

export const STREAK_KEY = "moodcrumbs.streak.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export function seedToTime(seed) {
  return Date.UTC(Math.floor(seed / 10000), (Math.floor(seed / 100) % 100) - 1, seed % 100);
}

export function addDays(seed, n) {
  return getDailySeed(new Date(seedToTime(seed) + n * DAY_MS));
}

// The streak after finishing a quiz on `seed`. A same-day retake changes nothing.
export function nextStreak(prev, seed) {
  if (prev && prev.lastSeed >= seed) return prev; // same day, or an older day finished late
  if (prev && prev.lastSeed === addDays(seed, -1)) return { lastSeed: seed, count: prev.count + 1 };
  return { lastSeed: seed, count: 1 };
}

// The streak as it stands on `todaySeed`: alive if the last quiz was today or yesterday.
export function currentStreak(state, todaySeed = getDailySeed()) {
  if (!state) return 0;
  if (state.lastSeed === todaySeed || state.lastSeed === addDays(todaySeed, -1)) return state.count;
  return 0;
}

// For people who used the quiz before the streak existed: the run of consecutive days at the
// top of their history.
export function streakFromHistory(history) {
  const seeds = [...new Set((history || []).map((e) => e.seed))].sort((a, b) => b - a);
  if (!seeds.length) return null;
  let count = 1;
  while (count < seeds.length && seeds[count] === addDays(seeds[count - 1], -1)) count += 1;
  return { lastSeed: seeds[0], count };
}

const store = (storage) => {
  try { return storage || window.localStorage; } catch { return null; }
};

export function loadStreak(history, storage) {
  const s = store(storage);
  try {
    const v = s && JSON.parse(s.getItem(STREAK_KEY) || "null");
    if (v && Number.isInteger(v.lastSeed) && Number.isInteger(v.count) && v.count > 0) return v;
  } catch { /* corrupt or blocked: fall back to history */ }
  return streakFromHistory(history);
}

export function saveStreak(state, storage) {
  const s = store(storage);
  if (s) {
    try { s.setItem(STREAK_KEY, JSON.stringify(state)); } catch { /* full or blocked */ }
  }
  return state;
}
