import type { Tournament, Match, Ranking, TeamRegistration } from './tournament.entity';

/**
 * Contract types for tournament module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for tournament (cross-module safe subset) */
export interface TournamentContract {
  id: string;
  tenantId: string;
  brandId?: string;
  storeId?: string;
  name: string;
  description?: string;
  type: string;
  gameName: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  bannerImage?: string;
  createdAt: string;
  updatedAt: string;
}

/** External contract for match (cross-module safe subset) */
export interface MatchContract {
  id: string;
  tournamentId: string;
  round: number;
  bracketPosition: number;
  player1Id: string;
  player2Id?: string;
  winnerId?: string;
  score1: number;
  score2: number;
  status: string;
  scheduledAt?: string;
  playedAt?: string;
  createdAt: string;
}

/** External contract for ranking (cross-module safe subset) */
export interface RankingContract {
  tournamentId: string;
  memberId: string;
  rank: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

/** External contract for team registration (cross-module safe subset) */
export interface TeamRegistrationContract {
  id: string;
  tournamentId: string;
  teamName: string;
  captainId: string;
  memberCount: number;
  status: string;
  createdAt: string;
}

/**
 * Convert internal Tournament to cross-module contract.
 */
export function toTournamentContract(tournament: Tournament): TournamentContract {
  return {
    id: tournament.id,
    tenantId: tournament.tenantId,
    brandId: tournament.brandId,
    storeId: tournament.storeId,
    name: tournament.name,
    description: tournament.description,
    type: tournament.type,
    gameName: tournament.gameName,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    maxParticipants: tournament.maxParticipants,
    currentParticipants: tournament.currentParticipants,
    status: tournament.status,
    bannerImage: tournament.bannerImage,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
  };
}

/**
 * Convert internal Match to cross-module contract.
 */
export function toMatchContract(match: Match): MatchContract {
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    round: match.round,
    bracketPosition: match.bracketPosition,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    winnerId: match.winnerId,
    score1: match.score1,
    score2: match.score2,
    status: match.status,
    scheduledAt: match.scheduledAt,
    playedAt: match.playedAt,
    createdAt: match.createdAt,
  };
}

/**
 * Convert internal Ranking to cross-module contract.
 */
export function toRankingContract(ranking: Ranking): RankingContract {
  return {
    tournamentId: ranking.tournamentId,
    memberId: ranking.memberId,
    rank: ranking.rank,
    points: ranking.points,
    wins: ranking.wins,
    losses: ranking.losses,
    draws: ranking.draws,
  };
}

/**
 * Convert internal TeamRegistration to cross-module contract.
 */
export function toTeamRegistrationContract(reg: TeamRegistration): TeamRegistrationContract {
  return {
    id: reg.id,
    tournamentId: reg.tournamentId,
    teamName: reg.teamName,
    captainId: reg.captainId,
    memberCount: reg.memberIds.length,
    status: reg.status,
    createdAt: reg.createdAt,
  };
}

/**
 * Check if a tournament is currently accepting registrations.
 */
export function isTournamentOpenForRegistration(status: string): boolean {
  return status === 'OPEN';
}

/**
 * Check if a tournament has available slots.
 */
export function hasAvailableSlots(currentParticipants: number, maxParticipants: number): boolean {
  return currentParticipants < maxParticipants;
}

/**
 * Determine if a match result indicates a draw.
 */
export function isDraw(score1: number, score2: number): boolean {
  return score1 === score2;
}
