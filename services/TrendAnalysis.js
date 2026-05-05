// 7-day history — index 0 is the oldest day (Monday), index 6 is today (Sunday)
export const AURA_HISTORY = [
  { day: 'Mon', score: 820, sleep: 7.2 },
  { day: 'Tue', score: 840, sleep: 7.5 },
  { day: 'Wed', score: 830, sleep: 7.0 },
  { day: 'Thu', score: 810, sleep: 6.8 },
  { day: 'Fri', score: 795, sleep: 6.5 },
  { day: 'Sat', score: 782, sleep: 6.2 },
  { day: 'Sun', score: 780, sleep: 6.5 },
];

/**
 * Returns true when the Aura Score has dropped for 3+ consecutive days
 * counting backwards from the most recent entry.
 */
export function detectNegativeTrend(history = AURA_HISTORY) {
  const scores = history.map(d => d.score);
  let streak = 0;
  for (let i = scores.length - 1; i > 0; i--) {
    if (scores[i] < scores[i - 1]) streak++;
    else break;
  }
  return streak >= 3;
}

/**
 * Percentage change from the first to the last entry.
 * Negative value means the score is declining.
 */
export function getTrendPercentage(history = AURA_HISTORY) {
  const first = history[0].score;
  const last  = history[history.length - 1].score;
  return Math.round(((last - first) / first) * 100);
}

// Simulated weekly activity drop used in TrendAlert messaging
export const ACTIVITY_DROP_PCT = 30;
