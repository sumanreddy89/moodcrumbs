import handler, { commandsFor, redisConfig } from "../api/ping";

const now = new Date("2026-11-28T10:00:00Z");

test("plain events count per UTC day", () => {
  expect(commandsFor({ e: "quiz_done" }, now)).toEqual([["HINCRBY", "mc:day:20261128", "quiz_done", 1], ["SADD", "mc:days", "20261128"]]);
});

test("return milestones count per cohort day, which must be a real, recent, past date", () => {
  expect(commandsFor({ e: "returned_3_days", cohort: 20261120 }, now)[0]).toEqual(["HINCRBY", "mc:cohort:20261120", "returned_3_days", 1]);
  expect(commandsFor({ e: "first_quiz", cohort: 20261131 }, now)).toBeNull(); // no 31 Nov
  expect(commandsFor({ e: "first_quiz", cohort: 20261129 }, now)).toBeNull(); // future
  expect(commandsFor({ e: "first_quiz", cohort: 20260901 }, now)).toBeNull(); // older than 60 days
  expect(commandsFor({ e: "first_quiz" }, now)).toBeNull();
});

test("anything else is refused", () => {
  [null, "x", {}, { e: "sign_up" }, { e: "quiz_done; FLUSHALL" }].forEach((b) => expect(commandsFor(b, now)).toBeNull());
});

const fakeRes = () => {
  const r = { code: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.end = () => r;
  return r;
};

test("the handler stores only the counters, and never reads IP, user agent or cookies", async () => {
  process.env.KV_REST_API_URL = "https://redis.example";
  process.env.KV_REST_API_TOKEN = "t";
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  const headers = new Proxy({}, { get: () => { throw new Error("headers were read"); } });
  const res = await handler({ method: "POST", body: JSON.stringify({ e: "share_clicked" }), headers, socket: headers }, fakeRes());
  expect(res.code).toBe(204);
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe("https://redis.example/pipeline");
  expect(JSON.parse(opts.body)[0]).toEqual(["HINCRBY", expect.stringMatching(/^mc:day:\d{8}$/), "share_clicked", 1]);
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

test("without storage configured it accepts and stores nothing; bad input is a 400; GET is a 405", async () => {
  global.fetch = jest.fn();
  expect(redisConfig({})).toBeNull();
  expect((await handler({ method: "POST", body: { e: "quiz_done" } }, fakeRes())).code).toBe(204);
  expect((await handler({ method: "POST", body: "{bad" }, fakeRes())).code).toBe(400);
  expect((await handler({ method: "GET" }, fakeRes())).code).toBe(405);
  expect(global.fetch).not.toHaveBeenCalled();
});
