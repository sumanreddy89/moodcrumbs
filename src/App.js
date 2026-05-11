import { useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   ARCHETYPE PALETTE
─────────────────────────────────────────────────────────────────────────────*/
const PALETTE = {
  "The Delulu Coquette":                { bg:"#FDF0F0", bar:"#D4898A", accent:"#7A3A3B", muted:"#C4A0A0" },
  "The Quiet Luxury Depressive":        { bg:"#F5F1EB", bar:"#9C9080", accent:"#3A3228", muted:"#A89E92" },
  "The Rizz Prophet":                   { bg:"#F0EDF8", bar:"#8B7DC8", accent:"#3D3070", muted:"#A098C8" },
  "The Hyperpop Healer":                { bg:"#EAF3FB", bar:"#6C9FC8", accent:"#1E4A70", muted:"#90B8D8" },
  "The Situationship Soldier":          { bg:"#EBEEE4", bar:"#7A9060", accent:"#2A4018", muted:"#9AAA78" },
  "The Productivity Spiral":            { bg:"#FEF7E8", bar:"#D4960A", accent:"#5A3800", muted:"#C8A85A" },
  "The Main Character of a Side Plot":  { bg:"#F0EAF8", bar:"#9070C0", accent:"#3A1A68", muted:"#B098D0" },
  "The Trauma-Core Influencer":         { bg:"#F8F0E8", bar:"#C09070", accent:"#5A3018", muted:"#C8A880" },
  "The Bored Rich Kid With God Complex":{ bg:"#E8EFF8", bar:"#5A7BAE", accent:"#1A2E50", muted:"#7898C0" },
  "The Ex Who Always Wins":             { bg:"#F8EAF0", bar:"#C07090", accent:"#5A1830", muted:"#C890A8" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   SHORT KEYS for scoring
─────────────────────────────────────────────────────────────────────────────*/
const K = {
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
function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0xFFFFFFFF;
  };
}

function pickDailyQuestions(pool, n = 5) {
  const rng = seededRng(getDailySeed());
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

/* Day-of-week context injected into AI prompts for temporal relevance */
function getDayContext() {
  const days = [
    "sunday evening dread",
    "monday morning dissociation",
    "tuesday trying-to-reset energy",
    "wednesday we're deep in it",
    "thursday fake productivity",
    "friday main character energy",
    "saturday either healing or chaos"
  ];
  return days[new Date().getDay()];
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUESTION POOL — 30 questions, 5 picked daily by seed
   Each answer scores specific archetypes deterministically.
─────────────────────────────────────────────────────────────────────────────*/
const QUESTION_POOL = [
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
function pickArchetype(answers) {
  const scores = {};
  Object.values(K).forEach(a => { scores[a] = 0; });
  answers.forEach(ans => {
    Object.entries(ans.scores).forEach(([k,v]) => { scores[k] += v; });
  });
  // Find max with deterministic tiebreaker (first in archetype key order)
  let max = -1, winner = K.MC;
  Object.values(K).forEach(a => {
    if (scores[a] > max) { max = scores[a]; winner = a; }
  });
  return winner;
}

/* ─────────────────────────────────────────────────────────────────────────────
   POLAROID-STYLE PORTRAITS (matching the reference aesthetic)
   Warm sepia base, distinctive silhouette per character, vintage feel
─────────────────────────────────────────────────────────────────────────────*/

const Polaroid = ({ bg = "#D4A050", children }) => (
  <svg viewBox="0 0 200 240" style={{width:"100%",height:"100%",display:"block"}}>
    <rect width="200" height="240" fill={bg}/>
    {/* subtle vignette */}
    <radialGradient id="vig" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stopColor="#000" stopOpacity="0"/>
      <stop offset="100%" stopColor="#000" stopOpacity="0.18"/>
    </radialGradient>
    {children}
    <rect width="200" height="240" fill="url(#vig)"/>
  </svg>
);

const SK_BASE = "#E6B084"; // unified skin base
const HAIR_OUTLINE = "#2A1410";

function DeluloCoquette() {
  return <Polaroid bg="#D4A56C">
    {/* hair back volume */}
    <ellipse cx="100" cy="110" rx="58" ry="64" fill="#6A3E1C"/>
    {/* hair side flowing */}
    <path d="M44 116 Q40 160 50 196" stroke="#6A3E1C" strokeWidth="22" fill="none" strokeLinecap="round"/>
    <path d="M156 116 Q160 160 150 196" stroke="#6A3E1C" strokeWidth="22" fill="none" strokeLinecap="round"/>
    {/* HUGE pink bow */}
    <path d="M60 38 Q100 18 100 42 Q100 18 140 38 Q120 60 100 50 Q80 60 60 38Z" fill="#F09EAE"/>
    <ellipse cx="100" cy="42" rx="11" ry="9" fill="#E07090"/>
    <path d="M84 50 Q70 62 64 58" stroke="#E07090" strokeWidth="1" fill="#F09EAE"/>
    <path d="M116 50 Q130 62 136 58" stroke="#E07090" strokeWidth="1" fill="#F09EAE"/>
    {/* face */}
    <ellipse cx="100" cy="130" rx="46" ry="52" fill={SK_BASE}/>
    {/* shading on side */}
    <path d="M54 130 Q48 150 56 174 Q60 152 60 132Z" fill="#D49070" opacity="0.4"/>
    {/* blush */}
    <ellipse cx="74"  cy="142" rx="13" ry="8" fill="#E08080" opacity="0.4"/>
    <ellipse cx="126" cy="142" rx="13" ry="8" fill="#E08080" opacity="0.4"/>
    {/* doe eyes */}
    <ellipse cx="82"  cy="124" rx="11" ry="13" fill="#fff"/>
    <ellipse cx="82"  cy="126" rx="8"  ry="9"  fill="#4A2818"/>
    <ellipse cx="82"  cy="124" rx="3.5" ry="3.5" fill="#0C0808"/>
    <ellipse cx="85"  cy="120" rx="2.5" ry="2.5" fill="#fff"/>
    <ellipse cx="118" cy="124" rx="11" ry="13" fill="#fff"/>
    <ellipse cx="118" cy="126" rx="8"  ry="9"  fill="#4A2818"/>
    <ellipse cx="118" cy="124" rx="3.5" ry="3.5" fill="#0C0808"/>
    <ellipse cx="121" cy="120" rx="2.5" ry="2.5" fill="#fff"/>
    {/* upper lashes */}
    <path d="M70 115 Q78 110 88 113" stroke={HAIR_OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M112 113 Q122 110 130 115" stroke={HAIR_OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* brows soft */}
    <path d="M72 108 Q82 103 92 107" stroke="#4A2818" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M108 107 Q118 103 128 108" stroke="#4A2818" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 138 Q102 146 98 150" stroke="#C08868" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* small heart-shaped smile */}
    <path d="M88 160 Q100 168 112 160" stroke="#C04858" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* lace collar */}
    <path d="M54 198 Q100 214 146 198 L150 240 Q100 244 50 240Z" fill="#F4ECE0"/>
    <path d="M54 198 Q66 206 78 198 Q90 206 100 198 Q110 206 122 198 Q134 206 146 198" stroke="#D8C8B0" strokeWidth="1.5" fill="none"/>
  </Polaroid>;
}

function QuietLuxury() {
  return <Polaroid bg="#D4A968">
    {/* sleek platinum hair */}
    <path d="M50 116 Q46 64 66 32 Q84 12 100 10 Q116 12 134 32 Q154 64 150 116 Q148 150 146 184" fill="#C8C0A8"/>
    <path d="M50 116 Q48 150 54 184" fill="#C8C0A8"/>
    {/* hair shine */}
    <path d="M68 30 Q80 14 96 16 Q86 30 76 42" fill="#D8D0B8" opacity="0.7"/>
    {/* face */}
    <ellipse cx="100" cy="128" rx="46" ry="54" fill={SK_BASE}/>
    {/* huge dark sunglasses */}
    <rect x="56" y="116" width="38" height="24" rx="9" fill="#0E0E10"/>
    <rect x="106" y="116" width="38" height="24" rx="9" fill="#0E0E10"/>
    <line x1="94" y1="128" x2="106" y2="128" stroke="#222" strokeWidth="2.5"/>
    <line x1="52" y1="127" x2="56"  y2="127" stroke="#444" strokeWidth="2.5"/>
    <line x1="144" y1="127" x2="148" y2="127" stroke="#444" strokeWidth="2.5"/>
    {/* glasses shine */}
    <ellipse cx="68" cy="122" rx="7" ry="3" fill="#fff" opacity="0.18"/>
    <ellipse cx="118" cy="122" rx="7" ry="3" fill="#fff" opacity="0.18"/>
    {/* brow above */}
    <path d="M58 110 Q76 104 94 110" stroke="#8A7858" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M106 110 Q124 104 142 110" stroke="#8A7858" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 142 Q102 152 98 156" stroke="#C08868" strokeWidth="1.5" fill="none"/>
    {/* minimal mouth */}
    <path d="M88 168 Q100 172 112 168" stroke="#A05848" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* gold hoop earring */}
    <circle cx="50" cy="136" r="6" fill="none" stroke="#D4A020" strokeWidth="2.5"/>
    {/* turtleneck */}
    <path d="M54 196 Q100 210 146 196 L150 240 Q100 244 50 240Z" fill="#F4ECE0"/>
    <path d="M78 184 Q100 188 122 184 L124 200 Q100 202 76 200Z" fill="#F4ECE0"/>
  </Polaroid>;
}

function RizzProphet() {
  return <Polaroid bg="#C8965E">
    {/* dark hair */}
    <path d="M54 110 Q50 60 68 30 Q84 12 100 10 Q116 12 132 30 Q150 60 146 110" fill={HAIR_OUTLINE}/>
    <path d="M54 110 Q52 78 58 50" fill={HAIR_OUTLINE}/>
    <path d="M146 110 Q148 78 142 50" fill={HAIR_OUTLINE}/>
    {/* hair sheen */}
    <path d="M72 30 Q80 18 92 16 Q84 32 76 42" fill="#3A1810" opacity="0.6"/>
    {/* face — sharper jaw */}
    <path d="M54 130 Q50 168 64 188 Q82 200 100 200 Q118 200 136 188 Q150 168 146 130 Q142 80 100 80 Q58 80 54 130Z" fill={SK_BASE}/>
    {/* jaw shadow */}
    <path d="M64 178 Q82 196 100 198 Q118 196 136 178 Q120 192 100 192 Q80 192 64 178Z" fill="#C08868" opacity="0.5"/>
    {/* thick brows */}
    <path d="M70 110 Q84 102 96 110" stroke={HAIR_OUTLINE} strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M104 110 Q116 102 130 110" stroke={HAIR_OUTLINE} strokeWidth="4" fill="none" strokeLinecap="round"/>
    {/* confident eyes */}
    <ellipse cx="83"  cy="124" rx="10" ry="8" fill="#fff"/>
    <ellipse cx="83"  cy="126" rx="6"  ry="6" fill="#1A0808"/>
    <ellipse cx="83"  cy="124" rx="2.5" ry="2.5" fill="#0C0808"/>
    <ellipse cx="85"  cy="121" rx="1.5" ry="1.5" fill="#fff"/>
    <ellipse cx="117" cy="124" rx="10" ry="8" fill="#fff"/>
    <ellipse cx="117" cy="126" rx="6"  ry="6" fill="#1A0808"/>
    <ellipse cx="117" cy="124" rx="2.5" ry="2.5" fill="#0C0808"/>
    <ellipse cx="119" cy="121" rx="1.5" ry="1.5" fill="#fff"/>
    {/* nose */}
    <path d="M100 138 Q103 150 96 156" stroke="#A07848" strokeWidth="1.8" fill="none"/>
    {/* smirk — asymmetric */}
    <path d="M86 168 Q96 173 116 165" stroke="#8C4838" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* facial hair stubble */}
    <ellipse cx="100" cy="180" rx="20" ry="6" fill={HAIR_OUTLINE} opacity="0.18"/>
    {/* fur collar */}
    <path d="M40 200 Q100 218 160 200 L164 240 Q100 244 36 240Z" fill="#7A5028"/>
    <path d="M40 200 Q56 210 70 202 Q86 212 100 204 Q114 212 130 202 Q144 210 160 200" stroke="#A87038" strokeWidth="3.5" fill="none"/>
    {/* gold chain */}
    <path d="M70 188 Q100 198 130 188" stroke="#D4A020" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <circle cx="100" cy="196" r="4" fill="#D4A020"/>
  </Polaroid>;
}

function HyperpopHealer() {
  return <Polaroid bg="#D4A968">
    {/* split hair — teal LEFT */}
    <path d="M44 118 Q40 64 62 32 Q80 10 100 8 L100 118Z" fill="#00A8A8"/>
    {/* split hair — pink RIGHT */}
    <path d="M100 8 Q120 10 138 32 Q160 64 156 118 L100 118Z" fill="#E62288"/>
    {/* hair sides hanging */}
    <path d="M44 118 Q38 156 42 188" stroke="#00A8A8" strokeWidth="22" fill="none" strokeLinecap="round"/>
    <path d="M156 118 Q162 156 158 188" stroke="#E62288" strokeWidth="22" fill="none" strokeLinecap="round"/>
    {/* face */}
    <ellipse cx="100" cy="132" rx="46" ry="52" fill={SK_BASE}/>
    {/* rainbow eyeliner */}
    <path d="M68 116 Q82 108 96 115" stroke="#FF6B9D" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M68 121 Q82 116 95 121" stroke="#FFD700" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M104 115 Q118 108 132 116" stroke="#FF6B9D" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M105 121 Q118 116 132 121" stroke="#FFD700" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* big eyes */}
    <ellipse cx="82"  cy="128" rx="11" ry="10" fill="#fff"/>
    <ellipse cx="82"  cy="130" rx="7"  ry="7"  fill="#3A66B8"/>
    <ellipse cx="82"  cy="128" rx="3"  ry="3"  fill="#0C0808"/>
    <ellipse cx="84"  cy="125" rx="2"  ry="2"  fill="#fff"/>
    <ellipse cx="118" cy="128" rx="11" ry="10" fill="#fff"/>
    <ellipse cx="118" cy="130" rx="7"  ry="7"  fill="#3A66B8"/>
    <ellipse cx="118" cy="128" rx="3"  ry="3"  fill="#0C0808"/>
    <ellipse cx="120" cy="125" rx="2"  ry="2"  fill="#fff"/>
    {/* hello kitty bow cheek */}
    <path d="M58 148 Q64 142 64 152 Q64 142 70 148 Q66 156 64 152 Q62 156 58 148Z" fill="#FFB6C1"/>
    <circle cx="64" cy="152" r="3" fill="#FF7090"/>
    {/* star sticker */}
    <path d="M138 146 L141 140 L143 146 L150 146 L144 150 L147 158 L141 154 L135 158 L138 150 L132 146Z" fill="#FFD700"/>
    {/* nose */}
    <circle cx="100" cy="140" r="2.5" fill="#C08868" opacity="0.5"/>
    {/* big smile */}
    <path d="M82 158 Q100 174 118 158" stroke="#C04A60" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* colorful top */}
    <path d="M50 200 Q100 216 150 200 L154 240 Q100 244 46 240Z" fill="#FF6B9D"/>
    <path d="M68 192 Q100 200 132 192" stroke="#FFD700" strokeWidth="3" fill="none"/>
  </Polaroid>;
}

function SituationshipSoldier() {
  return <Polaroid bg="#A88054">
    {/* dark hoodie */}
    <path d="M18 198 Q40 160 76 168 Q90 158 100 156 Q110 158 124 168 Q160 160 182 198 L186 240 Q100 244 14 240Z" fill="#1E1E1E"/>
    <path d="M18 198 Q12 168 18 132" stroke="#1E1E1E" strokeWidth="32" fill="none" strokeLinecap="round"/>
    <path d="M182 198 Q188 168 182 132" stroke="#1E1E1E" strokeWidth="32" fill="none" strokeLinecap="round"/>
    {/* hoodie strings */}
    <line x1="88" y1="178" x2="86" y2="210" stroke="#E0DCD0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="112" y1="178" x2="114" y2="210" stroke="#E0DCD0" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="86" cy="212" r="2.5" fill="#E0DCD0"/>
    <circle cx="114" cy="212" r="2.5" fill="#E0DCD0"/>
    {/* messy bun */}
    <ellipse cx="100" cy="64" rx="26" ry="22" fill="#1A0F08"/>
    <circle cx="86" cy="58" r="6" fill="#1A0F08"/>
    <circle cx="114" cy="58" r="6" fill="#1A0F08"/>
    {/* loose strands */}
    <path d="M74 86 Q66 100 64 116" stroke="#1A0F08" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <path d="M126 86 Q134 100 136 116" stroke="#1A0F08" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <path d="M76 90 Q68 104 70 116" stroke="#1A0F08" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M124 90 Q132 104 130 116" stroke="#1A0F08" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* face — slightly pale */}
    <ellipse cx="100" cy="128" rx="46" ry="50" fill="#E4A878"/>
    {/* tired half-lidded eyes */}
    <ellipse cx="82"  cy="124" rx="12" ry="7" fill="#fff"/>
    <ellipse cx="82"  cy="126" rx="8"  ry="6" fill="#2A1408"/>
    <path d="M70 118 Q82 113 94 118" stroke="#1A0808" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="118" cy="124" rx="12" ry="7" fill="#fff"/>
    <ellipse cx="118" cy="126" rx="8"  ry="6" fill="#2A1408"/>
    <path d="M106 118 Q118 113 130 118" stroke="#1A0808" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    {/* eye bags */}
    <path d="M72 134 Q82 137 92 134" stroke="#B07050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M108 134 Q118 137 128 134" stroke="#B07050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 140 Q102 150 98 154" stroke="#A07050" strokeWidth="1.5" fill="none"/>
    {/* flat mouth */}
    <line x1="89" y1="162" x2="111" y2="162" stroke="#A06850" strokeWidth="2.5" strokeLinecap="round"/>
  </Polaroid>;
}

function ProductivitySpiral() {
  return <Polaroid bg="#D4A050">
    {/* sleek brown hair — wider/taller */}
    <path d="M50 124 Q44 60 68 30 Q84 10 100 8 Q116 10 132 30 Q156 60 150 124" fill="#6A3818"/>
    {/* hair down sides */}
    <path d="M50 124 Q48 160 54 188 Q66 196 76 188 Q72 156 76 132" fill="#6A3818"/>
    <path d="M150 124 Q152 160 146 188 Q134 196 124 188 Q128 156 124 132" fill="#6A3818"/>
    {/* face */}
    <ellipse cx="100" cy="132" rx="44" ry="52" fill={SK_BASE}/>
    {/* blush */}
    <ellipse cx="74"  cy="146" rx="10" ry="7" fill="#E08080" opacity="0.35"/>
    <ellipse cx="126" cy="146" rx="10" ry="7" fill="#E08080" opacity="0.35"/>
    {/* HUGE round glasses */}
    <circle cx="80"  cy="128" r="18" fill="none" stroke="#1A0F08" strokeWidth="3"/>
    <circle cx="120" cy="128" r="18" fill="none" stroke="#1A0F08" strokeWidth="3"/>
    <circle cx="80"  cy="128" r="16" fill="#fff" opacity="0.15"/>
    <circle cx="120" cy="128" r="16" fill="#fff" opacity="0.15"/>
    <line x1="98"  y1="128" x2="102" y2="128" stroke="#1A0F08" strokeWidth="2.5"/>
    <line x1="62"  y1="126" x2="56"  y2="123" stroke="#1A0F08" strokeWidth="2.5"/>
    <line x1="138" y1="126" x2="144" y2="123" stroke="#1A0F08" strokeWidth="2.5"/>
    {/* eyes inside */}
    <circle cx="80"  cy="128" r="6" fill="#2A1408"/>
    <circle cx="82"  cy="125" r="1.8" fill="#fff"/>
    <circle cx="120" cy="128" r="6" fill="#2A1408"/>
    <circle cx="122" cy="125" r="1.8" fill="#fff"/>
    {/* furrowed brows */}
    <path d="M64 108 Q78 102 96 108" stroke="#3A1810" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M104 108 Q122 102 136 108" stroke="#3A1810" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M93 104 Q97 100 100 104" stroke="#3A1810" strokeWidth="1.8" fill="none"/>
    {/* nose */}
    <path d="M100 144 Q102 154 98 158" stroke="#A07050" strokeWidth="1.5" fill="none"/>
    {/* worried mouth */}
    <path d="M88 168 Q100 174 112 168" stroke="#8C4838" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* blazer */}
    <path d="M50 198 Q100 214 150 198 L154 240 Q100 244 46 240Z" fill="#2A2018"/>
    <path d="M100 198 L100 240" stroke="#1A0F08" strokeWidth="1.5"/>
    <path d="M100 198 L82 218 L76 240" stroke="#1A0F08" strokeWidth="1.5" fill="none"/>
    <path d="M100 198 L118 218 L124 240" stroke="#1A0F08" strokeWidth="1.5" fill="none"/>
  </Polaroid>;
}

function MainCharacter() {
  return <Polaroid bg="#C89866">
    {/* medium wavy hair */}
    <path d="M48 120 Q42 66 64 32 Q82 10 100 8 Q118 10 136 32 Q158 66 152 120" fill="#5A3216"/>
    <path d="M48 120 Q42 156 50 186" fill="#5A3216"/>
    <path d="M152 120 Q158 156 150 186" fill="#5A3216"/>
    {/* wavy bumps in side hair */}
    <path d="M42 138 Q38 154 44 168" fill="#5A3216"/>
    <path d="M158 138 Q162 154 156 168" fill="#5A3216"/>
    {/* face — slightly tilted gaze */}
    <ellipse cx="100" cy="132" rx="46" ry="52" fill={SK_BASE}/>
    {/* asymmetric blush */}
    <ellipse cx="128" cy="148" rx="13" ry="8" fill="#E08080" opacity="0.4"/>
    <ellipse cx="76"  cy="146" rx="9"  ry="6" fill="#E08080" opacity="0.25"/>
    {/* eyes — looking up-left wistful */}
    <ellipse cx="82"  cy="124" rx="11" ry="10" fill="#fff"/>
    <ellipse cx="79"  cy="121" rx="7"  ry="7"  fill="#3A1F0E"/>
    <ellipse cx="78"  cy="119" rx="3"  ry="3"  fill="#0C0808"/>
    <ellipse cx="80"  cy="116" rx="2"  ry="2"  fill="#fff"/>
    <ellipse cx="118" cy="124" rx="11" ry="10" fill="#fff"/>
    <ellipse cx="115" cy="121" rx="7"  ry="7"  fill="#3A1F0E"/>
    <ellipse cx="114" cy="119" rx="3"  ry="3"  fill="#0C0808"/>
    <ellipse cx="116" cy="116" rx="2"  ry="2"  fill="#fff"/>
    {/* soft brows */}
    <path d="M72 110 Q82 105 92 110" stroke="#3A1F0E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M108 110 Q118 105 128 110" stroke="#3A1F0E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 142 Q103 154 96 158" stroke="#A07050" strokeWidth="1.5" fill="none"/>
    {/* gentle smile */}
    <path d="M88 168 Q100 174 112 168" stroke="#8C4838" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* thrift blazer */}
    <path d="M46 198 Q100 214 154 198 L158 240 Q100 244 42 240Z" fill="#7A5C2A"/>
    <path d="M100 198 L100 240" stroke="#5A4220" strokeWidth="1.5"/>
    <path d="M100 198 L82 218 L76 240" stroke="#5A4220" strokeWidth="1.5" fill="none"/>
    <path d="M100 198 L118 218 L124 240" stroke="#5A4220" strokeWidth="1.5" fill="none"/>
  </Polaroid>;
}

