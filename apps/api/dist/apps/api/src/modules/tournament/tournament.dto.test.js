"use strict";
/**
 * 🐜 自动: [tournament] [D] DTO 测试
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const tournament_dto_1 = require("./tournament.dto");
const tournament_entity_1 = require("./tournament.entity");
(0, node_test_1.describe)('Tournament DTOs', () => {
    (0, node_test_1.describe)('CreateTournamentDto', () => {
        const toDto = (raw) => Object.assign(new tournament_dto_1.CreateTournamentDto(), raw);
        (0, node_test_1.default)('should accept all required fields', () => {
            const dto = toDto({
                name: 'Summer Cup',
                type: tournament_entity_1.TournamentType.SingleElimination,
                gameName: 'Street Fighter 6',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 64,
            });
            strict_1.default.equal(dto.name, 'Summer Cup');
            strict_1.default.equal(dto.type, tournament_entity_1.TournamentType.SingleElimination);
            strict_1.default.equal(dto.gameName, 'Street Fighter 6');
            strict_1.default.equal(dto.startDate, '2026-07-01');
            strict_1.default.equal(dto.endDate, '2026-07-15');
            strict_1.default.equal(dto.maxParticipants, 64);
        });
        (0, node_test_1.default)('should accept optional fields', () => {
            const dto = toDto({
                name: 'Cup',
                type: tournament_entity_1.TournamentType.League,
                gameName: 'SF6',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 32,
                description: 'A great tournament',
                rules: { matchFormat: 'BO3' },
                prizes: { first: { label: 'Trophy', value: 'Gold' } },
                bannerImage: 'https://example.com/banner.png',
            });
            strict_1.default.equal(dto.description, 'A great tournament');
            strict_1.default.deepStrictEqual(dto.rules, { matchFormat: 'BO3' });
            strict_1.default.deepStrictEqual(dto.prizes, { first: { label: 'Trophy', value: 'Gold' } });
            strict_1.default.equal(dto.bannerImage, 'https://example.com/banner.png');
        });
        (0, node_test_1.default)('should be instance of CreateTournamentDto', () => {
            const dto = toDto({
                name: 'Cup',
                type: tournament_entity_1.TournamentType.RoundRobin,
                gameName: 'SF6',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            strict_1.default.ok(dto instanceof tournament_dto_1.CreateTournamentDto);
        });
    });
    (0, node_test_1.describe)('UpdateTournamentDto', () => {
        (0, node_test_1.default)('should accept partial data', () => {
            const dto = Object.assign(new tournament_dto_1.UpdateTournamentDto(), { name: 'New Name' });
            strict_1.default.equal(dto.name, 'New Name');
            strict_1.default.equal(dto.description, undefined);
        });
        (0, node_test_1.default)('should accept type change', () => {
            const dto = Object.assign(new tournament_dto_1.UpdateTournamentDto(), {
                type: tournament_entity_1.TournamentType.RoundRobin,
                maxParticipants: 64,
            });
            strict_1.default.equal(dto.type, tournament_entity_1.TournamentType.RoundRobin);
            strict_1.default.equal(dto.maxParticipants, 64);
        });
        (0, node_test_1.default)('should accept empty object', () => {
            const dto = new tournament_dto_1.UpdateTournamentDto();
            strict_1.default.equal(dto.name, undefined);
            strict_1.default.equal(dto.type, undefined);
        });
    });
    (0, node_test_1.describe)('UpdateTournamentStatusDto', () => {
        (0, node_test_1.default)('should hold status', () => {
            const dto = Object.assign(new tournament_dto_1.UpdateTournamentStatusDto(), { status: tournament_entity_1.TournamentStatus.Open });
            strict_1.default.equal(dto.status, tournament_entity_1.TournamentStatus.Open);
        });
    });
    (0, node_test_1.describe)('TournamentQueryDto', () => {
        (0, node_test_1.default)('should hold query filters', () => {
            const dto = Object.assign(new tournament_dto_1.TournamentQueryDto(), {
                status: tournament_entity_1.TournamentStatus.Open,
                type: tournament_entity_1.TournamentType.RoundRobin,
                storeId: 'store-1',
                brandId: 'brand-1',
            });
            strict_1.default.equal(dto.status, tournament_entity_1.TournamentStatus.Open);
            strict_1.default.equal(dto.type, tournament_entity_1.TournamentType.RoundRobin);
            strict_1.default.equal(dto.storeId, 'store-1');
            strict_1.default.equal(dto.brandId, 'brand-1');
        });
        (0, node_test_1.default)('should accept empty query', () => {
            const dto = new tournament_dto_1.TournamentQueryDto();
            strict_1.default.equal(dto.status, undefined);
            strict_1.default.equal(dto.type, undefined);
        });
    });
    (0, node_test_1.describe)('MatchResultDto', () => {
        (0, node_test_1.default)('should hold scores', () => {
            const dto = Object.assign(new tournament_dto_1.MatchResultDto(), { score1: 2, score2: 1 });
            strict_1.default.equal(dto.score1, 2);
            strict_1.default.equal(dto.score2, 1);
        });
    });
    (0, node_test_1.describe)('MatchQueryDto', () => {
        (0, node_test_1.default)('should hold match filter', () => {
            const dto = Object.assign(new tournament_dto_1.MatchQueryDto(), {
                round: 1,
                status: tournament_entity_1.MatchStatus.Pending,
            });
            strict_1.default.equal(dto.round, 1);
            strict_1.default.equal(dto.status, tournament_entity_1.MatchStatus.Pending);
        });
    });
    (0, node_test_1.describe)('RegisterParticipantDto', () => {
        (0, node_test_1.default)('should hold memberId', () => {
            const dto = Object.assign(new tournament_dto_1.RegisterParticipantDto(), { memberId: 'mem-001' });
            strict_1.default.equal(dto.memberId, 'mem-001');
        });
    });
    (0, node_test_1.describe)('RegisterTeamDto', () => {
        (0, node_test_1.default)('should hold team data', () => {
            const dto = Object.assign(new tournament_dto_1.RegisterTeamDto(), {
                teamName: 'Team Alpha',
                captainId: 'mem-001',
                memberIds: ['mem-001', 'mem-002', 'mem-003'],
            });
            strict_1.default.equal(dto.teamName, 'Team Alpha');
            strict_1.default.equal(dto.captainId, 'mem-001');
            strict_1.default.deepStrictEqual(dto.memberIds, ['mem-001', 'mem-002', 'mem-003']);
        });
    });
    (0, node_test_1.describe)('ApproveRejectTeamDto', () => {
        (0, node_test_1.default)('should hold teamRegId', () => {
            const dto = Object.assign(new tournament_dto_1.ApproveRejectTeamDto(), { teamRegId: 'teamreg-xxx' });
            strict_1.default.equal(dto.teamRegId, 'teamreg-xxx');
        });
    });
    (0, node_test_1.describe)('RankingQueryDto', () => {
        (0, node_test_1.default)('should hold limit', () => {
            const dto = Object.assign(new tournament_dto_1.RankingQueryDto(), { limit: 10 });
            strict_1.default.equal(dto.limit, 10);
        });
        (0, node_test_1.default)('should accept empty', () => {
            const dto = new tournament_dto_1.RankingQueryDto();
            strict_1.default.equal(dto.limit, undefined);
        });
    });
});
//# sourceMappingURL=tournament.dto.test.js.map