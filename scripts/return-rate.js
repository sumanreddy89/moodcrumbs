// Prints the return-rate numbers and the gate verdict (see src/returnRate.js).
//
//   node scripts/return-rate.js                  reads the counters from Upstash Redis
//   node scripts/return-rate.js --file c.json    reads {cohorts, days} from a file instead
//   --today 20261226                             evaluate as of another UTC day
//
// Redis credentials come from the environment, or from .env.local (`vercel env pull .env.local`):
// KV_REST_API_URL + KV_REST_API_READ_ONLY_TOKEN (or KV_REST_API_TOKEN, or the UPSTASH_REDIS_REST_* pair).

const fs = require("node:fs");
const path = require("node:path");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function loadEnvFile() {
  const file = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function fromRedis() {
  loadEnvFile();
  const e = process.env;
  const url = (e.KV_REST_API_URL || e.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
  const token = e.KV_REST_API_READ_ONLY_TOKEN || e.KV_REST_API_TOKEN || e.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("No Redis credentials. Set KV_REST_API_URL and a token, or run `vercel env pull .env.local`.");
  const call = async (commands) => {
    const r = await fetch(`${url}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(commands) });
    if (!r.ok) throw new Error(`Redis said ${r.status}`);
    return (await r.json()).map((x) => x.result);
  };
  const [cohortSeeds, daySeeds] = await call([["SMEMBERS", "mc:cohorts"], ["SMEMBERS", "mc:days"]]);
  const keys = [...cohortSeeds.map((s) => `mc:cohort:${s}`), ...daySeeds.map((s) => `mc:day:${s}`)];
  const hashes = keys.length ? await call(keys.map((k) => ["HGETALL", k])) : [];
  const data = { cohorts: {}, days: {} };
  keys.forEach((k, i) => {
    const flat = hashes[i] || [];
    const obj = {};
    for (let j = 0; j < flat.length; j += 2) obj[flat[j]] = Number(flat[j + 1]);
    const [, kind, seed] = k.split(":");
    data[kind === "cohort" ? "cohorts" : "days"][seed] = obj;
  });
  return data;
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "returnRate.js"), "utf8");
  const { summarise, formatSummary } = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const now = new Date();
  const today = Number(arg("--today")) || now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
  const file = arg("--file");
  const data = file ? JSON.parse(fs.readFileSync(file, "utf8")) : await fromRedis();
  console.log(formatSummary(summarise(data, today)));
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
