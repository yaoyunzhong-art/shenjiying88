/**
 * 🐜 自动: [tournament] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe, beforeEach, afterEach } from 'node:test'
import { TournamentService } from './tournament.service'
import {
  TournamentStatus,
  TournamentType,
  MatchStatus,
  TeamRegistrationStatus,
  type Tournament,
  type Match,
} from './tournament.entity'

describe('TournamentService', () => {
  let service: TournamentService

  const TENANT = 'tenant-001'
  const STORE = 'store-001'

  beforeEach(() => {
    service = new TournamentService()
  })

  afterEach(() => {
    service.resetTournamentStoresForTests()
  })

  function createTestTournament(overrides?: Partial<Parameters<TournamentService['createTournament']>[0]>): Tournament {
    return service.createTournament({
      tenantId: TENANT,
      storeId: STORE,
      name: 'Test Tournament',
      type: TournamentType.SingleElimination,
      gameName: 'Test Game',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      maxParticipants: 16,
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createTournament', () => {
    test('should create a tournament with DRAFT status', () => {
      const t = createTestTournament()

      assert.equal(t.name, 'Test Tournament')
      assert.equal(t.type, TournamentType.SingleElimination)
      assert.equal(t.status, TournamentStatus.Draft)
      assert.equal(t.tenantId, TENANT)
      assert.equal(t.storeId, STORE)
      assert.equal(t.currentParticipants, 0)
      assert.ok(t.id.startsWith('tournament-'))
      assert.ok(t.createdAt)
      assert.ok(t.updatedAt)
    })

    test('should create tournament with optional fields', () => {
      const t = service.createTournament({
        tenantId: TENANT,
        name: 'Rich Tournament',
        type: TournamentType.RoundRobin,
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
      })

      assert.equal(t.description, 'A chess tournament')
      assert.deepStrictEqual(t.rules, { matchFormat: 'BO3', allowDraws: true })
      assert.ok(t.prizes)
      assert.equal(t.prizes.first?.value, '1000元')
      assert.equal(t.bannerImage, 'https://img.example.com/banner.png')
    })
  })

  describe('getTournament', () => {
    test('should return tournament by id', () => {
      const t = createTestTournament()
      const found = service.getTournament(t.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, t.id)
    })

    test('should return undefined for non-existent tournament', () => {
      const found = service.getTournament('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    test('should return undefined for wrong tenant', () => {
      const t = createTestTournament()
      const found = service.getTournament(t.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listTournaments', () => {
    test('should list all tournaments for tenant', () => {
      createTestTournament({ name: 'T1' })
      createTestTournament({ name: 'T2' })

      const list = service.listTournaments(TENANT)
      assert.equal(list.length, 2)
    })

    test('should filter by status', () => {
      createTestTournament({ name: 'T1' })
      const t2 = createTestTournament({ name: 'T2' })
      service.updateTournamentStatus(t2.id, TournamentStatus.Open, TENANT)

      const open = service.listTournaments(TENANT, { status: TournamentStatus.Open })
      assert.equal(open.length, 1)
      assert.equal(open[0].status, TournamentStatus.Open)
    })

    test('should filter by type', () => {
      createTestTournament({ name: 'SE', type: TournamentType.SingleElimination })
      createTestTournament({ name: 'RR', type: TournamentType.RoundRobin })

      const rr = service.listTournaments(TENANT, { type: TournamentType.RoundRobin })
      assert.equal(rr.length, 1)
      assert.equal(rr[0].name, 'RR')
    })

    test('should filter by storeId', () => {
      createTestTournament({ name: 'S1', storeId: 'store-1' })
      createTestTournament({ name: 'S2', storeId: 'store-2' })

      const s1 = service.listTournaments(TENANT, { storeId: 'store-1' })
      assert.equal(s1.length, 1)
    })

    test('should return empty for wrong tenant', () => {
      createTestTournament()
      const list = service.listTournaments('wrong-tenant')
      assert.equal(list.length, 0)
    })
  })

  describe('updateTournament', () => {
    test('should update tournament fields', () => {
      const t = createTestTournament()
      const updated = service.updateTournament(t.id, TENANT, {
        name: 'Updated Name',
        maxParticipants: 64,
      })

      assert.equal(updated.name, 'Updated Name')
      assert.equal(updated.maxParticipants, 64)
    })

    test('should throw for non-existent tournament', () => {
      assert.throws(
        () => service.updateTournament('nonexistent', TENANT, { name: 'X' }),
        /Tournament not found/
      )
    })

    test('should throw for wrong tenant', () => {
      const t = createTestTournament()
      assert.throws(
        () => service.updateTournament(t.id, 'wrong-tenant', { name: 'X' }),
        /Tournament not found/
      )
    })
  })

  // ── Status transitions ──

  describe('updateTournamentStatus', () => {
    test('should transition Draft → Open', () => {
      const t = createTestTournament()
      const updated = service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      assert.equal(updated.status, TournamentStatus.Open)
    })

    test('should transition Draft → Cancelled', () => {
      const t = createTestTournament()
      const updated = service.updateTournamentStatus(t.id, TournamentStatus.Cancelled, TENANT)
      assert.equal(updated.status, TournamentStatus.Cancelled)
    })

    test('should transition Open → Ongoing', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      const updated = service.updateTournamentStatus(t.id, TournamentStatus.Ongoing, TENANT)
      assert.equal(updated.status, TournamentStatus.Ongoing)
    })

    test('should transition Ongoing → Completed', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.updateTournamentStatus(t.id, TournamentStatus.Ongoing, TENANT)
      const updated = service.updateTournamentStatus(t.id, TournamentStatus.Completed, TENANT)
      assert.equal(updated.status, TournamentStatus.Completed)
    })

    test('should transition Cancelled → Draft (reopen)', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Cancelled, TENANT)
      const updated = service.updateTournamentStatus(t.id, TournamentStatus.Draft, TENANT)
      assert.equal(updated.status, TournamentStatus.Draft)
    })

    test('should reject invalid transition: Draft → Completed', () => {
      const t = createTestTournament()
      assert.throws(
        () => service.updateTournamentStatus(t.id, TournamentStatus.Completed, TENANT),
        /Invalid tournament status transition/
      )
    })

    test('should reject invalid transition: Completed → Open', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.updateTournamentStatus(t.id, TournamentStatus.Ongoing, TENANT)
      service.updateTournamentStatus(t.id, TournamentStatus.Completed, TENANT)
      assert.throws(
        () => service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT),
        /Invalid tournament status transition/
      )
    })
  })

  // ── Registration ──

  describe('registerParticipant', () => {
    test('should register a participant when tournament is OPEN', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      const updated = service.registerParticipant(t.id, 'mem-001', TENANT)

      assert.equal(updated.currentParticipants, 1)
    })

    test('should throw when tournament is not OPEN', () => {
      const t = createTestTournament()
      assert.throws(
        () => service.registerParticipant(t.id, 'mem-001', TENANT),
        /Tournament is not open for registration/
      )
    })

    test('should throw when max participants reached', () => {
      const t = createTestTournament({ maxParticipants: 2 })
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      assert.throws(
        () => service.registerParticipant(t.id, 'mem-003', TENANT),
        /Tournament has reached maximum participants/
      )
    })

    test('should throw for duplicate registration', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)

      assert.throws(
        () => service.registerParticipant(t.id, 'mem-001', TENANT),
        /Participant already registered/
      )
    })

    test('should throw for wrong tenant', () => {
      const t = createTestTournament()
      assert.throws(
        () => service.registerParticipant(t.id, 'mem-001', 'wrong-tenant'),
        /Tournament not found/
      )
    })
  })

  // ── Team registration ──

  describe('registerTeam', () => {
    test('should register a team when tournament is OPEN', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)

      const reg = service.registerTeam({
        tournamentId: t.id,
        teamName: 'Team Alpha',
        captainId: 'mem-001',
        memberIds: ['mem-001', 'mem-002'],
      }, TENANT)

      assert.equal(reg.teamName, 'Team Alpha')
      assert.equal(reg.status, TeamRegistrationStatus.Pending)
      assert.ok(reg.id.startsWith('teamreg-'))
    })

    test('should throw when tournament is not OPEN', () => {
      const t = createTestTournament()
      assert.throws(
        () => service.registerTeam({
          tournamentId: t.id,
          teamName: 'Team',
          captainId: 'mem-001',
          memberIds: ['mem-001'],
        }, TENANT),
        /Tournament is not open for registration/
      )
    })
  })

  describe('approveTeam / rejectTeam', () => {
    test('should approve a team registration', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      const reg = service.registerTeam({
        tournamentId: t.id, teamName: 'T', captainId: 'c', memberIds: ['c'],
      }, TENANT)

      const approved = service.approveTeam(reg.id, TENANT)
      assert.equal(approved.status, TeamRegistrationStatus.Approved)
    })

    test('should reject a team registration', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      const reg = service.registerTeam({
        tournamentId: t.id, teamName: 'T', captainId: 'c', memberIds: ['c'],
      }, TENANT)

      const rejected = service.rejectTeam(reg.id, TENANT)
      assert.equal(rejected.status, TeamRegistrationStatus.Rejected)
    })

    test('should throw for non-existent team', () => {
      assert.throws(
        () => service.approveTeam('nonexistent', TENANT),
        /Team registration not found/
      )
    })

    test('should verify tenant when approving', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      const reg = service.registerTeam({
        tournamentId: t.id, teamName: 'T', captainId: 'c', memberIds: ['c'],
      }, TENANT)

      assert.throws(
        () => service.approveTeam(reg.id, 'wrong-tenant'),
        /Tournament not found/
      )
    })
  })

  describe('listTeamRegistrations', () => {
    test('should list team registrations for a tournament', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerTeam({ tournamentId: t.id, teamName: 'A', captainId: 'm1', memberIds: ['m1'] }, TENANT)
      service.registerTeam({ tournamentId: t.id, teamName: 'B', captainId: 'm2', memberIds: ['m2'] }, TENANT)

      const list = service.listTeamRegistrations(t.id, TENANT)
      assert.equal(list.length, 2)
    })
  })

  // ── Bracket & Matches ──

  describe('generateBracket', () => {
    test('should generate bracket when tournament is OPEN and has participants', () => {
      const t = createTestTournament({ type: TournamentType.SingleElimination })
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)
      service.registerParticipant(t.id, 'mem-003', TENANT)
      service.registerParticipant(t.id, 'mem-004', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      assert.ok(matches.length > 0)
      // Tournament should transition to Ongoing
      const updated = service.getTournament(t.id, TENANT)
      assert.equal(updated?.status, TournamentStatus.Ongoing)
    })

    test('should throw if less than 2 participants', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)

      assert.throws(
        () => service.generateBracket(t.id, TENANT),
        /Need at least 2 participants/
      )
    })

    test('should throw if tournament is not OPEN', () => {
      const t = createTestTournament()
      assert.throws(
        () => service.generateBracket(t.id, TENANT),
        /Bracket can only be generated when tournament is OPEN/
      )
    })

    test('should generate round-robin matches', () => {
      const t = createTestTournament({ type: TournamentType.RoundRobin })
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)
      service.registerParticipant(t.id, 'mem-003', TENANT)
      // 3 participants: C(3,2) = 3 matches

      const matches = service.generateBracket(t.id, TENANT)
      assert.equal(matches.length, 3)
    })
  })

  describe('recordMatchResult', () => {
    test('should record match result and update rankings', () => {
      const t = createTestTournament({ type: TournamentType.RoundRobin })
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      const match = matches[0]

      const updated = service.recordMatchResult(match.id, 2, 1, TENANT)
      assert.equal(updated.status, MatchStatus.Completed)
      assert.equal(updated.score1, 2)
      assert.equal(updated.score2, 1)
      assert.equal(updated.winnerId, match.player1Id)
      assert.ok(updated.playedAt)
    })

    test('should throw for non-existent match', () => {
      assert.throws(
        () => service.recordMatchResult('nonexistent', 2, 1, TENANT),
        /Match not found/
      )
    })

    test('should throw for already completed match', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      service.recordMatchResult(matches[0].id, 2, 1, TENANT)

      assert.throws(
        () => service.recordMatchResult(matches[0].id, 3, 2, TENANT),
        /Match already completed/
      )
    })

    test('should throw for wrong tenant', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      assert.throws(
        () => service.recordMatchResult(matches[0].id, 2, 1, 'wrong-tenant'),
        /Tournament not found/
      )
    })
  })

  describe('setDisputed', () => {
    test('should set match status to Disputed', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      const disputed = service.setDisputed(matches[0].id, TENANT)

      assert.equal(disputed.status, MatchStatus.Disputed)
    })

    test('should throw for non-existent match', () => {
      assert.throws(
        () => service.setDisputed('nonexistent', TENANT),
        /Match not found/
      )
    })
  })

  describe('getMatch / listMatches', () => {
    test('should get a match by id', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      const match = service.getMatch(matches[0].id, TENANT)

      assert.ok(match)
      assert.equal(match?.id, matches[0].id)
    })

    test('should return undefined for non-existent match', () => {
      const match = service.getMatch('nonexistent', TENANT)
      assert.equal(match, undefined)
    })

    test('should return undefined for wrong tenant', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      const match = service.getMatch(matches[0].id, 'wrong-tenant')
      assert.equal(match, undefined)
    })

    test('should list matches with filter', () => {
      const t = createTestTournament({ type: TournamentType.RoundRobin })
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)
      service.registerParticipant(t.id, 'mem-003', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      const list = service.listMatches(t.id, TENANT)
      assert.equal(list.length, matches.length)
    })
  })

  describe('getUpcomingMatches', () => {
    test('should return upcoming matches for a member', () => {
      const t = createTestTournament()
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      service.generateBracket(t.id, TENANT)
      const upcoming = service.getUpcomingMatches('mem-001')
      assert.ok(upcoming.length > 0)
    })

    test('should return empty for non-participant', () => {
      const upcoming = service.getUpcomingMatches('mem-999')
      assert.equal(upcoming.length, 0)
    })
  })

  describe('getLiveMatches', () => {
    test('should return live matches for a store', () => {
      const live = service.getLiveMatches(STORE)
      assert.equal(live.length, 0)
    })
  })

  // ── Rankings ──

  describe('getRankings', () => {
    test('should return empty rankings for tournament with no matches', () => {
      const t = createTestTournament()
      const rankings = service.getRankings(t.id, TENANT)
      assert.equal(rankings.length, 0)
    })

    test('should return ranked players after matches', () => {
      const t = createTestTournament({ type: TournamentType.RoundRobin })
      service.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
      service.registerParticipant(t.id, 'mem-001', TENANT)
      service.registerParticipant(t.id, 'mem-002', TENANT)

      const matches = service.generateBracket(t.id, TENANT)
      service.recordMatchResult(matches[0].id, 2, 1, TENANT)

      const rankings = service.getRankings(t.id, TENANT)
      assert.ok(rankings.length > 0)

      const winner = rankings.find((r) => r.memberId === matches[0].player1Id)
      assert.ok(winner)
      assert.equal(winner?.rank, 1)
      assert.equal(winner?.wins, 1)
      assert.equal(winner?.points, 3)
    })
  })
})
