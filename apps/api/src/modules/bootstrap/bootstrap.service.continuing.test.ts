import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * bootstrap.service.continuing.test.ts — BootstrapService 持续测试 (树哥B-圈梁五道箍)
 *
 * 覆盖补充场景 (15+):
 * - registerModule — 正例/边界/重复注册
 * - markRunning — 阶段切换
 * - getHealth — uptime/cpu/memory 字段完整性
 * - getBootstrapMetadata — 不同市场/品牌/门店上下文
 * - getModuleStatuses — 空/单/多
 * - getModuleStatus — 存在/不存在
 * - getSummary — 全 ready/部分 pending
 * - reset — 完全清除
 * - 阶段机: scaffold → initialized → running
 * - 版本文档环境变量
 * - 多模块注册验证
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BootstrapService } from './bootstrap.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── helpers ────────────────────────────────────────────────────
function createContext(
  overrides: Partial<RequestTenantContext> = {}
): RequestTenantContext {
  return {
    tenantId: 'tenant-boot',
    brandId: 'brand-boot',
    storeId: 'store-boot',
    marketCode: 'cn-mainland',
    ...overrides
  }
}

// ═══════════════════════════════════════════════════════════════
// 树哥B — BootstrapService 持续测试
// ═══════════════════════════════════════════════════════════════

