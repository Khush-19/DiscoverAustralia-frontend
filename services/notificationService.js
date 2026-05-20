/**
 * services/notificationService.js
 *
 * Handles push notifications settings updates.
 */

import CONFIG from '../constants/config';

const BASE_URL = CONFIG.API_URL || 'http://localhost:8080';

export const notificationService = {
  /**
   * Sets the user's notification preference.
   * 
   * @param {string} token JWT Auth token.
   * @param {boolean} isEnabled True to enable, false to disable.
   * @returns {Promise<object>} Returns the updated notification details from the backend.
   */
  async setNotification(token, isEnabled) {
    const url = `${BASE_URL}/api/core/setNotification`;
    console.log('[notificationService] setNotification requesting:', url, 'value:', isEnabled);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: isEnabled ? 'true' : 'false',
    });

    if (!res.ok) {
      let errorMsg = 'Failed to update notification settings.';
      try {
        const data = await res.json();
        errorMsg = data.message || data.detail || errorMsg;
      } catch (e) {
        // ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('[notificationService] setNotification response:', data);
    return data;
  },
};
