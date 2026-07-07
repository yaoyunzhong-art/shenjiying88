// leads.entity.ts · Phase-17 T11
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads 数据模型
// 关联: tasks.md T11 · 渠道招商自动化

/**
 * Leads 数据模型 (Phase-17 T11)
 *
 * 核心实体:
 * - Lead: 线索 (招商渠道入口)
 * - LeadFollowUpNote: 跟进笔记
 * - AssignRule: 分配规则
 * - LeadFunnelMetrics: 漏斗指标
 */

export type LeadSource = 'douyin' | 'xiaohongshu' | 'baidu' | 'manual' | 'referral' | 'other';
export type LeadStage = 'new' | 'assigned' | 'contacted' | 'trial' | 'negotiation' | 'closed_won' | 'closed_lost';
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Lead {
  leadId: string;
  tenantId: string;
  source: LeadSource;
  stage: LeadStage;
  priority: LeadPriority;
  contact: { name: string; phone?: string; email?: string; wechat?: string };
  region?: string;
  storeId?: string;
  assigneeUserId?: string;
  notes: LeadFollowUpNote[];
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  closedAt?: string;
  closedReason?: string;
}

export interface LeadFollowUpNote {
  noteId: string;
  authorUserId: string;
  content: string;
  stageBefore: LeadStage;
  stageAfter: LeadStage;
  createdAt: string;
}

export interface LeadFunnelMetrics {
  total: number;
  byStage: Record<LeadStage, number>;
  conversionRates: Record<string, number>;
  avgDaysToClose: number;
  totalRevenue: number;
}

export interface AssignRule {
  ruleId: string;
  matcher: { region?: string; storeId?: string; source?: LeadSource };
  strategy: 'round-robin' | 'least-loaded' | 'specific';
  specificAssignee?: string;
  candidatePool: string[];
}
