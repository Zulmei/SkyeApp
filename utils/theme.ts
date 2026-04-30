import { useColorScheme } from 'react-native';

export type ThemeSetting = 'Auto' | 'Light' | 'Dark';

export interface ThemeColors {
  isDark: boolean;
  gradientBg: [string, string, string];
  tabBarBg: string;
  tabBarBorder: string;
  cardBg: string;
  cardBorder: string;
  activeCardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
}

const DARK: ThemeColors = {
  isDark: true,
  gradientBg: ['#0A0E1A', '#0D1528', '#0A1020'],
  tabBarBg: '#0D1120',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  cardBg: 'rgba(255,255,255,0.05)',
  cardBorder: 'rgba(255,255,255,0.08)',
  activeCardBg: 'rgba(79,195,247,0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8899AA',
  textMuted: '#556677',
  accent: '#4FC3F7',
  accentText: '#0A0E1A',
};

const LIGHT: ThemeColors = {
  isDark: false,
  gradientBg: ['#E8F4FD', '#F0F8FF', '#EAF3FB'],
  tabBarBg: '#EBF5FF',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  cardBg: 'rgba(10,14,26,0.05)',
  cardBorder: 'rgba(10,14,26,0.10)',
  activeCardBg: 'rgba(2,136,209,0.08)',
  textPrimary: '#0A0E1A',
  textSecondary: '#445566',
  textMuted: '#667788',
  accent: '#0288D1',
  accentText: '#FFFFFF',
};

export function useThemeColors(setting: ThemeSetting): ThemeColors {
  const system = useColorScheme();
  if (setting === 'Light') return LIGHT;
  if (setting === 'Dark') return DARK;
  return system === 'light' ? LIGHT : DARK;
}
