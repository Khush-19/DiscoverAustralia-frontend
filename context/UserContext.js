import { createContext, useContext, useState } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext(null);

export const AURA_MAX = 1000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [userName,      setUserName]      = useState('Maya Olsen');
  const [auraScore,     setAuraScore]     = useState(780);
  const [vibe,          setVibe]          = useState(null);  // { id, title, emoji, ... }
  const [activeSquads,  setActiveSquads]  = useState([]);    // array of joined squad objects
  const [wearableStats, setWearableStats] = useState({
    sleepHours: 6.5,   // hrs last night
    steps:      4000,  // steps today
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Set (or clear) the active vibe. */
  const updateVibe = (newVibe) => setVibe(newVibe);

  /**
   * Join a squad. Returns false without side-effects if already joined.
   * On success: appends squad to activeSquads and adds 10 aura points.
   */
  const joinSquad = (squad) => {
    if (activeSquads.some((s) => s.id === squad.id)) return false;
    setActiveSquads((prev) => [...prev, squad]);
    setAuraScore((prev) => Math.min(prev + 10, AURA_MAX));
    return true;
  };

  /** True if the given squadId is already in activeSquads. */
  const isSquadJoined = (squadId) =>
    activeSquads.some((s) => s.id === squadId);

  /** Nudge auraScore up by `amount`, capped at AURA_MAX. */
  const incrementAura = (amount = 10) =>
    setAuraScore((prev) => Math.min(prev + amount, AURA_MAX));

  // ── Value ─────────────────────────────────────────────────────────────────

  return (
    <UserContext.Provider
      value={{
        // state
        userName,
        setUserName,
        auraScore,
        vibe,
        activeSquads,
        wearableStats,
        setWearableStats,
        // actions
        updateVibe,
        joinSquad,
        isSquadJoined,
        incrementAura,
        // constants
        AURA_MAX,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Must be called inside <UserProvider>. */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be called inside <UserProvider>');
  return ctx;
}
