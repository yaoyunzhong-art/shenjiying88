import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service';
import { LeadsService } from './leads.service';

describe('LeadsService - Phase-17 T11 渠道招商自动化', () => {
  let service: LeadsService;
  let metricsService: MarketingMetricsService;

  beforeEach(() => {
    metricsService = new MarketingMetricsService();
    service = new LeadsService(metricsService);
    service.reset();
  });

  it('AC-1: webhook 接入抖音线索 + 自动分配', async () => {
    service.registerRule({
      matcher: { source: 'douyin' },
      strategy: 'round-robin',
      candidatePool: ['sales-1', 'sales-2'],
    });
    const lead = service.ingestWebhook({
      source: 'douyin',
      contactName: '张三',
      contactPhone: '13800138000',
      region: 'shanghai',
    });
    expect(lead.stage).toBe('assigned');
    expect(lead.assigneeUserId).toBeDefined();
    expect(['sales-1', 'sales-2']).toContain(lead.assigneeUserId);
  });

  it('AC-2: 自动分配按地域匹配规则', () => {
    service.registerRule({
      matcher: { region: 'beijing' },
      strategy: 'specific',
      specificAssignee: 'bj-sales',
      candidatePool: ['bj-sales'],
    });
    const lead = service.ingestWebhook({
      source: 'baidu',
      contactName: '李四',
      region: 'beijing',
    });
    expect(lead.assigneeUserId).toBe('bj-sales');
  });

  it('AC-3: least-loaded 策略 - 选负载最少的销售', () => {
    service.registerRule({
      matcher: {},
      strategy: 'least-loaded',
      candidatePool: ['a', 'b'],
    });
    // 分配 2 个都给 a (a 字典序优先)
    const l1 = service.ingestWebhook({ source: 'manual', contactName: 'c-0' });
    const l2 = service.ingestWebhook({ source: 'manual', contactName: 'c-1' });
    expect(['a', 'b']).toContain(l1.assigneeUserId);
    expect(['a', 'b']).toContain(l2.assigneeUserId);
    // 关闭 a 的所有 leads → a 负载 = 0
    for (const l of [l1, l2]) {
      service.close(l.leadId, 'closed_won', 'done');
    }
    // 第 3 个应该分给 a (a 负载 0,b 负载 0,字典序 a 在前)
    const l3 = service.ingestWebhook({ source: 'manual', contactName: 'c-2' });
    expect(l3.assigneeUserId).toBe('a');
  });

  it('AC-4: 跟进笔记 + 阶段推进', () => {
    const lead = service.ingestWebhook({ source: 'xiaohongshu', contactName: '王五' });
    const updated = service.followUp(lead.leadId, 'sales-1', '已电话沟通', 'contacted');
    expect(updated!.stage).toBe('contacted');
    expect(updated!.notes.length).toBe(1);
    expect(updated!.lastContactedAt).toBeDefined();
  });

  it('AC-5: SLA 提醒 (N 天未跟进)', () => {
    const lead = service.ingestWebhook({ source: 'manual', contactName: 'priority-test' });
    // 24h + 1min 后扫描
    const future = new Date(Date.now() + (NORMAL_PRIORITY_SLA_HOURS * 3600 + 60) * 1000);
    // Use a non-zero future date
    const alerts = service.scanSlaAlerts(future);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some(a => a.leadId === lead.leadId)).toBe(true);
  });

  it('AC-6: 漏斗指标 - 各阶段计数 + 转化率', () => {
    const l1 = service.ingestWebhook({ source: 'manual', contactName: 'a' });
    const l2 = service.ingestWebhook({ source: 'manual', contactName: 'b' });
    service.followUp(l1.leadId, 'sales', 'note', 'trial');
    service.close(l2.leadId, 'closed_won', 'ok');
    const metrics = service.getFunnelMetrics();
    expect(metrics.total).toBe(2);
    expect(metrics.byStage.trial).toBe(1);
    expect(metrics.byStage.closed_won).toBe(1);
    expect(metrics.totalRevenue).toBe(10000);
  });

  it('AC-7: lead ingest + closed_won 自动写入 tenant metrics', () => {
    const lead = service.ingestWebhook({
      source: 'manual',
      contactName: '指标回归',
      storeId: 'store-metrics',
    });
    service.close(lead.leadId, 'closed_won', '签约成功');

    const snap = metricsService.snapshot('store:store-metrics');
    expect(snap.leadIngestTotal).toBe(1);
    expect(snap.leadCloseWonTotal).toBe(1);
    expect(snap.avgOrderValue).toBe(10000);
  });
});

// Constant for SLA test (must match service)
const NORMAL_PRIORITY_SLA_HOURS = 24;
