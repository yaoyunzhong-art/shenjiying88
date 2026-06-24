"use strict";
/**
 * 🐜 自动: [tournament] [D] service 测试
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
const tournament_service_1 = require("./tournament.service");
const tournament_entity_1 = require("./tournament.entity");
(0, node_test_1.describe)('TournamentService', () => {
    let service;
    const TENANT = 'tenant-001';
    const STORE = 'store-001';
    (0, node_test_1.beforeEach)(() => {
        service = new tournament_service_1.TournamentService();
    });
    (0, node_test_1.afterEach)(() => {
        service.resetTournamentStoresForTests();
    });
    function createTestTournament(overrides) {
        return service.createTournament({
            tenantId: TENANT,
            storeId: STORE,
            name: 'Test Tournament',
            type: tournament_entity_1.TournamentType.SingleElimination,
            gameName: 'Test Game',
            startDate: '2026-07-01',
            endDate: '2026-07-15',
            maxParticipants: 16,
            ...overrides,
        });
    }
    // ── CRUD ──
    (0, node_test_1.describe)('createTournament', () => {
        (0, node_test_1.default)('should create a tournament with DRAFT status', () => {
            const t = createTestTournament();
            strict_1.default.equal(t.name, 'Test Tournament');
            strict_1.default.equal(t.type, tournament_entity_1.TournamentType.SingleElimination);
            strict_1.default.equal(t.status, tournament_entity_1.TournamentStatus.Draft);
            strict_1.default.equal(t.tenantId, TENANT);
            strict_1.default.equal(t.storeId, STORE);
            strict_1.default.equal(t.currentParticipants, 0);
            strict_1.default.ok(t.id.startsWith('tournament-'));
            strict_1.default.ok(t.createdAt);
            strict_1.default.ok(t.updatedAt);
        });
        (0, node_test_1.default)('should create tournament with optional fields', () => {
            const t = service.createTournament({
                tenantId: TENANT,
                name: 'Rich Tournament',
                type: tournament_entity_1.TournamentType.RoundRobin,
                gameName: 'Chess',
                startDate: '2026-08-01',
                endDate: '2026-08-30',
                maxParticipants: 32,
                description: 'A chess tournament',
                rules: { matchFormat: 'BO3', allowDraws: true },
                prizes: {
                    first: { label: 'Gold', value: '1000元' },
                    second: { label: 'Silver', value: '500元' },
                },
                bannerImage: 'https://img.example.com/banner.png',
                brandId: 'brand-1',
            });
            strict_1.default.equal(t.description, 'A chess tournament');
            strict_1.default.deepStrictEqual(t.rules, { matchFormat: 'BO3', allowDraws: true });
            strict_1.default.ok(t.prizes);
            strict_1.default.equal(t.prizes.first?.value, '1000元');
            strict_1.default.equal(t.bannerImage, 'https://img.example.com/banner.png');
        });
    });
    (0, node_test_1.describe)('getTournament', () => {
        (0, node_test_1.default)('should return tournament by id', () => {
            const t = createTestTournament();
            const found = service.getTournament(t.id, TENANT);
            strict_1.default.ok(found);
            strict_1.default.equal(found?.id, t.id);
        });
        (0, node_test_1.default)('should return undefined for non-existent tournament', () => {
            const found = service.getTournament('nonexistent', TENANT);
            strict_1.default.equal(found, undefined);
        });
        (0, node_test_1.default)('should return undefined for wrong tenant', () => {
            const t = createTestTournament();
            const found = service.getTournament(t.id, 'wrong-tenant');
            strict_1.default.equal(found, undefined);
        });
    });
    (0, node_test_1.describe)('listTournaments', () => {
        (0, node_test_1.default)('should list all tournaments for tenant', () => {
            createTestTournament({ name: 'T1' });
            createTestTournament({ name: 'T2' });
            const list = service.listTournaments(TENANT);
            strict_1.default.equal(list.length, 2);
        });
        (0, node_test_1.default)('should filter by status', () => {
            createTestTournament({ name: 'T1' });
            const t2 = createTestTournament({ name: 'T2' });
            service.updateTournamentStatus(t2.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const open = service.listTournaments(TENANT, { status: tournament_entity_1.TournamentStatus.Open });
            strict_1.default.equal(open.length, 1);
            strict_1.default.equal(open[0].status, tournament_entity_1.TournamentStatus.Open);
        });
        (0, node_test_1.default)('should filter by type', () => {
            createTestTournament({ name: 'SE', type: tournament_entity_1.TournamentType.SingleElimination });
            createTestTournament({ name: 'RR', type: tournament_entity_1.TournamentType.RoundRobin });
            const rr = service.listTournaments(TENANT, { type: tournament_entity_1.TournamentType.RoundRobin });
            strict_1.default.equal(rr.length, 1);
            strict_1.default.equal(rr[0].name, 'RR');
        });
        (0, node_test_1.default)('should filter by storeId', () => {
            createTestTournament({ name: 'S1', storeId: 'store-1' });
            createTestTournament({ name: 'S2', storeId: 'store-2' });
            const s1 = service.listTournaments(TENANT, { storeId: 'store-1' });
            strict_1.default.equal(s1.length, 1);
        });
        (0, node_test_1.default)('should return empty for wrong tenant', () => {
            createTestTournament();
            const list = service.listTournaments('wrong-tenant');
            strict_1.default.equal(list.length, 0);
        });
    });
    (0, node_test_1.describe)('updateTournament', () => {
        (0, node_test_1.default)('should update tournament fields', () => {
            const t = createTestTournament();
            const updated = service.updateTournament(t.id, TENANT, {
                name: 'Updated Name',
                maxParticipants: 64,
            });
            strict_1.default.equal(updated.name, 'Updated Name');
            strict_1.default.equal(updated.maxParticipants, 64);
        });
        (0, node_test_1.default)('should throw for non-existent tournament', () => {
            strict_1.default.throws(() => service.updateTournament('nonexistent', TENANT, { name: 'X' }), /Tournament not found/);
        });
        (0, node_test_1.default)('should throw for wrong tenant', () => {
            const t = createTestTournament();
            strict_1.default.throws(() => service.updateTournament(t.id, 'wrong-tenant', { name: 'X' }), /Tournament not found/);
        });
    });
    // ── Status transitions ──
    (0, node_test_1.describe)('updateTournamentStatus', () => {
        (0, node_test_1.default)('should transition Draft → Open', () => {
            const t = createTestTournament();
            const updated = service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            strict_1.default.equal(updated.status, tournament_entity_1.TournamentStatus.Open);
        });
        (0, node_test_1.default)('should transition Draft → Cancelled', () => {
            const t = createTestTournament();
            const updated = service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Cancelled, TENANT);
            strict_1.default.equal(updated.status, tournament_entity_1.TournamentStatus.Cancelled);
        });
        (0, node_test_1.default)('should transition Open → Ongoing', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const updated = service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Ongoing, TENANT);
            strict_1.default.equal(updated.status, tournament_entity_1.TournamentStatus.Ongoing);
        });
        (0, node_test_1.default)('should transition Ongoing → Completed', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Ongoing, TENANT);
            const updated = service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Completed, TENANT);
            strict_1.default.equal(updated.status, tournament_entity_1.TournamentStatus.Completed);
        });
        (0, node_test_1.default)('should transition Cancelled → Draft (reopen)', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Cancelled, TENANT);
            const updated = service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Draft, TENANT);
            strict_1.default.equal(updated.status, tournament_entity_1.TournamentStatus.Draft);
        });
        (0, node_test_1.default)('should reject invalid transition: Draft → Completed', () => {
            const t = createTestTournament();
            strict_1.default.throws(() => service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Completed, TENANT), /Invalid tournament status transition/);
        });
        (0, node_test_1.default)('should reject invalid transition: Completed → Open', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Ongoing, TENANT);
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Completed, TENANT);
            strict_1.default.throws(() => service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT), /Invalid tournament status transition/);
        });
    });
    // ── Registration ──
    (0, node_test_1.describe)('registerParticipant', () => {
        (0, node_test_1.default)('should register a participant when tournament is OPEN', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const updated = service.registerParticipant(t.id, 'mem-001', TENANT);
            strict_1.default.equal(updated.currentParticipants, 1);
        });
        (0, node_test_1.default)('should throw when tournament is not OPEN', () => {
            const t = createTestTournament();
            strict_1.default.throws(() => service.registerParticipant(t.id, 'mem-001', TENANT), /Tournament is not open for registration/);
        });
        (0, node_test_1.default)('should throw when max participants reached', () => {
            const t = createTestTournament({ maxParticipants: 2 });
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            strict_1.default.throws(() => service.registerParticipant(t.id, 'mem-003', TENANT), /Tournament has reached maximum participants/);
        });
        (0, node_test_1.default)('should throw for duplicate registration', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            strict_1.default.throws(() => service.registerParticipant(t.id, 'mem-001', TENANT), /Participant already registered/);
        });
        (0, node_test_1.default)('should throw for wrong tenant', () => {
            const t = createTestTournament();
            strict_1.default.throws(() => service.registerParticipant(t.id, 'mem-001', 'wrong-tenant'), /Tournament not found/);
        });
    });
    // ── Team registration ──
    (0, node_test_1.describe)('registerTeam', () => {
        (0, node_test_1.default)('should register a team when tournament is OPEN', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const reg = service.registerTeam({
                tournamentId: t.id,
                teamName: 'Team Alpha',
                captainId: 'mem-001',
                memberIds: ['mem-001', 'mem-002'],
            }, TENANT);
            strict_1.default.equal(reg.teamName, 'Team Alpha');
            strict_1.default.equal(reg.status, tournament_entity_1.TeamRegistrationStatus.Pending);
            strict_1.default.ok(reg.id.startsWith('teamreg-'));
        });
        (0, node_test_1.default)('should throw when tournament is not OPEN', () => {
            const t = createTestTournament();
            strict_1.default.throws(() => service.registerTeam({
                tournamentId: t.id,
                teamName: 'Team',
                captainId: 'mem-001',
                memberIds: ['mem-001'],
            }, TENANT), /Tournament is not open for registration/);
        });
    });
    (0, node_test_1.describe)('approveTeam / rejectTeam', () => {
        (0, node_test_1.default)('should approve a team registration', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const reg = service.registerTeam({
                tournamentId: t.id, teamName: 'T', captainId: 'c', memberIds: ['c'],
            }, TENANT);
            const approved = service.approveTeam(reg.id, TENANT);
            strict_1.default.equal(approved.status, tournament_entity_1.TeamRegistrationStatus.Approved);
        });
        (0, node_test_1.default)('should reject a team registration', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const reg = service.registerTeam({
                tournamentId: t.id, teamName: 'T', captainId: 'c', memberIds: ['c'],
            }, TENANT);
            const rejected = service.rejectTeam(reg.id, TENANT);
            strict_1.default.equal(rejected.status, tournament_entity_1.TeamRegistrationStatus.Rejected);
        });
        (0, node_test_1.default)('should throw for non-existent team', () => {
            strict_1.default.throws(() => service.approveTeam('nonexistent', TENANT), /Team registration not found/);
        });
        (0, node_test_1.default)('should verify tenant when approving', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            const reg = service.registerTeam({
                tournamentId: t.id, teamName: 'T', captainId: 'c', memberIds: ['c'],
            }, TENANT);
            strict_1.default.throws(() => service.approveTeam(reg.id, 'wrong-tenant'), /Tournament not found/);
        });
    });
    (0, node_test_1.describe)('listTeamRegistrations', () => {
        (0, node_test_1.default)('should list team registrations for a tournament', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerTeam({ tournamentId: t.id, teamName: 'A', captainId: 'm1', memberIds: ['m1'] }, TENANT);
            service.registerTeam({ tournamentId: t.id, teamName: 'B', captainId: 'm2', memberIds: ['m2'] }, TENANT);
            const list = service.listTeamRegistrations(t.id, TENANT);
            strict_1.default.equal(list.length, 2);
        });
    });
    // ── Bracket & Matches ──
    (0, node_test_1.describe)('generateBracket', () => {
        (0, node_test_1.default)('should generate bracket when tournament is OPEN and has participants', () => {
            const t = createTestTournament({ type: tournament_entity_1.TournamentType.SingleElimination });
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            service.registerParticipant(t.id, 'mem-003', TENANT);
            service.registerParticipant(t.id, 'mem-004', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            strict_1.default.ok(matches.length > 0);
            // Tournament should transition to Ongoing
            const updated = service.getTournament(t.id, TENANT);
            strict_1.default.equal(updated?.status, tournament_entity_1.TournamentStatus.Ongoing);
        });
        (0, node_test_1.default)('should throw if less than 2 participants', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            strict_1.default.throws(() => service.generateBracket(t.id, TENANT), /Need at least 2 participants/);
        });
        (0, node_test_1.default)('should throw if tournament is not OPEN', () => {
            const t = createTestTournament();
            strict_1.default.throws(() => service.generateBracket(t.id, TENANT), /Bracket can only be generated when tournament is OPEN/);
        });
        (0, node_test_1.default)('should generate round-robin matches', () => {
            const t = createTestTournament({ type: tournament_entity_1.TournamentType.RoundRobin });
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            service.registerParticipant(t.id, 'mem-003', TENANT);
            // 3 participants: C(3,2) = 3 matches
            const matches = service.generateBracket(t.id, TENANT);
            strict_1.default.equal(matches.length, 3);
        });
    });
    (0, node_test_1.describe)('recordMatchResult', () => {
        (0, node_test_1.default)('should record match result and update rankings', () => {
            const t = createTestTournament({ type: tournament_entity_1.TournamentType.RoundRobin });
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            const match = matches[0];
            const updated = service.recordMatchResult(match.id, 2, 1, TENANT);
            strict_1.default.equal(updated.status, tournament_entity_1.MatchStatus.Completed);
            strict_1.default.equal(updated.score1, 2);
            strict_1.default.equal(updated.score2, 1);
            strict_1.default.equal(updated.winnerId, match.player1Id);
            strict_1.default.ok(updated.playedAt);
        });
        (0, node_test_1.default)('should throw for non-existent match', () => {
            strict_1.default.throws(() => service.recordMatchResult('nonexistent', 2, 1, TENANT), /Match not found/);
        });
        (0, node_test_1.default)('should throw for already completed match', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            service.recordMatchResult(matches[0].id, 2, 1, TENANT);
            strict_1.default.throws(() => service.recordMatchResult(matches[0].id, 3, 2, TENANT), /Match already completed/);
        });
        (0, node_test_1.default)('should throw for wrong tenant', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            strict_1.default.throws(() => service.recordMatchResult(matches[0].id, 2, 1, 'wrong-tenant'), /Tournament not found/);
        });
    });
    (0, node_test_1.describe)('setDisputed', () => {
        (0, node_test_1.default)('should set match status to Disputed', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            const disputed = service.setDisputed(matches[0].id, TENANT);
            strict_1.default.equal(disputed.status, tournament_entity_1.MatchStatus.Disputed);
        });
        (0, node_test_1.default)('should throw for non-existent match', () => {
            strict_1.default.throws(() => service.setDisputed('nonexistent', TENANT), /Match not found/);
        });
    });
    (0, node_test_1.describe)('getMatch / listMatches', () => {
        (0, node_test_1.default)('should get a match by id', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            const match = service.getMatch(matches[0].id, TENANT);
            strict_1.default.ok(match);
            strict_1.default.equal(match?.id, matches[0].id);
        });
        (0, node_test_1.default)('should return undefined for non-existent match', () => {
            const match = service.getMatch('nonexistent', TENANT);
            strict_1.default.equal(match, undefined);
        });
        (0, node_test_1.default)('should return undefined for wrong tenant', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            const match = service.getMatch(matches[0].id, 'wrong-tenant');
            strict_1.default.equal(match, undefined);
        });
        (0, node_test_1.default)('should list matches with filter', () => {
            const t = createTestTournament({ type: tournament_entity_1.TournamentType.RoundRobin });
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            service.registerParticipant(t.id, 'mem-003', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            const list = service.listMatches(t.id, TENANT);
            strict_1.default.equal(list.length, matches.length);
        });
    });
    (0, node_test_1.describe)('getUpcomingMatches', () => {
        (0, node_test_1.default)('should return upcoming matches for a member', () => {
            const t = createTestTournament();
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            service.generateBracket(t.id, TENANT);
            const upcoming = service.getUpcomingMatches('mem-001');
            strict_1.default.ok(upcoming.length > 0);
        });
        (0, node_test_1.default)('should return empty for non-participant', () => {
            const upcoming = service.getUpcomingMatches('mem-999');
            strict_1.default.equal(upcoming.length, 0);
        });
    });
    (0, node_test_1.describe)('getLiveMatches', () => {
        (0, node_test_1.default)('should return live matches for a store', () => {
            const live = service.getLiveMatches(STORE);
            strict_1.default.equal(live.length, 0);
        });
    });
    // ── Rankings ──
    (0, node_test_1.describe)('getRankings', () => {
        (0, node_test_1.default)('should return empty rankings for tournament with no matches', () => {
            const t = createTestTournament();
            const rankings = service.getRankings(t.id, TENANT);
            strict_1.default.equal(rankings.length, 0);
        });
        (0, node_test_1.default)('should return ranked players after matches', () => {
            const t = createTestTournament({ type: tournament_entity_1.TournamentType.RoundRobin });
            service.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
            service.registerParticipant(t.id, 'mem-001', TENANT);
            service.registerParticipant(t.id, 'mem-002', TENANT);
            const matches = service.generateBracket(t.id, TENANT);
            service.recordMatchResult(matches[0].id, 2, 1, TENANT);
            const rankings = service.getRankings(t.id, TENANT);
            strict_1.default.ok(rankings.length > 0);
            const winner = rankings.find((r) => r.memberId === matches[0].player1Id);
            strict_1.default.ok(winner);
            strict_1.default.equal(winner?.rank, 1);
            strict_1.default.equal(winner?.wins, 1);
            strict_1.default.equal(winner?.points, 3);
        });
    });
});
//# sourceMappingURL=tournament.service.test.js.map