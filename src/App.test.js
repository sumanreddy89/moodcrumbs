import { render, screen, fireEvent } from "@testing-library/react";
import App, { AI_ENABLED, WRITTEN_CRUMBS, pickDailyQuestions, pickWrittenCrumb, shuffleSeeded } from "./App";

test("the daily questions are the same for the same day and a fair shuffle", () => {
  const pool = Array.from({ length: 20 }, (_, i) => i);
  expect(pickDailyQuestions(pool, 5, 20261122)).toEqual(pickDailyQuestions(pool, 5, 20261122));
  expect(pickDailyQuestions(pool, 5, 20261122)).not.toEqual(pickDailyQuestions(pool, 5, 20261123));
  expect([...shuffleSeeded(pool, 7)].sort((a, b) => a - b)).toEqual(pool);
  // Fisher-Yates: each item lands first about equally often across many seeds.
  const firsts = new Array(4).fill(0);
  for (let seed = 1; seed <= 4000; seed++) firsts[shuffleSeeded([0, 1, 2, 3], seed)[0]] += 1;
  firsts.forEach((n) => { expect(n).toBeGreaterThan(800); expect(n).toBeLessThan(1200); });
});

test("every archetype has written crumbs, and different answers can get different ones", () => {
  Object.values(WRITTEN_CRUMBS).forEach((list) => {
    expect(list.length).toBeGreaterThanOrEqual(3);
    list.forEach((c) => { expect(c.crumb).toBeTruthy(); expect(c.vibe).toBeTruthy(); });
  });
  const a = [{ text: "x" }], b = [{ text: "y" }], c = [{ text: "zz" }];
  const picks = new Set([a, b, c].map((ans) => pickWrittenCrumb("The Rizz Prophet", ans).crumb));
  expect(picks.size).toBeGreaterThan(1);
  expect(pickWrittenCrumb("The Rizz Prophet", a)).toEqual(pickWrittenCrumb("The Rizz Prophet", a));
});

test("with the AI off, the result says it's a written crumb and comics are paused; nothing calls the API", async () => {
  expect(AI_ENABLED).toBe(false);
  global.fetch = jest.fn();
  render(<App />);
  const start = screen.getAllByRole("button")[0];
  fireEvent.click(start);
  for (let i = 0; i < 5; i++) {
    const options = screen.getAllByRole("button");
    fireEvent.click(options[0]);
  }
  expect(await screen.findByText(/a written crumb · the AI is switched off/)).toBeInTheDocument();
  expect(screen.getByText(/comic strips are paused/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
