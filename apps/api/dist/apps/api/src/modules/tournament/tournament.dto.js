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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingQueryDto = exports.ApproveRejectTeamDto = exports.RegisterTeamDto = exports.RegisterParticipantDto = exports.MatchQueryDto = exports.MatchResultDto = exports.TournamentQueryDto = exports.UpdateTournamentStatusDto = exports.UpdateTournamentDto = exports.CreateTournamentDto = void 0;
const class_validator_1 = require("class-validator");
require("reflect-metadata");
const tournament_entity_1 = require("./tournament.entity");
// ═══════════════════════════════════════════════════════════════════════
// Tournament DTOs
// ═══════════════════════════════════════════════════════════════════════
class CreateTournamentDto {
    name;
    description;
    type;
    gameName;
    startDate;
    endDate;
    maxParticipants;
    rules;
    prizes;
    bannerImage;
}
exports.CreateTournamentDto = CreateTournamentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(tournament_entity_1.TournamentType),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "gameName", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], CreateTournamentDto.prototype, "maxParticipants", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "rules", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTournamentDto.prototype, "prizes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "bannerImage", void 0);
class UpdateTournamentDto {
    name;
    description;
    type;
    gameName;
    startDate;
    endDate;
    maxParticipants;
    rules;
    prizes;
    bannerImage;
}
exports.UpdateTournamentDto = UpdateTournamentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(tournament_entity_1.TournamentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "gameName", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateTournamentDto.prototype, "maxParticipants", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateTournamentDto.prototype, "rules", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateTournamentDto.prototype, "prizes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTournamentDto.prototype, "bannerImage", void 0);
class UpdateTournamentStatusDto {
    status;
}
exports.UpdateTournamentStatusDto = UpdateTournamentStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(tournament_entity_1.TournamentStatus),
    __metadata("design:type", String)
], UpdateTournamentStatusDto.prototype, "status", void 0);
class TournamentQueryDto {
    status;
    type;
    storeId;
    brandId;
}
exports.TournamentQueryDto = TournamentQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(tournament_entity_1.TournamentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TournamentQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(tournament_entity_1.TournamentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TournamentQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TournamentQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TournamentQueryDto.prototype, "brandId", void 0);
// ═══════════════════════════════════════════════════════════════════════
// Match DTOs
// ═══════════════════════════════════════════════════════════════════════
class MatchResultDto {
    score1;
    score2;
}
exports.MatchResultDto = MatchResultDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MatchResultDto.prototype, "score1", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MatchResultDto.prototype, "score2", void 0);
class MatchQueryDto {
    round;
    status;
}
exports.MatchQueryDto = MatchQueryDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MatchQueryDto.prototype, "round", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(tournament_entity_1.MatchStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MatchQueryDto.prototype, "status", void 0);
// ═══════════════════════════════════════════════════════════════════════
// Registration DTOs
// ═══════════════════════════════════════════════════════════════════════
class RegisterParticipantDto {
    memberId;
}
exports.RegisterParticipantDto = RegisterParticipantDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterParticipantDto.prototype, "memberId", void 0);
class RegisterTeamDto {
    teamName;
    captainId;
    memberIds;
}
exports.RegisterTeamDto = RegisterTeamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTeamDto.prototype, "teamName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTeamDto.prototype, "captainId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterTeamDto.prototype, "memberIds", void 0);
class ApproveRejectTeamDto {
    teamRegId;
}
exports.ApproveRejectTeamDto = ApproveRejectTeamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveRejectTeamDto.prototype, "teamRegId", void 0);
// ═══════════════════════════════════════════════════════════════════════
// Ranking DTOs
// ═══════════════════════════════════════════════════════════════════════
class RankingQueryDto {
    limit;
}
exports.RankingQueryDto = RankingQueryDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RankingQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=tournament.dto.js.map