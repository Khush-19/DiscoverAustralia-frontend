/**
 * useAuraIntelligence
 *
 * Derives a personalised Match Score by combining three signals:
 *
 *   1. Vibe alignment    — keyword overlap between the user's active vibe
 *                          searchQuery and the spot's category + tags.
 *   2. Biometric fit     — wearable stats (sleep, steps) matched against
 *                          what the spot demands physically/cognitively.
 *   3. Cost suitability  — 'Bored & Broke' vibe penalises paid spots and
 *                          rewards free ones.
 *
 * The algorithm is intentionally transparent so it can be explained to the
 * user in the UI ("Your Study Break vibe + 6.5h sleep → 94% match").
 *
 * Works with both LocationService shape (aiMatch, tags, costEstimate) and
 * discoveryService shape (isFree, category). Falls back gracefully when fields
 * are missing.
 */

import { useMemo } from 'react';
import { useUser } from './useUser';

// ─── Scoring weights (must sum to 100) ────────────────────────────────────────
const W_VIBE      = 40; // vibe keyword alignment
const W_BIOMETRIC = 25; // wearable stats fit
const W_COST      = 20; // cost suitability for vibe
const W_BASE      = 15; // base quality (existing aiMatch or rating)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

function keywordOverlap(query = '', target = '') {
  const words   = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = target.toLowerCase();
  if (!words.length) return 0;
  const hits = words.filter(w => haystack.includes(w)).length;
  return hits / words.length;
}

function spotsTagsString(spot) {
  const parts = [
    spot.category ?? '',
    ...(spot.tags ?? []),
    spot.name ?? '',
    spot.subtitle ?? '',
  ];
  return parts.join(' ');
}

// ─── Sub-scores ───────────────────────────────────────────────────────────────

function vibeScore(vibe, spot) {
  if (!vibe) return 0.5; // neutral when no vibe selected
  const overlap = keywordOverlap(vibe.searchQuery, spotsTagsString(spot));
  return clamp(overlap, 0, 1);
}

function biometricScore(wearableStats, spot) {
  if (!wearableStats) return 0.7;
  const { sleepHours = 7, steps = 7000 } = wearableStats;
  const target = spotsTagsString(spot).toLowerCase();

  // Low sleep → prefer quiet, restorative spots
  const prefersQuiet = target.includes('quiet') || target.includes('library') ||
                       target.includes('study') || target.includes('garden') ||
                       target.includes('park');

  // Low steps → prefer accessible, low-exertion spots
  const prefersLow   = target.includes('café') || target.includes('cafe') ||
                       target.includes('library') || target.includes('museum') ||
                       target.includes('gallery');

  // High-energy spots (beach, walk, sport) are penalised when tired
  const prefersHigh  = target.includes('beach') || target.includes('surf') ||
                       target.includes('walk') || target.includes('sport');

  let score = 0.7; // neutral baseline

  if (sleepHours < 6) {
    score += prefersQuiet ? 0.25 : (prefersHigh ? -0.3 : 0);
  } else if (sleepHours < 7) {
    score += prefersQuiet ? 0.15 : (prefersHigh ? -0.15 : 0);
  } else {
    // Well-rested: slight boost for active spots
    score += prefersHigh ? 0.15 : 0;
  }

  if (steps < 3000) {
    score += prefersLow ? 0.1 : (prefersHigh ? -0.2 : 0);
  }

  return clamp(score, 0, 1);
}

function costScore(vibe, spot) {
  if (!vibe) return 0.7;
  const isBudget  = vibe.id === 'bored-broke';
  const isFree    = spot.isFree === true ||
                    (spot.costEstimate ?? '').toLowerCase().includes('free') ||
                    (spot.costDetail  ?? '').toLowerCase().includes('no cost');

  if (isBudget && isFree)   return 1.0;   // perfect cost fit
  if (isBudget && !isFree)  return 0.35;  // penalise paid spots for broke vibe
  return 0.75;                            // non-budget vibes are cost-neutral
}

function baseScore(spot) {
  // Prefer existing aiMatch if present; fall back to normalised star rating
  if (spot.aiMatch) return clamp(spot.aiMatch, 0, 100) / 100;
  if (spot.rating)  return clamp((spot.rating - 1) / 4, 0, 1); // 1–5 → 0–1
  return 0.7;
}

// ─── Match label + colour ─────────────────────────────────────────────────────

function classify(score) {
  if (score >= 92) return { label: 'Perfect Match', color: '#10B981' };
  if (score >= 78) return { label: 'Great Match',   color: '#2DD4BF' };
  if (score >= 62) return { label: 'Good Match',    color: '#F59E0B' };
  return             { label: 'Possible Match',  color: '#6B7280' };
}

// ─── Reasoning builder ────────────────────────────────────────────────────────

function buildReasoning(vibe, wearableStats, costPct, vivePct) {
  const parts = [];
  if (vibe) {
    parts.push(vivePct >= 0.6
      ? `Strong alignment with your "${vibe.label}" vibe`
      : `Partial alignment with your "${vibe.label}" vibe`
    );
  }
  if (wearableStats?.sleepHours < 7) {
    parts.push(`low sleep (${wearableStats.sleepHours}h) factored in`);
  }
  if (costPct === 1) {
    parts.push('free entry matches your budget');
  }
  return parts.length
    ? parts.join(' · ') + '.'
    : 'Based on your current profile and location data.';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} spotData  — Spot/location object from LocationService or discoveryService
 * @returns {{
 *   matchScore:  number,   // 0–100
 *   matchLabel:  string,   // e.g. 'Perfect Match'
 *   matchColor:  string,   // hex
 *   reasoning:   string,   // human-readable explanation
 *   vibeLabel:   string|null,
 *   vibeEmoji:   string|null,
 * }}
 */
export function useAuraIntelligence(spotData) {
  const { vibe, wearableStats } = useUser();

  return useMemo(() => {
    if (!spotData) {
      return {
        matchScore: 70,
        matchLabel: 'Good Match',
        matchColor: '#F59E0B',
        reasoning:  'Loading spot data…',
        vibeLabel:  vibe?.label  ?? null,
        vibeEmoji:  vibe?.emoji  ?? null,
      };
    }

    const vPct = vibeScore(vibe, spotData);
    const bPct = biometricScore(wearableStats, spotData);
    const cPct = costScore(vibe, spotData);
    const base = baseScore(spotData);

    const raw = Math.round(
      vPct  * W_VIBE +
      bPct  * W_BIOMETRIC +
      cPct  * W_COST +
      base  * W_BASE
    );

    const score    = clamp(raw, 40, 99); // floor at 40 — no spot is 0% useful
    const { label, color } = classify(score);

    return {
      matchScore: score,
      matchLabel: label,
      matchColor: color,
      reasoning:  buildReasoning(vibe, wearableStats, cPct, vPct),
      vibeLabel:  vibe?.label  ?? null,
      vibeEmoji:  vibe?.emoji  ?? null,
    };
  }, [vibe, wearableStats, spotData]);
}
