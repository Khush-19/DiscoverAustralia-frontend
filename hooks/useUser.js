import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

/**
 * useUser hook to consume the UserContext.
 * Must be used within a UserProvider.
 */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}
