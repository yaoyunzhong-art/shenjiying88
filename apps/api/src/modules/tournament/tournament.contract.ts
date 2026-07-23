import type {
  Tournament,
  Match,
  Ranking,
  TeamRegistration,
  RedemptionRecord,
  PredictionRecord,
  VoteRecord
} from './tournament.entity';

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
  minParticipants: number;
  entryFee: number;
  prizePool: number;
  createdAt: string;
  updatedAt: string;
}

/** External contract for redemption (cross-module safe subset) */
export interface RedemptionContract {
  id: string;
  tournamentId: string;
  userId: string;
  prizeId: string;
  prizeLabel: string;
  pointsCost: number;
  status: string;
  estimatedDelivery: string;
  createdAt: string;
}

/** External contract for prediction (cross-module safe subset) */
export interface PredictionContract {
  id: string;
  tournamentId: string;
  matchId: string;
  userId: string;
  prediction: string;
  stake: number;
  status: string;
  createdAt: string;
}

/** External contract for vote (cross-module safe subset) */
export interface VoteContract {
  id: string;
  tournamentId: string;
  contestantId: string;
  userId: string;
  votes: number;
  createdAt: string;
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
    minParticipants: tournament.minParticipants,
    entryFee: tournament.entryFee,
    prizePool: tournament.prizePool,
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
 * Convert internal RedemptionRecord to cross-module contract.
 */
export function toRedemptionContract(rec: RedemptionRecord): RedemptionContract {
  return {
    id: rec.id,
    tournamentId: rec.tournamentId,
    userId: rec.userId,
    prizeId: rec.prizeId,
    prizeLabel: rec.prizeLabel,
    pointsCost: rec.pointsCost,
    status: rec.status,
    estimatedDelivery: rec.estimatedDelivery,
    createdAt: rec.createdAt,
  };
}

/**
 * Convert internal PredictionRecord to cross-module contract.
 */
export function toPredictionContract(pred: PredictionRecord): PredictionContract {
  return {
    id: pred.id,
    tournamentId: pred.tournamentId,
    matchId: pred.matchId,
    userId: pred.userId,
    prediction: pred.prediction,
    stake: pred.stake,
    status: pred.status,
    createdAt: pred.createdAt,
  };
}

/**
 * Convert internal VoteRecord to cross-module contract.
 */
export function toVoteContract(vote: VoteRecord): VoteContract {
  return {
    id: vote.id,
    tournamentId: vote.tournamentId,
    contestantId: vote.contestantId,
    userId: vote.userId,
    votes: vote.votes,
    createdAt: vote.createdAt,
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
