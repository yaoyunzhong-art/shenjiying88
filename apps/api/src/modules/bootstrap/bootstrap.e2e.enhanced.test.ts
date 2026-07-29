/**
 * Bootstrap E2E 增强测试
 *
 * 扩充已有 11 个测试到 25+，覆盖：
 *   - registerModule / getModuleStatus / getModuleStatuses
 *   - markRunning / phase 状态转换
 *   - getSummary 健康汇总
 *   - reset 重置行为
 *   - getHealth 完整响应字段 (cpuUsage, memoryUsage, initializedAt)
 *   - getBootstrapMetadata 完整响应字段 (version, environment)
 *   - 边界条件 / 异常输入
 *   - 空/极限数据场景
 *   - 幂等性测试
 *   - 状态机转换测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BootstrapService } from './bootstrap.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ========== helpers ==========

function makeTenantContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    ...overrides,
  }
}

describe('Bootstrap E2E Enhanced', () => {
  let svc: BootstrapService

  beforeEach(() => {
    svc = new BootstrapService()
  })

  // ═══════════════════════════════════════════════════════════════════
  // registerModule / getModuleStatus / getModuleStatuses
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: registerModule with status=ready stores the module', () => {
    svc.registerModule('database', 'ready', 'MySQL 已连接')
    const status = svc.getModuleStatus('database')
    expect(status).not.toBeNull()
    expect(status!.module).toBe('database')
    expect(status!.status).toBe('ready')
    expect(status!.details).toBe('MySQL 已连接')
  })

  it('e2e: registerModule with status=pending stores pending state', () => {
    svc.registerModule('redis', 'pending', '正在连接 Redis 集群')
    const status = svc.getModuleStatus('redis')
    expect(status!.status).toBe('pending')
    expect(status!.details).toBe('正在连接 Redis 集群')
  })

  it('e2e: registerModule with status=error stores error state', () => {
    svc.registerModule('elasticsearch', 'error', '连接超时')
    const status = svc.getModuleStatus('elasticsearch')
    expect(status!.status).toBe('error')
    expect(status!.details).toBe('连接超时')
  })

  it('e2e: registerModule without details stores undefined details', () => {
    svc.registerModule('cache', 'ready')
    const status = svc.getModuleStatus('cache')
    expect(status!.module).toBe('cache')
    expect(status!.details).toBeUndefined()
  })

  it('e2e: registerModule re-registering overwrites previous state', () => {
    svc.registerModule('worker', 'pending', '启动中')
    svc.registerModule('worker', 'ready', '就绪')
    const status = svc.getModuleStatus('worker')
    expect(status!.status).toBe('ready')
    expect(status!.details).toBe('就绪')
  })

  it('e2e: getModuleStatus returns null for unknown module', () => {
    const status = svc.getModuleStatus('nonexistent')
    expect(status).toBeNull()
  })

  it('e2e: getModuleStatuses returns all registered modules including constructor default', () => {
    svc.registerModule('auth', 'ready')
    svc.registerModule('billing', 'pending')
    const all = svc.getModuleStatuses()
    // bootstrap is registered in constructor, plus auth, billing
    expect(all.length).toBe(3)
    expect(all.map(m => m.module)).toContain('bootstrap')
    expect(all.map(m => m.module)).toContain('auth')
    expect(all.map(m => m.module)).toContain('billing')
  })

  it('e2e: getModuleStatuses returns only modules registered so far', () => {
    const all = svc.getModuleStatuses()
    expect(all.length).toBe(1)
    expect(all[0].module).toBe('bootstrap')
  })

  // ═══════════════════════════════════════════════════════════════════
  // markRunning / phase state transitions
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: initial phase is scaffold', () => {
    const health = svc.getHealth()
    expect(health.phase).toBe('scaffold')
  })

  it('e2e: markRunning transitions phase to running', () => {
    svc.markRunning()
    const health = svc.getHealth()
    expect(health.phase).toBe('running')
  })

  it('e2e: phase transitions are reflected in getBootstrapMetadata', () => {
    expect(svc.getBootstrapMetadata(makeTenantContext()).phase).toBe('scaffold')
    svc.markRunning()
    expect(svc.getBootstrapMetadata(makeTenantContext()).phase).toBe('running')
  })

  it('e2e: phase transitions are reflected in getSummary', () => {
    const before = svc.getSummary()
    expect(before.phase).toBe('scaffold')
    svc.markRunning()
    const after = svc.getSummary()
    expect(after.phase).toBe('running')
  })

  // ═══════════════════════════════════════════════════════════════════
  // getSummary — 健康汇总
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: getSummary returns healthy=true when all modules ready', () => {
    const summary = svc.getSummary()
    expect(summary.healthy).toBe(true)
  })

  it('e2e: getSummary returns healthy=false when any module is pending', () => {
    svc.registerModule('cache', 'pending', '启动中')
    const summary = svc.getSummary()
    expect(summary.healthy).toBe(false)
  })

  it('e2e: getSummary returns healthy=false when any module is error', () => {
    svc.registerModule('queue', 'error', 'Broker 不可达')
    const summary = svc.getSummary()
    expect(summary.healthy).toBe(false)
  })

  it('e2e: getSummary includes version info', () => {
    const summary = svc.getSummary()
    expect(summary.version).toBeDefined()
    expect(typeof summary.version).toBe('string')
  })

  it('e2e: getSummary includes initializedAt', () => {
    const summary = svc.getSummary()
    expect(summary.initializedAt).toBeDefined()
    expect(typeof summary.initializedAt).toBe('string')
  })

  it('e2e: getSummary uptime increases over time', async () => {
    const s1 = svc.getSummary()
    await new Promise(r => setTimeout(r, 5))
    const s2 = svc.getSummary()
    expect(s2.uptime).toBeGreaterThanOrEqual(s1.uptime)
  })

  // ═══════════════════════════════════════════════════════════════════
  // reset — 重置行为
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: reset clears all module registrations except bootstrap', () => {
    svc.registerModule('auth', 'ready')
    svc.registerModule('db', 'ready')
    svc.reset()
    const modules = svc.getModuleStatuses()
    expect(modules.length).toBe(1)
    expect(modules[0].module).toBe('bootstrap')
    expect(modules[0].details).toBe('已重置')
  })

  it('e2e: reset changes phase to initialized', () => {
    svc.markRunning()
    svc.reset()
    const health = svc.getHealth()
    expect(health.phase).toBe('initialized')
  })

  it('e2e: after reset, getSummary still reports healthy', () => {
    svc.registerModule('worker', 'error')
    svc.reset()
    const summary = svc.getSummary()
    expect(summary.healthy).toBe(true)
    expect(summary.phase).toBe('initialized')
  })

  // ═══════════════════════════════════════════════════════════════════
  // getHealth — 完整响应字段
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: getHealth includes initializedAt', () => {
    const health = svc.getHealth()
    expect(health.initializedAt).toBeDefined()
    expect(health.initializedAt!.length).toBeGreaterThan(0)
  })

  it('e2e: getHealth includes uptimeReadable', () => {
    const health = svc.getHealth()
    expect(typeof health.uptimeReadable).toBe('string')
    expect(health.uptimeReadable).toMatch(/\d+h\d+m\d+s/)
  })

  it('e2e: getHealth includes cpuUsage', () => {
    const health = svc.getHealth()
    expect(health.cpuUsage).toBeDefined()
    expect(health.cpuUsage!.user).toBeGreaterThanOrEqual(0)
  })

  it('e2e: getHealth includes memoryUsage', () => {
    const health = svc.getHealth()
    expect(health.memoryUsage).toBeDefined()
    expect(health.memoryUsage!.rss).toBeGreaterThan(0)
  })

  // ═══════════════════════════════════════════════════════════════════
  // getBootstrapMetadata — 完整响应字段 & 边界
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: getBootstrapMetadata returns version field', () => {
    const meta = svc.getBootstrapMetadata(makeTenantContext())
    expect(meta.version).toBeDefined()
    expect(typeof meta.version).toBe('string')
  })

  it('e2e: getBootstrapMetadata returns environment field', () => {
    const meta = svc.getBootstrapMetadata(makeTenantContext())
    expect(meta.environment).toBeDefined()
    expect(typeof meta.environment).toBe('string')
  })

  it('e2e: getBootstrapMetadata returns startedAt', () => {
    const meta = svc.getBootstrapMetadata(makeTenantContext())
    expect(meta.startedAt).toBeDefined()
    expect(meta.startedAt!.length).toBeGreaterThan(0)
  })

  it('e2e: getBootstrapMetadata returns empty foundationDependencies array', () => {
    const meta = svc.getBootstrapMetadata(makeTenantContext())
    expect(meta.foundationDependencies).toEqual([])
  })

  it('e2e: getBootstrapMetadata returns empty foundationContracts array', () => {
    const meta = svc.getBootstrapMetadata(makeTenantContext())
    expect(meta.foundationContracts).toEqual([])
  })

  // ═══════════════════════════════════════════════════════════════════
  // 边界条件 — 租户上下文
  // ═══════════════════════════════════════════════════════════════════

  it('e2e: getBootstrapMetadata with all empty strings in context still works', () => {
    const ctx = makeTenantContext({ tenantId: '', brandId: '', storeId: '', marketCode: '' })
    const meta = svc.getBootstrapMetadata(ctx)
    expect(meta.tenantContext.tenantId).toBe('')
    expect(meta.tenantContext.brandId).toBe('')
    expect(meta.phase).toBe('scaffold')
  })

  it('e2e: getBootstrapMetadata with very long tenantId', () => {
    const longId = 't'.repeat(1000)
    const ctx = makeTenantContext({ tenantId: longId })
    const meta = svc.getBootstrapMetadata(ctx)
    expect(meta.tenantContext.tenantId).toBe(longId)
    expect(meta.tenantContext.tenantId.length).toBe(1000)
  })

  it('e2e: multiple independent service instances do not share state', () => {
    const svcA = new BootstrapService()
    const svcB = new BootstrapService()
    svcA.registerModule('module-a', 'ready')
    svcB.registerModule('module-b', 'error')
    expect(svcA.getModuleStatus('module-a')).not.toBeNull()
    expect(svcA.getModuleStatus('module-b')).toBeNull()
    expect(svcB.getModuleStatus('module-a')).toBeNull()
    expect(svcB.getModuleStatus('module-b')).not.toBeNull()
  })

  it('e2e: registerModule with empty module name', () => {
    svc.registerModule('', 'ready')
    const status = svc.getModuleStatus('')
    expect(status).not.toBeNull()
    expect(status!.module).toBe('')
  })

  it('e2e: registerModule with very long module name', () => {
    const longName = 'x'.repeat(500)
    svc.registerModule(longName, 'ready')
    const status = svc.getModuleStatus(longName)
    expect(status!.module).toBe(longName)
  })

  it('e2e: getHealth callable multiple times returns consistent structure', () => {
    for (let i = 0; i < 10; i++) {
      const h = svc.getHealth()
      expect(h.status).toBe('ok')
      expect(h.uptime).toBeGreaterThan(0)
    }
  })

  it('e2e: getSummary callable multiple times returns consistent structure', () => {
    for (let i = 0; i < 10; i++) {
      const s = svc.getSummary()
      expect('healthy' in s).toBe(true)
      expect('modules' in s).toBe(true)
    }
  })
})
