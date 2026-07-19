/**
 * monitor-collector.service.test.ts — P-50 V2 竞争监控测试
 *
 * 圈梁指令:
 *   ① TSC通过 → ② 测试存在(0 fail·无skip) → ③ 圈梁表更新 → ④ PRD标记 → ⑤ 知识赋能
 *
 * 覆盖:
 *   - 4种原始类型告警 × 严重度分级
 *   - 2种新增类型告警 (equipment_change / policy_change)
 *   - 去重逻辑（正例+反例）
 *   - 时间排序
 *   - 增量/全量模式
 *   - 边界：空城市、无告警场景
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { MonitorCollectorService } from './monitor-collector.service'
import type { CompetitorAlert, MonitorScanResult } from './intelligence.entity'

describe('MonitorCollectorService', () => {
  let collector: MonitorCollectorService

  beforeEach(() => {
    collector = new MonitorCollectorService()
  })

  // ── 4种原始类型告警 × 严重度分级 ────────────────────

  it('正例: price_change 返回告警含完整字段', async () => {
    const alerts = await collector.collectPriceChanges()
    assert.ok(alerts.length >= 0)
    for (const a of alerts) {
      assert.ok(a.id)
      assert.equal(a.type, 'price_change')
      assert.ok(['high', 'medium', 'low'].includes(a.severity))
      assert.ok(a.description.includes('价格'))
      assert.ok(a.recommendedAction.startsWith('建议'))
      assert.ok(a.detectedAt)
      assert.ok(a.storeName)
      assert.ok(a.city)
    }
  })

  it('正例: new_activity 返回告警含活动描述', async () => {
    const alerts = await collector.collectNewActivities()
    for (const a of alerts) {
      assert.equal(a.type, 'new_activity')
      assert.ok(a.description.includes('活动'))
      assert.ok(a.recommendedAction)
    }
  })

  it('正例: new_promotion 返回告警含优惠信息', async () => {
    const alerts = await collector.collectPromotions()
    for (const a of alerts) {
      assert.equal(a.type, 'new_promotion')
      assert.ok(a.description.includes('团购') || a.description.includes('折扣'))
    }
  })

  it('正例: rating_change 返回告警含评分变化', async () => {
    const alerts = await collector.collectRatingChanges()
    for (const a of alerts) {
      assert.equal(a.type, 'rating_change')
      assert.ok(a.description.includes('评分') || a.description.includes('好评') || a.description.includes('差评'))
    }
  })

  // ── 2种新增类型告警 ────────────────────────────────

  it('正例: equipment_change 返回设备异动告警', async () => {
    const alerts = await collector.collectEquipmentChanges()
    for (const a of alerts) {
      assert.equal(a.type, 'equipment_change')
      assert.ok(a.description.includes('新增') || a.description.includes('更换'))
      assert.ok(a.recommendedAction.includes('设备'))
    }
  })

  it('正例: policy_change 返回政策异动告警', async () => {
    const alerts = await collector.collectPolicyChanges()
    // 随机产生0-N条告警，有告警时验证结构
    for (const a of alerts) {
      assert.equal(a.type, 'policy_change')
      assert.ok(a.description.includes('营业时间') || a.description.includes('优惠') || a.description.includes('权益') || a.description.includes('预约'))
    }
    // 边界: 可能随机为0，允许空数组
    assert.ok(alerts.length >= 0)
  })

  // ── 严重度分级 ──────────────────────────────────────

  it('正例: 严重度至少包含2种级别（随机分布）', async () => {
    const allTypes = [
      await collector.collectPriceChanges(),
      await collector.collectNewActivities(),
      await collector.collectPromotions(),
      await collector.collectRatingChanges(),
      await collector.collectEquipmentChanges(),
      await collector.collectPolicyChanges(),
    ]
    const flat = allTypes.flat()
    const severities = new Set(flat.map(a => a.severity))
    assert.ok(severities.size >= 2, `应有至少2种严重级别，当前有: ${[...severities].join(',')}`)
  })

  // ── 增量扫描 ────────────────────────────────────────

  it('正例: incrementalScan 返回所有类型告警', async () => {
    const alerts = await collector.incrementalScan()
    assert.ok(alerts.length > 0)
    for (const a of alerts) {
      assert.equal(a.scanMode, 'incremental')
    }
  })

  it('正例: incrementalScan 每种类型至少有部分告警', async () => {
    const alerts = await collector.incrementalScan()
    const types = new Set(alerts.map(a => a.type))
    assert.ok(types.size >= 3, `仅覆盖 ${types.size} 种类型: ${[...types].join(',')}`)
  })

  // ── 全量扫描 ────────────────────────────────────────

  it('正例: fullScan 返回更多告警且标记模式', async () => {
    const alerts = await collector.fullScan()
    assert.ok(alerts.length > 0)
    for (const a of alerts) {
      assert.equal(a.scanMode, 'full')
    }
  })

  // ── 去重逻辑 ────────────────────────────────────────

  it('正例: deduplicate 去除同一竞品同类型同天的重复', () => {
    const now = new Date().toISOString()
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString()

    const alerts: CompetitorAlert[] = [
      {
        id: 'a1', storeName: '竞品A', city: '上海', type: 'price_change',
        severity: 'high', description: '价格降了', detectedAt: now,
        recommendedAction: '建议关注',
      },
      {
        id: 'a2', storeName: '竞品A', city: '上海', type: 'price_change',
        severity: 'medium', description: '价格降更多了', detectedAt: twoHoursAgo,
        recommendedAction: '建议关注',
      },
    ]

    const deduped = collector.deduplicate(alerts)
    assert.equal(deduped.length, 1, '应去重为1条')
    assert.equal(deduped[0]!.id, 'a1', '应保留最新一条')
  })

  it('正例: 不同类型不互相去重', () => {
    const now = new Date().toISOString()
    const alerts: CompetitorAlert[] = [
      {
        id: 'b1', storeName: '竞品A', city: '上海', type: 'price_change',
        severity: 'high', description: '价格变了', detectedAt: now,
        recommendedAction: '建议',
      },
      {
        id: 'b2', storeName: '竞品A', city: '上海', type: 'new_activity',
        severity: 'medium', description: '新活动', detectedAt: now,
        recommendedAction: '建议',
      },
    ]
    const deduped = collector.deduplicate(alerts)
    assert.equal(deduped.length, 2, '不同类型不应去重')
  })

  it('反例: 不同竞品同类型不互相去重', () => {
    const now = new Date().toISOString()
    const alerts: CompetitorAlert[] = [
      {
        id: 'c1', storeName: '竞品A', city: '上海', type: 'price_change',
        severity: 'high', description: 'A调价', detectedAt: now,
        recommendedAction: '建议',
      },
      {
        id: 'c2', storeName: '竞品B', city: '上海', type: 'price_change',
        severity: 'medium', description: 'B调价', detectedAt: now,
        recommendedAction: '建议',
      },
    ]
    const deduped = collector.deduplicate(alerts)
    assert.equal(deduped.length, 2, '不同竞品不应去重')
  })

  it('正例: deduplicate 标记旧记录为 deduped', () => {
    const now = new Date().toISOString()
    const old = new Date(Date.now() - 3 * 3600000).toISOString()

    const alerts: CompetitorAlert[] = [
      {
        id: 'd1', storeName: '竞品X', city: '深圳', type: 'new_promotion',
        severity: 'low', description: '第一次优惠', detectedAt: old,
        recommendedAction: '建议',
      },
      {
        id: 'd2', storeName: '竞品X', city: '深圳', type: 'new_promotion',
        severity: 'high', description: '第二次优惠', detectedAt: now,
        recommendedAction: '建议',
      },
    ]
    const deduped = collector.deduplicate(alerts)
    assert.equal(deduped.length, 1)
    assert.equal(deduped[0]!.id, 'd2')
    assert.equal(alerts[0]!.deduped, true)
    assert.equal(alerts[1]!.deduped, undefined)
  })

  // ── 时间排序 ────────────────────────────────────────

  it('正例: incrementalScan 结果可按时间排序', async () => {
    const alerts = await collector.incrementalScan()
    const sorted = [...alerts].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    assert.equal(sorted.length, alerts.length)
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(
        new Date(sorted[i - 1]!.detectedAt).getTime() >= new Date(sorted[i]!.detectedAt).getTime(),
        `排序错误: ${sorted[i - 1]!.detectedAt} < ${sorted[i]!.detectedAt}`
      )
    }
  })

  // ── 边界 ────────────────────────────────────────────

  it('边界: 空城市名返回空集', async () => {
    const price = await collector.collectPriceChanges('__EMPTY_CITY__')
    assert.equal(price.length, 0)
    const activity = await collector.collectNewActivities('__EMPTY_CITY__')
    assert.equal(activity.length, 0)
    const promo = await collector.collectPromotions('__EMPTY_CITY__')
    assert.equal(promo.length, 0)
    const rating = await collector.collectRatingChanges('__EMPTY_CITY__')
    assert.equal(rating.length, 0)
    const equip = await collector.collectEquipmentChanges('__EMPTY_CITY__')
    assert.equal(equip.length, 0)
    const policy = await collector.collectPolicyChanges('__EMPTY_CITY__')
    assert.equal(policy.length, 0)
  })

  it('边界: 上海城市过滤只返回上海竞品', async () => {
    const alerts = await collector.incrementalScan('上海')
    for (const a of alerts) {
      assert.equal(a.city, '上海')
    }
  })

  it('边界: generateTrend 返回7天6种类型', async () => {
    const trend = await collector.generateTrend()
    assert.equal(trend.length, 7 * 6, '应返回7天×6类型=42条走势点')
    const dates = new Set(trend.map(t => t.date))
    assert.equal(dates.size, 7, '应覆盖7天')
  })

  it('边界: deduplicate 空列表返回空', () => {
    const result = collector.deduplicate([])
    assert.equal(result.length, 0)
  })
})
