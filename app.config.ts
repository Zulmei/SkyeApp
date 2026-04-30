import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Skye',
  slug: 'skye-weather',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'skye',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#0A0E1A',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.skye.weather',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0A0E1A',
    },
    package: 'com.skye.weather',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Skye needs your location to show local weather.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
