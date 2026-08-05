/**
 * tournament.service.spec.ts — Tournament Service 深层单元测试
 *
 * 覆盖：
 *   - createTournament:  正例（基本/全字段）/ 边界（0 最大参与数）
 *   - getTournament:     正例 / 反例（不存在/跨 tenant）
 *   - updateTournament:  正例（部分更新）/ 反例（不存在/跨 tenant）
 *   - listTournaments:   正例（全量/按状态过滤/按类型/按门店）/ 空
 *   - updateTournamentStatus: 正例（D→O→Ong→Com/Canc→D）/ 反例（非法跃迁×2）
 *   - registerParticipant: 正例 / 反例（未开放/满员/重复/跨 tenant）
 *   - registerTeam:      正例 / 反例（未开放）/ 审批/驳回
 *   - generateBracket:   正例（淘汰/循环）/ 反例（人数不足/非 OPEN）
 *   - recordMatchResult: 正例（带排名更新）/ 反例（重复/跨 tenant/不存在）
 *   - setDisputed:       正例 / 反例（不存在）
 *   - getRankings:       正例（空/有比赛后）
 *   - getUpcomingMatches:正例 / 边界（无）
 *   - getLiveMatches:    边界（无）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TournamentService } from './tournament.service'
import {
  TournamentStatus,
  TournamentType,
  MatchStatus,
  TeamRegistrationStatus,
  type Tournament,
  type Match,
} from './tournament.entity'

// ═══════════════════════════════════════════════════════════════
// 枚举 + 类型
// ═══════════════════════════════════════════════════════════════

const ALL_STATUSES: TournamentStatus[] = [
  TournamentStatus.Draft,
  TournamentStatus.Open,
  TournamentStatus.Ongoing,
  TournamentStatus.Completed,
  TournamentStatus.Cancelled,
]

const ALL_TYPES: TournamentType[] = [
  TournamentType.SingleElimination,
  TournamentType.DoubleElimination,
  TournamentType.RoundRobin,
  TournamentType.League,
]

const ALL_MATCH_STATUSES: MatchStatus[] = [
  MatchStatus.Pending,
  MatchStatus.Ongoing,
  MatchStatus.Completed,
  MatchStatus.Disputed,
]

// ═══════════════════════════════════════════════════════════════
// 服务实例
// ═══════════════════════════════════════════════════════════════

let service: TournamentService

const T = 'tenant-001' // 默认 tenant
const S = 'store-001'

function freshTournament(overrides?: Partial<Parameters<TournamentService['createTournament']>[0]>): Tournament {
  return service.createTournament({
    tenantId: T,
    storeId: S,
    name: 'Test Tournament',
    type: TournamentType.SingleElimination,
    gameName: 'Test Game',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    maxParticipants: 16,
    ...overrides,
  })
}

function openTournament(mp = 16): Tournament {
  const t = freshTournament({ maxParticipants: mp })
  service.updateTournamentStatus(t.id, TournamentStatus.Open, T)
  return t
}

function openAndRegister(tournamentId: string, count: number): void {
  for (let i = 0; i < count; i++) {
    service.registerParticipant(tournamentId, `mem-${i}`, T)
  }
}

beforeEach(() => {
  service = new TournamentService()
})

afterEach(() => {
  service.resetTournamentStoresForTests()
})

// ═══════════════════════════════════════════════════════════════
// createTournament
// ═══════════════════════════════════════════════════════════════

describe('createTournament', () => {
  it('正例: 创建 DRAFT 状态的赛事', () => {
    const t = freshTournament()
    expect(t.name).toBe('Test Tournament')
    expect(t.type).toBe(TournamentType.SingleElimination)
    expect(t.status).toBe(TournamentStatus.Draft)
    expect(t.currentParticipants).toBe(0)
    expect(t.id).toMatch(/^tournament-/)
  })

  it('正例: 全字段创建', () => {
    const t = service.createTournament({
      tenantId: T,
      name: 'Rich',
      type: TournamentType.RoundRobin,
      gameName: 'Chess',
      startDate: '2026-08-01',
      endDate: '2026-08-30',
      maxParticipants: 32,
      description: 'desc',
      rules: { matchFormat: 'BO3', allowDraws: true },
      prizes: { first: { label: 'Gold', value: '1000' } },
      bannerImage: 'https://img.com/b.png',
      brandId: 'brand-1',
    })
    expect(t.description).toBe('desc')
    expect(t.rules.matchFormat).toBe('BO3')
    expect(t.prizes.first?.value).toBe('1000')
  })

  it('边界: maxParticipants = 0', () => {
    const t = freshTournament({ maxParticipants: 0 })
    expect(t.maxParticipants).toBe(0)
    expect(t.currentParticipants).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// getTournament
// ═══════════════════════════════════════════════════════════════

describe('getTournament', () => {
  it('正例: 按 ID 获取', () => {
    const t = freshTournament()
    expect(service.getTournament(t.id, T)?.id).toBe(t.id)
  })

  it('反例: 不存在返回 undefined', () => {
    expect(service.getTournament('nonexistent', T)).toBeUndefined()
  })

  it('反例: 跨 tenant 访问返回 undefined', () => {
    const t = freshTournament()
    expect(service.getTournament(t.id, 'wrong')).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// updateTournament
// ═══════════════════════════════════════════════════════════════

describe('updateTournament', () => {
  it('正例: 部分更新', () => {
    const t = freshTournament()
    const u = service.updateTournament(t.id, T, { name: 'NewName', maxParticipants: 64 })
    expect(u.name).toBe('NewName')
    expect(u.maxParticipants).toBe(64)
  })

  it('反例: 不存在抛错', () => {
    expect(() => service.updateTournament('x', T, { name: 'X' })).toThrow('Tournament not found')
  })

  it('反例: 跨 tenant 抛错', () => {
    const t = freshTournament()
    expect(() => service.updateTournament(t.id, 'wrong', { name: 'X' })).toThrow('Tournament not found')
  })
})

// ═══════════════════════════════════════════════════════════════
// listTournaments
// ═══════════════════════════════════════════════════════════════

describe('listTournaments', () => {
  it('正例: 返回该 tenant 所有赛事', () => {
    freshTournament({ name: 'A' })
    freshTournament({ name: 'B' })
    expect(service.listTournaments(T).length).toBe(2)
  })

  it('正例: 按状态过滤', () => {
    const t1 = freshTournament({ name: 'Draft' })
    const t2 = freshTournament({ name: 'Open' })
    service.updateTournamentStatus(t2.id, TournamentStatus.Open, T)
    expect(service.listTournaments(T, { status: TournamentStatus.Draft }).length).toBe(1)
    expect(service.listTournaments(T, { status: TournamentStatus.Open }).length).toBe(1)
  })

  it('正例: 按类型过滤', () => {
    freshTournament({ name: 'SE', type: TournamentType.SingleElimination })
    freshTournament({ name: 'RR', type: TournamentType.RoundRobin })
    expect(service.listTournaments(T, { type: TournamentType.RoundRobin }).length).toBe(1)
  })

  it('正例: 按门店过滤', () => {
    freshTournament({ name: 'S1', storeId: 's1' })
    freshTournament({ name: 'S2', storeId: 's2' })
    expect(service.listTournaments(T, { storeId: 's1' }).length).toBe(1)
  })

  it('反例: 跨 tenant 返回空', () => {
    freshTournament()
    expect(service.listTournaments('wrong').length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// updateTournamentStatus
// ═══════════════════════════════════════════════════════════════

describe('updateTournamentStatus', () => {
  let t: Tournament
  beforeEach(() => { t = freshTournament() })

  it('正例: Draft → Open', () => {
    expect(service.updateTournamentStatus(t.id, TournamentStatus.Open, T).status).toBe(TournamentStatus.Open)
  })

  it('正例: Draft → Cancelled', () => {
    expect(service.updateTournamentStatus(t.id, TournamentStatus.Cancelled, T).status).toBe(TournamentStatus.Cancelled)
  })

  it('正例: Cancelled → Draft (reopen)', () => {
    service.updateTournamentStatus(t.id, TournamentStatus.Cancelled, T)
    expect(service.updateTournamentStatus(t.id, TournamentStatus.Draft, T).status).toBe(TournamentStatus.Draft)
  })

  it('正例: Open → Ongoing', () => {
    service.updateTournamentStatus(t.id, TournamentStatus.Open, T)
    expect(service.updateTournamentStatus(t.id, TournamentStatus.Ongoing, T).status).toBe(TournamentStatus.Ongoing)
  })

  it('反例: Draft → Completed 非法', () => {
    expect(() => service.updateTournamentStatus(t.id, TournamentStatus.Completed, T)).toThrow('Invalid')
  })

  it('反例: Completed → Open 非法', () => {
    service.updateTournamentStatus(t.id, TournamentStatus.Open, T)
    service.updateTournamentStatus(t.id, TournamentStatus.Ongoing, T)
    service.updateTournamentStatus(t.id, TournamentStatus.Completed, T)
    expect(() => service.updateTournamentStatus(t.id, TournamentStatus.Open, T)).toThrow('Invalid')
  })
})

// ═══════════════════════════════════════════════════════════════
// registerParticipant
// ═══════════════════════════════════════════════════════════════

describe('registerParticipant', () => {
  it('正例: 开放报名时注册', () => {
    const t = openTournament()
    const updated = service.registerParticipant(t.id, 'mem-001', T)
    expect(updated.currentParticipants).toBe(1)
  })

  it('反例: 非 OPEN 状态抛错', () => {
    const t = freshTournament()
    expect(() => service.registerParticipant(t.id, 'mem-001', T)).toThrow('not open')
  })

  it('反例: 满员抛错', () => {
    const t = openTournament(2)
    service.registerParticipant(t.id, 'mem-001', T)
    service.registerParticipant(t.id, 'mem-002', T)
    expect(() => service.registerParticipant(t.id, 'mem-003', T)).toThrow('maximum')
  })

  it('反例: 重复注册抛错', () => {
    const t = openTournament()
    service.registerParticipant(t.id, 'mem-001', T)
    expect(() => service.registerParticipant(t.id, 'mem-001', T)).toThrow('already registered')
  })
})

// ═══════════════════════════════════════════════════════════════
// Team registration
// ═══════════════════════════════════════════════════════════════

describe('registerTeam', () => {
  it('正例: 创建待审批队伍', () => {
    const t = openTournament()
    const reg = service.registerTeam({
      tournamentId: t.id, teamName: 'Alpha', captainId: 'm1', memberIds: ['m1', 'm2'],
    }, T)
    expect(reg.status).toBe(TeamRegistrationStatus.Pending)
    expect(reg.teamName).toBe('Alpha')
  })

  it('反例: 非 OPEN 抛错', () => {
    const t = freshTournament()
    expect(() => service.registerTeam({
      tournamentId: t.id, teamName: 'A', captainId: 'm1', memberIds: ['m1'],
    }, T)).toThrow('not open')
  })
})

describe('approveTeam / rejectTeam', () => {
  it('正例: 审批通过', () => {
    const t = openTournament()
    const reg = service.registerTeam({ tournamentId: t.id, teamName: 'A', captainId: 'c', memberIds: ['c'] }, T)
    expect(service.approveTeam(reg.id, T).status).toBe(TeamRegistrationStatus.Approved)
  })

  it('正例: 驳回', () => {
    const t = openTournament()
    const reg = service.registerTeam({ tournamentId: t.id, teamName: 'A', captainId: 'c', memberIds: ['c'] }, T)
    expect(service.rejectTeam(reg.id, T).status).toBe(TeamRegistrationStatus.Rejected)
  })

  it('反例: 不存在抛错', () => {
    expect(() => service.approveTeam('nonexistent', T)).toThrow('not found')
  })

  it('正例: 列出队伍注册', () => {
    const t = openTournament()
    service.registerTeam({ tournamentId: t.id, teamName: 'A', captainId: 'c', memberIds: ['c'] }, T)
    service.registerTeam({ tournamentId: t.id, teamName: 'B', captainId: 'c2', memberIds: ['c2'] }, T)
    expect(service.listTeamRegistrations(t.id, T).length).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════════
// generateBracket
// ═══════════════════════════════════════════════════════════════

describe('generateBracket', () => {
  it('正例: 淘汰赛生成 bracket', () => {
    const t = openTournament()
    openAndRegister(t.id, 4)
    const matches = service.generateBracket(t.id, T)
    expect(matches.length).toBeGreaterThan(0)
    expect(service.getTournament(t.id, T)!.status).toBe(TournamentStatus.Ongoing)
  })

  it('正例: 循环赛生成正确数量的比赛', () => {
    const t = service.createTournament({
      tenantId: T, name: 'RR', type: TournamentType.RoundRobin, gameName: 'G',
      startDate: '2026-07-01', endDate: '2026-07-15', maxParticipants: 16,
    })
    service.updateTournamentStatus(t.id, TournamentStatus.Open, T)
    openAndRegister(t.id, 4)
    const matches = service.generateBracket(t.id, T)
    // C(4,2) = 6
    expect(matches.length).toBe(6)
  })

  it('反例: 参与人数不足 2', () => {
    const t = openTournament()
    openAndRegister(t.id, 1)
    expect(() => service.generateBracket(t.id, T)).toThrow('Need at least 2 participants')
  })

  it('反例: 非 OPEN 状态', () => {
    const t = freshTournament()
    expect(() => service.generateBracket(t.id, T)).toThrow('Bracket can only be generated when tournament is OPEN')
  })
})

// ═══════════════════════════════════════════════════════════════
// recordMatchResult
// ═══════════════════════════════════════════════════════════════

describe('recordMatchResult', () => {
  let matchId: string

  function setup(): void {
    const t = openTournament(4)
    openAndRegister(t.id, 2)
    const matches = service.generateBracket(t.id, T)
    matchId = matches[0].id
  }

  it('正例: 记录比分并更新排名', () => {
    setup()
    const m = service.recordMatchResult(matchId, 2, 1, T)
    expect(m.status).toBe(MatchStatus.Completed)
    expect(m.winnerId).toBe(m.player1Id)
    expect(m.score1).toBe(2)
    expect(m.score2).toBe(1)

    // 胜者 3 分
    const rankings = service.getRankings(m.tournamentId, T)
    const winnerRank = rankings.find(r => r.memberId === m.player1Id)
    expect(winnerRank?.points).toBe(3)
    expect(winnerRank?.wins).toBe(1)
  })

  it('正例: 平局双方各 1 分', () => {
    setup()
    const m = service.recordMatchResult(matchId, 1, 1, T)
    expect(m.winnerId).toBeUndefined()

    const rankings = service.getRankings(m.tournamentId, T)
    const p1 = rankings.find(r => r.memberId === m.player1Id)
    const p2 = rankings.find(r => r.memberId === m.player2Id)
    expect(p1?.points).toBe(1)
    expect(p1?.draws).toBe(1)
    expect(p2?.points).toBe(1)
    expect(p2?.draws).toBe(1)
  })

  it('反例: 比赛不存在', () => {
    expect(() => service.recordMatchResult('fake', 1, 0, T)).toThrow('Match not found')
  })

  it('反例: 不能重复记录', () => {
    setup()
    service.recordMatchResult(matchId, 2, 1, T)
    expect(() => service.recordMatchResult(matchId, 3, 2, T)).toThrow('already completed')
  })

  it('反例: 跨 tenant', () => {
    setup()
    expect(() => service.recordMatchResult(matchId, 2, 1, 'wrong')).toThrow('Tournament not found')
  })
})

// ═══════════════════════════════════════════════════════════════
// setDisputed
// ═══════════════════════════════════════════════════════════════

describe('setDisputed', () => {
  it('正例: 设置争议状态', () => {
    const t = openTournament()
    openAndRegister(t.id, 2)
    const matches = service.generateBracket(t.id, T)
    const d = service.setDisputed(matches[0].id, T)
    expect(d.status).toBe(MatchStatus.Disputed)
  })

  it('反例: 不存在抛错', () => {
    expect(() => service.setDisputed('fake', T)).toThrow('Match not found')
  })
})

// ═══════════════════════════════════════════════════════════════
// getMatches
// ═══════════════════════════════════════════════════════════════

describe('getMatch / listMatches', () => {
  let matchId: string
  let tId: string
  beforeEach(() => {
    const t = openTournament()
    openAndRegister(t.id, 2)
    const matches = service.generateBracket(t.id, T)
    matchId = matches[0].id
    tId = t.id
  })

  it('正例: 按 ID 获取比赛', () => {
    expect(service.getMatch(matchId, T)?.id).toBe(matchId)
  })

  it('反例: 不存在返回 undefined', () => {
    expect(service.getMatch('fake', T)).toBeUndefined()
  })

  it('反例: 跨 tenant 返回 undefined', () => {
    expect(service.getMatch(matchId, 'wrong')).toBeUndefined()
  })

  it('正例: 列出比赛带过滤', () => {
    const list = service.listMatches(tId, T, { round: 1 })
    expect(list.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// getUpcomingMatches
// ═══════════════════════════════════════════════════════════════

describe('getUpcomingMatches', () => {
  it('正例: 返回该成员待进行的比赛', () => {
    const t = openTournament()
    openAndRegister(t.id, 2)
    service.generateBracket(t.id, T)
    expect(service.getUpcomingMatches('mem-0').length).toBeGreaterThan(0)
  })

  it('边界: 非参与者返回空', () => {
    expect(service.getUpcomingMatches('none').length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// getLiveMatches
// ═══════════════════════════════════════════════════════════════

describe('getLiveMatches', () => {
  it('边界: 无进行中比赛返回空', () => {
    expect(service.getLiveMatches('s1').length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// getRankings
// ═══════════════════════════════════════════════════════════════

describe('getRankings', () => {
  it('边界: 无数据返回空', () => {
    const t = freshTournament()
    expect(service.getRankings(t.id, T).length).toBe(0)
  })

  it('正例: 比赛后排名正确', () => {
    const t = service.createTournament({
      tenantId: T, name: 'RR', type: TournamentType.RoundRobin, gameName: 'G',
      startDate: '2026-07-01', endDate: '2026-07-15', maxParticipants: 16,
    })
    service.updateTournamentStatus(t.id, TournamentStatus.Open, T)
    openAndRegister(t.id, 3)
    const matches = service.generateBracket(t.id, T)
    // 赢第一个比赛
    service.recordMatchResult(matches[0].id, 2, 1, T)
    const rankings = service.getRankings(t.id, T)
    const winner = rankings.find(r => r.memberId === matches[0].player1Id)
    expect(winner?.rank).toBe(1)
    expect(winner?.points).toBe(3)
    expect(winner?.wins).toBe(1)
  })
})
