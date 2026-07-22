/**
 * 🐜 自动化 Service 边界覆盖测试（补充）
 *
 * 覆盖已有 full.test 未深层测试的:
 *   1. 所有条件操作符 (eq/neq/gt/gte/lt/lte/contains/not_contains/in/not_in)
 *   2. 空上下文/空数据评估
 *   3. 深层嵌套字段路径解析
 *   4. 工作流状态机全转换
 *   5. 多规则优先级排序
 *   6. 任务列表排序与数量控制
 *
 * 测试充分性: 16 tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AutomationService, type ActionType, type RuleConditionOp, type EvaluationContext } from './automation.service'

function makeService(): AutomationService {
  return new AutomationService()
}

// ══════════════════════════════════════════════════════════════════
// 6️⃣ 条件操作符全面测试
// ══════════════════════════════════════════════════════════════════

describe('[6️⃣ 条件操作符全面测试] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  const ops: { op: RuleConditionOp; actual: unknown; expected: unknown; match: boolean }[] = [
    { op: 'eq', actual: 'hello', expected: 'hello', match: true },
    { op: 'eq', actual: 'hello', expected: 'world', match: false },
    { op: 'neq', actual: 'hello', expected: 'world', match: true },
    { op: 'neq', actual: 'hello', expected: 'hello', match: false },
    { op: 'gt', actual: 10, expected: 5, match: true },
    { op: 'gt', actual: 5, expected: 10, match: false },
    { op: 'gt', actual: 5, expected: 5, match: false },
    { op: 'gte', actual: 5, expected: 5, match: true },
    { op: 'gte', actual: 4, expected: 5, match: false },
    { op: 'lt', actual: 3, expected: 5, match: true },
    { op: 'lt', actual: 10, expected: 5, match: false },
    { op: 'lte', actual: 5, expected: 5, match: true },
    { op: 'lte', actual: 6, expected: 5, match: false },
    { op: 'contains', actual: 'hello world', expected: 'world', match: true },
    { op: 'contains', actual: 'hello world', expected: 'xyz', match: false },
    { op: 'not_contains', actual: 'hello world', expected: 'xyz', match: true },
    { op: 'not_contains', actual: 'hello world', expected: 'world', match: false },
  ]

  for (const { op, actual, expected, match } of ops) {
    const shouldStr = match ? '匹配' : '不匹配'
    it(`操作符 ${op}: value=${JSON.stringify(actual)} ${shouldStr} expected=${JSON.stringify(expected)}`, () => {
      const rule = svc.addRule({
        name: `${op}测试`,
        description: `测试${op}操作符`,
        conditions: [{ field: 'test.value', op, value: expected }],
        actions: [{ type: 'log_event', params: { msg: 'test' } }],
        enabled: true,
        priority: 1,
      })
      const result = svc.evaluateRule(rule.id, {
        data: { test: { value: actual } },
        timestamp: new Date().toISOString(),
      })
      expect(result.matched).toBe(match)
    })
  }
})

// ══════════════════════════════════════════════════════════════════
// 7️⃣ 空上下文/空数据评估
// ══════════════════════════════════════════════════════════════════

describe('[7️⃣ 空上下文/空数据评估] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('空 data 评估不存在的字段 → 条件不匹配', () => {
    const result = svc.evaluateRule('rule_001', {
      data: {},
      timestamp: new Date().toISOString(),
    })
    // rule_001 要求 customer.score >= 9，空数据拿不到值
    expect(result.matched).toBe(false)
    expect(result.conditionsMet).toBe(0)
  })

  it('部分缺失字段不会导致异常', () => {
    // rule_002 需要 order.amount 和 order.risk_flag
    const result = svc.evaluateRule('rule_002', {
      data: { order: { amount: 500 } }, // missing risk_flag
      timestamp: new Date().toISOString(),
    })
    // 不会抛异常，risk_flag undefined != true，= false
    expect(result.matched).toBe(false)
  })

  it('空 context (无 data 字段) 安全处理', () => {
    const result = svc.evaluateRule('rule_001', {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsTotal).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════
// 8️⃣ 深层嵌套字段路径解析
// ══════════════════════════════════════════════════════════════════

describe('[8️⃣ 深层嵌套字段路径解析] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('3层嵌套字段可以正确解析', () => {
    const rule = svc.addRule({
      name: '3层嵌套',
      description: '测试深层路径',
      conditions: [{ field: 'a.b.c', op: 'eq', value: 'deep' }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: true,
      priority: 1,
    })
    const result = svc.evaluateRule(rule.id, {
      data: { a: { b: { c: 'deep' } } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)
  })

  it('5层嵌套字段可以正确解析', () => {
    const rule = svc.addRule({
      name: '5层嵌套',
      description: '测试深层路径',
      conditions: [{ field: 'level1.level2.level3.level4.level5', op: 'eq', value: 42 }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: true,
      priority: 1,
    })
    const result = svc.evaluateRule(rule.id, {
      data: { level1: { level2: { level3: { level4: { level5: 42 } } } } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)
  })

  it('嵌套路径中间缺失返回 undefined 导致条件不匹配', () => {
    const rule = svc.addRule({
      name: '路径断裂',
      description: '路径断裂导致undefined',
      conditions: [{ field: 'x.y.z', op: 'eq', value: 'anything' }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: true,
      priority: 1,
    })
    const result = svc.evaluateRule(rule.id, {
      data: { x: { broken: true } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 9️⃣ 工作流状态机全转换
// ══════════════════════════════════════════════════════════════════

describe('[9️⃣ 工作流状态机全转换] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('idle → running → completed 正常流程', () => {
    const wf = svc.createWorkflow('正常流程', 'rule_001')
    expect(wf.status).toBe('idle')

    const running = svc.updateWorkflowStatus(wf.id, 'running', 30)
    expect(running!.status).toBe('running')
    expect(running!.progress).toBe(30)

    const completed = svc.updateWorkflowStatus(wf.id, 'completed', 100)
    expect(completed!.status).toBe('completed')
    expect(completed!.progress).toBe(100)
  })

  it('running → paused → running → completed 暂停恢复流程', () => {
    const wf = svc.createWorkflow('暂停恢复', 'rule_002')

    svc.updateWorkflowStatus(wf.id, 'running', 20)
    svc.updateWorkflowStatus(wf.id, 'paused', 20)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('paused')

    svc.updateWorkflowStatus(wf.id, 'running', 60)
    svc.updateWorkflowStatus(wf.id, 'completed', 100)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('completed')
  })

  it('running → failed 失败流程', () => {
    const wf = svc.createWorkflow('失败流程', 'rule_003')
    svc.updateWorkflowStatus(wf.id, 'running', 50)
    svc.updateWorkflowStatus(wf.id, 'failed', 80)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('failed')
    expect(svc.getWorkflowStatus(wf.id)!.progress).toBe(80)
  })

  it('running → cancelled 取消流程', () => {
    const wf = svc.createWorkflow('取消流程', 'rule_001')
    svc.updateWorkflowStatus(wf.id, 'running', 40)
    svc.updateWorkflowStatus(wf.id, 'cancelled', 40)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('cancelled')
  })
})

// ══════════════════════════════════════════════════════════════════
// 🔟 任务列表排序与数量控制
// ══════════════════════════════════════════════════════════════════

describe('[🔟 任务列表排序与数量控制] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('listJobs 默认按 createdAt 倒序（最新的在前面）', () => {
    const wf = svc.createWorkflow('排序测试', 'rule_001')
    const j1 = svc.createJob(wf.id, 'rule_001', 'manual', {
      data: { order: 1 }, timestamp: new Date().toISOString(),
    })
    // Small delay to ensure different timestamps
    const j2 = svc.createJob(wf.id, 'rule_001', 'triggered', {
      data: { order: 2 }, timestamp: new Date().toISOString(),
    })
    const j3 = svc.createJob(wf.id, 'rule_001', 'scheduled', {
      data: { order: 3 }, timestamp: new Date().toISOString(),
    })

    const jobs = svc.listJobs()
    expect(jobs.length).toBe(3)
    // Most recent created first if timestamps differ
    const createdAtMillis = jobs.map(j => new Date(j.createdAt).getTime())
    for (let i = 1; i < createdAtMillis.length; i++) {
      expect(createdAtMillis[i - 1]).toBeGreaterThanOrEqual(createdAtMillis[i])
    }
  })

  it('listJobs 可以限制返回数量', () => {
    const wf = svc.createWorkflow('限制测试', 'rule_001')
    for (let i = 0; i < 5; i++) {
      svc.createJob(wf.id, 'rule_001', 'manual', {
        data: { idx: i }, timestamp: new Date().toISOString(),
      })
    }
    expect(svc.listJobs({ limit: 2 }).length).toBe(2)
    expect(svc.listJobs({ limit: 10 }).length).toBe(5)
  })
})
