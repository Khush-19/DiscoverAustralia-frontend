/**
 * squadService.js
 *
 * Manages ephemeral squad data — squads only live for 2-3 hrs, which is
 * fundamentally different from static profiles and is where the real-time
 * social value (and monetisation surface) lies.
 *
 * Architecture note: no WebSocket yet. We simulate "real-time" by:
 *   1. Adding ±1 random jitter to memberCount on every poll
 *   2. Giving each squad an expiresAt so stale squads self-remove
 *
 * Flip MOCK_MODE = false and wire BASE_URL to swap in your live backend.
 */

import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const BASE_URL  = CONFIG.API_URL || 'http://10.0.2.2:8000';
const MOCK_MODE = true;
const MOCK_DELAY = 600;

// ─── Mock dataset ─────────────────────────────────────────────────────────────
// memberAvatars uses initials + color — no image URLs needed for overlapping circles.

const BASE_SQUADS = [
  {
    id:            'sq-1',
    title:         'Bondi Beach Day',
    spotName:      'Bondi Beach',
    subtitle:      'Sunday beach day — all welcome!',
    spotsLeft:     5,
    memberCount:   15,
    memberAvatars: [
      { initials: 'LW', color: '#EF4444' },
      { initials: 'AM', color: '#8B5CF6' },
      { initials: 'KC', color: '#3B82F6' },
    ],
    eta:       '20 min',
    startsIn:  'Today',
    day:       'Today',
    time:      '4:30 PM',
    category:  'Aussie Classics',
    tagColor:  '#0D9488',
    expiresAt: Date.now() + 3 * 60 * 60 * 1000, // 3 hrs
    coords:    { latitude: -33.8915, longitude: 151.2767 },
  },
  {
    id:            'sq-2',
    title:         'Chinatown Food Tour',
    spotName:      'Chinatown',
    subtitle:      'Best dumplings & bubble tea near Haymarket',
    spotsLeft:     3,
    memberCount:   8,
    memberAvatars: [
      { initials: 'JR', color: '#10B981' },
      { initials: 'SP', color: '#F97316' },
      { initials: 'TN', color: '#EC4899' },
    ],
    eta:       '35 min',
    startsIn:  'Tonight',
    day:       'Tonight',
    time:      '6:30 PM',
    category:  'Bored & Broke',
    tagColor:  '#D97706',
    expiresAt: Date.now() + 5 * 60 * 60 * 1000,
    coords:    { latitude: -33.8796, longitude: 151.2010 },
  },
  {
    id:            'sq-3',
    title:         'Botanic Garden Picnic',
    spotName:      'Royal Botanic Garden',
    subtitle:      'Bring snacks, blankets & good vibes!',
    spotsLeft:     10,
    memberCount:   20,
    memberAvatars: [
      { initials: 'MO', color: '#14B8A6' },
      { initials: 'AK', color: '#A855F7' },
      { initials: 'RB', color: '#F43F5E' },
    ],
    eta:       '45 min',
    startsIn:  'Saturday',
    day:       'Saturday',
    time:      '12:00 PM',
    category:  'Study Break',
    tagColor:  '#0EA5E9',
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    coords:    { latitude: -33.8642, longitude: 151.2166 },
  },
  {
    id:            'sq-4',
    title:         'Manly Ferry & Swim',
    spotName:      'Manly Beach',
    subtitle:      'Ferry ride + morning swim session',
    spotsLeft:     7,
    memberCount:   11,
    memberAvatars: [
      { initials: 'DL', color: '#6366F1' },
      { initials: 'YC', color: '#F59E0B' },
      { initials: 'BT', color: '#22D3EE' },
    ],
    eta:       '55 min',
    startsIn:  'Tomorrow',
    day:       'Tomorrow',
    time:      '8:00 AM',
    category:  'Beach Vibes',
    tagColor:  '#0284C7',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    coords:    { latitude: -33.7969, longitude: 151.2876 },
  },
];

// ─── Jitter: simulates members joining between polls ─────────────────────────

function applyJitter(squads) {
  return squads
    .filter(s => s.expiresAt > Date.now())
    .map(s => ({
      ...s,
      memberCount: Math.max(2, s.memberCount + Math.floor(Math.random() * 3) - 1),
      spotsLeft:   Math.max(0, s.spotsLeft   + Math.floor(Math.random() * 2) - 1),
    }));
}

// ─── Distance sort ────────────────────────────────────────────────────────────

function haversineKm(a, b) {
  if (!a || !b) return 999;
  const R    = 6371;
  const dLat = ((b.latitude  - a.latitude)  * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude  * Math.PI) / 180) *
    Math.cos((b.latitude  * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// ─── Mock implementations ─────────────────────────────────────────────────────

async function mockFetchNearbySquads(coords) {
  await new Promise(r => setTimeout(r, MOCK_DELAY));
  const jittered = applyJitter(BASE_SQUADS);
  if (!coords) return jittered;
  return [...jittered].sort(
    (a, b) => haversineKm(coords, a.coords) - haversineKm(coords, b.coords)
  );
}

async function mockJoinSquad(squadId, userId) {
  await new Promise(r => setTimeout(r, 300));
  console.log(`[squadService] user ${userId} joined squad ${squadId}`);
  return { success: true };
}

async function mockCreateSquad(spotId, userId) {
  await new Promise(r => setTimeout(r, 500));
  const newSquad = {
    id:            `sq-custom-${Date.now()}`,
    title:         'My Squad',
    spotName:      spotId ?? 'Custom Spot',
    subtitle:      'Just started — join us!',
    spotsLeft:     9,
    memberCount:   1,
    memberAvatars: [{ initials: 'ME', color: '#2DD4BF' }],
    eta:           'Now',
    startsIn:      'Now',
    day:           'Today',
    time:          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    category:      'Squad Up',
    tagColor:      '#2DD4BF',
    expiresAt:     Date.now() + 3 * 60 * 60 * 1000,
    coords:        null,
  };
  console.log('[squadService] created squad:', newSquad.id);
  return newSquad;
}

// ─── Real implementations ─────────────────────────────────────────────────────

async function realFetchNearbySquads(coords) {
  const params = new URLSearchParams({
    latitude:  coords?.latitude  ?? -33.8688,
    longitude: coords?.longitude ?? 151.2093,
    radius_km: 15,
  });
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  const res  = await fetch(`${BASE_URL}/api/v1/squads/nearby?${params}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Failed to load squads');
  return data.squads;
}

async function realJoinSquad(squadId, userId) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  const res  = await fetch(`${BASE_URL}/api/v1/squads/${squadId}/join`, {
    method:  'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body:    JSON.stringify({ user_id: userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Failed to join squad');
  return data;
}

async function realCreateSquad(spotId, userId) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  const res  = await fetch(`${BASE_URL}/api/v1/squads`, {
    method:  'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body:    JSON.stringify({ spot_id: spotId, creator_id: userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Failed to create squad');
  return data.squad;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const squadService = {
  fetchNearbySquads: MOCK_MODE ? mockFetchNearbySquads : realFetchNearbySquads,
  joinSquad:         MOCK_MODE ? mockJoinSquad         : realJoinSquad,
  createSquad:       MOCK_MODE ? mockCreateSquad       : realCreateSquad,
};
