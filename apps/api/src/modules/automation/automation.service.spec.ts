import { describe, it, expect, beforeEach } from 'vitest'
import { AutomationService, type RuleConditionOp } from './automation.service'

describe('AutomationService', () => {
  let service: AutomationService

  beforeEach(() => {
    service = new AutomationService()
  })

  describe('evaluateRule', () => {
    it('matches all conditions and returns triggered actions', () => {
      const result = service.evaluateRule('rule_001', {
        data: { customer: { score: 9.5 } },
        timestamp: new Date().toISOString(),
      })
      expect(result.matched).toBe(true)
      expect(result.conditionsMet).toBe(1)
      expect(result.conditionsTotal).toBe(1)
      expect(result.triggeredActions).toContain('create_ticket')
      expect(result.triggeredActions).toContain('send_notification')
    })

    it('does not match when condition fails', () => {
      const result = service.evaluateRule('rule_001', {
        data: { customer: { score: 5 } },
        timestamp: new Date().toISOString(),
      })
      expect(result.matched).toBe(false)
      expect(result.triggeredActions).toHaveLength(0)
    })

    it('evaluates multi-condition rule (AND)', () => {
      const result = service.evaluateRule('rule_002', {
        data: { order: { amount: 150000, risk_flag: true } },
        timestamp: new Date().toISOString(),
      })
      expect(result.matched).toBe(true)
      expect(result.conditionsMet).toBe(2)
    })

    it('returns not-matched when only one condition fails in AND', () => {
      const result = service.evaluateRule('rule_002', {
        data: { order: { amount: 150000, risk_flag: false } },
        timestamp: new Date().toISOString(),
      })
      expect(result.matched).toBe(false)
      expect(result.conditionsMet).toBe(1)
    })

    it('returns not-matched for nonexistent rule', () => {
      const result = service.evaluateRule('rule_999', {
        data: {},
        timestamp: new Date().toISOString(),
      })
      expect(result.matched).toBe(false)
      expect(result.ruleName).toBe('unknown')
    })

    it('returns not-matched for disabled rule', () => {
      const result = service.evaluateRule('rule_003', {
        data: { ticket: { age_hours: 48, status: 'open' } },
        timestamp: new Date().toISOString(),
      })
      // rule_003 is enabled by default, so it should match
      expect(result.matched).toBe(true)
    })
  })

  describe('triggerAction', () => {
    it('executes actions successfully', () => {
      const results = service.triggerAction(
        [{ type: 'send_notification', params: { channel: 'slack' } }],
        { data: {}, timestamp: new Date().toISOString() },
      )
      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(results[0].type).toBe('send_notification')
    })

    it('executes multiple actions', () => {
      const results = service.triggerAction(
        [
          { type: 'send_email', params: { to: 'test@test.com' } },
          { type: 'log_event', params: { level: 'info' } },
        ],
        { data: {}, timestamp: new Date().toISOString() },
      )
      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
    })
  })

  describe('createWorkflow / getWorkflowStatus / updateWorkflowStatus', () => {
    it('creates a workflow with idle status', () => {
      const wf = service.createWorkflow('测试工作流', 'rule_001')
      expect(wf.id).toMatch(/^wf_/)
      expect(wf.status).toBe('idle')
      expect(wf.name).toBe('测试工作流')
    })

    it('getWorkflowStatus returns null for unknown workflow', () => {
      expect(service.getWorkflowStatus('wf_9999')).toBeNull()
    })

    it('getWorkflowStatus returns workflow by id', () => {
      const wf = service.createWorkflow('WF', 'rule_001')
      expect(service.getWorkflowStatus(wf.id)).toBeDefined()
    })

    it('updateWorkflowStatus changes status and progress', () => {
      const wf = service.createWorkflow('WF', 'rule_001')
      const updated = service.updateWorkflowStatus(wf.id, 'running', 50)
      expect(updated!.status).toBe('running')
      expect(updated!.progress).toBe(50)
    })

    it('updateWorkflowStatus returns null for unknown workflow', () => {
      expect(service.updateWorkflowStatus('wf_9999', 'failed')).toBeNull()
    })
  })

  describe('listJobs / createJob', () => {
    it('creates a job with pending status', () => {
      const wf = service.createWorkflow('WF', 'rule_001')
      const job = service.createJob(wf.id, 'rule_001', 'manual', {
        data: { test: true },
        timestamp: new Date().toISOString(),
      })
      expect(job.status).toBe('pending')
      expect(job.type).toBe('manual')
    })

    it('listJobs returns created jobs sorted by createdAt desc', () => {
      const wf = service.createWorkflow('WF', 'rule_001')
      service.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })
      service.createJob(wf.id, 'rule_001', 'scheduled', { data: {}, timestamp: '' })
      const jobs = service.listJobs()
      expect(jobs).toHaveLength(2)
    })

    it('listJobs filters by status', () => {
      const wf = service.createWorkflow('WF', 'rule_001')
      service.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })
      const pending = service.listJobs({ status: 'pending' })
      expect(pending).toHaveLength(1)
    })

    it('listJobs respects limit', () => {
      const wf = service.createWorkflow('WF', 'rule_001')
      service.createJob(wf.id, 'rule_001', 'manual', { data: {}, timestamp: '' })
      service.createJob(wf.id, 'rule_001', 'triggered', { data: {}, timestamp: '' })
      expect(service.listJobs({ limit: 1 })).toHaveLength(1)
    })
  })

  describe('getRule / listAllRules / addRule', () => {
    it('returns null for unknown rule', () => {
      expect(service.getRule('rule_999')).toBeNull()
    })

    it('returns rule by id', () => {
      const rule = service.getRule('rule_001')
      expect(rule).toBeDefined()
      expect(rule!.name).toBe('高票客户自动创建工单')
    })

    it('listAllRules returns all rules (default + added)', () => {
      const rules = service.listAllRules()
      expect(rules).toHaveLength(3)
    })

    it('addRule creates a new rule with auto-generated id', () => {
      const rule = service.addRule({
        name: '测试规则',
        description: '测试',
        conditions: [{ field: 'test', op: 'eq' as RuleConditionOp, value: true }],
        actions: [{ type: 'log_event', params: {} }],
        enabled: true,
        priority: 1,
      })
      expect(rule.id).toMatch(/^rule_/)
      expect(rule.name).toBe('测试规则')
      expect(service.listAllRules()).toHaveLength(4)
    })
  })
})
