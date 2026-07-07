import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [shared] [D] view-model.service 测试补全
 * 覆盖 ViewModelService 三层防御: tenantId 校验 / 跨租户检测 / 正常数据流
 *
 * 8 角色视角:
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界)
 */
import assert from 'node:assert/strict'

// ── Mocks ──
class MockAgentService {
  configs = new Map<string, any>()
  sessions = new Map<string, any>()
  evaluations: any[] = []

  getConfig(id: string) { return this.configs.get(id) ?? null }
  getConfigs(tenantId: string) { return [...this.configs.values()].filter(c => c.tenantId === tenantId) }
  getSession(id: string) { return this.sessions.get(id) ?? null }
  getSessions(tenantId: string) { return [...this.sessions.values()].filter(s => s.tenantId === tenantId) }
  getEvaluations(tenantId: string) { return this.evaluations.filter(e => e.tenantId === tenantId) }
  getStats(tenantId: string) { return { totalSessions: this.sessions.size, totalConfigs: this.configs.size } }
}

class MockEventStoreService {
  events = new Map<string, any[]>()
  sessionTenants = new Map<string, string>()

  async persist(sessionId: string, event: any, tenantId: string) {
    let list = this.events.get(sessionId)
    if (!list) { list = []; this.events.set(sessionId, list) }
    list.push(event)
    this.sessionTenants.set(sessionId, tenantId)
  }
  async getSessionHistory(sessionId: string, _limit = 1000, tenantId?: string) {
    if (tenantId && this.sessionTenants.get(sessionId) !== tenantId) return []
    return [...(this.events.get(sessionId) ?? [])]
  }
  has(sessionId: string) { return this.events.has(sessionId) }
}

class MockEventBufferService {
  store = new Map<string, any[]>()

  async replayAfterAsync(sessionId: string, lastEventId: number | string, _tenantId?: string) {
    const events = this.store.get(sessionId) ?? []
    const lastNum = typeof lastEventId === 'string' ? parseInt(lastEventId, 10) : lastEventId
    const filtered = events.filter((e: any) => e.id > lastNum)
    return { events: filtered, lastValidId: 0, found: filtered.length > 0 }
  }
}

/**
 * Helper: 由于 NestJS ForbiddenException 将对象包装在 response 中,
 * 我们用 getResponse() 或 response 字段来获取实际 error 对象
 */
function errHasError(err: any, expected: string): boolean {
  const resp = err.response ?? err.getResponse?.()
  return resp?.error === expected
}

