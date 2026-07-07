import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads Entity 类型测试

import type { Lead, LeadFollowUpNote, LeadFunnelMetrics, AssignRule, LeadSource, LeadStage, LeadPriority } from './leads.entity';

describe('LeadsEntity - 类型定义', () => {
  it('应能构造 Lead 对象', () => {
    const lead: Lead = {
      leadId: 'lead-001',
      tenantId: 'tenant-1',
      source: 'douyin',
      stage: 'new',
      priority: 'normal',
      contact: { name: '张三', phone: '13800138000' },
      notes: [],
      customFields: {},
      createdAt: '2026-06-26T00:00:00Z',
      updatedAt: '2026-06-26T00:00:00Z',
    };
    expect(lead.leadId).toBe('lead-001');
    expect(lead.source).toBe('douyin');
    expect(lead.stage).toBe('new');
  });

  it('应能构造 LeadFollowUpNote', () => {
    const note: LeadFollowUpNote = {
      noteId: 'note-001',
      authorUserId: 'user-1',
      content: '已电话沟通',
      stageBefore: 'new',
      stageAfter: 'contacted',
      createdAt: '2026-06-26T01:00:00Z',
    };
    expect(note.stageBefore).toBe('new');
    expect(note.stageAfter).toBe('contacted');
  });

  it('应支持所有 LeadStage 枚举值', () => {
    const stages: LeadStage[] = ['new', 'assigned', 'contacted', 'trial', 'negotiation', 'closed_won', 'closed_lost'];
    expect(stages).toHaveLength(7);
    stages.forEach(s => expect(['new', 'assigned', 'contacted', 'trial', 'negotiation', 'closed_won', 'closed_lost']).toContain(s));
  });

  it('应支持所有 LeadSource 枚举值', () => {
    const sources: LeadSource[] = ['douyin', 'xiaohongshu', 'baidu', 'manual', 'referral', 'other'];
    expect(sources).toHaveLength(6);
  });

  it('应支持所有 LeadPriority 枚举值', () => {
    const priorities: LeadPriority[] = ['low', 'normal', 'high', 'urgent'];
    expect(priorities).toHaveLength(4);
  });

  it('应能构造 AssignRule', () => {
    const rule: AssignRule = {
      ruleId: 'rule-001',
      matcher: { region: 'shanghai', source: 'douyin' },
      strategy: 'round-robin',
      candidatePool: ['sales-1', 'sales-2'],
    };
    expect(rule.matcher.region).toBe('shanghai');
    expect(rule.strategy).toBe('round-robin');
  });

  it('应能构造 LeadFunnelMetrics', () => {
    const metrics: LeadFunnelMetrics = {
      total: 10,
      byStage: {
        new: 2, assigned: 3, contacted: 2, trial: 1, negotiation: 1, closed_won: 1, closed_lost: 0,
      },
      conversionRates: { new_to_assigned: 0.8, overall: 0.1 },
      avgDaysToClose: 15,
      totalRevenue: 100000,
    };
    expect(metrics.total).toBe(10);
    expect(metrics.avgDaysToClose).toBe(15);
  });

  it('Lead 支持可选字段 closedAt 和 closedReason', () => {
    const open: Lead = {
      leadId: 'l1', tenantId: 't1', source: 'manual', stage: 'new', priority: 'normal',
      contact: { name: 'a' }, notes: [], customFields: {}, createdAt: '', updatedAt: '',
    };
    expect(open.closedAt).toBeUndefined();

    const closed: Lead = { ...open, stage: 'closed_won', closedAt: '2026-06-26T10:00:00Z', closedReason: '成交' };
    expect(closed.closedAt).toBeDefined();
    expect(closed.closedReason).toBe('成交');
  });

  it('Lead 支持 assigneeUserId 可选', () => {
    const unassigned: Lead = {
      leadId: 'l1', tenantId: 't1', source: 'baidu', stage: 'new', priority: 'normal',
      contact: { name: 'a' }, notes: [], customFields: {}, createdAt: '', updatedAt: '',
    };
    expect(unassigned.assigneeUserId).toBeUndefined();

    const assigned: Lead = { ...unassigned, assigneeUserId: 'sales-1' };
    expect(assigned.assigneeUserId).toBe('sales-1');
  });
});
