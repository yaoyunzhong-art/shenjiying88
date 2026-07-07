import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// leads.contract.test.ts · Phase-17 T11
// 创建: 2026-06-27 · Pulse-自动
// 状态: IMPLEMENTED · Leads 契约层测试

import assert from 'node:assert/strict';
import {
  toLeadContract,
  toLeadDetailContract,
  toAssignRuleContract,
  toFunnelMetricsContract,
  toWebhookIngestionResultContract,
  toFollowUpResultContract,
  toCloseResultContract,
} from './leads.contract';
import type { Lead, LeadFunnelMetrics, AssignRule } from './leads.entity';

// ── Helpers ──

function createSampleLead(overrides?: Partial<Lead>): Lead {
  return {
    leadId: 'lead-001',
    tenantId: 'store:store-a',
    source: 'douyin',
    stage: 'assigned',
    priority: 'high',
    contact: { name: '张三', phone: '13800138001', email: 'zhangsan@example.com' },
    region: '华北',
    storeId: 'store-a',
    assigneeUserId: 'user-001',
    notes: [
      {
        noteId: 'note-001',
        authorUserId: 'user-001',
        content: '已联系, 约定下周参观',
        stageBefore: 'new',
        stageAfter: 'assigned',
        createdAt: '2026-06-27T10:00:00Z',
      },
    ],
    customFields: { utm_source: 'douyin_feed' },
    createdAt: '2026-06-27T08:00:00Z',
    updatedAt: '2026-06-27T10:00:00Z',
    lastContactedAt: '2026-06-27T10:00:00Z',
    ...overrides,
  };
}

function createSampleMetrics(overrides?: Partial<LeadFunnelMetrics>): LeadFunnelMetrics {
  return {
    total: 10,
    byStage: {
      new: 2,
      assigned: 3,
      contacted: 2,
      trial: 1,
      negotiation: 1,
      closed_won: 1,
      closed_lost: 0,
    },
    conversionRates: {
      new_to_assigned: 0.8,
      assigned_to_contacted: 0.67,
      contacted_to_trial: 0.5,
      trial_to_won: 1.0,
      overall: 0.1,
    },
    avgDaysToClose: 5.2,
    totalRevenue: 10000,
    ...overrides,
  };
}

function createSampleRule(overrides?: Partial<AssignRule>): AssignRule {
  return {
    ruleId: 'rule-abc123',
    matcher: { region: '华北', source: 'douyin' },
    strategy: 'round-robin',
    candidatePool: ['user-001', 'user-002', 'user-003'],
    ...overrides,
  };
}

// ── toLeadContract ──

describe('toLeadContract()', () => {
  it('maps full Lead to LeadContract with all fields', () => {
    const lead = createSampleLead();
    const contract = toLeadContract(lead);

    assert.equal(contract.leadId, 'lead-001');
    assert.equal(contract.tenantId, 'store:store-a');
    assert.equal(contract.source, 'douyin');
    assert.equal(contract.stage, 'assigned');
    assert.equal(contract.priority, 'high');
    assert.deepEqual(contract.contact, lead.contact);
    assert.equal(contract.region, '华北');
    assert.equal(contract.storeId, 'store-a');
    assert.equal(contract.assigneeUserId, 'user-001');
    assert.equal(contract.notesCount, 1);
    assert.equal(contract.createdAt, '2026-06-27T08:00:00Z');
    assert.equal(contract.updatedAt, '2026-06-27T10:00:00Z');
    assert.equal(contract.lastContactedAt, '2026-06-27T10:00:00Z');
  });

  it('excludes internal notes array from contract', () => {
    const lead = createSampleLead();
    const contract = toLeadContract(lead);
    assert.equal('notes' in contract, false);
    assert.equal('customFields' in contract, false);
  });

  it('handles lead without notes', () => {
    const lead = createSampleLead({ notes: [] });
    const contract = toLeadContract(lead);
    assert.equal(contract.notesCount, 0);
  });

  it('handles lead without assignee', () => {
    const lead = createSampleLead({ assigneeUserId: undefined });
    const contract = toLeadContract(lead);
    assert.equal(contract.assigneeUserId, undefined);
  });

  it('handles lead without contact optional fields', () => {
    const lead = createSampleLead({
      contact: { name: '李四' },
    });
    const contract = toLeadContract(lead);
    assert.equal(contract.contact.name, '李四');
    assert.equal(contract.contact.phone, undefined);
    assert.equal(contract.contact.email, undefined);
  });
});

