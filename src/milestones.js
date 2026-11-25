// Return milestones, worked out in this browser so the server never needs an ID.
// A browser whose first quiz happens with an empty history is a first-timer: it sends
// "first_quiz" once, tagged with that UTC day (its cohort). If it then finishes quizzes on a 2nd
// and a 3rd distinct UTC day within 28 days of the first, it sends "returned_2_days" and
// "returned_3_days", each once, with the same cohort day. People who already had history when
// this started are counted once as "existing_user" and left out of the return rate.

import { addDays } from "./streak";

export const RETURN_KEY = "moodcrumbs.return.v1";
export const WINDOW_DAYS = 28;

export function recordQuiz(state, seed, hadEarlierHistory) {
  if (!state) {
    if (hadEarlierHistory) return { state: { existing: true }, events: [{ e: "existing_user" }] };
    return { state: { cohort: seed, seeds: [seed], sent: ["first_quiz"] }, events: [{ e: "first_quiz", cohort: seed }] };
  }
  if (state.existing) return { state, events: [] };
  const inWindow = seed >= state.cohort && seed < addDays(state.cohort, WINDOW_DAYS);
  if (!inWindow || state.seeds.includes(seed) || state.seeds.length >= 3) return { state, events: [] };
  const seeds = [...state.seeds, seed];
  const sent = [...state.sent];
  const events = [];
  for (const [n, e] of [[2, "returned_2_days"], [3, "returned_3_days"]]) {
    if (seeds.length >= n && !sent.includes(e)) { sent.push(e); events.push({ e, cohort: state.cohort }); }
  }
  return { state: { cohort: state.cohort, seeds, sent }, events };
}

const store = (storage) => {
  try { return storage || window.localStorage; } catch { return null; }
};

export function loadReturnState(storage) {
  const s = store(storage);
  try {
    const v = s && JSON.parse(s.getItem(RETURN_KEY) || "null");
    if (v && v.existing === true) return v;
    if (v && Number.isInteger(v.cohort) && Array.isArray(v.seeds) && Array.isArray(v.sent)) return v;
  } catch { /* corrupt or blocked */ }
  return null;
}

export function saveReturnState(state, storage) {
  const s = store(storage);
  if (s) {
    try { s.setItem(RETURN_KEY, JSON.stringify(state)); } catch { /* full or blocked */ }
  }
  return state;
}
