import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { squadService } from '../services/squadService';
import { useUser } from '../hooks/useUser';
import { useLocation } from '../hooks/useLocation';

export const SquadContext = createContext(null);

const POLL_INTERVAL_MS = 30_000;

export function SquadProvider({ children }) {
  // CRITICAL: Pull the actual user ID and their interests from UserContext
  const { user, joinSquad: userJoinSquad } = useUser(); 
  const { coords } = useLocation();

  const [nearbySquads, setNearbySquads] = useState([]);
  const [allSquads,      setAllSquads]      = useState([]);
  const [mySquad,      setMySquad]      = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState(null);

  const coordsRef = useRef(coords);
  useEffect(() => { coordsRef.current = coords; }, [coords]);

  // ── Fetch nearby squads ────────────────────────────────────────────────────
  const fetchNearbySquads = useCallback(async (overrideCoords) => {
    try {
      setIsLoading(true);
      const data = await squadService.fetchNearbySquads(
        overrideCoords || coordsRef.current
      );
      setNearbySquads(data);
      setError(null);
    } catch (err) {
      setError(err.message ?? 'Could not load squads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch all squads ───────────────────────────────────────────────────────
  const fetchAllSquads = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await squadService.fetchAllSquads();
      setAllSquads(data);
      setError(null);
    } catch (err) {
      setError(err.message ?? 'Could not load all squads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Initial fetch + polling ───────────────────────────────────────────────────
  useEffect(() => {
    fetchNearbySquads(coords);
    fetchAllSquads();
  }, [coords, fetchNearbySquads, fetchAllSquads]);

  useEffect(() => {
    const pollTimer = setInterval(() => {
      squadService
        .fetchNearbySquads(coordsRef.current)
        .then(data => {
          setNearbySquads(prev => {
            // Merge: preserve mySquad's memberCount update if it's in the list
            return data.map(s => {
              const existing = prev.find(p => p.id === s.id);
              return existing ? { ...s, memberCount: existing.memberCount } : s;
            });
          });
        })
        .catch(err => setError(err.message ?? 'Polling error'));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollTimer);
  }, []);

  // ── Unified Join / Create (Aligned to Java Upsert) ──────────────────────

  const handleJoinOrCreate = useCallback(async (eventId) => {
    // 1. Fallbacks in case UserContext isn't fully loaded
    const currentUserId = user?.id || 'anonymous-user';
    const userInterests = user?.interests || ['coffee', 'techno']; // Ensure we send something for the AI!

    // 2. Optimistic UI: Try to find the squad to make the UI feel instant
    const existingSquad = nearbySquads.find(s => s.eventId === eventId || s.id === eventId);
    
    if (existingSquad) {
      setMySquad({ 
        ...existingSquad, 
        memberUserIds: [...(existingSquad.memberUserIds || []), currentUserId] 
      });
    } else {
      setIsLoading(true); // Hard loading state if creating a brand new one
    }

    try {
      // 3. Fire the unified network request we updated in squadService.js
      const result = await squadService.joinSquad(eventId, currentUserId, userInterests);
      
      // CRITICAL OVERRIDE: 
      // result.squad contains the REAL data from the DB, including the newly generated AI icebreaker!
      // We must overwrite the optimistic state with the absolute truth from the Java backend.
      setMySquad(result.squad);

      // Update the nearby list with the fresh data
      setNearbySquads(prev => {
        const filtered = prev.filter(s => s.eventId !== eventId && s.id !== result.squad.id);
        return [result.squad, ...filtered];
      });

      userJoinSquad(result.squad);
      return result.squad;

    } catch (err) {
      // 4. Rollback on failure
      setMySquad(null);
      setError(err.message ?? 'Could not join squad.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [nearbySquads, user, userJoinSquad]);

  // Map the old separate functions to the new unified handler for backward compatibility in your UI components
  const joinSquad = handleJoinOrCreate;
  const createSquad = handleJoinOrCreate; 

  // New detailed squad creation with form data
  const createSquadWithDetails = useCallback(async (squadData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the new API service
      const result = await squadService.createSquadWithDetails(squadData);
      
      console.log('Squad created successfully:', result);

      // Note: Squad list will be refreshed by dedicated API, no need to update state here

      return result;
    } catch (err) {
      console.error('Failed to create squad:', err);
      setError(err.message ?? 'Could not create squad.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveSquad = useCallback(() => {
    setMySquad(null); // Real-world: You'd want an API call here to remove the user from the DB array
  }, []);

  return (
    <SquadContext.Provider
      value={{
        nearbySquads,
        allSquads,
        mySquad,
        isLoading,
        error,
        fetchNearbySquads,
        fetchAllSquads,
        joinSquad,
        createSquad,
        createSquadWithDetails,
        leaveSquad,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
}