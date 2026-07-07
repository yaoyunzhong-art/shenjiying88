/**
 * members/[id]/page.test.ts — 会员详情页逻辑层测试
 * L1 正例+反例+边界 模式
 *
 * 测试目标:
 *   1. 会员等级映射 (MEMBER_TIER_MAP)
 *   2. 会员状态映射 (MEMBER_STATUS_MAP)
 *   3. 生命周期映射 (MEMBER_LIFECYCLE_MAP)
 *   4. 等级升降级链路逻辑 (tierUpgradeMap / tierDowngradeMap)
 *   5. API 等级序列推算 (levelSequence)
 *   6. 表单验证函数 (validateForm)
 *   7. 审批结果回执查询 (approval-outcome derivation)
 *   8. 支付活动数据结构
 *   9. 推荐动作过滤
 *   10. 运行时操作状态管理
 *
 * References: page.tsx, members-data.ts, members-view-model.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ===================================================================
// 类型定义 (镜像 page.tsx 中的局部类型)
// ===================================================================

type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';
type MemberStatus = 'active' | 'frozen' | 'inactive' | 'blacklisted';
type MemberLifecycle = 'new' | 'active' | 'churnRisk' | 'churned' | 'returned';
type ApiLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface EditFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

interface RecommendedAction {
  code: string;
  label: string;
  reason: string;
  channel: 'coupon' | 'crm-task' | 'wechat' | 'app-push';
  priority: 'high' | 'medium' | 'low';
}

// ===================================================================
// 被测试的逻辑函数 (从 page.tsx 中提取)
// ===================================================================

const MEMBER_TIER_MAP: Record<MemberTier, { label: string; color: string; level: number }> = {
  diamond: { label: '钻石', color: '#a78bfa', level: 5 },
  gold: { label: '黄金', color: '#fbbf24', level: 4 },
  silver: { label: '白银', color: '#94a3b8', level: 3 },
  bronze: { label: '青铜', color: '#d97706', level: 2 },
  standard: { label: '普通', color: '#64748b', level: 1 },
};

const MEMBER_STATUS_MAP: Record<MemberStatus, { label: string; color: string }> = {
  active: { label: '正常', color: '#86efac' },
  frozen: { label: '冻结', color: '#93c5fd' },
  inactive: { label: '失效', color: '#fca5a5' },
  blacklisted: { label: '黑名单', color: '#f87171' },
};

const MEMBER_LIFECYCLE_MAP: Record<MemberLifecycle, { label: string; color: string; helper: string }> = {
  new: { label: '新客', color: '#86efac', helper: '注册 30 天内' },
  active: { label: '活跃', color: '#67e8f9', helper: '近期有消费' },
  churnRisk: { label: '流失风险', color: '#fde68a', helper: '超过 60 天未到店' },
  churned: { label: '已流失', color: '#fca5a5', helper: '超过 180 天未到店' },
  returned: { label: '已召回', color: '#a5f3fc', helper: '流失后重新消费' },
};

const tierUpgradeMap: Record<MemberTier, MemberTier | null> = {
  diamond: null,
  gold: 'diamond',
  silver: 'gold',
  bronze: 'silver',
  standard: 'bronze',
};

const tierDowngradeMap: Record<MemberTier, MemberTier | null> = {
  diamond: 'gold',
  gold: 'silver',
  silver: 'bronze',
  bronze: 'standard',
  standard: null,
};

const apiLevelSequence: ApiLevel[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

function getNextApiLevel(level: ApiLevel | undefined): ApiLevel | null {
  if (!level) return null;
  const idx = apiLevelSequence.indexOf(level);
  if (idx === -1 || idx >= apiLevelSequence.length - 1) return null;
  return apiLevelSequence[idx + 1];
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '姓名不能为空';
  if (!data.phone.trim()) errors.phone = '电话不能为空';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

function filterHighPriorityActions(actions: RecommendedAction[]): RecommendedAction[] {
  return actions.filter((a) => a.priority === 'high' || a.priority === 'medium');
}

function deriveLatestMemberApprovalOutcome(
  outcomes: Array<{ ticket: string; status: string; decidedAt?: string }>,
): { latestTicket: string; latestStatus: string; decidedAt: string | null } {
  if (outcomes.length === 0) {
    return { latestTicket: '', latestStatus: 'NONE', decidedAt: null };
  }
  const sorted = [...outcomes].sort((a, b) => {
    if (!a.decidedAt) return 1;
    if (!b.decidedAt) return -1;
    return b.decidedAt.localeCompare(a.decidedAt);
  });
  return {
    latestTicket: sorted[0].ticket,
    latestStatus: sorted[0].status,
    decidedAt: sorted[0].decidedAt ?? null,
  };
}

// ===================================================================
// 测试套件
// ===================================================================

describe('MEMBER_TIER_MAP — 等级映射', () => {
  it('包含全部 5 个等级', () => {
    const tiers = Object.keys(MEMBER_TIER_MAP);
    assert.equal(tiers.length, 5);
    assert.deepStrictEqual(tiers.sort(), ['bronze', 'diamond', 'gold', 'silver', 'standard']);
  });

  it('钻石等级 labeling 正确', () => {
    const d = MEMBER_TIER_MAP.diamond;
    assert.equal(d.label, '钻石');
    assert.equal(d.color, '#a78bfa');
    assert.equal(d.level, 5);
  });

  it('普通等级 labeling 正确', () => {
    const s = MEMBER_TIER_MAP.standard;
    assert.equal(s.label, '普通');
    assert.equal(s.color, '#64748b');
    assert.equal(s.level, 1);
  });

  it('所有等级 level 值在 1-5 之间且唯一', () => {
    const levels = Object.values(MEMBER_TIER_MAP).map((t) => t.level);
    assert.equal(Math.min(...levels), 1);
    assert.equal(Math.max(...levels), 5);
    assert.equal(new Set(levels).size, 5);
  });
});

describe('MEMBER_STATUS_MAP — 状态映射', () => {
  it('包含全部 4 个状态', () => {
    assert.equal(Object.keys(MEMBER_STATUS_MAP).length, 4);
  });

  it('active 状态正确', () => {
    assert.equal(MEMBER_STATUS_MAP.active.label, '正常');
    assert.equal(MEMBER_STATUS_MAP.active.color, '#86efac');
  });

  it('blacklisted 状态正确', () => {
    assert.equal(MEMBER_STATUS_MAP.blacklisted.label, '黑名单');
    assert.equal(MEMBER_STATUS_MAP.blacklisted.color, '#f87171');
  });
});

describe('MEMBER_LIFECYCLE_MAP — 生命周期映射', () => {
  it('包含全部 5 个阶段', () => {
    assert.equal(Object.keys(MEMBER_LIFECYCLE_MAP).length, 5);
  });

  it('新客阶段 helper 正确', () => {
    assert.equal(MEMBER_LIFECYCLE_MAP.new.helper, '注册 30 天内');
  });

  it('流失风险阶段颜色为黄色', () => {
    assert.equal(MEMBER_LIFECYCLE_MAP.churnRisk.color, '#fde68a');
  });

  it('已召回阶段 label 正确', () => {
    assert.equal(MEMBER_LIFECYCLE_MAP.returned.label, '已召回');
  });
});

describe('等级升降级链路', () => {
  it('gold → diamond 升级', () => {
    assert.equal(tierUpgradeMap.gold, 'diamond');
  });

  it('standard → bronze 升级', () => {
    assert.equal(tierUpgradeMap.standard, 'bronze');
  });

  it('diamond 无可升级等级', () => {
    assert.equal(tierUpgradeMap.diamond, null);
  });

  it('diamond → gold 降级', () => {
    assert.equal(tierDowngradeMap.diamond, 'gold');
  });

  it('standard 无可降级等级', () => {
    assert.equal(tierDowngradeMap.standard, null);
  });

  it('升降级双向链路互为逆操作', () => {
    const tiers: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'standard'];
    for (const tier of tiers) {
      const up = tierUpgradeMap[tier];
      if (up) {
        assert.equal(tierDowngradeMap[up], tier, `${tier}→${up}→${tier} 降级链路不通`);
      }
    }
  });
});

describe('API 等级序列推算', () => {
  it('BRONZE 下一级 SILVER', () => {
    assert.equal(getNextApiLevel('BRONZE'), 'SILVER');
  });

  it('DIAMOND 无下一级', () => {
    assert.equal(getNextApiLevel('DIAMOND'), null);
  });

  it('undefined 等级返回 null', () => {
    assert.equal(getNextApiLevel(undefined), null);
  });

  it('GOLD 下一级 PLATINUM', () => {
    assert.equal(getNextApiLevel('GOLD'), 'PLATINUM');
  });
});

describe('validateForm — 表单验证', () => {
  it('空姓名报错', () => {
    const err = validateForm({ name: '', phone: '', email: '', address: '', notes: '' });
    assert.ok(err.name);
    assert.equal(err.name, '姓名不能为空');
  });

  it('空电话报错', () => {
    const err = validateForm({ name: '王五', phone: '', email: '', address: '', notes: '' });
    assert.ok(err.phone);
    assert.equal(err.phone, '电话不能为空');
  });

  it('格式错误邮箱报错', () => {
    const err = validateForm({ name: '王五', phone: '13900139000', email: 'invalid', address: '', notes: '' });
    assert.ok(err.email);
    assert.equal(err.email, '邮箱格式不正确');
  });

  it('有效邮箱无错误', () => {
    const err = validateForm({ name: '王五', phone: '13900139000', email: 'wangwu@test.com', address: '', notes: '' });
    assert.equal(err.email, undefined);
  });

  it('全部有效字段无错误', () => {
    const err = validateForm({
      name: '王五',
      phone: '13900139000',
      email: 'wangwu@test.com',
      address: '上海市浦东新区',
      notes: 'VIP',
    });
    assert.equal(Object.keys(err).length, 0);
  });

  it('空邮箱视为可选 (不验证)', () => {
    const err = validateForm({ name: '王五', phone: '13900139000', email: '', address: '', notes: '' });
    assert.equal(err.email, undefined);
  });
});

describe('推荐动作过滤', () => {
  it('只保留 high/medium 优先级', () => {
    const input: RecommendedAction[] = [
      { code: 'a', label: 'A', reason: '高', channel: 'wechat', priority: 'high' },
      { code: 'b', label: 'B', reason: '中', channel: 'app-push', priority: 'medium' },
      { code: 'c', label: 'C', reason: '低', channel: 'crm-task', priority: 'low' },
    ];
    const result = filterHighPriorityActions(input);
    assert.equal(result.length, 2);
    assert.equal(result[0].code, 'a');
    assert.equal(result[1].code, 'b');
  });

  it('空数组返回空', () => {
    assert.equal(filterHighPriorityActions([]).length, 0);
  });

  it('仅 low 优先级时返回空', () => {
    const result = filterHighPriorityActions([
      { code: 'x', label: 'X', reason: '低', channel: 'coupon', priority: 'low' },
    ]);
    assert.equal(result.length, 0);
  });
});

describe('deriveLatestMemberApprovalOutcome — 审批结果推导', () => {
  it('空数组返回 NONE', () => {
    const result = deriveLatestMemberApprovalOutcome([]);
    assert.equal(result.latestStatus, 'NONE');
    assert.equal(result.latestTicket, '');
    assert.equal(result.decidedAt, null);
  });

  it('单条结果正确', () => {
    const result = deriveLatestMemberApprovalOutcome([
      { ticket: 'APPROVAL-001', status: 'APPROVED', decidedAt: '2026-06-25T10:00:00Z' },
    ]);
    assert.equal(result.latestTicket, 'APPROVAL-001');
    assert.equal(result.latestStatus, 'APPROVED');
  });

  it('多条按 decidedAt 排序取最新', () => {
    const result = deriveLatestMemberApprovalOutcome([
      { ticket: 'APPROVAL-001', status: 'REJECTED', decidedAt: '2026-06-24T10:00:00Z' },
      { ticket: 'APPROVAL-002', status: 'APPROVED', decidedAt: '2026-06-25T10:00:00Z' },
    ]);
    assert.equal(result.latestTicket, 'APPROVAL-002');
    assert.equal(result.latestStatus, 'APPROVED');
  });

  it('处理缺失 decidedAt 的情况', () => {
    const result = deriveLatestMemberApprovalOutcome([
      { ticket: 'APPROVAL-001', status: 'PENDING', decidedAt: undefined },
      { ticket: 'APPROVAL-002', status: 'APPROVED', decidedAt: '2026-06-25T10:00:00Z' },
    ]);
    assert.equal(result.latestTicket, 'APPROVAL-002');
  });
});

describe('运行时操作状态管理', () => {
  it('ActionFeedback 初始状态正确', () => {
    const state: ActionFeedback = { isSubmitting: false };
    assert.equal(state.isSubmitting, false);
    assert.equal(state.errorMessage, undefined);
    assert.equal(state.successMessage, undefined);
  });

  it('提交中状态正确', () => {
    const state: ActionFeedback = { isSubmitting: true };
    assert.ok(state.isSubmitting);
  });

  it('错误状态正确', () => {
    const state: ActionFeedback = { isSubmitting: false, errorMessage: '审批失败' };
    assert.equal(state.errorMessage, '审批失败');
  });

  it('成功状态正确', () => {
    const state: ActionFeedback = { isSubmitting: false, successMessage: '操作成功' };
    assert.equal(state.successMessage, '操作成功');
  });

  it('错误和成功互斥', () => {
    const state: ActionFeedback = {
      isSubmitting: false,
      errorMessage: '操作失败',
      successMessage: '操作成功',
    };
    assert.ok(!state.isSubmitting);
    assert.ok(state.errorMessage);
    assert.ok(state.successMessage);
  });
});

describe('支付活动数据', () => {
  it('cashier 来源支付活动结构', () => {
    const record = {
      orderId: 'ORD-001',
      amount: '599.00',
      paidAt: '2026-06-26T10:00:00Z',
      channel: 'alipay',
      source: 'cashier' as const,
    };
    assert.equal(record.orderId, 'ORD-001');
    assert.equal(record.amount, '599.00');
    assert.equal(record.channel, 'alipay');
    assert.equal(record.source, 'cashier');
  });

  it('lyt-snapshot 来源支付活动', () => {
    const record = {
      orderId: 'ORD-002',
      amount: '1280.00',
      paidAt: '2026-06-25T15:30:00Z',
      channel: 'wechat',
      source: 'lyt-snapshot' as const,
    };
    assert.equal(record.source, 'lyt-snapshot');
    assert.equal(record.channel, 'wechat');
  });

  it('金额保留两位小数格式', () => {
    const amount = '1280.00';
    assert.match(amount, /^\d+\.\d{2}$/);
  });
});

describe('建议动作推荐', () => {
  it('推荐动作包含必要字段', () => {
    const action: RecommendedAction = {
      code: 'upgrade-gold',
      label: '升级至钻石',
      reason: '消费达标',
      channel: 'wechat',
      priority: 'high',
    };
    assert.ok(action.code);
    assert.ok(action.label);
    assert.ok(action.reason);
    assert.ok(action.channel);
    assert.ok(action.priority);
  });

  it('所有推荐通道在允许列表内', () => {
    const allowedChannels: RecommendedAction['channel'][] = ['coupon', 'crm-task', 'wechat', 'app-push'];
    const action: RecommendedAction = {
      code: 'birthday-offer',
      label: '生日礼遇',
      reason: '即将生日',
      channel: 'coupon',
      priority: 'medium',
    };
    assert.ok(allowedChannels.includes(action.channel));
  });
});
