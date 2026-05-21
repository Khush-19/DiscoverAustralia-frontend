import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTodaySteps } from '../services/HealthService';

// ─── Context ──────────────────────────────────────────────────────────────────

export const UserContext = createContext(null);

export const AURA_MAX = 1000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const { user } = useAuth();
  const [userName,        setUserName]        = useState('Maya Olsen');
  const [auraScore,       setAuraScore]       = useState(780);
  const [vibe,            setVibe]            = useState(null);
  const [activeSquads,    setActiveSquads]    = useState([]);
  const [wearableStats,   setWearableStats]   = useState({
    steps:      4000,
  });
  // Last GPS fix pushed to the backend — consumed by Squad-Up proximity logic
  const [lastKnownCoords, setLastKnownCoords] = useState(null);

  // Sync userName with AuthContext user displayName
  useEffect(() => {
    if (user && user.displayName) {
      setUserName(user.displayName);
    } else if (!user) {
      setUserName('Maya Olsen');
    }
  }, [user]);

  // Fetch step count on mount and periodically
  useEffect(() => {
    let isMounted = true;

    const fetchSteps = async () => {
      try {
        const steps = await getTodaySteps();
        if (isMounted) {
          setWearableStats(prev => ({ ...prev, steps }));
        }
      } catch (error) {
        console.warn('Failed to fetch steps:', error);
      }
    };

    // Initial fetch
    fetchSteps();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSteps, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const updateVibe = (newVibe) => setVibe(newVibe);

  const joinSquad = (squad) => {
    if (activeSquads.some((s) => s.id === squad.id)) return false;
    setActiveSquads((prev) => [...prev, squad]);
    setAuraScore((prev) => Math.min(prev + 10, AURA_MAX));
    return true;
  };

  const isSquadJoined = (squadId) =>
    activeSquads.some((s) => s.id === squadId);

  const incrementAura = (amount = 10) =>
    setAuraScore((prev) => Math.min(prev + amount, AURA_MAX));

  /**
   * Called by LocationContext whenever a fresh GPS fix is obtained.
   * Stores the coords so Squad-Up and any proximity-aware screen can read
   * them from UserContext without importing LocationContext directly.
   */
  const updateUserLocation = useCallback((coords) => {
    setLastKnownCoords(coords);
    // Intentionally fire-and-forget — the actual HTTP call lives in
    // LocationService.syncUserLocationToBackend which is called by LocationContext.
    // This state update is purely for in-process consumers (e.g. SquadsScreen).
  }, []);

  // ── Value ─────────────────────────────────────────────────────────────────

  return (
    <UserContext.Provider
      value={{
        userName,
        setUserName,
        auraScore,
        vibe,
        activeSquads,
        wearableStats,
        setWearableStats,
        lastKnownCoords,
        updateUserLocation,
        updateVibe,
        joinSquad,
        isSquadJoined,
        incrementAura,
        AURA_MAX,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
