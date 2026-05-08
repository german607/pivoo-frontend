import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Match, Sport, SportComplex } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';

type EnrichedMatch = Match & { complex?: { name: string; city: string }; sportName?: string };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  OPEN:        { label: 'Abierto',    bg: 'rgba(20,184,166,0.15)', text: '#14b8a6' },
  FULL:        { label: 'Completo',   bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  IN_PROGRESS: { label: 'En curso',   bg: 'rgba(99,102,241,0.15)', text: '#818cf8' },
  COMPLETED:   { label: 'Finalizado', bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  CANCELLED:   { label: 'Cancelado',  bg: 'rgba(239,68,68,0.12)',  text: '#f87171' },
};

const SPORT_GRADIENT: Record<string, string> = {
  PADEL:  '#14b8a6',
  TENNIS: '#eab308',
};

export default function MatchesScreen() {
  const { get } = useApi();
  const [matches, setMatches]   = useState<EnrichedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      const [data, complexes, sports] = await Promise.all([
        get<Match[]>('/api/v1/matches', { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL }),
        get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.EXPO_PUBLIC_COMPLEXES_API_URL }),
        get<Sport[]>('/api/v1/sports', { baseUrl: process.env.EXPO_PUBLIC_SPORTS_API_URL }),
      ]);
      const complexMap = new Map((complexes || []).map((c) => [c.id, c]));
      const sportMap   = new Map((sports   || []).map((s) => [s.id, s]));
      const enriched = (data || []).map((m) => ({
        ...m,
        complex:   complexMap.get(m.complexId ?? '') ? { name: complexMap.get(m.complexId!)!.name, city: complexMap.get(m.complexId!)!.city } : undefined,
        sportName: sportMap.get(m.sportId)?.name ?? m.sportId,
      }));
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
      <View style={s.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <FlatList
      style={s.list}
      data={matches}
      keyExtractor={(item) => item.id}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14b8a6" />}
      ListEmptyComponent={
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="tennisball-outline" size={32} color="#475569" />
          </View>
          <Text style={s.emptyTitle}>Sin partidos disponibles</Text>
          <Text style={s.emptySubtitle}>Sé el primero en crear uno</Text>
        </View>
      }
      renderItem={({ item }) => {
        const approved = item.participants.filter((p) => p.status === 'APPROVED').length;
        const isFull   = approved >= item.maxPlayers;
        const fillPct  = Math.min(100, Math.round((approved / item.maxPlayers) * 100));
        const status   = STATUS_CONFIG[isFull ? 'FULL' : item.status] ?? STATUS_CONFIG.OPEN;
        const accentColor = SPORT_GRADIENT[item.sportName?.toUpperCase() ?? ''] ?? '#14b8a6';

        const matchDate = new Date(item.scheduledAt);
        const now = new Date();
        const isToday    = matchDate.toDateString() === now.toDateString();
        const isTomorrow = matchDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
        const dateLabel = isToday
          ? `Hoy · ${matchDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
          : isTomorrow
            ? `Mañana · ${matchDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
            : matchDate.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        return (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push(`/(tabs)/matches/${item.id}`)}
            activeOpacity={0.85}
          >
            {/* Top accent */}
            <View style={[s.accent, { backgroundColor: accentColor }]} />

            <View style={s.cardBody}>
              {/* Header row */}
              <View style={s.cardHeader}>
                <View style={[s.sportBadge, { backgroundColor: accentColor + '22' }]}>
                  <Text style={[s.sportBadgeText, { color: accentColor }]}>{item.sportName}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[s.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
              </View>

              {/* Location */}
              {item.complex && (
                <View style={s.row}>
                  <Ionicons name="location-outline" size={13} color="#64748b" />
                  <Text style={s.metaText} numberOfLines={1}>
                    {item.complex.name} · {item.complex.city}
                  </Text>
                </View>
              )}

              {/* Date */}
              <View style={s.row}>
                <Ionicons name="calendar-outline" size={13} color={isToday ? '#14b8a6' : '#64748b'} />
                <Text style={[s.metaText, isToday && { color: '#14b8a6' }]}>{dateLabel}</Text>
              </View>

              {/* Capacity bar */}
              <View style={s.capacityRow}>
                <View style={s.capacityBar}>
                  <View style={[
                    s.capacityFill,
                    { width: `${fillPct}%` as any, backgroundColor: isFull ? '#f59e0b' : '#14b8a6' },
                  ]} />
                </View>
                <Text style={[s.capacityText, { color: isFull ? '#f59e0b' : '#14b8a6' }]}>
                  {approved}/{item.maxPlayers}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  list:    { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 12 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: '#e2e8f0' },
  emptySubtitle: { fontSize: 14, color: '#64748b' },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  accent: { height: 3, width: '100%' },
  cardBody: { padding: 16, gap: 10 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  sportBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  sportBadgeText: { fontSize: 12, fontWeight: '700' },

  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#94a3b8', flex: 1 },

  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  capacityBar: {
    flex: 1, height: 4, backgroundColor: '#334155',
    borderRadius: 4, overflow: 'hidden',
  },
  capacityFill: { height: '100%', borderRadius: 4 },
  capacityText: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
});
