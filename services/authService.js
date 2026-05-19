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

import CONFIG from '../constants/config';

const BASE_URL = CONFIG.API_URL;

// ─── Real implementations (used when MOCK_MODE = false) ───────────────────────

async function realLogin(email, password) {
  const url = `${BASE_URL}/api/core/login`;
  console.log('=== [DEBUG authService] ===');
  console.log('Computed Request URL:', url);
  console.log('CONFIG.API_URL value:', CONFIG.API_URL);
  console.log('===========================');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    let errorMsg = 'Login failed. Please try again.';
    try {
      const data = await res.json();
      errorMsg = data.message || data.detail || errorMsg;
    } catch (e) {
      // ignore JSON parse errors
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return {
    token: data.token,
    user: {
      id: data.userId,
      email: data.email,
      displayName: data.email ? data.email.split('@')[0] : 'User',
    }
  };
}

async function realRegister(email, password, displayName) {
  const res = await fetch(`${BASE_URL}/api/core/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  
  if (!res.ok) {
    let errorMsg = 'Registration failed. Please try again.';
    try {
      const data = await res.json();
      errorMsg = data.message || data.detail || errorMsg;
    } catch (e) {
      // ignore JSON parse errors
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return {
    token: data.token,
    user: {
      id: data.userId,
      email: data.email,
      displayName: displayName || (data.email ? data.email.split('@')[0] : 'User'),
    }
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const authService = {
  login: realLogin,
  register: realRegister,
};
