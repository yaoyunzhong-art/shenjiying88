import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tournament] [D] L1-L4 赛事服务测试
 * feat(api): add tournament L1-L4 - daily/weekly/monthly/city + handicap (T109-1)
 */

import assert from 'node:assert/strict'
import { TournamentL1L4Service, DailyTournamentStatus, WeeklyTournamentStatus, MonthlyTournamentStatus, CityTournamentStatus } from './tournament-l1-l4.service'

describe('TournamentL1L4Service', () => {
  let service: TournamentL1L4Service

  beforeEach(() => {
    service = new TournamentL1L4Service()
  })

  afterEach(() => {
    service.resetStoresForTests()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // HandicapSystem Tests (P1-9)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('HandicapSystem', () => {
    it('should apply handicap bonus to low-level member (level 3)', () => {
      service.setMemberLevel('member-low', 3)
      const adjusted = service.calculateAdjustedScore('member-low', 100)
      // Level 3 is 2 below base 5, so 20% bonus
      assert.equal(adjusted, 120)
    })

    it('should apply 10% handicap per level difference', () => {
      service.setMemberLevel('member-amateur', 2)
      const adjusted = service.calculateAdjustedScore('member-amateur', 100)
      // Level 2 is 3 below base 5, so 30% bonus
      assert.equal(adjusted, 130)
    })

    it('should not apply bonus to high-level member (level 9)', () => {
      service.setMemberLevel('member-pro', 9)
      const adjusted = service.calculateAdjustedScore('member-pro', 100)
      // Level 9 is above base, no bonus
      assert.equal(adjusted, 100)
    })

    it('should handle equal level with no adjustment', () => {
      service.setMemberLevel('member-average', 5)
      const adjusted = service.calculateAdjustedScore('member-average', 100)
      assert.equal(adjusted, 100)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // DailyTournament Tests (L1)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DailyTournament - createDaily', () => {
    it('should create daily tournament with default values', () => {
      const daily = service.createDaily({
        name: 'Daily Championship',
        date: '2026-07-01'
      })

      assert.ok(daily.id.startsWith('daily-'))
      assert.equal(daily.name, 'Daily Championship')
      assert.equal(daily.status, DailyTournamentStatus.Registration)
      assert.equal(daily.prizePool, 100)
      assert.equal(daily.maxParticipants, 100)
    })

    it('should create daily tournament with custom config', () => {
      const daily = service.createDaily({
        name: 'VIP Daily',
        date: '2026-07-01',
        entryFee: 50,
        prizePool: 500,
        maxParticipants: 50
      })

      assert.equal(daily.entryFee, 50)
      assert.equal(daily.prizePool, 500)
      assert.equal(daily.maxParticipants, 50)
    })
  })

  describe('DailyTournament - join', () => {
    it('should allow member to join daily tournament', () => {
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })
      const participant = service.join(daily.id, 'member-001')

      assert.equal(participant.memberId, 'member-001')
      assert.ok(participant.joinedAt)
    })

    it('should increment participant count on join', () => {
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })
      service.join(daily.id, 'member-001')
      service.join(daily.id, 'member-002')

      const updated = service['requireDailyTournament'](daily.id)
      assert.equal(updated.currentParticipants, 2)
    })

    it('should throw when tournament is full', () => {
      const daily = service.createDaily({
        name: 'Small Daily',
        date: '2026-07-01',
        maxParticipants: 1
      })
      service.join(daily.id, 'member-001')

      assert.throws(
        () => service.join(daily.id, 'member-002'),
        /Tournament is full/
      )
    })

    it('should throw when member already joined', () => {
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })
      service.join(daily.id, 'member-001')

      assert.throws(
        () => service.join(daily.id, 'member-001'),
        /Already joined/
      )
    })
  })

  describe('DailyTournament - submitScore', () => {
    it('should submit score and apply handicap', () => {
      service.setMemberLevel('member-001', 3) // Low level gets bonus
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })
      service.join(daily.id, 'member-001')

      const participant = service.submitScore(daily.id, 'member-001', 100)
      assert.equal(participant.score, 100)
      assert.equal(participant.adjustedScore, 120) // 20% bonus
    })

    it('should auto-start tournament on first score submission', () => {
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })
      service.join(daily.id, 'member-001')

      service.submitScore(daily.id, 'member-001', 100)

      const updated = service['requireDailyTournament'](daily.id)
      assert.equal(updated.status, DailyTournamentStatus.InProgress)
    })
  })

  describe('DailyTournament - getLeaderboard', () => {
    it('should return leaderboard sorted by adjusted score', () => {
      service.setMemberLevel('member-high', 9) // No bonus
      service.setMemberLevel('member-low', 3) // 20% bonus
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })

      service.join(daily.id, 'member-high')
      service.join(daily.id, 'member-low')

      service.submitScore(daily.id, 'member-high', 100)
      service.submitScore(daily.id, 'member-low', 100)

      const leaderboard = service.getLeaderboard(daily.id)
      // member-low with handicap should rank higher (120 > 100)
      assert.equal(leaderboard[0].memberId, 'member-low')
      assert.equal(leaderboard[0].rank, 1)
    })

    it('should sort by submission time for tie scores', () => {
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })

      service.join(daily.id, 'member-001')
      service.join(daily.id, 'member-002')

      service.submitScore(daily.id, 'member-001', 100)
      service.submitScore(daily.id, 'member-002', 100)

      const leaderboard = service.getLeaderboard(daily.id)
      // Earlier submission (member-001) should rank first
      assert.equal(leaderboard[0].memberId, 'member-001')
    })
  })

  describe('DailyTournament - settle', () => {
    it('should settle tournament and distribute rewards', () => {
      const daily = service.createDaily({
        name: 'Test Daily',
        date: '2026-07-01',
        prizePool: 100
      })

      service.join(daily.id, 'member-001')
      service.join(daily.id, 'member-002')
      service.join(daily.id, 'member-003')

      service.submitScore(daily.id, 'member-001', 100)
      service.submitScore(daily.id, 'member-002', 90)
      service.submitScore(daily.id, 'member-003', 80)

      const result = service.settle(daily.id)
      assert.equal(result.champion.memberId, 'member-001')
      assert.equal(result.rewards['member-001'], 50) // 50% of 100
      assert.equal(result.rewards['member-002'], 30) // 30% of 100
      assert.equal(result.rewards['member-003'], 20) // 20% of 100
    })

    it('should mark tournament as settled', () => {
      const daily = service.createDaily({ name: 'Test Daily', date: '2026-07-01' })
      service.join(daily.id, 'member-001')
      service.submitScore(daily.id, 'member-001', 100)

      service.settle(daily.id)

      const updated = service['requireDailyTournament'](daily.id)
      assert.equal(updated.status, DailyTournamentStatus.Settled)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // WeeklyTournament Tests (L2)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('WeeklyTournament - createWeekly', () => {
    it('should create weekly tournament', () => {
      const weekly = service.createWeekly({
        name: 'Weekly Championship',
        weekNumber: 27,
        year: 2026
      })

      assert.ok(weekly.id.startsWith('weekly-'))
      assert.equal(weekly.status, WeeklyTournamentStatus.Registration)
      assert.equal(weekly.prizePool, 500)
    })
  })

  describe('WeeklyTournament - submitWeeklyScore', () => {
    it('should accept multiple score submissions and track best', () => {
      const weekly = service.createWeekly({
        name: 'Weekly Test',
        weekNumber: 27,
        year: 2026
      })

      service.submitWeeklyScore(weekly.id, 'member-001', 80)
      service.submitWeeklyScore(weekly.id, 'member-001', 95)
      service.submitWeeklyScore(weekly.id, 'member-001', 88)

      const rankings = service.getWeeklyRankings(27, 2026)
      const participant = rankings.find((r) => r.memberId === 'member-001')
      assert.equal(participant?.bestScore, 95)
    })

    it('should pick highest score as best for leaderboard', () => {
      const weekly = service.createWeekly({
        name: 'Weekly Test',
        weekNumber: 28,
        year: 2026
      })

      service.submitWeeklyScore(weekly.id, 'member-001', 70)
      service.submitWeeklyScore(weekly.id, 'member-001', 85)
      service.submitWeeklyScore(weekly.id, 'member-002', 90)

      const rankings = service.getWeeklyRankings(28, 2026)
      assert.equal(rankings[0].memberId, 'member-002') // 90 > 85
    })
  })

  describe('WeeklyTournament - crownChampion', () => {
    it('should crown champion with highest score', () => {
      const weekly = service.createWeekly({
        name: 'Weekly Test',
        weekNumber: 29,
        year: 2026
      })

      service.submitWeeklyScore(weekly.id, 'member-001', 80)
      service.submitWeeklyScore(weekly.id, 'member-002', 95)

      const champion = service.crownChampion(weekly.id)
      assert.equal(champion.memberId, 'member-002')
      assert.equal(champion.crownGranted, true)
    })

    it('should mark tournament as completed after crowning', () => {
      const weekly = service.createWeekly({
        name: 'Weekly Test',
        weekNumber: 30,
        year: 2026
      })

      service.submitWeeklyScore(weekly.id, 'member-001', 100)
      service.crownChampion(weekly.id)

      const updated = service['requireWeeklyTournament'](weekly.id)
      assert.equal(updated.status, WeeklyTournamentStatus.Completed)
      assert.equal(updated.championId, 'member-001')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // MonthlyTournament Tests (L3)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MonthlyTournament - createMonthly', () => {
    it('should create monthly tournament', () => {
      const monthly = service.createMonthly({
        name: 'Monthly Championship',
        month: 7,
        year: 2026
      })

      assert.ok(monthly.id.startsWith('monthly-'))
      assert.equal(monthly.status, MonthlyTournamentStatus.Qualifying)
      assert.equal(monthly.finalistCount, 8)
    })
  })

  describe('MonthlyTournament - submitMonthlyQualifyingScore', () => {
    it('should track qualifying scores', () => {
      const monthly = service.createMonthly({
        name: 'Monthly Test',
        month: 7,
        year: 2026
      })

      service.submitMonthlyQualifyingScore(monthly.id, 'member-001', 85)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-001', 92)

      const finalists = service.getMonthlyFinalists(monthly.id)
      const participant = finalists.find((p) => p.memberId === 'member-001')
      assert.equal(participant?.qualifyingScore, 92) // Max score kept
    })
  })

  describe('MonthlyTournament - getMonthlyFinalists', () => {
    it('should return top N finalists by qualifying score', () => {
      const monthly = service.createMonthly({
        name: 'Monthly Test',
        month: 8,
        year: 2026,
        finalistCount: 3
      })

      service.submitMonthlyQualifyingScore(monthly.id, 'member-001', 80)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-002', 95)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-003', 88)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-004', 72)

      const finalists = service.getMonthlyFinalists(monthly.id)
      assert.equal(finalists.length, 3)
      assert.equal(finalists[0].memberId, 'member-002') // Highest
      assert.equal(finalists[1].memberId, 'member-003') // Second
      assert.equal(finalists[2].memberId, 'member-001') // Third
    })
  })

  describe('MonthlyTournament - holdFinals', () => {
    it('should hold finals and determine champion', () => {
      const monthly = service.createMonthly({
        name: 'Monthly Test',
        month: 9,
        year: 2026,
        finalistCount: 4
      })

      service.submitMonthlyQualifyingScore(monthly.id, 'member-001', 80)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-002', 95)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-003', 88)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-004', 72)

      const finalsScores: Record<string, number> = {
        'member-001': 90,
        'member-002': 85,
        'member-003': 92,
        'member-004': 78
      }

      const champion = service.holdFinals(
        monthly.id,
        ['member-001', 'member-002', 'member-003', 'member-004'],
        finalsScores
      )

      assert.equal(champion.memberId, 'member-003') // Highest finals score
      assert.equal(champion.isChampion, true)
    })

    it('should mark tournament as champion crowned', () => {
      const monthly = service.createMonthly({
        name: 'Monthly Test',
        month: 10,
        year: 2026,
        finalistCount: 2
      })

      service.submitMonthlyQualifyingScore(monthly.id, 'member-001', 80)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-002', 90)

      service.holdFinals(
        monthly.id,
        ['member-001', 'member-002'],
        { 'member-001': 85, 'member-002': 88 }
      )

      const updated = service['requireMonthlyTournament'](monthly.id)
      assert.equal(updated.status, MonthlyTournamentStatus.ChampionCrowned)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // CityTournament Tests (L4)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CityTournament - createCity', () => {
    it('should create city tournament', () => {
      const city = service.createCity('Shanghai', {
        city: 'Shanghai',
        name: 'Shanghai City Championship'
      })

      assert.ok(city.id.startsWith('city-'))
      assert.equal(city.city, 'Shanghai')
      assert.equal(city.status, CityTournamentStatus.Regional)
    })
  })

  describe('CityTournament - qualifyFromRegional', () => {
    it('should qualify member from regional to city final', () => {
      const city = service.createCity('Beijing', {
        city: 'Beijing',
        name: 'Beijing City Championship'
      })

      const participant = service.qualifyFromRegional(city.id, 'member-001', 88)
      assert.equal(participant.isQualified, true)
      assert.equal(participant.regionalScore, 88)
    })

    it('should throw if not in regional phase', () => {
      const city = service.createCity('Guangzhou', {
        city: 'Guangzhou',
        name: 'Guangzhou Championship'
      })

      // Manually change status to simulate non-regional phase
      city.status = CityTournamentStatus.CityFinal

      assert.throws(
        () => service.qualifyFromRegional(city.id, 'member-001', 88),
        /not in regional phase/
      )
    })
  })

  describe('CityTournament - awardCityChampion', () => {
    it('should award city champion with highest city score', () => {
      const city = service.createCity('Shenzhen', {
        city: 'Shenzhen',
        name: 'Shenzhen Championship'
      })

      service.qualifyFromRegional(city.id, 'member-001', 85)
      service.qualifyFromRegional(city.id, 'member-002', 92)

      const champion = service.awardCityChampion(city.id, {
        'member-001': 88,
        'member-002': 95
      })
      assert.equal(champion.memberId, 'member-002')
      assert.equal(champion.isCityChampion, true)
    })

    it('should mark tournament as champion awarded', () => {
      const city = service.createCity('Chengdu', {
        city: 'Chengdu',
        name: 'Chengdu Championship'
      })

      service.qualifyFromRegional(city.id, 'member-001', 80)

      service.awardCityChampion(city.id, { 'member-001': 85 })

      const updated = service['requireCityTournament'](city.id)
      assert.equal(updated.status, CityTournamentStatus.ChampionAwarded)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // Integration: Full Flow Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Full Flow - Daily Tournament Complete', () => {
    it('should complete full daily tournament flow: join → submit → leaderboard → settle', () => {
      // 1. Create daily tournament
      const daily = service.createDaily({
        name: 'Integration Test Daily',
        date: '2026-07-01',
        prizePool: 300
      })

      // 2. Members join
      service.join(daily.id, 'member-001')
      service.join(daily.id, 'member-002')
      service.join(daily.id, 'member-003')

      // 3. Submit scores
      service.submitScore(daily.id, 'member-001', 85)
      service.submitScore(daily.id, 'member-002', 92)
      service.submitScore(daily.id, 'member-003', 78)

      // 4. Check leaderboard
      const leaderboard = service.getLeaderboard(daily.id)
      assert.equal(leaderboard[0].memberId, 'member-002')
      assert.equal(leaderboard[0].rank, 1)

      // 5. Settle tournament
      const result = service.settle(daily.id)
      assert.equal(result.champion.memberId, 'member-002')
      assert.ok(result.rewards)
    })
  })

  describe('Full Flow - Weekly Tournament with Multiple Submissions', () => {
    it('should handle weekly tournament with submissions over 7 days', () => {
      // 1. Create weekly tournament
      const weekly = service.createWeekly({
        name: 'Weekly Integration Test',
        weekNumber: 31,
        year: 2026
      })

      // 2. Multiple submissions over time
      service.submitWeeklyScore(weekly.id, 'member-001', 70)
      service.submitWeeklyScore(weekly.id, 'member-001', 85)
      service.submitWeeklyScore(weekly.id, 'member-001', 92) // Best

      service.submitWeeklyScore(weekly.id, 'member-002', 88)
      service.submitWeeklyScore(weekly.id, 'member-002', 90) // Best

      // 3. Crown champion
      const champion = service.crownChampion(weekly.id)
      assert.equal(champion.memberId, 'member-001') // 92 > 90
    })
  })

  describe('Full Flow - Monthly Tournament Qualifying to Finals', () => {
    it('should handle qualifying phase and finals', () => {
      // 1. Create monthly tournament
      const monthly = service.createMonthly({
        name: 'Monthly Integration Test',
        month: 11,
        year: 2026,
        finalistCount: 2
      })

      // 2. Qualifying phase - many members submit scores
      service.submitMonthlyQualifyingScore(monthly.id, 'member-001', 80)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-002', 95)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-003', 88)
      service.submitMonthlyQualifyingScore(monthly.id, 'member-004', 72)

      // 3. Get finalists (top 2)
      const finalists = service.getMonthlyFinalists(monthly.id)
      assert.equal(finalists.length, 2)
      assert.equal(finalists[0].memberId, 'member-002')
      assert.equal(finalists[1].memberId, 'member-003')

      // 4. Hold finals
      const champion = service.holdFinals(
        monthly.id,
        finalists.map((f) => f.memberId),
        { 'member-002': 85, 'member-003': 92 }
      )

      assert.equal(champion.memberId, 'member-003')
      assert.equal(champion.isChampion, true)
    })
  })

  describe('Full Flow - City Tournament Regional to Champion', () => {
    it('should handle city tournament from regional to champion', () => {
      // 1. Create city tournament
      const city = service.createCity('Hangzhou', {
        city: 'Hangzhou',
        name: 'Hangzhou City Championship'
      })

      // 2. Regional phase - members qualify
      service.qualifyFromRegional(city.id, 'member-001', 85)
      service.qualifyFromRegional(city.id, 'member-002', 92)
      service.qualifyFromRegional(city.id, 'member-003', 78)

      // 3. City final scores
      const champion = service.awardCityChampion(city.id, {
        'member-001': 90,
        'member-002': 88,
        'member-003': 95
      })

      // 4. Verify champion
      assert.equal(champion.memberId, 'member-003')
      assert.equal(champion.isCityChampion, true)
    })
  })

  describe('Full Flow - Handicap System in Competition', () => {
    it('should apply handicap correctly in tournament context', () => {
      // Setup: High level member (pro) vs Low level member (amateur)
      service.setMemberLevel('member-pro', 9) // No handicap bonus
      service.setMemberLevel('member-amateur', 2) // 30% handicap bonus

      const daily = service.createDaily({
        name: 'Handicap Test',
        date: '2026-07-01'
      })

      service.join(daily.id, 'member-pro')
      service.join(daily.id, 'member-amateur')

      // Both submit same raw score
      service.submitScore(daily.id, 'member-pro', 100)
      service.submitScore(daily.id, 'member-amateur', 100)

      const leaderboard = service.getLeaderboard(daily.id)
      // Amateur gets 30% bonus (130) vs pro (100)
      assert.equal(leaderboard[0].memberId, 'member-amateur')
      assert.equal(leaderboard[0].adjustedScore, 130)
      assert.equal(leaderboard[1].memberId, 'member-pro')
      assert.equal(leaderboard[1].adjustedScore, 100)
    })
  })
})
