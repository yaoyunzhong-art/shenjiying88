// leads.dto.ts · Phase-17 T11
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads DTO 定义

import { LeadSource, LeadStage, LeadPriority } from './leads.entity';

/**
 * Webhook 线索接入请求 DTO
 */
export class IngestWebhookDto {
  source!: LeadSource;
  contactName!: string;
  contactPhone?: string;
  contactEmail?: string;
  region?: string;
  storeId?: string;
  utmParams?: Record<string, string>;
  externalLeadId?: string;
}

/**
 * 线索响应 DTO
 */
export class LeadResponseDto {
  leadId!: string;
  tenantId!: string;
  source!: LeadSource;
  stage!: LeadStage;
  priority!: LeadPriority;
  contact!: { name: string; phone?: string; email?: string; wechat?: string };
  region?: string;
  storeId?: string;
  assigneeUserId?: string;
  notesCount!: number;
  customFields!: Record<string, string>;
  createdAt!: string;
  updatedAt!: string;
  lastContactedAt?: string;
  closedAt?: string;
  closedReason?: string;
}

/**
 * 分配规则注册请求 DTO
 */
export class RegisterRuleDto {
  matcher!: { region?: string; storeId?: string; source?: LeadSource };
  strategy!: 'round-robin' | 'least-loaded' | 'specific';
  specificAssignee?: string;
  candidatePool!: string[];
}

/**
 * 跟进请求 DTO
 */
export class FollowUpDto {
  leadId!: string;
  authorUserId!: string;
  content!: string;
  newStage?: LeadStage;
}

/**
 * 关闭线索请求 DTO
 */
export class CloseLeadDto {
  stage!: 'closed_won' | 'closed_lost';
  reason!: string;
}

/**
 * 分配规则查询请求 DTO
 */
export class RuleResponseDto {
  ruleId!: string;
  matcher!: { region?: string; storeId?: string; source?: LeadSource };
  strategy!: string;
  specificAssignee?: string;
  candidatePool!: string[];
}

/**
 * 漏斗指标查询 DTO
 */
export class FunnelMetricsDto {
  tenantId?: string;
}
