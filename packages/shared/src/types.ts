export enum UserRole {
  PLAYER = 'PLAYER',
  COMPLEX = 'COMPLEX',
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TournamentParticipantStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SportName {
  TENNIS = 'TENNIS',
  PADEL = 'PADEL',
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum MatchStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ParticipantStatus {
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Team {
  TEAM_A = 'TEAM_A',
  TEAM_B = 'TEAM_B',
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string | null;
  sportStats: UserSportStats[];
}

export interface UserSportStats {
  sportId: string;
  matchesPlayed: number;
  matchesWon: number;
  rankingPoints: number;
  level: SkillLevel;
}

export interface Sport {
  id: string;
  name: SportName;
  minPlayers: number;
  maxPlayers: number;
  description: string | null;
}

export interface SportComplex {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  courts: Court[];
}

export interface Court {
  id: string;
  complexId: string;
  sportId: string;
  name: string;
  indoor: boolean;
}

export interface Match {
  id: string;
  sportId: string;
  complexId: string;
  courtId: string;
  adminUserId: string;
  scheduledAt: string;
  maxPlayers: number;
  minPlayers: number;
  requiredLevel: SkillLevel | null;
  status: MatchStatus;
  description: string | null;
  participants: MatchParticipant[];
  complex?: { name: string; city: string };
}

export interface MatchParticipant {
  id: string;
  userId: string | null;
  participantType: 'REGISTERED' | 'GUEST';
  guestFirstName: string | null;
  guestLastName: string | null;
  status?: ParticipantStatus;
  team: Team | null;
  joinedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TournamentRankingPoint {
  position: number;
  points: number;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  status: TournamentParticipantStatus;
  seed: number | null;
  registeredAt: string;
}

export interface TournamentMatchSet {
  player1: string;
  player2: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  sets: TournamentMatchSet[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  scheduledAt: string | null;
  courtId: string | null;
}

export interface TournamentResult {
  userId: string;
  position: number;
}

export interface Tournament {
  id: string;
  complexId: string;
  sportId: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  maxParticipants: number;
  registrationDeadline: string | null;
  startDate: string;
  description: string | null;
  complex?: { name: string; city: string };
  // Present in list (findAll)
  _count?: { registrations: number };
  // Present in detail (findOne)
  registrations?: TournamentRegistration[];
  matches?: TournamentMatch[];
  rankingPoints?: TournamentRankingPoint[];
  results?: TournamentResult[];
}
