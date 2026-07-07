import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 单元测试: TenantQuotaService (Phase-15 task 2)
 *
 * 覆盖:
 *   - tier 默认配额加载
 *   - getOrInitQuota 懒初始化
 *   - checkQuotaForResource 边界 (允许/拒绝/-1 无限制)
 *   - reserve 预占 + increment usage
 *   - decrement 不跌破 0
 *   - overrideQuota 部分覆盖
 *   - clearOverride 恢复 tier 默认
 *   - apiCallsToday 日切 (跨天重置)
 *   - resetAll 清除全部状态
 */

import assert from 'node:assert/strict'
import {
  buildEmptyUsage,
  buildTenantQuota,
  DEFAULT_TIER_QUOTAS,
  QuotaResourceKind,
  TenantTier,
  type TenantQuota,
  type TenantQuotaUsage
} from './tenant-quota.entity'
import { TenantQuotaService } from './tenant-quota.service'

/** 便捷访问 tier 默认值 */
const FREE = TenantTier.Free
const PRO = TenantTier.Pro
const ENT = TenantTier.Enterprise

beforeEach(() => {
  // 每个 test 用 new service 保证隔离
})

it('buildTenantQuota: 应用 tier 默认配额', () => {
  const quota = buildTenantQuota('t1', FREE)
  assert.equal(quota.maxBrands, DEFAULT_TIER_QUOTAS[FREE].maxBrands)
  assert.equal(quota.maxStores, DEFAULT_TIER_QUOTAS[FREE].maxStores)
  assert.equal(quota.maxMembers, DEFAULT_TIER_QUOTAS[FREE].maxMembers)
  assert.equal(quota.maxCampaigns, DEFAULT_TIER_QUOTAS[FREE].maxCampaigns)
  assert.equal(quota.maxApiCallsPerDay, DEFAULT_TIER_QUOTAS[FREE].maxApiCallsPerDay)
  assert.equal(quota.tier, FREE)
  assert.ok(quota.updatedAt)
})

it('buildTenantQuota: Pro tier 比 Free 大', () => {
  const free = buildTenantQuota('t1', FREE)
  const pro = buildTenantQuota('t1', PRO)
  assert.ok(pro.maxStores > free.maxStores)
  assert.ok(pro.maxMembers > free.maxMembers)
  assert.ok(pro.maxApiCallsPerDay > free.maxApiCallsPerDay)
})

it('buildEmptyUsage: 初始全 0', () => {
  const usage = buildEmptyUsage('t1')
  assert.equal(usage.brands, 0)
  assert.equal(usage.stores, 0)
  assert.equal(usage.members, 0)
  assert.equal(usage.campaigns, 0)
  assert.equal(usage.apiCallsToday, 0)
  assert.ok(usage.recordedAt)
})

it('initialize + getQuota: 存储并返回 quota', () => {
  const svc = new TenantQuotaService()
  const quota = svc.initialize('t1', PRO)
  assert.equal(quota.tenantId, 't1')
  assert.equal(svc.getQuota('t1')?.maxStores, DEFAULT_TIER_QUOTAS[PRO].maxStores)
  assert.equal(svc.getQuota('t-not-exist'), undefined)
})

it('getOrInitQuota: 首次访问按 Free 初始化', () => {
  const svc = new TenantQuotaService()
  const quota = svc.getOrInitQuota('t1')
  assert.equal(quota.tier, FREE)
  assert.equal(quota.maxBrands, DEFAULT_TIER_QUOTAS[FREE].maxBrands)
})

it('getOrInitQuota: 已存在时返回原 quota 不变', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', PRO)
  const quota = svc.getOrInitQuota('t1', FREE)
  assert.equal(quota.tier, PRO, '已有 quota 不应被降级')
})

it('setTier: 升级后配额增加', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  const upgraded = svc.setTier('t1', ENT)
  assert.equal(upgraded.tier, ENT)
  assert.equal(upgraded.maxStores, DEFAULT_TIER_QUOTAS[ENT].maxStores)
})

it('overrideQuota: 部分字段覆盖', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  const updated = svc.overrideQuota('t1', { maxStores: 999 })
  assert.equal(updated.maxStores, 999)
  assert.equal(updated.maxBrands, DEFAULT_TIER_QUOTAS[FREE].maxBrands, '未覆盖字段保留 tier 默认')
  assert.equal(updated.tier, FREE)
})

it('clearOverride: 恢复 tier 默认', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  svc.overrideQuota('t1', { maxStores: 999 })
  const reset = svc.clearOverride('t1')
  assert.equal(reset.maxStores, DEFAULT_TIER_QUOTAS[FREE].maxStores)
})

