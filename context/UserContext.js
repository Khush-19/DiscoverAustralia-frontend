import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getTodaySteps, checkHealthConnectAvailability, checkHealthPermissions, requestHealthPermissions, openHealthConnectSettings } from '../services/HealthService';

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
  
  // Track if health connect prompt has been shown
  const [healthPromptShown, setHealthPromptShown] = useState(false);

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
        console.log('Fetching steps from Health Connect...');
        const steps = await getTodaySteps();
        if (isMounted) {
          setWearableStats(prev => ({ ...prev, steps }));
          console.log('Steps fetched successfully:', steps);
        }
      } catch (error) {
        console.error('Failed to fetch steps:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        });
      }
    };

    // Check health permissions (only after user logs in)
    const checkPermissions = async () => {
      // Only show prompt if user is logged in
      if (!user) {
        console.log('User not logged in, skipping Health Connect check');
        return;
      }

      // Don't show prompt again if already shown in this session
      if (healthPromptShown) {
        console.log('Health Connect prompt already shown, fetching steps with current permissions');
        await fetchSteps();
        return;
      }

      try {
        console.log('=== Checking Health Connect Status (Post-Login) ===');
        
        // First check if Health Connect is available on the device
        const availability = await checkHealthConnectAvailability();
        console.log('Health Connect availability:', availability);
        
        if (!availability.available) {
          console.warn('Health Connect SDK not available on this device');
          console.log('Reason:', availability.reason);
          console.log('Using mock data instead');
          return;
        }
        
        // Just check if permissions are already granted
        console.log('Checking existing health permissions...');
        const hasPermission = await checkHealthPermissions();
        
        if (hasPermission) {
          console.log('Health permissions already granted, fetching steps...');
          await fetchSteps();
        } else {
          console.log('Health permissions not granted yet');
          
          // Show first-time setup prompt (only once per session, after login)
          setHealthPromptShown(true);
          showHealthConnectPrompt(fetchSteps);
        }
      } catch (error) {
        console.error('Failed to check health permissions:', error);
      }
    };
    
    // Show Health Connect setup prompt
    const showHealthConnectPrompt = async (onSuccessCallback) => {
      Alert.alert(
        '🏃 Connect Health Data',
        'Want to get real step count data?\n\nBy authorizing Health Connect, the app can read your step information and provide more personalized recommendations.',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: async () => {
              console.log('User chose to skip Health Connect setup');
              await onSuccessCallback();
            },
          },
          {
            text: 'Authorize Now',
            onPress: async () => {
              console.log('User chose to grant Health Connect permissions');
              try {
                const granted = await requestHealthPermissions();
                
                if (granted) {
                  console.log('Health Connect permissions granted!');
                  Alert.alert(
                    '✅ Authorization Successful',
                    'Step permission has been granted!',
                    [{ text: 'OK' }]
                  );
                  await onSuccessCallback();
                } else {
                  console.log('Health Connect permissions not granted via dialog');
                  // Dialog didn't show, offer manual settings
                  Alert.alert(
                    '⚠️ Manual Authorization Required',
                    'Unable to open the permission dialog automatically.\n\nPlease manually authorize step access in the Health Connect app.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: async () => await onSuccessCallback(),
                      },
                      {
                        text: 'Open Settings',
                        onPress: async () => {
                          await openHealthConnectSettings();
                          await onSuccessCallback();
                        },
                      },
                    ]
                  );
                }
              } catch (error) {
                console.error('Failed to request Health Connect permissions:', error);
                Alert.alert(
                  '❌ Authorization Failed',
                  'Error requesting permission: ' + error.message,
                  [{ text: 'OK' }]
                );
                await onSuccessCallback();
              }
            },
          },
        ],
        { cancelable: false }
      );
    };

    // Initial permission check and fetch (only when user logs in)
    checkPermissions();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSteps, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

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
