import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: LeadsService 单元测试 (渠道招商自动化核心逻辑)
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(() => {
    service = new LeadsService();
    service.reset();
  });

  // ── Webhook 接入 ──────────────────────────────────────────────
  describe('ingestWebhook', () => {
    it('AC-1: 抖音线索接入并自动分配', () => {
      const rule = service.registerRule({
        matcher: { region: '华东' },
        strategy: 'specific',
        specificAssignee: 'sales-zhang',
        candidatePool: [],
      });
      const lead = service.ingestWebhook({
        source: 'douyin',
        contactName: '王老板',
        contactPhone: '13800138000',
        region: '华东',
        storeId: 'store-sh01',
      });
      expect(lead.leadId).toMatch(/^lead-/);
      expect(lead.source).toBe('douyin');
      expect(lead.stage).toBe('assigned');
      expect(lead.assigneeUserId).toBe('sales-zhang');
    });

    it('AC-2: 无匹配规则时线索保持 new 状态', () => {
      const lead = service.ingestWebhook({
        source: 'manual',
        contactName: '张三',
        region: '华南',
      });
      expect(lead.stage).toBe('new');
      expect(lead.assigneeUserId).toBeUndefined();
    });

    it('AC-3: 紧急参数标记为 urgent 优先级', () => {
      const lead = service.ingestWebhook({
        source: 'xiaohongshu',
        contactName: '李四',
        utmParams: { priority: 'urgent' },
      });
      expect(lead.priority).toBe('urgent');
    });

    it('AC-4: manual 来源自动 high 优先级', () => {
      const lead = service.ingestWebhook({
        source: 'manual',
        contactName: '赵六',
      });
      expect(lead.priority).toBe('high');
    });
  });

  // ── 分配规则 ──────────────────────────────────────────────────
  describe('registerRule & autoAssign', () => {
    it('AC-5: round-robin 策略平均分配', () => {
      service.registerRule({
        matcher: { region: '华北' },
        strategy: 'round-robin',
        candidatePool: ['agent-a', 'agent-b', 'agent-c'],
      });
      const leads = ['L1', 'L2', 'L3', 'L4'].map(() =>
        service.ingestWebhook({
          source: 'baidu',
          contactName: 'test',
          region: '华北',
        }),
      );
      const assignees = leads.map(l => l.assigneeUserId);
      expect(assignees.filter(a => a === 'agent-a').length).toBeGreaterThanOrEqual(1);
      expect(new Set(assignees).size).toBe(3); // all three agents used
    });

    it('AC-6: least-loaded 优先分配给载最轻的人', () => {
      service.registerRule({
        matcher: { storeId: 'store-bj01' },
        strategy: 'least-loaded',
        candidatePool: ['heavy-u', 'light-u'],
      });
      // 给 heavy-u 多分配一个
      const hLead = service.ingestWebhook({
        source: 'manual',
        contactName: 'preload',
        storeId: 'store-bj01',
      });
      // 手动塞给 heavy-u (模拟已有负载)
      hLead.assigneeUserId = 'heavy-u';
      hLead.stage = 'assigned';

      const lead = service.ingestWebhook({
        source: 'baidu',
        contactName: 'new-lead',
        storeId: 'store-bj01',
      });
      expect(lead.assigneeUserId).toBe('light-u');
    });
  });

  // ── 跟进 (followUp) ──────────────────────────────────────────
  describe('followUp', () => {
    it('AC-7: 跟进添加笔记并推进阶段', () => {
      const rule = service.registerRule({
        matcher: {},
        strategy: 'specific',
        specificAssignee: 'user-x',
        candidatePool: [],
      });
      const lead = service.ingestWebhook({
        source: 'douyin', contactName: '测试'
      });
      const updated = service.followUp(lead.leadId, 'user-x', '已联系客户', 'contacted');
      expect(updated).toBeDefined();
      expect(updated!.stage).toBe('contacted');
      expect(updated!.notes).toHaveLength(1);
      expect(updated!.notes[0].content).toBe('已联系客户');
      expect(updated!.notes[0].stageBefore).toBe('assigned');
      expect(updated!.notes[0].stageAfter).toBe('contacted');
      expect(updated!.lastContactedAt).toBeDefined();
    });

    it('AC-8: 不存在的 leadId 返回 undefined', () => {
      const result = service.followUp('nonexistent', 'user-a', 'test', 'contacted');
      expect(result).toBeUndefined();
    });
  });

  // ── 关闭线索 ──────────────────────────────────────────────────
  describe('close', () => {
    it('AC-9: 赢单关闭成功', () => {
      const lead = service.ingestWebhook({
        source: 'douyin', contactName: '王总'
      });
      const closed = service.close(lead.leadId, 'closed_won', '签约成功');
      expect(closed).toBeDefined();
      expect(closed!.stage).toBe('closed_won');
      expect(closed!.closedReason).toBe('签约成功');
      expect(closed!.closedAt).toBeDefined();
    });

    it('AC-10: 流失关闭 set stage & reason', () => {
      const lead = service.ingestWebhook({
        source: 'baidu', contactName: '李总'
      });
      const closed = service.close(lead.leadId, 'closed_lost', '价格不合适');
      expect(closed!.stage).toBe('closed_lost');
      expect(closed!.closedReason).toBe('价格不合适');
    });
  });

  // ── SLA 扫描 ──────────────────────────────────────────────────
  describe('scanSlaAlerts', () => {
    it('AC-11: urgent 优先级 4h 未跟进触发告警', () => {
      const lead = service.ingestWebhook({
        source: 'manual', contactName: 'SLA测试',
        utmParams: { priority: 'urgent' },
      });
      const now = new Date(Date.now() + 5 * 3600 * 1000); // 5h later
      const alerts = service.scanSlaAlerts(now);
      expect(alerts.some(l => l.leadId === lead.leadId)).toBe(true);
    });

    it('AC-12: 刚创建的线索未超时不告警', () => {
      const lead = service.ingestWebhook({
        source: 'baidu', contactName: 'no-alert',
      });
      const alerts = service.scanSlaAlerts(new Date());
      expect(alerts.some(l => l.leadId === lead.leadId)).toBe(false);
    });

    it('AC-13: 已关闭的线索跳过 SLA 扫描', () => {
      const lead = service.ingestWebhook({
        source: 'douyin', contactName: '已赢单',
      });
      service.close(lead.leadId, 'closed_won', 'done');
      const now = new Date(Date.now() + 72 * 3600 * 1000);
      const alerts = service.scanSlaAlerts(now);
      expect(alerts.some(l => l.leadId === lead.leadId)).toBe(false);
    });
  });

  // ── 漏斗指标 ──────────────────────────────────────────────────
  describe('getFunnelMetrics', () => {
    it('AC-14: 多条线索漏斗计算正确', () => {
      const r1 = service.registerRule({ matcher: {}, strategy: 'specific', specificAssignee: 'u1', candidatePool: [] });
      const r2 = service.registerRule({ matcher: {}, strategy: 'specific', specificAssignee: 'u2', candidatePool: [] });
      const l1 = service.ingestWebhook({ source: 'douyin', contactName: '1' });
      const l2 = service.ingestWebhook({ source: 'baidu', contactName: '2' });
      const l3 = service.ingestWebhook({ source: 'manual', contactName: '3' });
      service.followUp(l1.leadId, 'u1', '跟进', 'trial');
      service.close(l2.leadId, 'closed_won', '签单');
      const metrics = service.getFunnelMetrics();
      expect(metrics.total).toBe(3);
      expect(metrics.byStage.assigned).toBe(1); // l3 still assigned
      expect(metrics.byStage.trial).toBe(1);    // l1 advanced to trial
      expect(metrics.byStage.closed_won).toBe(1); // l2 won
      expect(metrics.conversionRates.overall).toBeCloseTo(1 / 3, 2);
    });

    it('AC-15: 指定 tenantId 过滤', () => {
      const l = service.ingestWebhook({
        source: 'douyin', contactName: 'T-test', storeId: 'store-abc',
      });
      const metrics = service.getFunnelMetrics('store:store-abc');
      expect(metrics.total).toBe(1);
      const metricsAll = service.getFunnelMetrics();
      expect(metricsAll.total).toBe(1);
    });
  });

  // ── 查询 ──────────────────────────────────────────────────────
  describe('getLead & listLeads', () => {
    it('AC-16: 获取单个线索', () => {
      const l = service.ingestWebhook({ source: 'xiaohongshu', contactName: '小红' });
      const found = service.getLead(l.leadId);
      expect(found).toBeDefined();
      expect(found!.contact.name).toBe('小红');
    });

    it('AC-17: 不存在的线索返回 undefined', () => {
      expect(service.getLead('no-such-lead')).toBeUndefined();
    });

    it('AC-18: 按 tenantId 列出线索', () => {
      const l1 = service.ingestWebhook({ source: 'douyin', contactName: 'A', storeId: 's1' });
      const l2 = service.ingestWebhook({ source: 'baidu', contactName: 'B', storeId: 's2' });
      const list = service.listLeads('store:s1');
      expect(list).toHaveLength(1);
      expect(list[0].leadId).toBe(l1.leadId);
    });
  });

  // ── 跨模块桥接方法 ────────────────────────────────────────────
  describe('createLead / updateStage / getLeadsBySource', () => {
    it('AC-19: createLead 走 ingestWebhook 路径', () => {
      const lead = service.createLead({} as any, {
        source: 'douyin',
        contact: { name: '桥接测试', phone: '13900000000' },
        region: '华南',
      });
      expect(lead.leadId).toMatch(/^lead-/);
      expect(lead.contact.name).toBe('桥接测试');
    });

    it('AC-20: updateStage 推进阶段', () => {
      const lead = service.createLead({} as any, {
        source: 'manual',
        contact: { name: '阶段推进' },
      });
      const updated = service.updateStage(lead.leadId, 'contacted');
      expect(updated!.stage).toBe('contacted');
    });

    it('AC-21: updateStage 不反推 (阶段回退)', () => {
      const lead = service.createLead({} as any, {
        source: 'manual',
        contact: { name: '不回退' },
      });
      // 先推进
      service.updateStage(lead.leadId, 'trial');
      // 尝试回退
      const result = service.updateStage(lead.leadId, 'assigned');
      expect(result!.stage).toBe('trial'); // 保持原有阶段
    });

    it('AC-22: getLeadsBySource 按来源过滤', () => {
      service.createLead({} as any, { source: 'douyin', contact: { name: 'D1' } });
      service.createLead({} as any, { source: 'douyin', contact: { name: 'D2' } });
      service.createLead({} as any, { source: 'baidu', contact: { name: 'B1' } });
      const douyinLeads = service.getLeadsBySource({} as any, 'douyin');
      expect(douyinLeads).toHaveLength(2);
    });
  });

  // ── 边界情况 ──────────────────────────────────────────────────
  describe('边界情况', () => {
    it('AC-23: registerRule 返回完整 rule 对象', () => {
      const rule = service.registerRule({
        matcher: { source: 'douyin' },
        strategy: 'specific',
        specificAssignee: 'sales-01',
        candidatePool: [],
      });
      expect(rule.ruleId).toMatch(/^rule-/);
      expect(rule.strategy).toBe('specific');
      expect(rule.specificAssignee).toBe('sales-01');
    });

    it('AC-24: reset 清除所有数据和规则', () => {
      service.ingestWebhook({ source: 'douyin', contactName: 'A' });
      service.registerRule({ matcher: {}, strategy: 'specific', specificAssignee: 'u', candidatePool: [] });
      service.reset();
      expect(service.getFunnelMetrics().total).toBe(0);
    });

    it('AC-25: pickupAssignee 无候选池返回 undefined', () => {
      service.registerRule({
        matcher: { storeId: 'empty-pool' },
        strategy: 'round-robin',
        candidatePool: [],
      });
      const lead = service.ingestWebhook({
        source: 'douyin', contactName: 'empty',
        storeId: 'empty-pool',
      });
      expect(lead.assigneeUserId).toBeUndefined();
    });
  });
});
