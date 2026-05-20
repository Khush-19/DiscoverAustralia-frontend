/**
 * messageService.js - Service for fetching and managing user messages
 */

import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = CONFIG.API_URL || 'http://10.0.2.2:8000';

/**
 * Fetch all messages for the current user
 * @returns {Promise<Array>} Array of message objects
 */
export async function getAllMessages() {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${BASE_URL}/api/core/getAllMessage`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || 'Failed to fetch messages');
  }

  const data = await response.json();
  return data;
}

/**
 * Mark a message as read
 * @param {string|object} messageId - The message ID (can be object with timestamp)
 * @returns {Promise<boolean>} Success status
 */
export async function markMessageAsRead(messageId) {
  const token = await SecureStore.getItemAsync('discover_au_jwt');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  // Handle both string IDs and object IDs with timestamp
  const id = typeof messageId === 'object' ? messageId.timestamp : messageId;

  const response = await fetch(`${BASE_URL}/api/core/markMessageRead`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messageId: id }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || 'Failed to mark message as read');
  }

  return true;
}
