import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import * as ExpoLocation from 'expo-location';
import { fetchCurrentWeather, fetchCurrentWeatherByCoords, fetchForecast, ForecastResult } from '../services/weatherApi';
import Parse from '../services/parseClient';

export interface Location {
  id: string;
  city: string;
  region: string;
  temp: number;      // °C
  feelsLike: number; // °C
  humidity: number;  // %
  windSpeed: number; // m/s
  condition: string;
  icon: string;
  isActive: boolean;
}

interface AppContextType {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  locations: Location[];
  activeLocation: Location | null;
  tempUnit: 'F' | 'C';
  setTempUnit: (unit: 'F' | 'C') => void;
  theme: 'Auto' | 'Light' | 'Dark';
  setTheme: (theme: 'Auto' | 'Light' | 'Dark') => void;
  weatherLoading: boolean;
  weatherError: string | null;
  forecastData: Record<string, ForecastResult | null>;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addLocation: (cityInfo: { city: string; region: string }) => void;
  removeLocation: (id: string) => void;
  setActiveLocation: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const INITIAL_LOCATIONS: Location[] = [
  { id: '1', city: 'Seattle',     region: 'WA', temp: 14, feelsLike: 12, humidity: 72, windSpeed: 3.5, condition: 'Partly Cloudy', icon: 'partly-cloudy', isActive: true },
  { id: '2', city: 'New York',    region: 'NY', temp: 20, feelsLike: 19, humidity: 55, windSpeed: 4.2, condition: 'Sunny',         icon: 'sunny',         isActive: false },
  { id: '3', city: 'Los Angeles', region: 'CA', temp: 26, feelsLike: 25, humidity: 40, windSpeed: 2.1, condition: 'Clear',         icon: 'sunny',         isActive: false },
  { id: '4', city: 'Miami',       region: 'FL', temp: 29, feelsLike: 32, humidity: 80, windSpeed: 5.0, condition: 'Rainy',         icon: 'rainy',         isActive: false },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
  const [theme, setTheme] = useState<'Auto' | 'Light' | 'Dark'>('Auto');
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<Record<string, ForecastResult | null>>({});

  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const activeLocation = locations.find((l) => l.isActive) ?? locations[0] ?? null;

  const refreshAllWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const updates = await Promise.all(
        locationsRef.current.map(async (loc) => {
          try {
            const w = await fetchCurrentWeather(loc.city);
            return { id: loc.id, w };
          } catch {
            return { id: loc.id, w: null };
          }
        })
      );
      setLocations((prev) =>
        prev.map((loc) => {
          const u = updates.find((u) => u.id === loc.id);
          if (!u?.w) return loc;
          return {
            ...loc,
            temp: u.w.temp,
            feelsLike: u.w.feelsLike,
            humidity: u.w.humidity,
            windSpeed: u.w.windSpeed,
            condition: u.w.condition,
            icon: u.w.icon,
          };
        })
      );
    } catch {
      setWeatherError("Couldn't refresh weather");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const loadForecast = useCallback(async (id: string, city: string) => {
    try {
      const forecast = await fetchForecast(city);
      setForecastData((prev) => ({ ...prev, [id]: forecast }));
    } catch {
      setForecastData((prev) => ({ ...prev, [id]: null }));
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    Parse.User.currentAsync().then((parseUser) => {
      if (parseUser) {
        setUser({ name: parseUser.get('name') || '', email: parseUser.get('email') || '' });
        setIsLoggedIn(true);
      }
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      let detectedId: string | null = null;

      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
          const w = await fetchCurrentWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          const city = w.city ?? 'Current Location';
          const region = w.region ?? '';
          const id = 'current';
          setLocations((prev) => {
            const withoutCurrent = prev.filter((l) => l.id !== id);
            const currentLoc = {
              id,
              city,
              region,
              temp: w.temp,
              feelsLike: w.feelsLike,
              humidity: w.humidity,
              windSpeed: w.windSpeed,
              condition: w.condition,
              icon: w.icon,
              isActive: true,
            };
            return [currentLoc, ...withoutCurrent.map((l) => ({ ...l, isActive: false }))];
          });
          detectedId = id;
          loadForecast(id, city);
        }
      } catch {
        // location permission denied or failed — fall back to default
      }

      refreshAllWeather();
      if (!detectedId) {
        const active = locationsRef.current.find((l) => l.isActive) ?? locationsRef.current[0];
        if (active) loadForecast(active.id, active.city);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const parseUser = await Parse.User.logIn(email.trim().toLowerCase(), password);
    setUser({ name: parseUser.get('name') || email.split('@')[0], email: parseUser.get('email') || email });
    setIsLoggedIn(true);
  };

  const signup = async (name: string, email: string, password: string) => {
    const parseUser = new Parse.User();
    parseUser.set('username', email.trim().toLowerCase());
    parseUser.set('email', email.trim().toLowerCase());
    parseUser.set('password', password);
    parseUser.set('name', name.trim());
    await parseUser.signUp();
    setUser({ name: name.trim(), email: email.trim().toLowerCase() });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await Parse.User.logOut();
    setIsLoggedIn(false);
    setUser(null);
  };

  const addLocation = async ({ city, region }: { city: string; region: string }) => {
    const id = Date.now().toString();
    const placeholder: Location = {
      id, city, region,
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0,
      condition: 'Loading…', icon: 'partly-cloudy', isActive: false,
    };
    setLocations((prev) => [...prev, placeholder]);
    try {
      const w = await fetchCurrentWeather(city);
      setLocations((prev) =>
        prev.map((l) => l.id === id ? { ...l, ...w } : l)
      );
    } catch {
      // keep placeholder if fetch fails
    }
  };

  const removeLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setForecastData((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setActiveLocation = (id: string) => {
    setLocations((prev) => prev.map((l) => ({ ...l, isActive: l.id === id })));
    const loc = locationsRef.current.find((l) => l.id === id);
    if (loc && forecastData[id] === undefined) {
      loadForecast(id, loc.city);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn, authLoading, user, locations, activeLocation,
        tempUnit, setTempUnit,
        theme, setTheme,
        weatherLoading, weatherError, forecastData,
        login, signup, logout,
        addLocation, removeLocation, setActiveLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
