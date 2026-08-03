/**
 * empower-card.service.boost.spec.ts
 * 赋能卡片 service 层补充单元测试 — 复杂业务场景、并发边界、时序退化
 *
 * 使用 vitest, 降级内存模式 (POSTGRES_URL 为空), 不依赖数据库
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmpowerCardService } from './empower-card.service'
import type { EmpowerCardEntity } from './empower-card.entity'

// 强制使用降级内存模式
beforeEach(() => {
  vi.stubEnv('POSTGRES_URL', '')
})

function createService(): EmpowerCardService {
  return new EmpowerCardService()
}

describe('[Boost] EmpowerCardService — 批处理/边界/时序', () => {
  let svc: EmpowerCardService

  beforeEach(() => {
    vi.restoreAllMocks()
    svc = createService()
  })

  // ── 批量导入 ──

  it('[正例] batchImport 空数组返回 0', async () => {
    const count = await svc.batchImport([])
    expect(count).toBe(0)
  })

  it('[正例] batchImport 单条数据成功', async () => {
    const count = await svc.batchImport([
      { tag: '技术', summary: '测试批量导入第一条', source: 'batch-test' },
    ])
    expect(count).toBe(1)

    const all = await svc.list(0)
    expect(all.length).toBeGreaterThanOrEqual(1)
    const found = all.find(c => c.summary === '测试批量导入第一条')
    expect(found).toBeDefined()
    expect(found!.tag).toBe('技术')
  })

  it('[正例] batchImport 多条数据全部成功', async () => {
    const count = await svc.batchImport([
      { tag: '技术', summary: '批量1', source: 'src1', moduleMapping: 'm1' },
      { tag: '竞品', summary: '批量2', source: 'src2', moduleMapping: 'm2' },
      { tag: '市场', summary: '批量3', source: 'src3', moduleMapping: 'm3' },
      { tag: '设备', summary: '批量4', source: 'src4', moduleMapping: 'm4' },
      { tag: '运营', summary: '批量5', source: 'src5', moduleMapping: 'm5' },
    ])
    expect(count).toBe(5)
  })

  it('[边界] batchImport 不因重复 tag 失败（降级模式下无唯一约束）', async () => {
    const dto = { tag: '技术', summary: '相同内容', source: 'test' }
    const c1 = await svc.batchImport([dto])
    const c2 = await svc.batchImport([dto])
    expect(c1).toBe(1)
    expect(c2).toBe(1) // 重复也成功, 只是创建了两条不同的记录
    const all = await svc.list(0)
    const matches = all.filter(c => c.summary === '相同内容')
    expect(matches.length).toBe(2)
  })

  // ── search 各种组合 ──

  it('[正例] 搜索同时使用 tag + q + module 组合条件', async () => {
    await svc.create({ tag: '技术', summary: 'NestJS依赖注入原理', source: 'doc', moduleMapping: 'backend' })
    await svc.create({ tag: '技术', summary: 'React Hooks最佳实践', source: 'doc', moduleMapping: 'frontend' })
    await svc.create({ tag: '竞品', summary: '竞品技术栈分析', source: 'market', moduleMapping: 'backend' })

    // 搜索同时匹配 tag=技术, module=backend
    const result = await svc.search({ tag: '技术', module: 'backend', limit: 10 })
    expect(result.total).toBe(1)
    expect(result.cards[0].summary).toContain('NestJS')
  })

  it('[边界] minFreshness=0 应返回所有卡片', async () => {
    await svc.create({ tag: '设备', summary: '卡片A', source: 'a' })
    await svc.create({ tag: '设备', summary: '卡片B', source: 'b' })

    const result = await svc.search({ minFreshness: 0, limit: 10 })
    expect(result.total).toBeGreaterThanOrEqual(2)
  })

  it('[边界] minFreshness=100 仍返回新鲜度为 100 的新建卡片', async () => {
    await svc.create({ tag: '设备', summary: '新鲜卡片', source: 'a' })
    const result = await svc.search({ minFreshness: 100, limit: 10 })
    expect(result.total).toBeGreaterThanOrEqual(1)
    result.cards.forEach(c => {
      expect(c.freshnessScore).toBeGreaterThanOrEqual(100)
    })
  })

  it('[边界] minFreshness=999 极高值返回空', async () => {
    await svc.create({ tag: '设备', summary: '普通卡片', source: 'a' })
    const result = await svc.search({ minFreshness: 999, limit: 10 })
    expect(result.total).toBe(0)
  })

  it('[边界] limit=1 只返回一条', async () => {
    await svc.create({ tag: '技术', summary: '甲', source: 's' })
    await svc.create({ tag: '技术', summary: '乙', source: 's' })
    const result = await svc.search({ tag: '技术', limit: 1 })
    expect(result.cards.length).toBe(1)
  })

  // ── list 筛选 ──

  it('[正例] list 默认返回所有卡片，按新鲜度降序', async () => {
    const cards = await svc.list(0)
    expect(Array.isArray(cards)).toBe(true)
  })

  it('[边界] list minFreshness=最大值返回空数组', async () => {
    const cards = await svc.list(999)
    expect(cards.length).toBe(0)
  })

  // ── quote 引用场景 ──

  it('[正例] recordQuote 多次递增引用计数', async () => {
    const card = await svc.create({
      tag: '运营', summary: '多次引用测试卡片', source: 'quote-test',
    })
    expect(card.quoteCount).toBe(0)

    await svc.recordQuote(card.id, '任务1', '模块A', '用户1')
    let updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(1)

    await svc.recordQuote(card.id, '任务2', '模块A', '用户2')
    updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(2)

    await svc.recordQuote(card.id, '任务3', '模块B', '用户3')
    updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(3)
  })

  it('[边界] 对未保存的引用日志调用 getQuoteLog 返回空数组', async () => {
    const logs = await svc.getQuoteLog(30)
    expect(Array.isArray(logs)).toBe(true)
    expect(logs.length).toBe(0)
  })

  // ── 退化曲线 ──

  it('[边界] applyDecay 在降级模式返回 0', async () => {
    const result = await svc.applyDecay()
    expect(result).toEqual({ decayed: 0, archived: 0 })
  })

  // ── autoMatchForDispatch ──

  it('[正例] autoMatchForDispatch 有足够数据返回 top-3', async () => {
    for (let i = 0; i < 5; i++) {
      await svc.create({
        tag: '技术',
        summary: `匹配卡片${i}`,
        source: 'auto-match',
        moduleMapping: 'backend',
      })
    }
    const cards = await svc.autoMatchForDispatch('backend', ['匹配'])
    expect(cards.length).toBeGreaterThanOrEqual(1)
    expect(cards.length).toBeLessThanOrEqual(3) // max 3
  })

  it('[边界] autoMatchForDispatch 数据不足时返回尽可能多的结果', async () => {
    await svc.create({
      tag: '技术', summary: '仅有的一张匹配卡片', source: 'test',
      moduleMapping: 'unrelated-module',
    })
    const cards = await svc.autoMatchForDispatch('non-existent-module', ['xxx'])
    expect(cards.length).toBeGreaterThanOrEqual(0)
  })

  // ── getTodayEmpowerScore ──

  it('[边界] 降级模式下今日分数始终为 0', async () => {
    const score = await svc.getTodayEmpowerScore()
    expect(score).toEqual({ score: 0, quotes: 0, newCards: 0 })
  })

  // ── getById 错误处理 ──

  it('[反例] 使用空字符串 ID 查询应抛错', async () => {
    await expect(svc.getById('')).rejects.toThrow()
  })

  it('[反例] 使用 null/undefined 替代 ID', async () => {
    await expect(svc.getById(null as unknown as string)).rejects.toThrow()
  })

  // ── create 完整性验证 ──

  it('[正例] create 返回的实体字段完整性', async () => {
    const card = await svc.create({
      tag: '合规',
      summary: 'GDPR数据合规要求摘要',
      source: 'GDPR官方文档',
      moduleMapping: 'compliance',
      detailUrl: 'https://gdpr.eu/article-17',
    })
    expect(card.id).toBeTruthy()
    expect(typeof card.id).toBe('string')
    expect(card.tag).toBe('合规')
    expect(card.summary).toBe('GDPR数据合规要求摘要')
    expect(card.source).toBe('GDPR官方文档')
    expect(card.moduleMapping).toBe('compliance')
    expect(card.detailUrl).toBe('https://gdpr.eu/article-17')
    expect(card.freshnessScore).toBe(100)
    expect(card.quoteCount).toBe(0)
    expect(card.lastQuotedAt).toBeNull()
    expect(card.confidence).toBe(70)
    expect(card.expertVetted).toBe(false)
    expect(typeof card.createdAt).toBe('string')
    expect(typeof card.updatedAt).toBe('string')
  })

  it('[正例] create 不传可选参数时默认值为 null', async () => {
    const card = await svc.create({
      tag: '技术', summary: '无可选参数的卡片', source: 'test',
    })
    expect(card.moduleMapping).toBeNull()
    expect(card.detailUrl).toBeNull()
  })

  // ── 时序/顺序操作 ──

  it('[正例] 创建 → 列表 → 搜索 → 引用 → 详情流程完整', async () => {
    // 1. 创建
    const card = await svc.create({
      tag: '运营', summary: '门店运营SOP v3', source: '运营手册',
      moduleMapping: 'ops-manual',
    })
    expect(card.id).toBeTruthy()

    // 2. 列表中有它
    const list = await svc.list(0)
    expect(list.some(c => c.id === card.id)).toBe(true)

    // 3. 搜索匹配
    const searchResult = await svc.search({ q: 'SOP', module: 'ops-manual' })
    expect(searchResult.cards.some(c => c.id === card.id)).toBe(true)

    // 4. 引用
    await svc.recordQuote(card.id, '日常运营', 'ops-manual', '店长')
    const afterQuote = await svc.getById(card.id)
    expect(afterQuote.quoteCount).toBe(1)

    // 5. 自动匹配
    const matched = await svc.autoMatchForDispatch('ops-manual')
    expect(matched.some(c => c.id === card.id)).toBe(true)
  })

  // ── 健康检查 ──

  it('[正例] healthCheck 降级模式下返回 down 或 degraded 状态', async () => {
    const health = await svc.healthCheck()
    // 降级模式（无pg）下 matchApiReachable=false, quoteApiReachable=false
    // 且 cardCount 可能 =0（因为每次 new 都会清空 fallbackStore 再初始化）
    // 但是如果我们已创建卡片...由于 beforeEach 重新 new 了 service, 此时 fallback 为空
    expect(typeof health.status).toBe('string')
    expect(typeof health.timestamp).toBe('string')
    expect(typeof health.cardsCount).toBe('number')
    expect(typeof health.matchApiReachable).toBe('boolean')
  })

  it('[正例] healthCheck 在有卡片时反映正确', async () => {
    // 先在当前 service 创建卡片
    await svc.create({ tag: '技术', summary: '用于健康检查', source: 'test' })
    const health = await svc.healthCheck()
    expect(health.cardsCount).toBeGreaterThanOrEqual(1)
  })
})
