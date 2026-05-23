/**
 * discoveryService.js
 *
 * Bridges vibe selection with geospatial POI data.
 * Mock mode returns curated Sydney spots immediately so the UI works today.
 * Flip MOCK_MODE = false and wire BASE_URL to your City of Sydney crawler.
 *
 * Spot shape:
 *   { id, name, address, rating, distanceKm, imageURL,
 *     isFree, badge, badgeColor, category, coords }
 */
import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const BASE_URL  = CONFIG.API_URL || 'http://10.0.2.2:8000';
const MOCK_MODE = true;
const MOCK_DELAY = 800; // ms — realistic network feel

// ─── Mock dataset ─────────────────────────────────────────────────────────────
// Real coords used so the Maps deep-link actually navigates somewhere useful.

const MOCK_SPOTS = {

  'bored-broke': [
    {
      id: 'bb-1',
      name: 'Hyde Park',
      address: 'Elizabeth St, Sydney CBD',
      rating: 4.8,
      distanceKm: 1.2,
      imageURL: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Park',
      coords: { latitude: -33.8731, longitude: 151.2111 },
    },
    {
      id: 'bb-2',
      name: 'Paddy\'s Markets',
      address: '9-13 Hay St, Haymarket',
      rating: 4.3,
      distanceKm: 2.1,
      imageURL: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=500&q=80',
      isFree: true,
      badge: 'FREE ENTRY',
      badgeColor: '#10B981',
      category: 'Markets',
      coords: { latitude: -33.8796, longitude: 151.2010 },
    },
    {
      id: 'bb-3',
      name: 'Circular Quay Waterfront',
      address: 'Circular Quay, Sydney',
      rating: 4.7,
      distanceKm: 3.4,
      imageURL: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80',
      isFree: true,
      badge: 'TRENDING',
      badgeColor: '#F59E0B',
      category: 'Waterfront',
      coords: { latitude: -33.8609, longitude: 151.2108 },
    },
    {
      id: 'bb-4',
      name: 'Domain Art Gallery',
      address: 'Art Gallery Rd, The Domain',
      rating: 4.6,
      distanceKm: 1.8,
      imageURL: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Art & Culture',
      coords: { latitude: -33.8688, longitude: 151.2172 },
    },
  ],

  'study-break': [
    {
      id: 'sb-1',
      name: 'Fisher Library',
      address: 'Eastern Ave, Camperdown',
      rating: 4.6,
      distanceKm: 0.1,
      imageURL: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500&q=80',
      isFree: true,
      badge: 'QUIET',
      badgeColor: '#3B82F6',
      category: 'Library',
      coords: { latitude: -33.8882, longitude: 151.1878 },
    },
    {
      id: 'sb-2',
      name: 'Victoria Park Café',
      address: 'Parramatta Rd, Camperdown',
      rating: 4.4,
      distanceKm: 0.4,
      imageURL: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80',
      isFree: false,
      badge: 'WIFI',
      badgeColor: '#8B5CF6',
      category: 'Café',
      coords: { latitude: -33.8878, longitude: 151.1943 },
    },
    {
      id: 'sb-3',
      name: 'The Grounds of Alexandria',
      address: '7A, 2 Huntley St, Alexandria',
      rating: 4.7,
      distanceKm: 3.8,
      imageURL: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80',
      isFree: false,
      badge: 'TRENDING',
      badgeColor: '#F59E0B',
      category: 'Café',
      coords: { latitude: -33.9148, longitude: 151.1940 },
    },
    {
      id: 'sb-4',
      name: 'State Library of NSW',
      address: 'Macquarie St, Sydney CBD',
      rating: 4.8,
      distanceKm: 2.9,
      imageURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Library',
      coords: { latitude: -33.8688, longitude: 151.2127 },
    },
  ],

  'aussie-classics': [
    {
      id: 'ac-1',
      name: 'Bondi to Coogee Walk',
      address: 'Bondi Beach, Eastern Suburbs',
      rating: 5.0,
      distanceKm: 4.1,
      imageURL: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Coastal Walk',
      coords: { latitude: -33.8915, longitude: 151.2767 },
    },
    {
      id: 'ac-2',
      name: 'Opera House Walk',
      address: 'Bennelong Point, Sydney CBD',
      rating: 4.9,
      distanceKm: 3.5,
      imageURL: 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=500&q=80',
      isFree: true,
      badge: 'ICONIC',
      badgeColor: '#F59E0B',
      category: 'Landmark',
      coords: { latitude: -33.8568, longitude: 151.2153 },
    },
    {
      id: 'ac-3',
      name: 'Taronga Zoo',
      address: 'Bradleys Head Rd, Mosman',
      rating: 4.7,
      distanceKm: 6.2,
      imageURL: 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=500&q=80',
      isFree: false,
      badge: 'MUST DO',
      badgeColor: '#EF4444',
      category: 'Zoo',
      coords: { latitude: -33.8434, longitude: 151.2413 },
    },
    {
      id: 'ac-4',
      name: 'Chinatown Food Tour',
      address: 'Dixon St, Haymarket',
      rating: 4.8,
      distanceKm: 2.2,
      imageURL: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=500&q=80',
      isFree: false,
      badge: 'TODAY',
      badgeColor: '#F59E0B',
      category: 'Food & Culture',
      coords: { latitude: -33.8796, longitude: 151.2010 },
    },
  ],

  'night-out': [
    {
      id: 'no-1',
      name: 'Barangaroo Reserve',
      address: 'Barangaroo Ave, Sydney',
      rating: 4.6,
      distanceKm: 2.8,
      imageURL: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=500&q=80',
      isFree: true,
      badge: 'TONIGHT',
      badgeColor: '#8B5CF6',
      category: 'Rooftop',
      coords: { latitude: -33.8606, longitude: 151.2009 },
    },
    {
      id: 'no-2',
      name: 'The Rocks Night Markets',
      address: 'George St, The Rocks',
      rating: 4.5,
      distanceKm: 3.6,
      imageURL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80',
      isFree: true,
      badge: 'LIVE MUSIC',
      badgeColor: '#EC4899',
      category: 'Night Market',
      coords: { latitude: -33.8599, longitude: 151.2089 },
    },
    {
      id: 'no-3',
      name: 'Oxford Street Strip',
      address: 'Oxford St, Darlinghurst',
      rating: 4.3,
      distanceKm: 1.5,
      imageURL: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=500&q=80',
      isFree: false,
      badge: 'TRENDING',
      badgeColor: '#F59E0B',
      category: 'Nightlife',
      coords: { latitude: -33.8823, longitude: 151.2196 },
    },
    {
      id: 'no-4',
      name: 'Shady Pines Saloon',
      address: '256 Crown St, Darlinghurst',
      rating: 4.4,
      distanceKm: 1.9,
      imageURL: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=500&q=80',
      isFree: false,
      badge: 'HOT SPOT',
      badgeColor: '#EF4444',
      category: 'Bar',
      coords: { latitude: -33.8790, longitude: 151.2171 },
    },
  ],

  'beach-vibes': [
    {
      id: 'bv-1',
      name: 'Bondi Beach',
      address: 'Queen Elizabeth Dr, Bondi',
      rating: 4.9,
      distanceKm: 7.2,
      imageURL: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Beach',
      coords: { latitude: -33.8915, longitude: 151.2767 },
    },
    {
      id: 'bv-2',
      name: 'Manly Beach',
      address: 'South Steyne, Manly',
      rating: 4.8,
      distanceKm: 14.3,
      imageURL: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
      isFree: true,
      badge: 'SURF',
      badgeColor: '#0EA5E9',
      category: 'Beach',
      coords: { latitude: -33.7969, longitude: 151.2876 },
    },
    {
      id: 'bv-3',
      name: 'Coogee Beach',
      address: 'Coogee Bay Rd, Coogee',
      rating: 4.7,
      distanceKm: 9.1,
      imageURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      isFree: true,
      badge: 'CALM WATER',
      badgeColor: '#06B6D4',
      category: 'Beach',
      coords: { latitude: -33.9209, longitude: 151.2563 },
    },
    {
      id: 'bv-4',
      name: 'Bronte Beach Baths',
      address: 'Bronte Rd, Bronte',
      rating: 4.6,
      distanceKm: 8.3,
      imageURL: 'https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Ocean Pool',
      coords: { latitude: -33.9043, longitude: 151.2685 },
    },
  ],

  'squad-up': [
    {
      id: 'su-1',
      name: 'Moore Park Courts',
      address: 'Anzac Parade, Moore Park',
      rating: 4.4,
      distanceKm: 2.6,
      imageURL: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80',
      isFree: true,
      badge: 'OPEN NOW',
      badgeColor: '#10B981',
      category: 'Sport',
      coords: { latitude: -33.8935, longitude: 151.2198 },
    },
    {
      id: 'su-2',
      name: 'Centennial Park',
      address: 'Grand Dr, Centennial Park',
      rating: 4.7,
      distanceKm: 3.9,
      imageURL: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
      isFree: true,
      badge: 'FREE',
      badgeColor: '#10B981',
      category: 'Park',
      coords: { latitude: -33.8953, longitude: 151.2342 },
    },
    {
      id: 'su-3',
      name: 'Tumbalong Park Skate',
      address: 'Darling Harbour, Sydney',
      rating: 4.3,
      distanceKm: 2.0,
      imageURL: 'https://images.unsplash.com/photo-1528392297517-e2e1a4f3d5be?w=500&q=80',
      isFree: true,
      badge: 'POPULAR',
      badgeColor: '#8B5CF6',
      category: 'Skate Park',
      coords: { latitude: -33.8737, longitude: 151.1993 },
    },
    {
      id: 'su-4',
      name: 'Newtown Social Club',
      address: '387 King St, Newtown',
      rating: 4.5,
      distanceKm: 3.3,
      imageURL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80',
      isFree: false,
      badge: 'EVENTS',
      badgeColor: '#F59E0B',
      category: 'Social',
      coords: { latitude: -33.8979, longitude: 151.1793 },
    },
  ],
};

