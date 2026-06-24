import 'reflect-metadata';
import { TournamentType, TournamentStatus, MatchStatus, type TournamentRules, type TournamentPrizes } from './tournament.entity';
export declare class CreateTournamentDto {
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
}
export declare class UpdateTournamentDto {
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
}
export declare class UpdateTournamentStatusDto {
    status: TournamentStatus;
}
export declare class TournamentQueryDto {
    status?: TournamentStatus;
    type?: TournamentType;
    storeId?: string;
    brandId?: string;
}
export declare class MatchResultDto {
    score1: number;
    score2: number;
}
export declare class MatchQueryDto {
    round?: number;
    status?: MatchStatus;
}
export declare class RegisterParticipantDto {
    memberId: string;
}
export declare class RegisterTeamDto {
    teamName: string;
    captainId: string;
    memberIds: string[];
}
export declare class ApproveRejectTeamDto {
    teamRegId: string;
}
export declare class RankingQueryDto {
    limit?: number;
}
//# sourceMappingURL=tournament.dto.d.ts.map