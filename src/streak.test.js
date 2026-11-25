import { getDailySeed } from "./quizEngine";
import { HISTORY_KEY, clearHistory, loadHistory, saveResult } from "./history";
import { STREAK_KEY, addDays, currentStreak, loadStreak, nextStreak, saveStreak, streakFromHistory } from "./streak";

const memory = () => {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: (k) => { delete data[k]; }, data };
};

test("day arithmetic crosses month and year ends", () => {
  expect(addDays(20261130, 1)).toBe(20261201);
  expect(addDays(20270101, -1)).toBe(20261231);
  expect(addDays(20280228, 1)).toBe(20280229);
});

test("quiz twice on one day: the streak does not double", () => {
  let s = nextStreak(null, 20261125);
  s = nextStreak(s, 20261125);
  expect(s).toEqual({ lastSeed: 20261125, count: 1 });
  expect(currentStreak(s, 20261125)).toBe(1);
});

test("consecutive days count up; one missed day resets to 0", () => {
  let s = nextStreak(null, 20261123);
  s = nextStreak(s, 20261124);
  s = nextStreak(s, 20261125);
  expect(currentStreak(s, 20261125)).toBe(3);
  expect(currentStreak(s, 20261126)).toBe(3); // still alive until today's quiz is missed
  expect(currentStreak(s, 20261127)).toBe(0); // 26 Nov missed
  expect(nextStreak(s, 20261127)).toEqual({ lastSeed: 20261127, count: 1 });
});

test("a quiz started before UTC midnight and finished after counts for the day it started", () => {
  const s = nextStreak({ lastSeed: 20261125, count: 4 }, 20261124);
  expect(s).toEqual({ lastSeed: 20261125, count: 4 });
});

test("the boundary is UTC midnight, wherever the user is", () => {
  const seedAt = (iso) => getDailySeed(new Date(iso));
  // Exactly at UTC midnight the day changes.
  expect(seedAt("2026-11-25T23:59:59Z")).toBe(20261125);
  expect(seedAt("2026-11-26T00:00:00Z")).toBe(20261126);
  // UTC+2 (Tallinn in winter): 01:30 local on the 26th is still the 25th in UTC.
  expect(seedAt("2026-11-26T01:30:00+02:00")).toBe(20261125);
  expect(seedAt("2026-11-26T02:00:00+02:00")).toBe(20261126);
  // UTC-8 (California): the day flips at 16:00 local, so two quizzes on one local afternoon
  // make two streak days.
  const before = seedAt("2026-11-25T15:30:00-08:00");
  const after = seedAt("2026-11-25T16:30:00-08:00");
  expect([before, after]).toEqual([20261125, 20261126]);
  expect(currentStreak(nextStreak(nextStreak(null, before), after), after)).toBe(2);
});

test("existing users start from the run at the top of their history", () => {
  const h = [{ seed: 20261125 }, { seed: 20261124 }, { seed: 20261122 }];
  expect(streakFromHistory(h)).toEqual({ lastSeed: 20261125, count: 2 });
  expect(streakFromHistory([])).toBeNull();
});

test("clear history: the streak is 0 and nothing throws", () => {
  const s = memory();
  saveResult({ seed: 20261125, archetype: "The Rizz Prophet" }, s);
  saveStreak({ lastSeed: 20261125, count: 5 }, s);
  clearHistory(s);
  expect(s.data[STREAK_KEY]).toBeUndefined();
  expect(s.data[HISTORY_KEY]).toBeUndefined();
  expect(currentStreak(loadStreak(loadHistory(s), s), 20261125)).toBe(0);
});

test("corrupt or blocked storage doesn't crash", () => {
  const s = memory();
  s.setItem(STREAK_KEY, "{oops");
  expect(loadStreak([], s)).toBeNull();
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  expect(loadStreak([], blocked)).toBeNull();
  expect(() => saveStreak({ lastSeed: 20261125, count: 1 }, blocked)).not.toThrow();
});
