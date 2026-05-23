import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = CONFIG.API_URL || 'http://192.168.1.104:8080';
const MOCK_MODE = false;

console.log('SquadService BASE_URL:', BASE_URL);

// ─── Mock implementations ─────────────────────────────────────────────────────

async function mockFetchNearbySquads(coords) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    {
      id: 'squad-1',
      eventId: 'evt-001',
      title: 'Coffee & Code Session',
      category: 'Tech',
      tagColor: '#3B82F6',
      day: 'Today',
      time: '2:00 PM',
      memberUserIds: ['user1', 'user2', 'user3'],
      memberCount: 3,
      spotName: 'Starbucks George Street',
      eta: '5 min',
      memberAvatars: [
        { initials: 'U1', color: '#3B82F6' },
        { initials: 'U2', color: '#EF4444' },
        { initials: 'U3', color: '#10B981' }
      ],
      icebreaker: {
        promptText: 'What\'s your favorite programming language?'
      }
    },
    {
      id: 'squad-2',
      eventId: 'evt-002',
      title: 'Sunset Beach Walk',
      category: 'Outdoor',
      tagColor: '#F59E0B',
      day: 'Today',
      time: '5:30 PM',
      memberUserIds: ['user4', 'user5'],
      memberCount: 2,
      spotName: 'Bondi Beach',
      eta: '15 min',
      memberAvatars: [
        { initials: 'U4', color: '#8B5CF6' },
        { initials: 'U5', color: '#EC4899' }
      ],
      icebreaker: null
    },
    {
      id: 'squad-3',
      eventId: 'evt-003',
      title: 'Study Group - USYD Library',
      category: 'Study',
      tagColor: '#10B981',
      day: 'Tomorrow',
      time: '10:00 AM',
      memberUserIds: ['user6', 'user7', 'user8', 'user9'],
      memberCount: 4,
      spotName: 'Fisher Library USYD',
      eta: '20 min',
      memberAvatars: [
        { initials: 'U6', color: '#14B8A6' },
        { initials: 'U7', color: '#F97316' },
        { initials: 'U8', color: '#6366F1' }
      ],
      icebreaker: {
        promptText: 'Which subject are you studying?'
      }
    }
  ];
}

async function mockJoinSquad(eventId, userId, interests = []) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    newlyCreated: false,
    squad: {
      id: `squad-${eventId}`,
      eventId,
      memberUserIds: ['user1', 'user2', userId],
      icebreaker: {
        promptText: 'Welcome! Introduce yourself to the squad.'
      }
    }
  };
}

async function mockCreateSquad(eventId, userId, interests = []) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    newlyCreated: true,
    squad: {
      id: `squad-${eventId}`,
      eventId,
      memberUserIds: [userId],
      icebreaker: null
    }
  };
}

async function mockCreateSquadWithDetails(squadData) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    squad: {
      ...squadData,
      memberAvatars: [{ initials: 'ME', color: '#3B82F6' }],
    }
  };
}

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

/**
 * Create a new squad with custom details
 * Matches Java: POST /api/squad/create
 * @param {Object} squadData - Squad creation data
 * @param {string} squadData.name - Squad name (required)
 * @param {string} squadData.subtitle - Squad subtitle (required)
 * @param {boolean} squadData.alive - Squad status (default: true)
 * @param {string[]} squadData.numbers - User emails (auto-populated from JWT)
 * @param {string[]} squadData.tags - Tag IDs (at least one required)
 * @param {string[]} squadData.activities - Activity IDs (at least one required)
 */
