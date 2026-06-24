import assert from 'node:assert/strict';
import test from 'node:test';
import {
  toTournamentContract,
  toMatchContract,
  toRankingContract,
  toTeamRegistrationContract,
  isTournamentOpenForRegistration,
  hasAvailableSlots,
  isDraw,
} from './tournament.contract';
import {
  TournamentStatus,
  TournamentType,
  MatchStatus,
  TeamRegistrationStatus,
} from './tournament.entity';

/* ------------------------------------------------------------------ */
/*  toTournamentContract                                               */
/* ------------------------------------------------------------------ */

test('toTournamentContract maps full tournament correctly', () => {
  const tournament = {
    id: 't-001',
    tenantId: 'tenant-1',
    brandId: 'brand-1',
    storeId: 'store-1',
    name: '夏季锦标赛',
    description: '大型夏季电竞赛事',
    type: TournamentType.SingleElimination,
    gameName: '王者荣耀',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-15T23:59:59.000Z',
    maxParticipants: 64,
    currentParticipants: 32,
    status: TournamentStatus.Open,
    rules: { matchFormat: 'BO3', scoreMode: 'POINTS' },
    prizes: { first: { label: '冠军', value: '10000元' } },
    bannerImage: 'https://cdn.example.com/banner.png',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z',
  };

  const contract = toTournamentContract(tournament);

  assert.equal(contract.id, 't-001');
  assert.equal(contract.tenantId, 'tenant-1');
  assert.equal(contract.name, '夏季锦标赛');
  assert.equal(contract.type, TournamentType.SingleElimination);
  assert.equal(contract.gameName, '王者荣耀');
  assert.equal(contract.maxParticipants, 64);
  assert.equal(contract.currentParticipants, 32);
  assert.equal(contract.status, TournamentStatus.Open);
  assert.equal(contract.bannerImage, 'https://cdn.example.com/banner.png');
  assert.equal(contract.createdAt, '2026-06-01T08:00:00.000Z');
});

test('toTournamentContract maps tournament with minimal fields', () => {
  const tournament = {
    id: 't-002',
    tenantId: 'tenant-1',
    name: 'Minimal Tournament',
    type: TournamentType.RoundRobin,
    gameName: '街霸6',
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-08-03T23:59:59.000Z',
    maxParticipants: 8,
    currentParticipants: 0,
    status: TournamentStatus.Draft,
    rules: {},
    prizes: {},
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  };

  const contract = toTournamentContract(tournament);

  assert.equal(contract.id, 't-002');
  assert.equal(contract.name, 'Minimal Tournament');
  assert.equal(contract.brandId, undefined);
  assert.equal(contract.storeId, undefined);
  assert.equal(contract.description, undefined);
  assert.equal(contract.bannerImage, undefined);
  assert.equal(contract.currentParticipants, 0);
});

/* ------------------------------------------------------------------ */
/*  toMatchContract                                                    */
/* ------------------------------------------------------------------ */

test('toMatchContract maps match with both players and result', () => {
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
    status: MatchStatus.Completed,
    scheduledAt: '2026-07-02T14:00:00.000Z',
    playedAt: '2026-07-02T14:30:00.000Z',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-02T14:31:00.000Z',
  };

  const contract = toMatchContract(match);

  assert.equal(contract.id, 'm-001');
  assert.equal(contract.tournamentId, 't-001');
  assert.equal(contract.round, 1);
  assert.equal(contract.player1Id, 'player-a');
  assert.equal(contract.player2Id, 'player-b');
  assert.equal(contract.winnerId, 'player-a');
  assert.equal(contract.score1, 3);
  assert.equal(contract.score2, 1);
  assert.equal(contract.status, MatchStatus.Completed);
  assert.equal(contract.scheduledAt, '2026-07-02T14:00:00.000Z');
});

test('toMatchContract maps match with bye (no player2)', () => {
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
    status: MatchStatus.Completed,
    scheduledAt: undefined,
    playedAt: '2026-07-02T10:00:00.000Z',
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-02T10:00:00.000Z',
  };

  const contract = toMatchContract(match);

  assert.equal(contract.player2Id, undefined);
  assert.equal(contract.winnerId, 'player-c');
  assert.equal(contract.scheduledAt, undefined);
});

