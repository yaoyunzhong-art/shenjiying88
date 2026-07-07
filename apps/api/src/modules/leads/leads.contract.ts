// leads.contract.ts · Phase-17 T11
// 创建: 2026-06-27 · Pulse-自动
// 状态: IMPLEMENTED · Leads 契约层

import type {
  Lead,
  LeadFollowUpNote,
  LeadFunnelMetrics,
  AssignRule,
  LeadStage,
  LeadSource,
  LeadPriority,
} from './leads.entity';

// ── 输出契约：对外 API 层不会直接暴露内部实体 ──

export interface LeadContract {
  leadId: string;
  tenantId: string;
  source: LeadSource;
  stage: LeadStage;
  priority: LeadPriority;
  contact: { name: string; phone?: string; email?: string; wechat?: string };
  region?: string;
  storeId?: string;
  assigneeUserId?: string;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  closedAt?: string;
  closedReason?: string;
}

export interface LeadDetailContract extends LeadContract {
  notes: LeadFollowUpNote[];
  customFields: Record<string, string>;
}

export interface AssignRuleContract {
  ruleId: string;
  matcher: { region?: string; storeId?: string; source?: LeadSource };
  strategy: 'round-robin' | 'least-loaded' | 'specific';
  specificAssignee?: string;
  candidatePool: string[];
}

export interface LeadFunnelMetricsContract extends LeadFunnelMetrics {}

export interface WebhookIngestionResultContract {
  leadId: string;
  source: LeadSource;
  stage: LeadStage;
  assigneeUserId?: string;
  createdAt: string;
}

export interface FollowUpResultContract {
  success: boolean;
  leadId: string;
  stage: LeadStage;
  lastContactedAt?: string;
}

export interface CloseResultContract {
  success: boolean;
  leadId: string;
  stage: 'closed_won' | 'closed_lost';
  closedAt?: string;
  closedReason?: string;
}

export interface SlaAlertResultContract {
  total: number;
  alerts: string[];
}

// ── Mappers ──

export function toLeadContract(lead: Lead): LeadContract {
  return {
    leadId: lead.leadId,
    tenantId: lead.tenantId,
    source: lead.source,
    stage: lead.stage,
    priority: lead.priority,
    contact: { ...lead.contact },
    region: lead.region,
    storeId: lead.storeId,
    assigneeUserId: lead.assigneeUserId,
    notesCount: lead.notes.length,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    lastContactedAt: lead.lastContactedAt,
    closedAt: lead.closedAt,
    closedReason: lead.closedReason,
  };
}

export function toLeadDetailContract(lead: Lead): LeadDetailContract {
  return {
    ...toLeadContract(lead),
    notes: lead.notes,
    customFields: lead.customFields,
  };
}

export function toAssignRuleContract(rule: AssignRule): AssignRuleContract {
  return {
    ruleId: rule.ruleId,
    matcher: { ...rule.matcher },
    strategy: rule.strategy,
    specificAssignee: rule.specificAssignee,
    candidatePool: [...rule.candidatePool],
  };
}

export function toFunnelMetricsContract(metrics: LeadFunnelMetrics): LeadFunnelMetricsContract {
  return { ...metrics };
}

export function toWebhookIngestionResultContract(
  lead: Lead,
): WebhookIngestionResultContract {
  return {
    leadId: lead.leadId,
    source: lead.source,
    stage: lead.stage,
    assigneeUserId: lead.assigneeUserId,
    createdAt: lead.createdAt,
  };
}

export function toFollowUpResultContract(
  success: boolean,
  lead?: Lead,
): FollowUpResultContract {
  if (!success || !lead) {
    return { success: false, leadId: '', stage: 'new' };
  }
  return {
    success: true,
    leadId: lead.leadId,
    stage: lead.stage,
    lastContactedAt: lead.lastContactedAt,
  };
}

export function toCloseResultContract(
  success: boolean,
  lead?: Lead,
): CloseResultContract {
  if (!success || !lead) {
    return { success: false, leadId: '', stage: 'closed_lost' };
  }
  return {
    success: true,
    leadId: lead.leadId,
    stage: lead.stage as 'closed_won' | 'closed_lost',
    closedAt: lead.closedAt,
    closedReason: lead.closedReason,
  };
}
