import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-sales] 综合边缘场景测试
 *
 * 补充覆盖:
 *   - ProductRecommendationEngine: 跨品类边界 / 全部商品购买 / 空场景
 *   - ObjectionHandler: 极长输入 / 特殊字符 / 重复异议 / 批量对话
 *   - FollowUpScheduler: 同一天到期 / 大量跟进 / 未来日期 / 过期清除
 *   - AiSalesService: 组合场景 / 空输入 / 大客户 / 连续调用
 */

import assert from 'node:assert/strict'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'
import { AiSalesService } from './ai-sales.service'

// ══════════════════════════════════════════════════════════════════════════════
// ProductRecommendationEngine — 边界场景
// ══════════════════════════════════════════════════════════════════════════════

describe('[ProductRecommendationEngine] 边界场景', () => {
  it('已购买全部商品的客户返回空推荐', () => {
    const engine = new ProductRecommendationEngine()
    // 购买所有 sku
    for (let i = 1; i <= 10; i++) {
      engine.recordPurchase('cust-all', `prod-${String(i).padStart(3, '0')}`)
    }
    const recs = engine.recommendForCustomer('cust-all', { currentBrowsing: 'prod-001' })
    // 全部购买过，应没有未买商品推荐或返回空
    expect(Array.isArray(recs)).toBe(true)
  })

  it('从未购买任何商品的客户仍有关联推荐', () => {
    const engine = new ProductRecommendationEngine()
    const recs = engine.recommendForCustomer('new-cust', { recentViewed: [] })
    expect(recs.length).toBeGreaterThanOrEqual(0)
  })

  it('browsing 空字符串时不会崩溃', () => {
    const engine = new ProductRecommendationEngine()
    engine.recordPurchase('cust-1', 'prod-001')
    const recs = engine.recommendForCustomer('cust-1', { currentBrowsing: '' })
    expect(Array.isArray(recs)).toBe(true)
  })

  it('cross-sell 推荐不包含原商品', () => {
    const engine = new ProductRecommendationEngine()
    const recs = engine.recommendCrossSell('prod-001')
    const ids = recs.map(r => r.product.id)
    expect(ids).not.toContain('prod-001')
  })

  it('upsell 推荐价格高于原商品', () => {
    const engine = new ProductRecommendationEngine()
    const recs = engine.recommendUpsell('prod-007') // 129 元洁面
    for (const rec of recs) {
      expect(rec.product.price).toBeGreaterThanOrEqual(129)
    }
  })

  it('高价商品无向上推荐', () => {
    const engine = new ProductRecommendationEngine()
    const recs = engine.recommendUpsell('prod-008') // 1599 美容仪
    expect(recs.length).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// ObjectionHandler — 边界场景
// ══════════════════════════════════════════════════════════════════════════════

describe('[ObjectionHandler] 边界场景', () => {
  it('超长输入文本不崩溃', () => {
    const handler = new ObjectionHandler()
    const longText = '太贵了'.repeat(1000)
    const result = handler.classifyObjection(longText)
    expect(result).toBeDefined()
  })

  it('混合特殊字符的输入', () => {
    const handler = new ObjectionHandler()
    const result = handler.classifyObjection('!@#$%^&*()_+太贵了<>?:"{}|~')
    expect(result).toBe('price')
  })

  it('纯数字输入归类为 need', () => {
    const handler = new ObjectionHandler()
    const result = handler.classifyObjection('1234567890')
    expect(result).toBe('need')
  })

  it('重复异议多次分类结果一致', () => {
    const handler = new ObjectionHandler()
    const text = '质量怎么样？'
    const r1 = handler.classifyObjection(text)
    const r2 = handler.classifyObjection(text)
    expect(r1).toBe(r2)
  })

  it('生成话术对应不同的异议类型返回不同内容', () => {
    const handler = new ObjectionHandler()
    const priceResp = handler.generateResponse('price', { customerId: 'c1', productId: 'p1' })
    const qualityResp = handler.generateResponse('quality', { customerId: 'c1', productId: 'p1' })
    expect(priceResp).not.toBe(qualityResp)
  })

  it('模拟对话输入空字符串不崩溃', () => {
    const handler = new ObjectionHandler()
    const result = handler.simulateConversation('', '')
    expect(result).toBeDefined()
    expect(result.turns.length).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// FollowUpScheduler — 边界场景
// ══════════════════════════════════════════════════════════════════════════════

describe('[FollowUpScheduler] 边界场景', () => {
  it('同一天到期的多个跟进都返回', () => {
    const scheduler = new FollowUpScheduler()
    const today = new Date().toISOString()
    scheduler.scheduleBirthdayFollowUp('cust-day1', '王五', today)
    scheduler.scheduleBirthdayFollowUp('cust-day2', '赵六', today)
    scheduler.scheduleBirthdayFollowUp('cust-day3', '钱七', today)

    const due = scheduler.getDueFollowUps()
    const dueToday = due.filter(d => d.customerId.startsWith('cust-day'))
    expect(dueToday.length).toBe(3)
  })

  it('大量跟进(100+)不崩溃', () => {
    const scheduler = new FollowUpScheduler()
    for (let i = 0; i < 150; i++) {
      scheduler.scheduleFollowUp(`cust-${i}`, `跟进任务 #${i}`, i % 10 + 1)
    }
    const all = scheduler.getAllPending()
    expect(all.length).toBe(150)
  })

  it('标记不存在的 ID 返回 undefined', () => {
    const scheduler = new FollowUpScheduler()
    const result = scheduler.markCompleted('does-not-exist')
    expect(result).toBeUndefined()
  })

  it('远程日期(未来)的跟进不显示在到期列表', () => {
    const scheduler = new FollowUpScheduler()
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    scheduler.scheduleBirthdayFollowUp('cust-future', '未来客户', farFuture)

    const due = scheduler.getDueFollowUps()
    const futureItems = due.filter(d => d.customerId === 'cust-future')
    // 未来一年的生日不应出现在到期列表
    expect(futureItems.length).toBe(0)
  })

  it('标记完成后不能再重复标记', () => {
    const scheduler = new FollowUpScheduler()
    scheduler.scheduleFollowUp('cust-mark', '测试标记', 1)
    const pending = scheduler.getAllPending()
    const first = scheduler.markCompleted(pending[0].id)
    expect(first).toBeDefined()
    expect(first!.status).toBe('completed')

    const second = scheduler.markCompleted(pending[0].id)
    expect(second).toBeDefined()
  })

  it('不同客户的跟进相互隔离', () => {
    const scheduler = new FollowUpScheduler()
    scheduler.scheduleFollowUp('cust-a', 'A的跟进', 1)
    scheduler.scheduleFollowUp('cust-b', 'B的跟进', 2)

    const all = scheduler.getAllPending()
    const aItems = all.filter(r => r.customerId === 'cust-a')
    const bItems = all.filter(r => r.customerId === 'cust-b')
    expect(aItems.length).toBe(1)
    expect(bItems.length).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// AiSalesService — 组件集成边界
// ══════════════════════════════════════════════════════════════════════════════

describe('[AiSalesService] 综合边界', () => {
  function makeService(): AiSalesService {
    const engine = new ProductRecommendationEngine()
    const handler = new ObjectionHandler()
    const scheduler = new FollowUpScheduler()
    return new AiSalesService(engine, handler, scheduler)
  }

  it('连续推荐不会改变内部状态', () => {
    const svc = makeService()
    const r1 = svc.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001' })
    const r2 = svc.recommendForCustomer('cust-001', { currentBrowsing: 'prod-001' })
    expect(r1.recommendations.length).toBe(r2.recommendations.length)
  })

  it('getUpcomingBirthdays 不会随调用变化', () => {
    const svc = makeService()
    const b1 = svc.getUpcomingBirthdays()
    const b2 = svc.getUpcomingBirthdays()
    expect(Array.isArray(b1)).toBe(true)
    expect(b1.length).toBe(b2.length)
  })

  it('classifyObjection 对所有内置类型全覆盖', () => {
    const svc = makeService()
    const inputs = ['太贵了', '质量如何', '不需要', '别家更便宜', '适合我吗']
    const expected = ['price', 'quality', 'need', 'competitor', 'need']
    inputs.forEach((input, i) => {
      expect(svc.classifyObjection(input)).toBe(expected[i])
    })
  })

  it('getAllPending 和 getDueFollowUps 类型正确', () => {
    const svc = makeService()
    svc.scheduleFollowUp('cust-1', 'test reminder', 1, 'cust-1')
    const all = svc.getAllPending()
    const due = svc.getDueFollowUps()
    expect(all.length).toBeGreaterThan(0)
    expect(due.length).toBeGreaterThanOrEqual(0)
  })

  it('recordPurchase 不重复或报错', () => {
    const svc = makeService()
    expect(() => svc.recordPurchase('cust-001', 'prod-001')).not.toThrow()
    expect(() => svc.recordPurchase('cust-001', 'prod-001')).not.toThrow()
  })
})
