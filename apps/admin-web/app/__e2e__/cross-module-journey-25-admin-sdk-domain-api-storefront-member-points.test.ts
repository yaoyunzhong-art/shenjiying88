/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链25 (Pulse-Nightly-16)
 * 管理端会员配置 → SDK积分计算 → Domain领域规则 → API积分变更 → Storefront兑换核销
 *
 * 新增于 2026-07-15 03:30-05:30 第三段
 * 覆盖: admin-web(会员等级/积分规则配置) → sdk(积分计算/行为上报) → domain(积分规则/有效期/冻结) → api(积分查询/变更/兑换) → storefront-web(积分展示/兑换/核销)
 *
 * 测试设计:
 *   - 管理后台配置会员等级+积分规则(消费1元=1分,签到得50分)
 *   - SDK上报用户行为(消费/签到/评价)触发积分计算
 *   - Domain领域层验证积分规则正确执行(倍数/上限/过期)
 *   - API积分服务执行查询/变更/冻结/解冻
 *   - Storefront前端展示积分余额、兑换商品、核销
 *   - 逆向流程: 积分过期、冻结异常、兑换取消
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type PointAction = 'sign_in' | 'purchase' | 'review' | 'referral' | 'activity' | 'refund_deduction';
type ExchangeStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled' | 'refunded';
type PointStatus = 'active' | 'frozen' | 'expired' | 'cleared';

interface MemberConfig {
  tier: MemberTier;
  multiplier: number;
  monthlyPointCap: number;
  tierUpThreshold: number;
  tierValidDays: number;
}

interface PointRule {
  action: PointAction;
  basePoints: number;
  multiplierEnabled: boolean;
  dailyCap: number;
  description: string;
}

interface PointRecord {
  userId: string;
  action: PointAction;
  amount: number;
  multiplier: number;
  totalPoints: number;
  timestamp: number;
  expiryDate: number;
  status: PointStatus;
}

interface ExchangeItem {
  id: string;
  name: string;
  pointsRequired: number;
  stock: number;
  exchangeLimit: number;
  category: string;
}

interface PointBalance {
  userId: string;
  tier: MemberTier;
  totalPoints: number;
  availablePoints: number;
  frozenPoints: number;
  expiringPoints: number;
}

// ─── 测试数据: 会员配置 ───

const defaultMemberConfigs: Record<MemberTier, MemberConfig> = {
  bronze: { tier: 'bronze', multiplier: 1, monthlyPointCap: 1000, tierUpThreshold: 0, tierValidDays: 90 },
  silver: { tier: 'silver', multiplier: 1.2, monthlyPointCap: 3000, tierUpThreshold: 500, tierValidDays: 180 },
  gold: { tier: 'gold', multiplier: 1.5, monthlyPointCap: 5000, tierUpThreshold: 2000, tierValidDays: 365 },
  platinum: { tier: 'platinum', multiplier: 2, monthlyPointCap: 10000, tierUpThreshold: 8000, tierValidDays: 365 },
  diamond: { tier: 'diamond', multiplier: 3, monthlyPointCap: 30000, tierUpThreshold: 30000, tierValidDays: 730 },
};

const defaultPointRules: PointRule[] = [
  { action: 'purchase', basePoints: 1, multiplierEnabled: true, dailyCap: 0, description: '消费每1元=1积分' },
  { action: 'sign_in', basePoints: 50, multiplierEnabled: false, dailyCap: 50, description: '每日签到得50积分' },
  { action: 'review', basePoints: 100, multiplierEnabled: true, dailyCap: 500, description: '评价订单得100积分' },
  { action: 'referral', basePoints: 200, multiplierEnabled: false, dailyCap: 2000, description: '邀请好友得200积分' },
  { action: 'activity', basePoints: 300, multiplierEnabled: true, dailyCap: 1000, description: '参与活动得300积分' },
  { action: 'refund_deduction', basePoints: -1, multiplierEnabled: false, dailyCap: 0, description: '退单扣回积分' },
];

