/**
 * aiService.js
 *
 * Insider Tips & AI Agent layer. Two responsibilities:
 *
 *   getInsiderTips(spotId)  — RAG-retrieved local secrets for a specific spot.
 *                             Mock mode returns curated tips immediately.
 *                             Real mode calls aura-brain-python /api/v1/tips.
 *
 *   askAgent(question, ctx) — Free-text question routed through the existing
 *                             AuraAPI.fetchInsiderTip RAG pipeline. This is a
 *                             real call even in "mock" mode, so the AI feature
 *                             works end-to-end as soon as the backend is running.
 *
 * Tip shape:
 *   { id, text, type: 'gem'|'local-secret'|'timing'|'warning', confidence: 0–100 }
 */

import { fetchInsiderTip } from './AuraAPI';

const BASE_URL  = 'http://10.0.2.2:8000';
const MOCK_MODE = true;
const MOCK_DELAY = 700;

// ─── Mock tip library ─────────────────────────────────────────────────────────
// Curated per-spot secrets; keyed by spotId. Falls back to category-level tips.

const SPOT_TIPS = {
  // ── Study Break locations ──────────────────────────────────────────────────
  'fisher-library': [
    {
      id: 'fl-1',
      text: 'Level 4 has power outlets under every second desk — arrive before 10 AM to claim one. The USB-A ports on the left pillar row work reliably.',
      type: 'gem',
      confidence: 96,
    },
    {
      id: 'fl-2',
      text: 'The quietest zone is the north-facing reading room on Level 3. Even during exam season, it stays under 30 dB.',
      type: 'local-secret',
      confidence: 91,
    },
    {
      id: 'fl-3',
      text: 'Free printing quota resets every Monday at midnight — use it before it expires. Bring your student ID to the help desk for access.',
      type: 'timing',
      confidence: 88,
    },
  ],

  'victoria-park-cafe': [
    {
      id: 'vpc-1',
      text: 'Ask for the student discount — it\'s not on the menu but baristas honour it with a USYD card. Saves $1.50 on every coffee.',
      type: 'local-secret',
      confidence: 94,
    },
    {
      id: 'vpc-2',
      text: 'The back terrace has four outdoor power sockets behind the green planter. Perfect for laptop work after 2 PM when the sun moves off.',
      type: 'gem',
      confidence: 89,
    },
  ],

  'usyd-gardens': [
    {
      id: 'ug-1',
      text: 'The fig-tree grove near the eastern gate is almost always empty — a hidden pocket of silence 50 m from the main path.',
      type: 'local-secret',
      confidence: 92,
    },
    {
      id: 'ug-2',
      text: 'Best golden-hour light hits the rose garden between 5:00–5:45 PM. Gets crowded on Fridays; go Wednesday for a clear shot.',
      type: 'timing',
      confidence: 85,
    },
  ],

  // ── Discovery spots — Bondi Beach ─────────────────────────────────────────
  'bv-1': [
    {
      id: 'b1-1',
      text: 'The north end of the beach (past the surf club) is 30% quieter year-round. Better for swimming too — rips are weaker here.',
      type: 'gem',
      confidence: 97,
    },
    {
      id: 'b1-2',
      text: 'Free outdoor showers work until 8 PM. The one nearest the car park has the strongest pressure and is rarely queued.',
      type: 'local-secret',
      confidence: 88,
    },
    {
      id: 'b1-3',
      text: 'Arrive before 8 AM on weekends to get a spot without the crowds. The café inside the pavilion opens at 7:30 AM and does flat whites for $4.',
      type: 'timing',
      confidence: 93,
    },
  ],

  // ── Discovery spots — Opera House / Circular Quay ─────────────────────────
  'bb-3': [
    {
      id: 'cq-1',
      text: 'Best unobstructed view of the Harbour Bridge is from the eastern walkway past the ferry terminals — not the tourist viewing deck.',
      type: 'gem',
      confidence: 95,
    },
    {
      id: 'cq-2',
      text: 'The Opera House steps are officially open 24/7. Sunset from the southern steps (facing the city) beats any rooftop bar and costs nothing.',
      type: 'local-secret',
      confidence: 90,
    },
  ],

  // ── Discovery spots — Hyde Park ───────────────────────────────────────────
  'bb-1': [
    {
      id: 'hp-1',
      text: 'The southern end near the ANZAC Memorial has free WiFi and shaded benches that are rarely used — perfect for a laptop session.',
      type: 'gem',
      confidence: 91,
    },
    {
      id: 'hp-2',
      text: 'St James station has a direct underground entrance from the park\'s north end. Skip the surface walk if it\'s raining.',
      type: 'local-secret',
      confidence: 87,
    },
  ],
};

