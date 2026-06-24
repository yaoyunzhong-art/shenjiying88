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
