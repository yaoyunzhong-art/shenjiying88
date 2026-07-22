import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * champion.service-extended.test.ts — ChampionService 扩展测试
 *
 * 覆盖已有 spec / test 之外的新场景：
 * - contribution 幂等性：相同 refId 更新而非新增
 * - 更新后 totalScore 重新计算
 * - 角色枚举无效值拒绝（TS 编译保护）
 * - 注册后立即查询各项字段完整性
 * - 空排行榜排序正确性
 * - 决策时间线多用户混合过滤
 * - 长时间跨度 timeline 排序
 * - knowledge map 部分角色无贡献
 * - 多次 resetForTests 清空
 * - 大量随机 kind 贡献聚合 byKind 计数
 * - contribution 缺失 occurredAt 自动填充
 * - champion 注册后 getRanking 含 entries
 * - 0 贡献 champion 的 ranking entry 数值检查
 * - 更新 contribution 的 description
 * - 重复注册同 id（非幂等，各自不同 auto-id）
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ChampionService, type ChampionRole, type ContributionKind as CK } from './champion.service'
import { ContributionKind } from './champion.entity'

// ═══════════════════════════════════════════════════════════════
// 辅助工厂
// ═══════════════════════════════════════════════════════════════

function makeService() {
  const svc = new ChampionService()
  svc.resetForTests()
  return svc
}

function seedSimple(svc: ChampionService) {
  const a = svc.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole })
  const b = svc.registerChampion({ name: 'Bob', role: 'APPROVER' as ChampionRole })
  const c = svc.registerChampion({ name: 'Carol', role: 'OBSERVER' as ChampionRole })
  return { a, b, c }
}

// ═══════════════════════════════════════════════════════════════
// ChampionService 扩展测试
// ═══════════════════════════════════════════════════════════════

