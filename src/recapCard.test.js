import { CARD_H, CARD_W, cardSlots, drawRecapCard, svgDataUrl, wrapLines } from "./recapCard";
import { weekInCrumbs } from "./week";

// A 2D context that records what was drawn; text is 10px per character.
const fakeCtx = () => {
  const calls = [];
  const ctx = new Proxy({ calls, measureText: (t) => ({ width: t.length * 10 }) }, {
    get: (o, k) => (k in o ? o[k] : (...args) => calls.push([k, ...args])),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  return ctx;
};
const texts = (ctx) => ctx.calls.filter((c) => c[0] === "fillText").map((c) => c[1]);
const e = (seed, archetype) => ({ seed, archetype, crumb: "you've already named the kids." });

test("seven frames, all inside the 1080x1350 card", () => {
  const slots = cardSlots();
  expect(slots).toHaveLength(7);
  slots.forEach(({ x, y }) => {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + 212).toBeLessThanOrEqual(CARD_W);
    expect(y + 293 + 40).toBeLessThan(CARD_H - 200);
  });
});

test.each([
  ["0 days", [], 0],
  ["1 day", [e(20261125, "The Rizz Prophet")], 1],
  ["7 days", [19, 20, 21, 22, 23, 24, 25].map((d) => e(20261100 + d, d % 2 ? "The Rizz Prophet" : "The Delulu Coquette")), 7],
])("draws a card with %s of data", (_, history, filled) => {
  const week = weekInCrumbs(history, 20261125);
  const images = new Map([["The Rizz Prophet", "img-rp"], ["The Delulu Coquette", "img-dc"]]);
  const ctx = fakeCtx();
  drawRecapCard(ctx, week, images);
  const t = texts(ctx);
  expect(t).toContain("my week in crumbs");
  expect(t).toContain("moodcrumbs.com");
  expect(t.filter((x) => x === "–")).toHaveLength(7 - filled);
  expect(ctx.calls.filter((c) => c[0] === "drawImage")).toHaveLength(filled);
  if (filled) expect(t.some((x) => /OF 7 DAYS$/.test(x))).toBe(true);
  else expect(t).toContain("no crumbs this week yet.");
});

test("long text wraps and is cut with an ellipsis after the last allowed line", () => {
  const ctx = fakeCtx();
  expect(wrapLines(ctx, "aaa bbb ccc", 70, 3)).toEqual(["aaa bbb", "ccc"]);
  const cut = wrapLines(ctx, "aaa bbb ccc ddd eee fff", 70, 2);
  expect(cut).toHaveLength(2);
  expect(cut[1].endsWith("…")).toBe(true);
});

test("portrait SVGs become loadable images with a real size", () => {
  const url = svgDataUrl('<svg viewBox="0 0 200 240" style="width:100%;height:100%;display:block"><rect/></svg>');
  const svg = decodeURIComponent(url.split(",")[1]);
  expect(svg.startsWith('<svg width="200" height="240" xmlns="http://www.w3.org/2000/svg"')).toBe(true);
  expect(svg).not.toContain("width:100%");
});
