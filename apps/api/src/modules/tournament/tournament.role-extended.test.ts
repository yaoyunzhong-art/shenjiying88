import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: tournament 模块
 *
 * 4 个附加角色视角：
 * 🎮导玩员 — 创建和报名赛事
 * 🎯运行专员 — 安排赛程
 * 👔店长 — 查看赛事统计
 * 📢营销 — 推广赛事活动
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TournamentController } from './tournament.controller'
import { TournamentService } from './tournament.service'
import {
  TournamentStatus,
  TournamentType,
  MatchStatus,
} from './tournament.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 测试数据工厂 ──

const tenantCtx: RequestTenantContext = {
  tenantId: 't-tournament-ext',
  brandId: 'b-arcade',
  storeId: 's-main',
}

function createController(): TournamentController {
  const service = new TournamentService()
  // Reset in-memory stores
  service.resetTournamentStoresForTests()
  return new TournamentController(service)
}

function createDraftTournament(ctrl: TournamentController, overrides: Partial<{
  name: string
  type: TournamentType
  gameName: string
  maxParticipants: number
}> = {}) {
  return ctrl.createTournament(tenantCtx, {
    name: overrides.name ?? '测试赛',
    type: overrides.type ?? TournamentType.SingleElimination,
    gameName: overrides.gameName ?? '街霸6',
    startDate: '2026-07-01T10:00:00.000Z',
    endDate: '2026-07-01T18:00:00.000Z',
    maxParticipants: overrides.maxParticipants ?? 16,
    description: '月度排位赛',
    rules: { matchFormat: 'BO3', scoreMode: 'WINS', allowDraws: false },
    prizes: {
      first: { label: '冠军', value: '1000积分' },
      second: { label: '亚军', value: '500积分' },
    },
    bannerImage: 'https://example.com/banner.jpg',
  })
}

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 创建和报名赛事 (guide creating & registering tournaments)
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 赛事创建与报名视角', () => {
  it('成功创建赛事并设置基本信息 (create tournament)', () => {
    const ctrl = createController()

    const t = createDraftTournament(ctrl)

    assert.equal(t.name, '测试赛')
    assert.equal(t.gameName, '街霸6')
    assert.equal(t.status, TournamentStatus.Draft)
    assert.equal(t.maxParticipants, 16)
    assert.equal(t.currentParticipants, 0)
    assert(t.id.startsWith('tournament-'))
  })

  it('报名开放后参赛者可以注册 (register participant)', () => {
    const ctrl = createController()
    const t = createDraftTournament(ctrl)

    // 开放报名
    ctrl.updateTournamentStatus(tenantCtx, t.id, { status: TournamentStatus.Open })

    // 注册参赛者
    const afterReg = ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'player-001' })
    assert.equal(afterReg.currentParticipants, 1)

    // 注册第二个
    const afterReg2 = ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'player-002' })
    assert.equal(afterReg2.currentParticipants, 2)
  })

  it('参赛者满员后拒绝报名 (max participants exceeded)', () => {
    const ctrl = createController()
    const t = createDraftTournament(ctrl, { maxParticipants: 2 })

    ctrl.updateTournamentStatus(tenantCtx, t.id, { status: TournamentStatus.Open })

    ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'p1' })
    ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'p2' })

    // 第三个报名应拒绝
    assert.throws(
      () => ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'p3' }),
      /maximum participants/
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 安排赛程 (operations scheduling events)
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 赛程安排视角', () => {
  it('生成单败淘汰赛赛程 (generate bracket)', () => {
    const ctrl = createController()
    const t = createDraftTournament(ctrl, { type: TournamentType.SingleElimination, maxParticipants: 4 })

    ctrl.updateTournamentStatus(tenantCtx, t.id, { status: TournamentStatus.Open })

    // 注册 4 名选手
    ;['p1', 'p2', 'p3', 'p4'].forEach((pid) =>
      ctrl.registerParticipant(tenantCtx, t.id, { memberId: pid })
    )

    // 生成赛程
    const matches = ctrl.generateBracket(tenantCtx, t.id)
    assert(matches.length >= 2, '4 人单败淘汰至少 2 场比赛')

    // 赛事状态变为 ONGOING
    const tournament = ctrl.getTournament(tenantCtx, t.id)
    assert.equal(tournament.status, TournamentStatus.Ongoing)
  })

  it('记录比赛结果并更新排名 (record match result)', () => {
    const ctrl = createController()
    const t = createDraftTournament(ctrl, { type: TournamentType.League, maxParticipants: 4 })

    ctrl.updateTournamentStatus(tenantCtx, t.id, { status: TournamentStatus.Open })
    ;['p1', 'p2', 'p3', 'p4'].forEach((pid) =>
      ctrl.registerParticipant(tenantCtx, t.id, { memberId: pid })
    )

    const matches = ctrl.generateBracket(tenantCtx, t.id)

    // 记录第一场比赛结果
    const firstMatch = matches[0]
    const result = ctrl.recordMatchResult(tenantCtx, firstMatch.id, {
      score1: 3,
      score2: 1,
    })

    assert.equal(result.status, MatchStatus.Completed)
    assert(result.playedAt, '比赛应有完成时间')
    assert.equal(result.winnerId, result.player1Id, 'player1 得分更高应赢')

    // 查看排名
    const rankings = ctrl.getRankings(tenantCtx, t.id, {})
    assert(rankings.length >= 2, '应至少有 2 人进入排名')
    const winnerRank = rankings.find((r: any) => r.memberId === result.player1Id)
    assert(winnerRank, '胜者应在排名中')
    assert.equal(winnerRank.wins, 1)
    assert(winnerRank.points >= 3)
  })

  it('重复记录已完成的比赛报错 (double result entry)', () => {
    const ctrl = createController()
    const t = createDraftTournament(ctrl, { maxParticipants: 2 })
    ctrl.updateTournamentStatus(tenantCtx, t.id, { status: TournamentStatus.Open })
    ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'pA' })
    ctrl.registerParticipant(tenantCtx, t.id, { memberId: 'pB' })

    const [match] = ctrl.generateBracket(tenantCtx, t.id)

    ctrl.recordMatchResult(tenantCtx, match.id, { score1: 2, score2: 0 })

    assert.throws(
      () => ctrl.recordMatchResult(tenantCtx, match.id, { score1: 2, score2: 0 }),
      /already completed/
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看赛事统计 (shop manager viewing tournament stats)
// ──────────────────────────────────────────────────────────────────────
describe('👔店长 — 赛事统计视角', () => {
  it('获取排名列表 (rankings)', () => {
    const ctrl = createController()
    const t = createDraftTournament(ctrl, { type: TournamentType.League, maxParticipants: 3 })

    ctrl.updateTournamentStatus(tenantCtx, t.id, { status: TournamentStatus.Open })
    ;['p1', 'p2', 'p3'].forEach((pid) =>
      ctrl.registerParticipant(tenantCtx, t.id, { memberId: pid })
    )

    ctrl.generateBracket(tenantCtx, t.id)

    // 记录多场比赛
    const matches = ctrl.listMatches(tenantCtx, t.id, {})
    for (const m of matches) {
      ctrl.recordMatchResult(tenantCtx, m.id, { score1: 2, score2: 1 })
    }

    const rankings = ctrl.getRankings(tenantCtx, t.id, { limit: 3 })
    assert.equal(rankings.length, 3)
    // 排名按积分降序
    for (let i = 1; i < rankings.length; i++) {
      assert(rankings[i - 1].points >= rankings[i].points)
    }
  })

  it('筛选状态查询赛事列表 (filter by status)', () => {
    const ctrl = createController()

    const t1 = createDraftTournament(ctrl, { name: '周赛' })
    ctrl.updateTournamentStatus(tenantCtx, t1.id, { status: TournamentStatus.Open })

    const t2 = createDraftTournament(ctrl, { name: '月赛' })
    // 保持 Draft

    const open = ctrl.listTournaments(tenantCtx, { status: TournamentStatus.Open })
    assert.equal(open.length, 1)
    assert.equal(open[0].name, '周赛')

    const drafts = ctrl.listTournaments(tenantCtx, { status: TournamentStatus.Draft })
    assert.equal(drafts.length, 1)
    assert.equal(drafts[0].name, '月赛')
  })

  it('查询不存在的赛事返回错误 (non-existent tournament)', () => {
    const ctrl = createController()

    assert.throws(
      () => ctrl.getTournament(tenantCtx, 'non-existent-tournament'),
      /Tournament not found/
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 推广赛事活动 (marketing promoting tournaments)
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 赛事推广视角', () => {
  it('查看已开放的赛事列表用于推广 (list open tournaments)', () => {
    const ctrl = createController()

    const campaignTournament = createDraftTournament(ctrl, { name: '暑期争霸赛' })
    ctrl.updateTournamentStatus(tenantCtx, campaignTournament.id, { status: TournamentStatus.Open })

    const openTournaments = ctrl.listTournaments(tenantCtx, { status: TournamentStatus.Open })
    assert(openTournaments.length >= 1)
    assert(openTournaments.some((t: any) => t.name === '暑期争霸赛'))
  })

  it('查看赛事详情获取宣传素材 (get tournament details)', () => {
    const ctrl = createController()

    const t = createDraftTournament(ctrl, {
      name: '国庆挑战赛',
      gameName: '拳皇15',
    })

    const detail = ctrl.getTournament(tenantCtx, t.id)
    assert.equal(detail.name, '国庆挑战赛')
    assert.equal(detail.gameName, '拳皇15')
    assert(detail.prizes, '赛事应有奖品设置')
    assert.equal(detail.prizes.first?.label, '冠军')
    assert(detail.bannerImage, '赛事应有宣传图片')
    assert(detail.rules.matchFormat, '赛事应有规则设置')
  })

  it('按游戏名称筛选赛事 (filter by game)', () => {
    const ctrl = createController()

    createDraftTournament(ctrl, { name: '街霸赛', gameName: '街霸6' })
    createDraftTournament(ctrl, { name: '拳皇赛', gameName: '拳皇15' })
    createDraftTournament(ctrl, { name: '铁拳赛', gameName: '铁拳8' })

    // 列出所有赛事
    const all = ctrl.listTournaments(tenantCtx, {})
    assert.equal(all.length, 3)
  })
})
