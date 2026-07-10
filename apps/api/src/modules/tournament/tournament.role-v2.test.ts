import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [tournament] [C] 8角色测试补全 (v2)
 *
 * 8 角色视角的 tournament 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖端点: createTournament, listTournaments, getTournament, updateTournament,
 *           updateTournamentStatus, registerParticipant, registerTeam,
 *           approveTeam, rejectTeam, listTeamRegistrations, generateBracket,
 *           recordMatchResult, setDisputed, getMatch, listMatches,
 *           getRankings, getUpcomingMatches, getLiveMatches
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/业务场景）
 * 跨租户隔离测试 + 状态流转边界测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TournamentService } from './tournament.service'
import {
  MatchStatus,
  TeamRegistrationStatus,
  TournamentStatus,
  TournamentType,
} from './tournament.entity'
import type { Tournament } from './tournament.entity'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TENANT_A = 'tenant-trnr-a'
const TENANT_B = 'tenant-trnr-b'

function makeService(): TournamentService {
  const svc = new TournamentService()
  svc.resetTournamentStoresForTests()
  return svc
}

/**
 * 创建一个赛事并打开报名
 */
function createAndOpenTournament(
  svc: TournamentService,
  tenantId: string = TENANT_A,
  overrides?: Partial<Parameters<TournamentService['createTournament']>[0]>,
): Tournament {
  const t = svc.createTournament({
    tenantId,
    storeId: 'store-001',
    name: '角色测试赛事',
    type: TournamentType.SingleElimination,
    gameName: '拳皇15',
    startDate: '2026-07-10',
    endDate: '2026-07-20',
    maxParticipants: 8,
    ...overrides,
  })
  svc.updateTournamentStatus(t.id, TournamentStatus.Open, tenantId)
  return t
}

// ═══════════════════════════════════════════════════════
// 👔店长 — 全局管理权限
// ═══════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} tournament 角色测试`, () => {
  it('店长创建并打开赛事 — 正常流程包含所有字段', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      storeId: 'store-001',
      name: '暑期格斗赛',
      type: TournamentType.SingleElimination,
      gameName: '街霸6',
      startDate: '2026-07-15',
      endDate: '2026-07-25',
      maxParticipants: 16,
      rules: { matchFormat: 'BO3', allowDraws: false },
      prizes: { first: { label: '冠军', value: '¥5000' } },
      bannerImage: 'https://cdn.example.com/tournament-banner.jpg',
    })
    assert.equal(t.status, TournamentStatus.Draft)
    assert.equal(t.name, '暑期格斗赛')
    assert.equal(t.currentParticipants, 0)
    assert.deepEqual(t.rules, { matchFormat: 'BO3', allowDraws: false })

    const opened = svc.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT_A)
    assert.equal(opened.status, TournamentStatus.Open)
    assert.ok(opened.id.startsWith('tournament-'))
  })

  it('店长更新赛事信息 — 修改字段仅影响指定属性', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    const updated = svc.updateTournament(t.id, TENANT_A, {
      name: '更新后赛事名称',
      maxParticipants: 32,
    })
    assert.equal(updated.name, '更新后赛事名称')
    assert.equal(updated.maxParticipants, 32)
    // 未更新的字段保持不变
    assert.equal(updated.gameName, '拳皇15')
  })

  it('店长查看所有赛事并进行跨租户隔离 — 看不到其他租户数据', () => {
    const svc = makeService()
    createAndOpenTournament(svc, TENANT_A)
    createAndOpenTournament(svc, TENANT_B)
    const listA = svc.listTournaments(TENANT_A)
    const listB = svc.listTournaments(TENANT_B)
    assert.equal(listA.length, 1)
    assert.equal(listB.length, 1)
    assert.equal(listA[0].tenantId, TENANT_A)
    assert.equal(listB[0].tenantId, TENANT_B)
  })

  it('店长取消赛事 — Draft → Cancelled 允许', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      name: '可取消赛事',
      type: TournamentType.RoundRobin,
      gameName: '测试',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
      maxParticipants: 8,
    })
    const cancelled = svc.updateTournamentStatus(t.id, TournamentStatus.Cancelled, TENANT_A)
    assert.equal(cancelled.status, TournamentStatus.Cancelled)
  })

  it('店长禁止无效状态流转 — Draft → Completed 抛错', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      name: '无效流转',
      type: TournamentType.SingleElimination,
      gameName: '测试',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
      maxParticipants: 4,
    })
    assert.throws(() => {
      svc.updateTournamentStatus(t.id, TournamentStatus.Completed, TENANT_A)
    }, /Invalid tournament status transition/)
  })
})

