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
export declare function toTournamentContract(tournament: Tournament): TournamentContract;
/**
 * Convert internal Match to cross-module contract.
 */
export declare function toMatchContract(match: Match): MatchContract;
/**
 * Convert internal Ranking to cross-module contract.
 */
export declare function toRankingContract(ranking: Ranking): RankingContract;
/**
 * Convert internal TeamRegistration to cross-module contract.
 */
export declare function toTeamRegistrationContract(reg: TeamRegistration): TeamRegistrationContract;
/**
 * Check if a tournament is currently accepting registrations.
 */
export declare function isTournamentOpenForRegistration(status: string): boolean;
/**
 * Check if a tournament has available slots.
 */
export declare function hasAvailableSlots(currentParticipants: number, maxParticipants: number): boolean;
/**
 * Determine if a match result indicates a draw.
 */
export declare function isDraw(score1: number, score2: number): boolean;
//# sourceMappingURL=tournament.contract.d.ts.map