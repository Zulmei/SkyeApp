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
import { useThemeColors } from '../../utils/theme';

const CITY_LIST = [
  { city: 'Chicago',      region: 'IL' },
  { city: 'Houston',      region: 'TX' },
  { city: 'Phoenix',      region: 'AZ' },
  { city: 'Philadelphia', region: 'PA' },
  { city: 'San Antonio',  region: 'TX' },
  { city: 'Dallas',       region: 'TX' },
  { city: 'Denver',       region: 'CO' },
  { city: 'Boston',       region: 'MA' },
];

export default function PlacesScreen() {
  const { locations, removeLocation, setActiveLocation, addLocation, tempUnit, theme } = useApp();
  const c = useThemeColors(theme);
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
    <LinearGradient colors={[...c.gradientBg]} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>My Places</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Manage your saved locations</Text>
        </View>

        {/* Location Cards */}
        <View style={styles.locationsList}>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.locationCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }, loc.isActive && { borderColor: c.accent, borderWidth: 2, backgroundColor: c.activeCardBg }]}
              onPress={() => setActiveLocation(loc.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <View style={styles.cardTitleRow}>
                  {loc.isActive && <Text style={styles.pinIcon}>📍 </Text>}
                  <Text style={[styles.cardCity, { color: c.textPrimary }]}>
                    {loc.city}, {loc.region}
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: c.textSecondary }]}>
                  {loc.isActive ? 'Current location' : loc.condition}
                </Text>
              </View>

              <View style={styles.cardRight}>
                <WeatherIcon type={loc.icon} size={26} />
                <View style={styles.tempConditionCol}>
                  <Text style={[styles.cardTemp, { color: c.textPrimary }]}>{formatTemp(loc.temp, tempUnit)}</Text>
                  <Text style={[styles.cardCondition, { color: c.textSecondary }]}>{loc.condition}</Text>
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
          style={[styles.addBtn, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
          onPress={() => setShowResults(!showResults)}
          activeOpacity={0.8}
        >
          <View style={styles.addBtnInner}>
            <Text style={styles.addBtnPlus}>+</Text>
            <Text style={[styles.addBtnText, { color: c.textPrimary }]}>Add Location</Text>
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
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
          <View style={[styles.searchResults, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
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
                  <Text style={[styles.searchCityName, { color: c.textPrimary }]}>{city.city}, {city.region}</Text>
                  <Text style={[styles.searchCondition, { color: c.textSecondary }]}>Tap to add</Text>
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
