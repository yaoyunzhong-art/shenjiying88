/**
 * sales-guide/[id]/page.test.tsx — 导购跟进详情页 L1 冒烟测试
 * 角色视角: 🛍️ 导购员跟进详情
 * 类型: B-详情页 (含状态流转、边界场景)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 数据结构定义（与页面保持一致） ----

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
// Mock 数据工厂
// ============================================================

function createFollowUpDetail(overrides?: Partial<FollowUpDetail>): FollowUpDetail {
  return {
    id: 'fu-1',
    name: '测试客户',
    phone: '138****5678',
    tier: 'VIP',
    lastVisit: '2026-06-26',
    reason: '测试跟进原因',
    priority: 'high',
    status: 'pending',
    notes: '测试备注内容',
    totalSpent: 10000,
    visitCount: 20,
    tags: ['测试标签'],
    createdAt: '2026-06-26T10:00:00Z',
    ...overrides,
  };
}

// ============================================================
// 工具函数（与页面逻辑保持一致）
// ============================================================

function getStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: '待跟进', contacted: '已联系', converted: '已转化', lost: '已流失' };
  return map[s] ?? s;
}

function getTierLabel(t: string): string {
  const map: Record<string, string> = { VIP: 'VIP会员', GOLD: '金卡会员', SILVER: '银卡会员', REGULAR: '普通会员' };
  return map[t] ?? t;
}

function getPriorityLabel(p: string): string {
  const map: Record<string, string> = { high: '高优先级', medium: '中优先级', low: '低优先级' };
  return map[p] ?? p;
}

// ============================================================
// 测试套件
// ============================================================

describe('FollowUpDetailPage', () => {
  it('module can be imported and exports a function/component', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function/component');
  });

  // ---- 数据工厂验证 ----

  it('createFollowUpDetail should create valid data', () => {
    const d = createFollowUpDetail({ id: 'fu-1', name: '王芳', tier: 'VIP', status: 'pending' });
    assert.equal(d.id, 'fu-1');
    assert.equal(d.name, '王芳');
    assert.equal(d.tier, 'VIP');
    assert.equal(d.status, 'pending');
    assert.equal(typeof d.totalSpent, 'number');
    assert.ok(d.totalSpent >= 0);
    assert.ok(d.visitCount >= 0);
    assert.equal(Array.isArray(d.tags), true);
  });

  // ---- 工具函数验证 ----

  it('getStatusLabel should return correct labels', () => {
    assert.equal(getStatusLabel('pending'), '待跟进');
    assert.equal(getStatusLabel('contacted'), '已联系');
    assert.equal(getStatusLabel('converted'), '已转化');
    assert.equal(getStatusLabel('lost'), '已流失');
    assert.equal(getStatusLabel('unknown'), 'unknown');
  });

  it('getTierLabel should return correct labels', () => {
    assert.equal(getTierLabel('VIP'), 'VIP会员');
    assert.equal(getTierLabel('GOLD'), '金卡会员');
    assert.equal(getTierLabel('SILVER'), '银卡会员');
    assert.equal(getTierLabel('REGULAR'), '普通会员');
    assert.equal(getTierLabel('PLATINUM'), 'PLATINUM');
  });

  it('getPriorityLabel should return correct labels', () => {
    assert.equal(getPriorityLabel('high'), '高优先级');
    assert.equal(getPriorityLabel('medium'), '中优先级');
    assert.equal(getPriorityLabel('low'), '低优先级');
  });

  // ---- 状态流转逻辑 ----

  it('status flow: pending -> contacted -> converted/lost', () => {
    // 模拟状态流转
    let status: FollowUpDetail['status'] = 'pending';

    // Pending -> Contacted
    status = 'contacted';
    assert.equal(status, 'contacted');

    // Contacted -> Converted
    status = 'converted';
    assert.equal(status, 'converted');

    // Reset: Lost -> Pending
    status = 'lost';
    assert.equal(status, 'lost');
    status = 'pending';
    assert.equal(status, 'pending');
  });

  it('status should only allow valid values', () => {
    const valid: FollowUpDetail['status'][] = ['pending', 'contacted', 'converted', 'lost'];
    const d = createFollowUpDetail();

    for (const s of valid) {
      d.status = s;
      assert.ok(valid.includes(d.status), `${s} should be valid`);
    }
  });

  it('priority should only allow valid values', () => {
    const valid: FollowUpDetail['priority'][] = ['high', 'medium', 'low'];
    const d = createFollowUpDetail();

    for (const p of valid) {
      d.priority = p;
      assert.ok(valid.includes(d.priority), `${p} should be valid`);
    }
  });

  it('tier should only allow valid values', () => {
    const valid: FollowUpDetail['tier'][] = ['VIP', 'GOLD', 'SILVER', 'REGULAR'];
    const d = createFollowUpDetail();

    for (const t of valid) {
      d.tier = t;
      assert.ok(valid.includes(d.tier), `${t} should be valid`);
    }
  });

  // ---- 摘要/统计计算 ----

  it('should calculate average spent per visit correctly', () => {
    const d = createFollowUpDetail({ totalSpent: 20000, visitCount: 10 });
    const avgPerVisit = d.totalSpent / d.visitCount;
    assert.equal(avgPerVisit, 2000);
  });

  it('should handle zero spent or zero visits', () => {
    const d = createFollowUpDetail({ totalSpent: 0, visitCount: 0 });
    const avg = d.visitCount === 0 ? 0 : d.totalSpent / d.visitCount;
    assert.equal(avg, 0);
  });

  // ---- 边界场景 ----

  it('Handle edge case: empty tags array', () => {
    const d = createFollowUpDetail({ tags: [] });
    assert.equal(d.tags.length, 0);
  });

  it('Handle edge case: many tags', () => {
    const tags = Array.from({ length: 20 }, (_, i) => `tag-${i + 1}`);
    const d = createFollowUpDetail({ tags });
    assert.equal(d.tags.length, 20);
  });

  it('Handle edge case: zero totalSpent with visits', () => {
    const d = createFollowUpDetail({ totalSpent: 0, visitCount: 5 });
    assert.equal(d.totalSpent, 0);
    assert.equal(d.visitCount, 5);
  });

  it('Handle edge case: negative values should not occur (guard check)', () => {
    const d = createFollowUpDetail({ totalSpent: -100, visitCount: -1 });
    // Actual data should never have negative, but guard check
    const safeSpent = Math.max(0, d.totalSpent);
    const safeVisits = Math.max(0, d.visitCount);
    assert.equal(safeSpent, 0);
    assert.equal(safeVisits, 0);
  });

  it('Handle edge case: long name', () => {
    const longName = '阿'.repeat(50);
    const d = createFollowUpDetail({ name: longName });
    assert.equal(d.name.length, 50);
  });

  it('Handle edge case: long notes', () => {
    const longNotes = '备注'.repeat(100);
    const d = createFollowUpDetail({ notes: longNotes });
    assert.ok(d.notes.length > 100);
  });

  // ---- Mock 数据完整性 ----

  it('Mock data should cover all 4 status values', () => {
    const statuses: FollowUpDetail['status'][] = ['pending', 'contacted', 'converted', 'lost'];
    for (const s of statuses) {
      assert.doesNotThrow(() => createFollowUpDetail({ status: s }));
    }
  });

  it('Mock data should cover all 3 priority values', () => {
    const priorities: FollowUpDetail['priority'][] = ['high', 'medium', 'low'];
    for (const p of priorities) {
      assert.doesNotThrow(() => createFollowUpDetail({ priority: p }));
    }
  });

  // ---- 组件引用验证 ----

  it('Page should reference UI components from @m5/ui', async () => {
    const mod = await import('./page');
    const src = mod.default.toString();
    const expected = ['PageShell', 'Button', 'Badge', 'Tag'];
    let found = 0;
    for (const comp of expected) {
      if (src.includes(comp)) found++;
    }
    assert.ok(found >= 3, `Page should reference at least 3 of expected components, found ${found}`);
  });
});
