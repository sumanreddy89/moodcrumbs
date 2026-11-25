import { weekInCrumbs } from "./week";

const e = (seed, archetype, crumb = `crumb ${seed}`) => ({ seed, archetype, crumb });

test("0 days: seven blanks and no archetype", () => {
  const w = weekInCrumbs([], 20261125);
  expect(w.days.map((d) => d.seed)).toEqual([20261119, 20261120, 20261121, 20261122, 20261123, 20261124, 20261125]);
  expect(w.days.every((d) => d.entry === null)).toBe(true);
  expect(w.filled).toBe(0);
  expect(w.top).toBeNull();
});

test("1 day: that day's archetype and crumb, the rest blank", () => {
  const w = weekInCrumbs([e(20261123, "The Rizz Prophet", "hi")], 20261125);
  expect(w.filled).toBe(1);
  expect(w.days[4].entry.archetype).toBe("The Rizz Prophet");
  expect(w.top).toEqual({ archetype: "The Rizz Prophet", count: 1, crumb: "hi" });
});

test("7 days: the most frequent archetype wins, with its latest crumb", () => {
  const h = [
    e(20261125, "The Hyperpop Healer"), e(20261124, "The Rizz Prophet", "latest rizz"), e(20261123, "The Rizz Prophet"),
    e(20261122, "The Hyperpop Healer"), e(20261121, "The Rizz Prophet"), e(20261120, "The Delulu Coquette"),
    e(20261119, "The Delulu Coquette"),
  ];
  const w = weekInCrumbs(h, 20261125);
  expect(w.filled).toBe(7);
  expect(w.top).toEqual({ archetype: "The Rizz Prophet", count: 3, crumb: "latest rizz" });
});

test("a tie goes to the most recent day; days older than a week are ignored", () => {
  const h = [e(20261125, "The Hyperpop Healer"), e(20261124, "The Rizz Prophet"), e(20261110, "The Rizz Prophet")];
  const w = weekInCrumbs(h, 20261125);
  expect(w.filled).toBe(2);
  expect(w.top.archetype).toBe("The Hyperpop Healer");
});
