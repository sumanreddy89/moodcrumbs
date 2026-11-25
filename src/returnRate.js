// The return-rate gate, worked out from the counters api/ping.js stores. Self-contained (no
// imports) so scripts/return-rate.js can load it directly.
//
// Gate (agreed 25 Nov 2026, before launch): of first-time quiz takers whose 4-week window has
// closed, pass if 20% or more finished the quiz on 3+ distinct UTC days; fail below 8%; in
// between, keep the streak and do nothing else. No verdict until 100 first-timers have had
// their full 4 weeks.

export const GATE = { pass: 0.2, fail: 0.08, minFirstTimers: 100, windowDays: 28 };

const DAY_MS = 24 * 60 * 60 * 1000;
const timeOf = (seed) => Date.UTC(Math.floor(seed / 10000), (Math.floor(seed / 100) % 100) - 1, seed % 100);
const n = (v) => Number(v) || 0;

// data: { cohorts: { "20261128": { first_quiz, returned_2_days, returned_3_days } },
//         days:    { "20261128": { quiz_done, recap_viewed, share_clicked, visit_from_ref, existing_user } } }
export function summarise(data, todaySeed, gate = GATE) {
  const cohorts = Object.entries(data.cohorts || {}).map(([seed, c]) => ({
    seed: Number(seed), first: n(c.first_quiz), ret2: n(c.returned_2_days), ret3: n(c.returned_3_days),
  })).sort((a, b) => a.seed - b.seed);
  const closed = (c) => timeOf(c.seed) + gate.windowDays * DAY_MS <= timeOf(todaySeed);
  const sum = (list, k) => list.reduce((s, c) => s + c[k], 0);
  const mature = cohorts.filter(closed);

  const events = {};
  Object.values(data.days || {}).forEach((d) => Object.entries(d).forEach(([k, v]) => { events[k] = (events[k] || 0) + n(v); }));

  const all = { first: sum(cohorts, "first"), ret2: sum(cohorts, "ret2"), ret3: sum(cohorts, "ret3") };
  const done = { first: sum(mature, "first"), ret2: sum(mature, "ret2"), ret3: sum(mature, "ret3") };
  const rate = done.first ? done.ret3 / done.first : null;

  let verdict;
  if (done.first < gate.minFirstTimers) verdict = `NOT YET: ${done.first} of ${gate.minFirstTimers} first-timers have had their full ${gate.windowDays} days`;
  else if (rate >= gate.pass) verdict = "PASS";
  else if (rate < gate.fail) verdict = "FAIL";
  else verdict = "IN BETWEEN: keep the streak, do nothing else";

  return { all, mature: done, rate, verdict, cohorts, events, existingUsers: events.existing_user || 0 };
}

export function formatSummary(s) {
  const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : "-");
  const lines = [
    "Mood Crumbs return rate",
    "",
    "                      all so far   window closed (28 days)",
    `first-time users      ${String(s.all.first).padStart(10)}   ${String(s.mature.first).padStart(10)}`,
    `2+ distinct days      ${String(s.all.ret2).padStart(10)}   ${String(s.mature.ret2).padStart(10)}  (${pct(s.mature.ret2, s.mature.first)})`,
    `3+ distinct days      ${String(s.all.ret3).padStart(10)}   ${String(s.mature.ret3).padStart(10)}  (${pct(s.mature.ret3, s.mature.first)})`,
    "",
    `existing users (left out): ${s.existingUsers}`,
    `events: ${Object.entries(s.events).filter(([k]) => k !== "existing_user").map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`,
    "",
    `verdict: ${s.verdict}`,
  ];
  return lines.join("\n");
}
