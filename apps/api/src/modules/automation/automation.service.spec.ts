/**
 * automation.service.spec.ts — 自动化规则引擎 Service 单元测试
 *
 * 覆盖: 规则创建/评估、动作触发、工作流管理、任务管理、
 *       条件运算符、边界异常、状态变迁
 *
 * 充分性: 15+ tests  |  Jest describe/it 模式
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AutomationService,
  type ActionType,
} from './automation.service'

function makeService(): AutomationService {
  return new AutomationService()
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 规则管理
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 规则管理', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('addRule 创建新规则 → id 自动生成, 字段完整', () => {
    const rule = svc.addRule({
      name: '低库存告警',
      description: '库存<10时触发补货工单',
      conditions: [{ field: 'inventory.quantity', op: 'lt', value: 10 }],
      actions: [{ type: 'create_ticket', params: { priority: 'P1' } }],
      enabled: true,
      priority: 9,
    })
    expect(rule.id).toMatch(/^rule_\d{3}$/)
    expect(rule.name).toBe('低库存告警')
    expect(rule.enabled).toBe(true)
    expect(rule.priority).toBe(9)
    expect(rule.createdAt).toBeDefined()
  })

  it('listAllRules 返回所有规则（含默认 3 条）', () => {
    const all = svc.listAllRules()
    expect(all.length).toBeGreaterThanOrEqual(3)
  })

  it('getRule 按 ID 返回规则详情', () => {
    const rule = svc.getRule('rule_001')
    expect(rule).not.toBeNull()
    expect(rule!.id).toBe('rule_001')
    expect(rule!.name).toBe('高票客户自动创建工单')
  })

  it('getRule 返回 null 当规则不存在', () => {
    expect(svc.getRule('rule_nonexistent')).toBeNull()
  })

  it('连续创建多条规则 ID 唯一递增', () => {
    const r1 = svc.addRule({
      name: '规则A', description: '', conditions: [{ field: 'a', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1,
    })
    const r2 = svc.addRule({
      name: '规则B', description: '', conditions: [{ field: 'b', op: 'eq', value: 2 }],
      actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 2,
    })
    expect(r1.id).not.toBe(r2.id)
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 规则评估
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 规则评估', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('评估全条件匹配 → matched=true, triggeredActions 非空', () => {
    const result = svc.evaluateRule('rule_001', {
      data: { customer: { score: 10 } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)
    expect(result.triggeredActions).toContain('create_ticket')
    expect(result.triggeredActions).toContain('send_notification')
  })

  it('评估多条件全部匹配', () => {
    const result = svc.evaluateRule('rule_002', {
      data: { order: { amount: 200000, risk_flag: true } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)
    expect(result.conditionsMet).toBe(2)
  })

  it('条件不匹配 → matched=false', () => {
    const result = svc.evaluateRule('rule_002', {
      data: { order: { amount: 500, risk_flag: false } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsMet).toBe(0)
  })

  it('部分条件匹配 → matched=false, conditionsMet<total', () => {
    const result = svc.evaluateRule('rule_002', {
      data: { order: { amount: 200000, risk_flag: false } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsMet).toBe(1)
    expect(result.conditionsTotal).toBe(2)
  })

  it('评估不存在的规则 → matched=false, ruleName=unknown', () => {
    const result = svc.evaluateRule('rule_nonexistent', {
      data: {}, timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.ruleName).toBe('unknown')
  })

  it('评估已禁用的规则 → matched=false', () => {
    const r = svc.addRule({
      name: '禁用规则', description: '', conditions: [{ field: 'x', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: {} }], enabled: false, priority: 1,
    })
    const result = svc.evaluateRule(r.id, {
      data: { x: 1 }, timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(false)
    expect(result.conditionsTotal).toBe(1)
  })

  it('gte 操作符正确工作', () => {
    const result = svc.evaluateRule('rule_003', {
      data: { ticket: { age_hours: 48, status: 'open' } },
      timestamp: new Date().toISOString(),
    })
    expect(result.matched).toBe(true)

    const noMatch = svc.evaluateRule('rule_003', {
      data: { ticket: { age_hours: 12, status: 'open' } },
      timestamp: new Date().toISOString(),
    })
    expect(noMatch.matched).toBe(false)
  })

  it('contains 操作符正确工作 (rule_002 uses eq, 这里测试 contains)', () => {
    // 使用 contains: addRule with contains condition
    const r = svc.addRule({
      name: '包含测试', description: '',
      conditions: [{ field: 'message', op: 'contains', value: 'error' }],
      actions: [{ type: 'log_event', params: { msg: 'match' } }],
      enabled: true, priority: 1,
    })
    const match = svc.evaluateRule(r.id, {
      data: { message: 'critical error occurred' },
      timestamp: new Date().toISOString(),
    })
    expect(match.matched).toBe(true)

    const noMatch = svc.evaluateRule(r.id, {
      data: { message: 'all good' },
      timestamp: new Date().toISOString(),
    })
    expect(noMatch.matched).toBe(false)
  })

  it('in 操作符正确工作', () => {
    const r = svc.addRule({
      name: 'in测试', description: '',
      conditions: [{ field: 'status', op: 'in', value: ['open', 'pending'] }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: true, priority: 1,
    })
    const match = svc.evaluateRule(r.id, {
      data: { status: 'open' },
      timestamp: new Date().toISOString(),
    })
    expect(match.matched).toBe(true)

    const noMatch = svc.evaluateRule(r.id, {
      data: { status: 'closed' },
      timestamp: new Date().toISOString(),
    })
    expect(noMatch.matched).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 动作触发与工作流
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 动作与工作流', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('triggerAction 返回成功结果', () => {
    const results = svc.triggerAction([
      { type: 'send_notification' as ActionType, params: { channel: 'slack' } },
      { type: 'create_ticket' as ActionType, params: { priority: 'P0' } },
    ], { data: {}, timestamp: new Date().toISOString() })

    expect(results.length).toBe(2)
    results.forEach(r => {
      expect(r.success).toBe(true)
      expect(r.actionId).toBeDefined()
    })
  })

  it('createWorkflow → status=idle, progress=0', () => {
    const wf = svc.createWorkflow('巡检工作流', 'rule_001')
    expect(wf.status).toBe('idle')
    expect(wf.progress).toBe(0)
    expect(wf.ruleId).toBe('rule_001')
  })

  it('updateWorkflowStatus 更新状态和进度', () => {
    const wf = svc.createWorkflow('测试工作流', 'rule_002')
    const updated = svc.updateWorkflowStatus(wf.id, 'running', 60)
    expect(updated!.status).toBe('running')
    expect(updated!.progress).toBe(60)

    const done = svc.updateWorkflowStatus(wf.id, 'completed', 100)
    expect(done!.status).toBe('completed')
    expect(done!.progress).toBe(100)
  })

  it('getWorkflowStatus 返回 null 当不存在', () => {
    expect(svc.getWorkflowStatus('wf_nonexistent')).toBeNull()
  })

  it('updateWorkflowStatus 不存在的工作流返回 null', () => {
    expect(svc.updateWorkflowStatus('wf_nonexistent', 'running')).toBeNull()
  })

  it('进度超出 100 被 clamp', () => {
    const wf = svc.createWorkflow('clamp测试', 'rule_001')
    svc.updateWorkflowStatus(wf.id, 'running', 200)
    expect(svc.getWorkflowStatus(wf.id)!.progress).toBe(100)
  })

  it('进度低于 0 被 clamp', () => {
    const wf = svc.createWorkflow('clamp负测试', 'rule_001')
    svc.updateWorkflowStatus(wf.id, 'running', -5)
    expect(svc.getWorkflowStatus(wf.id)!.progress).toBe(0)
  })

  it('多个工作流互不干扰', () => {
    const wf1 = svc.createWorkflow('W1', 'rule_001')
    const wf2 = svc.createWorkflow('W2', 'rule_002')
    svc.updateWorkflowStatus(wf1.id, 'running', 30)
    svc.updateWorkflowStatus(wf2.id, 'completed', 100)

    expect(svc.getWorkflowStatus(wf1.id)!.status).toBe('running')
    expect(svc.getWorkflowStatus(wf2.id)!.status).toBe('completed')
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 任务管理
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 任务管理', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('createJob 创建任务 → status=pending', () => {
    const wf = svc.createWorkflow('任务测试', 'rule_001')
    const job = svc.createJob(wf.id, 'rule_001', 'manual', {
      data: {}, timestamp: new Date().toISOString(),
    })
    expect(job.status).toBe('pending')
    expect(job.type).toBe('manual')
    expect(job.id).toMatch(/^job_\d{6}$/)
  })

  it('listJobs 返回所有任务（最多 50 条）', () => {
    const wf = svc.createWorkflow('空任务', 'rule_001')
    svc.createJob(wf.id, 'rule_001', 'scheduled', {
      data: {}, timestamp: new Date().toISOString(),
    })
    const jobs = svc.listJobs()
    expect(jobs.length).toBe(1)
  })

  it('listJobs 按 type 过滤', () => {
    const wf = svc.createWorkflow('过滤测试', 'rule_001')
    svc.createJob(wf.id, 'rule_001', 'scheduled', { data: {}, timestamp: '' })
    svc.createJob(wf.id, 'rule_001', 'triggered', { data: {}, timestamp: '' })
    svc.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })

    expect(svc.listJobs({ type: 'scheduled' }).length).toBe(1)
    expect(svc.listJobs({ type: 'triggered' }).length).toBe(1)
    expect(svc.listJobs({ type: 'manual' }).length).toBe(1)
  })

  it('完整: 创建规则 → 评估匹配 → 触发动作 → 创建任务 → 工作流追踪', () => {
    // 1. 规则
    const rule = svc.addRule({
      name: '节日促销', description: '双11触发',
      conditions: [
        { field: 'campaign.holiday', op: 'eq', value: 'double11' },
        { field: 'store.active', op: 'eq', value: true },
      ],
      actions: [
        { type: 'send_notification', params: { channel: 'sms' } },
        { type: 'update_field', params: { target: 'store.promo_mode', value: true } },
      ],
      enabled: true, priority: 6,
    })

    // 2. 评估
    const evalResult = svc.evaluateRule(rule.id, {
      data: { campaign: { holiday: 'double11' }, store: { active: true } },
      timestamp: new Date().toISOString(),
    })
    expect(evalResult.matched).toBe(true)

    // 3. 动作
    const actions = svc.triggerAction(rule.actions, {
      data: {}, timestamp: new Date().toISOString(),
    })
    expect(actions.every(a => a.success)).toBe(true)

    // 4. 任务 + 工作流
    const wf = svc.createWorkflow('双11促销', rule.id)
    const job = svc.createJob(wf.id, rule.id, 'scheduled', {
      data: { campaign: { holiday: 'double11' } },
      timestamp: new Date().toISOString(),
    })
    expect(job.status).toBe('pending')
    expect(job.workflowId).toBe(wf.id)
  })
})