/* ------------------------------------------------------------------ */
/*  toRankingContract                                                  */
/* ------------------------------------------------------------------ */

test('toRankingContract maps ranking with all fields', () => {
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

  const contract = toRankingContract(ranking);

  assert.equal(contract.tournamentId, 't-001');
  assert.equal(contract.memberId, 'member-x');
  assert.equal(contract.rank, 1);
  assert.equal(contract.points, 15);
  assert.equal(contract.wins, 5);
  assert.equal(contract.losses, 0);
  assert.equal(contract.draws, 0);
});

/* ------------------------------------------------------------------ */
/*  toTeamRegistrationContract                                         */
/* ------------------------------------------------------------------ */

test('toTeamRegistrationContract maps team registration correctly', () => {
  const reg = {
    id: 'tr-001',
    tournamentId: 't-001',
    teamName: '战神队',
    captainId: 'captain-a',
    memberIds: ['captain-a', 'member-b', 'member-c', 'member-d'],
    status: TeamRegistrationStatus.Approved,
    createdAt: '2026-06-20T08:00:00.000Z',
    updatedAt: '2026-06-21T10:00:00.000Z',
  };

  const contract = toTeamRegistrationContract(reg);

  assert.equal(contract.id, 'tr-001');
  assert.equal(contract.teamName, '战神队');
  assert.equal(contract.captainId, 'captain-a');
  assert.equal(contract.memberCount, 4);
  assert.equal(contract.status, TeamRegistrationStatus.Approved);
  assert.equal(contract.createdAt, '2026-06-20T08:00:00.000Z');
});

test('toTeamRegistrationContract maps single-member team', () => {
  const reg = {
    id: 'tr-002',
    tournamentId: 't-001',
    teamName: 'Solo',
    captainId: 'solo-player',
    memberIds: ['solo-player'],
    status: TeamRegistrationStatus.Pending,
    createdAt: '2026-06-25T08:00:00.000Z',
    updatedAt: '2026-06-25T08:00:00.000Z',
  };

  const contract = toTeamRegistrationContract(reg);

  assert.equal(contract.memberCount, 1);
  assert.equal(contract.status, TeamRegistrationStatus.Pending);
});

/* ------------------------------------------------------------------ */
/*  isTournamentOpenForRegistration                                    */
/* ------------------------------------------------------------------ */

test('isTournamentOpenForRegistration returns true for OPEN status', () => {
  assert.equal(isTournamentOpenForRegistration('OPEN'), true);
});

test('isTournamentOpenForRegistration returns false for non-OPEN statuses', () => {
  assert.equal(isTournamentOpenForRegistration('DRAFT'), false);
  assert.equal(isTournamentOpenForRegistration('ONGOING'), false);
  assert.equal(isTournamentOpenForRegistration('COMPLETED'), false);
  assert.equal(isTournamentOpenForRegistration('CANCELLED'), false);
});

/* ------------------------------------------------------------------ */
/*  hasAvailableSlots                                                   */
/* ------------------------------------------------------------------ */

test('hasAvailableSlots returns true when slots remain', () => {
  assert.equal(hasAvailableSlots(32, 64), true);
  assert.equal(hasAvailableSlots(0, 8), true);
  assert.equal(hasAvailableSlots(63, 64), true);
});

test('hasAvailableSlots returns false when full or over capacity', () => {
  assert.equal(hasAvailableSlots(64, 64), false);
  assert.equal(hasAvailableSlots(100, 64), false);
});

/* ------------------------------------------------------------------ */
/*  isDraw                                                              */
/* ------------------------------------------------------------------ */

test('isDraw returns true when scores are equal', () => {
  assert.equal(isDraw(0, 0), true);
  assert.equal(isDraw(3, 3), true);
  assert.equal(isDraw(100, 100), true);
});

test('isDraw returns false when scores differ', () => {
  assert.equal(isDraw(2, 1), false);
  assert.equal(isDraw(0, 1), false);
  assert.equal(isDraw(5, 3), false);
});
