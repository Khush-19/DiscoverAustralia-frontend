import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import CONFIG from '../constants/config';
import * as SecureStore from 'expo-secure-store';

// ─── Polyfills for React Native ───────────────────────────────────────────────
// TextEncoder/TextDecoder are required by @stomp/stompjs for message encoding
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

/**
 * useSquadSocket Hook
 *
 * Manages STOMP WebSocket connection to Spring Boot backend for real-time squad chat.
 *
 * Contract (Backend):
 * - Handshake: ws://[host]:[port]/squad-ws (SockJS)
 * - Subscribe: /topic/squad/{eventId}
 * - Publish: /app/squad-chat/{eventId}
 * - Message: { senderId: String, content: String, timestampMs: Long }
 *
 * @param {string} eventId - The squad's event UUID
 * @param {string} userId   - Current user's ID
 * @returns {Object} { messages, sendMessage, isConnected, isConnecting, error }
 */
export function useSquadSocket(eventId, userId) {
  const [messages,     setMessages]     = useState([]);
  const [isConnected,  setIsConnected]  = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);

  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);

  /**
   * Build WebSocket URL from BASE_URL config
   * Handles both Android (10.0.2.2) and iOS/web (localhost)
   * Converts http://host:port to ws://host:8080/squad-ws
   */
  const getWebSocketUrl = useCallback(() => {
    try {
      // Get base URL from config or use platform-specific default
      const baseUrl = CONFIG.API_URL || 
        (Platform.OS === 'android' 
          ? 'http://10.0.2.2:8000'
          : 'http://localhost:8000');

      console.log('[useSquadSocket] Config API_URL:', CONFIG.API_URL);
      console.log('[useSquadSocket] Platform:', Platform.OS);
      console.log('[useSquadSocket] Base URL:', baseUrl);

      // Parse URL to extract components
      const url = new URL(baseUrl);
      
      // For Android, always use 10.0.2.2; for iOS/web, use localhost
      const host = Platform.OS === 'android' 
        ? '10.0.2.2'
        : (url.hostname === '10.0.2.2' ? 'localhost' : url.hostname);
      
      // Default to 8080 for Spring Boot WebSocket endpoint
      // If config specifies different port, adjust accordingly
      const port = '8080'; // Spring Boot default STOMP port
      
      const wsUrl = `ws://${host}:${port}/squad-ws`;
      console.log('[useSquadSocket] WebSocket URL:', wsUrl);
      
      return wsUrl;
    } catch (err) {
      console.error('[useSquadSocket] URL parsing error:', err);
      // Fallback
      const fallback = Platform.OS === 'android' 
        ? 'ws://10.0.2.2:8080/squad-ws'
        : 'ws://localhost:8080/squad-ws';
      console.log('[useSquadSocket] Using fallback URL:', fallback);
      return fallback;
    }
  }, []);

  /**
   * Initialize STOMP client and connect
   */
  const connect = useCallback(async () => {
    if (!eventId || !userId) {
      const msg = 'EventId and UserId are required';
      console.warn('[useSquadSocket]', msg);
      setError(msg);
      return;
    }

    try {
      setError(null);
      setIsConnecting(true);

      // Retrieve JWT token for authentication
      const token = await SecureStore.getItemAsync('discover_au_jwt');
      console.log('[useSquadSocket] Token available:', !!token);

      const wsUrl = getWebSocketUrl();
      
      const client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          // Include JWT token if available for backend authentication
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-User-Id': userId,
          'X-Event-Id': eventId,
        },
        // Use SockJS for compatibility (WebSocket fallback to HTTP polling)
        webSocketFactory: () => new SockJS(wsUrl),
        
        // Auto-reconnect on disconnect
        reconnectDelay: 5000,
        maxWebSocketFrameSize: 8 * 1024 * 1024,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // Connection lifecycle
        onConnect: () => {
          console.log(`[useSquadSocket] ✅ Connected to ${wsUrl}`);
          setIsConnecting(false);
          setIsConnected(true);
          setError(null);

          // Subscribe to the squad topic
          if (subscriptionRef.current) {
            try {
              subscriptionRef.current.unsubscribe();
            } catch (err) {
              console.warn('[useSquadSocket] Error unsubscribing old subscription:', err);
            }
          }

          subscriptionRef.current = client.subscribe(
            `/topic/squad/${eventId}`,
            (message) => {
              try {
                const body = JSON.parse(message.body);
                setMessages((prev) => [...prev, body]);
                console.log('[useSquadSocket] 📨 Message received:', body);
              } catch (err) {
                console.error('[useSquadSocket] Failed to parse message:', err);
              }
            }
          );
          console.log(`[useSquadSocket] ✅ Subscribed to /topic/squad/${eventId}`);
        },

        // STOMP protocol errors
        onStompError: (frame) => {
          const errorMessage = frame.headers?.message || frame.body || 'Unknown STOMP error';
          const errorDetails = {
            message: errorMessage,
            frame: frame,
            url: wsUrl,
            timestamp: new Date().toISOString(),
          };
          console.error('[useSquadSocket] ❌ STOMP Error:', errorDetails);
          setIsConnecting(false);
          setIsConnected(false);
          setError(`STOMP error: ${errorMessage}`);
        },

        // WebSocket connection errors
        onWebSocketError: (event) => {
          const errorMsg = event?.message || 'WebSocket connection failed';
          console.error('[useSquadSocket] ❌ WebSocket Error:', {
            type: event?.type,
            message: errorMsg,
            url: wsUrl,
            timestamp: new Date().toISOString(),
          });
          setIsConnecting(false);
          setIsConnected(false);
          setError(`WebSocket error: ${errorMsg}`);
        },

        // Disconnection
        onDisconnect: () => {
          console.log('[useSquadSocket] 🔌 Disconnected');
          setIsConnecting(false);
          setIsConnected(false);
        },

        // Other errors
        onChangeState: (state) => {
          console.log('[useSquadSocket] Connection state:', state);
        },
      });

      clientRef.current = client;
      client.activate();
      console.log('[useSquadSocket] Activating STOMP client...');
    } catch (err) {
      console.error('[useSquadSocket] ❌ Connection setup failed:', {
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
      setIsConnecting(false);
      setIsConnected(false);
      setError(err.message || 'Failed to connect to socket');
    }
  }, [eventId, userId, getWebSocketUrl]);

  /**
   * Publish a message to the squad chat
   * Backend expects: { senderId, content, timestampMs }
   * Frontend should pass 0 for timestampMs; backend will override with server time
   */
  const sendMessage = useCallback(
    (content) => {
      if (!clientRef.current || !isConnected) {
        const msg = 'Not connected to socket';
        console.warn('[useSquadSocket]', msg);
        setError(msg);
        return;
      }

      if (!content || !content.trim()) {
        console.warn('[useSquadSocket] Cannot send empty message');
        return;
      }

      try {
        const payload = {
          senderId: userId,
          content: content.trim(),
          timestampMs: 0, // Backend will override with server time
        };

        clientRef.current.publish({
          destination: `/app/squad-chat/${eventId}`,
          body: JSON.stringify(payload),
        });

        console.log('[useSquadSocket] 📤 Message sent:', payload);
      } catch (err) {
        console.error('[useSquadSocket] ❌ Failed to send message:', err);
        setError(err.message || 'Failed to send message');
      }
    },
    [isConnected, userId, eventId]
  );

  /**
   * Cleanup: disconnect socket and unsubscribe on unmount
   */
  useEffect(() => {
    return () => {
      console.log('[useSquadSocket] Cleanup: component unmounted');
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
          console.log('[useSquadSocket] Unsubscribed from topic');
        } catch (err) {
          console.error('[useSquadSocket] Error unsubscribing:', err);
        }
      }

      if (clientRef.current && clientRef.current.active) {
        try {
          clientRef.current.deactivate();
          console.log('[useSquadSocket] Deactivated STOMP client');
        } catch (err) {
          console.error('[useSquadSocket] Error deactivating client:', err);
        }
      }
    };
  }, []);

  /**
   * Connect when eventId/userId change
   */
  useEffect(() => {
    if (eventId && userId) {
      connect();
    }
  }, [eventId, userId, connect]);

  return {
    messages,
    sendMessage,
    isConnected,
    isConnecting,
    error,
  };
}

  /**
   * Initialize STOMP client and connect
   */
  const connect = useCallback(async () => {
    if (!eventId || !userId) {
      setError('EventId and UserId are required');
      return;
    }

    try {
      setError(null);

      // Retrieve JWT token for authentication
      const token = await SecureStore.getItemAsync('discover_au_jwt');

      const client = new Client({
        brokerURL: getWebSocketUrl(),
        connectHeaders: {
          // Include JWT token if available for backend authentication
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-User-Id': userId,
          'X-Event-Id': eventId,
        },
        // Use SockJS for compatibility (WebSocket fallback to HTTP polling)
        webSocketFactory: () => new SockJS(getWebSocketUrl()),
        // Auto-reconnect on disconnect
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log(`[useSquadSocket] Connected to ${getWebSocketUrl()}`);
          setIsConnected(true);

          // Subscribe to the squad topic
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
          }

          subscriptionRef.current = client.subscribe(
            `/topic/squad/${eventId}`,
            (message) => {
              try {
                const body = JSON.parse(message.body);
                setMessages((prev) => [...prev, body]);
                console.log('[useSquadSocket] Message received:', body);
              } catch (err) {
                console.error('[useSquadSocket] Failed to parse message:', err);
              }
            }
          );
        },
        onStompError: (frame) => {
          console.error('[useSquadSocket] STOMP error:', frame);
          setError(`STOMP error: ${frame.headers['message']}`);
          setIsConnected(false);
        },
        onDisconnect: () => {
          console.log('[useSquadSocket] Disconnected');
          setIsConnected(false);
        },
      });

      clientRef.current = client;
      client.activate();
    } catch (err) {
      console.error('[useSquadSocket] Connection failed:', err);
      setError(err.message || 'Failed to connect to socket');
      setIsConnected(false);
    }
  }, [eventId, userId, getWebSocketUrl]);

  /**
   * Publish a message to the squad chat
   * Backend expects: { senderId, content, timestampMs }
   * Frontend should pass 0 for timestampMs; backend will override with server time
   */
  const sendMessage = useCallback(
    (content) => {
      if (!clientRef.current || !isConnected) {
        setError('Not connected to socket');
        return;
      }

      if (!content || !content.trim()) {
        console.warn('[useSquadSocket] Cannot send empty message');
        return;
      }

      try {
        const payload = {
          senderId: userId,
          content: content.trim(),
          timestampMs: 0, // Backend will override with server time
        };

        clientRef.current.publish({
          destination: `/app/squad-chat/${eventId}`,
          body: JSON.stringify(payload),
        });

        console.log('[useSquadSocket] Message sent:', payload);
      } catch (err) {
        console.error('[useSquadSocket] Failed to send message:', err);
        setError(err.message || 'Failed to send message');
      }
    },
    [isConnected, userId, eventId]
  );

  /**
   * Cleanup: disconnect socket and unsubscribe on unmount
   */
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (err) {
          console.error('[useSquadSocket] Error unsubscribing:', err);
        }
      }

      if (clientRef.current && clientRef.current.active) {
        try {
          clientRef.current.deactivate();
        } catch (err) {
          console.error('[useSquadSocket] Error deactivating client:', err);
        }
      }
    };
  }, []);

  /**
   * Connect when eventId/userId change
   */
  useEffect(() => {
    if (eventId && userId) {
      connect();
    }
  }, [eventId, userId, connect]);

  return {
    messages,
    sendMessage,
    isConnected,
    error,
  };

