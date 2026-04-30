# Live Weather API Integration — Design Spec
Date: 2026-04-29

## Overview

Integrate OpenWeatherMap free-tier API to replace all mock weather data with live data. Also fix tab label wrapping and make the temperature unit setting work globally.

## Goals

1. All weather data (current conditions, hourly, 7-day) comes from OpenWeatherMap.
2. Every saved location in the Places tab shows its own live temperature.
3. Selecting °C in Settings converts all displayed temperatures across every screen.
4. Tab labels "Weather" and "Settings" no longer wrap onto two lines.

## Architecture

### New files

**`.env`**
```
EXPO_PUBLIC_OPENWEATHER_API_KEY=paste_key_here
```
Read via `process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY` (Expo's `EXPO_PUBLIC_` prefix makes it available in the JS bundle).

**`services/weatherApi.ts`**
Two exported async functions:
- `fetchCurrentWeather(city: string)` — hits `/weather?q={city}&units=metric&appid={key}`, returns `{ temp, feelsLike, humidity, windSpeed, condition, icon }` (all temps in °C).
- `fetchForecast(city: string)` — hits `/forecast?q={city}&units=metric&appid={key}`, returns `{ hourly, weekly }` where hourly is the first 8 three-hour slots and weekly is 7 days aggregated from the 5-day/3-hour data (min/max per day).

**`utils/temperature.ts`**
```ts
export function toDisplay(tempC: number, unit: 'F' | 'C'): number
export function formatTemp(tempC: number, unit: 'F' | 'C'): string  // "72°" or "22°"
```
All screens import these — no inline conversion math anywhere.

### Modified files

**`context/AppContext.tsx`**
New state added:
```ts
tempUnit: 'F' | 'C'                          // default 'F'
setTempUnit: (unit: 'F' | 'C') => void
weatherLoading: boolean
weatherError: string | null
forecastData: Record<string, ForecastEntry | null>
```
Where `ForecastEntry` is:
```ts
{
  hourly: { time: string; temp: number; icon: string }[]
  weekly: { day: string; icon: string; low: number; high: number }[]
}
```

`Location.temp` stores °C from the API going forward.

Fetch behaviour:
- On mount: fetch current weather for all locations, fetch forecast for the active location.
- When active location changes: fetch forecast for the new active location if not already cached.
- When a location is added: fetch its current weather immediately.
- Forecasts are cached in `forecastData` by location ID for the session (no TTL needed for a school project).

**`data/weather.ts`** — deleted entirely.

**`app/(tabs)/weather.tsx`**
- Reads `activeLocation.temp`, `forecastData[activeLocation.id]`, `tempUnit`, `weatherLoading`, `weatherError` from context.
- Wraps all temperature display through `formatTemp`.
- Shows a loading state (dimmed `--°`) while `weatherLoading` is true and no cached data exists.
- Shows a small `"Couldn't refresh"` banner when `weatherError` is non-null but stale data is present.
- `HOURLY` and `WEEKLY` imports from `data/weather.ts` removed.

**`app/(tabs)/places.tsx`**
- Each location card reads `loc.temp` (now live °C from context) and wraps through `formatTemp(loc.temp, tempUnit)`.
- Removes `SEARCH_CITIES` import; search results will show a placeholder temp of `--` since we don't pre-fetch search candidates (fetching 8 cities on every keystroke would burn the free API quota).

**`app/(tabs)/settings.tsx`**
- Removes local `tempUnit` / `setTempUnit` state.
- Reads `tempUnit` and calls `setTempUnit` from `useApp()`.

**`app/(tabs)/_layout.tsx`**
- Adds `width: 72` and `numberOfLines={1}` to the tab label `Text` to prevent wrapping.

## Data flow

```
.env key
  └─ weatherApi.ts (fetch)
       └─ AppContext (store + expose)
            ├─ weather.tsx   (read + formatTemp)
            ├─ places.tsx    (read + formatTemp)
            └─ settings.tsx  (read/write tempUnit)
```

## Error handling

- If a fetch throws (network error, bad key, city not found), `weatherError` is set to a short message string and the existing data is preserved.
- The Weather screen shows a non-blocking `"Couldn't refresh weather"` banner below the condition text when `weatherError` is set.
- Individual location fetches in Places fail silently per-card (card keeps last known temp).

## OWM icon code mapping

`weatherApi.ts` maps OWM icon codes to the app's internal icon strings before returning data:

| OWM codes | App icon |
|-----------|----------|
| `01d` | `sunny` |
| `01n` | `night` |
| `02d`, `02n`, `03d`, `03n` | `partly-cloudy` |
| `04d`, `04n` | `cloudy` |
| `09d`, `09n`, `10d`, `10n` | `rainy` |
| `11d`, `11n` | `stormy` |
| `13d`, `13n` | `snowy` |
| anything else | `partly-cloudy` |

## Out of scope

- Persisting weather data across app restarts (AsyncStorage).
- Push notifications for weather alerts.
- Search-result live temperatures (would burn free API quota).
- Geolocation / auto-detect current location.