// ─── Distance calculation ─────────────────────────────────────────────────────

function haversineKm(a, b) {
  if (!a || !b) return 0;
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

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ─── Mock implementation ──────────────────────────────────────────────────────

async function mockGetSpotsByVibe(vibeId, coords) {
  await new Promise(r => setTimeout(r, MOCK_DELAY));
  const spots = MOCK_SPOTS[vibeId] ?? MOCK_SPOTS['bored-broke'];

  // Recalculate real distances from the user's actual GPS position if available
  return spots.map(spot => {
    const realKm    = coords ? haversineKm(coords, spot.coords) : spot.distanceKm;
    return {
      ...spot,
      distanceKm:    parseFloat(realKm.toFixed(1)),
      distanceLabel: formatDistance(realKm),
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

// ─── Real implementation ──────────────────────────────────────────────────────

async function realGetSpotsByVibe(vibeId, coords) {
  const params = new URLSearchParams({
    vibe_id:   vibeId,
    latitude:  coords?.latitude  ?? -33.8688,
    longitude: coords?.longitude ?? 151.2093,
    radius_km: 10,
  });
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  const res  = await fetch(`${BASE_URL}/api/v1/spots?${params}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Failed to load spots');
  return data.spots.map(s => ({
    ...s,
    distanceLabel: formatDistance(s.distanceKm),
  }));
}

// ─── Get nearest places ──────────────────────────────────────────────────────

async function getNearestPlaces(coords) {
  try {
    const latitude = coords?.latitude ?? -33.8688;
    const longitude = coords?.longitude ?? 151.2093;
    
    console.log('[getNearestPlaces] Fetching with coords:', { latitude, longitude });
    console.log('[getNearestPlaces] BASE_URL:', BASE_URL);
    
    // Build query parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    
    const url = `${BASE_URL}/api/explore/nearest-places?${params.toString()}`;
    console.log('[getNearestPlaces] Request URL:', url);
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[getNearestPlaces] Token exists:', !!token);
    
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    console.log('[getNearestPlaces] Response status:', res.status);
    
    if (!res.ok) {
      // Try to get error details from response
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[getNearestPlaces] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[getNearestPlaces] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[getNearestPlaces] Received data:', data);
    
    // Transform API response to match the expected format
    return data.map(place => ({
      id: place.id,
      title: place.name,
      category: place.tag,
      rating: place.star,
      distance: `${place.distanceKm.toFixed(2)}km`,
      badge: place.tag,
      badgeColor: '#10B981', // Green for "Free" or other tags
      image: place.img,
    }));
  } catch (error) {
    console.error('[getNearestPlaces] Error:', error);
    throw error;
  }
}

// ─── Get recommended places ──────────────────────────────────────────────────

async function getRecommendedPlaces() {
  try {
    console.log('[getRecommendedPlaces] Fetching recommended places...');
    console.log('[getRecommendedPlaces] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/explore/recommended`;
    console.log('[getRecommendedPlaces] Request URL:', url);
    
    // No token required for this endpoint
    const res = await fetch(url);
    
    console.log('[getRecommendedPlaces] Response status:', res.status);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[getRecommendedPlaces] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[getRecommendedPlaces] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[getRecommendedPlaces] Received data count:', data.length);
    
    // Transform API response to match the expected format
    // Only need: image, tag (badge), rating
    const transformed = data.map(place => ({
      id: place.id || place.idString || Math.random().toString(),
      title: place.name,
      badge: place.tag,
      badgeColor: '#10B981', // Green for "Free" or other tags
      rating: place.star,
      image: place.img,
    }));
    
    // Remove duplicates based on id
    const uniquePlaces = [];
    const seenIds = new Set();
    for (const place of transformed) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        uniquePlaces.push(place);
      }
    }
    
    console.log('[getRecommendedPlaces] After deduplication:', uniquePlaces.length);
    return uniquePlaces;
  } catch (error) {
    console.error('[getRecommendedPlaces] Error:', error);
    throw error;
  }
}

// ─── Get activities within 200km ─────────────────────────────────────────────

async function getActivitiesWithin200km(coords) {
  try {
    console.log('[getActivitiesWithin200km] Fetching activities...');
    console.log('[getActivitiesWithin200km] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/explore/activities-within-200km`;
    console.log('[getActivitiesWithin200km] Request URL:', url);
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[getActivitiesWithin200km] Token exists:', !!token);
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[getActivitiesWithin200km] Response status:', res.status);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[getActivitiesWithin200km] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[getActivitiesWithin200km] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[getActivitiesWithin200km] Received data count:', data.length);
    
    // Transform API response to map marker format
    return data.map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      star: place.star,
      img: place.img,
    }));
  } catch (error) {
    console.error('[getActivitiesWithin200km] Error:', error);
    throw error;
  }
}