describe('ViewModelService', async () => {
  const { ViewModelService } = await import('./view-model.service')
  let service: InstanceType<typeof ViewModelService>
  let agentService: MockAgentService
  let eventStore: MockEventStoreService
  let eventBuffer: MockEventBufferService

  beforeEach(async () => {
    const { AuditService } = await import('./audit.service')
    agentService = new MockAgentService()
    eventStore = new MockEventStoreService()
    eventBuffer = new MockEventBufferService()
    const audit = new AuditService()

    service = new ViewModelService(
      agentService as any,
      eventStore as any,
      eventBuffer as any,
      audit as any
    )
  })

  // ════════════════════════════════════════════════════════════
  // 👔 店长 (StoreManager) — 租户级配置管理
  // ════════════════════════════════════════════════════════════
  describe('👔 店长 — AgentConfig', () => {
    it('正常: 获取指定配置 — 同租户返回数据', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1', name: 'my-config' })
      const result = await service.getAgentConfig('cfg-1', 't1')
      assert.notEqual(result, null)
      assert.equal(result?.name, 'my-config')
    })

    it('边界: 获取不存在的配置 — 返回 null', async () => {
      const result = await service.getAgentConfig('nonexistent', 't1')
      assert.equal(result, null)
    })

    it('安全: 跨租户访问配置 — 抛 ForbiddenException', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1', name: 'secret' })
      await assert.rejects(
        () => service.getAgentConfig('cfg-1', 't2'),
        (err: any) => errHasError(err, 'cross_tenant_access_denied')
      )
    })

    it('正常: 列表查询 — 仅返回当前租户配置', async () => {
      agentService.configs.set('c1', { id: 'c1', tenantId: 't1' })
      agentService.configs.set('c2', { id: 'c2', tenantId: 't1' })
      agentService.configs.set('c3', { id: 'c3', tenantId: 't2' })
      const list = await service.listAgentConfigs('t1')
      assert.equal(list.length, 2)
    })

    it('边界: 无配置时返回空数组', async () => {
      const list = await service.listAgentConfigs('t1')
      assert.deepEqual(list, [])
    })
  })

  // ════════════════════════════════════════════════════════════
  // 🛒 前台 (FrontDesk) — Session 操作
  // ════════════════════════════════════════════════════════════
  describe('🛒 前台 — AgentSession', () => {
    it('正常: 获取指定 session — 同租户可用', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1', userId: 'u1' })
      const sess: any = await service.getSession('s-1', 't1')
      assert.notEqual(sess, null)
      assert.equal(sess?.userId, 'u1')
    })

    it('安全: 跨租户访问 session — 抛 ForbiddenException', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1' })
      await assert.rejects(
        () => service.getSession('s-1', 't2'),
        (err: any) => errHasError(err, 'cross_tenant_access_denied')
      )
    })

    it('正常: 列表查询 — 仅当前租户', async () => {
      agentService.sessions.set('s1', { id: 's1', tenantId: 't1' })
      agentService.sessions.set('s2', { id: 's2', tenantId: 't1' })
      agentService.sessions.set('s3', { id: 's3', tenantId: 't2' })
      const list = await service.listSessions('t1')
      assert.equal(list.length, 2)
    })

    it('边界: 不存在的 session — 返回 null', async () => {
      const sess = await service.getSession('nonexistent', 't1')
      assert.equal(sess, null)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 👥 HR — Session 事件历史 (EventStore)
  // ════════════════════════════════════════════════════════════
  describe('👥 HR — Session 事件历史', () => {
    it('正常: 获取 session 事件历史', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1' })
      await eventStore.persist('s-1', { id: 1, type: 'USER_MESSAGE' }, 't1')
      await eventStore.persist('s-1', { id: 2, type: 'AI_REPLY' }, 't1')

      const events = await service.getSessionHistory('s-1', 't1')
      assert.equal(events.length, 2)
      assert.equal(events[0].type, 'USER_MESSAGE')
    })

    it('安全: 跨租户获取事件历史 — 抛 ForbiddenException', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1' })

      await assert.rejects(
        () => service.getSessionHistory('s-1', 't2'),
        (err: any) => errHasError(err, 'cross_tenant_access_denied')
      )
    })

    it('边界: session 不存在时返回空数组', async () => {
      const events = await service.getSessionHistory('nonexistent', 't1')
      assert.deepEqual(events, [])
    })

    it('边界: tenantId 为空时抛 ForbiddenException', async () => {
      await assert.rejects(
        () => service.getSessionHistory('s-1', ''),
        (err: any) => errHasError(err, 'missing_tenant_id')
      )
    })
  })

  // ════════════════════════════════════════════════════════════
  // 🔧 安监 (Security) — 断连 replay + 跨租户安全
  // ════════════════════════════════════════════════════════════
  describe('🔧 安监 — Session replay', () => {
    it('正常: replayAfter — 返回 lastEventId 之后的事件', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1' })
      eventBuffer.store.set('s-1', [
        { id: 1, type: 'M1' },
        { id: 2, type: 'M2' },
        { id: 3, type: 'M3' },
      ])

      const result = await service.replaySessionEvents('s-1', 1, 't1')
      assert.equal(result.events.length, 2)
      assert.equal(result.events[0].type, 'M2')
    })

    it('安全: 跨租户 replay — 抛 ForbiddenException', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1' })
      await assert.rejects(
        () => service.replaySessionEvents('s-1', 0, 't2'),
        (err: any) => errHasError(err, 'cross_tenant_access_denied')
      )
    })

    it('边界: session 不存在时抛异常', async () => {
      await assert.rejects(
        () => service.replaySessionEvents('nonexistent', 0, 't1'),
        (err: any) => errHasError(err, 'cross_tenant_access_denied')
      )
    })

    it('正常: 无新事件时返回空数组', async () => {
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1' })
      eventBuffer.store.set('s-1', [{ id: 1, type: 'M1' }])

      const result = await service.replaySessionEvents('s-1', 1, 't1')
      assert.equal(result.events.length, 0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 🎮 导玩员 (Guide) — QualityEvaluation 查询
  // ════════════════════════════════════════════════════════════
  describe('🎮 导玩员 — QualityEvaluation', () => {
    it('正常: 取指定 evaluation', async () => {
      agentService.evaluations.push({ id: 'e1', tenantId: 't1', score: 85 })
      agentService.evaluations.push({ id: 'e2', tenantId: 't1', score: 92 })

      const ev: any = await service.getEvaluation('e1', 't1')
      assert.notEqual(ev, null)
      assert.equal(ev?.score, 85)
    })

    it('边界: evaluation 不存在返回 null', async () => {
      const ev = await service.getEvaluation('nonexistent', 't1')
      assert.equal(ev, null)
    })

    it('正常: 列表查询', async () => {
      agentService.evaluations.push({ id: 'e1', tenantId: 't1', score: 85 })
      agentService.evaluations.push({ id: 'e2', tenantId: 't1', score: 92 })
      agentService.evaluations.push({ id: 'e3', tenantId: 't2', score: 70 })

      const list = await service.listEvaluations('t1')
      assert.equal(list.length, 2)
    })

    it('边界: 无 evaluation 时返回空', async () => {
      const list = await service.listEvaluations('t1')
      assert.deepEqual(list, [])
    })
  })

  // ════════════════════════════════════════════════════════════
  // 🎯 运行专员 (Operations) — Stats 聚合
  // ════════════════════════════════════════════════════════════
  describe('🎯 运行专员 — Stats', () => {
    it('正常: 获取 stats', async () => {
      agentService.sessions.set('s1', { id: 's1', tenantId: 't1' })
      agentService.configs.set('c1', { id: 'c1', tenantId: 't1' })
      const stats: any = await service.getStats('t1')
      assert.equal(stats.totalSessions, 1)
      assert.equal(stats.totalConfigs, 1)
    })

    it('边界: 无数据时 stats 为零', async () => {
      const stats: any = await service.getStats('t1')
      assert.equal(stats.totalSessions, 0)
      assert.equal(stats.totalConfigs, 0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 🤝 团建 (Teambuilding) — Audit 日志
  // ════════════════════════════════════════════════════════════
  describe('🤝 团建 — Audit 日志', () => {
    it('正常: 获取 audit 日志 — 按租户过滤', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1' })
      await assert.rejects(
        () => service.getAgentConfig('cfg-1', 't2'),
        (err: any) => true
      )

      const logs = await service.getAuditLog('t2')
      assert.equal(logs.length, 1)
      assert.equal(logs[0].action, 'cross_tenant_access_attempt')
    })

    it('正常: since 过滤 — 用 5 分钟前确保捕获', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1' })
      await assert.rejects(
        () => service.getAgentConfig('cfg-1', 't2'),
        (err: any) => true
      )

      const past = new Date(Date.now() - 5 * 60 * 1000)
      const logs = await service.getAuditLog('t2', past)
      assert.equal(logs.length, 1)
    })

    it('边界: 无日志时返回空', async () => {
      const logs = await service.getAuditLog('t1')
      assert.deepEqual(logs, [])
    })

    it('安全: 跨租户审计日志隔离', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1' })
      await assert.rejects(
        () => service.getAgentConfig('cfg-1', 't2'),
        (err: any) => true
      )

      const logsT3 = await service.getAuditLog('t3')
      assert.equal(logsT3.length, 0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 📢 营销 (Marketing) — 完整流程 & 多层防御
  // ════════════════════════════════════════════════════════════
  describe('📢 营销 — 完整流程 & 多层防御', () => {
    it('完整流程: 配置 → session → 事件历史 — 全部同租户成功', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1', name: 'marketing-bot' })
      const config = await service.getAgentConfig('cfg-1', 't1')
      assert.equal(config?.name, 'marketing-bot')

      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1', userId: 'u1' })
      const sess = await service.getSession('s-1', 't1')
      assert.notEqual(sess, null)

      await eventStore.persist('s-1', { id: 1, type: 'USER_MESSAGE', text: 'hello' }, 't1')
      const events = await service.getSessionHistory('s-1', 't1')
      assert.equal(events.length, 1)
    })

    it('多层防御: 跨租户访问 → 403 + 审计记录', async () => {
      agentService.configs.set('cfg-1', { id: 'cfg-1', tenantId: 't1', name: 'secret' })
      agentService.sessions.set('s-1', { id: 's-1', tenantId: 't1', userId: 'u1' })

      await assert.rejects(
        () => service.getAgentConfig('cfg-1', 't2'),
        (err: any) => errHasError(err, 'cross_tenant_access_denied')
      )

      const logs = await service.getAuditLog('t2')
      assert.equal(logs.length, 1)
      assert.equal(logs[0].actor, 'view-model-service')
    })

    it('防御: tenantId 缺省 — 所有接口抛 ForbiddenException', async () => {
      const emptyCases: [string, () => Promise<any>][] = [
        ['getSession', () => service.getSession('s-1', '')],
        ['listSessions', () => service.listSessions('')],
        ['getAgentConfig', () => service.getAgentConfig('c', '')],
        ['listAgentConfigs', () => service.listAgentConfigs('')],
        ['getEvaluation', () => service.getEvaluation('e', '')],
        ['listEvaluations', () => service.listEvaluations('')],
        ['getStats', () => service.getStats('')],
      ]
      let passed = 0
      for (const [name, fn] of emptyCases) {
        try {
          await fn()
          assert.fail(`${name} should have thrown`)
        } catch (err: any) {
          if (errHasError(err, 'missing_tenant_id')) passed++
        }
      }
      assert.equal(passed, emptyCases.length, `Expected ${emptyCases.length} to pass, got ${passed}`)
    })

    it('防御: undefined tenantId 全部抛 ForbiddenException', async () => {
      const undefCases: [string, () => Promise<any>][] = [
        ['getSession', () => service.getSession('s-1', undefined as any)],
        ['listSessions', () => service.listSessions(undefined as any)],
        ['getStats', () => service.getStats(undefined as any)],
      ]
      let passed = 0
      for (const [name, fn] of undefCases) {
        try {
          await fn()
          assert.fail(`${name} should have thrown`)
        } catch (err: any) {
          if (errHasError(err, 'missing_tenant_id')) passed++
        }
      }
      assert.equal(passed, undefCases.length, `Expected ${undefCases.length} to pass, got ${passed}`)
    })

    it('正常: listAgentConfigs 返回空数组时非 null', async () => {
      const list = await service.listAgentConfigs('t1')
      assert.ok(Array.isArray(list))
      assert.equal(list.length, 0)
    })

    it('正常: listEvaluations 返回空数组时非 null', async () => {
      const list = await service.listEvaluations('t1')
      assert.ok(Array.isArray(list))
      assert.equal(list.length, 0)
    })
  })
})