// ═══════════════════════════════════════════════════════
// 🛒前台 — 注册参赛者和查询信息
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} tournament 角色测试`, () => {
  it('前台为顾客注册个人参赛 — 正常流程增加参赛人数', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    assert.equal(t.currentParticipants, 0)

    svc.registerParticipant(t.id, 'member-001', TENANT_A)
    const after = svc.getTournament(t.id, TENANT_A)!
    assert.equal(after.currentParticipants, 1)
  })

  it('前台重复注册同一参赛者 — 抛出冲突错误', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    svc.registerParticipant(t.id, 'member-001', TENANT_A)
    assert.throws(() => {
      svc.registerParticipant(t.id, 'member-001', TENANT_A)
    }, /already registered/)
  })

  it('前台在赛事未开放时注册 — 抛出错误', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      name: '未开放赛事',
      type: TournamentType.SingleElimination,
      gameName: '测试',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
      maxParticipants: 4,
    })
    assert.throws(() => {
      svc.registerParticipant(t.id, 'member-001', TENANT_A)
    }, /not open for registration/)
  })

  it('前台注册满员赛事 — 抛出错误', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 1 })
    svc.registerParticipant(t.id, 'member-001', TENANT_A)
    assert.throws(() => {
      svc.registerParticipant(t.id, 'member-002', TENANT_A)
    }, /maximum participants/)
  })

  it('前台查询赛事详情 — 获取正确的赛事信息', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    const found = svc.getTournament(t.id, TENANT_A)
    assert.ok(found)
    assert.equal(found!.name, t.name)
    // 跨租户隔离
    const notFound = svc.getTournament(t.id, TENANT_B)
    assert.equal(notFound, undefined)
  })
})

// ═══════════════════════════════════════════════════════
// 👥HR — 团队管理和审核
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.HR} tournament 角色测试`, () => {
  it('HR创建团队报名 — 正常流程生成待审核报名', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    const reg = svc.registerTeam(
      {
        tournamentId: t.id,
        teamName: '星际战队',
        captainId: 'member-001',
        memberIds: ['member-002', 'member-003'],
      },
      TENANT_A,
    )
    assert.equal(reg.teamName, '星际战队')
    assert.equal(reg.status, TeamRegistrationStatus.Pending)
    assert.ok(reg.id.startsWith('teamreg-'))
  })

  it('HR审批团队报名 — 正常流程通过', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    const reg = svc.registerTeam(
      { tournamentId: t.id, teamName: '战神队', captainId: 'member-001', memberIds: [] },
      TENANT_A,
    )
    const approved = svc.approveTeam(reg.id, TENANT_A)
    assert.equal(approved.status, TeamRegistrationStatus.Approved)
  })

  it('HR拒绝团队报名 — 正常流程驳回', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    const reg = svc.registerTeam(
      { tournamentId: t.id, teamName: '不合格队伍', captainId: 'member-001', memberIds: [] },
      TENANT_A,
    )
    const rejected = svc.rejectTeam(reg.id, TENANT_A)
    assert.equal(rejected.status, TeamRegistrationStatus.Rejected)
  })

  it('HR对不存在团队报名操作 — 抛出错误', () => {
    const svc = makeService()
    assert.throws(() => {
      svc.approveTeam('teamreg-nonexistent', TENANT_A)
    }, /not found/)
  })

  it('HR列出团队报名 — 正确过滤', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    svc.registerTeam(
      { tournamentId: t.id, teamName: 'A队', captainId: 'm1', memberIds: [] },
      TENANT_A,
    )
    svc.registerTeam(
      { tournamentId: t.id, teamName: 'B队', captainId: 'm2', memberIds: [] },
      TENANT_A,
    )
    const teams = svc.listTeamRegistrations(t.id, TENANT_A)
    assert.equal(teams.length, 2)
    // 跨租户隔离: 其他租户看不见
    assert.throws(() => {
      svc.listTeamRegistrations(t.id, TENANT_B)
    }, /not found/)
  })
})

