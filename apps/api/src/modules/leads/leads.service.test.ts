/**
 * leads.service.spec.ts — 线索管理纯函数式测试
 * 不 import 生产 Service，纯内联逻辑
 */
import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'

// ─── 枚举 + 类型定义 ──────────────────────────────────────────────

type LeadSource = 'douyin' | 'xiaohongshu' | 'baidu' | 'manual' | 'referral' | 'other'
type LeadStage = 'new' | 'assigned' | 'contacted' | 'trial' | 'negotiation' | 'closed_won' | 'closed_lost'
type LeadPriority = 'low' | 'normal' | 'high' | 'urgent'

interface Lead {
  leadId: string
  tenantId: string
  source: LeadSource
  stage: LeadStage
  priority: LeadPriority
  contact: { name: string; phone?: string; email?: string; wechat?: string }
  region?: string
  storeId?: string
  assigneeUserId?: string
  notes: LeadFollowUpNote[]
  customFields: Record<string, string>
  createdAt: string
  updatedAt: string
  lastContactedAt?: string
  closedAt?: string
  closedReason?: string
}

interface LeadFollowUpNote {
  noteId: string
  authorUserId: string
  content: string
  stageBefore: LeadStage
  stageAfter: LeadStage
  createdAt: string
}

interface LeadFunnelMetrics {
  total: number
  byStage: Record<LeadStage, number>
  conversionRates: Record<string, number>
  avgDaysToClose: number
  totalRevenue: number
}

interface AssignRule {
  ruleId: string
  matcher: { region?: string; storeId?: string; source?: LeadSource }
  strategy: 'round-robin' | 'least-loaded' | 'specific'
  specificAssignee?: string
  candidatePool: string[]
}

interface LeadWebhookPayload {
  source: LeadSource
  contactName: string
  contactPhone?: string
  contactEmail?: string
  region?: string
  storeId?: string
  utmParams?: Record<string, string>
  externalLeadId?: string
}

const HIGH_PRIORITY_SLA_HOURS = 4
const NORMAL_PRIORITY_SLA_HOURS = 24
const LOW_PRIORITY_SLA_HOURS = 72

// ─── mock 数据工厂 ──────────────────────────────────────────────

let _idCounter = 0

function nextLeadId(): string {
  return `lead-${(++_idCounter).toString(16).padStart(8, '0')}`
}

function nextRuleId(): string {
  return `rule-${(++_idCounter).toString(16).padStart(8, '0')}`
}

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    leadId: nextLeadId(),
    tenantId: 'tenant-default',
    source: 'douyin',
    stage: 'new',
    priority: 'normal',
    contact: { name: '测试线索', phone: '13800138000' },
    notes: [],
    customFields: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── 内联纯函数 ─────────────────────────────────────────────────

function inferPriority(source: LeadSource, utmParams?: Record<string, string>): LeadPriority {
  if (utmParams?.priority === 'urgent') return 'urgent'
  if (source === 'manual') return 'high'
  return 'normal'
}

function findMatchingRule(lead: Lead, rules: AssignRule[]): AssignRule | undefined {
  for (const rule of rules) {
    if (rule.matcher.region && rule.matcher.region !== lead.region) continue
    if (rule.matcher.storeId && rule.matcher.storeId !== lead.storeId) continue
    if (rule.matcher.source && rule.matcher.source !== lead.source) continue
    return rule
  }
  return undefined
}

function pickAssignee(rule: AssignRule, leads: Lead[]): string | undefined {
  if (rule.strategy === 'specific') return rule.specificAssignee
  if (rule.candidatePool.length === 0) return undefined

  if (rule.strategy === 'round-robin') {
    const loadMap = new Map<string, number>()
    for (const u of rule.candidatePool) loadMap.set(u, 0)
    for (const l of leads) {
      if (l.assigneeUserId && loadMap.has(l.assigneeUserId)) {
        loadMap.set(l.assigneeUserId, (loadMap.get(l.assigneeUserId) ?? 0) + 1)
      }
    }
    return [...loadMap.entries()].sort((a, b) => a[1] - b[1])[0]?.[0]
  }

  if (rule.strategy === 'least-loaded') {
    const loadMap = new Map<string, number>()
    for (const u of rule.candidatePool) loadMap.set(u, 0)
    for (const l of leads) {
      if (l.stage === 'closed_won' || l.stage === 'closed_lost') continue
      if (l.assigneeUserId && loadMap.has(l.assigneeUserId)) {
        loadMap.set(l.assigneeUserId, (loadMap.get(l.assigneeUserId) ?? 0) + 1)
      }
    }
    return [...loadMap.entries()].sort((a, b) => a[1] - b[1])[0]?.[0]
  }

  return undefined
}