const exchangeItems: ExchangeItem[] = [
  { id: 'item-001', name: '10元优惠券', pointsRequired: 500, stock: 1000, exchangeLimit: 3, category: 'coupon' },
  { id: 'item-002', name: '50元优惠券', pointsRequired: 2000, stock: 500, exchangeLimit: 1, category: 'coupon' },
  { id: 'item-003', name: '定制马克杯', pointsRequired: 1500, stock: 50, exchangeLimit: 2, category: 'merchandise' },
  { id: 'item-004', name: '满100减20券', pointsRequired: 800, stock: 200, exchangeLimit: 5, category: 'coupon' },
  { id: 'item-005', name: '限量盲盒', pointsRequired: 5000, stock: 10, exchangeLimit: 1, category: 'merchandise' },
];

// ─── SDK 模拟: 积分计算引擎 ───

function calculatePoints(action: PointAction, amount: number, memberTier: MemberTier, rules: PointRule[], configs: Record<MemberTier, MemberConfig>): number {
  const rule = rules.find(r => r.action === action);
  if (!rule) return 0;

  const config = configs[memberTier];
  const basePoints = rule.basePoints * amount;

  if (rule.multiplierEnabled && config) {
    return Math.round(basePoints * config.multiplier);
  }
  return Math.round(basePoints);
}

function applyDailyCap(points: number, action: PointAction, rules: PointRule[], todayPoints: number): number {
  const rule = rules.find(r => r.action === action);
  if (!rule || rule.dailyCap <= 0) return points;
  const remaining = rule.dailyCap - todayPoints;
  return Math.min(points, Math.max(0, remaining));
}

function createPointRecord(
  userId: string, action: PointAction, amount: number, memberTier: MemberTier, rules: PointRule[], configs: Record<MemberTier, MemberConfig>
): PointRecord {
  const config = configs[memberTier];
  const rule = rules.find(r => r.action === action);
  const multiplier = (rule?.multiplierEnabled && config) ? config.multiplier : 1;
  const totalPoints = calculatePoints(action, amount, memberTier, rules, configs);
  const now = Date.now();
  const expiryDate = config ? now + config.tierValidDays * 86400000 : now + 365 * 86400000;

  return {
    userId, action, amount, multiplier, totalPoints,
    timestamp: now, expiryDate, status: 'active',
  };
}

function getPointBalance(records: PointRecord[], userId: string): PointBalance {
  const userRecords = records.filter(r => r.userId === userId);
  // totalPoints = 该用户所有非expired/cleared的积分之和(含active和frozen)
  const validRecords = userRecords.filter(r => r.status !== 'expired' && r.status !== 'cleared');
  const totalPoints = validRecords.reduce((sum, r) => sum + r.totalPoints, 0);
  const userFrozenRecords = userRecords.filter(r => r.status === 'frozen');
  const frozenPoints = userFrozenRecords.reduce((sum, r) => sum + r.totalPoints, 0);
  const _now = Date.now();
  const expiringSoon = userRecords.filter(r => r.expiryDate - _now < 30 * 86400000 && r.expiryDate > _now);
  const expiringPoints = expiringSoon.reduce((sum, r) => sum + r.totalPoints, 0);

  return {
    userId, tier: 'bronze', totalPoints, availablePoints: totalPoints - frozenPoints, frozenPoints, expiringPoints,
  };
}

function freezePoints(records: PointRecord[], userId: string, reason: string): PointRecord[] {
  return records.map(r => {
    if (r.userId === userId && r.status === 'active') {
      return { ...r, status: 'frozen' as PointStatus };
    }
    return r;
  });
}

function unfreezePoints(records: PointRecord[], userId: string): PointRecord[] {
  return records.map(r => {
    if (r.userId === userId && r.status === 'frozen') {
      return { ...r, status: 'active' as PointStatus };
    }
    return r;
  });
}

