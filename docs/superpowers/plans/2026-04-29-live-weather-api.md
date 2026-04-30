# Live Weather API Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock weather data with live OpenWeatherMap data, make the °C/°F setting work globally across every screen, and fix tab label wrapping.

**Architecture:** AppContext owns all weather state and fetches from OpenWeatherMap on mount and on active-location change. All temperatures are stored as °C internally and converted at display time via `utils/temperature.ts`. A `.env` file holds the API key (never committed).

**Tech Stack:** OpenWeatherMap free-tier API (`/weather`, `/forecast`), React Native, TypeScript, Expo SDK 54, Jest + ts-jest (utility tests only)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `utils/temperature.ts` | Pure °C↔°F conversion helpers |
| Create | `services/weatherApi.ts` | OWM fetch functions + icon mapping |
| Create | `.env` | API key (not committed) |
| Create | `__tests__/temperature.test.ts` | Unit tests for temperature utils |
| Create | `jest.config.js` | Jest configuration |
| Modify | `context/AppContext.tsx` | Add tempUnit, weather state, fetch logic |
| Modify | `app/(tabs)/weather.tsx` | Use live data + formatTemp |
| Modify | `app/(tabs)/places.tsx` | Live temps per card + formatTemp |
| Modify | `app/(tabs)/settings.tsx` | Read/write tempUnit from context |
| Modify | `app/(tabs)/_layout.tsx` | Fix tab label wrapping |
| Modify | `package.json` | Add test script |
| Delete | `data/weather.ts` | Remove mock data |

---

## Task 1: Configure Jest and write failing temperature tests

**Files:**
- Create: `jest.config.js`
- Create: `__tests__/temperature.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Jest dependencies**

```bash
npm install --save-dev jest ts-jest @types/jest
```

Expected: packages added, no errors.

- [ ] **Step 2: Create `jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  roots: ['<rootDir>/__tests__'],
};
```

- [ ] **Step 3: Add test script to `package.json` scripts section**

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest"
},
```

- [ ] **Step 4: Create `__tests__/temperature.test.ts`**

```typescript
import { toDisplay, formatTemp } from '../utils/temperature';

describe('toDisplay', () => {
  it('returns Celsius unchanged', () => {
    expect(toDisplay(22, 'C')).toBe(22);
  });
  it('converts 0°C to 32°F', () => {
    expect(toDisplay(0, 'F')).toBe(32);
  });
  it('converts 100°C to 212°F', () => {
    expect(toDisplay(100, 'F')).toBe(212);
  });
  it('converts 22°C to 72°F', () => {
    expect(toDisplay(22, 'F')).toBe(72);
  });
  it('rounds fractional results', () => {
    expect(toDisplay(21, 'F')).toBe(70);
  });
});

describe('formatTemp', () => {
  it('formats Celsius with degree symbol', () => {
    expect(formatTemp(22, 'C')).toBe('22°');
  });
  it('formats Fahrenheit with degree symbol', () => {
    expect(formatTemp(0, 'F')).toBe('32°');
  });
});
```

- [ ] **Step 5: Run tests — confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../utils/temperature'`

- [ ] **Step 6: Commit**

```bash
git add jest.config.js __tests__/temperature.test.ts package.json package-lock.json
git commit -m "test: add Jest setup and failing temperature utility tests"
```

---

## Task 2: Implement `utils/temperature.ts`

**Files:**
- Create: `utils/temperature.ts`

- [ ] **Step 1: Create the file**

```typescript
export function toDisplay(tempC: number, unit: 'F' | 'C'): number {
  if (unit === 'F') return Math.round(tempC * 9 / 5 + 32);
  return Math.round(tempC);
}

export function formatTemp(tempC: number, unit: 'F' | 'C'): string {
  return `${toDisplay(tempC, unit)}°`;
}
```

- [ ] **Step 2: Run tests — confirm they pass**

```bash
npm test
```

Expected: PASS — 7 tests passing.

- [ ] **Step 3: Commit**

```bash
git add utils/temperature.ts
git commit -m "feat: add temperature conversion utilities"
```

---

## Task 3: Add `.env` and update `.gitignore`

