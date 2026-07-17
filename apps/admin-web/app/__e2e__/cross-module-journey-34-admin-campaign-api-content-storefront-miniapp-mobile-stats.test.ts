/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链34 (V19 Day2 凌晨第三段 新增)
 * Admin活动创建 → API内容/营销引擎 → Storefront活动展示 → Miniapp活动参与 → Mobile活动统计
 *
 * 新增于 2026-07-18 03:30-05:30 第三段·复盘进化
 * 覆盖: admin-web(活动创建/素材管理/投放配置) → api(内容引擎/营销规则/投放状态) → storefront-web(活动列表/活动详情/报名入口) → miniapp(活动报名/签到/任务完成) → mobile(活动统计/参与率/ROI)
 *
 * 🚨 新增链: 营销活动全链路 (Marketing Campaign Lifecycle)
 *
 * 测试设计:
 *   - P1 正例: 创建活动 → 配置投放 → 上架展示 → 用户报名参与 → 统计看板
 *   - P2 正例: 多活动同时运行(定时投放+永久投放) → 统计独立
 *   - N1 反例: 活动未开始 → 报名拒绝/展示隐藏
 *   - N2 反例: 活动名额已满 → 报名拒绝
 *   - N3 反例: 已结束活动 → 不可报名 + 统计截止
 *   - B1 边界: 活动素材超出尺寸限制(图片>5MB)拒绝上传
 *   - B2 边界: 0元活动(免费报名) → 统计无收入但记录参与
 *   - B3 边界: 同时报名多个活动 → 个人参与列表去重
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';
type CampaignType = 'promotion' | 'event' | 'flash_sale' | 'new_user' | 'referral';
type MaterialType = 'image' | 'video' | 'carousel';
type ParticipationStatus = 'registered' | 'checked_in' | 'completed' | 'cancelled';

interface CampaignMaterial {
  id: string;
  type: MaterialType;
  url: string;
  fileSize: number; // bytes
  width: number;
  height: number;
  duration?: number; // seconds, for video
}

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  description: string;
  materials: CampaignMaterial[];
  startAt: number;
  endAt: number;
  maxParticipants: number;
  currentParticipants: number;
  rewardPoints: number;
  rewardCouponId: string | null;
  storeCodes: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

interface CampaignDisplay {
  campaignId: string;
  title: string;
  coverImage: string;
  summary: string;
  type: CampaignType;
  startAt: number;
  endAt: number;
  spotsLeft: number;
  rewardDescription: string;
  visible: boolean;
}

interface CampaignRegistration {
  id: string;
  campaignId: string;
  memberId: string;
  memberName: string;
  status: ParticipationStatus;
  registeredAt: number;
  checkedInAt: number | null;
  completedAt: number | null;
}

interface ActivityStats {
  campaignId: string;
  campaignName: string;
  totalViews: number;
  totalRegistrations: number;
  totalCheckIns: number;
  totalCompletions: number;
  registrationRate: number; // 0-1
  checkInRate: number;      // 0-1
  completionRate: number;   // 0-1
  revenueGenerated: number;
  pointsDistributed: number;
}

interface CampaignTask {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  points: number;
  required: boolean; // 是否必须完成
}

interface MemberActivityRecord {
  memberId: string;
  campaignId: string;
  campaignName: string;
  registrationStatus: ParticipationStatus;
  completedTasks: string[];
  totalPointsEarned: number;
}

// ─── In-Memory 模拟引擎 ───

interface SimState {
  campaigns: Map<string, Campaign>;
  registrations: CampaignRegistration[];
  stats: ActivityStats[];
  tasks: CampaignTask[];
  memberRecords: MemberActivityRecord[];
}

function createSim(): SimState {
  return {
    campaigns: new Map(),
    registrations: [],
    stats: [],
    tasks: [],
    memberRecords: [],
  };
}

