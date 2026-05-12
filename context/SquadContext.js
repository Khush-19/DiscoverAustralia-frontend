/**
 * SquadContext.js
 *
 * Owns all ephemeral squad state — squads that exist for 2-3 hrs only.
 * This context sits above the UI's "social layer" and handles:
 *   - Fetching nearby squads from the backend (or mock)
 *   - 30-second polling to simulate real-time membership changes
 *   - Coordinating join/create across both SquadContext and UserContext
 *
 * Provider nesting requirement:
 *   <UserProvider> → <LocationProvider> → <SquadProvider> → children
 *
 * This ordering lets SquadProvider call useUser() (for Aura scoring) and
 * useLocation() (for proximity-sorted results) without circular imports.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { squadService } from '../services/squadService';
import { useUser } from '../hooks/useUser';
import { useLocation } from '../hooks/useLocation';

export const SquadContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // 30 s — fast enough for social proof, cheap on battery

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SquadProvider({ children }) {
  const { joinSquad: userJoinSquad } = useUser();
  const { coords }                   = useLocation();

  const [nearbySquads, setNearbySquads] = useState([]);
  const [mySquad,      setMySquad]      = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState(null);

  // Keep a ref to the latest coords so the polling interval always uses
  // the current position without needing to be recreated every location update.
  const coordsRef = useRef(coords);
  useEffect(() => { coordsRef.current = coords; }, [coords]);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchNearbySquads = useCallback(async (overrideCoords) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await squadService.fetchNearbySquads(
        overrideCoords ?? coordsRef.current
      );
      setNearbySquads(data);
    } catch (err) {
      setError(err.message ?? 'Could not load squads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount, refresh whenever coords change significantly
  useEffect(() => {
    fetchNearbySquads(coords);
  }, [coords?.latitude, coords?.longitude]);

  // 30-second polling — simulates real-time member count changes.
  // Uses coordsRef so the interval doesn't need to be torn down on every
  // location update (saves battery by avoiding unnecessary re-subscription).
  useEffect(() => {
    const timer = setInterval(() => {
      squadService
        .fetchNearbySquads(coordsRef.current)
        .then(data => {
          setNearbySquads(prev => {
            // Merge: preserve mySquad's memberCount update if it's in the list
            return data.map(d => {
              const existing = prev.find(p => p.id === d.id);
              return existing ? { ...d, _prev: existing } : d;
            });
          });
        })
        .catch(() => {}); // silent — poll failure shouldn't break the UI
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []); // intentionally empty — coordsRef handles position updates

  // ── Join ─────────────────────────────────────────────────────────────────

  const joinSquad = useCallback(async (squadId) => {
    const squad = nearbySquads.find(s => s.id === squadId);
    if (!squad) return;

    // Optimistic UI — update member count immediately
    setNearbySquads(prev =>
      prev.map(s =>
        s.id === squadId
          ? { ...s, memberCount: s.memberCount + 1, spotsLeft: Math.max(0, s.spotsLeft - 1) }
          : s
      )
    );
    setMySquad({ ...squad, memberCount: squad.memberCount + 1 });

    try {
      await squadService.joinSquad(squadId, 'current-user');
      // Sync to UserContext: adds squad to activeSquads, awards Aura points
      userJoinSquad(squad);
    } catch (err) {
      // Rollback optimistic update on failure
      setNearbySquads(prev =>
        prev.map(s => s.id === squadId ? squad : s)
      );
      setMySquad(null);
      setError(err.message ?? 'Could not join squad.');
    }
  }, [nearbySquads, userJoinSquad]);

  // ── Create ───────────────────────────────────────────────────────────────

  const createSquad = useCallback(async (spotId) => {
    try {
      const newSquad = await squadService.createSquad(spotId, 'current-user');
      setNearbySquads(prev => [newSquad, ...prev]);
      setMySquad(newSquad);
      userJoinSquad(newSquad); // count it as joined for Aura scoring
      return newSquad;
    } catch (err) {
      setError(err.message ?? 'Could not create squad.');
      throw err;
    }
  }, [userJoinSquad]);

  // ── Leave ────────────────────────────────────────────────────────────────

  const leaveSquad = useCallback(() => {
    if (!mySquad) return;
    setNearbySquads(prev =>
      prev.map(s =>
        s.id === mySquad.id
          ? { ...s, memberCount: Math.max(1, s.memberCount - 1), spotsLeft: s.spotsLeft + 1 }
          : s
      )
    );
    setMySquad(null);
  }, [mySquad]);

  // ── Value ────────────────────────────────────────────────────────────────

  return (
    <SquadContext.Provider
      value={{
        nearbySquads,
        mySquad,
        isLoading,
        error,
        fetchNearbySquads,
        joinSquad,
        createSquad,
        leaveSquad,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
}


