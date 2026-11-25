# Mood Crumbs

A daily five-question personality quiz with illustrated archetypes. Live at https://moodcrumbs.com.

## How the daily questions are chosen

- **One quiz per UTC day.** The date (in UTC, so friends in different time zones get the same quiz) becomes a seed like `20261122`.
- **Seeded shuffle.** The seed shuffles the 30-question pool (Fisher-Yates) and the first five are the day's quiz.
- **Coverage check.** Some sets of five make an archetype impossible to get, whatever you answer. Each candidate set is checked by trying all 1,024 answer combinations; if any archetype can't win, the pool is reshuffled with a retry seed (`seed * 1000 + k`, so it never collides with another day's seed) until every archetype is reachable. Same set for everyone that day.
- **Frozen per run.** The questions and date are fixed when you start, even if midnight UTC passes mid-quiz. Retaking on the same day replays the same questions.

`node scripts/coverage.mjs 2026 11` prints, for each day of a month, what the plain shuffle would have missed, the retry used, and how ties fall.

## How scoring and ties work

Each answer gives points to one or two archetypes (3 to the main one, 1 to a second). The highest total wins. About a quarter of answer combinations tie at the top, so ties follow a written rule:

1. **Spread**: the archetype whose points came from the most different answers.
2. **Recency**: if still tied, the archetype your latest answer pointed to (if one answer pointed to both, the one it gave more points).
3. **Seed**: a last resort so the result is always deterministic. With the current questions it's never reached.

The result screen says which answers pointed to your archetype ("you said ... very ... of you").

## Your history

Your last 14 days of results are kept in this browser only (`localStorage`, key `moodcrumbs.history.v1`). If you've taken today's quiz, the start screen shows your crumb; "clear my history" removes it all. Your results are never sent anywhere and there are no accounts (the anonymous counts below are separate).

## Streak and week in crumbs

Finishing the quiz on consecutive UTC days builds a streak ("Day 3"); missing a whole UTC day resets it. It's kept in this browser like the history (`moodcrumbs.streak.v1`). From Day 3, or any time from the start screen, "your week in crumbs" shows the last 7 days, the week's most frequent archetype and a share card (a 1080×1350 image linking to moodcrumbs.com).

## What gets counted

To learn whether people come back, the site counts a few events: `quiz_done`, `recap_viewed`, `share_clicked`, `visit_from_ref`, and once per browser `first_quiz`, `returned_2_days`, `returned_3_days` (or `existing_user`). Each one is a counter: the event name and a UTC day, nothing else. There is no ID, no cookie, and `api/ping.js` reads no IP address or user agent (Vercel's own request logs aside). The return milestones are worked out in your browser from your local history, and "clear my history" removes that state too. `node scripts/return-rate.js` prints the totals.

## AI

The AI route (`api/claude.js`) is switched off: it used to forward any request to Anthropic with the server's key. Crumbs are written ones, labelled as such.

## Develop

```sh
npm ci
npm start      # dev server
npm test       # engine, history and app tests
npm run build
```
