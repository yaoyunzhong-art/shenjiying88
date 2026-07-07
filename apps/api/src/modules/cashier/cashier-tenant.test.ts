import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * cashier-tenant.test.ts — L1 合约测试
 *
 * 守护 3 个跨租户防护 helper 的公共契约:
 *   - tenantSafeGet: 缺失 / 跨租户 / 同租户 3 路径
 *   - tenantFilter: 过滤跨租户 / 保留同租户 / 顺序稳定
 *   - assertSameTenant: 缺失抛 NotFound / 跨租户抛 BadRequest (string + object 两形式) / 同租户返回实体
 */
import assert from 'node:assert/strict'
import {
  tenantSafeGet,
  tenantFilter,
  assertSameTenant,
  type TenantScoped,
} from './cashier-tenant'
interface FakeOrder extends TenantScoped {
  id: string
  name: string
}
const orderA: FakeOrder = { id: 'o-1', name: 'Order-A', tenantId: 't-A' }
const orderB: FakeOrder = { id: 'o-2', name: 'Order-B', tenantId: 't-A' }
const orderC: FakeOrder = { id: 'o-3', name: 'Order-C', tenantId: 't-B' }
describe('[cashier-tenant] tenantSafeGet', () => {
  it('同租户 → 返回实体', () => {
    assert.equal(tenantSafeGet(orderA, 't-A'), orderA)
  })
  it('跨租户 → 返回 null (不抛错)', () => {
    assert.equal(tenantSafeGet(orderA, 't-B'), null)
  })
  it('实体缺失 (undefined) → 返回 null', () => {
    assert.equal(tenantSafeGet(undefined, 't-A'), null)
  })
  it('同租户多实体互不串扰', () => {
    assert.equal(tenantSafeGet(orderB, 't-A')?.id, 'o-2')
    assert.equal(tenantSafeGet(orderC, 't-B')?.id, 'o-3')
  })
})
describe('[cashier-tenant] tenantFilter', () => {
  it('同租户全部保留', () => {
    const out = tenantFilter([orderA, orderB], 't-A')
    assert.equal(out.length, 2)
    assert.deepEqual(out.map((o) => o.id), ['o-1', 'o-2'])
  })
  it('跨租户全部过滤', () => {
    const out = tenantFilter([orderA, orderB, orderC], 't-Z')
    assert.equal(out.length, 0)
  })
  it('混合租户只保留匹配的', () => {
    const out = tenantFilter([orderA, orderB, orderC], 't-A')
    assert.equal(out.length, 2)
    assert.deepEqual(out.map((o) => o.id), ['o-1', 'o-2'])
  })
  it('输入 Iterable (Map.values) 也支持', () => {
    const map = new Map<string, FakeOrder>([
      ['o-1', orderA],
      ['o-3', orderC],
    ])
    const out = tenantFilter(map.values(), 't-A')
    assert.equal(out.length, 1)
    assert.equal(out[0].id, 'o-1')
  })
  it('空输入 → 空数组', () => {
    assert.deepEqual(tenantFilter([], 't-A'), [])
    assert.deepEqual(tenantFilter(new Map().values(), 't-A'), [])
  })
  it('顺序稳定 (与输入顺序一致)', () => {
    const out = tenantFilter([orderB, orderA], 't-A') // 故意倒序
    assert.deepEqual(out.map((o) => o.id), ['o-2', 'o-1'])
  })
  it('返回新数组 (不是原引用, 避免共享污染)', () => {
    const input = [orderA, orderB]
    const out = tenantFilter(input, 't-A')
    assert.notEqual(out, input)
  })
})
describe('[cashier-tenant] assertSameTenant', () => {
  it('同租户 → 返回实体 (无异常)', () => {
    const out = assertSameTenant(orderA, 't-A', 'ERR', 'not found')
    assert.equal(out, orderA)
  })
  it('实体缺失 (undefined) → 抛 NotFoundException (含 notFoundMessage)', () => {
    assert.throws(
      () => assertSameTenant(undefined, 't-A', 'ERR', 'order xyz not found'),
      (err: any) => {
        return err?.name === 'NotFoundException' &&
               err?.message === 'order xyz not found'
      }
    )
  })
  it('跨租户 → 抛 BadRequestException (string 形式)', () => {
    assert.throws(
      () => assertSameTenant(orderA, 't-B', 'cross_tenant_order_access', 'not found'),
      (err: any) => {
        // string 形式: err.message 直接是 string
        return err?.name === 'BadRequestException' &&
               err?.message === 'cross_tenant_order_access'
      }
    )
  })
  it('跨租户 + errorDetail → 抛 BadRequestException (object 形式 {error, message})', () => {
    assert.throws(
      () => assertSameTenant(
        orderA, 't-B',
        'cross_tenant_order_access', 'not found',
        { message: 'order belongs to a different tenant' }
      ),
      (err: any) => {
        // object 形式: err.getResponse() 返回 object { error, message, ... }
        // 注意 NestJS 会从 response.message 提取到 err.message (string)
        const resp = err.getResponse?.() ?? err.response
        return err?.name === 'BadRequestException' &&
               resp?.error === 'cross_tenant_order_access' &&
               resp?.message === 'order belongs to a different tenant'
      }
    )
  })
  it('entity 缺失优先抛 NotFound (不抛 BadRequest, 即使有 errorDetail)', () => {
    assert.throws(
      () => assertSameTenant(
        undefined, 't-A',
        'cross_tenant_X', 'missing msg',
        { foo: 'bar' }
      ),
      (err: any) => {
        return err?.name === 'NotFoundException' &&
               err?.message === 'missing msg'
      }
    )
  })
  it('errorDetail 可拼任意字段 (不限于 message)', () => {
    assert.throws(
      () => assertSameTenant(
        orderA, 't-B',
        'cross_tenant_X', 'not found',
        { field1: 'a', field2: 42 }
      ),
      (err: any) => {
        const resp = err.getResponse?.() ?? err.response
        return err?.name === 'BadRequestException' &&
               resp?.error === 'cross_tenant_X' &&
               resp?.field1 === 'a' &&
               resp?.field2 === 42
      }
    )
  })
})
