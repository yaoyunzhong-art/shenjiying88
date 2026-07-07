import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * ai-forecast-history.test.ts — L1 合约测试
 *
 * 守护 getOrInitProductHistory 行为:
 *   - 第 1 次调用: 自动 init mock 数据, 返回 { dailySales: [30], categoryId: 'default-category' }
 *   - 第 2 次调用: 返回相同引用 (闭包到 productHistory map)
 *   - 不同 productId: 互不串扰, 各初始化 1 次
 *   - 类别固定为 'default-category' (原 6 处都传这个死参数)
 */

import assert from 'node:assert/strict'
import { getOrInitProductHistory } from './ai-forecast-history'
import { productHistory } from './ai-forecast.service'

describe('[ai-forecast-history] getOrInitProductHistory', () => {
  beforeAll(() => {
    // 测试前清空 productHistory map, 避免顺序依赖
    productHistory.clear()
  })

  it('第 1 次调用: 自动 init mock 数据 (30 天销售历史)', () => {
    const h = getOrInitProductHistory('prod-test-1')
    assert.equal(h.dailySales.length, 30)
    assert.equal(h.categoryId, 'default-category')
    // 所有日销量都是正整数
    for (const sale of h.dailySales) {
      assert.ok(sale > 0, `日销量 ${sale} 应 > 0`)
      assert.equal(Number.isInteger(sale), true)
    }
  })

  it('第 2 次调用: 返回相同引用 (闭包到 productHistory map)', () => {
    const a = getOrInitProductHistory('prod-test-2')
    const b = getOrInitProductHistory('prod-test-2')
    assert.equal(a, b)  // 同一引用
  })

  it('不同 productId: 互不串扰', () => {
    const a = getOrInitProductHistory('prod-A')
    const b = getOrInitProductHistory('prod-B')
    assert.notEqual(a, b)
    // productHistory map 大小应为 2 (排除前面测试的 prod-test-1/2)
    // 这里只断言 prod-A 和 prod-B 都被初始化
    assert.ok(productHistory.has('prod-A'))
    assert.ok(productHistory.has('prod-B'))
  })

  it('categoryId 固定为 "default-category" (原 6 处都传的死参数)', () => {
    const h = getOrInitProductHistory('prod-fixed-cat')
    assert.equal(h.categoryId, 'default-category')
  })

  it('相同 productId 多次调用不会重复 init (如果 sales 不变)', () => {
    const a = getOrInitProductHistory('prod-stable')
    const firstSales = [...a.dailySales]
    const b = getOrInitProductHistory('prod-stable')
    // 引用相同, sales 数据不变 (init 不会覆盖已有)
    assert.equal(a, b)
    assert.deepEqual(b.dailySales, firstSales)
  })
})
