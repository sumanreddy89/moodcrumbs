// api/claude.js
// Place this file at: /api/claude.js in your project root
// Vercel auto-deploys any file in /api as a serverless function

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Basic origin check — replace with your actual domain before launch
  const allowed = [
    "https://moodcrumbs.com",
    "https://www.moodcrumbs.com",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin || "";
  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,   // stored in Vercel env vars
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return res.status(response.status).json({ error: "Upstream API error" });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
