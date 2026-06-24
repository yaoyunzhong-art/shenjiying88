import 'reflect-metadata';
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { TournamentService } from './tournament.service';
import {
  TournamentStatus,
  TournamentType,
  MatchStatus,
  type Tournament,
} from './tournament.entity';

const TENANT = 'sim-tenant-001';

function createService(): TournamentService {
  const svc = new TournamentService();
  svc.resetTournamentStoresForTests();
  return svc;
}

function createAndOpenTournament(
  svc: TournamentService,
  overrides?: Partial<Parameters<TournamentService['createTournament']>[0]>,
): Tournament {
  const t = svc.createTournament({
    tenantId: TENANT,
    storeId: 'sim-store-001',
    name: 'Sim Tournament',
    type: TournamentType.SingleElimination,
    gameName: 'Test Game',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    maxParticipants: 16,
    ...overrides,
  });
  svc.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT);
  return t;
}

function registerNParticipants(svc: TournamentService, tournamentId: string, n: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const memberId = `sim-player-${i.toString().padStart(3, '0')}`;
    svc.registerParticipant(tournamentId, memberId, TENANT);
    ids.push(memberId);
  }
  return ids;
}

// ─── Simulator: Tournament lifecycle simulation ───

describe('Tournament Simulator - Full Lifecycle', () => {
  test('should simulate a complete single-elimination tournament', () => {
    const svc = createService();
    const t = createAndOpenTournament(svc, {
      name: 'Lifecycle Sim',
      type: TournamentType.SingleElimination,
      maxParticipants: 8,
    });

    // Register 8 participants
    registerNParticipants(svc, t.id, 8);

    // Generate bracket (transitions to Ongoing)
    const matches = svc.generateBracket(t.id, TENANT);
    assert.ok(matches.length > 0);

    // Simulate all matches
    let remaining = svc.listMatches(t.id, TENANT, { status: MatchStatus.Pending });
    let safety = 0;
    while (remaining.length > 0 && safety < 20) {
      const match = remaining[0];

      // Simulate a winner
      const result = svc.recordMatchResult(match.id, 2, 1, TENANT);
      assert.equal(result.status, MatchStatus.Completed);

      remaining = svc.listMatches(t.id, TENANT, { status: MatchStatus.Pending });
      safety++;
    }

    // Check tournament completed
    const ended = svc.getTournament(t.id, TENANT);
    assert.equal(ended?.status, TournamentStatus.Completed);

    // Check rankings exist
    const rankings = svc.getRankings(t.id, TENANT);
    assert.ok(rankings.length > 0);
  });

  test('should simulate tournament cancellation mid-way', () => {
    const svc = createService();
    const t = createAndOpenTournament(svc, {
      name: 'Cancellation Sim',
      type: TournamentType.RoundRobin,
      maxParticipants: 4,
    });

    registerNParticipants(svc, t.id, 4);
    svc.generateBracket(t.id, TENANT);

    // Cancel it mid-way
    const cancelled = svc.updateTournamentStatus(t.id, TournamentStatus.Cancelled, TENANT);
    assert.equal(cancelled.status, TournamentStatus.Cancelled);

    // Ensure no further actions possible
    assert.throws(
      () => svc.registerParticipant(t.id, 'new-player', TENANT),
      /Tournament is not open for registration/,
    );
  });
});

// ─── Simulator: Edge cases ───