// ── toLeadDetailContract ──

describe('toLeadDetailContract()', () => {
  it('includes notes and customFields in detail contract', () => {
    const lead = createSampleLead();
    const detail = toLeadDetailContract(lead);

    assert.equal(detail.leadId, 'lead-001');
    assert.equal(detail.notes.length, 1);
    assert.equal(detail.notes[0].content, '已联系, 约定下周参观');
    assert.deepEqual(detail.customFields, { utm_source: 'douyin_feed' });
  });

  it('extends LeadContract fields', () => {
    const lead = createSampleLead();
    const detail = toLeadDetailContract(lead);

    assert.equal(detail.notesCount, 1); // from LeadContract
    assert.equal(detail.stage, 'assigned'); // from LeadContract
  });

  it('handles lead with empty customFields', () => {
    const lead = createSampleLead({ customFields: {} });
    const detail = toLeadDetailContract(lead);
    assert.deepEqual(detail.customFields, {});
  });
});

// ── toAssignRuleContract ──

describe('toAssignRuleContract()', () => {
  it('maps full AssignRule with round-robin strategy', () => {
    const rule = createSampleRule();
    const contract = toAssignRuleContract(rule);

    assert.equal(contract.ruleId, 'rule-abc123');
    assert.deepEqual(contract.matcher, { region: '华北', source: 'douyin' });
    assert.equal(contract.strategy, 'round-robin');
    assert.deepEqual(contract.candidatePool, ['user-001', 'user-002', 'user-003']);
  });

  it('maps rule with specific strategy', () => {
    const rule = createSampleRule({
      strategy: 'specific',
      specificAssignee: 'user-admin',
      candidatePool: [],
    });
    const contract = toAssignRuleContract(rule);
    assert.equal(contract.strategy, 'specific');
    assert.equal(contract.specificAssignee, 'user-admin');
    assert.deepEqual(contract.candidatePool, []);
  });

  it('copies matcher to avoid mutation', () => {
    const rule = createSampleRule();
    const contract = toAssignRuleContract(rule);
    contract.matcher.region = 'modified';
    assert.equal(rule.matcher.region, '华北');
  });
});

// ── toFunnelMetricsContract ──

describe('toFunnelMetricsContract()', () => {
  it('maps full metrics object', () => {
    const metrics = createSampleMetrics();
    const contract = toFunnelMetricsContract(metrics);

    assert.equal(contract.total, 10);
    assert.equal(contract.byStage.assigned, 3);
    assert.equal(contract.byStage.closed_won, 1);
    assert.equal(contract.conversionRates.overall, 0.1);
    assert.equal(contract.avgDaysToClose, 5.2);
    assert.equal(contract.totalRevenue, 10000);
  });

  it('handles empty metrics', () => {
    const metrics = createSampleMetrics({
      total: 0,
      byStage: {
        new: 0, assigned: 0, contacted: 0, trial: 0,
        negotiation: 0, closed_won: 0, closed_lost: 0,
      },
      conversionRates: {
        new_to_assigned: 0,
        assigned_to_contacted: 0,
        contacted_to_trial: 0,
        trial_to_won: 0,
        overall: 0,
      },
      avgDaysToClose: 0,
      totalRevenue: 0,
    });
    const contract = toFunnelMetricsContract(metrics);
    assert.equal(contract.total, 0);
    assert.equal(contract.avgDaysToClose, 0);
  });
});

// ── toWebhookIngestionResultContract ──

describe('toWebhookIngestionResultContract()', () => {
  it('maps webhook result with assignee', () => {
    const lead = createSampleLead();
    const result = toWebhookIngestionResultContract(lead);

    assert.equal(result.leadId, 'lead-001');
    assert.equal(result.source, 'douyin');
    assert.equal(result.stage, 'assigned');
    assert.equal(result.assigneeUserId, 'user-001');
    assert.equal(result.createdAt, '2026-06-27T08:00:00Z');
  });

  it('maps webhook result without assignee', () => {
    const lead = createSampleLead({ assigneeUserId: undefined, stage: 'new' });
    const result = toWebhookIngestionResultContract(lead);

    assert.equal(result.stage, 'new');
    assert.equal(result.assigneeUserId, undefined);
  });
});

