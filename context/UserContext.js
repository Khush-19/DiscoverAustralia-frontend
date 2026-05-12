import { createContext, useContext, useState, useCallback } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────

export const UserContext = createContext(null);

export const AURA_MAX = 1000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [userName,        setUserName]        = useState('Maya Olsen');
  const [auraScore,       setAuraScore]       = useState(780);
  const [vibe,            setVibe]            = useState(null);
  const [activeSquads,    setActiveSquads]    = useState([]);
  const [wearableStats,   setWearableStats]   = useState({
    sleepHours: 6.5,
    steps:      4000,
  });
  // Last GPS fix pushed to the backend — consumed by Squad-Up proximity logic
  const [lastKnownCoords, setLastKnownCoords] = useState(null);

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
