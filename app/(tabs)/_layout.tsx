import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors, ThemeColors } from '../../utils/theme';

function TabIcon({ focused, emoji, label, c }: { focused: boolean; emoji: string; label: string; c: ThemeColors }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
      <Text
        style={[styles.tabLabel, { color: focused ? c.accent : c.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useApp();
  const c = useThemeColors(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: c.tabBarBorder,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="weather"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🌙" label="Weather" c={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🗺️" label="Places" c={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="⚙️" label="Settings" c={c} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 72,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