function TraumaCore() {
  return <Polaroid bg="#D4A968">
    {/* HUGE blonde voluminous hair */}
    <ellipse cx="100" cy="100" rx="76" ry="72" fill="#C8A050"/>
    <ellipse cx="30"  cy="118" rx="22" ry="40" fill="#C8A050"/>
    <ellipse cx="170" cy="118" rx="22" ry="40" fill="#C8A050"/>
    {/* shine */}
    <path d="M60 38 Q70 22 82 18 Q74 36 64 46" fill="#E8C870" opacity="0.6"/>
    <path d="M140 38 Q130 22 118 18 Q126 36 136 46" fill="#E8C870" opacity="0.6"/>
    {/* face */}
    <ellipse cx="100" cy="132" rx="46" ry="52" fill={SK_BASE}/>
    {/* serene eyes — slightly too open */}
    <ellipse cx="82"  cy="128" rx="12" ry="10" fill="#fff"/>
    <ellipse cx="82"  cy="130" rx="8"  ry="8"  fill="#3A2010"/>
    <ellipse cx="82"  cy="128" rx="3.5" ry="3.5" fill="#0C0808"/>
    <ellipse cx="84"  cy="125" rx="2"  ry="2"  fill="#fff"/>
    <ellipse cx="118" cy="128" rx="12" ry="10" fill="#fff"/>
    <ellipse cx="118" cy="130" rx="8"  ry="8"  fill="#3A2010"/>
    <ellipse cx="118" cy="128" rx="3.5" ry="3.5" fill="#0C0808"/>
    <ellipse cx="120" cy="125" rx="2"  ry="2"  fill="#fff"/>
    {/* peaceful brows */}
    <path d="M70 114 Q82 110 94 114" stroke="#5A3818" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M106 114 Q118 110 130 114" stroke="#5A3818" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 144 Q103 154 96 158" stroke="#A07050" strokeWidth="1.5" fill="none"/>
    {/* too-wide serene smile */}
    <path d="M76 168 Q100 188 124 168" stroke="#A04050" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M76 168 Q100 184 124 168 Q100 178 76 168Z" fill="#E08070" opacity="0.3"/>
    {/* small teeth glint */}
    <path d="M84 172 Q100 182 116 172 Q100 178 84 172Z" fill="#fff" opacity="0.8"/>
    {/* crystal necklace */}
    <path d="M70 196 Q100 206 130 196" stroke="#C0A060" strokeWidth="2" fill="none"/>
    <path d="M96 204 L100 218 L104 204" stroke="#C0A060" strokeWidth="1.5" fill="none"/>
    <ellipse cx="100" cy="220" rx="4" ry="6" fill="#A8D0E0" opacity="0.8"/>
    {/* white linen top */}
    <path d="M52 202 Q100 216 148 202 L152 240 Q100 244 48 240Z" fill="#F0E8D8"/>
  </Polaroid>;
}

