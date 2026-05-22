import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  requestForegroundPermission,
  getPermissionStatus,
  getCurrentLocation,
  reverseGeocode,
  fetchWeather,
  syncUserLocationToBackend,
} from '../services/LocationService';
import { useUser } from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';

export const LocationContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
// Must be rendered inside <UserProvider> so it can call updateUserLocation().

export function LocationProvider({ children }) {
  const { updateUserLocation } = useUser();
  const { user } = useAuth();

  const [coords,           setCoords]           = useState(null);
  const [cityName,         setCityName]         = useState(null);
  const [suburb,           setSuburb]           = useState(null);
  const [temperature,      setTemperature]       = useState(null);
  const [weatherEmoji,     setWeatherEmoji]      = useState(null);
  // 'granted' | 'denied' | 'undetermined' — mirrors expo-location PermissionStatus
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [isLoading,        setIsLoading]        = useState(false);
  const [error,            setError]            = useState(null);

  // ── Core refresh logic ───────────────────────────────────────────────────

  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Ensure we have permission
      let status = await getPermissionStatus();
      if (status !== 'granted') {
        status = await requestForegroundPermission();
      }
      setPermissionStatus(status);

      if (status !== 'granted') {
        setIsLoading(false);
        return;
      }

      // 2. Get GPS fix
      const position = await getCurrentLocation();
      setCoords(position);

      // 3. Reverse-geocode + weather in parallel — neither blocks the other
      const [geo, weather] = await Promise.allSettled([
        reverseGeocode(position),
        fetchWeather(position),
      ]);

      if (geo.status === 'fulfilled') {
        console.log('[LocationContext] Reverse geocoded:', geo.value);
        setCityName(geo.value.city);
        setSuburb(geo.value.suburb);
      }
      if (weather.status === 'fulfilled' && weather.value) {
        setTemperature(weather.value.temperature);
        setWeatherEmoji(weather.value.emoji);
      }

      // 4. Push coords to backend (Squad-Up proximity logic) and UserContext.
      // Fire-and-forget — we don't await or surface failures to the user.
      if (user?.email) {
        syncUserLocationToBackend(position, user.email).catch(() => {});
      }
      updateUserLocation(position);
      
      console.log('[LocationContext] Location refreshed successfully:', {
        coords: position,
        cityName: geo.status === 'fulfilled' ? geo.value.city : null,
        suburb: geo.status === 'fulfilled' ? geo.value.suburb : null
      });

    } catch (err) {
      setError(err.message ?? 'Location unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [updateUserLocation, user]);

  // Bootstrap on mount: check existing permission silently so we can show
  // the banner state correctly before the user taps anything.
  useEffect(() => {
    async function bootstrap() {
      const status = await getPermissionStatus();
      setPermissionStatus(status);
      // Auto-fetch on launch only if already granted (no cold prompt on boot)
      if (status === 'granted') {
        refreshLocation();
      }
    }
    bootstrap();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        cityName,
        suburb,
        temperature,
        weatherEmoji,
        permissionStatus,
        isLoading,
        error,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}


