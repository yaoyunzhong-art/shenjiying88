// leads.service.ts - Phase-17 T11
// 用途: 渠道招商自动化 (抖音/小红书/百度 webhook -> 自动分配 -> 漏斗追踪)
// 关联: tasks.md T11 - afternoon-dev-jobs.sh 16:00-17:30
import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service';
import type {
  LeadSource, LeadStage, LeadPriority,
  Lead, LeadFollowUpNote, LeadFunnelMetrics, AssignRule,
} from './leads.entity';

export type {
  LeadSource, LeadStage, LeadPriority,
  Lead, LeadFollowUpNote, LeadFunnelMetrics, AssignRule,
};

export interface LeadWebhookPayload {
  source: LeadSource;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  region?: string;
  storeId?: string;
  utmParams?: Record<string, string>;
  externalLeadId?: string;
}

const HIGH_PRIORITY_SLA_HOURS = 4;
const NORMAL_PRIORITY_SLA_HOURS = 24;
const LOW_PRIORITY_SLA_HOURS = 72;

/**
 * LeadsService - 渠道招商自动化服务
 *
 * 核心能力:
 * 1. Webhook 接入 (抖音/小红书/百度/手工)
 * 2. 自动分配 (按地域/门店容量/策略)
 * 3. SLA 提醒 (高优 4h / 普通 24h / 低 72h 未跟进)
 * 4. 漏斗追踪 (线索 → 体验 → 成交 → 续费)
 */