function BoredRichKid() {
  return <Polaroid bg="#A88860">
    {/* very clean cut hair */}
    <path d="M58 110 Q54 60 70 32 Q86 12 100 10 Q114 12 130 32 Q146 60 142 110" fill="#0E0908"/>
    {/* sharp fade sides */}
    <rect x="54" y="108" width="8" height="48" fill="#0E0908"/>
    <rect x="138" y="108" width="8" height="48" fill="#0E0908"/>
    {/* face */}
    <ellipse cx="100" cy="132" rx="46" ry="52" fill={SK_BASE}/>
    {/* jaw shadow */}
    <path d="M58 168 Q82 192 100 196 Q118 192 142 168 Q120 184 100 184 Q80 184 58 168Z" fill="#C08868" opacity="0.4"/>
    {/* flat deadpan brows */}
    <rect x="68" y="112" width="28" height="4" rx="2" fill="#0E0908"/>
    <rect x="104" y="112" width="28" height="4" rx="2" fill="#0E0908"/>
    {/* cold half-lidded eyes */}
    <ellipse cx="83"  cy="126" rx="12" ry="7" fill="#fff"/>
    <ellipse cx="83"  cy="128" rx="8"  ry="5" fill="#0E0908"/>
    <ellipse cx="83"  cy="126" rx="3"  ry="3" fill="#0C0808"/>
    <path d="M71 120 Q83 116 95 120" stroke="#0E0908" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <ellipse cx="117" cy="126" rx="12" ry="7" fill="#fff"/>
    <ellipse cx="117" cy="128" rx="8"  ry="5" fill="#0E0908"/>
    <ellipse cx="117" cy="126" rx="3"  ry="3" fill="#0C0808"/>
    <path d="M105 120 Q117 116 129 120" stroke="#0E0908" strokeWidth="4" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 144 Q102 156 96 160" stroke="#A07050" strokeWidth="1.5" fill="none"/>
    {/* neutral line mouth */}
    <line x1="88" y1="172" x2="112" y2="172" stroke="#8C4838" strokeWidth="2.5" strokeLinecap="round"/>
    {/* navy luxury blazer */}
    <path d="M48 198 Q100 212 152 198 L156 240 Q100 244 44 240Z" fill="#0F1E32"/>
    <path d="M82 198 L78 218 L72 240" stroke="#E0E8F0" strokeWidth="2.5" fill="none"/>
    <path d="M118 198 L122 218 L128 240" stroke="#E0E8F0" strokeWidth="2.5" fill="none"/>
    {/* gold watch */}
    <rect x="140" y="218" width="18" height="10" rx="2" fill="#D4A020"/>
  </Polaroid>;
}