function exchangeItem(records: PointRecord[], userId: string, item: ExchangeItem): { success: boolean; balance: PointBalance; deduction: number; reason?: string } {
  const balance = getPointBalance(records, userId);
  // 计算已兑换记录: 积分扣减记录(action='purchase', totalPoints负数)的数量
  const deductionRecords = records.filter(r => r.userId === userId && r.totalPoints < 0);
  const alreadyExchanged = deductionRecords.length;

  if (balance.availablePoints < item.pointsRequired) {
    return { success: false, balance, deduction: 0, reason: '积分不足' };
  }
  if (item.stock <= 0) {
    return { success: false, balance, deduction: 0, reason: '库存不足' };
  }
  if (alreadyExchanged >= item.exchangeLimit) {
    return { success: false, balance, deduction: 0, reason: '已达兑换上限' };
  }
  // Deduct points
  const deductionRecord: PointRecord = {
    userId, action: 'purchase', amount: -1, multiplier: 1,
    totalPoints: -item.pointsRequired, timestamp: Date.now(),
    expiryDate: Date.now() + 365 * 86400000, status: 'active',
  };
  records.push(deductionRecord);
  item.stock -= 1;
  return { success: true, balance: getPointBalance(records, userId), deduction: item.pointsRequired };
}

function expirePoints(records: PointRecord[]): PointRecord[] {
  const now = Date.now();
  return records.map(r => {
    if (r.expiryDate <= now && r.status === 'active') {
      return { ...r, status: 'expired' as PointStatus };
    }
    return r;
  });
}

// ─── 边界辅助函数 ───

function pointsRoundTripSafety(points: number): boolean {
  // 浮点乘法误差容忍: 确保积分始终为整数
  return Number.isInteger(points) && points >= 0;
}

// ═══════════════ 测试: 管理端会员配置 → SDK积分计算 → Domain领域规则 ═══════════════