**Files:**
- Create: `.env`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env` at project root**

```
EXPO_PUBLIC_OPENWEATHER_API_KEY=paste_your_key_here
```

- [ ] **Step 2: Add `.env` to `.gitignore`**

Open `.gitignore` and append:
```
.env
```

- [ ] **Step 3: Commit only `.gitignore` (never commit `.env`)**

```bash
git add .gitignore
git commit -m "chore: ignore .env file"
```

---

## Task 4: Create `services/weatherApi.ts`

**Files:**
- Create: `services/weatherApi.ts`

- [ ] **Step 1: Create the file**

```typescript
const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';

function mapIcon(code: string): string {
  if (code === '01d') return 'sunny';
  if (code === '01n') return 'night';
  if (['02d', '02n', '03d', '03n'].includes(code)) return 'partly-cloudy';
  if (['04d', '04n'].includes(code)) return 'cloudy';
  if (['09d', '09n', '10d', '10n'].includes(code)) return 'rainy';
  if (['11d', '11n'].includes(code)) return 'stormy';
  if (['13d', '13n'].includes(code)) return 'snowy';
  return 'partly-cloudy';
}

export interface CurrentWeather {
  temp: number;      // °C, rounded
  feelsLike: number; // °C, rounded
  humidity: number;  // %
  windSpeed: number; // m/s
  condition: string;
  icon: string;
}

export interface HourlyEntry {
  time: string;
  temp: number; // °C
  icon: string;
}

export interface DailyEntry {
  day: string;
  icon: string;
  low: number;  // °C
  high: number; // °C
}

