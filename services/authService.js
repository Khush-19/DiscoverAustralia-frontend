/**
 * authService.js
 *
 * Thin wrapper around auth API calls. Mock responses are active now so the UI
 * works immediately. To go live, replace MOCK_MODE with real fetch calls to
 * your backend and remove the artificial delay.
 *
 * Contract every function must satisfy:
 *   resolve → { token: string, user: { id, email, displayName } }
 *   reject  → Error with a human-readable .message for the UI to display
 */

const BASE_URL   = 'http://10.0.2.2:8000'; // same pattern as AuraAPI.js
const MOCK_MODE  = true;                    // flip to false when backend is ready
const MOCK_DELAY = 1200;                    // ms — simulates real network latency

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockToken(email) {
  // Not a real JWT — just a plausible-looking string for UI testing
  const payload = btoa(JSON.stringify({ sub: email, iat: Date.now() }));
  return `mock.${payload}.signature`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Mock implementations ─────────────────────────────────────────────────────

async function mockLogin(email, password) {
  await sleep(MOCK_DELAY);

  // Simulate wrong-password error so you can test the error UI
  if (password === 'wrong') {
    throw new Error('Invalid email or password. Please try again.');
  }

  return {
    token: mockToken(email),
    user: {
      id:          'usr_mock_001',
      email,
      displayName: email.split('@')[0],
    },
  };
}

async function mockRegister(email, password, displayName) {
  await sleep(MOCK_DELAY);

  // Simulate duplicate-account error
  if (email === 'taken@test.com') {
    throw new Error('An account with this email already exists.');
  }

  return {
    token: mockToken(email),
    user: {
      id:          'usr_mock_' + Math.random().toString(36).slice(2, 9),
      email,
      displayName: displayName.trim(),
    },
  };
}

// ─── Real implementations (used when MOCK_MODE = false) ───────────────────────

async function realLogin(email, password) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Login failed. Please try again.');
  return { token: data.access_token, user: data.user };
}

async function realRegister(email, password, displayName) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Registration failed. Please try again.');
  return { token: data.access_token, user: data.user };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const authService = {
  login:    MOCK_MODE ? mockLogin    : realLogin,
  register: MOCK_MODE ? mockRegister : realRegister,
};
