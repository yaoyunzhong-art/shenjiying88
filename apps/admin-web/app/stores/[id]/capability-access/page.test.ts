/**
 * stores/[id]/capability-access/page.test.ts — Page-level tests for store capability access page.
 *
 * Coverage:
 *   L1 — buildFallbackCapabilityAccessView 正例（不同 storeId 场景）
 *   L2 — buildCapabilityEntrypoints 入口矩阵构建 / access & readiness 映射
 *   L3 — buildCapabilityActionItems 动作项降级逻辑
 *   L4 — filterCapabilityEntrypoints 筛选范围
 *   L5 — accessMeta / readinessMeta 标签完整性（反例/边界）
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: lyt-capability-access.ts, stores/[id]/capability-access/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  buildFallbackCapabilityAccessView,
  buildCapabilityEntrypoints,
  buildCapabilityActionItems,
  filterCapabilityEntrypoints,
  accessMeta,
  readinessMeta,
} from '../../../lyt-capability-access';
import type { LytStoreCapabilityAccessItem } from '@m5/sdk';

// ============================================================================
// L1 — buildFallbackCapabilityAccessView 正例
// ============================================================================

describe('buildFallbackCapabilityAccessView', () => {
  it('正例: s1 — 标准健康门店，member/payment/device 正常，gate 未启用', () => {
    const view = buildFallbackCapabilityAccessView('s1');

    assert.equal(view.storeId, 's1');
    assert.equal(view.storeName, '门店 s1');
    assert.equal(view.storeCode, 'STORE-001');
    assert.equal(view.connectionStatus, 'configured');
    assert.equal(view.healthStatus, 'healthy');
    assert.equal(view.resolutionLevel, 'store');

    const capabilities = view.accessByCapability.map((c) => c.capability);
    assert.deepStrictEqual(capabilities, ['member', 'payment', 'device', 'gate']);

    const member = view.accessByCapability.find((c) => c.capability === 'member')!;
    assert.equal(member.readiness, 'ready');
    assert.equal(member.access, 'enabled');
    assert.equal(member.reason, '会员能力已具备稳定接入条件');
  });

  it('正例: s2 — 支付连接 stale 门店，payment 应降级', () => {
    const view = buildFallbackCapabilityAccessView('s2');

    assert.equal(view.connectionStatus, 'configured');
    assert.equal(view.healthStatus, 'stale');
    assert.equal(view.resolutionLevel, 'store');

    const payment = view.accessByCapability.find((c) => c.capability === 'payment')!;
    assert.equal(payment.readiness, 'stale');
    assert.equal(payment.access, 'degraded');
    assert.ok(payment.reason.includes('stale'));
  });

  it('正例: s3 — 租户继承门店，payment 为 inherited-ready + degraded，gate 隐藏', () => {
    const view = buildFallbackCapabilityAccessView('s3');

    assert.equal(view.resolutionLevel, 'tenant');

    const payment = view.accessByCapability.find((c) => c.capability === 'payment')!;
    assert.equal(payment.readiness, 'inherited-ready');
    assert.equal(payment.access, 'degraded');

    const gate = view.accessByCapability.find((c) => c.capability === 'gate')!;
    assert.equal(gate.readiness, 'not-enabled');
    assert.equal(gate.access, 'hidden');
  });

  it('正例: s4 — 门禁继承门店，gate 为 inherited-ready + degraded', () => {
    const view = buildFallbackCapabilityAccessView('s4');

    const gate = view.accessByCapability.find((c) => c.capability === 'gate')!;
    assert.equal(gate.readiness, 'inherited-ready');
    assert.equal(gate.access, 'degraded');
    assert.ok(gate.reason.includes('门禁能力来自品牌/租户继承连接'));
  });

  it('正例: s5 — pending-configuration 门店，member 阻塞，推荐动作明确', () => {
    const view = buildFallbackCapabilityAccessView('s5');

    assert.equal(view.connectionStatus, 'pending-configuration');
    assert.equal(view.healthStatus, 'pending-configuration');

    const member = view.accessByCapability.find((c) => c.capability === 'member')!;
    assert.equal(member.readiness, 'pending-configuration');
    assert.equal(member.access, 'blocked');

    assert.ok(view.recommendedNextActions.length > 0);
    assert.ok(view.recommendedNextActions[0].includes('pending-configuration'));
  });

  it('反例: 未知 storeId 应返回合理默认值', () => {
    const view = buildFallbackCapabilityAccessView('unknown-99');

    assert.equal(view.storeId, 'unknown-99');
    assert.equal(view.storeCode, 'STORE-099');
    // 应退化为默认路线（非 pending-configuration 应视为 configured）
    assert.equal(view.connectionStatus, 'configured');
  });

  it('边界: storeId 为空字符串应不崩溃', () => {
    // 传 '' 时 replace(/\D/g,'') 为空，padStart 后为 '001'
    const view = buildFallbackCapabilityAccessView('');

    assert.equal(view.storeId, '');
    assert.equal(view.storeCode, 'STORE-001');
  });

  it('边界: storeId 为纯数字应正常', () => {
    const view = buildFallbackCapabilityAccessView('42');

    assert.equal(view.storeId, '42');
    assert.equal(view.storeCode, 'STORE-042');
    assert.equal(view.healthStatus, 'healthy');
  });
});

// ============================================================================
// L2 — buildCapabilityEntrypoints 入口矩阵构建
// ============================================================================

describe('buildCapabilityEntrypoints', () => {
  it('正例: s1 视图生成 4 个入口，member/device visible，gate hidden', () => {
    const view = buildFallbackCapabilityAccessView('s1');
    const entries = buildCapabilityEntrypoints('s1', view);

    assert.equal(entries.length, 4);

    const memberEntry = entries.find((e) => e.capability === 'member')!;
    assert.equal(memberEntry.visibility, 'visible');
    assert.equal(memberEntry.isNavigable, true);
    assert.equal(memberEntry.actionLabel, '进入入口');
    assert.equal(memberEntry.href, '/members?storeId=s1');

    const gateEntry = entries.find((e) => e.capability === 'gate')!;
    assert.equal(gateEntry.visibility, 'hidden');
    assert.equal(gateEntry.isNavigable, false);
    assert.equal(gateEntry.actionLabel, '等待治理完成');
  });

  it('正例: s5 视图 member 入口 blocked / 不可导航', () => {
    const view = buildFallbackCapabilityAccessView('s5');
    const entries = buildCapabilityEntrypoints('s5', view);

    const memberEntry = entries.find((e) => e.capability === 'member')!;
    assert.equal(memberEntry.access, 'blocked');
    assert.equal(memberEntry.isNavigable, false);
    assert.equal(memberEntry.actionLabel, '等待治理完成');
  });

  it('正例: s4 视图 gate 入口 degraded / 可导航', () => {
    const view = buildFallbackCapabilityAccessView('s4');
    const entries = buildCapabilityEntrypoints('s4', view);

    const gateEntry = entries.find((e) => e.capability === 'gate')!;
    assert.equal(gateEntry.access, 'degraded');
    assert.equal(gateEntry.isNavigable, true);
    assert.equal(gateEntry.actionLabel, '降级进入');
  });

  it('反例: 传入空 accessByCapability 应返回空数组', () => {
    const entries = buildCapabilityEntrypoints('s1', { accessByCapability: [] });

    assert.equal(entries.length, 0);
  });
});

// ============================================================================
// L3 — buildCapabilityActionItems 动作项降级逻辑
// ============================================================================

describe('buildCapabilityActionItems', () => {
  it('正例: blocked 入口 isDisabled 为 true，enabled 为 false', () => {
    const view = buildFallbackCapabilityAccessView('s5');
    const entries = buildCapabilityEntrypoints('s5', view);
    const actions = buildCapabilityActionItems(entries);

    const memberAction = actions.find((a) => a.capability === 'member')!;
    assert.equal(memberAction.isDisabled, true);
    assert.ok(memberAction.hint.includes('阻塞'));

    // s5 中 device 为 hidden，不应禁用（但 isDisabled=false, visibility=hidden）
    const deviceAction = actions.find((a) => a.capability === 'device')!;
    assert.equal(deviceAction.isDisabled, false);
    assert.equal(deviceAction.visibility, 'hidden');
  });

  it('正例: enabled 入口 actionLabel 含"进入"', () => {
    const view = buildFallbackCapabilityAccessView('s1');
    const entries = buildCapabilityEntrypoints('s1', view);
    const actions = buildCapabilityActionItems(entries);

    const memberAction = actions.find((a) => a.capability === 'member')!;
    assert.ok(memberAction.label.includes('进入'));
    assert.equal(memberAction.isDisabled, false);
  });

  it('边界: 空入口列表应返回空动作列表', () => {
    const actions = buildCapabilityActionItems([]);
    assert.equal(actions.length, 0);
  });
});

// ============================================================================
// L4 — filterCapabilityEntrypoints 筛选范围
// ============================================================================

describe('filterCapabilityEntrypoints', () => {
  it('正例: 筛选 member + payment 应返回 2 个入口', () => {
    const view = buildFallbackCapabilityAccessView('s1');
    const entries = buildCapabilityEntrypoints('s1', view);
    const filtered = filterCapabilityEntrypoints(entries, ['member', 'payment']);

    assert.equal(filtered.length, 2);
    assert.deepStrictEqual(
      filtered.map((e) => e.capability),
      ['member', 'payment']
    );
  });

  it('反例: 空筛选列表应返回全部入口', () => {
    const view = buildFallbackCapabilityAccessView('s1');
    const entries = buildCapabilityEntrypoints('s1', view);
    const filtered = filterCapabilityEntrypoints(entries, []);

    assert.equal(filtered.length, entries.length);
  });

  it('反例: 筛选不存在的 capability 应返回空', () => {
    const view = buildFallbackCapabilityAccessView('s1');
    const entries = buildCapabilityEntrypoints('s1', view);
    const filtered = filterCapabilityEntrypoints(entries, ['nonexistent']);

    assert.equal(filtered.length, 0);
  });
});

// ============================================================================
// L5 — accessMeta / readinessMeta 标签完整性
// ============================================================================

describe('accessMeta', () => {
  it('正例: 所有 access 值有对应 label', () => {
    const accessValues: LytStoreCapabilityAccessItem['access'][] = [
      'enabled',
      'degraded',
      'blocked',
      'hidden',
    ];

    for (const access of accessValues) {
      const meta = accessMeta[access];
      assert.ok(meta, `access "${access}" 应在 accessMeta 中有定义`);
      assert.ok(typeof meta.label === 'string' && meta.label.length > 0);
      assert.ok(['success', 'warning', 'danger', 'default'].includes(meta.variant));
    }
  });

  it('反例: 不存在的 access 值访问返回 undefined', () => {
    assert.equal((accessMeta as Record<string, unknown>)['unknown'], undefined);
  });
});

describe('readinessMeta', () => {
  it('正例: 所有 readiness 值有对应 label', () => {
    const readinessValues: LytStoreCapabilityAccessItem['readiness'][] = [
      'ready',
      'inherited-ready',
      'stale',
      'pending-configuration',
      'not-enabled',
    ];

    for (const readiness of readinessValues) {
      const meta = readinessMeta[readiness];
      assert.ok(meta, `readiness "${readiness}" 应在 readinessMeta 中有定义`);
      assert.ok(typeof meta.label === 'string' && meta.label.length > 0);
    }
  });

  it('反例: 不存在的 readiness 值访问返回 undefined', () => {
    assert.equal((readinessMeta as Record<string, unknown>)['unknown-readiness'], undefined);
  });
});
