import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * champion.service.continuing.test.ts — ChampionService 持续测试 (树哥B-圈梁五道箍)
 *
 * 覆盖补充场景 (15+):
 * - contribution 幂等性：相同 refId 更新而非新增
 * - 更新后 totalScore 重新计算
 * - 空排行榜排序正确性
 * - 长时间跨度 timeline 排序
 * - knowledge map 部分角色无贡献
 * - 多次 resetForTests 清空
 * - 大量随机 kind 贡献聚合 byKind 计数
 * - contribution 缺失 occurredAt 自动填充
 * - 0 贡献 champion 的 ranking entry 数值检查
 * - 更新 contribution 的 description
 * - 重复注册同 id（非幂等，各自不同 auto-id）
 * - 注册后立即查询各项字段完整性
 * - 空排行榜
 * - 决策时间线多用户混合过滤
 * - 并行注册大量 champion
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ChampionService, type ChampionRole } from './champion.service'
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
// 树哥B — ChampionService 持续测试
// ═══════════════════════════════════════════════════════════════

describe('ChampionService — 持续测试 [树哥B-圈梁五道箍]', () => {
  // ── Contribution 幂等性 ────────────────────────────────────

  it('[C01] 相同 refId 更新已有贡献而非新增', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'Updater', role: 'CHAMPION' as ChampionRole })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'same-ref', description: 'v1' })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'same-ref', description: 'v2' })
    const updated = svc.getChampion(c.id)!
    assert.equal(updated.contributions.length, 1, 'should not add new entry')
    assert.equal(updated.contributions[0]!.kind, ContributionKind.Review, 'gets updated to review')
    assert.equal(updated.contributions[0]!.description, 'v2')
  })

  it('[C02] 更新 contribution 后 totalScore 重新计算', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'ScoreUpdate', role: 'CHAMPION' as ChampionRole })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'x1' })   // 2pts
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'x1' })       // 8pts
    assert.equal(svc.getChampion(c.id)!.totalScore, 8, 'score should be 8, not 10')
  })

  // ── 空数组 / 边界 ──────────────────────────────────────────

  it('[C03] 空排行榜返回 []', () => {
    const svc = makeService()
    assert.deepEqual(svc.getRanking(), [])
  })

  it('[C04] 0 贡献 champion 的 ranking entry 各计数为 0', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'Zero', role: 'CHAMPION' as ChampionRole })
    const ranking = svc.getRanking()
    assert.equal(ranking.length, 1)
    assert.equal(ranking[0]!.totalScore, 0)
    assert.equal(ranking[0]!.commits, 0)
    assert.equal(ranking[0]!.reviews, 0)
    assert.equal(ranking[0]!.rfcs, 0)
  })

  // ── 时间线 ──────────────────────────────────────────────────

  it('[C05] 决策时间线多 champion 混合过滤', () => {
    const svc = makeService()
    const { a, b } = seedSimple(svc)
    svc.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'a-c1', occurredAt: '2026-05-01T00:00:00Z' })
    svc.recordContribution({ championId: b.id, kind: ContributionKind.Review, refId: 'b-r1', occurredAt: '2026-05-02T00:00:00Z' })
    svc.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'a-dr1', occurredAt: '2026-05-03T00:00:00Z' })
    const tl = svc.getDecisionTimeline({ championId: a.id })
    assert.equal(tl.length, 2)
    assert.ok(tl.every(e => e.championId === a.id))
  })

  it('[C06] 长时间跨度 timeline 保持正确倒序', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'Long', role: 'CHAMPION' as ChampionRole })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'c1', occurredAt: '2025-01-01T00:00:00Z' })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r1', occurredAt: '2026-06-01T00:00:00Z' })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Rfc, refId: 'dr1', occurredAt: '2025-06-01T00:00:00Z' })
    const tl = svc.getDecisionTimeline()
    assert.equal(tl.length, 3)
    assert.equal(tl[0]!.refId, 'r1')
    assert.equal(tl[1]!.refId, 'dr1')
    assert.equal(tl[2]!.refId, 'c1')
  })

  // ── Knowledge Map ────────────────────────────────────────────

  it('[C07] KnowledgeMap — 部分角色无 champion 时 byRole 为 0', () => {
    const svc = makeService()
    svc.registerChampion({ name: 'OnlyChamp', role: 'CHAMPION' as ChampionRole })
    const km = svc.getKnowledgeMap()
    assert.equal(km.byRole.APPROVER, 0)
    assert.equal(km.byRole.OBSERVER, 0)
    assert.equal(km.byRole.CHAMPION, 1)
  })

  it('[C08] KnowledgeMap — 大量多 kind 贡献聚合计数准确', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'BigMap', role: 'CHAMPION' as ChampionRole })
    const refs = { COMMIT: 0, REVIEW: 0, RFC: 0, PULSE_REVIEW: 0, RETRO: 0 }
    const kinds = Object.values(ContributionKind)
    for (let i = 0; i < 50; i++) {
      const kind = kinds[i % kinds.length]
      svc.recordContribution({ championId: c.id, kind, refId: `big-${i}` })
      refs[kind]++
    }
    const km = svc.getKnowledgeMap()
    assert.equal(km.totalContributions, 50)
    assert.equal(km.byKind.COMMIT, refs.COMMIT)
    assert.equal(km.byKind.REVIEW, refs.REVIEW)
    assert.equal(km.byKind.RFC, refs.RFC)
    assert.equal(km.byKind.PULSE_REVIEW, refs.PULSE_REVIEW)
    assert.equal(km.byKind.RETRO, refs.RETRO)
  })

  // ── resetForTests ────────────────────────────────────────────

  it('[C09] 多次 resetForTests 不会出错', () => {
    const svc = makeService()
    seedSimple(svc)
    svc.resetForTests()
    svc.resetForTests()
    assert.equal(svc.listChampions().length, 0)
  })

  it('[C10] resetForTests 后注册新 champion 正常', () => {
    const svc = makeService()
    seedSimple(svc)
    svc.resetForTests()
    const c = svc.registerChampion({ name: 'Fresh', role: 'CHAMPION' as ChampionRole })
    assert.equal(c.name, 'Fresh')
    assert.equal(svc.listChampions().length, 1)
  })

  // ── occurredAt 自动填充 ──────────────────────────────────────

  it('[C11] contribution 缺失 occurredAt 自动填充不为空', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'AutoTime', role: 'CHAMPION' as ChampionRole })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'no-time' })
    const updated = svc.getChampion(c.id)!
    assert.ok(updated.contributions[0]!.occurredAt)
    assert.equal(typeof updated.contributions[0]!.occurredAt, 'string')
  })

  // ── 字段完整性 ──────────────────────────────────────────────

  it('[C12] 注册后立即查询应包含完整字段', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'Complete', role: 'APPROVER' as ChampionRole })
    assert.ok(c.id)
    assert.ok(c.id.startsWith('champion-'))
    assert.equal(c.name, 'Complete')
    assert.equal(c.role, 'APPROVER')
    assert.equal(c.totalScore, 0)
    assert.deepEqual(c.contributions, [])
    assert.ok(c.joinedAt)
  })

  // ── 重复 id 注册 ─────────────────────────────────────────────

  it('[C13] 不传 id 时每次注册生成不同 auto-id', () => {
    const svc = makeService()
    const c1 = svc.registerChampion({ name: 'A', role: 'CHAMPION' as ChampionRole })
    const c2 = svc.registerChampion({ name: 'B', role: 'CHAMPION' as ChampionRole })
    assert.notEqual(c1.id, c2.id)
  })

  it('[C14] 显式传相同 id 会覆盖已有 champion', () => {
    const svc = makeService()
    svc.registerChampion({ id: 'dup', name: 'First', role: 'CHAMPION' as ChampionRole })
    svc.registerChampion({ id: 'dup', name: 'Second', role: 'APPROVER' as ChampionRole })
    const found = svc.getChampion('dup')!
    assert.equal(found.name, 'Second')
    assert.equal(found.role, 'APPROVER')
  })

  // ── description 更新 ─────────────────────────────────────────

  it('[C15] 更新 contribution 时 description 仅在提供时改变', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'DescTest', role: 'CHAMPION' as ChampionRole })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'r1', description: 'initial' })
    // 更新但不传 description
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r1' })
    const updated = svc.getChampion(c.id)!
    assert.equal(updated.contributions[0]!.description, 'initial', 'description should remain unchanged')
  })

  it('[C16] 更新 contribution 时传 description 会替换', () => {
    const svc = makeService()
    const c = svc.registerChampion({ name: 'DescReplace', role: 'CHAMPION' as ChampionRole })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Commit, refId: 'r1', description: 'old' })
    svc.recordContribution({ championId: c.id, kind: ContributionKind.Review, refId: 'r1', description: 'new' })
    assert.equal(svc.getChampion(c.id)!.contributions[0]!.description, 'new')
  })

  // ── 大规模注册 ──────────────────────────────────────────────

  it('[C17] 并行注册 500 个 champion 不崩溃', () => {
    const svc = makeService()
    for (let i = 0; i < 500; i++) {
      svc.registerChampion({ name: `Bulk-${i}`, role: 'OBSERVER' as ChampionRole })
    }
    assert.equal(svc.listChampions().length, 500)
  })
})
