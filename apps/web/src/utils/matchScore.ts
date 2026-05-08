import { Match, MatchStatus, ParticipantStatus, SkillLevel, MatchCategory, UserSportStats } from '@pivoo/shared';

// ── Ordered maps ────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<string, number> = {
  [SkillLevel.BEGINNER]: 0,
  [SkillLevel.INTERMEDIATE]: 1,
  [SkillLevel.ADVANCED]: 2,
  [SkillLevel.PROFESSIONAL]: 3,
};

const CATEGORY_ORDER: Record<string, number> = {
  [MatchCategory.PRIMERA]: 1,
  [MatchCategory.SEGUNDA]: 2,
  [MatchCategory.TERCERA]: 3,
  [MatchCategory.CUARTA]: 4,
  [MatchCategory.QUINTA]: 5,
  [MatchCategory.SEXTA]: 6,
  [MatchCategory.SEPTIMA]: 7,
  [MatchCategory.OCTAVA]: 8,
};

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Returns a relevance score for a match given the current user's sport stats.
 * Higher is more relevant. Past/terminal matches return a large negative value.
 *
 * Scoring axes:
 *  - Date proximity (works for all users)
 *  - Status / urgency
 *  - Level or category compatibility (only when user has stats for the sport)
 *  - Sport familiarity (only when user has stats for the sport)
 */
export function scoreMatch(
  match: Match,
  userStats: UserSportStats[],
  now: Date,
): number {
  // Hard exclusions
  const hoursUntil = (new Date(match.scheduledAt).getTime() - now.getTime()) / 3_600_000;
  if (hoursUntil < 0) return -1000;
  if (match.status === MatchStatus.CANCELLED || match.status === MatchStatus.COMPLETED) return -500;
  if (match.status === MatchStatus.IN_PROGRESS) return -100;

  let score = 0;

  // 1. Date proximity — closer = more urgent = more interesting
  if (hoursUntil <= 24)       score += 25;
  else if (hoursUntil <= 48)  score += 20;
  else if (hoursUntil <= 72)  score += 15;
  else if (hoursUntil <= 168) score += 10;
  else if (hoursUntil <= 336) score += 5;

  // 2. Status penalty
  if (match.status === MatchStatus.FULL) score -= 5;

  // 3. Availability urgency (1 or few spots creates real urgency)
  const approvedCount = (match.participants ?? []).filter(
    (p) => p.status === ParticipantStatus.APPROVED,
  ).length;
  const spotsLeft = match.maxPlayers - approvedCount;
  if (spotsLeft === 1)      score += 10;
  else if (spotsLeft <= 3)  score += 5;

  // 4. User-specific: level/category + sport familiarity
  const stat = userStats.find((s) => s.sportId === match.sportId);
  if (!stat) return score; // no user data for this sport — rely on date/availability only

  // Sport familiarity bonus
  score += 15;
  score += Math.min(stat.matchesPlayed * 2, 20); // up to +20 for experience

  // Level compatibility (when the match uses level as requirement)
  if (match.requiredLevel) {
    const diff = Math.abs(
      (LEVEL_ORDER[match.requiredLevel] ?? 1) - (LEVEL_ORDER[stat.level] ?? 1),
    );
    if (diff === 0)      score += 40; // exact match
    else if (diff === 1) score += 20; // one step away (challenging / accessible)
    else if (diff === 2) score += 5;  // two steps — possible but not ideal
    else                 score -= 10; // significant mismatch
  } else if (!match.requiredCategory) {
    // No requirements at all — open to everyone, still worth showing
    score += 10;
  }

  // Category compatibility (when the match uses category as requirement)
  if (match.requiredCategory && stat.category) {
    const diff = Math.abs(
      (CATEGORY_ORDER[match.requiredCategory] ?? 4) - (CATEGORY_ORDER[stat.category] ?? 4),
    );
    if (diff === 0)      score += 40;
    else if (diff === 1) score += 20;
    else if (diff <= 3)  score += 5;
    else                 score -= 10;
  }

  return score;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sorts an array of matches by relevance for the given user.
 * Does not mutate the input.
 */
export function sortByRelevance(
  matches: Match[],
  userStats: UserSportStats[],
  now = new Date(),
): Match[] {
  return [...matches].sort(
    (a, b) => scoreMatch(b, userStats, now) - scoreMatch(a, userStats, now),
  );
}

/**
 * Returns the IDs of the top N matches that exceed the score threshold.
 * Used to mark "recommended" badges in the UI.
 */
export function getRecommendedIds(
  matches: Match[],
  userStats: UserSportStats[],
  { topN = 3, minScore = 35 } = {},
): Set<string> {
  if (userStats.length === 0) return new Set();
  const now = new Date();
  return new Set(
    [...matches]
      .map((m) => ({ id: m.id, score: scoreMatch(m, userStats, now) }))
      .filter((x) => x.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((x) => x.id),
  );
}