function ExWhoWins() {
  return <Polaroid bg="#D49880">
    {/* glossy dark hair big */}
    <path d="M44 118 Q40 62 62 30 Q80 8 100 6 Q120 8 138 30 Q160 62 156 118 Q152 158 154 186" fill="#0A0606"/>
    <path d="M44 118 Q42 158 48 186" fill="#0A0606"/>
    {/* hair shine */}
    <path d="M66 28 Q78 14 90 12 Q83 30 70 40" fill="#3A1818" opacity="0.7"/>
    <path d="M134 28 Q122 14 110 12 Q117 30 130 40" fill="#3A1818" opacity="0.7"/>
    {/* face */}
    <ellipse cx="100" cy="132" rx="46" ry="52" fill={SK_BASE}/>
    {/* glow blush */}
    <ellipse cx="74"  cy="148" rx="14" ry="9" fill="#E07080" opacity="0.45"/>
    <ellipse cx="126" cy="148" rx="14" ry="9" fill="#E07080" opacity="0.45"/>
    {/* confident eyes */}
    <ellipse cx="82"  cy="124" rx="12" ry="10" fill="#fff"/>
    <ellipse cx="82"  cy="126" rx="8"  ry="8"  fill="#2A0808"/>
    <ellipse cx="82"  cy="124" rx="3.5" ry="3.5" fill="#0C0808"/>
    <ellipse cx="85"  cy="121" rx="2.5" ry="2.5" fill="#fff"/>
    <ellipse cx="118" cy="124" rx="12" ry="10" fill="#fff"/>
    <ellipse cx="118" cy="126" rx="8"  ry="8"  fill="#2A0808"/>
    <ellipse cx="118" cy="124" rx="3.5" ry="3.5" fill="#0C0808"/>
    <ellipse cx="121" cy="121" rx="2.5" ry="2.5" fill="#fff"/>
    {/* shaped brows */}
    <path d="M70 110 Q82 104 94 110" stroke="#1A0808" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M106 110 Q118 104 130 110" stroke="#1A0808" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M100 142 Q103 154 96 158" stroke="#A07050" strokeWidth="1.5" fill="none"/>
    {/* smirk — knowing, asymmetric */}
    <path d="M86 168 Q96 172 114 162" stroke="#A03048" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* glossy lip highlight */}
    <path d="M94 168 Q100 170 106 167" stroke="#FF6080" strokeWidth="1.5" fill="none" opacity="0.6"/>
    {/* red top */}
    <path d="M48 198 Q100 214 152 198 L156 240 Q100 244 44 240Z" fill="#B82850"/>
    {/* phone (signature prop) */}
    <rect x="140" y="186" width="22" height="36" rx="4" fill="#0A0A0A"/>
    <rect x="142" y="188" width="18" height="30" rx="3" fill="#3A6FAA"/>
    <line x1="146" y1="200" x2="158" y2="200" stroke="#7AAACC" strokeWidth="1.5"/>
    <line x1="146" y1="206" x2="154" y2="206" stroke="#7AAACC" strokeWidth="1.5"/>
  </Polaroid>;
}

