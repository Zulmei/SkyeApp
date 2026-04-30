import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useThemeColors } from '../../utils/theme';

export default function SettingsScreen() {
  const { user, logout, tempUnit, setTempUnit, theme, setTheme } = useApp();
  const c = useThemeColors(theme);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [dailyForecast, setDailyForecast] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'Z';

  return (
    <LinearGradient colors={[...c.gradientBg]} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Customize your experience</Text>
        </View>

        <View style={[styles.userCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: c.accent }]}>
            <Text style={[styles.avatarText, { color: c.accentText }]}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: c.textPrimary }]}>{user?.name || 'Zulmei'}</Text>
            <Text style={[styles.userEmail, { color: c.textSecondary }]}>{user?.email || 'zulmei@example.com'}</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: c.cardBg }]}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>UNITS</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingTitle, { color: c.textPrimary }]}>Temperature</Text>
              <Text style={[styles.settingDesc, { color: c.textSecondary }]}>Choose your preferred unit</Text>
            </View>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitBtn, { backgroundColor: c.cardBg, borderColor: c.cardBorder }, tempUnit === 'F' && { backgroundColor: c.accent, borderColor: c.accent }]}
                onPress={() => setTempUnit('F')}
              >
                <Text style={[styles.unitBtnText, { color: c.textSecondary }, tempUnit === 'F' && { color: c.accentText }]}>
                  °F
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, { backgroundColor: c.cardBg, borderColor: c.cardBorder }, tempUnit === 'C' && { backgroundColor: c.accent, borderColor: c.accent }]}
                onPress={() => setTempUnit('C')}
              >
                <Text style={[styles.unitBtnText, { color: c.textSecondary }, tempUnit === 'C' && { color: c.accentText }]}>
                  °C
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: c.cardBorder }]}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: c.textPrimary }]}>Weather Alerts</Text>
              <Text style={[styles.settingDesc, { color: c.textSecondary }]}>Severe weather notifications</Text>
            </View>
            <Switch
              value={weatherAlerts}
              onValueChange={setWeatherAlerts}
              trackColor={{ false: c.cardBorder, true: c.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: c.textPrimary }]}>Daily Forecast</Text>
              <Text style={[styles.settingDesc, { color: c.textSecondary }]}>Morning weather summary</Text>
            </View>
            <Switch
              value={dailyForecast}
              onValueChange={setDailyForecast}
              trackColor={{ false: c.cardBorder, true: c.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>THEME</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={styles.themeRow}>
            {(['Auto', 'Light', 'Dark'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.themeBtn, { backgroundColor: c.cardBg, borderColor: c.cardBorder }, theme === t && { backgroundColor: c.accent, borderColor: c.accent }]}
                onPress={() => setTheme(t)}
              >
                <Text style={[styles.themeBtnText, { color: c.textSecondary }, theme === t && { color: c.accentText }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          {['Privacy Policy', 'Terms of Service', 'About Skye'].map((item, idx) => (
            <TouchableOpacity
              key={item}
              style={[styles.menuRow, idx < 2 && { borderBottomWidth: 1, borderBottomColor: c.cardBorder }]}
            >
              <Text style={[styles.menuText, { color: c.textPrimary }]}>{item}</Text>
              <Text style={[styles.menuChevron, { color: c.textSecondary }]}>›</Text>
            </TouchableOpacity>
          ))}

          <View style={[styles.divider, { backgroundColor: c.cardBorder }]} />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>⎋</Text>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  userCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 24, gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  editIcon: { fontSize: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingTextCol: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  unitToggle: { flexDirection: 'row', gap: 6 },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  unitBtnText: { fontSize: 14, fontWeight: '600' },
  themeRow: { flexDirection: 'row', padding: 12, gap: 8 },
  themeBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  themeBtnText: { fontSize: 14, fontWeight: '600' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
  menuText: { fontSize: 15, fontWeight: '500' },
  menuChevron: { fontSize: 20 },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 12, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(220,53,69,0.15)', borderWidth: 1, borderColor: 'rgba(220,53,69,0.3)', gap: 8 },
  logoutIcon: { fontSize: 16, color: '#FF6B7A' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FF6B7A' },
});