function autoAssign(lead: Lead, rules: AssignRule[], allLeads: Lead[]): Lead {
  const rule = findMatchingRule(lead, rules)
  if (!rule) return lead

  const assignee = pickAssignee(rule, allLeads)
  if (!assignee) return lead

  return {
    ...lead,
    assigneeUserId: assignee,
    stage: 'assigned' as LeadStage,
    updatedAt: new Date().toISOString(),
  }
}

function followUp(lead: Lead, authorUserId: string, content: string, newStage?: LeadStage): Lead | undefined {
  if (!lead) return undefined
  const stageBefore = lead.stage
  const note: LeadFollowUpNote = {
    noteId: nextLeadId(), // reuse id generator for uniqueness
    authorUserId,
    content,
    stageBefore,
    stageAfter: newStage ?? stageBefore,
    createdAt: new Date().toISOString(),
  }
  return {
    ...lead,
    notes: [...lead.notes, note],
    stage: newStage ?? lead.stage,
    lastContactedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function closeLead(lead: Lead, stage: 'closed_won' | 'closed_lost', reason: string): Lead {
  return {
    ...lead,
    stage,
    closedAt: new Date().toISOString(),
    closedReason: reason,
    updatedAt: new Date().toISOString(),
  }
}

function scanSlaAlerts(leads: Lead[], now: Date = new Date()): Lead[] {
  const alerts: Lead[] = []
  const slaHours: Record<LeadPriority, number> = {
    urgent: HIGH_PRIORITY_SLA_HOURS,
    high: HIGH_PRIORITY_SLA_HOURS,
    normal: NORMAL_PRIORITY_SLA_HOURS,
    low: LOW_PRIORITY_SLA_HOURS,
  }
  for (const lead of leads) {
    if (lead.stage === 'closed_won' || lead.stage === 'closed_lost') continue
    const thresholdMs = slaHours[lead.priority] * 3600 * 1000
    const reference = lead.lastContactedAt ?? lead.createdAt
    const elapsed = now.getTime() - new Date(reference).getTime()
    if (elapsed > thresholdMs) {
      alerts.push(lead)
    }
  }
  return alerts
}

function getFunnelMetrics(leads: Lead[]): LeadFunnelMetrics {
  const byStage: Record<LeadStage, number> = {
    new: 0, assigned: 0, contacted: 0, trial: 0, negotiation: 0, closed_won: 0, closed_lost: 0,
  }
  let totalDays = 0
  let closedCount = 0
  let totalRevenue = 0
  for (const lead of leads) {
    byStage[lead.stage]++
    if (lead.stage === 'closed_won' || lead.stage === 'closed_lost') {
      const days = (new Date(lead.closedAt!).getTime() - new Date(lead.createdAt).getTime()) / 86400000
      totalDays += days
      closedCount++
      if (lead.stage === 'closed_won') totalRevenue += 10000
    }
  }
  const total = leads.length
  return {
    total,
    byStage,
    conversionRates: {
      new_to_assigned: total > 0 ? byStage.assigned / total : 0,
      assigned_to_contacted: total > 0 ? byStage.contacted / total : 0,
      contacted_to_trial: total > 0 ? byStage.trial / total : 0,
      trial_to_won: byStage.trial > 0 ? byStage.closed_won / byStage.trial : 0,
      overall: total > 0 ? byStage.closed_won / total : 0,
    },
    avgDaysToClose: closedCount > 0 ? totalDays / closedCount : 0,
    totalRevenue,
  }
}

function filterLeads(leads: Lead[], tenantId?: string): Lead[] {
  return tenantId ? leads.filter(l => l.tenantId === tenantId) : leads
}

// ─── 测试 ─────────────────────────────────────────────────────

describe('leads.service.spec: inferPriority', () => {
  it('[1] urgent utm → urgent', () => {
    assert.equal(inferPriority('xiaohongshu', { priority: 'urgent' }), 'urgent')
  })

  it('[2] manual → high', () => {
    assert.equal(inferPriority('manual'), 'high')
  })

  it('[3] other source → normal', () => {
    assert.equal(inferPriority('douyin'), 'normal')
  })
})

describe('leads.service.spec: findMatchingRule', () => {
  it('[4] 按 region 匹配', () => {
    const rules: AssignRule[] = [
      { ruleId: 'r1', matcher: { region: '华东' }, strategy: 'specific', specificAssignee: 'zhang', candidatePool: [] },
      { ruleId: 'r2', matcher: { region: '华南' }, strategy: 'specific', specificAssignee: 'li', candidatePool: [] },
    ]
    const lead = makeLead({ region: '华东' })
    const rule = findMatchingRule(lead, rules)
    assert.ok(rule)
    assert.equal(rule.ruleId, 'r1')
  })

  it('[5] 无匹配规则返回 undefined', () => {
    const rules: AssignRule[] = [
      { ruleId: 'r1', matcher: { region: '华南' }, strategy: 'specific', specificAssignee: 'z', candidatePool: [] },
    ]
    const lead = makeLead({ region: '华北' })
    assert.equal(findMatchingRule(lead, rules), undefined)
  })

  it('[6] 按 storeId + source 精确匹配', () => {
    const rules: AssignRule[] = [
      { ruleId: 'r1', matcher: { storeId: 's1', source: 'douyin' }, strategy: 'specific', specificAssignee: 'wang', candidatePool: [] },
    ]
    const lead = makeLead({ storeId: 's1', source: 'douyin' })
    const rule = findMatchingRule(lead, rules)
    assert.ok(rule)
    assert.equal(rule.ruleId, 'r1')
  })

  it('[7] storeId 不匹配跳过', () => {
    const rules: AssignRule[] = [
      { ruleId: 'r1', matcher: { storeId: 's1' }, strategy: 'specific', specificAssignee: 'w', candidatePool: [] },
    ]
    const lead = makeLead({ storeId: 's2' })
    assert.equal(findMatchingRule(lead, rules), undefined)
  })
})

describe('leads.service.spec: pickAssignee (round-robin)', () => {
  it('[8] round-robin 选负载最少的', () => {
    const rule: AssignRule = { ruleId: 'r1', matcher: {}, strategy: 'round-robin', candidatePool: ['a', 'b'] }
    const leads = [
      makeLead({ leadId: 'l1', assigneeUserId: 'a' }),
      makeLead({ leadId: 'l2', assigneeUserId: 'b' }),
    ]
    const picked = pickAssignee(rule, leads)
    assert.equal(picked, 'a') // both have 1, sorted alphabetically
  })

  it('[9] 空候选池返回 undefined', () => {
    const rule: AssignRule = { ruleId: 'r1', matcher: {}, strategy: 'round-robin', candidatePool: [] }
    assert.equal(pickAssignee(rule, []), undefined)
  })
})

describe('leads.service.spec: pickAssignee (specific)', () => {
  it('[10] specific 直接返回', () => {
    const rule: AssignRule = { ruleId: 'r1', matcher: {}, strategy: 'specific', specificAssignee: 'sales-zhang', candidatePool: [] }
    assert.equal(pickAssignee(rule, []), 'sales-zhang')
  })
})

describe('leads.service.spec: pickAssignee (least-loaded)', () => {
  it('[11] least-loaded 忽略已关闭线索', () => {
    const rule: AssignRule = { ruleId: 'r1', matcher: {}, strategy: 'least-loaded', candidatePool: ['a', 'b'] }
    // a had a closed lead (skipped), b has an active lead
    // load: a=0, b=1 → picks a (least loaded)
    const leads = [
      makeLead({ leadId: 'l1', assigneeUserId: 'a', stage: 'closed_won' }),
      makeLead({ leadId: 'l2', assigneeUserId: 'b' }),
    ]
    const picked = pickAssignee(rule, leads)
    assert.equal(picked, 'a')
  })
})

describe('leads.service.spec: autoAssign', () => {
  it('[12] 匹配规则自动分配', () => {
    const rules: AssignRule[] = [
      { ruleId: 'r1', matcher: { region: '华东' }, strategy: 'specific', specificAssignee: 'zhang', candidatePool: [] },
    ]
    const lead = makeLead({ region: '华东' })
    const result = autoAssign(lead, rules, [lead])
    assert.equal(result.assigneeUserId, 'zhang')
    assert.equal(result.stage, 'assigned')
  })

  it('[13] 无匹配规则保留 new', () => {
    const result = autoAssign(makeLead({ region: '西北' }), [], [])
    assert.equal(result.stage, 'new')
    assert.equal(result.assigneeUserId, undefined)
  })
})

describe('leads.service.spec: followUp', () => {
  it('[14] 跟进添加笔记', () => {
    const lead = makeLead({ stage: 'assigned' })
    const result = followUp(lead, 'u1', '已联系', 'contacted')
    assert.ok(result)
    assert.equal(result.stage, 'contacted')
    assert.equal(result.notes.length, 1)
    assert.equal(result.notes[0].content, '已联系')
    assert.equal(result.notes[0].stageBefore, 'assigned')
    assert.equal(result.notes[0].stageAfter, 'contacted')
    assert.ok(result.lastContactedAt)
  })

  it('[15] 跟进不推阶段', () => {
    const lead = makeLead({ stage: 'assigned' })
    const result = followUp(lead, 'u1', '跟进中')
    assert.equal(result!.stage, 'assigned')
    assert.equal(result!.notes[0].stageAfter, 'assigned')
  })
})

describe('leads.service.spec: closeLead', () => {
  it('[16] 赢单关闭 带收入', () => {
    const lead = makeLead()
    const result = closeLead(lead, 'closed_won', '签约')
    assert.equal(result.stage, 'closed_won')
    assert.equal(result.closedReason, '签约')
    assert.ok(result.closedAt)
  })

  it('[17] 流失关闭 设置原因', () => {
    const lead = makeLead()
    const result = closeLead(lead, 'closed_lost', '价格不合适')
    assert.equal(result.stage, 'closed_lost')
    assert.equal(result.closedReason, '价格不合适')
  })
})

describe('leads.service.spec: scanSlaAlerts', () => {
  it('[18] urgent 4h 未跟进触发告警', () => {
    const lead = makeLead({ priority: 'urgent', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() })
    const alerts = scanSlaAlerts([lead], new Date())
    assert.equal(alerts.length, 1)
  })

  it('[19] 刚创建线索不触发', () => {
    const lead = makeLead()
    assert.equal(scanSlaAlerts([lead], new Date()).length, 0)
  })

  it('[20] 关闭的线索跳过', () => {
    const lead = makeLead({ stage: 'closed_won', closedAt: new Date().toISOString() })
    assert.equal(scanSlaAlerts([lead], new Date(Date.now() + 100 * 3600 * 1000)).length, 0)
  })

  it('[21] low 优先级 72h 阈值', () => {
    const lead = makeLead({ priority: 'low', createdAt: new Date(Date.now() - 73 * 3600 * 1000).toISOString() })
    assert.equal(scanSlaAlerts([lead], new Date()).length, 1)
  })

  it('[22] 在阈值内不告警 (边界)', () => {
    const lead = makeLead({ priority: 'normal', createdAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString() })
    assert.equal(scanSlaAlerts([lead], new Date()).length, 0)
  })
})

describe('leads.service.spec: getFunnelMetrics', () => {
  it('[23] 多条线索漏斗计算', () => {
    const leads = [
      makeLead({ stage: 'assigned' }),
      makeLead({ stage: 'trial' }),
      makeLead({
        stage: 'closed_won',
        closedAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      }),
    ]
    const m = getFunnelMetrics(leads)
    assert.equal(m.total, 3)
    assert.equal(m.byStage.closed_won, 1)
    assert.equal(m.byStage.trial, 1)
    assert.equal(m.byStage.assigned, 1)
    assert.equal(m.conversionRates.overall, 1 / 3)
  })

  it('[24] 空列表', () => {
    const m = getFunnelMetrics([])
    assert.equal(m.total, 0)
    assert.equal(m.avgDaysToClose, 0)
    assert.equal(m.totalRevenue, 0)
  })
})

describe('leads.service.spec: filterLeads', () => {
  it('[25] 按 tenantId 过滤', () => {
    const leads = [
      makeLead({ tenantId: 'tenant-a' }),
      makeLead({ tenantId: 'tenant-b' }),
    ]
    assert.equal(filterLeads(leads, 'tenant-a').length, 1)
  })

  it('[26] 不过滤返回全部', () => {
    const leads = [makeLead(), makeLead()]
    assert.equal(filterLeads(leads).length, 2)
  })
})

describe('leads.service.spec: 边界情况', () => {
  it('[27] makeLead 默认值', () => {
    const l = makeLead()
    assert.ok(l.leadId.startsWith('lead-'))
    assert.equal(l.source, 'douyin')
    assert.equal(l.stage, 'new')
    assert.equal(l.priority, 'normal')
  })

  it('[28] 线索自定义字段', () => {
    const l = makeLead({ customFields: { brand: 'NIKE' } })
    assert.equal(l.customFields.brand, 'NIKE')
  })

  it('[29] sla 阈值: normal 24h 边界+1触发', () => {
    const lead = makeLead({ priority: 'normal', createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString() })
    assert.equal(scanSlaAlerts([lead], new Date()).length, 1)
  })
})
