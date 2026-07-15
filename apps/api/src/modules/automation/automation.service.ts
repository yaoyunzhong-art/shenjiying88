/**
 * automation.service.ts - 自动化规则引擎服务
 *
 * 提供规则评估、动作触发、工作流状态查询、任务列表等自动化能力。
 * 采用内存规则引擎，支持条件-动作模式。
 *
 * 功能:
 *   - evaluateRule(): 评估规则条件
 *   - triggerAction(): 触发规则动作
 *   - getWorkflowStatus(): 查询工作流状态
 *   - listJobs(): 列出任务列表
 *
 * 树哥后台自动执行: 自动化规则引擎
 */

import { Injectable, Logger } from '@nestjs/common'

// ── 类型 ──

export type RuleConditionOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in'

export interface RuleCondition {
  field: string
  op: RuleConditionOp
  value: unknown
}

export interface Rule {
  id: string
  name: string
  description: string
  conditions: RuleCondition[]
  actions: ActionDefinition[]
  enabled: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface ActionDefinition {
  type: ActionType
  params: Record<string, unknown>
}

export type ActionType = 'send_notification' | 'webhook' | 'update_field' | 'create_ticket' | 'send_email' | 'log_event'

export interface EvaluationContext {
  data: Record<string, unknown>
  timestamp: string
}

export interface EvaluationResult {
  ruleId: string
  ruleName: string
  matched: boolean
  conditionsMet: number
  conditionsTotal: number
  triggeredActions: string[]
  evaluatedAt: string
}

export interface TriggerResult {
  actionId: string
  type: ActionType
  success: boolean
  output?: string
  error?: string
  executedAt: string
}

export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface Workflow {
  id: string
  name: string
  status: WorkflowStatus
  ruleId: string
  startedAt: string
  updatedAt: string
  progress: number // 0-100
  error?: string
  results: TriggerResult[]
}

export interface AutomationJob {
  id: string
  workflowId: string
  ruleId: string
  type: 'scheduled' | 'triggered' | 'manual'
  status: 'pending' | 'running' | 'completed' | 'failed'
  inputContext: EvaluationContext
  triggerResults: TriggerResult[]
  createdAt: string
  completedAt?: string
}

// ── 默认规则 ──

const DEFAULT_RULES: Rule[] = [
  {
    id: 'rule_001',
    name: '高票客户自动创建工单',
    description: '客户评分≥9时自动创建VIP工单',
    conditions: [
      { field: 'customer.score', op: 'gte', value: 9 },
    ],
    actions: [
      {
        type: 'create_ticket',
        params: { priority: 'P0', category: 'vip_feedback' },
      },
      {
        type: 'send_notification',
        params: { channel: 'slack', template: 'vip_alert' },
      },
    ],
    enabled: true,
    priority: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'rule_002',
    name: '异常订单告警',
    description: '订单金额异常波动触发告警',
    conditions: [
      { field: 'order.amount', op: 'gt', value: 100000 },
      { field: 'order.risk_flag', op: 'eq', value: true },
    ],
    actions: [
      {
        type: 'send_email',
        params: { to: 'risk@company.com', subject: '高风险订单告警' },
      },
      {
        type: 'send_notification',
        params: { channel: 'teams', template: 'risk_alert' },
      },
    ],
    enabled: true,
    priority: 8,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-05-20T00:00:00Z',
  },
  {
    id: 'rule_003',
    name: '超时工单升级',
    description: '工单超24小时未处理自动升级',
    conditions: [
      { field: 'ticket.age_hours', op: 'gte', value: 24 },
      { field: 'ticket.status', op: 'in', value: ['open', 'pending'] },
    ],
    actions: [
      {
        type: 'update_field',
        params: { target: 'ticket.priority', value: 'critical' },
      },
      {
        type: 'send_notification',
        params: { channel: 'email', template: 'escalation_alert' },
      },
    ],
    enabled: true,
    priority: 5,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
  },
]

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name)
  private rules: Rule[] = [...DEFAULT_RULES]
  private workflows: Workflow[] = []
  private jobs: AutomationJob[] = []
  private ruleCounter = 3
  private workflowCounter = 0
  private jobCounter = 0

  /**
   * 评估规则: 根据上下文数据匹配规则
   */
  evaluateRule(ruleId: string, context: EvaluationContext): EvaluationResult {
    const rule = this.rules.find(r => r.id === ruleId)
    if (!rule) {
      this.logger.warn(`[evaluateRule] 规则不存在: ${ruleId}`)
      return {
        ruleId,
        ruleName: 'unknown',
        matched: false,
        conditionsMet: 0,
        conditionsTotal: 0,
        triggeredActions: [],
        evaluatedAt: new Date().toISOString(),
      }
    }

    if (!rule.enabled) {
      this.logger.debug(`[evaluateRule] 规则已禁用: ${rule.name}`)
      return {
        ruleId,
        ruleName: rule.name,
        matched: false,
        conditionsMet: 0,
        conditionsTotal: rule.conditions.length,
        triggeredActions: [],
        evaluatedAt: new Date().toISOString(),
      }
    }

    let metCount = 0
    const conditionResults: boolean[] = []

    for (const cond of rule.conditions) {
      const actualValue = this.resolvePath(context.data, cond.field)
      const matched = this.evaluateCondition(actualValue, cond.op, cond.value)
      conditionResults.push(matched)
      if (matched) metCount++
    }

    const allMatched = conditionResults.every(Boolean)
    const triggeredActions = allMatched ? rule.actions.map(a => a.type) : []

    this.logger.log(`[evaluateRule] ${rule.name}: matched=${allMatched} (${metCount}/${rule.conditions.length})`)

    return {
      ruleId,
      ruleName: rule.name,
      matched: allMatched,
      conditionsMet: metCount,
      conditionsTotal: rule.conditions.length,
      triggeredActions,
      evaluatedAt: new Date().toISOString(),
    }
  }

  /**
   * 触发动作: 根据规则匹配合格时执行
   */
  triggerAction(actions: ActionDefinition[], context: EvaluationContext): TriggerResult[] {
    const results: TriggerResult[] = []

    for (const action of actions) {
      const id = `act_${Date.now()}_${results.length}`
      try {
        this.logger.log(`[triggerAction] 执行动作 ${action.type} id=${id}`)
        results.push({
          actionId: id,
          type: action.type,
          success: true,
          output: `动作 ${action.type} 已执行, params=${JSON.stringify(action.params)}`,
          executedAt: new Date().toISOString(),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        this.logger.error(`[triggerAction] 动作执行失败: ${action.type} - ${msg}`)
        results.push({
          actionId: id,
          type: action.type,
          success: false,
          error: msg,
          executedAt: new Date().toISOString(),
        })
      }
    }

    return results
  }

  /**
   * 创建并启动工作流
   */
  createWorkflow(name: string, ruleId: string): Workflow {
    this.workflowCounter++
    const wf: Workflow = {
      id: `wf_${String(this.workflowCounter).padStart(4, '0')}`,
      name,
      status: 'idle',
      ruleId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      results: [],
    }
    this.workflows.push(wf)
    this.logger.log(`[createWorkflow] ${wf.id} - ${name}`)
    return wf
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(workflowId: string): Workflow | null {
    const wf = this.workflows.find(w => w.id === workflowId)
    if (!wf) {
      this.logger.warn(`[getWorkflowStatus] 工作流不存在: ${workflowId}`)
      return null
    }
    return wf
  }

  /**
   * 更新工作流状态
   */
  updateWorkflowStatus(workflowId: string, status: WorkflowStatus, progress?: number): Workflow | null {
    const wf = this.workflows.find(w => w.id === workflowId)
    if (!wf) {
      this.logger.warn(`[updateWorkflowStatus] 工作流不存在: ${workflowId}`)
      return null
    }
    wf.status = status
    wf.updatedAt = new Date().toISOString()
    if (progress !== undefined) {
      wf.progress = Math.max(0, Math.min(100, progress))
    }
    this.logger.log(`[updateWorkflowStatus] ${workflowId} -> ${status} (${wf.progress}%)`)
    return wf
  }

  /**
   * 列出任务列表
   */
  listJobs(filter?: {
    status?: AutomationJob['status']
    type?: AutomationJob['type']
    limit?: number
  }): AutomationJob[] {
    let filtered = [...this.jobs]

    if (filter?.status) {
      filtered = filtered.filter(j => j.status === filter.status)
    }
    if (filter?.type) {
      filtered = filtered.filter(j => j.type === filter.type)
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const limit = filter?.limit ?? 50
    const result = filtered.slice(0, limit)

    this.logger.debug(`[listJobs] 共${filtered.length}条, 返回${result.length}条`)
    return result
  }

  /**
   * 创建任务
   */
  createJob(workflowId: string, ruleId: string, type: AutomationJob['type'], context: EvaluationContext): AutomationJob {
    this.jobCounter++
    const job: AutomationJob = {
      id: `job_${String(this.jobCounter).padStart(6, '0')}`,
      workflowId,
      ruleId,
      type,
      status: 'pending',
      inputContext: context,
      triggerResults: [],
      createdAt: new Date().toISOString(),
    }
    this.jobs.push(job)
    this.logger.log(`[createJob] ${job.id} type=${type} workflow=${workflowId}`)
    return job
  }

  /**
   * 获取规则详情
   */
  getRule(ruleId: string): Rule | null {
    return this.rules.find(r => r.id === ruleId) ?? null
  }

  /**
   * 列出所有规则
   */
  listAllRules(): Rule[] {
    return [...this.rules]
  }

  /**
   * 添加新规则
   */
  addRule(rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Rule {
    this.ruleCounter++
    const newRule: Rule = {
      ...rule,
      id: `rule_${String(this.ruleCounter).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.rules.push(newRule)
    this.logger.log(`[addRule] ${newRule.id} - ${newRule.name}`)
    return newRule
  }

  // ── Private ──

  private resolvePath(data: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.')
    let current: unknown = data
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = (current as Record<string, unknown>)[part]
    }
    return current
  }

  private evaluateCondition(actual: unknown, op: RuleConditionOp, expected: unknown): boolean {
    switch (op) {
      case 'eq':
        return actual === expected
      case 'neq':
        return actual !== expected
      case 'gt':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected
      case 'gte':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected
      case 'lt':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected
      case 'lte':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected
      case 'contains':
        return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected)
      case 'not_contains':
        return typeof actual === 'string' && typeof expected === 'string' && !actual.includes(expected)
      case 'in':
        return Array.isArray(expected) && expected.includes(actual)
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual)
      default:
        this.logger.warn(`[evaluateCondition] 未知操作符: ${op}`)
        return false
    }
  }
}