@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  private readonly leadStore = new Map<string, Lead>();
  private readonly ruleStore = new Map<string, AssignRule>();
  private readonly slaAlertLog: { leadId: string; alertAt: string; priority: LeadPriority }[] = [];

  constructor(@Optional() private readonly marketingMetricsService?: MarketingMetricsService) {}

  /** 重置 */
  reset(): void {
    this.leadStore.clear();
    this.ruleStore.clear();
    this.slaAlertLog.length = 0;
  }

  /** 注册分配规则 */
  registerRule(rule: Omit<AssignRule, 'ruleId'>): AssignRule {
    const ruleId = `rule-${randomBytes(4).toString('hex')}`;
    const fullRule: AssignRule = { ruleId, ...rule };
    this.ruleStore.set(ruleId, fullRule);
    this.logger.log(`Registered rule ${ruleId} (${rule.matcher.region ?? rule.matcher.storeId ?? 'global'})`);
    return fullRule;
  }

  /** Webhook 接入新线索 */
  ingestWebhook(payload: LeadWebhookPayload): Lead {
    const leadId = `lead-${randomBytes(6).toString('hex')}`;
    const priority = this.inferPriority(payload);
    const lead: Lead = {
      leadId,
      tenantId: payload.storeId ? `store:${payload.storeId}` : 'tenant-default',
      source: payload.source,
      stage: 'new',
      priority,
      contact: {
        name: payload.contactName,
        phone: payload.contactPhone,
        email: payload.contactEmail,
      },
      region: payload.region,
      storeId: payload.storeId,
      notes: [],
      customFields: payload.utmParams ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leadStore.set(leadId, lead);
    this.marketingMetricsService?.incrLeadIngest(lead.tenantId);
    this.logger.log(`Ingested lead ${leadId} from ${payload.source}`);
    this.autoAssign(lead);
    return lead;
  }

  private inferPriority(payload: LeadWebhookPayload): LeadPriority {
    if (payload.utmParams?.priority === 'urgent') return 'urgent';
    if (payload.source === 'manual') return 'high';
    return 'normal';
  }

  /** 自动分配 */
  autoAssign(lead: Lead): string | undefined {
    if (lead.assigneeUserId) return lead.assigneeUserId;
    const rule = this.findMatchingRule(lead);
    if (!rule) {
      this.logger.warn(`No matching rule for lead ${lead.leadId}; needs manual assignment`);
      return undefined;
    }
    const assignee = this.pickAssignee(rule, lead);
    if (!assignee) return undefined;
    lead.assigneeUserId = assignee;
    lead.stage = 'assigned';
    lead.updatedAt = new Date().toISOString();
    this.logger.log(`Assigned lead ${lead.leadId} to ${assignee} via ${rule.strategy}`);
    return assignee;
  }

  private findMatchingRule(lead: Lead): AssignRule | undefined {
    for (const rule of this.ruleStore.values()) {
      if (rule.matcher.region && rule.matcher.region !== lead.region) continue;
      if (rule.matcher.storeId && rule.matcher.storeId !== lead.storeId) continue;
      if (rule.matcher.source && rule.matcher.source !== lead.source) continue;
      return rule;
    }
    return undefined;
  }

  private pickAssignee(rule: AssignRule, _lead: Lead): string | undefined {
    if (rule.strategy === 'specific') return rule.specificAssignee;
    if (rule.candidatePool.length === 0) return undefined;
    if (rule.strategy === 'round-robin') {
      // Round-robin: 找分配最少的候选
      const loadMap = new Map<string, number>();
      for (const u of rule.candidatePool) loadMap.set(u, 0);
      for (const l of this.leadStore.values()) {
        if (l.assigneeUserId && loadMap.has(l.assigneeUserId)) {
          loadMap.set(l.assigneeUserId, (loadMap.get(l.assigneeUserId) ?? 0) + 1);
        }
      }
      return [...loadMap.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    }
    if (rule.strategy === 'least-loaded') {
      const loadMap = new Map<string, number>();
      for (const u of rule.candidatePool) loadMap.set(u, 0);
      for (const l of this.leadStore.values()) {
        if (l.stage === 'closed_won' || l.stage === 'closed_lost') continue;
        if (l.assigneeUserId && loadMap.has(l.assigneeUserId)) {
          loadMap.set(l.assigneeUserId, (loadMap.get(l.assigneeUserId) ?? 0) + 1);
        }
      }
      return [...loadMap.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    }
    return undefined;
  }

  /** 跟进 (添加笔记 + 推进阶段) */
  followUp(leadId: string, authorUserId: string, content: string, newStage?: LeadStage): Lead | undefined {
    const lead = this.leadStore.get(leadId);
    if (!lead) return undefined;
    const stageBefore = lead.stage;
    lead.notes.push({
      noteId: `note-${randomBytes(4).toString('hex')}`,
      authorUserId,
      content,
      stageBefore,
      stageAfter: newStage ?? stageBefore,
      createdAt: new Date().toISOString(),
    });
    if (newStage) lead.stage = newStage;
    lead.lastContactedAt = new Date().toISOString();
    lead.updatedAt = lead.lastContactedAt;
    return lead;
  }

  /** 关闭线索 */
  close(leadId: string, stage: 'closed_won' | 'closed_lost', reason: string): Lead | undefined {
    const lead = this.leadStore.get(leadId);
    if (!lead) return undefined;
    lead.stage = stage;
    lead.closedAt = new Date().toISOString();
    lead.closedReason = reason;
    lead.updatedAt = lead.closedAt;
    if (stage === 'closed_won') {
      this.marketingMetricsService?.incrLeadCloseWon(10000, lead.tenantId);
    }
    return lead;
  }

  /** SLA 提醒扫描 (N 天未跟进) */
  scanSlaAlerts(now: Date = new Date()): Lead[] {
    const alerts: Lead[] = [];
    const slaHours = { urgent: HIGH_PRIORITY_SLA_HOURS, high: HIGH_PRIORITY_SLA_HOURS, normal: NORMAL_PRIORITY_SLA_HOURS, low: LOW_PRIORITY_SLA_HOURS };
    for (const lead of this.leadStore.values()) {
      if (lead.stage === 'closed_won' || lead.stage === 'closed_lost') continue;
      const thresholdMs = slaHours[lead.priority] * 3600 * 1000;
      const reference = lead.lastContactedAt ?? lead.createdAt;
      const elapsed = now.getTime() - new Date(reference).getTime();
      if (elapsed > thresholdMs) {
        alerts.push(lead);
        this.slaAlertLog.push({ leadId: lead.leadId, alertAt: now.toISOString(), priority: lead.priority });
      }
    }
    return alerts;
  }

  /** 漏斗指标 */
  getFunnelMetrics(tenantId?: string): LeadFunnelMetrics {
    const leads = tenantId
      ? Array.from(this.leadStore.values()).filter(l => l.tenantId === tenantId)
      : Array.from(this.leadStore.values());
    const byStage: Record<LeadStage, number> = {
      new: 0, assigned: 0, contacted: 0, trial: 0, negotiation: 0, closed_won: 0, closed_lost: 0,
    };
    let totalDays = 0;
    let closedCount = 0;
    let totalRevenue = 0;
    for (const lead of leads) {
      byStage[lead.stage]++;
      if (lead.stage === 'closed_won' || lead.stage === 'closed_lost') {
        const days = (new Date(lead.closedAt!).getTime() - new Date(lead.createdAt).getTime()) / 86400000;
        totalDays += days;
        closedCount++;
        if (lead.stage === 'closed_won') totalRevenue += 10000; // stub
      }
    }
    const total = leads.length;
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
    };
  }

  getLead(leadId: string): Lead | undefined {
    return this.leadStore.get(leadId);
  }

  listLeads(tenantId?: string): Lead[] {
    return tenantId
      ? Array.from(this.leadStore.values()).filter(l => l.tenantId === tenantId)
      : Array.from(this.leadStore.values());
  }

  // ─── 跨模块桥接方法 (供 cross-module e2e 测试) ───

  /** 创建线索 (tenant-context 版本) */
  createLead(_tc: any, body: { source: LeadSource; contact: { name: string; phone?: string; email?: string }; region?: string; priority?: string; storeId?: string }): Lead {
    return this.ingestWebhook({
      source: body.source,
      contactName: body.contact.name,
      contactPhone: body.contact.phone,
      contactEmail: body.contact.email,
      region: body.region,
      storeId: body.storeId,
      utmParams: body.priority ? { priority: body.priority } : undefined,
    });
  }

  /** 推进线索阶段 */
  updateStage(leadId: string, stage: LeadStage, _tc?: any): Lead | undefined {
    const lead = this.leadStore.get(leadId);
    if (!lead) return undefined;
    // 禁止反推
    const stageOrder: LeadStage[] = ['new', 'assigned', 'contacted', 'trial', 'negotiation', 'closed_won', 'closed_lost'];
    const curIdx = stageOrder.indexOf(lead.stage);
    const newIdx = stageOrder.indexOf(stage);
    if (newIdx < curIdx) return lead;
    return this.followUp(leadId, 'system', `Stage advanced to ${stage}`, stage);
  }

  /** 按来源查询线索 */
  getLeadsBySource(_tc: any, source: LeadSource): Lead[] {
    return Array.from(this.leadStore.values()).filter(l => l.source === source);
  }
}
