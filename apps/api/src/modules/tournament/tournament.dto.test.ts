import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tournament] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  UpdateTournamentStatusDto,
  TournamentQueryDto,
  MatchResultDto,
  MatchQueryDto,
  RegisterParticipantDto,
  RegisterTeamDto,
  ApproveRejectTeamDto,
  RankingQueryDto,
} from './tournament.dto'
import { TournamentType, TournamentStatus, MatchStatus } from './tournament.entity'

describe('Tournament DTOs', () => {
  describe('CreateTournamentDto', () => {
    const toDto = (raw: Record<string, unknown>): CreateTournamentDto =>
      Object.assign(new CreateTournamentDto(), raw)

    it('should accept all required fields', () => {
      const dto = toDto({
        name: 'Summer Cup',
        type: TournamentType.SingleElimination,
        gameName: 'Street Fighter 6',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 64,
      })

      assert.equal(dto.name, 'Summer Cup')
      assert.equal(dto.type, TournamentType.SingleElimination)
      assert.equal(dto.gameName, 'Street Fighter 6')
      assert.equal(dto.startDate, '2026-07-01')
      assert.equal(dto.endDate, '2026-07-15')
      assert.equal(dto.maxParticipants, 64)
    })

    it('should accept optional fields', () => {
      const dto = toDto({
        name: 'Cup',
        type: TournamentType.League,
        gameName: 'SF6',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 32,
        description: 'A great tournament',
        rules: { matchFormat: 'BO3' },
        prizes: { first: { label: 'Trophy', value: 'Gold' } },
        bannerImage: 'https://example.com/banner.png',
      })

      assert.equal(dto.description, 'A great tournament')
      assert.deepStrictEqual(dto.rules, { matchFormat: 'BO3' })
      assert.deepStrictEqual(dto.prizes, { first: { label: 'Trophy', value: 'Gold' } })
      assert.equal(dto.bannerImage, 'https://example.com/banner.png')
    })

    it('should be instance of CreateTournamentDto', () => {
      const dto = toDto({
        name: 'Cup',
        type: TournamentType.RoundRobin,
        gameName: 'SF6',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        maxParticipants: 16,
      })
      assert.ok(dto instanceof CreateTournamentDto)
    })
  })

  describe('UpdateTournamentDto', () => {
    it('should accept partial data', () => {
      const dto = Object.assign(new UpdateTournamentDto(), { name: 'New Name' })
      assert.equal(dto.name, 'New Name')
      assert.equal(dto.description, undefined)
    })

    it('should accept type change', () => {
      const dto = Object.assign(new UpdateTournamentDto(), {
        type: TournamentType.RoundRobin,
        maxParticipants: 64,
      })
      assert.equal(dto.type, TournamentType.RoundRobin)
      assert.equal(dto.maxParticipants, 64)
    })

    it('should accept empty object', () => {
      const dto = new UpdateTournamentDto()
      assert.equal(dto.name, undefined)
      assert.equal(dto.type, undefined)
    })
  })

  describe('UpdateTournamentStatusDto', () => {
    it('should hold status', () => {
      const dto = Object.assign(new UpdateTournamentStatusDto(), { status: TournamentStatus.Open })
      assert.equal(dto.status, TournamentStatus.Open)
    })
  })

  describe('TournamentQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new TournamentQueryDto(), {
        status: TournamentStatus.Open,
        type: TournamentType.RoundRobin,
        storeId: 'store-1',
        brandId: 'brand-1',
      })
      assert.equal(dto.status, TournamentStatus.Open)
      assert.equal(dto.type, TournamentType.RoundRobin)
      assert.equal(dto.storeId, 'store-1')
      assert.equal(dto.brandId, 'brand-1')
    })

    it('should accept empty query', () => {
      const dto = new TournamentQueryDto()
      assert.equal(dto.status, undefined)
      assert.equal(dto.type, undefined)
    })
  })

  describe('MatchResultDto', () => {
    it('should hold scores', () => {
      const dto = Object.assign(new MatchResultDto(), { score1: 2, score2: 1 })
      assert.equal(dto.score1, 2)
      assert.equal(dto.score2, 1)
    })
  })

  describe('MatchQueryDto', () => {
    it('should hold match filter', () => {
      const dto = Object.assign(new MatchQueryDto(), {
        round: 1,
        status: MatchStatus.Pending,
      })
      assert.equal(dto.round, 1)
      assert.equal(dto.status, MatchStatus.Pending)
    })
  })

  describe('RegisterParticipantDto', () => {
    it('should hold memberId', () => {
      const dto = Object.assign(new RegisterParticipantDto(), { memberId: 'mem-001' })
      assert.equal(dto.memberId, 'mem-001')
    })
  })

  describe('RegisterTeamDto', () => {
    it('should hold team data', () => {
      const dto = Object.assign(new RegisterTeamDto(), {
        teamName: 'Team Alpha',
        captainId: 'mem-001',
        memberIds: ['mem-001', 'mem-002', 'mem-003'],
      })
      assert.equal(dto.teamName, 'Team Alpha')
      assert.equal(dto.captainId, 'mem-001')
      assert.deepStrictEqual(dto.memberIds, ['mem-001', 'mem-002', 'mem-003'])
    })
  })

  describe('ApproveRejectTeamDto', () => {
    it('should hold teamRegId', () => {
      const dto = Object.assign(new ApproveRejectTeamDto(), { teamRegId: 'teamreg-xxx' })
      assert.equal(dto.teamRegId, 'teamreg-xxx')
    })
  })

  describe('RankingQueryDto', () => {
    it('should hold limit', () => {
      const dto = Object.assign(new RankingQueryDto(), { limit: 10 })
      assert.equal(dto.limit, 10)
    })

    it('should accept empty', () => {
      const dto = new RankingQueryDto()
      assert.equal(dto.limit, undefined)
    })
  })
})