const PORTRAITS = {
  [K.DC]: DeluloCoquette,
  [K.QL]: QuietLuxury,
  [K.RP]: RizzProphet,
  [K.HH]: HyperpopHealer,
  [K.SS]: SituationshipSoldier,
  [K.PS]: ProductivitySpiral,
  [K.MC]: MainCharacter,
  [K.TC]: TraumaCore,
  [K.BR]: BoredRichKid,
  [K.EW]: ExWhoWins,
};

/* ─────────────────────────────────────────────────────────────────────────────
   POLAROID CARD with label (matching the reference image)
─────────────────────────────────────────────────────────────────────────────*/
function PolaroidCard({ archetype, size = 180 }) {
  const PC = PORTRAITS[archetype];
  if (!PC) return null;
  return (
    <div style={{
      display:"inline-block",
      background:"#F5EFE0",
      padding:"10px 10px 14px",
      boxShadow:"0 8px 24px rgba(60,40,20,0.25)",
      border:"1px solid #B89860"
    }}>
      <div style={{width:size, height:size*1.15, overflow:"hidden", border:"2px solid #5A3818"}}>
        <PC/>
      </div>
      <p style={{
        margin:"10px 0 0",
        fontFamily:"'Georgia',serif",
        fontWeight:"bold",
        fontSize: size > 150 ? 14 : 11,
        textAlign:"center",
        color:"#3A2018",
        letterSpacing:"0.04em",
        textTransform:"uppercase",
        lineHeight:1.15,
        maxWidth: size + 16
      }}>{archetype}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMIC STRIP — proper bordered panels with speech bubbles + character
─────────────────────────────────────────────────────────────────────────────*/
function ComicStrip({ comic, archetype, p }) {
  const PC = PORTRAITS[archetype];
  const panels = [comic.panel1, comic.panel2, comic.panel3];
  return (
    <div style={{marginBottom:14}}>
      <p style={{
        fontFamily:"'Georgia',serif",
        fontWeight:"bold",
        fontSize:13,
        color:p.accent,
        textAlign:"center",
        margin:"0 0 10px",
        textTransform:"uppercase",
        letterSpacing:"0.08em"
      }}>{comic.title}</p>

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr",
        gap:0,
        border:`3px solid #1A0F08`,
        borderRadius:6,
        overflow:"hidden",
        boxShadow:"0 6px 22px rgba(0,0,0,0.2)",
        background:"#F5EFE0"
      }}>
        {panels.map((panel, i) => (
          <div key={i} style={{
            borderRight: i<2 ? `3px solid #1A0F08` : "none",
            display:"flex",
            flexDirection:"column",
            position:"relative",
            minHeight:200
          }}>
            {/* caption banner */}
            <div style={{
              background:"#1A0F08",
              padding:"4px 8px",
              fontSize:8,
              color:"#F5EFE0",
              fontFamily:"'Courier New',monospace",
              fontWeight:"bold",
              textTransform:"uppercase",
              letterSpacing:"0.05em",
              textAlign:"center"
            }}>{panel.caption}</div>

            {/* scene — show character with different expression/context per panel */}
            <div style={{
              flex:1,
              position:"relative",
              overflow:"hidden",
              minHeight:120,
              borderBottom:`2px solid #1A0F08`
            }}>
              {/* character — shown in every panel for continuity */}
              <div style={{position:"absolute",inset:0}}>
                {PC && <PC/>}
              </div>
              {/* panel-specific overlay (action lines / vibes) */}
              {i===1 && (
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[...Array(8)].map((_,j)=>(
                    <line key={j} x1="50" y1="50"
                      x2={50+45*Math.cos(j*Math.PI/4)} y2={50+45*Math.sin(j*Math.PI/4)}
                      stroke="#1A0F08" strokeWidth="0.4" opacity="0.3"/>
                  ))}
                </svg>
              )}
              {i===2 && (
                <div style={{position:"absolute",top:6,right:6,fontSize:16}}>💀</div>
              )}
            </div>

            {/* speech bubble */}
            <div style={{padding:"8px 6px 10px",background:"#F5EFE0"}}>
              <div style={{
                background:"#fff",
                border:"2px solid #1A0F08",
                borderRadius:14,
                padding:"7px 10px",
                position:"relative",
                boxShadow:"2px 2px 0 #1A0F08"
              }}>
                <div style={{
                  position:"absolute",
                  bottom:-9,
                  left:14,
                  width:0,
                  height:0,
                  borderLeft:"6px solid transparent",
                  borderRight:"6px solid transparent",
                  borderTop:"9px solid #1A0F08"
                }}/>
                <div style={{
                  position:"absolute",
                  bottom:-6,
                  left:16,
                  width:0,
                  height:0,
                  borderLeft:"4px solid transparent",
                  borderRight:"4px solid transparent",
                  borderTop:"7px solid #fff"
                }}/>
                <p style={{
                  fontSize:10,
                  color:"#1A0F08",
                  margin:0,
                  fontStyle:"italic",
                  lineHeight:1.4,
                  fontFamily:"'Georgia',serif"
                }}>{panel.dialogue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN APP
─────────────────────────────────────────────────────────────────────────────*/
const serif = "'Georgia','Times New Roman',serif";
const sans  = "'Helvetica Neue',Arial,sans-serif";

export default function App() {
  // Pick today's 5 questions once on mount — same all day, different each day
  const [QUESTIONS]         = useState(() => pickDailyQuestions(QUESTION_POOL, 5));
  const dayCtx              = getDayContext();

  const [step, setStep]     = useState("intro");
  const [answers, setAnswers] = useState([]);
  const [qi, setQi]         = useState(0);
  const [result, setResult] = useState(null);
  const [comic, setComic]   = useState(null);
  const [loadC, setLoadC]   = useState(false);
  const [err, setErr]       = useState("");

  const handleAnswer = async (opt) => {
    const next = [...answers, opt];
    setAnswers(next);
    if (qi < QUESTIONS.length - 1) {
      setQi(qi + 1);
    } else {
      setStep("loading");
      const archetype = pickArchetype(next);
      await fetchCrumb(archetype, next);
    }
  };

  const fetchCrumb = async (archetype, allAns) => {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          system:`You write Mood Crumbs — short, sharp, GenZ poetic one-liners. Gender-neutral. TikTok comment energy. No explanations.

Write a crumb specifically for someone matching this archetype: "${archetype}". Reference their specific quiz answers and the current temporal vibe. Don't name the archetype in the crumb itself.

Output ONLY valid JSON, no markdown:
{"crumb":"1-2 line cutting one-liner","vibe":"4-6 word poetic vibe ID like 'ethereal burnout in thrifted corduroy'"}`,
          messages:[{role:"user",content:
            `Archetype: ${archetype}\nDay energy: ${dayCtx}\n\nTheir answers:\n${allAns.map((a,i)=>`Q${i+1}: ${a.text}`).join("\n")}`
          }]
        })
      });
      const d = await r.json();
      const parsed = JSON.parse(d.content[0].text.trim().replace(/```json|```/g,"").trim());
      setResult({ archetype, crumb: parsed.crumb, vibe: parsed.vibe });
      setStep("result");
    } catch {
      // Fallback if API fails
      setResult({ archetype, crumb:"you contain multitudes. some of them texting your ex.", vibe:"chaotic neutral in expensive lighting" });
      setStep("result");
    }
  };

  const fetchComic = async () => {
    if (!result) return;
    setLoadC(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:500,
          system:`Write a 3-panel comic for Mood Crumbs. Specific to the archetype AND their actual quiz answers. Painfully relatable, deadpan funny, GenZ. Each dialogue MAX 12 words. Captions 3-5 words.

Output ONLY valid JSON:
{"title":"lowercase ironic title, max 5 words","panel1":{"caption":"scene setter","dialogue":"opening line"},"panel2":{"caption":"escalation","dialogue":"chaotic middle"},"panel3":{"caption":"punchline","dialogue":"gut-punch closer"}}`,
          messages:[{role:"user",content:
            `Archetype: ${result.archetype}\nVibe: ${result.vibe}\nDay energy: ${dayCtx}\n\nQuiz answers:\n${answers.map((a,i)=>`Q${i+1}: ${a.text}`).join("\n")}`
          }]
        })
      });
      const d = await r.json();
      setComic(JSON.parse(d.content[0].text.trim().replace(/```json|```/g,"").trim()));
    } catch {
      setErr("comic failed.");
    }
    setLoadC(false);
  };

  const reset = () => {
    setStep("intro"); setAnswers([]); setQi(0);
    setResult(null); setComic(null); setErr("");
  };

  const p = result ? (PALETTE[result.archetype] || PALETTE[K.MC]) : {};

  return (
    <div style={{
      minHeight:"100vh",
      background:"#F5EFE0",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      padding:"2rem 1.25rem",
      fontFamily:serif
    }}>

      {step === "intro" && (
        <div style={{textAlign:"center", maxWidth:420}}>
          <div style={{fontSize:52, marginBottom:14, lineHeight:1}}>🍪</div>
          <h1 style={{fontSize:30, fontWeight:400, margin:"0 0 10px", letterSpacing:"-0.6px", color:"#1C1A17"}}>Mood Crumbs</h1>
          <p style={{color:"#7A6850", fontSize:15, margin:"0 0 6px", lineHeight:1.65}}>
            5 questions. 1 archetype.<br/>no therapy. just the truth.
          </p>
          <p style={{color:"#B0A080", fontSize:11, margin:"0 0 4px", fontFamily:sans, letterSpacing:"0.04em"}}>
            ↻ fresh questions every day · {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})}
          </p>
          {err && <p style={{color:"#C47A7A", fontSize:13, margin:"12px 0 0"}}>{err}</p>}
          <button onClick={()=>setStep("quiz")} style={{
            marginTop:28, background:"#1C1A17", color:"#F5EFE0", border:"none",
            padding:"13px 36px", borderRadius:40, fontSize:15, cursor:"pointer", fontFamily:serif
          }}>find out who you are →</button>
        </div>
      )}

      {step === "quiz" && (
        <div style={{maxWidth:480, width:"100%"}}>
          <div style={{display:"flex", gap:6, marginBottom:36}}>
            {QUESTIONS.map((_,i)=>(
              <div key={i} style={{
                height:3, flex:1, borderRadius:2,
                background: i <= qi ? "#1C1A17" : "#D0C4A8",
                transition:"background 0.3s"
              }}/>
            ))}
          </div>
          <p style={{fontSize:11, color:"#9A8870", margin:"0 0 14px", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:sans}}>
            {qi+1} of {QUESTIONS.length}
          </p>
          <h2 style={{fontSize:22, fontWeight:400, margin:"0 0 28px", lineHeight:1.45, color:"#1C1A17"}}>
            {QUESTIONS[qi].q}
          </h2>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {QUESTIONS[qi].options.map((opt,i)=>(
              <button key={i} onClick={()=>handleAnswer(opt)} style={{
                background:"#fff", border:"1px solid #D4C8A8", borderRadius:12,
                padding:"15px 20px", textAlign:"left", fontSize:15, cursor:"pointer",
                fontFamily:serif, color:"#2C2820", lineHeight:1.5
              }}
                onMouseEnter={e=>{e.currentTarget.style.background="#F0E8D0"; e.currentTarget.style.borderColor="#B89860";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#D4C8A8";}}>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "loading" && (
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:42, marginBottom:16}}>🍪</div>
          <p style={{fontSize:17, color:"#7A6850", fontStyle:"italic", margin:"0 0 8px"}}>reading your vibe...</p>
          <p style={{fontSize:13, color:"#9A8870"}}>the crumb is forming.</p>
        </div>
      )}

      {step === "result" && result && (
        <div style={{maxWidth:420, width:"100%", textAlign:"center"}}>

          {/* Polaroid hero */}
          <div style={{marginBottom:20}}>
            <PolaroidCard archetype={result.archetype} size={200}/>
          </div>

          {/* Vibe ID */}
          <p style={{
            fontSize:13, color:p.bar, fontStyle:"italic",
            margin:"0 0 16px", fontFamily:sans, letterSpacing:"0.02em"
          }}>"{result.vibe}"</p>

          {/* Crumb card */}
          <div style={{
            background:p.bg, borderRadius:10, padding:"18px 22px",
            marginBottom:18, border:`1.5px solid ${p.bar}40`
          }}>
            <p style={{
              fontSize:16, color:p.accent, fontStyle:"italic",
              lineHeight:1.7, margin:0
            }}>"{result.crumb}"</p>
          </div>

          {/* Comic button or strip */}
          {!comic && (
            <button onClick={fetchComic} disabled={loadC} style={{
              background:p.accent, color:"#fff", border:"none",
              padding:"12px 28px", borderRadius:40, fontSize:14,
              cursor: loadC ? "not-allowed" : "pointer",
              fontFamily:serif, marginBottom:14, opacity: loadC ? 0.6 : 1,
              width:"100%", fontWeight:"bold", letterSpacing:"0.03em"
            }}>
              {loadC ? "drawing your comic..." : "✦ generate your comic strip →"}
            </button>
          )}

          {comic && <ComicStrip comic={comic} archetype={result.archetype} p={p}/>}

          <p style={{
            fontSize:12, color:"#9A8870",
            margin:"4px 0 14px", fontStyle:"italic"
          }}>screenshot this. your ex will see it.</p>

          <button onClick={reset} style={{
            background:"transparent", border:"1px solid #C4B498",
            borderRadius:40, padding:"10px 22px", fontSize:13,
            cursor:"pointer", fontFamily:serif, color:"#7A6850"
          }}>try again →</button>
        </div>
      )}
    </div>
  );
}
