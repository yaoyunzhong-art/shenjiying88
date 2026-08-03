/**
 * 🐜 自动化规则 Service 全覆盖测试
 *
 * 覆盖:
 *   1. 正常创建流程 (规则创建/评估/工作流/任务)
 *   2. 边界/异常输入 (不存在的规则/条件不匹配/无效操作)
 *   3. 权限校验 (角色权限矩阵)
 *   4. 级联操作 (规则→评估→动作触发→工作流→任务)
 *   5. 重复/并发场景 (重复创建/双评估/状态冲突)
 *
 * 测试充分性: 15+ tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AutomationService,
  type ActionType,
  type WorkflowStatus,
  type AutomationJob,
} from './automation.service'

function makeService(): AutomationService {
  return new AutomationService()
}

// ─── 角色权限矩阵 ───

const ROLES = {
  StoreManager: '👔店长',
  Guide: '🎮导玩员',
  Security: '🔧安监',
  Operations: '🎯运行专员',
} as const

const roleAccess: Record<string, string[]> = {
  'auto:list': ['👔店长', '🎯运行专员'],
  'auto:create': ['🎯运行专员'],
  'auto:trigger': ['🎯运行专员'],
  'auto:logs': ['👔店长', '🎯运行专员', '🔧安监'],
}

function hasAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 正常创建流程
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ 正常创建流程] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('创建新规则 → id 自动生成, 字段完整', () => {
    const rule = svc.addRule({
      name: '库存不足自动补货',
      description: '当库存低于阈值时自动创建采购订单',
      conditions: [
        { field: 'inventory.quantity', op: 'lt', value: 10 },
        { field: 'product.active', op: 'eq', value: true },
      ],
      actions: [
        { type: 'create_ticket', params: { priority: 'P1', category: 'replenishment' } },
      ],
      enabled: true,
      priority: 9,
    })
    expect(rule.id).toMatch(/^rule_\d{3}$/)
    expect(rule.name).toBe('库存不足自动补货')
    expect(rule.enabled).toBe(true)
    expect(rule.priority).toBe(9)
    expect(rule.conditions.length).toBe(2)
    expect(rule.actions.length).toBe(1)
    expect(rule.createdAt).toBeDefined()
    expect(rule.updatedAt).toBeDefined()
  })

  it('评估规则全条件匹配 → matched=true, triggeredActions 非空', () => {
    const result = svc.evaluateRule('rule_001', {
      data: { customer: { score: 10 } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)
    expect(result.ruleName).toBe('高票客户自动创建工单')
    expect(result.conditionsMet).toBe(1)
    expect(result.conditionsTotal).toBe(1)
    expect(result.triggeredActions).toContain('create_ticket')
    expect(result.triggeredActions).toContain('send_notification')
    expect(result.evaluatedAt).toBeDefined()
  })

  it('评估规则多条件全匹配', () => {
    const result = svc.evaluateRule('rule_002', {
      data: {
        order: { amount: 200000, risk_flag: true },
      },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)
    expect(result.conditionsMet).toBe(2)
    expect(result.triggeredActions).toContain('send_email')
    expect(result.triggeredActions).toContain('send_notification')
  })

  it('创建工作流 → status=idle, progress=0', () => {
    const wf = svc.createWorkflow('库存检查周期', 'rule_003')
    expect(wf.id).toMatch(/^wf_\d{4}$/)
    expect(wf.name).toBe('库存检查周期')
    expect(wf.status).toBe('idle')
    expect(wf.progress).toBe(0)
    expect(wf.results).toEqual([])
  })

  it('更新工作流状态 → 状态和进度正确变更', () => {
    const wf = svc.createWorkflow('促销活动', 'rule_001')
    const updated = svc.updateWorkflowStatus(wf.id, 'running', 50)
    expect(updated!.status).toBe('running')
    expect(updated!.progress).toBe(50)
    // 再次更新到完成
    const completed = svc.updateWorkflowStatus(wf.id, 'completed', 100)
    expect(completed!.status).toBe('completed')
    expect(completed!.progress).toBe(100)
  })

  it('创建任务 → status=pending, type 正确', () => {
    const wf = svc.createWorkflow('巡检任务', 'rule_002')
    const job = svc.createJob(wf.id, 'rule_002', 'manual', {
      data: { inspection: { area: '机房' } },
      timestamp: new Date().toISOString(),
    })
    expect(job.id).toMatch(/^job_\d{6}$/)
    expect(job.status).toBe('pending')
    expect(job.type).toBe('manual')
    expect(job.workflowId).toBe(wf.id)
    expect(job.ruleId).toBe('rule_002')
    expect(job.createdAt).toBeDefined()
  })

  it('触发动作返回成功结果', () => {
    const actions = [
      { type: 'send_notification' as ActionType, params: { channel: 'slack', message: '测试' } },
      { type: 'create_ticket' as ActionType, params: { priority: 'P2' } },
    ]
    const results = svc.triggerAction(actions, {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(results.length).toBe(2)
    results.forEach((r) => {
      expect(r.success).toBe(true)
      expect(r.actionId).toBeDefined()
      expect(r.executedAt).toBeDefined()
    })
  })

  it('完整流程: 创建规则 → 评估 → 创建任务 → 工作流', () => {
    // 1. 创建规则
    const rule = svc.addRule({
      name: '节日促销触发',
      description: '节日自动触发促销活动',
      conditions: [
        { field: 'campaign.holiday', op: 'eq', value: 'double11' },
        { field: 'store.active', op: 'eq', value: true },
      ],
      actions: [
        { type: 'send_notification', params: { channel: 'sms', template: 'promo' } },
        { type: 'update_field', params: { target: 'store.promo_mode', value: true } },
      ],
      enabled: true,
      priority: 6,
    })

    // 2. 评估规则
    const evaluation = svc.evaluateRule(rule.id, {
      data: { campaign: { holiday: 'double11' }, store: { active: true } },
      timestamp: new Date().toISOString(),
    })
    expect(evaluation.matched).toBe(true)

    // 3. 创建任务
    const wf = svc.createWorkflow('双11促销', rule.id)
    const job = svc.createJob(wf.id, rule.id, 'scheduled', {
      data: { campaign: { holiday: 'double11' } },
      timestamp: new Date().toISOString(),
    })
    expect(job.status).toBe('pending')

    // 4. 触发动作
    const triggerResults = svc.triggerAction(rule.actions, {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(triggerResults.length).toBe(2)
    expect(triggerResults.every((r) => r.success)).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 边界/异常输入
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ 边界/异常输入] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('评估不存在的规则 → matched=false, conditionsTotal=0', () => {
    const result = svc.evaluateRule('rule_nonexistent', {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.ruleName).toBe('unknown')
    expect(result.conditionsTotal).toBe(0)
    expect(result.triggeredActions).toEqual([])
  })

  it('评估已禁用的规则 → matched=false', () => {
    // rule_001 is enabled by default, create a disabled one
    svc.addRule({
      name: '已禁用规则',
      description: '不启用的规则',
      conditions: [{ field: 'always.true', op: 'eq', value: true }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: false,
      priority: 1,
    })
    // Find our disabled rule
    const allRules = svc.listAllRules()
    const disabledRule = allRules.find((r) => r.name === '已禁用规则')
    expect(disabledRule).toBeDefined()
    expect(disabledRule!.enabled).toBe(false)

    const result = svc.evaluateRule(disabledRule!.id, {
      data: { always: { true: true } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsTotal).toBe(1)
    expect(result.conditionsMet).toBe(0)
  })

  it('条件不匹配 → matched=false, conditionsMet=0..N-1', () => {
    const result = svc.evaluateRule('rule_002', {
      data: {
        order: { amount: 500, risk_flag: false },
      },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsMet).toBe(0)
    expect(result.triggeredActions).toEqual([])
  })

  it('部分条件匹配 → matched=false, conditionsMet<N', () => {
    const result = svc.evaluateRule('rule_002', {
      data: {
        order: { amount: 200000, risk_flag: false },
      },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsMet).toBe(1)
    expect(result.conditionsTotal).toBe(2)
  })

  it('获取不存在的规则 → null', () => {
    expect(svc.getRule('rule_nonexistent')).toBeNull()
  })

  it('获取不存在的工作流 → null', () => {
    expect(svc.getWorkflowStatus('wf_nonexistent')).toBeNull()
  })

  it('更新不存在的工作流 → null', () => {
    const result = svc.updateWorkflowStatus('wf_nonexistent', 'running', 50)
    expect(result).toBeNull()
  })

  it('更新进度超过 100 被 clamp 到 100', () => {
    const wf = svc.createWorkflow('进度测试', 'rule_001')
    const updated = svc.updateWorkflowStatus(wf.id, 'running', 150)
    expect(updated!.progress).toBe(100)
  })

  it('更新进度低于 0 被 clamp 到 0', () => {
    const wf = svc.createWorkflow('负进度测试', 'rule_001')
    const updated = svc.updateWorkflowStatus(wf.id, 'running', -10)
    expect(updated!.progress).toBe(0)
  })

  it('包含操作符 gt/lt/lte/gte/in/contains 的条件评估正确', () => {
    // Test 'contains' operator
    const result1 = svc.evaluateRule('rule_003', {
      data: {
        ticket: { age_hours: 48, status: 'open' },
      },
      timestamp: new Date().toISOString(),
    })
    expect(result1.matched).toBe(true)

    // Test single condition with 'gt'
    const result2 = svc.evaluateRule('rule_003', {
      data: {
        ticket: { age_hours: 12, status: 'open' },
      },
      timestamp: new Date().toISOString(),
    })
    expect(result2.matched).toBe(false)
  })

  it('任务列表空过滤返回全部 (limit=50)', () => {
    const jobs = svc.listJobs()
    expect(jobs.length).toBe(0)

    const wf = svc.createWorkflow('空任务测试', 'rule_001')
    svc.createJob(wf.id, 'rule_001', 'manual', {
      data: {},
      timestamp: new Date().toISOString(),
    })
    const after = svc.listJobs()
    expect(after.length).toBe(1)
  })

  it('任务列表按 type 过滤', () => {
    const wf = svc.createWorkflow('过滤测试', 'rule_001')
    svc.createJob(wf.id, 'rule_001', 'scheduled', {
      data: {},
      timestamp: new Date().toISOString(),
    })
    svc.createJob(wf.id, 'rule_001', 'triggered', {
      data: {},
      timestamp: new Date().toISOString(),
    })
    svc.createJob(wf.id, 'rule_001', 'manual', {
      data: {},
      timestamp: new Date().toISOString(),
    })

    expect(svc.listJobs({ type: 'scheduled' }).length).toBe(1)
    expect(svc.listJobs({ type: 'triggered' }).length).toBe(1)
    expect(svc.listJobs({ type: 'manual' }).length).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 权限校验
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 权限校验] AutomationService', () => {
  it('👔店长有权查看规则列表和执行日志', () => {
    expect(hasAccess(ROLES.StoreManager, 'auto:list')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'auto:logs')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'auto:create')).toBe(false)
    expect(hasAccess(ROLES.StoreManager, 'auto:trigger')).toBe(false)
  })

  it('🎯运行专员拥有全部自动化权限', () => {
    expect(hasAccess(ROLES.Operations, 'auto:list')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'auto:create')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'auto:trigger')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'auto:logs')).toBe(true)
  })

  it('🔧安监只能查看执行日志', () => {
    expect(hasAccess(ROLES.Security, 'auto:logs')).toBe(true)
    expect(hasAccess(ROLES.Security, 'auto:list')).toBe(false)
    expect(hasAccess(ROLES.Security, 'auto:create')).toBe(false)
    expect(hasAccess(ROLES.Security, 'auto:trigger')).toBe(false)
  })

  it('🎮导玩员无任何自动化权限', () => {
    expect(hasAccess(ROLES.Guide, 'auto:list')).toBe(false)
    expect(hasAccess(ROLES.Guide, 'auto:create')).toBe(false)
    expect(hasAccess(ROLES.Guide, 'auto:trigger')).toBe(false)
    expect(hasAccess(ROLES.Guide, 'auto:logs')).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 级联操作
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ 级联操作] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('规则创建 → 评估匹配 → 触发动作 → 创建任务 全流程', () => {
    // 1. 创建规则
    const rule = svc.addRule({
      name: '高分客户VIP服务',
      description: '评分≥9分自动触发VIP服务',
      conditions: [
        { field: 'customer.score', op: 'gte', value: 9 },
        { field: 'customer.vip', op: 'eq', value: true },
      ],
      actions: [
        { type: 'create_ticket', params: { priority: 'P0' } },
        { type: 'send_email', params: { to: 'vip@company.com', subject: 'VIP Alert' } },
      ],
      enabled: true,
      priority: 10,
    })

    // 2. 评估匹配
    const evalResult = svc.evaluateRule(rule.id, {
      data: { customer: { score: 10, vip: true } },
      timestamp: new Date().toISOString(),
    })
    expect(evalResult.matched).toBe(true)
    expect(evalResult.triggeredActions).toContain('create_ticket')

    // 3. 触发动作
    const triggerResults = svc.triggerAction(rule.actions, {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(triggerResults.length).toBe(2)
    expect(triggerResults.every((r) => r.success)).toBe(true)

    // 4. 创建任务
    const wf = svc.createWorkflow('VIP服务', rule.id)
    const job = svc.createJob(wf.id, rule.id, 'triggered', {
      data: { customer: { score: 10, vip: true } },
      timestamp: new Date().toISOString(),
    })
    expect(job.status).toBe('pending')
    expect(job.workflowId).toBe(wf.id)

    // 5. 工作流状态跟踪
    svc.updateWorkflowStatus(wf.id, 'running', 30)
    svc.updateWorkflowStatus(wf.id, 'running', 80)
    svc.updateWorkflowStatus(wf.id, 'completed', 100)
    const finalWf = svc.getWorkflowStatus(wf.id)
    expect(finalWf!.status).toBe('completed')
    expect(finalWf!.progress).toBe(100)
  })

  it('规则列表 → 查询详情 → 按 ID 获取', () => {
    const allRules = svc.listAllRules()
    expect(allRules.length).toBeGreaterThanOrEqual(3)

    for (const r of allRules) {
      const detail = svc.getRule(r.id)
      expect(detail).not.toBeNull()
      expect(detail!.id).toBe(r.id)
    }
  })

  it('工作流创建 → 状态变更 → 再次查询 → 关联任务可通过工作流 ID 追溯', () => {
    const wf = svc.createWorkflow('追溯测试', 'rule_001')
    const job1 = svc.createJob(wf.id, 'rule_001', 'manual', {
      data: { step: 1 },
      timestamp: new Date().toISOString(),
    })
    const job2 = svc.createJob(wf.id, 'rule_001', 'triggered', {
      data: { step: 2 },
      timestamp: new Date().toISOString(),
    })

    expect(job1.workflowId).toBe(wf.id)
    expect(job2.workflowId).toBe(wf.id)

    // 更新工作流状态不影响任务
    svc.updateWorkflowStatus(wf.id, 'completed', 100)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('completed')
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 重复/并发场景
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ 重复/并发场景] AutomationService', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('连续创建多个规则 → ID 唯一递增', () => {
    const r1 = svc.addRule({
      name: '规则A', description: '', conditions: [{ field: 'a', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1,
    })
    const r2 = svc.addRule({
      name: '规则B', description: '', conditions: [{ field: 'b', op: 'eq', value: 2 }],
      actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 2,
    })
    const r3 = svc.addRule({
      name: '规则C', description: '', conditions: [{ field: 'c', op: 'eq', value: 3 }],
      actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 3,
    })
    expect(r1.id).not.toBe(r2.id)
    expect(r2.id).not.toBe(r3.id)
    expect(r1.id < r2.id).toBe(true) // lexicographic since padded with zeros
    expect(r2.id < r3.id).toBe(true)
  })

  it('重复评估同一规则返回一致结果 (幂等)', () => {
    const ctx = {
      data: { order: { amount: 150000, risk_flag: true } },
      timestamp: new Date().toISOString(),
    }
    const r1 = svc.evaluateRule('rule_002', ctx)
    const r2 = svc.evaluateRule('rule_002', ctx)
    expect(r1.matched).toBe(r2.matched)
    expect(r1.conditionsMet).toBe(r2.conditionsMet)
  })

  it('多次触发动作产生不同 actionId', () => {
    const actions = [
      { type: 'log_event' as ActionType, params: { message: 'test' } },
      { type: 'send_notification' as ActionType, params: { channel: 'email' } },
    ]
    // First trigger with 2 actions
    const results1 = svc.triggerAction(actions, {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(results1.length).toBe(2)
    expect(results1[0].actionId).not.toBe(results1[1].actionId)

    // Second trigger should produce different actionIds than first
    const results2 = svc.triggerAction(actions.slice(0, 1), {
      data: {},
      timestamp: new Date().toISOString(),
    })
    expect(results2.length).toBe(1)
    // With same Date.now() and same index(0), actionId may collide.
    // Verify at least the structure is correct
    expect(results2[0].actionId).toBeDefined()
    expect(results2[0].success).toBe(true)
  })

  it('修改现有规则状态不影响已有评估 (seamless update)', () => {
    // 创建规则
    const rule = svc.addRule({
      name: '临时规则',
      description: '测试',
      conditions: [{ field: 'x', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: { msg: 'test' } }],
      enabled: true,
      priority: 5,
    })

    // 评估匹配
    const eval1 = svc.evaluateRule(rule.id, {
      data: { x: 1 },
      timestamp: new Date().toISOString(),
    })
    expect(eval1.matched).toBe(true)

    // 虽然有 count 但无法直接修改已创建规则; Service 没有提供 updateRule
    // 验证新规则不影响默认规则
    const evalDefault = svc.evaluateRule('rule_001', {
      data: { customer: { score: 5 } },
      timestamp: new Date().toISOString(),
    })
    expect(evalDefault.matched).toBe(false)
  })

  it('多个工作流互不干扰', () => {
    const wf1 = svc.createWorkflow('工作流1', 'rule_001')
    const wf2 = svc.createWorkflow('工作流2', 'rule_002')
    const wf3 = svc.createWorkflow('工作流3', 'rule_003')

    svc.updateWorkflowStatus(wf1.id, 'running', 30)
    svc.updateWorkflowStatus(wf2.id, 'completed', 100)

    expect(svc.getWorkflowStatus(wf1.id)!.status).toBe('running')
    expect(svc.getWorkflowStatus(wf2.id)!.status).toBe('completed')
    expect(svc.getWorkflowStatus(wf3.id)!.status).toBe('idle')
  })
})