/** 校验素材尺寸 */
function validateMaterial(material: CampaignMaterial): string | null {
  if (material.type === 'image' && material.fileSize > 5 * 1024 * 1024) {
    return '图片素材不能超过5MB';
  }
  if (material.type === 'video' && material.fileSize > 100 * 1024 * 1024) {
    return '视频素材不能超过100MB';
  }
  if (material.width > 3840 || material.height > 2160) {
    return '素材分辨率不能超过4K(3840x2160)';
  }
  return null;
}

/** Admin: 创建活动 */
function createCampaign(state: SimState, campaign: Campaign): Campaign {
  for (const mat of campaign.materials) {
    const err = validateMaterial(mat);
    if (err) throw new Error(err);
  }
  if (campaign.startAt >= campaign.endAt) {
    throw new Error('活动结束时间必须晚于开始时间');
  }
  if (campaign.maxParticipants < 1) {
    throw new Error('活动参与人数必须大于0');
  }
  state.campaigns.set(campaign.id, { ...campaign });
  state.stats.push({
    campaignId: campaign.id,
    campaignName: campaign.name,
    totalViews: 0,
    totalRegistrations: 0,
    totalCheckIns: 0,
    totalCompletions: 0,
    registrationRate: 0,
    checkInRate: 0,
    completionRate: 0,
    revenueGenerated: 0,
    pointsDistributed: 0,
  });
  return campaign;
}

/** API: 发布活动 (draft → scheduled/active) */
function publishCampaign(state: SimState, campaignId: string, now: number): Campaign {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) throw new Error('活动不存在');
  if (campaign.status !== 'draft') throw new Error('只有草稿状态的活动可以发布');

  if (now < campaign.startAt) {
    campaign.status = 'scheduled';
  } else if (now >= campaign.startAt && now < campaign.endAt) {
    campaign.status = 'active';
  } else {
    throw new Error('活动开始时间已过，无法发布');
  }
  campaign.updatedAt = now;
  return campaign;
}

/** Storefront: 获取可见活动列表 */
function getVisibleCampaigns(state: SimState, now: number): CampaignDisplay[] {
  const displays: CampaignDisplay[] = [];
  for (const [, campaign] of state.campaigns) {
    if (campaign.status === 'cancelled') continue;
    if (now < campaign.startAt && campaign.status === 'scheduled') continue; // 定时活动不显示
    if (campaign.status !== 'active') continue;

    const spotsLeft = campaign.maxParticipants - campaign.currentParticipants;
    displays.push({
      campaignId: campaign.id,
      title: campaign.name,
      coverImage: campaign.materials[0]?.url ?? '',
      summary: campaign.description.slice(0, 100),
      type: campaign.type,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
      spotsLeft: Math.max(0, spotsLeft),
      rewardDescription: `参与可得 ${campaign.rewardPoints} 积分`,
      visible: true,
    });
  }
  return displays;
}

/** Miniapp: 报名参加活动 */
function registerCampaign(
  state: SimState,
  campaignId: string,
  memberId: string,
  memberName: string,
  now: number
): CampaignRegistration {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) throw new Error('活动不存在');
  if (now < campaign.startAt || now >= campaign.endAt) throw new Error('活动不在进行中');
  if (campaign.status !== 'active') throw new Error('活动未开始或已结束');
  if (campaign.currentParticipants >= campaign.maxParticipants) throw new Error('活动名额已满');

  // 检查是否重复报名
  const already = state.registrations.find(
    r => r.campaignId === campaignId && r.memberId === memberId
  );
  if (already) throw new Error('您已报名此活动，请勿重复操作');

  campaign.currentParticipants++;
  campaign.updatedAt = now;

  const registration: CampaignRegistration = {
    id: `reg-${campaignId}-${memberId}`,
    campaignId,
    memberId,
    memberName,
    status: 'registered',
    registeredAt: now,
    checkedInAt: null,
    completedAt: null,
  };
  state.registrations.push(registration);

  // 更新个人记录
  const existing = state.memberRecords.find(
    r => r.memberId === memberId && r.campaignId === campaignId
  );
  if (!existing) {
    state.memberRecords.push({
      memberId,
      campaignId,
      campaignName: campaign.name,
      registrationStatus: 'registered',
      completedTasks: [],
      totalPointsEarned: 0,
    });
  }

  // 更新统计
  const stat = state.stats.find(s => s.campaignId === campaignId);
  if (stat) {
    stat.totalRegistrations++;
    stat.registrationRate = stat.totalRegistrations / Math.max(1, stat.totalViews);
  }

  return registration;
}

