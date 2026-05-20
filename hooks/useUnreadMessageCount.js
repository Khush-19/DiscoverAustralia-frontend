import { useState, useEffect } from 'react';
import { getAllMessages } from '../services/messageService';

/**
 * Hook to fetch and track unread message count
 * @param {number} pollInterval - Polling interval in milliseconds (default: 30000 = 30s)
 * @returns {object} Object containing unreadCount, loading, error, and refresh function
 */
export function useUnreadMessageCount(pollInterval = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUnreadCount = async () => {
    try {
      setError(null);
      const messages = await getAllMessages();
      const count = messages.filter(m => !m.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread message count:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Set up polling if interval is provided
    if (pollInterval > 0) {
      const intervalId = setInterval(fetchUnreadCount, pollInterval);
      return () => clearInterval(intervalId);
    }
  }, [pollInterval]);

  return {
    unreadCount,
    loading,
    error,
    refresh: fetchUnreadCount,
  };
}