export interface ForecastResult {
  hourly: HourlyEntry[];
  weekly: DailyEntry[];
}

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
  const res = await fetch(
    `${BASE}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const d = await res.json();
  const desc: string = d.weather[0].description;
  return {
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    windSpeed: d.wind.speed,
    condition: desc.charAt(0).toUpperCase() + desc.slice(1),
    icon: mapIcon(d.weather[0].icon),
  };
}

export async function fetchForecast(city: string): Promise<ForecastResult> {
  const res = await fetch(
    `${BASE}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Forecast fetch failed: ${res.status}`);
  const d = await res.json();

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hourly: HourlyEntry[] = d.list.slice(0, 8).map((e: any, i: number) => {
    const date = new Date(e.dt * 1000);
    const h = date.getHours();
    const label = i === 0 ? 'Now' : `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
    return { time: label, temp: Math.round(e.main.temp), icon: mapIcon(e.weather[0].icon) };
  });

  const buckets: Record<string, { temps: number[]; icons: string[] }> = {};
  d.list.forEach((e: any) => {
    const key = DAY_NAMES[new Date(e.dt * 1000).getDay()];
    if (!buckets[key]) buckets[key] = { temps: [], icons: [] };
    buckets[key].temps.push(Math.round(e.main.temp));
    buckets[key].icons.push(e.weather[0].icon);
  });

  const weekly: DailyEntry[] = Object.entries(buckets).slice(0, 7).map(([day, b]) => ({
    day,
    icon: mapIcon(b.icons[Math.floor(b.icons.length / 2)]),
    low: Math.min(...b.temps),
    high: Math.max(...b.temps),
  }));

  return { hourly, weekly };
}
```

- [ ] **Step 2: Commit**

```bash
git add services/weatherApi.ts
git commit -m "feat: add OpenWeatherMap API service"
```

---

## Task 5: Update `context/AppContext.tsx`

**Files:**
- Modify: `context/AppContext.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { fetchCurrentWeather, fetchForecast, ForecastResult } from '../services/weatherApi';

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
  weatherLoading: boolean;
  weatherError: string | null;
  forecastData: Record<string, ForecastResult | null>;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
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
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
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
          return { ...loc, temp: u.w.temp, feelsLike: u.w.feelsLike, humidity: u.w.humidity, windSpeed: u.w.windSpeed, condition: u.w.condition, icon: u.w.icon };
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

  useEffect(() => {
    const active = locationsRef.current.find((l) => l.isActive) ?? locationsRef.current[0];
    refreshAllWeather();
    if (active) loadForecast(active.id, active.city);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (email: string, _password: string) => {
    setUser({ name: 'Zulmei', email });
    setIsLoggedIn(true);
  };

  const signup = (name: string, email: string, _password: string) => {
    setUser({ name, email });
    setIsLoggedIn(true);
  };

  const logout = () => {
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
      // keep placeholder values if fetch fails
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
        isLoggedIn, user, locations, activeLocation,
        tempUnit, setTempUnit,
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
```

- [ ] **Step 2: Commit**

```bash
git add context/AppContext.tsx
git commit -m "feat: add weather state, tempUnit, and OWM fetch logic to AppContext"
```

---

## Task 6: Update `app/(tabs)/weather.tsx`

**Files:**
- Modify: `app/(tabs)/weather.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import WeatherIcon from '../../components/WeatherIcon';
import { formatTemp } from '../../utils/temperature';

export default function WeatherScreen() {
  const { user, activeLocation: loc, tempUnit, weatherLoading, weatherError, forecastData } = useApp();
  const forecast = loc ? forecastData[loc.id] : null;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning,';
    if (h < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <LinearGradient colors={['#0A0E1A', '#0D1528', '#0A1020']} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name || 'Zulmei'}</Text>
          </View>
          <View style={styles.headerRight}>
            {weatherLoading && (
              <ActivityIndicator size="small" color="#4FC3F7" />
            )}
            <TouchableOpacity style={styles.settingsBtn}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location + Main Temp */}
        <View style={styles.mainWeather}>
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationName}>
              {loc?.city}, {loc?.region}
            </Text>
          </View>

          <View style={styles.tempRow}>
            <Text style={styles.bigTemp}>
              {loc ? formatTemp(loc.temp, tempUnit) : '--°'}
            </Text>
            <WeatherIcon type={loc?.icon || 'partly-cloudy'} size={52} />
          </View>

          <Text style={styles.condition}>{loc?.condition}</Text>
          {weatherError && (
            <Text style={styles.errorBanner}>Couldn't refresh weather</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🌡️</Text>
            <Text style={styles.statLabel}>FEELS</Text>
            <Text style={styles.statValue}>
              {loc ? formatTemp(loc.feelsLike, tempUnit) : '--°'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💧</Text>
            <Text style={styles.statLabel}>HUMIDITY</Text>
            <Text style={styles.statValue}>{loc?.humidity ?? '--'}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💨</Text>
            <Text style={styles.statLabel}>WIND</Text>
            <Text style={styles.statValue}>
              {loc ? `${Math.round(loc.windSpeed * 2.237)} mph` : '--'}
            </Text>
          </View>
        </View>

        {/* Today Hourly */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.sectionDate}>{todayLabel}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyScroll}
        >
          {forecast?.hourly.map((item, idx) => (
            <View
              key={idx}
              style={[styles.hourlyCard, idx === 0 && styles.hourlyCardActive]}
            >
              <Text style={[styles.hourlyTime, idx === 0 && styles.hourlyTimeActive]}>
                {item.time}
              </Text>
              <WeatherIcon type={item.icon} size={26} />
              <Text style={[styles.hourlyTemp, idx === 0 && styles.hourlyTempActive]}>
                {formatTemp(item.temp, tempUnit)}
              </Text>
            </View>
          ))}
          {!forecast && (
            <View style={styles.forecastPlaceholder}>
              <ActivityIndicator size="small" color="#4FC3F7" />
            </View>
          )}
        </ScrollView>

        {/* 7-Day Forecast */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          7-Day Forecast
        </Text>

        <View style={styles.weeklyCard}>
          {forecast?.weekly.map((item, idx) => (
            <View
              key={idx}
              style={[styles.weekRow, idx < (forecast.weekly.length - 1) && styles.weekRowBorder]}
            >
              <Text style={styles.weekDay}>{item.day}</Text>
              <WeatherIcon type={item.icon} size={22} />
              <View style={styles.weekTempBar}>
                <View
                  style={[
                    styles.tempBar,
                    {
                      backgroundColor:
                        item.icon === 'rainy'
                          ? '#4FC3F7'
                          : item.icon === 'cloudy'
                          ? '#778899'
                          : `hsl(${30 + item.high}, 90%, 55%)`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.weekTemps}>
                {formatTemp(item.low, tempUnit)} / {formatTemp(item.high, tempUnit)}
              </Text>
            </View>
          ))}
          {!forecast && (
            <View style={styles.forecastPlaceholder}>
              <ActivityIndicator size="small" color="#4FC3F7" />
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#8899AA',
    fontWeight: '400',
  },
  userName: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18 },
  mainWeather: {
    alignItems: 'center',
    marginBottom: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationPin: { fontSize: 16 },
  locationName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bigTemp: {
    fontSize: 96,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -4,
    lineHeight: 110,
  },
  condition: {
    fontSize: 20,
    color: '#8899AA',
    fontWeight: '500',
    marginTop: 4,
  },
  errorBanner: {
    fontSize: 12,
    color: '#FF6B7A',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  statIcon: { fontSize: 18 },
  statLabel: {
    fontSize: 10,
    color: '#556677',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionDate: {
    fontSize: 14,
    color: '#8899AA',
  },
  hourlyScroll: {
    paddingRight: 8,
    gap: 10,
  },
  hourlyCard: {
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  hourlyCardActive: {
    borderColor: '#4FC3F7',
    borderWidth: 2,
    backgroundColor: 'rgba(79,195,247,0.08)',
  },
  hourlyTime: {
    fontSize: 12,
    color: '#8899AA',
    fontWeight: '500',
  },
  hourlyTimeActive: { color: '#FFFFFF' },
  hourlyTemp: {
    fontSize: 15,
    color: '#8899AA',
    fontWeight: '600',
  },
  hourlyTempActive: { color: '#FFFFFF' },
  forecastPlaceholder: {
    width: 70,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  weekRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  weekDay: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    width: 36,
  },
  weekTempBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tempBar: {
    height: '100%',
    width: '70%',
    borderRadius: 3,
  },
  weekTemps: {
    fontSize: 14,
    color: '#AABBCC',
    fontWeight: '500',
    width: 90,
    textAlign: 'right',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/weather.tsx
git commit -m "feat: wire weather screen to live API data and temperature unit"
```

---

## Task 7: Update `app/(tabs)/places.tsx`

**Files:**
- Modify: `app/(tabs)/places.tsx`

- [ ] **Step 1: Replace the entire file**

Key changes:
- Remove `SEARCH_CITIES` import; inline a `CITY_LIST` with only city/region
- Get `tempUnit` from `useApp()`
- Use `formatTemp(loc.temp, tempUnit)` on each location card
- Change `handleAdd` to pass `{ city, region }` only
- Show `--°` in search results (no live data for untracked cities)

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import WeatherIcon from '../../components/WeatherIcon';
import { formatTemp } from '../../utils/temperature';

const CITY_LIST = [
  { city: 'Chicago',     region: 'IL' },
  { city: 'Houston',     region: 'TX' },
  { city: 'Phoenix',     region: 'AZ' },
  { city: 'Philadelphia',region: 'PA' },
  { city: 'San Antonio', region: 'TX' },
  { city: 'Dallas',      region: 'TX' },
  { city: 'Denver',      region: 'CO' },
  { city: 'Boston',      region: 'MA' },
];

export default function PlacesScreen() {
  const { locations, removeLocation, setActiveLocation, addLocation, tempUnit } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredCities = CITY_LIST.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !locations.find((l) => l.city === c.city)
  );

  const handleAdd = (city: { city: string; region: string }) => {
    addLocation({ city: city.city, region: city.region });
    setSearchQuery('');
    setShowResults(false);
  };

  const handleDelete = (id: string, cityName: string) => {
    Alert.alert('Remove Location', `Remove ${cityName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeLocation(id) },
    ]);
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#0D1528', '#0A1020']} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Places</Text>
          <Text style={styles.subtitle}>Manage your saved locations</Text>
        </View>

        {/* Location Cards */}
        <View style={styles.locationsList}>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.locationCard, loc.isActive && styles.locationCardActive]}
              onPress={() => setActiveLocation(loc.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <View style={styles.cardTitleRow}>
                  {loc.isActive && <Text style={styles.pinIcon}>📍 </Text>}
                  <Text style={styles.cardCity}>
                    {loc.city}, {loc.region}
                  </Text>
                </View>
                <Text style={styles.cardSub}>
                  {loc.isActive ? 'Current location' : loc.condition}
                </Text>
              </View>

              <View style={styles.cardRight}>
                <WeatherIcon type={loc.icon} size={26} />
                <View style={styles.tempConditionCol}>
                  <Text style={styles.cardTemp}>{formatTemp(loc.temp, tempUnit)}</Text>
                  <Text style={styles.cardCondition}>{loc.condition}</Text>
                </View>
                {!loc.isActive && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(loc.id, `${loc.city}, ${loc.region}`)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Location Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowResults(!showResults)}
          activeOpacity={0.8}
        >
          <View style={styles.addBtnInner}>
            <Text style={styles.addBtnPlus}>+</Text>
            <Text style={styles.addBtnText}>Add Location</Text>
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city..."
            placeholderTextColor="#4A5568"
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setShowResults(t.length > 0);
            }}
            selectionColor="#4FC3F7"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showResults && filteredCities.length > 0 && (
          <View style={styles.searchResults}>
            {filteredCities.map((city, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.searchResultItem,
                  idx < filteredCities.length - 1 && styles.searchResultBorder,
                ]}
                onPress={() => handleAdd(city)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.searchCityName}>{city.city}, {city.region}</Text>
                  <Text style={styles.searchCondition}>Tap to add</Text>
                </View>
                <Text style={styles.searchTemp}>--°</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: { marginBottom: 24 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8899AA',
    marginTop: 4,
  },
  locationsList: { gap: 10, marginBottom: 14 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  locationCardActive: {
    borderColor: '#4FC3F7',
    borderWidth: 2,
    backgroundColor: 'rgba(79,195,247,0.06)',
  },
  cardLeft: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: { fontSize: 14 },
  cardCity: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 13,
    color: '#8899AA',
    marginTop: 3,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempConditionCol: {
    alignItems: 'flex-end',
  },
  cardTemp: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardCondition: {
    fontSize: 12,
    color: '#8899AA',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220,53,69,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteBtnText: { fontSize: 16 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  addBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  addBtnPlus: {
    fontSize: 22,
    color: '#4FC3F7',
    fontWeight: '300',
    lineHeight: 26,
    backgroundColor: 'rgba(79,195,247,0.15)',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
  },
  addBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  clearIcon: {
    fontSize: 14,
    color: '#556677',
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  searchResultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchCityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchCondition: {
    fontSize: 12,
    color: '#8899AA',
    marginTop: 2,
  },
  searchTemp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#556677',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/places.tsx
git commit -m "feat: show live temperatures per location card in Places tab"
```

---

## Task 8: Update `app/(tabs)/settings.tsx`

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Remove local tempUnit state, read from context**

Replace line 17:
```typescript
const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
```
With (added to the existing destructure on line 16):
```typescript
const { user, logout, tempUnit, setTempUnit } = useApp();
```

The full updated top of the component (lines 15–20) becomes:

```typescript
export default function SettingsScreen() {
  const { user, logout, tempUnit, setTempUnit } = useApp();
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [dailyForecast, setDailyForecast] = useState(false);
  const [theme, setTheme] = useState<'Auto' | 'Light' | 'Dark'>('Auto');
```

No other changes needed — the UI already uses `tempUnit` and calls `setTempUnit`.

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/settings.tsx
git commit -m "feat: connect temperature unit toggle to global AppContext state"
```

---

## Task 9: Fix tab label wrapping in `app/(tabs)/_layout.tsx`

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add `numberOfLines` to the label Text and fix tabItem width**

In the `TabIcon` component, change the label `Text` from:
```tsx
<Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
```
To:
```tsx
<Text
  style={[styles.tabLabel, focused && styles.tabLabelActive]}
  numberOfLines={1}
>
  {label}
</Text>
```

In `StyleSheet.create`, update `tabItem`:
```typescript
tabItem: {
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  width: 72,
},
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "fix: prevent tab labels from wrapping onto two lines"
```

---

## Task 10: Remove `data/weather.ts`

**Files:**
- Delete: `data/weather.ts`

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "data/weather" /Users/zulmei/Dev/School/Skye/SkyeApp/app /Users/zulmei/Dev/School/Skye/SkyeApp/components /Users/zulmei/Dev/School/Skye/SkyeApp/context
```

Expected: no output (all imports removed in Tasks 6 and 7).

- [ ] **Step 2: Delete the file**

```bash
rm /Users/zulmei/Dev/School/Skye/SkyeApp/data/weather.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove mock weather data file"
```

---

## Self-Review

- **Spec coverage:** `.env` ✓, `weatherApi.ts` ✓, icon mapping ✓, `temperature.ts` ✓, AppContext tempUnit ✓, weatherLoading ✓, weatherError ✓, forecastData ✓, fetch on mount ✓, fetch on location add ✓, fetch on active change ✓, weather.tsx live data ✓, places.tsx live temps ✓, settings.tsx context tempUnit ✓, tab label fix ✓, data/weather.ts deleted ✓
- **Placeholders:** None — every step contains complete code.
- **Type consistency:** `ForecastResult` exported from `weatherApi.ts` and imported in `AppContext`. `formatTemp` imported from `utils/temperature` in weather.tsx and places.tsx. `addLocation` signature `{ city, region }` matches call in places.tsx `handleAdd`.
