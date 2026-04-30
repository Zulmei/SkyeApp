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
  city?: string;
  region?: string;
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

function parseWeatherResponse(d: any): CurrentWeather {
  const desc: string = d.weather[0].description;
  return {
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    windSpeed: d.wind.speed,
    condition: desc.charAt(0).toUpperCase() + desc.slice(1),
    icon: mapIcon(d.weather[0].icon),
    city: d.name,
    region: d.sys?.country,
  };
}

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
  const res = await fetch(
    `${BASE}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  return parseWeatherResponse(await res.json());
}

export async function fetchCurrentWeatherByCoords(lat: number, lon: number): Promise<CurrentWeather> {
  const res = await fetch(
    `${BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  return parseWeatherResponse(await res.json());
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
