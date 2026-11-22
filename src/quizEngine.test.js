import { K, QUESTION_POOL, coverage, dayLabel, getDailySeed, pickArchetype, pickDailySet, retrySeed, shuffleSeeded } from "./quizEngine";

const novemberSeeds = Array.from({ length: 30 }, (_, i) => 20261101 + i);

test("regression: the 22 Nov 2026 plain shuffle made an archetype unreachable; the daily set doesn't", () => {
  const plain = coverage(shuffleSeeded(QUESTION_POOL, 20261122).slice(0, 5), 20261122);
  expect(plain.unreachable.length).toBeGreaterThan(0);
  const set = pickDailySet(QUESTION_POOL, 5, 20261122);
  expect(set.retry).toBeGreaterThan(0);
  expect(coverage(set.questions, 20261122).unreachable).toEqual([]);
});

test("every November 2026 day makes all 10 archetypes reachable, and no tie is left to chance", () => {
  for (const seed of novemberSeeds) {
    const { questions, retry } = pickDailySet(QUESTION_POOL, 5, seed);
    const c = coverage(questions, seed);
    expect(c.combos).toBe(1024);
    expect(c.unreachable).toEqual([]);
    expect(Object.keys(c.wins)).toHaveLength(10);
    expect(c.tiesSettledBySeed).toBe(0);
    expect(retry).toBeGreaterThanOrEqual(0);
  }
});

test("retry seeds never collide with another day's seed", () => {
  expect(retrySeed(20261122, 0)).toBe(20261122);
  expect(retrySeed(20261122, 1)).toBe(20261122001);
  expect(retrySeed(20261122, 1)).not.toBe(20261123);
});

test("the day is a UTC day: the same instant gives the same seed in every time zone", () => {
  // 23:30 UTC on 22 Nov is already 23 Nov in Tallinn and still 22 Nov in New York.
  const instant = new Date(Date.UTC(2026, 10, 22, 23, 30));
  expect(getDailySeed(instant)).toBe(20261122);
  expect(dayLabel(20261122)).toBe("Sunday 22 Nov");
});

const ans = (text, scores) => ({ text, scores });

test("scoring returns the winner and the answers that pointed to it", () => {
  const r = pickArchetype([ans("a", { [K.RP]: 3, [K.EW]: 1 }), ans("b", { [K.RP]: 3 }), ans("c", { [K.QL]: 1 })], 1);
  expect(r.archetype).toBe(K.RP);
  expect(r.attribution).toEqual(["a", "b"]);
});

test("ties: spread beats one big answer, then the latest answer decides", () => {
  // DC 3 from one answer; SS 3 from two answers (2 + 1): SS wins on spread.
  const spread = pickArchetype([ans("x", { [K.DC]: 3 }), ans("y", { [K.SS]: 2 }), ans("z", { [K.SS]: 1 })], 1);
  expect(spread.archetype).toBe(K.SS);
  // Same points, same spread: the archetype from the later answer wins.
  const recent = pickArchetype([ans("first", { [K.QL]: 3 }), ans("second", { [K.BR]: 3 })], 1);
  expect(recent.archetype).toBe(K.BR);
  // Same answers, same day: always the same result.
  expect(pickArchetype([ans("first", { [K.QL]: 3 }), ans("second", { [K.BR]: 3 })], 1)).toEqual(recent);
});
