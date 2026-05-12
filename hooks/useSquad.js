import { useContext } from 'react';
import { SquadContext } from '../context/SquadContext';

/**
 * useSquad hook to consume the SquadContext.
 * Must be used within a SquadProvider.
 */
export function useSquad() {
  const ctx = useContext(SquadContext);
  if (!ctx) {
    throw new Error('useSquad must be used within a SquadProvider');
  }
  return ctx;
}
