import React, { createContext, useContext, useEffect, useReducer, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

// Keys used in the secure enclave — never stored in AsyncStorage
const TOKEN_KEY = 'discover_au_jwt';
const USER_KEY  = 'discover_au_user';

const AuthContext = createContext(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...state, userToken: action.token, user: action.user, isLoading: false };
    case 'SIGN_IN':
      return { ...state, userToken: action.token, user: action.user };
    case 'SIGN_OUT':
      return { ...state, userToken: null, user: null };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,   // true while we check secure storage on boot
    userToken: null,
    user: null,
  });

  // On app launch: read any persisted JWT from the secure enclave.
  // This keeps the user logged in across cold starts without storing
  // sensitive data in AsyncStorage (which is plaintext on disk).
  useEffect(() => {
    async function bootstrapAsync() {
      try {
        const token    = await SecureStore.getItemAsync(TOKEN_KEY);
        const userJson = await SecureStore.getItemAsync(USER_KEY);
        const user     = userJson ? JSON.parse(userJson) : null;
        dispatch({ type: 'RESTORE_TOKEN', token, user });
      } catch {
        // Secure store unavailable (e.g., first boot on fresh simulator) —
        // fall through to the auth flow.
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    }
    bootstrapAsync();
  }, []);

  // Memoised so child components don't re-render when unrelated state changes
  const authActions = useMemo(() => ({

    signIn: async (email, password) => {
      const { token, user } = await authService.login(email, password);
      // Write to Keychain/Keystore via expo-secure-store (AES-256 on Android,
      // Secure Enclave on iOS) — JWT never touches AsyncStorage.
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      dispatch({ type: 'SIGN_IN', token, user });
      return user;
    },

    signUp: async (email, password, displayName) => {
      const { token, user } = await authService.register(email, password, displayName);
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      dispatch({ type: 'SIGN_IN', token, user });
      return user;
    },

    signOut: async () => {
      // Delete both keys so there is no stale credential in the enclave
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      dispatch({ type: 'SIGN_OUT' });
    },

  }), []);

  return (
    <AuthContext.Provider value={{ ...state, ...authActions }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
  return ctx;
}
