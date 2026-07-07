import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tournament] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  TournamentType,
  TournamentStatus,
  MatchStatus,
  TeamRegistrationStatus,
} from './tournament.entity'

describe('Tournament Entity Types', () => {
  describe('TournamentType', () => {
    it('should define all tournament types', () => {
      assert.equal(TournamentType.SingleElimination, 'SINGLE_ELIMINATION')
      assert.equal(TournamentType.DoubleElimination, 'DOUBLE_ELIMINATION')
      assert.equal(TournamentType.RoundRobin, 'ROUND_ROBIN')
      assert.equal(TournamentType.League, 'LEAGUE')
    })

    it('should have 4 types', () => {
      assert.equal(Object.keys(TournamentType).length, 4)
    })
  })

  describe('TournamentStatus', () => {
    it('should define all statuses', () => {
      assert.equal(TournamentStatus.Draft, 'DRAFT')
      assert.equal(TournamentStatus.Open, 'OPEN')
      assert.equal(TournamentStatus.Ongoing, 'ONGOING')
      assert.equal(TournamentStatus.Completed, 'COMPLETED')
      assert.equal(TournamentStatus.Cancelled, 'CANCELLED')
    })

    it('should have 5 statuses', () => {
      assert.equal(Object.keys(TournamentStatus).length, 5)
    })
  })

  describe('MatchStatus', () => {
    it('should define all match statuses', () => {
      assert.equal(MatchStatus.Pending, 'PENDING')
      assert.equal(MatchStatus.Ongoing, 'ONGOING')
      assert.equal(MatchStatus.Completed, 'COMPLETED')
      assert.equal(MatchStatus.Disputed, 'DISPUTED')
    })

    it('should have 4 statuses', () => {
      assert.equal(Object.keys(MatchStatus).length, 4)
    })
  })

  describe('TeamRegistrationStatus', () => {
    it('should define all team registration statuses', () => {
      assert.equal(TeamRegistrationStatus.Pending, 'PENDING')
      assert.equal(TeamRegistrationStatus.Approved, 'APPROVED')
      assert.equal(TeamRegistrationStatus.Rejected, 'REJECTED')
    })

    it('should have 3 statuses', () => {
      assert.equal(Object.keys(TeamRegistrationStatus).length, 3)
    })
  })
})
