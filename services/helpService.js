/**
 * helpService.js - Service for fetching help information from the API
 */

import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = CONFIG.API_URL || 'http://10.0.2.2:8000';
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Fetch help information from the API
 * @returns {Promise<Object>} - The help data containing id and help message
 * @throws {Error} - On network failure, timeout, or non-2xx response
 */
export async function fetchHelp() {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = await SecureStore.getItemAsync('discover_au_jwt');
    const response = await fetch(`${BASE_URL}/api/core/getHelp`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Help API returned ${response.status}${body ? `: ${body}` : ''}`);
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