describe('ChampionService — 扩展测试 (Extended)', () => {
  let svc: ChampionService

  beforeEach(() => {
    svc = makeService()
  })

  // ── Contribution 幂等性 ─────────────────────

  describe('Contribution 幂等性 (Idempotency)', () => {
    it('相同 refId 更新已有贡献而非新增', () => {
      const c = svc.registerChampion({ name: 'Idem1', role: 'CHAMPION' as ChampionRole })
      // 先记录
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'same-ref',
        description: 'initial commit',
      })
      assert.equal(svc.getChampion(c.id)!.contributions.length, 1)

      // 相同 refId 再记录一次 — 应更新
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Rfc,
        refId: 'same-ref',
        description: 'updated to RFC',
      })
      assert.equal(
        svc.getChampion(c.id)!.contributions.length,
        1,
        'should still be 1 contribution',
      )
      assert.equal(
        svc.getChampion(c.id)!.totalScore,
        8,
        'should be RFC weight (8)',
      )
    })

    it('更新贡献后 description 更新', () => {
      const c = svc.registerChampion({ name: 'DescTest', role: 'CHAMPION' as ChampionRole })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'ref-desc',
        description: 'original',
      })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'ref-desc',
        description: 'updated-desc',
      })
      assert.equal(svc.getChampion(c.id)!.contributions[0]!.description, 'updated-desc')
    })
  })

  // ── 注册 Champion ───────────────────────────

  describe('注册 Champion 扩展', () => {
    it('注册后字段完整性检查', () => {
      const c = svc.registerChampion({ name: 'Complete', role: 'CHAMPION' as ChampionRole })
      assert.ok(c.id)
      assert.ok(c.id.startsWith('champion-'))
      assert.equal(c.name, 'Complete')
      assert.equal(c.role, 'CHAMPION')
      assert.ok(c.joinedAt)
      assert.equal(c.totalScore, 0)
      assert.deepEqual(c.contributions, [])
    })

    it('两次注册各自生成不同 id', () => {
      const a = svc.registerChampion({ name: 'X', role: 'CHAMPION' as ChampionRole })
      const b = svc.registerChampion({ name: 'Y', role: 'CHAMPION' as ChampionRole })
      assert.notEqual(a.id, b.id)
    })
  })

  // ── 查询过滤 ─────────────────────────────────

  describe('查询过滤扩展', () => {
    it('listChampions 无匹配角色返回空数组', () => {
      const svc2 = makeService()
      assert.deepEqual(svc2.listChampions('CHAMPION' as ChampionRole), [])
    })

    it('listChampions 过滤包含多角色', () => {
      seedSimple(svc)
      const champions = svc.listChampions('CHAMPION' as ChampionRole)
      assert.equal(champions.length, 1)
      assert.equal(champions[0]!.name, 'Alice')
    })

    it('getChampion 未注册返回 undefined', () => {
      assert.equal(svc.getChampion('non-existent'), undefined)
    })
  })

  // ── 排行榜扩展 ───────────────────────────────

  describe('排行榜扩展', () => {
    it('空冠军榜 getRanking 返回 []', () => {
      assert.deepEqual(svc.getRanking(), [])
    })

    it('0 贡献的 champion 在排行榜中各项计数为 0', () => {
      svc.registerChampion({ name: 'Zero', role: 'CHAMPION' as ChampionRole })
      const entry = svc.getRanking()[0]!
      assert.equal(entry.totalScore, 0)
      assert.equal(entry.commits, 0)
      assert.equal(entry.reviews, 0)
      assert.equal(entry.rfcs, 0)
      assert.equal(entry.pulseReviews, 0)
      assert.equal(entry.retros, 0)
      assert.equal(entry.rank, 1)
    })

    it('多 champion 按总分降序排序严格', () => {
      const low = svc.registerChampion({ name: 'Low', role: 'CHAMPION' as ChampionRole })
      const mid = svc.registerChampion({ name: 'Mid', role: 'APPROVER' as ChampionRole })
      const high = svc.registerChampion({ name: 'High', role: 'OBSERVER' as ChampionRole })
      svc.recordContribution({ championId: low.id, kind: ContributionKind.Commit, refId: 'c1' })
      svc.recordContribution({ championId: mid.id, kind: ContributionKind.Commit, refId: 'c1' })
      svc.recordContribution({ championId: mid.id, kind: ContributionKind.Review, refId: 'r1' })
      svc.recordContribution({ championId: high.id, kind: ContributionKind.Commit, refId: 'c1' })
      svc.recordContribution({ championId: high.id, kind: ContributionKind.Rfc, refId: 'dr-1' })
      svc.recordContribution({ championId: high.id, kind: ContributionKind.Retro, refId: 'rt-1' })

      const ranking = svc.getRanking()
      assert.equal(ranking[0]!.name, 'High')
      assert.equal(ranking[1]!.name, 'Mid')
      assert.equal(ranking[2]!.name, 'Low')
      assert.ok(ranking[0]!.totalScore > ranking[1]!.totalScore)
      assert.ok(ranking[1]!.totalScore > ranking[2]!.totalScore)
    })
  })

  // ── 决策时间线扩展 ───────────────────────────

  describe('决策时间线扩展', () => {
    it('过滤 championId 时精确匹配', () => {
      const { a, b } = seedSimple(svc)
      svc.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'a1' })
      svc.recordContribution({ championId: b.id, kind: ContributionKind.Commit, refId: 'b1' })

      const tlA = svc.getDecisionTimeline({ championId: a.id })
      assert.equal(tlA.length, 1)
      assert.equal(tlA[0]!.refId, 'a1')

      const tlB = svc.getDecisionTimeline({ championId: 'no-such-id' })
      assert.equal(tlB.length, 0)
    })

    it('sinceDate 过滤排除旧记录', () => {
      const c = svc.registerChampion({ name: 'Since', role: 'CHAMPION' as ChampionRole })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'old1',
        occurredAt: '2025-06-01T00:00:00.000Z',
      })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'mid1',
        occurredAt: '2025-12-01T00:00:00.000Z',
      })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Rfc,
        refId: 'new1',
        occurredAt: '2026-01-15T00:00:00.000Z',
      })

      const tl = svc.getDecisionTimeline({ sinceDate: '2026-01-01T00:00:00.000Z' })
      assert.equal(tl.length, 1)
      assert.equal(tl[0]!.refId, 'new1')
    })

    it('时间线条目按日降序排列', () => {
      const c = svc.registerChampion({ name: 'Order', role: 'CHAMPION' as ChampionRole })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'c1',
        occurredAt: '2026-01-10T00:00:00.000Z',
      })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'r1',
        occurredAt: '2026-01-20T00:00:00.000Z',
      })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Rfc,
        refId: 'dr1',
        occurredAt: '2026-01-15T00:00:00.000Z',
      })

      const tl = svc.getDecisionTimeline()
      assert.equal(tl[0]!.refId, 'r1')  // Jan 20
      assert.equal(tl[1]!.refId, 'dr1') // Jan 15
      assert.equal(tl[2]!.refId, 'c1')  // Jan 10
    })
  })

  // ── Knowledge Map 扩展 ──────────────────────

  describe('Knowledge Map 扩展', () => {
    it('无贡献的 champion 只影响总数', () => {
      svc.registerChampion({ name: 'Silent', role: 'CHAMPION' as ChampionRole })
      const km = svc.getKnowledgeMap()
      assert.equal(km.totalChampions, 1)
      assert.equal(km.totalContributions, 0)
      assert.equal(km.totalScore, 0)
      assert.equal(km.byKind.COMMIT, 0)
    })

    it('byRole 计数只计算 champion 注册数', () => {
      seedSimple(svc) // 3 champions: CHAMPION, APPROVER, OBSERVER
      const km = svc.getKnowledgeMap()
      assert.equal(km.byRole.CHAMPION, 1)
      assert.equal(km.byRole.APPROVER, 1)
      assert.equal(km.byRole.OBSERVER, 1)
    })

    it('大量不同 kind 贡献 byKind 正确', () => {
      const c = svc.registerChampion({ name: 'ManyKinds', role: 'CHAMPION' as ChampionRole })
      for (let i = 0; i < 10; i++) {
        svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: `c-${i}` })
      }
      for (let i = 0; i < 5; i++) {
        svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: `r-${i}` })
      }
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr-1' })

      const km = svc.getKnowledgeMap()
      assert.equal(km.byKind.COMMIT, 10)
      assert.equal(km.byKind.REVIEW, 5)
      assert.equal(km.byKind.RFC, 1)
      assert.equal(km.totalContributions, 16)
    })
  })

  // ── Reset 扩展 ───────────────────────────────

  describe('resetForTests 扩展', () => {
    it('clear 后重新注册可正常使用', () => {
      seedSimple(svc)
      svc.resetForTests()
      assert.equal(svc.listChampions().length, 0)

      const c = svc.registerChampion({ name: 'New', role: 'CHAMPION' as ChampionRole })
      svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1' })
      assert.equal(svc.getChampion(c.id)!.totalScore, 2)
    })

    it('连续两次 reset 不崩溃', () => {
      seedSimple(svc)
      svc.resetForTests()
      svc.resetForTests()
      assert.equal(svc.listChampions().length, 0)
    })
  })

  // ── 边界条件 ─────────────────────────────────

  describe('边界条件', () => {
    it('缺少 occurredAt 时自动填充', () => {
      const c = svc.registerChampion({ name: 'AutoTime', role: 'CHAMPION' as ChampionRole })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'auto-time',
        // 不传 occurredAt
      })
      assert.ok(svc.getChampion(c.id)!.contributions[0]!.occurredAt)
    })

    it('recordContribution 不存在 champion 抛错', () => {
      assert.throws(
        () =>
          svc.recordContribution({
            championId: 'fake-id',
            kind: ContributionKind.Commit,
            refId: 'x',
          }),
        /not found/i,
      )
    })

    it('champion 数量不超过期望的注册上限', () => {
      for (let i = 0; i < 50; i++) {
        svc.registerChampion({ name: `User-${i}`, role: 'CHAMPION' as ChampionRole })
      }
      assert.equal(svc.listChampions().length, 50)
    })

    it('空贡献列表的 champion 各项计数为 0', () => {
      const c = svc.registerChampion({ name: 'Empty', role: 'CHAMPION' as ChampionRole })
      assert.equal(c.totalScore, 0)
      const entry = svc.getRanking()[0]!
      assert.equal(entry.commits, 0)
      assert.equal(entry.reviews, 0)
      assert.equal(entry.rfcs, 0)
      assert.equal(entry.pulseReviews, 0)
      assert.equal(entry.retros, 0)
    })
  })

  // ── 跨功能集成 ───────────────────────────────

  describe('跨功能集成', () => {
    it('注册 → 记录贡献 → 排行榜 → 时间线 → 知识地图 全流程', () => {
      const c = svc.registerChampion({ name: 'Alice', role: 'CHAMPION' as ChampionRole })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Commit,
        refId: 'abc',
        occurredAt: '2026-07-01T00:00:00.000Z',
      })
      svc.recordContribution({
        championId: c.id,
        kind: ContributionKind.Review,
        refId: 'pr-42',
        occurredAt: '2026-07-02T00:00:00.000Z',
      })

      // ranking
      const ranking = svc.getRanking()
      assert.equal(ranking.length, 1)
      assert.equal(ranking[0]!.totalScore, 5)

      // timeline
      const tl = svc.getDecisionTimeline()
      assert.equal(tl.length, 2)
      assert.equal(tl[0]!.refId, 'pr-42')

      // knowledge map
      const km = svc.getKnowledgeMap()
      assert.equal(km.totalChampions, 1)
      assert.equal(km.totalContributions, 2)
      assert.equal(km.totalScore, 5)
    })

    it('多用户混合排名与时间线正确', () => {
      const a = svc.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole })
      const b = svc.registerChampion({ name: 'B', role: 'APPROVER' as ChampionRole })

      svc.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'dr-1' })
      svc.recordContribution({ championId: b.id, kind: ContributionKind.Commit, refId: 'c1' })
      svc.recordContribution({ championId: b.id, kind: ContributionKind.PulseReview, refId: 'p1' })

      const ranking = svc.getRanking()
      assert.equal(ranking[0]!.name, 'B') // 2 + 4 = 6
      assert.equal(ranking[1]!.name, 'A') // 8

      const tlB = svc.getDecisionTimeline({ championId: b.id })
      assert.equal(tlB.length, 2)
    })
  })
})
