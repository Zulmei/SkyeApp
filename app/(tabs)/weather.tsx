import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import WeatherIcon from '../../components/WeatherIcon';
import { formatTemp } from '../../utils/temperature';
import { useThemeColors } from '../../utils/theme';

export default function WeatherScreen() {
  const { user, activeLocation: loc, tempUnit, weatherLoading, weatherError, forecastData, theme } = useApp();
  const c = useThemeColors(theme);
  const forecast = loc ? forecastData[loc.id] : null;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning,';
    if (h < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <LinearGradient colors={[...c.gradientBg]} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: c.textPrimary }]}>{user?.name || 'Zulmei'}</Text>
          </View>
          {weatherLoading && <ActivityIndicator size="small" color={c.accent} />}
        </View>

        <View style={styles.mainWeather}>
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={[styles.locationName, { color: c.textPrimary }]}>
              {loc?.city}, {loc?.region}
            </Text>
          </View>
          <View style={styles.tempRow}>
            <Text style={[styles.bigTemp, { color: c.textPrimary }]}>
              {loc ? formatTemp(loc.temp, tempUnit) : '--°'}
            </Text>
            <WeatherIcon type={loc?.icon || 'partly-cloudy'} size={52} />
          </View>
          <Text style={[styles.condition, { color: c.textSecondary }]}>{loc?.condition}</Text>
          {weatherError && <Text style={styles.errorBanner}>Couldn't refresh weather</Text>}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={styles.statIcon}>🌡️</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>FEELS</Text>
            <Text style={[styles.statValue, { color: c.textPrimary }]}>
              {loc ? formatTemp(loc.feelsLike, tempUnit) : '--°'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={styles.statIcon}>💧</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>HUMIDITY</Text>
            <Text style={[styles.statValue, { color: c.textPrimary }]}>{loc?.humidity ?? '--'}%</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={styles.statIcon}>💨</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>WIND</Text>
            <Text style={[styles.statValue, { color: c.textPrimary }]}>
              {loc ? `${Math.round(loc.windSpeed * 2.237)} mph` : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Today</Text>
          <Text style={[styles.sectionDate, { color: c.textSecondary }]}>{todayLabel}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
          {forecast?.hourly.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.hourlyCard,
                { backgroundColor: c.cardBg, borderColor: c.cardBorder },
                idx === 0 && { borderColor: c.accent, borderWidth: 2, backgroundColor: c.activeCardBg },
              ]}
            >
              <Text style={[styles.hourlyTime, { color: idx === 0 ? c.textPrimary : c.textSecondary }]}>
                {item.time}
              </Text>
              <WeatherIcon type={item.icon} size={26} />
              <Text style={[styles.hourlyTemp, { color: idx === 0 ? c.textPrimary : c.textSecondary }]}>
                {formatTemp(item.temp, tempUnit)}
              </Text>
            </View>
          ))}
          {!forecast && (
            <View style={styles.forecastPlaceholder}>
              <ActivityIndicator size="small" color={c.accent} />
            </View>
          )}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: c.textPrimary, marginTop: 24, marginBottom: 12 }]}>
          7-Day Forecast
        </Text>

        <View style={[styles.weeklyCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          {forecast?.weekly.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.weekRow,
                idx < (forecast.weekly.length - 1) && { borderBottomWidth: 1, borderBottomColor: c.cardBorder },
              ]}
            >
              <Text style={[styles.weekDay, { color: c.textPrimary }]}>{item.day}</Text>
              <WeatherIcon type={item.icon} size={22} />
              <View style={[styles.weekTempBar, { backgroundColor: c.cardBorder }]}>
                <View
                  style={[
                    styles.tempBar,
                    {
                      backgroundColor:
                        item.icon === 'rainy' ? c.accent
                        : item.icon === 'cloudy' ? '#778899'
                        : `hsl(${30 + item.high}, 90%, 55%)`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.weekTemps, { color: c.textSecondary }]}>
                {formatTemp(item.low, tempUnit)} / {formatTemp(item.high, tempUnit)}
              </Text>
            </View>
          ))}
          {!forecast && (
            <View style={styles.forecastPlaceholder}>
              <ActivityIndicator size="small" color={c.accent} />
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
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 14, fontWeight: '400' },
  userName: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  mainWeather: { alignItems: 'center', marginBottom: 28 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  locationPin: { fontSize: 16 },
  locationName: { fontSize: 26, fontWeight: '700', letterSpacing: 0.3 },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bigTemp: { fontSize: 96, fontWeight: '800', letterSpacing: -4, lineHeight: 110 },
  condition: { fontSize: 20, fontWeight: '500', marginTop: 4 },
  errorBanner: { fontSize: 12, color: '#FF6B7A', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, gap: 4 },
  statIcon: { fontSize: 18 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionDate: { fontSize: 14 },
  hourlyScroll: { paddingRight: 8, gap: 10 },
  hourlyCard: { width: 70, borderRadius: 20, paddingVertical: 14, alignItems: 'center', gap: 8, borderWidth: 1 },
  hourlyTime: { fontSize: 12, fontWeight: '500' },
  hourlyTemp: { fontSize: 15, fontWeight: '600' },
  forecastPlaceholder: { width: 70, height: 100, justifyContent: 'center', alignItems: 'center' },
  weeklyCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  weekDay: { fontSize: 15, fontWeight: '600', width: 36 },
  weekTempBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  tempBar: { height: '100%', width: '70%', borderRadius: 3 },
  weekTemps: { fontSize: 14, fontWeight: '500', width: 90, textAlign: 'right' },
});
