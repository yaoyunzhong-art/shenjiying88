import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * cashier-id.test.ts — L1 合约测试
 *
 * 守护 createSequentialIdGenerator 工厂的公共契约:
 *   - 格式 <prefix>-<YYYYMMDD>-<NNNNN> (5 位补零)
 *   - 同一工厂多次调用 seq 单调递增
 *   - 100000 循环 (从 0 取模归 1)
 *   - 多个 prefix 互不串扰 (seq 独立)
 *   - 同 prefix 多次创建工厂也互不串扰 (闭包隔离)
 */
import assert from 'node:assert/strict'
import { createSequentialIdGenerator } from './cashier-id'
describe('[cashier-id] createSequentialIdGenerator', () => {
  it('返回字符串格式 <prefix>-<YYYYMMDD>-<NNNNN>', () => {
    const next = createSequentialIdGenerator('ORD')
    const id = next()
    assert.match(id, /^ORD-\d{8}-\d{5}$/)
  })
  it('seq 从 1 开始 (不是 0), 5 位补零', () => {
    const next = createSequentialIdGenerator('ORD')
    assert.equal(next(), `ORD-${datePrefix()}-00001`)
    assert.equal(next(), `ORD-${datePrefix()}-00002`)
  })
  it('同工厂多次调用 seq 单调递增', () => {
    const next = createSequentialIdGenerator('PAY')
    const a = next()
    const b = next()
    const c = next()
    // 提取 seq 部分 (后 5 位) 验证递增
    const seqA = parseInt(a.slice(-5), 10)
    const seqB = parseInt(b.slice(-5), 10)
    const seqC = parseInt(c.slice(-5), 10)
    assert.equal(seqB, seqA + 1)
    assert.equal(seqC, seqB + 1)
  })
  it('100000 循环: 第 100001 次归 1 (不是 0, 100000)', () => {
    const next = createSequentialIdGenerator('RFD')
    // 1-based: 1, 2, ..., 99999, 0 (即 100000 % 100000 = 0 → 输出 '00000'), 再下次归 1
    // 跑 100000 次后 seq=0, 下一次归 1
    for (let i = 0; i < 100000; i++) next()
    const id = next()
    assert.equal(id, `RFD-${datePrefix()}-00001`)
  })
  it('不同 prefix 互不串扰 (各工厂独立 seq)', () => {
    const orderNext = createSequentialIdGenerator('ORD')
    const paymentNext = createSequentialIdGenerator('PAY')
    assert.equal(orderNext().endsWith('-00001'), true)
    assert.equal(paymentNext().endsWith('-00001'), true)
    assert.equal(orderNext().endsWith('-00002'), true)
    assert.equal(paymentNext().endsWith('-00002'), true)
  })
  it('同 prefix 多次创建工厂也互不串扰 (闭包隔离 seq)', () => {
    const a = createSequentialIdGenerator('ORD')
    const b = createSequentialIdGenerator('ORD')
    assert.equal(a().endsWith('-00001'), true)
    assert.equal(b().endsWith('-00001'), true)
    assert.equal(a().endsWith('-00002'), true)
    assert.equal(b().endsWith('-00002'), true)
  })
  it('prefix 完全透传 (不区分大小写, 不追加后缀)', () => {
    const next = createSequentialIdGenerator('OIT')
    assert.equal(next().startsWith('OIT-'), true)
    assert.equal(next().split('-').length, 3) // ['OIT', 'YYYYMMDD', 'NNNNN']
  })
  it('自定义 prefix (非常规 cashier prefix) 也能用', () => {
    const next = createSequentialIdGenerator('XXX')
    const id = next()
    assert.equal(id, `XXX-${datePrefix()}-00001`)
  })
  it('时间戳连续 2 次调用, 日期 prefix 必须一致 (按 ISO YYYY-MM-DD 同一天)', () => {
    const next = createSequentialIdGenerator('ORD')
    const a = next()
    const b = next()
    // 提取日期部分 (中间 8 位)
    const dateA = a.split('-')[1]
    const dateB = b.split('-')[1]
    assert.equal(dateA.length, 8)
    assert.equal(dateB.length, 8)
    assert.equal(dateA, dateB)
  })
  it('日期 prefix 形如 YYYYMMDD (无连字符, 年月日各 2 位)', () => {
    const next = createSequentialIdGenerator('ORD')
    const id = next()
    const date = id.split('-')[1]
    assert.match(date, /^\d{8}$/)
    // 提取年 (前 4 位) 月 (3-4) 日 (5-6), 年份合理
    const year = parseInt(date.slice(0, 4), 10)
    const month = parseInt(date.slice(4, 6), 10)
    const day = parseInt(date.slice(6, 8), 10)
    assert.ok(year >= 2020 && year <= 2100, `year ${year} 合理`)
    assert.ok(month >= 1 && month <= 12, `month ${month} 合理`)
    assert.ok(day >= 1 && day <= 31, `day ${day} 合理`)
  })
})
/** 工具: 取当前 YYYYMMDD 字符串 (与工厂内部实现保持一致) */
function datePrefix(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}
