import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Match, SportComplex, MATCH_STATUS_LABELS } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';

type EnrichedMatch = Match & { complex?: { name: string; city: string } };

export default function MatchesScreen() {
  const { get } = useApi();
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      const [data, complexes] = await Promise.all([
        get<Match[]>('/api/v1/matches', { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL }),
        get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.EXPO_PUBLIC_COMPLEXES_API_URL }),
      ]);
      const complexMap = new Map((complexes || []).map((c) => [c.id, c]));
      const enriched = (data || []).map((m) => {
        const c = complexMap.get(m.complexId);
        return c ? { ...m, complex: { name: c.name, city: c.city } } : m;
      });
      setMatches(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadMatches(); }, []);

  const onRefresh = () => { setRefreshing(true); loadMatches(); };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="tennisball-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Sin partidos disponibles</Text>
          <Text style={styles.emptySubtitle}>Sé el primero en crear uno</Text>
        </View>
      }
      renderItem={({ item }) => {
        const approved = item.participants.filter((p) => p.status === 'APPROVED').length;
        const isFull = approved >= item.maxPlayers;
        return (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(tabs)/matches/${item.id}`)}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.matchName} numberOfLines={1}>
                  {item.complex ? `${item.complex.city} · ${item.complex.name}` : item.sportId}
                </Text>
                <Text style={styles.sportTag}>{item.sportId === 'TENNIS' ? '🎾' : '🏓'} {item.sportId}</Text>
              </View>
              <View style={[styles.badge, isFull ? styles.badgeFull : styles.badgeOpen]}>
                <Text style={[styles.badgeText, isFull ? styles.badgeFullText : styles.badgeOpenText]}>
                  {isFull ? 'Completo' : MATCH_STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              <Ionicons name="calendar-outline" size={14} color="#0d9488" />
              <Text style={styles.cardMeta}>
                {new Date(item.scheduledAt).toLocaleDateString('es', {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Ionicons name="people-outline" size={14} color="#0d9488" />
              <Text style={styles.cardMeta}>{approved} / {item.maxPlayers} jugadores</Text>
            </View>
            {item.requiredLevel && (
              <View style={styles.cardRow}>
                <Ionicons name="trophy-outline" size={14} color="#f59e0b" />
                <Text style={styles.cardMeta}>Nivel: {item.requiredLevel}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { flex: 1, marginRight: 8 },
  matchName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sportTag: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOpen: { backgroundColor: '#d1fae5' },
  badgeFull: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeOpenText: { color: '#065f46' },
  badgeFullText: { color: '#991b1b' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMeta: { fontSize: 13, color: '#6b7280' },
});
