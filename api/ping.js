// api/ping.js
// Anonymous event counts for the return-rate experiment (see README, "What gets counted").
// It stores counters only: how many times each event happened per UTC day, and for the
// one-time return milestones, per cohort day (the UTC day of that browser's first quiz).
// It reads no IP address, user agent or cookie, and there is no ID to store.
// Storage is an Upstash Redis database over its REST API. Without one configured, it accepts
// the event and stores nothing.

const DAY_EVENTS = new Set(["quiz_done", "recap_viewed", "share_clicked", "visit_from_ref", "existing_user"]);
const COHORT_EVENTS = new Set(["first_quiz", "returned_2_days", "returned_3_days"]);
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_COHORT_AGE_DAYS = 60;

const seedOf = (t) => t.getUTCFullYear() * 10000 + (t.getUTCMonth() + 1) * 100 + t.getUTCDate();
const timeOf = (seed) => Date.UTC(Math.floor(seed / 10000), (Math.floor(seed / 100) % 100) - 1, seed % 100);

// The Redis commands for one event, or null if the event isn't one we count.
export function commandsFor(body, now = new Date()) {
  if (!body || typeof body !== "object" || typeof body.e !== "string") return null;
  const today = seedOf(now);
  if (DAY_EVENTS.has(body.e)) {
    return [["HINCRBY", `mc:day:${today}`, body.e, 1], ["SADD", "mc:days", String(today)]];
  }
  if (COHORT_EVENTS.has(body.e)) {
    const c = body.cohort;
    if (!Number.isInteger(c) || seedOf(new Date(timeOf(c))) !== c) return null; // not a real date
    if (c > today || timeOf(c) < timeOf(today) - MAX_COHORT_AGE_DAYS * DAY_MS) return null;
    return [["HINCRBY", `mc:cohort:${c}`, body.e, 1], ["SADD", "mc:cohorts", String(c)]];
  }
  return null;
}

export function redisConfig(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const commands = commandsFor(body);
  if (!commands) return res.status(400).end();
  const redis = redisConfig();
  if (redis) {
    try {
      await fetch(`${redis.url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
      });
    } catch { /* a lost count is fine; never fail the page */ }
  }
  return res.status(204).end();
}
