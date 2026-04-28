import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, SKILL_LEVEL_LABELS } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth';

export default function ProfileScreen() {
  const { get, patch } = useApi();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const loadProfile = async () => {
    try {
      const data = await get<User>('/api/v1/users/me', { baseUrl: process.env.EXPO_PUBLIC_USERS_API_URL });
      setProfile(data);
      setName(data.name || '');
      setBio(data.bio || '');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patch('/api/v1/users/me', { name, bio }, { baseUrl: process.env.EXPO_PUBLIC_USERS_API_URL });
      setIsEditing(false);
      await loadProfile();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name || profile?.email || '?').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{profile?.name || profile?.email}</Text>
        {profile?.email && profile?.name && (
          <Text style={styles.email}>{profile.email}</Text>
        )}
      </View>

      <View style={styles.card}>
        {isEditing ? (
          <>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.label}>Biografía</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Cuéntanos sobre ti"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil-outline" size={16} color="#0d9488" />
              <Text style={styles.editBtnText}>Editar perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {profile?.sportStats && profile.sportStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          {profile.sportStats.map((stat) => (
            <View key={stat.sportId} style={styles.statRow}>
              <Text style={styles.statSport}>{stat.sportId}</Text>
              <View style={styles.statGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.matchesPlayed}</Text>
                  <Text style={styles.statLabel}>Partidos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.matchesWon}</Text>
                  <Text style={styles.statLabel}>Ganados</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#0d9488' }]}>{stat.rankingPoints}</Text>
                  <Text style={styles.statLabel}>Puntos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{SKILL_LEVEL_LABELS[stat.level] || stat.level}</Text>
                  <Text style={styles.statLabel}>Nivel</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { fontSize: 14, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 12,
  },
  bio: { fontSize: 15, color: '#374151', lineHeight: 22 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  editBtnText: { color: '#0d9488', fontSize: 15, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, backgroundColor: '#0d9488', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
  cancelBtn: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  statRow: { gap: 8 },
  statSport: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  statGrid: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 10, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    marginBottom: 16,
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
