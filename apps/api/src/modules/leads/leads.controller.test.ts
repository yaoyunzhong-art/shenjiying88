import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads Controller 测试

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  beforeEach(() => {
    service = new LeadsService();
    controller = new LeadsController(service);
  });

  describe('POST /leads/webhook - 线索接入', () => {
    it('正例: 接入抖音线索应返回 leadId 和 stage=assigned', () => {
      service.registerRule({
        matcher: { source: 'douyin' },
        strategy: 'round-robin',
        candidatePool: ['sales-1'],
      });

      const result = controller.ingestWebhook({
        source: 'douyin',
        contactName: '张三',
        contactPhone: '13800138000',
        region: 'shanghai',
      });

      expect(result.leadId).toBeDefined();
      expect(result.source).toBe('douyin');
      expect(result.stage).toBe('assigned');
      expect(result.assigneeUserId).toBe('sales-1');
    });

    it('边界: 无匹配规则时 stage 为 new', () => {
      const result = controller.ingestWebhook({
        source: 'xiaohongshu',
        contactName: '李四',
      });

      expect(result.leadId).toBeDefined();
      expect(result.stage).toBe('new');
      expect(result.assigneeUserId).toBeUndefined();
    });
  });

  describe('GET /leads/:leadId - 查询线索详情', () => {
    it('正例: 查询已存在的线索应返回 found=true', () => {
      service.registerRule({
        matcher: {},
        strategy: 'round-robin',
        candidatePool: ['sales-1'],
      });
      const ingestResult = controller.ingestWebhook({
        source: 'manual',
        contactName: '王五',
      });

      const result = controller.getLead(ingestResult.leadId);
      expect(result.found).toBe(true);
      expect((result as any).lead.contact.name).toBe('王五');
    });

    it('反例: 查询不存在的线索应返回 found=false', () => {
      const result = controller.getLead('non-existent-lead');
      expect(result.found).toBe(false);
      expect((result as any).message).toContain('not found');
    });
  });

  describe('POST /leads/follow-up - 线索跟进', () => {
    it('正例: 跟进后应推进阶段并记录笔记', () => {
      const ingested = controller.ingestWebhook({
        source: 'manual',
        contactName: '赵六',
      });

      const result = controller.followUp({
        leadId: ingested.leadId,
        authorUserId: 'sales-1',
        content: '电话沟通完成，客户有兴趣',
        newStage: 'contacted',
      });

      expect(result.success).toBe(true);
      expect(result.stage).toBe('contacted');
    });

    it('反例: 跟进不存在的线索应返回 success=false', () => {
      const result = controller.followUp({
        leadId: 'not-exists',
        authorUserId: 'sales-1',
        content: '测试',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('POST /leads/close/:leadId - 关闭线索', () => {
    it('正例: 关闭成交线索应返回 closed_won', () => {
      const ingested = controller.ingestWebhook({
        source: 'manual',
        contactName: '钱七',
      });

      const result = controller.closeLead(ingested.leadId, {
        stage: 'closed_won',
        reason: '成功签约',
      });

      expect(result.success).toBe(true);
      expect(result.stage).toBe('closed_won');
      expect(result.closedReason).toBe('成功签约');
    });

    it('反例: 关闭不存在的线索应返回 success=false', () => {
      const result = controller.closeLead('not-exists', {
        stage: 'closed_lost',
        reason: '不感兴趣',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('POST /leads/rules - 注册分配规则', () => {
    it('正例: 注册规则应返回 ruleId', () => {
      const result = controller.registerRule({
        matcher: { region: 'beijing' },
        strategy: 'specific',
        specificAssignee: 'bj-sales',
        candidatePool: ['bj-sales'],
      });

      expect(result.ruleId).toBeDefined();
      expect(result.strategy).toBe('specific');
      expect(result.specificAssignee).toBe('bj-sales');
    });
  });

  describe('GET /leads/funnel/metrics - 漏斗指标', () => {
    it('正例: 有线索时应返回完整指标', () => {
      controller.ingestWebhook({ source: 'douyin', contactName: 'a' });
      controller.ingestWebhook({ source: 'manual', contactName: 'b' });

      const metrics = controller.getFunnelMetrics();
      expect(metrics.total).toBe(2);
      expect(metrics.conversionRates).toBeDefined();
    });

    it('边界: 无线索时应返回零值指标', () => {
      const metrics = controller.getFunnelMetrics();
      expect(metrics.total).toBe(0);
      expect(metrics.byStage.new).toBe(0);
      expect(metrics.totalRevenue).toBe(0);
    });
  });

  describe('GET /leads - 线索列表', () => {
    it('正例: 创建线索后应能在列表中查到', () => {
      const ingested = controller.ingestWebhook({ source: 'baidu', contactName: '周八' });

      const result = controller.listLeads();
      expect(result.total).toBe(1);
      expect(result.leads[0].leadId).toBe(ingested.leadId);
    });

    it('边界: 空列表应返回 total=0', () => {
      const result = controller.listLeads();
      expect(result.total).toBe(0);
      expect(result.leads).toHaveLength(0);
    });
  });

  describe('POST /leads/sla-scan - SLA 扫描', () => {
    it('正例: 应该扫描并返回满足 SLA 条件的线索', () => {
      controller.ingestWebhook({ source: 'manual', contactName: '吴九' });

      const result = controller.scanSlaAlerts();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
    });
  });
});
