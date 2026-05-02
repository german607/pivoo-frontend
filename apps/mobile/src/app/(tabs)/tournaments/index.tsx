import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Tournament, TournamentStatus } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';

const STATUS_LABEL: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]:               'Borrador',
  [TournamentStatus.REGISTRATION_OPEN]:   'Inscripción abierta',
  [TournamentStatus.REGISTRATION_CLOSED]: 'Inscr. cerrada',
  [TournamentStatus.IN_PROGRESS]:         'En curso',
  [TournamentStatus.COMPLETED]:           'Finalizado',
  [TournamentStatus.CANCELLED]:           'Cancelado',
};

const STATUS_COLOR: Record<TournamentStatus, { bg: string; text: string }> = {
  [TournamentStatus.DRAFT]:               { bg: '#f3f4f6', text: '#6b7280' },
  [TournamentStatus.REGISTRATION_OPEN]:   { bg: '#d1fae5', text: '#065f46' },
  [TournamentStatus.REGISTRATION_CLOSED]: { bg: '#fef3c7', text: '#92400e' },
  [TournamentStatus.IN_PROGRESS]:         { bg: '#dbeafe', text: '#1e40af' },
  [TournamentStatus.COMPLETED]:           { bg: '#ede9fe', text: '#5b21b6' },
  [TournamentStatus.CANCELLED]:           { bg: '#fee2e2', text: '#991b1b' },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Eliminación directa',
  ROUND_ROBIN: 'Round Robin',
};

const SPORT_EMOJI: Record<string, string> = { TENNIS: '🎾', PADEL: '🏓' };

export default function TournamentsScreen() {
  const { get } = useApi();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [data, sportList] = await Promise.all([
        get<Tournament[]>('/api/v1/tournaments', { baseUrl: process.env.EXPO_PUBLIC_TOURNAMENTS_API_URL }),
        get<{ id: string; name: string }[]>('/api/v1/sports', { baseUrl: process.env.EXPO_PUBLIC_SPORTS_API_URL }),
      ]);
      setTournaments(data || []);
      const map: Record<string, string> = {};
      (sportList || []).forEach((s) => { map[s.id] = s.name; });
      setSports(map);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  return (
    <FlatList
      data={tournaments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Sin torneos disponibles</Text>
          <Text style={styles.emptySubtitle}>Vuelve pronto para ver competiciones</Text>
        </View>
      }
      renderItem={({ item }) => {
        const sportName = sports[item.sportId] ?? item.sportId;
        const emoji = SPORT_EMOJI[sportName] ?? '🏆';
        const statusColor = STATUS_COLOR[item.status];
        const approvedCount = item._count?.registrations ?? 0;
        const safePct = item.maxParticipants > 0
          ? Math.min(100, Math.round((approvedCount / item.maxParticipants) * 100))
          : 0;

        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => router.push(`/(tabs)/tournaments/${item.id}`)}
          >
            {/* Sport banner */}
            <View style={[styles.banner, sportName === 'TENNIS' ? styles.bannerTennis : styles.bannerPadel]}>
              <Text style={styles.bannerEmoji}>{emoji}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
                <Text style={[styles.statusText, { color: statusColor.text }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={styles.format}>{FORMAT_LABEL[item.format] ?? item.format} · {sportName}</Text>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                <Text style={styles.metaText}>
                  {new Date(item.startDate).toLocaleDateString('es', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={13} color="#9ca3af" />
                <Text style={styles.metaText}>{approvedCount} / {item.maxParticipants} participantes</Text>
              </View>

              {/* Capacity bar */}
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${safePct}%` as any },
                    approvedCount >= item.maxParticipants ? styles.barFull : styles.barOpen,
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  banner: { height: 80, justifyContent: 'flex-end', padding: 14, flexDirection: 'row', alignItems: 'flex-end' },
  bannerTennis: { backgroundColor: '#84cc16' },
  bannerPadel:  { backgroundColor: '#0d9488' },
  bannerEmoji: { fontSize: 36, position: 'absolute', left: 16, bottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  body: { padding: 14, gap: 6 },
  format: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 17, fontWeight: '800', color: '#111827', lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#6b7280' },

  barBg: { height: 4, backgroundColor: '#f3f4f6', borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 4 },
  barOpen: { backgroundColor: '#0d9488' },
  barFull: { backgroundColor: '#f59e0b' },
});
