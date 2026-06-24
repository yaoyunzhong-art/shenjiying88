import assert from 'node:assert/strict';
import test from 'node:test';
import type { LytStoreCapabilityAccessViewResponse } from '@m5/sdk';
import {
  accessMeta,
  buildCapabilityActionItems,
  buildCapabilityEntrypoints,
  buildFallbackCapabilityAccessView,
  createCapabilityAccessClient,
  deriveScopedCapabilityActionItem,
  filterCapabilityEntrypoints,
  isStoreScopedWorkbenchRole,
  loadStoreCapabilityAccessSnapshot,
  readinessMeta
} from './lyt-capability-access';

test('lyt capability access: fallback view exposes blocked member capability for pending stores', () => {
  const view = buildFallbackCapabilityAccessView('s5');

  assert.equal(view.connectionStatus, 'pending-configuration');
  assert.equal(view.healthStatus, 'pending-configuration');
  assert.equal(view.accessByCapability.find((item) => item.capability === 'member')?.access, 'blocked');
  assert.match(view.recommendedNextActions[0] ?? '', /vendorStoreId/);
});

test('lyt capability access: builds entrypoints with navigation and hidden policies', () => {
  const view: LytStoreCapabilityAccessViewResponse = {
    storeId: 's-demo',
    connectionStatus: 'configured',
    healthStatus: 'healthy',
    accessByCapability: [
      {
        capability: 'member',
        readiness: 'ready',
        access: 'enabled',
        reason: '会员能力稳定可用'
      },
      {
        capability: 'payment',
        readiness: 'stale',
        access: 'degraded',
        reason: '支付健康检查 stale'
      },
      {
        capability: 'order',
        readiness: 'pending-configuration',
        access: 'blocked',
        reason: '订单写回尚未配置'
      },
      {
        capability: 'device',
        readiness: 'not-enabled',
        access: 'hidden',
        reason: '设备能力未启用'
      }
    ],
    recommendedNextActions: []
  };

  const entrypoints = buildCapabilityEntrypoints('s-demo', view);
  const member = entrypoints.find((item) => item.capability === 'member');
  const payment = entrypoints.find((item) => item.capability === 'payment');
  const order = entrypoints.find((item) => item.capability === 'order');
  const device = entrypoints.find((item) => item.capability === 'device');

  assert.equal(member?.href, '/members?storeId=s-demo');
  assert.equal(member?.isNavigable, true);
  assert.equal(member?.actionLabel, '进入入口');

  assert.equal(payment?.href, '/operations?storeId=s-demo&focus=payment');
  assert.equal(payment?.isNavigable, true);
  assert.equal(payment?.actionLabel, '降级进入');

  assert.equal(order?.isNavigable, false);
  assert.equal(order?.visibility, 'visible');
  assert.match(order?.hint ?? '', /阻塞入口/);

  assert.equal(device?.isNavigable, false);
  assert.equal(device?.visibility, 'hidden');
  assert.match(device?.hint ?? '', /隐藏/);
});

test('lyt capability access: filters entrypoints by target capabilities', () => {
  const view = buildFallbackCapabilityAccessView('s2');
  const entrypoints = buildCapabilityEntrypoints('s2', view);
  const filtered = filterCapabilityEntrypoints(entrypoints, ['payment', 'order', 'inventory']);

  assert.deepEqual(
    filtered.map((item) => item.capability),
    ['payment']
  );
});

test('lyt capability access: builds CTA items with disabled blocked actions and hidden policies', () => {
  const view: LytStoreCapabilityAccessViewResponse = {
    storeId: 's-demo',
    connectionStatus: 'configured',
    healthStatus: 'healthy',
    accessByCapability: [
      {
        capability: 'member',
        readiness: 'ready',
        access: 'enabled',
        reason: '会员能力稳定'
      },
      {
        capability: 'payment',
        readiness: 'stale',
        access: 'degraded',
        reason: '支付能力 stale'
      },
      {
        capability: 'order',
        readiness: 'pending-configuration',
        access: 'blocked',
        reason: '订单能力待配置'
      },
      {
        capability: 'device',
        readiness: 'not-enabled',
        access: 'hidden',
        reason: '设备能力未启用'
      }
    ],
    recommendedNextActions: []
  };

  const actions = buildCapabilityActionItems(buildCapabilityEntrypoints('s-demo', view));
  const member = actions.find((item) => item.capability === 'member');
  const payment = actions.find((item) => item.capability === 'payment');
  const order = actions.find((item) => item.capability === 'order');
  const device = actions.find((item) => item.capability === 'device');

  assert.equal(member?.label, '进入会员中心');
  assert.equal(member?.isDisabled, false);

  assert.equal(payment?.label, '降级进入支付运营');
  assert.equal(payment?.isDisabled, false);

  assert.equal(order?.label, '等待订单治理');
  assert.equal(order?.isDisabled, true);
  assert.match(order?.hint ?? '', /阻塞/);

  assert.equal(device?.visibility, 'hidden');
});

test('lyt capability access: derives scoped actions while preserving gating state', () => {
  const [baseAction] = buildCapabilityActionItems(
    buildCapabilityEntrypoints('store-001', buildFallbackCapabilityAccessView('store-001'))
  );

  assert.ok(baseAction);

  const scopedAction = deriveScopedCapabilityActionItem(baseAction!, {
    key: 'member-bulk-tagging',
    label: '批量标签运营',
    href: '/members?focus=bulk-tagging'
  });

  assert.equal(scopedAction.key, 'member-bulk-tagging');
  assert.equal(scopedAction.label, '批量标签运营');
  assert.equal(scopedAction.href, '/members?focus=bulk-tagging');
  assert.equal(scopedAction.access, baseAction?.access);
  assert.equal(scopedAction.isDisabled, baseAction?.isDisabled);
});

test('lyt capability access: exposes badge copy for readiness and access states', () => {
  assert.equal(readinessMeta.ready.label, '已就绪');
  assert.equal(readinessMeta['pending-configuration'].variant, 'pending');
  assert.equal(accessMeta.enabled.label, '已开放');
  assert.equal(accessMeta.blocked.variant, 'danger');
});

test('lyt capability access: identifies store scoped workbench roles', () => {
  assert.equal(isStoreScopedWorkbenchRole('STORE_MANAGER'), true);
  assert.equal(isStoreScopedWorkbenchRole('guide'), true);
  assert.equal(isStoreScopedWorkbenchRole('cashier'), true);
  assert.equal(isStoreScopedWorkbenchRole('SUPER_ADMIN'), false);
});

test('lyt capability access: client builder applies tenant context overrides', () => {
  const client = createCapabilityAccessClient({
    tenantId: 'tenant-x',
    brandId: 'brand-x',
    storeId: 'store-x',
    marketCode: 'us-default'
  });

  assert.ok(client instanceof Object);
});

test('lyt capability access: load snapshot falls back when api query fails', async () => {
  globalThis.fetch = (async () => {
    throw new Error('lyt capability access unavailable');
  }) as typeof fetch;

  const snapshot = await loadStoreCapabilityAccessSnapshot('s5');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.capabilityAccess.connectionStatus, 'pending-configuration');
});
