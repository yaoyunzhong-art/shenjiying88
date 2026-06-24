"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const tournament_dto_1 = require("./tournament.dto");
const tournament_service_1 = require("./tournament.service");
let TournamentController = class TournamentController {
    tournamentService;
    constructor(tournamentService) {
        this.tournamentService = tournamentService;
    }
    // ── Tournament CRUD ──
    createTournament(tenantContext, body) {
        return this.tournamentService.createTournament({
            tenantId: tenantContext.tenantId,
            brandId: tenantContext.brandId,
            storeId: tenantContext.storeId,
            name: body.name,
            description: body.description,
            type: body.type,
            gameName: body.gameName,
            startDate: body.startDate,
            endDate: body.endDate,
            maxParticipants: body.maxParticipants,
            rules: body.rules,
            prizes: body.prizes,
            bannerImage: body.bannerImage
        });
    }
    listTournaments(tenantContext, query) {
        return this.tournamentService.listTournaments(tenantContext.tenantId, {
            status: query.status,
            type: query.type,
            storeId: query.storeId,
            brandId: query.brandId
        });
    }
    getTournament(tenantContext, tournamentId) {
        const tournament = this.tournamentService.getTournament(tournamentId, tenantContext.tenantId);
        if (!tournament) {
            throw new Error(`Tournament not found: ${tournamentId}`);
        }
        return tournament;
    }
    updateTournament(tenantContext, tournamentId, body) {
        return this.tournamentService.updateTournament(tournamentId, tenantContext.tenantId, body);
    }
    updateTournamentStatus(tenantContext, tournamentId, body) {
        return this.tournamentService.updateTournamentStatus(tournamentId, body.status, tenantContext.tenantId);
    }
    // ── Registration ──
    registerParticipant(tenantContext, tournamentId, body) {
        return this.tournamentService.registerParticipant(tournamentId, body.memberId, tenantContext.tenantId);
    }
    registerTeam(tenantContext, tournamentId, body) {
        return this.tournamentService.registerTeam({ tournamentId, ...body }, tenantContext.tenantId);
    }
    listTeamRegistrations(tenantContext, tournamentId) {
        return this.tournamentService.listTeamRegistrations(tournamentId, tenantContext.tenantId);
    }
    approveTeam(tenantContext, body) {
        return this.tournamentService.approveTeam(body.teamRegId, tenantContext.tenantId);
    }
    rejectTeam(tenantContext, body) {
        return this.tournamentService.rejectTeam(body.teamRegId, tenantContext.tenantId);
    }
    // ── Bracket & Matches ──
    generateBracket(tenantContext, tournamentId) {
        return this.tournamentService.generateBracket(tournamentId, tenantContext.tenantId);
    }
    listMatches(tenantContext, tournamentId, query) {
        return this.tournamentService.listMatches(tournamentId, tenantContext.tenantId, {
            round: query.round,
            status: query.status
        });
    }
    getMatch(tenantContext, matchId) {
        return this.tournamentService.getMatch(matchId, tenantContext.tenantId);
    }
    recordMatchResult(tenantContext, matchId, body) {
        return this.tournamentService.recordMatchResult(matchId, body.score1, body.score2, tenantContext.tenantId);
    }
    setDisputed(tenantContext, matchId) {
        return this.tournamentService.setDisputed(matchId, tenantContext.tenantId);
    }
    // ── Rankings ──
    getRankings(tenantContext, tournamentId, query) {
        const rankings = this.tournamentService.getRankings(tournamentId, tenantContext.tenantId);
        if (query.limit !== undefined) {
            return rankings.slice(0, query.limit);
        }
        return rankings;
    }
    // ── Match push ──
    getUpcomingMatches(memberId) {
        return this.tournamentService.getUpcomingMatches(memberId);
    }
    getLiveMatches(storeId) {
        return this.tournamentService.getLiveMatches(storeId);
    }
};
exports.TournamentController = TournamentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tournament_dto_1.CreateTournamentDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "createTournament", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tournament_dto_1.TournamentQueryDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "listTournaments", null);
__decorate([
    (0, common_1.Get)(':tournamentId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "getTournament", null);
__decorate([
    (0, common_1.Patch)(':tournamentId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.UpdateTournamentDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "updateTournament", null);
__decorate([
    (0, common_1.Patch)(':tournamentId/status'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.UpdateTournamentStatusDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "updateTournamentStatus", null);
__decorate([
    (0, common_1.Post)(':tournamentId/register'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.RegisterParticipantDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "registerParticipant", null);
__decorate([
    (0, common_1.Post)(':tournamentId/teams'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.RegisterTeamDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "registerTeam", null);
__decorate([
    (0, common_1.Get)(':tournamentId/teams'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "listTeamRegistrations", null);
__decorate([
    (0, common_1.Patch)(':tournamentId/teams/approve'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tournament_dto_1.ApproveRejectTeamDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "approveTeam", null);
__decorate([
    (0, common_1.Patch)(':tournamentId/teams/reject'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tournament_dto_1.ApproveRejectTeamDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "rejectTeam", null);
__decorate([
    (0, common_1.Post)(':tournamentId/bracket/generate'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "generateBracket", null);
__decorate([
    (0, common_1.Get)(':tournamentId/matches'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.MatchQueryDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "listMatches", null);
__decorate([
    (0, common_1.Get)('matches/:matchId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "getMatch", null);
__decorate([
    (0, common_1.Patch)('matches/:matchId/result'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('matchId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.MatchResultDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "recordMatchResult", null);
__decorate([
    (0, common_1.Patch)('matches/:matchId/dispute'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "setDisputed", null);
__decorate([
    (0, common_1.Get)(':tournamentId/rankings'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tournamentId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, tournament_dto_1.RankingQueryDto]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "getRankings", null);
__decorate([
    (0, common_1.Get)('members/:memberId/upcoming'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "getUpcomingMatches", null);
__decorate([
    (0, common_1.Get)('stores/:storeId/live'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "getLiveMatches", null);
exports.TournamentController = TournamentController = __decorate([
    (0, common_1.Controller)('tournaments'),
    __metadata("design:paramtypes", [tournament_service_1.TournamentService])
], TournamentController);
//# sourceMappingURL=tournament.controller.js.map