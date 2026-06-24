"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const tournament_contract_1 = require("./tournament.contract");
const tournament_entity_1 = require("./tournament.entity");
/* ------------------------------------------------------------------ */
/*  toTournamentContract                                               */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTournamentContract maps full tournament correctly', () => {
    const tournament = {
        id: 't-001',
        tenantId: 'tenant-1',
        brandId: 'brand-1',
        storeId: 'store-1',
        name: '夏季锦标赛',
        description: '大型夏季电竞赛事',
        type: tournament_entity_1.TournamentType.SingleElimination,
        gameName: '王者荣耀',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-15T23:59:59.000Z',
        maxParticipants: 64,
        currentParticipants: 32,
        status: tournament_entity_1.TournamentStatus.Open,
        rules: { matchFormat: 'BO3', scoreMode: 'POINTS' },
        prizes: { first: { label: '冠军', value: '10000元' } },
        bannerImage: 'https://cdn.example.com/banner.png',
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-15T10:00:00.000Z',
    };
    const contract = (0, tournament_contract_1.toTournamentContract)(tournament);
    strict_1.default.equal(contract.id, 't-001');
    strict_1.default.equal(contract.tenantId, 'tenant-1');
    strict_1.default.equal(contract.name, '夏季锦标赛');
    strict_1.default.equal(contract.type, tournament_entity_1.TournamentType.SingleElimination);
    strict_1.default.equal(contract.gameName, '王者荣耀');
    strict_1.default.equal(contract.maxParticipants, 64);
    strict_1.default.equal(contract.currentParticipants, 32);
    strict_1.default.equal(contract.status, tournament_entity_1.TournamentStatus.Open);
    strict_1.default.equal(contract.bannerImage, 'https://cdn.example.com/banner.png');
    strict_1.default.equal(contract.createdAt, '2026-06-01T08:00:00.000Z');
});
(0, node_test_1.default)('toTournamentContract maps tournament with minimal fields', () => {
    const tournament = {
        id: 't-002',
        tenantId: 'tenant-1',
        name: 'Minimal Tournament',
        type: tournament_entity_1.TournamentType.RoundRobin,
        gameName: '街霸6',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-03T23:59:59.000Z',
        maxParticipants: 8,
        currentParticipants: 0,
        status: tournament_entity_1.TournamentStatus.Draft,
        rules: {},
        prizes: {},
        createdAt: '2026-07-01T08:00:00.000Z',
        updatedAt: '2026-07-01T08:00:00.000Z',
    };
    const contract = (0, tournament_contract_1.toTournamentContract)(tournament);
    strict_1.default.equal(contract.id, 't-002');
    strict_1.default.equal(contract.name, 'Minimal Tournament');
    strict_1.default.equal(contract.brandId, undefined);
    strict_1.default.equal(contract.storeId, undefined);
    strict_1.default.equal(contract.description, undefined);
    strict_1.default.equal(contract.bannerImage, undefined);
    strict_1.default.equal(contract.currentParticipants, 0);
});
/* ------------------------------------------------------------------ */
/*  toMatchContract                                                    */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toMatchContract maps match with both players and result', () => {
    const match = {
        id: 'm-001',
        tournamentId: 't-001',
        round: 1,
        bracketPosition: 0,
        player1Id: 'player-a',
        player2Id: 'player-b',
        winnerId: 'player-a',
        score1: 3,
        score2: 1,
        status: tournament_entity_1.MatchStatus.Completed,
        scheduledAt: '2026-07-02T14:00:00.000Z',
        playedAt: '2026-07-02T14:30:00.000Z',
        createdAt: '2026-07-01T08:00:00.000Z',
        updatedAt: '2026-07-02T14:31:00.000Z',
    };
    const contract = (0, tournament_contract_1.toMatchContract)(match);
    strict_1.default.equal(contract.id, 'm-001');
    strict_1.default.equal(contract.tournamentId, 't-001');
    strict_1.default.equal(contract.round, 1);
    strict_1.default.equal(contract.player1Id, 'player-a');
    strict_1.default.equal(contract.player2Id, 'player-b');
    strict_1.default.equal(contract.winnerId, 'player-a');
    strict_1.default.equal(contract.score1, 3);
    strict_1.default.equal(contract.score2, 1);
    strict_1.default.equal(contract.status, tournament_entity_1.MatchStatus.Completed);
    strict_1.default.equal(contract.scheduledAt, '2026-07-02T14:00:00.000Z');
});
(0, node_test_1.default)('toMatchContract maps match with bye (no player2)', () => {
    const match = {
        id: 'm-002',
        tournamentId: 't-001',
        round: 1,
        bracketPosition: 3,
        player1Id: 'player-c',
        player2Id: undefined,
        winnerId: 'player-c',
        score1: 0,
        score2: 0,
        status: tournament_entity_1.MatchStatus.Completed,
        scheduledAt: undefined,
        playedAt: '2026-07-02T10:00:00.000Z',
        createdAt: '2026-07-01T08:00:00.000Z',
        updatedAt: '2026-07-02T10:00:00.000Z',
    };
    const contract = (0, tournament_contract_1.toMatchContract)(match);
    strict_1.default.equal(contract.player2Id, undefined);
    strict_1.default.equal(contract.winnerId, 'player-c');
    strict_1.default.equal(contract.scheduledAt, undefined);
});
/* ------------------------------------------------------------------ */
/*  toRankingContract                                                  */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toRankingContract maps ranking with all fields', () => {
    const ranking = {
        id: 'r-001',
        tournamentId: 't-001',
        memberId: 'member-x',
        rank: 1,
        points: 15,
        wins: 5,
        losses: 0,
        draws: 0,
        updatedAt: '2026-07-15T20:00:00.000Z',
    };
    const contract = (0, tournament_contract_1.toRankingContract)(ranking);
    strict_1.default.equal(contract.tournamentId, 't-001');
    strict_1.default.equal(contract.memberId, 'member-x');
    strict_1.default.equal(contract.rank, 1);
    strict_1.default.equal(contract.points, 15);
    strict_1.default.equal(contract.wins, 5);
    strict_1.default.equal(contract.losses, 0);
    strict_1.default.equal(contract.draws, 0);
});
/* ------------------------------------------------------------------ */
/*  toTeamRegistrationContract                                         */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTeamRegistrationContract maps team registration correctly', () => {
    const reg = {
        id: 'tr-001',
        tournamentId: 't-001',
        teamName: '战神队',
        captainId: 'captain-a',
        memberIds: ['captain-a', 'member-b', 'member-c', 'member-d'],
        status: tournament_entity_1.TeamRegistrationStatus.Approved,
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z',
    };
    const contract = (0, tournament_contract_1.toTeamRegistrationContract)(reg);
    strict_1.default.equal(contract.id, 'tr-001');
    strict_1.default.equal(contract.teamName, '战神队');
    strict_1.default.equal(contract.captainId, 'captain-a');
    strict_1.default.equal(contract.memberCount, 4);
    strict_1.default.equal(contract.status, tournament_entity_1.TeamRegistrationStatus.Approved);
    strict_1.default.equal(contract.createdAt, '2026-06-20T08:00:00.000Z');
});
(0, node_test_1.default)('toTeamRegistrationContract maps single-member team', () => {
    const reg = {
        id: 'tr-002',
        tournamentId: 't-001',
        teamName: 'Solo',
        captainId: 'solo-player',
        memberIds: ['solo-player'],
        status: tournament_entity_1.TeamRegistrationStatus.Pending,
        createdAt: '2026-06-25T08:00:00.000Z',
        updatedAt: '2026-06-25T08:00:00.000Z',
    };
    const contract = (0, tournament_contract_1.toTeamRegistrationContract)(reg);
    strict_1.default.equal(contract.memberCount, 1);
    strict_1.default.equal(contract.status, tournament_entity_1.TeamRegistrationStatus.Pending);
});
/* ------------------------------------------------------------------ */
/*  isTournamentOpenForRegistration                                    */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('isTournamentOpenForRegistration returns true for OPEN status', () => {
    strict_1.default.equal((0, tournament_contract_1.isTournamentOpenForRegistration)('OPEN'), true);
});
(0, node_test_1.default)('isTournamentOpenForRegistration returns false for non-OPEN statuses', () => {
    strict_1.default.equal((0, tournament_contract_1.isTournamentOpenForRegistration)('DRAFT'), false);
    strict_1.default.equal((0, tournament_contract_1.isTournamentOpenForRegistration)('ONGOING'), false);
    strict_1.default.equal((0, tournament_contract_1.isTournamentOpenForRegistration)('COMPLETED'), false);
    strict_1.default.equal((0, tournament_contract_1.isTournamentOpenForRegistration)('CANCELLED'), false);
});
/* ------------------------------------------------------------------ */
/*  hasAvailableSlots                                                   */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('hasAvailableSlots returns true when slots remain', () => {
    strict_1.default.equal((0, tournament_contract_1.hasAvailableSlots)(32, 64), true);
    strict_1.default.equal((0, tournament_contract_1.hasAvailableSlots)(0, 8), true);
    strict_1.default.equal((0, tournament_contract_1.hasAvailableSlots)(63, 64), true);
});
(0, node_test_1.default)('hasAvailableSlots returns false when full or over capacity', () => {
    strict_1.default.equal((0, tournament_contract_1.hasAvailableSlots)(64, 64), false);
    strict_1.default.equal((0, tournament_contract_1.hasAvailableSlots)(100, 64), false);
});
/* ------------------------------------------------------------------ */
/*  isDraw                                                              */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('isDraw returns true when scores are equal', () => {
    strict_1.default.equal((0, tournament_contract_1.isDraw)(0, 0), true);
    strict_1.default.equal((0, tournament_contract_1.isDraw)(3, 3), true);
    strict_1.default.equal((0, tournament_contract_1.isDraw)(100, 100), true);
});
(0, node_test_1.default)('isDraw returns false when scores differ', () => {
    strict_1.default.equal((0, tournament_contract_1.isDraw)(2, 1), false);
    strict_1.default.equal((0, tournament_contract_1.isDraw)(0, 1), false);
    strict_1.default.equal((0, tournament_contract_1.isDraw)(5, 3), false);
});
//# sourceMappingURL=tournament.contract.test.js.map