describe('Tournament Simulator - Edge Cases', () => {
  test('should simulate a round-robin with draws', () => {
    const svc = createService();
    const t = createAndOpenTournament(svc, {
      name: 'Draw Sim',
      type: TournamentType.RoundRobin,
      maxParticipants: 3,
    });

    registerNParticipants(svc, t.id, 3);
    const matches = svc.generateBracket(t.id, TENANT);

    // Record a draw (equal scores)
    const drawMatch = matches.find((m) => m.player2Id !== undefined);
    if (drawMatch) {
      const result = svc.recordMatchResult(drawMatch.id, 1, 1, TENANT);
      assert.equal(result.status, MatchStatus.Completed);
      // Equal scores produce no winner
      const updatedMatch = svc.getMatch(drawMatch.id, TENANT);
      assert.equal(updatedMatch?.winnerId, undefined);
    }

    const rankings = svc.getRankings(t.id, TENANT);
    const drawRanking = rankings.find((r) => r.draws > 0);
    assert.ok(drawRanking, 'Should have at least one ranking entry with draws > 0');
  });

  test('should handle single byes with odd participant count', () => {
    const svc = createService();
    const t = createAndOpenTournament(svc, {
      name: 'Bye Sim',
      type: TournamentType.SingleElimination,
      maxParticipants: 8,
    });

    // Only register 5 participants (generates byes)
    registerNParticipants(svc, t.id, 5);

    const matches = svc.generateBracket(t.id, TENANT);

    // First round should have some auto-completed matches (byes)
    const byeMatches = matches.filter(
      (m) => m.player2Id === undefined && m.status === MatchStatus.Completed,
    );
    assert.ok(byeMatches.length > 0, 'Should have auto-completed bye matches');

    // Pending matches should have either player2 defined
    const pendingMatches = matches.filter((m) => m.status === MatchStatus.Pending);
    for (const pm of pendingMatches) {
      assert.ok(
        pm.player2Id !== undefined && pm.player2Id !== '',
        'All pending matches should have player2: ' + pm.id,
      );
    }
  });

  test('should simulate team registration and approval flow', () => {
    const svc = createService();
    const t = createAndOpenTournament(svc, {
      name: 'Team Sim',
      type: TournamentType.League,
      maxParticipants: 32,
    });

    // Register teams
    const regA = svc.registerTeam(
      {
        tournamentId: t.id,
        teamName: 'Alpha',
        captainId: 'captain-a',
        memberIds: ['captain-a', 'm1', 'm2', 'm3'],
      },
      TENANT,
    );
    const regB = svc.registerTeam(
      {
        tournamentId: t.id,
        teamName: 'Beta',
        captainId: 'captain-b',
        memberIds: ['captain-b', 'm4'],
      },
      TENANT,
    );

    // Approve all
    svc.approveTeam(regA.id, TENANT);
    svc.approveTeam(regB.id, TENANT);

    const teams = svc.listTeamRegistrations(t.id, TENANT);
    assert.equal(teams.length, 2);
    assert.equal(
      teams.every((r) => r.status === 'APPROVED'),
      true,
    );
  });
});

// ─── Simulator: Stress tests ───

describe('Tournament Simulator - Stress', () => {
  test('should handle large tournament with 64 participants', () => {
    const svc = createService();
    const t = svc.createTournament({
      tenantId: TENANT,
      storeId: 'stress-store',
      name: 'Stress 64',
      type: TournamentType.DoubleElimination,
      gameName: 'Stress Game',
      startDate: '2026-08-01',
      endDate: '2026-08-15',
      maxParticipants: 64,
    });
    svc.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT);

    // Simulate registering all 64 participants
    for (let i = 0; i < 64; i++) {
      svc.registerParticipant(t.id, `stress-p-${i}`, TENANT);
    }

    const tAfter = svc.getTournament(t.id, TENANT);
    assert.equal(tAfter?.currentParticipants, 64);

    // Generate bracket
    const matches = svc.generateBracket(t.id, TENANT);
    assert.ok(matches.length > 0);
    assert.equal(tAfter?.status, TournamentStatus.Ongoing);
  });

  test('should handle duplicate registration attempts', () => {
    const svc = createService();
    const t = createAndOpenTournament(svc, { maxParticipants: 4 });

    svc.registerParticipant(t.id, 'dup-player', TENANT);
    assert.throws(() => svc.registerParticipant(t.id, 'dup-player', TENANT), /already registered/);
  });
});
