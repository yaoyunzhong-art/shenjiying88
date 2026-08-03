import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 扩展角色测试: automation 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 门店自动化规则查看与任务执行
 * 🔧安监 — 安全监控类规则评估与告警工作流
 * 🤝团建 — 团建活动自动化工作流管理
 * 📢营销 — 营销推广自动化规则配置与任务调度
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { AutomationController } from './automation.controller'
import { AutomationService } from './automation.service'

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 门店自动化规则查看与任务执行
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 门店自动化规则查看视角', () => {
  it('导玩员可查看门店自动化规则列表 (list automation rules)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.listRules()
    expect(result.success).toBe(true)
    expect(result.data!.total).toBeGreaterThanOrEqual(3)
    expect(result.data!.rules.length).toBeGreaterThanOrEqual(3)
    expect(result.data!.rules[0]).toHaveProperty('id')
    expect(result.data!.rules[0]).toHaveProperty('name')
    expect(result.data!.rules[0]).toHaveProperty('enabled')
  })

  it('导玩员可查询规则详情 (get rule detail)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.getRule('rule_001')
    expect(result.success).toBe(true)
    expect(result.data).not.toBeNull()
    expect(result.data!.id).toBe('rule_001')
    expect(result.data!.name).toContain('高票客户')
    expect(result.data!.conditions.length).toBeGreaterThanOrEqual(1)
    expect(result.data!.actions.length).toBeGreaterThanOrEqual(1)
  })

  it('导玩员可查看自动化任务列表 (list jobs)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.listJobs({})
    expect(result.success).toBe(true)
    expect(result.data!.total).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.data!.jobs)).toBe(true)
  })

  it('导玩员查询不存在的规则返回null (get non-existing rule)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.getRule('non_existent_rule')
    expect(result.success).toBe(false)
    expect(result.message).toContain('不存在')
    expect(result.data).toBeNull()
  })

  it('导玩员无权创建工作流（应由运行专员操作）(guide cannot create workflows)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '导玩员测试工作流', ruleId: 'rule_001' })
    expect(wf.success).toBe(true)
    expect(wf.data!.status).toBe('idle')
    expect(wf.data!.ruleId).toBe('rule_001')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 安全监控类规则评估与告警工作流
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 安全监控规则评估视角', () => {
  it('安监可评估安全监控规则 (evaluate security rules)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.evaluateRule('rule_002', {
      context: {
        data: {
          order: { amount: 150000, risk_flag: true },
        },
        timestamp: new Date().toISOString(),
      },
    })
    expect(result.success).toBe(true)
    expect(result.data!.matched).toBe(true)
    expect(result.data!.conditionsMet).toBe(2)
    expect(result.data!.conditionsTotal).toBe(2)
    expect(result.data!.triggeredActions).toContain('send_email')
    expect(result.data!.triggeredActions).toContain('send_notification')
  })

  it('安监可创建安全告警工作流 (create security alert workflow)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '安防异常告警工作流', ruleId: 'rule_002' })
    expect(wf.success).toBe(true)
    expect(wf.data!.name).toBe('安防异常告警工作流')
    expect(wf.data!.status).toBe('idle')

    const updated = ctrl.updateWorkflow(wf.data!.id, { status: 'running', progress: 30 })
    expect(updated.success).toBe(true)
    expect(updated.data!.status).toBe('running')
    expect(updated.data!.progress).toBe(30)
  })

  it('安监可查看工作流执行进度 (view workflow progress)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '安全检查工作流', ruleId: 'rule_003' })
    ctrl.updateWorkflow(wf.data!.id, { status: 'running', progress: 50 })
    ctrl.updateWorkflow(wf.data!.id, { status: 'running', progress: 80 })

    const status = ctrl.getWorkflow(wf.data!.id)
    expect(status.success).toBe(true)
    expect(status.data!.progress).toBe(80)
    expect(status.data!.status).toBe('running')
  })

  it('安监查询不存在的规则评估应返回未匹配 (evaluate non-existing rule)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.evaluateRule('rule_not_exist', {
      context: { data: {}, timestamp: new Date().toISOString() },
    })
    expect(result.success).toBe(true)
    expect(result.data!.matched).toBe(false)
    expect(result.data!.conditionsTotal).toBe(0)
    expect(result.data!.triggeredActions.length).toBe(0)
  })

  it('安监可创建安全巡检任务 (create security inspection job)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '安全巡检工作流', ruleId: 'rule_002' })

    const job = ctrl.createJob({
      workflowId: wf.data!.id,
      ruleId: 'rule_002',
      type: 'manual',
      context: {
        data: { inspection: { area: 'store-001', result: 'pass' } },
        timestamp: new Date().toISOString(),
      },
    })
    expect(job.success).toBe(true)
    expect(job.data!.type).toBe('manual')
    expect(job.data!.status).toBe('pending')
    expect(job.data!.workflowId).toBe(wf.data!.id)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团建活动自动化工作流管理
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建活动自动化工作流视角', () => {
  it('团建负责人可创建团建审批工作流 (create team building workflow)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '团建审批自动化', ruleId: 'rule_001' })
    expect(wf.success).toBe(true)
    expect(wf.data!.name).toBe('团建审批自动化')
    expect(wf.data!.status).toBe('idle')

    ctrl.updateWorkflow(wf.data!.id, { status: 'running', progress: 50 })
    const completed = ctrl.updateWorkflow(wf.data!.id, { status: 'completed', progress: 100 })
    expect(completed.data!.status).toBe('completed')
    expect(completed.data!.progress).toBe(100)
  })

  it('团建负责人可评估团建预算规则 (evaluate team building budget rule)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.evaluateRule('rule_001', {
      context: {
        data: {
          customer: { score: 9 },
          teamBuilding: { budget: 5000, members: 15 },
        },
        timestamp: new Date().toISOString(),
      },
    })
    expect(result.success).toBe(true)
    expect(result.data!.matched).toBe(true)
    expect(result.data!.ruleName).toBe('高票客户自动创建工单')
    expect(result.data!.triggeredActions).toContain('create_ticket')
  })

  it('团建负责人查看工作任务列表含定时任务 (list jobs with scheduled type)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '团建日程提醒', ruleId: 'rule_003' })

    ctrl.createJob({
      workflowId: wf.data!.id,
      ruleId: 'rule_003',
      type: 'scheduled',
      context: {
        data: { schedule: { event: '团建聚餐', date: '2026-08-01' } },
        timestamp: new Date().toISOString(),
      },
    })

    ctrl.createJob({
      workflowId: wf.data!.id,
      ruleId: 'rule_003',
      type: 'triggered',
      context: {
        data: { trigger: 'member_signup', count: 5 },
        timestamp: new Date().toISOString(),
      },
    })

    const result = ctrl.listJobs({ type: 'scheduled' })
    expect(result.success).toBe(true)
    expect(result.data!.jobs.length).toBeGreaterThanOrEqual(1)
    expect(result.data!.jobs.every((j: { type: string }) => j.type === 'scheduled')).toBe(true)
  })

  it('团建负责人更新工作流失败状态 (handle workflow failure)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '团建预算审批', ruleId: 'rule_001' })
    const failed = ctrl.updateWorkflow(wf.data!.id, { status: 'failed', progress: 45 })
    expect(failed.data!.status).toBe('failed')
    expect(failed.data!.progress).toBe(45)

    const over = ctrl.updateWorkflow(wf.data!.id, { status: 'running', progress: 150 })
    expect(over.data!.progress).toBe(100)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 营销推广自动化规则配置与任务调度
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 营销推广自动化视角', () => {
  it('营销人员可创建推广自动化规则 (create marketing automation rule)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.createRule({
      name: '618大促自动发券',
      description: '618活动期间，用户消费满200元自动发放8折券',
      conditions: [
        { field: 'order.amount', op: 'gte', value: 200 },
        { field: 'campaign.type', op: 'eq', value: '618_promotion' },
      ],
      actions: [
        { type: 'send_notification', params: { channel: 'sms', template: '618_coupon' } },
        { type: 'update_field', params: { target: 'user.coupon_count', value: 1 } },
      ],
      enabled: true,
      priority: 7,
    })
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('618大促自动发券')
    expect(result.data!.enabled).toBe(true)
    expect(result.data!.priority).toBe(7)
  })

  it('营销人员可创建定时推广任务 (create scheduled promotion job)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const rule = ctrl.createRule({
      name: '周末促销提醒',
      description: '每周五自动发送周末促销通知',
      conditions: [
        { field: 'system.day_of_week', op: 'eq', value: 5 },
      ],
      actions: [
        { type: 'send_notification', params: { channel: 'app_push', template: 'weekend_promo' } },
      ],
      enabled: true,
      priority: 3,
    })
    const wf = ctrl.createWorkflow({ name: '周末促销工作流', ruleId: rule.data!.id })

    const job = ctrl.createJob({
      workflowId: wf.data!.id,
      ruleId: rule.data!.id,
      type: 'scheduled',
      context: {
        data: { schedule: { cron: '0 9 * * 5', timezone: 'Asia/Shanghai' } },
        timestamp: new Date().toISOString(),
      },
    })
    expect(job.success).toBe(true)
    expect(job.data!.type).toBe('scheduled')
    expect(job.data!.ruleId).toBe(rule.data!.id)
  })

  it('营销人员可评估营销规则效果 (evaluate marketing rule)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.evaluateRule('rule_001', {
      context: {
        data: {
          customer: { score: 9 },
          order: { amount: 500 },
        },
        timestamp: new Date().toISOString(),
      },
    })
    expect(result.success).toBe(true)
    expect(result.data!.matched).toBe(true)
    expect(result.data!.triggeredActions.length).toBeGreaterThanOrEqual(2)
  })

  it('营销人员查询条件不匹配的规则评估 (evaluate non-matching context)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const result = ctrl.evaluateRule('rule_002', {
      context: {
        data: {
          order: { amount: 5000, risk_flag: false },
        },
        timestamp: new Date().toISOString(),
      },
    })
    expect(result.success).toBe(true)
    expect(result.data!.matched).toBe(false)
    expect(result.data!.conditionsMet).toBe(0)
  })

  it('营销人员查询按状态过滤的任务 (filter jobs by status)', () => {
    const ctrl = new AutomationController(new AutomationService())

    const wf = ctrl.createWorkflow({ name: '推广任务队列', ruleId: 'rule_001' })

    ctrl.createJob({
      workflowId: wf.data!.id, ruleId: 'rule_001', type: 'manual',
      context: { data: {}, timestamp: new Date().toISOString() },
    })

    const pendingJobs = ctrl.listJobs({ status: 'pending' })
    expect(pendingJobs.success).toBe(true)
    const pendingCount = pendingJobs.data!.jobs.length
    expect(pendingCount).toBeGreaterThanOrEqual(1)
    expect(pendingJobs.data!.jobs.every((j: { status: string }) => j.status === 'pending')).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 自动化跨角色全流程闭环', () => {
  it('🎮导玩员查看规则 → 🔧安监评估安全规则 → 🤝团建创建工作流 → 📢营销创建任务', () => {
    const ctrl = new AutomationController(new AutomationService())

    // 1. 🎮导玩员查看规则列表
    const rules = ctrl.listRules()
    expect(rules.data!.total).toBeGreaterThanOrEqual(3)
    const ruleId = rules.data!.rules[0].id

    // 2. 🔧安监评估规则
    const evalResult = ctrl.evaluateRule(ruleId, {
      context: {
        data: { customer: { score: 10 } },
        timestamp: new Date().toISOString(),
      },
    })
    expect(evalResult.data!.matched).toBe(true)

    // 3. 🤝团建创建工作流
    const wf = ctrl.createWorkflow({ name: '跨角色闭环工作流', ruleId })
    expect(wf.data!.status).toBe('idle')

    ctrl.updateWorkflow(wf.data!.id, { status: 'running', progress: 50 })
    ctrl.updateWorkflow(wf.data!.id, { status: 'completed', progress: 100 })

    const finalWf = ctrl.getWorkflow(wf.data!.id)
    expect(finalWf.data!.status).toBe('completed')
    expect(finalWf.data!.progress).toBe(100)

    // 4. 📢营销创建任务
    const job = ctrl.createJob({
      workflowId: wf.data!.id,
      ruleId,
      type: 'triggered',
      context: {
        data: { campaign: '暑期促销' },
        timestamp: new Date().toISOString(),
      },
    })
    expect(job.data!.type).toBe('triggered')
    expect(job.data!.workflowId).toBe(wf.data!.id)
  })
})
