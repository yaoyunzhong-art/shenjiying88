import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [tournament] [C] 门店角色全场景测试 (storefront)
 *
 * 4 个门店角色视角的 tournament 模块测试：
 * 🛒前台 — 顾客报名/查看赛程/查看排行榜
 * 🎮导玩员 — 录入成绩/控制赛事回合/管理参赛者
 * 👔店长 — 创建赛事/设置奖品/查看赛事分析
 * 📢营销 — 推广赛事/发送通知/追踪参与度
 *
 * 每个角色 2-3 个测试用例（正常流程 + 反例/边界）
 * 共 10+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TournamentService } from './tournament.service'
import {
  TournamentStatus,
  TournamentType,
  MatchStatus,
} from './tournament.entity'
import type { Tournament } from './tournament.entity'

// ── 角色定义 ──
const ROLES = {
  FrontDesk: '🛒前台',
  Guide: '🎮导玩员',
  StoreManager: '👔店长',
  Marketing: '📢营销',
} as const

const TENANT = 'tenant-sf-001'

function makeService(): TournamentService {
  const svc = new TournamentService()
  svc.resetTournamentStoresForTests()
  return svc
}

function createAndOpenTournament(
  svc: TournamentService,
  overrides?: Partial<Parameters<TournamentService['createTournament']>[0]>,
): Tournament {
  const t = svc.createTournament({
    tenantId: TENANT,
    storeId: 'store-001',
    name: '门店角色测试赛事',
    type: TournamentType.SingleElimination,
    gameName: '街霸6',
    startDate: '2026-07-15',
    endDate: '2026-07-25',
    maxParticipants: 16,
    ...overrides,
  })
  svc.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
  return t
}

// ════════════════════════════════════════════════════════
// 🛒前台 — 顾客服务视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} tournament 门店测试`, () => {
  it('前台可为顾客报名已开放的比赛（正例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    svc.registerParticipant(t.id, 'customer-fd-001', TENANT)
    svc.registerParticipant(t.id, 'customer-fd-002', TENANT)

    const updated = svc.getTournament(t.id, TENANT)
    assert.equal(updated!.currentParticipants, 2)
  })

  it('前台不可为已满员的比赛报名（反例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'p1', TENANT)
    svc.registerParticipant(t.id, 'p2', TENANT)

    assert.throws(
      () => svc.registerParticipant(t.id, 'p3', TENANT),
      /maximum participants/,
    )
  })

  it('前台可查询门店现场赛程用于引导顾客（正例）', () => {
    const svc = makeService()
    createAndOpenTournament(svc, { name: '下午场', storeId: 'store-001' })

    const live = svc.getLiveMatches('store-001')
    assert.ok(Array.isArray(live))
    // 比赛开放但未开始，现场赛程为空
    assert.equal(live.length, 0)
  })

  it('前台可查看赛事排行榜（正例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, { type: TournamentType.RoundRobin })
    svc.registerParticipant(t.id, 'p1', TENANT)
    svc.registerParticipant(t.id, 'p2', TENANT)
    svc.registerParticipant(t.id, 'p3', TENANT)

    const matches = svc.generateBracket(t.id, TENANT)
    for (const m of matches) {
      if (m.player2Id) {
        svc.recordMatchResult(m.id, 2, 1, TENANT)
      }
    }

    const rankings = svc.getRankings(t.id, TENANT)
    assert.ok(rankings.length > 0)
    assert.ok(rankings[0].rank >= 1)
  })

  it('前台查看不存在的赛事排行榜应报错（反例）', () => {
    const svc = makeService()
    assert.throws(
      () => svc.getRankings('nonexistent-tournament', TENANT),
      /Tournament not found/,
    )
  })
})

// ════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏运营视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Guide} tournament 门店测试`, () => {
  it('导玩员可录入比赛结果（正例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, { type: TournamentType.RoundRobin })
    svc.registerParticipant(t.id, 'player-a', TENANT)
    svc.registerParticipant(t.id, 'player-b', TENANT)

    const matches = svc.generateBracket(t.id, TENANT)
    const result = svc.recordMatchResult(matches[0].id, 3, 1, TENANT)

    assert.equal(result.status, MatchStatus.Completed)
    assert.equal(result.winnerId, matches[0].player1Id)
  })

  it('导玩员不可录入已完成的比赛结果（反例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, { maxParticipants: 2 })
    svc.registerParticipant(t.id, 'pA', TENANT)
    svc.registerParticipant(t.id, 'pB', TENANT)

    const [match] = svc.generateBracket(t.id, TENANT)
    svc.recordMatchResult(match.id, 2, 0, TENANT)

    assert.throws(
      () => svc.recordMatchResult(match.id, 2, 1, TENANT),
      /already completed/,
    )
  })

  it('导玩员可开始赛事回合（生成对阵表）（正例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, { type: TournamentType.SingleElimination })
    for (let i = 1; i <= 4; i++) {
      svc.registerParticipant(t.id, `participant-${i}`, TENANT)
    }

    const matches = svc.generateBracket(t.id, TENANT)
    assert.ok(matches.length >= 2) // 4人单败淘汰 → ≥2场(可能有轮空)

    const updated = svc.getTournament(t.id, TENANT)
    assert.equal(updated!.status, TournamentStatus.Ongoing)
  })

  it('导玩员可查看参赛者列表（正例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc)
    svc.registerParticipant(t.id, 'member-g1', TENANT)
    svc.registerParticipant(t.id, 'member-g2', TENANT)

    const matches = svc.generateBracket(t.id, TENANT)
    assert.ok(matches.length >= 1)
    // 确认参赛者信息在返回中
    const participantIds = matches.flatMap((m) => [m.player1Id, m.player2Id].filter(Boolean))
    assert.ok(participantIds.includes('member-g1'))
  })
})

