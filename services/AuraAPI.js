/**
 * AuraAPI.js — HTTP client for the Aura Brain FastAPI backend.
 *
 * Android emulator routes 10.0.2.2 → host machine's localhost, so the
 * FastAPI server running on port 8000 is reachable without extra config.
 * iOS Simulator can hit localhost directly; swap BASE_URL as needed.
 */

import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = CONFIG.API_URL || 'http://10.0.2.2:8000';
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Fetch vibe counts from the Aura Brain API.
 *
 * @returns {Promise<Object>} - Object with vibe labels as keys and counts as values
 * @throws {Error}             - On network failure, timeout, or non-2xx response
 */
export async function fetchVibeCounts() {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    const response = await fetch(`${BASE_URL}/api/vibes/counts`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Aura Brain returned ${response.status}${body ? `: ${body}` : ''}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — check that the backend is running.');
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Fetch a personalised Sydney insider tip from the Aura Brain RAG pipeline.
 *
 * @param {string} query       - Natural-language question (e.g. "quiet café near USYD")
 * @param {string} vibe        - User's current vibe label (e.g. "chill", "energetic")
 * @param {number} auraScore   - Aura Score scaled to 0–100
 * @param {string} userId      - Unique user identifier
 * @returns {Promise<string>}  - The generated insider tip string
 * @throws {Error}             - On network failure, timeout, or non-2xx response
 */
export async function fetchInsiderTip(
  query,
  vibe = 'balanced',
  auraScore = 50,
  userId = 'maya',
) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    const response = await fetch(`${BASE_URL}/api/v1/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        query,
        user_id: userId,
        aura_score: Math.min(Math.max(Number(auraScore) || 50, 0), 100),
        vibe: vibe || 'balanced',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Aura Brain returned ${response.status}${body ? `: ${body}` : ''}`);
    }

    const data = await response.json();

    if (typeof data.tip !== 'string') {
      throw new Error('Unexpected response shape from Aura Brain API.');
    }

    return data.tip;

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — check that the backend is running on port 8000.');
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}
