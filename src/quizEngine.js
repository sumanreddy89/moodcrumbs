// Quiz engine: the question pool, daily question selection, scoring and written crumbs.
// Pure functions, no React, so they can be tested and reasoned about on their own.

/* ─────────────────────────────────────────────────────────────────────────────
   SHORT KEYS for scoring
─────────────────────────────────────────────────────────────────────────────*/
export const K = {
  DC: "The Delulu Coquette",
  QL: "The Quiet Luxury Depressive",
  RP: "The Rizz Prophet",
  HH: "The Hyperpop Healer",
  SS: "The Situationship Soldier",
  PS: "The Productivity Spiral",
  MC: "The Main Character of a Side Plot",
  TC: "The Trauma-Core Influencer",
  BR: "The Bored Rich Kid With God Complex",
  EW: "The Ex Who Always Wins",
};

/* ─────────────────────────────────────────────────────────────────────────────
   DATE SEED — deterministic daily shuffle
   Same 5 questions all day (consistent for sharing), fresh set each new day.
─────────────────────────────────────────────────────────────────────────────*/
// The day is a UTC day, so everyone gets the same questions at the same moment wherever they
// are (local time gave friends in different time zones different quizzes).
export function getDailySeed(date = new Date()) {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

// "Sunday 22 Nov", for the UTC day a seed stands for.
export function dayLabel(seed) {
  const y = Math.floor(seed / 10000), m = Math.floor(seed / 100) % 100, d = seed % 100;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
}

export function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0xFFFFFFFF;
  };
}

