import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Match, SportComplex, ParticipantStatus } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth';

type EnrichedMatch = Match & { complex?: { name: string; city: string } };

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get, post, patch } = useApi();
  const { user } = useAuth();
  const [match, setMatch] = useState<EnrichedMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const loadMatch = async () => {
    try {
      const data = await get<Match>(`/api/v1/matches/${id}`, { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL });
      if (data.complexId) {
        const complex = await get<SportComplex>(`/api/v1/complexes/${data.complexId}`, { baseUrl: process.env.EXPO_PUBLIC_COMPLEXES_API_URL }).catch(() => null);
        if (complex) (data as EnrichedMatch).complex = { name: complex.name, city: complex.city };
      }
      setMatch(data as EnrichedMatch);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadMatch(); }, [id]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await post(`/api/v1/matches/${id}/join`, {}, { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL });
      await loadMatch();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo unir al partido');
    } finally {
      setIsJoining(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await patch(`/api/v1/matches/${id}/participants/${userId}/approve?team=TEAM_A`, {}, { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL });
      await loadMatch();
    } catch (e) {
      Alert.alert('Error', 'No se pudo aprobar la solicitud');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await patch(`/api/v1/matches/${id}/participants/${userId}/reject`, {}, { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL });
      await loadMatch();
    } catch (e) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Partido no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Volver</Text></TouchableOpacity>
      </View>
    );
  }

  const approved = match.participants.filter((p) => p.status === ParticipantStatus.APPROVED).length;
  const pending = match.participants.filter((p) => p.status === ParticipantStatus.PENDING);
  const isAdmin = match.adminUserId === user?.id;
  const userParticipant = match.participants.find((p) => p.userId === user?.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#0d9488" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>
          {match.complex ? `${match.complex.city} · ${match.complex.name}` : match.sportId}
        </Text>
        <Text style={styles.sport}>{match.sportId === 'TENNIS' ? '🎾' : '🏓'} {match.sportId}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#0d9488" />
          <Text style={styles.infoText}>
            {new Date(match.scheduledAt).toLocaleDateString('es', {
              weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color="#0d9488" />
          <Text style={styles.infoText}>{approved} / {match.maxPlayers} jugadores</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={16} color="#0d9488" />
          <Text style={styles.infoText}>Estado: {match.status}</Text>
        </View>
        {match.requiredLevel && (
          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={16} color="#f59e0b" />
            <Text style={styles.infoText}>Nivel: {match.requiredLevel}</Text>
          </View>
        )}
        {match.description && (
          <Text style={styles.description}>{match.description}</Text>
        )}
      </View>

      {!isAdmin && !userParticipant && (
        <TouchableOpacity
          style={[styles.joinBtn, isJoining && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={isJoining}
        >
          {isJoining
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.joinBtnText}>Solicitar unirse</Text>
          }
        </TouchableOpacity>
      )}

      {userParticipant && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>Tu solicitud: <Text style={styles.statusValue}>{userParticipant.status}</Text></Text>
        </View>
      )}

      {isAdmin && pending.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
          {pending.map((p) => (
            <View key={p.userId} style={styles.requestRow}>
              <Text style={styles.requestUserId} numberOfLines={1}>{p.userId}</Text>
              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(p.userId)}>
                  <Text style={styles.approveBtnText}>Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(p.userId)}>
                  <Text style={styles.rejectBtnText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 18, color: '#6b7280' },
  back: { color: '#0d9488', fontSize: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText: { color: '#0d9488', fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sport: { fontSize: 13, color: '#6b7280' },
  divider: { height: 1, backgroundColor: '#f3f4f6' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 15, color: '#374151' },
  description: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  joinBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 14,
  },
  statusText: { fontSize: 14, color: '#1d4ed8' },
  statusValue: { fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  requestUserId: { fontSize: 13, color: '#374151', flex: 1, marginRight: 8 },
  requestActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: '#d1fae5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  approveBtnText: { color: '#065f46', fontSize: 13, fontWeight: '600' },
  rejectBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  rejectBtnText: { color: '#991b1b', fontSize: 13, fontWeight: '600' },
});
