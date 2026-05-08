import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, SKILL_LEVEL_LABELS } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth';

export default function ProfileScreen() {
  const { get, patch } = useApi();
  const { logout } = useAuth();
  const [profile, setProfile]   = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName]         = useState('');
  const [bio, setBio]           = useState('');

  const loadProfile = async () => {
    try {
      const data = await get<User>('/api/v1/users/me', { baseUrl: process.env.EXPO_PUBLIC_USERS_API_URL });
      if (data) {
        setProfile(data);
        setName(data.name || '');
        setBio(data.bio || '');
      }
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
    } catch {
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
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  const displayName = profile?.name || profile?.email || '?';
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Avatar hero */}
      <View style={s.hero}>
        <View style={s.avatarRing}>
          <View style={s.avatar}>
            {profile?.avatarUrl
              ? <Image source={{ uri: profile.avatarUrl }} style={s.avatarImg} />
              : <Text style={s.avatarText}>{initials}</Text>}
          </View>
        </View>
        <Text style={s.displayName}>{profile?.name || profile?.email}</Text>
        {profile?.email && profile?.name && (
          <Text style={s.email}>{profile.email}</Text>
        )}
      </View>

      {/* Profile card */}
      <View style={s.card}>
        {isEditing ? (
          <>
            <Text style={s.label}>Nombre</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#475569"
              keyboardAppearance="dark"
            />
            <Text style={s.label}>Biografía</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Cuéntanos sobre ti"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              keyboardAppearance="dark"
            />
            <View style={s.editActions}>
              <TouchableOpacity
                style={[s.saveBtn, isSaving && s.btnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Guardar</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditing(false)} activeOpacity={0.8}>
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {profile?.bio
              ? <Text style={s.bio}>{profile.bio}</Text>
              : <Text style={s.bioEmpty}>Sin biografía</Text>
            }
            <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
              <Ionicons name="pencil-outline" size={15} color="#14b8a6" />
              <Text style={s.editBtnText}>Editar perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats */}
      {profile?.sportStats && profile.sportStats.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Estadísticas</Text>
          {profile.sportStats.map((stat) => (
            <View key={stat.sportId} style={s.statBlock}>
              <Text style={s.statSport}>{stat.sportId}</Text>
              <View style={s.statGrid}>
                {[
                  { value: stat.matchesPlayed, label: 'Partidos', color: '#e2e8f0' },
                  { value: stat.matchesWon,    label: 'Ganados',  color: '#14b8a6' },
                  { value: stat.rankingPoints, label: 'Puntos',   color: '#f59e0b' },
                  { value: SKILL_LEVEL_LABELS[stat.level] || stat.level, label: 'Nivel', color: '#a78bfa' },
                ].map(({ value, label, color }) => (
                  <View key={label} style={s.statItem}>
                    <Text style={[s.statValue, { color }]}>{value}</Text>
                    <Text style={s.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#f87171" />
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content:   { padding: 20, paddingBottom: 40, gap: 16 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },

  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatarRing: {
    padding: 3,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#14b8a6',
    marginBottom: 4,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#14b8a6',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { color: '#fff', fontSize: 28, fontWeight: '800' },
  avatarImg:    { width: 80, height: 80, borderRadius: 40 },
  displayName:  { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  email:        { fontSize: 14, color: '#64748b' },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },

  bio:      { fontSize: 15, color: '#94a3b8', lineHeight: 22 },
  bioEmpty: { fontSize: 14, color: '#475569', fontStyle: 'italic' },

  editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  editBtnText: { color: '#14b8a6', fontSize: 14, fontWeight: '600' },

  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.3 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f1f5f9',
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },

  editActions: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flex: 1, backgroundColor: '#14b8a6',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  saveBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled:   { opacity: 0.6 },
  cancelBtn: {
    flex: 1, backgroundColor: '#334155',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  statBlock:    { gap: 10 },
  statSport:    { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  statGrid:     { flexDirection: 'row', gap: 8 },
  statItem: {
    flex: 1, backgroundColor: '#0f172a',
    borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: '#334155',
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    marginBottom: 8,
  },
  logoutText: { color: '#f87171', fontSize: 15, fontWeight: '600' },
});
