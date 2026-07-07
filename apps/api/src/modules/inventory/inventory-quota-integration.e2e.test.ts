import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Inventory product creation + TenantQuota + Lifecycle 集成 (Phase-16E)
 *
 * 验证:
 *   - reserveQuotaAndCreateSync 包装 createProduct 时, quota/lifecycle guard 生效
 *   - tenant suspend → 抛 TenantLifecycleBlockedException
 *   - 配额超限 → 抛 QuotaExceededException
 *   - 业务成功 → quota +1
 *   - 多 tenant 隔离
 *   - 业务回调失败 → quota 回滚
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  QuotaExceededException,
  TenantLifecycleBlockedException,
  reserveQuotaAndCreateSync
} from '../tenant/tenant-quota-enforcement.util'
import { TenantLifecycleService } from '../tenant/tenant-lifecycle.service'
import { TenantQuotaService } from '../tenant/tenant-quota.service'
import { TenantLifecycleStatus, TenantStatusReason } from '../tenant/tenant-lifecycle.entity'
import { QuotaResourceKind, TenantTier } from '../tenant/tenant-quota.entity'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { ProductStatus } from './inventory.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 模拟 inventory service 调用 reserveQuotaAndCreateSync 集成模式
 */
function createProductWithQuota(
  inventory: InventoryService,
  tenantId: string,
  ctx: RequestTenantContext,
  input: ReturnType<typeof makeProductInput>,
  lifecycle: TenantLifecycleService,
  quota: TenantQuotaService
) {
  return reserveQuotaAndCreateSync(tenantId, lifecycle, quota, QuotaResourceKind.Brand, () =>
    inventory.createProduct(ctx, input)
  )
}

function ctx(tenantId: string): RequestTenantContext {
  return { tenantId, brandId: 'b-1', storeId: 's-1' } as RequestTenantContext
}

function makeProductInput(name: string, sku: string) {
  return {
    name,
    sku,
    category: 'arcade',
    unit: 'pcs',
    price: 100,
    cost: 50,
    minStock: 10,
    maxStock: 100,
    currentStock: 50,
    status: ProductStatus.Active
  }
}

it('e2e: createProduct 正常路径创建 product + quota +1 (Brand)', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  const product = createProductWithQuota(
    inventory,
    'tenant-test',
    ctx('tenant-test'),
    makeProductInput('Card A', 'SKU-A'),
    lifecycle,
    quota
  )
  assert.ok(product.id)
  assert.equal(product.name, 'Card A')
  // Brand resource kind = brands quota
  assert.equal(quota.getUsage('tenant-test').brands, 1, 'quota usage should be 1')
})

it('e2e: tenant suspend 后 createProduct 抛 TenantLifecycleBlockedException', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  lifecycle.suspend('tenant-test', TenantStatusReason.BillingOverdue, 'billing')
  try {
    createProductWithQuota(
      inventory,
      'tenant-test',
      ctx('tenant-test'),
      makeProductInput('Card B', 'SKU-B'),
      lifecycle,
      quota
    )
    assert.fail('应抛 TenantLifecycleBlockedException')
  } catch (err) {
    assert.ok(err instanceof TenantLifecycleBlockedException)
  }
  assert.equal(quota.getUsage('tenant-test').brands, 0)
})

it('e2e: 配额超限时 createProduct 抛 QuotaExceededException', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  // Free maxBrands=1, override 到 1
  quota.overrideQuota('tenant-test', { maxBrands: 1 })
  createProductWithQuota(
    inventory,
    'tenant-test',
    ctx('tenant-test'),
    makeProductInput('Card C', 'SKU-C'),
    lifecycle,
    quota
  )
  assert.equal(quota.getUsage('tenant-test').brands, 1)

  try {
    createProductWithQuota(
      inventory,
      'tenant-test',
      ctx('tenant-test'),
      makeProductInput('Card D', 'SKU-D'),
      lifecycle,
      quota
    )
    assert.fail('应抛 QuotaExceededException')
  } catch (err) {
    assert.ok(err instanceof QuotaExceededException)
    const response = (err as QuotaExceededException).getResponse() as {
      resource: string
      limit: number
    }
    assert.equal(response.resource, 'BRAND')
    assert.equal(response.limit, 1)
  }
  assert.equal(quota.getUsage('tenant-test').brands, 1)
})

it('e2e: tenant reactivate 后 createProduct 恢复', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  lifecycle.suspend('tenant-test')
  assert.throws(() =>
    createProductWithQuota(
      inventory,
      'tenant-test',
      ctx('tenant-test'),
      makeProductInput('Card E', 'SKU-E'),
      lifecycle,
      quota
    )
  )
  lifecycle.reactivate('tenant-test', 'admin')
  const product = createProductWithQuota(
    inventory,
    'tenant-test',
    ctx('tenant-test'),
    makeProductInput('Card F', 'SKU-F'),
    lifecycle,
    quota
  )
  assert.ok(product.id)
})

it('e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')
  quota.initialize('tenant-B', TenantTier.Free)
  lifecycle.initialize('tenant-B')

  const inventory = new InventoryService()
  lifecycle.suspend('tenant-test')
  assert.throws(() =>
    createProductWithQuota(
      inventory,
      'tenant-test',
      ctx('tenant-test'),
      makeProductInput('iso-A', 'SKU-iso-A'),
      lifecycle,
      quota
    )
  )
  const productB = createProductWithQuota(
    inventory,
    'tenant-B',
    ctx('tenant-B'),
    makeProductInput('iso-B', 'SKU-iso-B'),
    lifecycle,
    quota
  )
  assert.ok(productB.id)
  assert.equal(quota.getUsage('tenant-test').brands, 0)
  assert.equal(quota.getUsage('tenant-B').brands, 1)
})

it('e2e: 批量 createProduct 累计 quota', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  quota.setTier('tenant-test', TenantTier.Pro)
  for (let i = 0; i < 5; i++) {
    createProductWithQuota(
      inventory,
      'tenant-test',
      ctx('tenant-test'),
      makeProductInput(`Card ${i}`, `SKU-batch-${i}`),
      lifecycle,
      quota
    )
  }
  assert.equal(quota.getUsage('tenant-test').brands, 5)
})

it('e2e: createProduct 不改变 product 业务字段', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  const input = makeProductInput('Fidelity Card', 'SKU-fidelity')
  const product = createProductWithQuota(
    inventory,
    'tenant-test',
    ctx('tenant-test'),
    input,
    lifecycle,
    quota
  )
  assert.equal(product.name, input.name)
  assert.equal(product.sku, input.sku)
  assert.equal(product.price, input.price)
  assert.equal(product.status, ProductStatus.Active)
  assert.equal(product.currentStock, input.currentStock)
})

it('e2e: 业务回调失败 → quota 回滚', async () => {
  const quota = new TenantQuotaService()
  const lifecycle = new TenantLifecycleService()
  resetInventoryServiceTestState()
  quota.initialize('tenant-test', TenantTier.Free)
  lifecycle.initialize('tenant-test')

  const inventory = new InventoryService()
  // 模拟 createFn 抛错
  try {
    reserveQuotaAndCreateSync(
      'tenant-test',
      lifecycle,
      quota,
      QuotaResourceKind.Brand,
      () => {
        throw new Error('simulated create failure')
      }
    )
    assert.fail('应抛错')
  } catch (err) {
    assert.match((err as Error).message, /simulated create failure/)
  }
  // quota 应回滚
  assert.equal(quota.getUsage('tenant-test').brands, 0)
})