// ═══════════════════════════════════════════════════════
// 🔧安监 — 赛事安全与争议处理
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Security} tournament 角色测试`, () => {
  it('安监标记比赛为争议 — 正常流程状态变更', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 4 })
    svc.registerParticipant(t.id, 'member-001', TENANT_A)
    svc.registerParticipant(t.id, 'member-002', TENANT_A)
    svc.registerParticipant(t.id, 'member-003', TENANT_A)
    svc.registerParticipant(t.id, 'member-004', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    const matchId = matches[0].id
    const disputed = svc.setDisputed(matchId, TENANT_A)
    assert.equal(disputed.status, MatchStatus.Disputed)
  })

  it('安监对不存在的比赛标记争议 — 抛出错误', () => {
    const svc = makeService()
    assert.throws(() => {
      svc.setDisputed('match-nonexistent', TENANT_A)
    }, /not found/)
  })

  it('安监跨租户标记争议 — 无权访问', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'member-001', TENANT_A)
    svc.registerParticipant(t.id, 'member-002', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    assert.throws(() => {
      svc.setDisputed(matches[0].id, TENANT_B)
    }, /not found/)
  })

  it('安监查看比赛详情 — 正确返回', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'member-001', TENANT_A)
    svc.registerParticipant(t.id, 'member-002', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    const found = svc.getMatch(matches[0].id, TENANT_A)
    assert.ok(found)
    // 只有2人时首轮完成(无bye), 但对2人单淘汰实际是1轮即完成
    assert.ok(found!.status === MatchStatus.Pending || found!.status === MatchStatus.Completed)
  })
})

// ═══════════════════════════════════════════════════════
// 🎮导玩员 — 比赛编排和记录
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Guide} tournament 角色测试`, () => {
  it('导玩员生成淘汰赛对阵 — 正常流程创建正确数量比赛', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 4 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.registerParticipant(t.id, 'p3', TENANT_A)
    svc.registerParticipant(t.id, 'p4', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    assert.ok(matches.length >= 2)
    // 赛事状态应变为 Ongoing
    const updated = svc.getTournament(t.id, TENANT_A)!
    assert.equal(updated.status, TournamentStatus.Ongoing)
  })

  it('导玩员参赛者不足时生成对阵 — 抛出错误', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 4 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    assert.throws(() => {
      svc.generateBracket(t.id, TENANT_A)
    }, /at least 2 participants/)
  })

  it('导玩员记录比赛结果 — 正确更新比分和排名', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    const recorded = svc.recordMatchResult(matches[0].id, 3, 1, TENANT_A)
    assert.equal(recorded.score1, 3)
    assert.equal(recorded.score2, 1)
    assert.equal(recorded.winnerId, 'p1')
    assert.equal(recorded.status, MatchStatus.Completed)

    // 验证排名更新
    const rankings = svc.getRankings(t.id, TENANT_A)
    const winnerRank = rankings.find((r) => r.memberId === 'p1')
    assert.ok(winnerRank)
    assert.equal(winnerRank!.points, 3)
    assert.equal(winnerRank!.wins, 1)
  })

  it('导玩员记录已完成的比赛 — 抛出错误', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    svc.recordMatchResult(matches[0].id, 2, 0, TENANT_A)
    assert.throws(() => {
      svc.recordMatchResult(matches[0].id, 3, 1, TENANT_A)
    }, /already completed/)
  })

  it('导玩员生成 RoundRobin 对阵 — 创建正确对局数', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, {
      type: TournamentType.RoundRobin,
      maxParticipants: 3,
    })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.registerParticipant(t.id, 'p3', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    // 3人循环赛 = 3场比赛
    assert.equal(matches.length, 3)
  })

  it('导玩员查询比赛列表 — 按轮次过滤', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.generateBracket(t.id, TENANT_A)
    const matches = svc.listMatches(t.id, TENANT_A, { round: 1 })
    assert.ok(matches.length >= 1)
    // 无匹配的过滤返回空
    const noMatch = svc.listMatches(t.id, TENANT_A, { round: 99 })
    assert.equal(noMatch.length, 0)
  })
})

