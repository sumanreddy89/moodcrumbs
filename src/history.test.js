import { HISTORY_DAYS, HISTORY_KEY, clearHistory, entryFor, loadHistory, saveResult } from "./history";

const memory = () => {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: (k) => { delete data[k]; }, data };
};
const entry = (seed, archetype = "The Rizz Prophet") => ({ seed, archetype, crumb: "c", vibe: "v", attribution: [], answers: [] });

test("saves, loads, and keeps one entry per day (a retake replaces it)", () => {
  const s = memory();
  saveResult(entry(20261121), s);
  saveResult(entry(20261122, "The Rizz Prophet"), s);
  saveResult(entry(20261122, "The Hyperpop Healer"), s);
  const list = loadHistory(s);
  expect(list.map((e) => e.seed)).toEqual([20261122, 20261121]);
  expect(entryFor(list, 20261122).archetype).toBe("The Hyperpop Healer");
});

test("keeps only the last 14 days", () => {
  const s = memory();
  for (let d = 1; d <= 20; d++) saveResult(entry(20261100 + d), s);
  const list = loadHistory(s);
  expect(list).toHaveLength(HISTORY_DAYS);
  expect(list[0].seed).toBe(20261120);
});

test("clear removes everything", () => {
  const s = memory();
  saveResult(entry(20261122), s);
  clearHistory(s);
  expect(loadHistory(s)).toEqual([]);
  expect(s.data[HISTORY_KEY]).toBeUndefined();
});

test("corrupt or blocked storage doesn't crash", () => {
  const s = memory();
  s.setItem(HISTORY_KEY, "{not json");
  expect(loadHistory(s)).toEqual([]);
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  expect(loadHistory(blocked)).toEqual([]);
  expect(() => saveResult(entry(20261122), blocked)).not.toThrow();
  expect(() => clearHistory(blocked)).not.toThrow();
});
