import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Tournament, TournamentStatus, TournamentParticipantStatus, UserRole } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/auth';

type Tab = 'info' | 'participants' | 'bracket' | 'standings';

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

const SPORT_EMOJI: Record<string, string> = { TENNIS: '🎾', PADEL: '🏓' };
const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Eliminación directa',
  ROUND_ROBIN: 'Round Robin',
};

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get, post, patch, delete: del } = useApi();
  const { user } = useAuth();

  const TAPI = { baseUrl: process.env.EXPO_PUBLIC_TOURNAMENTS_API_URL };

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sportName, setSportName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const load = async () => {
    try {
      const data = await get<Tournament>(`/api/v1/tournaments/${id}`, TAPI);
      setTournament(data);
      if (data.sportId) {
        const sportList = await get<{ id: string; name: string }[]>('/api/v1/sports', {
          baseUrl: process.env.EXPO_PUBLIC_SPORTS_API_URL,
        }).catch(() => null);
        const s = (sportList ?? []).find((sp) => sp.id === data.sportId);
        if (s) setSportName(s.name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setActionLoading(key);
    try { await fn(); await load(); }
    catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Algo salió mal'); }
    finally { setActionLoading(''); }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  if (!tournament) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Torneo no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isComplexAdmin = user?.role === UserRole.COMPLEX && user?.complexId === tournament.complexId;
  const myReg = tournament.registrations?.find((r) => r.userId === user?.id);
  const approved = (tournament.registrations ?? []).filter((r) => r.status === TournamentParticipantStatus.APPROVED);
  const pending  = (tournament.registrations ?? []).filter((r) => r.status === TournamentParticipantStatus.PENDING);
  const approvedCount = approved.length;
  const isFull = approvedCount >= tournament.maxParticipants;
  const pct = Math.min(100, Math.round((approvedCount / tournament.maxParticipants) * 100));

  const statusColor = STATUS_COLOR[tournament.status];
  const emoji = SPORT_EMOJI[sportName] ?? '🏆';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'participants', label: `Participantes${tournament.registrations?.length ? ` (${tournament.registrations.length})` : ''}` },
    { key: 'bracket', label: 'Cuadro' },
    { key: 'standings', label: 'Clasificación' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#0d9488" />
        <Text style={styles.backText}>Torneos</Text>
      </TouchableOpacity>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={[styles.banner, sportName === 'TENNIS' ? styles.bannerTennis : styles.bannerPadel]}>
          <Text style={styles.bannerEmoji}>{emoji}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusPillText, { color: statusColor.text }]}>
              {STATUS_LABEL[tournament.status]}
            </Text>
          </View>
          {isComplexAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.formatLabel}>
            {FORMAT_LABEL[tournament.format] ?? tournament.format}
            {sportName ? ` · ${sportName}` : ''}
          </Text>
          <Text style={styles.heroName}>{tournament.name}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={14} color="#9ca3af" />
              <Text style={styles.statText}>{approvedCount}/{tournament.maxParticipants}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.statText}>
                {new Date(tournament.startDate).toLocaleDateString('es', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            {tournament.registrationDeadline && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="#f59e0b" />
                <Text style={[styles.statText, { color: '#d97706' }]}>
                  Hasta {new Date(tournament.registrationDeadline).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            )}
          </View>

          {/* Capacity bar */}
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%` as any }, isFull ? styles.barFull : styles.barOpen]} />
          </View>
          <Text style={styles.capacityLabel}>
            {isFull ? 'Completo' : `${tournament.maxParticipants - approvedCount} plazas libres`}
          </Text>
        </View>
      </View>

      {/* Player actions */}
      {!isComplexAdmin && tournament.status === TournamentStatus.REGISTRATION_OPEN && !myReg && (
        <TouchableOpacity
          style={[styles.primaryBtn, actionLoading === 'register' && styles.btnDisabled]}
          activeOpacity={0.8}
          disabled={!!actionLoading}
          onPress={() => act('register', () => post(`/api/v1/tournaments/${id}/register`, {}, TAPI))}
        >
          {actionLoading === 'register'
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Inscribirse</Text>}
        </TouchableOpacity>
      )}

      {!isComplexAdmin && myReg && (
        <View style={[styles.regBanner, myReg.status === TournamentParticipantStatus.APPROVED ? styles.regApproved
          : myReg.status === TournamentParticipantStatus.REJECTED ? styles.regRejected : styles.regPending]}>
          <Ionicons
            name={myReg.status === TournamentParticipantStatus.APPROVED ? 'checkmark-circle' : myReg.status === TournamentParticipantStatus.REJECTED ? 'close-circle' : 'time'}
            size={18}
            color={myReg.status === TournamentParticipantStatus.APPROVED ? '#065f46' : myReg.status === TournamentParticipantStatus.REJECTED ? '#991b1b' : '#92400e'}
          />
          <Text style={[styles.regBannerText, myReg.status === TournamentParticipantStatus.APPROVED ? { color: '#065f46' }
            : myReg.status === TournamentParticipantStatus.REJECTED ? { color: '#991b1b' } : { color: '#92400e' }]}>
            {myReg.status === TournamentParticipantStatus.APPROVED ? 'Inscripción aprobada'
              : myReg.status === TournamentParticipantStatus.REJECTED ? 'Inscripción rechazada'
              : 'Pendiente de aprobación'}
          </Text>
          {(myReg.status === TournamentParticipantStatus.PENDING || myReg.status === TournamentParticipantStatus.APPROVED)
            && tournament.status === TournamentStatus.REGISTRATION_OPEN && (
            <TouchableOpacity
              style={styles.withdrawBtn}
              disabled={!!actionLoading}
              onPress={() => Alert.alert('Retirar inscripción', '¿Seguro que quieres retirarte?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Retirar', style: 'destructive', onPress: () => act('withdraw', () => del(`/api/v1/tournaments/${id}/register`, TAPI)) },
              ])}
            >
              <Text style={styles.withdrawBtnText}>Retirar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Admin actions */}
      {isComplexAdmin && (
        <View style={styles.adminActions}>
          {tournament.status === TournamentStatus.DRAFT && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading === 'status' && styles.btnDisabled]}
              disabled={!!actionLoading}
              onPress={() => act('status', () => patch(`/api/v1/tournaments/${id}/open-registration`, {}, TAPI))}>
              {actionLoading === 'status' ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnTextLight}>Abrir inscripciones</Text>}
            </TouchableOpacity>
          )}
          {tournament.status === TournamentStatus.REGISTRATION_OPEN && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading === 'bracket' && styles.btnDisabled]}
              disabled={!!actionLoading}
              onPress={() => act('bracket', () => post(`/api/v1/tournaments/${id}/bracket`, {}, TAPI))}>
              {actionLoading === 'bracket' ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnTextLight}>Generar cuadro</Text>}
            </TouchableOpacity>
          )}
          {tournament.status === TournamentStatus.IN_PROGRESS && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline, actionLoading === 'status' && styles.btnDisabled]}
              disabled={!!actionLoading}
              onPress={() => act('status', () => post(`/api/v1/tournaments/${id}/finalize`, {}, TAPI))}>
              {actionLoading === 'status' ? <ActivityIndicator color="#0d9488" size="small" />
                : <Text style={styles.actionBtnTextDark}>Finalizar torneo</Text>}
            </TouchableOpacity>
          )}
          {(tournament.status === TournamentStatus.DRAFT || tournament.status === TournamentStatus.REGISTRATION_OPEN) && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger, actionLoading === 'cancel' && styles.btnDisabled]}
              disabled={!!actionLoading}
              onPress={() => Alert.alert('Cancelar torneo', '¿Seguro? Esta acción no se puede deshacer.', [
                { text: 'No', style: 'cancel' },
                { text: 'Cancelar torneo', style: 'destructive', onPress: () => act('cancel', () => patch(`/api/v1/tournaments/${id}/cancel`, {}, TAPI)) },
              ])}>
              {actionLoading === 'cancel' ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnTextLight}>Cancelar torneo</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.tabActive]} onPress={() => setActiveTab(key)}>
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'info' && (
        <View style={styles.tabContent}>
          {tournament.description ? (
            <>
              <Text style={styles.sectionLabel}>Descripción</Text>
              <Text style={styles.descText}>{tournament.description}</Text>
            </>
          ) : null}
          {(tournament.rankingPoints?.length ?? 0) > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Puntos de ranking</Text>
              <View style={styles.rankingGrid}>
                {tournament.rankingPoints!.map((rp, i) => (
                  <View key={rp.position} style={[styles.rankingCard,
                    i === 0 ? styles.rankingGold : i === 1 ? styles.rankingSilver : styles.rankingBronze]}>
                    <Text style={styles.rankingPoints}>{rp.points}</Text>
                    <Text style={styles.rankingPts}>pts</Text>
                    <Text style={styles.rankingPos}>{rp.position}ª pos.</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          {!tournament.description && (tournament.rankingPoints?.length ?? 0) === 0 && (
            <Text style={styles.emptyTabText}>Sin información adicional</Text>
          )}
        </View>
      )}

      {activeTab === 'participants' && (
        <View style={styles.tabContent}>
          {/* Pending — admin only */}
          {isComplexAdmin && pending.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Pendientes de aprobación</Text>
              {pending.map((r) => (
                <View key={r.id} style={styles.participantRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{r.userId.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.participantId} numberOfLines={1}>{r.userId}</Text>
                  <View style={styles.approvalBtns}>
                    <TouchableOpacity style={styles.approveBtn} disabled={!!actionLoading}
                      onPress={() => act(r.userId, () => patch(`/api/v1/tournaments/${id}/registrations/${r.userId}/approve`, {}, TAPI))}>
                      {actionLoading === r.userId
                        ? <ActivityIndicator size="small" color="#065f46" />
                        : <Ionicons name="checkmark" size={16} color="#065f46" />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} disabled={!!actionLoading}
                      onPress={() => act(r.userId + '_r', () => patch(`/api/v1/tournaments/${id}/registrations/${r.userId}/reject`, {}, TAPI))}>
                      <Ionicons name="close" size={16} color="#991b1b" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={styles.divider} />
            </>
          )}

          {/* Approved */}
          <Text style={styles.sectionLabel}>
            Aprobados — {approvedCount}/{tournament.maxParticipants}
          </Text>
          {approved.length === 0 ? (
            <Text style={styles.emptyTabText}>Aún no hay participantes aprobados</Text>
          ) : (
            approved.map((r, i) => (
              <View key={r.id} style={styles.participantRow}>
                <View style={[styles.avatarCircle, { backgroundColor: '#0d9488' }]}>
                  <Text style={[styles.avatarText, { color: '#fff' }]}>{i + 1}</Text>
                </View>
                <Text style={styles.participantId} numberOfLines={1}>{r.userId}</Text>
                {r.seed && (
                  <View style={styles.seedBadge}>
                    <Text style={styles.seedText}>#{r.seed}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'bracket' && (
        <View style={styles.tabContent}>
          {(tournament.matches?.length ?? 0) === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons name="trophy-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyTabText}>El cuadro aún no ha sido generado</Text>
            </View>
          ) : (
            (tournament.matches ?? []).map((m) => {
              const isCompleted = m.status === 'COMPLETED';
              return (
                <View key={m.id} style={[styles.bracketMatch, isCompleted && styles.bracketMatchDone]}>
                  <View style={styles.bracketHeader}>
                    <Text style={styles.bracketRound}>Ronda {m.round} · Partido {m.matchNumber}</Text>
                    {isCompleted && <Ionicons name="checkmark-circle" size={14} color="#0d9488" />}
                  </View>
                  <View style={styles.bracketPlayer}>
                    <View style={[styles.bracketAvatar, m.winnerId === m.player1Id && m.player1Id ? styles.bracketWinner : null]}>
                      <Text style={styles.bracketAvatarText}>{m.player1Id ? m.player1Id.slice(0, 2).toUpperCase() : '–'}</Text>
                    </View>
                    <Text style={[styles.bracketPlayerName, m.winnerId === m.player1Id && m.player1Id ? styles.bracketWinnerText : null]}
                      numberOfLines={1}>
                      {m.player1Id ?? 'BYE'}
                    </Text>
                    {m.winnerId === m.player1Id && m.player1Id && (
                      <Ionicons name="trophy" size={12} color="#f59e0b" />
                    )}
                  </View>
                  <View style={styles.bracketVs}>
                    <Text style={styles.bracketVsText}>vs</Text>
                    {(m.sets ?? []).length > 0 && (
                      <Text style={styles.bracketScore}>
                        {m.sets.map((s) => `${s.player1}-${s.player2}`).join(', ')}
                      </Text>
                    )}
                  </View>
                  <View style={styles.bracketPlayer}>
                    <View style={[styles.bracketAvatar, m.winnerId === m.player2Id && m.player2Id ? styles.bracketWinner : null]}>
                      <Text style={styles.bracketAvatarText}>{m.player2Id ? m.player2Id.slice(0, 2).toUpperCase() : '–'}</Text>
                    </View>
                    <Text style={[styles.bracketPlayerName, m.winnerId === m.player2Id && m.player2Id ? styles.bracketWinnerText : null]}
                      numberOfLines={1}>
                      {m.player2Id ?? 'BYE'}
                    </Text>
                    {m.winnerId === m.player2Id && m.player2Id && (
                      <Ionicons name="trophy" size={12} color="#f59e0b" />
                    )}
                  </View>
                  {m.scheduledAt && (
                    <View style={styles.bracketSchedule}>
                      <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                      <Text style={styles.bracketScheduleText}>
                        {new Date(m.scheduledAt).toLocaleDateString('es', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {activeTab === 'standings' && (
        <View style={styles.tabContent}>
          {(tournament.results?.length ?? 0) === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons name="medal-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyTabText}>La clasificación estará disponible al finalizar el torneo</Text>
            </View>
          ) : (
            [...(tournament.results ?? [])].sort((a, b) => a.position - b.position).map((r) => {
              const pts = (tournament.rankingPoints ?? []).find((rp) => rp.position === r.position)?.points ?? 0;
              const medal = r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : r.position === 3 ? '🥉' : null;
              return (
                <View key={r.userId} style={[styles.standingRow, r.position <= 3 && styles.standingTop]}>
                  <Text style={styles.standingMedal}>{medal ?? `${r.position}º`}</Text>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{r.userId.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.standingUserId} numberOfLines={1}>{r.userId}</Text>
                  {pts > 0 && (
                    <View style={styles.ptsBadge}>
                      <Text style={styles.ptsBadgeText}>{pts} pts</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18, color: '#6b7280' },
  backLink: { color: '#0d9488', fontSize: 16, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  backText: { color: '#0d9488', fontSize: 16, fontWeight: '600' },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  banner: { height: 100, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 14, flexDirection: 'row' },
  bannerTennis: { backgroundColor: '#84cc16' },
  bannerPadel:  { backgroundColor: '#0d9488' },
  bannerEmoji: { fontSize: 44, position: 'absolute', left: 16, bottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  heroBody: { padding: 16, gap: 6 },
  formatLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 28 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: '#6b7280' },
  barBg: { height: 5, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden', marginTop: 8 },
  barFill: { height: 5, borderRadius: 5 },
  barOpen: { backgroundColor: '#0d9488' },
  barFull: { backgroundColor: '#f59e0b' },
  capacityLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },

  primaryBtn: {
    backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', shadowColor: '#0d9488', shadowOpacity: 0.25,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  regBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  regApproved: { backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
  regPending:  { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
  regRejected: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  regBannerText: { fontSize: 14, fontWeight: '600', flex: 1 },
  withdrawBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  withdrawBtnText: { color: '#991b1b', fontSize: 12, fontWeight: '700' },

  adminActions: { gap: 8 },
  actionBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionBtnPrimary: { backgroundColor: '#0d9488' },
  actionBtnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#0d9488' },
  actionBtnDanger: { backgroundColor: '#ef4444' },
  actionBtnTextLight: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionBtnTextDark: { color: '#0d9488', fontSize: 15, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#f3f4f6',
    borderRadius: 14, padding: 3, gap: 2,
  },
  tab: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#111827' },

  tabContent: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  descText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },
  emptyTab: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTabText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },

  rankingGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rankingCard: { flex: 1, minWidth: 70, borderRadius: 14, padding: 12, alignItems: 'center', gap: 2 },
  rankingGold:   { backgroundColor: '#fef3c7' },
  rankingSilver: { backgroundColor: '#f3f4f6' },
  rankingBronze: { backgroundColor: '#fff7ed' },
  rankingPoints: { fontSize: 24, fontWeight: '800', color: '#111827' },
  rankingPts: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  rankingPos: { fontSize: 11, color: '#6b7280' },

  participantRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  participantId: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  approvalBtns: { flexDirection: 'row', gap: 6 },
  approveBtn: { backgroundColor: '#d1fae5', borderRadius: 8, padding: 6 },
  rejectBtn:  { backgroundColor: '#fee2e2', borderRadius: 8, padding: 6 },
  seedBadge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  seedText: { fontSize: 11, color: '#92400e', fontWeight: '700' },

  bracketMatch: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14,
    padding: 12, gap: 6,
  },
  bracketMatchDone: { borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' },
  bracketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bracketRound: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  bracketPlayer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bracketAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center',
  },
  bracketWinner: { backgroundColor: '#0d9488' },
  bracketAvatarText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  bracketPlayerName: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },
  bracketWinnerText: { color: '#0d9488', fontWeight: '800' },
  bracketVs: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 36 },
  bracketVsText: { fontSize: 11, color: '#9ca3af', fontWeight: '700' },
  bracketScore: { fontSize: 12, color: '#374151', fontWeight: '600' },
  bracketSchedule: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 36, marginTop: 2 },
  bracketScheduleText: { fontSize: 11, color: '#9ca3af' },

  standingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  standingTop: { backgroundColor: '#fffbeb', marginHorizontal: -16, paddingHorizontal: 16 },
  standingMedal: { fontSize: 20, width: 32, textAlign: 'center' },
  standingUserId: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '600' },
  ptsBadge: { backgroundColor: '#ccfbf1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  ptsBadgeText: { fontSize: 12, color: '#0f766e', fontWeight: '700' },
});
