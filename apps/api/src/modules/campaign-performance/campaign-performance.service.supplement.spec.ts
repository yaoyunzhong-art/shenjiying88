// campaign-performance.service.supplement.spec.ts — 补充测试覆盖边界与业务场景
// 补充现有 test.ts 未覆盖的 service 层路径（>15 个新增用例）

import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignPerformanceService } from './campaign-performance.service';
import { CampaignType, CampaignStatus } from './campaign-performance.entity';

describe('CampaignPerformanceService — Supplement', () => {
  let service: CampaignPerformanceService;

  beforeEach(() => {
    service = new CampaignPerformanceService();
    service.resetStoresForTests();
  });

  // ─────────────────────────────────────────────────────────────────
  // listCampaigns — 补充过滤路径
  // ─────────────────────────────────────────────────────────────────

  it('listCampaigns 按 storeId 过滤返回正确数量', () => {
    const records = service.listCampaigns({ storeId: 'store-001' });
    expect(records.length).toBe(3); // store-001 有 3 条种子数据
  });

  it('listCampaigns 按 campaignType 过滤 Discount', () => {
    const records = service.listCampaigns({ campaignType: CampaignType.Discount });
    expect(records.length).toBe(2);
    records.forEach(r => expect(r.type).toBe(CampaignType.Discount));
  });

  it('listCampaigns 按 campaignType 过滤 Coupon', () => {
    const records = service.listCampaigns({ campaignType: CampaignType.Coupon });
    expect(records.length).toBe(2);
    records.forEach(r => expect(r.type).toBe(CampaignType.Coupon));
  });

  it('listCampaigns 按 campaignType 过滤 LuckyDraw', () => {
    const records = service.listCampaigns({ campaignType: CampaignType.LuckyDraw });
    expect(records.length).toBe(2);
    records.forEach(r => expect(r.type).toBe(CampaignType.LuckyDraw));
  });

  it('listCampaigns 按 campaignType 过滤 NewUser', () => {
    const records = service.listCampaigns({ campaignType: CampaignType.NewUser });
    expect(records.length).toBe(2);
    records.forEach(r => expect(r.type).toBe(CampaignType.NewUser));
  });

  it('listCampaigns 按 campaignType 过滤 Vip', () => {
    const records = service.listCampaigns({ campaignType: CampaignType.Vip });
    expect(records.length).toBe(2);
    records.forEach(r => expect(r.type).toBe(CampaignType.Vip));
  });

  it('listCampaigns 按 status 过滤 Planned', () => {
    const records = service.listCampaigns({ status: CampaignStatus.Planned });
    expect(records.length).toBe(1);
    records.forEach(r => expect(r.status).toBe(CampaignStatus.Planned));
  });

  it('listCampaigns 按 status 过滤 Cancelled', () => {
    const records = service.listCampaigns({ status: CampaignStatus.Cancelled });
    expect(records.length).toBe(1);
    records.forEach(r => expect(r.status).toBe(CampaignStatus.Cancelled));
  });

  it('listCampaigns 按组合条件过滤 (storeId + status)', () => {
    const records = service.listCampaigns({
      storeId: 'store-001',
      status: CampaignStatus.Active,
    });
    // store-001 有 3 条: 1 Discount Active, 1 Coupon Completed, 1 Vip Active
    expect(records.length).toBe(2);
    records.forEach(r => {
      expect(r.storeId).toBe('store-001');
      expect(r.status).toBe(CampaignStatus.Active);
    });
  });

  it('listCampaigns 按组合条件过滤 (storeId + type)', () => {
    const records = service.listCampaigns({
      storeId: 'store-001',
      campaignType: CampaignType.Coupon,
    });
    expect(records.length).toBe(1);
    expect(records[0].name).toBe('老客回馈满200送50券');
  });

  it('listCampaigns 按日期范围过滤 (startDate)', () => {
    const records = service.listCampaigns({ startDate: '2026-07-01' });
    // 7月1日及之后开始的
    expect(records.length).toBe(5); // 5 条种子数据 startDate >= 2026-07-01
  });

  it('listCampaigns 按日期范围过滤 (endDate)', () => {
    const records = service.listCampaigns({ endDate: '2026-06-30' });
    expect(records.length).toBe(5); // 5 条种子数据 endDate <= 2026-06-30
  });

  it('listCampaigns 全不匹配返回空数组', () => {
    const records = service.listCampaigns({
      storeId: 'store-nonexistent',
      status: CampaignStatus.Active,
    });
    expect(records).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────
  // getCampaign — 补充
  // ─────────────────────────────────────────────────────────────────

  it('getCampaign 返回匹配的 CampaignRecord 对象', () => {
    const all = service.listCampaigns();
    const first = all[0];
    const record = service.getCampaign(first.id);
    expect(record).toBeDefined();
    expect(record!.id).toBe(first.id);
    expect(record!.name).toBe(first.name);
    expect(record!.type).toBe(first.type);
    expect(record!.status).toBe(first.status);
    expect(record!.storeId).toBe(first.storeId);
  });

  it('getCampaign 返回 undefined 对于不存在的 ID', () => {
    expect(service.getCampaign('non-existent-id-12345')).toBeUndefined();
  });

  // ─────────────────────────────────────────────────────────────────
  // getSummary — 补充边界
  // ─────────────────────────────────────────────────────────────────

  it('getSummary 无过滤返回全部种子数据的汇总', () => {
    const summary = service.getSummary();
    expect(summary.totalCampaigns).toBe(10);
    expect(summary.totalBudget).toBeGreaterThan(0);
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.totalRevenue).toBeGreaterThan(0);
    expect(summary.avgROI).toBeGreaterThan(0);
    expect(summary.totalParticipants).toBeGreaterThan(0);
    expect(summary.newMembersAcquired).toBeGreaterThan(0);
  });

  it('getSummary 按 status=Planned 过滤 — cost=0,revenue=0', () => {
    const summary = service.getSummary({ status: CampaignStatus.Planned });
    expect(summary.totalCampaigns).toBe(1);
    // Planned 没有 cost 和 revenue（completed 列表为空）
    expect(summary.totalCost).toBe(0);
    expect(summary.totalRevenue).toBe(0);
    expect(summary.avgROI).toBe(0);
    expect(summary.totalParticipants).toBe(0);
    expect(summary.newMembersAcquired).toBe(0);
  });

  it('getSummary 按 status=Completed 过滤 — 只算已完成的', () => {
    const summary = service.getSummary({ status: CampaignStatus.Completed });
    expect(summary.totalCampaigns).toBeGreaterThanOrEqual(4);
    // completed 列表含 active 和 completed 状态的
    // 但 status=Completed 过滤后，listCampaigns 只返回 completed
    // 而 getSummary 内 completed 取自 status=Completed 或 Active
    // 所以对于 status=Completed 过滤，没有 active 的活动
    // 但 completed 的活动应该都有 cost 和 revenue
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.totalRevenue).toBeGreaterThan(0);
  });

  it('getSummary 按 storeId=store-005 过滤', () => {
    const summary = service.getSummary({ storeId: 'store-005' });
    expect(summary.totalCampaigns).toBe(1);
    expect(summary.totalBudget).toBe(35000);
    expect(summary.totalCost).toBe(32000); // completed, 取 cost
    expect(summary.totalRevenue).toBe(98000);
  });

  it('getSummary 按无匹配 storeId 过滤全零', () => {
    const summary = service.getSummary({ storeId: 'store-999' });
    expect(summary.totalCampaigns).toBe(0);
    expect(summary.totalBudget).toBe(0);
    expect(summary.totalCost).toBe(0);
    expect(summary.totalRevenue).toBe(0);
    expect(summary.avgROI).toBe(0);
    expect(summary.totalParticipants).toBe(0);
    expect(summary.newMembersAcquired).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────
  // createCampaign — 补充边界
  // ─────────────────────────────────────────────────────────────────

  it('createCampaign 创建全部5种类型的活动', () => {
    const types = [
      CampaignType.Discount,
      CampaignType.Coupon,
      CampaignType.LuckyDraw,
      CampaignType.NewUser,
      CampaignType.Vip,
    ];
    for (const t of types) {
      const record = service.createCampaign({
        name: `Type_${t}`,
        type: t,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        budget: 10000,
        cost: 5000,
        participants: 100,
        newMembers: 20,
        revenue: 30000,
        satisfaction: 4.0,
      });
      expect(record.type).toBe(t);
      expect(record.status).toBe(CampaignStatus.Planned);
    }
    expect(service.listCampaigns().length).toBe(10 + 5);
  });

  it('createCampaign 使用极大值不会溢出', () => {
    const record = service.createCampaign({
      name: 'BigNumbers',
      type: CampaignType.Discount,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      budget: Number.MAX_SAFE_INTEGER,
      cost: Number.MAX_SAFE_INTEGER,
      participants: Number.MAX_SAFE_INTEGER,
      newMembers: Number.MAX_SAFE_INTEGER,
      revenue: Number.MAX_SAFE_INTEGER,
      satisfaction: 5.0,
    });
    expect(record.budget).toBe(Number.MAX_SAFE_INTEGER);
    expect(record.cost).toBe(Number.MAX_SAFE_INTEGER);
    expect(record.participants).toBe(Number.MAX_SAFE_INTEGER);
    expect(record.newMembers).toBe(Number.MAX_SAFE_INTEGER);
    expect(record.revenue).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('createCampaign 设置 storeId 为 store-default', () => {
    const record = service.createCampaign({
      name: 'DefaultStore',
      type: CampaignType.Vip,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      budget: 5000,
      cost: 2000,
      participants: 50,
      newMembers: 10,
      revenue: 15000,
      satisfaction: 4.2,
    });
    expect(record.storeId).toBe('store-default');
  });

  it('createCampaign 的 id 以 campaign- 开头', () => {
    const record = service.createCampaign({
      name: 'IDPrefixCheck',
      type: CampaignType.Coupon,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      budget: 1000,
      cost: 500,
      participants: 30,
      newMembers: 5,
      revenue: 2000,
      satisfaction: 3.5,
    });
    expect(record.id).toMatch(/^campaign-/);
  });

  // ─────────────────────────────────────────────────────────────────
  // seedMockCampaigns — idempotency
  // ─────────────────────────────────────────────────────────────────

  it('resetStoresForTests 后再次 listCampaigns 重新 seed', () => {
    let records = service.listCampaigns();
    expect(records.length).toBe(10);
    // reset + 再次查询应该重新 seed（不报错）
    service.resetStoresForTests();
    records = service.listCampaigns();
    expect(records.length).toBe(10);
    // 再次 reset + seed
    service.resetStoresForTests();
    records = service.listCampaigns();
    expect(records.length).toBe(10);
  });

  // ─────────────────────────────────────────────────────────────────
  // 综合场景：创建 + 查询 + 汇总
  // ─────────────────────────────────────────────────────────────────

  it('综合: 创建新活动后列表和汇总更新', () => {
    const before = service.listCampaigns().length;
    const summaryBefore = service.getSummary();
    expect(before).toBe(10);

    const record = service.createCampaign({
      name: '综合测试活动',
      type: CampaignType.NewUser,
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      budget: 50000,
      cost: 30000,
      participants: 500,
      newMembers: 100,
      revenue: 200000,
      satisfaction: 4.5,
    });
    expect(service.listCampaigns().length).toBe(before + 1);
    const summaryAfter = service.getSummary();
    // 新活动是 planned 状态，不计入 completed 的 cost/revenue
    // 所以 totalCost 不变（planned 不在 completed 列表）
    expect(summaryAfter.totalCampaigns).toBe(summaryBefore.totalCampaigns + 1);
    // 但 totalBudget 会增加 (budget 计入所有活动)
    expect(summaryAfter.totalBudget).toBe(summaryBefore.totalBudget + 50000);

    // 确认可检索
    const fetched = service.getCampaign(record.id);
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe('综合测试活动');
  });
});