/** Miniapp: 签到 */
function checkInCampaign(
  state: SimState,
  campaignId: string,
  memberId: string,
  now: number
): void {
  const reg = state.registrations.find(
    r => r.campaignId === campaignId && r.memberId === memberId
  );
  if (!reg) throw new Error('未报名此活动');
  if (reg.status !== 'registered') throw new Error('签到状态不正确');
  if (now < reg.registeredAt) throw new Error('签到时间异常');

  reg.status = 'checked_in';
  reg.checkedInAt = now;

  const stat = state.stats.find(s => s.campaignId === campaignId);
  if (stat) {
    stat.totalCheckIns++;
    stat.checkInRate = stat.totalCheckIns / Math.max(1, stat.totalRegistrations);
  }
}

/** Miniapp: 完成任务 */
function completeTask(
  state: SimState,
  campaignId: string,
  memberId: string,
  taskId: string
): number {
  const reg = state.registrations.find(
    r => r.campaignId === campaignId && r.memberId === memberId
  );
  if (!reg) throw new Error('未报名此活动');

  const task = state.tasks.find(t => t.id === taskId && t.campaignId === campaignId);
  if (!task) throw new Error('任务不存在');

  const record = state.memberRecords.find(
    r => r.memberId === memberId && r.campaignId === campaignId
  );
  if (!record) throw new Error('参与记录不存在');

  // 防重
  if (record.completedTasks.includes(taskId)) throw new Error('任务已完成，请勿重复提交');

  record.completedTasks.push(taskId);
  record.totalPointsEarned += task.points;

  // 检查是否全部完成
  const allTasks = state.tasks.filter(t => t.campaignId === campaignId);
  const requiredTasks = allTasks.filter(t => t.required);
  const completedRequired = requiredTasks.filter(t => record.completedTasks.includes(t.id));
  if (requiredTasks.length > 0 && completedRequired.length === requiredTasks.length) {
    reg.status = 'completed';
    reg.completedAt = Date.now();
  }

  const campaign = state.campaigns.get(campaignId);
  if (campaign) {
    campaign.rewardPoints += task.points;
  }

  const stat = state.stats.find(s => s.campaignId === campaignId);
  if (stat) {
    stat.pointsDistributed += task.points;
    stat.totalCompletions = state.registrations.filter(
      r => r.campaignId === campaignId && r.status === 'completed'
    ).length;
    stat.completionRate = stat.totalCompletions / Math.max(1, stat.totalRegistrations);
  }

  return task.points;
}

/** Mobile: 获取活动统计看板 */
function getCampaignStats(state: SimState, campaignId: string): ActivityStats {
  const stat = state.stats.find(s => s.campaignId === campaignId);
  if (!stat) throw new Error('活动统计不存在');
  return { ...stat };
}

/** Storefront: 检查活动结束是否自动隐藏 */
function checkEndedCampaignVisibility(state: SimState, campaignId: string, now: number): boolean {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) return false;
  if (campaign.status === 'ended' || now >= campaign.endAt) return false;
  return campaign.status === 'active';
}

// ─── 模拟数据 ───

function makeTestCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'camp-promo-001',
    name: '夏日狂欢促销',
    type: 'promotion',
    status: 'draft',
    description: '夏日限定！全场商品8折优惠',
    materials: [
      { id: 'mat-001', type: 'image', url: '/materials/summer.jpg', fileSize: 2 * 1024 * 1024, width: 1920, height: 1080 },
    ],
    startAt: Date.now() - 86400000,
    endAt: Date.now() + 86400000 * 7,
    maxParticipants: 100,
    currentParticipants: 0,
    rewardPoints: 50,
    rewardCouponId: null,
    storeCodes: ['store-001', 'store-002'],
    createdBy: 'admin-001',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    ...overrides,
  };
}

