// leads.controller.ts · Phase-17 T11
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads 控制器

import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import {
  IngestWebhookDto,
  FollowUpDto,
  CloseLeadDto,
  RegisterRuleDto,
} from './leads.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * POST /leads/webhook
   * Webhook 接入新线索 (抖音/小红书/百度等渠道)
   */
  @Post('webhook')
  ingestWebhook(@Body() dto: IngestWebhookDto) {
    const lead = this.leadsService.ingestWebhook({
      source: dto.source,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      region: dto.region,
      storeId: dto.storeId,
      utmParams: dto.utmParams,
    });
    return {
      leadId: lead.leadId,
      source: lead.source,
      stage: lead.stage,
      assigneeUserId: lead.assigneeUserId,
      createdAt: lead.createdAt,
    };
  }

  /**
   * GET /leads/:leadId
   * 查询线索详情
   */
  @Get(':leadId')
  getLead(@Param('leadId') leadId: string) {
    const lead = this.leadsService.getLead(leadId);
    if (!lead) {
      return { found: false, message: `Lead not found: ${leadId}` };
    }
    return { found: true, lead };
  }

  /**
   * POST /leads/follow-up
   * 线索跟进 (添加笔记 + 推进阶段)
   */
  @Post('follow-up')
  followUp(@Body() dto: FollowUpDto) {
    const lead = this.leadsService.followUp(
      dto.leadId,
      dto.authorUserId,
      dto.content,
      dto.newStage,
    );
    if (!lead) {
      return { success: false, message: `Lead not found: ${dto.leadId}` };
    }
    return {
      success: true,
      leadId: lead.leadId,
      stage: lead.stage,
      lastContactedAt: lead.lastContactedAt,
    };
  }

  /**
   * POST /leads/close/:leadId
   * 关闭线索 (成交/流失)
   */
  @Post('close/:leadId')
  closeLead(@Param('leadId') leadId: string, @Body() dto: CloseLeadDto) {
    const lead = this.leadsService.close(leadId, dto.stage, dto.reason);
    if (!lead) {
      return { success: false, message: `Lead not found: ${leadId}` };
    }
    return {
      success: true,
      leadId: lead.leadId,
      stage: lead.stage,
      closedAt: lead.closedAt,
      closedReason: lead.closedReason,
    };
  }

  /**
   * POST /leads/rules
   * 注册分配规则
   */
  @Post('rules')
  registerRule(@Body() dto: RegisterRuleDto) {
    const rule = this.leadsService.registerRule({
      matcher: dto.matcher,
      strategy: dto.strategy,
      specificAssignee: dto.specificAssignee,
      candidatePool: dto.candidatePool,
    });
    return rule;
  }

  /**
   * GET /leads/funnel/metrics
   * 查询漏斗指标
   */
  @Get('funnel/metrics')
  getFunnelMetrics(@Query('tenantId') tenantId?: string) {
    return this.leadsService.getFunnelMetrics(tenantId);
  }

  /**
   * GET /leads
   * 查询线索列表
   */
  @Get()
  listLeads(@Query('tenantId') tenantId?: string) {
    const leads = this.leadsService.listLeads(tenantId);
    return { total: leads.length, leads };
  }

  /**
   * POST /leads/sla-scan
   * 手动触发 SLA 扫描
   */
  @Post('sla-scan')
  scanSlaAlerts() {
    const alerts = this.leadsService.scanSlaAlerts();
    return { total: alerts.length, alerts: alerts.map(l => l.leadId) };
  }
}