// Fisher-Yates with the day's seed: every order is equally likely, and every browser gets
// the same five questions on the same day (sorting with a random comparator gave neither).
export function shuffleSeeded(list, seed) {
  const rng = seededRng(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Daily questions, coverage-aware.
   The day's seed shuffles the pool and the first n questions are the quiz. Some sets of five
   make an archetype impossible to get, whatever you answer; a set like that is skipped and the
   pool is reshuffled with retry seeds until every archetype can win. Retry k uses
   seed * 1000 + k (not seed + k: seed + 1 is tomorrow's seed). Fully deterministic, so everyone
   gets the same set on the same day. */
export const MAX_RETRIES = 50;

export function retrySeed(seed, k) {
  return k === 0 ? seed : seed * 1000 + k;
}

export function pickDailySet(pool = QUESTION_POOL, n = 5, seed = getDailySeed()) {
  for (let k = 0; k <= MAX_RETRIES; k++) {
    const questions = shuffleSeeded(pool, retrySeed(seed, k)).slice(0, n);
    if (coverage(questions, seed).unreachable.length === 0) return { questions, retry: k, seed };
  }
  // Not expected with the current pool; fall back to the plain shuffle rather than fail.
  return { questions: shuffleSeeded(pool, seed).slice(0, n), retry: -1, seed };
}

export function pickDailyQuestions(pool = QUESTION_POOL, n = 5, seed = getDailySeed()) {
  return pickDailySet(pool, n, seed).questions;
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITTEN CRUMBS — used while the AI is off, and if it ever fails. Three per
   archetype; the pick depends on your answers, so friends with the same
   archetype don't all get the same line.
─────────────────────────────────────────────────────────────────────────────*/
export const WRITTEN_CRUMBS = {
  "The Delulu Coquette": [
    { crumb: "you've already named the kids. they haven't texted back since tuesday.", vibe: "ribbon-tied hope in a group chat" },
    { crumb: "manifesting so hard the universe filed a restraining order.", vibe: "pink lip gloss and plausible deniability" },
    { crumb: "read receipts off, delusions on, outfit planned for a date that doesn't exist.", vibe: "soft focus on a hard no" },
  ],
  "The Quiet Luxury Depressive": [
    { crumb: "cashmere on the outside, voicemail full on the inside.", vibe: "beige silence in a nice apartment" },
    { crumb: "you don't cry, you just reorganize the linen closet at 1am.", vibe: "unbranded sadness, excellent tailoring" },
    { crumb: "everything you own is neutral. so is your answer to 'how are you'.", vibe: "old money energy, new money therapy" },
  ],
  "The Rizz Prophet": [
    { crumb: "you could flirt with a parking ticket and get it waived.", vibe: "eye contact as a love language" },
    { crumb: "your talking stage has a waitlist and a loyalty program.", vibe: "charm offensive in a black tee" },
    { crumb: "you don't shoot your shot. the shot comes to you and apologises.", vibe: "unbothered gravity, slight smirk" },
  ],
  "The Hyperpop Healer": [
    { crumb: "you heal your inner child with 140bpm and a crystal you can't name.", vibe: "glitter on a therapy notebook" },
    { crumb: "emotionally stable at 2x speed, a mess at 0.5.", vibe: "sparkly sad in perfect sync" },
    { crumb: "your coping mechanism has a playlist cover and a lore document.", vibe: "neon calm over static" },
  ],
  "The Situationship Soldier": [
    { crumb: "you've survived four 'what are we's and zero answers. decorated veteran.", vibe: "camouflage feelings, open tabs" },
    { crumb: "not dating, not single, just stationed somewhere in between.", vibe: "long tour in a grey area" },
    { crumb: "you call it 'keeping it casual'. your camera roll calls it a documentary.", vibe: "loyal to the bit, not the person" },
  ],
  "The Productivity Spiral": [
    { crumb: "you color-coded the to-do list instead of doing the to-do list.", vibe: "highlighter fumes and quiet panic" },
    { crumb: "seven productivity apps, one unread email from 2023 haunting all of them.", vibe: "hustle aesthetic, nap reality" },
    { crumb: "your rest day has a schedule and a KPI.", vibe: "burnout in a nice planner" },
  ],
  "The Main Character of a Side Plot": [
    { crumb: "the soundtrack's playing, the camera's rolling, it's a tuesday at the pharmacy.", vibe: "cinematic about the mundane" },
    { crumb: "you narrate your own life in third person and the reviews are mixed.", vibe: "indie film lighting, retail budget" },
    { crumb: "everyone else is in their arc. you're in a montage that never ends.", vibe: "golden hour, wrong episode" },
  ],
  "The Trauma-Core Influencer": [
    { crumb: "you turned your childhood into a carousel post with a link in bio.", vibe: "healing, monetised, aesthetic" },
    { crumb: "vulnerable on main, unreachable in DMs.", vibe: "soft light on a hard story" },
    { crumb: "you've processed it. you've also posted it. twice.", vibe: "story highlights titled 'growth'" },
  ],
  "The Bored Rich Kid With God Complex": [
    { crumb: "you've never waited in line, but you've opinions on the line.", vibe: "trust fund ennui at golden hour" },
    { crumb: "starting a podcast to share what you learned from a weekend in bali.", vibe: "unearned confidence, earned tan" },
    { crumb: "you call it 'curating experiences'. the card statement calls it something else.", vibe: "yacht-adjacent existentialism" },
  ],
  "The Ex Who Always Wins": [
    { crumb: "you didn't move on, you moved up, and you made sure they saw it.", vibe: "glow-up as a strategy" },
    { crumb: "the breakup was mutual. the revenge body was not.", vibe: "calm surface, sharp edges" },
    { crumb: "you post one blurry photo a month and ruin three people's week.", vibe: "unbothered on purpose" },
  ],
};

// Same answers, same crumb; different answers usually get a different one.
export function pickWrittenCrumb(archetype, answers) {
  const options = WRITTEN_CRUMBS[archetype] || WRITTEN_CRUMBS["The Main Character of a Side Plot"];
  const text = (answers || []).map((a) => (a && a.text) || "").join("|");
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUESTION POOL — 30 questions, 5 picked daily by seed
   Each answer scores specific archetypes deterministically.
─────────────────────────────────────────────────────────────────────────────*/
export const QUESTION_POOL = [
  /* ── PHONE / DIGITAL ── */
  {
    q: "what's your phone trying to tell you right now?",
    options: [
      { text:"u have 47 unread texts and 3 spirals",        scores:{[K.PS]:3,[K.SS]:1} },
      { text:"the screen time report was a war crime",      scores:{[K.TC]:3,[K.HH]:1} },
      { text:"someone's manifesting through your dms",      scores:{[K.RP]:3,[K.EW]:1} },
      { text:"u haven't opened it in 4 hrs and it's eerie", scores:{[K.QL]:3,[K.BR]:1} },
    ]
  },
  {
    q: "your notification style?",
    options: [
      { text:"everything on, chaos is my love language",    scores:{[K.HH]:3,[K.SS]:1} },
      { text:"do not disturb since 2021, no exceptions",    scores:{[K.QL]:3,[K.BR]:1} },
      { text:"only for them. you know who.",                scores:{[K.SS]:3,[K.DC]:1} },
      { text:"curated alerts for personal brand metrics",   scores:{[K.TC]:3,[K.PS]:1} },
    ]
  },
  {
    q: "last thing you searched at 2am?",
    options: [
      { text:"'what does it mean when they post that'",     scores:{[K.SS]:3,[K.DC]:1} },
      { text:"'how to become untouchable'",                 scores:{[K.EW]:3,[K.RP]:1} },
      { text:"notion template for emotional regulation",    scores:{[K.PS]:3,[K.TC]:1} },
      { text:"'am i the problem' (third time this week)",   scores:{[K.MC]:3,[K.HH]:1} },
    ]
  },
  /* ── EMOTIONAL / BEHAVIOURAL ── */
  {
    q: "how do you handle being ignored?",
    options: [
      { text:"draft 4 paragraphs, send 'ok'",               scores:{[K.SS]:3,[K.DC]:1} },
      { text:"post a fit pic and disappear",                 scores:{[K.EW]:3,[K.RP]:1} },
      { text:"reflect, journal, and overcorrect",            scores:{[K.PS]:3,[K.TC]:1} },
      { text:"decide they're beneath me actually",           scores:{[K.BR]:3,[K.QL]:1} },
    ]
  },
  {
    q: "pick your toxic trait",
    options: [
      { text:"romanticizing every red flag into a vibe",     scores:{[K.DC]:3,[K.MC]:1} },
      { text:"being so calm it's actually terrifying",       scores:{[K.QL]:3,[K.BR]:1} },
      { text:"making everything about your own growth",      scores:{[K.TC]:3,[K.PS]:1} },
      { text:"you are the chaos you were waiting for",       scores:{[K.HH]:3,[K.RP]:1} },
    ]
  },
  {
    q: "your apology style?",
    options: [
      { text:"over-apologise and mean every word",           scores:{[K.SS]:3,[K.PS]:1} },
      { text:"say sorry with a glow-up instead",            scores:{[K.EW]:3,[K.RP]:1} },
      { text:"apologise to yourself for putting up with it", scores:{[K.DC]:3,[K.MC]:1} },
      { text:"you don't. they were wrong.",                  scores:{[K.BR]:3,[K.QL]:1} },
    ]
  },
  {
    q: "how do you process a bad day?",
    options: [
      { text:"cry, sleep, make it a post",                   scores:{[K.TC]:3,[K.HH]:1} },
      { text:"pretend it didn't happen in cashmere",         scores:{[K.QL]:3,[K.BR]:1} },
      { text:"re-read all their old messages",               scores:{[K.SS]:3,[K.DC]:1} },
      { text:"build a structured plan to prevent it again",  scores:{[K.PS]:3,[K.MC]:1} },
    ]
  },
  /* ── LIFESTYLE / AESTHETIC ── */
  {
    q: "pick your weekend energy",
    options: [
      { text:"romanticizing crying in soft lighting",        scores:{[K.DC]:3,[K.MC]:1} },
      { text:"thrifted blazer, oat latte, sad playlist",     scores:{[K.MC]:3,[K.QL]:1} },
      { text:"reformer pilates then breakdown then post",    scores:{[K.TC]:3,[K.PS]:1} },
      { text:"chaotic group chat ringleader",                scores:{[K.HH]:3,[K.RP]:1} },
    ]
  },
  {
    q: "your fashion right now is...",
    options: [
      { text:"bows, lace, slightly delulu",                  scores:{[K.DC]:3,[K.HH]:1} },
      { text:"quiet, beige, expensive in silence",           scores:{[K.QL]:3,[K.BR]:1} },
      { text:"chain, smirk, fragrance you can hear",         scores:{[K.RP]:3,[K.EW]:1} },
      { text:"thrifted, story behind every piece",           scores:{[K.MC]:3,[K.SS]:1} },
    ]
  },
  {
    q: "your coffee order is...",
    options: [
      { text:"matcha latte with oat milk and a side of dread", scores:{[K.QL]:3,[K.PS]:1} },
      { text:"whatever keeps me functional for 14 hours",     scores:{[K.PS]:3,[K.TC]:1} },
      { text:"iced something. aesthetic matters.",            scores:{[K.DC]:3,[K.EW]:1} },
      { text:"i don't drink coffee. i drink attention.",      scores:{[K.RP]:3,[K.HH]:1} },
    ]
  },
  {
    q: "your playlist right now is titled...",
    options: [
      { text:"'main character autumn' (it's summer)",         scores:{[K.MC]:3,[K.DC]:1} },
      { text:"'unbothered' (extremely bothered)",             scores:{[K.EW]:3,[K.QL]:1} },
      { text:"'healing era' (still very much in it)",         scores:{[K.TC]:3,[K.HH]:1} },
      { text:"'focused' (3 hours of spotify drama)",          scores:{[K.PS]:3,[K.BR]:1} },
    ]
  },
  /* ── SOCIAL / RELATIONAL ── */
  {
    q: "your trauma response is to...",
    options: [
      { text:"monetize it into a personal brand",             scores:{[K.TC]:3,[K.PS]:1} },
      { text:"glow up so hard they regret it",                scores:{[K.EW]:3,[K.RP]:1} },
      { text:"dissociate in linen pants",                     scores:{[K.QL]:3,[K.BR]:1} },
      { text:"make a tiktok about it",                        scores:{[K.HH]:3,[K.TC]:1} },
    ]
  },
  {
    q: "in a group chat you are...",
    options: [
      { text:"the one who sends the 3am voice note",          scores:{[K.HH]:3,[K.SS]:1} },
      { text:"on read since tuesday, on purpose",             scores:{[K.BR]:3,[K.QL]:1} },
      { text:"providing unsolicited psychological analysis",  scores:{[K.PS]:3,[K.MC]:1} },
      { text:"the reason the group chat exists",              scores:{[K.RP]:3,[K.EW]:1} },
    ]
  },
  {
    q: "your love language is...",
    options: [
      { text:"over-explaining everything and hoping for the best", scores:{[K.SS]:3,[K.DC]:1} },
      { text:"acts of service that go entirely unnoticed",    scores:{[K.PS]:3,[K.TC]:1} },
      { text:"showing up looking like that",                  scores:{[K.EW]:3,[K.RP]:1} },
      { text:"ambient presence with plausible deniability",   scores:{[K.QL]:3,[K.BR]:1} },
    ]
  },
  {
    q: "your red flag is...",
    options: [
      { text:"thinking you can fix people with enough love",  scores:{[K.DC]:3,[K.SS]:1} },
      { text:"keeping score in a spreadsheet (mental)",       scores:{[K.PS]:3,[K.BR]:1} },
      { text:"posting 'unbothered' the same day you cried",   scores:{[K.TC]:3,[K.EW]:1} },
      { text:"being the most interesting person and knowing it", scores:{[K.RP]:3,[K.HH]:1} },
    ]
  },
  /* ── PHILOSOPHICAL / META ── */
  {
    q: "your relationship with sleep?",
    options: [
      { text:"doom scroll til 3, wake up at 6 for hot girl walk", scores:{[K.TC]:3,[K.PS]:1} },
      { text:"only sleep when the anxiety clears (never)",    scores:{[K.SS]:3,[K.HH]:1} },
      { text:"9 hours minimum. suffering in comfort.",        scores:{[K.QL]:3,[K.BR]:1} },
      { text:"what is sleep when the plot is this unresolved", scores:{[K.MC]:3,[K.DC]:1} },
    ]
  },
  {
    q: "the last thing you manifested was...",
    options: [
      { text:"them texting back (still waiting)",             scores:{[K.DC]:3,[K.SS]:1} },
      { text:"a version of yourself that has it together",    scores:{[K.PS]:3,[K.TC]:1} },
      { text:"being perceived as untouchable and succeeding", scores:{[K.EW]:3,[K.RP]:1} },
      { text:"nothing. manifesting is cringe. results only.", scores:{[K.BR]:3,[K.QL]:1} },
    ]
  },
  {
    q: "your therapy homework is probably...",
    options: [
      { text:"'notice when you people-please'",               scores:{[K.SS]:3,[K.DC]:1} },
      { text:"'stop making your healing a content series'",   scores:{[K.TC]:3,[K.HH]:1} },
      { text:"'sit with the feeling instead of optimizing it'", scores:{[K.PS]:3,[K.BR]:1} },
      { text:"'you don't need to be perceived to exist'",     scores:{[K.MC]:3,[K.QL]:1} },
    ]
  },
  {
    q: "if you were a season you'd be...",
    options: [
      { text:"spring — romanticising every green flag as destiny", scores:{[K.DC]:3,[K.MC]:1} },
      { text:"winter — unbothered, expensive, slightly dead inside", scores:{[K.QL]:3,[K.BR]:1} },
      { text:"summer — chaotic, magnetic, you'll recover later",  scores:{[K.RP]:3,[K.HH]:1} },
      { text:"autumn — peak aesthetics, decomposing quietly",     scores:{[K.TC]:3,[K.SS]:1} },
    ]
  },
  {
    q: "your inner monologue right now sounds like...",
    options: [
      { text:"'what if i just… ran away to a cottage'",       scores:{[K.MC]:3,[K.DC]:1} },
      { text:"'i'm fine. i'm fine. i'm not fine.'",           scores:{[K.SS]:3,[K.TC]:1} },
      { text:"'ok but what if i was right all along'",        scores:{[K.BR]:3,[K.EW]:1} },
      { text:"a to-do list with 47 items and no breaks",      scores:{[K.PS]:3,[K.HH]:1} },
    ]
  },
  /* ── MONEY / STATUS ── */
  {
    q: "your financial personality is...",
    options: [
      { text:"'treat yourself' is a coping mechanism",        scores:{[K.DC]:3,[K.HH]:1} },
      { text:"old money energy on a medium salary",           scores:{[K.QL]:3,[K.BR]:1} },
      { text:"monetising every skill before therapy",         scores:{[K.TC]:3,[K.PS]:1} },
      { text:"spending intentionally on being perceived well", scores:{[K.RP]:3,[K.EW]:1} },
    ]
  },
  {
    q: "your relationship with ambition?",
    options: [
      { text:"burning alive and calling it passion",           scores:{[K.PS]:3,[K.TC]:1} },
      { text:"i want everything but elegantly",               scores:{[K.BR]:3,[K.RP]:1} },
      { text:"i want a soft life and a main character arc",    scores:{[K.DC]:3,[K.MC]:1} },
      { text:"i'll get there when the vibe is right",         scores:{[K.HH]:3,[K.SS]:1} },
    ]
  },
  /* ── IDENTITY / QUIRKY ── */
  {
    q: "the compliment that hits hardest?",
    options: [
      { text:"'you make people feel so seen'",                scores:{[K.HH]:3,[K.DC]:1} },
      { text:"'you're not like other people'",                scores:{[K.MC]:3,[K.BR]:1} },
      { text:"'there's something about you'",                 scores:{[K.RP]:3,[K.EW]:1} },
      { text:"'you've really done the work'",                 scores:{[K.PS]:3,[K.TC]:1} },
    ]
  },
  {
    q: "when things go wrong you...",
    options: [
      { text:"identify the lesson immediately",               scores:{[K.PS]:3,[K.TC]:1} },
      { text:"go quiet, let them wonder",                     scores:{[K.EW]:3,[K.QL]:1} },
      { text:"blame mercury retrograde (sincerely)",          scores:{[K.DC]:3,[K.HH]:1} },
      { text:"write a note about it and spiral artistically", scores:{[K.MC]:3,[K.SS]:1} },
    ]
  },
  {
    q: "pick your villain era trigger",
    options: [
      { text:"being underestimated one too many times",       scores:{[K.EW]:3,[K.BR]:1} },
      { text:"someone else getting credit for your spiral",   scores:{[K.PS]:3,[K.TC]:1} },
      { text:"being left on delivered by the wrong person",   scores:{[K.SS]:3,[K.DC]:1} },
      { text:"the universe not matching your vision board",   scores:{[K.DC]:3,[K.MC]:1} },
    ]
  },
  {
    q: "your go-to comfort is...",
    options: [
      { text:"rewatching the same 3 shows and crying",        scores:{[K.SS]:3,[K.MC]:1} },
      { text:"a very expensive skincare routine",             scores:{[K.QL]:3,[K.EW]:1} },
      { text:"a new system that will fix everything",         scores:{[K.PS]:3,[K.BR]:1} },
      { text:"making your chaos someone else's favourite content", scores:{[K.HH]:3,[K.TC]:1} },
    ]
  },
  {
    q: "what are people always telling you?",
    options: [
      { text:"'you're too much'",                            scores:{[K.HH]:3,[K.DC]:1} },
      { text:"'you're so calm, it's actually concerning'",   scores:{[K.QL]:3,[K.BR]:1} },
      { text:"'why do you always need to analyse everything'", scores:{[K.PS]:3,[K.MC]:1} },
      { text:"'you never let anyone see you upset'",          scores:{[K.EW]:3,[K.TC]:1} },
    ]
  },
  {
    q: "your situationship status?",
    options: [
      { text:"'it's complicated' is an understatement",      scores:{[K.SS]:3,[K.DC]:1} },
      { text:"i don't do situationships. i win or i leave.",  scores:{[K.EW]:3,[K.RP]:1} },
      { text:"it's a case study now",                        scores:{[K.PS]:3,[K.MC]:1} },
      { text:"i'm too rich/busy/evolved for this question",   scores:{[K.BR]:3,[K.QL]:1} },
    ]
  },
  {
    q: "your relationship with eye contact?",
    options: [
      { text:"intense and intentional — they feel it",        scores:{[K.RP]:3,[K.EW]:1} },
      { text:"avoid it, overthink it, replay it at 3am",      scores:{[K.SS]:3,[K.HH]:1} },
      { text:"glance, disappear, reappear fabulous",          scores:{[K.QL]:3,[K.DC]:1} },
      { text:"i note it, file it, use it later",              scores:{[K.BR]:3,[K.PS]:1} },
    ]
  },
  {
    q: "pick your energy at a party",
    options: [
      { text:"floating between conversations like a ghost",   scores:{[K.MC]:3,[K.QL]:1} },
      { text:"the reason people stayed till 4am",             scores:{[K.RP]:3,[K.HH]:1} },
      { text:"texting the one person who isn't there",        scores:{[K.SS]:3,[K.DC]:1} },
      { text:"networking but calling it being present",       scores:{[K.BR]:3,[K.TC]:1} },
    ]
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   DETERMINISTIC archetype picker
─────────────────────────────────────────────────────────────────────────────*/
/* Scoring and the tiebreak.
   Each answer adds points to some archetypes; the highest total wins. About a quarter of answer
   combinations tie at the top (answers give 3 or 1 points), so the tiebreak matters:
     1. Spread: the archetype whose points came from the most different answers wins (a pattern
        across your answers beats one big answer).
     2. Recency: if still tied, the archetype your latest answer pointed to wins; if one answer
        pointed to both, the one it gave more points.
     3. Seed: a last resort if anything is still tied, so the result is always deterministic. With
        the current questions it is never reached (see coverage().tiesSettledBySeed).
   Before, ties silently went to whichever archetype came first in a list.
   Returns { archetype, attribution, scores }: attribution is the answers that gave the winner
   points, biggest first, for the "you said ..." line on the result screen. */
export function pickArchetype(answers, seed = getDailySeed()) {
  const archetypes = Object.values(K);
  const scores = {}, from = {};
  archetypes.forEach(a => { scores[a] = 0; from[a] = []; });
  answers.forEach(ans => {
    Object.entries(ans.scores || {}).forEach(([k, v]) => {
      if (!(k in scores) || !v) return;
      scores[k] += v;
      from[k].push({ text: ans.text, points: v });
    });
  });
  const max = Math.max(...archetypes.map(a => scores[a]));
  let tied = archetypes.filter(a => scores[a] === max);
  const narrow = (list, f) => { const m = Math.max(...list.map(f)); return list.filter(a => f(a) === m); };
  if (tied.length > 1) tied = narrow(tied, a => from[a].length);
  if (tied.length > 1) {
    // Latest answer that gave the archetype points, then the points it gave.
    const recency = a => { for (let j = answers.length - 1; j >= 0; j--) { const v = (answers[j].scores || {})[a]; if (v) return j * 100 + v; } return -1; };
    tied = narrow(tied, recency);
  }
  const archetype = tied.length === 1 ? tied[0] : tied[Math.floor(seededRng(seed)() * tied.length) % tied.length];
  const attribution = [...from[archetype]].sort((x, y) => y.points - x.points).map(x => x.text);
  return { archetype, attribution, scores };
}

/* Coverage of a set of questions: try every combination of answers (4^5 = 1,024 for five
   questions with four options) and report which archetypes can never win, how often the top
   score is shared (ties), and how many ties are left for the seed after spread and recency. */
export function coverage(questions, seed = 0) {
  const wins = {};
  Object.values(K).forEach(a => { wins[a] = 0; });
  let combos = 0, ties = 0, tiesSettledBySeed = 0;
  const walk = (i, picked) => {
    if (i === questions.length) {
      combos++;
      const { archetype, scores } = pickArchetype(picked, seed);
      wins[archetype]++;
      const max = Math.max(...Object.values(scores));
      const top = Object.keys(scores).filter(a => scores[a] === max);
      if (top.length > 1) {
        ties++;
        const narrow = (list, f) => { const m = Math.max(...list.map(f)); return list.filter(a => f(a) === m); };
        const spread = narrow(top, a => picked.filter(p => (p.scores || {})[a]).length);
        const recency = a => { for (let j = picked.length - 1; j >= 0; j--) { const v = (picked[j].scores || {})[a]; if (v) return j * 100 + v; } return -1; };
        if (spread.length > 1 && narrow(spread, recency).length > 1) tiesSettledBySeed++;
      }
      return;
    }
    for (const opt of questions[i].options) walk(i + 1, [...picked, opt]);
  };
  walk(0, []);
  const unreachable = Object.keys(wins).filter(a => wins[a] === 0);
  return { combos, wins, unreachable, ties, tiesSettledBySeed };
}
