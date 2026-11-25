import { clearHistory } from "./history";
import { RETURN_KEY, loadReturnState, recordQuiz, saveReturnState } from "./milestones";

const memory = () => {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: (k) => { delete data[k]; }, data };
};
const run = (seeds, hadHistory = false) => {
  let state = null;
  const sent = [];
  seeds.forEach((seed, i) => {
    const r = recordQuiz(state, seed, i === 0 ? hadHistory : true);
    state = r.state;
    sent.push(...r.events);
  });
  return sent;
};

test("a first-timer sends first_quiz once, tagged with the day of the first quiz", () => {
  expect(run([20261128, 20261128])).toEqual([{ e: "first_quiz", cohort: 20261128 }]);
});

test("a 2nd and 3rd distinct day send each return milestone once, with the same cohort day", () => {
  expect(run([20261128, 20261130, 20261130, 20261205, 20261206])).toEqual([
    { e: "first_quiz", cohort: 20261128 },
    { e: "returned_2_days", cohort: 20261128 },
    { e: "returned_3_days", cohort: 20261128 },
  ]);
});

test("days must fall within 28 days of the first quiz", () => {
  // 28 Nov + 28 days = 26 Dec, which is outside the window.
  expect(run([20261128, 20261225, 20261226]).map((x) => x.e)).toEqual(["first_quiz", "returned_2_days"]);
});

test("people with history from before are counted once as existing users, never in the return rate", () => {
  expect(run([20261128, 20261129, 20261130], true)).toEqual([{ e: "existing_user" }]);
});

test("the state survives a reload, and clear my history removes it", () => {
  const s = memory();
  saveReturnState(recordQuiz(null, 20261128, false).state, s);
  expect(loadReturnState(s)).toEqual({ cohort: 20261128, seeds: [20261128], sent: ["first_quiz"] });
  clearHistory(s);
  expect(s.data[RETURN_KEY]).toBeUndefined();
  s.setItem(RETURN_KEY, "nope{");
  expect(loadReturnState(s)).toBeNull();
});
