"use strict";
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
const TENANT = 'sim-tenant-001';
function createService() {
    const svc = new tournament_service_1.TournamentService();
    svc.resetTournamentStoresForTests();
    return svc;
}
function createAndOpenTournament(svc, overrides) {
    const t = svc.createTournament({
        tenantId: TENANT,
        storeId: 'sim-store-001',
        name: 'Sim Tournament',
        type: tournament_entity_1.TournamentType.SingleElimination,
        gameName: 'Test Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
        ...overrides,
    });
    svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
    return t;
}
function registerNParticipants(svc, tournamentId, n) {
    const ids = [];
    for (let i = 0; i < n; i++) {
        const memberId = `sim-player-${i.toString().padStart(3, '0')}`;
        svc.registerParticipant(tournamentId, memberId, TENANT);
        ids.push(memberId);
    }
    return ids;
}
// ─── Simulator: Tournament lifecycle simulation ───
(0, node_test_1.describe)('Tournament Simulator - Full Lifecycle', () => {
    (0, node_test_1.default)('should simulate a complete single-elimination tournament', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, {
            name: 'Lifecycle Sim',
            type: tournament_entity_1.TournamentType.SingleElimination,
            maxParticipants: 8,
        });
        // Register 8 participants
        registerNParticipants(svc, t.id, 8);
        // Generate bracket (transitions to Ongoing)
        const matches = svc.generateBracket(t.id, TENANT);
        strict_1.default.ok(matches.length > 0);
        // Simulate all matches
        let remaining = svc.listMatches(t.id, TENANT, { status: tournament_entity_1.MatchStatus.Pending });
        let safety = 0;
        while (remaining.length > 0 && safety < 20) {
            const match = remaining[0];
            // Simulate a winner
            const result = svc.recordMatchResult(match.id, 2, 1, TENANT);
            strict_1.default.equal(result.status, tournament_entity_1.MatchStatus.Completed);
            remaining = svc.listMatches(t.id, TENANT, { status: tournament_entity_1.MatchStatus.Pending });
            safety++;
        }
        // Check tournament completed
        const ended = svc.getTournament(t.id, TENANT);
        strict_1.default.equal(ended?.status, tournament_entity_1.TournamentStatus.Completed);
        // Check rankings exist
        const rankings = svc.getRankings(t.id, TENANT);
        strict_1.default.ok(rankings.length > 0);
    });
    (0, node_test_1.default)('should simulate tournament cancellation mid-way', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, {
            name: 'Cancellation Sim',
            type: tournament_entity_1.TournamentType.RoundRobin,
            maxParticipants: 4,
        });
        registerNParticipants(svc, t.id, 4);
        svc.generateBracket(t.id, TENANT);
        // Cancel it mid-way
        const cancelled = svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Cancelled, TENANT);
        strict_1.default.equal(cancelled.status, tournament_entity_1.TournamentStatus.Cancelled);
        // Ensure no further actions possible
        strict_1.default.throws(() => svc.registerParticipant(t.id, 'new-player', TENANT), /Tournament is not open for registration/);
    });
});
// ─── Simulator: Edge cases ───
(0, node_test_1.describe)('Tournament Simulator - Edge Cases', () => {
    (0, node_test_1.default)('should simulate a round-robin with draws', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, {
            name: 'Draw Sim',
            type: tournament_entity_1.TournamentType.RoundRobin,
            maxParticipants: 3,
        });
        registerNParticipants(svc, t.id, 3);
        const matches = svc.generateBracket(t.id, TENANT);
        // Record a draw (equal scores)
        const drawMatch = matches.find((m) => m.player2Id !== undefined);
        if (drawMatch) {
            const result = svc.recordMatchResult(drawMatch.id, 1, 1, TENANT);
            strict_1.default.equal(result.status, tournament_entity_1.MatchStatus.Completed);
            // Equal scores produce no winner
            const updatedMatch = svc.getMatch(drawMatch.id, TENANT);
            strict_1.default.equal(updatedMatch?.winnerId, undefined);
        }
        const rankings = svc.getRankings(t.id, TENANT);
        const drawRanking = rankings.find((r) => r.draws > 0);
        strict_1.default.ok(drawRanking, 'Should have at least one ranking entry with draws > 0');
    });
    (0, node_test_1.default)('should handle single byes with odd participant count', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, {
            name: 'Bye Sim',
            type: tournament_entity_1.TournamentType.SingleElimination,
            maxParticipants: 8,
        });
        // Only register 5 participants (generates byes)
        registerNParticipants(svc, t.id, 5);
        const matches = svc.generateBracket(t.id, TENANT);
        // First round should have some auto-completed matches (byes)
        const byeMatches = matches.filter((m) => m.player2Id === undefined && m.status === tournament_entity_1.MatchStatus.Completed);
        strict_1.default.ok(byeMatches.length > 0, 'Should have auto-completed bye matches');
        // Pending matches should have either player2 defined
        const pendingMatches = matches.filter((m) => m.status === tournament_entity_1.MatchStatus.Pending);
        for (const pm of pendingMatches) {
            strict_1.default.ok(pm.player2Id !== undefined && pm.player2Id !== '', 'All pending matches should have player2: ' + pm.id);
        }
    });
    (0, node_test_1.default)('should simulate team registration and approval flow', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, {
            name: 'Team Sim',
            type: tournament_entity_1.TournamentType.League,
            maxParticipants: 32,
        });
        // Register teams
        const regA = svc.registerTeam({
            tournamentId: t.id,
            teamName: 'Alpha',
            captainId: 'captain-a',
            memberIds: ['captain-a', 'm1', 'm2', 'm3'],
        }, TENANT);
        const regB = svc.registerTeam({
            tournamentId: t.id,
            teamName: 'Beta',
            captainId: 'captain-b',
            memberIds: ['captain-b', 'm4'],
        }, TENANT);
        // Approve all
        svc.approveTeam(regA.id, TENANT);
        svc.approveTeam(regB.id, TENANT);
        const teams = svc.listTeamRegistrations(t.id, TENANT);
        strict_1.default.equal(teams.length, 2);
        strict_1.default.equal(teams.every((r) => r.status === 'APPROVED'), true);
    });
});
// ─── Simulator: Stress tests ───
(0, node_test_1.describe)('Tournament Simulator - Stress', () => {
    (0, node_test_1.default)('should handle large tournament with 64 participants', () => {
        const svc = createService();
        const t = svc.createTournament({
            tenantId: TENANT,
            storeId: 'stress-store',
            name: 'Stress 64',
            type: tournament_entity_1.TournamentType.DoubleElimination,
            gameName: 'Stress Game',
            startDate: '2026-08-01',
            endDate: '2026-08-15',
            maxParticipants: 64,
        });
        svc.updateTournamentStatus(t.id, tournament_entity_1.TournamentStatus.Open, TENANT);
        // Simulate registering all 64 participants
        for (let i = 0; i < 64; i++) {
            svc.registerParticipant(t.id, `stress-p-${i}`, TENANT);
        }
        const tAfter = svc.getTournament(t.id, TENANT);
        strict_1.default.equal(tAfter?.currentParticipants, 64);
        // Generate bracket
        const matches = svc.generateBracket(t.id, TENANT);
        strict_1.default.ok(matches.length > 0);
        strict_1.default.equal(tAfter?.status, tournament_entity_1.TournamentStatus.Ongoing);
    });
    (0, node_test_1.default)('should handle duplicate registration attempts', () => {
        const svc = createService();
        const t = createAndOpenTournament(svc, { maxParticipants: 4 });
        svc.registerParticipant(t.id, 'dup-player', TENANT);
        strict_1.default.throws(() => svc.registerParticipant(t.id, 'dup-player', TENANT), /already registered/);
    });
});
//# sourceMappingURL=tournament.simulator.test.js.map