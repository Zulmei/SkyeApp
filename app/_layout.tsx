import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider } from '../context/AppContext';
import { useApp } from '../context/AppContext';

function RootNavigator() {
  const { isLoggedIn, authLoading } = useApp();

  useEffect(() => {
    if (!authLoading) {
      if (isLoggedIn) {
        router.replace('/(tabs)/weather');
      } else {
        router.replace('/');
      }
    }
  }, [isLoggedIn, authLoading]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4FC3F7" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
