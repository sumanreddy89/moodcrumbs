// Sends one anonymous event to /api/ping: the event name, and for the return milestones the UTC
// day of this browser's first quiz. No ID, no cookies. Only in production builds, and only where
// the browser has sendBeacon (so tests and the dev server never send anything).

export function track(e, cohort) {
  try {
    if (process.env.NODE_ENV !== "production") return false;
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return false;
    const body = cohort ? { e, cohort } : { e };
    return navigator.sendBeacon("/api/ping", new Blob([JSON.stringify(body)], { type: "application/json" }));
  } catch {
    return false;
  }
}