// ─── Search places by keyword ────────────────────────────────────────────────

async function searchPlaces(keyword) {
  try {
    console.log('[searchPlaces] Searching for:', keyword);
    console.log('[searchPlaces] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/explore/search`;
    console.log('[searchPlaces] Request URL:', url);
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[searchPlaces] Token exists:', !!token);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        keyword: keyword
      })
    });
    
    console.log('[searchPlaces] Response status:', res.status);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[searchPlaces] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[searchPlaces] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[searchPlaces] Received data count:', data.length);
    
    // Transform API response to match the expected format
    return data.map(place => ({
      id: place.id,
      title: place.name,
      category: place.tag,
      rating: place.star,
      distance: place.distanceKm ? `${place.distanceKm.toFixed(2)}km` : 'N/A',
      badge: place.tag,
      badgeColor: '#10B981', // Green for tags
      image: place.img,
      description: place.description,
      important_info: place.important_info,
      latitude: place.latitude,
      longitude: place.longitude,
    }));
  } catch (error) {
    console.error('[searchPlaces] Error:', error);
    throw error;
  }
}

// ─── Search activities by keyword ────────────────────────────────────────────

async function searchActivities(keyword) {
  try {
    console.log('[searchActivities] Searching for:', keyword);
    console.log('[searchActivities] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/vibes/search`;
    console.log('[searchActivities] Request URL:', url);
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[searchActivities] Token exists:', !!token);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        keyword: keyword
      })
    });
    
    console.log('[searchActivities] Response status:', res.status);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[searchActivities] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[searchActivities] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[searchActivities] Received data count:', data.length);
    
    return data;
  } catch (error) {
    console.error('[searchActivities] Error:', error);
    throw error;
  }
}