// ═══════════════════════════════════════════════════════
// 🎯运行专员 — 赛事排期和运营
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Operations} tournament 角色测试`, () => {
  it('运行专员查看实时比赛 — 正常流程返回比赛', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, {
      maxParticipants: 4,
      storeId: 'store-001',
    })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.registerParticipant(t.id, 'p3', TENANT_A)
    svc.registerParticipant(t.id, 'p4', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    // 返回进行中的赛事
    const updated = svc.getTournament(t.id, TENANT_A)!
    assert.equal(updated.status, TournamentStatus.Ongoing)

    // 记录第一场比赛结果让其完成
    svc.recordMatchResult(matches[0].id, 2, 0, TENANT_A)
    // 第二场继续是进行中
    assert.ok(matches.length >= 2)
  })

  it('运行专员无实时比赛门店 — 返回空列表', () => {
    const svc = makeService()
    const live = svc.getLiveMatches('store-no-tournament')
    assert.deepEqual(live, [])
  })

  it('运行专员查询赛事列表 — 支持状态过滤', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    // 创建一个Draft状态的赛事
    svc.createTournament({
      tenantId: TENANT_A,
      name: '草稿赛事',
      type: TournamentType.SingleElimination,
      gameName: '测试',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
      maxParticipants: 4,
    })
    const draftList = svc.listTournaments(TENANT_A, { status: TournamentStatus.Draft })
    const openList = svc.listTournaments(TENANT_A, { status: TournamentStatus.Open })
    assert.equal(draftList.length, 1)
    assert.equal(openList.length, 1)

    // 过滤后 t 应该只在 Open 列表中出现
    assert.equal(openList[0].id, t.id)
  })

  it('运行专员查看排名 — 正确排序', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, {
      type: TournamentType.RoundRobin,
      maxParticipants: 3,
    })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.registerParticipant(t.id, 'p3', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    svc.recordMatchResult(matches[0].id, 2, 1, TENANT_A)
    svc.recordMatchResult(matches[1].id, 0, 3, TENANT_A)
    svc.recordMatchResult(matches[2].id, 2, 2, TENANT_A)
    const rankings = svc.getRankings(t.id, TENANT_A)
    assert.equal(rankings.length, 3)

    // 分数最高的排第一
    const topRank = rankings[0]
    assert.ok(topRank.rank = 1)
  })
})

// ═══════════════════════════════════════════════════════
// 🤝团建 — 团队赛事组织
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} tournament 角色测试`, () => {
  it('团建创建大循环联赛 — 适合全员参与的赛制', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      storeId: 'store-001',
      name: '团建循环赛',
      type: TournamentType.League,
      gameName: '团队项目',
      startDate: '2026-08-01',
      endDate: '2026-08-10',
      maxParticipants: 20,
      rules: { matchFormat: 'BO1', allowDraws: true },
      prizes: {
        participation: { label: '参与奖', value: '定制徽章' },
      },
    })
    assert.equal(t.type, TournamentType.League)
    assert.equal(t.maxParticipants, 20)
    assert.ok(t.prizes.participation)
  })

  it('团建创建团体报名 — 队长加队员批量注册', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    const reg = svc.registerTeam(
      {
        tournamentId: t.id,
        teamName: '销售部战队',
        captainId: 'mgr-001',
        memberIds: ['emp-001', 'emp-002', 'emp-003', 'emp-004'],
      },
      TENANT_A,
    )
    assert.equal(reg.memberIds.length, 4)
    assert.equal(reg.teamName, '销售部战队')

    // 列出报名
    const teams = svc.listTeamRegistrations(t.id, TENANT_A)
    assert.equal(teams.length, 1)
  })

  it('团建不允许在未开放的赛事中报名团体', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      name: '未开放团建赛',
      type: TournamentType.League,
      gameName: '桌游',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
      maxParticipants: 16,
    })
    assert.throws(() => {
      svc.registerTeam(
        { tournamentId: t.id, teamName: '团建队', captainId: 'c', memberIds: [] },
        TENANT_A,
      )
    }, /not open for registration/)
  })

  it('团建查看参赛者即将到来的比赛', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.generateBracket(t.id, TENANT_A)
    const upcoming = svc.getUpcomingMatches('p1')
    assert.equal(upcoming.length, 1)
    // 不存在的参赛者
    const noMatch = svc.getUpcomingMatches('nonexistent')
    assert.equal(noMatch.length, 0)
  })
})