describe('BootstrapService — 持续测试 [树哥B-圈梁五道箍]', () => {
  let service: BootstrapService

  beforeEach(() => {
    service = new BootstrapService()
  })

  // ── registerModule ──────────────────────────────────────────

  it('[E01] registerModule 注册模块后 getModuleStatuses 包含对应条目', () => {
    service.registerModule('auth', 'ready', '认证模块就绪')
    const modules = service.getModuleStatuses()
    assert.equal(modules.length, 2) // bootstrap + auth
    const auth = modules.find(m => m.module === 'auth')
    assert.ok(auth)
    assert.equal(auth!.status, 'ready')
    assert.equal(auth!.details, '认证模块就绪')
  })

  it('[E02] registerModule 注册多个模块全部可查询', () => {
    service.registerModule('auth', 'ready')
    service.registerModule('payment', 'pending', '等待数据库连接')
    service.registerModule('order', 'error', '数据库连接失败')
    const modules = service.getModuleStatuses()
    assert.equal(modules.length, 4) // bootstrap + 3
    const order = modules.find(m => m.module === 'order')
    assert.equal(order!.status, 'error')
    assert.equal(order!.details, '数据库连接失败')
  })

  it('[E03] registerModule 重复注册同名模块覆盖旧状态', () => {
    service.registerModule('db', 'pending')
    service.registerModule('db', 'ready', '数据库已连接')
    const db = service.getModuleStatus('db')
    assert.equal(db!.status, 'ready')
    assert.equal(db!.details, '数据库已连接')
  })

  it('[E04] registerModule 不传 details 时 details 为 undefined', () => {
    service.registerModule('no-detail', 'ready')
    const m = service.getModuleStatus('no-detail')
    assert.equal(m!.details, undefined)
  })

  // ── markRunning ──────────────────────────────────────────────

  it('[E05] markRunning 将 phase 改为 running', () => {
    service.markRunning()
    const health = service.getHealth()
    assert.equal(health.phase, 'running')
  })

  // ── getHealth ────────────────────────────────────────────────

  it('[E06] getHealth 返回所有必填字段', () => {
    const h = service.getHealth()
    assert.equal(h.status, 'ok')
    assert.equal(typeof h.uptime, 'number')
    assert.ok(h.uptime >= 0)
    assert.equal(typeof h.phase, 'string')
    assert.equal(typeof h.uptimeReadable, 'string')
    assert.ok(h.uptimeReadable!.length > 0)
  })

  it('[E07] getHealth 返回 cpuUsage 和 memoryUsage 对象', () => {
    const h = service.getHealth()
    assert.ok(h.cpuUsage)
    assert.equal(typeof h.cpuUsage!.user, 'number')
    assert.equal(typeof h.cpuUsage!.system, 'number')
    assert.ok(h.memoryUsage)
    assert.equal(typeof h.memoryUsage!.rss, 'number')
    assert.equal(typeof h.memoryUsage!.heapUsed, 'number')
  })

  it('[E08] markRunning 后 getHealth 反映 running 阶段', () => {
    service.markRunning()
    const h = service.getHealth()
    assert.equal(h.phase, 'running')
  })

  // ── getBootstrapMetadata ─────────────────────────────────────

  it('[E09] getBootstrapMetadata 不同 marketCode 正确传递', () => {
    const ctx = createContext({ marketCode: 'en-global' })
    const meta = service.getBootstrapMetadata(ctx)
    assert.equal(meta.tenantContext.marketCode, 'en-global')
  })

  it('[E10] getBootstrapMetadata 不同 brand/store 正确传递', () => {
    const ctx = createContext({ brandId: 'brand-x', storeId: 'store-y' })
    const meta = service.getBootstrapMetadata(ctx)
    assert.equal(meta.tenantContext.brandId, 'brand-x')
    assert.equal(meta.tenantContext.storeId, 'store-y')
  })

  it('[E11] getBootstrapMetadata phase 反映当前阶段', () => {
    const meta = service.getBootstrapMetadata(createContext())
    assert.equal(meta.phase, 'scaffold')
    service.markRunning()
    const meta2 = service.getBootstrapMetadata(createContext())
    assert.equal(meta2.phase, 'running')
  })

  it('[E12] getBootstrapMetadata foundationDependencies 默认为空数组', () => {
    const meta = service.getBootstrapMetadata(createContext())
    assert.deepEqual(meta.foundationDependencies, [])
  })

  it('[E13] getBootstrapMetadata foundationContracts 为空数组', () => {
    const meta = service.getBootstrapMetadata(createContext())
    assert.deepEqual(meta.foundationContracts, [])
  })

  // ── getModuleStatus ──────────────────────────────────────────

  it('[E14] getModuleStatus 返回 null 当模块未注册', () => {
    const result = service.getModuleStatus('non-existent-module')
    assert.equal(result, null)
  })

  it('[E15] getModuleStatus 返回已注册模块', () => {
    service.registerModule('my-module', 'ready')
    const result = service.getModuleStatus('my-module')
    assert.notEqual(result, null)
    assert.equal(result!.module, 'my-module')
    assert.equal(result!.status, 'ready')
  })

  // ── getSummary ───────────────────────────────────────────────

  it('[E16] getSummary 当所有模块 ready 时 healthy = true', () => {
    service.registerModule('auth', 'ready')
    service.registerModule('db', 'ready')
    const summary = service.getSummary()
    assert.equal(summary.healthy, true)
  })

  it('[E17] getSummary 当有模块非 ready 时 healthy = false', () => {
    service.registerModule('auth', 'ready')
    service.registerModule('db', 'pending')
    const summary = service.getSummary()
    assert.equal(summary.healthy, false)
  })

  it('[E18] getSummary 返回 version 和 initializedAt', () => {
    const summary = service.getSummary()
    assert.ok(summary.initializedAt)
    assert.equal(typeof summary.version, 'string')
  })

  // ── reset ────────────────────────────────────────────────────

  it('[E19] reset 清空模块并回退阶段', () => {
    service.registerModule('auth', 'ready')
    service.markRunning()
    service.reset()
    // reset 后阶段为 initialized (clear + register bootstrap + set phase)
    const health = service.getHealth()
    assert.equal(health.phase, 'initialized')
    const modules = service.getModuleStatuses()
    assert.equal(modules.length, 1) // bootstrap 只有自身
    assert.equal(modules[0]!.module, 'bootstrap')
  })

  it('[E20] reset 后可以重新注册模块', () => {
    service.registerModule('old', 'ready')
    service.reset()
    service.registerModule('new', 'ready')
    const modules = service.getModuleStatuses()
    assert.equal(modules.length, 2) // bootstrap + new
    assert.ok(modules.some(m => m.module === 'new'))
    assert.ok(!modules.some(m => m.module === 'old'))
  })

  // ── 阶段机 ────────────────────────────────────────────────────

  it('[E21] 初始阶段为 scaffold', () => {
    assert.equal(service.getHealth().phase, 'scaffold')
  })

  it('[E22] 构造后 bootstrap 模块已注册为 ready', () => {
    const boot = service.getModuleStatus('bootstrap')
    assert.ok(boot)
    assert.equal(boot!.status, 'ready')
  })

  // ── 边界条件 ────────────────────────────────────────────────

  it('[E23] getSummary uptime 为非负数', () => {
    const summary = service.getSummary()
    assert.equal(typeof summary.uptime, 'number')
    assert.ok(summary.uptime >= 0)
  })

  it('[E24] getSummary modules 包含 bootstrap', () => {
    const summary = service.getSummary()
    assert.ok(summary.modules.some(m => m.module === 'bootstrap'))
  })

  it('[E25] 环境变量 NODE_ENV 为空时使用 development', () => {
    // 临时清空 NODE_ENV
    const orig = process.env.NODE_ENV
    delete process.env.NODE_ENV
    const meta = service.getBootstrapMetadata(createContext())
    assert.equal(meta.environment, 'development')
    process.env.NODE_ENV = orig
  })
})
