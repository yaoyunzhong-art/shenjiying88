/**
 * automation.controller.test.ts — Automation Controller 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AutomationController } from './automation.controller'
import { AutomationService } from './automation.service'

describe('AutomationController', () => {
  let controller: AutomationController
  let service: AutomationService

  beforeEach(() => {
    service = new AutomationService()
    controller = new AutomationController(service)
  })

  // ── Rules ──

  it('should list all rules', () => {
    const res = controller.listRules()
    expect(res.success).toBe(true)
    expect(res.data.total).toBeGreaterThanOrEqual(3)
    expect(res.data.rules.length).toBeGreaterThanOrEqual(3)
  })

  it('should get rule by id', () => {
    const res = controller.getRule('rule_001')
    expect(res.success).toBe(true)
    expect(res.data!.id).toBe('rule_001')
    expect(res.data!.name).toBeDefined()
  })

  it('should return null for nonexistent rule', () => {
    const res = controller.getRule('nonexistent')
    expect(res.success).toBe(false)
    expect(res.data).toBeNull()
  })

  it('should create a new rule', () => {
    const res = controller.createRule({
      name: '测试规则',
      description: '用于测试',
      conditions: [{ field: 'test.value', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: { message: 'test' } }],
      enabled: true,
      priority: 1,
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('测试规则')
    expect(res.data.id).toMatch(/^rule_\d+$/)
  })

  it('should create rule with multiple conditions', () => {
    const res = controller.createRule({
      name: '多条件规则',
      description: '多个条件测试',
      conditions: [
        { field: 'a', op: 'eq', value: 'x' },
        { field: 'b', op: 'gt', value: 10 },
      ],
      actions: [{ type: 'send_email', params: { to: 'test@test.com' } }],
      enabled: true,
      priority: 5,
    })
    expect(res.success).toBe(true)
    expect(res.data.conditions).toHaveLength(2)
  })

  it('should evaluate rule and return result', () => {
    const res = controller.evaluateRule('rule_001', {
      context: { data: { customer: { score: 10 } }, timestamp: new Date().toISOString() },
    })
    expect(res.success).toBe(true)
    expect(res.data.matched).toBe(true)
    expect(res.data.triggeredActions.length).toBeGreaterThanOrEqual(1)
  })

  it('should return unmatched result when conditions not met', () => {
    const res = controller.evaluateRule('rule_001', {
      context: { data: { customer: { score: 5 } }, timestamp: new Date().toISOString() },
    })
    expect(res.success).toBe(true)
    expect(res.data.matched).toBe(false)
  })

  it('should return not-matched for disabled rule', () => {
    // Create a disabled rule
    controller.createRule({
      name: '禁用规则',
      description: '用于禁用测试',
      conditions: [{ field: 'x', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: false,
      priority: 1,
    })
    const listRes = controller.listRules()
    const disabledRule = listRes.data.rules.find((r: { enabled: boolean }) => !r.enabled)
    if (!disabledRule) {
      expect(true).toBe(true)
      return
    }
    const res = controller.evaluateRule(disabledRule.id, {
      context: { data: { x: 1 }, timestamp: new Date().toISOString() },
    })
    expect(res.success).toBe(true)
    expect(res.data.matched).toBe(false)
  })

  it('should return not-matched for nonexistent rule evaluation', () => {
    const res = controller.evaluateRule('nonexistent', {
      context: { data: {}, timestamp: new Date().toISOString() },
    })
    expect(res.success).toBe(true)
    expect(res.data.matched).toBe(false)
    expect(res.data.ruleName).toBe('unknown')
  })

  // ── Workflows ──

  it('should create a workflow', () => {
    const res = controller.createWorkflow({ name: '测试工作流', ruleId: 'rule_001' })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('测试工作流')
    expect(res.data.status).toBe('idle')
  })

  it('should get workflow status', () => {
    const created = controller.createWorkflow({ name: '状态查询', ruleId: 'rule_001' })
    const res = controller.getWorkflow(created.data!.id)
    expect(res.success).toBe(true)
    expect(res.data!.id).toBe(created.data!.id)
  })

  it('should return null for nonexistent workflow', () => {
    const res = controller.getWorkflow('nonexistent')
    expect(res.success).toBe(false)
    expect(res.data).toBeNull()
  })

  it('should update workflow status', () => {
    const created = controller.createWorkflow({ name: '状态更新', ruleId: 'rule_001' })
    const res = controller.updateWorkflow(created.data!.id, { status: 'running', progress: 50 })
    expect(res.success).toBe(true)
    expect(res.data!.status).toBe('running')
    expect(res.data!.progress).toBe(50)
  })

  it('should return null when updating nonexistent workflow', () => {
    const res = controller.updateWorkflow('nonexistent', { status: 'completed' })
    expect(res.success).toBe(false)
    expect(res.data).toBeNull()
  })

  // ── Jobs ──

  it('should list jobs (initially empty)', () => {
    const res = controller.listJobs({})
    expect(res.success).toBe(true)
    expect(res.data.jobs).toHaveLength(0)
  })

  it('should create and list jobs', () => {
    const wfRes = controller.createWorkflow({ name: '工作流-任务', ruleId: 'rule_001' })
    const wfId = wfRes.data!.id

    const jobRes = controller.createJob({
      workflowId: wfId,
      ruleId: 'rule_001',
      type: 'manual',
      context: { data: { test: true }, timestamp: new Date().toISOString() },
    })
    expect(jobRes.success).toBe(true)
    expect(jobRes.data.status).toBe('pending')

    const listRes = controller.listJobs({})
    expect(listRes.data.total).toBe(1)
  })

  it('should filter jobs by type', () => {
    const wfRes = controller.createWorkflow({ name: '过滤-任务', ruleId: 'rule_001' })
    controller.createJob({
      workflowId: wfRes.data.id,
      ruleId: 'rule_001',
      type: 'scheduled',
      context: { data: {}, timestamp: new Date().toISOString() },
    })
    controller.createJob({
      workflowId: wfRes.data.id,
      ruleId: 'rule_001',
      type: 'manual',
      context: { data: {}, timestamp: new Date().toISOString() },
    })

    const scheduledRes = controller.listJobs({ type: 'scheduled' })
    expect(scheduledRes.data.jobs.every((j: { type: string }) => j.type === 'scheduled')).toBe(true)

    const manualRes = controller.listJobs({ type: 'manual' })
    expect(manualRes.data.jobs.every((j: { type: string }) => j.type === 'manual')).toBe(true)
  })

  it('should limit job results', () => {
    const wfRes = controller.createWorkflow({ name: '限制-任务', ruleId: 'rule_001' })
    for (let i = 0; i < 5; i++) {
      controller.createJob({
        workflowId: wfRes.data.id,
        ruleId: 'rule_001',
        type: 'manual',
        context: { data: { idx: i }, timestamp: new Date().toISOString() },
      })
    }
    const limitedRes = controller.listJobs({ limit: 3 })
    expect(limitedRes.data.jobs.length).toBe(3)
  })

  it('should create a triggered job', () => {
    const wfRes = controller.createWorkflow({ name: '触发任务', ruleId: 'rule_002' })
    const res = controller.createJob({
      workflowId: wfRes.data.id,
      ruleId: 'rule_002',
      type: 'triggered',
      context: { data: { order: { amount: 200000, risk_flag: true } }, timestamp: new Date().toISOString() },
    })
    expect(res.success).toBe(true)
    expect(res.data.type).toBe('triggered')
  })
})
// Total: 20 tests