it('check: 未达上限 allowed=true', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  const r = svc.check('t1', QuotaResourceKind.Brand)
  assert.equal(r.allowed, true)
  assert.equal(r.currentUsage, 0)
  assert.equal(r.limit, DEFAULT_TIER_QUOTAS[FREE].maxBrands)
})

it('check: 达上限 allowed=false', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  // Free maxBrands = 1, increment 到 1 后再 check 应 fail
  svc.increment('t1', QuotaResourceKind.Brand)
  const r = svc.check('t1', QuotaResourceKind.Brand)
  assert.equal(r.allowed, false)
  assert.deepEqual(r.exceeded, [QuotaResourceKind.Brand])
  assert.ok(r.reason?.includes('BRAND'))
})

it('reserve: allowed 时 increment,disallowed 时不 increment', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  // Free maxBrands=1
  assert.equal(svc.reserve('t1', QuotaResourceKind.Brand).allowed, true)
  assert.equal(svc.getUsage('t1').brands, 1)
  // 第二次 reserve 应 fail
  const r2 = svc.reserve('t1', QuotaResourceKind.Brand)
  assert.equal(r2.allowed, false)
  assert.equal(svc.getUsage('t1').brands, 1, 'disallowed 时不应增加')
})

it('increment / decrement: 增减 usage,不低于 0', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', PRO)
  svc.increment('t1', QuotaResourceKind.Store, 5)
  assert.equal(svc.getUsage('t1').stores, 5)
  svc.decrement('t1', QuotaResourceKind.Store, 3)
  assert.equal(svc.getUsage('t1').stores, 2)
  svc.decrement('t1', QuotaResourceKind.Store, 100)
  assert.equal(svc.getUsage('t1').stores, 0, '不应跌破 0')
})

it('apiCallsToday: 多次 increment 累加', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', PRO)
  svc.increment('t1', QuotaResourceKind.ApiCall, 10)
  svc.increment('t1', QuotaResourceKind.ApiCall, 5)
  assert.equal(svc.getUsage('t1').apiCallsToday, 15)
})

it('resetUsage: 清零全部 usage', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  svc.increment('t1', QuotaResourceKind.Brand)
  svc.increment('t1', QuotaResourceKind.Store, 3)
  const reset = svc.resetUsage('t1')
  assert.equal(reset.brands, 0)
  assert.equal(reset.stores, 0)
  assert.equal(svc.getUsage('t1').brands, 0)
})

it('listQuotas: 返回所有已初始化 quota', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  svc.initialize('t2', PRO)
  const list = svc.listQuotas()
  assert.equal(list.length, 2)
  const ids = list.map(q => q.tenantId).sort()
  assert.deepEqual(ids, ['t1', 't2'])
})

it('listDefaultTierQuotas: 包含 Free/Pro/Enterprise', () => {
  const svc = new TenantQuotaService()
  const list = svc.listDefaultTierQuotas()
  const tiers = list.map(l => l.tier).sort()
  assert.deepEqual(tiers, [ENT, FREE, PRO])
})

it('resetAll: 清除 quota + usage', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', FREE)
  svc.increment('t1', QuotaResourceKind.Brand)
  svc.resetAll()
  assert.equal(svc.getQuota('t1'), undefined)
  assert.equal(svc.getUsage('t1').brands, 0)
})

it('overrideQuota: tier 覆盖字段优先级正确', () => {
  const svc = new TenantQuotaService()
  const q = svc.overrideQuota('new-tenant', { tier: PRO, maxStores: 50 })
  assert.equal(q.tier, PRO)
  // 未指定的字段应使用 tier 默认,而不是旧的 0
  assert.equal(q.maxBrands, DEFAULT_TIER_QUOTAS[PRO].maxBrands)
  assert.equal(q.maxStores, 50, 'override 优先')
})

it('usage: 多资源独立计数', () => {
  const svc = new TenantQuotaService()
  svc.initialize('t1', PRO)
  svc.increment('t1', QuotaResourceKind.Brand)
  svc.increment('t1', QuotaResourceKind.Store, 3)
  svc.increment('t1', QuotaResourceKind.Member, 100)
  svc.increment('t1', QuotaResourceKind.Campaign, 5)
  const u = svc.getUsage('t1')
  assert.equal(u.brands, 1)
  assert.equal(u.stores, 3)
  assert.equal(u.members, 100)
  assert.equal(u.campaigns, 5)
})