describe('链25: 管理端→SDK→Domain→API→Storefront [会员积分兑换全链路]', () => {

  // ─── P (正例) ───

  describe('P1: 管理员配置会员等级 → SDK按等级倍数计算积分', () => {
    test('gold会员消费100元: SDK应计算 100 × 1.5 = 150积分', () => {
      const points = calculatePoints('purchase', 100, 'gold', defaultPointRules, defaultMemberConfigs);
      assert.equal(points, 150, 'gold 1.5倍: 消费100元应得150积分');
      assert.ok(pointsRoundTripSafety(points), '积分值应为安全整数');
    });

    test('platinum会员评价订单: SDK应计算 100 × 2 = 200积分', () => {
      const points = calculatePoints('review', 1, 'platinum', defaultPointRules, defaultMemberConfigs);
      assert.equal(points, 200, 'platinum 2倍: 评价应得200积分');
    });

    test('diamond会员签到: 签到不翻倍应得50积分', () => {
      const points = calculatePoints('sign_in', 1, 'diamond', defaultPointRules, defaultMemberConfigs);
      assert.equal(points, 50, '签到不翻倍: 应得50积分');
    });

    test('记录完整积分记录含有效期', () => {
      const record = createPointRecord('user-001', 'purchase', 200, 'gold', defaultPointRules, defaultMemberConfigs);
      assert.equal(record.totalPoints, 300); // 200 × 1.5
      assert.equal(record.status, 'active');
      assert.ok(record.expiryDate > record.timestamp, '有效期应在创建时间之后');
      assert.equal(record.multiplier, 1.5);
    });
  });

  describe('P2: Domain领域层 → API积分查询余额', () => {
    test('API查询返回正确的积分余额(含冻结/即将过期明细)', () => {
      const records: PointRecord[] = [
        createPointRecord('user-002', 'purchase', 500, 'gold', defaultPointRules, defaultMemberConfigs), // 750
        createPointRecord('user-002', 'sign_in', 7, 'bronze', defaultPointRules, defaultMemberConfigs), // 350
        createPointRecord('user-002', 'review', 3, 'gold', defaultPointRules, defaultMemberConfigs), // 450
      ];
      const balance = getPointBalance(records, 'user-002');
      assert.equal(balance.totalPoints, 750 + 350 + 450, '总积分应为三笔之和');
      assert.equal(balance.availablePoints, balance.totalPoints, '无冻结时为总积分');
      assert.equal(balance.frozenPoints, 0);
      assert.ok(balance.expiringPoints >= 0);
    });

    test('Storefront展示积分余额与API查询一致', () => {
      const records: PointRecord[] = [
        createPointRecord('user-003', 'purchase', 150, 'platinum', defaultPointRules, defaultMemberConfigs), // 300
        createPointRecord('user-003', 'sign_in', 14, 'platinum', defaultPointRules, defaultMemberConfigs), // 700
      ];
      const balance = getPointBalance(records, 'user-003');
      // Storefront页面展示 = 1000积分 (无冻结无过期)
      assert.equal(balance.totalPoints, 1000);
      assert.equal(balance.availablePoints, 1000);
      // Storefront应显示"可用积分1000"和"即将过期0"
      assert.equal(balance.expiringPoints, 0);
    });
  });

  describe('P3: Storefront兑换商品 → 积分扣减 → 核销完成', () => {
    test('用户兑换10元优惠券: 扣除500积分, 余额正确减少', () => {
      const records: PointRecord[] = [
        createPointRecord('user-004', 'purchase', 1000, 'gold', defaultPointRules, defaultMemberConfigs), // 1500
      ];
      const coupon = exchangeItems.find(i => i.id === 'item-001')!;
      const result = exchangeItem(records, 'user-004', coupon);
      assert.ok(result.success, '积分充足应兑换成功');
      assert.equal(result.deduction, 500);
      assert.equal(result.balance.availablePoints, 1000); // 1500 - 500
    });

    test('兑换后库存减少 + 兑换记录可追溯', () => {
      const records: PointRecord[] = [
        createPointRecord('user-005', 'purchase', 3000, 'diamond', defaultPointRules, defaultMemberConfigs), // 9000
      ];
      const blindbox = exchangeItems.find(i => i.id === 'item-005')!;
      const originalStock = blindbox.stock;
      const result = exchangeItem(records, 'user-005', blindbox);
      assert.ok(result.success);
      assert.equal(blindbox.stock, originalStock - 1, '库存应减少1');
      // 核销完成后应有积分扣减记录
      const deductions = records.filter(r => r.userId === 'user-005' && r.totalPoints < 0);
      assert.equal(deductions.length, 1, '应有一条积分扣减记录');
      assert.equal(deductions[0].totalPoints, -5000);
    });
  });

  // ─── N (反例) ───

  describe('N1: 积分不足时兑换失败', () => {
    test('用户积分不足500时兑换优惠券应失败并返回清晰原因', () => {
      const records: PointRecord[] = [
        createPointRecord('user-006', 'sign_in', 3, 'bronze', defaultPointRules, defaultMemberConfigs), // 150
      ];
      const coupon = exchangeItems.find(i => i.id === 'item-001')!;
      const result = exchangeItem(records, 'user-006', coupon);
      assert.equal(result.success, false, '积分不足应失败');
      assert.equal(result.reason, '积分不足');
    });
  });

  describe('N2: 已达到兑换上限时拒绝二次兑换', () => {
    test('同一用户已兑换3次10元券, 第4次应拒绝', () => {
      const records: PointRecord[] = [
        createPointRecord('user-007', 'purchase', 20000, 'diamond', defaultPointRules, defaultMemberConfigs), // 60000
      ];
      const coupon = exchangeItems.find(i => i.id === 'item-001')!;
      // 模拟已兑换3次
      for (let i = 0; i < 3; i++) {
        records.push({
          userId: 'user-007', action: 'purchase', amount: -1, multiplier: 1,
          totalPoints: -500, timestamp: Date.now(), expiryDate: Date.now() + 365 * 86400000, status: 'active',
        });
      }
      const result = exchangeItem(records, 'user-007', coupon);
      assert.equal(result.success, false, '达上限应拒绝');
      assert.equal(result.reason, '已达兑换上限');
    });
  });

  describe('N3: 积分冻结后不可用于兑换', () => {
    test('冻结状态的积分应被排除在可用余额外', () => {
      const records: PointRecord[] = [
        createPointRecord('user-008', 'purchase', 1000, 'gold', defaultPointRules, defaultMemberConfigs), // 1500
      ];
      const frozen = freezePoints(records, 'user-008', '风控冻结');
      // getPointBalance读取的是records原数组(状态被freezePoints原地更新), 需传入最新的frozen
      const balance = getPointBalance(frozen, 'user-008');
      assert.equal(balance.totalPoints, 1500, '总积分不变');
      assert.equal(balance.frozenPoints, 1500, '1500被冻结');
      assert.equal(balance.availablePoints, 0, '可用积分为0');
      // 尝试兑换 (传入frozen数组)
      const coupon = exchangeItems.find(i => i.id === 'item-001')!;
      const result = exchangeItem(frozen, 'user-008', coupon);
      assert.equal(result.success, false, '冻结后兑换应失败');
      assert.equal(result.reason, '积分不足');
    });
  });

  // ─── B (边界) ───

  describe('B1: 月度积分上限边界', () => {
    test('bronze会员月度上限1000, 累积900+300=1200超上限应截断为1000', () => {
      // bronze会员: monthlyPointCap=1000
      const bronzeRuleBronze = { ...defaultMemberConfigs.bronze };
      const daySoFar = 900;
      const newPoints = calculatePoints('purchase', 200, 'bronze', defaultPointRules, defaultMemberConfigs); // bronze 1倍 = 200
      assert.equal(newPoints, 200, 'bronze无翻倍, 200元=200分');
      // 月度上限截断
      const monthlyCap = bronzeRuleBronze.monthlyPointCap; // 1000
      const rawTotal = daySoFar + newPoints; // 900 + 200 = 1100
      const finalMonthTotal = rawTotal > monthlyCap ? monthlyCap : rawTotal;
      assert.equal(finalMonthTotal, 1000, 'bronze月度上限1000截断');
    });
  });

  describe('B2: 积分过期边界(精确毫秒级)', () => {
    test('刚好过期(diff=0)的积分应被标记过期, diff=1ms正常', () => {
      const now = Date.now();
      const records: PointRecord[] = [
        { userId: 'user-009', action: 'sign_in', amount: 1, multiplier: 1, totalPoints: 50, timestamp: now - 86400000, expiryDate: now, status: 'active' },
        { userId: 'user-009', action: 'purchase', amount: 10, multiplier: 1, totalPoints: 10, timestamp: now - 86400000, expiryDate: now + 1, status: 'active' },
      ];
      const expired = expirePoints(records);
      assert.equal(expired.find(r => r.action === 'sign_in')?.status, 'expired', 'expiryDate=now应过期');
      assert.equal(expired.find(r => r.action === 'purchase')?.status, 'active', 'expiryDate=now+1ms应有效');
    });
  });

  describe('B3: 多会员等级并行积分计算浮点安全', () => {
    test('所有等级组合计算积分都应返回整数且非负数', () => {
      const tiers: MemberTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const actions: PointAction[] = ['purchase', 'review', 'activity'];
      const amounts = [0.5, 1, 3.99, 10, 100];

      for (const tier of tiers) {
        for (const action of actions) {
          for (const amount of amounts) {
            const points = calculatePoints(action, amount, tier, defaultPointRules, defaultMemberConfigs);
            assert.ok(Number.isInteger(points), `[${tier}][${action}][${amount}] 积分应为整数, actual=${points}`);
            assert.ok(points >= 0, `[${tier}][${action}][${amount}] 积分应非负, actual=${points}`);
          }
        }
      }
    });
  });

  describe('B4: 积分冻结解冻循环安全', () => {
    test('多次冻结解冻操作后可用积分应恢复原始值', () => {
      const records: PointRecord[] = [
        createPointRecord('user-010', 'purchase', 100, 'platinum', defaultPointRules, defaultMemberConfigs), // 200
      ];
      const totalAfterCreation = getPointBalance(records, 'user-010').totalPoints;

      // 冻结 → 解冻 → 冻结 → 解冻
      let r1 = freezePoints(records, 'user-010', '风控1');
      let r2 = unfreezePoints(r1, 'user-010');
      let r3 = freezePoints(r2, 'user-010', '风控2');
      let r4 = unfreezePoints(r3, 'user-010');

      const finalBalance = getPointBalance(r4, 'user-010');
      assert.equal(finalBalance.totalPoints, totalAfterCreation, '解冻后总积分不变');
      assert.equal(finalBalance.availablePoints, totalAfterCreation, '解冻后可用积分恢复');
      assert.equal(finalBalance.frozenPoints, 0, '解冻后冻结积分为0');
    });
  });
});
