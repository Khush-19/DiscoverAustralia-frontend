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
  login: realLogin,
  register: realRegister,
};
