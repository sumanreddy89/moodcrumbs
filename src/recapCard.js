// The "week in crumbs" share card: a 1080x1350 PNG drawn on a canvas. The archetype portraits
// are the same SVGs the app shows, turned into images. Drawing is a plain function of a 2D
// context, so it can be tested without a browser canvas.

import { dayLabel } from "./quizEngine";

export const CARD_W = 1080;
export const CARD_H = 1350;
export const SHARE_URL = "https://moodcrumbs.com/?ref=recap";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";
const INK = "#1C1A17";
const MUTED = "#9A8870";

// Polaroid frames: 4 on the first row, 3 on the second, centred.
const FRAME_W = 212, PAD = 11, IMG_W = 190, IMG_H = 228, LABEL_H = 54, GAP = 28;
const FRAME_H = PAD + IMG_H + LABEL_H;
const ROW_Y = [262, 262 + FRAME_H + 66];

export function cardSlots() {
  const row = (n, y) => {
    const x0 = (CARD_W - (n * FRAME_W + (n - 1) * GAP)) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (FRAME_W + GAP), y }));
  };
  return [...row(4, ROW_Y[0]), ...row(3, ROW_Y[1])];
}

export function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.replace(/[\s,.;:]+$/, "")}…`;
    return kept;
  }
  return lines;
}

const shortName = (a) => a.replace(/^The /, "");
const dayMonth = (seed) => dayLabel(seed).split(" ").slice(1).join(" ");
const shortDay = (seed) => {
  const [weekday, day] = dayLabel(seed).split(" ");
  return `${weekday.slice(0, 3)} ${day}`;
};

// images: Map of archetype -> a drawable image of its portrait.
export function drawRecapCard(ctx, week, images = new Map()) {
  ctx.fillStyle = "#F5EFE0";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = INK;
  ctx.font = `64px ${SERIF}`;
  ctx.fillText("my week in crumbs", CARD_W / 2, 150);
  ctx.fillStyle = MUTED;
  ctx.font = `28px ${SANS}`;
  ctx.fillText(`${dayMonth(week.from)} – ${dayMonth(week.to)}`, CARD_W / 2, 204);

  cardSlots().forEach(({ x, y }, i) => {
    const { seed, entry } = week.days[i];
    const img = entry && images.get(entry.archetype);
    if (entry) {
      ctx.fillStyle = "rgba(60,40,20,0.18)";
      ctx.fillRect(x + 6, y + 10, FRAME_W, FRAME_H);
      ctx.fillStyle = "#FBF6EA";
      ctx.fillRect(x, y, FRAME_W, FRAME_H);
      ctx.strokeStyle = "#B89860";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, FRAME_W, FRAME_H);
      if (img) ctx.drawImage(img, x + PAD, y + PAD, IMG_W, IMG_H);
      else { ctx.fillStyle = "#D4A050"; ctx.fillRect(x + PAD, y + PAD, IMG_W, IMG_H); }
      ctx.fillStyle = "#3A2018";
      ctx.font = `bold 17px ${SERIF}`;
      wrapLines(ctx, shortName(entry.archetype).toUpperCase(), IMG_W, 2)
        .forEach((l, j) => ctx.fillText(l, x + FRAME_W / 2, y + PAD + IMG_H + 24 + j * 20));
    } else {
      ctx.strokeStyle = "#D0C4A8";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.strokeRect(x, y, FRAME_W, FRAME_H);
      ctx.setLineDash([]);
      ctx.fillStyle = "#C4B498";
      ctx.font = `48px ${SERIF}`;
      ctx.fillText("–", x + FRAME_W / 2, y + FRAME_H / 2 + 14);
    }
    ctx.fillStyle = MUTED;
    ctx.font = `22px ${SANS}`;
    ctx.fillText(shortDay(seed), x + FRAME_W / 2, y + FRAME_H + 36);
  });

  const textY = ROW_Y[1] + FRAME_H + 110;
  if (week.top) {
    ctx.fillStyle = MUTED;
    ctx.font = `26px ${SANS}`;
    ctx.fillText(`MOSTLY ${shortName(week.top.archetype).toUpperCase()} · ${week.top.count} OF 7 DAYS`, CARD_W / 2, textY);
    ctx.fillStyle = "#3A2018";
    ctx.font = `italic 38px ${SERIF}`;
    wrapLines(ctx, `“${week.top.crumb}”`, 880, 3).forEach((l, j) => ctx.fillText(l, CARD_W / 2, textY + 62 + j * 52));
  } else {
    ctx.fillStyle = "#7A6850";
    ctx.font = `italic 38px ${SERIF}`;
    ctx.fillText("no crumbs this week yet.", CARD_W / 2, textY + 40);
  }

  ctx.fillStyle = INK;
  ctx.font = `bold 34px ${SERIF}`;
  ctx.fillText("moodcrumbs.com", CARD_W / 2, CARD_H - 62);
}

// An SVG string (as React renders it) as a data URL an <img> can load.
export function svgDataUrl(markup) {
  // A fixed size and no CSS sizing on the root, so every browser gives the image real dimensions.
  const svg = markup.replace(/^(<svg[^>]*?) style="[^"]*"/, "$1")
    .replace(/^<svg(?![^>]*xmlns=)/, '<svg xmlns="http://www.w3.org/2000/svg"')
    .replace(/^<svg /, '<svg width="200" height="240" ');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Browser only. svgFor(archetype) returns that portrait's SVG markup.
export async function renderRecapCard(week, svgFor) {
  const archetypes = [...new Set(week.days.filter((d) => d.entry).map((d) => d.entry.archetype))];
  const images = new Map();
  await Promise.all(archetypes.map(async (a) => {
    try { images.set(a, await loadImage(svgDataUrl(svgFor(a)))); } catch { /* drawn as a plain frame */ }
  }));
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  drawRecapCard(canvas.getContext("2d"), week, images);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no image"))), "image/png"));
}

// Share sheet with the image where the browser supports it; otherwise download it.
export async function shareOrDownload(blob) {
  const name = "my-week-in-crumbs.png";
  const file = typeof File === "function" ? new File([blob], name, { type: "image/png" }) : null;
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `my week in crumbs ${SHARE_URL}` });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}