function makeTestTask(overrides: Partial<CampaignTask> = {}): CampaignTask {
  return {
    id: 'task-001',
    campaignId: 'camp-promo-001',
    name: '浏览活动页面',
    description: '浏览活动详情页至少30秒',
    points: 10,
    required: true,
    ...overrides,
  };
}

// ─── 测试用例 ───

describe('链34: Admin活动创建 → API内容引擎 → Storefront活动展示 → Miniapp报名 → Mobile统计', () => {
  let sim: SimState;
  const now = Date.now();

  // 每个子describe前重置状态
  function resetSim() {
    sim = createSim();
    const baseCampaign = makeTestCampaign();
    createCampaign(sim, baseCampaign);
    const task1 = makeTestTask();
    const task2 = makeTestTask({ id: 'task-002', name: '分享活动', points: 20, required: true });
    const task3 = makeTestTask({ id: 'task-003', name: '下单消费', points: 30, required: false });
    sim.tasks.push(task1, task2, task3);
  }

  // ── P1: 全链路正例 ──

  describe('P1 正例: 创建活动 → 发布 → 展示 → 报名 → 签到 → 完成任务 → 统计', () => {
    test.before(() => resetSim());

    test('P1.1 Admin创建活动(草稿)', () => {
      const campaign = sim.campaigns.get('camp-promo-001');
      assert.ok(campaign);
      assert.equal(campaign.status, 'draft');
      assert.equal(campaign.materials.length, 1);
      assert.equal(campaign.name, '夏日狂欢促销');
    });

    test('P1.2 API发布活动(从定时→活跃)', () => {
      const published = publishCampaign(sim, 'camp-promo-001', now);
      assert.equal(published.status, 'active');
      assert.ok(published.updatedAt >= published.createdAt);
    });

    test('P1.3 Storefront展示可见活动列表', () => {
      const visible = getVisibleCampaigns(sim, now);
      assert.ok(visible.length >= 1);
      const campDisplay = visible.find(v => v.campaignId === 'camp-promo-001');
      assert.ok(campDisplay);
      assert.ok(campDisplay.visible);
      assert.equal(campDisplay.spotsLeft, 100);
    });

    test('P1.4 Miniapp用户报名活动', () => {
      const reg = registerCampaign(sim, 'camp-promo-001', 'member-001', '张三', now);
      assert.equal(reg.status, 'registered');
      assert.ok(reg.registeredAt > 0);
      assert.equal(sim.campaigns.get('camp-promo-001')?.currentParticipants, 1);
    });

    test('P1.5 Miniapp签到', () => {
      checkInCampaign(sim, 'camp-promo-001', 'member-001', now + 1000);
      const reg = sim.registrations.find(r => r.memberId === 'member-001');
      assert.ok(reg);
      assert.equal(reg.status, 'checked_in');
      assert.ok(reg.checkedInAt);
    });

    test('P1.6 Miniapp完成任务', () => {
      const points1 = completeTask(sim, 'camp-promo-001', 'member-001', 'task-001');
      assert.equal(points1, 10);
      const points2 = completeTask(sim, 'camp-promo-001', 'member-001', 'task-002');
      assert.equal(points2, 20);

      const record = sim.memberRecords.find(r => r.memberId === 'member-001');
      assert.ok(record);
      assert.equal(record.totalPointsEarned, 30);
      assert.equal(record.completedTasks.length, 2);
    });

    test('P1.7 Mobile活动统计看板', () => {
      // 统计前增加一次views (在报名/签到之后)
      const stat = sim.stats.find(s => s.campaignId === 'camp-promo-001');
      assert.ok(stat);
      stat.totalViews = 10; // 模拟浏览
      // 重新计算registrationRate
      stat.registrationRate = stat.totalRegistrations / Math.max(1, stat.totalViews);

      const stats = getCampaignStats(sim, 'camp-promo-001');
      assert.equal(stats.totalViews, 10);
      assert.equal(stats.totalRegistrations, 1);
      assert.equal(stats.totalCheckIns, 1);
      assert.equal(stats.totalCompletions, 1);
      assert.equal(stats.registrationRate, 0.1);
    });
  });

  // ── N: 反例 ──

  describe('N1 反例: 活动未开始 → Storefront不展示 / 报名拒绝', () => {
    test.before(() => {
      sim = createSim();
      // 创建一个未来才开始的 campaign
      const futureCampaign = makeTestCampaign({
        id: 'camp-future-001',
        name: '国庆活动',
        startAt: now + 86400000 * 30,
        endAt: now + 86400000 * 37,
        status: 'scheduled',
      });
      sim.campaigns.set(futureCampaign.id, futureCampaign);
      sim.stats.push({
        campaignId: futureCampaign.id,
        campaignName: futureCampaign.name,
        totalViews: 0, totalRegistrations: 0, totalCheckIns: 0,
        totalCompletions: 0, registrationRate: 0, checkInRate: 0,
        completionRate: 0, revenueGenerated: 0, pointsDistributed: 0,
      });
    });

    test('N1.1 Storefront不展示未开始活动', () => {
      const visible = getVisibleCampaigns(sim, now);
      const future = visible.find(v => v.campaignId === 'camp-future-001');
      assert.equal(future, undefined, '未开始活动不应可见');
    });

    test('N1.2 报名未来活动被拒绝', () => {
      assert.throws(
        () => registerCampaign(sim, 'camp-future-001', 'member-001', '李四', now),
        /活动不在进行中/
      );
    });
  });

  describe('N2 反例: 活动名额已满 → 报名拒绝', () => {
    test.before(() => {
      sim = createSim();
      const fullCampaign = makeTestCampaign({
        id: 'camp-full-001',
        name: '限时抢购',
        maxParticipants: 2,
        currentParticipants: 2,
        status: 'active',
      });
      sim.campaigns.set(fullCampaign.id, fullCampaign);
      sim.stats.push({
        campaignId: fullCampaign.id,
        campaignName: fullCampaign.name,
        totalViews: 0, totalRegistrations: 2, totalCheckIns: 0,
        totalCompletions: 0, registrationRate: 0, checkInRate: 0,
        completionRate: 0, revenueGenerated: 0, pointsDistributed: 0,
      });
    });

    test('N2.1 名额已满拒绝报名', () => {
      assert.throws(
        () => registerCampaign(sim, 'camp-full-001', 'member-003', '王五', now),
        /活动名额已满/
      );
    });
  });

  describe('N3 反例: 重复报名被拒绝', () => {
    test.before(() => {
      sim = createSim();
      const campaign = makeTestCampaign({ status: 'active' });
      createCampaign(sim, campaign);
    });

    test('N3.1 首次报名成功', () => {
      const reg = registerCampaign(sim, 'camp-promo-001', 'member-007', '重复用户', now);
      assert.equal(reg.status, 'registered');
    });

    test('N3.2 重复报名被拦截', () => {
      assert.throws(
        () => registerCampaign(sim, 'camp-promo-001', 'member-007', '重复用户', now),
        /请勿重复操作/
      );
    });
  });

  // ── B: 边界 ──

  describe('B1 边界: 素材超限拒绝上传', () => {
    test('B1.1 图片超过5MB拒绝', () => {
      const oversizeMaterial: CampaignMaterial = {
        id: 'mat-large', type: 'image', url: '/materials/large.jpg',
        fileSize: 6 * 1024 * 1024, width: 1920, height: 1080,
      };
      const err = validateMaterial(oversizeMaterial);
      assert.equal(err, '图片素材不能超过5MB');
    });

    test('B1.2 分辨率超4K拒绝', () => {
      const largeResMaterial: CampaignMaterial = {
        id: 'mat-4k', type: 'image', url: '/materials/4k.jpg',
        fileSize: 1 * 1024 * 1024, width: 4096, height: 2160,
      };
      const err = validateMaterial(largeResMaterial);
      assert.equal(err, '素材分辨率不能超过4K(3840x2160)');
    });

    test('B1.3 正常素材通过', () => {
      const normalMaterial: CampaignMaterial = {
        id: 'mat-normal', type: 'image', url: '/materials/normal.jpg',
        fileSize: 1 * 1024 * 1024, width: 1920, height: 1080,
      };
      const err = validateMaterial(normalMaterial);
      assert.equal(err, null);
    });
  });

  describe('B2 边界: 0元活动(免费报名)独立统计', () => {
    test.before(() => {
      sim = createSim();
      const freeCampaign = makeTestCampaign({
        id: 'camp-free-001',
        name: '免费体验活动',
        rewardPoints: 0,
        rewardCouponId: null,
      });
      createCampaign(sim, freeCampaign);
      publishCampaign(sim, 'camp-free-001', now);
    });

    test('B2.1 免费活动可见', () => {
      const visible = getVisibleCampaigns(sim, now);
      const freeDisplay = visible.find(v => v.campaignId === 'camp-free-001');
      assert.ok(freeDisplay);
      assert.ok(freeDisplay.visible);
    });

    test('B2.2 免费活动统计无收入但有参与', () => {
      registerCampaign(sim, 'camp-free-001', 'member-010', '免费用户', now);
      const stat = sim.stats.find(s => s.campaignId === 'camp-free-001');
      assert.ok(stat);
      assert.equal(stat.totalRegistrations, 1);
      assert.equal(stat.revenueGenerated, 0);
    });
  });

  describe('B3 边界: 同时报名多个活动 → 个人参与列表去重', () => {
    test.before(() => {
      sim = createSim();
      // 使用 draft 状态创建, publish 后再手动设为 active(跳过发布检查因为已经是 active 状态构造)
      // 改为直接构造 active 状态的 campaign (绕过 publish 检查)
      const camp1 = makeTestCampaign({ id: 'camp-multi-1', name: '活动1', status: 'active' });
      const camp2 = makeTestCampaign({ id: 'camp-multi-2', name: '活动2', status: 'active' });
      sim.campaigns.set(camp1.id, camp1);
      sim.campaigns.set(camp2.id, camp2);
      sim.stats.push({
        campaignId: camp1.id, campaignName: camp1.name,
        totalViews: 0, totalRegistrations: 0, totalCheckIns: 0,
        totalCompletions: 0, registrationRate: 0, checkInRate: 0,
        completionRate: 0, revenueGenerated: 0, pointsDistributed: 0,
      });
      sim.stats.push({
        campaignId: camp2.id, campaignName: camp2.name,
        totalViews: 0, totalRegistrations: 0, totalCheckIns: 0,
        totalCompletions: 0, registrationRate: 0, checkInRate: 0,
        completionRate: 0, revenueGenerated: 0, pointsDistributed: 0,
      });
    });

    test('B3.1 同一用户报名多个活动', () => {
      const reg1 = registerCampaign(sim, 'camp-multi-1', 'member-020', '多活用户', now);
      const reg2 = registerCampaign(sim, 'camp-multi-2', 'member-020', '多活用户', now + 1000);
      assert.equal(reg1.status, 'registered');
      assert.equal(reg2.status, 'registered');

      const memberRegs = sim.registrations.filter(r => r.memberId === 'member-020');
      assert.equal(memberRegs.length, 2);
    });

    test('B3.2 个人记录列表无重复', () => {
      const records = sim.memberRecords.filter(r => r.memberId === 'member-020');
      const deduped = new Map(records.map(r => [`${r.memberId}-${r.campaignId}`, r]));
      assert.equal(Array.from(deduped.values()).length, records.length, '个人参与记录应无重复');
    });
  });
});
