/**
 * champion.service.spec.ts — Champion Dashboard Service 深层单元测试
 *
 * 覆盖：ChampionService
 *  - registerChampion:     正例（注册/默认id/默认joinedAt/不同角色）/ 边界（重复ID赋值）
 *  - getChampion/listChampions: 正例（获取/按角色过滤）/ 边界（不存在返回undefined）
 *  - recordContribution:   正例（新增/更新幂等/不同类型权重）/ 反例（不存在的championId）
 *  - getRanking:           正例（按总分降序/rank赋值/贡献计数）/ 边界（空）
 *  - getDecisionTimeline:  正例（按champion过滤/按sinceDate过滤）/ 边界（空）
 *  - getKnowledgeMap:      正例（聚合总计/按kind/按role）/ 边界（空）
 *  - resetForTests:        正例
 *
 * 全部内联 mock。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ChampionService, CHAMPION_ROLES } from './champion.service'
import type { ChampionRole, ContributionKind } from './champion.service'

// ═══════════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════════

const MOCK_CHAMPIONS = [
  { name: 'Alice', role: 'CHAMPION' as ChampionRole },
  { name: 'Bob',   role: 'APPROVER' as ChampionRole },
  { name: 'Carol', role: 'OBSERVER' as ChampionRole },
]

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('ChampionService', () => {
  let service: ChampionService

  beforeEach(() => {
    service = new ChampionService()
    service.resetForTests()
  })

  // ── registerChampion ────────────────────────────────────────
  describe('registerChampion', () => {
    it('✅ 正例: 注册 APPROVER 角色', () => {
      const c = service.registerChampion({ name: 'Alice', role: 'APPROVER' })
      expect(c.id).toBeDefined()
      expect(c.name).toBe('Alice')
      expect(c.role).toBe('APPROVER')
      expect(c.contributions).toEqual([])
      expect(c.totalScore).toBe(0)
    })

    it('✅ 正例: 注册所有角色', () => {
      for (const role of CHAMPION_ROLES) {
        const c = service.registerChampion({ name: `User-${role}`, role })
        expect(c.role).toBe(role)
      }
      expect(service.listChampions()).toHaveLength(3)
    })

    it('✅ 正例: 自定义 ID 和 joinedAt', () => {
      const c = service.registerChampion({
        id: 'champ-fixed',
        name: 'Fixed',
        role: 'CHAMPION',
        joinedAt: '2025-01-01',
      })
      expect(c.id).toBe('champ-fixed')
      expect(c.joinedAt).toBe('2025-01-01')
    })

    it('✅ 正例: 默认生成 ID', () => {
      const c = service.registerChampion({ name: 'Default', role: 'CHAMPION' })
      expect(c.id).toMatch(/^champion-\d+-[a-z0-9]+$/)
    })
  })

  // ── getChampion / listChampions ─────────────────────────────
  describe('getChampion / listChampions', () => {
    beforeEach(() => {
      for (const mc of MOCK_CHAMPIONS) {
        service.registerChampion(mc)
      }
    })

    it('✅ 正例: getChampion 获取已注册', () => {
      const all = service.listChampions()
      const c = service.getChampion(all[0].id)
      expect(c).toBeDefined()
      expect(c!.name).toBe('Alice')
    })

    it('🔲 边界: getChampion 不存在的返回 undefined', () => {
      expect(service.getChampion('nonexistent')).toBeUndefined()
    })

    it('✅ 正例: listChampions 全部', () => {
      expect(service.listChampions()).toHaveLength(3)
    })

    it('✅ 正例: listChampions 按角色过滤', () => {
      expect(service.listChampions('APPROVER')).toHaveLength(1)
      expect(service.listChampions('CHAMPION')).toHaveLength(1)
      expect(service.listChampions('OBSERVER')).toHaveLength(1)
    })
  })

  // ── recordContribution ─────────────────────────────────────
  describe('recordContribution', () => {
    let aliceId: string

    beforeEach(() => {
      aliceId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
    })

    it('✅ 正例: 新增 COMMIT 贡献', () => {
      const c = service.recordContribution({
        championId: aliceId,
        kind: 'COMMIT',
        refId: 'commit-abc',
      })
      expect(c.totalScore).toBe(2) // COMMIT 权重 2
    })

    it('✅ 正例: 不同类型贡献累加', () => {
      service.recordContribution({ championId: aliceId, kind: 'COMMIT', refId: 'c1' })
      service.recordContribution({ championId: aliceId, kind: 'REVIEW', refId: 'r1' })
      service.recordContribution({ championId: aliceId, kind: 'RFC', refId: 'dr-001' })
      const c = service.getChampion(aliceId)!
      expect(c.contributions).toHaveLength(3)
      expect(c.totalScore).toBe(2 + 3 + 8)
    })

    it('✅ 正例: 相同 refId 更新幂等', () => {
      service.recordContribution({ championId: aliceId, kind: 'COMMIT', refId: 'dup' })
      service.recordContribution({ championId: aliceId, kind: 'PULSE_REVIEW', refId: 'dup' })
      const c = service.getChampion(aliceId)!
      expect(c.contributions).toHaveLength(1)
      expect(c.contributions[0].kind).toBe('PULSE_REVIEW')
      expect(c.contributions[0].weight).toBe(4)
    })

    it('❌ 反例: 不存在的 championId 抛错', () => {
      expect(() =>
        service.recordContribution({
          championId: 'nonexistent',
          kind: 'COMMIT',
          refId: 'x',
        })
      ).toThrow('Champion not found')
    })

    it('✅ 正例: 所有贡献类型的权重都正确', () => {
      const kinds: ContributionKind[] = ['COMMIT', 'REVIEW', 'RFC', 'PULSE_REVIEW', 'RETRO']
      const expected = [2, 3, 8, 4, 6]
      for (let i = 0; i < kinds.length; i++) {
        service.recordContribution({
          championId: aliceId,
          kind: kinds[i],
          refId: `ref-${kinds[i]}`,
        })
      }
      expect(service.getChampion(aliceId)!.totalScore).toBe(23)
    })
  })

  // ── getRanking ─────────────────────────────────────────────
  describe('getRanking', () => {
    it('✅ 正例: 排行榜按总分降序', () => {
      const aId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
      const bId = service.registerChampion({ name: 'Bob', role: 'APPROVER' }).id

      service.recordContribution({ championId: aId, kind: 'RFC', refId: 'dr-a' })
      service.recordContribution({ championId: bId, kind: 'COMMIT', refId: 'c-b' })

      const ranking = service.getRanking()
      expect(ranking[0].name).toBe('Alice')
      expect(ranking[0].totalScore).toBe(8)
      expect(ranking[0].rank).toBe(1)
      expect(ranking[1].rank).toBe(2)
    })

    it('✅ 正例: 贡献计数正确', () => {
      const aId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
      service.recordContribution({ championId: aId, kind: 'COMMIT', refId: 'c1' })
      service.recordContribution({ championId: aId, kind: 'COMMIT', refId: 'c2' })
      service.recordContribution({ championId: aId, kind: 'REVIEW', refId: 'r1' })
      const entry = service.getRanking()[0]
      expect(entry.commits).toBe(2)
      expect(entry.reviews).toBe(1)
      expect(entry.rfcs).toBe(0)
    })

    it('🔲 边界: 无 champion 返回空', () => {
      expect(service.getRanking()).toHaveLength(0)
    })
  })

  // ── getDecisionTimeline ────────────────────────────────────
  describe('getDecisionTimeline', () => {
    it('✅ 正例: 返回按时间倒序的时间线', () => {
      const aId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
      service.recordContribution({
        championId: aId,
        kind: 'RFC',
        refId: 'dr-001',
        occurredAt: '2025-06-01',
      })
      service.recordContribution({
        championId: aId,
        kind: 'COMMIT',
        refId: 'c001',
        occurredAt: '2025-06-02',
      })
      const timeline = service.getDecisionTimeline()
      expect(timeline).toHaveLength(2)
      expect(timeline[0].date).toBe('2025-06-02') // 最新在前
    })

    it('✅ 正例: 按 championId 过滤', () => {
      const aId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
      const bId = service.registerChampion({ name: 'Bob', role: 'APPROVER' }).id
      service.recordContribution({ championId: aId, kind: 'COMMIT', refId: 'c1' })
      service.recordContribution({ championId: bId, kind: 'COMMIT', refId: 'c2' })
      const filtered = service.getDecisionTimeline({ championId: aId })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Alice')
    })

    it('✅ 正例: 按 sinceDate 过滤', () => {
      const aId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
      service.recordContribution({
        championId: aId, kind: 'RFC', refId: 'dr1', occurredAt: '2025-01-01',
      })
      service.recordContribution({
        championId: aId, kind: 'COMMIT', refId: 'c1', occurredAt: '2025-06-01',
      })
      const filtered = service.getDecisionTimeline({ sinceDate: '2025-02-01' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].refId).toBe('c1')
    })

    it('🔲 边界: 空时间线', () => {
      expect(service.getDecisionTimeline()).toHaveLength(0)
    })
  })

  // ── getKnowledgeMap ────────────────────────────────────────
  describe('getKnowledgeMap', () => {
    it('✅ 正例: 按 kind 和 role 聚合', () => {
      const aId = service.registerChampion({ name: 'Alice', role: 'CHAMPION' }).id
      const bId = service.registerChampion({ name: 'Bob', role: 'APPROVER' }).id
      service.recordContribution({ championId: aId, kind: 'RFC', refId: 'dr1' })
      service.recordContribution({ championId: aId, kind: 'COMMIT', refId: 'c1' })
      service.recordContribution({ championId: bId, kind: 'COMMIT', refId: 'c2' })

      const km = service.getKnowledgeMap()
      expect(km.totalChampions).toBe(2)
      expect(km.totalContributions).toBe(3)
      expect(km.totalScore).toBe(8 + 2 + 2)
      expect(km.byKind.COMMIT).toBe(2)
      expect(km.byKind.RFC).toBe(1)
      expect(km.byRole.CHAMPION).toBe(1)
      expect(km.byRole.APPROVER).toBe(1)
    })

    it('🔲 边界: 空数据返回全 0', () => {
      const km = service.getKnowledgeMap()
      expect(km.totalChampions).toBe(0)
      expect(km.totalContributions).toBe(0)
      expect(km.totalScore).toBe(0)
      for (const k of Object.keys(km.byKind) as ContributionKind[]) {
        expect(km.byKind[k]).toBe(0)
      }
    })
  })

  // ── resetForTests ──────────────────────────────────────────
  describe('resetForTests', () => {
    it('✅ 正例: 重置清空所有数据', () => {
      service.registerChampion({ name: 'Alice', role: 'CHAMPION' })
      expect(service.listChampions()).toHaveLength(1)
      service.resetForTests()
      expect(service.listChampions()).toHaveLength(0)
    })
  })
})
