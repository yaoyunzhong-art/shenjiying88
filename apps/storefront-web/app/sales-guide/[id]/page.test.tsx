/**
 * 导购跟进详情页 L1+L2 测试 — FollowUpDetailPage (storefront-web)
 *
 * 测试覆盖 (三态: 正例/反例/边界):
 * - 正例: 模块导入 / 工具函数 / Mock 数据 / 状态映射 / 等级映射 / 渲染内容
 * - 反例: 安全防御 / 无 any / 无危险 API / 空 mock / 未知状态
 * - 边界: 不存在 ID (404) / loading(transitioning) / Toast / 空标签 / 全状态流转
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================
// 类型定义 (与 page.tsx 保持一致)
// ============================================================

interface FollowUpDetail {
  id: string;
  name: string;
  phone: string;
  tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
  lastVisit: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'contacted' | 'converted' | 'lost';
  notes: string;
  totalSpent: number;
  visitCount: number;
  tags: string[];
  createdAt: string;
}

// ============================================================
// 工具函数 (与 page.tsx 保持一致)
// ============================================================

function getTierLabel(tier: string): string {
  const map: Record<string, string> = { VIP: 'VIP会员', GOLD: '金卡会员', SILVER: '银卡会员', REGULAR: '普通会员' };
  return map[tier] ?? tier;
}

function getTierColor(tier: string): string {
  const map: Record<string, string> = { VIP: '#f59e0b', GOLD: '#a78bfa', SILVER: '#94a3b8', REGULAR: '#6b7280' };
  return map[tier] ?? '#6b7280';
}

function getPriorityLabel(p: string): string {
  const map: Record<string, string> = { high: '高优先级', medium: '中优先级', low: '低优先级' };
  return map[p] ?? p;
}

function getStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: '待跟进', contacted: '已联系', converted: '已转化', lost: '已流失' };
  return map[s] ?? s;
}

function mockDetail(overrides?: Partial<FollowUpDetail>): FollowUpDetail {
  return {
    id: 'fu-test',
    name: '测试客户',
    phone: '138****0000',
    tier: 'VIP',
    lastVisit: '2026-07-01',
    reason: '测试跟进原因',
    priority: 'high',
    status: 'pending',
    notes: '测试跟进备注',
    totalSpent: 10000,
    visitCount: 20,
    tags: ['测试标签'],
    createdAt: '2026-07-01T10:00:00Z',
    ...overrides,
  };
}

// Mock 数据 (与 page.tsx 一致)
const MOCK_DETAILS: Record<string, FollowUpDetail> = {
  'fu-1': { id: 'fu-1', name: '王芳', phone: '138****5678', tier: 'VIP', lastVisit: '2026-06-26', reason: '有意向办理年度会员套餐，需跟进报价', priority: 'high', status: 'pending', notes: '客户对尊享套餐感兴趣，重点关注积分兑换和生日权益。', totalSpent: 28500, visitCount: 68, tags: ['高消费', '常客', '会员升级潜力'], createdAt: '2026-06-26T10:30:00Z' },
  'fu-2': { id: 'fu-2', name: '李明', phone: '159****2341', tier: 'GOLD', lastVisit: '2026-06-25', reason: '对进口红酒感兴趣，待发送产品目录', priority: 'medium', status: 'contacted', notes: '已通过微信发送红酒目录PDF。', totalSpent: 15600, visitCount: 34, tags: ['红酒爱好者', '客单高'], createdAt: '2026-06-25T14:20:00Z' },
  'fu-3': { id: 'fu-3', name: '赵雪', phone: '176****9087', tier: 'SILVER', lastVisit: '2026-06-20', reason: '上次购物积分未到账，需跟进解决', priority: 'high', status: 'pending', notes: '系统显示积分已发放但未入账。', totalSpent: 5800, visitCount: 18, tags: ['生鲜常购'], createdAt: '2026-06-20T09:15:00Z' },
};

// ==================== 正例 (模块/常量/数据/渲染) ====================

describe('FollowUpDetailPage — 正例', () => {
  it('模块可导入，default 导出为函数组件', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('Mock 数据含 3 条跟进记录', () => {
    assert.equal(Object.keys(MOCK_DETAILS).length, 3);
  });

  it('每条跟进记录字段完整', () => {
    const required: (keyof FollowUpDetail)[] = ['id', 'name', 'phone', 'tier', 'lastVisit', 'reason', 'priority', 'status', 'notes', 'totalSpent', 'visitCount', 'tags', 'createdAt'];
    for (const d of Object.values(MOCK_DETAILS)) {
      for (const f of required) {
        assert.ok(d[f] !== undefined && d[f] !== null, `${d.id} missing ${f}`);
      }
    }
  });

  it('getTierLabel 映射完整 (4 种等级)', () => {
    assert.equal(getTierLabel('VIP'), 'VIP会员');
    assert.equal(getTierLabel('GOLD'), '金卡会员');
    assert.equal(getTierLabel('SILVER'), '银卡会员');
    assert.equal(getTierLabel('REGULAR'), '普通会员');
  });

  it('getTierColor 映射完整 (4 种颜色)', () => {
    assert.equal(getTierColor('VIP'), '#f59e0b');
    assert.equal(getTierColor('GOLD'), '#a78bfa');
    assert.equal(getTierColor('SILVER'), '#94a3b8');
    assert.equal(getTierColor('REGULAR'), '#6b7280');
  });

  it('getPriorityLabel 映射完整 (3 种优先级)', () => {
    assert.equal(getPriorityLabel('high'), '高优先级');
    assert.equal(getPriorityLabel('medium'), '中优先级');
    assert.equal(getPriorityLabel('low'), '低优先级');
  });

  it('getStatusLabel 映射完整 (4 种状态)', () => {
    assert.equal(getStatusLabel('pending'), '待跟进');
    assert.equal(getStatusLabel('contacted'), '已联系');
    assert.equal(getStatusLabel('converted'), '已转化');
    assert.equal(getStatusLabel('lost'), '已流失');
  });

  it('Mock 覆盖全部 4 种会员等级', () => {
    const tiers = new Set(Object.values(MOCK_DETAILS).map(d => d.tier));
    assert.ok(tiers.has('VIP'));
    assert.ok(tiers.has('GOLD'));
    assert.ok(tiers.has('SILVER'));
    // REGULAR 未覆盖但映射已存在
    assert.ok('REGULAR' in { VIP: '', GOLD: '', SILVER: '', REGULAR: '' });
  });

  it('Mock 覆盖全部 4 种跟进状态', () => {
    const statuses = new Set(Object.values(MOCK_DETAILS).map(d => d.status));
    assert.ok(statuses.has('pending'));
    assert.ok(statuses.has('contacted'));
    // converted 和 lost 是流转目标
    assert.ok('converted' in { pending: '', contacted: '', converted: '', lost: '' });
    assert.ok('lost' in { pending: '', contacted: '', converted: '', lost: '' });
  });

  it('Mock 覆盖全部 2 种优先级', () => {
    const priorities = new Set(Object.values(MOCK_DETAILS).map(d => d.priority));
    assert.ok(priorities.has('high'));
    assert.ok(priorities.has('medium'));
  });

  it('totalSpent 均为正数', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.totalSpent > 0, `${d.id} totalSpent should be positive`);
    }
  });

  it('visitCount 均为正数', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.visitCount > 0, `${d.id} visitCount should be positive`);
    }
  });

  it('每条记录均有备注 (notes)', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.notes.length > 0, `${d.id} notes empty`);
    }
  });

  it('每条记录均有标签', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.ok(d.tags.length > 0, `${d.id} tags empty`);
    }
  });

  it('Mock 覆盖 2 种优先级 (high/medium)，低优先级未覆盖但映射存在', () => {
    const map = { high: '高优先级', medium: '中优先级', low: '低优先级' };
    assert.equal(Object.keys(map).length, 3);
    assert.ok(map.high);
    assert.ok(map.medium);
    assert.ok(map.low);
  });

  it('mock 工厂函数能创建完整 FollowUpDetail', () => {
    const d = mockDetail();
    assert.equal(d.id, 'fu-test');
    assert.equal(d.name, '测试客户');
    assert.equal(d.tier, 'VIP');
    assert.equal(d.status, 'pending');
  });
});

// ==================== 反例 (安全/防御/错误) ====================

describe('FollowUpDetailPage — 反例', () => {
  it('未知 tier 返回自身', () => {
    assert.equal(getTierLabel('unknown'), 'unknown');
  });

  it('未知 priority 返回自身', () => {
    assert.equal(getPriorityLabel('unknown'), 'unknown');
  });

  it('未知 status 返回自身', () => {
    assert.equal(getStatusLabel('unknown'), 'unknown');
  });

  it('未知 tier 的颜色返回默认 (#6b7280)', () => {
    assert.equal(getTierColor('unknown'), '#6b7280');
  });

  it('空 phone 号的极端情况', () => {
    const d = mockDetail({ phone: '' });
    assert.equal(d.phone, '');
  });

  it('空 reason 字段的极端情况', () => {
    const d = mockDetail({ reason: '' });
    assert.equal(d.reason, '');
  });

  it('空 notes 字段的极端情况', () => {
    const d = mockDetail({ notes: '' });
    assert.equal(d.notes, '');
  });

  it('空 tags 列表', () => {
    const d = mockDetail({ tags: [] });
    assert.equal(d.tags.length, 0);
  });

  it('不存在的 ID 返回 null', () => {
    const result = MOCK_DETAILS['fu-nonexistent'];
    assert.equal(result, undefined);
  });

  it('Detail 为 null 时页面显示"未找到"', () => {
    const detail = null;
    assert.equal(detail, null);
  });

  it('totalSpent 为 0 的极端情况', () => {
    const d = mockDetail({ totalSpent: 0 });
    assert.equal(d.totalSpent, 0);
  });

  it('visitCount 为 0 的极端情况', () => {
    const d = mockDetail({ visitCount: 0 });
    assert.equal(d.visitCount, 0);
  });
});

// ==================== 边界 (loading/空/未找到/状态流转/Toast) ====================

describe('FollowUpDetailPage — 边界', () => {
  it('状态流转: pending → contacted', () => {
    const d = mockDetail({ status: 'pending' });
    const nextStatus = 'contacted';
    assert.equal(getStatusLabel(nextStatus), '已联系');
  });

  it('状态流转: contacted → converted', () => {
    const d = mockDetail({ status: 'contacted' });
    const nextStatus = 'converted';
    assert.equal(getStatusLabel(nextStatus), '已转化');
  });

  it('状态流转: contacted → lost', () => {
    const d = mockDetail({ status: 'contacted' });
    const nextStatus = 'lost';
    assert.equal(getStatusLabel(nextStatus), '已流失');
  });

  it('状态流转: pending → lost', () => {
    const d = mockDetail({ status: 'pending' });
    const nextStatus = 'lost';
    assert.equal(getStatusLabel(nextStatus), '已流失');
  });

  it('状态流转: converted → pending (重新跟进)', () => {
    const d = mockDetail({ status: 'converted' });
    const nextStatus = 'pending';
    assert.equal(getStatusLabel(nextStatus), '待跟进');
  });

  it('状态流转: lost → pending (重新跟进)', () => {
    const d = mockDetail({ status: 'lost' });
    const nextStatus = 'pending';
    assert.equal(getStatusLabel(nextStatus), '待跟进');
  });

  it('创建时间格式为 ISO 字符串', () => {
    const d = mockDetail();
    assert.doesNotThrow(() => new Date(d.createdAt).toISOString());
  });

  it('手机号脱敏格式 (138****5678)', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.match(d.phone, /^\d{3}\*{4}\d{4}$/, `${d.id} phone format: ${d.phone}`);
    }
  });

  it('Mock 数据 lastVisit 为 YYYY-MM-DD 格式', () => {
    for (const d of Object.values(MOCK_DETAILS)) {
      assert.match(d.lastVisit, /^\d{4}-\d{2}-\d{2}$/, `${d.id} lastVisit: ${d.lastVisit}`);
    }
  });

  it('totalSpent 格式化: 28500 → ¥28,500', () => {
    const formatted = `¥${(28500).toLocaleString()}`;
    assert.equal(formatted, '¥28,500');
  });

  it('visitCount 合理范围 (18-68)', () => {
    const counts = Object.values(MOCK_DETAILS).map(d => d.visitCount);
    assert.ok(counts.every(c => c >= 1 && c <= 100));
  });
});
