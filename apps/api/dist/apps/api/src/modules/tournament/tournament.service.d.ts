import { MatchStatus, TournamentStatus, TournamentType, type Match, type Ranking, type TeamRegistration, type Tournament, type TournamentPrizes, type TournamentRules } from './tournament.entity';
export declare class TournamentService {
    createTournament(input: {
        tenantId: string;
        brandId?: string;
        storeId?: string;
        name: string;
        description?: string;
        type: TournamentType;
        gameName: string;
        startDate: string;
        endDate: string;
        maxParticipants: number;
        rules?: TournamentRules;
        prizes?: TournamentPrizes;
        bannerImage?: string;
    }): Tournament;
    updateTournament(tournamentId: string, tenantId: string, input: {
        name?: string;
        description?: string;
        type?: TournamentType;
        gameName?: string;
        startDate?: string;
        endDate?: string;
        maxParticipants?: number;
        rules?: TournamentRules;
        prizes?: TournamentPrizes;
        bannerImage?: string;
    }): Tournament;
    getTournament(tournamentId: string, tenantId: string): Tournament | undefined;
    listTournaments(tenantId: string, filter?: {
        status?: TournamentStatus;
        type?: TournamentType;
        storeId?: string;
        brandId?: string;
    }): Tournament[];
    updateTournamentStatus(tournamentId: string, status: TournamentStatus, tenantId: string): Tournament;
    registerParticipant(tournamentId: string, memberId: string, tenantId: string): Tournament;
    registerTeam(input: {
        tournamentId: string;
        teamName: string;
        captainId: string;
        memberIds: string[];
    }, tenantId: string): TeamRegistration;
    approveTeam(teamRegId: string, tenantId: string): TeamRegistration;
    rejectTeam(teamRegId: string, tenantId: string): TeamRegistration;
    listTeamRegistrations(tournamentId: string, tenantId: string): TeamRegistration[];
    generateBracket(tournamentId: string, tenantId: string): Match[];
    recordMatchResult(matchId: string, score1: number, score2: number, tenantId: string): Match;
    setDisputed(matchId: string, tenantId: string): Match;
    getMatch(matchId: string, tenantId: string): Match | undefined;
    listMatches(tournamentId: string, tenantId: string, filter?: {
        round?: number;
        status?: MatchStatus;
    }): Match[];
    getUpcomingMatches(memberId: string): Match[];
    getLiveMatches(storeId: string): Match[];
    getRankings(tournamentId: string, tenantId: string): Ranking[];
    updateRankingAfterMatch(match: Match): void;
    private requireTournament;
    private assertValidTournamentStatusTransition;
    private shuffleArray;
    private updatePlayerRanking;
    private checkTournamentCompletion;
    resetTournamentStoresForTests(): void;
}
//# sourceMappingURL=tournament.service.d.ts.map