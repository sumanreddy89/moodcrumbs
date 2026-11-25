import { render, screen, fireEvent } from "@testing-library/react";
import App, { AI_ENABLED, WRITTEN_CRUMBS, pickDailyQuestions, pickWrittenCrumb, shuffleSeeded } from "./App";

test("the daily questions are the same for the same day and a fair shuffle", () => {
  const pool = Array.from({ length: 20 }, (_, i) => i);
  expect([...shuffleSeeded(pool, 7)].sort((a, b) => a - b)).toEqual(pool);
  expect(pickDailyQuestions(undefined, 5, 20261122)).toEqual(pickDailyQuestions(undefined, 5, 20261122));
  expect(pickDailyQuestions(undefined, 5, 20261122)).not.toEqual(pickDailyQuestions(undefined, 5, 20261123));
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
  expect(screen.getByText(/^you said ".+"\. very .+ of you\.$|^you said ".+" and ".+"\. very .+ of you\.$/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("the result shows Day 1, and a same-day retake keeps it at Day 1", async () => {
  window.localStorage.clear();
  global.fetch = jest.fn();
  const finish = async () => {
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getAllByRole("button")[0]);
    return screen.findByTestId("streak");
  };
  const { unmount } = render(<App />);
  fireEvent.click(screen.getByText(/find out who you are/));
  expect((await finish()).textContent).toBe("Day 1");
  unmount();
  render(<App />);
  fireEvent.click(screen.getByText(/take it again anyway/));
  expect((await finish()).textContent).toBe("Day 1");
});

const finishQuiz = () => { for (let i = 0; i < 5; i++) fireEvent.click(screen.getAllByRole("button")[0]); };

test("from Day 3 the result offers the week in crumbs: 7 days, blanks where no quiz", async () => {
  window.localStorage.clear();
  global.fetch = jest.fn();
  const { getDailySeed } = require("./quizEngine");
  const { addDays } = require("./streak");
  const t = getDailySeed();
  const past = [1, 2].map((n) => ({ seed: addDays(t, -n), archetype: "The Rizz Prophet", crumb: "old crumb", vibe: "v" }));
  window.localStorage.setItem("moodcrumbs.history.v1", JSON.stringify(past));
  render(<App />);
  fireEvent.click(screen.getByText(/find out who you are/));
  finishQuiz();
  expect((await screen.findByTestId("streak")).textContent).toBe("Day 3 · in a row");
  fireEvent.click(screen.getByText(/see your week in crumbs/));
  const days = screen.getAllByTestId("week-day");
  expect(days).toHaveLength(7);
  expect(days.filter((d) => d.textContent.startsWith("–"))).toHaveLength(4);
  expect(screen.getByText(/of 7 days/)).toBeInTheDocument();
});

test("on request, a week with no quizzes shows 7 blanks and no errors", () => {
  window.localStorage.clear();
  const { getDailySeed } = require("./quizEngine");
  const { addDays } = require("./streak");
  const old = [{ seed: addDays(getDailySeed(), -10), archetype: "The Rizz Prophet", crumb: "c", vibe: "v" }];
  window.localStorage.setItem("moodcrumbs.history.v1", JSON.stringify(old));
  render(<App />);
  fireEvent.click(screen.getByText(/your week in crumbs/));
  expect(screen.getAllByTestId("week-day").filter((d) => d.textContent.startsWith("–"))).toHaveLength(7);
  expect(screen.getByText(/no crumbs this week yet/)).toBeInTheDocument();
});
