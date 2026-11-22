// Reports, for each day of a month, whether every archetype can win with that day's questions,
// how many retries the coverage-aware picker needed, and how ties fall.
// Run: node scripts/coverage.mjs 2026 11
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/quizEngine.js", import.meta.url), "utf8");
const { QUESTION_POOL, coverage, pickDailySet, shuffleSeeded } = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

const [year = new Date().getUTCFullYear(), month = new Date().getUTCMonth() + 1] = process.argv.slice(2).map(Number);
const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
console.log("date        plain-shuffle unreachable        retry  ties/1024  left to seed");
for (let d = 1; d <= days; d++) {
  const seed = year * 10000 + month * 100 + d;
  const plain = coverage(shuffleSeeded(QUESTION_POOL, seed).slice(0, 5), seed);
  const set = pickDailySet(QUESTION_POOL, 5, seed);
  const c = coverage(set.questions, seed);
  const bad = plain.unreachable.map((a) => a.replace(/^The /, "")).join(", ") || "-";
  console.log(`${seed}  ${bad.padEnd(32).slice(0, 32)}  ${String(set.retry).padStart(5)}  ${String(c.ties).padStart(9)}  ${String(c.tiesSettledBySeed).padStart(12)}${c.unreachable.length ? "  STILL UNREACHABLE: " + c.unreachable.join(", ") : ""}`);
}
