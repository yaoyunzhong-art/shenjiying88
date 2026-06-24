"use strict";
/**
 * 🐜 自动: [tournament] [D] controller 测试
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
(0, node_test_1.describe)('TournamentController', () => {
    const { TournamentController } = require('./tournament.controller');
    const { TournamentService } = require('./tournament.service');
    const { TournamentType, TournamentStatus, } = require('./tournament.entity');
    let controller;
    let service;
    const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' };
    node_test_1.default.beforeEach(() => {
        service = new TournamentService();
        controller = new TournamentController(service);
    });
    node_test_1.default.afterEach(() => {
        service.resetTournamentStoresForTests();
    });
    // ── Route metadata ──
    (0, node_test_1.describe)('route metadata', () => {
        (0, node_test_1.default)('controller path should be tournaments', () => {
            const path = Reflect.getMetadata('path', TournamentController);
            strict_1.default.equal(path, 'tournaments');
        });
        (0, node_test_1.default)('createTournament should be POST /', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.createTournament);
            const path = Reflect.getMetadata('path', TournamentController.prototype.createTournament);
            strict_1.default.equal(method, 1); // POST
            strict_1.default.equal(path, '/');
        });
        (0, node_test_1.default)('listTournaments should be GET /', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.listTournaments);
            const path = Reflect.getMetadata('path', TournamentController.prototype.listTournaments);
            strict_1.default.equal(method, 0); // GET
            strict_1.default.equal(path, '/');
        });
        (0, node_test_1.default)('getTournament should be GET /:tournamentId', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.getTournament);
            const path = Reflect.getMetadata('path', TournamentController.prototype.getTournament);
            strict_1.default.equal(method, 0);
            strict_1.default.equal(path, ':tournamentId');
        });
        (0, node_test_1.default)('updateTournament should be PATCH /:tournamentId', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.updateTournament);
            const path = Reflect.getMetadata('path', TournamentController.prototype.updateTournament);
            strict_1.default.equal(method, 4); // PATCH
            strict_1.default.equal(path, ':tournamentId');
        });
        (0, node_test_1.default)('updateTournamentStatus should be PATCH /:tournamentId/status', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.updateTournamentStatus);
            const path = Reflect.getMetadata('path', TournamentController.prototype.updateTournamentStatus);
            strict_1.default.equal(method, 4);
            strict_1.default.equal(path, ':tournamentId/status');
        });
        (0, node_test_1.default)('registerParticipant should be POST /:tournamentId/register', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.registerParticipant);
            const path = Reflect.getMetadata('path', TournamentController.prototype.registerParticipant);
            strict_1.default.equal(method, 1);
            strict_1.default.equal(path, ':tournamentId/register');
        });
        (0, node_test_1.default)('registerTeam should be POST /:tournamentId/teams', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.registerTeam);
            const path = Reflect.getMetadata('path', TournamentController.prototype.registerTeam);
            strict_1.default.equal(method, 1);
            strict_1.default.equal(path, ':tournamentId/teams');
        });
        (0, node_test_1.default)('approveTeam should be PATCH /:tournamentId/teams/approve', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.approveTeam);
            const path = Reflect.getMetadata('path', TournamentController.prototype.approveTeam);
            strict_1.default.equal(method, 4);
            strict_1.default.equal(path, ':tournamentId/teams/approve');
        });
        (0, node_test_1.default)('rejectTeam should be PATCH /:tournamentId/teams/reject', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.rejectTeam);
            const path = Reflect.getMetadata('path', TournamentController.prototype.rejectTeam);
            strict_1.default.equal(method, 4);
            strict_1.default.equal(path, ':tournamentId/teams/reject');
        });
        (0, node_test_1.default)('generateBracket should be POST /:tournamentId/bracket/generate', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.generateBracket);
            const path = Reflect.getMetadata('path', TournamentController.prototype.generateBracket);
            strict_1.default.equal(method, 1);
            strict_1.default.equal(path, ':tournamentId/bracket/generate');
        });
        (0, node_test_1.default)('listMatches should be GET /:tournamentId/matches', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.listMatches);
            const path = Reflect.getMetadata('path', TournamentController.prototype.listMatches);
            strict_1.default.equal(method, 0);
            strict_1.default.equal(path, ':tournamentId/matches');
        });
        (0, node_test_1.default)('getMatch should be GET /matches/:matchId', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.getMatch);
            const path = Reflect.getMetadata('path', TournamentController.prototype.getMatch);
            strict_1.default.equal(method, 0);
            strict_1.default.equal(path, 'matches/:matchId');
        });
        (0, node_test_1.default)('recordMatchResult should be PATCH /matches/:matchId/result', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.recordMatchResult);
            const path = Reflect.getMetadata('path', TournamentController.prototype.recordMatchResult);
            strict_1.default.equal(method, 4);
            strict_1.default.equal(path, 'matches/:matchId/result');
        });
        (0, node_test_1.default)('setDisputed should be PATCH /matches/:matchId/dispute', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.setDisputed);
            const path = Reflect.getMetadata('path', TournamentController.prototype.setDisputed);
            strict_1.default.equal(method, 4);
            strict_1.default.equal(path, 'matches/:matchId/dispute');
        });
        (0, node_test_1.default)('getRankings should be GET /:tournamentId/rankings', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.getRankings);
            const path = Reflect.getMetadata('path', TournamentController.prototype.getRankings);
            strict_1.default.equal(method, 0);
            strict_1.default.equal(path, ':tournamentId/rankings');
        });
        (0, node_test_1.default)('getUpcomingMatches should be GET /members/:memberId/upcoming', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.getUpcomingMatches);
            const path = Reflect.getMetadata('path', TournamentController.prototype.getUpcomingMatches);
            strict_1.default.equal(method, 0);
            strict_1.default.equal(path, 'members/:memberId/upcoming');
        });
        (0, node_test_1.default)('getLiveMatches should be GET /stores/:storeId/live', () => {
            const method = Reflect.getMetadata('method', TournamentController.prototype.getLiveMatches);
            const path = Reflect.getMetadata('path', TournamentController.prototype.getLiveMatches);
            strict_1.default.equal(method, 0);
            strict_1.default.equal(path, 'stores/:storeId/live');
        });
    });
    // ── Tournament CRUD via controller ──
    (0, node_test_1.describe)('POST /tournaments', () => {
        (0, node_test_1.default)('should create tournament', () => {
            const result = controller.createTournament(TENANT, {
                name: 'Summer Cup',
                type: TournamentType.SingleElimination,
                gameName: 'Street Fighter 6',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 64,
            });
            strict_1.default.equal(result.name, 'Summer Cup');
            strict_1.default.equal(result.status, TournamentStatus.Draft);
            strict_1.default.ok(result.id.startsWith('tournament-'));
        });
    });
    (0, node_test_1.describe)('GET /tournaments', () => {
        (0, node_test_1.default)('should list tournaments', () => {
            controller.createTournament(TENANT, {
                name: 'T1',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            const list = controller.listTournaments(TENANT, {});
            strict_1.default.equal(list.length, 1);
            strict_1.default.equal(list[0].name, 'T1');
        });
        (0, node_test_1.default)('should list with status filter', () => {
            controller.createTournament(TENANT, {
                name: 'Draft Tournament',
                type: TournamentType.League,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 8,
            });
            const list = controller.listTournaments(TENANT, { status: TournamentStatus.Draft });
            strict_1.default.equal(list.length, 1);
        });
    });
    (0, node_test_1.describe)('GET /tournaments/:tournamentId', () => {
        (0, node_test_1.default)('should get tournament', () => {
            const created = controller.createTournament(TENANT, {
                name: 'Get Me',
                type: TournamentType.SingleElimination,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            const found = controller.getTournament(TENANT, created.id);
            strict_1.default.ok(found);
            strict_1.default.equal(found.name, 'Get Me');
        });
    });
    (0, node_test_1.describe)('PATCH /tournaments/:tournamentId', () => {
        (0, node_test_1.default)('should update tournament', () => {
            const created = controller.createTournament(TENANT, {
                name: 'Old',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            const updated = controller.updateTournament(TENANT, created.id, { name: 'New' });
            strict_1.default.equal(updated.name, 'New');
        });
    });
    (0, node_test_1.describe)('PATCH /tournaments/:tournamentId/status', () => {
        (0, node_test_1.default)('should update status Draft → Open', () => {
            const created = controller.createTournament(TENANT, {
                name: 'Status Test',
                type: TournamentType.SingleElimination,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            const updated = controller.updateTournamentStatus(TENANT, created.id, {
                status: TournamentStatus.Open,
            });
            strict_1.default.equal(updated.status, TournamentStatus.Open);
        });
    });
    // ── Registration via controller ──
    (0, node_test_1.describe)('POST /tournaments/:tournamentId/register', () => {
        (0, node_test_1.default)('should register participant', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Reg Test',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 4,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            const result = controller.registerParticipant(TENANT, t.id, { memberId: 'mem-001' });
            strict_1.default.equal(result.currentParticipants, 1);
        });
    });
    (0, node_test_1.describe)('POST /tournaments/:tournamentId/teams', () => {
        (0, node_test_1.default)('should register a team', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Team Test',
                type: TournamentType.League,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            const reg = controller.registerTeam(TENANT, t.id, {
                teamName: 'Alpha',
                captainId: 'mem-001',
                memberIds: ['mem-001', 'mem-002'],
            });
            strict_1.default.equal(reg.teamName, 'Alpha');
            strict_1.default.ok(reg.id.startsWith('teamreg-'));
        });
    });
    (0, node_test_1.describe)('PATCH approve/reject team', () => {
        (0, node_test_1.default)('should approve team', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Approve Test',
                type: TournamentType.League,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            const reg = controller.registerTeam(TENANT, t.id, {
                teamName: 'Beta', captainId: 'm1', memberIds: ['m1'],
            });
            const approved = controller.approveTeam(TENANT, { teamRegId: reg.id });
            strict_1.default.equal(approved.status, 'APPROVED');
        });
        (0, node_test_1.default)('should reject team', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Reject Test',
                type: TournamentType.League,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 16,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            const reg = controller.registerTeam(TENANT, t.id, {
                teamName: 'Gamma', captainId: 'm1', memberIds: ['m1'],
            });
            const rejected = controller.rejectTeam(TENANT, { teamRegId: reg.id });
            strict_1.default.equal(rejected.status, 'REJECTED');
        });
    });
    // ── Bracket & Matches via controller ──
    (0, node_test_1.describe)('POST /tournaments/:tournamentId/bracket/generate', () => {
        (0, node_test_1.default)('should generate bracket', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Bracket Test',
                type: TournamentType.SingleElimination,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 8,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p3' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p4' });
            const matches = controller.generateBracket(TENANT, t.id);
            strict_1.default.ok(matches.length > 0);
        });
    });
    (0, node_test_1.describe)('GET /tournaments/:tournamentId/matches', () => {
        (0, node_test_1.default)('should list matches', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Match List',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 4,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            controller.generateBracket(TENANT, t.id);
            const matches = controller.listMatches(TENANT, t.id, {});
            strict_1.default.ok(matches.length > 0);
        });
    });
    (0, node_test_1.describe)('PATCH /matches/:matchId/result', () => {
        (0, node_test_1.default)('should record match result', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Result Test',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 4,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            const matches = controller.generateBracket(TENANT, t.id);
            const result = controller.recordMatchResult(TENANT, matches[0].id, { score1: 2, score2: 0 });
            strict_1.default.equal(result.status, 'COMPLETED');
            strict_1.default.equal(result.score1, 2);
            strict_1.default.equal(result.score2, 0);
        });
    });
    (0, node_test_1.describe)('PATCH /matches/:matchId/dispute', () => {
        (0, node_test_1.default)('should set match as disputed', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Dispute Test',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 4,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            const matches = controller.generateBracket(TENANT, t.id);
            const disputed = controller.setDisputed(TENANT, matches[0].id);
            strict_1.default.equal(disputed.status, 'DISPUTED');
        });
    });
    // ── Rankings via controller ──
    (0, node_test_1.describe)('GET /tournaments/:tournamentId/rankings', () => {
        (0, node_test_1.default)('should get rankings', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Ranking Test',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 4,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            const matches = controller.generateBracket(TENANT, t.id);
            controller.recordMatchResult(TENANT, matches[0].id, { score1: 2, score2: 1 });
            const rankings = controller.getRankings(TENANT, t.id, {});
            strict_1.default.ok(rankings.length > 0);
        });
        (0, node_test_1.default)('should respect limit', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Limit Test',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 8,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p3' });
            controller.generateBracket(TENANT, t.id);
            const rankings = controller.getRankings(TENANT, t.id, { limit: 2 });
            strict_1.default.ok(rankings.length <= 2);
        });
    });
    // ── Push endpoints ──
    (0, node_test_1.describe)('GET /members/:memberId/upcoming', () => {
        (0, node_test_1.default)('should get upcoming matches for a member', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Upcoming Test',
                type: TournamentType.RoundRobin,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 4,
            });
            controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p1' });
            controller.registerParticipant(TENANT, t.id, { memberId: 'p2' });
            controller.generateBracket(TENANT, t.id);
            const upcoming = controller.getUpcomingMatches('p1');
            strict_1.default.ok(Array.isArray(upcoming));
        });
    });
    (0, node_test_1.describe)('GET /stores/:storeId/live', () => {
        (0, node_test_1.default)('should get live matches for a store', () => {
            const live = controller.getLiveMatches('store-001');
            strict_1.default.ok(Array.isArray(live));
        });
    });
    // ── Error handling ──
    (0, node_test_1.describe)('error propagation from service', () => {
        (0, node_test_1.default)('should propagate tournament not found', () => {
            strict_1.default.throws(() => controller.getTournament(TENANT, 'nonexistent'), /Tournament not found: nonexistent/);
        });
        (0, node_test_1.default)('should propagate invalid status transition', () => {
            const t = controller.createTournament(TENANT, {
                name: 'Err Test',
                type: TournamentType.SingleElimination,
                gameName: 'Game',
                startDate: '2026-07-01',
                endDate: '2026-07-15',
                maxParticipants: 8,
            });
            strict_1.default.throws(() => controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Completed }), /Invalid tournament status transition/);
        });
    });
});
//# sourceMappingURL=tournament.controller.test.js.map