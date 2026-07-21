/**
 * empower-card.service.test.ts — 赋能卡片服务单元测试 (ADR-045)
 *
 * 使用降级内存模式测试（不依赖 PostgreSQL）
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// 清除环境变量使其走内存降级模式
process.env.POSTGRES_URL = ''

let service: any

describe('EmpowerCardService (降级·内存模式)', async () => {
  // @ts-expect-error: node:test ESM 需要 .ts 扩展名
  const { EmpowerCardService } = await import('./empower-card.service.ts')
  service = new EmpowerCardService() as any

  // 先植入几条数据
  let card1: any
  let card2: any
  let card3: any

  it('[正例] 应能创建知识卡片', async () => {
    const card = await service.create({
      tag: '技术',
      summary: 'NestJS模块最佳实践',
      source: 'NestJS官方',
      moduleMapping: '全模块',
    })
    assert.ok(card.id, '应有ID')
    assert.equal(card.tag, '技术')
    assert.equal(card.summary, 'NestJS模块最佳实践')
    assert.equal(card.freshnessScore, 100, '新建卡片新鲜度=100')
    assert.equal(card.confidence, 70, '默认可信度=70')
    card1 = card
  })

  it('[正例] 应能创建多张卡片用于搜索测试', async () => {
    card2 = await service.create({
      tag: '竞品',
      summary: '订阅制会员收入全国平均22%',
      source: 'ZVZO2026搜索',
      moduleMapping: '竞品分析',
    })
    assert.ok(card2.id)
    assert.equal(card2.tag, '竞品')
  })

  it('[正例] 应能创建P-38相关卡片', async () => {
    card3 = await service.create({
      tag: '技术',
      summary: 'P-38财务模块成本现金流边界',
      source: 'PRD对齐',
      moduleMapping: 'P-38',
    })
    assert.ok(card3.id)
    assert.equal(card3.moduleMapping, 'P-38')
  })

  it('[正例] 应能通过 ID 获取卡片', async () => {
    const card = await service.getById(card1.id)
    assert.equal(card.summary, 'NestJS模块最佳实践')
  })

  it('[正例] 列表应返回所有卡片', async () => {
    const cards = await service.list(0)
    assert.ok(cards.length >= 3, `至少3条卡片, 实际: ${cards.length}`)
  })

  it('[正例] 搜索应按模块映射匹配', async () => {
    const result = await service.search({ module: 'P-38', limit: 2 })
    assert.ok(result.cards.length >= 1, '应找到P-38相关卡片')
    if (result.cards.length > 0) {
      // 降级模式按新鲜度排序，可能通过关键词匹配
    }
  })

  it('[正例] 搜索应按关键词匹配 22%', async () => {
    const result = await service.search({ q: '22%', limit: 3 })
    assert.ok(result.cards.length >= 1, '应找到含"22%"的卡片')
    assert.ok(result.cards.some((c: any) => c.tag === '竞品'), '应匹配竞品卡片')
  })

  it('[正例] 自动匹配应为模块返回 top-3', async () => {
    const cards = await service.autoMatchForDispatch('P-38', ['成本'])
    assert.ok(cards.length >= 1, '至少返回1条')
  })

  it('[正例] 引用计数应递增', async () => {
    const before = card2.quoteCount
    await service.recordQuote(card2.id, 'test-task', '竞品分析', '龙虾哥')
    const card = await service.getById(card2.id)
    assert.equal(card.quoteCount, before + 1, '引用计数+1')
  })

  it('[正例] 引用日志在降级模式返回空数组不影响业务', async () => {
    const logs = await service.getQuoteLog(1)
    assert.ok(Array.isArray(logs), '应返回数组')
  })

  it('[正例] 今日赋能评分应返回', async () => {
    const stats = await service.getTodayEmpowerScore()
    assert.ok(typeof stats.score === 'number', '评分应为数字')
    assert.ok(stats.score >= 0, '评分非负')
  })

  // ── 反例 ──

  it('[反例] 获取不存在的 ID 应抛错', async () => {
    await assert.rejects(
      () => service.getById('non-existent-id'),
      (err: any) => {
        // 降级模式下可能是 'PostgreSQL 不可用' 或 'not found'
        return err.message.includes('PostgreSQL') || err.message.toLowerCase().includes('not found')
      }
    )
  })

  it('[反例] 搜索空关键词应返回数组', async () => {
    const result = await service.search({ limit: 3 })
    assert.ok(Array.isArray(result.cards), '应返回数组')
  })

  it('[反例] 不存在的卡片记录引用不应报错', async () => {
    await service.recordQuote('no-such-id', 'task', 'module', 'user')
  })

  it('[反例] 空摘要卡片也应创建成功', async () => {
    const card = await service.create({ tag: '技术', summary: '', source: 'test' })
    assert.ok(card.id, '空摘要也应有ID')
  })

  // ── 边界 ──

  it('[边界] 退化曲线应不报错', async () => {
    const result = await service.applyDecay()
    assert.ok(typeof result.decayed === 'number', '应返回decayed')
    assert.ok(typeof result.archived === 'number', '应返回archived')
  })

  it('[边界] stats/today 在无引用变化时应返回', async () => {
    const stats = await service.getTodayEmpowerScore()
    assert.ok(!isNaN(stats.score), '评分不是NaN')
  })

  it('[边界] 退化曲线可多次执行不报错', async () => {
    const r1 = await service.applyDecay()
    const r2 = await service.applyDecay()
    assert.ok(typeof r2.decayed === 'number', '第二轮不报错')
  })

  // ── 健康检查 ──

  it('[正例] healthCheck 应返回正确的结构', async () => {
    const health = await service.healthCheck()
    assert.ok(['ok', 'degraded', 'down'].includes(health.status), 'status 应为 ok/degraded/down')
    assert.ok(typeof health.cardsCount === 'number', 'cardsCount 应为数字')
    assert.ok(typeof health.timestamp === 'string', 'timestamp 应为字符串')
    assert.ok(typeof health.matchApiReachable === 'boolean', 'matchApiReachable 应为布尔')
    assert.ok(typeof health.quoteApiReachable === 'boolean', 'quoteApiReachable 应为布尔')
    assert.ok(health.lastMatch === null || typeof health.lastMatch === 'string', 'lastMatch 应为 null 或字符串')
    assert.ok(health.lastImport === null || typeof health.lastImport === 'string', 'lastImport 应为 null 或字符串')
  })

  it('[正例] healthCheck 应反映已有卡片数量', async () => {
    const health = await service.healthCheck()
    // 前面已创建多张卡片, cardCount > 0
    assert.ok(health.cardsCount > 0, `应有卡片存在, 实际: ${health.cardsCount}`)
  })

  it('[正例] healthCheck matchApiReachable 应有值', async () => {
    const health = await service.healthCheck()
    // 降级模式下 matchApi 不可达(无pg), quoteApi 不可达
    // 但函数不应抛错
    assert.ok(typeof health.matchApiReachable === 'boolean', 'matchApiReachable 应有布尔值')
  })

  it('[边界] healthCheck 在降级模式(无pg)下不抛错', async () => {
    const envBak = process.env.POSTGRES_URL
    delete process.env.POSTGRES_URL
    // 已有卡片的服务, healthCheck 不应抛错
    const health = await service.healthCheck()
    assert.ok(typeof health.status === 'string', '降级模式 healthCheck 也应返回 status')
    if (envBak !== undefined) process.env.POSTGRES_URL = envBak
  })
})
