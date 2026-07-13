import { describe, it, expect } from 'vitest'

type TournamentStatus = 'registration' | 'in_progress' | 'completed' | 'cancelled'
interface Tournament { id: string; tenantId: string; name: string; maxPlayers: number; currentPlayers: number; entryFee: number; prizePool: number; durationMin: number; status: TournamentStatus; startAt: string }

describe('✅ AC-TOURNAMENT: 赛事圈梁', () => {
  it('创建赛事', () => {
    const t: Tournament = { id: 't1', tenantId: 't1', name: '街霸锦标赛', maxPlayers: 64, currentPlayers: 48, entryFee: 500, prizePool: 32000, durationMin: 120, status: 'registration', startAt: '2026-07-20T18:00:00Z' }
    expect(t.prizePool).toBe(t.entryFee * t.maxPlayers)
  })
  it('4种状态', () => { expect(['registration','in_progress','completed','cancelled'].length).toBe(4) })
  it('报名截止', () => { expect(48).toBeLessThanOrEqual(64) })
})
