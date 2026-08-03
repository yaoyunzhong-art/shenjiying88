/**
 * tournament-handicap.test.ts
 * BS-0281: 擂台让分机制 — 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TournamentHandicapService } from './tournament-handicap.service'
import type { Ranking } from './tournament.entity'

describe('TournamentHandicapService — BS-0281 擂台让分机制', () => {
  let service: TournamentHandicapService

  beforeEach(() => {
    service = new TournamentHandicapService()
  })

  const makeRanking = (overrides: Partial<Ranking> & { memberId: string }): Ranking => ({
    id: `ranking-${overrides.memberId}`,
    tournamentId: 'tournament-001',
    memberId: overrides.memberId,
    rank: 0,
    points: overrides.points ?? 0,
    wins: overrides.wins ?? 0,
    losses: overrides.losses ?? 0,
    draws: 0,
    updatedAt: new Date().toISOString(),
  })

  // ─── 胜率差超过阈值触发让分 ───

  it('BS-0281: 胜率差超过20%触发5分让分', () => {
    // winRateDiff ≈ 0.25 (62.5% - 37.5%)
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'strong-player', wins: 5, losses: 3 }),  // 62.5%
      makeRanking({ memberId: 'weak-player', wins: 3, losses: 5 }),    // 37.5%
    ]

    const result = service.calculateHandicap('strong-player', 'weak-player', rankings)

    expect(result).not.toBeNull()
    expect(result!.handicapPoints).toBe(5)
    expect(result!.underdogId).toBe('weak-player')
    expect(result!.favoriteId).toBe('strong-player')
  })

  it('BS-0281: 胜率差超过40%触发10分让分', () => {
    // winRateDiff ≈ 0.45 (72.7% - 27.3%)
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'pro-player', wins: 8, losses: 3 }),  // 72.7%
      makeRanking({ memberId: 'newbie', wins: 3, losses: 8 }),      // 27.3%
    ]

    const result = service.calculateHandicap('pro-player', 'newbie', rankings)

    expect(result).not.toBeNull()
    expect(result!.handicapPoints).toBe(10)
    expect(result!.underdogId).toBe('newbie')
  })

  it('BS-0281: 胜率差超过60%触发20分让分（最大）', () => {
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'champion', wins: 50, losses: 0 }),
      makeRanking({ memberId: 'rookie', wins: 0, losses: 50 }),
    ]

    const result = service.calculateHandicap('champion', 'rookie', rankings)

    expect(result).not.toBeNull()
    expect(result!.handicapPoints).toBe(20)
    expect(result!.winRateDiff).toBeGreaterThan(0.6)
  })

  // ─── 胜率差未达阈值不触发让分 ───

  it('BS-0281: 胜率差不超过20%不触发让分', () => {
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'player-a', wins: 6, losses: 4 }), // 60%
      makeRanking({ memberId: 'player-b', wins: 5, losses: 5 }), // 50%
    ]

    const result = service.calculateHandicap('player-a', 'player-b', rankings)

    expect(result).toBeNull()
  })

  // ─── 无历史数据 ───

  it('BS-0281: 双方均无历史数据不触发让分', () => {
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'new-player-1', wins: 0, losses: 0 }),
      makeRanking({ memberId: 'new-player-2', wins: 0, losses: 0 }),
    ]

    const result = service.calculateHandicap('new-player-1', 'new-player-2', rankings)
    expect(result).toBeNull()
  })

  // ─── 关闭让分功能 ───

  it('BS-0281: 关闭让分功能时不触发让分', () => {
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'top', wins: 50, losses: 0 }),
      makeRanking({ memberId: 'bottom', wins: 0, losses: 50 }),
    ]

    const result = service.calculateHandicap('top', 'bottom', rankings, {
      enabled: false,
      maxHandicap: 20,
      winRateDiffThreshold: 0.2,
    })

    expect(result).toBeNull()
  })

  // ─── applyHandicapToScore ───

  it('BS-0281: 将让分应用到比赛结果中', () => {
    const handicap = {
      handicapPoints: 10,
      winRateDiff: 0.5,
      underdogId: 'weak-player',
      favoriteId: 'strong-player',
      adjustedScore: 10,
    }

    // strong-player(0) vs weak-player(0) → weak-player被让10分
    const result = service.applyHandicapToScore('strong-player', 'weak-player', 0, 0, handicap)

    expect(result.adjustedScore1).toBe(0)  // strong-player
    expect(result.adjustedScore2).toBe(10) // weak-player + 10
  })

  // ─── getPlayerWinRate ───

  it('BS-0281: 获取单个选手胜率信息', () => {
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'player-x', wins: 7, losses: 3 }),
    ]

    const wr = service.getPlayerWinRate('player-x', rankings)
    expect(wr.winRate).toBeCloseTo(0.7, 1)
    expect(wr.totalMatches).toBe(10)
    expect(wr.wins).toBe(7)
  })

  // ─── getAllPlayerWinRates ───

  it('BS-0281: 批量获取所有选手胜率', () => {
    const rankings: Ranking[] = [
      makeRanking({ memberId: 'p1', wins: 5, losses: 5 }),
      makeRanking({ memberId: 'p2', wins: 8, losses: 2 }),
    ]

    const rates = service.getAllPlayerWinRates(rankings)
    expect(rates).toHaveLength(2)
    expect(rates[0]!.winRate).toBeCloseTo(0.5, 1)
    expect(rates[1]!.winRate).toBeCloseTo(0.8, 1)
  })
})
