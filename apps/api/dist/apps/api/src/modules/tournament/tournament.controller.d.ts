import type { RequestTenantContext } from '../tenant/tenant.types';
import { ApproveRejectTeamDto, CreateTournamentDto, MatchQueryDto, MatchResultDto, RankingQueryDto, RegisterParticipantDto, RegisterTeamDto, TournamentQueryDto, UpdateTournamentDto, UpdateTournamentStatusDto } from './tournament.dto';
import { TournamentService } from './tournament.service';
export declare class TournamentController {
    private readonly tournamentService;
    constructor(tournamentService: TournamentService);
    createTournament(tenantContext: RequestTenantContext, body: CreateTournamentDto): import("./tournament.entity").Tournament;
    listTournaments(tenantContext: RequestTenantContext, query: TournamentQueryDto): import("./tournament.entity").Tournament[];
    getTournament(tenantContext: RequestTenantContext, tournamentId: string): import("./tournament.entity").Tournament;
    updateTournament(tenantContext: RequestTenantContext, tournamentId: string, body: UpdateTournamentDto): import("./tournament.entity").Tournament;
    updateTournamentStatus(tenantContext: RequestTenantContext, tournamentId: string, body: UpdateTournamentStatusDto): import("./tournament.entity").Tournament;
    registerParticipant(tenantContext: RequestTenantContext, tournamentId: string, body: RegisterParticipantDto): import("./tournament.entity").Tournament;
    registerTeam(tenantContext: RequestTenantContext, tournamentId: string, body: RegisterTeamDto): import("./tournament.entity").TeamRegistration;
    listTeamRegistrations(tenantContext: RequestTenantContext, tournamentId: string): import("./tournament.entity").TeamRegistration[];
    approveTeam(tenantContext: RequestTenantContext, body: ApproveRejectTeamDto): import("./tournament.entity").TeamRegistration;
    rejectTeam(tenantContext: RequestTenantContext, body: ApproveRejectTeamDto): import("./tournament.entity").TeamRegistration;
    generateBracket(tenantContext: RequestTenantContext, tournamentId: string): import("./tournament.entity").Match[];
    listMatches(tenantContext: RequestTenantContext, tournamentId: string, query: MatchQueryDto): import("./tournament.entity").Match[];
    getMatch(tenantContext: RequestTenantContext, matchId: string): import("./tournament.entity").Match | undefined;
    recordMatchResult(tenantContext: RequestTenantContext, matchId: string, body: MatchResultDto): import("./tournament.entity").Match;
    setDisputed(tenantContext: RequestTenantContext, matchId: string): import("./tournament.entity").Match;
    getRankings(tenantContext: RequestTenantContext, tournamentId: string, query: RankingQueryDto): import("./tournament.entity").Ranking[];
    getUpcomingMatches(memberId: string): import("./tournament.entity").Match[];
    getLiveMatches(storeId: string): import("./tournament.entity").Match[];
}
//# sourceMappingURL=tournament.controller.d.ts.map