// ════════════════════════════════════════════════════════
// 👔店长 — 门店管理视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} tournament 门店测试`, () => {
  it('店长可创建带奖品的赛事（正例）', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT,
      storeId: 'store-001',
      name: '月度冠军赛',
      type: TournamentType.SingleElimination,
      gameName: '拳皇15',
      startDate: '2026-08-01',
      endDate: '2026-08-07',
      maxParticipants: 32,
      description: '月度排名赛',
      prizes: {
        first: { label: '冠军', value: '2000元游戏币' },
        second: { label: '亚军', value: '1000元游戏币' },
        third: { label: '季军', value: '500元游戏币' },
      },
    })

    assert.equal(t.name, '月度冠军赛')
    assert.equal(t.status, TournamentStatus.Draft)
    assert.ok(t.prizes.first)
    assert.ok(t.prizes.second)
    assert.ok(t.prizes.third)
  })

  it('店长不可将赛事直接从草稿设为已完成（反例/状态边界）', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT,
      name: '测试状态流转',
      type: TournamentType.RoundRobin,
      gameName: '游戏',
      startDate: '2026-08-01',
      endDate: '2026-08-07',
      maxParticipants: 8,
    })

    assert.throws(
      () => svc.updateTournamentStatus(t.id, TournamentStatus.Completed, TENANT),
      /Invalid tournament status transition/,
    )
  })

  it('店长可查看本门店赛事分析统计（正例）', () => {
    const svc = makeService()
    svc.resetTournamentStoresForTests()
    createAndOpenTournament(svc, { name: '2026年8月赛', storeId: 'store-001' })
    createAndOpenTournament(svc, { name: '2026年9月赛', storeId: 'store-001' })

    const list = svc.listTournaments(TENANT, { storeId: 'store-001' })
    assert.equal(list.length, 2)
  })

  it('店长可更新赛事奖品信息（正例）', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT,
      storeId: 'store-001',
      name: '更新奖品测试',
      type: TournamentType.SingleElimination,
      gameName: '街霸6',
      startDate: '2026-08-01',
      endDate: '2026-08-07',
      maxParticipants: 16,
      prizes: { first: { label: '冠军', value: '1000元' } },
    })

    const updated = svc.updateTournament(t.id, TENANT, {
      prizes: {
        first: { label: '冠军', value: '3000元' },
        second: { label: '亚军', value: '1500元' },
      },
    })
    assert.equal(updated.prizes.first!.value, '3000元')
  })
})

// ════════════════════════════════════════════════════════
// 📢营销 — 推广运营视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} tournament 门店测试`, () => {
  it('营销可创建带推广素材的赛事（正例）', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT,
      storeId: 'store-001',
      name: '暑期狂欢赛',
      type: TournamentType.League,
      gameName: '原神',
      startDate: '2026-07-20',
      endDate: '2026-08-20',
      maxParticipants: 64,
      description: '暑期特别企划，参加即送限定周边',
      bannerImage: 'https://cdn.example.com/summer-banner.png',
      prizes: {
        first: { label: '冠军', value: '限定手办+2000元券' },
        participation: { label: '参与奖', value: '50元券' },
      },
    })

    assert.equal(t.name, '暑期狂欢赛')
    assert.equal(t.bannerImage, 'https://cdn.example.com/summer-banner.png')
    assert.ok(t.description?.includes('暑期'))
    assert.ok(Object.keys(t.prizes).length >= 2)
  })

  it('营销可发布赛事通知（通过状态变更触发推广）（正例）', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT,
      storeId: 'store-001',
      name: '新品发布会赛',
      type: TournamentType.SingleElimination,
      gameName: '铁拳8',
      startDate: '2026-08-10',
      endDate: '2026-08-15',
      maxParticipants: 16,
    })

    // 发布=从草稿到开放，触发推广通知
    const opened = svc.updateTournamentStatus(t.id, TournamentStatus.Open, TENANT)
    assert.equal(opened.status, TournamentStatus.Open)
  })

  it('营销可查看赛事参与度分析（正例）', () => {
    const svc = makeService()
    const t = createAndOpenTournament(svc, { name: '推广统计赛', type: TournamentType.RoundRobin })
    svc.registerParticipant(t.id, 'mkt-p1', TENANT)
    svc.registerParticipant(t.id, 'mkt-p2', TENANT)
    svc.registerParticipant(t.id, 'mkt-p3', TENANT)
    svc.registerParticipant(t.id, 'mkt-p4', TENANT)

    const matches = svc.generateBracket(t.id, TENANT)
    for (const m of matches) {
      if (m.player2Id) {
        svc.recordMatchResult(m.id, 2, 1, TENANT)
      }
    }

    const rankings = svc.getRankings(t.id, TENANT)
    // 验证所有参赛者的详细信息可用于推广内容制作
    assert.equal(rankings.length, 4)
    for (const r of rankings) {
      assert.ok(typeof r.points === 'number')
      assert.ok(typeof r.wins === 'number')
    }
  })

  it('营销不可操作其他租户的赛事（反例/权限边界）', () => {
    const svc = makeService()
    const t = svc.createTournament({
      tenantId: TENANT,
      name: '本店赛事',
      type: TournamentType.SingleElimination,
      gameName: '游戏',
      startDate: '2026-08-01',
      endDate: '2026-08-07',
      maxParticipants: 8,
    })

    assert.throws(
      () => svc.updateTournamentStatus(t.id, TournamentStatus.Open, 'other-tenant'),
      /Tournament not found/,
    )
  })
})
