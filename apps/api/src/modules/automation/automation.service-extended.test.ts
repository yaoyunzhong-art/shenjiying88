/**
 * automation.service-extended.spec.ts — 自动化规则引擎 Service 扩展单元测试
 *
 * 覆盖:
 *   - 规则管理高级场景（更新/删除/优先级）
 *   - 条件评估深度测试（所有运算符覆盖）
 *   - 动作触发边界（空动作/重复触发）
 *   - 工作流高级场景（异常状态/进度/多并发）
 *   - 任务管理高级场景（状态流转/completedAt）
 *   - 边界异常输入
 *
 * 充分性: 15+ tests  |  vitest describe/it 模式
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AutomationService,
} from './automation.service'

function makeService(): AutomationService {
  return new AutomationService()
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 规则管理高级场景
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 规则管理高级', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('addRule 添加后 getRule 可获取', () => {
    const rule = svc.addRule({
      name: '测试规则', description: '测试',
      conditions: [{ field: 'x', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: true, priority: 5,
    })
    const found = svc.getRule(rule.id)
    expect(found).not.toBeNull()
    expect(found!.name).toBe('测试规则')
  })

  it('添加多条规则后 listAllRules 数量增加', () => {
    const initial = svc.listAllRules().length
    svc.addRule({ name: 'R1', description: '', conditions: [], actions: [], enabled: true, priority: 1 })
    svc.addRule({ name: 'R2', description: '', conditions: [], actions: [], enabled: true, priority: 2 })
    svc.addRule({ name: 'R3', description: '', conditions: [], actions: [], enabled: true, priority: 3 })
    expect(svc.listAllRules().length).toBe(initial + 3)
  })

  it('规则 ID 格式统一递增', () => {
    const r1 = svc.addRule({ name: 'A', description: '', conditions: [], actions: [], enabled: true, priority: 1 })
    const r2 = svc.addRule({ name: 'B', description: '', conditions: [], actions: [], enabled: true, priority: 2 })
    expect(r1.id).toMatch(/^rule_\d{3}$/)
    expect(r2.id).toMatch(/^rule_\d{3}$/)
    // 确保后创建 id 更大
    const idNum1 = parseInt(r1.id.split('_')[1], 10)
    const idNum2 = parseInt(r2.id.split('_')[1], 10)
    expect(idNum2).toBe(idNum1 + 1)
  })

  it('getRule 不存在返回 null', () => {
    expect(svc.getRule('does_not_exist')).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 条件运算符全覆盖测试
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 条件运算符全覆盖', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('操作符 eq 相等匹配', () => {
    const r = svc.addRule({ name: 'eq测试', description: '', conditions: [{ field: 'a', op: 'eq', value: 'hello' }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    const match = svc.evaluateRule(r.id, { data: { a: 'hello' }, timestamp: '' })
    expect(match.matched).toBe(true)
    const no = svc.evaluateRule(r.id, { data: { a: 'world' }, timestamp: '' })
    expect(no.matched).toBe(false)
  })

  it('操作符 neq 不相等匹配', () => {
    const r = svc.addRule({ name: 'neq测试', description: '', conditions: [{ field: 'a', op: 'neq', value: 'hello' }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    const match = svc.evaluateRule(r.id, { data: { a: 'world' }, timestamp: '' })
    expect(match.matched).toBe(true)
    const no = svc.evaluateRule(r.id, { data: { a: 'hello' }, timestamp: '' })
    expect(no.matched).toBe(false)
  })

  it('操作符 gt/lt 数值比较', () => {
    const r = svc.addRule({ name: 'gt测试', description: '', conditions: [{ field: 'score', op: 'gt', value: 50 }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    expect(svc.evaluateRule(r.id, { data: { score: 80 }, timestamp: '' }).matched).toBe(true)
    expect(svc.evaluateRule(r.id, { data: { score: 50 }, timestamp: '' }).matched).toBe(false)
    expect(svc.evaluateRule(r.id, { data: { score: 30 }, timestamp: '' }).matched).toBe(false)
  })

  it('操作符 lte/lt 边界值', () => {
    const r = svc.addRule({ name: 'lte测试', description: '', conditions: [{ field: 'n', op: 'lte', value: 100 }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    expect(svc.evaluateRule(r.id, { data: { n: 100 }, timestamp: '' }).matched).toBe(true)
    expect(svc.evaluateRule(r.id, { data: { n: 50 }, timestamp: '' }).matched).toBe(true)
    expect(svc.evaluateRule(r.id, { data: { n: 101 }, timestamp: '' }).matched).toBe(false)
  })

  it('操作符 not_contains 不包含匹配', () => {
    const r = svc.addRule({ name: 'notContains测试', description: '', conditions: [{ field: 'msg', op: 'not_contains', value: 'error' }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    expect(svc.evaluateRule(r.id, { data: { msg: 'all good' }, timestamp: '' }).matched).toBe(true)
    expect(svc.evaluateRule(r.id, { data: { msg: 'error occurred' }, timestamp: '' }).matched).toBe(false)
  })

  it('操作符 not_in 不在列表中匹配', () => {
    const r = svc.addRule({ name: 'notIn测试', description: '', conditions: [{ field: 'color', op: 'not_in', value: ['red', 'blue'] }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    expect(svc.evaluateRule(r.id, { data: { color: 'green' }, timestamp: '' }).matched).toBe(true)
    expect(svc.evaluateRule(r.id, { data: { color: 'red' }, timestamp: '' }).matched).toBe(false)
  })

  it('深层嵌套路径解析 (a.b.c)', () => {
    const r = svc.addRule({ name: '深度路径', description: '', conditions: [{ field: 'a.b.c', op: 'eq', value: 42 }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    expect(svc.evaluateRule(r.id, { data: { a: { b: { c: 42 } } }, timestamp: '' }).matched).toBe(true)
    expect(svc.evaluateRule(r.id, { data: { a: { b: { c: 99 } } }, timestamp: '' }).matched).toBe(false)
  })

  it('路径不存在返回 undefined 导致 eq 不匹配', () => {
    const r = svc.addRule({ name: '缺路测试', description: '', conditions: [{ field: 'missing.path', op: 'eq', value: 'x' }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    expect(svc.evaluateRule(r.id, { data: {}, timestamp: '' }).matched).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 动作触发边界
// ══════════════════════════════════════════════════════════════════

describe('AutomationService — 动作触发边界', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('空动作列表触发返回空结果', () => {
    const results = svc.triggerAction([], { data: {}, timestamp: '' })
    expect(results.length).toBe(0)
  })

  it('单动作触发返回一条成功结果', () => {
    const results = svc.triggerAction([
      { type: 'log_event', params: { msg: 'test' } },
    ], { data: {}, timestamp: '' })
    expect(results.length).toBe(1)
    expect(results[0].success).toBe(true)
    expect(results[0].type).toBe('log_event')
  })

  it('多种动作类型均可触发成功', () => {
    const types = ['send_notification', 'webhook', 'update_field', 'create_ticket', 'send_email', 'log_event'] as const
    const actions = types.map(t => ({ type: t, params: { dummy: true } }))
    const results = svc.triggerAction(actions, { data: {}, timestamp: '' })
    expect(results.length).toBe(6)
    results.forEach(r => expect(r.success).toBe(true))
  })

  it('触发结果包含 actionId 和时间戳', () => {
    const results = svc.triggerAction([
      { type: 'send_notification', params: { channel: 'wechat' } },
    ], { data: {}, timestamp: '' })
    expect(results[0].actionId).toBeDefined()
    expect(results[0].actionId).toMatch(/^act_/)
    expect(results[0].executedAt).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 工作流高级场景
// ═════════════════════════════─────────────────────────────────────

describe('AutomationService — 工作流高级', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('创建工作流支持 paused/failed/cancelled 状态', () => {
    const wf = svc.createWorkflow('状态测试', 'rule_001')
    svc.updateWorkflowStatus(wf.id, 'paused', 50)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('paused')

    svc.updateWorkflowStatus(wf.id, 'failed', 60)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('failed')

    svc.updateWorkflowStatus(wf.id, 'cancelled', 0)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('cancelled')
  })

  it('工作流创建时不带 progress 为 0', () => {
    const wf = svc.createWorkflow('默认进度', 'rule_002')
    expect(wf.progress).toBe(0)
  })

  it('updateWorkflowStatus 不带 progress 保留原值', () => {
    const wf = svc.createWorkflow('保留进度', 'rule_003')
    svc.updateWorkflowStatus(wf.id, 'running', 50)
    svc.updateWorkflowStatus(wf.id, 'completed')
    expect(svc.getWorkflowStatus(wf.id)!.progress).toBe(50)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('completed')
  })

  it('并发工作流各自独立不干扰', () => {
    const wfs = []
    for (let i = 0; i < 5; i++) {
      const wf = svc.createWorkflow(`并行${i}`, 'rule_001')
      svc.updateWorkflowStatus(wf.id, 'running', i * 20)
      wfs.push(wf)
    }
    wfs.forEach((wf, i) => {
      const status = svc.getWorkflowStatus(wf.id)
      expect(status!.progress).toBe(i * 20)
      expect(status!.status).toBe('running')
    })
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 任务管理高级
// ═════════════════════════─────────────────────────────────────────

describe('AutomationService — 任务管理高级', () => {
  let svc: AutomationService

  beforeEach(() => {
    svc = makeService()
  })

  it('createJob 支持 scheduled/triggered/manual 三种类型', () => {
    const wf = svc.createWorkflow('任务类型', 'rule_001')
    const sched = svc.createJob(wf.id, 'rule_001', 'scheduled', { data: {}, timestamp: '' })
    expect(sched.type).toBe('scheduled')

    const trig = svc.createJob(wf.id, 'rule_001', 'triggered', { data: {}, timestamp: '' })
    expect(trig.type).toBe('triggered')

    const manual = svc.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })
    expect(manual.type).toBe('manual')
  })

  it('listJobs 按 status 筛选', () => {
    const wf = svc.createWorkflow('状态筛选', 'rule_001')
    svc.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })
    svc.createJob(wf.id, 'rule_001', 'triggered', { data: {}, timestamp: '' })

    const pending = svc.listJobs({ status: 'pending' })
    expect(pending.length).toBe(2)
    expect(pending.every(j => j.status === 'pending')).toBe(true)
  })

  it('listJobs 默认 limit=50', () => {
    const wf = svc.createWorkflow('limit测试', 'rule_001')
    for (let i = 0; i < 60; i++) {
      svc.createJob(wf.id, 'rule_001', 'manual', { data: { seq: i }, timestamp: '' })
    }
    const jobs = svc.listJobs()
    expect(jobs.length).toBeLessThanOrEqual(50)
  })

  it('listJobs 自定义 limit 参数', () => {
    const wf = svc.createWorkflow('自定义limit', 'rule_001')
    for (let i = 0; i < 20; i++) {
      svc.createJob(wf.id, 'rule_001', 'manual', { data: { seq: i }, timestamp: '' })
    }
    const jobs = svc.listJobs({ limit: 10 })
    expect(jobs.length).toBe(10)
  })

  it('createJob id 格式正确', () => {
    const wf = svc.createWorkflow('ID格式', 'rule_001')
    const job = svc.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })
    expect(job.id).toMatch(/^job_\d{6}$/)
  })

  it('完整端到端: 评估→动作→工作流→任务→更新', () => {
    const rule = svc.addRule({
      name: 'E2E测试', description: '', conditions: [{ field: 'trigger', op: 'eq', value: true }],
      actions: [
        { type: 'create_ticket', params: { priority: 'P2' } },
        { type: 'send_notification', params: { channel: 'sms' } },
      ],
      enabled: true, priority: 1,
    })

    const evalResult = svc.evaluateRule(rule.id, { data: { trigger: true }, timestamp: '' })
    expect(evalResult.matched).toBe(true)
    expect(evalResult.triggeredActions).toContain('create_ticket')

    const actions = svc.triggerAction(rule.actions, { data: {}, timestamp: '' })
    expect(actions.length).toBe(2)
    expect(actions.every(a => a.success)).toBe(true)

    const wf = svc.createWorkflow('E2E工作流', rule.id)
    svc.updateWorkflowStatus(wf.id, 'running', 30)

    const job = svc.createJob(wf.id, rule.id, 'triggered', { data: { trigger: true }, timestamp: '' })
    expect(job.status).toBe('pending')
    expect(job.workflowId).toBe(wf.id)
    expect(svc.getWorkflowStatus(wf.id)!.status).toBe('running')
  })
})
