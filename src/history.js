// Your recent results, kept only in this browser (no accounts, nothing sent anywhere).
// One entry per UTC day; retaking the quiz on the same day replays the same questions (the set
// is chosen by date) and replaces that day's entry. Every storage call is wrapped, because
// private browsing and blocked storage throw.

export const HISTORY_KEY = "moodcrumbs.history.v1";
export const HISTORY_DAYS = 14;

const store = (storage) => {
  try { return storage || window.localStorage; } catch { return null; }
};

export function loadHistory(storage) {
  const s = store(storage);
  if (!s) return [];
  try {
    const list = JSON.parse(s.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(list)) return [];
    return list.filter((e) => e && typeof e.seed === "number" && typeof e.archetype === "string");
  } catch {
    return []; // corrupt JSON: start fresh rather than crash
  }
}

export function saveResult(entry, storage) {
  const s = store(storage);
  const rest = loadHistory(s).filter((e) => e.seed !== entry.seed);
  const list = [entry, ...rest].sort((a, b) => b.seed - a.seed).slice(0, HISTORY_DAYS);
  if (s) {
    try { s.setItem(HISTORY_KEY, JSON.stringify(list)); } catch { /* full or blocked: keep going */ }
  }
  return list;
}

// Everything this site keeps in the browser; "clear my history" removes all of it.
export const LOCAL_KEYS = [HISTORY_KEY, "moodcrumbs.streak.v1", "moodcrumbs.return.v1"];

export function clearHistory(storage) {
  const s = store(storage);
  if (s) {
    for (const k of LOCAL_KEYS) {
      try { s.removeItem(k); } catch { /* blocked */ }
    }
  }
  return [];
}

export function entryFor(history, seed) {
  return history.find((e) => e.seed === seed) || null;
}
