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
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
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
  extra: {
    eas: {
      projectId: '74ea6220-c08c-4771-9073-7701107a0743',
    },
  },
});