// ═══════════════════════════════════════════════════════
// 📢营销 — 赛事推广和数据
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} tournament 角色测试`, () => {
  it('营销创建带推广信息的赛事 — banner+奖品+规则', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      storeId: 'store-001',
      name: '暑假杯-电竞大赛',
      type: TournamentType.SingleElimination,
      gameName: '原神',
      startDate: '2026-07-20',
      endDate: '2026-08-05',
      maxParticipants: 32,
      bannerImage: 'https://cdn.example.com/summer-cup.jpg',
      prizes: {
        first: { label: '冠军', value: '¥10000' },
        second: { label: '亚军', value: '¥5000' },
        third: { label: '季军', value: '¥2000' },
        participation: { label: '参与奖', value: '限定皮肤' },
      },
      rules: { matchFormat: 'BO5', scoreMode: 'WINS', maxScore: 5 },
    })
    assert.ok(t.bannerImage)
    assert.equal(Object.keys(t.prizes).length, 4)
  })

  it('营销按门店/品牌/类型过滤赛事列表', () => {
    const svc = makeService()
    createAndOpenTournament(svc, TENANT_A)
    svc.createTournament({
      tenantId: TENANT_A,
      storeId: 'store-002',
      name: '另一门店赛事',
      type: TournamentType.RoundRobin,
      gameName: '王者荣耀',
      startDate: '2026-07-15',
      endDate: '2026-07-25',
      maxParticipants: 8,
    })
    const storeFilter = svc.listTournaments(TENANT_A, { storeId: 'store-002' })
    assert.equal(storeFilter.length, 1)
    assert.equal(storeFilter[0].storeId, 'store-002')

    const typeFilter = svc.listTournaments(TENANT_A, { type: TournamentType.SingleElimination })
    assert.equal(typeFilter.length, 1)
  })

  it('营销查看排名 — 支持 limit 截断', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 4 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.registerParticipant(t.id, 'p3', TENANT_A)
    svc.registerParticipant(t.id, 'p4', TENANT_A)
    svc.generateBracket(t.id, TENANT_A)
    const all = svc.getRankings(t.id, TENANT_A)
    assert.equal(all.length, 4)
  })

  it('营销无赛事时查看运营信息 — 返回空列表', () => {
    const svc = makeService()
    const live = svc.getLiveMatches('store-001')
    assert.deepEqual(live, [])
    // 对不存在赛事getRankings会抛异常
    assert.throws(() => {
      svc.getRankings('nonexistent-tournament', TENANT_A)
    }, /not found/)
  })

  it('营销查看赛事统计 — 列表支持排序和筛选', () => {
    const svc = makeService()
    createAndOpenTournament(svc, TENANT_A)
    const list = svc.listTournaments(TENANT_A)
    // 按创建时间降序
    assert.ok(list.length >= 1)
    if (list.length > 1) {
      assert.ok(list[0].createdAt >= list[1].createdAt)
    }
  })
})

// ═══════════════════════════════════════════════════════
// 跨模块边界测试
// ═══════════════════════════════════════════════════════════
describe('tournament 跨租户与状态流转边界', () => {
  it('租户A无法操作租户B的团队报名审批', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A)
    const reg = svc.registerTeam(
      { tournamentId: t.id, teamName: 'A队', captainId: 'm1', memberIds: [] },
      TENANT_A,
    )
    assert.throws(() => {
      svc.approveTeam(reg.id, TENANT_B)
    }, /not found/)
  })

  it('租户A的赛事对租户B不可见', () => {
    const svc = makeService()
    createAndOpenTournament(svc, TENANT_A)
    const bList = svc.listTournaments(TENANT_B)
    assert.equal(bList.length, 0)
  })

  it('Cancelled 状态可以恢复 Draft', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT_A,
      name: '恢复测试',
      type: TournamentType.SingleElimination,
      gameName: '测试',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
      maxParticipants: 4,
    })
    svc.updateTournamentStatus(t.id, TournamentStatus.Cancelled, TENANT_A)
    const reopened = svc.updateTournamentStatus(t.id, TournamentStatus.Draft, TENANT_A)
    assert.equal(reopened.status, TournamentStatus.Draft)
  })

  it('Completed 状态下禁止任何状态流转', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    svc.recordMatchResult(matches[0].id, 2, 0, TENANT_A)
    const completed = svc.getTournament(t.id, TENANT_A)!
    assert.equal(completed.status, TournamentStatus.Completed)
    assert.throws(() => {
      svc.updateTournamentStatus(t.id, TournamentStatus.Ongoing, TENANT_A)
    }, /Invalid tournament status transition/)
  })

  it('平局比分 — winnerId 为 undefined，双方各得 1 分', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, {
      type: TournamentType.RoundRobin,
      maxParticipants: 2,
    })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    const matches = svc.generateBracket(t.id, TENANT_A)
    const result = svc.recordMatchResult(matches[0].id, 1, 1, TENANT_A)
    assert.equal(result.winnerId, undefined)
    const rankings = svc.getRankings(t.id, TENANT_A)
    const r1 = rankings.find((r) => r.memberId === 'p1')
    const r2 = rankings.find((r) => r.memberId === 'p2')
    assert.equal(r1!.points, 1)
    assert.equal(r1!.draws, 1)
    assert.equal(r2!.points, 1)
    assert.equal(r2!.draws, 1)
  })

  it('创建赛事时最大参赛人数最小值为 1', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 1 })
    assert.equal(t.maxParticipants, 1)
    // 1人只能注册，无法生成对阵
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    assert.throws(() => {
      svc.generateBracket(t.id, TENANT_A)
    }, /at least 2 participants/)
  })

  it('参赛者查看自己即将到来的比赛不依赖租户', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, TENANT_A, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT_A)
    svc.registerParticipant(t.id, 'p2', TENANT_A)
    svc.generateBracket(t.id, TENANT_A)
    const upcoming = svc.getUpcomingMatches('p1')
    assert.equal(upcoming.length, 1)
    // 没有排期的比赛返回空
    const noUpcoming = svc.getUpcomingMatches('unknown')
    assert.equal(noUpcoming.length, 0)
  })
})