// ─── Category fallbacks ───────────────────────────────────────────────────────
// Used when spotId has no curated tips. Matched on category keywords.

const CATEGORY_TIPS = {
  beach: [
    { id: 'cat-b-1', text: 'Early morning (before 8 AM) is when locals swim — water is calmer and lifeguards start at 9 AM, so go with a buddy.', type: 'timing', confidence: 84 },
    { id: 'cat-b-2', text: 'North-facing beaches get afternoon shade earlier. If you burn easily, plan around that.', type: 'gem', confidence: 80 },
  ],
  café: [
    { id: 'cat-c-1', text: 'Most Sydney cafés have a hidden seasonal menu on their Instagram. Ask for it — you\'ll look like a local.', type: 'local-secret', confidence: 82 },
    { id: 'cat-c-2', text: 'The back tables near the kitchen are warmest in winter and quietest for calls — ask to be seated there.', type: 'gem', confidence: 79 },
  ],
  library: [
    { id: 'cat-l-1', text: 'Group study rooms are usually bookable 2 weeks out — lock in a slot the moment they open.', type: 'timing', confidence: 88 },
    { id: 'cat-l-2', text: 'Return chutes near side entrances are rarely checked — useful if you just need to drop a book without queuing.', type: 'local-secret', confidence: 81 },
  ],
  default: [
    { id: 'cat-d-1', text: 'Sydney locals avoid peak times by arriving 30 min before or after the typical rush. Gives you a completely different experience.', type: 'timing', confidence: 76 },
    { id: 'cat-d-2', text: 'Google Maps reviews mentioning "hidden" or "locals only" in the last 6 months are the most reliable insider signals.', type: 'gem', confidence: 74 },
  ],
};

function getCategoryKey(category = '') {
  const c = category.toLowerCase();
  if (c.includes('beach') || c.includes('ocean') || c.includes('coastal')) return 'beach';
  if (c.includes('café') || c.includes('cafe') || c.includes('coffee')) return 'café';
  if (c.includes('library') || c.includes('study')) return 'library';
  return 'default';
}

// ─── Mock implementation ──────────────────────────────────────────────────────

async function mockGetInsiderTips(spotId, category) {
  await new Promise(r => setTimeout(r, MOCK_DELAY));
  const curated = SPOT_TIPS[spotId];
  if (curated) return curated;
  const key = getCategoryKey(category);
  return CATEGORY_TIPS[key] ?? CATEGORY_TIPS.default;
}

// ─── Real implementation ──────────────────────────────────────────────────────

async function realGetInsiderTips(spotId) {
  const res  = await fetch(`${BASE_URL}/api/v1/tips/${spotId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Failed to load tips');
  return data.tips;
}

// ─── Agent Q&A ────────────────────────────────────────────────────────────────
// Always attempts the real AuraAPI call — falls back to a mock answer if the
// backend is unreachable, so the UI never crashes in offline dev mode.

async function askAgent({ question, spotName, vibe, auraScore, userId = 'maya' }) {
  const contextualQuery = spotName
    ? `${question} (at ${spotName}, Sydney)`
    : question;
  try {
    return await fetchInsiderTip(contextualQuery, vibe ?? 'balanced', auraScore ?? 50, userId);
  } catch {
    // Backend offline → return a graceful mock answer
    await new Promise(r => setTimeout(r, 1000));
    return `Great question about ${spotName ?? 'that spot'}! Based on our Sydney database, ${question.toLowerCase().includes('sunset') ? 'the best sunset views are from the western-facing areas around 6–7 PM' : question.toLowerCase().includes('zoom') || question.toLowerCase().includes('call') ? 'there is a quiet corner on the upper level with strong mobile signal and minimal background noise' : 'locals recommend visiting mid-week in the early morning for the best experience'}. (AI backend offline — connect to Aura Brain for live answers.)`;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const aiService = {
  getInsiderTips: (spotId, category) =>
    MOCK_MODE
      ? mockGetInsiderTips(spotId, category)
      : realGetInsiderTips(spotId),
  askAgent,
};