// ── toFollowUpResultContract ──

describe('toFollowUpResultContract()', () => {
  it('returns success result with lead data', () => {
    const lead = createSampleLead();
    const result = toFollowUpResultContract(true, lead);

    assert.equal(result.success, true);
    assert.equal(result.leadId, 'lead-001');
    assert.equal(result.stage, 'assigned');
    assert.equal(result.lastContactedAt, '2026-06-27T10:00:00Z');
  });

  it('returns failure result when success is false', () => {
    const result = toFollowUpResultContract(false);

    assert.equal(result.success, false);
    assert.equal(result.leadId, '');
    assert.equal(result.stage, 'new');
  });

  it('returns failure result when lead is undefined', () => {
    const result = toFollowUpResultContract(true, undefined);

    assert.equal(result.success, false);
    assert.equal(result.leadId, '');
  });
});

// ── toCloseResultContract ──

describe('toCloseResultContract()', () => {
  it('returns success result for closed_won', () => {
    const lead = createSampleLead({
      stage: 'closed_won',
      closedAt: '2026-06-27T12:00:00Z',
      closedReason: '客户签约',
    });
    const result = toCloseResultContract(true, lead);

    assert.equal(result.success, true);
    assert.equal(result.leadId, 'lead-001');
    assert.equal(result.stage, 'closed_won');
    assert.equal(result.closedAt, '2026-06-27T12:00:00Z');
    assert.equal(result.closedReason, '客户签约');
  });

  it('returns failure result when success is false', () => {
    const result = toCloseResultContract(false);

    assert.equal(result.success, false);
    assert.equal(result.leadId, '');
    assert.equal(result.stage, 'closed_lost');
  });

  it('returns failure result when lead is undefined', () => {
    const result = toCloseResultContract(true, undefined);

    assert.equal(result.success, false);
    assert.equal(result.leadId, '');
  });
});

// ── 边界场景 ──

describe('contract mappers boundary cases', () => {
  it('toLeadContract handles lead with all optional fields missing', () => {
    const lead: Lead = {
      leadId: 'lead-minimal',
      tenantId: 'default',
      source: 'manual',
      stage: 'new',
      priority: 'normal',
      contact: { name: '无名' },
      notes: [],
      customFields: {},
      createdAt: '2026-06-27T00:00:00Z',
      updatedAt: '2026-06-27T00:00:00Z',
    };
    const contract = toLeadContract(lead);
    assert.equal(contract.leadId, 'lead-minimal');
    assert.equal(contract.notesCount, 0);
    assert.equal(contract.region, undefined);
    assert.equal(contract.assigneeUserId, undefined);
  });

  it('toLeadDetailContract preserves notes array reference', () => {
    const lead = createSampleLead();
    const detail = toLeadDetailContract(lead);
    assert.equal(detail.notes, lead.notes);
    assert.equal(detail.customFields, lead.customFields);
  });

  it('toFollowUpResultContract preserves stage from lead', () => {
    const lead = createSampleLead({ stage: 'negotiation' });
    const result = toFollowUpResultContract(true, lead);
    assert.equal(result.stage, 'negotiation');
  });

  it('toCloseResultContract preserves closed_reason from lead', () => {
    const lead = createSampleLead({
      stage: 'closed_lost',
      closedAt: '2026-06-27T14:00:00Z',
      closedReason: '价格未谈拢',
    });
    const result = toCloseResultContract(true, lead);
    assert.equal(result.stage, 'closed_lost');
    assert.equal(result.closedReason, '价格未谈拢');
  });

  it('all contract types are plain objects with no extra prototype', () => {
    const lead = createSampleLead();
    const contract = toLeadContract(lead);
    // Should be a plain object
    assert.equal(Object.getPrototypeOf(contract), Object.prototype);
    // Should not have unexpected keys
    const keys = Object.keys(contract).sort();
    assert(keys.includes('leadId'));
    assert(keys.includes('notesCount'));
    assert(!keys.includes('notes'));
    assert(!keys.includes('customFields'));
  });
});
