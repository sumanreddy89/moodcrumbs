import { formatSummary, summarise } from "./returnRate";

const cohorts = (list) => Object.fromEntries(list.map(([seed, first, ret2, ret3]) => [seed, { first_quiz: first, returned_2_days: ret2, returned_3_days: ret3 }]));

test("only cohorts whose 28 days have closed count toward the verdict", () => {
  const s = summarise({ cohorts: cohorts([["20261128", 60, 30, 15], ["20261201", 50, 20, 10], ["20261220", 40, 5, 0]]) }, 20261229);
  expect(s.all).toEqual({ first: 150, ret2: 55, ret3: 25 });
  expect(s.mature).toEqual({ first: 110, ret2: 50, ret3: 25 }); // 20 Dec's window is still open
  expect(s.rate).toBeCloseTo(25 / 110);
  expect(s.verdict).toBe("PASS");
});

test("fail, in between, and not enough data", () => {
  const at = (ret3) => summarise({ cohorts: cohorts([["20261128", 100, 40, ret3]]) }, 20261226).verdict;
  expect(at(20)).toBe("PASS");
  expect(at(19)).toMatch(/^IN BETWEEN/);
  expect(at(8)).toMatch(/^IN BETWEEN/);
  expect(at(7)).toBe("FAIL");
  expect(summarise({ cohorts: cohorts([["20261128", 99, 50, 50]]) }, 20261226).verdict).toMatch(/^NOT YET: 99 of 100/);
  expect(summarise({}, 20261226).verdict).toMatch(/^NOT YET: 0 of 100/);
});

test("the report prints unique first-timers, 2+ days and 3+ days, and leaves existing users out", () => {
  const s = summarise({
    cohorts: cohorts([["20261128", 120, 40, 30]]),
    days: { 20261128: { quiz_done: 200, existing_user: 12, share_clicked: 3 }, 20261129: { quiz_done: 80 } },
  }, 20261226);
  const text = formatSummary(s);
  expect(text).toMatch(/first-time users\s+120\s+120/);
  expect(text).toMatch(/3\+ distinct days\s+30\s+30\s+\(25\.0%\)/);
  expect(text).toMatch(/existing users \(left out\): 12/);
  expect(text).toMatch(/quiz_done 280/);
  expect(text).toMatch(/verdict: PASS/);
});
