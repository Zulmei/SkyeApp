import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useThemeColors } from '../../utils/theme';

export default function SettingsScreen() {
  const { user, logout, tempUnit, setTempUnit, theme, setTheme, updateName } = useApp();
  const c = useThemeColors(theme);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

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

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateName(editName.trim());
      setEditModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

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

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: c.accent }]}>
            <Text style={[styles.avatarText, { color: c.accentText }]}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: c.textPrimary }]}>{user?.name || ''}</Text>
            <Text style={[styles.userEmail, { color: c.textSecondary }]}>{user?.email || ''}</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: c.cardBg }]} onPress={openEditModal}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Units */}
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
                <Text style={[styles.unitBtnText, { color: c.textSecondary }, tempUnit === 'F' && { color: c.accentText }]}>°F</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, { backgroundColor: c.cardBg, borderColor: c.cardBorder }, tempUnit === 'C' && { backgroundColor: c.accent, borderColor: c.accent }]}
                onPress={() => setTempUnit('C')}
              >
                <Text style={[styles.unitBtnText, { color: c.textSecondary }, tempUnit === 'C' && { color: c.accentText }]}>°C</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Theme */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>THEME</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={styles.themeRow}>
            {(['Auto', 'Light', 'Dark'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.themeBtn, { backgroundColor: c.cardBg, borderColor: c.cardBorder }, theme === t && { backgroundColor: c.accent, borderColor: c.accent }]}
                onPress={() => setTheme(t)}
              >
                <Text style={[styles.themeBtnText, { color: c.textSecondary }, theme === t && { color: c.accentText }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>⎋</Text>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Edit Name</Text>
            <TextInput
              style={[styles.modalInput, { color: c.textPrimary, backgroundColor: c.activeCardBg, borderColor: c.cardBorder }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={c.textMuted}
              autoFocus
              selectionColor={c.accent}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: c.cardBorder }]} onPress={() => setEditModalVisible(false)} disabled={saving}>
                <Text style={[styles.modalBtnText, { color: c.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: c.accent, borderColor: c.accent }]} onPress={handleSaveName} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={c.accentText} size="small" />
                  : <Text style={[styles.modalBtnText, { color: c.accentText }]}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  unitToggle: { flexDirection: 'row', gap: 6 },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  unitBtnText: { fontSize: 14, fontWeight: '600' },
  themeRow: { flexDirection: 'row', padding: 12, gap: 8 },
  themeBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  themeBtnText: { fontSize: 14, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 12, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(220,53,69,0.15)', borderWidth: 1, borderColor: 'rgba(220,53,69,0.3)', gap: 8 },
  logoutIcon: { fontSize: 16, color: '#FF6B7A' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FF6B7A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalBtnPrimary: {},
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
