export const STUDY_BREAK_LOCATIONS = [
  {
    id: 'fisher-library',
    name: 'Fisher Library',
    category: 'Library',
    address: 'Eastern Ave, Camperdown NSW 2006',
    distance: '0.1km',
    rating: 4.6,
    hours: 'Open · Closes 10 PM',
    tags: ['Quiet', 'Study', 'Free WiFi', 'Air-conditioned'],
    urgency: 'Low',
    urgencyLabel: 'Scheduled',
    costEstimate: 'Free',
    costDetail: 'No cost · USYD student access',
    aiMatch: 94,
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80',
    aiSummary:
      '"Study Break" vibe detected from low sleep data. Fisher Library offers a calm, structured environment ideal for light cognitive restoration without physical strain.',
  },
  {
    id: 'victoria-park-cafe',
    name: 'Victoria Park Café',
    category: 'Café · Study',
    address: 'Parramatta Rd, Camperdown NSW 2050',
    distance: '0.4km',
    rating: 4.4,
    hours: 'Open · Closes 5 PM',
    tags: ['Outdoor', 'Café', 'WiFi', 'Low noise'],
    urgency: 'Low',
    urgencyLabel: 'Preventive',
    costEstimate: '$4–8',
    costDetail: 'Coffee or snack · Student discount available',
    aiMatch: 87,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    aiSummary:
      'A short walk for fresh air combined with a café environment boosts alertness without raising cortisol — ideal for low-sleep days.',
  },
  {
    id: 'usyd-gardens',
    name: 'USYD Eastern Ave Gardens',
    category: 'Park · Nature',
    address: 'Eastern Ave, University of Sydney',
    distance: '0.2km',
    rating: 4.7,
    hours: 'Open 24 hrs',
    tags: ['Nature', 'Walk', 'Free', 'Quiet'],
    urgency: 'Low',
    urgencyLabel: 'Scheduled',
    costEstimate: 'Free',
    costDetail: 'No cost · Public access',
    aiMatch: 82,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    aiSummary:
      'Outdoor green spaces reduce cortisol by ~21% in 20-minute exposures. Low physical demand matches your current step count profile.',
  },
];

export function getTopMatch() {
  return STUDY_BREAK_LOCATIONS[0];
}

export function getLocationById(id) {
  return STUDY_BREAK_LOCATIONS.find((l) => l.id === id) ?? null;
}

// ─── GPS & Geocoding ──────────────────────────────────────────────────────────

import * as ExpoLocation from 'expo-location';

/**
 * Request foreground location permission.
 * Returns the PermissionStatus string: 'granted' | 'denied' | 'undetermined'
 */
export async function requestForegroundPermission() {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  return status;
}

/**
 * Check current permission state without triggering a prompt.
 */
export async function getPermissionStatus() {
  const { status } = await ExpoLocation.getForegroundPermissionsAsync();
  return status;
}

/**
 * Fetch the device's current GPS coordinates with high accuracy.
 * Caller should have already ensured permission is 'granted'.
 * Returns { latitude, longitude, accuracy }.
 */
export async function getCurrentLocation() {
  const location = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.Balanced,
    // Balanced: ~30 m accuracy, significantly less battery than High
    timeInterval: 5000,
  });
  return {
    latitude:  location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy:  location.coords.accuracy,
  };
}

/**
 * Reverse-geocode a lat/lon into human-readable place info.
 * Returns { city, suburb, region } where available.
 */
export async function reverseGeocode({ latitude, longitude }) {
  const results = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
  if (!results.length) return { city: 'Sydney', suburb: null, region: 'NSW' };
  const r = results[0];
  return {
    city:   r.city   ?? r.subregion ?? 'Sydney',
    suburb: r.district ?? r.subregion ?? null,
    region: r.region ?? 'NSW',
  };
}

// ─── Weather ──────────────────────────────────────────────────────────────────

// WMO weather interpretation codes → emoji
// Open-Meteo docs: https://open-meteo.com/en/docs#weathervariables
function weatherEmoji(code) {
  if (code === 0)                           return '☀️';
  if (code <= 3)                            return '⛅';
  if (code === 45 || code === 48)           return '🌫️';
  if (code >= 51  && code <= 67)            return '🌦️';
  if (code >= 71  && code <= 77)            return '❄️';
  if (code >= 80  && code <= 82)            return '🌧️';
  if (code >= 95)                           return '⛈️';
  return '🌤️';
}

/**
 * Fetch current temperature from Open-Meteo (free, no API key required).
 * Returns { temperature: number, emoji: string } or null on failure.
 */
export async function fetchWeather({ latitude, longitude }) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
      `&current_weather=true&temperature_unit=celsius`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const cw   = data.current_weather;
    return {
      temperature: Math.round(cw.temperature),
      emoji:       weatherEmoji(cw.weathercode),
    };
  } catch {
    return null;
  }
}

// ─── Backend location sync ────────────────────────────────────────────────────

const BASE_URL   = 'http://10.0.2.2:8000';
const MOCK_SYNC  = true;

/**
 * Push the user's current coordinates to the backend so Squad-Up can find
 * nearby students. Silently no-ops on failure (best-effort telemetry).
 */
export async function syncUserLocationToBackend(coords, userId = 'current') {
  if (MOCK_SYNC) {
    // Simulate a 300 ms round-trip without hitting a real server
    await new Promise(r => setTimeout(r, 300));
    console.log('[LocationService] synced coords (mock):', coords);
    return { success: true };
  }
  try {
    const res = await fetch(`${BASE_URL}/api/v1/users/location`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        user_id:   userId,
        latitude:  coords.latitude,
        longitude: coords.longitude,
      }),
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}
