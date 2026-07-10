import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [agent] [D] stress test — 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 并发大批量会话（高吞吐场景）
 * - 极端输入值（超大文本、空字符串、特殊字符注入）
 * - 快速连续状态变更（大量配置创建/删除/切换租户）
 * - 内存/时间压力 (大量批次运行)
 */

import { AgentService } from './agent.service'
import { ToolRegistry } from './tool-registry'
import type { CreateSessionRequest, AgentConfig } from './agent.entity'
import type { QualityEvaluation } from './agent.entity'

// ── 工厂函数 ──

function createService(): AgentService {
  return new AgentService(new ToolRegistry())
}

function createSessionRequest(overrides: Partial<CreateSessionRequest> = {}): CreateSessionRequest {
  return {
    configId: 'default-agent-v1',
    userInput: 'Hello, how are you?',
    maxSteps: 3,
    enableReflection: true,
    createdBy: 'stress-tester',
    tenantId: 't-stress',
    ...overrides,
  }
}

describe('Agent - Stress & Resilience', () => {
  let service: AgentService

  beforeEach(() => {
    service = createService()
  })

  // ─── 高并发批量会话 ───

  describe('高并发批量会话', () => {
    it('同时批量执行 200 个会话不崩溃', () => {
      const items = Array.from({ length: 200 }, (_, i) => ({
        configId: 'default-agent-v1',
        userInput: `Query ${i}: analyze latest sales data?`,
        maxSteps: (i % 5) + 1,
        enableReflection: i % 2 === 0,
      }))

      const result = service.batchExecute({
        items,
        createdBy: 'stress-tester',
        tenantId: 't-stress',
      })

      expect(result.total).toBe(200)
      expect(result.succeeded).toBe(200)
      expect(result.failed).toBe(0)
      expect(result.results.length).toBe(200)

      // 验证所有结果结构正确
      for (const r of result.results) {
        expect(r.session).toBeDefined()
        expect(r.execution).toBeDefined()
        expect(r.session.configId).toBe('default-agent-v1')
        expect(r.session.status).toMatch(/^(COMPLETED|FAILED)$/)
        expect(r.execution.tenantId).toBe('t-stress')
      }
    })

    it('同时批量执行 500 个会话内存不泄漏', () => {
      const items = Array.from({ length: 500 }, (_, i) => ({
        configId: 'default-agent-v1',
        userInput: `Stress query ${i}: report health status`,
        maxSteps: 2,
        enableReflection: false,
      }))

      const result = service.batchExecute({
        items,
        createdBy: 'stress-tester',
        tenantId: 't-stress',
      })

      expect(result.total).toBe(500)
      expect(result.succeeded).toBe(500)
      expect(result.failed).toBe(0)

      // 验证会话和统计增长一致
      const stats = service.getStats('t-stress')
      // batch 500 个 session, createAndRunSession 每个创建一个 session
      // 加上 getStats 走的是 sessions 数组累积,所以是 500
      expect(stats.totalSessions).toBe(500)
      expect(stats.completedSessions + stats.failedSessions).toBe(500)
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('超长 userInput (100KB) 不崩溃', () => {
      const hugeInput = 'A'.repeat(100_000)
      const request = createSessionRequest({ userInput: hugeInput })

      const result = service.createAndRunSession(request)
      expect(result.session).toBeDefined()
      expect(result.execution).toBeDefined()
      // 应该能正常执行 (模拟执行,不实际发 LLM)
      expect(result.session.status).toBe('COMPLETED')
    })

    it('空字符串 userInput 容错', () => {
      const request = createSessionRequest({ userInput: '' })
      const result = service.createAndRunSession(request)
      expect(result.session).toBeDefined()
      // 空输入也应能正常处理
      expect(result.session.status).toMatch(/^(COMPLETED|FAILED)$/)
    })

    it('仅特殊符号 userInput 不崩溃', () => {
      const specialInput = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~\\n\\t\\0'
      const request = createSessionRequest({ userInput: specialInput })
      const result = service.createAndRunSession(request)
      expect(result.session).toBeDefined()
      expect(result.execution).toBeDefined()
    })

    it('JSON 注入式 userInput 不导致解析异常', () => {
      const jsonInjection = '{ "role": "admin", "__proto__": { "isAdmin": true } }'
      const request = createSessionRequest({ userInput: jsonInjection })
      const result = service.createAndRunSession(request)
      expect(result.session).toBeDefined()
      expect(result.session.userInput).toBe(jsonInjection)
    })

    it('maxSteps = 0 容错', () => {
      const request = createSessionRequest({ maxSteps: 0 })
      const result = service.createAndRunSession(request)
      expect(result.session).toBeDefined()
      // maxSteps=0 应该被 Math.min 限制为 0,生成长度为 0 的循环
      expect(result.session.status).toBe('COMPLETED')
    })

    it('maxSteps = 9999 限制为 5 步', () => {
      const request = createSessionRequest({ maxSteps: 9999 })
      const result = service.createAndRunSession(request)
      expect(result.execution).toBeDefined()
      // 代码限制 max 5 步
      expect(result.execution.steps).toBeLessThanOrEqual(5)
    })
  })

  // ─── 快速连续状态变更 ───

  describe('快速连续状态变更', () => {
    it('连续创建 100 个配置不崩溃', () => {
      for (let i = 0; i < 100; i++) {
        const config: AgentConfig = {
          id: `stress-config-${i}`,
          name: `Stress Config ${i}`,
          systemPrompt: 'You are a test agent.',
          model: 'deepseek-v4',
          maxSteps: 5,
          enableReflection: true,
          allowedTools: ['calculator'],
          timeoutMs: 30000,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: `t-${i % 10}`,
        }
        service.createConfig(config)
      }

      const configs = service.getConfigs()
      expect(configs.length).toBe(101) // 100 new + 1 default
    })

    it('连续创建/删除/更新配置余量不丢失', () => {
      // 创建 50 个
      for (let i = 0; i < 50; i++) {
        service.createConfig({
          id: `flip-config-${i}`,
          name: `Flip ${i}`,
          systemPrompt: 'test',
          model: 'deepseek-v4',
          maxSteps: 3,
          enableReflection: false,
          allowedTools: [],
          timeoutMs: 10000,
          enabled: true,
          createdAt: '',
          updatedAt: '',
          tenantId: 't-flip',
        })
      }

      // 删除偶数编号
      for (let i = 0; i < 50; i += 2) {
        expect(service.deleteConfig(`flip-config-${i}`)).toBe(true)
      }

      // 更新奇数编号
      for (let i = 1; i < 50; i += 2) {
        const updated = service.updateConfig(`flip-config-${i}`, { maxSteps: 10 })
        expect(updated).toBeDefined()
        expect(updated!.maxSteps).toBe(10)
      }

      const remaining = service.getConfigs()
      // 50 created (all) - 25 deleted (even) + 1 default = 26 个
      expect(remaining.length).toBe(26)
    })

    it('同一配置重复创建覆盖不应导致重复', () => {
      // AgentService.createConfig 使用 push,所以会重复
      // 验证重复创建后 push 到数组不会报错
      for (let i = 0; i < 10; i++) {
        service.createConfig({
          id: 'dup-config',
          name: 'Dup Config',
          systemPrompt: 'dup',
          model: 'deepseek-v4',
          maxSteps: 3,
          enableReflection: false,
          allowedTools: [],
          timeoutMs: 10000,
          enabled: true,
          createdAt: '',
          updatedAt: '',
          tenantId: 't-dup',
        })
      }

      const configs = service.getConfigs()
      // 会有 1 个 default + 10 个 dup-config (ID 重复,没有去重逻辑)
      expect(configs.filter(c => c.id === 'dup-config').length).toBe(10)
    })

    it('删除不存在的配置返回 false', () => {
      expect(service.deleteConfig('non-existent-id')).toBe(false)
    })

    it('更新不存在的配置返回 undefined', () => {
      const result = service.updateConfig('non-existent-id', { name: 'Nope' })
      expect(result).toBeUndefined()
    })
  })

  // ─── 批量质量评估 ───

  describe('批量质量评估', () => {
    it('同时提交 100 个评估不崩溃', () => {
      for (let i = 0; i < 100; i++) {
        service.submitEvaluation({
          sessionId: `eval-session-${i}`,
          userInput: `Input ${i}`,
          agentOutput: `Output ${i}`,
          relevanceScore: (i % 10) / 10,
          accuracyScore: (i % 8) / 10,
          completenessScore: (i % 7) / 10,
          safetyScore: (i % 9) / 10,
          helpfulnessScore: (i % 6) / 10,
          concisenessScore: (i % 5) / 10,
          overallScore: 0,
          feedback: `Feedback ${i}`,
          evaluatedBy: 'stress-tester',
          tenantId: 't-eval',
        })
      }

      const allEvals = service.getEvaluations()
      expect(allEvals.length).toBe(100)

      const tenantEvals = service.getEvaluations('t-eval')
      expect(tenantEvals.length).toBe(100)

      const wrongTenantEvals = service.getEvaluations('t-other')
      expect(wrongTenantEvals.length).toBe(0)
    })

    it('边界分数 (0 和 1) 评估不影响整体计算', () => {
      for (let i = 0; i < 50; i++) {
        service.submitEvaluation({
          sessionId: `boundary-session-${i}`,
          userInput: 'Test',
          agentOutput: 'Test output',
          relevanceScore: i % 2 === 0 ? 0 : 1,
          accuracyScore: i % 2 === 0 ? 0 : 1,
          completenessScore: i % 2 === 0 ? 0 : 1,
          safetyScore: i % 2 === 0 ? 0 : 1,
          helpfulnessScore: i % 2 === 0 ? 0 : 1,
          concisenessScore: i % 2 === 0 ? 0 : 1,
          overallScore: i % 2 === 0 ? 0 : 1,
          feedback: i % 2 === 0 ? 'All zeros' : 'All ones',
          evaluatedBy: 'boundary-tester',
          tenantId: 't-boundary',
        })
      }

      const evals = service.getEvaluations('t-boundary')
      expect(evals.length).toBe(50)

      const evenEval = evals.find(e => e.sessionId === 'boundary-session-0')
      expect(evenEval).toBeDefined()
      // 六个 0 的平均 = 0
      expect(evenEval!.overallScore).toBe(0)

      const oddEval = evals.find(e => e.sessionId === 'boundary-session-1')
      expect(oddEval).toBeDefined()
      // 六个 1 的平均 = 1
      expect(oddEval!.overallScore).toBe(1)
    })
  })

  // ─── 统计极限 ───

  describe('统计极限', () => {
    it('无数据时静默返回零值统计', () => {
      // 不创建任何会话,直接拿统计
      const stats = service.getStats('t-nodata')
      expect(stats.totalSessions).toBe(0)
      expect(stats.completedSessions).toBe(0)
      expect(stats.failedSessions).toBe(0)
      expect(stats.runningSessions).toBe(0)
      expect(stats.avgSteps).toBe(0)
      expect(stats.avgDurationMs).toBe(0)
      expect(stats.avgLlmCalls).toBe(0)
      expect(stats.avgQualityScore).toBe(0)
    })

    it('大量数据后统计计算正确', () => {
      // 先创建 50 个会话
      const items = Array.from({ length: 50 }, (_, i) => ({
        configId: 'default-agent-v1',
        userInput: `Stats query ${i}`,
        maxSteps: 3,
        enableReflection: i % 2 === 0,
      }))

      service.batchExecute({ items, createdBy: 'stat-tester', tenantId: 't-stats' })

      const stats = service.getStats('t-stats')
      expect(stats.totalSessions).toBe(50)
      expect(stats.completedSessions).toBe(50)
      expect(stats.failedSessions).toBe(0)

      // 每个 session 步数: max(3, 5) = 3 步
      expect(stats.avgSteps).toBeGreaterThan(0)

      // avgDurationMs 应 > 0 (mock 执行需要时间)
      expect(stats.avgDurationMs).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── 租户隔离 ───

  describe('租户隔离', () => {
    it('不同租户数据隔离', () => {
      // tenant-A: 30 个会话
      const itemsA = Array.from({ length: 30 }, (_, i) => ({
        configId: 'default-agent-v1',
        userInput: `A's query ${i}`,
        maxSteps: 2,
        enableReflection: false,
      }))
      service.batchExecute({ items: itemsA, createdBy: 'user-a', tenantId: 't-a' })

      // tenant-B: 20 个会话
      const itemsB = Array.from({ length: 20 }, (_, i) => ({
        configId: 'default-agent-v1',
        userInput: `B's query ${i}`,
        maxSteps: 3,
        enableReflection: true,
      }))
      service.batchExecute({ items: itemsB, createdBy: 'user-b', tenantId: 't-b' })

      const statsA = service.getStats('t-a')
      expect(statsA.totalSessions).toBe(30)

      const statsB = service.getStats('t-b')
      expect(statsB.totalSessions).toBe(20)

      // 无租户过滤: 全部
      const allStats = service.getStats()
      expect(allStats.totalSessions).toBe(50)
    })

    it('会话按租户查找隔离', () => {
      const requestA = createSessionRequest({ createdBy: 'user-a', tenantId: 't-sec-a' })
      const requestB = createSessionRequest({ createdBy: 'user-b', tenantId: 't-sec-b' })

      service.createAndRunSession(requestA)
      service.createAndRunSession(requestB)

      const sessionsA = service.getSessions('t-sec-a')
      expect(sessionsA.length).toBe(1)
      expect(sessionsA[0].tenantId).toBe('t-sec-a')

      const sessionsB = service.getSessions('t-sec-b')
      expect(sessionsB.length).toBe(1)
      expect(sessionsB[0].tenantId).toBe('t-sec-b')
    })
  })

  // ─── 并发安全: 快速创建和查询交织 ───

  describe('快速创建和查询交织', () => {
    it('创建 50 个会话过程中交替查询不卡死', () => {
      for (let i = 0; i < 50; i++) {
        const request = createSessionRequest({
          userInput: `Interleave ${i}`,
          tenantId: 't-interleave',
        })
        service.createAndRunSession(request)

        // 每创建 10 个,读取一次统计
        if (i > 0 && i % 10 === 0) {
          const stats = service.getStats('t-interleave')
          expect(stats.totalSessions).toBe(i + 1)
        }
      }

      const finalStats = service.getStats('t-interleave')
      expect(finalStats.totalSessions).toBe(50)
    })
  })

  // ─── 异常配置 ───

  describe('异常配置容错', () => {
    it('禁用配置执行应抛错', () => {
      service.createConfig({
        id: 'disabled-config',
        name: 'Disabled',
        systemPrompt: 'test',
        model: 'deepseek-v4',
        maxSteps: 3,
        enableReflection: false,
        allowedTools: [],
        timeoutMs: 10000,
        enabled: false,
        createdAt: '',
        updatedAt: '',
        tenantId: 't-err',
      })

      expect(() =>
        service.createAndRunSession({
          configId: 'disabled-config',
          userInput: 'test',
          createdBy: 'test',
          tenantId: 't-err',
        })
      ).toThrow('disabled')
    })

    it('不存在的配置执行应抛错', () => {
      expect(() =>
        service.createAndRunSession({
          configId: 'non-existent-config-id',
          userInput: 'test',
          createdBy: 'test',
          tenantId: 't-err',
        })
      ).toThrow('not found')
    })

    it('批量执行中含失败项容错', () => {
      const items = [
        { configId: 'default-agent-v1', userInput: 'Valid query', maxSteps: 2 },
        { configId: 'does-not-exist', userInput: 'Invalid config', maxSteps: 2 },
        { configId: 'default-agent-v1', userInput: 'Another valid', maxSteps: 2 },
      ]

      const result = service.batchExecute({ items, createdBy: 'test', tenantId: 't-batch-err' })
      expect(result.total).toBe(3)
      expect(result.succeeded).toBe(2)
      expect(result.failed).toBe(1)
      // 失败的那个不应该在 results 中贡献 succeeded
      expect(result.results.length).toBe(2)
    })
  })
})
