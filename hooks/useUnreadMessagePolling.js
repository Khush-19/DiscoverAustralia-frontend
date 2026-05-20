import React from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './useAuth';
import CONFIG from '../constants/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Global hook for polling unread messages across the entire app
 * This runs as long as the user is logged in and notifications are enabled
 */
export function useUnreadMessagePolling() {
  const { userToken } = useAuth();
  const [isNotificationEnabled, setIsNotificationEnabled] = React.useState(true);
  const [notificationPermission, setNotificationPermission] = React.useState(false);
  const seenIdsRef = React.useRef(new Set());

  // Check notification permission on mount
  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermission(status === 'granted');
      } catch (err) {
        console.warn('Notification permission check failed:', err);
        setNotificationPermission(false);
      }
    };
    checkPermission();
  }, []);

  // Load notification enabled setting from secure store
  React.useEffect(() => {
    SecureStore.getItemAsync('discover_au_notification_enabled')
      .then(val => {
        if (val !== null) {
          setIsNotificationEnabled(val === 'true');
        } else {
          setIsNotificationEnabled(true);
        }
      })
      .catch(err => console.log('Error reading notifications settings:', err));
  }, []);

  // Present system notification helper
  const presentSystemNotification = React.useCallback(async (title, body) => {
    if (!notificationPermission) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    } catch (err) {
      console.warn('Failed to present notification:', err);
    }
  }, [notificationPermission]);

  // Poll unread messages every 15 seconds
  React.useEffect(() => {
    if (!isNotificationEnabled || !userToken) {
      return;
    }

    const interval = setInterval(() => {
      fetch(`${CONFIG.API_URL}/api/core/getUnreadMessages`, {
        headers: {
          'Authorization': userToken,
        },
      })
        .then(res => {
          // Handle empty or invalid responses
          if (!res.ok) {
            console.warn('API request failed with status:', res.status);
            return [];
          }
          const text = res.text();
          return text.then(t => {
            if (!t || t.trim() === '') {
              return [];
            }
            try {
              return JSON.parse(t);
            } catch (e) {
              console.warn('JSON parse error, returning empty array:', e.message);
              return [];
            }
          });
        })
        .then((data) => {
          if (!Array.isArray(data)) {
            console.warn('Expected array but got:', typeof data);
            return;
          }
          const unread = data.filter(msg => !msg.read && !msg.remind && !seenIdsRef.current.has(msg.id.timestamp));
          if (unread.length > 0) {
            // Show system notification for each unread message
            unread.forEach((msg, index) => {
              setTimeout(() => {
                presentSystemNotification(msg.title, msg.content);
              }, index * 1000); // Stagger notifications by 1 second
            });
            unread.forEach(m => seenIdsRef.current.add(m.id.timestamp));
          }
        })
        .catch(err => {
          console.error('Failed to fetch unread messages:', err);
          console.log('Error name:', err.name);
          console.log('Error message:', err.message);
          console.log('Request URL:', `${CONFIG.API_URL}/api/core/getUnreadMessages`);
        });
    }, 15000);

    return () => clearInterval(interval);
  }, [isNotificationEnabled, userToken, presentSystemNotification]);
}
