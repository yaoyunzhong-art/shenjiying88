import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 8角色视角测试: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  beforeEach(() => {
    service = new LeadsService();
    controller = new LeadsController(service);
    // 注册一个默认分配规则
    service.registerRule({
      matcher: {},
      strategy: 'round-robin',
      candidatePool: ['user-sales-01', 'user-sales-02'],
    });
  });

  // ── 👔 店长: 关注招商整体漏斗和业绩 ──
  describe('👔 店长 Store Manager', () => {
    it('AC-1: 接入多个来源线索后漏斗指标应正确', () => {
      // 接入抖音线索
      controller.ingestWebhook({
        source: 'douyin',
        contactName: '王店长',
        contactPhone: '13800001111',
        region: '杭州',
      });
      // 接入小红书线索
      controller.ingestWebhook({
        source: 'xiaohongshu',
        contactName: '李运营',
        contactPhone: '13900002222',
        region: '上海',
      });
      // 接入手动录入(高优先级)
      controller.ingestWebhook({
        source: 'manual',
        contactName: '手工录入',
        contactPhone: '13700003333',
        region: '北京',
      });

      const metrics = controller.getFunnelMetrics();
      expect(metrics.total).toBe(3);
      expect(metrics.byStage.assigned).toBe(3);
      expect(metrics.conversionRates.overall).toBe(0);
    });

    it('AC-2: 线索成交后漏斗转化率应正确更新', () => {
      const r1 = controller.ingestWebhook({
        source: 'douyin',
        contactName: '成交客户',
        contactPhone: '13600004444',
        region: '深圳',
      });
      const r2 = controller.ingestWebhook({
        source: 'baidu',
        contactName: '流失客户',
        contactPhone: '13500005555',
      });

      controller.closeLead(r2.leadId, { stage: 'closed_lost', reason: '价格不合适' });
      controller.followUp({
        leadId: r1.leadId,
        authorUserId: 'user-sales-01',
        content: '体验中',
        newStage: 'trial',
      });
      controller.followUp({
        leadId: r1.leadId,
        authorUserId: 'user-sales-01',
        content: '谈判中',
        newStage: 'negotiation',
      });
      controller.closeLead(r1.leadId, { stage: 'closed_won', reason: '签约成功' });

      const metrics = controller.getFunnelMetrics();
      expect(metrics.total).toBe(2);
      expect(metrics.byStage.closed_won).toBe(1);
      expect(metrics.byStage.closed_lost).toBe(1);
      expect(metrics.totalRevenue).toBe(10000);
    });
  });

  // ── 🛒 前台: 关注线索快速分配和联系 ──
  describe('🛒 前台 Front Desk', () => {
    it('AC-3: 接入线索后应自动分配并返回 assigneeUserId', () => {
      const result = controller.ingestWebhook({
        source: 'douyin',
        contactName: '前台进线',
        contactPhone: '13400006666',
        region: '广州',
      });
      expect(result.assigneeUserId).toBeDefined();
      expect(typeof result.assigneeUserId).toBe('string');
      expect(result.stage).toBe('assigned');
    });

    it('AC-4: 查询线索应返回完整信息', () => {
      const created = controller.ingestWebhook({
        source: 'xiaohongshu',
        contactName: '查询测试',
        contactPhone: '13300007777',
      });
      const result = controller.getLead(created.leadId);
      expect(result.found).toBe(true);
      expect(result.lead!.contact.name).toBe('查询测试');
      expect(result.lead!.source).toBe('xiaohongshu');
    });
  });

  // ── 👥 HR: 关注规则分配公平性与人员负载 ──
  describe('👥 HR HR Manager', () => {
    it('AC-5: Round-robin 应均匀分配线索', () => {
      const results: string[] = [];
      for (let i = 0; i < 6; i++) {
        const r = controller.ingestWebhook({
          source: 'baidu',
          contactName: `候选人${i}`,
          contactPhone: `1320000${String(i).padStart(4, '0')}`,
        });
        results.push(r.assigneeUserId as string);
      }
      const user01 = results.filter(u => u === 'user-sales-01').length;
      const user02 = results.filter(u => u === 'user-sales-02').length;
      expect(user01).toBe(3);
      expect(user02).toBe(3);
    });

    it('AC-6: 注册新规则应返回规则 ID', () => {
      const rule = controller.registerRule({
        matcher: { region: '北京' },
        strategy: 'specific',
        specificAssignee: 'user-beijing-001',
        candidatePool: ['user-beijing-001'],
      });
      expect(rule.ruleId).toBeDefined();
      expect(rule.ruleId).toMatch(/^rule-/);
    });
  });

  // ── 🔧 安监: 关注 SLA 超时告警和风险线索 ──
  describe('🔧 安监 Safety Supervisor', () => {
    it('AC-7: SLA 扫描应返回超时线索（通过 hack 过去时间）', () => {
      const r = controller.ingestWebhook({
        source: 'douyin',
        contactName: 'SLA测试',
        contactPhone: '13100008888',
      });
      // 通过 service 直接修改 lastContactedAt 模拟超时
      const lead = service.getLead(r.leadId)!;
      const oldDate = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
      (lead as any).createdAt = oldDate;
      (lead as any).updatedAt = oldDate;

      // 使用过去时间扫描 SLA
      const past = new Date(Date.now() + 1000);
      // 直接调 service 扫描（past 时间确保不漏掉）
      const alerts = (service as any).scanSlaAlerts(past);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(alerts.some((a: any) => a.leadId === r.leadId)).toBe(true);
    });

    it('AC-8: 未跟进的 urgent 线索应在4小时内告警', () => {
      const r = controller.ingestWebhook({
        source: 'manual',
        contactName: '紧急线索',
        contactPhone: '13000009999',
        utmParams: { priority: 'urgent' },
      });
      // 直接修改 createdAt 到 5 小时前
      const lead = service.getLead(r.leadId)!;
      const oldDate = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
      (lead as any).createdAt = oldDate;
      (lead as any).updatedAt = oldDate;

      const past = new Date(Date.now() + 1000);
      const alerts = (service as any).scanSlaAlerts(past);
      expect(alerts.some((a: any) => a.leadId === r.leadId)).toBe(true);
    });
  });

  // ── 🎮 导玩员: 关注线索线索来源和渠道质量 ──
  describe('🎮 导玩员 Game Guide', () => {
    it('AC-9: 不同来源的多条线索应正确分类查询', () => {
      controller.ingestWebhook({ source: 'douyin', contactName: 'DY-1', contactPhone: '12900001111' });
      controller.ingestWebhook({ source: 'douyin', contactName: 'DY-2', contactPhone: '12900002222' });
      controller.ingestWebhook({ source: 'xiaohongshu', contactName: 'XHS-1', contactPhone: '12900003333' });
      controller.ingestWebhook({ source: 'baidu', contactName: 'BD-1', contactPhone: '12900004444' });

      const dyLeads = service.getLeadsBySource(null as any, 'douyin');
      expect(dyLeads.length).toBe(2);

      const all = controller.listLeads();
      expect(all.total).toBe(4);
    });

    it('AC-10: 已成交线索再查询应显示 closed 状态', () => {
      const r = controller.ingestWebhook({
        source: 'referral',
        contactName: '推荐客户',
        contactPhone: '12800005555',
      });
      controller.closeLead(r.leadId, { stage: 'closed_won', reason: '推荐成交' });
      const detail = controller.getLead(r.leadId);
      expect(detail.found).toBe(true);
      expect(detail.lead!.stage).toBe('closed_won');
      expect(detail.lead!.closedReason).toBe('推荐成交');
    });
  });

  // ── 🎯 运行专员: 关注线索流转和操作稳定性 ──
  describe('🎯 运行专员 Operations Specialist', () => {
    it('AC-11: 跟进线索后应更新 stage 和 lastContactedAt', () => {
      const r = controller.ingestWebhook({
        source: 'baidu',
        contactName: '跟进测试',
        contactPhone: '12700006666',
      });
      const result = controller.followUp({
        leadId: r.leadId,
        authorUserId: 'user-sales-01',
        content: '已电话联系，安排体验',
        newStage: 'contacted',
      });
      expect(result.success).toBe(true);
      expect(result.stage).toBe('contacted');
      expect(result.lastContactedAt).toBeDefined();

      const detail = controller.getLead(r.leadId);
      expect(detail.lead!.notes).toHaveLength(1);
      expect(detail.lead!.notes[0].content).toBe('已电话联系，安排体验');
    });

    it('AC-12: 批量操作 - 10条线索接入应无报错', () => {
      for (let i = 0; i < 10; i++) {
        const r = controller.ingestWebhook({
          source: 'douyin',
          contactName: `批量${i}`,
          contactPhone: `1260000${String(i).padStart(4, '0')}`,
        });
        expect(r.leadId).toBeDefined();
      }
      const all = controller.listLeads();
      expect(all.total).toBe(10);
    });

    it('AC-13: 不存在的线索查询应返回 found=false', () => {
      const result = controller.getLead('lead-nonexistent');
      expect(result.found).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  // ── 🤝 团建: 关注团队协作和任务分配 ──
  describe('🤝 团建 Team Building Coordinator', () => {
    it('AC-14: 同区域线索应分配到相同规则下的人员', () => {
      // 使用独立 service 避免干扰默认规则
      const freshService = new LeadsService();
      const freshController = new LeadsController(freshService);

      // 注册北京规则
      freshController.registerRule({
        matcher: { region: '北京' },
        strategy: 'specific',
        specificAssignee: 'user-beijing-02',
        candidatePool: ['user-beijing-02'],
      });

      const r1 = freshController.ingestWebhook({
        source: 'douyin',
        contactName: '北京线索A',
        contactPhone: '12500001111',
        region: '北京',
      });
      const r2 = freshController.ingestWebhook({
        source: 'douyin',
        contactName: '北京线索B',
        contactPhone: '12500002222',
        region: '北京',
      });
      expect(r1.assigneeUserId).toBe('user-beijing-02');
      expect(r2.assigneeUserId).toBe('user-beijing-02');
    });

    it('AC-15: 跟进笔记应记录操作人', () => {
      const r = controller.ingestWebhook({
        source: 'manual',
        contactName: '团建线索',
        contactPhone: '12400003333',
      });
      controller.followUp({
        leadId: r.leadId,
        authorUserId: 'user-team-01',
        content: '初步沟通',
        newStage: 'contacted',
      });
      const detail = controller.getLead(r.leadId);
      expect(detail.lead!.notes[0].authorUserId).toBe('user-team-01');
    });
  });

  // ── 📢 营销: 关注渠道来源和转化效果 ──
  describe('📢 营销 Marketing Manager', () => {
    it('AC-16: 不同渠道线索应可区分统计', () => {
      controller.ingestWebhook({ source: 'douyin', contactName: 'DY', contactPhone: '12300001111' });
      controller.ingestWebhook({ source: 'xiaohongshu', contactName: 'XHS', contactPhone: '12300002222' });
      controller.ingestWebhook({ source: 'baidu', contactName: 'BD', contactPhone: '12300003333' });
      controller.ingestWebhook({ source: 'referral', contactName: 'RF', contactPhone: '12300004444' });

      const all = controller.listLeads();
      const bySource = all.leads.reduce((acc: Record<string, number>, l: any) => {
        acc[l.source] = (acc[l.source] || 0) + 1;
        return acc;
      }, {});
      expect(bySource.douyin).toBe(1);
      expect(bySource.xiaohongshu).toBe(1);
      expect(bySource.baidu).toBe(1);
      expect(bySource.referral).toBe(1);
    });

    it('AC-17: 营销渠道转化漏斗应向营销经理展示', () => {
      // 创建一些线索，部分成交
      const leads = [
        controller.ingestWebhook({ source: 'douyin', contactName: 'DY-W', contactPhone: '12200001111' }),
        controller.ingestWebhook({ source: 'douyin', contactName: 'DY-L', contactPhone: '12200002222' }),
        controller.ingestWebhook({ source: 'xiaohongshu', contactName: 'XHS-W', contactPhone: '12200003333' }),
      ];
      controller.closeLead(leads[0].leadId, { stage: 'closed_won', reason: '成交' });
      controller.closeLead(leads[1].leadId, { stage: 'closed_lost', reason: '流失' });
      controller.followUp({
        leadId: leads[2].leadId,
        authorUserId: 'user-sales-01',
        content: '体验中',
        newStage: 'trial',
      });

      const metrics = controller.getFunnelMetrics();
      expect(metrics.byStage.closed_won).toBe(1);
      expect(metrics.byStage.closed_lost).toBe(1);
      expect(metrics.byStage.trial).toBe(1);
      expect(metrics.conversionRates.overall).toBeGreaterThan(0);
    });
  });

  // ── 边界场景 ──
  describe('边界场景 Edge Cases', () => {
    it('AC-18: 关闭已关闭的线索应仍返回 success', () => {
      const r = controller.ingestWebhook({
        source: 'baidu',
        contactName: '双关闭',
        contactPhone: '12000001111',
      });
      controller.closeLead(r.leadId, { stage: 'closed_won', reason: '首次成交' });
      // 再次关闭
      const result = controller.closeLead(r.leadId, { stage: 'closed_lost', reason: '二次关闭' });
      expect(result.success).toBe(true);
      expect(result.stage).toBe('closed_lost');
    });

    it('AC-19: 跟进不存在的线索应返回 success=false', () => {
      const result = controller.followUp({
        leadId: 'lead-fake-999',
        authorUserId: 'user-sales-01',
        content: '测试',
        newStage: 'contacted',
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('AC-20: 关闭不存在的线索应返回 success=false', () => {
      const result = controller.closeLead('lead-fake-888', { stage: 'closed_won', reason: '不存在' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('AC-21: 空线索列表应返回总量 0', () => {
      // 使用新 service 保证无数据
      const emptyService = new LeadsService();
      const emptyController = new LeadsController(emptyService);
      const result = emptyController.listLeads();
      expect(result.total).toBe(0);
      expect(result.leads).toHaveLength(0);
    });

    it('AC-22: 无匹配规则时应能接入（但无分配）', () => {
      const emptyService = new LeadsService();
      const emptyController = new LeadsController(emptyService);
      const r = emptyController.ingestWebhook({
        source: 'douyin',
        contactName: '无规则',
        contactPhone: '11900001111',
      });
      expect(r.assigneeUserId).toBeUndefined();
      expect(r.stage).toBe('new');
    });
  });
});
