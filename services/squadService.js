// ─── Real implementations (Aligned to Spring Boot Backend) ──────────────

async function realFetchNearbySquads(coords) {
  // Note: Assuming you have a standard GET /api/squads/nearby endpoint in Java
  // If you haven't built this in Java yet, keep it pointing to your Python service or mock it!
  const params = new URLSearchParams({
    latitude:  coords?.latitude  ?? -33.8688,
    longitude: coords?.longitude ?? 151.2093,
    radius_km: 15,
  });
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  const res  = await fetch(`${BASE_URL}/api/squads/nearby?${params}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to load squads');
  return data.squads;
}

/**
 * Unified Join/Create Function
 * Matches Java: POST /api/squads/join
 * @param {string} eventId - The UUID of the event/spot
 * @param {string} userId - The current user's ID
 * @param {string[]} interests - Array of user interests (e.g., ["techno", "coffee"])
 */
async function realJoinOrCreateSquad(eventId, userId, interests = []) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  const payload = {
    eventId: eventId,
    userId: userId,
    memberInterests: interests // CRITICAL: Required for Aura Brain AI
  };

  const res = await fetch(`${BASE_URL}/api/squads/join`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to join/create squad');
  
  // Returns { newlyCreated: boolean, squad: { id, eventId, memberUserIds, icebreaker... } }
  return data; 
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const squadService = {
  fetchNearbySquads: MOCK_MODE ? mockFetchNearbySquads : realFetchNearbySquads,
  
  // Both actions now route through our unified Spring Boot Upsert logic
  joinSquad:   MOCK_MODE ? mockJoinSquad   : realJoinOrCreateSquad,
  createSquad: MOCK_MODE ? mockCreateSquad : realJoinOrCreateSquad,
};