import assert from 'node:assert/strict';
import test from 'node:test';
import type { FoundationAlertCatalogItem } from '@m5/types';
import { canRenderAdminAlertAcknowledgeAction } from './alerts/alerts-client';

const baseCatalog: FoundationAlertCatalogItem = {
  code: 'approvals-pending',
  defaultSummary: '存在待处理审批单',
  severityPolicy: '待处理审批单数量 >= 5 时为 high，否则为 medium',
  sourceModules: ['trust-governance'],
  drilldownEnabled: true,
  acknowledgementEnabled: true,
  drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
  ackPath: '/foundation/overview/alerts/approvals-pending/ack',
  mutePath: '/foundation/overview/alerts/approvals-pending/mute',
  unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
};

// ---- 正例 ----

test('admin alerts client: renders acknowledge action when fallback catalog is open and ack-enabled', () => {
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, 'open'), true);
});

test('admin alerts client: hides acknowledge action when page is in readonly fallback mode', () => {
  assert.equal(canRenderAdminAlertAcknowledgeAction('fallback', baseCatalog, 'open'), false);
});

test('admin alerts client: hides acknowledge action when alert is already acknowledged', () => {
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, 'acknowledged'), false);
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, 'muted'), false);
});

test('admin alerts client: honors explicit ACK action when availableActions are returned', () => {
  assert.equal(
    canRenderAdminAlertAcknowledgeAction(
      'api',
      {
        ...baseCatalog,
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
      },
      'acknowledged'
    ),
    true
  );
});

// ---- 反例 ----

test('admin alerts client: hides acknowledge action when catalog is undefined (loading / error)', () => {
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', undefined, 'open'), false);
  assert.equal(canRenderAdminAlertAcknowledgeAction('fallback', undefined, 'open'), false);
});

test('admin alerts client: returns false for unknown/empty delivery mode', () => {
  // @ts-expect-error — testing defensive behavior for unexpected deliveryMode
  assert.equal(canRenderAdminAlertAcknowledgeAction(null, baseCatalog, 'open'), false);
  // @ts-expect-error — testing defensive behavior for unexpected deliveryMode
  assert.equal(canRenderAdminAlertAcknowledgeAction(undefined, baseCatalog, 'open'), false);
});

test('admin alerts client: ignores catalog when ACK is NOT in availableActions and alert is already done', () => {
  const catalogWithOnlyDrilldown: FoundationAlertCatalogItem = {
    ...baseCatalog,
    availableActions: ['DRILLDOWN'],
    acknowledgementEnabled: false,
  };
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', catalogWithOnlyDrilldown, 'open'), false);
});

test('admin alerts client: hides acknowledge action for resolved/closed alert status', () => {
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, 'resolved'), false);
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, 'closed'), false);
});

// ---- 边界 ----

test('admin alerts client: open status is the only actionable default status', () => {
  // open 是唯一默认可操作的状态（当 acknowledgementEnabled=true 时）
  const actionableStatuses = ['open'];
  const nonActionableStatuses = ['acknowledged', 'muted', 'resolved', 'closed', 'unknown'];
  for (const status of actionableStatuses) {
    assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, status), true, `状态 ${status} 应可操作`);
  }
  for (const status of nonActionableStatuses) {
    assert.equal(canRenderAdminAlertAcknowledgeAction('api', baseCatalog, status), false, `状态 ${status} 不应可操作`);
  }
});

test('admin alerts client: availableActions with single action DRILLDOWN only hides ACK', () => {
  const catalogWithDrilldown: FoundationAlertCatalogItem = {
    ...baseCatalog,
    availableActions: ['DRILLDOWN'],
  };
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', catalogWithDrilldown, 'open'), false);
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', catalogWithDrilldown, 'acknowledged'), false);
});

test('admin alerts client: empty availableActions falls through to acknowledgementEnabled', () => {
  const catalogEmptyActions: FoundationAlertCatalogItem = {
    ...baseCatalog,
    availableActions: [],
  };
  // acknowledgementEnabled=true + open => true
  assert.equal(canRenderAdminAlertAcknowledgeAction('api', catalogEmptyActions, 'open'), true);
});