async function realCreateSquad(squadData) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  const url = `${BASE_URL}/api/squad/create`;
  console.log('=== Create Squad API Request ===');
  console.log('Request URL:', url);
  console.log('Request Method: POST');
  console.log('Request Headers:', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token ? '***' + token.slice(-10) : 'MISSING'}`
  });
  console.log('Request Body:', JSON.stringify(squadData, null, 2));
  console.log('================================');
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(squadData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create squad');
  return data;
}

/**
 * Fetch all squads
 * Matches Java: GET /api/squad/all
 */
async function realFetchAllSquads() {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  const url = `${BASE_URL}/api/squad/all`;
  console.log('=== Fetch All Squads API Request ===');
  console.log('Request URL:', url);
  console.log('Request Method: GET');
  console.log('================================');
  
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch all squads');
  return data;
}

/**
 * Fetch squad details
 * Matches Java: POST /api/squad/detail
 * @param {string} squadId - The ID of the squad
 */
async function realFetchSquadDetail(squadId) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  const url = `${BASE_URL}/api/squad/detail`;
  console.log('=== Fetch Squad Detail API Request ===');
  console.log('Request URL:', url);
  console.log('Request Method: POST');
  console.log('Request Body:', JSON.stringify({ squadId }, null, 2));
  console.log('================================');
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ squadId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch squad detail');
  return data;
}

/**
 * Get a random squad that user hasn't joined yet
 * Uses the same API as Squads page: GET /api/squad/all
 * @returns {Object|null} A random squad object or null if none available
 */
async function getRandomUnjoinedSquad() {
  try {
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    
    const url = `${BASE_URL}/api/squad/all`;
    console.log('=== Get Random Unjoined Squad API Request ===');
    console.log('Request URL:', url);
    console.log('Request Method: GET');
    console.log('================================');
    
    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });

    const allSquads = await res.json();
    if (!res.ok) throw new Error(allSquads.message ?? 'Failed to fetch squads');
    
    // Filter out squads where user is already a member
    // Note: We'll need user email from the calling context to filter properly
    // For now, return all active squads and let the UI layer handle filtering
    const activeSquads = allSquads.filter(squad => squad.alive === true);
    
    if (activeSquads.length === 0) {
      return null;
    }
    
    // Randomly select one squad
    const randomIndex = Math.floor(Math.random() * activeSquads.length);
    return activeSquads[randomIndex];
  } catch (error) {
    console.error('Failed to get random unjoined squad:', error);
    throw error;
  }
}

/**
 * Join a squad
 * Matches Java: POST /api/squad/join
 * Automatically validates user identity from JWT token and adds email to participants list
 * @param {string} squadId - The ID of the squad to join
 */
async function realJoinVibe(squadId) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  console.log('=== Join Squad API Request ===');
  console.log('Squad ID:', squadId);
  console.log('JWT Token:', token ? '***' + token.slice(-10) : 'MISSING');
  
  const url = `${BASE_URL}/api/squad/join`;
  console.log('Request URL:', url);
  console.log('Request Method: POST');
  
  const requestBody = { squadId };
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('================================');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response Status:', res.status);
    console.log('Response OK:', res.ok);
    
    const data = await res.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      console.error('API Error Response:', data);
      throw new Error(data.message ?? 'Failed to join squad');
    }
    
    console.log('Successfully joined squad!');
    return data;
  } catch (error) {
    console.error('=== Join Squad API Error ===');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('================================');
    throw error;
  }
}

/**
 * Send a chat message to squad
 * Matches Java: POST /api/squad/chat
 * @param {string} squadId - The ID of the squad
 * @param {string} message - The message content
 */
async function realSendChatMessage(squadId, message) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  const url = `${BASE_URL}/api/squad/chat`;
  console.log('=== Send Chat Message API Request ===');
  console.log('Request URL:', url);
  console.log('Request Method: POST');
  console.log('Request Body:', JSON.stringify({ squadId, message }, null, 2));
  console.log('================================');
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ squadId, message }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to send message');
  return data;
}

/**
 * Fetch chat history for a squad
 * Matches Java: POST /api/squad/chat/list
 * Returns all chat messages for the squad, sorted by creation time (ascending)
 * @param {string} squadId - The ID of the squad
 * @returns {Array} List of SquadChat objects sorted by createdAt (oldest first)
 */
async function realFetchSquadChatHistory(squadId) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  const url = `${BASE_URL}/api/squad/chat/list`;
  console.log('=== Fetch Squad Chat History API Request ===');
  console.log('Request URL:', url);
  console.log('Request Method: POST');
  console.log('Request Body:', JSON.stringify({ squadId }, null, 2));
  console.log('================================');
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ squadId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch chat history');
  
  // Ensure messages are sorted by creation time (ascending - oldest first)
  const messages = Array.isArray(data) ? data : data.messages || [];
  return messages.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeA - timeB;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const squadService = {
  fetchNearbySquads: MOCK_MODE ? mockFetchNearbySquads : realFetchNearbySquads,
  
  // Both actions now route through our unified Spring Boot Upsert logic
  joinSquad:   MOCK_MODE ? mockJoinSquad   : realJoinOrCreateSquad,
  createSquad: MOCK_MODE ? mockCreateSquad : realJoinOrCreateSquad,
  
  // New detailed squad creation with form data
  createSquadWithDetails: MOCK_MODE ? mockCreateSquadWithDetails : realCreateSquad,
  
  // Fetch all squads
  fetchAllSquads: realFetchAllSquads,
  
  // Fetch squad detail
  fetchSquadDetail: realFetchSquadDetail,
  
  // Join a vibe/activity
  joinVibe: realJoinVibe,
  
  // Get a random unjoined squad for home page
  getRandomUnjoinedSquad: getRandomUnjoinedSquad,
  
  // Send chat message
  sendChatMessage: realSendChatMessage,
  
  // Fetch chat history for a squad
  fetchSquadChatHistory: realFetchSquadChatHistory,
};