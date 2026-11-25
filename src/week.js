// "Week in crumbs": the last 7 UTC days from local history, oldest first. Days without a quiz
// are blanks. The week's archetype is the most frequent one; a tie goes to the most recent day.
// Its crumb line is the crumb from the latest day it won.

import { entryFor } from "./history";
import { addDays } from "./streak";

export function weekInCrumbs(history, todaySeed) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const seed = addDays(todaySeed, -i);
    days.push({ seed, entry: entryFor(history || [], seed) });
  }
  const filled = days.filter((d) => d.entry);
  const counts = new Map();
  filled.forEach((d) => counts.set(d.entry.archetype, (counts.get(d.entry.archetype) || 0) + 1));
  let top = null;
  // Newest first, so on equal counts the most recent archetype is kept.
  [...filled].reverse().forEach((d) => {
    const n = counts.get(d.entry.archetype);
    if (!top || n > top.count) top = { archetype: d.entry.archetype, count: n, crumb: d.entry.crumb };
  });
  return { from: days[0].seed, to: todaySeed, days, filled: filled.length, top };
}
