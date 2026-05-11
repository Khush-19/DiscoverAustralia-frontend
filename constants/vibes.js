/**
 * vibes.js — Single source of truth for every Vibe definition.
 *
 * Consumed by: VibePicker, VibeScreen, discoveryService, UserContext, InsightCard.
 * Adding a new vibe here is the only change needed — no screen edits required.
 */
import { vibeGradients } from './theme';

export const VIBES = [
  {
    id:              'bored-broke',
    label:           'Bored & Broke',
    subtitle:        'Free things to do near you',
    emoji:           '😴',
    spots:           12,
    colorGradient:   vibeGradients.boredBroke,
    colorGradientFull: vibeGradients.boredBrokeFull,
    spotsAlpha:      'rgba(0,0,0,0.25)',
    searchQuery:     'free parks markets events activities',
    auraBoost:       15,
    accentColor:     '#34D399',
  },
  {
    id:              'study-break',
    label:           'Study Break',
    subtitle:        'Recharge spots & quiet cafes',
    emoji:           '📚',
    spots:           8,
    colorGradient:   vibeGradients.studyBreak,
    colorGradientFull: vibeGradients.studyBreakFull,
    spotsAlpha:      'rgba(0,0,0,0.22)',
    searchQuery:     'quiet library wifi cafe study',
    auraBoost:       20,
    accentColor:     '#38BDF8',
  },
  {
    id:              'aussie-classics',
    label:           'Aussie Classics',
    subtitle:        'Iconic local experiences',
    emoji:           '🦘',
    spots:           24,
    colorGradient:   vibeGradients.aussieClassics,
    colorGradientFull: vibeGradients.aussieClassicsFull,
    spotsAlpha:      'rgba(0,0,0,0.20)',
    searchQuery:     'iconic tourist attraction landmark heritage',
    auraBoost:       25,
    accentColor:     '#FCD34D',
  },
  {
    id:              'night-out',
    label:           'Night Out',
    subtitle:        'After-dark Sydney game',
    emoji:           '🌙',
    spots:           16,
    colorGradient:   vibeGradients.nightOut,
    colorGradientFull: vibeGradients.nightOutFull,
    spotsAlpha:      'rgba(0,0,0,0.28)',
    searchQuery:     'bar rooftop live music nightlife club',
    auraBoost:       10,
    accentColor:     '#A78BFA',
  },
  {
    id:              'beach-vibes',
    label:           'Beach Vibes',
    subtitle:        'Sun, sand & surf today',
    emoji:           '🏄',
    spots:           9,
    colorGradient:   vibeGradients.beachVibes,
    colorGradientFull: vibeGradients.beachVibesFull,
    spotsAlpha:      'rgba(0,0,0,0.22)',
    searchQuery:     'beach ocean surf coastal walk',
    auraBoost:       30,
    accentColor:     '#22D3EE',
  },
  {
    id:              'squad-up',
    label:           'Squad Up',
    subtitle:        'Find your people nearby',
    emoji:           '🤝',
    spots:           18,
    colorGradient:   vibeGradients.squadUp,
    colorGradientFull: ['#1F2937', '#2D3748', '#4B5563'],
    spotsAlpha:      'rgba(0,0,0,0.28)',
    searchQuery:     'social meetup group activity sport',
    auraBoost:       35,
    accentColor:     '#60A5FA',
  },
];

/** O(1) lookup by id — used in discoveryService and screens. */
export function getVibeById(id) {
  return VIBES.find(v => v.id === id) ?? null;
}
