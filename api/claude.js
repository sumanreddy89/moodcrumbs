// api/claude.js
// Disabled on 22 Nov 2026. This route used to forward any caller's request to Anthropic with
// the server's API key, with no model, token or rate limits, so anyone who found it could
// spend against the key. It now refuses every request and never calls Anthropic.
// To bring the quiz's AI back, rebuild it with the prompts, model and token limits owned by
// the server, validated quiz input only, and a rate limit.

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(503).json({ error: "This feature is switched off." });
}