// ─── Get free places ─────────────────────────────────────────────────────────

async function getFreePlaces() {
  try {
    console.log('[getFreePlaces] Fetching free places...');
    console.log('[getFreePlaces] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/home/free-places`;
    console.log('[getFreePlaces] Request URL:', url);
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[getFreePlaces] Token exists:', !!token);
    
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    console.log('[getFreePlaces] Response status:', res.status);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[getFreePlaces] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[getFreePlaces] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[getFreePlaces] Received data count:', data.length);
    
    // Transform API response to match the expected format
    return data.map(place => ({
      id: place.id,
      title: place.name,
      category: place.tag,
      rating: place.star,
      distance: place.distanceKm ? `${place.distanceKm.toFixed(2)}km` : 'N/A',
      badge: place.tag,
      badgeColor: '#10B981', // Green for "Free" or other tags
      image: place.img,
      description: place.description,
      important_info: place.important_info,
      latitude: place.latitude,
      longitude: place.longitude,
    }));
  } catch (error) {
    console.error('[getFreePlaces] Error:', error);
    throw error;
  }
}

// ─── Get place detail by ID ───────────────────────────────────────────────────

async function getPlaceDetail(placeId) {
  try {
    console.log('[getPlaceDetail] ========== START ==========');
    console.log('[getPlaceDetail] Input placeId:', placeId);
    console.log('[getPlaceDetail] placeId type:', typeof placeId);
    console.log('[getPlaceDetail] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/explore/place-detail`;
    console.log('[getPlaceDetail] Request URL:', url);
    console.log('[getPlaceDetail] Request method: POST');
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[getPlaceDetail] Token exists:', !!token);
    console.log('[getPlaceDetail] Token length:', token ? token.length : 0);
    if (token) {
      console.log('[getPlaceDetail] Token preview:', token.substring(0, 20) + '...');
    }
    
    // Build request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
    };
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('[getPlaceDetail] Request headers:', JSON.stringify(requestHeaders, null, 2));
    
    // Build request body
    const requestBody = {
      placeId: placeId
    };
    console.log('[getPlaceDetail] Request body:', JSON.stringify(requestBody));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    });
    
    console.log('[getPlaceDetail] Response status:', res.status);
    console.log('[getPlaceDetail] Response OK:', res.ok);
    console.log('[getPlaceDetail] Response headers:', res.headers);
    
    // Try to read response text first for better error debugging
    const responseText = await res.text();
    console.log('[getPlaceDetail] Response text:', responseText);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = JSON.parse(responseText);
        console.error('[getPlaceDetail] Error response parsed:', errorData);
        errorDetail = errorData.detail || errorData.message || errorData.error || errorDetail;
        console.error('[getPlaceDetail] Error detail:', errorDetail);
      } catch (e) {
        console.error('[getPlaceDetail] Could not parse error response as JSON');
        console.error('[getPlaceDetail] Parse error:', e.message);
      }
      throw new Error(errorDetail);
    }
    
    const data = JSON.parse(responseText);
    console.log('[getPlaceDetail] Received data:', data);
    console.log('[getPlaceDetail] ========== END SUCCESS ==========');
    
    return data;
  } catch (error) {
    console.error('[getPlaceDetail] ========== ERROR ==========');
    console.error('[getPlaceDetail] Error name:', error.name);
    console.error('[getPlaceDetail] Error message:', error.message);
    console.error('[getPlaceDetail] Error stack:', error.stack);
    console.error('[getPlaceDetail] ========== END ERROR ==========');
    throw error;
  }
}

// ─── Get hot activity for home page ──────────────────────────────────────────

async function getHotActivity() {
  try {
    console.log('[getHotActivity] Fetching hot activity...');
    console.log('[getHotActivity] BASE_URL:', BASE_URL);
    
    const url = `${BASE_URL}/api/home/hot-activity`;
    console.log('[getHotActivity] Request URL:', url);
    
    // Get JWT token for authentication
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    console.log('[getHotActivity] Token exists:', !!token);
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[getHotActivity] Response status:', res.status);
    
    if (!res.ok) {
      let errorDetail = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        console.error('[getHotActivity] Error response:', errorData);
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        console.error('[getHotActivity] Could not parse error response');
      }
      throw new Error(errorDetail);
    }
    
    const data = await res.json();
    console.log('[getHotActivity] Received data:', data);
    
    return data;
  } catch (error) {
    console.error('[getHotActivity] Error:', error);
    throw error;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const discoveryService = {
  getSpotsByVibe: MOCK_MODE ? mockGetSpotsByVibe : realGetSpotsByVibe,
  getNearestPlaces,
  getRecommendedPlaces,
  getActivitiesWithin200km,
  searchPlaces,
  searchActivities,
  getFreePlaces,
  getPlaceDetail,
  getHotActivity,
};
