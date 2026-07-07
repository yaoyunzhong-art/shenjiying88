import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tournament] [D] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
describe('TournamentController', () => {
  const { TournamentController } = require('./tournament.controller')
  const { TournamentService } = require('./tournament.service')
  const {
    TournamentType,
    TournamentStatus,
  } = require('./tournament.entity')

  let controller: InstanceType<typeof TournamentController>
  let service: InstanceType<typeof TournamentService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  beforeEach(() => {
    service = new TournamentService()
    controller = new TournamentController(service)
  })

  afterEach(() => {
    service.resetTournamentStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be tournaments', () => {
      const path = Reflect.getMetadata('path', TournamentController)
      assert.equal(path, 'tournaments')
    })

    it('createTournament should be POST /', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.createTournament)
      const path = Reflect.getMetadata('path', TournamentController.prototype.createTournament)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listTournaments should be GET /', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.listTournaments)
      const path = Reflect.getMetadata('path', TournamentController.prototype.listTournaments)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getTournament should be GET /:tournamentId', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.getTournament)
      const path = Reflect.getMetadata('path', TournamentController.prototype.getTournament)
      assert.equal(method, 0)
      assert.equal(path, ':tournamentId')
    })

    it('updateTournament should be PATCH /:tournamentId', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.updateTournament)
      const path = Reflect.getMetadata('path', TournamentController.prototype.updateTournament)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':tournamentId')
    })

    it('updateTournamentStatus should be PATCH /:tournamentId/status', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.updateTournamentStatus)
      const path = Reflect.getMetadata('path', TournamentController.prototype.updateTournamentStatus)
      assert.equal(method, 4)
      assert.equal(path, ':tournamentId/status')
    })

    it('registerParticipant should be POST /:tournamentId/register', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.registerParticipant)
      const path = Reflect.getMetadata('path', TournamentController.prototype.registerParticipant)
      assert.equal(method, 1)
      assert.equal(path, ':tournamentId/register')
    })

    it('registerTeam should be POST /:tournamentId/teams', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.registerTeam)
      const path = Reflect.getMetadata('path', TournamentController.prototype.registerTeam)
      assert.equal(method, 1)
      assert.equal(path, ':tournamentId/teams')
    })

    it('approveTeam should be PATCH /:tournamentId/teams/approve', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.approveTeam)
      const path = Reflect.getMetadata('path', TournamentController.prototype.approveTeam)
      assert.equal(method, 4)
      assert.equal(path, ':tournamentId/teams/approve')
    })

    it('rejectTeam should be PATCH /:tournamentId/teams/reject', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.rejectTeam)
      const path = Reflect.getMetadata('path', TournamentController.prototype.rejectTeam)
      assert.equal(method, 4)
      assert.equal(path, ':tournamentId/teams/reject')
    })

    it('generateBracket should be POST /:tournamentId/bracket/generate', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.generateBracket)
      const path = Reflect.getMetadata('path', TournamentController.prototype.generateBracket)
      assert.equal(method, 1)
      assert.equal(path, ':tournamentId/bracket/generate')
    })

    it('listMatches should be GET /:tournamentId/matches', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.listMatches)
      const path = Reflect.getMetadata('path', TournamentController.prototype.listMatches)
      assert.equal(method, 0)
      assert.equal(path, ':tournamentId/matches')
    })

    it('getMatch should be GET /matches/:matchId', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.getMatch)
      const path = Reflect.getMetadata('path', TournamentController.prototype.getMatch)
      assert.equal(method, 0)
      assert.equal(path, 'matches/:matchId')
    })

    it('recordMatchResult should be PATCH /matches/:matchId/result', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.recordMatchResult)
      const path = Reflect.getMetadata('path', TournamentController.prototype.recordMatchResult)
      assert.equal(method, 4)
      assert.equal(path, 'matches/:matchId/result')
    })

    it('setDisputed should be PATCH /matches/:matchId/dispute', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.setDisputed)
      const path = Reflect.getMetadata('path', TournamentController.prototype.setDisputed)
      assert.equal(method, 4)
      assert.equal(path, 'matches/:matchId/dispute')
    })

    it('getRankings should be GET /:tournamentId/rankings', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.getRankings)
      const path = Reflect.getMetadata('path', TournamentController.prototype.getRankings)
      assert.equal(method, 0)
      assert.equal(path, ':tournamentId/rankings')
    })

    it('getUpcomingMatches should be GET /members/:memberId/upcoming', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.getUpcomingMatches)
      const path = Reflect.getMetadata('path', TournamentController.prototype.getUpcomingMatches)
      assert.equal(method, 0)
      assert.equal(path, 'members/:memberId/upcoming')
    })

    it('getLiveMatches should be GET /stores/:storeId/live', () => {
      const method = Reflect.getMetadata('method', TournamentController.prototype.getLiveMatches)
      const path = Reflect.getMetadata('path', TournamentController.prototype.getLiveMatches)
      assert.equal(method, 0)
      assert.equal(path, 'stores/:storeId/live')
    })
  })

  // ── Tournament CRUD via controller ──

  describe('POST /tournaments', () => {
    it('should create tournament', () => {
      const result = controller.createTournament(TENANT, {
        name: 'Summer Cup',
        type: TournamentType.SingleElimination,
        gameName: 'Street Fighter 6',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 64,
      })

      assert.equal(result.name, 'Summer Cup')
      assert.equal(result.status, TournamentStatus.Draft)
      assert.ok(result.id.startsWith('tournament-'))
    })
  })

  describe('GET /tournaments', () => {
    it('should list tournaments', () => {
      controller.createTournament(TENANT, {
        name: 'T1',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })

      const list = controller.listTournaments(TENANT, {})
      assert.equal(list.length, 1)
      assert.equal(list[0].name, 'T1')
    })

    it('should list with status filter', () => {
      controller.createTournament(TENANT, {
        name: 'Draft Tournament',
        type: TournamentType.League,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 8,
      })

      const list = controller.listTournaments(TENANT, { status: TournamentStatus.Draft })
      assert.equal(list.length, 1)
    })
  })

  describe('GET /tournaments/:tournamentId', () => {
    it('should get tournament', () => {
      const created = controller.createTournament(TENANT, {
        name: 'Get Me',
        type: TournamentType.SingleElimination,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })

      const found = controller.getTournament(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.name, 'Get Me')
    })
  })

  describe('PATCH /tournaments/:tournamentId', () => {
    it('should update tournament', () => {
      const created = controller.createTournament(TENANT, {
        name: 'Old',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })

      const updated = controller.updateTournament(TENANT, created.id, { name: 'New' })
      assert.equal(updated.name, 'New')
    })
  })

  describe('PATCH /tournaments/:tournamentId/status', () => {
    it('should update status Draft → Open', () => {
      const created = controller.createTournament(TENANT, {
        name: 'Status Test',
        type: TournamentType.SingleElimination,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })

      const updated = controller.updateTournamentStatus(TENANT, created.id, {
        status: TournamentStatus.Open,
      })
      assert.equal(updated.status, TournamentStatus.Open)
    })
  })

  // ── Registration via controller ──

  describe('POST /tournaments/:tournamentId/register', () => {
    it('should register participant', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Reg Test',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 4,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })

      const result = controller.registerParticipant(TENANT, t.id, { memberId: 'mem-001' })
      assert.equal(result.currentParticipants, 1)
    })
  })

  describe('POST /tournaments/:tournamentId/teams', () => {
    it('should register a team', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Team Test',
        type: TournamentType.League,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })

      const reg = controller.registerTeam(TENANT, t.id, {
        teamName: 'Alpha',
        captainId: 'mem-001',
        memberIds: ['mem-001', 'mem-002'],
      })

      assert.equal(reg.teamName, 'Alpha')
      assert.ok(reg.id.startsWith('teamreg-'))
    })
  })

  describe('PATCH approve/reject team', () => {
    it('should approve team', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Approve Test',
        type: TournamentType.League,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })

      const reg = controller.registerTeam(TENANT, t.id, {
        teamName: 'Beta', captainId: 'm1', memberIds: ['m1'],
      })

      const approved = controller.approveTeam(TENANT, { teamRegId: reg.id })
      assert.equal(approved.status, 'APPROVED')
    })

    it('should reject team', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Reject Test',
        type: TournamentType.League,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })

      const reg = controller.registerTeam(TENANT, t.id, {
        teamName: 'Gamma', captainId: 'm1', memberIds: ['m1'],
      })

      const rejected = controller.rejectTeam(TENANT, { teamRegId: reg.id })
      assert.equal(rejected.status, 'REJECTED')
    })
  })

  // ── Bracket & Matches via controller ──

  describe('POST /tournaments/:tournamentId/bracket/generate', () => {
    it('should generate bracket', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Bracket Test',
        type: TournamentType.SingleElimination,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 8,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p3' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p4' })

      const matches = controller.generateBracket(TENANT, t.id)
      assert.ok(matches.length > 0)
    })
  })

  describe('GET /tournaments/:tournamentId/matches', () => {
    it('should list matches', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Match List',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 4,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })

      controller.generateBracket(TENANT, t.id)
      const matches = controller.listMatches(TENANT, t.id, {})

      assert.ok(matches.length > 0)
    })
  })

  describe('PATCH /matches/:matchId/result', () => {
    it('should record match result', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Result Test',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 4,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })

      const matches = controller.generateBracket(TENANT, t.id)
      const result = controller.recordMatchResult(TENANT, matches[0].id, { score1: 2, score2: 0 })
      assert.equal(result.status, 'COMPLETED')
      assert.equal(result.score1, 2)
      assert.equal(result.score2, 0)
    })
  })

  describe('PATCH /matches/:matchId/dispute', () => {
    it('should set match as disputed', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Dispute Test',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 4,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })

      const matches = controller.generateBracket(TENANT, t.id)
      const disputed = controller.setDisputed(TENANT, matches[0].id)
      assert.equal(disputed.status, 'DISPUTED')
    })
  })

  // ── Rankings via controller ──

  describe('GET /tournaments/:tournamentId/rankings', () => {
    it('should get rankings', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Ranking Test',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 4,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })

      const matches = controller.generateBracket(TENANT, t.id)
      controller.recordMatchResult(TENANT, matches[0].id, { score1: 2, score2: 1 })

      const rankings = controller.getRankings(TENANT, t.id, {})
      assert.ok(rankings.length > 0)
    })

    it('should respect limit', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Limit Test',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 8,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p3' })

      controller.generateBracket(TENANT, t.id)
      const rankings = controller.getRankings(TENANT, t.id, { limit: 2 })
      assert.ok(rankings.length <= 2)
    })
  })

  // ── Push endpoints ──

  describe('GET /members/:memberId/upcoming', () => {
    it('should get upcoming matches for a member', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Upcoming Test',
        type: TournamentType.RoundRobin,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 4,
      })
      controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Open })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p1' })
      controller.registerParticipant(TENANT, t.id, { memberId: 'p2' })

      controller.generateBracket(TENANT, t.id)
      const upcoming = controller.getUpcomingMatches('p1')
      assert.ok(Array.isArray(upcoming))
    })
  })

  describe('GET /stores/:storeId/live', () => {
    it('should get live matches for a store', () => {
      const live = controller.getLiveMatches('store-001')
      assert.ok(Array.isArray(live))
    })
  })

  // ── Error handling ──

  describe('error propagation from service', () => {
    it('should propagate tournament not found', () => {
      assert.throws(
        () => controller.getTournament(TENANT, 'nonexistent'),
        /Tournament not found: nonexistent/
      )
    })

    it('should propagate invalid status transition', () => {
      const t = controller.createTournament(TENANT, {
        name: 'Err Test',
        type: TournamentType.SingleElimination,
        gameName: 'Game',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 8,
      })

      assert.throws(
        () => controller.updateTournamentStatus(TENANT, t.id, { status: TournamentStatus.Completed as never }),
        /Invalid tournament status transition/
      )
    })
  })
})
